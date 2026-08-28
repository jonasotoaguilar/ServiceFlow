# Audit Closeout Verification Specification

## Purpose

Verify successor `audit-ui-ux-remediation-closeout` against frozen predecessor evidence. Delivery `auto-chain` and the 800-line budget MUST NOT become verification authority. Spec MUST NOT acquire runtime attempt authority.

## Requirements

### Requirement: Bound Baseline and Frozen Predecessor

All later verification MUST bind to candidate tree `38640512f6119e4edde346158797be61dd62fff6`. Predecessor `audit-ui-ux-remediation` MUST remain `blocked`. The successor MUST NOT archive, edit, settle, reset, finish, or mutate the predecessor staged index. Historical attempt `sha256:8e2c0ab0c41ed635faf5caa1cb54e910415d9d52707121f1a2d999e85e25d890` MUST remain context only. Planning phases MUST NOT acquire runtime attempt authority.

#### Scenario: Baseline identity held through planning

- GIVEN current `git write-tree` equals `38640512f6119e4edde346158797be61dd62fff6`
- WHEN spec, design, or tasks complete
- THEN the index tree hash MUST remain that baseline
- AND `git diff -- openspec/changes/audit-ui-ux-remediation` MUST be empty

### Requirement: Independent Verify Then Conditional Remediation

Under successor attempt authority acquired only immediately before runtime-bearing verify or apply, the campaign MUST run independent `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run build`, and `pnpm check`, plus authenticated verify-ui inside sdd-verify. Live PocketBase MUST be 0.40.1. Remediation MUST apply only to findings with `remediation_required` reproduced in this successor campaign. Auto-chain of 800-line slices MUST NOT authorize verify or archive. Archive MUST wait until complete passing evidence.

#### Scenario: Fresh verification against live 0.40.1

- GIVEN successor attempt authority is acquired immediately before sdd-verify
- AND PocketBase 0.40.1 is the live backend
- WHEN independent tests, typecheck, build, check, and authenticated verify-ui run
- THEN evidence MUST bind to the baseline tree
- AND mocked-only green tests MUST NOT substitute for live verification

#### Scenario: Conditional remediation only

- GIVEN a predecessor finding is not reproduced as `remediation_required`
- WHEN closeout apply is considered
- THEN that finding MUST NOT be remade
- AND only newly reproduced `remediation_required` findings MAY be fixed under later apply authority

### Requirement: Authenticated verify-ui Matrix and Secrecy

verify-ui MUST cover changed authenticated surfaces at desktop 1280×800 and mobile 390×844, light and dark, and states normal, empty, validation, dialog, error, and menu. Auth MUST use parent-provided state only. Screenshots and credentials MUST stay private (`0700`/`0600`) and MUST be deleted unless the parent retains them. SEO/metrics MUST be `not_applicable` for authenticated routes. App, browser, or auth unavailability MUST be `unavailable` or `blocked`, never pass.

#### Scenario: Mobile 390px overflow

- GIVEN authenticated `/dashboard` or `/registro` at 390×844
- WHEN verify-ui inspects screenshots and overflow eval
- THEN any action or row overflowing the viewport MUST be `remediation_required`
- AND pass MUST require actions visible without off-screen clipping

#### Scenario: English user-facing residuals

- GIVEN authenticated Spanish product UI
- WHEN verify-ui inspects visible copy on changed routes
- THEN English user-facing residuals MUST be `remediation_required`
- AND internal identifiers alone MUST NOT fail the campaign

#### Scenario: Inability to access authenticated UI

- GIVEN parent auth state is missing or login cannot reach `/dashboard`, `/locations`, or `/registro`
- WHEN verify-ui starts
- THEN the campaign MUST be `unavailable` or `blocked`
- AND MUST NOT be recorded as pass
