# Deployment Environments

> Defines the system's environments, their purposes, access, and key
> configurations. This project has **three** environments, matching the
> three permanent Git branches (`00-governance/git-conventions.md`) — there
> is no separate "dev" environment distinct from "Local", because every
> environment in this academic project runs on the same shared-instance
> Docker Compose topology (ADR-009), just pointed at a different branch
> and a different set of secrets.

---

## Project environments

| Environment | Branch | Purpose | Access | Database | Status |
|-------------|--------|---------|--------|----------|--------|
| **Local** | each developer's `feat/*`, `fix/*` or `chore/*` branch | Individual development | The developer, on their own machine | Their own `synkro-db` instance, started by `synkro-infra` | ✅ Active |
| **Development** | `develop` | Team continuous integration — every merged PR lands here | Entire team | A shared `synkro-db` instance for the `develop` environment | ✅ Active |
| **Staging (qa)** | `qa` | Pre-production validation before a release reaches `main` | Team + Product Owner | A separate `synkro-db` instance for `qa` | 🔴 **Planned** — pending a decision based on progress during the second half of the semester (`01-context/scope.md`); tracked as `15-project-control/open-questions.md` Q-004 |
| **Production (main)** | `main` | The academic project's "production" — no real end users | Team + Product Owner | A separate `synkro-db` instance for `main` | ✅ Active (academic project, no real end users) |

**What does NOT exist:** a `dev.api.domain.com`-style public URL for any
environment, a secrets vault, Redis, or a Kubernetes cluster. The three
environments run as Docker Compose stacks (`05-architecture/deployment.md`),
reachable only on the machine or CI runner where they are started.

---

## Environment variables per environment

`synkro-infra/env/` holds one example file per environment —
`.env.develop.example`, `.env.qa.example`, `.env.main.example` — with
variable names and placeholders, never real values. The real `.env` is
created from the matching example and is **never committed**
(`05-architecture/deployment.md` §6).

### Naming convention

Variables are named per their consuming service, not with a generic
prefix (there is no `APP_[SERVICE]_[VARIABLE]` scheme in this project):

```
<DOMAIN>_DB_USER / <DOMAIN>_DB_PASSWORD        — owner credentials, migration runner
<DOMAIN>_APP_USER / <DOMAIN>_APP_PASSWORD      — service credentials, runtime connection
JWT_PUBLIC_KEY                                 — every validating service
SERVICE_TOKEN                                  — synkro-workflow, synkro-worker (one each)
```

See the full variable table per service: `05-architecture/deployment.md` §6.

### Where secrets live, per environment

| Environment | Where the real values come from |
|-------------|----------------------------------|
| Local | `.env`, created from `.env.develop.example`; generated locally by `./scripts/dev-keys.sh` for the JWT key pair and service tokens |
| Development | The same `.env.develop.example` convention, with values agreed by the team — not committed |
| Staging (qa) | Not yet provisioned (see the table above) |
| Production (main) | Issued by `synkro-auth-api` once it runs there; stored as CI/CD secrets, never in a repository |

---

## CI/CD Pipeline

See `10-devops/ci-cd.md` for the pipeline steps per repository type. No
pipeline is configured today — until it exists, every check in this
document is run manually, and the Definition of Done says so explicitly
(`00-governance/definition-of-done.md`).

---

## Correlations

- Full deployment topology and composition → `05-architecture/deployment.md`
- How to start the Local environment → `10-devops/local-setup.md`
- CI/CD pipeline design → `10-devops/ci-cd.md`
- Branch strategy these environments mirror → `00-governance/git-conventions.md`
- The `qa` environment decision → `15-project-control/open-questions.md` Q-004
- Secret management rules → `00-governance/security-policy.md`
