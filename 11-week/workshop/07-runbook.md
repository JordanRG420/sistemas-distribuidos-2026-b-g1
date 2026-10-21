# CP8 — Runbook: `RegisterSaleAvailabilityBurnRateFast`

> For the fast alert defined in `06-alerts.yml` (CP7): burn rate ≥ 14.4
> on the `register-sale` saga's availability SLO, confirmed over both a
> 1-hour and a 5-minute window. This runbook assumes the person on call
> has never seen this alert before.

---

## 1. Symptoms

- The alert `RegisterSaleAvailabilityBurnRateFast` is firing (`severity:
  critical`, `team: synkro-workflow`).
- `SALESPERSON` staff report that registering a sale is failing or
  hanging in the `synkro-front` UI.
- `synkro-workflow`'s sagas are landing in `COMPENSATED` or `FAILED`
  instead of `COMPLETED` (`09-microservices/communication-patterns.md`
  Pattern 3).

---

## 2. How to confirm

### 2.1 Confirm with PromQL (Prometheus, port `9090`, `deployment.md` §8)

Check the raw SLI first — has availability actually dropped, or is this
a metrics glitch?

```promql
sum(rate(workflow_saga_steps_total{step="register-sale",outcome="success"}[5m]))
/
sum(rate(workflow_saga_steps_total{step="validate-customer"}[5m]))
```

A healthy saga keeps this close to `1.0`. A value meaningfully below
that, together with the firing alert, confirms a real incident rather
than a one-off blip.

### 2.2 Confirm with logs, by `trace_id` (`02-log-contract.md`, CP2)

There is no dedicated log viewer in the MVP — logs are structured JSON
on stdout, read with `docker compose logs` and queried by the
correlation/trace ID (`deployment.md` §8):

```bash
docker compose logs synkro-workflow synkro-customers-api synkro-products-api synkro-sales-api \
  | grep '"trace_id":"<the failing saga'"'"'s trace_id>"'
```

Pick a `trace_id` from a recently `FAILED`/`COMPENSATED` saga
(`GET /api/v1/sagas/{id}`, `07-api/contracts/openapi/synkro-workflow.yaml`)
and read its lines in order: which step logged the first `ERROR`, and
what `event` name it used (CP2 §1) — that is the failing participant.

---

## 3. First mitigations, ordered by risk

A feature flag is **not** an option here: SynkroTech has no
feature-flag mechanism anywhere in the project (not in
`05-architecture/overview.md` §8's "what this architecture intentionally
does NOT have", not in any ADR) — adding one during an incident would be
inventing new, untested infrastructure under pressure, the opposite of
a safe mitigation. The three real options below are all things the
architecture already supports today.

**1. Confirm the Circuit Breaker is doing its job (lowest risk — pure observation).**
`synkro-workflow`'s calls to `synkro-customers-api`, `synkro-products-api`
and `synkro-sales-api` already have a Circuit Breaker (3 consecutive
failures → `OPEN` for a 15-second cooldown, `05-architecture/pattern-guide.md`
§1). If the failing participant's circuit is `OPEN`, the system is
already doing the right thing: failing new sagas fast at that step
instead of holding connections open and starving every other saga. If
the circuit is still `CLOSED` but the failing participant is clearly
unhealthy (slow, not yet 3 consecutive failures), a low-risk next step
is restarting only that one container (`docker compose restart
synkro-products-api`, say) — it does not touch any other service.

**2. Roll back the most recent deploy of the suspected participant (medium risk).**
If the incident started right after a deploy to the failing service,
roll it back through the project's own promotion flow: the previous
commit is cherry-picked (`-x`) back onto that service's `main`, never a
force-push or a branch merge (`project instructions`, Git conventions).
This is reversible but causes a brief restart of that one service.

**3. Escalate (no technical risk, but costs the team's time).**
If steps 1–2 do not recover the SLI within about 15 minutes, escalate to
whoever currently owns `synkro-workflow`'s saga logic on the team board,
then to the team's technical lead (Angel Gustavo Solano Trujillo,
Project instructions "Equipo" table) if the owner is unavailable. The
Product Owner (`@ariel5253`) is notified only if the incident would
affect a graded delivery deadline — they are the course's professor,
not an engineer to page for a technical fix.

---

## 4. How to verify recovery

1. The PromQL query in §2.1 returns to ≈ `1.0` (or whatever the team's
   normal baseline is) for a sustained period, not just one data point.
2. `RegisterSaleAvailabilityBurnRateFast` stops firing in Prometheus/Grafana
   (port `3000`, `deployment.md` §8) — note it may stay `pending` for a
   few minutes after the SLI recovers, since the alert itself requires
   the condition to be absent across both windows.
3. The Circuit Breaker for the previously-failing participant is back
   to `CLOSED` (it auto-recovers via the `HALF-OPEN` probe,
   `pattern-guide.md` §1 — no manual reset needed).
4. A manual canary request — `POST /api/v1/sagas/register-sale` with a
   throwaway customer/product pair — completes with `status: COMPLETED`
   and a real `saleId`.

---

## References

* Alert this runbook responds to → `11-week/workshop/06-alerts.yml` (CP7)
* SLO and budget → `11-week/workshop/05-slo.md` (CP6)
* Log contract and `trace_id` → `11-week/workshop/02-log-contract.md` (CP2)
* Circuit Breaker configuration → `05-architecture/pattern-guide.md` §1
* Saga states and compensation → `05-architecture/decisions/records/ADR-007-persistent-saga-and-scheduled-work.md`
* Observability tooling (Prometheus, Grafana, `docker compose logs`) → `05-architecture/deployment.md` §8
