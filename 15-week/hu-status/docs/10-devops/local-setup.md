# Local Project Setup

> Starts the whole system on a new computer, from scratch. If any step here
> does not match reality, fix it in the same PR that found the gap — an
> onboarding guide that lies is worse than none.
>
> This document is the "type this literally" version of
> `05-architecture/deployment.md` §9, aimed at a new developer's first run.
> If the two ever disagree, `deployment.md` is the source of truth.

---

## Prerequisites

| Tool | Minimum version | Verify with |
|------|-----------------|-------------|
| Docker | 24.0+ | `docker --version` |
| Docker Compose | 2.24.4+ for the candidate include/override model | `docker compose version` |
| Git | 2.40+ | `git --version` |
| Python | 3.11+ for root operations | `python --version` |
| Node.js | 22+ for Mongo owner tooling; frontend uses its pinned package runtime | `node --version` |
| JDK | 21 | `java --version` |
| Maven | 3.9+ | `mvn --version` |
| Go | the release pinned in `go.mod` | `go version` |

You need the JDK/Maven pair only if you are working on a Java service
(`synkro-auth-api`, `synkro-customers-api`, `synkro-workflow`); you need Go
only for a Go service (`synkro-products-api`, `synkro-sales-api`,
`synkro-worker`). Docker is required either way, to run the shared
PostgreSQL instance, the MongoDB instance, and the services you are not
actively developing.

**Recommended, not required:** an editor with Java and Go support (IntelliJ
IDEA, VS Code with the Go extension), and a REST client (Postman, Insomnia,
or `curl`) for testing endpoints manually.

---

## Local ports in use

| Port | Service | Published to the host? |
|------|---------|------------------------|
| 8000 | `synkro-api-gateway` | Yes — the only API entry point |
| 5173 | `synkro-front` | Yes |
| 3000 | Grafana | Yes |
| 9090 | Prometheus | Yes |
| 8080 | Four APIs and Workflow | No — internal `platform` |
| 80 | Portal asset containers in selected root | No — served through Host; Products tag publishing 5175 is excluded from this lock |
| 5432 | `synkro-db` (shared PostgreSQL instance) | No |
| 27017 | `synkro-mongo` (MongoDB instance, holds the `sales` database) | No |

`synkro-worker` listens on no port. Full detail:
`05-architecture/deployment.md` §2.

**Check a port is free before starting:**
```bash
# macOS / Linux
lsof -i :8000

# Windows
netstat -ano | findstr ":8000"
```

---

## Step-by-step installation

### Step 1 — Clone every repository as a sibling of `synkro-infra-postgres`

Obtain approved read access to both private infrastructure repositories and the owners. Prepare a new sibling workspace for the 18 code repositories listed in the [release manifest](releases/2.0.0.md). Start by cloning Infra as below; its dependency fetcher retrieves absent owners at the immutable lock revisions. Do not prepopulate them with arbitrary latest-main checkouts. `synkro-docs` may be cloned separately as a sibling. No optional sibling or stub is silently substituted in the full candidate. Use a new review workspace so existing user work is preserved.

```bash
mkdir synkrotech-review
cd synkrotech-review
git clone https://github.com/code-corhuila/synkro-infra-postgres.git
git -C synkro-infra-postgres switch --detach fc40ed745db23b89734ee2f45201c2594a3c5839
cd synkro-infra-postgres
python scripts/fetch_dependencies.py
python scripts/verify_lock_tags.py
```

These commands select the November 2 promoted Infra main commit, not an arbitrary future main head or a tagged release. The fetcher uses `dependencies.lock.json` and approved access, retrieves absent siblings into owned staging directories, checks exact HEAD/clean state and refuses conflicting existing checkouts. Do not force-reset or delete a teammate's checkout. Historical PR #13/#14 reproduction retains its own recorded head and lock in the Week 12 release/evidence records. Published component tags alone cannot substitute for the candidate Products Portal/Worker or Sales DB pin.

**Promoted source versus exact executed object:** the selected main tree
differs from executed root `1860d22ba026a1ccb67cf5dfa02bfcbc5db5b593` only
by added evidence-catalog files; code/configuration/lock are identical.
The [acceptance and merge audit](../15-project-control/infra-final-acceptance-2026-11-02.md)
records that proof and the missing code-review evidence. A clone of main
contains equivalent runtime source, **not necessarily the candidate commit
object**: the original 21/21 execution SHA is preserved in
`docs/evidence/final-independent-2026-11-02/verified-candidate.bundle`.
For exact-SHA reproduction, import that bundle only inside a new private
verification clone. From its Infra root, before switching away from the
publication tree:

```bash
git bundle verify docs/evidence/final-independent-2026-11-02/verified-candidate.bundle
git fetch docs/evidence/final-independent-2026-11-02/verified-candidate.bundle HEAD
git switch --detach 1860d22ba026a1ccb67cf5dfa02bfcbc5db5b593
```

Verify its tree, lock and owner pins against the catalog before running the
documented isolated full verifier. Importing the object or checking out the
publication commit does not itself execute acceptance or grant a release.

### Step 2 — Environment variables

```bash
cp env/dev.env.example env/dev.env
```

Provision the protected absolute files and metadata in [deployment section 6](../05-architecture/deployment.md#6-configuration): five distinct PostgreSQL password files, Auth private/public keys, Grafana password readable by UID 472, and owner-only Mongo environment configuration. Keep secrets outside every repository/root mount. Set `DATABASE_URL` only for `products_app` and `SALES_APP_MONGODB_URI` only for `sales_app` with `authSource=admin&replicaSet=rs0`. Root derives separate administrator runner credentials in memory. Inline Products public PEM must match its public-key file. Do not print expanded configuration.

`python scripts/synkro.py dev-identity dev` is the actual optional development-only key/SERVICE-token generator; it refuses existing outputs and qa/main. It creates no human ADMIN. Root examples keep `VITE_DEV_SIGN_IN=false`; normal login uses Auth. Use the delivered initialization CLI after migrations for the first ADMIN; no local seed or simulated token replaces it.

### Step 3 — Start the platform

Prepare the engines first, with no normal application traffic. From the candidate root:

```bash
python scripts/synkro.py up dev --mode postgres-migrations
python scripts/synkro.py status dev --mode postgres-migrations
```

This preparation mode starts PostgreSQL; owning runners are explicit tooling and do not run from `up`. The operations wrapper creates `platform` only if absent, validates credentials/exposure and refuses conflicting persistent environment aliases. Stop/operate environments sequentially on that shared network. Full application startup follows migrations and administrator initialization in Steps 4–5, rather than treating pre-migration errors as normal readiness.

### Step 4 — Migrate each store

```bash
python scripts/synkro.py migrate dev --mode postgres-migrations --domain auth
python scripts/synkro.py migrate dev --mode postgres-migrations --domain customers
python scripts/synkro.py migrate dev --mode postgres-migrations --domain products
python scripts/synkro.py migrate dev --mode postgres-migrations --domain workflow
python scripts/synkro.py privileges dev --mode postgres-migrations
python scripts/synkro.py down dev --mode postgres-migrations
python scripts/synkro.py up dev --mode mongo-migrations
python scripts/synkro.py migrate dev --mode mongo-migrations --domain sales
python scripts/synkro.py down dev --mode mongo-migrations
```

Flyway history belongs to each PostgreSQL schema; Sales Liquibase history belongs to Sales. Repetition applies zero new changes. A legacy shared Flyway history/checksum mismatch fails for owner reconciliation, never repair. Restart PostgreSQL with `python scripts/synkro.py up dev --mode postgres-migrations`, then follow [Initial administrator initialization](../13-operations/initial-administrator-initialization.md) while the target remains closed to normal traffic. The CLI's exit 5 means unknown commit outcome, not rollback. Existing ADMIN returns no-op; initialization is not TD-009 recovery.

For qa/main select its explicit environment; the supported root migration wrapper requires a successful backup first. Preserve volumes and immutable applied migrations. [Backup and recovery](../13-operations/backup-and-recovery.md) covers compatible restoration and manual rollback prerequisites.

### Step 5 — Verify

```bash
python scripts/synkro.py up dev
python scripts/synkro.py status dev
curl --fail http://localhost:8000/health
```

Open `http://localhost:5173` and authenticate through Auth/Gateway. Check authorized Customer/Product reads, Sales history and the explicitly selected registration/detail scope. Verify durable business effects and ownership against the selected evidence checklist; a gateway response alone does not establish all stores or saga behavior. Products health remains TD-017. Worker's `main` (promoted 2026-11-02, PRs #23–#26) runs the bounded alert run-loop and Products HTTP transport, not a placeholder log; it implements run-scoped opening keys, pending reconciliation for valid RESOLVED responses and the separate shared-budget correction. The existing exact-root run observed the five Worker steps recorded in the catalog; that does not establish every edge case or close HU-WRK-02. Grafana/Prometheus at loopback 3000/9090 show tools, not proven end-to-end service telemetry.

Independent full reproduction of the PR #13/#14 snapshot uses the versioned [reviewer package](https://github.com/code-corhuila/synkro-infra-postgres/blob/8139a43e786f3ab7adf6367065a6165d8d83c15e/docs/reviewer-package-2026-10-22.md); its record is still pending, and the known Sales DB pin conflict described there remains for that historical lock. Do not report the documented commands as executed by this documentation update. The 2026-11-02 candidate above is a separate, later pin selection that keeps the released Sales DB revision and is not affected by that historical conflict (see [infra-final-acceptance-2026-11-02](../15-project-control/infra-final-acceptance-2026-11-02.md)).

---

## Working on a single service

For HU-INF-06 current-branch verification, use the [verification summary](../15-project-control/documentation-verification.md#four-story-delivery-and-acceptance--2026-11-04). It distinguishes derived verification locks from an unmodified published root and records the exact Sales DB commit required by the Mongo recovery procedure. Automated fixtures are destroyed after their checks; their credentials are not a usable operator handoff. A separately verified review fixture uses labelled ownership, explicit loopback ports, a private access file and its own STOP procedure. The existing shared environment and its administrator must be preserved.

Use the owner README, exact runtime and a migrated disposable/local owning store; other domain state is accessed only through its API. The database is internal on `platform`. A host-run service cannot use `synkro-db` DNS or localhost:5432 unless an explicit isolated development arrangement is provided; do not publish the persistent database to make the old host-run example work. Prefer the owner's container on the existing network, or its disposable test fixture.

Use the Java/Go/frontend stack guides for build commands. Root preparation mode is a subset, not complete integration acceptance. Missing siblings/credentials fail; do not comment out root includes and then describe that result as full startup.

---

## Daily workflow

```bash
git fetch origin
git switch -c feat/short-description origin/develop
# Review and apply any new owner migrations through the explicit environment CLI.
# Follow the HU criteria and TDD for production-code changes.
git add <specific-files>
git commit -m "feat(scope): description"
git push -u origin feat/short-description
```

For documentation use `docs/<short-kebab-description>` from docs main and a `docs(scope): description` commit with the scope matching the change. Promotion of code is `cherry-pick -x` through destination child branches and reviewed PRs; no permanent-branch merge. A new owner revision needs a reviewed lock update and affected reruns, not an unrecorded pull. Before stopping select the same environment/mode; the wrapper preserves its volumes.

---

## Common issues

### "Port already in use"

Identify the listener with `lsof -i :8000` or Windows `netstat -ano | findstr :8000`. Coordinate with its owner; stop only the selected project through its supported command. Do not kill arbitrary processes or prune shared Docker resources.

### "Docker containers not starting"

Check Docker/Compose versions, exact candidate lock, protected input readability, include paths and the sanitized operation error. Use `python scripts/synkro.py status dev` for the selected engine and inspect only safe, access-restricted diagnostics. `python scripts/synkro.py down dev` preserves data. Volume deletion is not a documented repair.

### "`synkro-db` or `synkro-mongo` healthy but a service answers 500 on every request"

Check that the correct owner migrations/history/grants exist, that application credentials match bootstrap, and that the service points to its own store. Engine health does not prove schema readiness. Wrong credentials, absent tables and real implementation faults remain failures; do not classify every 500 as expected migration work.

### "401 on every request, even with a token"

Check the Auth-issued credential's expiry, allowed algorithm, audience/use and consistent public key; renew through normal login/Host rules. Development key regeneration invalidates old credentials and must not be used to repair qa/main. Issued JWT revocation limits remain ADR-017.

### "A service I need isn't cloned"

Use approved access and `fetch_dependencies.py` against the recorded lock in a clean review workspace. Private source read access is separate from a successful private-integration workflow. Do not broaden GitHub permissions, silently substitute stubs or patch owner source from Infra.

---

## Correlations

- Full deployment topology, ports and the composition rule → `05-architecture/deployment.md`
- Environment variables per service → `05-architecture/deployment.md` §6
- The 3 project environments → `10-devops/environments.md`
- Configured CI/CD jobs and their real execution limits → `10-devops/ci-cd.md`
- Per-stack commands and folder layout → `_stacks/go.md`, `_stacks/java-spring.md`
- Candidate/persistent operation troubleshooting → `13-operations/incident-management.md`

## Four-story verification and local access

Use the selected Infra revision and its immutable dependency lock, rather than assuming that checking out every current branch HEAD reproduces an older acceptance. The [verification summary](../15-project-control/documentation-verification.md#four-story-delivery-and-acceptance--2026-11-04) records the tested selection and later main promotion. Acceptance fixtures were cleaned and their credentials retired; no current working login is offered by those records. Obtain a newly verified private handoff when a review environment is needed.

### Later feature-selection reconciliation — 2026-11-08

See the [current QA/main selection and review gates](../15-project-control/documentation-verification.md#docs-98-consolidated-reconciliation--2026-11-08). Infra QA #53 preserves AUTH-17 and selects VEN-19 after the fresh joint 55-check supplement; main #54 remains an open dependent proposal. Existing v2.0.0 tags and earlier execution roots are unchanged. Use the exact selected lock; disposable fixtures/retired credentials do not supply a persistent deployment or operator handoff.

## New Customers/Sales develop integration — 2026-11-10

The [three-story publication record](../15-project-control/documentation-verification.md#three-new-functional-stories--consolidation-2026-11-10) identifies eleven develop merges; it does not update an installed stack automatically. Rebuild the selected portal images after changing compiled issuer/origin inputs. Select the supported Host origin explicitly; do not assume simultaneous localhost/127 support. Keep persistent data and unrelated stacks untouched.

Apply additive Customers DB expansion before its API/Portal, leave contacts CHECK inactive until inventory/repair/API rollout/recovery conditions are met, and verify the API fixture against the actual integrated DB revision. Apply Sales DB before its API, verify DB_REF, then use the final Portal chain and Products category selector. Inventory the actual target before deciding no backfill; UUID/history and old numberless records must survive. Keep migration ownership in each DB repository and use their published runbooks, not copied schema commands in application repositories.

Password reset HU-AUTH-19 is not part of this evidenced setup. Do not expose a guessed endpoint or reset existing accounts as a setup shortcut. QA/main promotion remains a separate destination-child cherry-pick -x flow, applications before Infra and required main review.
