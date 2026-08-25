# Exploration: Remediate Audit Findings

**Change**: `remediate-audit-findings`
**Date**: 2026-08-13
**Explorer**: sdd-explore sub-agent (openai-compatible model)

## Current State

ServiceFlow is a Next.js 16 (App Router) + React 19 + TypeScript 5.9 (strict) service-lifecycle app backed by Appwrite (node-appwrite 14), pnpm 11 workspace, Vitest 4 (17 tests passing, verified `pnpm test:run`). All data access runs server-side through the **admin SDK** (server actions in `app/actions/*` and one REST route `app/api/services/route.ts`); tenant isolation is app-level via `getAuthUser()` session + `userId` query filters. There is no client-side Appwrite SDK usage and no `/api/proxy` callers in app code.

The audit evidence lives in the **dirty worktree on branch `docs/project-audit-hardening`**, which is currently at `main` (3679f59) — every hardening artifact is uncommitted (36 changed/untracked entries). OpenSpec is initialized (`openspec/config.yaml`) with an empty change store; this is the first change.

## Derived Audit Findings

| ID | Severity     | Finding                                                                                                                                                                                          | Worktree evidence                                                                                                                                                                                                  | Status                                              |
| -- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| F1 | **Critical** | Appwrite collections created world-writable (`Permission.read/write/update/delete(Role.any())`) — any anonymous caller could read/mutate all documents                                           | `scripts/setup-appwrite.ts` (HEAD: `Role.any()` perms; worktree: `[]`), new `scripts/migrate-appwrite-permissions.ts` (dry-run default, `--apply` to execute), new `tests/permissions.test.ts` (12 tests, passing) | Remediation drafted, NOT applied to any environment |
| F2 | **High**     | `proxy.ts` rewrites `/api/proxy/*` → Appwrite endpoint with no auth gate; zero callers in app code (dead code that bypasses the BFF/admin-SDK-only boundary if ever hit)                         | `proxy.ts` tracked, untouched                                                                                                                                                                                      | Not yet removed                                     |
| F3 | **Medium**   | DB/naming drift: `Service-system-db` → `serviceflow-db` rename points at a NEW database; existing dev data lives in the old DB. Package renamed `Service-system` → `serviceflow`                 | `lib/appwrite.ts`, `scripts/setup-appwrite.ts` (worktree: renamed)                                                                                                                                                 | Code done; dev environment re-provision required    |
| F4 | **Medium**   | Dual package managers: `package-lock.json` (npm) tracked alongside `pnpm-lock.yaml`; legacy `appwrite@22` dependency alongside `node-appwrite@14`                                                | worktree: `packageManager: pnpm@11.1.1`, engines, `pnpm-workspace.yaml` added, `appwrite` dep removed, Next/eslint/vitest bumps                                                                                    | Code done; `package-lock.json` still tracked        |
| F5 | **Low**      | Repo hygiene: `check_or.ts` debug leftover committed at root; `lint_output.txt` tracked; legacy `design/*` HTML/PNG mockups and `design/DESIGN.md` pending deletion (DESIGN.md re-added at root) | worktree: deletions staged in working tree                                                                                                                                                                         | Partial                                             |
| F6 | **Low**      | Debug logging on production paths: `console.log("[Appwrite Debug] Session set on client")` on every session creation; commented Spanish debug lines                                              | `lib/appwrite.ts`                                                                                                                                                                                                  | Not yet cleaned                                     |
| F7 | **Low**      | Missing project contracts per repo convention: `ARCHITECTURE.md`, `DESIGN.md`, `PRD.md` (and `README.md`, `CHANGELOG.md` already tracked)                                                        | untracked root files                                                                                                                                                                                               | Drafted, uncommitted                                |
| F8 | **Medium**   | No CI, no PR governance, no security reporting, no dependency automation                                                                                                                         | untracked `.github/workflows/ci.yml`, `pr-check.yml`, `SECURITY.md`, `dependabot.yml`, `CODEOWNERS`, `CONTRIBUTING.md`, issue/PR templates, `.husky/pre-commit` (lint-staged)                                      | Drafted, uncommitted                                |

**Mitigating factor for F1**: because the app never reads Appwrite through a public client, stripping collection-level permissions does NOT break current functionality (verified via CodeGraph blast radius: all `databases` access goes through the admin client in server actions/routes).

## Affected Areas

- `scripts/setup-appwrite.ts` — collection creation must use `[]` permissions (worktree already does); also renames DB_ID.
- `scripts/migrate-appwrite-permissions.ts` — new dry-run-first migration that strips collection permissions on `serviceflow-db`; must target the **isolated dev Appwrite environment only**.
- `tests/permissions.test.ts` — new unit tests for the migration (parseArgs, plan builder, processCollections); 17/17 pass.
- `lib/appwrite.ts` — DB_ID rename; remove `console.log` debug line; keep admin/session client split.
- `proxy.ts` — delete (dead, unauthenticated Appwrite gateway; verified no callers).
- `check_or.ts` — delete tracked debug leftover (`git rm`).
- `package.json` / `pnpm-lock.yaml` / `package-lock.json` / `pnpm-workspace.yaml` — pnpm pinning and consolidation; remove `package-lock.json` from tracking; drop `appwrite@22`.
- `.gitignore` — workspace file rename, `lint_output.txt` ignore (done in worktree).
- `design/` — legacy mockup deletions; `DESIGN.md` moved to repo root.
- Root contracts — `ARCHITECTURE.md`, `DESIGN.md`, `PRD.md`.
- `.github/` + `.husky/` — CI, PR validation (400-line budget, issue-reference, `status:approved`, single `type:*` label), security policy, dependabot, templates, CODEOWNERS.
- `openspec/config.yaml` — already defines rules; no changes expected.

## Approaches

1. **Single monolithic PR** — commit the whole worktree as one change.
   - Pros: Fastest; one artifact set.
   - Cons: ~2,400 changed lines (estimate from worktree stat: 675 insertions + 1,755 deletions in tracked diffs, plus ~1,400+ untracked lines in workflows/templates/contracts/tests); far exceeds the 400-line review budget; pr-check.yml would fail it without `size:exception`; mixes security, hygiene, docs, and governance.
   - Effort: Low (authoring) / High (review).
2. **Chained PRs by deliverable work unit** (recommended) — assemble the existing worktree into ordered slices, each independently reviewable and verifiable, following `delivery_strategy: auto-chain` and the 400-line budget.
   - Pros: Reviewable units; each slice has autonomous scope and verification; permission migration can land with its tests; CI slice validates the rest.
   - Cons: Needs a tracker issue with the labels pr-check.yml requires (`status:approved` + one `type:*`) before child PRs can pass gates; sequencing discipline required.
   - Effort: Medium.
3. **Per-finding changes** — one SDD change per finding (F1..F8).
   - Pros: Maximal isolation.
   - Cons: Fragments one delivery (F1 code + F1 migration execution + F3 DB rename are coupled — the migration targets the renamed DB); 8 changes where 1 change with 5-6 PR slices suffices; heavier orchestration overhead.

### Proposed slice plan (approach 2)

| Slice | Work unit                                                                                                                                                                | Key files                                                                                           | Est. changed lines                                                                                                                                                                                   | Depends on            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| S1    | Repo hygiene cleanup: delete `proxy.ts`, `check_or.ts`, `lint_output.txt`, legacy `design/*` mockups; remove debug console.log; gitignore updates                        | `proxy.ts`, `check_or.ts`, `.gitignore`, `lib/appwrite.ts`, `design/`                               | ~600 (mostly deletions)                                                                                                                                                                              | —                     |
| S2    | Naming + package consolidation: rename `serviceflow`, DB_ID `serviceflow-db`, pnpm pinning, drop `appwrite@22`, untrack `package-lock.json`                              | `package.json`, `pnpm-workspace.yaml`, lockfiles, `lib/appwrite.ts`, `scripts/setup-appwrite.ts`    | ~250                                                                                                                                                                                                 | S1 (clean base)       |
| S3    | Appwrite permission remediation (code + tests): setup creates `[]` perms; migration script; unit tests                                                                   | `scripts/setup-appwrite.ts`, `scripts/migrate-appwrite-permissions.ts`, `tests/permissions.test.ts` | ~450 → split if needed (script + tests are one unit, may exceed budget; then S3a code, S3b tests stay with code per work-unit-commits — keep as one PR and monitor, or split script vs test if >400) | S2 (DB rename target) |
| S4    | Dev-environment migration execution + verification: provision `serviceflow-db`, run migration dry-run then `--apply` on **isolated dev Appwrite only**; capture evidence | dev Appwrite environment (no code)                                                                  | 0 code (evidence + verify-report)                                                                                                                                                                    | S3                    |
| S5    | Contracts and docs: commit `ARCHITECTURE.md`, `DESIGN.md`, `PRD.md`, plus SECURITY.md                                                                                    | root docs                                                                                           | ~350                                                                                                                                                                                                 | — (can land any time) |
| S6    | CI + governance: workflows, dependabot, templates, CODEOWNERS, CONTRIBUTING, husky pre-commit                                                                            | `.github/`, `.husky/`                                                                               | ~700 → split if needed (S6a CI workflows, S6b governance/templates)                                                                                                                                  | S1                    |

## Recommendation

**Approach 2 — chained PRs by work unit**, ordered S1 → S2 → S3 → S4 → S5 → S6, in a feature-branch chain with a tracker PR/issue. Rationale:

- The worktree already contains the remediation; the change is to formalize, sequence, and verify it — not to re-implement from scratch. All uncommitted user work MUST be preserved and assembled into the slices.
- F1 is the only critical finding; its remediation (S3 + S4) is code-complete and test-covered, so it can land early in the chain.
- pr-check.yml (part of S6) requires every PR to reference an issue with `status:approved` and exactly one `type:*` label — the orchestrator must create the tracking issue **before** the first child PR so gates pass (for chain children, `Related to #N` references are accepted).
- The dev-only environment constraint is the non-negotiable boundary for S4: the migration MUST run against the isolated development Appwrite project only (verify `NEXT_PUBLIC_APPWRITE_ENDPOINT`/`PROJECT` and `APPWRITE_API_KEY` point at dev before `--apply`).

## Risks

- **Environment confusion on migration**: running `migrate-appwrite-permissions.ts --apply` against a production project would strip permissions on production data. Mitigation: dry-run discipline, explicit env verification step, and the proposal should add a dev-only guard (endpoint/project check) to the script.
- **DB rename orphans dev data**: `Service-system-db` → `serviceflow-db` means existing dev collections/data are no longer visible after S2; S4 must re-provision the dev database (setup script) and copy data if any dev data matters. Production untouched by design.
- **Uncommitted work is the only copy**: the entire remediation exists only in the dirty worktree; any slice assembly error risks losing user changes. Mitigation: commit slices as assembled, never reset/clean the worktree, and stage by unit.
- **Permission stripping vs future access patterns**: safe today (verified: no client-side SDK or proxy callers), but the admin-SDK-only rule must be documented (ARCHITECTURE.md already states it) and enforced in review.
- **pr-check.yml strictness on chained children**: children reference `Related to #N` (accepted by the workflow), but the tracker issue must carry `status:approved`; a missing label blocks every child PR.
- **Deletion irreversibility**: `design/*` binary deletions cannot be recovered after commit; verified they are standalone mockups with no code references.

## Ready for Proposal

**Yes** — the orchestrator should tell the user: the audit findings (F1–F8) are derived from the dirty worktree on `docs/project-audit-hardening`; remediation will be delivered as one SDD change with chained PR slices (S1–S6) per `auto-chain`; a tracking issue with `status:approved` + `type:*` labels must be created before the first child PR; and the Appwrite permission migration will run against the isolated dev environment only, never production. `sdd-propose` should formalize this scope, the dev-only environment guard, and the rollback plan for the migration.
