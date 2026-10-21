<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       11-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 11

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: SynkroTech SAS
- SPRINT_GOAL: 
<!-- CONFIG-END -->

## 1. User stories worked this week
| HU ID | Title | Status (todo/doing/done) | Evidence (PR or commit URL) |
|---|---|---|---|
| N/A — individual workshop | W11 observability workshop (Delivery 1: CP0–CP4) — not a team-board HU; graded individually per the professor's own rubric, separate from the sprint backlog | done | https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/859157aba752b2ecbbd08e764d33fa27dba53c68 , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/15412c98bb2e18ea97851b987e815a85e7432e7f , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/ed7acb1205a14a039bd9e46dae9d8393b7ee9a64 , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/4c81af07f54a7305b1fa91b21dc15d1d42483b18 , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/9f25f1c3dad83c26b3b957ffddc6793826f06356 |



## 2. My individual contribution

- Mapped the `register-sale` critical journey end to end (`POST /api/v1/sagas/register-sale`) across `synkro-front`, `synkro-api-gateway`, `synkro-workflow`, `synkro-customers-api`, `synkro-products-api` and `synkro-sales-api`, with the real hop table, a Mermaid sequence diagram and the span tree (CP1).
- Defined the structured JSON log contract the whole team can filter by `trace_id`: 11 mandatory fields plus 5 domain fields (`sagaId`, `customerId`, `productId`, `quantityRequested`, `unitPriceCents`), the "never log" list for personal data and credentials, and 7 real example log lines covering a downstream timeout and a business-rule rejection (CP2).
- Built and ran a standalone Go instrumentation module (`11-week/workshop/03-instrumentation/synkro-products-api/`): a trace-context middleware, a structured logger matching the CP2 contract, an outbound client that propagates `X-Correlation-Id` on the one real outgoing call of the journey (`reserve-stock`), two golden-signal metrics exposed in Prometheus text format, and an automated test proving the trace ID received equals the one forwarded downstream.
- Wrote the golden-signal metric catalog for all 5 services of the journey, with bounded labels, a cardinality estimate, a forbidden-label list, and histogram buckets justified against two real configured values (`cross-cutting.md` §8's 5s outgoing-call timeout and `synkro-workflow`'s own `SAGA_REQUEST_TIMEOUT=10s`) (CP4).

## 3. Blockers and risks

- The workshop environment has no outbound network access to `proxy.golang.org`, so the instrumentation module (CP3) could not use an external Go module (`google/uuid`); resolved by generating trace/span IDs with the standard library's `crypto/rand` instead.
- This workshop's code lives in its own standalone module (`03-instrumentation/`), not inside the real `synkro-products-api` repository — carrying the same middleware/logger pattern into the real service (so it actually injects `trace_id`/`span_id`/`event`/`duration_ms` in production, not just in this demo) is still pending and is not yet a tracked HU.
- Delivery 1's five checkpoints (CP0–CP4) must each land as their own commit and push (Rule 2/Rule 3 of the workshop), so the git history for this week is intentionally granular — more commits than usual, by design.

## 4. Plan for next week

- Delivery 2 of the W11 workshop (CP6–CP10, due Thursday 2026-10-22): SLOs and error budget, burn-rate alerts, a runbook, and an incident drill with a blameless postmortem.
- Propose turning "carry the CP3 instrumentation pattern into the real `synkro-products-api` service" into an actual tracked HU for the team board, now that the pattern is proven to compile, run and pass its test.

## 5. Compliance self-check
- [x] Conventional Commits - `type(scope): summary`
- [ ] Per-environment HU branch + PR to that environment (hu-xxx-dev -> develop, ...) <!-- N/A this week: this is the individual W11 workshop inside my own fork, not a team HU with env branches -->
- [ ] Testable acceptance criteria <!-- N/A: the workshop is graded by the professor's own CP rubric, not HU acceptance criteria -->
- [x] Tests added/updated (unit / integration) — `outbound/products_client_test.go` (CP3)
- [ ] DDD / hexagonal boundaries respected (domain has no I/O) <!-- N/A: this is a standalone workshop module, not one of the team's hexagonal -api repos -->
- [x] No secrets; config via environment variables

## 6. Evidence links

- https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/859157aba752b2ecbbd08e764d33fa27dba53c68
- https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/15412c98bb2e18ea97851b987e815a85e7432e7f
- https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/ed7acb1205a14a039bd9e46dae9d8393b7ee9a64
- https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/4c81af07f54a7305b1fa91b21dc15d1d42483b18
- https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/9f25f1c3dad83c26b3b957ffddc6793826f06356