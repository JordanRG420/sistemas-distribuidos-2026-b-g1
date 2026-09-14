# Functional Requirements

> This document is the **single canonical source** for the system's
> functional requirements. Any other document that mentions a functional
> requirement must reference it by ID (`FR-0NN`) instead of repeating its
> description.
>
> **ID format:** 3 digits (`FR-001`...`FR-010`), to stay consistent with
> the format already used by `04-requirements/non-functional.md`
> (`NFR-001`...`NFR-009`) and with the professor's original template
> format (`04-requirements/README.md`).
>
> **Origin:** these 10 requirements were originally formalized by the
> team in `HU-PDR-06` (Business needs and problems) and later approved
> as part of the MVP scope in `01-context/scope.md`. The wording of each
> requirement does not change — only its prefix, from `RF-` to `FR-`, to
> unify the repository's naming convention (see `HU-DOCS-25`).

---

## Functional Requirements List

| ID | Responsible Service | Description | Source | Priority |
|----|---------------------|-------------|--------|----------|
| FR-001 | customers-service | The system must allow users to register, update, view, and deactivate customers. | HU-PDR-06 | Must Have |
| FR-002 | products-service | The system must allow users to register, update, view, and deactivate products. | HU-PDR-06 | Must Have |
| FR-003 | products-service | The system must allow products to be organized by category. | HU-PDR-06 | Must Have |
| FR-004 | products-service | The system must control the available stock of each product. | HU-PDR-06 | Must Have |
| FR-005 | sales-service | The system must allow users to register a sale by associating a customer with one or more products. | HU-PDR-06 | Must Have |
| FR-006 | sales-service | The system must automatically calculate the total amount of a sale based on the product details. | HU-PDR-06 | Must Have |
| FR-007 | sales-service (orchestrates products-service) | The system must automatically deduct stock when a sale is registered. | HU-PDR-06 | Must Have |
| FR-008 | sales-service | The system must generate daily and monthly sales reports. | HU-PDR-06 | Must Have |
| FR-009 | sales-service | The system must generate a report of the best-selling products. | HU-PDR-06 | Must Have |
| FR-010 | auth-service | The system must authenticate users and restrict operations according to their role (ADMIN, SALESPERSON, INVENTORY). | HU-PDR-06 | Must Have |

**Note on priority:** all 10 requirements are within the MVP scope per
`01-context/scope.md` ("MVP Scope (In Scope)" table), so all are marked
`Must Have`. The team has not differentiated priority within the MVP —
if the Product Owner (course instructor) wants a finer distinction, it
must be decided explicitly in a Weekly, not assumed here.

---

## Implementation Status (Corte 1)

This table is informational — the real, detailed status per deliverable
lives in `01-context/scope.md`, "MVP Scope (In Scope)" table. It is
included here only as a quick reference:

| ID | Status in Corte 1 (`synkro-tech` monolith) |
|----|---------------------------------------------|
| FR-001 | ✅ Implemented |
| FR-002 | ✅ Implemented |
| FR-003 | ✅ Implemented |
| FR-004 | ✅ Implemented |
| FR-005 | ✅ Implemented |
| FR-006 | ✅ Implemented |
| FR-007 | ✅ Implemented |
| FR-008 | 🔴 Not populated — reporting screens still pending scope |
| FR-009 | 🔴 Not populated — reporting screens still pending scope |
| FR-010 | 🟡 Simulated — user picker, no real JWT |

---

## Correlations

* MVP scope and inclusion decision → `01-context/scope.md`
* Non-functional requirements → `04-requirements/non-functional.md`
* Domain bounded contexts → `02-domain/domain-map.md`
* Service catalog → `09-microservices/service-catalog.md`
* Traceability matrix (HU → Requirement → Test) → `04-requirements/traceability-matrix.md`
* Origin history → `04-requirements/hu-tracking.md` (HU-PDR-06)
