<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       03-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 03

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: Group - synkro-tech
- SPRINT_GOAL: Correct the PDR and ADR-001 to align with the actual course requirements (business-only PDR, single logical database, explicit context map), then populate the docs repository's 00-governance and 01-context sections with SynkroTech-specific content.
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
| HU-PDR-05 | Correct section 00 - Contexto inicial in the business PDR | done | https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/blob/main/03-week/hu-status/docs/01_PDR_negocio_v2.md |
| HU-ADR-05 (A) | Build the context map: identify SynkroTech's bounded contexts and justify which ones become independent services | done | https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/blob/main/03-week/hu-status/docs/01_context-map_v1.md |
| HU-DOCS-01 | Document the system overview (stack, users, current status) | done | https://github.com/code-corhuila/synkro-docs/blob/main/01-context/overview.md  |
| HU-DOCS-02 | Document MVP scope, out-of-scope items, and future candidates | done | https://github.com/code-corhuila/synkro-docs/blob/main/01-context/scope.md  |
| HU-DOCS-03 | Define sprint structure, ceremonies, and backlog tool | done | https://github.com/code-corhuila/synkro-docs/blob/main/00-governance/agile-conventions.md  |
| HU-DOCS-04 | Adopt the team's Definition of Ready (DoR) | done | https://github.com/code-corhuila/synkro-docs/blob/main/00-governance/definition-of-ready.md  |

## 2. My individual contribution

**Context for the correction:** the business PDR mixed technical architecture content into what should be a preliminary business discovery document — the PDR should only contain business context, needs, expected processes, open questions and a business glossary. In parallel, before formalizing any architecture decision, the team's decision was to first document, in business language, which parts of SynkroTech's operation are genuinely independent from each other, instead of jumping straight into a services list.

- I corrected section **00 — Contexto inicial** of the business PDR, keeping it focused strictly on SynkroTech SAS's business situation (company description, current manual processes, the need to centralize information) without any reference to microservices, hexagonal layers, or technical implementation details.
- Together with Sergio, I wrote the **context-map** document, identifying the 4 bounded contexts of the business (Authentication and Users, Clients, Products and Inventory, Sales) purely in business language, without referencing database tables.
- For each bounded context, I documented why it is (or isn't) a good candidate to become an independent service, using criteria such as: does it change for its own reasons, does it share business rules with other contexts, does it need to scale differently, and who is the natural owner of that data.
- I contributed the reasoning for why **Reports was kept inside the Sales context** instead of being split into its own service: reports are calculated exclusively from data that Sales already owns, with no independent business rule or scaling need of its own.

**Continuing this week, once the ADR correction closed, I moved on to populating the actual `docs` repository scaffold provided by the instructor:**

- I wrote `overview.md`: system name, business description, the problem it solves (before/after), main users per role, the full technology stack with justification per layer, current project status, environments, and project contacts.
- I wrote `scope.md`, reorganizing it to follow the template's suggested order (in scope → out of scope → future candidates), and added a dedicated section for open questions inherited from the PDR, so scope decisions and open questions are no longer mixed in the same table.
- I defined `agile-conventions.md`: sprint length (1 week), ceremonies (Planning, Daily, Sprint Review team-only, Weekly session with the Product Owner that merges PO review and backlog refinement, Retrospective), the estimation scale, and the backlog tool (GitHub Projects).
- I adopted `definition-of-ready.md`: the checklist a User Story must satisfy before it can start (clarity, acceptance criteria, dependencies, estimation, technical readiness, non-functional requirements).

## 3. Blockers and risks
- The context map is a document-only artifact for now; it hasn't been validated against real usage patterns (e.g. how often reports are actually queried compared to sales being created), so the "same scaling need" assumption for Sales+Reports is still a hypothesis, not measured data.
- Section 00 of the PDR still references SynkroTech's manual processes in general terms; more specific detail (e.g. exact tools currently used) may be needed later if the professor asks for a deeper "as-is" analysis.
- The `agile-conventions.md` board URL is still pending, since the instructor will provide the official board template — the document currently has a placeholder there.

## 4. Plan for next week
- Review the context map together with the rest of the team now that the corrected ADR (Angel and Fredman Santiago's work) is finished, to confirm both documents stay consistent with each other.
- Support completing `05-architecture` and `06-data`, since those are the next milestone before starting code implementation.
- Once the board template arrives from the instructor, update `agile-conventions.md` with the real URL.

## 5. Compliance self-check
- [ ] Conventional Commits - `type(scope): summary`
- [ ] Per-environment HU branch + PR to that environment (hu-xxx-dev -> develop, ...)
- [x] Testable acceptance criteria
- [ ] Tests added/updated (unit / integration)
- [ ] DDD / hexagonal boundaries respected (domain has no I/O)
- [x] No secrets; config via environment variables

## 6. Evidence links
- Corrected business PDR: [`01_PDR_negocio_v2.md`](./docs/01_PDR_negocio_v2.md)
- Context map: [`01_context-map_v1.md`](./docs/01_context-map_v1.md)
- System overview: [`overview.md`](./docs/01-context/overview.md)
- Project scope: [`scope.md`](./docs/01-context/scope.md)
- Agile conventions: [`agile-conventions.md`](./docs/00-governance/agile-conventions.md)
- Definition of Ready: [`definition-of-ready.md`](./docs/00-governance/definition-of-ready.md)
