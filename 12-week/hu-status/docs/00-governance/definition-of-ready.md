# Definition of Ready (DoR)

> A User Story is **Ready** when the entire team can start working on it in the next sprint
> without needing to resolve fundamental questions halfway through.
> If a story does not meet this DoR, it returns to refinement in the Weekly with the professor (Wednesdays).

This version distinguishes two kinds of story, because in this project close
to half of every week's stories are pure documentation (no code) — both need
to be "Ready", but against different criteria.

---

## DoR for code stories

Before moving an implementation story to "Ready for Sprint", verify:

### Clarity
- [ ] The story is written in the format: **As a [role], I want [action], so that [benefit]**
- [ ] The role is `ADMIN`, `SALESPERSON`, `INVENTORY` or the development team, as appropriate to the scope — never a generic "as a user"
- [ ] The expected benefit is clear and verifiable

### Acceptance Criteria
- [ ] There are at least 2 acceptance criteria written in the **Given / When / Then** format
- [ ] The criteria cover the happy path AND at least one error case (e.g., insufficient stock, inactive customer, expired token)
- [ ] The criteria are testable (it is possible to write an automated test for each one)
- [ ] There are no ambiguous criteria ("the response should be fast" is not valid — use the concrete value from NFR-001)

### Real project dependencies
- [ ] Sale-flow stories identify `synkro-workflow` as the orchestrator calling Customers, Products and Sales through HTTP. `synkro-sales-api` receives checked/frozen sale inputs; it does not query Customers or Products
- [ ] If the story requires authentication, it identifies that it validates the JWT (RS256) locally with `synkro-auth-api`'s public key — with no synchronous call to Auth on every request
- [ ] If it depends on another story, that story is already Done or In Progress in `04-requirements/user-stories.md`

### Estimation
- [ ] The team has estimated the story (story points)
- [ ] There is agreement that it fits within a weekly sprint
- [ ] If it is estimated at 8 or 13, it has been split into smaller stories (rule already fixed in `agile-conventions.md`)

### Technical Readiness
- [ ] The required access and environments are available (see the environments note below)
- [ ] If the story adds or changes an endpoint, the OpenAPI contract is defined in `07-api/contracts/`
- [ ] If there are data changes, the affected schema already exists in `06-data/models.md`
- [ ] The impact on other services has been identified (which service breaks if this one changes?)
- [ ] The first test, applicable real-engine/HTTP/browser acceptance, current CI jobs and backend 90/80/60/80 or frontend 85/70/70 coverage gates are identified
- [ ] Domain, application ports and I/O adapters respect hexagonal boundaries; responsibilities follow SOLID and applied patterns have a reason
- [ ] Significant decisions have the required ADR context, alternatives, dominant criterion, accepted cost and consequences; accepted ADRs are not silently edited

### Non-Functional Requirements
- [ ] If performance applies, it references NFR-001 (response times for critical operations) with the concrete value, not a generic phrase
- [ ] If security applies, it references NFR-004 (JWT) and the minimum role required from `security-policy.md`
- [ ] If observability applies, reference NFR-005's security/correlation requirements and distinguish implemented component checks from pending full monitoring

---

## DoR for documentation stories

Most stories from the last few weeks (governance, context, domain, product,
UX-UI) are of this type. Before moving them to "Ready":

- [ ] The exact file in the `docs` repo to be created or modified has been identified
- [ ] It was verified whether the requested content already exists, partially or fully, in another file, to avoid duplication (living-documentation rule from the SDD pillar)
- [ ] If it modifies an evaluated file, identify the exact sections and preserve the existing structure. Update outdated content in place; Git preserves earlier versions. Accepted ADRs, approved requirement definitions and unrelated sections remain unchanged
- [ ] The owner and the `HU-<PREFIX>-NN` nomenclature are already assigned in `04-requirements/user-stories.md`
- [ ] At least a success and an error scenario, source revisions, verification scope and an independent reviewer are defined
- [ ] ID assignment follows the single register in `agile-conventions.md`; proposals without issues do not consume IDs

---

## Common Reasons Why a Story Is NOT Ready

| Problem | What to Do |
|---------|-----------|
| Unclear requirements | Schedule a 30-minute refinement session with the Product Owner (the professor) |
| Missing acceptance criteria | Add them before the next sprint |
| Unidentified dependency on another service | The team reviews and documents the coupling (synchronous HTTP, per ADR-001) |
| Too large (> 8 SP) | Split it into smaller stories |
| About to duplicate content that already exists in another file | Search the repo first — reference it, don't repeat it |
| Unclear API contract | Agree on the contract (OpenAPI) before starting |

---

## Note on environments (relevant to "access available")

The permanent code branches are `develop`, `qa` and `main`. Confirm the actual runtime and required access; a branch or tag does not prove an environment is provisioned. Consult `10-devops/environments.md` and the [dated verification record](../15-project-control/documentation-verification.md#hu-docs-94-verification-entry--2026-10-24). Root composition remains HU-INF-02/#239; operational-guide reconciliation belongs to HU-DOCS-96. A candidate or partial run is recorded as a dependency, not complete platform readiness.

---

## DoR vs. DoD

| | Definition of Ready (DoR) | Definition of Done (DoD) |
|-|--------------------------|--------------------------|
| **When** | Before starting the story | After completing the story |
| **Who Verifies It** | The team during planning/refinement | The team during review |
| **Purpose** | Ensure the team can start without blockers | Ensure the increment is deliverable |

---

## References

- Complementary DoD → `00-governance/definition-of-done.md`
- User Story Template → `04-requirements/_template-hu.md`
- User Story Backlog → `04-requirements/user-stories.md`
