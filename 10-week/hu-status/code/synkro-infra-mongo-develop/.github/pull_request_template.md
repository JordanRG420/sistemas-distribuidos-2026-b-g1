## Problem and behavior

Describe the issue, resulting behavior and relevant acceptance criteria.

## Verification

- [ ] Tests written before implementation; red/green evidence linked
- [ ] Syntax, lint, configuration and real disposable MongoDB checks pass
- [ ] Authentication, bootstrap repetition, named-volume persistence and restore verified
- [ ] No secrets, domain migrations or unrelated changes; CODEOWNERS unchanged
- [ ] Temporary resource identities and ownership-checked cleanup recorded

## HU-INF-04 integration gate

Link reviewed Sales PR #5 / SHA `9cfbde7db4bea7bacad70370c60f91f8eb917c04`
and actual migration/replay, permissions, post-migration bootstrap, named-volume
persistence and application-only recovery evidence. Confirm remote CI at this PR's
exact SHA. Local checks alone do not complete HU-INF-04.

## Documentation and review

Reference `docs/handoff.md`, the separate synkro-docs PR, and manual peer review.
Promotion uses `cherry-pick -x`; main requires ariel5253 approval.
