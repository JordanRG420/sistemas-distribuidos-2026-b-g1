# ADR-022 — Ambiguous Exact Document Matches in Customer Search

| Field | Value |
|---|---|
| ID | ADR-022 |
| Proposal date | 2026-11-10 |
| Status | **Proposed — not accepted** |
| Acceptance evidence | None. This record is a proposal for decision; it does not change any Accepted record, contract or implementation. |
| Prepared for | JordanRG420 |
| **Reviewers** | Requested: SergioAndres17 (Sales consumer); Ariel for main publication |
| Modifies | [ADR-019](ADR-019-customer-search-and-reactivation.md) Decision 1, only the exact-document-match rule that it delegates by reference to the [provider/consumer contract](../../../07-api/guidelines.md#customers-sales-integration-contract-and-review-gates). ADR-019 itself stays byte-identical. |
| Traced to | HU-ARQ-32 / [#311](https://github.com/code-corhuila/synkro-docs/issues/311); HU-CLI-05 / #304; HU-VEN-20 / #305; FR-001/005; NFR-004/009 |

## Context

The accepted contract says the search returns **at most one** exact document match, always first ([guidelines](../../../07-api/guidelines.md), "At most one exact document match, first"), and the Sales consumer selects the exact document with Enter when the service reports `DOCUMENT_EXACT`. Both statements hold only if two stored documents can never be equal after case/accent folding.

They can. Uniqueness is stored on the **raw** value (`UNIQUE (identity_document)`, V002), while the search compares the **folded** stored column (`document_search`, V012, not unique). SergioAndres17 reproduced it on 2026-11-10 against the real API built from head `624502b1e5edc0fecd886208869d403d8df9eb48` and Customers DB V001–V014 (synthetic data, disposable containers; [review of API #17](https://github.com/code-corhuila/synkro-customers-api/pull/17), [request in #304](https://github.com/code-corhuila/synkro-docs/issues/304#issuecomment-6785079138)):

1. `POST /api/v1/customers` with documents `ABC123` and `abc123` → `201` and `201`.
2. `POST /api/v1/customers/search` with `{"query":"abc123","status":"ACTIVE"}` (and with `ABC123`) → `200` with two entries, both `DOCUMENT_EXACT`.
3. A third create with exactly `ABC123` → `422 BUSINESS_RULE_VIOLATION`, "Identity document already belongs to a customer".

**Impact.** [`CustomerPicker.tsx`](https://github.com/code-corhuila/synkro-sales-portal/blob/a9607e2c74064e9996063ecc649586e7720de994/src/sales/components/CustomerPicker.tsx#L90) takes the first `DOCUMENT_EXACT` on Enter, so a sale can be attached to the wrong customer without a warning. Workflow only checks that the selected UUID is active and cannot detect it. The size of the legacy exposure is unknown: `scripts/contact-inventory.sql` counts duplicates on the raw value only.

**Constraints (from the project owner and the reviewer):**

- The currently stored identity and uniqueness are preserved. No normalized uniqueness constraint is added automatically; no historical document or UUID is deleted, merged or rewritten.
- The search response keeps its shape (`customerId`, `name`, `identityDocument`, `active`, `match`; `meta.limit` 5, `meta.hasMore`) and its five-element limit.
- ADR-019 is Accepted and immutable; the change is a new record, under its own HU-ARQ, not DOCS-98 / #266 / PR #300.
- This record is not marked Accepted without explicit confirmation by the project owner.

## Decision 1 — How an exact document match that is not unique is handled

### Options

- **A: keep stored identity; allow several exact matches; consumers never auto-select an ambiguous one.** The documents `ABC123` and `abc123` stay two distinct stored identities. The search returns every exact match (within the five-element bound) with `match: DOCUMENT_EXACT`. A consumer selects automatically on Enter only when **exactly one** returned item is `DOCUMENT_EXACT`; with two or more it requires an explicit choice and shows each customer's real name and stored document.
- **B: normalized uniqueness going forward.** A new constraint or application check makes `ABC123` and `abc123` the same identity, so a second one is refused (`422`). Restores "at most one". Costs: it cannot be applied to a database that already holds folded-equal pairs (no deleting/merging/rewriting is allowed), so it needs a read-only inventory in every environment, a repair decision per group (a human data decision that may not be reversible), a Flyway migration with a failure mode on legacy data, and it changes what "the same document" means for every writer. It remains a possible later step **after** the inventory.
- **C: the API picks one exact match.** A tie-break (oldest, raw-exact first) returns a single `DOCUMENT_EXACT`. Keeps the clause literally true but hides a valid customer and still attaches the sale silently to one of two real records; the tie-break is arbitrary.
- **D: change the response to flag ambiguity** (a new field or a new `match` value). Makes ambiguity explicit but changes the contract shape that this proposal must preserve, and obliges every consumer to adopt it at once.
- **E: define `DOCUMENT_EXACT` as raw, case-sensitive equality.** Guarantees at most one, but folded-equal variants would be reported as prefix matches: it breaks the documented case/accent-insensitive lookup, and a user who types `abc123` while only `ABC123` exists would be silently routed to a different equality class; with two variants the typed spelling would decide the customer silently.

### Decision (proposed)

Choose **A**. Preserve the stored identity and uniqueness exactly as they are today. Exact document matches are those whose folded document equals the folded query; there may be more than one. The response keeps its shape and its limit of five. The consumer rule is: select automatically only when exactly one item has `match = DOCUMENT_EXACT`; otherwise require an explicit choice and show the identifying data of every candidate (name and the stored document, so `ABC123` and `abc123` are visibly different).

**Ambiguity is decidable inside the existing bound.** The provider orders by match strength first (`DOCUMENT_EXACT`, then `DOCUMENT_PREFIX`, then `NAME`), then folded name, then UUID, and keeps the first six rows of each class and the first six overall (`LIMIT + 1` gives `hasMore`). Therefore:

- every exact match precedes every prefix or name match;
- with *k* exact matches, `data[0..min(k,5)-1]` are exact; the match is ambiguous exactly when `data[1].match` is `DOCUMENT_EXACT`;
- with *k* > 5 the five visible items are all exact and `hasMore` is `true`; ambiguity is still determined (at least two exact), and the consumer says that there are more and asks for more precision, never choosing;
- with exactly one exact match it is `data[0]`, and no relevant exact match is hidden behind it.

Nothing relevant is hidden by the limit: the only items the bound can cut are later in the order than every exact match.

### Dominant criterion

A sale must never be attached to a customer the user did not explicitly choose. This outweighs keeping the one-line "at most one exact match" guarantee, and it outweighs a stronger identity rule (Option B) that cannot be applied safely until the legacy exposure is measured and a human repair decision exists.

### Accepted cost

- The contract loses the single-exact-match guarantee; consumers must implement the count rule (Sales first).
- In the rare ambiguous case the sale form needs one extra explicit step.
- Folded-equal duplicates continue to exist until a separate data decision (Option B plus inventory and repair) is taken; that decision is not made here.
- Ambiguity beyond five exact matches is reported only as "more than five" (no paging, as already accepted).

## Exact clauses that would change if this record is accepted

None of these files is edited by the proposal; they would change in the same HU-ARQ after explicit acceptance.

| Document | Current text | Proposed text |
|---|---|---|
| [`07-api/guidelines.md`](../../../07-api/guidelines.md) (search ordering bullet) | "At most one exact document match, first." | "Exact document matches (equal after folding) come first, then by folded name and UUID. More than one is possible because uniqueness is on the stored value: two or more `DOCUMENT_EXACT` items in `data` mean the match is ambiguous." |
| [`07-api/guidelines.md`](../../../07-api/guidelines.md) (consumer paragraph) | "…selects exact document with Enter only when the service reports DOCUMENT_EXACT." | "…selects with Enter only when exactly one item reports DOCUMENT_EXACT. With two or more it never selects automatically, keeps the list open and shows each candidate's name and stored document." |
| [`synkro-customers-api.yaml`](../../../07-api/contracts/openapi/synkro-customers-api.yaml) (`CustomerSuggestion.match`) | enum without a statement about multiplicity | description: "`DOCUMENT_EXACT`: the document equals the query after folding; several suggestions may carry it." |
| [`02-domain/entities-and-rules.md`](../../../02-domain/entities-and-rules.md) (identityDocument rows) | "Unique across all customers, active or not" | add: "uniqueness is on the stored value; documents that differ only by case or accents are distinct stored identities until a later decision." |
| [ADR-019](ADR-019-customer-search-and-reactivation.md) | Decision 1 delegates "exact matching, ordering…" to the contract | **unchanged**; the register records that ADR-022 modifies the delegated rule. |

## Tests required before the change can be called done

Provider (Customers API, `CustomerSearchHttpTest` and `ContractExamplesTest`):

1. Two customers `ABC123` / `abc123`: search for `abc123` and for `ABC123` returns both with `DOCUMENT_EXACT`, in folded-name then UUID order, shape and `limit` 5 unchanged.
2. An exact match plus a prefix match and a name match: the exact ones are first and the relative order of the rest is unchanged.
3. Six folded-equal documents: five items, all exact, `hasMore: true`.
4. Accent variants (`Núñez`/`nunez` in documents) behave the same; `status` ACTIVE/INACTIVE still separate; INACTIVE stays ADMIN-only.
5. Creating the exact raw duplicate still returns `422` with the existing message (no change to the write path).

Consumer (Sales `CustomerPicker`, owned by HU-VEN-20; coordinated, not edited from here):

6. One exact match: Enter selects it.
7. Two exact matches (`ABC123`, `abc123`): Enter selects nothing, the list stays open with both names and stored documents visible and announced; an explicit arrow-key or click selection works.
8. Five exact plus `hasMore`: nothing is selected, the "refine" notice is shown.
9. Joint run against the real Customers API with both `ABC123` and `abc123`, showing that Enter does not pick one silently.

Data (read-only, aggregate-only, separate from this record):

10. A count of groups of documents that are equal under folding, per environment (dev, QA, main), extending the aggregate inventory script that today counts raw duplicates only. It returns counters only, never document text; it is the input for any later Option B decision.

## Consequences and rollout

- No schema, migration or API-code change is needed for Option A; the provider already behaves this way. The work is contract text plus provider tests plus the Sales consumer change.
- Deployment order is unaffected: DB V008–V014 → API → Portal; the Sales picker change ships with the Sales Portal and must be in the joint acceptance before the contract text is relied on.
- The Customers Portal's duplicate-document message matches the API's message, not the casing of the document, so it does not assume case-sensitive equality.
- Option B stays available later; it would be a separate ADR with the inventory and repair decision as prerequisites.

## Open questions for the decision

1. Does the owner accept that `ABC123` and `abc123` may be two customers (Option A), or is one identity intended (Option B, with an inventory and repair plan first)?
2. If A: is the visible-data rule (name and stored document) enough for the Sales form, or must the second line show more identifying data from the response? (The response carries nothing beyond the five fields.)
3. Who runs the read-only folded-duplicate count in each environment, and when?

## Immutability rule

While Proposed this record can change. Once Accepted it is immutable and any later change needs a new ADR naming the replaced sections. It does not edit ADR-019, ADR-004 or any other Accepted record file.
