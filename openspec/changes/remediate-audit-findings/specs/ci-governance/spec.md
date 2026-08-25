# CI Governance Specification

## Purpose

Defines repository governance: CI pipeline, PR gates, dependency automation, code ownership, pre-commit hooks, single package manager, and removal of hygiene leftovers.

## Requirements

### Requirement: CI pipeline on PRs and pushes

The repository MUST run lint, typecheck, and the test suite on every pull request and default-branch push, and the pipeline MUST gate merging.

#### Scenario: PR checks pass

- GIVEN a pull request whose lint, typecheck, and tests pass
- WHEN CI completes
- THEN the pull request is mergeable

#### Scenario: Failing check blocks merge

- GIVEN a pull request where tests fail
- WHEN CI completes
- THEN the pull request is not mergeable until the failure is fixed

### Requirement: PR size gate

Pull requests MUST be subject to a size guard consistent with the 400-line review budget; oversized pull requests MUST be flagged for review.

#### Scenario: Oversized PR flagged

- GIVEN a pull request exceeding the line budget
- WHEN the size check runs
- THEN the pull request is flagged and requires an explicit size exception

### Requirement: Dependency automation

Automated dependency updates, such as dependabot, MUST be enabled for the repository.

#### Scenario: Update PR opened

- GIVEN a published dependency update
- WHEN the automation detects it
- THEN an update pull request is created

### Requirement: Code ownership

The repository MUST require review from the owning team, including for security-sensitive paths, as expressed through a CODEOWNERS file.

#### Scenario: Sensitive path requires owner review

- GIVEN a pull request modifying security-sensitive files
- WHEN the ownership check runs
- THEN an owning-team review is required before merge

### Requirement: Pre-commit hooks

Commits MUST pass pre-commit checks that lint staged changes.

#### Scenario: Lint error blocks commit

- GIVEN a staged change with a lint error
- WHEN the developer commits
- THEN the commit is blocked until the error is fixed

#### Scenario: Clean commit passes

- GIVEN staged changes that pass lint
- WHEN the developer commits
- THEN the commit succeeds

### Requirement: Single package manager

The repository MUST use pnpm exclusively. The npm lockfile MUST NOT be tracked, and the legacy `appwrite@22` dependency MUST be removed.

#### Scenario: Lockfile audit

- GIVEN the repository root
- WHEN tracked lockfiles are listed
- THEN only the pnpm lockfile exists

#### Scenario: Dependency audit

- GIVEN the package manifest
- WHEN dependencies are inspected
- THEN `node-appwrite@14` is present and `appwrite@22` is absent

### Requirement: Repository hygiene

Debug leftovers and generated artifacts MUST NOT be tracked: no stray debug scripts at the root, no lint output files, and no legacy mockup directory.

#### Scenario: Clean tree audit

- GIVEN the repository root
- WHEN tracked files are audited
- THEN no debug leftovers, lint outputs, or legacy design mockups are tracked
