# ADR-019 — Bounded Customer Search and ADMIN Reactivation

| Field | Value |
|---|---|
| ID | ADR-019 |
| Proposal date | 2026-11-10 |
| Status | Accepted |
| Acceptance date | 2026-11-10 |
| Acceptance evidence | Explicit project-owner instruction in the PR #308 follow-up on 2026-11-10: the ADRs are approved. This is architectural acceptance, not an individual GitHub review or main publication approval. |
| Prepared for | JordanRG420 |
| **Reviewers** | Angel Gustavo Solano Trujillo — Tech Lead, Jordan Ramirez Gallego, Fredman Santiago Plazas Artunduaga — Development team |
| Modifies | ADR-004 Decision 1 (point-of-sale search choice) and Decision 6 (endpoint register), extended only; existing GET retained |
| Traced to | HU-ARQ-30 / #307; HU-CLI-05 / #304; HU-VEN-20 / #305; FR-001/005; NFR-004/006/009 |

## Context

[ADR-004](ADR-004-api-contract-extensions.md) chose a paginated GET with an exact-document filter and requires a new ADR for new endpoints. A partial name/document autocomplete now needs bounded results without putting personal search text in URLs. Customers also needs an attributable ADMIN-only inactive-to-active transition. Accepted ADR files remain unchanged. Acceptance comes from the explicit project-owner instruction recorded above, not from existing code or reported tests.

## Decision 1 — Search transport and bounds

### Options

- **A: extend GET collection filters.** Reuses pagination and the current route, but names/documents can enter URL logs, history and referrers; broader filtering also changes existing collection semantics.
- **B: body-based POST search.** Provides a read-only, bounded projection with explicit scope and ordering. Costs a new endpoint, separate schema and client behavior; POST does not make body logging safe automatically.

### Decision

Choose B: `POST /api/v1/customers/search`, with `query` and optional `status`, at most five suggestions and `hasMore` rather than pagination. Preserve the existing GET operation for compatibility; new Sales autocomplete uses POST. The [provider/consumer contract](../../../07-api/guidelines.md#customers-sales-integration-contract-and-review-gates) specifies exact matching, ordering, code-point limits, fields and errors. Search is not creation and needs no Idempotency-Key. Disable sensitive body/result logging and do not send query text in a URL.

### Dominant criterion

Keep personal search terms out of URL-based observability while giving Sales an explicitly bounded, server-filtered selection.

### Accepted cost

One additional contract, stored folded search columns/index maintenance and a non-pageable top-five result. Clients must refine when `hasMore` is true. A debounce is not a measured latency guarantee; no new latency target is adopted here.

## Decision 2 — Reactivation boundary

### Options

- **A: ordinary PUT changes active.** Fewer routes, but mixes contact replacement with a privileged lifecycle transition and risks granting the action to SALESPERSON.
- **B: dedicated POST activation.** Explicit permission and atomic attribution, at the cost of an endpoint and append-only audit storage.

### Decision

Choose B: `POST /api/v1/customers/{id}/activate`, human ADMIN only, no request body required and no Idempotency-Key. Return 200 for transition or already-active state, 404 for missing, 400 for malformed UUID, 401/403 for authentication/authorization and 500 for persistence failure. A conditional update and one audit insert share a transaction. Only the successful inactive-to-active transition creates an audit row; failed audit rolls back activation. JWT subject identifies the actor. Keep UUID, document and registration date; ordinary PUT on an inactive customer still returns 404.

### Dominant criterion

Enforce a separate privileged transition with attributable, failure-atomic effects.

### Accepted cost

Additional audit storage and grants, plus an explicit transition clients must handle. Audit is a persistence record, not a new aggregate or published event.

## Consequences and rollout

Create/replacement PUT requires valid email, address and exactly ten ASCII phone digits. Historical incomplete rows stay readable, searchable and reactivatable; no fabricated contacts or changed identity. This is an API write rule, not a claim that old storage satisfies it.

Deploy additive Customers DB V008–V014 before the new API and Portal. The contacts CHECK is not applied in this delivery. Activation requires a full target inventory, real-data repair, new API on all instances and explicit rollback compatibility acceptance; Jordan owns that follow-up. Previous API remains compatible with expansion, not necessarily with the future CHECK. No historical migration is edited.

Workflow still validates the selected UUID and rejects an inactive/missing customer with 404. Suggestions do not guarantee later availability. SERVICE cannot call search/activate; its existing read permission stays unchanged. Sales role isolation, frozen totals and saga retries stay unchanged.

## Affected documents and verification

- [Customers OpenAPI](../../../07-api/contracts/openapi/synkro-customers-api.yaml): request/legacy response separation, search and activation.
- [Domain rules](../../../02-domain/entities-and-rules.md): explicit proposed write/state rules.
- [Contract and integration gates](../../../07-api/guidelines.md#customers-sales-integration-contract-and-review-gates): pinned sources, evidence and confirmation fields.
- [ADR register](../README.md): proposed extension links; ADR-004 remains byte-identical.

Reported evidence is linked from the contract; this documentation change executes no runtime suite. Validate schema/references, bounds, role descriptions and unchanged accepted records before publication. The project-owner acceptance is recorded above; individual peer review, PR approval and environment deployment remain separate events.

## Immutability rule

This Accepted record is immutable from 2026-11-10. A later change requires a new ADR naming the replaced sections. It extends ADR-004 only as specified above; the accepted ADR-004 file remains unchanged.
