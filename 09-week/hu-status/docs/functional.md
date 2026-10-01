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
>
> **Traceability after PDR disconnection:** the original source of these
> requirements was the professor's initial business brief (the course
> PDR). That brief's content is now fully absorbed into
> `03-product/problem-framing.md` (§1 business problem, §2 target
> users, §3 evidence) and `01-context/overview.md` ("What Problem Does
> It Solve"). The `HU-PDR-06` reference in the Source column traces to
> the specific HU where the team formalized these requirements from that
> brief. No requirement depends on opening an external file to verify
> its origin.

---

## Functional Requirements List

| ID | Responsible Service | Description | Contract | Source | Priority |
|----|---------------------|-------------|----------|--------|----------|
| FR-001 | `synkro-customers-api` | The system must allow users to register, update, view, and deactivate customers. | `synkro-customers-api.yaml` | HU-PDR-06 | Must Have |
| FR-002 | `synkro-products-api` | The system must allow users to register, update, view, and deactivate products. | `synkro-products-api.yaml` (Products tag) | HU-PDR-06 | Must Have |
| FR-003 | `synkro-products-api` | The system must allow products to be organized by category. | `synkro-products-api.yaml` (Categories tag) | HU-PDR-06 | Must Have |
| FR-004 | `synkro-products-api` | The system must control the available stock of each product. | `synkro-products-api.yaml` (Stock Adjustments, Stock Alerts tags) | HU-PDR-06 | Must Have |
| FR-005 | `synkro-workflow` → `synkro-sales-api` | The system must allow users to register a sale by associating a customer with one or more products. | `synkro-workflow.yaml` (POST /sagas/register-sale); `synkro-sales-api.yaml` (POST /sales, saga-internal) | HU-PDR-06 | Must Have |
| FR-006 | `synkro-sales-api` | The system must automatically calculate the total amount of a sale based on the product details. | `synkro-sales-api.yaml` (RegisterSaleRequest, CHECK constraint) | HU-PDR-06 | Must Have |
| FR-007 | `synkro-workflow` → `synkro-products-api` | The system must automatically deduct stock when a sale is registered. | `synkro-products-api.yaml` (Stock Reservations tag, POST /stock-reservations) | HU-PDR-06 | Must Have |
| FR-008 | `synkro-sales-api` | The system must generate daily and monthly sales reports. | `synkro-sales-api.yaml` (GET /sales/reports/daily, /monthly) | HU-PDR-06 | Must Have |
| FR-009 | `synkro-sales-api` | The system must generate a report of the best-selling products. | `synkro-sales-api.yaml` (GET /sales/reports/top-products) | HU-PDR-06 | Must Have |
| FR-010 | `synkro-auth-api` | The system must authenticate users and restrict operations according to their role (ADMIN, SALESPERSON, INVENTORY). | `synkro-auth-api.yaml` | HU-PDR-06 | Must Have |

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

**Note on service names:** the "Responsible Service" column above uses the real repository names from `documentation-rules.md`. FR-005 and FR-007 name `synkro-workflow` as the entry point because the sale-registration saga orchestrates the stock reservation and sale registration (ADR-007). The "Contract" column traces each FR to the exact OpenAPI file and endpoint tag in `07-api/contracts/openapi/`.

---

## Correlations

* MVP scope and inclusion decision → `01-context/scope.md`
* Non-functional requirements → `04-requirements/non-functional.md`
* Domain bounded contexts → `02-domain/domain-map.md`
* Service catalog → `09-microservices/service-catalog.md`
* OpenAPI contracts (FR → endpoint traceability) → `07-api/contracts/openapi/`
* Traceability matrix (HU → Requirement → Test) → `04-requirements/traceability-matrix.md`
* Origin history → `04-requirements/hu-tracking.md` (HU-PDR-06)
