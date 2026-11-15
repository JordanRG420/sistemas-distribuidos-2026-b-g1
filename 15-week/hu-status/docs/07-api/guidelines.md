# REST Guidelines

> SynkroTech's REST standard. The entire team must follow this before
> designing a new endpoint.

---

## Versioning

**Decision: every route is versioned under `/api/v1/`** (`/api/v1/customers`).

- The gateway routes by version prefix, one route file per domain (ADR-008), so a future `/api/v2/…` can run beside `/api/v1/…` while clients move over.
- The contract of every service states which version it serves, so a client can tell from the URL which contract it is calling.

This replaces the earlier decision of unversioned routes: that decision assumed a single frontend moving in lockstep with the backend, but the portals are now deployed independently of each other (ADR-008) and cannot all switch at once.

**Health checks are the exception:** `GET /health` is not versioned and requires no token (`05-architecture/cross-cutting.md` §4). Each health Path Item overrides OpenAPI servers with the service origin. A /health path appended to a server ending in /api/v1 would describe /api/v1/health, so the override is required.

---

## Endpoint naming

- Plural for collections: `GET /api/v1/customers`, not `/api/v1/customer`
- Nouns, not verbs: `GET /api/v1/sales/{id}` (not `GET /api/v1/getSale`)
- kebab-case for multi-word URL segments: `/api/v1/stock-reservations`
- Nested sub-resources only when the relationship is real ownership: `POST /api/v1/products/{id}/stock-adjustments` (an adjustment belongs to the product), never for references between distinct aggregates — a sale references its customer and products by ID in the body
- **State transitions** are a `POST` to a sub-resource named after the transition: `POST /api/v1/stock-reservations/{id}/release`, `POST /api/v1/stock-alerts/{id}/resolve`. A transition that is already done answers `200` with the resource unchanged; a transition the current status does not allow answers `422 INVALID_STATUS_TRANSITION`
- A fixed path segment takes precedence over `{id}`: `/api/v1/products/categories` is not read as a product with id `categories`

---

## Payload conventions

| Aspect | Rule |
|---|---|
| Field names | JSON in `camelCase` |
| Identifiers | UUID v4 |
| Money | Integer in minor units (1/100 COP), named `…Cents`; never floating point (ADR-005) |
| Timestamps | RFC 3339 in UTC (`2026-09-15T10:30:00Z`) |
| Date-only parameters | RFC 3339 full date (`2026-09-15`), interpreted as a UTC day |
| Domain entities | Never serialized directly: the HTTP adapter translates them into a response object, so renaming a domain field never breaks a client |

---

## Lists

**Bounded-search exception:** ADR-019 accepts the Customers suggestion projection: at most five results plus hasMore, without page/limit. This does not replace collection pagination. See [the integration contract](#customers-sales-integration-contract-and-review-gates).

**Collection lists are paginated, offset-based:** `page` from 1 and `limit` from 1 to 100 (default 20). This includes the sales reports: a list without a limit is a defect, not a simplification.

```
GET /api/v1/sales?page=1&limit=20
```

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 142, "totalPages": 8 }
}
```

- Results are ordered newest first, with a stable order.
- A `limit` out of range, or a filter the endpoint does not declare, answers `400 VALIDATION_ERROR`.
- Cursor-based pagination is not used: no list in the MVP has the volume or the concurrent inserts that would justify it.

---

## Idempotent creation

Every operation that creates a resource requires the `Idempotency-Key` header (8 to 128 characters). The key and the resource are written in the same transaction (ADR-005).

| Request | Response |
|---|---|
| First request with a key | `201`, with `Location` and the created resource |
| Permitted same-key replay | `200`, with the original resource; authentication and authorization still apply |
| No key | `400 VALIDATION_ERROR` |

The saga uses `<sagaId>:<step>` as the key of each step (ADR-007). The original operation identity survives timeout/restart; clients must not solve uncertainty by inventing another key.

Workflow's normalized replay rules are accepted in ADR-015 under HU-ARQ-28: same authenticated caller/equivalent validated input gives 200; conflicting input gives generic 400; another caller's key gives generic 403 without exposing stored values or running steps. Existing GET authorization is unchanged. Adjustment replay uses the immutable V017 receipt; legacy NULL receipts have the documented fallback.

Stock-alert opening separates recorded-key replay from one-OPEN-alert uniqueness. The [Products contract](contracts/openapi/synkro-products-api.yaml) and [ADR-018 response semantics](../05-architecture/decisions/records/ADR-018-low-stock-alert-idempotency-per-run.md#products-response-semantics) define the valid response states and their interpretation. ADR-018 is Accepted from the explicit 2026-10-31 project decision; it does not extend Workflow payload/caller checks to Products.


---

### Saga decision status

> **Decision authority — HU-ARQ-28/#254:** [ADR-015 (Accepted)](../05-architecture/decisions/records/ADR-015-sale-saga-execution-safety.md) is the accepted replay/retry/compensation and startup-suspension modification of ADR-007, dated 2026-10-25. The predecessor file stays unchanged.

DOCS-95/#253 merged candidate guidance through PR #258. The explicit project decision of 2026-10-25, rather than that earlier merge or code release, now accepts ADR-013/015/016/017. ADR-016 governs the Host lifecycle and ADR-017 the credential-class boundary. Required main review/checks and publication remain separate evidence; implementation targets such as namespace partitioning and retry/jitter alignment remain TD-014/016.

## Query and error reconciliation

Sales detail rejects any query string and a noncanonical UUID with 400. Sales reports accept only one nonempty value for each declared page/limit/from/to filter; ownership never comes from a query parameter. A from date later than to, or an offset (page - 1) * limit exceeding the signed 64-bit range, also returns 400; from = to is a valid one-day window. Customers validates UUID path identifiers; its detail controller does not inherit Sales' no-query rule. Workflow validates the saga UUID without adding an owner restriction to GET. Do not invent a universal detail-query policy from one service's behavior.

The contracts explicitly declare 500 INTERNAL_ERROR for ordinary persistence/unexpected failures with the shared safe envelope. A mutating 500 can be an uncertain outcome, not evidence that a retry should start another operation or that stock is releasable. Health 503 has a separate HealthResponse shape, not the gateway's SERVICE_UNAVAILABLE envelope.

## Correlation

Every request carries `X-Correlation-Id`: the gateway generates one if the client sends none, every service reuses it on its own calls, returns it in the response, writes it in every log line and uses it as the `traceId` of any error (`05-architecture/cross-cutting.md` §3).

---

## Standard responses

| Code | When to use it |
|---|---|
| 200 | Success with a body; also a repeated creation with the same `Idempotency-Key`, and a transition that was already done |
| 201 | Successful creation, with `Location` |
| 204 | Success without a body (not currently used — there is no physical `DELETE` anywhere in the system, per the soft-delete pillar; see note below) |
| 400 | Client error (payload validation, unknown filter, missing `Idempotency-Key`) |
| 401 | Authentication rejected: protected credential missing/invalid, wrong login credentials, or invalid/expired refresh credential |
| 403 | Not authorized (valid token, but its roles or permissions do not allow the operation) |
| 404 | Resource not found |
| 409 | Not used: a business conflict is a `422 BUSINESS_RULE_VIOLATION` (see the catalog below) |
| 422 | The payload is valid but a business rule or a state transition rejects it (`BUSINESS_RULE_VIOLATION`, `INVALID_STATUS_TRANSITION`) |
| 429 | Gateway only: rate limit exceeded, with `Retry-After` |
| 500 | Server error |
| 503 | Gateway upstream-unreachable error; separately, a public health check reports its own store failure using HealthResponse. Ordinary persistence failures return generic 500 |

**Note on 204 and `DELETE`:** no endpoint in the system uses a physical
`DELETE` HTTP verb result — `entities-and-rules.md` and `models.md`
already establish that the whole system uses soft deletion via the
`active` field. `DELETE /api/v1/customers/{id}` internally
performs `active = false` (not a real `DELETE FROM`) — the HTTP verb
stays because semantically it's still "deactivate this resource", but
the actual database operation never removes the row. It returns `200 OK`
with the updated resource (`active: false`), not `204`, so the client
sees the resulting state without having to fetch it again. Deactivating
a resource that is already inactive also answers `200`.

---

## Contract files

- One OpenAPI 3.0 file per service in `07-api/contracts/openapi/`. An operation URL combines the declared `servers[].url` base with its path; the base may already contain `/api/v1`, so do not add the prefix twice.
- Auth currently declares `http://synkro-auth-api:8080/api/v1` with `/auth/login`, yielding the internal operation URL `http://synkro-auth-api:8080/api/v1/auth/login`. That contract address describes platform-internal service access, not a browser destination.
- Browser requests use `/api/v1/auth/login` through the host's shared client and configured gateway (locally `http://localhost:8000`). Services are not called directly from outside the network; portals do not embed the internal server address.
- Browser login/refresh/401 handling is defined once in [Authentication](authentication.md#authentication-outcomes-by-operation), not inferred solely from the common HTTP status catalog.
- Errors, pagination, the `Idempotency-Key` and `X-Correlation-Id` headers and the security scheme are referenced from `_shared.yaml`, never redefined.

---

## Error format

```json
{
  "error": "VALIDATION_ERROR",
  "message": "The email field is required",
  "details": [
    { "field": "email", "message": "required" }
  ],
  "traceId": "4f1c2b7e-8a3d-4e21-9b6f-0c5d7a2e1f90"
}
```

| Field | Type | Description |
|---|---|---|
| `error` | string | Stable `SCREAMING_SNAKE_CASE` code from the closed catalog below — the frontend can branch logic on this field |
| `message` | string | Human-readable message, in English (per `documentation-rules.md`, "Language" — error messages to the frontend) |
| `details` | array, optional | Per-field detail (`field`, `message`); present on validation errors and when a business rule names the field |
| `traceId` | string | The request's `X-Correlation-Id` (`05-architecture/cross-cutting.md` §3) |

Every error uses this envelope, including unknown routes, methods not allowed and malformed JSON. It never contains a driver message, a stack trace or an internal host name.

**Catalog of error codes — closed.** This is the only catalog in the repository (`05-architecture/cross-cutting.md` §1 refers here). No service adds a code: a domain rule is expressed as `BUSINESS_RULE_VIOLATION`, with the rule in `message` and the field in `details`.

| Code | HTTP | When it appears |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Missing or malformed fields, a `limit` out of range, an unknown filter, malformed JSON |
| `UNAUTHORIZED` | 401 | Token missing, expired, malformed or with an invalid signature; wrong login credentials; invalid refresh token |
| `FORBIDDEN` | 403 | Valid token, but its roles or permissions do not allow the operation |
| `NOT_FOUND` | 404 | The resource does not exist or is not active; unknown route |
| `INVALID_STATUS_TRANSITION` | 422 | The resource's current status does not allow the requested transition |
| `BUSINESS_RULE_VIOLATION` | 422 | A domain rule rejects the request |
| `INTERNAL_ERROR` | 500 | Unexpected failure; the detail goes only to the log |
| `TOO_MANY_REQUESTS` | 429 | **Gateway only** — rate limit exceeded; the response includes `Retry-After` |
| `SERVICE_UNAVAILABLE` | 503 | **Gateway only** — the target service cannot be reached |

**Previous codes and how they are expressed now:**

| Previous code | Now |
|---|---|
| `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN` | `401 UNAUTHORIZED` (the message never reveals whether an email exists) |
| `EMAIL_ALREADY_EXISTS`, `IDENTITY_DOCUMENT_ALREADY_EXISTS`, `CATEGORY_ALREADY_EXISTS` | `422 BUSINESS_RULE_VIOLATION`, with the field in `details` |
| `INSUFFICIENT_STOCK`, `INACTIVE_CUSTOMER`, `CUSTOMER_INACTIVE` | `422 BUSINESS_RULE_VIOLATION`, with the rule in `message` |
| `INVARIANT_VIOLATION` | `422 BUSINESS_RULE_VIOLATION` |
| `SALE_REGISTRATION_ERROR` | Not an HTTP error: the saga ends `COMPENSATED` and reports its failed step (ADR-007) |

---

## Correlations

- Authentication strategy → `07-api/authentication.md`
- OpenAPI contracts per service and shared components → `07-api/contracts/openapi/`
- Endpoints fixed by the decision records → `05-architecture/decisions/records/ADR-001-architecture.md` §8 and `05-architecture/decisions/records/ADR-004-api-contract-extensions.md`
- Money in minor units and idempotency keys → `05-architecture/decisions/records/ADR-005-data-isolation-per-domain.md`
- Gateway routing by version prefix → `05-architecture/decisions/records/ADR-008-cross-cutting-stack.md`
- Correlation, limits and retries → `05-architecture/cross-cutting.md`
- Business invariants that generate the 422 errors → `02-domain/entities-and-rules.md`

## Customers-Sales integration contract and review gates

Architecture owner: [HU-ARQ-30 / #307](https://github.com/code-corhuila/synkro-docs/issues/307). Implementation: [Customers #304](https://github.com/code-corhuila/synkro-docs/issues/304), [Sales #305](https://github.com/code-corhuila/synkro-docs/issues/305).

**Status: architectural decisions and their contract boundaries accepted by the project owner on 2026-11-10; implemented and technically consumed at the pinned source revisions below.** [ADR-019](../05-architecture/decisions/records/ADR-019-customer-search-and-reactivation.md) and [ADR-020](../05-architecture/decisions/records/ADR-020-yearly-commercial-sale-references.md) are Accepted by that explicit project decision. It does not constitute an individual GitHub approval by Jordan, Angel, Sergio or Ariel. Independent code review and main publication remain separate.

### Provider and consumer contract

Gateway URL: `POST /api/v1/customers/search`. Direct service uses the same path. Human ADMIN/SALESPERSON authenticate; anonymous/invalid token is 401, INVENTORY/SERVICE is 403. It is read-only, without Idempotency-Key. No personal search text in URL, body logs or traces.

```json
{"query":"perez ana","status":"ACTIVE"}
```

- Only `query` and `status` properties are accepted. Trim query whitespace and count 2–100 Unicode code points, not UTF-16 code units. Non-string/null/missing/invalid length is 400.
- Omitted status defaults to ACTIVE. Explicit null, unknown values/types and unknown properties are 400. INACTIVE is only ADMIN; SALESPERSON receives 403. Sales sends ACTIVE only.
- Fold accents/case. Document equality beats document prefix, which beats a name match containing all query tokens in any order. `%`, `_` and backslash are literal, not wildcard syntax.
- Order by match strength, folded name and customer UUID. At most one exact document match, first. No pagination: refine when hasMore is true.

```json
{"data":[{"customerId":"6f1d9e0a-3c52-4c0e-9a57-0d6f0c9b7a11","name":"Ana María Pérez","identityDocument":"1000000001","active":true,"match":"NAME"}],"meta":{"limit":5,"hasMore":false}}
```

At most five results with only those five fields. Empty matches return 200/data empty, not 404. No contacts are returned. Errors use `{error,message,details,traceId}`: 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN, 500 INTERNAL_ERROR. An invalid length uses field query/message invalid_length. See [Customers OpenAPI](contracts/openapi/synkro-customers-api.yaml).

Sales debounces typing 200 ms, ignores stale results, supports keyboard and selects exact document with Enter only when the service reports DOCUMENT_EXACT. This debounce is not a response-time objective. No new latency target, P95 or end-to-end measurement is adopted here.

Workflow remains the authority: active customer GET is 200; inactive/missing is 404. A later deactivation can reject registration even after selection. The Portal offers another customer and preserves the cart/intention; ambiguous registration reuses its original key. Current customer metadata is used in history, not snapshots.

Create/replacement PUT requires valid email, nonblank address and ten ASCII phone digits. Historical incomplete rows remain readable/searchable/reactivatable; PUT must supply complete contacts. ADMIN alone can POST activation, preserving identity with one atomic update/audit event. The contacts CHECK is deferred, not applied by this delivery.

### Human confirmation record

| Decision | Person responsible | Current evidence |
|---|---|---|
| Provider contract and its architecture boundary | JordanRG420 | Accepted by explicit project-owner decision on 2026-11-10; no individual GitHub review inferred |
| Consumer compatibility and review | SergioAndres17 | Technical consumption reported; no individual human confirmation or code approval inferred |
| ADR-019 and ADR-020 acceptance | Project owner | Explicit acceptance communicated on 2026-11-10 in the PR #308 follow-up; publication/review remains separate |
| Documentation main publication | ariel5253 | Required PR review pending |

For any remaining individual provider/consumer review, suggested confirmation: “I confirm the provider/consumer contract in HU-ARQ-30, request/response, limits, ordering, errors and ACTIVE scope, for the pinned revisions; no new latency target is approved.” Record the actual author, link and date. Keep peer code review separate; never impersonate another person or turn a bot's technical assessment into their approval.

### Pinned sources and reported evidence

| Repository | Revision | Implementation PR |
|---|---|---|
| Customers DB | b63315ea0ea86382da511db802da2f13bc0b1def | [#12](https://github.com/code-corhuila/synkro-customers-db/pull/12) |
| Customers API | 14c5347f63941a577bcee9f22674198ca54e324c | [#16](https://github.com/code-corhuila/synkro-customers-api/pull/16) |
| Customers Portal | 9979638f8a4f358ce828d6abb606cbad0c0c6d76 | [#8](https://github.com/code-corhuila/synkro-customers-portal/pull/8) |
| Sales DB | e00e0d3fd27cc012e25d8d4d82a41f3449b7ca72 | [#18](https://github.com/code-corhuila/synkro-sales-db/pull/18) |
| Sales API | 14fd0b07771379d70aa4d72d9f41b2f9a4569e73 | [#35](https://github.com/code-corhuila/synkro-sales-api/pull/35) |
| Final Sales Portal | f6724b9a66ca00a962b798b1e6c74311b9907bc3 | [#67](https://github.com/code-corhuila/synkro-sales-portal/pull/67) |
| Products Portal | 7e9855b1db197f7a7844c02adf604e0efa0453d3 | [#33](https://github.com/code-corhuila/synkro-products-portal/pull/33) |

These are source revisions. Sales reports final 14/14 real-browser acceptance in [the split record](https://github.com/code-corhuila/synkro-docs/issues/305#issuecomment-6758767318), but abbreviates Customers/Products and leaves other services at origin/develop. Therefore this table is **not the complete run manifest** and does not prove every listed full SHA was used. Detailed report/screenshots/logs and complete execution manifest remain requested from Sales. No runtime suite was executed for this documentation PR. Products' reported pre-existing flaky test is not relabeled a pass.

### Review, integration and deployment are separate

1. Architectural acceptance is recorded above; obtain the required independent code approvals and resolve any provider/consumer review findings. Dependency does not prevent review. Existing approvals do not automatically approve a changed head.
2. Integrate Customers DB #12; pin API fixture to its actual integrated develop revision, verify bytes/provenance and affected checks; then API #16 and Portal #8.
3. Integrate Sales DB #18; update/verify Sales API DB_REF against the actual integrated revision; then Sales API #35. Products Portal #33 can be reviewed independently.
4. Integrate Sales Portal [#63](https://github.com/code-corhuila/synkro-sales-portal/pull/63) → [#65](https://github.com/code-corhuila/synkro-sales-portal/pull/65) → [#64](https://github.com/code-corhuila/synkro-sales-portal/pull/64) → [#66](https://github.com/code-corhuila/synkro-sales-portal/pull/66) → [#67](https://github.com/code-corhuila/synkro-sales-portal/pull/67). First targets develop; the others currently target their predecessor's branch. After each integration inspect the next base/diff and adapt it to develop using the permitted repository strategy. No forced history rewrite is authorized by this document; merge availability is not inferred from old history. #61/#62 are superseded, not merged.
5. Before deployment inventory target contacts and Sales records. Do not infer an empty destination from a disposable test database. Keep old sales without a number readable; no backfill or invented contacts. New DB expansion precedes new API; portals follow compatible APIs. Inventory and future CHECK are deployment/activation gates, not a reason to block independent review.
6. The CHECK follows separately only after new API everywhere, complete inventory/real repair and an explicit recovery decision; Jordan is responsible. Until then contacts are enforced by API only.
7. Confirmed billing-only failures are excluded by the project owner's instruction; checks remain not executed, never green. Do not change protections or exclude unrelated failures. Reviewers must still approve according to policy.
8. Verify the exact integrated composition. Reported Sales builds support one Host origin at a time; choose/configure the deployment origin, do not claim simultaneous localhost/127 support. Then prepare QA/main promotions from destination child branches with cherry-pick -x; applications before Infra. Main requires Ariel approval.

No merge, promotion, deployment or HU closure is performed by this record. DOCS-98/#266 and PR #300 retain final cross-project reconciliation after the three implementation deliveries; new architectural decisions belong to HU-ARQ-30.
