<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       09-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 09

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: Group 10 - synkro-tech
- SPRINT_GOAL: Close HU-13 (contract completion and documentation readiness for the code phase), then deliver HU-14 in full — two database engines (ADR-010), the Angular Customers portal inside the React host (ADR-011), instance bootstrap and credentials (ADR-012), and the identity-as-cross-cutting-service proposal (ADR-013) — with every downstream document realigned, and open the code phase with HU-INF-01.
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
| Angel Gustavo Solano Trujillo      | https://github.com/AsolanoT               |

## 1. User stories worked this week

| HU ID      | Title                                                                 | Status | Evidence (PR or commit URL) |
|------------|------------------------------------------------------------------------|--------|------------------------------|
| HU-DOCS-77 | Close Cut 4 in the backlog and fix pending references (HU-13)         | done   | #134 |
| HU-DOCS-79 | Adapt contributing, onboarding, TDD and `10-devops/` documents (HU-13) | done   | #140 |
| HU-ARQ-23  | ADR-010: Sales domain on MongoDB and the MongoDB infrastructure repository (HU-14) | done | https://github.com/code-corhuila/synkro-docs/pull/161 |
| HU-DOCS-80 | Rewrite the Sales data model as documents (HU-14)                     | done   | https://github.com/code-corhuila/synkro-docs/pull/165 |
| HU-DOCS-86 | Assign screens to portals and define view states (HU-14)              | done   | https://github.com/code-corhuila/synkro-docs/pull/177 |
| HU-DOCS-87 | Add the code-phase backlog, story prefixes and traceability (HU-14)   | done   | https://github.com/code-corhuila/synkro-docs/pull/179 |

## 2. My individual contribution

**HU-13 — closing the backlog and the developer-facing docs (HU-DOCS-77, 79):**
- HU-DOCS-77: closed out Cut 4 in `user-stories.md`, fixing every reference that still pointed at the DB-topology-correction phase instead of its outcome, and corrected the numbers the Cut reconciliation note depended on.
- HU-DOCS-79: adapted the contributing, onboarding, TDD and `10-devops/` documents so a new developer's first read matches what HU-11/HU-12 actually shipped, not what it looked like before the correction.

**HU-14 — ADR-010, the originating decision (HU-ARQ-23):**
- Wrote ADR-010: Sales moves to its own MongoDB instance — the one domain whose access pattern (a sale written once with all its lines, always read whole, never referenced by another domain) fits a document better than a table. Six decisions: which domain (Sales), the document model (one `sale` collection, lines embedded, a strict `$jsonSchema` validator), idempotency (a field with a unique index, one atomic write), reports (live aggregation pipelines, no summary collection), migrations (Liquibase), and the infrastructure repository split (`synkro-infra` → `synkro-infra-postgres`, new `synkro-infra-mongo`). Opened [#159](https://github.com/code-corhuila/synkro-docs/issues/159) to the instructor for the rename and the new repository.

**HU-14 — the data-model rewrite ADR-010 required (HU-DOCS-80):**
- Rewrote every document that described Sales relationally: `06-data/models.md`'s Sales section, `data-dictionary.md`'s Sales rows, `entities-and-rules.md` (the 100-line invariant, `saleId` removed from `SaleDetail` since it lives embedded), `data-ownership-matrix.md`, five new MongoDB terms in `glossary.md`, and both affected contracts (`maxItems: 100` on the line arrays, no path or status-code changes).

**HU-14 — UX assignment (HU-DOCS-86):**
- Assigned every screen to a portal or the host in `navigation-map.md`, named four screens the contracts already supported but the map never listed (Stock alerts, Sale detail as its own route, Users, Service tokens — the last two deliberately minimal, since their contracts have no "list" endpoint), and added the four view states to every screen in `wireframes.md`, including the exact insufficient-stock rejection message.

**HU-14 — the code-phase backlog (HU-DOCS-87):**
- Added the `HU-<PREFIX>-NN` story-identifier convention and its prefix table to `agile-conventions.md`, and the 19-story Cut 6 backlog to `user-stories.md` with its traceability rows. Caught and corrected two numbers an earlier draft had gotten wrong before merging (Sprint 9 completed 19 HU, not 28; Cut 4 totals 52, not 65) by checking them against the real file content instead of re-deriving them from memory.

## 3. Blockers and risks

- **`synkro-infra-mongo` doesn't exist yet**, so `synkro-sales-db`'s Liquibase migrations and `synkro-sales-api`'s MongoDB adapter can be written but not integration-tested until [#159](https://github.com/code-corhuila/synkro-docs/issues/159) is resolved. Tracked as `risks.md` R-007.
- **Two of my three HU-14 PRs got automated-review findings** (HU-DOCS-86: an implicit sale-registration route, an ambiguous use of "develop", a missing ADR citation for the worker's responsibility) — all three fixed and re-verified before merge, not just acknowledged.
- **The Users and Service tokens screens surfaced a real contract gap**: no "list" endpoint exists for either. Recorded as `open-questions.md` Q-006 for the Product Owner to decide, not silently added to a contract in the same PR.

## 4. Plan for next week

- HU-VEN-01 and HU-VEN-02 (Sales portal: register a sale, sales history) once HU-INF-03's simulated services are up.
- Refine the "next cut" `VEN` stories (reports, real sale persistence on MongoDB) once `synkro-infra-mongo` exists.
- Pair with Santiago on closing the two open instructor-dependency items (#159, ADR-013) if either gets answered this week.

## 5. Compliance self-check

- [x] Conventional Commits - `type(scope): summary`
- [x] Per-environment HU branch + PR to `main` — branches `docs/close-cut-4-backlog`, `docs/adapt-developer-facing-documents`, `docs/add-adr-010-sales-on-mongodb`, `docs/rewrite-sales-data-model-as-documents`, `docs/assign-screens-to-portals-and-view-states`, `docs/add-code-phase-backlog-and-traceability`, merged via PR approved by `ariel5253`
- [x] Testable acceptance criteria
- [x] Tests added/updated — N/A, documentation-only HU
- [x] DDD / hexagonal boundaries respected — N/A, no code touched this week
- [x] No secrets; config via environment variables — ADR-010's Sales credentials follow the same environment-file convention ADR-012 fixed for the rest of the system

## 6. Evidence links

- ADR-010 (HU-ARQ-23): [`ADR-010-sales-on-mongodb.md`](./docs/ADR-010-sales-on-mongodb.md)
- Sales data model as documents (HU-DOCS-80): [`models.md`](./docs/06-data/models.md)
- Screens per portal and view states (HU-DOCS-86): [`navigation-map.md`](./docs/12-ux-ui/navigation-map.md), [`wireframes.md`](./docs/12-ux-ui/wireframes.md)
- Code-phase backlog (HU-DOCS-87): [`user-stories.md`](./docs/04-requirements/user-stories.md), [`traceability-matrix.md`](./docs/04-requirements/traceability-matrix.md)
- Issue tracking the pending instructor rename: https://github.com/code-corhuila/synkro-docs/issues/159
