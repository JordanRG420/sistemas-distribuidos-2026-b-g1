<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       04-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 06

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: Group - synkro-tech
- SPRINT_GOAL: Close the architecture documentation gap in `05-architecture/` (HU-04, done) and unify FR/NFR requirement identifiers across the repository, disconnecting it from the external PDR (HU-05, in progress).
<!-- CONFIG-END -->

## Docs Repository

| Board Name          | URL                                              |
| -------------------- | ------------------------------------------------ |
| synkro-docs Repository | https://github.com/code-corhuila/synkro-docs.git |

## Team Members

| Full Name                          | GitHub User                                                 |
| ----------------------------       | ------------------------------------------                  |
| Angel Gustavo Solano Trujillo      | https://github.com/AsolanoT                                 |
| Sergio Andres Ordoñez Diaz         | https://github.com/SergioAndres17                           |
| Fredman Santiago Plazas Artunduaga | https://github.com/SantiagoPlazas2005                       |

## 1. User stories worked this week

| HU ID | Title | Status (todo/doing/done) | Evidence (PR or commit URL) |
|---|---|---|---|
| HU-DOCS-24 | Create the canonical functional requirements document | doing | `01-context/scope.md`, "All Candidate Functionalities" table |
| HU-DOCS-27 | Update the traceability matrix with the new identifiers | todo | — (blocked by HU-DOCS-24) |

## 2. My individual contribution

**Context:** HU-DOCS-24 has two deliverables — a new canonical
`04-requirements/functional.md`, and an edit to `01-context/scope.md` so
it stops duplicating requirement descriptions. Only the second one is
done.

**What's done:**
- `01-context/scope.md`, "All Candidate Functionalities" table rewritten:
  every row now reads `FR-001` through `FR-010` (3-digit, matching the
  team's confirmed format), with the full requirement descriptions
  removed and replaced by a pointer to `functional.md` — even though that
  file doesn't exist yet. Verified against the agreed patch, no
  discrepancies.

**What's NOT done — this is the actual blocker for HU-DOCS-24:**
- [ ] **`04-requirements/functional.md` does not exist in the repository yet.** This is the HU's central deliverable — a `scope.md` table pointing to a file that isn't there yet is a broken reference, not a completed story. Content is fully drafted and ready to upload (`FR-001`–`FR-010`, responsible service, description, source `HU-PDR-06`, priority, plus an informational Corte 1 implementation-status table and correlations).

**Why HU-DOCS-27 is still `todo`:** it depends on `functional.md` and on
`non-functional.md`'s IDs being consistent across the repo (HU-DOCS-25,
Santiago) — the traceability matrix can't be rebuilt on IDs that are
still in flux elsewhere.

## 3. Blockers and risks

- `functional.md` missing blocks HU-DOCS-24 from closing and blocks
  HU-DOCS-27 from starting. This is fully within my control to resolve
  next session — content is ready, it just needs to be committed.
- HU-DOCS-25 (Santiago) is still mid-flight: several files still cite
  the old `RF-`/`RNF-` prefixes or the wrong NFR category (see his
  status below). Since `functional.md` references `non-functional.md`
  in its Correlations section, I'll hold off finalizing until his fixes
  land, to avoid citing a moving target.

## 4. Plan for next week

- Upload `04-requirements/functional.md` (content already drafted and
  reviewed).
- Coordinate with Santiago so HU-DOCS-25's fixes land before I start
  HU-DOCS-27, since the traceability matrix depends on both being
  stable.
- Re-verify `scope.md`'s candidate table still matches `functional.md`
  once both exist side by side.

## 5. Compliance self-check
- [x] Conventional Commits - `type(scope): summary`
- [x] Per-environment HU branch + PR to that environment — N/A: direct commit to `main` for `docs` per `documentation-rules.md` (no branches in this repo)
- [ ] Testable acceptance criteria — pending: HU-DOCS-24's Scenario 1 (functional.md must exist with 10 requirements) is not yet met
- [x] Tests added/updated (unit / integration) — N/A, documentation-only HU
- [x] DDD / hexagonal boundaries respected (domain has no I/O) — N/A, no code touched this week
- [x] No secrets; config via environment variables

## 6. Evidence links
- Partial progress: `01-context/scope.md`, "All Candidate Functionalities" table
- Pending deliverable: `04-requirements/functional.md`
