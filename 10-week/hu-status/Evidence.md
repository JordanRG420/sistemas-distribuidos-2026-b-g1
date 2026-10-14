# Appendices: Evidence Map of Individual Contributions

**Student:** Jordan Ramirez Gallego  
**GitHub username:** [JordanRG420](https://github.com/JordanRG420)  
**Period reviewed:** Weeks 06 to 10  
**Individual repository:** [sistemas-distribuidos-2026-b-g1](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1)  
**Team documentation repository:** [code-corhuila/synkro-docs](https://github.com/code-corhuila/synkro-docs)


## 1. Purpose

This document gathers verifiable evidence of the individual contributions recorded in the `hu-status/README.md` files from Weeks 06 to 10. It includes the user stories addressed, a summary of the work, and links to commits or pull requests (PRs) when they could be identified. Contributions are described according to the weekly reports, and tasks that the README assigns to other team members are not attributed to the student.


## 2. Evidence by week

### Week 06 — Functional requirements and traceability


**Reported contribution**

- Updated the “All Candidate Functionalities” table in `01-context/scope.md`.
- Unified functional requirement identifiers using the `FR-001` to `FR-010` format.
- Prepared the content of `04-requirements/functional.md` and coordinated dependencies to rebuild the traceability matrix.


**Related user stories:** HU-DOCS-24 (in progress) and HU-DOCS-27 (pending due to dependencies).


**Evidence**

- [Weekly status README — Week 06](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/blob/main/06-week/hu-status/README.md)
- [Team documentation repository](https://github.com/code-corhuila/synkro-docs)


**Commit/PR:** this week’s README does not record a commit SHA or a specific PR link for this contribution. User story HU-DOCS-24 appears as partially completed, and `functional.md` was reported as a pending deliverable at that time.


### Week 07 — Identifiers, traceability matrix, and domain events


**Reported contribution**

- Removed references to the external PDR document and standardized `FR-`/`NFR-` identifiers.
- Rebuilt the traceability matrix using real SynkroTech project data, identified gaps, and added reverse traceability from HU → FR.
- Documented synchronous/asynchronous interactions, the `SaleCompleted` and `SaleFailed` events, message structure, idempotency, DLQ, and schema evolution.


**Related user stories:** HU-DOCS-25, HU-DOCS-27, and HU-DOCS-29.


**Evidence**

- [Weekly status README — Week 07](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/blob/main/07-week/hu-status/README.md)
- [HU-DOCS-25 — commit `c4a6b763945a2497a1ee2d8cec73bc129aef4a3b`](https://github.com/code-corhuila/synkro-docs/commit/c4a6b763945a2497a1ee2d8cec73bc129aef4a3b)
- [Traceability matrix](https://github.com/code-corhuila/synkro-docs/blob/main/04-requirements/traceability-matrix.md)
- [Domain events](https://github.com/code-corhuila/synkro-docs/blob/main/02-domain/domain-events.md)


**PR:** the README confirms that the `docs/unify-fr-nfr-and-disconnect-pdr`, `docs/update-traceability-matrix`, and `docs/add-domain-events-catalog` branches were merged through PRs. The numbers or direct links for those PRs do not appear in the weekly README, so they are not fabricated here.


### Week 08 — Sales contract, architecture decisions, and data models


**Reported contribution**

- Created the initial OpenAPI contract for the Sales service, including sale registration, queries, and daily, monthly, and top-product reports.
- Documented API contract extensions and date filters.
- Created ADR-005 regarding data isolation and the domain-based data model.
- Updated the models and data dictionary for authentication, customers, products, sales, and saga storage, including integrity rules and credential handling.


**Related user stories:** HU-DOCS-39, HU-DOCS-42, HU-ARQ-18, HU-DOCS-46, and HU-DOCS-47.


**Evidence**

- [Weekly status README — Week 08](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/blob/main/08-week/hu-status/README.md)
- [PR #51 — Sales OpenAPI contract](https://github.com/code-corhuila/synkro-docs/pull/51)
- [PR #57 — API contract extensions](https://github.com/code-corhuila/synkro-docs/pull/57)
- [Architecture decisions](https://github.com/code-corhuila/synkro-docs/tree/main/05-architecture/decisions/records)
- [Data models](https://github.com/code-corhuila/synkro-docs/blob/main/06-data/models.md)
- [Data dictionary](https://github.com/code-corhuila/synkro-docs/blob/main/06-data/data-dictionary.md)


**Additional PRs:** the README reports that the `docs/add-adr-005-data-isolation`, `docs/rewrite-data-models-auth-and-customers`, and `docs/rewrite-data-models-products-sales-and-saga-store` branches were merged through PRs, but it does not provide their numbers in the evidence section.


### Week 09 — Documentation closure, MongoDB, and preparation for the coding phase



**Reported contribution**

- Closed Cut 4 and corrected backlog references.
- Adapted the contribution, developer onboarding, TDD, and DevOps guides.
- Created ADR-010 to migrate the Sales domain to MongoDB and rewrote the Sales model using embedded documents.
- Assigned screens to portals and defined view states.
- Added the development backlog and its traceability rows.


**Related user stories:** HU-DOCS-77, HU-DOCS-79, HU-ARQ-23, HU-DOCS-80, HU-DOCS-86, and HU-DOCS-87.


**Evidence**

- [Weekly status README — Week 09](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/blob/main/09-week/hu-status/README.md)
- [PR #161 — ADR-010 and Sales on MongoDB](https://github.com/code-corhuila/synkro-docs/pull/161)
- [PR #165 — Sales model using documents](https://github.com/code-corhuila/synkro-docs/pull/165)
- [PR #177 — Assignment of screens to portals and view states](https://github.com/code-corhuila/synkro-docs/pull/177)
- [PR #179 — Coding-phase backlog and traceability](https://github.com/code-corhuila/synkro-docs/pull/179)
- [User story backlog](https://github.com/code-corhuila/synkro-docs/blob/main/04-requirements/user-stories.md)
- [Traceability matrix](https://github.com/code-corhuila/synkro-docs/blob/main/04-requirements/traceability-matrix.md)


**Additional PRs:** the README references PRs `#134` and `#140` for HU-DOCS-77 and HU-DOCS-79, respectively. Links: [PR #134](https://github.com/code-corhuila/synkro-docs/pull/134) and [PR #140](https://github.com/code-corhuila/synkro-docs/pull/140).


### Week 10 — Implementation and integration of portals and services


**Reported contribution**

- Implemented the host’s shared HTTP client, session management, route protection, and development login.
- Implemented portal registration, loading through Module Federation, shared design, and fault isolation.
- Developed endpoints for categories, products, inventory adjustments, inventory reservations, and alerts.
- Implemented the `Sale`/`SaleDetail` aggregate, the registration use case, idempotency, MongoDB persistence, and role-protected endpoints.
- Implemented administrator registration with transactional auditing and the command to initialize the first administrator.
- Fixed the architecture control that failed silently when a file was missing, including UTF-8 tests.


**Related user stories:** HU-FE-03, HU-FE-04, HU-WKF-02, HU-PRO-08, HU-PRO-09, HU-PRO-10, HU-DOCS-90, HU-VEN-06 through HU-VEN-09, and HU-AUTH-13/14.


**Evidence**

- [Weekly status README — Week 10](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/blob/main/10-week/hu-status/README.md)
- [PR #218 — Design system and API contract corrections](https://github.com/code-corhuila/synkro-docs/pull/218)
- [Commit `e7c0880af08b4ed064f1135d9fabf6cefe33292e` — Week 10 progress record](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/e7c0880af08b4ed064f1135d9fabf6cefe33292e)
- [Commit `c4c3e8476aece0cb805637fb63485a98ea4e9763` — Protected administrator initialization and integration tests](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/c4c3e8476aece0cb805637fb63485a98ea4e9763)
- [Commit `0267eccf5b3d9289724c2ab38d9d2a891c63c204` — Sales reports and MongoDB aggregations](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/0267eccf5b3d9289724c2ab38d9d2a891c63c204)
- [Commit `237aa7a375bbbfdfc895b3983e3b4117c80e35f1` — Sales integration and persistence](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/237aa7a375bbbfdfc895b3983e3b4117c80e35f1)
- [Commit `5aea68f8009188d6b0c371dc5599e53f2e080a6a` — Inventory alert endpoints and tests](https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/5aea68f8009188d6b0c371dc5599e53f2e080a6a)

**PR/follow-up information pending completion:** the Week 10 README indicates that some work items did not have a PR URL recorded in the table: HU-PRO-08, HU-VEN-06, HU-VEN-07, HU-VEN-08, HU-VEN-09, and HU-DOCS-90. For HU-PRO-09, HU-PRO-10, and HU-AUTH-13/14, the available links point to board issues rather than PRs. These links are useful for follow-up, but they must not be presented as PRs:

- [HU-PRO-09 — issue #198](https://github.com/code-corhuila/synkro-docs/issues/198)
- [HU-PRO-10 — issue #199](https://github.com/code-corhuila/synkro-docs/issues/199)
- [HU-AUTH-13/14 — issue #214](https://github.com/code-corhuila/synkro-docs/issues/214)
- [HU-FE-03 — issue #183](https://github.com/code-corhuila/synkro-docs/issues/183)
- [HU-FE-04 — issue #188](https://github.com/code-corhuila/synkro-docs/issues/188)
- [HU-WKF-02 — issue #190](https://github.com/code-corhuila/synkro-docs/issues/190)


## 3. Evidence summary

| Week | Main evidence | Identification status |
|---|---|---|
| 06 | Weekly README and changes to `scope.md` | Specific SHA/PR is missing from the report |
| 07 | HU-DOCS-25 commit, matrix, and events | The README confirms merged PRs but does not provide all their numbers |
| 08 | PRs #51 and #57; ADR and models | Main PRs identified; numbers are missing for other referenced PRs |
| 09 | PRs #134, #140, #161, #165, #177, and #179 | Links identified |
| 10 | PR #218 and commits from the individual repository | Commits identified; PR links are missing for several coding user stories |


## 4. Final observation


The weekly READMEs document the scope and results of the work, but not all of them include the SHAs or PR links for each user story. Therefore, this appendix distinguishes between a **PR**, a **commit**, a **tracking issue**, and a **descriptive README**. Before submission, the pending evidence from Week 06, the documentation PRs from Week 07, and the coding PRs from Week 10 should be completed using the actual GitHub pages. No identifiers have been fabricated, and issues have not been treated as PRs.