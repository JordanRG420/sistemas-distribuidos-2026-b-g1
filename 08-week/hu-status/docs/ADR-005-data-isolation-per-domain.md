# ADR-005 — Data Isolation and Data Model per Domain

| Field | Value |
|-------|-------|
| **ID** | ADR-005 |
| **Date** | 2026-09-26 |
| **Status** | Accepted |
| **Authors** | Jordan Ramirez Gallego |
| **Reviewers** | Angel Gustavo Solano Trujillo — Tech Lead, Sergio Andrés Ordóñez Díaz, Fredman Santiago Plazas Artunduaga — Development team |
| **Modifies** | ADR-001 §2 (Database: One Instance, One Schema per Service); ADR-001 §7 (Data Model per Schema — table names and money types); ADR-002 "Resolution of `sales_summary`" |

---

## Context

ADR-001 §2 placed the four domains in **one PostgreSQL instance** (`synkrotech_db`) with one schema per service, isolated by database users and `GRANT` permissions. It rejected one instance per service because, at the time, the system had a single database repository.

That premise no longer holds, and the current model has four problems:

1. **Each domain now has its own database repository**: `synkro-auth-db`, `synkro-customers-db`, `synkro-products-db` and `synkro-sales-db`. A single shared instance leaves those repositories without a clear owner of the engine they describe.
2. **All domains share one point of failure.** If the instance stops, is misconfigured or runs out of connections, the four domains go down together. Isolation also depends on every `GRANT` being right: one wrong permission lets a service read another domain's data, and nothing in the deployment prevents it.
3. **Migrations are split between two places.** `05-architecture/deployment.md` §3 has each service create its own tables at startup (Flyway for Java, golang-migrate for Go), while `09-microservices/service-catalog.md` assigns migrations to the `-db` repositories. A schema that lives inside a service cannot be rebuilt or reviewed on its own, and two migration tools mean two sets of conventions.
4. **Money is stored as `NUMERIC(12,2)`** in `06-data/models.md` and as `decimal` in the contracts. Client code that handles these values as floating-point numbers rounds amounts.

The automated review of PR #56 also flagged the shared instance with schemas as not being a database per domain.

**Constraints:**
- ADR-001 and ADR-002 are immutable; this ADR replaces sections of them without editing them.
- The team already knows PostgreSQL, and the four domains keep it (the relational fit argued in `01-context/overview.md` still holds).
- Local development runs on Docker Compose, on the team members' machines.

---

## Decision 1 — One database instance per domain

### Options

**Option A — One instance, one schema per domain (current).** Keeps ADR-001 §2 as it is.
- **Pros:** one container; one backup; nothing to change.
- **Cons:** a shared point of failure; isolation depends on correct `GRANT`s; the four `-db` repositories would share an engine none of them owns.

**Option B — One instance, one database per domain.** Four `CREATE DATABASE` in the same PostgreSQL process.
- **Pros:** stronger isolation than schemas (no cross-database queries without extensions); still one container.
- **Cons:** still one process, one volume and one point of failure; the instance still belongs to no domain repository.

**Option C — One instance per domain.** Each domain has its own PostgreSQL instance and volume.
- **Pros:** no shared point of failure; isolation comes from the deployment, not from permissions; each `-db` repository owns its engine completely.
- **Cons:** four containers; four credential sets; more memory on development machines.

### Decision

**We decided: Option C.** Each domain has its own PostgreSQL instance, with its own volume and health check, defined in `deploy/compose.yml` of its `synkro-<domain>-db` repository. The database and its schema are named after the domain (`auth`, `customers`, `products`, `sales`), and nothing lives in `public`.

- `synkro-infra` **composes** the four instances; it does not define them.
- A service connects only to the instance of its own domain, by service name on the internal network. No service holds a connection string to another domain's database.
- An identifier from another domain (for example `customer_id` in `sale`) is stored as a UUID **without** a foreign key, and it is verified through that domain's API.

### Dominant criterion

**No shared point of failure and no possible cross-domain dependency at the database level.** With separate instances, a service cannot read another domain's data even through a wrong permission, and one domain's database can fail without taking the others down.

### Accepted cost

- Four database containers instead of one, which uses more memory on development machines.
- Four credential sets to manage, one per domain.
- Four backups instead of one when environments beyond local exist.

---

## Decision 2 — Migrations owned by each `-db` repository, with Flyway

### Options

**Option A — Each service migrates its own tables at startup (current `deployment.md` §3).**
- **Pros:** the service and its tables deploy together.
- **Cons:** the schema lives inside the service repository; it cannot be rebuilt or reviewed without the service; two tools (Flyway and golang-migrate) with different conventions.

**Option B — Migrations in each `-db` repository, with Liquibase.**
- **Pros:** reverts changes by itself; each changeset can be labeled with its HU.
- **Cons:** a `changelog.yaml` per folder plus a master changelog; more ceremony to review.

**Option C — Migrations in each `-db` repository, with Flyway.**
- **Pros:** one file per change, ordered by one version number; the team already planned Flyway for the Java services; the migration runner is a container, so it works the same for Java and Go domains.
- **Cons:** Flyway Community does not revert, so each rollback is a hand-written script.

### Decision

**We decided: Option C, Flyway in the four domains.** Each `synkro-<domain>-db` repository is the only place where its schema lives:

- Migrations are organized by statement family, in execution order: `01_ddl/`, `02_dml/`, `03_dcl/`, `04_tcl/`. Each `V<n>__<description>.sql` has its mirror `U<n>__<description>.sql` in `05_rollbacks/`, under the same family path.
- One version sequence per repository (`V001`, `V002`, …), with zero padding. The version, not the folder, decides the order.
- `flyway.toml` lists the four family folders, validates migration names and disables `clean`. It holds no connection data: Flyway reads `FLYWAY_URL`, `FLYWAY_USER` and `FLYWAY_PASSWORD` from the environment. `05_rollbacks/` is never listed, so Flyway never runs it on its own.
- The same `deploy/compose.yml` declares a migration runner (`flyway/flyway` with a fixed version) that does not start with the platform, waits for its database to be healthy and mounts the repository read-only. Migrating is a deliberate action.
- Each repository runs a rebuild check in CI on every PR: migrate an empty database, migrate again with no pending changes, apply every `U` script from the highest version down and confirm the schema is gone, then migrate again.
- An applied migration is never edited; a correction is a new migration. A change that would break the deployed service (renaming or dropping a column, changing its type) is split into two releases: expand first, contract later. An index on a table that already holds data is created `CONCURRENTLY`, in its own migration.

Services no longer run migrations. A migration is applied **before** deploying the service version that needs it.

### Dominant criterion

**Each schema can be rebuilt, reviewed and reverted on its own**, from its repository alone, with one tool and one set of conventions for the four domains.

### Accepted cost

- Every rollback is a hand-written `U` script that must be kept in step with its `V` script and is proven only by the CI rebuild check.
- Deploying a schema change becomes a separate step that must happen before the service deploy.

---

## Decision 3 — Schema conventions and money in minor units

### Options

**Option A — Keep the conventions of `06-data/models.md`.** Plural table names, `VARCHAR(n)`, `NUMERIC(12,2)` for money, index names only.
- **Pros:** no rewrite of the data model.
- **Cons:** money can be rounded by clients; constraints without explicit names cannot be referenced by later migrations; length limits are hidden inside types.

**Option B — Adopt explicit conventions.**
- **Pros:** amounts are exact integers end to end; every constraint can be referenced by name; business limits are visible as rules.
- **Cons:** the data model and its documentation must be rewritten before any migration exists.

### Decision

**We decided: Option B.** Every domain schema follows these conventions:

| Convention | Rule |
|---|---|
| Table names | Singular `snake_case`, named after one row: `system_user` (`user` is a reserved word), `refresh_token`, `customer`, `category`, `product`, `sale`, `sale_detail` |
| Column names | ADR-001 §7 field names are kept, except money columns (below) |
| Text | `text` with a `CHECK` on length when the business sets a limit |
| Closed sets | `CHECK` constraints, never `ENUM` types |
| Constraint and index names | Explicit prefixes: `pk_`, `fk_`, `chk_`, `uq_`, `idx_<table>_<columns>` |
| Foreign keys | Created in a migration after the tables; every foreign key declares `ON DELETE RESTRICT` and has its own index. Rows are never physically deleted (soft delete through `active`), so a physical delete that would orphan rows must fail |
| Money | `bigint` in minor units (1/100 of a Colombian peso): `price_cents`, `unit_price_cents`, `subtotal_cents`, `total_cents`. Never `NUMERIC` or floating point |
| Roles | `NOLOGIN` roles per domain (`<domain>_reader`, `<domain>_writer`) that carry the permissions. Login credentials come from environment secrets and are never written in a repository |
| Seed data | Idempotent: `INSERT … ON CONFLICT … DO UPDATE`, never a plain `INSERT` |

`created_by` (ADR-002) keeps its meaning and moves to the `sale` table.

### Dominant criterion

**Exact amounts and schemas that later migrations can change safely.** Money must not depend on how each client handles decimals, and a constraint without a known name cannot be altered by the next migration.

### Accepted cost

- `06-data/models.md` and `06-data/data-dictionary.md` are rewritten, and every contract field that carries money is renamed to `…Cents`.
- Portals must convert amounts from the text a person types, never by multiplying a floating-point number.

---

## Decision 4 — Idempotency keys stored in each domain database

### Options

**Option A — Keys in a shared cache (for example Redis).**
- **Pros:** one store for every service; keys can expire automatically.
- **Cons:** one more component; the key and the resource cannot be written in the same transaction, so a crash between the two writes creates duplicates or loses the key.

**Option B — An `idempotency_key` table in each domain database.**
- **Pros:** the key and the resource are written in one transaction; no new component.
- **Cons:** one more table per domain that creates resources over HTTP.

### Decision

**We decided: Option B.** Every domain that creates resources over HTTP has an `idempotency_key` table (key of 8 to 128 characters, the created resource and the creation timestamp). The service inserts the resource and its key in **one transaction**; if the key already exists, the transaction is rolled back and the original resource is returned.

### Dominant criterion

**A retried creation never produces a second resource**, even if the process stops between writing the resource and writing the key.

### Accepted cost

- One extra table and one extra insert per creation in each domain.
- Old keys accumulate; a cleanup policy is left for when volume justifies it.

---

## Decision 5 — `sales_summary` is not created

### Options

**Option A — Create the table unpopulated, as ADR-002 resolved.**
- **Pros:** keeps the field list of ADR-001 §7 complete.
- **Cons:** a table that no process fills, which every reader must be told to ignore.

**Option B — Do not create it.**
- **Pros:** the schema contains only data that something writes and reads.
- **Cons:** a future materialization of reports would need a new table and a new decision.

### Decision

**We decided: Option B.** `synkro-sales-db` does not create `sales_summary`. Reports (FR-008, FR-009) keep the live aggregation over `sale` and `sale_detail` defined in ADR-002. A scheduled daily sales closing is recorded as future work in `15-project-control/tech-backlog.md`; if it is adopted, it gets its own table and its own decision.

### Dominant criterion

**The schema reflects only data the system actually uses.** An empty table that looks like a report source invites wrong reads.

### Accepted cost

- If report queries degrade with volume, a materialization must be designed from scratch instead of reusing an existing table.

---

## Consequences

**What changes in the system:**
- Four PostgreSQL instances and volumes replace `synkrotech_db`, each defined in its `synkro-<domain>-db` repository; `synkro-infra` composes them.
- The shared init script, the per-schema database users and the cross-schema `REVOKE`s in `deployment.md` disappear; isolation comes from separate instances.
- Services stop running migrations at startup; each `-db` repository migrates its own schema with Flyway, and each one publishes the data dictionary of its own tables.
- Table names, money types and constraint names change in `06-data/models.md`, `06-data/data-dictionary.md`, `02-domain/entities-and-rules.md` and every contract that carries money.

**What must be watched:**
- Memory on development machines with four database instances plus the workflow's own store (ADR-007). If it becomes a problem, each domain can be brought up alone from its own repository.
- Discipline with `U` scripts: a missing or outdated rollback is caught only by the CI rebuild check, which must stay green.
- Breaking schema changes must follow expand and contract across two releases.

---

## Affected documents

| Document | Required change |
|----------|-----------------|
| `05-architecture/deployment.md` | Replace the shared instance, init script, per-schema users and service-run migrations with one instance per domain and the Flyway runner of each `-db` (HU-DOCS-44, HU-DOCS-45) |
| `06-data/models.md` | Rewrite principles, conventions and DDL per domain (HU-DOCS-46, HU-DOCS-47) |
| `06-data/data-dictionary.md` | Rename tables and money fields; remove `sales_summary` (HU-DOCS-46, HU-DOCS-47) |
| `02-domain/entities-and-rules.md` | Money in minor units (HU-DOCS-43) |
| `01-context/glossary.md` | Redefine "Schema"; add "Minor units" (HU-DOCS-43) |
| `05-architecture/overview.md` | Principle P2, C4 Level 2 databases, catalog table (HU-DOCS-51, HU-DOCS-52) |
| `08-uml/diagrams/source/c4-02-containers.drawio` | One database per domain (HU-DOCS-52) |
| `09-microservices/service-catalog.md` | Database column, repository descriptions (HU-DOCS-70) |
| `01-context/overview.md`, `01-context/scope.md` | Stack table and technology constraints (HU-DOCS-65) |
| `00-governance/security-policy.md`, `00-governance/security-rules.md` | Per-domain database credentials and roles (HU-DOCS-48) |
| `05-architecture/security-threat-model.md` | Database isolation threats (HU-DOCS-49) |
| `05-architecture/cross-cutting.md` | Health check dependencies per own instance (HU-DOCS-50) |
| `08-uml/diagram-index.md` | ERD rows per domain database (HU-DOCS-69) |
| `04-requirements/non-functional.md` | NFR-007 (HU-DOCS-66) |
| `15-project-control/tech-backlog.md` | Daily sales closing as future work (HU-DOCS-64) |
| `05-architecture/decisions/README.md` | ADR-005 row; ADR-001 and ADR-002 marked as modified (this PR) |
| ADR-001, ADR-002 | **No changes**: immutable |

---

## Immutability rule

Once this ADR is `Accepted`, it is not edited. Any change is a new ADR that names this one, and the sections it replaces, in its **Modifies** field.

---

## References

- Original database decision and data model → `05-architecture/decisions/records/ADR-001-architecture.md` §2, §7
- `created_by` and report aggregation → `05-architecture/decisions/records/ADR-002-sale-authorship-traceability.md`
- Current deployment and migration ownership → `05-architecture/deployment.md` §3–§5
- Current data model → `06-data/models.md`, `06-data/data-dictionary.md`
- Relational engine choice → `01-context/overview.md`, "Database: PostgreSQL vs. MongoDB"
- Repository ownership of each database → `09-microservices/service-catalog.md`
