# CI/CD Pipeline

> Designed, not yet configured. Every step below is already specified in
> `11-quality/testing-strategy.md`; this document only says when each step
> runs and what blocks a merge. Until a GitHub Actions workflow actually
> exists, every one of these checks is run manually, and the PR says so
> (`00-governance/definition-of-done.md`, Deployment section).

---

## Pipeline by repository type

This project has five kinds of repository, and each needs a different
pipeline — there is no one-size-fits-all "PR pipeline" (`testing-strategy.md`,
"CI pipeline per repository type").

### Domain services (`synkro-<domain>-api`, `synkro-workflow`, `synkro-worker`)

```yaml
jobs:
  unit-and-http-tests:
    steps:
      - run: mvn -B test        # Java
      # or: go test ./...       # Go

  integration-tests:
    services:
      postgres:
        image: postgres:16-alpine
    steps:
      - run: # apply the migrations of the matching -db repository to the CI instance
      - run: TEST_DATABASE_URL=… mvn -B test      # Java
      # or: TEST_DATABASE_URL=… go test ./...     # Go

  contract-tests:
    steps:
      - run: schemathesis run --validate-schema synkro-<domain>-api.yaml

  coverage-gate:
    steps:
      - run: # fail if global < 80% or domain < 90% (testing-strategy.md)
```

### Database repositories (`synkro-<domain>-db`)

```yaml
jobs:
  migration-rebuild:
    services:
      postgres:
        image: postgres:16-alpine
    steps:
      - run: flyway migrate          # build from V001
      - run: flyway undo -target=0   # rollback all U scripts
      - run: flyway migrate          # rebuild — must apply zero changes
      - run: flyway validate         # checksums match
```

### Gateway (`synkro-api-gateway`)

```yaml
jobs:
  smoke-test:
    steps:
      - run: nginx -t                                   # route config syntax
      - run: docker compose up -d synkro-api-gateway
      - run: curl -f http://localhost:8000/health
```

### Frontend (`synkro-front`, each portal)

```yaml
jobs:
  build-and-lint:
    steps:
      - run: npm ci
      - run: npm run lint
      - run: npm run build           # a portal that doesn't build is a broken portal
      - run: npm run test -- --coverage  # if unit tests exist
```

### Infrastructure (`synkro-infra`)

```yaml
jobs:
  compose-validate:
    steps:
      - run: docker compose config    # the composed file parses, every include resolves
```

---

## When each pipeline runs

| Trigger | What runs |
|---------|-----------|
| Every push to a `feat/`, `fix/` or `chore/` branch | The repository's own job set above (unit/HTTP tests always; integration and contract tests only where the repository has them) |
| PR opened or updated against `develop` | Same as above — this is the check that gates the merge (`00-governance/git-conventions.md`, "Approvals") |
| PR opened or updated against `qa` | The same job set, plus any contract test against the services already promoted to `qa` — not yet designed, because `qa` itself is not yet provisioned (`10-devops/environments.md`) |
| PR opened or updated against `main` | The same job set; merging also requires `ariel5253`'s approval, which no pipeline can substitute (`git-conventions.md`) |

There is no separate "deploy" job in this academic project: merging to
`develop`, `qa` or `main` does not trigger an automatic deployment to a
running environment, because none of the three environments is hosted
anywhere but a developer's or CI's own Docker Compose. "Deploying" to
`develop` means: the branch is up to date and `docker compose up` on it
produces a working system.

---

## What blocks a merge, once the pipeline exists

- Any job above fails (`00-governance/definition-of-done.md`, Integration section)
- Coverage below the thresholds in `testing-strategy.md`
- Fewer than 1 human approval (`git-conventions.md`)
- More than 400 lines of code, excluding tests (`git-conventions.md`, "Pull Request Policy")

**Until the pipeline exists**, the same list applies, verified manually
by the reviewer before approving — this is not optional just because
automation is missing.

---

## What this pipeline intentionally does NOT have

| Absent step | Why |
|---|---|
| SAST / dependency scanning as a blocking CI job | `govulncheck` (Go) and the OWASP dependency-check plugin (Java) are required before every release (`00-governance/security-rules.md`, A06), but not wired into a CI job yet — manual, before each release |
| A staging smoke-test job | `qa` is not provisioned (`10-devops/environments.md`) |
| Canary or blue-green deployment | No production environment with real users exists for this course project |
| A Docker image registry push | Each environment builds its images locally from the cloned repositories; no registry has been adopted |

---

## Correlations

- Full test tiers, tools and examples → `11-quality/testing-strategy.md`
- Environments this pipeline targets → `10-devops/environments.md`
- Branch and approval rules → `00-governance/git-conventions.md`
- Definition of Done (what "CI green" means until CI exists) → `00-governance/definition-of-done.md`
- Vulnerability scanning rule → `00-governance/security-rules.md`, A06
- Migration rebuild check detail → `05-architecture/decisions/records/ADR-005-data-isolation-per-domain.md`, Decision 2
