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

## 2026-08-22 — WU1b filter+request client (01b-filter-client) — strict TDD

- Branch: `feat/migrate-appwrite-to-pocketbase-01b-filter-client` at base `1420503c` (WU1a clean)
- Scope: WU1b only — `lib/pocketbase-filter.ts` + `lib/pocketbase.ts` + filter/client tests + `pocketbase@0.28.0` + `pnpm-lock.yaml` + `pnpm-workspace.yaml`; no auth/actions/UI/proxy/docs/Appwrite/schema/env edits beyond inherited WU1a
- TDD RED:
  - `pnpm exec vitest run tests/pocketbase-filter.test.ts tests/pocketbase-client.test.ts` — FAIL 2 suites (Failed to resolve import `../lib/pocketbase-filter` / `../lib/pocketbase`), 0 tests — missing modules as expected
  - Applied `/tmp/serviceflow-wu1b-tests.patch` first only
- TDD GREEN/TRIANGULATE:
  - Applied `/tmp/serviceflow-wu1b-code.patch` second; `pnpm install --frozen-lockfile` (pocketbase 0.28.0, postcss 8.5.26) via `pnpm-workspace.yaml` allowBuilds (esbuild/sharp/unrs-resolver true); no unrelated dep regen
  - `pnpm exec vitest run tests/pocketbase-filter.test.ts tests/pocketbase-client.test.ts` — 2 passed, 13 passed (6 filter: injection chars remain params, status allowlist, composed search+status+location, onlyActive, date bounds, sole pb.filter site; 7 client: fresh PB instance, await cookies, pb_auth only, both-cookie precedence, malformed/missing URL fail-closed, no loadFromCookie)
  - `pnpm exec vitest run tests/env-pocketbase.test.ts tests/schema-artifact.test.ts tests/pocketbase-filter.test.ts tests/pocketbase-client.test.ts tests/schemas.test.ts` — 5 passed, 31 passed (9 env, 7 artifact, 6 filter, 7 client, 2 schemas)
  - `pnpm test:run` — 5 passed, 31 passed; `pnpm exec tsc --noEmit` — pass; `pnpm run lint` — pass (1 pre-existing react-hooks warning)
- TDD Cycle Evidence:
  | Task | RED | GREEN | TRIANGULATE | REFACTOR |
  |------|-----|-------|-------------|----------|
  | 2.1 Filter builder RED | tests/pocketbase-filter.test.ts FAIL missing module | — | — | — |
  | 2.1 Filter builder GREEN | — | lib/pocketbase-filter.ts impl, 6 tests pass | — | — |
  | 2.1 Filter builder TRIANGULATE | — | — | compose+onlyActive+date bounds verified, sole pb.filter site | no interpolation, duplication kept minimal |
  | 2.2 Request client RED | tests/pocketbase-client.test.ts FAIL missing module | — | — | — |
  | 2.2 Request client GREEN | — | lib/pocketbase.ts + pocketbase dep, 7 tests pass | — | no singleton, no loadFromCookie |
  | 2.2 Request client TRIANGULATE | — | — | both-cookie→pb_auth only, missing URL fail-closed, malformed no throw | — |
  | 2.3 Verification | — | — | 31 tests + tsc + lint green, Appwrite compiles | — |
- Tasks: WU1b 7/7 implementation checkboxes complete — 2.1 RED/GREEN/TRIANGULATE, 2.2 RED/GREEN/TRIANGULATE, 2.3 verification; later/parent tasks unchanged
- Files: `lib/pocketbase-filter.ts` (bound templates {:uid}/{:search}/{:stN}/{:locationId}/{:lid}, ALLOWED_STATUSES, applyBinding sole pb.filter), `lib/pocketbase.ts` (per-request new PocketBase(getPocketBaseUrl()), await cookies(), pb_auth JSON parse + authStore.save, no session/loadFromCookie/admin), `tests/pocketbase-filter.test.ts`, `tests/pocketbase-client.test.ts`, `package.json` (+pocketbase 0.28.0), `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- Provider-counted add+delete line total (staged): 315 (278 additions + 37 deletions) across 9 files — target ≤400 — 01b owns pocketbase dep/lockfile/workspace
- Rollback: revert staged `lib/pocketbase-filter.ts`, `lib/pocketbase.ts`, `tests/pocketbase-filter.test.ts`, `tests/pocketbase-client.test.ts`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `openspec/changes/migrate-appwrite-to-pocketbase/tasks.md`, `openspec/changes/migrate-appwrite-to-pocketbase/apply-progress.md` — no unrelated work touched
- Secrets/network: none — no POCKETBASE_URL/admin values collected, no live PB/Appwrite contacted, no token logged, pocketbase types match installed 0.28.0 (PocketBase ctor + authStore.save)
- Verification: strict TDD RED→GREEN→TRIANGULATE followed; Appwrite path still compiles via tsc; no auth/actions/UI/proxy/docs edits
- Workload / PR boundary: 01b staged as single work-unit; PR base is `…-01a-env-schema` (`1420503c`), provider budget ≤400, no commit/push/PR

## 2026-08-22 — Planning-only chain correction: pre-split oversized WU2 (02-auth-split-plan)

- Branch: `feat/migrate-appwrite-to-pocketbase-02-auth-split-plan` from exact base `bc304e73e459273af53bfbedfdc79414f3cb067c` (`…-01b-filter-client`, PR #21 OPEN, before any WU2 acquire)
- Trigger: source-driven preflight forecast for old WU2 (`…-02-auth-janitor`) corrected to **574–737 provider lines** (additions + deletions, all files including pnpm-lock.yaml/tasks.md/apply-progress.md); auto-chain/400 would overflow — user selected auto-chain/400 and no size exception
- Action: planning-only docs correction **before any acquire** — no auth code/tests, no acquire/settle, no merge, no size exception. Split old WU2 into three implementation slices to guarantee headroom:
  - **WU2a / `…-02a-auth-core`**: cookie helpers + `getAuthUser` + its RED/GREEN/TRIANGULATE tests; base planning branch; forecast `<=300` provider lines
  - **WU2b / `…-02b-auth-actions`**: login/register/logout + error mapping/Zod ordering + tests; base 02a; forecast `<=380` provider lines
  - **WU2c / `…-02c-janitor-notice`**: root `proxy.ts` janitor + login/register empty-start banner + verification; base 02b; forecast `<=250` provider lines
- Reassignment: preserved all **70 checkboxes** and `sdd-owner` markers; parent tracker `At apply start...` stays checked; 13 implementation + 1 parent = **14 checked**, 56 pending unchanged; no new task marked complete. Reassigned existing 11 WU2 tasks among 2a (3)/2b (3)/2c (5) without adding/removing behavior
- Chain update: Review Workload Forecast, chain diagram/table, dependencies, later PR numbering/bases (WU3 base now `…-02c`, etc.), tracker terminal PR reference (now PR 13 `…-10-appwrite-removal`), provider-budget policy, and Review-safe work units table updated; planning PR included as chain node before 02a, not as implementation task nor size exception; `01b` still owns `pocketbase` dep/lockfile/workspace
- Design notes: `design.md` Review-safe work units (now 13+1), Current seams (WU 2c), Auth cookies (WU 2c), Rollout (1. Land 1a,1b,2a,2b,2c,3...), Traceability (WU 2a–2c) updated with corrected 574–737 forecast
- Validation: `gentle-ai sdd-status migrate-appwrite-to-pocketbase` → no taskArtifactErrors, total 70 checked 14, apply ready, no source files changed, provider diff `<=400` (docs-only)
- Secrets/network: none — no POCKETBASE_URL/admin values, no live PB/Appwrite contacted, no token logged; no native attempt opened
- Next: commit docs/chore, push, open non-draft planning child PR targeting exact `…-01b-filter-client` (`bc304e73`), link issue #18 without closing, exactly one `type:feat`
