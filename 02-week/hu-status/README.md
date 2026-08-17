# Weekly Status - Week 02

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: SynkroTech SAS
- SPRINT_GOAL: Define the initial distributed architecture, bounded contexts, and ADR-001 for the Sales Management System.
<!-- CONFIG-END -->

## Project Board

| Board Name          | URL                                              |
| -------------------- | ------------------------------------------------ |
| SynkroTech - Sprint  | https://github.com/users/AsolanoT/projects/4     |

## Team Members

| Full Name | GitHub User |
|------------|------------|
| Sergio Andres Ordoñez Diaz | https://github.com/SergioAndres17 |
| Fredman Santiago Plazas Artunduaga | https://github.com/SantiagoPlazas2005 |
| Jordan Ramirez Gallego | https://github.com/JordanRG420 |
| Angel Gustavo Solano Trujillo | https://github.com/AsolanoT |

## 1. User stories worked this week

| HU ID | Title | Status (todo/doing/done) | Evidence (PR or commit URL) |
|---|---|---|---|
| HU-PDR-001 | Define the purpose, business context, and project scope of the Sales Management System for the Preliminary Design Review document | done | https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/blob/main/01-week/hu-status/pdr.md |
| HU-ADR-01 | Document the context of the architecture decision | done | https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/blob/main/02-week/hu-status/ADR-001%20Initial%20Architecture.md |

## 2. My individual contribution

- Identified the business problem and system objectives for SynkroTech SAS.
- Defined the project requirements and architectural constraints.
- Mapped the bounded contexts: Auth, Customers, Products, and Sales.
- Contributed to ADR-001 by documenting the context section.
- Participated in the discussion regarding the distributed architecture required by the course.
- Reviewed the alignment between the PDR and the proposed architecture.
- Created and configured the initial GitHub Project board to support sprint planning, backlog management, and MoSCoW prioritization.

## 3. Blockers and risks

- Team is still defining final repository structure and environment configuration.
- Limited experience with Go, JWT security, and hexagonal architecture may affect development speed.
- Distributed communication between services introduces additional integration complexity.

## 4. Plan for next week

- Finalize and approve ADR-001.
- Create GitHub Project and prioritize backlog using MoSCoW.
- Define initial user stories and acceptance criteria.
- Create repository structure for each microservice.
- Start implementation of the Auth service foundation.
- Define REST contracts between services.

## 5. Compliance self-check

- [x] Conventional Commits - `type(scope): summary`
- [x] Per-environment HU branch + PR to that environment (hu-xxx-dev -> develop, ...)
- [x] Testable acceptance criteria
- [ ] Tests added/updated (unit / integration)
- [x] DDD / hexagonal boundaries respected (domain has no I/O)
- [x] No secrets; config via environment variables

## 6. Evidence links

- ADR-001: Initial Architecture of the Sales Management System 
- Contribution to Architecture Decision: [`ADR-001 Initial Architecture.md`](./ADR-001%20Initial%20Architecture.md)
- PDR: Sales Management System for SynkroTech SAS
- GitHub Project Board [(to be created)](https://github.com/users/AsolanoT/projects/4)
- Pull Request: Pending
- Commit History: Pending
