<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       10-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 10

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: Group 10 - synkro-tech
- SPRINT_GOAL: Finish the host's portal registry and failure isolation, ship the Products API's stock/category/alert endpoints, build the Sales aggregate and its use case/persistence/endpoint chain, and close the ADR-014 admin-registration flow (transactional registration + initial-admin bootstrap) in `synkro-auth-api`.
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
| HU-FE-03   | Host: single HTTP client, session, route guard, development sign-in | done | https://github.com/code-corhuila/synkro-docs/issues/183 |
| HU-FE-04   | Host: portal registry, failure isolation, layout, real Module Federation | done | https://github.com/code-corhuila/synkro-docs/issues/188 |
| HU-WKF-02  | Fix architecture-check guard (silent failure when the file is missing) and add UTF-8 test coverage, both found in HU-CLI-01 | done | https://github.com/code-corhuila/synkro-docs/issues/190 |
| HU-PRO-08  | Categories and Products endpoints (list, create, update, deactivate) | done | branch: `feat/base-structure-and-health-check` (follow-up PR) |
| HU-PRO-09  | Stock adjustment and reservation endpoints | done | https://github.com/code-corhuila/synkro-docs/issues/198 |
| HU-PRO-10  | Stock alert endpoints | done | https://github.com/code-corhuila/synkro-docs/issues/199 |
| HU-DOCS-90 | Fix the design system (modals, buttons, error messages); align the Products and Sales API contracts for validations, inactive categories and amount calculations | done | branch: not specified in the board — confirm before upload |
| HU-VEN-06  | `Sale`/`SaleDetail` aggregate: invariants, integer money calculation, no frameworks or I/O | done | branch: `feat/base-structure-and-health-check` (follow-up PR) |
| HU-VEN-07  | Sales registration ports and use case: idempotency, ID generation, fake-repository tests | done | branch: not specified — confirm before upload |
| HU-VEN-08  | Sales persistence in MongoDB: BSON, atomic insert, idempotency, tests against a real replica set | done | branch: not specified — confirm before upload |
| HU-VEN-09  | `POST/GET /api/v1/sales` and `GET /api/v1/sales/{id}` with role-based authorization | done | branch: not specified — confirm before upload |
| HU-AUTH-13 | ADMIN registration with transactional audit; `register` removed from public routes, ADMIN-only, user+key+audit commit together | done | https://github.com/code-corhuila/synkro-docs/issues/214 |
| HU-AUTH-14 | Initial-admin creation command: advisory lock, READ COMMITTED, 10s wait, no HTTP endpoint | done | https://github.com/code-corhuila/synkro-docs/issues/214 (tracked together with AUTH-13) |

> Several rows have no PR link in the source table — replace the `branch:` placeholders with the real PR URL before upload.

## 2. My individual contribution

**Host shell and portal isolation (HU-FE-03, HU-FE-04, HU-WKF-02):**
- HU-FE-03: built the host's single HTTP client, the session layer on top of it, the route guard that reads the session, and the development sign-in flow used before Auth issues real tokens.
- HU-FE-04: implemented the portal registry so each domain portal registers itself with the host, wired real Module Federation loading, the shared layout, and failure isolation so one portal crashing never takes down the shell.
- HU-WKF-02: fixed a silent-failure bug in the architecture-check guard (it passed silently when the check file was missing) and added the UTF-8 test coverage that HU-CLI-01 was missing, both found while reviewing that base structure.

**Products API endpoints (HU-PRO-08, HU-PRO-09, HU-PRO-10):**
- Built the full Categories/Products CRUD surface (list, create, update, deactivate), the stock adjustment and reservation endpoints, and the stock-alert endpoints, all on top of Sergio's `synkro-products-db` schema from this same sprint.

**Sales domain and API (HU-VEN-06 through HU-VEN-09):**
- HU-VEN-06: modeled the `Sale`/`SaleDetail` aggregate with its invariants and integer-based money calculation, kept free of frameworks and I/O per the hexagonal domain layer rule.
- HU-VEN-07: implemented the sale-registration use case and its ports, with idempotency and ID generation, tested against a fake repository before touching a real database.
- HU-VEN-08: wired MongoDB persistence for sales — BSON mapping, atomic insert, idempotency — verified with tests against a real replica set rather than a mock.
- HU-VEN-09: exposed `POST/GET /api/v1/sales` and `GET /api/v1/sales/{id}` with role-based authorization on top of the use case.

**Admin registration closure (HU-AUTH-13, HU-AUTH-14):**
- HU-AUTH-13: removed `register` from `synkro-auth-api`'s public routes, required an authenticated ADMIN caller, and committed the new user, its registration key and the audit row in one transaction so a partial failure can't leave an unaudited user behind.
- HU-AUTH-14: built the initial-admin bootstrap as an operator-run command (no HTTP endpoint), using a READ COMMITTED transaction with a reserved advisory lock and a 10-second wait, so two operators running it at once can't both create an admin.

## 3. Blockers and risks

- **HU-AUTH-13 and HU-AUTH-14 both depend on HU-AUTH-12** (the `user_creation_audit` table and its grants, Sergio) — any schema or permission change there needs a re-check against both use cases.
- **HU-PRO-08/09/10 depend on the Products DB schema (HU-PRO-04 through HU-PRO-07, Sergio) landing first**; a late migration change would require revisiting the repository adapters.
- **HU-DOCS-90's branch isn't recorded in the sprint board** — needs to be confirmed before this file is uploaded, since the evidence column can't be verified otherwise.
- **The Sales portal has no code yet** — HU-VEN-06 through HU-VEN-09 give it a real API to call, but the portal itself isn't scheduled until the Sales API stabilizes.

## 4. Plan for next week

- Confirm and document the missing PR links for HU-PRO-08, HU-VEN-07, HU-VEN-08, HU-VEN-09 and HU-DOCS-90.
- Start the Sales portal's base structure once Angel's Products portal pattern (Module Federation remote + host registration) is confirmed reusable.
- Pair with Sergio on HU-VEN-16's MongoDB rebuild-check fixes to make sure the Sales API's integration tests stay green against the hardened migration runner.
- Review HU-AUTH-07 through HU-AUTH-11 (Santiago) against the ADMIN-registration flow now that AUTH-13/14 are in place.

## 5. Compliance self-check

- [x] Conventional Commits - `type(scope): summary`
- [x] Per-environment HU branch + PR to `main`, approved by `ariel5253`
- [x] Testable acceptance criteria
- [x] Tests added/updated — fake-repository tests (HU-VEN-07), real replica-set tests (HU-VEN-08), UTF-8 test (HU-WKF-02), role-authorization tests (HU-VEN-09)
- [x] DDD / hexagonal boundaries respected — `Sale`/`SaleDetail` (HU-VEN-06) has no framework or I/O dependency; Products/Sales endpoints sit in the infrastructure adapter layer
- [x] No secrets; config via environment variables — MongoDB connection and RS256 verification keys read from environment, never hardcoded

## 6. Evidence links

- Host portal registry and isolation: `synkro-front` (branch `feat/portal-registry-and-isolation`)
- Host HTTP client, session, dev sign-in: `synkro-front` (branch `feat/api-client-session-and-dev-signin`)
- Architecture-check guard fix: `synkro-workflow` / shared tooling (branch `fix/architecture-check-guard-and-utf8-test`)
- Products API endpoints: `synkro-products-api`
- Sales aggregate and API: `synkro-sales-api`
- Admin registration and initial-admin bootstrap: `synkro-auth-api`
- Related ADR: `docs/ADR-014-admin-registration-and-initial-admin.md`
