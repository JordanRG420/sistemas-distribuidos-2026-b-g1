# ADR-010 — Sales Domain on MongoDB

| Field | Value |
|-------|-------|
| **ID** | ADR-010 |
| **Date** | 2026-10-03 |
| **Status** | Accepted |
| **Authors** | Jordan Ramirez Gallego |
| **Reviewers** | Angel Gustavo Solano Trujillo — Tech Lead, Sergio Andrés Ordóñez Díaz, Fredman Santiago Plazas Artunduaga — Development team |
| **Modifies** | ADR-005 Decision 2 (Flyway for all four domains), Decision 3 (relational conventions) and Decision 4 (`idempotency_key` table): Sales only. ADR-008, version table, "Databases and migrations" row. ADR-009 (`sales_schema` in the shared instance; the repository name `synkro-infra`) |
| **Traced to** | HU-ARQ-23 |

---

## Context

ADR-009 placed the four domains in one PostgreSQL instance per environment, one schema per domain, and ADR-005 fixed Flyway and the relational conventions for all of them. `01-context/overview.md` ruled out MongoDB because the system's entities have a stable structure.

That premise changed. The course architecture requires two database engines, PostgreSQL and MongoDB, each with its own infrastructure repository, and at least one domain using MongoDB. No `-db` has been built yet, so today the change costs only documentation.

If this is not decided now, `synkro-sales-db` and `synkro-sales-api` would be built on PostgreSQL and would have to be rebuilt, and the system would not meet the required composition.

**Constraints:**
- ADR-005, ADR-008 and ADR-009 are immutable; this ADR replaces sections without editing them.
- At least one domain uses MongoDB, and its instance lives in an infrastructure repository of its own.
- With MongoDB, the course's migration tool is Liquibase with its extension.
- Contracts in `07-api/contracts/openapi/` do not change their paths, status codes or response fields: a consumer must not notice the engine.
- Auth keeps PostgreSQL: a user must never exist without their role and their tokens (`06-data/models.md`, `auth` domain).
- ADR-002 does not change: reports stay live aggregations and `created_by` keeps its meaning. ADR-005 Decision 5 does not change: `sales_summary` is not created.

Decision 6 below is accepted, but its execution depends on the instructor: [code-corhuila/synkro-docs#159](https://github.com/code-corhuila/synkro-docs/issues/159) requests both the rename of `synkro-infra` to `synkro-infra-postgres` and the creation of `synkro-infra-mongo`.

---

## Decision 1 — Which domain uses MongoDB

### Options

**Option A — Sales.** The sale and its lines are stored as one document.
- **Pros:** a sale is already an aggregate written once and read whole; no other domain references it (`09-microservices/data-ownership-matrix.md`); reports aggregate a single collection; it is the saga's last step, so it does not block Customers or Products.
- **Cons:** reports move from SQL to aggregation pipelines, which the team must learn.

**Option B — Customers.** A `customer` collection.
- **Pros:** a single flat aggregate; the least implementation effort.
- **Cons:** a customer is a flat row with identity-document uniqueness: the document model adds nothing over a table; the domain is built first, so the second engine would sit on the critical path.

**Option C — Products.** Catalog, stock and reservations as documents.
- **Pros:** a catalog allows variable attributes.
- **Cons:** reserving several stock lines atomically requires multi-document transactions; today it is guaranteed by one transaction and a `CHECK` (`06-data/models.md`).

### Decision

**We decided: Option A.** Sales is the domain that uses MongoDB. Auth, Customers, Products and the saga store (`workflow_schema`) stay in the shared PostgreSQL instance (ADR-009).

### Dominant criterion

**Fit between the aggregate and the storage model.** A sale is written once, with all its lines, and always read whole; a document stores it the way the domain defines it.

### Accepted cost

- The team operates two engines and learns aggregation pipelines for three reports.
- The "Database: PostgreSQL vs. MongoDB" section of `01-context/overview.md` is no longer valid for Sales and must be rewritten.

---

## Decision 2 — Document model

### Options

**Option A — One `sale` collection with embedded lines.**
- **Pros:** one atomic write per sale; one read returns the whole sale; no cross-collection integrity to maintain.
- **Cons:** every embedded array needs a maximum; arithmetic rules between fields are not checked by the engine.

**Option B — Two collections, `sale` and `sale_detail`, related by identifier.**
- **Pros:** resembles the current model; no line limit.
- **Cons:** copies the relational structure onto an engine with no foreign keys; registering a sale requires a multi-document transaction; every read needs two queries.

### Decision

**We decided: Option A.** The `sales` database has a `sale` collection. Each document:

| Field | Type | Rule |
|---|---|---|
| `_id` | string (canonical UUID) | The contract's `saleId` |
| `customerId` | string (UUID) | External reference to Customers, not checked by the engine |
| `createdBy` | string (UUID) | Salesperson's `sub` (ADR-002, ADR-006) |
| `date` | date (UTC) | When the sale was recorded |
| `totalCents` | long | Sum of `subtotalCents`; `>= 0` |
| `active` | bool | Soft delete; the document is never removed |
| `idempotencyKey` | string, 8 to 128 characters | See Decision 3 |
| `details` | array, 1 to 100 elements | The sale's lines |
| `details[].detailId` | string (UUID) | Line identifier |
| `details[].productId` | string (UUID) | External reference to Products |
| `details[].quantity` | int | `>= 1` |
| `details[].unitPriceCents` | long | `>= 1`; price frozen by the reservation (ADR-007) |
| `details[].subtotalCents` | long | `quantity * unitPriceCents` |
| `details[].active` | bool | Soft delete of the line |

- The structure lives in a `$jsonSchema` validator with `additionalProperties: false`, level `strict` and action `error`: an undeclared field, a different type or an out-of-range array is rejected.
- Field names are camelCase, the same as the contract.
- Money is `long` in minor units; never `double`.
- **Maximum of 100 lines per sale.** `synkro-workflow` rejects a request with more lines with `400 VALIDATION_ERROR` before running any step, and `synkro-sales-api` applies the same limit.
- Indexes, each serving one contract query:

| Index | Fields | Query it serves |
|---|---|---|
| `idx_sale_date` | `date` descending | List and reports, newest first |
| `idx_sale_created_by_date` | `createdBy`, `date` descending | A salesperson's own sales and own reports |
| `idx_sale_customer_id_date` | `customerId`, `date` descending | Sale list filtered by customer |
| `uq_sale_idempotency_key` | `idempotencyKey`, unique | Decision 3 |

- `subtotalCents = quantity * unitPriceCents` and `totalCents = sum of subtotals` are guaranteed by the domain of `synkro-sales-api`, with its tests; the validator only checks types and ranges.

### Dominant criterion

**A sale is registered in one atomic write**, with no transactions between documents.

### Accepted cost

- The two arithmetic rules are no longer protected by the engine (previously `CHECK`): only the domain protects them now.
- A sale cannot have more than 100 lines.
- Identifiers take 36 characters instead of 16 bytes.
- Adding a field (discounts or payment method, `15-project-control/open-questions.md` Q-001 and Q-002) requires a changeset that updates the validator.

---

## Decision 3 — Idempotency of sale registration

### Options

**Option A — The key is a field of the sale, with a unique index.**
- **Pros:** the sale and its key are written in the same atomic operation; no extra collection.
- **Cons:** the key stays inside the business document.

**Option B — A separate `idempotency_key` collection, as in the relational domains.**
- **Pros:** same shape as ADR-005 Decision 4.
- **Cons:** requires a multi-document transaction so the sale and its key are never written apart.

### Decision

**We decided: Option A.** `synkro-sales-api` inserts the sale with its `idempotencyKey` (`<sagaId>:register-sale`, ADR-007). If the `uq_sale_idempotency_key` index rejects the insert, the service reads the sale that already holds that key and answers `200` with it; it does not create a second one.

### Dominant criterion

**A retried registration never produces a second sale**, even if the process crashes mid-operation: there is no moment where the sale is written and its key is not.

### Accepted cost

- Sales resolves idempotency differently from the other three domains; `06-data/models.md` must document both.

---

## Decision 4 — Reports

### Options

**Option A — Live aggregation pipelines over `sale`.**
- **Pros:** the report always matches the sales; nothing to synchronize; keeps ADR-002.
- **Cons:** every query scans the sales of the requested range.

**Option B — A summary collection, updated on each sale or by a scheduled job.**
- **Pros:** faster reads at high volume.
- **Cons:** a second piece of data that can drift; reopens what ADR-005 Decision 5 closed.

### Decision

**We decided: Option A.** The contract's three reports are pipelines over `sale`:

| Report | Stages |
|---|---|
| Daily and monthly | Filter `active`, the `from`/`to` range and, for `SALESPERSON`, `createdBy`; group by day or month in UTC; sum `totalCents` and count sales; sort newest to oldest; paginate |
| Best-selling products | Same filter; unwind the lines; keep active lines; group by `productId`; sum `quantity` and `subtotalCents`; sort by quantity descending; paginate |

- The filter always runs as the first stage, so it uses `idx_sale_date` or `idx_sale_created_by_date`.
- The total item count for `meta` is computed in the same pipeline.
- The own-sales rule is applied by the server in the filter, never by the portal.

### Dominant criterion

**A report cannot contradict the sales it summarizes.**

### Accepted cost

- If volume degrades the reports, materialization is designed from scratch with a new ADR.

---

## Decision 5 — Migrations of `synkro-sales-db`

### Options

**Option A — Liquibase with its MongoDB extension.**
- **Pros:** records what was applied; every change declares its inverse; it is the tool the course fixes for this engine.
- **Cons:** a second migration tool in the system; the runner's image needs the extension and the driver installed.

**Option B — Versioned scripts run with the engine's client and a custom history collection.**
- **Pros:** no additional tool.
- **Cons:** the team reimplements version control, locking and rollback; it does not meet the course's constraint.

### Decision

**We decided: Option A.** `synkro-sales-db`:

- `changelog/changelog-master.yaml` is the only entry point.
- `01_ddl/` creates the collection with its validator and indexes; `02_dml/` holds idempotent seeds; `03_dcl/` creates the roles `sales_reader` (read) and `sales_writer` (read, insert and update; no delete), without a password, and grants `sales_writer` to the user `sales_app`.
- It has no foreign-key folder, no transaction-control folder and no mirrored rollback files: each changeset declares its inverse operation inline and is idempotent on its own.
- `deploy/` holds only the runner (a pinned-version Liquibase image, the extension and the driver) and never starts with the platform. It does not define the instance or a volume.
- Liquibase's history lives in the `sales` database.
- The CI check applies everything from an empty database, applies again with zero changes, rolls everything back and applies again; it also confirms the validator accepts a valid document and rejects one with an undeclared field, an out-of-range value and more than 100 lines.

### Dominant criterion

**Sales' schema is rebuilt, reviewed and reverted from its own repository**, like the relational domains.

### Accepted cost

- Two migration tools: Flyway for Auth, Customers, Products and the saga; Liquibase for Sales.

---

## Decision 6 — Where the MongoDB instance lives, and infrastructure repository naming

### Options

**Option A — A new repository `synkro-infra-mongo`; `synkro-infra` keeps its name and the root composition.**
- **Pros:** no rename of an existing repository.
- **Cons:** `synkro-infra` no longer says which engine it holds; does not match the naming the course architecture requires for infrastructure repositories (two engines, two repository names).

**Option B — Rename `synkro-infra` to `synkro-infra-postgres` and create `synkro-infra-mongo`.**
- **Pros:** infrastructure is two repositories, one per engine, each owning the container and the volume of its engine while its sibling `-db` repositories hold only the code that feeds it; the root composition stays in `synkro-infra-postgres`; this is the naming and structure the course requires.
- **Cons:** a rename that must be done by the instructor, and every document that names `synkro-infra` must be corrected to `synkro-infra-postgres`.

### Decision

**We decided: Option B.**

- `synkro-infra-postgres` (renamed from `synkro-infra`) defines the PostgreSQL instance, its bootstrap, the per-environment variable files and the **root composition** that includes every other repository's `deploy/compose.yml`.
- `synkro-infra-mongo` defines the MongoDB instance: pinned-version image, **single-node replica set**, a volume, a health check, a bootstrap script that creates the `sales_app` user, and a per-environment variable file with the same convention as `synkro-infra-postgres`.
- One instance per environment (`develop`, `qa`, `main`). Inside it, one database per domain: today only `sales`.
- `synkro-infra-postgres` includes the composition of `synkro-infra-mongo` and stays the only place from which the whole system is started.
- `synkro-sales-api` connects as `sales_app` to `mongodb://synkro-mongo:27017/sales?replicaSet=rs0`, by service name on the internal network; the instance does not publish ports to the host.
- No other service holds credentials for the MongoDB instance.
- The rename of `synkro-infra` to `synkro-infra-postgres` and the creation of `synkro-infra-mongo` are both requested from the instructor in one issue in `synkro-docs`, since the rename is an exception the instructor performs; the team does not rename the repository itself.

### Dominant criterion

**Infrastructure repository names match the engine each one governs**, with one repository per engine and the root composition kept in the PostgreSQL one.

### Accepted cost

- Every document, script and composition file that names `synkro-infra` must be updated to `synkro-infra-postgres` once the instructor applies the rename; until then, the system keeps running under the old name and the new one is used only in documentation that is not yet executable.
- One more container and one more volume per environment.

---

## Consequences

**What changes in the system:**
- `synkro-infra` is renamed to `synkro-infra-postgres` by the instructor; every reference to `synkro-infra` across `synkro-docs` is updated to `synkro-infra-postgres` as part of this delivery's documentation work.
- The PostgreSQL instance goes from five schemas to four: `auth_schema`, `customers_schema`, `products_schema` and `workflow_schema`.
- A MongoDB instance appears per environment, with the `sales` database, defined by the new repository `synkro-infra-mongo`.
- `synkro-sales-db` uses Liquibase; `synkro-sales-api` changes only its persistence adapter and the line-limit validation. Its domain, its use cases and its HTTP adapter do not depend on the engine.
- The Sales and workflow contracts add the 100-line maximum to their requests and correct descriptions that name `CHECK` constraints. No path, status code or response field changes.
- The saga does not change: its three steps, its compensations and its idempotency keys stay the same (ADR-007).

**What must be watched:**
- Report duration as sales grow: the signal to reopen Decision 4.
- Q-001 and Q-002 must be answered before the validator's first changeset.
- The validator must stay `strict` and `error`; relaxing it to warning lets invalid documents through.
- Until `synkro-infra-postgres` and `synkro-infra-mongo` exist with those exact names, `synkro-sales-db` and the persistence adapter of `synkro-sales-api` cannot be integrated; the service is developed against its in-memory repository in the meantime.
- Until the instructor applies the rename, any document, script or pull request that still says `synkro-infra` for the PostgreSQL repository is not wrong — it is describing the current, not-yet-renamed state — but must be corrected once the rename lands.

---

## Affected documents

| Document | Required change |
|----------|-----------------|
| `06-data/models.md`, `06-data/data-dictionary.md` | Sales as a collection: validator, indexes, roles and idempotency; every mention of `synkro-infra` → `synkro-infra-postgres` (HU-DOCS-80) |
| `02-domain/entities-and-rules.md`, `09-microservices/data-ownership-matrix.md`, `01-context/glossary.md` | Lines as part of the aggregate; Sale's storage; new terms (HU-DOCS-80) |
| `07-api/contracts/openapi/synkro-sales-api.yaml`, `synkro-workflow.yaml` | `maxItems: 100` on the request lines; descriptions naming `CHECK` or tables (HU-DOCS-80) |
| `05-architecture/deployment.md`, `05-architecture/cross-cutting.md`, `10-devops/` | Second instance, Liquibase runner, `synkro-sales-api` variables, health check; every `synkro-infra` → `synkro-infra-postgres` (HU-DOCS-81) |
| `05-architecture/overview.md`, `01-context/overview.md`, `01-context/scope.md` | Two engines; database-comparison conclusion; repository name (HU-DOCS-82) |
| `09-microservices/service-catalog.md`, `09-microservices/dependency-map.md`, `_stacks/` | Sales' database, `synkro-infra-mongo` row, `synkro-infra` row renamed, MongoDB driver in `synkro-sales-api` (HU-DOCS-82) |
| `08-uml/diagrams/source/c4-02-containers.drawio`, `08-uml/diagram-index.md` | Second database container; Sales data diagram (HU-DOCS-82) |
| `00-governance/security-policy.md`, `00-governance/security-rules.md`, `05-architecture/security-threat-model.md`, `04-requirements/non-functional.md` | Per-engine credentials and isolation; document-query injection; NFR-003, NFR-004, NFR-007, NFR-009 (HU-DOCS-83) |
| `11-quality/testing-strategy.md` | Integration against MongoDB; `-db` check with Liquibase (HU-DOCS-84) |
| `15-project-control/` | Q-001 and Q-002; risks of the second engine and of the pending rename; dependency on the instructor for both the rename and `synkro-infra-mongo` (HU-DOCS-88) |
| `05-architecture/decisions/README.md` | ADR-010 row; ADR-001, ADR-005, ADR-008 and ADR-009 marked as modified (this PR) |
| ADR-001, ADR-002, ADR-005, ADR-008, ADR-009 | **Unchanged**: immutable |

---

## Immutability rule

Once `Accepted`, this ADR is not edited. Any change is a new ADR that names this one, and the sections it replaces, in its **Modifies** field.

---

## References

- Migrations, relational conventions, idempotency keys and `sales_summary` → `05-architecture/decisions/records/ADR-005-data-isolation-per-domain.md`
- Shared instance with one schema per domain → `05-architecture/decisions/records/ADR-009-shared-instance-schema-per-domain.md`
- Sale authorship and report aggregation → `05-architecture/decisions/records/ADR-002-sale-authorship-traceability.md`
- Sale registration saga and frozen prices → `05-architecture/decisions/records/ADR-007-persistent-saga-and-scheduled-work.md`
- Stack versions → `05-architecture/decisions/records/ADR-008-cross-cutting-stack.md`
- Sales contract → `07-api/contracts/openapi/synkro-sales-api.yaml`
- Current data model → `06-data/models.md`
- Entity ownership → `09-microservices/data-ownership-matrix.md`
