# Definition of Ready (DoR)

> A User Story is **Ready** when the entire team can start working on it in the next sprint
> without needing to resolve fundamental questions halfway through.
> If a story does not meet this DoR, it returns to refinement.

---

## DoR Checklist

Before moving a User Story to "Ready for Sprint", verify:

### Clarity

- [ ] The story is written in the format: **As a [role], I want [action], so that [benefit]**
- [ ] The role is specific (not "as a user" — "as an authenticated salesperson")
- [ ] The expected benefit is clear and verifiable

### Acceptance Criteria

- [ ] There are at least 2 acceptance criteria written in the **Given / When / Then** format
- [ ] The criteria cover the happy path AND the main error cases
- [ ] The criteria are testable (it is possible to write an automated test for each one)
- [ ] There are no ambiguous criteria ("the response should be fast" is not valid)

### Dependencies

- [ ] All external dependencies (other services, APIs, data) are identified
- [ ] Blocking dependencies are resolved OR a workaround is defined
- [ ] If it depends on another story, that story is already Done or In Progress

### Estimation

- [ ] The team has estimated the story (story points)
- [ ] There is agreement that the story fits within a sprint
- [ ] If it is too large, it has been split into smaller stories

### Technical Readiness

- [ ] The required access and environments are available
- [ ] API contracts (OpenAPI) are defined if the story involves new endpoints
- [ ] A data model definition exists if there are database changes (affected schema)
- [ ] The impact on other services has been identified

### Non-Functional Requirements

- [ ] Performance requirements are specified (if applicable)
- [ ] Security requirements are considered (authentication, authorization, validations)
- [ ] Observability requirements are included (logs, metrics)

---

## Common Reasons Why a Story Is NOT Ready

| Problem | What to Do |
|---------|-----------|
| Unclear requirements | Schedule a 30-minute refinement session with the Product Owner (the professor) |
| Missing acceptance criteria | Add them before the next sprint |
| Unknown dependencies | The team reviews and documents the dependencies |
| Too large (> 8 SP) | Split it into smaller stories |
| No access to the testing environment | Configure credentials before the sprint |
| Unclear API contract | Agree on the contract (OpenAPI) before starting |

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