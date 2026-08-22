# Apply Progress: migrate-appwrite-to-pocketbase

## 2026-08-22 — Parent tracker bootstrap

- Tracker issue: #18 — https://github.com/jonasotoaguilar/serviceflow/issues/18 (status:approved, type:feat, supersedes #11)
- Tracker PR: #19 — https://github.com/jonasotoaguilar/serviceflow/pull/19 (draft, base main, head feat/migrate-appwrite-to-pocketbase)
- Tracker branch: `feat/migrate-appwrite-to-pocketbase`
- Base SHA: `3679f597361500b58dda3b7a57c978bafd179636` (origin/main)
- First commit: `4717e4f234bc7bf835e7f543b03524d93ac5d397` — docs: add Appwrite to PocketBase planning and supersession artifacts (21 files: openspec/config.yaml, openspec/changes/migrate-appwrite-to-pocketbase/**, openspec/changes/remediate-audit-findings/**)
- Second commit (this entry): records tracker bootstrap; checks tasks.md parent task 267 (At apply start: create draft/no-merge tracker PR...)
- Implementation: NOT STARTED — no WU1-WU10 code, no schema artifact apply, no PocketBase env flip
- Secrets: none collected, no POCKETBASE_URL or admin values recorded
- Chain: 10-child feature-branch-chain (WU1-WU10), 400-line budget High, PR 10 acceptance-gated
- Notes: existing Dokploy PocketBase via env only; empty start; no data import

## 2026-08-22 — WU1 provider budget exceeded, native reset, and approved split to 01a/01b

- Incident: WU1 attempt ordinal 1 (WU1-01-schema-seam) completed strict TDD RED-GREEN-TRIANGULATE (31 tests, tsc, lint) but provider accounting exceeded the 400-line review budget: 497 changed lines (454 additions + 43 deletions) including `pnpm-lock.yaml`, `tasks.md`, and `apply-progress.md` churn. Authored product lines were 343, but provider budget counts all files.
- Native reset authorized by maintainer: reset revision `sha256:a13ebd838576ffc7619ce0d8267316a153d097e68e80ec09ec4afea255ced438`, previous generation 1, next_action `begin`, tracker clean at `bfe67a8`, child staged tree exact 497 lines with no unstaged changes. No new attempt started before split.
- Approved split: WU1 → WU1a (01a-env-schema) and WU1b (01b-filter-client), totaling 11 child PRs. Provider budgets count `additions + deletions` of all files including lockfile, tasks, and progress. `01b` owns the `pocketbase` dependency, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`. WU2 base becomes `…-01b-filter-client`. No `size:exception`.
- Implementation preserved: four verified patches in `/tmp` — `serviceflow-wu1a-tests.patch` (env + schema tests), `serviceflow-wu1a-code.patch` (env + schema artifact), `serviceflow-wu1b-tests.patch` (filter + client tests), `serviceflow-wu1b-code.patch` (filter + client + dep/lockfile/workspace). Each verified with `git apply --check` on a disposable tracker worktree and combined check; no token or revision secrets in patches.
- Child worktree restored: staged implementation removed via targeted `git restore --staged` + `git restore` + `rm` (no `reset --hard`), worktree clean at `bfe67a8`, branch renamed from `feat/migrate-appwrite-to-pocketbase-01-schema-seam` to `feat/migrate-appwrite-to-pocketbase-01a-env-schema`. No implementation files remain in child.
- Planning corrections: `design.md` updated to 11 PRs with 1a/1b split and provider accounting; `tasks.md` forecast, chain diagram, chain table, headers, dependencies, bases, and branch names updated for 01a/01b; parent tracker task remains checked, all implementation tasks remain unchecked. Total tasks remain 70, completed 1/70. No WU1 tasks marked complete.
- Secrets: none collected; no `POCKETBASE_URL` or admin values, no runtime tokens, only reset revision and branch identities recorded.
- Next: begin WU1a and WU1b via `sdd-apply` using the verified patches; child remains clean and fast-forwarded to updated tracker after planning commit.
## 2026-08-22 — WU1a env+schema (01a-env-schema) — strict TDD

- Branch: `feat/migrate-appwrite-to-pocketbase-01a-env-schema` at tracker `8e65449`
- Scope: WU1a only — `lib/env.ts` + `pocketbase/v1.collections.json` + env/artifact tests; no `pocketbase` npm dep, no lockfile/workspace changes (owned by WU1b)
- TDD RED:
  - `pnpm exec vitest run tests/env-pocketbase.test.ts tests/schema-artifact.test.ts tests/schemas.test.ts` — FAIL missing `lib/env.ts` (Failed to resolve import) + ENOENT `pocketbase/v1.collections.json` (7 artifact tests)
  - Tests staged isolated: `tests/env-pocketbase.test.ts` (9 cases), `tests/schema-artifact.test.ts` (7 cases) — GREEN baseline `tests/schemas.test.ts` 2 passed
- TDD GREEN/TRIANGULATE:
  - `pnpm exec vitest run tests/env-pocketbase.test.ts tests/schema-artifact.test.ts tests/schemas.test.ts` — 3 passed, 18 passed (9 env incl whitespace/ftp/http/https + admin var guard, 7 artifact incl 4-collections/optional address/required log userId/tenant rules/public create/locked list-delete/no rows/field names, 2 schemas)
  - `pnpm test:run` — 3 passed, 18 passed
  - `pnpm exec tsc --noEmit` — pass
  - `pnpm run lint` — pass (1 pre-existing react-hooks/incompatible-library warning in ServicesModal)
- Tasks: WU1a 6/6 implementation checkboxes complete — 1.1 RED/GREEN/TRIANGULATE, 1.2 RED/GREEN/TRIANGULATE. WU1b and 2–11 unchanged (deferred)
- Files: `lib/env.ts` (Zod PocketBaseEnvSchema, getPocketBaseUrl fail-closed, http/https only), `pocketbase/v1.collections.json` (hand-authored 4 collections, text FKs, tenant rules, indexes, no seed rows), `tests/env-pocketbase.test.ts`, `tests/schema-artifact.test.ts`
- Provider-counted add+delete line total (staged): see `git diff --cached --numstat` at stage time; target ≤400 — kept small by excluding `pocketbase` dep/lockfile/workspace and limiting progress/tasks churn
- Rollback: revert staged `lib/env.ts`, `pocketbase/v1.collections.json`, `tests/env-pocketbase.test.ts`, `tests/schema-artifact.test.ts`, `openspec/changes/migrate-appwrite-to-pocketbase/tasks.md`, `openspec/changes/migrate-appwrite-to-pocketbase/apply-progress.md` — no unrelated work touched
- Secrets/network: none — no POCKETBASE_URL/admin values collected, no live PocketBase/Appwrite contacted, no token logged
- Verification: Appwrite path still compiles; pocketbase dep absent verified via `git diff -- package.json`
- Workload / PR boundary: 01a staged as single work-unit; PR base is tracker `feat/migrate-appwrite-to-pocketbase`, future 01b bases on 01a
