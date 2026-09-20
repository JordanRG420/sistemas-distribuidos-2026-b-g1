# Domain Events

> **What to fill in here:** a domain event is a fact that already occurred
> in the business. It is the backbone of asynchronous communication
> between bounded contexts. The name is ALWAYS in past tense and in the
> ubiquitous language of the domain.
>
> Until this week, every interaction in the MVP was synchronous REST —
> there were no events to catalog. ADR-003 introduced the first real
> asynchronous interactions, and this file documents them.
>
> **This document feeds `09-microservices/service-catalog.md`**, the
> same way `domain-map.md` feeds `service-catalog.md` itself — these are
> not duplicate content, they are two levels of abstraction of the same
> fact (here, the event as a business concept; there, which service
> publishes/consumes it and over which channel).

---

## What is a domain event?

A **Domain Event** communicates that something important occurred in the
business. It is an immutable message that describes the fact in past
tense.

```
✓ SaleCompleted
✓ SaleFailed

✗ RegisterSale (this is a command, not an event)
✗ SaleUpdated (too generic — what changed?)
✗ SaleEvent (does not indicate what occurred)
```

### Difference between Command and Event

| Concept | Intent | Tense | Can fail? |
|---|---|---|---|
| **Command** | Instruction to do something | Present/infinitive | Yes |
| **Event** | Notification of something that already occurred | Past | No (it already happened) |

```
Salesperson → [POST /api/sales] → workflow → [SaleCompleted] → worker
                 (Command, via Gateway)          (Event)
```

---

## Sync/async decision, per interaction

The professor explicitly requires deciding this for every interaction in
the system, not just the new ones. Here are the 11 real interactions in
SynkroTech, with their decision and justification:

| # | Interaction | Decision | Channel | Justification |
|---|---|---|---|---|
| 1 | Frontend → API Gateway | Synchronous | REST | The user expects an immediate response to their action (login, viewing the catalog, etc.) |
| 2 | Gateway → auth-service | Synchronous | REST | Simple routing; the client waits for the login result |
| 3 | Gateway → customers-service | Synchronous | REST | Direct CRUD operation; no reason to decouple a simple read/write |
| 4 | Gateway → products-service | Synchronous | REST | Same as above |
| 5 | Gateway → sales-service (reads, reports) | Synchronous | REST | The user needs to see the result on screen immediately |
| 6 | Gateway → synkro-workflow (`POST /api/sales`) | Synchronous | REST | The salesperson needs to know whether the sale was registered or failed before continuing — it cannot be left "pending" with no response |
| 7 | workflow → customers-service (Saga step 1) | Synchronous | REST | Part of an operation that must complete or fail as a unit, within a single HTTP request |
| 8 | workflow → products-service (Saga step 2 + compensation) | Synchronous | REST | Same reason — the whole Saga lives within one request |
| 9 | workflow → sales-service (Saga step 3) | Synchronous | REST | Same reason |
| 10 | sales-service (Outbox relay) → RabbitMQ | **Asynchronous** | RabbitMQ, `sales.events` exchange | The salesperson already saw "sale registered" on screen — nothing that happens afterward should block that response or be able to fail the sale |
| 11 | RabbitMQ → synkro-worker | **Asynchronous** | RabbitMQ, `sale-notifications` queue | `worker` processes whenever it can; no one waits for its result in real time, by design (the professor: "everything that happens without anyone asking for it") |

**Why interactions 1-9 are synchronous, and not an arbitrary choice:**
all of them occur within an operation the user is actively waiting for on
screen. Making any of them asynchronous would mean either polling from
the frontend (worse experience, more complexity) or telling the user
"your sale is pending" when the operation is actually fast enough
(milliseconds) not to need that.

**Why interactions 10-11 are indeed asynchronous:** they are literally
the opposite — they are work that happens *after* the operation the user
cares about has already finished, and that no one is waiting for on
screen.

---

## Event catalog

Only 2 real events exist in the system — both already fixed in ADR-003
§4/§5. There are no speculative events "for when they're needed." The
candidates noted before ADR-003 existed (`SaleRequested`,
`StockReserved`, `SaleCompensated`) did not survive the final design —
the Saga's 3 steps are synchronous REST calls within a single request,
not published events.

### Event: `SaleCompleted`

| Field | Value |
|---|---|
| **Name** | `SaleCompleted` |
| **Bounded Context** | Sales |
| **Aggregate** | `Sale` |
| **Trigger** | `sales-service` registers the sale successfully (Saga step 3, ADR-003 §4) |
| **Consumers** | `synkro-worker` |
| **Channel (topic)** | `sale.completed` (`sales.events` exchange, topic type) |
| **Schema version** | `v1` |
| **Delivery guarantee** | At-least-once (RabbitMQ + manual ack) |

**Payload (JSON schema):**

```json
{
  "eventId": "uuid",
  "eventType": "SaleCompleted",
  "aggregateId": "uuid (saleId)",
  "aggregateType": "Sale",
  "occurredAt": "ISO 8601 timestamp",
  "version": 1,
  "payload": {
    "saleId": "uuid",
    "customerId": "uuid, external reference to customers.customer_id",
    "createdBy": "uuid, external reference to auth.users.user_id (ADR-002)",
    "items": [
      { "productId": "uuid", "quantity": "integer > 0", "unitPrice": "decimal > 0", "subtotal": "decimal" }
    ],
    "total": "decimal >= 0"
  },
  "metadata": {
    "correlationId": "uuid — same value as X-Trace-Id (cross-cutting.md)",
    "causationId": null,
    "userId": "uuid, same as payload.createdBy"
  }
}
```

**Real payload example:**

```json
{
  "eventId": "a1b2c3d4-0000-0000-0000-000000000001",
  "eventType": "SaleCompleted",
  "aggregateId": "9f8e7d6c-0000-0000-0000-000000000099",
  "aggregateType": "Sale",
  "occurredAt": "2026-09-20T14:32:00Z",
  "version": 1,
  "payload": {
    "saleId": "9f8e7d6c-0000-0000-0000-000000000099",
    "customerId": "c1c1c1c1-0000-0000-0000-000000000010",
    "createdBy": "u1u1u1u1-0000-0000-0000-000000000005",
    "items": [
      { "productId": "p1p1p1p1-0000-0000-0000-000000000020", "quantity": 2, "unitPrice": 45000.00, "subtotal": 90000.00 }
    ],
    "total": 90000.00
  },
  "metadata": {
    "correlationId": "trace-2026-09-20-000123",
    "causationId": null,
    "userId": "u1u1u1u1-0000-0000-0000-000000000005"
  }
}
```

**Note on `causationId`:** it stays `null` in the MVP because there is
only one hop (the Saga produces the event directly) — there is no
event-triggers-event chain yet. It would be populated if, in the future,
an event reacted to another event rather than directly to a command.

**What do consumers do with this event?**

| Consuming service | Action | Idempotent? |
|---|---|---|
| `synkro-worker` | Notify the customer / update reports (see idempotency design below) | Yes — see the detailed mechanism further down |

### Event: `SaleFailed`

| Field | Value |
|---|---|
| **Name** | `SaleFailed` |
| **Bounded Context** | Sales |
| **Aggregate** | `Sale` (attempt, not persisted if it fails before step 3) |
| **Trigger** | The Saga fails and compensation (releasing stock) has already run, ADR-003 §4 |
| **Consumers** | `synkro-worker` |
| **Channel (topic)** | `sale.failed` (`sales.events` exchange, topic type) |
| **Schema version** | `v1` |
| **Delivery guarantee** | At-least-once |

**Payload (JSON schema):**

```json
{
  "eventId": "uuid",
  "eventType": "SaleFailed",
  "aggregateId": "uuid — null if it failed before the sale was written",
  "aggregateType": "Sale",
  "occurredAt": "ISO 8601 timestamp",
  "version": 1,
  "payload": {
    "customerId": "uuid",
    "reason": "CUSTOMER_INACTIVE | INSUFFICIENT_STOCK | SALE_REGISTRATION_ERROR",
    "failedStep": "validate_customer | reserve_stock | register_sale"
  },
  "metadata": {
    "correlationId": "uuid — same value as X-Trace-Id",
    "causationId": null,
    "userId": "uuid, who attempted the sale"
  }
}
```

**Real payload example:**

```json
{
  "eventId": "a1b2c3d4-0000-0000-0000-000000000002",
  "eventType": "SaleFailed",
  "aggregateId": null,
  "aggregateType": "Sale",
  "occurredAt": "2026-09-20T14:35:00Z",
  "version": 1,
  "payload": {
    "customerId": "c1c1c1c1-0000-0000-0000-000000000010",
    "reason": "INSUFFICIENT_STOCK",
    "failedStep": "reserve_stock"
  },
  "metadata": {
    "correlationId": "trace-2026-09-20-000124",
    "causationId": null,
    "userId": "u1u1u1u1-0000-0000-0000-000000000005"
  }
}
```

**What do consumers do with this event?**

| Consuming service | Action | Idempotent? |
|---|---|---|
| `synkro-worker` | Log the failed attempt for review (structured log) | Yes — a duplicate log entry causes no harm; it doesn't need the same mechanism as `SaleCompleted` |

---

## Standard fields for all events

Every event must include these fields in the envelope:

| Field | Type | Description |
|---|---|---|
| `eventId` | UUID | Unique event ID (for idempotency) |
| `eventType` | string | Event name in PascalCase |
| `aggregateId` | UUID | ID of the aggregate that generated the event |
| `aggregateType` | string | Aggregate type (`Sale`) |
| `occurredAt` | ISO 8601 | When the business fact occurred |
| `version` | integer | Schema version (for evolution) |
| `payload` | object | Event data (specific per type) |
| `metadata.correlationId` | UUID | For tracing a transaction across services — reuses the same `X-Trace-Id` already defined in `cross-cutting.md` |
| `metadata.causationId` | UUID \| null | ID of the event or command that caused this event |
| `metadata.userId` | UUID | User who initiated the chain (same as `createdBy`) |

---

## Event flow: Sale registration

```
Salesperson
  │
  │  POST /api/sales (command, via Gateway)
  ▼
[synkro-workflow: SaleRegistrationSaga]
  │
  │  3 synchronous steps: validate customer → reserve stock → register sale
  │
  ├── success ─────────▶ [Aggregate: Sale] ──▶ SaleCompleted (event)
  │                                                │
  │                                                ▼
  │                                      [synkro-worker reacts]
  │
  └── failure ──▶ compensation (release stock) ──▶ SaleFailed (event)
                                                       │
                                                       ▼
                                             [synkro-worker reacts]
```

---

## Schema evolution strategy

Events are contracts. Changing them incompatibly breaks consumers. No
event has needed a v2 yet — this section stays as reference for when it
happens.

**Compatible change (breaks nothing):**
```
✓ Add a new optional field to the payload
✓ Add a new event type
✓ Change a required field → optional
```

**Incompatible change (breaks consumers):**
```
✗ Remove a field from the payload
✗ Change a field's type (string → number)
✗ Change an optional field → required
✗ Change the event's name
```

**How to evolve without breaking consumers:** publish the new type
(`SaleCompletedV2`) alongside the old one during a migration period,
migrate `synkro-worker` to v2, announce v1's deprecation one sprint in
advance, and only then stop publishing v1.

---

## Event summary table

| Event | Origin context | Topic | Consumers | Version |
|---|---|---|---|---|
| `SaleCompleted` | Sales | `sale.completed` | `synkro-worker` | v1 |
| `SaleFailed` | Sales | `sale.failed` | `synkro-worker` | v1 |

---

## Policies — Reactions to events

A **Policy** describes what happens automatically when an event arrives:
"whenever X occurs, do Y".

| Trigger event | Policy | Service |
|---|---|---|
| `SaleCompleted` | Whenever a sale completes, notify the customer (hypothetical example — see note below, not real scope yet) | `synkro-worker` |
| `SaleFailed` | Whenever a sale fails, log the incident for manual review | `synkro-worker` |

---

## Resilience patterns for events

### At-least-once delivery + Idempotency

RabbitMQ guarantees the event is delivered **at least once**, but it may
be delivered more than once (in case of retries). Consumers must be
**idempotent**.

**Why the generic "check in a database whether the eventId was already
processed" pattern doesn't apply here:** that's the standard pattern any
generic event template would assume, but it requires the consumer to
have its own database — and ADR-003 §4 explicitly established that
`synkro-worker` does not have one (the professor confirmed this design
by not creating a `synkro-worker-db`). The real mechanism used here is
different, and is explained in full below.

#### Idempotent consumer design for `SaleCompleted`

**Important note:** neither "sending a confirmation email" nor any
specific provider (SendGrid, Mailgun, etc.) are part of SynkroTech's real
scope — no FR requires it. It is used only as a hypothetical example to
show the idempotency mechanism concretely, because "the consumer must be
idempotent" without a real example is an empty statement. If a real email
feature is decided in the future, the provider is chosen at that point —
this does not commit to it.

**The problem:** if `synkro-worker` crashes right after processing a
message but before confirming (`ack`) its receipt, RabbitMQ redelivers
it. If the job `worker` performed were "send a confirmation email to the
customer," an unprotected redelivery would mean sending the same email
twice.

**Suppose** `worker` had to send a confirmation email to the customer
when `SaleCompleted` arrives. The mechanism would be: use the `saleId`
from the event payload as an **idempotency key** when calling any
transactional email provider that supports key-based deduplication
(SendGrid and Mailgun are two examples that support this, via an
`Idempotency-Key` header or equivalent):

```
POST https://api.[email-provider]/v3/mail/send
Idempotency-Key: sale-completed-{saleId}
Body: { to: customerEmail, template: "sale-confirmation", ... }
```

**What would happen on a duplicate delivery:** the provider would see the
same `Idempotency-Key` (`sale-completed-{saleId}`) and would not resend
the email — it would return the same response it had already given the
first time. Deduplication happens on the provider's side, not in
`worker`.

**Why this mechanism would be genuine idempotency:**
- The key is deterministic: the same `saleId` would always generate the
  same `Idempotency-Key`, no matter how many times the message arrives.
- It would not depend on `worker` remembering anything — the "already
  sent" state would live in the external provider, which does have its
  own database.
- It's the same pattern ADR-003 already set up elsewhere: the new
  services (`gateway`, `workflow`, `worker`) are deliberately stateless;
  when something needs real persistence, it leans on a service that
  already has it (here, the email provider, in the hypothetical example;
  in Outbox, `sales-service`, which is real).

**Alternative if the job has no external provider with native
idempotency:** for a future job without that option (for example, if
`worker` had to write directly to `sales_summary`), `worker` would call
back to `sales-service` with a
`PATCH /api/sales/{saleId}/notification-status`, and `sales-service`
(which does have a database) would decide whether it was already
processed. This is not implemented now because no real job needs it yet.

### Dead Letter Queue (DLQ)

When an event fails after N retries, it goes to the DLQ.

| Configuration | Value for `sale-notifications` |
|---|---|
| Retries before DLQ | 3 |
| Backoff | Exponential (1s → 2s → 4s) |
| DLQ retention | 7 days |
| Alert | When the DLQ has > 0 messages |

> See the DLQ runbook at `09-microservices/services/07-worker/runbook.md`
> (pending — individual service folders deferred to a future HU)

---

## Correlations

- Decision that creates these 2 events → `05-architecture/decisions/records/ADR-003-gateway-saga-async.md`, §4 and §5
- Infrastructure mapping (which service publishes/consumes, over which channel) → `09-microservices/service-catalog.md`, "Service communication matrix"
- `outbox` table where `sales-service` writes these events → `06-data/models.md`
- `Sale` entity invariants that `SaleCompleted`'s payload reflects → `02-domain/entities-and-rules.md`
- `X-Trace-Id` mechanism reused in `metadata.correlationId` → `05-architecture/cross-cutting.md`
