# Team Agile Conventions

> Defines how the team works throughout its development cycles.
> Agreed upon by the entire team. Updated whenever the team decides to change something.

---

## Sprint Structure
| Field | Value |
|-------|-------|
| Duration | 1 week |
| Sprint Start | Monday |
| Sprint End | Sunday |
| Current Sprint | Sprint 3 — Week 3 of the project (16 weeks total) |
| Estimated Capacity | No estimation in story points for now (see note below) |

> **Note:** During Sprint 0 (weeks 1-2, discovery documentation phase), the team worked with `TASK` items (business documentation tasks) and `SPIKE` items (architecture research/decision tasks), without estimating story points, since these were not product user stories. Story point estimation (see scale below) will begin once actual product user stories exist, that is, when code implementation starts.

---

## Ceremonies

### Sprint Planning
- **When:** first day of the sprint (Monday)
- **Duration:** maximum 1 hour
- **Who:** entire team
- **Objective:** select and commit to the sprint's tasks/user stories, and break them down into technical tasks
- **Output Artifact:** updated GitHub Project with the sprint items

### Daily Stand-up
- **When:** asynchronous, through each team member's weekly README (`NN-week/hu-status/README.md`)
- **Format:**
  1. What did I do?
  2. What am I going to do?
  3. Is anything blocking me?
- **Rule:** technical discussions are resolved outside this report, not within it

### Sprint Review
- **When:** last day of the sprint (Sunday)
- **Duration:** maximum 30 minutes
- **Who:** team (without the Product Owner)
- **Objective:** internally present what was built/documented during the week before presenting it to the Product Owner

### Weekly (with Product Owner)
- **When:** every Wednesday, reviewing the work completed during the previous week (e.g., on Wednesday of week 4, the work completed during week 3 is reviewed)
- **Duration:** maximum 1 hour
- **Who:** team + Product Owner (the course professor)
- **Objective:** present the work built/documented during the previous week, gather feedback from the Product Owner, and use the same session to refine and detail the tasks/user stories for the following week (combines the Sprint Review-with-PO and Backlog Refinement functions into a single ceremony, since both depend on the professor's weekly availability)
- **Exit Criterion:** the task/user story for the following week satisfies the Definition of Ready (DoR)

### Sprint Retrospective
- **When:** last day of the sprint (Sunday), after the internal Sprint Review
- **Duration:** maximum 30 minutes
- **Who:** team (without the Product Owner)
- **Format:** What went well / What can be improved / Action commitments
- **Rule:** each retrospective produces at least 1 improvement action with an assigned owner

---

## Estimation

### Scale

| Points | Meaning |
|--------|-------------|
| 1 | Trivial — completed in hours |
| 2 | Small — completed in one day |
| 3 | Medium — takes 2–3 days |
| 5 | Large — takes almost a full sprint |
| 8 | Very large — should be split |
| 13 | Epic — MUST be split before the sprint |

**Technique:** Informal Planning Poker (team discussion, without a specialized tool)
**Applies From:** the first real product user stories (Implementation Sprint 1)

### Estimation Rule
- If there is disagreement of 2+ levels, discuss before voting again.
- If a story is estimated at 8 or 13 points, it must be split into smaller subtasks.

---

## Backlog Tool
**Tool:** GitHub Projects
**Board URL:** *(pending — the professor will provide the official board template)*

### Board Columns

| Column | Meaning |
|--------|-------------|
| What did I do? | Record of completed work during the period |
| Up Next | Planned upcoming tasks |
| Blockers | Impediments or dependencies |
| In Review | Under review by another team member |
| Done | Meets the Definition of Done (DoD) and is closed |

---

## Team Velocity

| Sprint | Completed Items | Notes |
|--------|----------------------|-------|
| Sprint 0 (weeks 1-2) | 8 TASK/SPIKE | Discovery documentation (PDR, ADR-001) |
| Sprint 3 (week 3) | 6 TASK/SPIKE | PDR/ADR revision + context map creation |
| Average | — | Will be calculated once implementation begins (story points) |

---

## Related Documents
- Definition of Ready → `00-governance/definition-of-ready.md`
- Definition of Done → `00-governance/definition-of-done.md`
- Risk Management → `15-project-control/risks.md`
- Technical Backlog → `15-project-control/tech-backlog.md`