# Appwrite Permission Migration Specification

## Purpose

Defines the migration that strips collection permissions on the development Appwrite database: dry-run by default, explicit guarded `--apply`, and fail-closed refusal when the target is not the isolated development environment. This migration MUST NEVER target production.

## Requirements

### Requirement: Dry-run by default

The migration MUST run in dry-run mode by default and MUST NOT modify any environment. It MUST print the per-collection plan.

#### Scenario: Dry-run on development environment

- GIVEN the migration invoked without the apply flag
- WHEN it analyzes collections
- THEN it prints the per-collection plan and no environment is modified

#### Scenario: No collections

- GIVEN a development database with no collections
- WHEN dry-run runs
- THEN the plan is empty and the run exits successfully

### Requirement: Fail-closed environment identity

The migration MUST verify the target identity on every invocation. If the endpoint or project identifier is missing, not on the development allowlist, or mismatched with it, the run MUST abort with an error and MUST NOT modify any environment.

#### Scenario: Production endpoint refused

- GIVEN a target endpoint not on the development allowlist
- WHEN the migration runs
- THEN it aborts with an error and no environment is modified

#### Scenario: Missing identity

- GIVEN the endpoint or project identifier is unset
- WHEN the migration runs
- THEN it aborts with an error and no environment is modified

#### Scenario: Mismatched project identity

- GIVEN an allowed endpoint but a project identifier outside the development allowlist
- WHEN the migration runs
- THEN it aborts with an error and no environment is modified

### Requirement: Guarded apply

The migration MUST NOT modify any environment unless the apply flag AND an explicit confirmation flag are both provided. Before applying, it MUST print the per-collection plan.

#### Scenario: Apply without confirmation

- GIVEN the apply flag but no confirmation flag
- WHEN the migration starts
- THEN it aborts and no environment is modified

#### Scenario: Confirmed apply on development environment

- GIVEN a matching development identity and both flags
- WHEN the migration applies
- THEN each collection's permissions are stripped and the applied plan is reported

### Requirement: Permission stripping

Applying the migration MUST remove all role-based read, write, update, and delete permissions from every collection in the target database, leaving empty permission lists.

#### Scenario: All collections stripped

- GIVEN a development database with world-writable collections
- WHEN the confirmed migration applies
- THEN no collection retains any role-based permission
