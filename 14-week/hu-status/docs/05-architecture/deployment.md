# Deployment Topology

> Defines how the system is composed and run in each environment. Any developer
> must be able to start the complete system by following only this document and
> the repositories it names.

---

## 1. Overview

```
┌──────────────────────────────── Developer machine ──────────────────────────────────┐
│                                                                                     │
│   Browser ──▶ synkro-front :5173 (published)                                        │
│                 └─ serves the four portals as remotes under /remotes/<domain>/      │
│   Browser ──▶ synkro-api-gateway :8000 (published) ── /api/v1/...                   │
│                                                                                     │
│   ┌──────────────────────────── network: platform ────────────────────────────┐     │
│   │                                                                            │    │
│   │   synkro-auth-api ─────────┐                                               │    │
│   │   synkro-customers-api ────┤                                               │    │
│   │   synkro-products-api ─────┼──▶ synkro-db (PostgreSQL, shared instance)    │    │
│   │   synkro-workflow ─────────┘     ├ auth_schema                             │    │
│   │     │ (saga steps, service token)├ customers_schema                        │    │
│   │     │                            ├ products_schema                         │    │
│   │     │                            └ workflow_schema                         │    │
│   │     │                                                                      │    │
│   │   synkro-sales-api ────────────▶ synkro-mongo (MongoDB, replica set)       │    │
│   │                                  └ database sales                          │    │
│   │                                                                            │    │
│   │   synkro-worker (main promoted 2026-11-02, PRs #23–#26; run-scoped job)     │    │
│   │                                                                            │    │
│   └────────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

- Every container joins one network, `platform`. Services and both database instances declare `expose`, never `ports`: they are reachable inside the network and not from outside.
- Only `synkro-api-gateway` and `synkro-front` publish ports to the host, together with the observability tools (§8). A published domain service would let any client skip the gateway, its rate limit and its correlation.
- Two database instances per environment. One PostgreSQL instance holds `auth_schema`, `customers_schema`, `products_schema` and `workflow_schema`, defined and started by `synkro-infra-postgres` (ADR-009). One MongoDB instance holds the `sales` database, defined and started by `synkro-infra-mongo` (ADR-010). Each `-db` repository and `synkro-workflow` own only the migrations of their store. The system has no message broker in the MVP (ADR-007).
- Both infrastructure repositories now exist under their final names. **Delivery boundary, 2026-10-25 (Week 12, historical):** PostgreSQL Infra `main`/`qa` were the two-file scaffold at `649b811c5ad8711dd1033f2a08f35269ae20c924` at that date; operational composition existed only on `develop` and open candidates, not in a published root release. The commands below target PR #13 at `8139a43e786f3ab7adf6367065a6165d8d83c15e`, with its exact dependency lock, as that snapshot's documented candidate; PR #14 was a distinct browser candidate. See [v2.0.0 release evidence](../10-devops/releases/2.0.0.md). **Current state, 2026-11-02:** `main`, `qa` and `develop` now share one composed tree, no longer the two-file scaffold. That shared tree is the independently-reproduced candidate root (distinct from PR #13/#14 above, passed full scope 21/21 by two operators), merged via PRs #40/#41/#42; the only difference from the executed candidate tree is new evidence-catalog files. `synkro-worker` `main` was promoted the same day via PRs #23–#26 and now shares its tree with Worker QA. The user authorized publication for this delivery and both annotated v2.0.0 component tags are now published. See [infra-final-acceptance-2026-11-02](../15-project-control/infra-final-acceptance-2026-11-02.md) for exact identity and the post-merge review-gap audit. The topology below is the accepted target either way; the scoped publication authorization and relayed final peer review govern this delivery; v2.0.0 is published and PR #290 completes HU-INF-02 closure.

---

## 2. Reserved Ports

| Port | Published to the host | Service | Description |
|------|-----------------------|---------|-------------|
| 8000 | Yes | `synkro-api-gateway` | The only entry point to the API |
| 5173 | Yes | `synkro-front` | The web application; serves the portals' remotes |
| 3000 | Yes | Grafana | Dashboards over metrics and logs (§8) |
| 9090 | Yes | Prometheus | Metrics store (§8) |
| 8080 | No | Four APIs and Workflow | Internal HTTP, reached by service name |
| 80 | No in selected root | Container-served portal assets | Owner-specific NGINX containers; tagged Products Portal is an incompatible exception publishing 5175, excluded from root selection |
| 5432 | No | `synkro-db` | PostgreSQL shared instance inside the network, reached by service name; holds `auth_schema`, `customers_schema`, `products_schema` and `workflow_schema` |
| 27017 | No | `synkro-mongo` | MongoDB instance (single-node replica set `rs0`) inside the network; holds the `sales` database |

`synkro-worker` listens on no port.

---

## 3. Composition

Repositories are siblings. The inspected candidate's `compose.yml` includes the owners' Compose files and root wiring overrides; it does not copy business services or migrations into Infra. The [candidate README](https://github.com/code-corhuila/synkro-infra-postgres/blob/8139a43e786f3ab7adf6367065a6165d8d83c15e/README.md) and [lock](https://github.com/code-corhuila/synkro-infra-postgres/blob/8139a43e786f3ab7adf6367065a6165d8d83c15e/dependencies.lock.json) are the executable source for this snapshot. Plain clones of every `main` branch cannot reproduce it.

| Repository | Brings |
|---|---|
| `synkro-infra-postgres` | PostgreSQL instance/bootstrap, full include list, Auth/Customers/Sales wiring overrides, explicit operations CLI, environment isolation and observability; `main`/`qa`/`develop` now share this composed tree, merged 2026-11-02 via PRs #40/#41/#42 from the independently-validated candidate in [infra-final-acceptance-2026-11-02](../15-project-control/infra-final-acceptance-2026-11-02.md) — required `main` codeowner review of that content remains open |
| `synkro-infra-mongo` | MongoDB instance, authenticated `rs0`, persistence, bootstrap of `sales_app` in `admin`, lifecycle and guarded disposable recovery |
| `synkro-auth-db`, `synkro-customers-db`, `synkro-products-db` | Own Flyway tooling runner and own schema/history |
| `synkro-sales-db` | Own Liquibase tooling runner, validator, indexes, roles and migration history |
| Each API and `synkro-worker` | Own application container; Worker `main` runs the bounded alert run-loop, Products HTTP transport and Products gateway implementation promoted 2026-11-02 (PRs #23–#26), not a placeholder — ADR-018 run-scoped identity/response handling and the independent shared-budget correction are implemented; HU-WRK-02 review/acceptance closure remains open |
| `synkro-workflow` | Application plus `workflow-db-migrate` and its own five migrations |
| Gateway, Host and four portals | Own containers; selected compatible portal builds are served through the Host |

The root selects fifteen owners at annotated tags, Sales DB at a different commit with the same released tree, and two explicit candidates: Products Portal `31f1dc235e50c69030c60f5d5faca5d2c1786270` and Worker `7827aa160d34c9ba1f70aa0481b2bf32accb42f0`. Products Portal's tag publishes 5175 and builds at `/`; it cannot replace that candidate. Sales API's tag is used with `compose.sales-api.override.yml`: the API gets the `sales_app` URI, while the migration runner gets its separate administrator URI. No API receives the administrator credential.

`platform` is an external network, created only when absent. Project names isolate volumes, but shared service aliases on `platform` mean persistent dev/qa/main runs must be sequential on one Docker daemon; separate daemons or intentionally reviewed network isolation are required for concurrent runs. The root refuses another environment's database aliases. Stopping one project preserves volumes and the shared network.

Instance bootstrap creates missing login users only, with domain search paths and no business tables/ADMIN/seed. Existing passwords and memberships remain intact. Schemas, roles and grants belong to owner migrations. On an existing PostgreSQL volume, adding a domain requires explicit create-only bootstrap and its new migration; recreating the volume is not an upgrade procedure.

---

## 4. Database Instances

Two instances per environment. Neither is defined by a `-db` repository.

### PostgreSQL (ADR-009, ADR-012)

| Environment | Instance | Database | Schemas | Defined by |
|---|---|---|---|---|
| develop | `synkro-db` | `synkro` | `auth_schema`, `customers_schema`, `products_schema`, `workflow_schema` | `synkro-infra-postgres` |
| qa | `synkro-db` | `synkro` | same | `synkro-infra-postgres` |
| main | `synkro-db` | `synkro` | same | `synkro-infra-postgres` |

| Schema | Migrated by | Used only by | Service user |
|---|---|---|---|
| `auth_schema` | `synkro-auth-db` | `synkro-auth-api` | `auth_app` |
| `customers_schema` | `synkro-customers-db` | `synkro-customers-api` | `customers_app` |
| `products_schema` | `synkro-products-db` | `synkro-products-api` | `products_app` |
| `workflow_schema` | `synkro-workflow` | `synkro-workflow` | `workflow_app` |

### MongoDB (ADR-010)

| Environment | Instance | Database | Migrated by | Used only by | Service user | Defined by |
|---|---|---|---|---|---|---|
| develop | `synkro-mongo` | `sales` | `synkro-sales-db` | `synkro-sales-api` | `sales_app` | `synkro-infra-mongo` |
| qa | `synkro-mongo` | `sales` | same | same | same | `synkro-infra-mongo` |
| main | `synkro-mongo` | `sales` | same | same | same | `synkro-infra-mongo` |

The delivered Mongo instance is a single-node replica set (`rs0`) with access control. Its owner bootstrap creates `sales_app` in `admin`; Sales API targets `/sales` with `authSource=admin&replicaSet=rs0`. The restricted application user has the Sales writer grants, with deletion and cross-database access denied. Migration/bootstrap administrators are separate. A one-node replica set supports the required database operations; it provides no failover.

### Privilege check

After migrating the PostgreSQL instance, this query lists, for every service user, the schemas it can read and write:

```sql
SELECT r.rolname AS service_user, n.nspname AS schema,
       bool_or(has_table_privilege(r.rolname, c.oid, 'SELECT')) AS reads,
       bool_or(has_table_privilege(r.rolname, c.oid, 'INSERT')
            OR has_table_privilege(r.rolname, c.oid, 'UPDATE')
            OR has_table_privilege(r.rolname, c.oid, 'DELETE')) AS writes
FROM pg_roles r
JOIN pg_class c ON c.relkind = 'r'
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE r.rolname LIKE '%\_app'
  AND n.nspname NOT LIKE 'pg\_%' AND n.nspname <> 'information_schema'
  AND has_schema_privilege(r.rolname, n.nspname, 'USAGE')
GROUP BY 1, 2
HAVING bool_or(has_table_privilege(r.rolname, c.oid, 'SELECT'))
ORDER BY 1, 2;
```

Expected: exactly one row per service user, its own schema, with `writes = true`. Also run the owner permission tests: this summary does not prove denial of DELETE, audit mutation or every cross-schema operation. Auth audit must remain append-only. The candidate operation `python scripts/synkro.py privileges dev --mode postgres-migrations` runs the coordinated check after all four owning migrations.

---

## 5. Migrations

- Auth, Customers and Products own PostgreSQL migrations in their `-db` repositories; Workflow owns its store under `db/`; Sales owns MongoDB changesets. Runtime applications never migrate at startup.
- Apply before deploying dependent code; use expand/contract for incompatible changes. Preserve applied versions/checksums; add a forward migration instead of editing old SQL/changesets.
- Runners are explicit `tooling` services, outside ordinary startup. They use administrator credentials only for migration. APIs use their restricted application users.
- Each history stays in its own schema/database. The candidate refuses a legacy `public.flyway_schema_history` or checksum drift; stop for backup and owner-reviewed reconciliation, never automatic repair/history deletion.
- In `qa`/`main` the candidate migration command first backs up the affected engine and refuses to start the runner if backup fails. Per-environment migration locks prevent overlapping operators; investigate interruption before treating a lock as stale.

From the reviewed PR #13 checkout, after preparing protected configuration:

```bash
python scripts/synkro.py up dev --mode postgres-migrations
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

Prepare PostgreSQL first, then each of its four owners, then Mongo/Sales; no migration creates another domain's tables or business rows. Repeat application must apply zero new changes. At the inspected revisions the baseline is Auth 17, Customers 7, Products 17, Workflow 5 versions and Sales 10 changesets; counts alone do not prove correct grants/data.

Auth/Products/Workflow use official Flyway `11.20.3-alpine`; Customers uses `10.20.1` with its guarded wrapper; Sales uses Liquibase `4.31.1` and Mongo extension `4.29.1`. Do not assume a global runner command or automatic `flyway undo` capability. Customers' wrapper accepts only `migrate`/`validate`/`info`; Sales supports its documented command allowlist and `rollback-count --count=N`. Rollback/rebuild tests run on disposable stores, never as routine persistent deployment. [Backup and recovery](../13-operations/backup-and-recovery.md) specifies restoration and rollback prerequisites.

---

## 6. Configuration

### Environment files

The candidate operations CLI selects an environment explicitly and reads its file. Real files, secrets and generated artifacts are ignored and access-restricted. The examples are committed, with paths/placeholders only.

| Environment | Real file | Committed example | `COMPOSE_PROJECT_NAME` |
|---|---|---|---|
| develop | `env/dev.env` | `env/dev.env.example` | `synkro-dev` |
| qa | `env/qa.env` | `env/qa.env.example` | `synkro-qa` |
| main | `env/main.env` | `env/main.env.example` | `synkro-main` |

Environment files may set only `COMPOSE_PROJECT_NAME` among `COMPOSE_*` controls. The wrapper selects files/profiles itself and disables inherited activation. Never publish expanded Compose configuration, Docker environment inspection, shell tracing or raw credential-bearing diagnostics.

### Database credentials

| Credential | Used by | Rights |
|---|---|---|
| `DB_ADMIN_USER` / protected `DB_ADMIN_PASSWORD_PATH` | PostgreSQL bootstrap; migration passwords derived in memory | Instance administration, never application runtime |
| `AUTH_APP_PASSWORD_PATH`, `CUSTOMERS_APP_PASSWORD_PATH`, `PRODUCTS_APP_PASSWORD_PATH`, `WORKFLOW_APP_PASSWORD_PATH` | Corresponding bootstrap/app wiring | One domain only; five distinct PostgreSQL password files including administrator |
| `MONGO_ADMIN_USER` / `MONGO_ADMIN_PASSWORD` | Mongo owner bootstrap and migration URI derivation | Mongo administration only |
| `SALES_APP_PASSWORD` / `SALES_APP_MONGODB_URI` | Mongo bootstrap / Sales API | `sales_app` authenticated in `admin`, accessing `sales` only |

PostgreSQL files use absolute paths and owner-only permissions (0600 on POSIX; restricted Windows ACL). The bootstrap administrator file is UTF-8/LF. The published Mongo owner still consumes a protected environment file and creates protected runtime material; it does not acquire a universal `*_FILE` interface by documentation. Keep secrets outside every repository and every repository-root mount, especially the released Sales runner's read-only root mount (owner issue #17).

### Variables per service

| Service | Variables |
|---|---|
| Auth | `SPRING_DATASOURCE_URL` (root maps `AUTH_DATABASE_URL`), `SPRING_DATASOURCE_USERNAME=auth_app`; **exactly one** of `SPRING_DATASOURCE_PASSWORD` / `SPRING_DATASOURCE_PASSWORD_FILE`. Auth alone mounts the signing private key. Initialization uses the same datasource but no JWT key. |
| Customers API | Root maps `CUSTOMERS_DATABASE_URL` and independent password/public-key mounts; configured file takes precedence over inline value and invalid/empty file fails without fallback. Optional owner `deploy/compose.secrets.yml` uses `CUSTOMERS_APP_PASSWORD_FILE` and `JWT_PUBLIC_KEY_HOST_FILE` host paths. |
| Products API | `DATABASE_URL` for `products_app`; exactly one of `JWT_PUBLIC_KEY` / `JWT_PUBLIC_KEY_FILE`. Released Compose consumes inline `JWT_PUBLIC_KEY`; the root checks that it matches `JWT_PUBLIC_KEY_PATH` and is public. |
| Sales API | Runtime reads `MONGODB_URI`, requires `sales_app` and `/sales`; root overrides it from `SALES_APP_MONGODB_URI`. Exactly one JWT key source; override clears inline key and mounts `JWT_PUBLIC_KEY_FILE`. `MONGODB_TIMEOUT=5s` (positive, at most 10s), `MONGODB_MAX_POOL_SIZE=10` (positive). |
| Workflow | `WORKFLOW_DATABASE_URL`, required `WORKFLOW_APP_PASSWORD_FILE`; public-key mount; `SERVICE_TOKEN_FILE` takes precedence when nonblank, otherwise `SERVICE_TOKEN`. `CUSTOMERS_BASE_URL`, `PRODUCTS_BASE_URL`, `SALES_BASE_URL` default to internal services; `WORKFLOW_EXECUTORS=4`, `WORKFLOW_QUEUE=64`, `WORKFLOW_SCAN_INTERVAL_MS=1000` and `WORKFLOW_RESPONSE_TIMEOUT_MS=1000`. No generic `HTTP_TIMEOUT`/`HTTP_ATTEMPTS` tuning contract is supplied. |
| Worker | `SERVICE_TOKEN` required; configuration reads `PRODUCTS_API_URL`, `LOW_STOCK_EVERY=15m`, `LOW_STOCK_THRESHOLD=5`, `BATCH_SIZE=100`, `RUN_TIMEOUT=2m`, `HTTP_TIMEOUT=5s`, `HTTP_ATTEMPTS=3`. The bounded run-loop/HTTP transport/gateway implementation promoted to `main` 2026-11-02 performs those actions; it uses validated run UUIDs, frozen opening intentions, pending reconciliation for valid RESOLVED replies and a total element budget shared across both phases. |
| Gateway | `CORS_ALLOWED_ORIGINS` and `RATE_LIMIT_PER_SECOND`; candidate example sets 20. Owner route configuration defines actual limits/upstreams, not the old illustrative value 10. |
| Host | `VITE_API_BASE_URL` and owner remote-entry URLs at build time; `VITE_DEV_SIGN_IN=false` in the candidate examples. Changing build variables requires rebuilding the selected Host/portal. |

**Runner differences:** Auth/Products/Workflow Flyway Compose consumes protected-process `FLYWAY_PASSWORD`, not a documented password-file precedence. Customers runner gives `FLYWAY_PASSWORD_FILE` precedence; the file must already be mounted, and an invalid file fails. Sales assembles `LIQUIBASE_COMMAND_URL` once from protected `MONGODB_URI`/database/options; its wrapper and mongosh read the environment, never a secret URI in arguments or Java properties. Preserve `authSource=admin` and `replicaSet=rs0` and URI-encode credential components. The root's administrator runner URI must never flow into Sales API.

**Bounds:** the candidate derives Flyway JDBC `connectTimeout=5&socketTimeout=60`; Customers runner enforces connect/login/socket maxima 5/10/60 seconds (URL may reduce them). Customers API specifies pool 10, acquire 5s, JDBC 3/5/10s, statement 5s, transaction 10s. Workflow actually configures pool 12, acquire 3s, validation 2s, JDBC connect/socket 3/10s; participant HTTP connect/request 2/3s and three application attempts. Auth's ordinary pool/statement policy is distinct from InitialAdminCli's separate connection (connect 10s, socket 60s, lock wait 10s). Timeouts bound individual waits, not a universal total execution deadline. Retry/full-jitter and Circuit Breaker discrepancies remain TD-015/016 under Accepted ADR-015.

### Development identity

The actual candidate command is `python scripts/synkro.py dev-identity dev`, not the former `dev-keys.sh`/`dev-token.sh` examples. It generates protected, ignored development RSA keys and fixed Workflow/Worker SERVICE tokens, refuses existing outputs, and rejects `qa`/`main` before reading configuration. It creates no human ADMIN and is not normal login. Provision production identity through Auth and the [initial administrator runbook](../13-operations/initial-administrator-initialization.md); distribute service tokens through protected environment configuration and track expiry manually.

---

## 7. Network Isolation

- Every container joins the `platform` network. Services and both database instances declare `expose`, never `ports`, so none of them is reachable from outside the network.
- Isolation limits exposure, but it is **not** what makes a request trustworthy. Every service validates the token itself, ignores any `X-User-*` header, and accepts internal calls only with a valid service token (ADR-006).
- If a domain service were published by mistake, it would still reject every request without a valid token. The mistake itself is caught in review: no `-api`, `-db`, `synkro-workflow` or `synkro-worker` compose file may contain `ports:`.

---

## 8. Observability

| Signal | How it is produced | Where it goes |
|---|---|---|
| Logs | Available owner JSON/request/job logs plus Auth creation audit; Customers API release explicitly lacks structured request/error correlation logs (owner #15) | Protected operator collection; no durable centralized log store is established |
| Metrics | Collector/Prometheus/Grafana configuration exists and author tests report healthy connectivity; complete service/database instrumentation is not established | Candidate Collector `0.123.0` → Prometheus `3.2.1` → Grafana `11.6.0` |
| Traces | `X-Correlation-Id` and error `traceId` support request correlation where implemented; this is not proof of W3C span propagation or an end-to-end trace | Service OTLP exporters/spans and durable trace storage remain unverified |

Candidate `compose.observability.yml` publishes Prometheus/Grafana on loopback 9090/3000 only; OTLP 4317/4318 remains internal. Grafana uses `GF_SECURITY_ADMIN_PASSWORD__FILE`; its bind-mounted file must be readable by UID 472 without exposing it to other users. File/config presence and healthy tools do not prove RED metrics, alerts, log retention, business effects or measured SLOs. [Observability](../13-operations/observability.md) separates the actual evidence from remaining work; TD-006 stays open.

---

## 9. How to Start Everything from Scratch

The [verification summary](../15-project-control/documentation-verification.md#four-story-delivery-and-acceptance--2026-11-04) identifies current main/develop verification selections and their dependency compatibility constraints. Equal repository trees do not satisfy an owner's explicit commit-identity requirement. A local main selection, a completed disposable acceptance and a live operator-review stack are distinct states; none establishes a hosted production deployment.

Follow [Local setup](../10-devops/local-setup.md) for access, exact checkout/lock selection and protected configuration. The operation forms below were recorded for PR #13's frozen snapshot; the current local-setup selection is the promoted November 2 root with its unchanged operation interface. Prepare and migrate both engines using section 5 **before** opening normal traffic.

```bash
# From the reviewed PR #13 checkout, after configuration and owner migrations:
python scripts/synkro.py up dev --mode postgres-migrations
python scripts/synkro.py privileges dev --mode postgres-migrations
# Run the protected Auth InitialAdminCli procedure before normal use.
python scripts/synkro.py up dev
python scripts/synkro.py status dev
curl --fail http://localhost:8000/health
python scripts/synkro.py down dev
```

`status` checks the selected engine, not every business endpoint. Gateway health proves the gateway endpoint only; Products `/health` is currently liveness only (TD-017). Check real Auth login through the Host/Gateway, domain authorization, migration histories, stock and sale effects separately. A Worker completion log alone does not prove alert effects; the existing exact-root five-step acceptance separately observed opening, resolution, restart/reopening and replay.

The candidate full startup builds the owners, excludes tooling runners from ordinary `up` and preserves volumes on `down`. It rejects volume-removal flags in every environment. On one shared `platform` network, stop one persistent environment before starting another. Never delete volumes or use broad Docker cleanup as an upgrade/recovery shortcut. For qa/main use their explicit environment and successful backup gates; configuration examples do not establish that a persistent qa/main environment was provisioned or accepted.

---

## Initial administrator creation after Auth migrations (ADR-014)

HU-AUTH-14 delivered the packaged `co.edu.corhuila.synkro.auth.app.InitialAdminCli` in Auth API `v2.0.0`. It runs as `auth_app` after Auth migrations and permission/audit checks, before normal traffic, using protected input and the separate Spring `PropertiesLauncher` entry point. It opens no HTTP listener or Spring service context and needs no signing key. Follow the [complete invocation, exit codes 0–5, audit checks and cleanup](../13-operations/initial-administrator-initialization.md).

Existing ADMIN, including inactive, yields a no-op. Initialization is not administrator recovery, not an infrastructure bootstrap/seed, and not a default-password mechanism. TD-009 remains pending. Auth owner CLI/container evidence is reported separately from root acceptance.

## 10. Simulated Services (`develop` only)

The inspected PR #13 composition selects real owner services for all four domains and Workflow; it silently omits none. No mock profile is the supported full-candidate path. A developer may use a separately declared contract test double for an isolated test, but must label its scope, revision and missing real effects.

| Element | Rule |
|---|---|
| What is simulated | Only an explicitly identified isolated test dependency; not the selected candidate participants |
| Source | Reviewed OpenAPI contract/test fixture |
| How it is reached | Test-owned network/resource, with no alias collision with a persistent platform |
| Where it is enabled | Explicit disposable test invocation; never implicit qa/main configuration |
| When it is removed | Before claiming real participant, browser or full-root acceptance |

Recorded real author runs and failed/unexecuted scenarios retain their exact roots in the release record. They cannot be collapsed into one all-green final-head run.

---

## Correlations

* Schema per domain and shared instance → ADR-009 (supersedes ADR-005 Decision 1); migrations → ADR-005 Decision 2
* Sales domain on MongoDB and infrastructure repository naming → ADR-010
* Instance bootstrap, service users and environment files → ADR-012
* Token validation and service tokens → ADR-006
* Error format, correlation, limits and retries → `05-architecture/cross-cutting.md`
* Workflow store and worker job → ADR-007
* Gateway and frontend technology → ADR-008
* Timeout and retry configuration → `05-architecture/pattern-guide.md` §5
* Data model per domain → `06-data/models.md`

## Four-story composition

The four-story application and Infra promotions are merged into QA/main. The active lock preserves exact immutable owner identities, including the Sales DB release required by Mongo recovery. The [verification summary](../15-project-control/documentation-verification.md#four-story-delivery-and-acceptance--2026-11-04) records executed roots, current main revisions and the distinction between isolated acceptance and provisioned production.

### Later feature-selection reconciliation — 2026-11-08

See the [current QA/main selection and review gates](../15-project-control/final-delivery-reconciliation-2026-11-08.md). Infra QA #53 preserves AUTH-17 and selects VEN-19 after the fresh joint 55-check supplement; main #54 remains an open dependent proposal. Existing v2.0.0 tags and earlier execution roots are unchanged. Use the exact selected lock; disposable fixtures/retired credentials do not supply a persistent deployment or operator handoff.
