# Definition of Done (DoD)

> A User Story is **DONE** when it meets ALL the criteria in the checklist that applies to it.
> If even one criterion is missing, the story is NOT done and returns to "In Progress".
> This file has two checklists — code and documentation — because most of the
> project's stories so far are documentation, not code.

## Mandatory Checklist — Code Stories

### Code
- [ ] The code implements all acceptance criteria of the user story
- [ ] The code has been reviewed and approved by at least 1 independent team member on the actual delivered changes; stale/dismissed reviews are not current approval
- [ ] Delivery into main also has the required ariel5253 approval; owner integration instructions are recorded as their actual decisions, without relabeling them as codeowner approval
- [ ] The code follows the project's standards and existing CI lint/format/build/architecture checks; unsuccessful or unstarted runs keep their actual status
- [ ] No technical debt is introduced without being recorded in `15-project-control/technical-backlog.md`

### Testing
- [ ] Unit tests have been written for the new business logic (TDD: test before code)
- [ ] All applicable tests pass locally with revision, scope and outcome recorded; a setup failure does not retrospectively prove a functional TDD red
- [ ] Acceptance criteria have been verified (manually or automatically)
- [ ] Minimum backend line coverage met: ≥ 90% domain, ≥ 80% application, ≥ 60% infrastructure, ≥ 80% global; frontend statements remain ≥ 85% Host client/session, ≥ 70% portal components/hooks/services, ≥ 70% global (`11-quality/testing-strategy.md`)
- [ ] Real-engine, controlled-HTTP, real-service, browser and root-composition evidence are distinguished. Test existence or a tag is not a successful execution

### Integration
- [ ] If the service calls another one (the workflow calls participants during the saga, or the worker calls products-api), that real HTTP call was tested manually, not only with mocks. Token validation is local (ADR-006) — no service calls Auth at runtime
- [ ] If there are API changes: the OpenAPI contract in `07-api/contracts/openapi/` has been updated — the contract is the source of truth for frontend and service-to-service communication (P4)
- [ ] If there are schema changes (new tables, columns, indexes, roles): the migration lives in the domain's `-db` repository, never in the `-api` (ADR-005 Decision 2, ADR-009)
- [ ] If there are changes to the data model: `06-data/models.md` has been updated for the affected schema
- [ ] If there are new or modified domain events: `02-domain/domain-events.md` has been updated (note: no events are published in the MVP — ADR-007 Decision 5; this criterion applies when a message broker is adopted in a future version)

### Deployment
- [ ] The code is mergeable into the `develop` branch of the corresponding repository (`synkro-auth-api`, `synkro-customers-api`, `synkro-products-api`, `synkro-sales-api`, `synkro-workflow`, `synkro-worker`, or the `-db` and `-portal` repos)
- [ ] Existing CI/CD checks pass for the relevant revision. A previous green run, later billing-locked release and reported local acceptance remain separate evidence
- [ ] It runs correctly in the actual target environment via Docker Compose, with the service README and `synkro-infra-postgres`/`synkro-infra-mongo` composition references. Branches do not establish deployment or completed root acceptance

### Documentation
- [ ] The service's `README.md` has been updated if the public interface changed
- [ ] If a significant new technical decision was made, a new ADR was created (e.g., `ADR-002-*.md`) — **accepted ADRs are immutable**; changed decisions use a new record identifying the modified sections

---

## Mandatory Checklist — Documentation Stories

For stories whose deliverable is a `.md` file in the `docs` repo (governance,
context, domain, product, UX-UI, architecture decisions), with no code
component:

- [ ] The document meets the minimum content expected by that section's template, with no blank sections and no unfilled `[bracket]` or `#[hex]` placeholders
- [ ] Existing headings, tables, examples and comments are preserved unless the required correction affects them. Update outdated statements in their original location; do not embed previous complete versions or duplicate current/historical instructions
- [ ] It does not duplicate content that already exists in another file in the repo (it was referenced instead of repeated)
- [ ] It is consistent with the other existing documents (no contradictions — especially against ADR-001, ADR-005 Decisions 2–5, ADR-009 and `02-domain/entities-and-rules.md`)
- [ ] It has been reviewed by at least one other team member; applicable checks and required main approval are recorded
- [ ] Complete English files are merged into `main` and the catalog records the real completion evidence; prepared files alone do not close the issue
- [ ] Links, anchors, IDs, test-to-implementation relationships and counters are checked without inventing execution or review evidence

---

## Allowed Exceptions

The following exceptions must be explicitly agreed upon by the team:
- E2E tests omitted due to environment limitations (document the risk)
- Documentation deferred due to an urgent delivery (create a technical debt ticket in `15-project-control/technical-backlog.md`)

As observed on 2026-10-24, the specifically cited release jobs blocked by billing did not start. This does not waive another gate or mean every failed run has that cause. Closed issues and their remaining evidence limits are recorded separately in the dated verification entry.

---

## What Is NOT a "Done" Criterion

- "The code is on my machine" — it must be in the repository
- "It works in my local environment" — it must work Locally via Docker Compose following the README, not only on the machine of whoever wrote it
- "The professor approved it in class" — that is the Definition of Done for the product, not for the code or the document

---

## References

- Complementary DoR → `00-governance/definition-of-ready.md`
- User Story Backlog → `04-requirements/user-stories.md`
- Technical debt → `15-project-control/technical-backlog.md`
