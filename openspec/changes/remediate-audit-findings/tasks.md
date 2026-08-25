# Tasks: Remediate Audit Findings

## Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Low

~2,500–3,200/9 PRs; PR4–6 ≤400 (PR7–9 unmeasured). PR2/3 size-exceptions scoped; later unapproved.

### Work Units (unit→PR; est=+/-; PR1→tracker, N→prior)

| Unit | Goal                             | Focused test                                          | Harness                       | Rollback          |
| ---- | -------------------------------- | ----------------------------------------------------- | ----------------------------- | ----------------- |
| 1    | Removal+hygiene                  | `pnpm test:run`                                       | build+manifest absence        | revert S1         |
| 2    | design/lint dels                 | `git status --porcelain`                              | N/A-deletion                  | restore           |
| 3    | pnpm+DB identity                 | `pnpm exec tsc --noEmit`                              | N/A-typecheck                 | revert lock/DB_ID |
| 4    | Dev-target guard ~230 (F1)       | `pnpm exec vitest run tests/dev-target-guard.test.ts` | N/A-pure                      | rm 2 files        |
| 5    | Runner core plan+apply ~340 (F1) | `pnpm exec vitest run tests/permissions.test.ts`      | N/A-mocked                    | rm 2 files        |
| 6    | CLI wiring+SA-2 ~190 (F1)        | `pnpm exec vitest run tests/permissions.test.ts`      | tsx --dry-run no-env → exit 1 | revert hunks      |
| 7    | Dev-only run ~0 (S4)             | `pnpm test:run`                                       | dev Appwrite+key              | re-provision      |
| 8    | Root contracts ~40 (F7)          | grep no proxy/dev-only                                | N/A-docs                      | revert files      |
| 9    | CI governance ~365 (F8)          | `pnpm test:run`                                       | lint-error commit             | rm .husky/.github |

## Phase 1: Removal + Hygiene

- [x] 1.1 `git rm proxy.ts`; no `/api/proxy/*` (F2, SA-4)
- [x] 1.2 `git rm check_or.ts` (F5, CI-7)
- [x] 1.3 Commit `design/` + `lint_output.txt` deletions (F5/CI-7)
- [x] 1.4 `lib/appwrite.ts`: drop debug log + warn comment (F6/SA-5)

## Phase 2: pnpm + DB Identity

- [x] 2.1 Add `pnpm-workspace.yaml`; appwrite@22 gone (F4, CI-6)
- [x] 2.2 `git rm --cached package-lock.json` + `.gitignore` (CI-6)
- [x] 2.3 `lib/appwrite.ts` DB → `serviceflow-db` (F3/SA-3)

## Phase 3: Migration Guard — strict TDD (pending)

- [x] 3.1 RED: `assertDevTarget` throws prod/missing/∉-allowlist (PM-2)
- [x] 3.2 RED: `parseArgs` `--apply`⇒`confirmed:false`; `--yes`⇒confirmed
- [x] 3.3 GREEN `scripts/dev-target-guard.ts` (PM-2/PM-3)
- [x] 3.4 RED: `buildMigrationPlan` empty targets; `processCollections` dry/apply/skip/fail (PM-1/PM-4)
- [x] 3.5 GREEN runner core; plan pre-mutation (PM-1/SA-1)
- [x] 3.6 RED: main() aborts pre-DB w/o `--yes`; prod rejected dry-run
- [x] 3.7 GREEN main()+entry guard+script (PM-2..4)
- [x] 3.8 SA-2: setup-appwrite.ts perms `[]`, drop Permission/Role
- [x] 3.9 REFACTOR: 38 tests, no dupes; no `:apply` alias (PM-4/SA-2)

## Phase 4: Dev-Only Migration Run

- [ ] 4.1 Precondition: dev env matching, else STOP
- [ ] 4.2 Dry-run dev Appwrite; capture plan (PM-1)
- [ ] 4.3 `--apply --yes`; no `Role.any()`; capture evidence (PM-4)

## Phase 5: Root Contracts

- [ ] 5.1 Root `SECURITY.md` canonical (PC-3); delete `.github/` copy
- [ ] 5.2 Root PRD/ARCHITECTURE/DESIGN.md; no stale proxy (PC-1/PC-2)
- [ ] 5.3 Document dev-only Appwrite guard (PC-2)

## Phase 6: CI Governance

- [ ] 6.1 RED: staged lint error → non-zero, commit blocked; clean staged lint → exit 0 (CI-5, threat row)
- [ ] 6.2 GREEN: `.husky/pre-commit` runs `pnpm exec lint-staged`
- [ ] 6.3 `ci.yml`/`pr-check.yml`: lint, typecheck, tests, size (CI-1/CI-2)
- [ ] 6.4 `dependabot.yml` (CI-3); CODEOWNERS security (CI-4)

## Finalizer: Superseded 2026-08-14

This change is superseded and cancelled by `migrate-appwrite-to-pocketbase`, not archived.

- Progress: 16 of 26 tasks completed. Tasks 4.1 through 4.3 and 5.1 through 6.4 remain unchecked.
- Archive is blocked because unfinished tasks remain. This directory was not moved to `archive`.
- Appwrite-specific work is abandoned in this change and will not be completed here.
- Backend-neutral hygiene and governance from this change is preserved for re-evaluation in the new PocketBase change. No unfinished task was checked in this finalizer.
- See `superseded.md` for the full closure note.
