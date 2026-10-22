<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       11-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 11

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: SynkroTech SAS
- SPRINT_GOAL: 

## 1. User stories worked this week
| HU ID | Title | Status (todo/doing/done) | Evidence (PR or commit URL) |
|---|---|---|---|
| N/A — individual workshop | W11 observability workshop (Delivery 1: CP0–CP4, and Delivery 2: CP6–CP10) — not a team-board HU; graded individually per the professor's own rubric, separate from the sprint backlog | done | https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/859157aba752b2ecbbd08e764d33fa27dba53c68 , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/15412c98bb2e18ea97851b987e815a85e7432e7f , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/ed7acb1205a14a039bd9e46dae9d8393b7ee9a64 , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/4c81af07f54a7305b1fa91b21dc15d1d42483b18 , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/9f25f1c3dad83c26b3b957ffddc6793826f06356 , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/e9900b4869e0542d886bd5aceec2bad9f3a337ac , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/4528500775dee08848085e9a75495957123b680b , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/1be07b14f907429b103f1015f75e8639c92a383e , https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/46065fdbc31935aeeb969e458fc373d4fde38c0c , |


## 2. My individual contribution

- Mapped the `register-sale` critical journey end to end (`POST /api/v1/sagas/register-sale`) across `synkro-front`, `synkro-api-gateway`, `synkro-workflow`, `synkro-customers-api`, `synkro-products-api` and `synkro-sales-api`, with the real hop table, a Mermaid sequence diagram and the span tree (CP1).
- Defined the structured JSON log contract the whole team can filter by `trace_id`: 11 mandatory fields plus 5 domain fields (`sagaId`, `customerId`, `productId`, `quantityRequested`, `unitPriceCents`), the "never log" list for personal data and credentials, and 7 real example log lines covering a downstream timeout and a business-rule rejection (CP2).
- Built and ran a standalone Go instrumentation module (`11-week/workshop/03-instrumentation/synkro-products-api/`): a trace-context middleware, a structured logger matching the CP2 contract, an outbound client that propagates `X-Correlation-Id` on the one real outgoing call of the journey (`reserve-stock`), two golden-signal metrics exposed in Prometheus text format, and an automated test proving the trace ID received equals the one forwarded downstream.
- Wrote the golden-signal metric catalog for all 5 services of the journey, with bounded labels, a cardinality estimate, a forbidden-label list, and histogram buckets justified against two real configured values (`cross-cutting.md` §8's 5s outgoing-call timeout and `synkro-workflow`'s own `SAGA_REQUEST_TIMEOUT=10s`) (CP4).
- Defined three SLOs for the journey (availability, latency, and a product-specific stock-reservation correctness SLO tied directly to `vision.md`'s "Real-time accuracy" pillar), with exact PromQL on the CP4 metrics, a stated traffic assumption, and the error budget computed in both requests and minutes, plus the team's 50/75/100% burn policy (CP6).
- Wrote two multi-window Prometheus burn-rate alert rules for the availability SLO (fast: 14.4x/1h; slow: 6x/6h), validated with a real `promtool check rules` run, and the policy document explaining how much budget each alert represents before firing and two alert types deliberately not built, with reasons (CP7).
- Wrote the runbook for the fast-burn alert: symptoms, PromQL and log-by-`trace_id` confirmation, three mitigations ordered by risk (explicitly excluding a feature flag, since SynkroTech has none), escalation using the team's real roles, and recovery verification (CP8).
- Ran a full incident drill grounded in the real locking code of `synkro-products-api` (`postgres_stock.go`'s `lockProducts`): a span tree and CP2-format logs for one slow request, the real SLI values reached on all three SLOs, and the honest finding that **no alert in `06-alerts.yml` would have fired** for this specific (latency-only) incident. Wrote a blameless postmortem with a timeline, impact, root cause, contributing factors and three user stories with verifiable acceptance criteria (CP9).

## 3. Blockers and risks

- The workshop environment has no outbound network access to `proxy.golang.org`, so the instrumentation module (CP3) could not use an external Go module (`google/uuid`); resolved by generating trace/span IDs with the standard library's `crypto/rand` instead.
- This workshop's code lives in its own standalone module (`03-instrumentation/`), not inside the real `synkro-products-api` repository — carrying the same middleware/logger pattern into the real service (so it actually injects `trace_id`/`span_id`/`event`/`duration_ms` in production, not just in this demo) is still pending and is not yet a tracked HU.
- The CP9 incident drill exposed two real gaps that the team should decide whether to track as actual work: (1) no burn-rate alert exists for the Latency SLO, only for Availability, and (2) `synkro-workflow`'s Circuit Breaker only counts consecutive failures, not slow-but-successful calls, so it would not have protected against the drilled scenario.
- All ten checkpoints had to land as their own commit and push (Rule 2/Rule 3 of the workshop, with a minimum 15-minute gap between Delivery 2's pushes), so the git history for this week is intentionally granular — more commits than usual, by design.

## 4. Plan for next week

- Propose the three CP9 postmortem action items as real tracked HUs for the team board: a Latency-SLO burn-rate alert, a slow-call threshold on the Circuit Breaker, and per-product backpressure on `reserve-stock`.
- Propose turning "carry the CP3 instrumentation pattern into the real `synkro-products-api` service" into an actual tracked HU, now that the pattern is proven to compile, run and pass its test.
- Bring the SLOs and traffic assumption from `05-slo.md` to the team for review — they were built on an explicit, stated assumption (≈ 50 sales/day) that the team should confirm or correct with real numbers if they have them.

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
- https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/e9900b4869e0542d886bd5aceec2bad9f3a337ac
- https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/4528500775dee08848085e9a75495957123b680b
- https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/1be07b14f907429b103f1015f75e8639c92a383e
- https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/46065fdbc31935aeeb969e458fc373d4fde38c0c