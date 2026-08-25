# Project Scope

> These assumptions are considered true. If they change, the scope must be renegotiated.

## MVP Scope (In Scope)

| # | Functionality | Description | Responsible Service |
|---|---------------|-------------|----------------------|
| 1 | Authentication and Authorization | User registration/login, JWT (RS256) issuance and validation, role-based access control (ADMIN, SALESPERSON, INVENTORY) | Auth |
| 2 | Customer Management | Register, update, query, and deactivate customers | Customers |
| 3 | Product Management | Register, update, query, and deactivate products and categories; organize products by category (FR-03) | Products |
| 4 | Stock Control | Query and update available inventory | Products |
| 5 | Sales Registration | Create a sale by associating a customer and products, with automatic total calculation | Sales |
| 6 | Automatic Stock Deduction | Upon confirming a sale, the corresponding stock is deducted | Sales → Products |
| 7 | Sales Reports | Daily and monthly sales reports, best-selling products report | Sales |
| 8 | Soft Deletion / Traceability | Records are deactivated using an `active` flag and are never physically deleted, preserving operational history (NFR-04) | All Services |

## Explicitly Out of Scope

| # | Excluded Item | Reason |
|---|----------|-------|
| 1 | Customer Self-Service Portal | The system is intended for internal use (employees), not end customers |
| 2 | Electronic Invoicing for Tax Authorities | Outside the academic and business scope of the MVP |

## Candidates for Future Versions

| # | Candidate | Note |
|---|-----------|------|
| 1 | Multiple Branches or Warehouses | This MVP assumes a single SynkroTech SAS operating location |
| 2 | Payment Gateway Integration | There is no real payment processing in this MVP |
| 3 | Returns and Warranties | Not critical for the MVP; could be added in a later version |
| 4 | Asynchronous Communication Between Services (Events, RabbitMQ) | The MVP uses synchronous REST communication; this would remain an optional advanced phase to further decouple services |

## Open Questions Inherited from the PDR

These are tracked in detail in `pdr/01_PDR_negocio_v1.md` (Section 03) and affect the scope decisions above:

| # | Question | Status | Impact on Scope |
|---|----------|--------|------------------|
| 1 | Will discounts/promotions be supported in the MVP? | Pending business validation | Affects total calculation in Sales |
| 2 | Will multiple payment methods be supported in the MVP? | Pending business validation | Affects the `sales` data model |
| 3 | What happens if stock reaches zero during checkout, just before confirmation? | Pending technical definition | Affects the concurrency design of the Products service; Sales could accept an order that cannot be fulfilled without additional controls |

## External Integrations

None. The system is self-contained and does not depend on external providers (payment gateways, shipping services, electronic invoicing) in this version.

## Project Constraints

| Type | Constraint |
|------|-------------|
| Time | 16 weeks total (Distributed Systems course); currently in week 3 |
| Team | 4 members, with no fixed development roles beyond technical leadership |
| Technology | Java and Go are required in the backend; React in the frontend; PostgreSQL as the only logical database |
| Architecture | Hexagonal Architecture (Ports and Adapters) is mandatory for all 4 microservices |
| Repositories | Fixed ecosystem: 4 backend repositories + 4 frontend repositories + 1 database repository + 1 `docs` repository, each following the `main/qa/dev` workflow |

## Project Environments

| Environment | Status |
|---------|--------|
| Local | Active — development on each team member's machine |
| Development | Active — team continuous integration |
| Staging | Planned — pending a decision based on progress during the second half of the semester |

## How to Update the Scope

The scope can change, but changes follow a defined process:

1. Document the proposed change in this file.
2. Evaluate the impact on the timeline and effort.
3. Obtain agreement from the team (and approval from the course advisor if it affects the architecture defined in ADR-001).
4. Update the roadmap in `03-product/vision.md`.
5. Create or update user stories in `04-requirements/user-stories.md`.

## References

- System Overview → `01-context/overview.md`
- Detailed Functional and Non-Functional Requirements → `04-requirements/`
- Architecture Decision → `05-architecture/decisions/records/ADR-001-architecture.md`