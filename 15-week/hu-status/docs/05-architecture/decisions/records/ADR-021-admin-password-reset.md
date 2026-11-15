# ADR-021 — ADMIN Password Reset: Endpoint, Request Replay and Audit

| Field | Value |
|---|---|
| **ID** | ADR-021 |
| **Proposal date** | 2026-11-10 |
| **Status** | Accepted |
| **Acceptance date** | 2026-11-10 |
| **Acceptance evidence** | Explicit project-owner acceptance on 2026-11-10 of the revised original-request bcrypt receipt and concurrent-login fencing, communicated in the PR #310 follow-up. Jordan approved previous head 7ef3162; that review is not claimed for this revision. Architectural acceptance is separate from implementation, fresh peer review and Ariel main-publication approval. |
| **Authors** | Angel Gustavo Solano Trujillo — HU-ARQ-31 owner |
| **Reviewers** | Requested: Sergio Andrés Ordóñez Díaz, Fredman Santiago Plazas Artunduaga. Main publication requires the approval of `ariel5253` (CODEOWNERS). Jordan approved the earlier proposal; fresh review of this revised head remains separate. |
| **Modifies** | ADR-004 Decision 6 (endpoint register) and Decision 7 (Auth endpoints), **extended only**: one endpoint is added and no existing endpoint changes |
| **Builds on** | ADR-014 (ADMIN-only operations and atomic audit), ADR-017 (stateless-JWT boundary), ADR-016 (Host session and operation recovery), ADR-006 (local token validation), ADR-009 (shared PostgreSQL, schema per domain) |
| **Traced to** | HU-ARQ-31 / #309; HU-AUTH-19 / #306; FR-010; NFR-004/006/009 |

---

## Context

An ADMIN has no way to restore a user's access: the Auth contract has registration, login, refresh, logout, lookup, search and service tokens, and `security-policy.md` states that no password-change endpoint is implemented. HU-AUTH-19 / #306 adds one administrative operation. [ADR-004](ADR-004-api-contract-extensions.md) is Accepted and immutable, and its Decision 6 says that adding an endpoint later requires a new ADR, so this operation needs a record before it can be presented as architecture-backed. [ADR-019](ADR-019-customer-search-and-reactivation.md) extended the same register for Customers; this record extends it for Auth.

**What the delivered Auth code does today** (inspected on `synkro-auth-api` `develop` at `eeb4cf3` and `synkro-auth-db` `develop` at `8a8deb6`; reported runtime results are not evidence for this record):

- Passwords are hashed through the `PasswordHasher` port with bcrypt cost 12. The policy is 8 characters minimum and 72 bytes (UTF-8) maximum, enforced by the registration validator that the initial-administrator command also reuses.
- Login and refresh both require `active = true`. Refresh rows are deactivated, never deleted; `revokeAllOf(owner)` runs in its own transaction under a per-owner advisory lock that rotation also takes.
- `user_creation_audit` (V014–V017) is single-purpose: `outcome` is fixed to `SUCCESS`, `created_user_id` is `UNIQUE`, and `operation` is a closed set of two creation operations. `auth_app` has `SELECT` and `INSERT` on it only.
- `idempotency_key` has a global primary key and `resource_type IN ('USER','SERVICE_TOKEN')`.
- Person access JWTs are stateless and are not revoked by refresh-row changes ([ADR-017](ADR-017-refresh-reuse-and-jwt-revocation-boundaries.md)). That record also says password-change refresh invalidation stays a security requirement if such a flow is introduced, and that administrator recovery remains TD-009.

**Owner policy inputs** (HU owner, 2026-11-10, recorded on #306): the ADMIN types the new password; no first-login change; inactive targets are rejected; an ADMIN may reset only non-ADMIN users; all active refresh credentials of the target are revoked in the same transaction; issued person JWTs stay valid until expiry; and the operation requires an `Idempotency-Key` with the retry conditions detailed in Decisions 5 and 6.

**Constraints:**

- The error catalog is closed ([`07-api/guidelines.md`](../../../07-api/guidelines.md)): no new code and no `409`; a domain rule is `422 BUSINESS_RULE_VIOLATION`. `204` is not used.
- The gateway already routes `/api/v1/auth/` as a protected prefix, so no gateway change is part of this record.
- The actor identity comes only from the validated access token, never from a header or a body field.
- Auth owns `auth_schema`; migrations belong to `synkro-auth-db` and are additive. No password, password hash, token or request body appears in a log, trace, audit record or shared evidence. A private, expiring idempotency receipt may hold the already-computed bcrypt verifier under Decision 5; it is not audit data and is never returned by an API.
- Accepted ADR files stay unchanged.

**Out of scope:** public or e-mail recovery, a self-service password change, forced change at next login, role or `active` management, immediate JWT revocation, an administrator-recovery procedure (TD-009) and any Host change.

---

## Decision 1 — Route and contract

### Options

**A — `POST /api/v1/auth/users/{id}/password-reset`.** An administrative action on a known user, with the secret in the body.
- **Pros:** names exactly one act, so authorization, audit and tests cover one surface; creates no general user-update contract.
- **Cons:** a verb-like segment in an otherwise resource-style API.

**B — `PUT /api/v1/auth/users/{id}/password`.** Replace a password sub-resource.
- **Pros:** resource-style.
- **Cons:** `PUT` suggests an idempotent replacement of a readable value, while this operation also revokes sessions and appends an audit record; the password is write-only and cannot be read back.

**C — `PATCH /api/v1/auth/users/{id}` with a password field.**
- **Pros:** no new path.
- **Cons:** needs a general user-update contract that would also expose `role` and `active` and widen this story into role administration.

### Decision

**Option A.**

```
POST /api/v1/auth/users/{id}/password-reset
Authorization: Bearer <access token of a human ADMIN>
Idempotency-Key: <8 to 128 characters>            required
Content-Type: application/json

{ "newPassword": "<8 characters to 72 UTF-8 bytes>", "confirmPassword": "<equal to newPassword>" }
```

`200` with `Cache-Control: no-store`:

```json
{ "userId": "<uuid>", "passwordResetAt": "<RFC 3339 UTC>" }
```

The response never contains a password, a hash or a token. An equivalent replay within the 24-hour receipt window returns the same body, with the `passwordResetAt` of the first execution. An expired or missing receipt for an already-recorded key is a safe 422 with no new effect, never a fresh execution.

**Check order** (the use case; nothing below runs before the step above it passes):

1. Missing or invalid token → `401 UNAUTHORIZED` (security chain).
2. A service token or a caller without the human `ADMIN` role → `403 FORBIDDEN`.
3. The caller's account must exist and be active, else `403 FORBIDDEN` with a generic message. This is stricter than registration, which only checks that the account exists.
4. Input validation → `400 VALIDATION_ERROR` naming the field and never repeating a value: malformed `id`, missing or out-of-range `Idempotency-Key`, `newPassword` outside the policy, `confirmPassword` different from `newPassword`.
5. **Replay lookup** for (caller, key) — Decision 5. Authorization has already passed, so no unauthorized caller can learn anything about a key.
6. Target eligibility — Decision 2.
7. The atomic unit — Decision 4.

**Errors** (closed catalog):

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | step 4 |
| 401 | `UNAUTHORIZED` | no or invalid credentials |
| 403 | `FORBIDDEN` | non-ADMIN, service token, caller account absent or inactive |
| 404 | `NOT_FOUND` | the target does not exist |
| 422 | `BUSINESS_RULE_VIOLATION` | target is an ADMIN (including the caller), target is inactive, or the key was used with a different request |
| 500 | `INTERNAL_ERROR` | persistence failure; the outcome is **uncertain**, see Decision 6 |

### Dominant criterion

**Keep the operation narrow**, so that authorization, audit and tests cover exactly one administrative act and no general user-update surface appears.

### Accepted cost

- One more endpoint to secure, in `synkro-auth-api`, restricted to `ADMIN`.
- A verb-like path next to resource-style ones.

---

## Decision 2 — Who may reset whom

### Options

**A — Only active non-ADMIN targets** (`SALESPERSON`, `INVENTORY`). Any ADMIN target, including the caller, is rejected.
- **Pros:** the operation can never change an administrator account, so it cannot take over a peer or reduce the set of usable administrators; the last usable ADMIN is protected by construction.
- **Cons:** an ADMIN who forgets or compromises their own password has no recovery through this feature.

**B — Any active user except the caller.**
- **Pros:** an ADMIN can recover another ADMIN.
- **Cons:** any ADMIN can take over a peer account; the audit records it but does not prevent it.

**C — Any user, including the caller and inactive accounts.**
- **Pros:** the broadest recovery.
- **Cons:** a mistyped self-reset by the only ADMIN leaves no usable administrator and no recovery procedure; an inactive account silently receives a credential for a future reactivation.

### Decision

**Option A.** The target must exist (`404`), must not be an `ADMIN` (`422`, field `id`) and must be active (`422`, field `id`). The same conditions are enforced again inside the atomic unit (`WHERE active AND role <> 'ADMIN'`), so a target that changes between the check and the write cannot be reset. Because the target can never be an ADMIN, a caller resetting themselves is rejected by the same rule.

### Dominant criterion

**An administrative reset must never create, take over or remove a usable administrator**, because no recovery path exists yet (TD-009).

### Accepted cost

- TD-009 stays open and unsolved: this feature is not an administrator-recovery path, and `InitialAdminCli` is not one either ([ADR-014](ADR-014-admin-only-registration-and-initial-administrator.md), [ADR-017](ADR-017-refresh-reuse-and-jwt-revocation-boundaries.md)).
- Resetting an inactive user is refused until a reactivation path exists; no endpoint reactivates users today.

---

## Decision 3 — Effect on refresh credentials and issued JWTs

### Options

**A — Revoke the target's refresh credentials in the same transaction; leave issued access JWTs to expire (ADR-017).**
- **Pros:** satisfies the password-change refresh invalidation that ADR-017 leaves as a requirement; needs no change in any receiving service.
- **Cons:** an access JWT already issued stays usable until its own expiry.

**B — Do not touch sessions.**
- **Pros:** a simpler transaction.
- **Cons:** a compromised password keeps renewing sessions for up to seven days after the reset.

**C — Revoke refresh credentials and also invalidate issued JWTs immediately** (per-subject token version, denylist or introspection).
- **Pros:** closes the residual window.
- **Cons:** a new mechanism in every receiving service, new availability and propagation behavior, and a decision that reopens ADR-006 and ADR-017 (ADR-017 Option B). It is not part of this record.

### Decision

**Option A, with login issuance fencing.** Inside the atomic unit (Decision 4), every refresh row of the target with `active = true` is set to `active = false` under the same per-owner advisory lock that rotation uses, so a rotation in flight cannot keep a replacement alive. Rows are not deleted. Already-issued person JWTs remain valid until their expiry (one hour nominal plus the documented clock-skew allowance). **No immediate revocation is claimed or implemented.**

### Dominant criterion

**Every revocation claim must match an enforcement mechanism that the system owns and can test** (the criterion of ADR-017).

### Accepted cost

- A target's current access JWT stays usable until it expires. The Host renews 60 seconds before expiry ([ADR-016](ADR-016-host-session-renewal-and-operation-recovery.md)); that renewal then fails, so the target's session ends at the next renewal, at most about one hour after the reset.
- Revoked rows are `active = false` and unexpired, which is the shape ADR-017 treats as a known used credential. If a stale device later presents an old refresh credential, existing reuse detection returns `401` and invalidates **all** active refresh rows of that owner, including a session the target opened after the reset. This is the same behavior logout already has; distinguishing "revoked by reset" from "used" would need a state column on `refresh_token` and is not adopted.
- Login must not persist a refresh credential using a password snapshot invalidated by a completed reset. After bcrypt verification outside the transaction, its credential-issuance persistence port starts one transaction, takes the **same per-owner advisory lock** as reset/rotation, reads the current active user and compares the current stored bcrypt string with the exact hash snapshot that was verified. A missing/inactive user or changed hash rejects login with the existing generic 401; no refresh is saved and no token is returned. If unchanged, persist refresh on that connection and commit before returning credentials. Issue claims from the validated current user/role, not unchecked client data.
- No credential-version column, new secret or bcrypt computation under a lock is needed. Login, reset and refresh rotation must use the same canonical user identity and namespace and a consistent lock order; independent transactions inside the issuance unit are forbidden.
- If login acquires the lock first and commits, reset waits and then revokes that refresh. If reset commits first, login detects the changed hash and refuses issuance. Already-authorized access JWTs still follow ADR-017; this is not immediate JWT revocation. Scheduling does not justify a claimed time bound such as "one bcrypt".

---

## Decision 4 — Atomic unit and audit storage

### Options

**A — A dedicated append-only success-audit table plus a separate private replay receipt, written in the same transaction as the password change and the revocation.** Denials and failures go to the security log, as in ADR-014 Option B.
- **Pros:** a committed password change cannot lack its attribution or its revocation; the creation-attribution table is untouched.
- **Cons:** a new table, migrations, grants and tests; an audit-persistence failure blocks the reset.

**B — Reuse `user_creation_audit`.**
- **Pros:** no new table.
- **Cons:** it would need `outcome`, `operation` and the one-row-per-user uniqueness relaxed, which weakens the constraints that make creation attribution unambiguous.

**C — Log-only audit.**
- **Pros:** no table.
- **Cons:** the log line and the password update cannot commit together (rejected by ADR-014 Option C for the same reason).

### Decision

**Option A.** An append-only audit table and a separate private receipt in `synkro-auth-db`, by additive migrations in the existing repository style. Do not edit migrations applied in any shared environment; verify the next available versions. The audit remains:

`auth_schema.password_reset_audit`

| Column | Rule |
|---|---|
| `audit_id` | `uuid`, primary key, generated by Auth (no default) |
| `operation` | `text`, `CHECK (operation = 'PASSWORD_RESET')` |
| `actor_user_id` | `uuid NOT NULL`, the ADMIN from the validated token |
| `target_user_id` | `uuid NOT NULL` |
| `idempotency_key` | `text NOT NULL`, 8 to 128 characters |
| `outcome` | `text`, `CHECK (outcome = 'SUCCESS')`: failures create no row |
| `occurred_at` | `timestamptz NOT NULL` |
| `correlation_id` | `text NOT NULL`, not empty |
| — | `UNIQUE (actor_user_id, idempotency_key)` |

Both user columns are foreign keys to `system_user` with `ON DELETE RESTRICT`, each in its own migration with its own index; `auth_app` gets `SELECT` and `INSERT` only, `auth_reader` gets `SELECT`, nobody gets `UPDATE`, `DELETE` or `TRUNCATE`; every `V` has its `U`. The audit table holds no password, hash, token or request body. It permanently reserves (actor, key) within the operation so deleting an expired receipt never frees the key for another reset. The separate receipt schema and privileges are defined in Decision 5.

The unit runs on **one connection in one transaction at `READ COMMITTED`**, owned by the persistence adapter (the use case never holds a transaction type):

1. `INSERT` the audit row `ON CONFLICT (actor_user_id, idempotency_key) DO NOTHING`. Zero rows means the key is already recorded: nothing else is written and the existing record/receipt path is used (Decision 5), including safe rejection if the receipt expired or was purged.
2. Take the per-owner advisory lock of the target (the existing refresh-token lock).
3. `UPDATE system_user SET password_hash = ? WHERE user_id = ? AND active AND role <> 'ADMIN'`. Zero rows rolls everything back.
4. `UPDATE refresh_token SET active = false WHERE user_id = ? AND active`.
5. Insert the private receipt referencing this audit row, with the **same** bcrypt string assigned in step 3 and a 24-hour expiry from the database clock at receipt insertion. All writes commit together; no receipt is published or logged.

The new hash is computed **before** the transaction, so locks are not held during the bcrypt work. Any failure rolls back all steps: no key, no audit row, no receipt, no new password and no revocation. The durable key reservation is the audit row; the private receipt supplies original-request equivalence without placing a verifier in audit. Neither can be marked complete independently of the reset effects. Rejected and failed attempts are recorded by the component that detects them, in the security log (`synkro.auth.security`), with correlation id, caller, reason and, when it parsed as a UUID, the target id; never a password or body.

### Dominant criterion

**Attributable and atomic**: the password change, the revocation, the audit and the key commit together or not at all, without altering the creation-attribution guarantees.

### Accepted cost

- Audit and private-receipt tables, additive migrations, grants, rollbacks and CI assertions, plus bounded replay/cleanup and access handling. The number/version of required migrations is determined from the actual DB branch, not frozen at the earlier four-migration proposal.
- A failure to persist the audit blocks the reset.
- Rejected attempts depend on security logging outside the transaction; losing those logs is an observability incident (as in ADR-014).
- `synkro-auth-api` CI pins `AUTH_DB_REF`, so the database change must be integrated before the API change.

---

## Decision 5 — Original-request replay receipt and retention

The key is bound to actor, operation, target and the original password, not to whichever password the user currently has. Same key/different target or password is 422 with no effect. Authorization always precedes lookup. Exact replay is supported during a bounded receipt window; after that the key remains consumed and is never executed again.

### Options

**A — Compare against the current user hash.** No extra verifier or secret, but after K1 sets A and K2 sets B, K1+B would falsely match and K1+A would falsely fail. This does not bind the key to the original request; rejected.

**B — Reuse the already-computed bcrypt in a separate private receipt.** Original equivalence survives later password changes; no second bcrypt generation or new server secret. Cost: a protected, temporary verifier of a possibly retired password, one receipt table and cleanup.

**C — Store a keyed request fingerprint, such as HMAC.** Stable historical comparison, but requires a new secret, secure distribution and versioned rotation. A compromised DB plus key enables fast offline guessing; not selected for this delivery.

### Decision

**Option B.** Keep the audit reservation UNIQUE(actor_user_id, idempotency_key). Add private `auth_schema.password_reset_receipt` with:

| Column | Rule |
|---|---|
| audit_id | UUID primary key, foreign key to password_reset_audit with ON DELETE RESTRICT |
| request_password_hash | text NOT NULL; exactly the bcrypt string already calculated for this reset and assigned to system_user; no new hashing algorithm or hash generation |
| expires_at | timestamptz NOT NULL; database-clock receipt insertion plus 24 hours, indexed for bounded cleanup |

Only the Auth runtime role needs SELECT/INSERT on receipts. No reporting/reader/audit-export access and no generic API exposes them. A separately authorized maintenance operator can delete expired receipts only through the documented bounded cleanup procedure; runtime does not need DELETE. Protect backups containing these verifiers as credential material.

After authorization and input validation:

- No audit record for (actor, key): perform the full atomic reset, audit reservation and receipt insert.
- Existing audit record: require the same target, a present unexpired receipt and `PasswordHasher.matches(newPassword, receipt.request_password_hash)`. Never read the current user password as the request comparator. Equivalent gives 200 with the original timestamp and **no** password/refresh/audit mutation, even after a later independent reset.
- Different target/password, expired receipt or missing receipt for an existing key: safe 422 BUSINESS_RULE_VIOLATION on Idempotency-Key. Do not expose the saved request or tell an unauthorized caller whether a key exists. Never treat this as permission to mint or execute another key automatically.
- Another actor has a separate namespace; their record cannot be read by the caller. The dedicated operation/table supplies the operation namespace.
- The audit unique constraint serializes concurrent claims of the same actor/key. The loser follows the same original-receipt comparison after the winner commits; rollback leaves no consumed key. Test different payloads/targets as well as identical concurrent calls.
- Different keys on one target are independent resets, serialized by the owner lock and each audited. Last commit defines the password. A replay of an older successful reset never restores that old password or revokes a newer session.

**Retention:** receipt validity is 24 hours, checked with the database clock independently of cleanup. Before deployment, deliver a bounded SQL cleanup procedure and a documented daily operator schedule/owner; this delivery does not create a Worker job or a new service. Cleanup deletes only expired receipt rows and never the audit/key reservation. Expiry is logical until physical cleanup runs; no PostgreSQL automatic TTL or guaranteed physical erasure at 24 hours is claimed. Backups retain their separately protected lifecycle. Failure to run cleanup is an operational finding, not permission to extend replay validity.

If a receipt is removed or expires between lookup and replay, reject safely without new effects. A retry admitted as valid at its consistent lookup may finish afterwards; it remains read-only. Expiry tests must not depend on wall-clock sleeps.

### Dominant criterion

Bind replay to the actual original request while preserving the existing bcrypt policy, without a new secret or retaining password-derived data in the append-only audit.

### Accepted cost

- One extra sensitive verifier per reset during retention; it may verify a retired password. Restricted access, finite replay validity and explicit physical cleanup are required.
- A separate receipt table and operator cleanup; original audit/key reservations remain durable. No key-retention deletion policy is introduced.
- One bcrypt verification per replay, but no additional bcrypt generation: reuse the same already-produced string. Never log or export it.
- Requests older than the receipt window return 422, not a repeat success, and never execute again. The Portal needs no new response shape; existing safe error/manual-confirmation behavior applies.

---

## Decision 6 — Portal confirmation, uncertain outcome and in-memory intent

### Options

**A — Explicit confirmation, a retained in-memory intent and manual same-key retry.**
- **Pros:** the person sees the target before anything is sent; a lost response can be resolved without a second effect; the secret never reaches browser storage.
- **Cons:** a reload or logout loses the intent.

**B — Persist the intent in `sessionStorage`** to survive a reload.
- **Pros:** retry survives a reload.
- **Cons:** a password at rest in browser storage, readable by any script in the origin; rejected by the secrecy rules.

**C — Keep no intent; every submit uses a new key.**
- **Pros:** no retained secret.
- **Cons:** a retried unknown outcome becomes a second reset, a second revocation and a second audit row.

### Decision

**Option A.**

- **Entry point:** a "Restablecer contraseña" action inside the authenticated Users administration (directory row and user profile), for an active non-ADMIN user. No button exists on the public login screen. The API remains authoritative; the UI only avoids offering a guaranteed rejection.
- **Unambiguous target:** the confirmation panel (inline, never a modal) names the user (name, e-mail, role and id) before and during confirmation.
- **Confirmation:** the person types and confirms the password (show/hide control, accessible labels and errors), then must confirm explicitly on a step that repeats the target and states the effects: the user's renewable sessions end, access tokens already issued may remain valid until they expire (about one hour), and the password must be handed over through a channel outside the application.
- **Pending:** controls are disabled and a synchronous guard rejects a second submit.
- **Uncertain outcome** (timeout, lost response, network error or `500`): the Portal says **"No se pudo confirmar el resultado."** It does not claim that the operation failed or that nothing changed. It offers only a manual retry with the **same key and the same request**; it never creates another intent on its own. Discarding is a separate action that clears the secret and states that the earlier attempt cannot be confirmed.
- **In-memory only:** the intent (key, target, password) lives in RAM, bound to the real subject and Host `sessionId` it was created under, and is retired when that identity changes, on logout, on cancel and on success. It is never written to `sessionStorage`, `localStorage`, the URL, logs or the console.
- **Limit, stated to the person:** after a reload, a logout or any loss of that state the Portal cannot confirm or resend the earlier operation, and it never rebuilds it automatically. Any later reset needs a new explicit confirmation and a new key. **A login attempt is never used as automatic reconciliation and the target's credentials are never requested.**

### Dominant criterion

**Resolve uncertainty without replaying a secret blindly or persisting it**, in line with the in-memory registration intent of HU-AUTH-16 and the recovery rules of ADR-016.

### Accepted cost

- A reload or logout in the middle of an uncertain attempt leaves its outcome unresolved from the Portal; the ADMIN must open a fresh confirmation, which may repeat a reset that had already been applied.
- XSS can still read in-memory state of the page; the in-memory rule narrows exposure, it is not a boundary.

---

## Consequences

**What changes in the system:**

- `synkro-auth-api` gains one ADMIN-only endpoint, a use case, a persistence port and a JDBC adapter that owns the transaction.
- `synkro-auth-db` gains audit and private-receipt storage through additive migrations, with grants, expiry cleanup and rollbacks.
- `synkro-auth-portal` gains a reset action, form, confirmation and an in-memory intent inside Users administration.
- The Host and the gateway do not change.

**What must be watched:**

- Any reset path that skips the ADMIN rule, the target rules or the atomic unit.
- The reuse-detection interaction, login/reset lock coordination and the receipt expiry/physical-cleanup distinction.
- Logs, traces, audit rows or evidence that contain a password.
- Loss of the security logs that carry rejected attempts.
- A requirement for immediate JWT invalidation, a recovery path for administrators (TD-009), forced password change or a self-service change reopens this record through a new ADR.

**Implementation scenarios that must pass before the operation is reported as delivered** (tests precede production code, and planned verification is not completed evidence):

- An authorized ADMIN resets an active SALESPERSON and an active INVENTORY user; the old password stops authenticating and the new one authenticates; other users are unchanged.
- Anonymous or invalid credentials → `401`; SALESPERSON, INVENTORY and SERVICE called directly → `403`; none of them changes a password or an audit row.
- Unknown target → `404`; ADMIN target, self and inactive target → `422`; invalid password, mismatched confirmation, malformed id and missing key → `400`; none leaves a partial mutation.
- The target's active refresh credentials are revoked; its issued access JWT is not claimed revoked.
- Audit failure and persistence failure leave no password change, no revocation and no key.
- K1 sets A, K2 sets B: K1+A within retention returns K1's original success without changing B or revoking any new session; K1+B is 422. Repeat after expiry and after cleanup: 422 with no effect, key remains consumed.
- Same key/target/password concurrent requests execute once; same key with different payload/target rejects the conflicting request. Distinct actors cannot query each other's record. Expiry and purge races are safe.
- A login that verified the old hash before reset but attempts issuance after reset commits is 401 with no new refresh or returned tokens. In the reverse order, reset revokes the refresh committed by login. Coordinate with latches against real PostgreSQL, not timing assumptions.
- Reset/audit/receipt insertion failure rolls back every effect; receipt privileges exclude readers/exports, cleanup deletes only expired receipts and retains all audit rows.
- Response lost after commit, and failure before commit, resolved by a same-key retry; a replay after the target opened a new session does not revoke it.
- No password, hash or body in logs, audit rows, error bodies, URLs or browser storage.

---

## Affected documents

This record is the only file of this PR besides the register. Its downstream documents are updated later, with actual evidence, in the existing consolidation (HU-DOCS-98 / Docs PR #300), not here.

| Document | Required change |
|----------|-----------------|
| [ADR register](../README.md) | Record ADR-021 as Accepted from the explicit 2026-11-10 project decision; mark ADR-004 Decisions 6/7 as extended. ADR-004 itself is **not** edited |
| `07-api/contracts/openapi/synkro-auth-api.yaml` | Add the operation of Decision 1 once implemented and verified |
| `07-api/authentication.md`, `00-governance/security-policy.md` | Replace "no implemented password-change endpoint" with the reset and the credential effects of Decision 3 |
| `06-data/models.md`, `06-data/data-dictionary.md` | Specify append-only password_reset_audit and separate expiring password_reset_receipt, restricted grants and cleanup |
| `02-domain/entities-and-rules.md` | Add the target rules of Decision 2 |
| `11-quality/testing-strategy.md`, `04-requirements/traceability-matrix.md` | Planned scenarios, then actual test references |
| `12-ux-ui/navigation-map.md`, `12-ux-ui/wireframes.md` | The reset action in Users administration |
| `15-project-control/technical-backlog.md` | TD-009 remains pending and unchanged |

---

## Immutability rule

This revised ADR is Accepted by the explicit project-owner decision on 2026-11-10. From this acceptance it is immutable; later changes require a new ADR naming this record and the replaced sections. The earlier approved proposal did not contain Decisions 3/5 in this revised form: fresh PR review and required Ariel main approval remain separate. Implementation PRs #27/#44/#23 must be aligned and reverified; this document does not claim the new receipt or login fence is already implemented.

---

## References

- [ADR-004](ADR-004-api-contract-extensions.md) Decisions 6 and 7; [ADR-006](ADR-006-token-validation-per-service.md); [ADR-009](ADR-009-shared-instance-schema-per-domain.md); [ADR-014](ADR-014-admin-only-registration-and-initial-administrator.md); [ADR-016](ADR-016-host-session-renewal-and-operation-recovery.md); [ADR-017](ADR-017-refresh-reuse-and-jwt-revocation-boundaries.md); [ADR-019](ADR-019-customer-search-and-reactivation.md) (precedent for extending the ADR-004 register).
- [HU-ARQ-31 / #309](https://github.com/code-corhuila/synkro-docs/issues/309); [HU-AUTH-19 / #306](https://github.com/code-corhuila/synkro-docs/issues/306).
- [Error catalog and conventions](../../../07-api/guidelines.md); [security rules](../../../00-governance/security-rules.md).
