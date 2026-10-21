# CP9 — Incident Drill and Blameless Postmortem

> Scenario: the downstream dependency of the hop marked in CP1 —
> `synkro-workflow`'s call to `synkro-products-api`'s
> `POST /api/v1/stock-reservations` (CP1 step 4, instrumented in CP3) —
> responds in 3 seconds instead of its usual tens of milliseconds, for
> 25% of requests, for 40 minutes.
>
> **Traffic note:** `05-slo.md` §0 assumes ≈ 50 `register-sale`
> requests/day (≈ 2/hour) — a literal 40-minute window at that average
> would contain only ~1 request, too few for "25% slow" to mean
> anything. To make this drill concrete, it is modeled during a busier
> period than the daily average: an end-of-day rush where several
> `SALESPERSON` staff register sales for the same handful of
> best-selling products at once — **20 `register-sale` attempts** in
> this 40-minute window, of which **5 (25%)** hit the slow path.

---

## 1. Trace of one slow request (span tree with durations)

All spans share one `trace_id`, in the same shape as `01-journey.md`'s
span tree, now with real durations:

```
- span: POST /api/v1/sagas/register-sale  [synkro-api-gateway]  (root span)
  trace_id: 7a2c9e41-...   span_id: f1a2b3c4   duration_ms: 3148
    - span: POST /sagas/register-sale  [synkro-workflow]  (child of root)
      trace_id: 7a2c9e41-...   span_id: a2b3c4d5   parent_span_id: f1a2b3c4   duration_ms: 3131
        - span: GET /api/v1/customers/{id}  [synkro-customers-api]  (child)
          trace_id: 7a2c9e41-...   span_id: b3c4d5e6   parent_span_id: a2b3c4d5   duration_ms: 44
        - span: POST /api/v1/stock-reservations  [synkro-products-api]  (child — THE SLOW HOP)
          trace_id: 7a2c9e41-...   span_id: c4d5e6f7   parent_span_id: a2b3c4d5   duration_ms: 3017
        - span: POST /api/v1/sales  [synkro-sales-api]  (child)
          trace_id: 7a2c9e41-...   span_id: d5e6f7a8   parent_span_id: a2b3c4d5   duration_ms: 58
```

`44 + 3017 + 58 = 3119ms` of sequential work inside the saga, plus
gateway/workflow overhead ≈ `3131–3148ms` total — consistent with the
root span. One hop (`reserve-stock`) accounts for 97% of the whole
request's latency.

---

## 2. Four log lines of this trace (CP2 format, `02-log-contract.md`)

```json
{"timestamp":"2026-10-21T18:02:11.200Z","level":"INFO","service":"synkro-workflow","version":"1.4.0","environment":"develop","trace_id":"7a2c9e41-6b3d-4f2a-9e1c-8d7a6b5c4e3f","span_id":"a2b3c4d5","correlation_id":"7a2c9e41-6b3d-4f2a-9e1c-8d7a6b5c4e3f","event":"saga.step.started","message":"Step reserve-stock started, calling synkro-products-api","duration_ms":null,"context":{"sagaId":"91f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b","productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40","quantityRequested":3}}
{"timestamp":"2026-10-21T18:02:14.180Z","level":"WARN","service":"synkro-products-api","version":"0.9.4","environment":"develop","trace_id":"7a2c9e41-6b3d-4f2a-9e1c-8d7a6b5c4e3f","span_id":"c4d5e6f7","correlation_id":"7a2c9e41-6b3d-4f2a-9e1c-8d7a6b5c4e3f","event":"stock_reservation.lock_wait","message":"Acquired product row lock after 2912ms (contended)","duration_ms":2912,"context":{"productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40"}}
{"timestamp":"2026-10-21T18:02:14.217Z","level":"INFO","service":"synkro-products-api","version":"0.9.4","environment":"develop","trace_id":"7a2c9e41-6b3d-4f2a-9e1c-8d7a6b5c4e3f","span_id":"c4d5e6f7","correlation_id":"7a2c9e41-6b3d-4f2a-9e1c-8d7a6b5c4e3f","event":"stock_reservation.created","message":"Stock reservation created","duration_ms":3017,"context":{"productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40","quantityRequested":3,"unitPriceCents":4599000}}
{"timestamp":"2026-10-21T18:02:14.258Z","level":"INFO","service":"synkro-workflow","version":"1.4.0","environment":"develop","trace_id":"7a2c9e41-6b3d-4f2a-9e1c-8d7a6b5c4e3f","span_id":"a2b3c4d5","correlation_id":"7a2c9e41-6b3d-4f2a-9e1c-8d7a6b5c4e3f","event":"saga.completed","message":"Saga register-sale completed","duration_ms":3131,"context":{"sagaId":"91f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b"}}
```

Note the third line: `outcome` is not present because this request
**succeeded** — slow, but not failed. That single fact is the center of
this whole incident.

---

## 3. What value do the SLIs reach

| SLO (`05-slo.md`) | SLI during the incident window | Objective | Result |
|---|---|---|---|
| **SLO 1 — Availability** (`register-sale` success ratio) | **~100%** — all 20 requests, including the 5 slow ones, still returned success (3s < the 5s outgoing-call timeout, `cross-cutting.md` §8, so nothing timed out or errored) | 99.5% | **Not breached.** This incident spends zero availability budget. |
| **SLO 2 — Latency** (≤ 2.5s, 95% of requests) | `15 fast / 20 total = 75%` — every one of the 5 slow requests exceeds 2.5s on its own (the `reserve-stock` span alone is 3.0s), so each one fails this SLI by itself | 95% | **Breached.** 75% is 20 points below objective. |
| **SLO 3 — Stock-reservation correctness** | **100%** — every reservation still succeeded; none was rejected for insufficient stock | 98% | **Not breached.** This is a pure latency incident, not a stock-correctness one. |

**Burn rate on the Latency SLO:** error ratio `25%` against a `5%`
budget (`1 − 0.95`) is a burn rate of **5x**. Over this 40-minute
window, against the Latency SLO's 7-day (10,080-minute) window:
`(40 min × 5) / 10,080 min ≈ 2%` of the weekly latency budget consumed
in this one incident.

---

## 4. Which alert fires first, and at what minute

**None of the alerts in `06-alerts.yml` fire during this incident.**

This is the central finding of the drill, not an oversight in this
report: CP7 only built burn-rate alerts for **SLO 1 (availability)**.
This incident never moves that SLI — every request still succeeds —
so `RegisterSaleAvailabilityBurnRateFast` and
`RegisterSaleAvailabilityBurnRateSlow` both stay silent for the entire
40 minutes, even though the Latency SLO is clearly breached (§3). No
alert exists today for SLO 2, so nothing pages anyone automatically.
Detection, in this drill, depends entirely on a human noticing the
`products_request_duration_seconds` panel in Grafana, or a
`SALESPERSON` reporting that registering a sale feels slow.

---

## 5. Which runbook step stops the damage

Also not the step the runbook was written for — and that matters.
`07-runbook.md` (CP8) is the runbook for the *availability* fast-burn
alert, which never fires here. Its first mitigation (§3.1 — confirm the
Circuit Breaker has isolated the failing participant) does not help
either: `synkro-workflow`'s Circuit Breaker toward `synkro-products-api`
trips on **3 consecutive failures** (`pattern-guide.md` §1) — a slow
but successful call is not a failure, so the breaker stays `CLOSED`
throughout. The breaker, as currently configured, provides no
protection against this failure mode at all.

What actually stops the damage in this drill is **manual** intervention,
still following the general shape of the runbook's confirmation steps
even without its triggering alert:

1. A human notices (Grafana panel or a staff complaint) — not the
   system.
2. They run the §2.1-style PromQL check from the runbook, see the
   Latency SLI at 75%, and the §2.2-style log query by `trace_id`,
   which surfaces the `stock_reservation.lock_wait` line above — the
   same `productId` across several concurrent traces.
3. They correctly infer **lock contention on one popular product's row**
   (`internal/adapter/out/persistence/postgres_stock.go`'s
   `lockProducts`: every `reserve-stock` call takes a `SELECT … FOR
   UPDATE` on that product's row, in ascending `product_id` order, so
   concurrent reservations for the *same* product queue behind one
   another by design — that queuing is what is showing up as latency).
4. The rush of concurrent sales for that product naturally tapers off
   at minute 40, and latency returns to baseline on its own — nothing
   was rolled back or restarted, because there was no outright failure
   to roll back from.

---

## 6. Blameless postmortem

### Timeline (relative to incident start, T+0)

| Time | Event |
|---|---|
| T+0:00 | Several `SALESPERSON` staff begin registering sales for the same best-selling product within the same few minutes (end-of-day rush) |
| T+0:02 | First `reserve-stock` call for that product waits on the row lock; its response reaches 3.0s |
| T+0:05 | `products_request_duration_seconds` p95 (Grafana, `deployment.md` §8) visibly spikes — no alert fires (§4) |
| T+0:18 | A `SALESPERSON` reports that "register sale" feels slow in `synkro-front` — first human signal |
| T+0:22 | On-call checks Grafana, confirms the Latency SLI is near 75%, well under the 95% objective |
| T+0:25 | Logs queried by `trace_id` (§5) surface the `stock_reservation.lock_wait` event, same `productId` across several traces |
| T+0:30 | Circuit Breaker state checked and found `CLOSED` — confirms this is a latency issue the breaker was never designed to catch |
| T+0:33 | Root cause identified: row-lock contention on one product during a burst of concurrent reservations |
| T+0:40 | The burst of concurrent sales for that product tapers off; latency returns to baseline without any rollback or restart |

### Impact

- **Requests:** 5 of 20 `register-sale` attempts in the window were
  slow (≥ 3s); **0 failed** — zero availability-budget impact, 100% of
  the 5 slow requests still completed successfully.
- **Budget (minutes):** ≈ 2% of the Latency SLO's 7-day error budget
  consumed in this single 40-minute window (§3).

### Root cause

Row-level lock contention on `products_schema.product`: when several
`reserve-stock` calls target the **same** product concurrently, each
one's `SELECT … FOR UPDATE` on that product's row
(`postgres_stock.go`'s `lockProducts`) must wait for the previous
transaction to commit before it can proceed — by design, to avoid
deadlocks (the code locks products in ascending `product_id` order).
Under a burst of concurrent sales for one popular product, that
serialization is what surfaces as 3-second latency.

### Contributing factors

1. **No concurrency limit or backpressure per product** — a burst of
   concurrent reservations for the same product all queue on the same
   lock, instead of being smoothed or rejected early with a retryable
   response.
2. **No burn-rate alert exists for the Latency SLO** (only for
   Availability, CP7) — nothing paged automatically; detection relied
   entirely on a human (§4).
3. **The Circuit Breaker only counts consecutive failures**
   (`pattern-guide.md` §1), not slow-but-successful calls, so it
   offered no protection against this specific failure mode (§5).

### Three action items (as user stories, with verifiable acceptance criteria)

**1.**
> As the development team, I want a multi-window burn-rate alert on the
> Latency SLO (the same pattern as `06-alerts.yml`'s availability
> alerts), so that a latency-only degradation with zero failed requests
> still pages someone automatically.

Acceptance criteria:
- Given the Latency SLI (`05-slo.md` SLO 2) stays below 95% across both
  a long and a short window (mirroring `06-alerts.yml`'s structure), the
  new alert transitions to firing within its configured `for:` delay.
- `promtool check rules` passes on the updated `06-alerts.yml` with zero
  errors.
- The new rule carries `severity`, `team`, `summary` and `runbook_url`
  labels/annotations, consistent with the two existing alerts.

**2.**
> As the development team, I want `synkro-workflow`'s Circuit Breaker
> toward `synkro-products-api` to also count slow calls (not only
> outright failures), so a sustained lock-contention incident like this
> one trips the breaker instead of silently passing through it.

Acceptance criteria:
- The breaker's configuration adds a slow-call-rate threshold (e.g. a
  call ≥ 2s counts toward the trip condition, alongside the existing
  3-consecutive-failure rule from `pattern-guide.md` §1) — an addition
  to that configuration, not a replacement of it.
- A test that simulates N consecutive 3-second-but-successful calls to
  `synkro-products-api` asserts the breaker transitions to `OPEN`.
- Existing tests for the failure-count trip condition still pass
  unchanged.

**3.**
> As the development team, I want `reserve-stock` to apply backpressure
> per product under concurrent load, so that a burst of sales for one
> popular product cannot serialize every concurrent sale of that same
> product behind a single lock.

Acceptance criteria:
- A load test issuing N concurrent `reserve-stock` requests for the
  same `productId` shows p95 latency for that product bounded under an
  agreed threshold (e.g. 500ms), instead of growing linearly with N.
- Requests beyond a configured per-product concurrency limit receive an
  explicit, retryable response (not an unbounded wait on the lock).
- The change does not alter the existing lock-ordering guarantee that
  prevents deadlocks (`postgres_stock.go`'s ascending `product_id`
  order) for reservations spanning multiple products.

---

## References

* Journey and the hop this incident targets → `11-week/workshop/01-journey.md` (CP1)
* Log contract → `11-week/workshop/02-log-contract.md` (CP2)
* SLOs and budgets → `11-week/workshop/05-slo.md` (CP6)
* Alerts that do (and do not) fire here → `11-week/workshop/06-alerts.yml` (CP7)
* Runbook referenced for the confirmation steps → `11-week/workshop/07-runbook.md` (CP8)
* Circuit Breaker configuration → `05-architecture/pattern-guide.md` §1
* Row-locking design this root cause is grounded in → `synkro-products-api/internal/adapter/out/persistence/postgres_stock.go`
