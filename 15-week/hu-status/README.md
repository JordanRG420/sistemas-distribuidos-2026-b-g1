<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       15-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 15

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: Group 10 - synkro-tech
- SPRINT_GOAL: Reconcile Customers and Sales contracts and acceptance; advance safe password reset, Workflow resilience and Products store integrity with attributable evidence.
<!-- CONFIG-END -->

## 1. User stories worked this week

| HU ID | Title | Status (todo/doing/done) | Evidence (PR or commit URL) |
|---|---|---|---|
| HU-CLI-05 (#304) | Complete customer contacts, search and ADMIN reactivation | done | [Issue #304](https://github.com/code-corhuila/synkro-docs/issues/304); [shared delivery record](https://github.com/code-corhuila/synkro-docs/pull/300) |
| HU-DOCS-98 (#266) | Reconcile Final Delivery and Closure Evidence | doing | [Issue #266](https://github.com/code-corhuila/synkro-docs/issues/266); [author commit e9de4bea](https://github.com/code-corhuila/synkro-docs/commit/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1) |
| HU-ARQ-30 (#307) | Formalize customer contract extensions and yearly sale references | doing | [Issue #307](https://github.com/code-corhuila/synkro-docs/issues/307); [author commit 9e88794c](https://github.com/code-corhuila/synkro-docs/commit/9e88794c5490d20818e2586d4bae6036edadc8e3) |
| HU-ARQ-32 (#311) | Decide how customer search handles documents equal under case/accent folding | doing | [Issue #311](https://github.com/code-corhuila/synkro-docs/issues/311); [author commit ed9c4e9c](https://github.com/code-corhuila/synkro-docs/commit/ed9c4e9c9d8ea55dd75289b55d8f527a77a0591e) |
| HU-ARQ-31 (#309) | Formalize the ADMIN password-reset endpoint and replay safety | doing | [Issue #309](https://github.com/code-corhuila/synkro-docs/issues/309); [shared delivery source 524dcc61](https://github.com/code-corhuila/synkro-docs/commit/524dcc61e5815b0bc983520afa6bbc6fc380765c) |
| HU-AUTH-19 (#306) | Allow ADMIN to reset user passwords | doing | [Issue #306](https://github.com/code-corhuila/synkro-docs/issues/306); [shared delivery source 8b812764](https://github.com/code-corhuila/synkro-auth-api/commit/8b812764de0979fa1cb7a3446fa7b0e2093790eb) |

Period: November 9–15, 2026, America/Bogota. Prepared November 15 from available repository objects and current GitHub issue records. Status is reconstructed at the end of this week from recorded closure dates. `doing` includes implementation, verification, review and reconciliation; it does not certify a board status. Issue closure does not certify main promotion or deployment.

## 2. My individual contribution

- Corrected the Customers verification harness cleanup/waits and the database outOfOrder guard; continued the Customers delivery and documentation handoff.
- Authored customer/yearly-reference architecture decisions and acceptance updates, the ambiguous-document proposal, password-reset receipt/fencing acceptance text and subsequent Auth evidence reconciliation. Architectural authoring is separate from backend implementation.

- The inventory below attributes source changes to the Git author email `jramirez-2023a@corhuila.edu.co`. Story ownership, review coordination and implementation authorship are different facts. A story assigned to a teammate is included only as supporting work; its implementation is attributed by the commits below.

- Full commit subjects, immutable source links and promotion classification are retained. Cherry-picks are listed as promotion evidence and are not counted as new features. Dates use the original author timestamp in Colombia; a later promotion does not move original implementation into another week.

- Customers contact/search/reactivation changes and documentation reconciliation are attributed from the original Jordan commits. Dashboard, theme and Users ownership does not make teammate-authored implementation my original code.

**synkro-customers-api**

| Date (Colombia) | Source author contribution | Evidence |
|---|---|---|
| 2026-11-10 21:44:14 | fix(customers): bound the verification harness waits and always clean up its own resources | [3da0eae3](https://github.com/code-corhuila/synkro-customers-api/commit/3da0eae30c486a4a1af120d49ee8165330a1b9d9) |
| 2026-11-10 21:44:14 | Promotion/reapplication: fix(customers): bound the verification harness waits and always clean up its own resources | [759e67fa](https://github.com/code-corhuila/synkro-customers-api/commit/759e67fa2d868e583c7979a982ef632f5c88b93f) |
| 2026-11-10 21:44:14 | Promotion/reapplication: fix(customers): bound the verification harness waits and always clean up its own resources | [a5600fb5](https://github.com/code-corhuila/synkro-customers-api/commit/a5600fb54ad10c475a04f435a334403f9ecbcdb5) |

**synkro-customers-db**

| Date (Colombia) | Source author contribution | Evidence |
|---|---|---|
| 2026-11-10 21:31:49 | Promotion/reapplication: fix(customers-db): make the outOfOrder guard detect the real flyway.toml spelling | [75949d3f](https://github.com/code-corhuila/synkro-customers-db/commit/75949d3fda399568efcc4aaf1623dbf91690e4f6) |
| 2026-11-10 21:31:49 | fix(customers-db): make the outOfOrder guard detect the real flyway.toml spelling | [a78c8513](https://github.com/code-corhuila/synkro-customers-db/commit/a78c8513081dc017a012dee1cf4ff43f21a04b9d) |
| 2026-11-10 21:31:49 | Promotion/reapplication: fix(customers-db): make the outOfOrder guard detect the real flyway.toml spelling | [d56f31e2](https://github.com/code-corhuila/synkro-customers-db/commit/d56f31e27cae8519c3a151c2300c3fe9b9ea7e69) |

**synkro-customers-portal**

| Date (Colombia) | Source author contribution | Evidence |
|---|---|---|
| 2026-11-10 21:34:13 | Promotion/reapplication: fix(customers): recognise the real duplicate-document response of the API | [5043760b](https://github.com/code-corhuila/synkro-customers-portal/commit/5043760b0e2982e7f4f542c4a937c9c43e9c1d39) |
| 2026-11-10 21:34:13 | fix(customers): recognise the real duplicate-document response of the API | [78099cc4](https://github.com/code-corhuila/synkro-customers-portal/commit/78099cc434d31a683e9aa46cd6418e76bbe5cbeb) |
| 2026-11-10 21:34:13 | Promotion/reapplication: fix(customers): recognise the real duplicate-document response of the API | [cb66edfd](https://github.com/code-corhuila/synkro-customers-portal/commit/cb66edfd2d0d72d6b7959f89187fa7fd9e6e79e1) |

**synkro-docs**

| Date (Colombia) | Source author contribution | Evidence |
|---|---|---|
| 2026-11-10 07:40:37 | docs(architecture): specify customer contracts and yearly sale references | [9e88794c](https://github.com/code-corhuila/synkro-docs/commit/9e88794c5490d20818e2586d4bae6036edadc8e3) |
| 2026-11-10 12:41:34 | docs(project-control): consolidate reconciliation in existing verification log | [e9de4bea](https://github.com/code-corhuila/synkro-docs/commit/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1) |
| 2026-11-10 12:57:02 | docs(architecture): record ADR acceptance and consolidate API guidance | [5de3a03a](https://github.com/code-corhuila/synkro-docs/commit/5de3a03a9c171aba61ed38158da2fc8ef50367f6) |
| 2026-11-10 13:07:03 | docs(architecture): correct ADR reviewer attribution | [33d532b2](https://github.com/code-corhuila/synkro-docs/commit/33d532b29c540b5f1bcfc038d3706a9ca401648f) |
| 2026-11-10 13:12:35 | docs(project-control): consolidate customer sales and password-reset stories | [553231e6](https://github.com/code-corhuila/synkro-docs/commit/553231e6ae1e832fa525585dd3e9ea0e027c5afa) |
| 2026-11-10 21:03:45 | docs(architecture): accept reset receipts and concurrent login fencing | [a7004cf4](https://github.com/code-corhuila/synkro-docs/commit/a7004cf448d1ddf246e02f2c6d102cdd64e3b295) |
| 2026-11-10 21:45:39 | docs(architecture): propose ADR-022 for ambiguous exact document matches | [ed9c4e9c](https://github.com/code-corhuila/synkro-docs/commit/ed9c4e9c9d8ea55dd75289b55d8f527a77a0591e) |
| 2026-11-14 22:30:55 | docs(auth): reconcile password reset evidence and operator responsibility | [58ba3c95](https://github.com/code-corhuila/synkro-docs/commit/58ba3c95f4861d20ebc40b087e45610fd10b97c8) |

## 3. Blockers and risks

- Several issues remain open despite implemented code. Review, QA/main publication, persistent rollout and final documentary closure have separate evidence requirements.

- GitHub Actions billing/startup failures are not passing tests. Historical local verification is reported by its owning record; no application suite was rerun to prepare this package.

- HU-AUTH-15/16/17 were reused by earlier security issues #278/#279/#280 and functional issues #292/#293/#302. Use the issue number to disambiguate.

- Evidence is limited to available local Git references, read alongside the current GitHub issues. Unpublished changes, unrecorded reviews and personal activity outside these references are not inferred.

## 4. Plan for next week

- Complete remaining review, publication and acceptance gates for the stories above with exact tested and integrated revisions.

- Reconcile implementation and contracts in the existing project documents; retain unresolved gaps and their owners.

- Update the personal weekly status from actual new evidence and coordinate any identifier correction through the shared register.

## 5. Compliance self-check

- [x] Conventional Commits - `type(scope): summary`

- [ ] Per-environment HU branch + PR to that environment (hu-xxx-dev -> develop, ...)

- [x] Testable acceptance criteria

- [ ] Tests added/updated (unit / integration)

- [ ] DDD / hexagonal boundaries respected (domain has no I/O)

- [x] No secrets; config via environment variables

The checked items describe the inspected commit naming, linked story criteria and sanitized evidence selection. Unchecked items require the contributor to confirm the complete weekly scope: source tests are included/linked, but this packaging task neither reruns them nor performs an independent whole-system architecture or environment-promotion audit.

## 6. Evidence links

- [HU-CLI-05 — Complete customer contacts, search and ADMIN reactivation](https://github.com/code-corhuila/synkro-docs/issues/304)

- [HU-DOCS-98 — Reconcile Final Delivery and Closure Evidence](https://github.com/code-corhuila/synkro-docs/issues/266)

- [HU-ARQ-30 — Formalize customer contract extensions and yearly sale references](https://github.com/code-corhuila/synkro-docs/issues/307)

- [HU-ARQ-32 — Decide how customer search handles documents equal under case/accent folding](https://github.com/code-corhuila/synkro-docs/issues/311)

- [HU-ARQ-31 — Formalize the ADMIN password-reset endpoint and replay safety](https://github.com/code-corhuila/synkro-docs/issues/309)

- [HU-AUTH-19 — Allow ADMIN to reset user passwords](https://github.com/code-corhuila/synkro-docs/issues/306)

- Included evidence: 37 actual versioned file snapshots. Files from `synkro-docs` are under `docs/`; files from code repositories, including their own tests/configuration/documentation, are under `code/<repository>/`.

- Each snapshot is the latest selected author-touch of that path in this week, not a complete runnable repository or a single integrated release. Shared files can contain earlier teammate work. The commit and Git blob identify the exact copied content.

| Local file | Immutable repository file | Git blob | SHA-256 |
|---|---|---|---|
| [docs/01-context/scope.md](./docs/01-context/scope.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1/01-context/scope.md) | `2d890a680b4efefa24e6859bf329133aac21efc9` | `9782807cdc29698ffe43de52b4d0b9bf8a12c0925d4ccea9df1c187bb3d15ed3` |
| [docs/05-architecture/deployment.md](./docs/05-architecture/deployment.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1/05-architecture/deployment.md) | `8a71cdd6d053674215928b7ec797156d9d0b02c3` | `bd86513a264ba84d1b0032ece7ae34a268d290f520f3c8aad652ec74cf9ba913` |
| [docs/08-uml/diagram-index.md](./docs/08-uml/diagram-index.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1/08-uml/diagram-index.md) | `6c6b287060850cf723b34f4cfa662569f000fd5a` | `cfee5f14b1f2f013352b1b7915b5ce051d1c83a1d0e819c80d6799feb4bd857c` |
| [docs/09-microservices/service-catalog.md](./docs/09-microservices/service-catalog.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1/09-microservices/service-catalog.md) | `29694cb88349618fe8e8d03c695ffe3a27151a2d` | `dc9bb721d9d638d1442ce20c24aa1cc0f495d56f58a50295d11eb769070bcae0` |
| [docs/10-devops/releases/2.0.0.md](./docs/10-devops/releases/2.0.0.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1/10-devops/releases/2.0.0.md) | `b6225c3102c6cb6534e263e753a6265f34715834` | `e298d935b19ebaa9b49c7be28dcf24c5fc888fec83caf14e0588ab2fbda2bdee` |
| [docs/15-project-control/README.md](./docs/15-project-control/README.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1/15-project-control/README.md) | `da8c192f7128a3c5304db50f2f695d8d77dc2204` | `37fe8462afe899da2e50c1118d8f3a254c0d6896548e343fbcbd9dd2e7432e01` |
| [docs/15-project-control/open-questions.md](./docs/15-project-control/open-questions.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1/15-project-control/open-questions.md) | `410c355906b059c631cc347b338ad4094c4052aa` | `4bddf49c953dfe1c094cca781fb59960e0c7a52b0f872af1bfee8d0b44327864` |
| [docs/README.md](./docs/README.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1/README.md) | `64b30fb4d4401212ed70cb8e3f44ec4d2447043f` | `a5f60f12d947018c4e04ac62be12bc978b04fa5d78eba51f45c3eba7d172b576` |
| [docs/02-domain/entities-and-rules.md](./docs/02-domain/entities-and-rules.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/5de3a03a9c171aba61ed38158da2fc8ef50367f6/02-domain/entities-and-rules.md) | `d5b2658084f2846dd54c80c815f8c951b99b03d0` | `a168561f4d1980e1abc9661ad7fa377f7d5fa790514093fc9994fdf1d0c5d89b` |
| [docs/07-api/README.md](./docs/07-api/README.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/5de3a03a9c171aba61ed38158da2fc8ef50367f6/07-api/README.md) | `eeda560ac8af24c4a363094a9d5a881561a1ac4a` | `51646a4c76a47bcd56c7ecba9973beef4dd1a36c73074ac066303fbd4aec30b7` |
| [docs/07-api/contracts/openapi/synkro-customers-api.yaml](./docs/07-api/contracts/openapi/synkro-customers-api.yaml) | [source](https://github.com/code-corhuila/synkro-docs/blob/5de3a03a9c171aba61ed38158da2fc8ef50367f6/07-api/contracts/openapi/synkro-customers-api.yaml) | `5e24c814535b036300317fa28588ec32807525e7` | `1efd7bf3c205aa0c11a26572a8a28c65f5c3c242da8c29a9a975cfbab21be576` |
| [docs/07-api/contracts/openapi/synkro-sales-api.yaml](./docs/07-api/contracts/openapi/synkro-sales-api.yaml) | [source](https://github.com/code-corhuila/synkro-docs/blob/5de3a03a9c171aba61ed38158da2fc8ef50367f6/07-api/contracts/openapi/synkro-sales-api.yaml) | `1bfb433d7716295dcc9458bbe2b29c9aef99c07e` | `ca5b976cbf3ac8c4807902cf1550aa536f3af2900e631e2f0d61d2326c39ab9f` |
| [docs/07-api/guidelines.md](./docs/07-api/guidelines.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/5de3a03a9c171aba61ed38158da2fc8ef50367f6/07-api/guidelines.md) | `68c2366d5a76f0915d79f0bce78f2863d2c718a8` | `fff7f0181bd611e2ea0bc3e34e73189b8bc7163b44394c7bf8b26f277f2a2aec` |
| [docs/05-architecture/decisions/records/ADR-019-customer-search-and-reactivation.md](./docs/05-architecture/decisions/records/ADR-019-customer-search-and-reactivation.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/33d532b29c540b5f1bcfc038d3706a9ca401648f/05-architecture/decisions/records/ADR-019-customer-search-and-reactivation.md) | `4659fad79cc318bfe8695b3306674da24c2ea903` | `58afbe215b51ab91a9f42c9e70e50316249aa3a4b36d7d018e3b28d55bc1772e` |
| [docs/05-architecture/decisions/records/ADR-020-yearly-commercial-sale-references.md](./docs/05-architecture/decisions/records/ADR-020-yearly-commercial-sale-references.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/33d532b29c540b5f1bcfc038d3706a9ca401648f/05-architecture/decisions/records/ADR-020-yearly-commercial-sale-references.md) | `bc2f60c96a5583a00f8143e91af9deeafc3b1b32` | `b3cbd2575550a92400d169bed067ac8856ed258b59aaf10150f5bfa002a2bf4a` |
| [docs/04-requirements/traceability-matrix.md](./docs/04-requirements/traceability-matrix.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/553231e6ae1e832fa525585dd3e9ea0e027c5afa/04-requirements/traceability-matrix.md) | `6a4a130223d768a65743c5aa07a4f7ca2501615d` | `35fcb6a2e5ef2f9d8c9438e4982a249cc4f893ee30fcc1e1d3a2289b6247861b` |
| [docs/04-requirements/user-stories.md](./docs/04-requirements/user-stories.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/553231e6ae1e832fa525585dd3e9ea0e027c5afa/04-requirements/user-stories.md) | `ee1fdef96a9aef544481ac5c6a273f9375b8e3f4` | `b6cd2ac6290ae63dbacbb454e42b785587317962264d3b5f8432c635b4e450e3` |
| [docs/10-devops/local-setup.md](./docs/10-devops/local-setup.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/553231e6ae1e832fa525585dd3e9ea0e027c5afa/10-devops/local-setup.md) | `39c1b08ccb3829794818c0e03ca2c91c6093c43f` | `6a36a81774c80289a27a061a9fb1bedfa79b78176b4bc4cec0b1d3e5a0b94fa5` |
| [docs/11-quality/testing-strategy.md](./docs/11-quality/testing-strategy.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/553231e6ae1e832fa525585dd3e9ea0e027c5afa/11-quality/testing-strategy.md) | `835899c7ce0dd3cdc19b906cf8b9c2510e568a70` | `51c6546d66ff6a7d5436c99ae156eccd4cb320f5d7e4aeee2e1ac577fd5127b3` |
| [docs/12-ux-ui/navigation-map.md](./docs/12-ux-ui/navigation-map.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/553231e6ae1e832fa525585dd3e9ea0e027c5afa/12-ux-ui/navigation-map.md) | `d139eaf794407a6a86008d84305b22317a424dc1` | `7049084cb169fdf4159fc0673b011053a46f511f0a39f3276bd01101a335b138` |
| [docs/15-project-control/documentation-verification.md](./docs/15-project-control/documentation-verification.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/553231e6ae1e832fa525585dd3e9ea0e027c5afa/15-project-control/documentation-verification.md) | `7d0e2d59498afa4ba5143c346beebef5caf8925c` | `05b3a0ea609b42df66a9fde3340736d9190c415bd58a273fc1acc70161488f5a` |
| [docs/00-governance/agile-conventions.md](./docs/00-governance/agile-conventions.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/553231e6ae1e832fa525585dd3e9ea0e027c5afa/00-governance/agile-conventions.md) | `9365e5b5156507128c6f3e747ae2394941f23016` | `342c5ccaeb4dc8730655eed7079014d5c34ed89f290185ace238c8d6e5c30613` |
| [docs/04-requirements/functional.md](./docs/04-requirements/functional.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/553231e6ae1e832fa525585dd3e9ea0e027c5afa/04-requirements/functional.md) | `948e4cf6abe9d7e1678bbcb9d1531762af9f7943` | `ee578de85387c0d5a5a8bdb4cc3d79dcf1002b2f9a854103c3d21eea0a2df77d` |
| [docs/05-architecture/decisions/records/ADR-021-admin-password-reset.md](./docs/05-architecture/decisions/records/ADR-021-admin-password-reset.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/a7004cf448d1ddf246e02f2c6d102cdd64e3b295/05-architecture/decisions/records/ADR-021-admin-password-reset.md) | `d0881f7d8c5f6a2dac9be96257d62e0ef2159321` | `01969b739a62a30f6eef72ce3a03bb64a339435573d9364d219b3a4a4f8a8085` |
| [code/synkro-customers-db/tests/contract.test.mjs](./code/synkro-customers-db/tests/contract.test.mjs) | [source](https://github.com/code-corhuila/synkro-customers-db/blob/d56f31e27cae8519c3a151c2300c3fe9b9ea7e69/tests/contract.test.mjs) | `9d343fad2ca91bb868af387ce9742d95fbd842f8` | `6a53f4b9091e5c6952709abb13a99b1dafe1867e29d0c10b76f7459e0f109afd` |
| [code/synkro-customers-portal/src/app/customers/model/errors.ts](./code/synkro-customers-portal/src/app/customers/model/errors.ts) | [source](https://github.com/code-corhuila/synkro-customers-portal/blob/cb66edfd2d0d72d6b7959f89187fa7fd9e6e79e1/src/app/customers/model/errors.ts) | `87586f06ac2fb9bdb16d4349be4498f1714a124a` | `c66feae13304cc0991c2a97fadcace3163085bd0568a833544839b848f092cac` |
| [code/synkro-customers-portal/src/app/customers/pages/customers-page.component.spec.ts](./code/synkro-customers-portal/src/app/customers/pages/customers-page.component.spec.ts) | [source](https://github.com/code-corhuila/synkro-customers-portal/blob/cb66edfd2d0d72d6b7959f89187fa7fd9e6e79e1/src/app/customers/pages/customers-page.component.spec.ts) | `b48c1a02fbc2255ca528a8fde7d53ecab14df94f` | `93bcfca0b9d5755ac18381a91fd53b8e82939eb0ba0f4a225cd57f02c10b2a9f` |
| [code/synkro-customers-api/.github/workflows/ci.yml](./code/synkro-customers-api/.github/workflows/ci.yml) | [source](https://github.com/code-corhuila/synkro-customers-api/blob/a5600fb54ad10c475a04f435a334403f9ecbcdb5/.github/workflows/ci.yml) | `45c4cdf815e2e7c0c77aa9fcc58fa76c5e3a1213` | `5d06b823a82a3b773e9943ceb79eb26a4bef5bc475cbd1ad77cec82a35973315` |
| [code/synkro-customers-api/docs/acceptance.md](./code/synkro-customers-api/docs/acceptance.md) | [source](https://github.com/code-corhuila/synkro-customers-api/blob/a5600fb54ad10c475a04f435a334403f9ecbcdb5/docs/acceptance.md) | `44347289a1cec0307a4daa1d4650c09ec0c2e29a` | `9403628d1924d0c3f56bc3c57aefb6fa0a4582f119df897eeb5d79490a0a4791` |
| [code/synkro-customers-api/tests/harness.mjs](./code/synkro-customers-api/tests/harness.mjs) | [source](https://github.com/code-corhuila/synkro-customers-api/blob/a5600fb54ad10c475a04f435a334403f9ecbcdb5/tests/harness.mjs) | `2f8c999a629a80340502891d5fadbb99b239cd5d` | `25b6b2ee37ea1c128fba6841e74746a1aa8157c556b0410119de81a307d3c8d0` |
| [code/synkro-customers-api/tests/harness.test.mjs](./code/synkro-customers-api/tests/harness.test.mjs) | [source](https://github.com/code-corhuila/synkro-customers-api/blob/a5600fb54ad10c475a04f435a334403f9ecbcdb5/tests/harness.test.mjs) | `b701e2cce303f39ed8c44624a0470851b0151467` | `aedfce4b49a821f2b8633fb681e3cf7cabe89a1f08833bda5701d2500f178efe` |
| [code/synkro-customers-api/tests/readiness.mjs](./code/synkro-customers-api/tests/readiness.mjs) | [source](https://github.com/code-corhuila/synkro-customers-api/blob/a5600fb54ad10c475a04f435a334403f9ecbcdb5/tests/readiness.mjs) | `a7158de9186449ca9da062fbec6d4e396887845c` | `b9c64b5782c5b6f21709323618b4b92f2f184098875e106bcc3499981e5dd534` |
| [code/synkro-customers-api/tests/runtime.mjs](./code/synkro-customers-api/tests/runtime.mjs) | [source](https://github.com/code-corhuila/synkro-customers-api/blob/a5600fb54ad10c475a04f435a334403f9ecbcdb5/tests/runtime.mjs) | `e484cc0ab77c22108f2ba13cb0b55f736ae044b6` | `379d38049e0d3ad856cd41de2fab95b7f7cf79d76441c8562bd27b2c86ba2ee4` |
| [code/synkro-customers-api/tests/verify.mjs](./code/synkro-customers-api/tests/verify.mjs) | [source](https://github.com/code-corhuila/synkro-customers-api/blob/a5600fb54ad10c475a04f435a334403f9ecbcdb5/tests/verify.mjs) | `e28f51ab889fca6ae04a06ed5791a8ca6b054586` | `d9795a442b452da35fdc79d9f619cb7fe5a43d3830df654582cad1945eed274a` |
| [docs/05-architecture/decisions/README.md](./docs/05-architecture/decisions/README.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/ed9c4e9c9d8ea55dd75289b55d8f527a77a0591e/05-architecture/decisions/README.md) | `67c9c73c35c4ab6a10152ecd166a17e349d224cd` | `712864e72151d5d64203de8f36e63b67394938c3651f92cd6e15033e07c7e5b3` |
| [docs/05-architecture/decisions/records/ADR-022-ambiguous-exact-document-matches.md](./docs/05-architecture/decisions/records/ADR-022-ambiguous-exact-document-matches.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/ed9c4e9c9d8ea55dd75289b55d8f527a77a0591e/05-architecture/decisions/records/ADR-022-ambiguous-exact-document-matches.md) | `6b849d250072ccdc4e90881054754e2af213ea26` | `f37303938a3330656044795924ca514cb8766fe1cb4117336a66f78c85896f6c` |
| [docs/06-data/data-dictionary.md](./docs/06-data/data-dictionary.md) | [source](https://github.com/code-corhuila/synkro-docs/blob/58ba3c95f4861d20ebc40b087e45610fd10b97c8/06-data/data-dictionary.md) | `1be20fd2728fda5c38c317cfc79dd99c2bc1388e` | `d84ecd479e566054151190fede837f1e8a544f9303b09115c50481bf769f93b2` |

**Deleted paths (recorded, not recreated):**

- `synkro-docs/15-project-control/evidence/feature-acceptance-2026-11-08.json` — [commit](https://github.com/code-corhuila/synkro-docs/commit/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1).

- `synkro-docs/15-project-control/final-delivery-reconciliation-2026-11-08.md` — [commit](https://github.com/code-corhuila/synkro-docs/commit/e9de4bea19cc953bef4bdfa3c82cb5a7caae3de1).

- `synkro-docs/07-api/customer-sales-integration.md` — [commit](https://github.com/code-corhuila/synkro-docs/commit/5de3a03a9c171aba61ed38158da2fc8ef50367f6).
