# CP7 — Alert Policy

> Explains the two burn-rate alerts in `06-alerts.yml`, in terms of the
> real budget from `05-slo.md` (SLO 1: 99.5% availability of the
> `register-sale` saga, 30-day window → `216 minutes` or `≈ 8 failed
> requests` of monthly budget at our assumed traffic of ≈ 1,500
> requests/month).

---

## 1. How much budget each alert represents before it fires

Both alerts require the burn-rate condition to hold across **two
windows at once** (a long one and a short one), so the "time to fire" is
roughly the long window's length plus the `for:` confirmation delay —
not instantaneous.

### `RegisterSaleAvailabilityBurnRateFast` (burn rate 14.4, 1h window, `for: 5m`)

- **Time to fire:** ≈ 1h (for the 1-hour `rate()` window to reflect the
  elevated error ratio) + 5 minutes of confirmation ≈ **1h05m** after
  the incident starts.
- **Budget already spent by then:** a burn rate of 14.4 sustained for
  1 hour out of the 30-day (720-hour) window spends `1h × 14.4 / 720h =
  2%` of the monthly budget — **≈ 4.3 of the 216 minutes**, or **≈ 0.15
  of the ≈ 8 failed-request budget**.
- **Why this is still "fast":** a burn rate of 14.4 sustained
  continuously would exhaust the *entire* 30-day budget in
  `30 days / 14.4 ≈ 2.1 days` (≈ 50 hours). Paging at the 2%-spent mark
  (after only ~1 hour) leaves the team with 98% of the budget still
  intact to react, instead of discovering the problem 2 days in.

### `RegisterSaleAvailabilityBurnRateSlow` (burn rate 6, 6h window, `for: 30m`)

- **Time to fire:** ≈ 6h + 30 minutes of confirmation ≈ **6h30m** after
  the incident starts.
- **Budget already spent by then:** `6h × 6 / 720h = 5%` of the monthly
  budget — **≈ 10.8 of the 216 minutes**, or **≈ 0.375 of the ≈ 8
  failed-request budget**.
- **Why this is still useful despite being slower:** it catches a
  *lower-grade, longer-running* degradation that the fast alert's 1-hour
  window could miss (e.g. an intermittent issue that never sustains
  14.4x for a full hour, but steadily eats the budget over a shift).

### Honest caveat about our traffic assumption

At ≈ 50 `register-sale` requests/day (`05-slo.md` §0), the 1-hour window
behind the fast alert sees only **≈ 2 requests**. A single failure out
of 2 requests is already a 50% error ratio for that hour — far above
14.4x the 0.5% budget on its own. In other words, at this traffic level
the fast alert is extremely sensitive to single, isolated failures, and
the 5-minute `for:` confirmation does less to protect against noise
than it would at real production volume. This is a real limitation of
applying textbook burn-rate alerting to a low-traffic academic MVP, not
a flaw hidden from the reader — it is the kind of thing that would need
revisiting once real traffic numbers replace the assumption in
`05-slo.md` §0.

---

## 2. Two alerts we will NOT create, and why

**1. "Alert when `synkro-workflow` or `synkro-products-api` CPU usage
exceeds 80%."**
We will not create this because CPU usage is a *cause*-level signal,
not a *symptom* the user feels — exactly the distinction this
checkpoint's own concept line draws ("se alerta por la velocidad con
que se gasta el presupuesto, no por CPU"). High CPU during a burst of
legitimate traffic can be completely healthy and within every SLO in
`05-slo.md`; conversely, the saga could be failing its availability SLO
for a reason that has nothing to do with CPU (`synkro-customers-api`
rejecting valid requests due to a bad deploy, say) while CPU stays flat.
Alerting on CPU either pages someone for a non-problem or misses a real
one — the burn-rate alerts above already catch the thing that actually
matters (the SLO itself).

**2. "Page on the first `5xx` response from any single `register-sale`
request."**
We will not create this because a single transient failure is already
inside normal operating tolerance: `cross-cutting.md` §8 explicitly
bounds every outgoing HTTP call to 3 attempts with backoff before it is
treated as a real failure, and the whole reason an error *budget* exists
(`05-slo.md` §4) is so that occasional, isolated failures do not require
a human to react in real time. An alert that pages on the very first
error defeats the purpose of having a budget at all, and would almost
certainly create alert fatigue long before the team's actual budget was
ever meaningfully at risk.

---

## References

* SLO and budget this policy explains → `11-week/workshop/05-slo.md` (CP6)
* Alert rules this policy documents → `11-week/workshop/06-alerts.yml` (CP7)
* Bounded retries this policy relies on → `05-architecture/cross-cutting.md` §8
* Runbook these alerts point to → `11-week/workshop/07-runbook.md` (CP8)
