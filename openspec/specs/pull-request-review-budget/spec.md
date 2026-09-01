# Pull Request Review Budget Specification

## Purpose

Install canonical PR validation at the existing 800-line default. Delivery `auto-chain` may split authored work; it MUST NOT grant verify or archive authority.

## Requirements

### Requirement: Canonical pr-check Asset at 800

The repository MUST add `.github/workflows/pr-check.yml` by copying the current `ci-cd-and-automation` asset `assets/workflows/pr-check.yml` verbatim. Installed bytes MUST keep `DEFAULT_LIMIT = 800`. Apply MUST NOT perform a 400→800 edit unless the live asset at apply time differs. Existing `ci.yml` and `release.yml` MUST remain unmodified. Global `openspec/config.yaml` MUST NOT change for this budget. No second pipeline MAY be invented.

#### Scenario: Verbatim install with existing 800 default

- GIVEN the canonical asset already sets `DEFAULT_LIMIT = 800`
- WHEN apply installs `pr-check.yml`
- THEN the installed workflow MUST match the asset bytes
- AND MUST NOT contain a 400→800 substitution

### Requirement: Preserved Size, Issue, Label, Privilege, and Concurrency Gates

`check-pr-size` MUST compute `additions + deletions` against the active limit. Exactly one valid `size:<N>` label MUST override `DEFAULT_LIMIT`; multiple numeric size labels MUST fail. `size:exception` MUST allow an oversized PR with a warning only. Tracker/main PRs MUST require `Closes`/`Fixes`/`Resolves #N`; chain children MAY use `Related to`/`Refs`/`Linked issue #N`. Linked issues MUST have `status:approved`. The PR MUST have exactly one `type:*` label. Permissions MUST stay read-only (`contents`, `issues`, `pull-requests`). Concurrency MUST group by PR number and cancel in-progress runs.

#### Scenario: PR exceeds 800 without override or exception

- GIVEN a PR with more than 800 authored changed lines
- AND no numeric `size:*` label and no `size:exception`
- WHEN `check-pr-size` runs
- THEN the job MUST fail
- AND MUST instruct split or auto-chain delivery, not verify/archive authority

#### Scenario: Size exception warns but does not fail

- GIVEN a PR exceeding the active limit
- AND `size:exception` is present
- WHEN `check-pr-size` runs
- THEN the job MUST pass with a warning

#### Scenario: Missing issue approval or type label

- GIVEN the PR body references an issue without `status:approved`
- OR the PR has zero or more than one `type:*` label
- WHEN the corresponding pr-check job runs
- THEN that job MUST fail

### Requirement: Auto-Chain Is Delivery Only

The authored-line review budget MUST remain 800. Strategy `auto-chain` MAY slice implementation PRs when forecast exceeds 800. Auto-chain MUST NOT authorize sdd-verify, archive, or attempt acquisition.

#### Scenario: Oversized closeout uses auto-chain only for delivery

- GIVEN planned authored changes may exceed 800
- WHEN tasks or apply plan delivery
- THEN work MUST be auto-chained into reviewable slices
- AND verification and archive MUST still require complete passing evidence
