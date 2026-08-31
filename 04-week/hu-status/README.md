<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       04-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 04

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego 
- GITHUB_USER: JordanRG420 
- TEAM: Group - synkro-tech
- SPRINT_GOAL: Formalize the domain-to-repository service catalog, fill the product-definition gap (problem framing + vision), and build a panoramic MVP monolith (Spring Boot + React) to validate business understanding, as requested by the instructor for Week 4.
<!-- CONFIG-END -->

## Docs Repository

| Board Name          | URL                                              |
| -------------------- | ------------------------------------------------ |
| synkro-docs Repository | https://github.com/code-corhuila/synkro-docs.git |

## Team Members

| Full Name                          | GitHub User                                                 |
| ----------------------------       | ------------------------------------------                  |
| Sergio Andres Ordoñez Diaz         | https://github.com/SergioAndres17                           |
| Fredman Santiago Plazas Artunduaga | https://github.com/SantiagoPlazas2005                       |
| Jordan Ramirez Gallego             | https://github.com/JordanRG420                              |
| Angel Gustavo Solano Trujillo      |  https://github.com/AsolanoT                                |


## 1. User stories worked this week
| HU ID | Title | Status (todo/doing/done) | Evidence (PR or commit URL) |
|---|---|---|---|
| HU-ARQ-01 | Formalize the Domain-to-Repository Service Catalog | done | https://github.com/code-corhuila/synkro-docs/blob/main/09-microservices/service-catalog.md |

## 2. My individual contribution

**Context:** the instructor asked for 3 explicit deliverables this week: (1) the formal list of the 4 domains/future microservices with their exact repo names, so the instructor can create the repository ecosystem without ambiguity, (2) continuing the `docs` repository, and (3) a panoramic MVP mockup. My HU covers deliverable #1.

- I formalized `09-microservices/service-catalog.md` with the 4 bounded contexts from `domain-map.md` mapped to concrete backend/frontend repo names, language, and DB schema (`auth-service`/`auth-frontend`, `customers-service`/`customers-frontend`, `products-service`/`products-frontend`, `sales-service`/`sales-frontend`).
- I verified the language assignment matches ADR-001 exactly (Java for Auth/Customers, Go for Products/Sales) with no discrepancy.
- I accounted for all 10 repositories in the ecosystem (4 backend + 4 frontend + 1 database + 1 docs), including the branch strategy exception already defined for `docs` (`main`-only, no `qa`/`dev`).
- I applied the service numbering convention from `09-microservices/README.md` (01 = IAM/Security, 02 = reference data, 03-0N = domain services): Auth = 01, Customers = 02, Products = 03, Sales = 04.
- I converted this HU into the Gherkin-scenario format required by `04-requirements/user-stories.md` and added it there, along with the 3 other HUs from the team for this week.

## 3. Blockers and risks
- This HU only fills the top-level identification section of the service catalog (name, language, DB, repo). The full per-service detail (endpoints, events published/consumed) is deferred to `09-microservices/services/0N-[name]/`, per the SDD guide's fill-in order — not due this sprint, but worth tracking so it doesn't get forgotten.
- The instructor will create the actual repositories based on this list — if any name changes are requested afterward, this file and any references to it (e.g. in `overview.md`) would need to be updated to stay consistent.

## 4. Plan for next week
- Support the per-service detail files in `09-microservices/services/0N-[name]/` once the instructor confirms the repos were created with these exact names.
- Continue with `05-architecture` now that `03-product` (problem framing + vision) is also being closed this week.

## 5. Compliance self-check
- [ ] Conventional Commits - `type(scope): summary`
- [ ] Per-environment HU branch + PR to that environment (hu-xxx-dev -> develop, ...)
- [x] Testable acceptance criteria
- [ ] Tests added/updated (unit / integration)
- [ ] DDD / hexagonal boundaries respected (domain has no I/O)
- [x] No secrets; config via environment variables

## 6. Evidence links
- Service catalog: [`service-catalog.md`](./docs/09-microservices/service-catalog.md)
- User stories backlog (HU-ARQ-01 entry): [`user-stories.md`](./docs/04-requirements/user-stories.md)
