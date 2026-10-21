# CP2 — Structured Log Contract

This contract extends SynkroTech's existing JSON logging standard
(`05-architecture/cross-cutting.md` §2) with the fields a distributed trace
needs: `trace_id`, `span_id` and `duration_ms`. The team already logs
structured JSON to stdout with `correlationId`; this document keeps that
field (for backward compatibility with the existing contract) and adds
`trace_id` as its explicit trace-level alias, since every span of one
request shares the same `X-Correlation-Id` value end to end
(`cross-cutting.md` §3).

---

## 1. Mandatory fields

| Field | Type | Required | Example | Why it exists |
|---|---|---|---|---|
| `timestamp` | string (ISO-8601, UTC) | Required | `"2026-10-20T19:58:11.482Z"` | Orders events across services whose clocks may drift slightly; UTC avoids timezone ambiguity between `develop`, `qa` and `main` |
| `level` | string | Required | `"ERROR"` | Lets log aggregation filter noise from failures without reading every line |
| `service` | string | Required | `"synkro-workflow"` | Same repository name already used in `cross-cutting.md` §2 — identifies which of the 7 services emitted the line |
| `version` | string | Required | `"1.4.0"` | Ties a log line to the exact deployed build, so a regression can be bisected to a release |
| `environment` | string | Required | `"develop"` | One of `develop`, `qa`, `main` (`deployment.md` §6) — the same log line format is used everywhere, so this field is what separates them in a shared log viewer |
| `trace_id` | string | Required | `"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4"` | The request's `X-Correlation-Id` (`cross-cutting.md` §3) carried as the trace's identity — this is what lets all spans of one `register-sale` saga run be pulled with one query |
| `span_id` | string | Required | `"d4e5f6a7"` | Identifies this specific hop (this one HTTP call), distinct from the whole trace — needed to tell the gateway's own span apart from the workflow's or from `synkro-products-api`'s |
| `correlation_id` | string | Required | `"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4"` | Kept equal to `trace_id` — this is the literal field name the team's own standard already defines (`cross-cutting.md` §2, `X-Correlation-Id` echoed on every response); keeping both avoids breaking the services written before this workshop |
| `event` | string | Required | `"stock_reservation.rejected"` | A stable, filterable event name (`snake_case`, dotted), separate from the free-text `message`, so a dashboard can count occurrences of one event type without parsing prose |
| `message` | string | Required | `"products-api rejected the reservation: insufficient stock"` | Human-readable description, for the person reading the line in context |
| `duration_ms` | number | Required for any line that closes a call or a step | `3004` | Feeds the latency golden signal directly from logs when metrics are not yet wired for a given hop |

---

## 2. Domain fields (SynkroTech-specific)

These travel inside `context` (`cross-cutting.md` §2 already reserves this
object for structured, non-sensitive key-value pairs).

| Field | Type | Why it exists |
|---|---|---|
| `sagaId` | string (UUID) | Identifies one `register-sale` saga instance (`synkro-workflow`'s own resource ID, ADR-007 Decision 2) across its 3 steps, independent of `trace_id` — a saga step retried under the saga's own retry policy reuses the same `sagaId` even if a new HTTP call gets its own `span_id` |
| `customerId` | string (UUID) | The customer entity being validated in saga step 1 (`02-domain/entities-and-rules.md`) — needed to join a log line back to a specific customer record without re-deriving it from the request body |
| `productId` | string (UUID) | The product line being reserved in saga step 2 — ties a stock-reservation failure to exactly which catalog item ran out |
| `quantityRequested` | integer | How many units of that product the sale line asked for — needed to explain *why* a reservation was rejected (requested vs. available) |
| `unitPriceCents` | integer | The frozen unit price `synkro-products-api` returns for that line (money as integer minor units, `cross-cutting.md` §7 / ADR-005 Decision 3) — logged so a pricing discrepancy can be diagnosed without querying the database |

---

## 3. Never log (SynkroTech domain) and how each is masked

| Data | Why it's dangerous here | Masking |
|---|---|---|
| `identityDocument` (customer's ID document, `02-domain/entities-and-rules.md`) | Personal data (PII) tied to a real person, used as the customer's natural key | Never put in `context`; if a line must reference the customer, use `customerId` (UUID) only |
| `Authorization` header / person's JWT | Grants full access with that person's role for its TTL | Never logged, not even truncated; log only `"hasAuthHeader": true` if presence must be recorded |
| Service token (`WORKFLOW_SERVICE_TOKEN`, `WORKER_SERVICE_TOKEN`, ADR-006) | Grants `synkro-workflow` / `synkro-worker` the right to call any domain service directly, bypassing the gateway | Never logged in any form; if a service-token auth failure must be logged, log only the calling service's name, never the token value |
| Database credentials (`AUTH_APP_PASSWORD`, `SALES_APP_PASSWORD`, etc., `deployment.md` §6) | Would let an attacker with log access reach the shared PostgreSQL instance or the MongoDB instance directly | Never logged under any circumstance, including in a connection-failure message (the error must be caught and re-wrapped before logging) |
| Customer contact fields (phone, email, if present — `02-domain/entities-and-rules.md`) | PII beyond what the log needs to be queryable | Never put in `context`; reference by `customerId` only |

SynkroTech's MVP does not handle payment-card data or health data (out of
scope per `03-product/problem-framing.md` §8), so those categories do not
apply here — the equivalent sensitive surface in this domain is the
customer's identity document and the system's own credentials above.

---

## 4. Seven example log lines (one `register-sale` request, one `trace_id`)

All seven share `"trace_id": "9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4"`. Two show a failure: line 3 is a timeout toward a downstream service (`synkro-customers-api`, retried per `cross-cutting.md` §8's bounded-retry rule), and lines 6–7 are a business-rule rejection (insufficient stock) that ends the saga.

```json
{"timestamp":"2026-10-20T19:58:11.482Z","level":"INFO","service":"synkro-api-gateway","version":"2.3.0","environment":"develop","trace_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","span_id":"a1b2c3d4","correlation_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","event":"saga.request.received","message":"Received POST /api/v1/sagas/register-sale","duration_ms":4,"context":{"sagaId":null}}
{"timestamp":"2026-10-20T19:58:11.501Z","level":"INFO","service":"synkro-workflow","version":"1.4.0","environment":"develop","trace_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","span_id":"b2c3d4e5","correlation_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","event":"saga.started","message":"Saga register-sale started, step=validate-customer","duration_ms":null,"context":{"sagaId":"5a21f0c4-6e9d-4b2a-9f0e-1c7d2a9b3e45","customerId":"7c9e6679-7425-40de-944b-e07fc1f90ae7"}}
{"timestamp":"2026-10-20T19:58:16.509Z","level":"WARN","service":"synkro-workflow","version":"1.4.0","environment":"develop","trace_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","span_id":"b2c3d4e5","correlation_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","event":"downstream.timeout","message":"synkro-customers-api did not respond within 5s (attempt 1/3), retrying","duration_ms":5008,"context":{"sagaId":"5a21f0c4-6e9d-4b2a-9f0e-1c7d2a9b3e45","customerId":"7c9e6679-7425-40de-944b-e07fc1f90ae7"}}
{"timestamp":"2026-10-20T19:58:17.812Z","level":"INFO","service":"synkro-customers-api","version":"1.2.1","environment":"develop","trace_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","span_id":"c3d4e5f6","correlation_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","event":"customer.validated","message":"Customer found and active","duration_ms":312,"context":{"customerId":"7c9e6679-7425-40de-944b-e07fc1f90ae7"}}
{"timestamp":"2026-10-20T19:58:17.830Z","level":"INFO","service":"synkro-workflow","version":"1.4.0","environment":"develop","trace_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","span_id":"d4e5f6a7","correlation_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","event":"saga.step.started","message":"Step reserve-stock started, calling synkro-products-api","duration_ms":null,"context":{"sagaId":"5a21f0c4-6e9d-4b2a-9f0e-1c7d2a9b3e45","productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40","quantityRequested":12}}
{"timestamp":"2026-10-20T19:58:18.145Z","level":"ERROR","service":"synkro-products-api","version":"0.9.4","environment":"develop","trace_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","span_id":"e5f6a7b8","correlation_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","event":"stock_reservation.rejected","message":"BUSINESS_RULE_VIOLATION: insufficient stock (requested 12, available 5)","duration_ms":97,"context":{"productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40","quantityRequested":12,"unitPriceCents":4599000}}
{"timestamp":"2026-10-20T19:58:18.160Z","level":"ERROR","service":"synkro-workflow","version":"1.4.0","environment":"develop","trace_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","span_id":"d4e5f6a7","correlation_id":"9f1e2a7b-74f2-46fe-b697-b1f41a4a7cb4","event":"saga.failed","message":"Saga FAILED at step reserve-stock: business rule violation, no compensation needed (nothing was reserved)","duration_ms":330,"context":{"sagaId":"5a21f0c4-6e9d-4b2a-9f0e-1c7d2a9b3e45","customerId":"7c9e6679-7425-40de-944b-e07fc1f90ae7","productId":"b6f3a1d2-8e4c-4a9b-9d3e-2f1a7c6b5e40"}}
```

---

## 5. When the team uses each log level

| Level | When SynkroTech uses it | Example from this journey |
|---|---|---|
| `ERROR` | Unrecoverable issues: unhandled exception, downstream failure that ends the operation, data inconsistency | Line 7 — the saga ends in `FAILED` because `synkro-products-api` rejected the reservation; there is nothing left to retry |
| `WARN` | Recoverable issues: a retried request, a slow query, approaching a declared limit (`cross-cutting.md` §8) | Line 3 — `synkro-customers-api` missed its 5-second timeout once but the retry (attempt 2) succeeds, so the operation recovers |
| `INFO` | Successful operations, service start/shutdown, an external call made | Line 2 — the saga starts and logs that it is about to call `synkro-customers-api` |
| `DEBUG` | Internal state useful only during development; disabled in `qa`/`main` | `synkro-workflow` logging the exact `Idempotency-Key` string it is about to send on this step (e.g. `"idempotencyKey": "5a21f0c4-...:reserve-stock"`) before the HTTP call — useful while debugging a duplicate-reservation bug locally, irrelevant and noisy in production |

---

## References

* Existing log format this contract extends → `05-architecture/cross-cutting.md` §2
* Correlation ID propagation and the `trace_id`/`correlation_id` equivalence → `05-architecture/cross-cutting.md` §3
* Closed error-code catalog (`BUSINESS_RULE_VIOLATION`, etc.) → `07-api/guidelines.md`
* Money as integer minor units → `05-architecture/decisions/records/ADR-005-data-isolation-per-domain.md` Decision 3
* Saga steps and compensation → `09-microservices/communication-patterns.md` Pattern 3
* Customer and product entities → `02-domain/entities-and-rules.md`
* Journey and trace context this contract instruments → `11-week/workshop/01-journey.md` (CP1)
