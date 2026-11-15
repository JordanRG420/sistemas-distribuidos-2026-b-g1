# ADR-020 — Yearly Commercial Sale References

| Field | Value |
|---|---|
| ID | ADR-020 |
| Proposal date | 2026-11-10 |
| Status | Accepted |
| Acceptance date | 2026-11-10 |
| Acceptance evidence | Explicit project-owner instruction in the PR #308 follow-up on 2026-11-10: the ADRs are approved. This is architectural acceptance, not an individual GitHub review or main publication approval. |
| Prepared for | JordanRG420 |
| **Reviewers** | Angel Gustavo Solano Trujillo — Tech Lead, Jordan Ramirez Gallego, Fredman Santiago Plazas Artunduaga — Development team |
| Modifies | None: extends sale representation; UUID identity and ADR-015 safety remain unchanged |
| Builds on | ADR-005 UUID/idempotency; ADR-010 Sales ownership; ADR-015 business-error compensation |
| Traced to | HU-ARQ-30 / #307; HU-VEN-20 / #305; FR-005/006/008; NFR-004/009 |

## Context

Users need readable references on history and commercial receipts without replacing UUID identity. The implementation reports a yearly format and atomic counter; its gaps and exhaustion behavior need an explicit contract. This decision records those boundaries, not a fiscal invoice sequence or a claim of production deployment.

## Options

- **A: atomic counter per Colombian calendar year, then insert.** Small, domain-owned persistence mechanism; uniqueness is indexed. Counter reservation and insertion are separate, so failures/races may consume unused values.
- **B: counter and insert in one MongoDB transaction.** Can avoid counter increments for aborted inserts, but adds transaction retry/operational complexity and contention. It still requires an explicit definition of gaplessness across cancellation and later administrative events.
- **C: random human-readable reference.** Avoids a centralized counter but does not meet the agreed yearly sequential-reference requirement.

## Decision

Choose A. Keep `saleId` UUID for routes, relations and traceability. Add optional stored `commercialNumber` with `VEN-YYYY-NNNNNN`, year 1000–9999 in Colombia (UTC-05:00), yearly sequence 000001–999999. The Sales-owned counter is atomically incremented with an upper bound; a partial unique index protects stored numbers. Assign a number once at persistence, never from browser row counts, shortened UUIDs or a read-time backfill.

Look up a stored idempotency key before allocation. A replay returns the stored sale and its original number, including across a year boundary. Concurrent same-key requests produce one sale but can spend more than one counter value. An insert failure after allocation can also leave a gap; retry without a stored sale may allocate again. A committed insert with a lost response replays the original number. Only uniqueness and immutability of the stored reference are promised.

At yearly exhaustion return `422 BUSINESS_RULE_VIOLATION`, field `commercialNumber`, with a valid shared error envelope and no committed sale. [ADR-015](ADR-015-sale-saga-execution-safety.md) permits Workflow to interpret that business rejection and compensate reserved stock. Do not turn exhaustion into a generic 500, disclose driver internals or claim an ambiguous persistence failure is a definitive rejection.

## Dominant criterion

Provide stable readable references and safe stored-sale replay with minimal persistence complexity; the commercial receipt does not require gapless fiscal numbering.

## Accepted cost

Gaps, unused capacity under contention/failures and an annual capacity limit are explicit. A sequence is not an exact sales-count indicator. Monitor capacity before exhaustion; changing the format/capacity requires contract review. The added reference exposes ordering information, unlike the internal UUID.

## Consequences and rollout

Old records without a number remain readable: omit the JSON property, never send null or invent one, and show a clear unavailable label. No backfill runs in this change. Before deployment inventory the actual destination; a disposable empty database does not prove it has no historical sales.

History reads current customer metadata, not sale-time snapshots. PDF/XML use the stored number and official frozen totals; XML 1.2 makes the reference optional. The document remains a commercial receipt without fiscal validity. SALESPERSON sees only own sales and ADMIN the global view.

Apply Sales DB before API; refresh and verify DB_REF after integration. Review [the integration gates](../../../07-api/guidelines.md#customers-sales-integration-contract-and-review-gates) before deploying portals or promoting. Counter allocation does not change Workflow inputs or introduce a cross-service transaction.

## Affected documents and verification

- [Sales OpenAPI](../../../07-api/contracts/openapi/synkro-sales-api.yaml): optional number and exhaustion example.
- [Domain rules](../../../02-domain/entities-and-rules.md): proposed commercial reference alongside UUID.
- [Integration contract](../../../07-api/guidelines.md#customers-sales-integration-contract-and-review-gates): pinned implementation and attributed acceptance.

Sales reports 42 MongoDB scenarios and final joint acceptance 14/14. These are team-reported results, not rerun by this documentation task. The detailed final manifest/screenshots are still requested. Validate year boundary, concurrent same/different keys, overflow and business-error compensation in the owning implementation before release.

## Immutability rule

This Accepted record is immutable from 2026-11-10; changes require a new ADR. The project-owner acceptance above does not replace PR review approval or main publication.
