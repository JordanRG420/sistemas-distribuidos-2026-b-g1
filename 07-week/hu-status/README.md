<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       07-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 07

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: Group - synkro-tech
- SPRINT_GOAL: Rebuild the traceability matrix with real project data and fill domain-events.md with SynkroTech's real events, covering the professor's sync/async and idempotency requirements.
<!-- CONFIG-END -->

## Docs Repository

| Board Name             | URL                                              |
|------------------------|--------------------------------------------------|
| synkro-docs Repository | https://github.com/code-corhuila/synkro-docs.git |

## Team Members

| Full Name                          | GitHub User                               |
|------------------------------------|-------------------------------------------|
| Angel Gustavo Solano Trujillo      | https://github.com/AsolanoT               |
| Sergio Andres Ordoñez Diaz         | https://github.com/SergioAndres17         |
| Fredman Santiago Plazas Artunduaga | https://github.com/SantiagoPlazas2005     |

## 1. User stories worked this week

| HU ID      | Title                                                        | Status | Evidence (PR or commit URL)                                                              |
|------------|--------------------------------------------------------------|--------|------------------------------------------------------------------------------------------|
| HU-DOCS-25 | Unify FR/NFR identifiers and disconnect PDR                  | done   | [`problem-framing.md`](https://github.com/code-corhuila/synkro-docs/commit/c4a6b763945a2497a1ee2d8cec73bc129aef4a3b#diff-4b88ee832e53bb966d2730050ba7c9a24a6d41c8520377d71105dad03b115793) |
| HU-DOCS-27 | Rebuild traceability matrix with real project data           | done   | `04-requirements/traceability-matrix.md`                                                  |
| HU-DOCS-29 | Fill domain-events.md with real SynkroTech events            | done   | `02-domain/domain-events.md`                                                              |

## 2. My individual contribution

**HU-DOCS-25 — Unify FR/NFR identifiers and disconnect PDR:**
- Updated `03-product/problem-framing.md` to remove all remaining
  references to the external PDR document and replace all `RF-`/`RNF-`
  prefixes with the unified `FR-`/`NFR-` three-digit format (e.g.
  `RF-01` → `FR-001`).

**HU-DOCS-27 — Rebuild traceability matrix:**
- Replaced the professor's unfilled template (`FR-001 [System allows
  user registration]`, `order-service`, `[date]` placeholders) with
  real SynkroTech data across all 10 FRs and 9 NFRs.
- Built the FR → HU → Test → Service matrix with honest status for each
  FR: the Corte 1 monolith implemented FR-001 through FR-007 without TDD,
  so none are marked Done; FR-008/FR-009 have no assigned HU yet;
  FR-010 is a simulated login only.
- Built the NFR → Validation matrix with honest status: 6 of 9 NFRs have
  no automated or manual validation yet.
- Added the Inverse Traceability table (HU → FR): only 2 real HUs map to
  FRs so far (the rest are documentation-only).
- Added an explicit "Identified Gaps" section: zero automated tests across
  all FRs, no coverage threshold defined, FR-008/FR-009/FR-010 gaps listed.
- Added a traceability note to `04-requirements/functional.md` documenting
  requirement origin after the PDR disconnection, and an NFR
  Reclassification Record to `04-requirements/non-functional.md`
  documenting the 5 category corrections from HU-DOCS-25.

**HU-DOCS-29 — Fill domain-events.md:**
- Filled `02-domain/domain-events.md` following the professor's template
  structure: added a Command vs. Event distinction section; built the
  sync/async decision table for all 11 real interactions in the system
  (not just the 2 new async ones), each with a justification; documented
  the 2 real events (`SaleCompleted` and `SaleFailed`) with full
  envelopes (JSON schema + real payload example) using the standard
  `eventId`/`aggregateId`/`correlationId`/`causationId` fields, where
  `correlationId` reuses the existing `X-Trace-Id` from `cross-cutting.md`
  instead of inventing a separate mechanism.
- Discarded the pre-ADR-003 event candidates (`SaleRequested`,
  `StockReserved`, `SaleCompensated`) with explicit justification: the
  Saga's 3 steps are synchronous REST calls within a single request —
  only the final outcome is a published event.
- Designed a genuinely idempotent consumer (not just asserted): explained
  why the generic "check a local DB for a processed eventId" pattern does
  not apply to `synkro-worker` (which has no database per ADR-003 §4),
  and specified a deterministic `Idempotency-Key` (`sale-completed-{saleId}`)
  as the mechanism, with a note that the example (sending a confirmation
  email) is hypothetical and not actual project scope.
- Added the DLQ configuration section with concrete values (3 retries,
  exponential backoff, 7-day retention), the schema evolution strategy,
  and the Policies table.

## 3. Blockers and risks

- The traceability matrix's "zero automated tests" finding is a real gap,
  not just a documentation observation — it becomes a blocker once the
  coding sprint starts. Flagged explicitly in the matrix's "Identified
  Gaps" section.
- The `domain-events.md` idempotency example is intentionally hypothetical
  (no email feature is in scope). If the team adds a real `synkro-worker`
  job in the coding sprint, the idempotency mechanism needs to be
  revisited with the actual job's constraints.

## 4. Plan for next week

- Follow up on professor's feedback on the merged PRs and address any
  requested corrections.
- Begin tracking HU-to-FR coverage as the first FRs move into
  implementation, so the traceability matrix can be updated in the same
  PR as the code.
- Coordinate with the team on the coding sprint kickoff strategy.

## 5. Compliance self-check

- [x] Conventional Commits - `type(scope): summary`
- [x] Per-environment HU branch + PR to `main` — branches `docs/unify-fr-nfr-and-disconnect-pdr`, `docs/update-traceability-matrix`, and `docs/add-domain-events-catalog`, all merged via PR approved by `ariel5253`
- [x] Testable acceptance criteria
- [x] Tests added/updated — N/A, documentation-only HU
- [x] DDD / hexagonal boundaries respected — N/A, no code touched this week
- [x] No secrets; config via environment variables — N/A

## 6. Evidence links

- Problem framing (HU-DOCS-25): [`problem-framing.md`](https://github.com/code-corhuila/synkro-docs/blob/main/03-product/problem-framing.md)
- Traceability matrix (HU-DOCS-27): [`traceability-matrix.md`](https://github.com/code-corhuila/synkro-docs/blob/main/04-requirements/traceability-matrix.md)
- Domain events (HU-DOCS-29): [`domain-events.md`](https://github.com/code-corhuila/synkro-docs/blob/main/02-domain/domain-events.md)
