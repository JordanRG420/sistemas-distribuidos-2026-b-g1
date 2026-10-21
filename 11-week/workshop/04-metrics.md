# CP4 — Golden Signals and Metric Catalog

> Naming convention used throughout: `snake_case`, a unit suffix on every
> histogram/gauge that measures a quantity (`_seconds`, `_connections`),
> and `_total` on every counter (Prometheus convention; also matches the
> `products_requests_total` / `products_request_duration_seconds` names
> already written in `11-week/workshop/03-instrumentation/synkro-products-api/metrics/metrics.go`,
> CP3). One table per service of the journey (`01-journey.md`, CP1):
> `synkro-api-gateway`, `synkro-workflow`, `synkro-customers-api`,
> `synkro-products-api`, `synkro-sales-api`.

---

## 1. `synkro-api-gateway`

| Signal | Metric | Type | Labels | PromQL |
|---|---|---|---|---|
| Latency | `gateway_request_duration_seconds` | histogram | `route`, `method` | `histogram_quantile(0.95, sum by (le) (rate(gateway_request_duration_seconds_bucket[5m])))` |
| Traffic | `gateway_requests_total` | counter | `route`, `method`, `outcome` | `sum(rate(gateway_requests_total[5m]))` |
| Errors | `gateway_requests_total` (same counter) | counter | `route`, `method`, `outcome` | `sum(rate(gateway_requests_total{outcome="error"}[5m])) / sum(rate(gateway_requests_total[5m]))` |
| Saturation | `gateway_requests_total` (same counter, `outcome="rate_limited"`) | counter | `route`, `method`, `outcome` | `sum(rate(gateway_requests_total{outcome="rate_limited"}[5m]))` — how often `RATE_LIMIT_PER_SECOND=10` (burst `20`, `deployment.md` §6) is actually being hit |

One counter covers traffic, errors and the gateway's own saturation signal (rate limiting): `outcome` is one of `success`, `error`, `rate_limited`. This mirrors `cross-cutting.md` §1's closed error catalog, which already gives the gateway its own `TOO_MANY_REQUESTS` code.

---

## 2. `synkro-workflow`

| Signal | Metric | Type | Labels | PromQL |
|---|---|---|---|---|
| Latency | `workflow_saga_step_duration_seconds` | histogram | `step` | `histogram_quantile(0.95, sum by (le) (rate(workflow_saga_step_duration_seconds_bucket{step="reserve-stock"}[5m])))` |
| Traffic | `workflow_saga_steps_total` | counter | `step`, `outcome` | `sum(rate(workflow_saga_steps_total[5m])) by (step)` |
| Errors | `workflow_saga_steps_total` (same counter) | counter | `step`, `outcome` | `sum(rate(workflow_saga_steps_total{outcome="error"}[5m])) by (step)` |
| Saturation | `workflow_sagas_in_progress` | gauge | — | `workflow_sagas_in_progress` — how many `register-sale` sagas are currently `RUNNING` (persisted in `workflow_schema`, ADR-007), i.e. how close the orchestrator is to backing up |

`step` is one of the three real saga steps from `01-journey.md`: `validate-customer`, `reserve-stock`, `register-sale` — a closed, 3-value set.

---

## 3. `synkro-customers-api`

| Signal | Metric | Type | Labels | PromQL |
|---|---|---|---|---|
| Latency | `customers_request_duration_seconds` | histogram | `route`, `method` | `histogram_quantile(0.95, sum by (le) (rate(customers_request_duration_seconds_bucket[5m])))` |
| Traffic | `customers_requests_total` | counter | `route`, `method`, `outcome` | `sum(rate(customers_requests_total[5m]))` |
| Errors | `customers_requests_total` (same counter) | counter | `route`, `method`, `outcome` | `sum(rate(customers_requests_total{outcome="error"}[5m])) / sum(rate(customers_requests_total[5m]))` |
| Saturation | `customers_db_pool_in_use_connections` | gauge | — | `customers_db_pool_in_use_connections / 10` — fraction of the pool in use against the declared max (`cross-cutting.md` §8, connection pool size `10`) |

---

## 4. `synkro-products-api`

| Signal | Metric | Type | Labels | PromQL |
|---|---|---|---|---|
| Latency | `products_request_duration_seconds` | histogram | `route`, `method` | `histogram_quantile(0.95, sum by (le) (rate(products_request_duration_seconds_bucket[5m])))` |
| Traffic | `products_requests_total` | counter | `route`, `method`, `outcome` | `sum(rate(products_requests_total[5m]))` |
| Errors | `products_requests_total` (same counter) | counter | `route`, `method`, `outcome` | `sum(rate(products_requests_total{outcome="error"}[5m])) / sum(rate(products_requests_total[5m]))` |
| Saturation | `products_db_pool_in_use_connections` | gauge | — | `products_db_pool_in_use_connections / 10` — same pool-size bound as Customers (`cross-cutting.md` §8) |

`products_requests_total` and `products_request_duration_seconds` are the exact two metrics already implemented in `03-instrumentation/synkro-products-api/metrics/metrics.go` (CP3) — this table is that code's contract, written down.

---

## 5. `synkro-sales-api`

| Signal | Metric | Type | Labels | PromQL |
|---|---|---|---|---|
| Latency | `sales_request_duration_seconds` | histogram | `route`, `method` | `histogram_quantile(0.95, sum by (le) (rate(sales_request_duration_seconds_bucket[5m])))` |
| Traffic | `sales_requests_total` | counter | `route`, `method`, `outcome` | `sum(rate(sales_requests_total[5m]))` |
| Errors | `sales_requests_total` (same counter) | counter | `route`, `method`, `outcome` | `sum(rate(sales_requests_total{outcome="error"}[5m])) / sum(rate(sales_requests_total[5m]))` |
| Saturation | `sales_mongo_pool_in_use_connections` | gauge | — | `sales_mongo_pool_in_use_connections / 10` — against `MONGODB_MAX_POOL_SIZE=10` (`deployment.md` §6) |

---

## 6. Label cardinality

| Label | Used on | Estimated cardinality | Why it's safe |
|---|---|---|---|
| `route` | all 5 services' request counter/histogram | `synkro-products-api`: 10 route patterns (`/products`, `/products/{id}`, `/products/{id}/stock-adjustments`, `/products/categories`, `/products/categories/{id}`, `/stock-reservations`, `/stock-reservations/{id}`, `/stock-reservations/{id}/release`, `/stock-alerts`, `/stock-alerts/{id}/resolve`, `/health` — `07-api/contracts/openapi/synkro-products-api.yaml`); the other 4 services are in the same order of magnitude (3–6 routes each) | It is the **route pattern** (`/products/{id}`), never the resolved path (`/products/b6f3a1d2-...`) — a fixed, small set per service |
| `method` | all 5 | ≤4 (`GET`, `POST`, `PUT`, `DELETE`) | Fixed HTTP verb set |
| `outcome` | all 5 | ≤3 (`success`, `error`, and `rate_limited` only on the gateway) | Fixed, closed set |
| `step` | `synkro-workflow` only | 3 (`validate-customer`, `reserve-stock`, `register-sale`) | Fixed by the saga's own 3 steps (`01-journey.md`) |

**Forbidden as labels, and what replaces them:**

| Forbidden label | Why | Replaced by |
|---|---|---|
| `customerId`, `productId`, `saleId`, `sagaId`, `stockReservationId` | One value per business entity — unbounded, grows forever | They stay in the structured **log** `context` object (CP2, `02-log-contract.md` §2), correlated by `trace_id`, never in a metric label |
| Raw request path (`/products/b6f3a1d2-8e4c-...`) | Same problem — one series per ID ever seen | The **route pattern** (`route` label above) instead of the resolved URL |
| `user_id` / `customerId`'s person (the account that made the call) | Unbounded, and also personal data (`02-log-contract.md` §3) | Not exposed as a metric label at all; who did what is a log/audit concern, not a metric one |
| Raw email or identity document | Personal data, unbounded | Never a label or a metric value |

---

## 7. Histogram buckets

| Histogram | Buckets (seconds) | Justification |
|---|---|---|
| `*_request_duration_seconds` (single-hop: gateway, customers, products, sales) | `0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5` | SynkroTech's users are internal staff (`ADMIN`/`SALESPERSON`/`INVENTORY`) doing one screen action at a time (`03-product/problem-framing.md`); a single read (`GET /products/{id}`) should feel instant (sub-100ms), so the lower buckets are fine-grained from 25ms. The top bucket (5s) matches `cross-cutting.md` §8's own declared bound for an outgoing HTTP call (`5s, at most 3 attempts`) — a request slower than that is already a timeout, not just "slow" |
| `workflow_saga_step_duration_seconds` | `0.1, 0.25, 0.5, 1, 2.5, 5, 10` | The saga's own steps call out to another service (`reserve-stock`, `register-sale`), so each step is at least one single-hop call — hence starting coarser, at 100ms. The top bucket (10s) matches `SAGA_REQUEST_TIMEOUT=10s`, the exact value `synkro-workflow` is configured with (`deployment.md` §6) — a step that takes longer than that is already outside the saga's own request budget |

---

## References

* Journey and services these metrics instrument → `11-week/workshop/01-journey.md` (CP1)
* Log fields these metrics must stay consistent with → `11-week/workshop/02-log-contract.md` (CP2)
* Metrics already implemented in code → `11-week/workshop/03-instrumentation/synkro-products-api/metrics/metrics.go` (CP3)
* Connection pool size, outgoing call timeout → `05-architecture/cross-cutting.md` §8
* Saga request timeout, MongoDB pool size → `05-architecture/deployment.md` §6
* Closed error-code catalog (`TOO_MANY_REQUESTS`, etc.) → `07-api/guidelines.md`, `05-architecture/cross-cutting.md` §1
* Saga steps → `09-microservices/communication-patterns.md` Pattern 3
