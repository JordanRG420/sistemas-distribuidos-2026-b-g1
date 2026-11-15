# ADR-C3-01: Use RDS for PostgreSQL with a synchronous cross-AZ standby for synkro-db

## Status

Proposed

## Context

synkro-db holds the auth, customers, products and workflow schemas, so it is the most critical store of Synkro. The team already records it as a single point of failure (AT-002 in 05-architecture/overview.md), and 13-operations/backup-and-recovery.md states that no RTO, RPO or restore rehearsal exists. Section 4 of the design note sets a target of RTO 5 minutes and RPO 0 minutes for this store.

## Decision

Replace the self-managed PostgreSQL container with an RDS for PostgreSQL primary and standby instance pair in two availability zones, using synchronous replication and automatic failover. Keep the four schemas and their per-domain users unchanged, and keep the owner migration runners as the only way to change schemas. Add nightly backups copied to OBS for logical corruption. This is DR pattern 4 of chapter 11, on-cloud intra-region active-active.

## Alternatives considered

- Cold standby with daily backups restored on demand: rejected because a daily backup gives an RPO of up to 24 hours, far above the 0-minute target, and the restore time would exceed the 5-minute RTO.
- Cross-region replication with DRS (two-city three-center): rejected for the MVP because it adds a second region and a permanent standby cost that the project budget does not justify, and the system has no stated regional-disaster requirement.
- Keep the self-managed container on a single ECS: rejected because it keeps the single point of failure and leaves failover, patching and backups as manual work.

## Consequences

- Positive: RPO is zero and failover is automatic, so an AZ failure does not lose committed sagas or sales reservations.
- Positive: backups, patching and monitoring become managed features, which closes AT-002.
- Negative: the standby roughly doubles the database cost, and synchronous replication adds a small write latency.
- Negative: a regional disaster is still not covered, so that risk stays accepted and must be revisited if the business requires it.