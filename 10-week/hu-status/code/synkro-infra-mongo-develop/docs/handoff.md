# HU-INF-04 integration and documentation handoff

This repository changes only synkro-infra-mongo. The original 2026-10-11 handoff
and central-documentation proposal below record that delivery's external gates;
the README records subsequent acceptance/promotion. This corrective follow-up
does not change sibling repositories or perform a PR, merge, promotion or issue update.
See [current boundary verification](domain-boundary-verification.md).

## Sales dependency resolved

[HU-VEN-16 #237](https://github.com/code-corhuila/synkro-docs/issues/237) delivered
the correction in [Sales PR #5](https://github.com/code-corhuila/synkro-sales-db/pull/5).
Use exactly **9cfbde7db4bea7bacad70370c60f91f8eb917c04**. AsolanoT approved the PR;
the merge revision's check-common-files and migration-rebuild both finished successfully.
The former ffdc24b9 credential blocker is historical.

The supported deploy/migrate.sh consumes LIQUIBASE_COMMAND_URL as one environment
connection for Liquibase and both guards. Infrastructure builds the owner's unchanged
Dockerfile, mounts the clean checkout read-only and invokes its normal entrypoint.
Docker receives inherited environment names, never literal credential assignments.
No domain DDL/DCL or historical changesets are copied, edited or executed outside
the supported runner. Owner guards/checksum checks remain active; infrastructure
instances never enable failpoints or test commands.

Migrations use the administrator at synkro-mongo:27017, database sales, replicaSet=rs0
and **authSource=admin**, with one shared URI and bounded connection timeouts.
The application user **sales_app authenticates in admin**, with exactly
sales_writer@sales granting find/insert/update on sales.sale; remove is denied.
Passwords are protected data; URI components are percent-encoded without shell
evaluation. Administrators never perform application requests.

## Recovery contract

The backup archive covers selected-database data/collection metadata, including
Liquibase history. Users, roles, authentication databases and the internal key are
excluded. Restoring history alone cannot recreate roles.

The disposable Sales sequence is fresh bootstrap with independent credentials/key →
supported Sales migrations → exact owned-resource and generic empty-namespace checks →
supported runner status (up to date) and zero-change update/checksum validation → restore
**only sales.sale documents**, retaining target options/indexes, users, roles and
new history → compare application data/collection metadata and target user snapshots → zero-change
replay and application permission tests → unchanged-source check.
No broad drop, manual roles or fabricated history.
The owner runner exclusively validates domain schema and migration state. Probes
receive no Sales checkout and never read ledger collections, migration families,
IDs or checksums. Initial applied counts come from the CLI summary; no fixed total
is asserted. Collection existence/emptiness is generic restore safety, not a Sales
migration-baseline assertion. An up-to-date status is required before update so
restoration cannot silently migrate an incomplete target.

The restore-sales-disposable command requires the run manifest and exact clean
Sales checkout. It refuses persistent, foreign/replaced, unmigrated and nonempty
targets. Persistent disaster recovery needs separate owner/operator review,
controlled downtime and explicit target/migration compatibility.

## Original 2026-10-11 synkro-docs proposal (historical)

Inspected remote main: 61056c93e6e0783a9199bf56778e9494739bc458.
Also inspected the user's current documentation tree at
4cef4dcb96d09a33347898839465cb83e51bd770 without changes. Deployment §6's
Sales example **still lacks authSource=admin** in both inspected states.
Confirm the target branch again before editing. Accepted ADR-010/012 stay immutable.

Separate branch: docs/hu-inf-04-mongodb-operations.
Proposed commit: docs(infra): document MongoDB operations and verified Sales recovery.

| Exact document | Concrete sections/change |
|---|---|
| 05-architecture/deployment.md | §3: explicit include/environment/secret paths; full composition stays in infra-postgres. §4: authenticated create-only bootstrap, users in admin and PRIMARY health. §5: merged Sales SHA, secret delivery and archive/restore namespace distinction. §6: Sales options replicaSet=rs0&authSource=admin, encoded credentials as data. §9: prepare/start/health/migrate/stop/restart without removing volumes. |
| 10-devops/environments.md | Distinct dev/qa/main projects/volumes, protected literal settings, stable key, no implicit .env; sequential shared-platform operation. |
| 10-devops/local-setup.md | Node 22/Linux full-suite prerequisites, clean pinned Sales checkout, authenticated readiness, operations and mismatch/timeout diagnostics. |
| 06-data/models.md | Principle 6: infrastructure creates users in admin without roles; Sales owns schema/roles/grant/history. Link permission/recovery evidence; no domain-rule change. |
| 00-governance/security-rules.md | A05/A07: no secrets in arguments, rendered output or diagnostics; protected files/inherited environment names, administrator-only migrations. |
| 11-quality/testing-strategy.md | Real named-volume infrastructure and Sales integration/recovery, both mandatory and unskipped; source/target independence and manifest cleanup. No RTO/RPO claim. |
| 11-quality/tdd-guide.md | Link test-first commit 7f5f0a5 and red/green evidence; real assertions use owner migrations. |
| 04-requirements/traceability-matrix.md | Add mappings below and inverse HU-INF-04 → #236 row; link HU-VEN-16 #237 and reviewed merge. Keep HU in progress until infrastructure CI, documentation and peer review pass. |

## NFR → HU → tests → implementation

All rows trace to HU-INF-04 / #236. Evidence: docs/verification.md.

| NFR | Tests | Implementation/boundary |
|---|---|---|
| NFR-004 Security | CONF-02/03/05/07/08/09/10; authentication/mismatch/exposure in tests/integration.mjs; SALES-01/03/07 in sales-integration.mjs and sales-probe.js | Protected secrets/bootstrap/health; scripts/sales.mjs inherited credentials, process/log checks and bounded failures; exact grant/denied operations. |
| NFR-007 Portability | CONF-01/04; real DNS/PRIMARY, named volumes and SALES-02/04/05/06 | Fixed Mongo image, explicit environments; unchanged Sales versions, exact SHA, Linux Node 22 and independent targets. |
| NFR-009 Integrity | Exact user/configuration/fixture snapshots; SALES-02/03/04/05/06 | Bootstrap/lifecycle preservation; Sales validator/indexes and no-remove boundary; restore retains target authentication/history and source state. |
| Supporting NFR-002 | Step-down/deadline/drift/failed-start checks; SALES-07 | Authenticated PRIMARY, bounded initialization/health/migrations and nonzero safe errors. |
| Supporting NFR-008 | Generic restore and SALES-06 | Isolated data/BSON/metadata/permission recovery; no production RTO/RPO claim. |
| Cleanup safety | CONF-06/10; real manifests and replaced-target refusal in SALES-06 | Exact IDs/labels/volume creation times before removal; shared platform and persistent resources excluded. |
| Domain ownership / NFR-007, NFR-009 | BOUNDARY-01/02/03 plus real SALES-02/05/06 | Probes have no domain checkout or ledger access; variable public CLI counts; owner status/update validation; generic empty-namespace safety. |

## External gates for this correction

Verify infrastructure remote CI at the final pushed SHA and obtain another team
member's review of the boundary correction. Confirm any central documentation
describing ledger snapshots is aligned in its owning repository. Promotion is separate
and uses cherry-pick -x; main requires ariel5253 approval. Local implementation readiness
never closes either issue or completes the HU alone.
