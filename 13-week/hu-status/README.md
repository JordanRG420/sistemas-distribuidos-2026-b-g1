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
| #281 | [security] Customer identity documents never appear in gateway logs | done | https://github.com/code-corhuila/synkro-docs/issues/281 |
| #282 | [security] A burst of customer list requests cannot block the sale saga | done | https://github.com/code-corhuila/synkro-docs/issues/282 |
| #283 | [security] INVENTORY cannot read or change customer data | done | https://github.com/code-corhuila/synkro-docs/issues/283 |

## 2. My individual contribution

- CP0: claimed the `synkro-api-gateway -> synkro-customers-api` boundary, opened [issue #269](https://github.com/code-corhuila/synkro-docs/issues/269).
- CP1: mapped the attack surface, trust boundaries and asset inventory for this boundary in `13-week/workshop/01-attack-surface.md`.
- CP2: wrote the STRIDE analysis (6 threats, risk ranking, residual risk) in `05-architecture/security/stride-JordanRG420.md`, opened [PR #276](https://github.com/code-corhuila/synkro-docs/pull/276).
- CP3: opened 3 security backlog stories (#281, #282, #283), prioritized by risk, one citing Schach (2006, pp. 143-145).
- CP4: drafted `security.yml` (secret scan, dependency audit, authorization tests) and one negative authorization test for `synkro-customers-api`, verified against the service's real stack (Java 21, Spring Boot 3.5.0, `node tests/verify.mjs`).
- CP5: reviewed [Angel's STRIDE PR #277](https://github.com/code-corhuila/synkro-docs/pull/277#issuecomment-6523592234) (boundary: gateway -> auth-api), flagged that his TLS/mTLS mitigation on row T needs its own ADR before it fits the team's declarative-gateway stack.
- CP6: accepted Angel's own review on row E of my table (a `synkro-workflow` SERVICE token can be misused beyond `GET /{id}`), verified it against `Caller.authorize()` and `LifecycleHttpTest` at the commit he linked, and updated the STRIDE table and entry points accordingly.
- CP7: refined the 3 backlog stories; added a 4th acceptance criterion to #283 (wire the existing SERVICE-token negative coverage into shared CI) directly from the CP6 finding. Checked for overlap with Fredman's (#284-286, sales/workflow boundary) and Sergio's (#271-273, products-api boundary) stories — none overlap with mine.
- CP8: ran `CustomersAuthorizationNegativeTest` against the real `synkro-customers-api` (`node tests/verify.mjs`): 17 tests, 0 failures; coverage above threshold on all 4 modules. Fixed a real YAML ambiguity in `security.yml` (bare `on:` parsed as boolean `true`; quoted it).
- CP9: wrote "Implementation plan for my project" in the reflection document and closed the workshop.

## 3. Blockers and risks

- My progress-delivery pushes (CP1 onward) landed after the official in-class window (2026-10-28, 18:30-20:10); I messaged the professor about this.
- `synkro-api-gateway` still has no NGINX config for the `/api/v1/customers` route, so the CP2 mitigation for threat I (masking `identityDocument` in the access log) remains open — it is the first item in my implementation plan for next sprint.
- Running the full test suite locally needed Docker Desktop actually running (not just installed) and Node 22 on PATH; both needed setup before CP8 could produce a real result.

## 4. Plan for next week

- Implement the gateway log-format fix for threat I (risk 9) — the highest-risk open item.
- Wire the existing `synkro-workflow` SERVICE-token negative tests into the shared CI pipeline, per the CP7 update to issue #283.
- Follow up on whether `synkro-api-gateway` and `synkro-customers-api` pick up these stories in the next sprint planning.

## 5. Compliance self-check

- [x] Conventional Commits - `type(scope): summary`
- [ ] Per-environment HU branch + PR to that environment (hu-xxx-dev -> develop, ...) — not applicable this week: `synkro-docs` uses `docs/*` and `security/*` branches to `main`, not per-environment branches.
- [x] Testable acceptance criteria
- [x] Tests added/updated (unit / integration) — ran locally against real `synkro-customers-api`, 17/17 passing; not yet merged there
- [ ] DDD / hexagonal boundaries respected (domain has no I/O) — no production code changed this week
- [x] No secrets; config via environment variables

## 6. Evidence links

- Claim issue: https://github.com/code-corhuila/synkro-docs/issues/269
- Fork folder: https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/tree/main/13-week/workshop
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
- `fix(w13): correct CP4 negative test against real customers-api auth` — https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/47e9b59724f18b705d66511cfb964c95dfc73b24
- `docs(security): address review on STRIDE for synkro-api-gateway -> synkro-customers-api` — https://github.com/code-corhuila/synkro-docs/commit/30b6c6bd94e0bfb2e90f02fa5e3c0a622dcc452d
- `docs(w13): refine security backlog stories` — https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/450319cc929f7159aec97a6145b5f8deeebe848e
- `test(w13): run negative authorization test and record output` — https://github.com/JordanRG420/sistemas-distribuidos-2026-b-g1/commit/3fc7287f3e22d44b4638818543dc8672a78fdb39