# HU-INF-04: Sales domain-boundary correction

Corrective follow-up dated 2026-10-13, addressing the teacher bot's first finding.
Branch: fix/hu-inf-04-sales-domain-boundary, created from remote develop at
d09fc4a376ae9e336461c87a4178dc038ccba081. The local permanent branch and old
feature branch were preserved; preexisting ignored runtime/test artifacts remain.
The fix/ prefix and English kebab-case follow synkro-docs
00-governance/branching-policy.md and git-conventions.md. Only this correction
branch is committed/pushed. No sibling edit, PR, merge, promotion or issue update.

## Ownership boundary

The removed sales-baseline.js imported Sales' private validation module, enumerated
migration families, assumed a fixed total and inspected its ledger fields. The
application probe repeated that coupling. These assertions are removed rather
than moved elsewhere in infrastructure.

Sales alone owns domain DDL/DML/DCL, migration tracking and checksum/compatibility
validation. Infrastructure invokes its unchanged supported image entrypoint at
9cfbde7db4bea7bacad70370c60f91f8eb917c04. Owner preflight, postflight, checksum
and failure handling remain active. Infrastructure no longer imports the owner
validation module, queries tracking collections, parses migration files or compares
ledger snapshots. There is no fixed migration-count release assertion.

First migrations require a positive applied count from the public CLI summary;
replays require zero. Fresh source/target counts are compared dynamically.
CLI status must report up to date before the recovery update; incomplete/malformed
status and ambiguous summaries fail closed. The interpretation follows the pinned
[Liquibase 4.31.1 status implementation](https://github.com/liquibase/liquibase/blob/v4.31.1/liquibase-standard/src/main/java/liquibase/command/core/StatusCommandStep.java).

Application probes have no Sales checkout mounted. They test the public contract:
sales_app authentication/grant, valid/invalid operations, documents and BSON values.
Snapshots contain infrastructure user credential digests/replica configuration and
application data/opaque collection metadata. Metadata is compared for persistence
and recovery, never decoded into expected domain definitions. Fixtures follow the
public Sales model; internal migration IDs, families and ledger schemas are irrelevant.

## Safe recovery retained

1. Bootstrap a fresh exclusively owned disposable target with independent secrets.
2. Migrate through the owner runner.
3. Validate exact recorded container/network/volume identities.
4. Require the selected application collection to exist and be empty using generic
   empty-collection.js, which knows only validated database/collection parameters.
5. Require owner status to report up to date, then zero-change update with its
   preflight/postflight/checksum validation; recheck emptiness before importing.
6. Restore only sales.sale documents, without options/index restoration or drop.
7. Compare application data/metadata and independent target users, replay through
   the owner runner, check public permissions and verify unchanged source state.

The generic guard's collection presence/emptiness check prevents accidental writes
to a missing or populated restoration namespace. It does not assert that Sales is
migrated; the owner runner provides that decision. Namespace filtering excludes
authentication and migration tracking from restoration. Direct ledger snapshot
preservation is deliberately no longer claimed as an infrastructure assertion.
Persistent, foreign/replaced, missing/unmigrated and nonempty targets remain refused.
Authentication remains authSource=admin with rs0 and the same single protected URI.
Credentials remain absent from process arguments/published logs and artifacts.

## Test-first evidence

Commit 3612251e1835949e1212888e87c7deb720df735c recorded five red regressions before
implementation. Linux Node 22 returned exit 1: three probes tried to load unavailable
Sales internals; the generic guard and public-result helper did not yet exist.
No Docker resources were created by that red run.

| Regression | Behavior exercised |
|---|---|
| BOUNDARY-01 (three cases) | Initial, application and snapshot probes work without Sales modules; unknown/private ledger access throws. Snapshot excludes migration tracking. |
| BOUNDARY-02 | CLI counts 1/17/29 succeed without a fixed total; replay requires zero; missing phases, malformed/ambiguous summaries, pending or missing status are rejected. |
| BOUNDARY-03 | Same generic guard works for sales.sale and warehouse.events; missing/nonempty collections and protected/invalid namespaces are refused. |

scripts/check.mjs runs all ten existing configuration regressions plus these five.
These contract regressions accompany real MongoDB suites, not substitute for them.

## Verification results

Runtime: Ubuntu/WSL, native Linux checkout, Node v22.23.3. Engine/image versions
and CODEOWNERS are unchanged. Tests run only in unique labeled projects/networks
with recorded identities and real named server volumes; application clients use tmpfs.

The first full command passed syntax, ShellCheck, all 15 unit/configuration cases
and the complete independent infrastructure suite (run 1791909413625-30585193).
Sales run 1791909618923-180f4419 returned exit 1 at recovery because the new parser
incorrectly required punctuation absent from actual Liquibase status output.
Its owned resources were cleaned. A regression reproduced the failure, the parser
was corrected to the pinned CLI format, and Sales was rerun. This failed attempt
is not counted as a pass. A restricted sibling Git read was retried with native
read-only permissions; original sibling branches/heads remained clean and unchanged.

Final Sales results, resource identities, secret audit and external CI status are
recorded below after completion. Remote CI must be verified at the final pushed SHA;
the final report links that run. Review of this correction and any later promotion
remain separate gates; the README's previous component acceptance is not rewritten.

## Final local results and cleanup

Final node -- scripts/check.mjs: exit 0, JS/Bash syntax, ShellCheck and all 15
configuration/boundary cases, 0 failures/skips/cancellations. Pinned Actionlint
and git diff --check passed.

Independent infrastructure run 1791909413625-30585193 passed every authentication,
PRIMARY/deadline, key/password mismatch, bootstrap, named-volume persistence,
generic backup/restoration, drift, exposure and owned cleanup assertion.

Final Sales run 1791909938468-b0542d0a passed migration, zero-change replay, exact
public grant and allowed/denied operations, invalid BSON/model rejection, repeated
bootstrap, stop/start/restart preservation and application-only independent restore.
Actual initial counts were 10 for this pinned owner revision; no test requires 10.
Recovery status reported up to date; both recovery update and post-restore replay
applied zero with owner preflight/postflight. Restored application metadata/data,
target independent credentials, permissions and unchanged source were verified.
Wrong migration credentials remained nonzero, bounded and sanitized. Actual
Bash/mongosh/Java arguments and output/logs contained no generated secrets.

All 24 resources and 80 clients across the three attempts were recorded and removed.
The two passing runs account for 16 resources and 56 clients; the failed Sales run
accounts for 8 resources and 24 clients and is explicitly excluded from pass results.
All 12 baseline container names/full IDs and shared platform
0443da8773d38070f33f151dc7e3897aaee2c1f1903b759526cf199a1caa33e9
were preserved. Unrelated volumes and Docker-in-Docker environments were untouched.

Secret audit: 48 literal/encoded representations checked against tracked/new files,
zero findings. Only resource manifests/digests were copied to ignored local artifacts;
environment files, secret JSON, keys and archives are excluded from commits/CI uploads.
Infrastructure runtime/tests contain no private Sales migration references.
CODEOWNERS working-file SHA-256 remains
fdc603d8994290bb012127f1f5db15e12f33032c575b2c413a1db05c5bd31f56.
Sales and docs sibling branches/heads remained unchanged and clean.

| Passing run | Archive SHA-256 |
|---|---|
| 1791909413625-30585193 | 9ff33f287e84ef95dfde1cb75bbe0d2917b7ee13c2a8dbf5fcae71e4b205f19a |
| 1791909938468-b0542d0a | df35d2d4b7494c73fc4f8212f621d92a9f8c7d79aea062d6152212150dc6c998 |

| Run | Kind | Exact name | ID / volume creation UTC |
|---|---|---|---|
| 1791909413625-30585193 | network | synkro-infra-test-1791909413625-30585193-source | 283a51428bc2828f318f171ee032970ca6356395a99809bc3218de10c0cc7974 |
| 1791909413625-30585193 | container | synkro-infra-test-1791909413625-30585193-source-synkro-mongo-1 | cb22ccbce029fb2c8319678e090c47baee5e1aa8336e302fc30eab2af5320ffc |
| 1791909413625-30585193 | volume | synkro-infra-test-1791909413625-30585193-source_mongo-data | 2026-10-13T16:36:59Z |
| 1791909413625-30585193 | volume | synkro-infra-test-1791909413625-30585193-source_mongo-config | 2026-10-13T16:36:59Z |
| 1791909413625-30585193 | network | synkro-infra-test-1791909413625-30585193-restore | 2a593a58d0bdcbc1da047753f8a818080fbba1094b60c10de6226aa2a63b3d20 |
| 1791909413625-30585193 | container | synkro-infra-test-1791909413625-30585193-restore-synkro-mongo-1 | 30cf6707f58696db533c27ddfcc42151ddd0cfb2990293c7349b5a63ae4b55d3 |
| 1791909413625-30585193 | volume | synkro-infra-test-1791909413625-30585193-restore_mongo-data | 2026-10-13T16:38:23Z |
| 1791909413625-30585193 | volume | synkro-infra-test-1791909413625-30585193-restore_mongo-config | 2026-10-13T16:38:23Z |
| 1791909938468-b0542d0a | network | synkro-infra-test-1791909938468-b0542d0a-source | 8f17f264f3da3b0ca29ee68a08f9befa02760a4625b17a1a04c3c238c1dcede4 |
| 1791909938468-b0542d0a | container | synkro-infra-test-1791909938468-b0542d0a-source-synkro-mongo-1 | 035ad6f3cf682dfe6a603901913297f8f54fc9271755178f40991d0b0a4c2e99 |
| 1791909938468-b0542d0a | volume | synkro-infra-test-1791909938468-b0542d0a-source_mongo-data | 2026-10-13T16:45:45Z |
| 1791909938468-b0542d0a | volume | synkro-infra-test-1791909938468-b0542d0a-source_mongo-config | 2026-10-13T16:45:45Z |
| 1791909938468-b0542d0a | network | synkro-infra-test-1791909938468-b0542d0a-restore | 61eae6548e95c874a29121e45d6a3f57883a88fa6bc3fcc45b15a07bca763bbe |
| 1791909938468-b0542d0a | container | synkro-infra-test-1791909938468-b0542d0a-restore-synkro-mongo-1 | 9f91810ebe2da41d3d5e48b19dd61017a87d48591ef4cc927f5ce4b4e9a09db2 |
| 1791909938468-b0542d0a | volume | synkro-infra-test-1791909938468-b0542d0a-restore_mongo-data | 2026-10-13T16:47:44Z |
| 1791909938468-b0542d0a | volume | synkro-infra-test-1791909938468-b0542d0a-restore_mongo-config | 2026-10-13T16:47:44Z |

Exact client IDs and the failed attempt identities are retained in ignored
tests/.artifacts/<run>/manifest.json. Cleanup validates ownership before deletion.
The extra recorded-manifest cleanup command was also executed after the final suite.

CI retains the exact Sales pin, read-only checkout, Linux Node 22, both mandatory
real suites, bounded job duration, always-cleanup and identity-only artifacts.
Push checks now include fix/**; boundary regressions run through scripts/check.mjs.
The final delivery report records remote CI at the actual pushed SHA.
