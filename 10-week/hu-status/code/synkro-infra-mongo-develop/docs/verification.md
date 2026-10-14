# HU-INF-04 original 2026-10-11 integration evidence (historical)

The private-ledger assertions described in this historical run were subsequently
removed by the [domain-boundary correction](domain-boundary-verification.md).
Current verification uses the supported Sales runner exclusively for migration
state/checksums and probes only public application and MongoDB infrastructure state.
The README records acceptance/promotion after this original delivery.

Local verification completed on 2026-10-11 in America/Bogota (resource timestamps
cross into 2026-10-12 UTC). Both real suites pass. HU-INF-04 remains in progress
until the pushed revision's CI, separate central documentation update and manual
peer review gates pass. No PR, merge, promotion or issue closure was performed.

## Starting state and immutable references

- Repository: code-corhuila/synkro-infra-mongo.
- Existing branch: feat/mongodb-instance-and-bootstrap.
- Starting local HEAD and origin branch: f7056d63401b05940df0eaa21be55113b93e5eb4.
- Starting working tree: clean. Existing infrastructure commits were preserved.
- Exact Sales merge: 9cfbde7db4bea7bacad70370c60f91f8eb917c04,
  [reviewed PR #5](https://github.com/code-corhuila/synkro-sales-db/pull/5)
  for [HU-VEN-16 #237](https://github.com/code-corhuila/synkro-docs/issues/237).
- The old ffdc24b9 runner was never executed. The inspected merged runner delivers
  one environment URI to Liquibase/preflight/postflight; mongosh uses --nodb/--file.
- Sales PR approval: AsolanoT, on 64147634f5dad704d30a31ac2c12328edddaade8.
- Both checks on the actual merge finished SUCCESS:
  [check-common-files](https://github.com/code-corhuila/synkro-sales-db/actions/runs/38185952514/job/114608188856)
  and [migration-rebuild](https://github.com/code-corhuila/synkro-sales-db/actions/runs/38185952454/job/114608188324).
- MongoDB remains 7.0.43, image
  mongo:7.0@sha256:1f995ad6fdb93244a1addab1b58f934a0bc2f5643c38e02f5e9d7f0c7d227a7b.
- The owner Dockerfile remains unchanged: Liquibase 4.31.1, extension 4.29.1,
  driver 3.12.14. Recovery reuses the originally recorded built image ID:
  sha256:bf52905c34af7eb30786c80a1ae3f769b7a8a8643e612038a454bed60e2ee8cf.

## Test-first evidence and implementation

Commit 7f5f0a5, test(infra): define Sales integration and recovery checks, preceded
the helper and recovery implementation. The real Linux test returned nonzero for
missing scripts/sales.mjs before creating Docker resources.

Green verification now exercises the owner's supported sales-db-migrate image
entrypoint without an override. Infrastructure creates only the engine, users,
replica set and operations. Sales creates its collection, validators, indexes,
roles, grants and history through its unchanged migrations.

The new disposable Sales restore requires recorded resource identities, the exact
clean Sales checkout, owner-defined postflight validation, ten actual migration
IDs, an empty sale and zero-change supported-runner checksum verification.
Only sales.sale documents are imported; target options/indexes, authentication
and Liquibase history are retained. The existing empty-database restore guard
and persistent-target refusal remain intact.

Recovery does not rebuild the runner image. Child recovery clients are merged
back into the parent manifest before later saves; regression assertions verify
both retained image identity and complete client identities.

## Runtime and passed checks

Ubuntu/WSL, native Linux filesystem, Node v22.23.3 (official Node 22 image's
executable), Docker 29.3.1, Compose 5.1.1 and Git 2.43.0. The Linux verification
checkout contained the same changed scripts/tests as this branch. Full suites
ran sequentially. MongoDB servers used named volumes; client storage used tmpfs.

| Command/check | Actual result |
|---|---|
| node -- scripts/check.mjs | Final exit 0: JS/Bash syntax, pinned ShellCheck, ten configuration/CLI/cleanup regressions, diff formatting; 0 skipped/cancelled. |
| node -- tests/integration.mjs | Independent infrastructure assertions and cleanup passed, run 1791765769064-f8d296ff. |
| node -- tests/sales-integration.mjs --sales-checkout .runtime/sales | Final exit 0 including cleanup, run 1791768263329-3ad9e24a. |
| Pinned actionlint on final workflow | Exit 0, digest b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667. |
| Historical Sales preservation | Empty diff from ffdc24b9 to pinned merge for 01_ddl, 02_dml, 03_dcl, changelog, CODEOWNERS and Dockerfile. No sibling edits. |
| Infrastructure CODEOWNERS | No diff; original working-file SHA-256 fdc603d8994290bb012127f1f5db15e12f33032c575b2c413a1db05c5bd31f56. |
| Secret audit | 288 literal/encoded representations of generated credentials and keys checked against tracked/new files; zero findings. Ignored secret files and archives excluded from commits/artifacts. |

The established independent suite verifies zero-role users in admin, rejected
unauthenticated/wrong-password operations, authenticated PRIMARY readiness, key
protection/mismatch, credential mismatch without rotation, bootstrap preservation,
project/volume isolation, named-volume persistence, infrastructure-fixture recovery,
real step-down and bounded wait, drift/failing-start refusal and exposure checks.
The administrator-created infra_fixture proves infrastructure behavior only.

| Sales identifier | Actual verified behavior |
|---|---|
| SALES-01 | Fresh sales_app exists in admin with no roles; no Sales objects; test commands disabled. |
| SALES-02 | Owner runner applies ten changes; actual IDs match owner definitions, execution/checksum metadata is present, owner validators/indexes/roles pass postflight; all subsequent valid replays apply zero and retain exact history. |
| SALES-03 | sales_app has exactly sales_writer@sales; find/insert/update succeed. remove, other-database reads and incorrect admin/app credentials fail. Invalid UUID, empty/oversized lines, zero quantity, money BSON type, extra properties and invalid update fail; duplicate ID fails. |
| SALES-04 | Representative IDs, values, dates, booleans and int32/int64 BSON types match exactly. |
| SALES-05 | Bootstrap after migrations, stop/start and restart preserve user identity/credential digest, exact grants, documents, schema and history. Election term alone is excluded from replica configuration comparison. Final replay applies zero. |
| SALES-06 | Fresh independently credentialed target is migrated first. Application-only restore preserves target history/users/schema; source and target data/BSON/metadata match. Subsequent replay applies zero, restored app permissions pass and source state is unchanged. Unmigrated, nonempty and replaced-identity targets are refused. |
| SALES-07 | Incorrect migration credentials fail with sanitized Authentication classification within the bound; source unchanged. Actual Bash/mongosh/Java arguments, runner stdout/stderr and logs contain no generated credential/key/URI values. |

Every successful runner invocation requires both owner preflight and postflight.
The single URI selects synkro-mongo:27017/sales, rs0, authSource=admin and bounded
connection timeouts. Docker receives inherited environment names only. Secret
files/archives are protected and ignored; no credential-bearing Compose output,
raw diagnostic buffer or archive is published.

## Failures encountered and resolved

Failures are not counted as passes. The initial missing-helper failure was the
expected TDD red. An early history assertion incorrectly assumed uppercase fields;
actual Mongo Liquibase fields are camelCase and the test now compares owner IDs.
A parallel exploratory infrastructure attempt exceeded target startup readiness
and returned nonzero; its owned resources were cleaned and the sequential final
independent suite passed.

Two later Sales runs (1791766285906-5972acf5 and 1791767369039-009968e3) returned
nonzero because the recovery helper rebuilt the runner tag and the earlier image
ID became unavailable for replay. Recovery now reuses the recorded image ID,
validates its revision/entrypoint and preserves child manifest records. The final
Sales run passed every assertion and cleanup. No runner guard was weakened.

The first restricted WSL access attempt was unavailable; approved WSL execution
passed. No Windows/Git Bash full-suite result, timeout or cancellation is claimed
as Linux verification. Docker latency was observed; no speculative cause is asserted.

## Backup scope and exact cleanup evidence

The infrastructure archive restores infra_fixture into an empty independent target.
SHA-256: 99351fb5f24509dcb7a7fb4e4522f15a3df735bb4c3844d30b5875ab12cf8ad3.

The Sales archive covers selected sales database data/collection metadata/history,
excluding users, roles, admin/local/config and internal keys. The procedure restores
only sales.sale with --noIndexRestore --noOptionsRestore --stopOnError, no --drop.
SHA-256: bb369dbceafd933d512997b572b1b9db1adb3b58cba58ec639bb12ee01ea4f36.

Both runs recorded network/container IDs and volume names/creation timestamps.
All 16 server/network/volume resources and all 58 clients (23 independent, 35 Sales)
were removed after ownership checks. Exact client IDs remain in ignored public
tests/.artifacts/<run>/manifest.json; recovery child IDs are included. Final inventory
contains no labeled disposable containers, volumes or networks.

All nine persistent baseline container IDs/names remain, including fac6108a0c39
synkro-mongo. Shared platform remains
0443da8773d38070f33f151dc7e3897aaee2c1f1903b759526cf199a1caa33e9.
Unrelated PostgreSQL disposable activity changed during this task; none of those
resources was targeted by this task. Existing databases were never test targets.

Exact final infrastructure resource records follow (volume ID is its exact name):

| Run | Kind | Exact name | ID / creation UTC |
|---|---|---|---|
| 1791765769064-f8d296ff | network | synkro-infra-test-1791765769064-f8d296ff-source | 2f3c91b56befdc2ad8069a60c0f186f26b6a6a2f27ffbd698181af89383bcebe |
| 1791765769064-f8d296ff | container | synkro-infra-test-1791765769064-f8d296ff-source-synkro-mongo-1 | 21c2d6b5d0f2be55bec260e797f15453d31960ad82ab16142568990538db0079 |
| 1791765769064-f8d296ff | volume | synkro-infra-test-1791765769064-f8d296ff-source_mongo-data | 2026-10-12T00:42:59Z |
| 1791765769064-f8d296ff | volume | synkro-infra-test-1791765769064-f8d296ff-source_mongo-config | 2026-10-12T00:42:59Z |
| 1791765769064-f8d296ff | network | synkro-infra-test-1791765769064-f8d296ff-restore | 7ccb30c17ff169699c6674a47cce00195b197b8e014479d53ba20b399ba86b72 |
| 1791765769064-f8d296ff | container | synkro-infra-test-1791765769064-f8d296ff-restore-synkro-mongo-1 | baca94390317418aaff85f646bf987ca940b5d3169bde45fcef18f1900398a7e |
| 1791765769064-f8d296ff | volume | synkro-infra-test-1791765769064-f8d296ff-restore_mongo-data | 2026-10-12T00:45:39Z |
| 1791765769064-f8d296ff | volume | synkro-infra-test-1791765769064-f8d296ff-restore_mongo-config | 2026-10-12T00:45:39Z |
| 1791768263329-3ad9e24a | network | synkro-infra-test-1791768263329-3ad9e24a-source | ca0d0f7749ffb3ce7be100fefe65ce400337d6d69328850cb240359162678c51 |
| 1791768263329-3ad9e24a | container | synkro-infra-test-1791768263329-3ad9e24a-source-synkro-mongo-1 | 764681b88b07ecc258294a9bfb16843f4a6c3693ebc223934cfac74c23b5da1c |
| 1791768263329-3ad9e24a | volume | synkro-infra-test-1791768263329-3ad9e24a-source_mongo-data | 2026-10-12T01:24:50Z |
| 1791768263329-3ad9e24a | volume | synkro-infra-test-1791768263329-3ad9e24a-source_mongo-config | 2026-10-12T01:24:50Z |
| 1791768263329-3ad9e24a | network | synkro-infra-test-1791768263329-3ad9e24a-restore | 430ac256e1e57f499d057b7edd77b222a5145723fa1d80292ea561ba2523a693 |
| 1791768263329-3ad9e24a | container | synkro-infra-test-1791768263329-3ad9e24a-restore-synkro-mongo-1 | 68f13f53271592dda1722a60f9c104f6236c27dbf20200bb35dbe2b294f6cf56 |
| 1791768263329-3ad9e24a | volume | synkro-infra-test-1791768263329-3ad9e24a-restore_mongo-data | 2026-10-12T01:30:15Z |
| 1791768263329-3ad9e24a | volume | synkro-infra-test-1791768263329-3ad9e24a-restore_mongo-config | 2026-10-12T01:30:15Z |

## Delivered files and external gates

Added tests/sales-integration.mjs and tests/sales-probe.js in the test-first commit;
added scripts/sales.mjs and mongo/scripts/sales-baseline.js for owner integration.
Updated scripts/mongo.mjs, docker.mjs and disposable.mjs, mongo/scripts/tools.sh,
tests/integration.mjs, the CI workflow, PR template, README and both local documents.
Engine/bootstrap/environment examples and pinned images remain preserved.

The workflow checks out Sales at the exact merge SHA with read-only permissions,
runs Linux Node 22 configuration and both mandatory real suites, bounds the job at
25 minutes, always attempts manifest cleanup and uploads only resource manifests.
The obsolete blocked-Sales summary is removed. Remote infrastructure CI must be
checked at the final pushed SHA; local passes do not assert remote infrastructure
success. The final delivery report records that remote run separately.

[The concrete handoff](handoff.md) provides exact document sections and
NFR-004/NFR-007/NFR-009 → HU-INF-04 → test → implementation mappings.
Remote synkro-docs/main remains 61056c93e6e0783a9199bf56778e9494739bc458;
the inspected local documentation HEAD is 4cef4dcb96d09a33347898839465cb83e51bd770.
Deployment §6's Sales URI still lacks authSource=admin in both inspected versions.
sales_app authenticates in admin; migrations also use administrator authSource=admin.
Accepted ADR-010/012 remain immutable. A separate documentation PR and manual peer
review remain required; no HU completion or production recovery/RTO/RPO claim.

Sibling working trees remain clean and on their original branches/heads:
Sales fix/migration-runner-secret-handling at 64147634f5dad704d30a31ac2c12328edddaade8;
docs docs/fix-modal-ghost-tokens-and-sale-amounts at
4cef4dcb96d09a33347898839465cb83e51bd770.

Only the existing feature branch is committed/pushed; no force push or history rewrite.
The initial five infrastructure commits remain reachable. The final full SHA and
Conventional Commit list are in the delivery report, avoiding a self-referential SHA.
