# CP6 — SLIs, SLOs and Error Budget

> SLOs for the `register-sale` journey (`01-journey.md`, CP1), built on the
> metrics already defined in `04-metrics.md` (CP4).

---

## 0. Traffic estimate for this journey (used by every SLO below)

SynkroTech SAS is modeled as a small/medium business — the same scale as
the two real products already used for market comparison in
`03-product/problem-framing.md` §9 (Alegra, Loyverse), both aimed at
small retailers, not high-volume e-commerce. There is no real traffic
data (academic project, `problem-framing.md` §2: "N/A — no real
headcount"), so this is an explicit, stated assumption, not a measured
fact:

- **Assumption:** ~8–10 `SALESPERSON` users, each registering roughly
  5–6 sales across a working day → **≈ 50 `register-sale` requests/day**.
- Over a 30-day window: **≈ 1,500 requests/month**.

> If the team has already agreed on a different headcount or sales
> volume somewhere else in the project, replace this estimate with that
> one and recompute the budgets below — the formulas don't change, only
> this one input does.

---

## 1. SLO 1 — Availability (whole saga)

**SLI:** the proportion of `register-sale` saga attempts that complete
successfully, out of every attempt that started.

- "Good" event: the saga's last step (`register-sale`, on
  `synkro-sales-api`) finishes with `outcome="success"` — reaching that
  step with success is only possible if `validate-customer` and
  `reserve-stock` also succeeded (`09-microservices/communication-patterns.md`
  Pattern 3), so it is a valid proxy for "the whole saga completed".
- "Valid" event: the saga was attempted at all, i.e. it reached its
  first step (`validate-customer`).

```promql
sum(rate(workflow_saga_steps_total{step="register-sale",outcome="success"}[30d]))
/
sum(rate(workflow_saga_steps_total{step="validate-customer"}[30d]))
```

- **Objective:** 99.5%
- **Window:** 30 days, rolling

**Why 99.5% and not higher:** this is an internal tool for `ADMIN` /
`SALESPERSON` staff (`00-governance/security-policy.md` roles), not a
public storefront — a failed sale can be retried by the same person a
few seconds later (the saga is idempotent per step,
`cross-cutting.md` §7). 99.5% already allows real headroom for a team
of 4 students still building 4 independent services; 99.9%+ would be an
unrealistic target to hold this early, and a looser target (99%) would
mean accepting failures in roughly 1 out of every 200 sales, which is
too frequent for a tool whose whole pitch (`03-product/vision.md`) is
*not* losing track of a sale.

**Budget:**

- In requests: `(1 − 0.995) × 1,500 requests/month = 7.5 ≈ 8 failed register-sale attempts allowed per month`.
- In minutes (independent of traffic — it only depends on the window and the objective): `30 days × 24h × 60min = 43,200 minutes` in the window; `(1 − 0.995) × 43,200 = 216 minutes` of total allowed unavailability per month.

---

## 2. SLO 2 — Latency (whole saga)

**SLI:** the proportion of `register-sale` requests, measured at the
gateway (the point closest to what the `SALESPERSON` actually feels),
that complete within 2.5 seconds.

```promql
sum(rate(gateway_request_duration_seconds_bucket{route="/api/v1/sagas/register-sale",le="2.5"}[7d]))
/
sum(rate(gateway_request_duration_seconds_count{route="/api/v1/sagas/register-sale"}[7d]))
```

> **Known gap, flagged honestly:** `04-metrics.md` gave every gateway
> route the same histogram buckets (`0.025` … `5`), sized for a
> single-hop call. `/api/v1/sagas/register-sale` is the one route that
> is actually the whole 3-step saga, so in practice it needs the
> *workflow's* coarser buckets (`0.1` … `10`, already defined in
> `04-metrics.md` §2) applied to this one gateway route too. This is a
> follow-up for `04-metrics.md`, not a new metric.

- **Objective:** 95% of requests ≤ 2.5s
- **Window:** 7 days, rolling (shorter than the availability SLO's 30
  days — latency regressions from a bad deploy should surface faster
  than a full month)

**Why 2.5 seconds:** the saga is 3 sequential synchronous calls
(`validate-customer`, `reserve-stock`, `register-sale`), each
individually bounded at 5 seconds by `cross-cutting.md` §8, so the
theoretical worst case before any single call even times out is already
15 seconds. In the happy path each call is a simple DB read/write with
no cross-service fan-out inside it, so each should normally finish in a
few hundred milliseconds; 2.5s total gives comfortable headroom above
that while still feeling responsive to someone standing at a register —
well below `synkro-workflow`'s own configured
`SAGA_REQUEST_TIMEOUT=10s` (`deployment.md` §6), which is the point
where the portal would stop waiting synchronously and start polling
`GET /sagas/{id}` instead.

**Budget:** `(1 − 0.95) × 1,500 requests/week-equivalent` — at ≈ 50
requests/day, 7 days ≈ 350 requests; `0.05 × 350 ≈ 17–18 requests/week`
allowed to take longer than 2.5s.

---

## 3. SLO 3 — Stock-reservation correctness (product-specific)

This SLO is not generic availability or latency — it operationalizes
the product's own strategic pillar from `03-product/vision.md`:
**"Real-time accuracy — Stock discrepancy incidents (target: 0)"**. The
risk this protects against is overselling: a `reserve-stock` call that
gets rejected because real stock could not back it up.

**SLI:** the proportion of `POST /api/v1/stock-reservations` calls (saga
step 2) that succeed, out of every attempt.

```promql
sum(rate(products_requests_total{route="/stock-reservations",outcome="success"}[30d]))
/
sum(rate(products_requests_total{route="/stock-reservations"}[30d]))
```

- **Objective:** 98%
- **Window:** 30 days, rolling

**Why 98%:** a rejection here is not always a defect — `INVENTORY` staff
may legitimately not have restocked yet, and the reservation correctly
protecting against overselling is the system *working as designed*
(`09-microservices/communication-patterns.md` Pattern 3). The SLO exists
to catch the case where rejections spike because of a real bug (a stale
stock read, a reservation that failed to release and starved later
sales), not to demand zero rejections ever.

**Budget:** `(1 − 0.98) × 1,500 requests/month = 30 rejected-for-stock reservations/month` allowed before this is treated as a reliability problem rather than normal inventory friction.

---

## 4. Error budget policy

| Budget consumed | What the team does |
|---|---|
| **50%** | Visible on the weekly Product Owner sync (`00-governance/agile-conventions.md` ceremonies). The team reviews what changed recently against each affected service and adds the gap to `15-project-control/technical-backlog.md` if it is a real defect, not a one-off. Feature work continues at its normal pace. |
| **75%** | Any new pull request touching the affected service's saga step or route needs one extra reviewer pass focused only on reliability (timeouts, retries, error handling) before merge — on top of the existing PR approval rule. The team raises it explicitly in the next Sprint Planning as a risk to that sprint's goal. |
| **100%** | Feature work on the affected service stops: the next sprint's capacity goes to closing the reliability gap first, same as new feature work would be planned — not bypassing the backlog, but re-prioritizing it. The budget resets only when the rolling window moves past the incident, never by resetting the counter manually. |

---

## References

* Journey this SLO set covers → `11-week/workshop/01-journey.md` (CP1)
* Metrics behind every PromQL query above → `11-week/workshop/04-metrics.md` (CP4)
* Saga steps and idempotency → `09-microservices/communication-patterns.md` Pattern 3
* Per-call and saga timeouts → `05-architecture/cross-cutting.md` §8, `05-architecture/deployment.md` §6
* Product pillar this SLO set operationalizes → `03-product/vision.md`, "Strategic pillars" table
* Sprint ceremonies this policy plugs into → `00-governance/agile-conventions.md`
