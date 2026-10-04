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
| Docker Compose | 2.20+ | `docker compose version` |
| Git | 2.40+ | `git --version` |
| JDK | 21 | `java --version` |
| Maven | 3.9+ | `mvn --version` |
| Go | the release pinned in `go.mod` | `go version` |

You need the JDK/Maven pair only if you are working on a Java service
(`synkro-auth-api`, `synkro-customers-api`, `synkro-workflow`); you need Go
only for a Go service (`synkro-products-api`, `synkro-sales-api`,
`synkro-worker`). Docker is required either way, to run the shared
PostgreSQL instance and the services you are not actively developing.

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
| 8080 | Every `-api`, `synkro-workflow`, each portal | No — reachable only inside the `platform` Docker network |
| 5432 | `synkro-db` (shared PostgreSQL instance) | No |

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

### Step 1 — Clone every repository as a sibling of `synkro-infra`

```bash
mkdir synkrotech && cd synkrotech
git clone https://github.com/code-corhuila/synkro-infra.git
git clone https://github.com/code-corhuila/synkro-auth-api.git
git clone https://github.com/code-corhuila/synkro-auth-db.git
git clone https://github.com/code-corhuila/synkro-customers-api.git
git clone https://github.com/code-corhuila/synkro-customers-db.git
git clone https://github.com/code-corhuila/synkro-products-api.git
git clone https://github.com/code-corhuila/synkro-products-db.git
git clone https://github.com/code-corhuila/synkro-sales-api.git
git clone https://github.com/code-corhuila/synkro-sales-db.git
git clone https://github.com/code-corhuila/synkro-workflow.git
git clone https://github.com/code-corhuila/synkro-worker.git
git clone https://github.com/code-corhuila/synkro-api-gateway.git
git clone https://github.com/code-corhuila/synkro-front.git
# ... each synkro-<domain>-portal, the same way
```

You only strictly need `synkro-infra` plus the repositories of the
service(s) you are working on — `synkro-infra` can start every other
service's published image or a stub if you do not have its source, but
for day-to-day work, cloning everything once is simpler than tracking
what is missing.

### Step 2 — Environment variables

```bash
cd synkro-infra
cp env/.env.develop.example .env
```

Open `.env` and set every `*_DB_PASSWORD` and `*_APP_PASSWORD` (one pair
per domain, plus `workflow`) and `DB_ADMIN_PASSWORD`. For local
development any non-empty value works — these are never the real
secrets used in `qa` or `main` (`00-governance/security-policy.md`,
Secret Management).

```bash
# develop only: generates the RSA key pair, JWT_PUBLIC_KEY,
# and the service tokens for synkro-workflow and synkro-worker
./scripts/dev-keys.sh
```

### Step 3 — Start the platform

```bash
./scripts/up.sh
```

This script checks `.env`, creates the `platform` Docker network and
starts every service declared across the `include:` list of
`synkro-infra/compose.yml` — including the shared PostgreSQL instance
(`synkro-db`). It does **not** migrate any schema yet.

```bash
docker compose ps   # every container should be "healthy" or "running"
```

### Step 4 — Migrate each schema

Every domain's `-db` repository owns its own Flyway migrations
(ADR-005 Decision 2); none of them run automatically on startup.

```bash
for schema in auth customers products sales; do
  docker compose --env-file .env run --rm "$schema-db-migrate"
done
docker compose --env-file .env run --rm workflow-db-migrate
```

Until a schema is migrated, that domain's API answers
`500 INTERNAL_ERROR` on any request that touches its database — this is
expected, not a bug, if you skip this step.

### Step 5 — Verify

```bash
curl http://localhost:8000/health

curl -H "Authorization: Bearer $(./scripts/dev-token.sh alice)" \
     http://localhost:8000/api/v1/customers

docker compose logs synkro-worker   # one entry per low-stock run, every 15 minutes
```

Open `http://localhost:3000` for Grafana and `http://localhost:5173`
for the frontend.

---

## Working on a single service

You do not need every repository running to work on one service. Start
`synkro-infra` (for the shared database and the network) plus the
service you are changing, and run the rest with Docker if you need to
exercise an end-to-end flow:

```bash
# Example: working on synkro-products-api outside its container,
# against the already-running shared instance
cd synkro-products-api
go run ./cmd/products-api
```

See your stack's own "Project commands" table for the exact run, test
and build commands: `_stacks/go.md` or `_stacks/java-spring.md`.

---

## Daily workflow

```bash
# At the start of the day, in each repository you are working on
git pull origin develop

# If a -db repository you depend on has new migrations
docker compose --env-file .env run --rm <schema>-db-migrate

# Work using TDD (see 11-quality/tdd-guide.md)
# ...

# At the end
git add <specific files>
git commit -m "feat(scope): description"
git push origin feat/your-branch-name
```

---

## Common issues

### "Port already in use"

```bash
lsof -i :8000              # macOS/Linux
netstat -ano | findstr :8000   # Windows
kill -9 <PID>               # macOS/Linux
taskkill /PID <PID> /F      # Windows
```

### "Docker containers not starting"

```bash
docker compose logs <service-name>
docker compose down -v   # deletes volumes — you will need to re-migrate
./scripts/up.sh
```

### "`synkro-db` healthy but a service answers 500 on every request"

The service's schema has not been migrated yet. Run the migration runner
for that domain (Step 4 above).

### "401 on every request, even with a token"

In `develop`, tokens are signed with the key pair `./scripts/dev-keys.sh`
generated. If you re-ran that script, every previously issued token is
now invalid — get a new one with `./scripts/dev-token.sh <subject>`.

### "A service I need isn't cloned"

`synkro-infra`'s `include:` list fails loudly if a sibling repository is
missing (`05-architecture/deployment.md` §3) — clone it, or comment out
that line temporarily if you genuinely do not need that service for your
current task.

---

## Correlations

- Full deployment topology, ports and the composition rule → `05-architecture/deployment.md`
- Environment variables per service → `05-architecture/deployment.md` §6
- The 3 project environments → `10-devops/environments.md`
- CI/CD pipeline (once it exists) → `10-devops/ci-cd.md`
- Per-stack commands and folder layout → `_stacks/go.md`, `_stacks/java-spring.md`
- Production troubleshooting (once services are deployed) → `13-operations/incident-management.md`
