# Final delivery reconciliation — 2026-11-08

## Authority and delivery boundary

[HU-DOCS-98/#266](https://github.com/code-corhuila/synkro-docs/issues/266) is the documentation story; [PR #300](https://github.com/code-corhuila/synkro-docs/pull/300) is its single remaining delivery. The existing ADMIN-search contract is retained and checked against the selected Auth source. This record reports source-backed facts; it creates no runtime behavior, ADR, release/tag, environment, approval or feature-story closure.

Read-only GitHub issue/PR/review inspection on 2026-11-08 found 198 non-PR issues (175 closed, 23 open). This is not the HU count: it includes epic/security/claim issues. The current identifier tables contain 84 uniquely linked assignments, seven open: DOCS-98 and the six feature HUs below. Cut 9 remains five closed HUs. The five original post-Cut-9 assignments are four closed and DOCS-98 open; the four runtime follow-ups #291–#294 are closed. No Project Status/Environment field is claimed verified or changed.

## Already-published evidence

| Scope | Actual publication | Remaining distinction |
|---|---|---|
| DOCS-97/#256 | PRs [#261](https://github.com/code-corhuila/synkro-docs/pull/261) and [#262](https://github.com/code-corhuila/synkro-docs/pull/262) merged on 2026-10-25; issue closed | Ten diagram pairs retain their dated snapshot and original scope |
| INF-02/#239 | Docs [#290](https://github.com/code-corhuila/synkro-docs/pull/290) merged 2026-11-02, `d505ef4a34f8dcfafc742fab4104812655286951`; issue closed | Original two exact-root 21/21 runs and scoped authorization remain in the [canonical catalog](infra-final-acceptance-2026-11-02.md) |
| INF-05/#263, PRO-14/#264, WRK-02/#265, ARQ-29/#287 | Issues closed; Worker run-key/budget correction and main publication recorded in that catalog | Residual execution/operational limits do not mean the Worker job is absent |
| Component v2.0.0 releases | Existing [annotated tag objects and peeled commits](evidence/component-releases-2026-11-02.json) rechecked against GitHub | Tags remain at their original commits; no later feature is retroactively part of v2.0.0 |

## Current QA features and proposed main order

All six HUs #297/#298/#299/#301/#302/#303 remain OPEN. They cover bounded ADMIN user search, interactive trends, authorized Excel exports, non-fiscal sale PDF/XML, service-token issuance/known-ID metadata and theme/sidebar/navigation/logout. The [matrix](../04-requirements/traceability-matrix.md#six-feature-qa-traceability--2026-11-08) links each requirement to frozen tests and implementation; the [navigation map](../12-ux-ui/navigation-map.md) describes the actual UI.

| Owner | Main PR prerequisites, in order | Current gate |
|---|---|---|
| Auth API → Auth Portal | [API43](https://github.com/code-corhuila/synkro-auth-api/pull/43) → [Portal19](https://github.com/code-corhuila/synkro-auth-portal/pull/19) → [Portal22](https://github.com/code-corhuila/synkro-auth-portal/pull/22) | Open; required Ariel approval not observed on these heads |
| Host | [50](https://github.com/code-corhuila/synkro-front/pull/50) | Open; theme precedes sidebar in its promotion history |
| Products | [29](https://github.com/code-corhuila/synkro-products-portal/pull/29) → [32](https://github.com/code-corhuila/synkro-products-portal/pull/32) | Open; retain shared prerequisites once |
| Sales | [54](https://github.com/code-corhuila/synkro-sales-portal/pull/54) → [57](https://github.com/code-corhuila/synkro-sales-portal/pull/57) → [60](https://github.com/code-corhuila/synkro-sales-portal/pull/60) | Open; QA document delivery already merged through Sales59 |
| Infra, last | [47](https://github.com/code-corhuila/synkro-infra-postgres/pull/47) → [50](https://github.com/code-corhuila/synkro-infra-postgres/pull/50) → [52](https://github.com/code-corhuila/synkro-infra-postgres/pull/52) → [54](https://github.com/code-corhuila/synkro-infra-postgres/pull/54) | Open; applications must meet their gates first; reviewer Ariel requested on 54 |

Infra QA53 merged as `70833cf188db226011c9ae2a0dc5a030f8415c5f`; its complete tree equals the checked public candidate `9a7d7339725cfd550428118ac190f337ed37a124`. It selects Sales `a4fb41c1e7482d4a7d73a022d6694561749b8606`, preserves Auth `ff8308101ca8a4c4133498105506dac87ad314da` and all other 16 entries. Main54 head `d4f9c515f354921edab83ce286e488a70b089b89` reuses the prior Infra52 history and `cherry-pick -x`, selecting equivalent Sales `40713494a04eae1c5a5cc80b0df59c9d9465b2cd` and Auth `8bb702e299b07a5b8dee2a7b2d99835c2588aa8b` application trees. Commit identity and environment pins remain distinct.

The Sales API lock intentionally retains `c355ce0742163af3563054ab6caa9985ae7599db`; its difference from current QA `ccd858a` is the earlier deployment/configuration selection, not a new business-source failure. Reconcile that owner's Compose/selection before repinning it; this documentation change does not silently change the lock.

## Exact acceptance and limits

The [exported acceptance summary](evidence/feature-acceptance-2026-11-08.json) records the previously executed attempt 3: 44 AUTH/regression plus 11 VEN19 checks, two fresh serial fixtures on one immutable 18-source composition, private root `a12b61b8babd6d5fa037fe577080deda611b9bc4`, public-lock SHA256 `555cf37cf0ba511deec7d4c8daa950e686454070e04d7ba580d5d1c231e93f31`. Strict validators checked all pins/root/hash, five actual PDF/XML pairs and XLSX readback. Both fixture cleanup, outer cleanup and export passed. Suite exit 0 is distinct from the enclosing policy's exit 2, LOCAL VALIDATION READY FOR REVIEW. This is not a new full 21-suite acceptance, coverage report or main runtime execution.

Failed attempts remain recorded: engine unavailable before execution (1); dashboard-heading wait failed after 26 checks with cleanup passed (2). Attempt3 passed unchanged source/assertions/configuration; no unproven failure cause is asserted. Previously reported 366 Infra contract cases (3 skips) and 37 private-validator unit tests are separate scopes, not another runtime acceptance.

The payload/fixture records remain the author's local evidence, identified by the exported hashes and the [QA53 delivery report](https://github.com/code-corhuila/synkro-infra-postgres/pull/53); no independent 55-check reproduction is claimed. This documentation task revalidates the retained export and source correspondence, without rerunning Docker or changing original evidence.

Hosted startup failures retain their actual status. The owner excludes confirmed billing-only failures; an unknown startup cause is not relabelled billing or green. Branch promotion is not persistent QA/production provisioning. Credentials from cleaned fixtures are retired; use the exact lock and a fresh private handoff for review.

## Pending work retained

Main application/Infra approvals and ordered integration, the six feature-HU checklists and formal closure remain separate. Inspect legacy `Closes` references before application merges: one dependency merge must not close a multi-owner HU early. DOCS-98 closure does not perform any of these actions.

[Technical debt](technical-backlog.md) retains lifecycle/storage, safe saga locks/retries/Circuit Breaker, health/schema and operational monitoring/recovery/admin-recovery evidence. [Q-001–Q-006](open-questions.md) retain their own actual PO/instructor answers; Q-006 is narrowed by implemented search/issue/lookup, not closed by those screens. Deferred daily closing, broker/outbox, per-product thresholds, JWKS and cross-tab coordination are not newly required MVP implementation.

## DOCS-98 task and acceptance map

| HU phase / scenario | Files or existing publication | Remaining gate |
|---|---|---|
| Published state; scenarios 1/2 | This record; identifier register; user-stories; release record; merged261/262/290; acceptance JSON | Preserve actual issue/PR/review states at final merge |
| Entry points/contributions/glossary | Root README; CONTRIBUTING; glossary | Fresh peer review |
| IDs/counts/test-to-code; scenario 4 | Agile conventions; backlog; functional statuses; traceability matrix; testing strategy | Product HUs remain open |
| Contract/screens/current guidance | Original PR300 Auth OpenAPI; Auth catalog/decisions; scope; navigation/wireframes; Q-006 | No unsupported list-all/fiscal/recovery claims |
| Diagrams; scenario 3 | Diagram index; nine source hashes plus decoded C4-02 model | Only stale C4-01 source-hash metadata corrected; geometry/visible labels unchanged |
| Release/deployment/setup | Existing release evidence; dated additions to deployment/local setup/release notes | No new tag, main execution or provisioned environment |
| Verification; scenario 5 | Dated verification entry and PR300 actual checks | Fresh peer and Ariel approval of final head, then normal main merge and issue checklist reconciliation |

The earlier Jordan approval on PR300 belongs to `a2d162dce96c85d681727c11e819570b38ec4892`; it does not certify this expanded change. Final review/merge remain pending. Close only DOCS-98 with the approved documentation delivery; no feature-HU closure or Project-field update is authorized by this record.

## Documentation checks performed

Local validation passed: 371 relative links/anchors, changed table widths, 84 unique registered assignments/seven open, nine source hashes and normalized C4-02 native model. C4-01's stale hash was corrected; replacing only its two hash strings leaves the SVG byte-identical, with unchanged geometry/visible labels. `git diff --check` passed; Accepted ADRs, diagram sources and workflow/protection files are unchanged.
YAML unique-key parsing and Swagger Parser's OpenAPI schema/reference validation passed, including ADMIN-search body-only filters, role/length/pagination boundaries and response codes. Two existing annotated release tags, peeled commits, trees and published release objects were rechecked read-only against GitHub. Retained attempt3 export passed the original strict joint validators; no Docker suite was rerun. These local documentation results are not hosted CI or approval evidence.
