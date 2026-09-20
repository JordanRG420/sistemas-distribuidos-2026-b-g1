# Traceability Matrix

> Traceability connects every line of code to its business justification.
> It allows answering: "Why does this function exist?" and "Which HU covers this part of the system?"
> It also identifies: unimplemented requirements and code without a requirement (possible technical debt).

---

## How to use this matrix

```
Requirement → HU → Test Case → Implementation → Service

If a requirement has no HU: it is not planned
If a HU has no test case: it has no completeness criterion
If a test case has no implementation: there is test technical debt
If there is code without an HU: possible gold-plating or bug introduced without a story
```

---

## FR → HU → Test → Service matrix

| FR ID | Description | HU(s) | Tests that verify it | Service (target) | Status |
|-------|-------------|-------|----------------------|------------------|--------|
| FR-001 | Register, update, view, and deactivate customers | HU-ARQ-07 (Corte 1 monolith backend) | — | customers-service | 🟡 Implemented in monolith, no automated tests |
| FR-002 | Register, update, view, and deactivate products | HU-ARQ-07 | — | products-service | 🟡 Implemented in monolith, no automated tests |
| FR-003 | Organize products by category | HU-ARQ-07 | — | products-service | 🟡 Implemented in monolith, no automated tests |
| FR-004 | Control available stock of each product | HU-ARQ-07 | — | products-service | 🟡 Implemented in monolith, no automated tests |
| FR-005 | Register a sale associating a customer with products | HU-ARQ-07 | — | sales-service | 🟡 Implemented in monolith, no automated tests |
| FR-006 | Automatically calculate the total amount of a sale | HU-ARQ-07 | — | sales-service | 🟡 Implemented in monolith, no automated tests |
| FR-007 | Automatically deduct stock when a sale is registered | HU-ARQ-07 | — | sales-service (orchestrates products-service) | 🟡 Implemented in monolith, no automated tests |
| FR-008 | Generate daily and monthly sales reports | — | — | sales-service | 🔴 Pending — reporting screens out of Corte 1 scope |
| FR-009 | Generate a report of the best-selling products | — | — | sales-service | 🔴 Pending — reporting screens out of Corte 1 scope |
| FR-010 | Authenticate users and restrict by role | HU-FE-02 (Corte 1 monolith frontend, simulated) | — | auth-service | 🟡 Simulated — user picker, no real JWT |

**Note on the "Tests" column:** every row is empty because Corte 1 was a proof-of-concept monolith without TDD. Tests will be written when the code phase begins on the 4 real microservices, following Pillar 2 (TDD: red → green → refactor).

**Note on the "Service" column:** the column shows the target service (the microservice that will own this FR per `09-microservices/service-catalog.md`), not the monolith where the Corte 1 implementation currently lives.

---

## NFR → Validation matrix

| NFR ID | Category | Key metric | How it is validated | Tool | Status |
|--------|----------|------------|---------------------|------|--------|
| NFR-001 | Performance | P95 < 300ms for critical endpoints | Load test | k6 (proposed) | 🔴 No load-testing infrastructure |
| NFR-002 | Availability | Health checks per service | `GET /health` | curl / docker | 🔴 Endpoints designed but not built |
| NFR-003 | Scalability | Stateless service instances | Code review | — | 🟡 Design principle adopted, no automated verification |
| NFR-004 | Security | JWT RS256 validated locally + RBAC | Security contract tests | Postman + manual review | 🟡 Controls defined in `security-policy.md`, not automated |
| NFR-005 | Observability | Security events logged | Log review | — | 🔴 Defined in `security-policy.md`, not implemented |
| NFR-006 | Maintainability | One PR per service, no cross-service coupling | PR review | — | 🟡 Principle adopted, manual verification |
| NFR-007 | Portability | Reproducible Docker containers | `docker compose up` | Docker Compose | 🟡 Documented in `deployment.md`, functional locally |
| NFR-008 | Disaster Recovery | RTO/RPO defined | — | — | 🔴 Aspirational — no production environment |
| NFR-009 | Data Integrity | Zero `DELETE` against business tables | Static grep in code | grep / code review | 🟡 Principle adopted (soft delete), manual verification |

---

## Inverse traceability: HU → FR

| HU | Title | FR(s) it implements | Sprint/Week |
|----|-------|---------------------|-------------|
| HU-ARQ-07 | Backend: monolithic MVP setup | FR-001 through FR-007 (Corte 1 monolith) | Week 5 |
| HU-FE-02 | Frontend: monolithic MVP setup | FR-010 (simulated) | Week 5 |

**Note:** the remaining ~25 HUs (HU-PDR-*, HU-ADR-*, HU-DOCS-*, HU-ARQ-09 through 13) are documentation stories — they do not implement FRs in the code-with-TDD sense. This table will be populated as the code phase begins with the `AUTH`, `CLI`, `PRO`, `VEN` prefixes.

---

## Status legend

| Status | Meaning |
|--------|---------|
| ✅ Done | Implemented with TDD, reviewed, and in the corresponding branch |
| 🟡 In progress | Partially implemented or without automated tests |
| 🔴 Pending | In the backlog, not started |
| ⏸ Blocked | Has an external blocker |
| ❌ Cancelled | Removed from scope |

---

## Identified gaps (requirements without coverage)

> Updated in Week 6 as part of HU-DOCS-27.

| Gap type | Description | Required action | Owner | When |
|----------|-------------|----------------|-------|------|
| FR without tests | All 10 FRs lack automated tests — Corte 1 was a monolith without TDD | Write tests before production code when starting the microservices phase (Pillar 2: TDD) | Whole team | Week 7+ |
| FR without code HU | FR-008 and FR-009 (reports) have no assigned implementation HU | Create HU with `VEN` prefix in the sprint the PO prioritizes reports | Product Owner | Pending prioritization |
| FR-010 simulated | Authentication is a user picker, not real JWT | Create HU with `AUTH` prefix for real JWT RS256 implementation | Whole team | Week 7+ |
| NFR without validation | 6 of 9 NFRs have no automated or manual validation | Define tools and thresholds before the first code sprint | Whole team | Week 7 |
| Test coverage | The minimum coverage threshold required by the DoD has not been set | Set the percentage in the DoD and in `11-quality/testing-strategy.md` | Whole team | Before Week 7 |

---

## HU-02 (Discovery) → Repository Traceability

> This section responds to the professor's HU-02 ("Project Discovery"). It
> is not a new feature or a new file per task — it is the evidence that
> each of its 10 tasks is already resolved in the repo, so nothing gets
> duplicated across folders.

| HU-02 Block | Task | Where it's resolved | Status |
|---|---|---|---|
| Context Analysis | Describe the problem | `03-product/problem-framing.md`, §1 | ✅ Done |
| Context Analysis | Target users (persona) | `03-product/problem-framing.md`, §2 + `01-context/overview.md`, "Main Users" | ✅ Done |
| Context Analysis | Market research | `03-product/problem-framing.md`, §9 (Alegra, Loyverse) | ✅ Done |
| MVP Definition | Candidate features | `01-context/scope.md`, "MVP Scope" | ✅ Done |
| MVP Definition | Corte 1 scope (what's in) | `01-context/scope.md`, "MVP Scope" | ✅ Done |
| MVP Definition | What's out of scope | `01-context/scope.md`, "Explicitly Out of Scope" + `problem-framing.md`, §8 | ✅ Done |
| Initial Design | Wireframes/mockups | `12-ux-ui/wireframes.md` | 🟡 In progress (HU-DOCS-18) |
| Initial Design | Initial data model | `02-domain/domain-map.md` + `entities-and-rules.md` | ✅ Done |
| Initial Design | Main user flows | `12-ux-ui/navigation-map.md`, "Main user flows" (Flow 1-5) | ✅ Done |
| Documentation | Consolidate everything in `docs` | This same table — each piece lives in its correct folder per that folder's own README | ✅ Done |

**Why this table lives here and not elsewhere:** `traceability-matrix.md`
is exactly the file the professor's own framework defines to connect an
external requirement to where its evidence lives in the repo — it is the
correct place, rather than creating a new document just for this.

---

## How to maintain this matrix

1. When an HU is created: add the row in the FR → HU → Test → Service section
2. When a test is written: note the file in the "Tests that verify it" column
3. When an HU is completed: change the status to ✅
4. At each Sprint Planning: review gaps and assign actions

---

## Correlations

- User Stories → `04-requirements/user-stories.md`
- Non-Functional Requirements → `04-requirements/non-functional.md`
- Functional Requirements → `04-requirements/functional.md`
- Testing strategy → `11-quality/testing-strategy.md`
- DoD that determines when an HU is Done → `00-governance/definition-of-done.md`
- The professor's original user story → HU-02, delivered in the Weekly
- Detail of each HU-02 piece → `03-product/problem-framing.md`, `01-context/scope.md`, `02-domain/`, `12-ux-ui/`
