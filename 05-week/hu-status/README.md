<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       04-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 05

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: Group - synkro-tech
- SPRINT_GOAL: Close the professor's S00/S06/S12 rubric feedback, formally answer the professor's HU-01 (Technology Stack Selection) and HU-02 (Project Discovery) by auditing existing documentation before writing anything new, and deliver the Corte 1 MVP in the dedicated `synkro-tech` repository.
<!-- CONFIG-END -->

## Docs Repository

| Board Name          | URL                                              |
| -------------------- | ------------------------------------------------ |
| synkro-docs Repository | https://github.com/code-corhuila/synkro-docs.git |

## Team Members

| Full Name                          | GitHub User                                                 |
| ----------------------------       | ------------------------------------------                  |
| Sergio Andres Ordoñez Diaz         | https://github.com/SergioAndres17                           |
| Fredman Santiago Plazas Artunduaga | https://github.com/SantiagoPlazas2005                       |
| Jordan Ramirez Gallego             | https://github.com/JordanRG420                              |
| Angel Gustavo Solano Trujillo      |  https://github.com/AsolanoT                                |

## 1. User stories worked this week

| HU ID | Title | Status (todo/doing/done) | Evidence (PR or commit URL) |
|---|---|---|---|
| HU-DOCS-16 | Complete UX-UI (S12): design system and navigation map | done | `12-ux-ui/design-system.md`, `navigation-map.md` |
| HU-DOCS-21 | `overview.md` refinement: Database evaluation | done | `01-context/overview.md`, "Alternatives Considered" |
| HU-DOCS-23 | Correction of `scope.md`: full candidate list, RF citation fixes, Corte 1 status | done | `01-context/scope.md` |

## 2. My individual contribution

**Context:** the professor's rubric marked `12-ux-ui` as 🔴 —
`design-system.md` still had unreplaced `#[hex]` placeholders, and
`navigation-map.md` was incomplete. Later in the sprint, while answering
HU-02's "list all candidate features" task, I found `scope.md` itself had
a traceability defect worth fixing properly rather than just referencing.

**HU-DOCS-16 — Design system and navigation map:**
- Found the MVP frontend already had a complete, working design system
  approved in Figma (steel-blue/copper) — used that as the real baseline
  instead of inventing colors from scratch.
- Built an interactive 3-way palette comparison (already-implemented,
  industrial teal/orange, logo-derived) applied to the same real screen,
  so the team could choose deliberately.
- The team picked a fourth option, **Crimson Circuit** (navy/brick-red),
  from reference files. I merged those into the full `design-system.md`
  structure (tokens, components, UX patterns, accessibility guide,
  correlations) and verified WCAG AA contrast on every token pair, in both
  themes, computationally. Dark theme is documented as target design,
  explicitly scoped to Corte 2.
- For `navigation-map.md`, I pulled the real routes and RBAC from the
  MVP's actual code instead of the template's generic tree, added a shared
  `/dashboard` for all 3 roles, and documented JWT (RS256) authentication
  as target design, separated from the MVP's simplified login. Later added
  three per-role journey flows (ADMIN/SALESPERSON/INVENTORY) once we
  confirmed the original two flows were business-process flows, not role
  journeys.

**HU-DOCS-21 — Database evaluation (PostgreSQL vs. MongoDB):**
- Compared PostgreSQL against MongoDB, anchored on two real business rules
  (a sale's total must stay consistent with its stock deduction),
  concluding PostgreSQL's transactional guarantees fit this domain better.

**HU-DOCS-23 — `scope.md` correction:**
- While mapping HU-02's "list all candidate functionalities" task, found
  that `scope.md`'s existing "MVP Scope" table cited functional
  requirement IDs that didn't actually match the PDR's real numbering
  (e.g., Authentication was cited as `FR-01`, but the real requirement for
  authentication is `RF-10`; almost every row had the same kind of
  mismatch). Corrected every citation against the real requirement text.
- Added a new "All Candidate Functionalities" section listing all 16 items
  considered (10 in scope, 2 explicitly out, 4 future candidates) with
  their disposition, directly answering HU-02's task instead of only
  referencing an external, ungraded PDR file.
- Added a "Corte 1 Status" column to the MVP Scope table, honestly marking
  what's actually implemented today (Authentication is simulated only;
  Sales Reports aren't populated yet) versus full-MVP target scope.
- Removed `scope.md`'s dependency on the PDR entirely — the "Open
  Questions" section is now reproduced directly, and a link to the real
  `synkro-tech` repository was added, so `scope.md` is self-contained.

## 3. Blockers and risks

- None remaining on my three HUs.
- The `RF` vs `RNF` prefix inconsistency across the project (PDR uses
  `RNF-0X` for non-functional requirements; several other files, including
  ones I contributed to, use `NFR-0X`) is a larger, multi-file issue not
  resolved in `HU-DOCS-23` to avoid scope creep — flagged for the team to
  decide whether it's worth a dedicated cleanup pass.

## 4. Plan for next week

- Bring the `RF`/`RNF` vs `FR`/`NFR` prefix question to the team for a
  decision on standardizing project-wide.
- Support QA validation of the Corte 1 MVP against the corrected
  `scope.md` scope table, now that it accurately reflects what's really
  built.

## 5. Compliance self-check
- [x] Conventional Commits - `type(scope): summary`
- [x] Per-environment HU branch + PR to that environment — not applicable to `docs` repo (no branches, direct commit to `main` per `documentation-rules.md`)
- [x] Testable acceptance criteria
- [x] Tests added/updated (unit / integration) — not applicable, documentation-only HUs
- [x] DDD / hexagonal boundaries respected (domain has no I/O) — not applicable, documentation-only HUs
- [x] No secrets; config via environment variables

## 6. Evidence links
- Design system: [`design-system.md`](./docs/12-ux-ui/design-system.md)
- Navigation map: [`navigation-map.md`](./docs/12-ux-ui/navigation-map.md)
- Database alternatives: [`overview.md`](./docs/01-context/overview.md), "Alternatives Considered" → Database subsection
- Scope correction: [`scope.md`](./docs/01-context/scope.md)
