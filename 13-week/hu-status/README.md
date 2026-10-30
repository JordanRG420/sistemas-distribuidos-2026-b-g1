<!-- HU-STATUS TEMPLATE - do NOT remove the <!-- ... --> markers or the table headers.
     Your weekly grade is read AUTOMATICALLY from this file:
       13-week/hu-status/README.md  (inside YOUR fork). English. -->

# Weekly Status - Week 13

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Jordan Ramirez Gallego
- GITHUB_USER: JordanRG420
- TEAM: Group 10 - synkro-tech
- SPRINT_GOAL: Threat model and security backlog for the synkro-api-gateway -> synkro-customers-api boundary (Week 13 guided workshop)
<!-- CONFIG-END -->

## 1. User stories worked this week

| HU ID | Title | Status (todo/doing/done) | Evidence (PR or commit URL) |
|---|---|---|---|
| #281 | [security] Customer identity documents never appear in gateway logs | doing | https://github.com/code-corhuila/synkro-docs/issues/281 |
| #282 | [security] A burst of customer list requests cannot block the sale saga | doing | https://github.com/code-corhuila/synkro-docs/issues/282 |
| #283 | [security] INVENTORY cannot read or change customer data | doing | https://github.com/code-corhuila/synkro-docs/issues/283 |

## 2. My individual contribution

- CP0: claimed the `synkro-api-gateway -> synkro-customers-api` boundary, opened [issue #269](https://github.com/code-corhuila/synkro-docs/issues/269).
- CP1: mapped the attack surface, trust boundaries and asset inventory for this boundary in `13-week/workshop/01-attack-surface.md`.
- CP2: wrote the STRIDE analysis (6 threats, risk ranking, residual risk) in `05-architecture/security/stride-JordanRG420.md`, opened [PR #276](https://github.com/code-corhuila/synkro-docs/pull/276).
- CP3: opened 3 security backlog stories (#281, #282, #283), prioritized by risk, one citing Schach (2006, pp. 143-145).
- CP4: drafted `security.yml` (secret scan, dependency audit, authorization tests) and one negative authorization test for `synkro-customers-api`, verified against the service's real stack (Java 21, Spring Boot 3.5.0, `node tests/verify.mjs`).
- CP5: reviewed [Angel's STRIDE PR #277](https://github.com/code-corhuila/synkro-docs/pull/277#issuecomment-6523592234) (boundary: gateway -> auth-api), flagged that his TLS/mTLS mitigation on row T needs its own ADR before it fits the team's declarative-gateway stack.

## 3. Blockers and risks

- My progress-delivery pushes (CP1 onward) landed after the official in-class window (2026-10-28, 18:30-20:10); I messaged the professor about this.
- `synkro-api-gateway` has no NGINX config yet for the `/api/v1/customers` route specifically, so the CP2 missing mitigation for threat I (masking `identityDocument` in the access log) cannot be implemented until that config exists.

## 4. Plan for next week

- CP6: answer Angel's review on my own PR once he leaves one, finish the residual-risk paragraph and References section.
- CP7: refine the 3 backlog stories (confirm STRIDE letter, risk, labels, PR link on each).
- CP8: actually run `CustomersAuthorizationNegativeTest` against `synkro-customers-api` and record the console output; validate `security.yml` with a YAML linter.
- CP9: write "Implementation plan for my project" in the reflection document and close the workshop.

## 5. Compliance self-check

- [x] Conventional Commits - `type(scope): summary`
- [ ] Per-environment HU branch + PR to that environment (hu-xxx-dev -> develop, ...) — not applicable this week: `synkro-docs` uses `docs/*` and `security/*` branches to `main`, not per-environment branches.
- [x] Testable acceptance criteria
- [x] Tests added/updated (unit / integration) — proposed, not yet merged into `synkro-customers-api`
- [ ] DDD / hexagonal boundaries respected (domain has no I/O) — no production code changed this week
- [x] No secrets; config via environment variables

## 6. Evidence links

- Claim issue: https://github.com/code-corhuila/synkro-docs/issues/269
- Fork folder: https://github.com/JordanRG420/synkro-docs/tree/main/13-week/workshop
- STRIDE PR: https://github.com/code-corhuila/synkro-docs/pull/276
- Security backlog: https://github.com/code-corhuila/synkro-docs/issues/281, https://github.com/code-corhuila/synkro-docs/issues/282, https://github.com/code-corhuila/synkro-docs/issues/283
- Review comment on Angel's PR: https://github.com/code-corhuila/synkro-docs/pull/277#issuecomment-6523592234
- Reflection document: https://corhuilaeduco-my.sharepoint.com/:w:/g/personal/jramirez-2023a_corhuila_edu_co/IQD2zQY8yeUaS6jBGoa_R00cAQGsKbmpn9UttY0pq6YIjn8?e=Xz28dy

### Commits

- `docs(w13): start threat modeling workshop` — https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/7f7f716e78b94b91caff59db4fb6fbb8ceca1c38
- `docs(w13): map attack surface and trust boundaries` — https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/dcb9cdbc0304c331c6daea5a0eaeab8993087b8a
- `docs(security): STRIDE context and first threats for synkro-api-gateway -> synkro-customers-api` — https://github.com/code-corhuila/synkro-docs/commit/398a67ea3cfd83fb07bf48dc5a5bf5284a3476be
- `docs(security): complete STRIDE and risk ranking for synkro-api-gateway -> synkro-customers-api` — https://github.com/code-corhuila/synkro-docs/commit/0aae9996e12f27391b945bdd84897bf70fb730e5
- `docs(w13): link security backlog stories` — https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/2cdf4096ec935d210f37b01a3bf2f1a237de7d33
- `ci(w13): add security gates and negative authorization test` — https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/2b132eb26222f11543251d6f1e2f364d3eef7bbf
- `fix(w13): correct CP4 negative test against real customers-api auth` https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/47e9b59724f18b705d66511cfb964c95dfc73b24