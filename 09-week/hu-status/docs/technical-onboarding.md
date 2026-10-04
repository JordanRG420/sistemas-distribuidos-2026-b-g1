# Technical Onboarding

> Welcome to the team. This document is your guide for the first days.
> Goal: you can make your first commit in 3 days.
> If anything in this document is unclear or outdated, fix it yourself — that is your first contribution.

---

## Day 1 — Setup and context

### Morning: Access and environment

- [ ] Get access to the `code-corhuila` GitHub organization (confirm with the Tech Lead)
- [ ] Get access to the team's chat channel and the GitHub Project board
- [ ] Configure your local environment following `10-devops/local-setup.md`
- [ ] Verify that `curl http://localhost:8000/health` responds `{"status": "ok", ...}` (that is the gateway's health check, not a single service's)

### Afternoon: Read core documentation

Read in this order — each builds on the previous:

1. `00-sdd-guide.md` — How the team works (30 min)
2. `01-context/overview.md` — What we are building (20 min)
3. `02-domain/domain-map.md` — The business domain (30 min)
4. `05-architecture/overview.md` — How it is built (30 min)
5. `00-governance/git-conventions.md` — How we manage code (20 min)

### Day 1 meetings

- [ ] Meet & greet with the team
- [ ] 1:1 with the Tech Lead (30 min) — project context and your responsibilities
- [ ] Product demo (if there is a recording, watch it beforehand)

---

## Day 2 — Understand the domain

### Read domain and requirements documentation

- [ ] `02-domain/entities-and-rules.md` — Entities and business rules
- [ ] `04-requirements/user-stories.md` — HUs for the current sprint
- [ ] `01-context/glossary.md` — Project terms

### Explore the code

- [ ] Clone the repository for the service you will work on, as a sibling of
      `synkro-infra` (`05-architecture/deployment.md` §9)
- [ ] Read `09-microservices/service-catalog.md` for your service's card — the
      per-service `README.md` files under `09-microservices/services/` do not
      exist yet (see the note at the top of `service-catalog.md`)
- [ ] Follow the folder structure — it should match
      `05-architecture/hexagonal-architecture.md` and your stack guide
      (`_stacks/java-spring.md` or `_stacks/go.md`)
- [ ] Run the tests — `mvn test` (Java) or `go test ./...` (Go); all must be green
- [ ] Run the service locally and test its `/health` endpoint

### Day 2 meeting

- [ ] Domain walkthrough session with the Tech Lead or a senior developer (1 hour)
  - Ask them to explain the register-sale saga (`ADR-007`) — it is the one flow that crosses every domain
  - Take notes on terms you do not know — add them to the glossary

---

## Day 3 — First contribution

### Your first task

The Tech Lead will assign you a small task labeled `good-first-issue`:
- It should be a small bug fix or documentation improvement
- The goal is to learn the workflow, not the complexity of the task

### TDD workflow for your first task

1. Read the HU and its acceptance criteria
2. Write the test that verifies the criterion (`🔴 RED`)
3. Implement the minimum code to make the test pass (`🟢 GREEN`)
4. Refactor if necessary (`♻️ REFACTOR`)
5. Create the PR following the conventions in `00-governance/git-conventions.md`

### Checklist before opening the PR

- [ ] `mvn test` (Java) or `go test ./...` (Go) passes
- [ ] Linting passes (`mvn verify` with checkstyle, or `go vet ./...`)
- [ ] The commit title follows `type(scope): description`
- [ ] The branch is named `feat/short-description` or `fix/short-description` — never with the HU's ID in the name (`CONTRIBUTING.md`, "Branch naming")

---

## Week 1 — Go deeper

| Day | Activity |
|-----|----------|
| 4 | Code review (participate in the team's code review — observe first) |
| 5 | Participate in the Daily Standup with something concrete to report |
| 5 | Read `05-architecture/pattern-guide.md` — the patterns we use |
| 5 | Read `11-quality/tdd-guide.md` and `11-quality/testing-strategy.md` in full |

---

## Week 2 — Guided independence

- [ ] Complete your first HU independently
- [ ] Actively participate in a code review
- [ ] Read `07-api/guidelines.md` and understand an OpenAPI contract for a service you use
- [ ] Participate in the sprint Retrospective

---

## Architecture: The 5 concepts you must understand first

Before writing code, understand these 5 concepts from the project's architecture:

### 1. Bounded Contexts
Each domain service corresponds to a Bounded Context of the domain.
See: `02-domain/domain-map.md`

### 2. Hexagonal Architecture
The domain is the center. Nothing from the framework enters the domain or the
application layer — only the adapters touch I/O.
See: `05-architecture/hexagonal-architecture.md`

### 3. Ports and Adapters
Interfaces (ports) live in the application layer. Implementations (adapters)
live in infrastructure.
See: `05-architecture/hexagonal-architecture.md`, "Where each layer lives in the repository"

### 4. The flow of a request
```
HTTP Request
  → [Controller / Handler] (inbound adapter)
  → [Use Case] (application)
  → [Entity] (domain — business logic lives here)
  → [Repository] (port → outbound adapter)
  → synkro-db (the service's own schema only)
```

### 5. The saga, not events
Services do not communicate through domain events — there is no message
broker in the MVP (ADR-007 Decision 5). The one process that crosses
domains, registering a sale, is coordinated synchronously by
`synkro-workflow` with a persisted saga state.
See: `02-domain/entities-and-rules.md`, "Resolving external references between services"

---

## Frequently asked questions (FAQ)

**Can I commit directly to `main` or `develop`?**
No. Everything goes through a PR with at least 1 approval
(`00-governance/git-conventions.md`).

**Can I change the database schema directly?**
No. Every change goes as a versioned Flyway migration, in the domain's
`-db` repository — never in the `-api` (ADR-005 Decision 2). See
`06-data/models.md`.

**How do I know if my API change breaks consumers?**
There is no automated contract test yet (`11-quality/testing-strategy.md`,
Tier 3). Until it exists, update the OpenAPI contract in the same PR and
ask the consuming team to review it.

**My service needs data from another domain — can I query its schema?**
No. Every domain's schema is isolated by `GRANT` in the shared instance
(ADR-009); call that domain's API instead.

**Where do I ask for help if I am stuck?**
1. Search this documentation first
2. Ask in the team's channel
3. Do not wait more than 1 hour before asking for help — the team's time is valuable

**What do I do if I find incorrect or outdated documentation?**
Fix it and open a PR. Documentation is code.

---

## Correlations

- Local environment setup → `10-devops/local-setup.md`
- Branch and commit conventions → `00-governance/git-conventions.md`, `CONTRIBUTING.md`
- Testing tools and thresholds → `11-quality/testing-strategy.md`
- TDD cycle → `11-quality/tdd-guide.md`
- Your stack's folder layout and commands → `_stacks/java-spring.md`, `_stacks/go.md`
