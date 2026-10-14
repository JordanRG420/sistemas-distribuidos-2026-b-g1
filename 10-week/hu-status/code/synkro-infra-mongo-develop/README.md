# synkro-infra-mongo

Persistent, authenticated, single-node MongoDB replica set for Synkro (HU-INF-04,
[issue #236](https://github.com/code-corhuila/synkro-docs/issues/236)).

**Status (verified 2026-10-13):** HU-INF-04 is delivered for this component. The reviewed work
is integrated in `develop` (PR #1, CI green) and promoted to `qa` (PR #2, `qa` at `e03d22d`, CI green).
[synkro-docs#236](https://github.com/code-corhuila/synkro-docs/issues/236) is closed. The component was also
verified operationally in an isolated local QA-equivalent environment together with `synkro-sales-db` `qa`
(`218919d`). This is **not** acceptance of the complete platform: the team's QA environment, the root
composition in `synkro-infra-postgres`, the services and contract tests remain a separate scope, and no release
to `main` has happened yet.
Sales integration uses the reviewed credential correction in
[Sales PR #5](https://github.com/code-corhuila/synkro-sales-db/pull/5).
See [verification evidence](docs/verification.md) and [the documentation handoff](docs/handoff.md).
The domain-boundary correction is documented separately in
[boundary verification](docs/domain-boundary-verification.md).

## Ownership and references

Infrastructure owns the service, named volumes, internal key, bootstrap, administrator,
`sales_app`, health, operations and tests. It never creates `sale`, Sales validators,
indexes, roles or Liquibase history. Those belong to `synkro-sales-db`; the complete
system composition belongs to `synkro-infra-postgres`.

- MongoDB **7.0.43**: fixed image
  `mongo:7.0@sha256:1f995ad6fdb93244a1addab1b58f934a0bc2f5643c38e02f5e9d7f0c7d227a7b`.
- `synkro-docs/main`: `61056c93e6e0783a9199bf56778e9494739bc458` (ADR-010/012).
- Pinned merged `synkro-sales-db`: `9cfbde7db4bea7bacad70370c60f91f8eb917c04`.

The owner's Dockerfile remains unchanged: Liquibase 4.31.1, MongoDB extension 4.29.1,
driver 3.12.14 and the MongoDB 7.0 client stage. Both merge checks passed.

## Prerequisites

- Docker with Linux containers and Compose v2.20+.
- Node.js 22+ and Git; no npm dependencies.
- Bash for local syntax checks: Git Bash from Git for Windows, or Bash on Linux/WSL.
  Lifecycle commands work in native PowerShell; container scripts execute in Linux.
- Docker daemon access and permission to protect secret files. Windows preparation
  uses `whoami.exe` and `icacls.exe`; POSIX uses directory/file modes 0700/0600.

Run commands from this repository. Use `node -- <script> ...` to separate script
options such as `--env-file` from Node runtime options.

## Environments and secrets

| Environment | Example | Real file | Project |
|---|---|---|---|
| develop | `env/dev.env.example` | `env/dev.env` | `synkro-dev` |
| qa | `env/qa.env.example` | `env/qa.env` | `synkro-qa` |
| main | `env/main.env.example` | `env/main.env` | `synkro-main` |

Generate a new environment without printing secrets (refuses to overwrite):

```sh
node -- scripts/new-environment.mjs --environment dev --admin-user mongo_operator --env-file env/dev.env
node -- scripts/mongo.mjs validate --env-file env/dev.env
```

For qa/main, use secrets issued for that environment according to the team's secret
management process. Alternatively copy the matching example and fill it using a
protected editor/store. Values are literal data: no shell evaluation, interpolation
or escape processing. Optional outer quotes are stripped; inner characters are
preserved. Spaces, dollar signs, quotes, backslashes, exclamation marks, `@` and `:`
in passwords are exercised by real tests.

Required settings are administrator credentials, `SALES_APP_PASSWORD`, stable base64
`MONGO_INTERNAL_KEY`, `rs0`, the network and startup/connection limits. The generator
uses independent random passwords and a key from 756 random bytes. Preserve each
environment's original secrets; do not share passwords between its users.

The CLI reads only its explicit file, validates it and prepares protected files:

```text
.runtime/<project>/admin.json
.runtime/<project>/app.json
.runtime/<project>/internal-key
```

Compose mounts these as secrets. Passwords are absent from container environment
variables, command arguments and rendered Compose. Real environment files, runtime
secrets, keys, test artifacts and backups are git-ignored. Restrict their files and
directories and keep secure copies outside the repository. Docker administrators
can read mounted secrets, so restrict Docker access as well.

Changed environment passwords never silently rotate existing users. Restore the
original value after a mismatch; rotation is a separate reviewed operation. A
data-only backup does not include passwords or the internal key.

## Start, health, restart and stop

Provision the shared network once, if absent:

```sh
docker network inspect platform
# Only when absent:
docker network create platform

node -- scripts/mongo.mjs start --env-file env/dev.env
node -- scripts/mongo.mjs status --env-file env/dev.env
node -- scripts/mongo.mjs health --env-file env/dev.env
node -- scripts/mongo.mjs bootstrap --env-file env/dev.env
node -- scripts/mongo.mjs restart --env-file env/dev.env
node -- scripts/mongo.mjs stop --env-file env/dev.env
```

Every operation names its environment; no root `.env` fallback exists. Status returns
nonzero when authenticated health fails. Bootstrap explicitly rechecks the running
instance, creating only missing users. `wait --timeout-seconds 30 --env-file env/dev.env`
offers a bounded health wait; `config --env-file env/dev.env` renders credential-free Compose.

The service `synkro-mongo` has no global container name or published host port. Clients
connect to `synkro-mongo:27017` on external network `platform`. Storage volumes are
`<project>_mongo-data` and `<project>_mongo-config`. The data volume also preserves the
internal key, owned by `mongodb` with mode 0400. Stop/restart retain both volumes.
There is no destructive reset operation.

The shared alias requires **one persistent environment at a time per machine**.
Start refuses a competing alias on the network. Separate projects/volumes do not
provide simultaneous isolation on `platform`; tests use separate exclusive networks.

## Authenticated bootstrap

1. Compare the mounted key with the volume's key. Copy with owner `mongodb`/0400 only
   on fresh storage; refuse missing keys on nonempty storage and changed keys.
2. Start `mongod --auth --keyFile ... --replSet rs0 --bind_ip_all`.
3. Connect over loopback. Authenticate an existing administrator, or use the localhost
   exception when no users/roles exist to initialize the replica set.
4. Initiate only an uninitialized set with member `synkro-mongo:27017`; wait for PRIMARY.
5. Create the first administrator in `admin`, authenticate and verify configuration
   and its root role. Never reconfigure an existing replica set or repair grants.
6. Create missing `sales_app` in `admin` with no roles; authenticate it. Existing
   passwords and grants are preserved, including grants the domain later owns.
7. Report verification and set the startup marker only after successful completion.

The custom entrypoint replaces the official image initialization hook: no
`MONGO_INITDB_ROOT_*` or `/docker-entrypoint-initdb.d` initialization is used. No
temporary unauthenticated server is exposed to the network. The localhost exception
closes after the first user, following the
[MongoDB 7.0 procedure](https://www.mongodb.com/docs/v7.0/tutorial/deploy-replica-set-with-keyfile-access-control/).
Persistent operation never enables test commands or failpoints.

Startup defaults to 60 seconds (range 10–300); connection limits default to 2000 ms
(range 500–3000). Bootstrap has an outer process deadline and kills timed-out clients.
Health has a 12-second deadline; Compose allows 15 seconds per probe. Start waits at
most startup-limit + 30 seconds for Compose health, within a host limit of
`startup-limit + 90 seconds` including image/Docker work. Shutdown allows 30 seconds.
Failed bootstrap terminates MongoDB, returns nonzero and never marks startup complete.

Health requires the marker, administrator authentication, `rs0`, the exact member
address, `hello().isWritablePrimary` and replica status PRIMARY. TCP/unauthenticated
ping/SECONDARY status cannot pass.

## Sales integration

The inspected runner convention is:

```text
MONGODB_URI=mongodb://<percent-encoded-admin-user>:<percent-encoded-admin-password>@synkro-mongo:27017
MONGODB_DATABASE=sales
MONGODB_OPTIONS=replicaSet=rs0&authSource=admin&serverSelectionTimeoutMS=5000
```

The merged runner consumes one `LIQUIBASE_COMMAND_URL` from its environment for
Liquibase, preflight and postflight. It invokes mongosh with `--nodb --quiet --file`,
preserves conservative drift/error checks and sanitizes private diagnostics.
The blocker at `ffdc24b9` is historical; that revision is never run.

The suite builds the owner's unchanged Dockerfile from a clean checkout at the
exact SHA, captures the image ID, mounts Sales read-only and uses the supported
`sales-db-migrate` image entrypoint (`deploy/migrate.sh update`) without overriding it.
Docker receives inherited environment **names**, never literal secret assignments,
following the [Docker CLI contract](https://github.com/docker/cli/blob/master/docs/reference/run.md#environment-variables).
The URI is encoded in JavaScript as data; no credential-bearing Compose model is
rendered. Authenticated PRIMARY health is required and each runner has a 90-second
deadline. Actual Bash/mongosh/Java arguments, stdout/stderr and container logs are
checked before diagnostics can be published. Privileged Docker administrators can
inspect environment data, so restrict daemon access.

Application parameters: `sales_app`, database `sales`, **`authSource=admin`**,
`replicaSet=rs0`. Supply passwords as data through the driver/secret mechanism;
percent-encode them correctly when constructing a URI. Administrators are for
administration/migrations, never application requests. The inspected central deployment
example still omits authSource; its precise correction is in the handoff.

## Backup and disposable restoration

Backup an existing ordinary database into a new protected path outside version control:

```sh
node -- scripts/mongo.mjs backup --env-file env/dev.env --database sales --archive /secure/backups/sales-2026-10-11.archive.gz
```

Use an absolute Windows path in PowerShell. Existing output files are refused.
Authenticated mongodump/mongorestore come from the fixed image and consume URI/password
from a temporary 0600 configuration file, removed afterward. Binary transfers use file
descriptors/container stdin/stdout, avoiding shell quoting and Docker copy limitations
on tmpfs. No password appears in tool arguments.

Scope: selected database data and collection metadata, including indexes/validators
and any migration history already present. No `admin`, `local`, `config`, users, roles
or internal key are backed up. Protect archives like the database. Tool success alone
does not prove recovery.

The generic recovery test restores `infra_fixture` into an independent empty target.
The Sales test first migrates a fresh target through the pinned owner runner,
establishing schema, roles, grant and history with different passwords/internal key.
Only `sales.sale` documents are then restored. Target indexes/validator, authentication
state and freshly established Liquibase history are retained. Source authentication
collections and migration history are never imported.

Restoration is permitted only into an empty ordinary database on a labeled disposable
target with an exact test-run identity:

```sh
node -- scripts/mongo.mjs restore-disposable --env-file tests/.artifacts/<run>/restore.env --database infra_fixture --archive /absolute/test.archive.gz --test-run <run>
```

Sales recovery has a separate disposable-only command:

```sh
node -- scripts/mongo.mjs restore-sales-disposable --env-file tests/.artifacts/<run>/restore.env --database sales --archive /absolute/sales.archive.gz --test-run <run> --manifest tests/.artifacts/<run>/manifest.json --sales-checkout .runtime/sales
```

It validates every recorded container/network/volume identity and uses a generic
namespace safety check to require an existing empty application collection. The
supported runner's `status` must report up to date before `update` verifies zero
changes with the owner's preflight/postflight and checksum checks. Infrastructure
never imports Sales validation modules, reads its migration ledger, enumerates
migration families or assumes a fixed changeset count. The runner reuses its
initially recorded image ID; recovery never rebuilds it. Restore tools use
`--nsInclude sales.sale --noIndexRestore --noOptionsRestore --stopOnError`; no `--drop`.
The archive covers the entire selected `sales` database, including its history and
collection metadata; this procedure imports **only application documents**.
The suite compares source/target documents and collection metadata, preserves target
user snapshots, delegates migration validation/replay to Sales, verifies permissions and rechecks the
source. Nonempty, unmigrated, foreign/replaced and persistent targets are refused.
There is no automated persistent restore/reset mode.

## Verification and cleanup

```sh
node -- scripts/check.mjs
node -- tests/integration.mjs
node -- tests/sales-integration.mjs --sales-checkout .runtime/sales
# Recovery after an interrupted local test:
node -- scripts/cleanup.mjs --manifests-dir tests/.artifacts
```

Configuration tests execute validation, CLI and Compose behavior. Real tests use two
isolated instances with **named volumes** and client containers. Only clients use
tmpfs. Persistence is tested across stop/start and restart. A disposable administrator
creates `infra_fixture.records`; its temporary built-in `read@infra_fixture` grant
checks generic grant preservation and proves nothing about Sales permissions.

Each run creates `synkro-infra-test-<run>-source` and `...-restore` projects/networks.
Servers/networks/volumes have unique run and disposable labels. Tests refuse preexisting
names, record container/network IDs and volume creation times in
`tests/.artifacts/<run>/manifest.json`, then validate identities, projects and expected
labels before deletion. Client containers also have recorded names/IDs, run/project
labels and automatic removal; interrupted clients are handled by the same manifest.
Unknown/replaced resources are refused. Cleanup never targets
persistent projects or shared `platform`. Every failed assertion/operation returns nonzero.

Use native Linux Node 22 (Ubuntu/WSL with a native Linux source directory) for the full
suite. Prepare a separate clean Sales checkout at the exact SHA; its absence or dirty
state fails visibly. Run the suites sequentially. Windows Node/Git Bash execution is
not the CI-equivalent environment; subprocess timeouts must not count as passes.

Five boundary regressions exercise probes with no Sales checkout and an inaccessible
private ledger, variable CLI migration counts, and generic restoration namespace safety.
CI checks out the exact Sales SHA and runs both real suites on Linux Node 22 with
read-only permissions and a 25-minute job limit. It runs on develop/qa/main pushes/PRs
and pushes to the original feature branch and `fix/**`, always attempts recorded-resource cleanup and
publishes identities only. Secrets, environment files, raw diagnostics and archives
are excluded. The summary retains the separate documentation and peer-review gates.

## Expected failures

| Message | Action |
|---|---|
| `required --env-file` | Select the environment explicitly. |
| `set MONGO_...` / `set SALES_APP_PASSWORD` | Fill the named setting; its value is not echoed. |
| `external network ... is missing` | Provision the intended network explicitly. |
| `synkro-mongo already exists ...` | Coordinate shutdown with that environment's operator; do not reuse its database. |
| `MONGO_INTERNAL_KEY mismatch` | Restore the original key; no replacement was performed. |
| `persistent database has no internal key` | Use an explicit reviewed recovery procedure. |
| Administrator/application password mismatch | Restore original credentials; bootstrap never rotates them. |
| `incompatible replica configuration` | Inspect the intended instance; bootstrap does not repair drift. |
| `authenticated PRIMARY readiness timed out` | Investigate initialization/elections; the command failed. |
| `unhealthy: authentication, rs0 membership ...` | Verify credentials, configuration and PRIMARY state. |
| `refusing operation on unknown ... resource` | Investigate ownership; do not override cleanup guards. |

Host operations suppress raw Docker child diagnostics. Inspect the selected container's
bootstrap/health messages; do not publish tracing, environment dumps or raw inspect output.

## Inclusion by the root PostgreSQL composition

Use `prepare --env-file <selected-file>` to materialize this repository's secrets.
The root composition must supply every non-secret Mongo setting from the examples,
the same Compose project/network, and absolute `MONGO_SECRET_DIR` pointing to this
repository's `.runtime/<project>`. Include `../synkro-infra-mongo/compose.yml` with an
explicit include `env_file` for the selected environment and depend on
`synkro-mongo: service_healthy`. Resolve paths against their owning repositories;
never fall back to a sibling/root `.env` or print root Compose output containing other
services' secrets. The full root composition is not implemented here.

## Script responsibilities

| File | Responsibility |
|---|---|
| `scripts/new-environment.mjs` | Generate protected secrets without overwrite. |
| `scripts/config.mjs`, `protect.mjs` | Literal parsing, validation, secret preparation and filesystem protection. |
| `scripts/mongo.mjs`, `docker.mjs` | Explicit environment lifecycle and bounded safe Docker operations. |
| `mongo/scripts/entrypoint.sh` | Stable internal key, authenticated daemon supervision and shutdown. |
| `mongo/scripts/bootstrap.*`, `common.js` | Create-only initialization, credentials/configuration verification. |
| `mongo/scripts/health.*` | Authenticated replica/PRIMARY health. |
| `mongo/scripts/tools*`, `receive-archive.sh`, `empty-database.js` | Protected backup tools and empty-target recovery. |
| `scripts/disposable.mjs`, `cleanup.mjs` | Ownership checks and disposable-only cleanup. |
| `scripts/sales.mjs`, `runner-result.mjs` | Pinned supported runner, public CLI results and real exposure checks; all domain validation stays in Sales. |
| `mongo/scripts/empty-collection.js` | Generic existing-empty-namespace restoration safety; no domain migration knowledge. |
| `scripts/check.mjs`, `tests/*` | Syntax/lint/configuration and real infrastructure checks. |

## Branching

Permanent develop/qa/main branches accept changes only through child branches and
manual PR review. Promotion uses `cherry-pick -x`, never permanent-branch merges.
Main requires `ariel5253` approval; CODEOWNERS is preserved byte-for-byte. See
`synkro-docs/00-governance/branching-policy.md`.
