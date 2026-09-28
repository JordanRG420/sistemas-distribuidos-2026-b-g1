<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       08-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 08

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: Group 10 - synkro-tech
- SPRINT_GOAL: Close HU-08 (professor review feedback) and HU-09 (first version of the API contracts), and replace the architecture decisions that no longer held — shared database instance, gateway-only token validation, stateless saga, broker without a real consumer, undecided cross-cutting stack — through ADR-005 to ADR-008, rewriting every dependent document (HU-10).
<!-- CONFIG-END -->

## Docs Repository

| Board Name             | URL                                              |
|------------------------|--------------------------------------------------|
| synkro-docs Repository | https://github.com/code-corhuila/synkro-docs.git |

## Team Members

| Full Name                          | GitHub User                               |
|------------------------------------|-------------------------------------------|
| Sergio Andres Ordoñez Diaz         | https://github.com/SergioAndres17         |
| Fredman Santiago Plazas Artunduaga | https://github.com/SantiagoPlazas2005     |
| Jordan Ramirez Gallego             | https://github.com/JordanRG420            |
| Angel Gustavo Solano Trujillo      |  https://github.com/AsolanoT              |

## 1. User stories worked this week

| HU ID      | Title                                                        | Status | Evidence (PR or commit URL)                                                                       |
|------------|---------------------------------------------------------------|--------|---------------------------------------------------------------------------------------------------|
| HU-DOCS-39 | OpenAPI contract: sales (HU-09)                               | done   | https://github.com/code-corhuila/synkro-docs/pull/51 |
| HU-DOCS-42 | ADR-004: API contract extensions (HU-09, with Angel)          | done   | https://github.com/code-corhuila/synkro-docs/pull/57 |
| HU-ARQ-18  | ADR-005: data isolation and data model per domain (HU-10)     | done   | `05-architecture/decisions/records/ADR-005-data-isolation-per-domain.md` |
| HU-DOCS-46 | Data models part 1: auth and customers (HU-10)                | done   | `06-data/models.md`, `06-data/data-dictionary.md` |
| HU-DOCS-47 | Data models part 2: products, sales and the saga store (HU-10) | done   | `06-data/models.md`, `06-data/data-dictionary.md` |

## 2. My individual contribution

**HU-DOCS-39 — sales contract (HU-09):**
- Wrote the first OpenAPI contract for the sales service: sale registration and retrieval, and the daily, monthly and top-products reports, with the `created_by` "own sales only" rule of ADR-002.

**HU-DOCS-42 — ADR-004 (HU-09, with Angel):**
- Recorded the endpoint gaps found while writing the contracts, including the `from`/`to` date filters for the sales reports, which the sales contract cites.

**HU-ARQ-18 — ADR-005: data isolation and data model per domain (HU-10):**
- Authored ADR-005 with 5 decisions, each with options, dominant criterion and accepted cost:
  1. One PostgreSQL instance per domain, defined in its own `synkro-<domain>-db` repository.
  2. Flyway migrations owned only by each `-db`, with a rollback script per migration and a rebuild check in CI.
  3. Schema conventions: singular tables, `text` with `CHECK`, `CHECK` instead of `ENUM`, explicit constraint names, money as `bigint` minor units.
  4. An `idempotency_key` table in every domain that creates over HTTP.
  5. `sales_summary` is not created.
- It replaces ADR-001 §2 and §7 without editing them, and answers the shared-instance finding raised on PR #56.

**HU-DOCS-46 — data models part 1 (HU-10):**
- Rewrote the principles of `06-data/models.md` (database per domain, soft delete enforced by the database, conventions table, Flyway layout, idempotency keys) and the auth and customers domains, with DDL per migration file, roles and grants.
- Corrected the credential design: migrations create only `NOLOGIN` roles, and the service user comes from environment secrets, so no password ever passes through a migration.

**HU-DOCS-47 — data models part 2 (HU-10):**
- Completed `models.md` and `data-dictionary.md`:
  - Products: categories, products in `price_cents`, stock adjustments, stock reservations with their lines, stock alerts.
  - Sales: sale and sale detail in minor units.
  - Saga store: `workflow.saga_instance`.
- Enforced the domain invariants in the schema: one open alert per product, stock never negative, and a subtotal always equal to quantity × unit price.

## 3. Blockers and risks

- **PR size.** HU-DOCS-47 closed at 397 changed lines, just under the 400-line limit; the ER diagrams were reduced to relationships only so the DDL, which documents every column, could stay complete.
- **Dependency chain.** The data models depend on ADR-005 and on the domain model (HU-DOCS-43), so they could only be merged after both.
- **Credentials rule.** The first credential design passed the service user's password through a Flyway placeholder, which contradicts our own rule that migration roles carry no password. It was caught during HU-DOCS-46 and corrected in `models.md` and `deployment.md`.

## 4. Plan for next week

- HU-11 — HU-DOCS-59: align the `synkro-sales-api` contract with the common contract (minor units, `createdBy` accepted only from the saga, paginated reports and sales history).
- HU-12:
  - HU-DOCS-63: reconcile the backlog by semester cut.
  - HU-DOCS-65: align the context and product documents.
  - HU-DOCS-66: align the requirements and add contract traceability.
  - HU-DOCS-68: align the hexagonal architecture guide with the service layout.

## 5. Compliance self-check

- [x] Conventional Commits - `type(scope): summary`
- [x] Per-environment HU branch + PR to `main` — branches `docs/add-sales-openapi-contract`, `docs/add-adr-004-api-contract-extensions`, `docs/add-adr-005-data-isolation`, `docs/rewrite-data-models-auth-and-customers` and `docs/rewrite-data-models-products-sales-and-saga-store`, merged via PR approved by `ariel5253`
- [x] Testable acceptance criteria
- [x] Tests added/updated — N/A, documentation-only HU
- [x] DDD / hexagonal boundaries respected — N/A, no code touched this week; the schema enforces the invariants of `02-domain/entities-and-rules.md`
- [x] No secrets; config via environment variables — no password appears in any migration or example

## 6. Evidence links

- ADR-005 (HU-ARQ-18): [`ADR-005-data-isolation-per-domain.md`](./docs/ADR-005-data-isolation-per-domain.md)
- Data models (HU-DOCS-46, HU-DOCS-47): [`models.md`](./docs/models.md)
- Data dictionary (HU-DOCS-46, HU-DOCS-47): [`data-dictionary.md`](./docs/data-dictionary.md)
- Sales contract (HU-DOCS-39): [`sales-service.yaml`](./docs/sales-service.yaml)
- ADR-004 (HU-DOCS-42): [`ADR-004-api-contract-extensions.md`](./docs/ADR-004-api-contract-extensions.md)
