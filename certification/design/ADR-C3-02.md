# ADR-C3-02: Describe and deploy the Huawei Cloud infrastructure with RFS Terraform templates

## Status

Proposed

## Context

10-devops/ci-cd.md states that no complete hosted automatic deployment exists: CI builds and tests, but environments are started by hand with Docker Compose and the operations script. Section 5 of the design note needs stages for qa, production and rollback that are repeatable and traceable. Chapter 12 shows that Resource Formation Service (RFS) applies Terraform templates as a final-state engine.

## Decision

Describe the VPC, subnets, security groups, CCE cluster, RDS, DDS, ELB, WAF and OBS resources in a Terraform template stored in the synkro-infra-postgres repository, and apply it through an RFS stack for each environment. Variables select the environment, and image tags are passed as parameters. The CodeArts pipeline updates the stack on merge to qa and on an approved release tag for production. Rollback applies the previous template version and the previous image tag.

## Alternatives considered

- Manual creation in the Huawei Cloud console: rejected because it is not repeatable, leaves no audit trail and makes qa and production drift apart.
- Shell scripts with the KooCLI command line tool: rejected because scripts are step-based, do not compare the desired state with the real state and need manual error handling.
- Keep Docker Compose on a single virtual machine: rejected because it gives no high availability across AZs and cannot express the scaling rules of section 3.

## Consequences

- Positive: every environment is created from the same file, changes are reviewed in pull requests and a stack version links each deploy to a commit.
- Positive: rollback and a rebuilt environment are the same operation, which reduces human error.
- Negative: the team must learn HCL and maintain the template, and the file does not exist yet, so the first run needs extra time.
- Negative: RFS does not roll back data, so database changes still depend on forward migrations and verified backups.