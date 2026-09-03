# Apply Progress — service-ui-corrections

**Change**: service-ui-corrections
**Mode**: Strict TDD
**Work Unit**: unit-4-registro-create (Registro Create) — stacked on unit-3
**Attempt tokens**: 
- unit-1 `sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f`
- unit-2 `sha256:d63ae090348edd269cd9a774adfbe082434e5e2f526f286b5d0fc03b1af2c911`
- unit-3 `sha256:dadfd6658aab3f9fe389714e89d17b8312b4d6d406d9d6b7973ac76b61e16a3b`
- unit-4 `sha256:6412aebf749250cce2424818c939a57f17782186f3338e60ca2338dde5680596`
**Date**: 2026-09-02
**Branch**: fix/service-ui-corrections-04-registro-create (stacked on fix/service-ui-corrections-03-shell-locations)
**Stack strategy**: stacked-to-main (auto-chain, 800-line session budget, PR4 fourth slice)

## Completed Tasks

- [x] 1.1 RED `tests/unit/dashboard-operate-plus.test.tsx`: drop `toggleStatusInFilter`; replace-one; all-status omits; GET first token.
- [x] 1.2 GREEN `components/services/ServicesDashboard.tsx` + GET `app/api/services/route.ts`: `statusFilter: ServiceStatus | ""`; close on pick.
- [x] 2.1 RED same test: Acciones unclipped 1280/1366/1920; cards 390/375.
- [x] 2.2 GREEN `components/services/ServicesTable.tsx` `overflow-x-auto` + gutter; no parent clip.
- [x] 3.1 RED `tests/unit/shell.test.ts`, `tests/unit/locations.test.ts`: `2xl:max-w-[1600px]`; Locations `text-2xl font-semibold tracking-tight`.
- [x] 3.2 GREEN `app/(app)/layout.tsx`, `components/layout/Navbar.tsx`, `app/(app)/locations/locationsManager.tsx`. Check tests.
- [x] 4.1 RED `tests/unit/registro-primary-surface.test.tsx`: true-empty `push("/dashboard?createService=1")`; filter-empty clears; one-shot; Suspense-safe.
- [x] 4.2 GREEN `app/(app)/service-events/serviceEventsManager.tsx`, `app/(app)/dashboard/page.tsx` await `searchParams`, `ServicesDashboard.tsx` open+`replace`. Check tests.

## Files Changed (cumulative)

| File | Action | What Was Done |
|------|--------|---------------|
| `tests/unit/dashboard-operate-plus.test.tsx` | Modified (unit-1 + unit-2) | Unit-1 exclusive scalar + Unit-2 gutter (32 tests) |
| `components/services/ServicesDashboard.tsx` | Modified (unit-1 + unit-2 + unit-4) | Scalar status + parent unclip + one-shot `initialCreateService` guard with `router.replace("/dashboard")` |
| `app/api/services/route.ts` | Modified (unit-1) | GET first allowlisted token only |
| `components/services/ServicesTable.tsx` | Modified (unit-2) | `overflow-x-auto custom-scrollbar` + `min-w-[960px]` |
| `tests/unit/shell.test.ts` | Modified (unit-3) | Added 5 2xl/shell rhythm tests (max-w-7xl 2xl:max-w-[1600px] shared, no 2xl at 1280, Locations header/toolbar band) |
| `tests/unit/locations.test.ts` | Modified (unit-3) | Added 3 Locations rhythm tests (title 2xl, toolbar border-y band, shell inheritance) |
| `app/(app)/layout.tsx` | Modified (unit-3) | `max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8` |
| `components/layout/Navbar.tsx` | Modified (unit-3) | Inner row `max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8` |
| `app/(app)/locations/locationsManager.tsx` | Modified (unit-3) | Header `text-2xl font-semibold tracking-tight` + toolbar `border-y bg-surface/50 px-4 py-3 mb-6` (was card `bg-surface border shadow-sm p-4 rounded-sm`) |
| `tests/unit/registro-primary-surface.test.tsx` | Modified (unit-4) | Added 6 true-empty/one-shot/Suspense tests (now 21 total); `vi.hoisted` mock `push`/`replace`, true-empty push, filtered clear, dashboard one-shot |
| `app/(app)/service-events/serviceEventsManager.tsx` | Modified (unit-4) | Import `useRouter`, add `router` and change `handleEmptyAction`: filtered → `clearFilters()`, true-empty → `router.push("/dashboard?createService=1")` |
| `app/(app)/dashboard/page.tsx` | Modified (unit-4) | Accept `searchParams?: Promise<{ createService?: string \| string[] }>`, `await searchParams`, derive `initialCreateService === "1"`, pass to `ServiceDashboard` |
| `tests/unit/service-events-filters.test.tsx` | Modified (unit-4) | Add `next/navigation` mock (`push`/`replace`) so `ServiceEventsManager` with new `useRouter` renders in existing filter tests |
| `openspec/changes/service-ui-corrections/tasks.md` | Modified | Marked 1.1,1.2,2.1,2.2,3.1,3.2,4.1,4.2 as [x] |
| `openspec/changes/service-ui-corrections/apply-progress.md` | Modified | Merged unit-1 + unit-2 + unit-3 + unit-4, added unit-4 evidence and stack PR #86 |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/unit/dashboard-operate-plus.test.tsx` | Unit+Integration | ✅ 22/22 | ✅ 8 failed | ✅ 27/27 | ✅ 5 exclusive | ✅ Clean |
| 1.2 | `tests/unit/dashboard-operate-plus.test.tsx` + `app/api/services/route.ts` + `components/services/ServicesDashboard.tsx` | Unit | ✅ same | ✅ multi `join` failed | ✅ 27/27 + tsc 0 | ✅ same 5 | ✅ `Set<ServiceStatus>` |
| 2.1 | `tests/unit/dashboard-operate-plus.test.tsx` | Unit+Integration DOM | ✅ 27/27 | ✅ 5 failed (overflow, min-w, parent clip) | ✅ 32/32 | ✅ 5 gutter | ✅ slice fixes |
| 2.2 | `components/services/ServicesTable.tsx` + `components/services/ServicesDashboard.tsx` | Unit | ✅ same | ✅ same 5 | ✅ 32/32 + tsc 0 + biome 0 | ✅ same 5 | ✅ Minimal gutter |
| 3.1 | `tests/unit/shell.test.ts` + `tests/unit/locations.test.ts` | Unit | ✅ 44/44 baseline (shell+locations before unit-3) | ✅ **8 failed** (2xl missing, title old, toolbar card) | ✅ **52/52** | ✅ 8 cases: layout 2xl, Navbar shared, no 2xl at 1280, per-page no duplicate, Locations h1 2xl, toolbar border-y, shell inheritance (x2) | ✅ Fixed xl substring false positive, h1 whitespace |
| 3.2 | `app/(app)/layout.tsx` + `components/layout/Navbar.tsx` + `app/(app)/locations/locationsManager.tsx` | Unit | ✅ same baseline | ✅ same 8 | ✅ 52/52 + 84/84 with dashboard-operate-plus + tsc 0 + biome 0 | ✅ same 8 | ✅ Minimal 2xl + title + band, no per-page widths |
| 4.1 | `tests/unit/registro-primary-surface.test.tsx` | Unit+Integration | ✅ 16/16 baseline (existing registro tests before unit-4) | ✅ **5 failed** (true-empty source/push, dashboard page async, dashboard guard, rendered trigger) — `source uses useRouter push`, `rendered true-empty pushes`, `dashboard page awaits searchParams`, `ServicesDashboard guard/replace`, `rendered trigger opens modal` | ✅ **21/21** | ✅ 5 cases: true-empty push via `router.push("/dashboard?createService=1")`, filtered-empty only clears (no push), page `await searchParams` + `initialCreateService`, dashboard `useRef` guard + `router.replace("/dashboard")` + no `useSearchParams`, one-shot open exactly once and `replace` cleanup, Suspense-safe (no bare `useSearchParams`) | ✅ Fixed `getByRole("Limpiar filtros")` multiple match (toolbar vs empty) → `getAllByRole` + `textContent` filter; fixed `getByText("Nuevo servicio")` multiple match (toolbar + dialog) → `getByText("Complete los detalles")` + `getByRole("dialog")` |
| 4.2 | `app/(app)/service-events/serviceEventsManager.tsx` + `app/(app)/dashboard/page.tsx` + `components/services/ServicesDashboard.tsx` + `tests/unit/service-events-filters.test.tsx` | Unit+Integration | ✅ same baseline + `service-events-filters` 4/4 | ✅ same 5 (service manager missing `push`, page missing `await searchParams`, dashboard missing guard) | ✅ 21/21 registro + 105/105 with shell+dashboard + 460/460 full suite + tsc 0 + biome 0 | ✅ same 5 | ✅ Minimal one-shot: server `await searchParams` + prop, client `useRef` guard + `replace` once, registro `push` only on true-empty |

### Test Summary

- **Total tests**: 21 in registro-primary-surface (16 baseline + 5 new effective + 1 filtered fix), 52 in shell+locations, 32 in dashboard-operate-plus, 105 combined shell+dashboard+registro, 460 full suite
- **Total passing**: 21/21 registro, 105/105 combined shell+dashboard+registro, 460/460 full (after fixing `service-events-filters` mock)
- **Layers**: Unit (source) + Integration (rendered with `next/navigation` mock, `boneyard-js` Skeleton mock, `getServiceEvents` mock)
- **Approval tests**: None
- **Pure functions**: None

## Work Unit Evidence

### Unit-1 (Exclusive status)
| Evidence | Value |
|---|---|
| Focused test | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` — 27/27 (before 8 failed) |
| Runtime harness | N/A — tsc 0, biome 0 |
| Rollback | Revert 3 code files |

### Unit-2 (Table gutter)
| Evidence | Value |
|---|---|
| Focused test | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` — 32/32 (before 5 failed) |
| Runtime harness | N/A — jsdom cannot prove 1280/1366/1920 geometry; source/DOM ownership verified |
| Rollback | Revert ServicesTable + Dashboard parent |

### Unit-3 (Shell + Locations)
| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm test tests/unit/shell.test.ts tests/unit/locations.test.ts --run` — **2 passed, 52 passed, 0 failed** (after GREEN). Before GREEN: 2 failed, 8 failed / 44 passed. Combined with dashboard: `pnpm test tests/unit/shell.test.ts tests/unit/locations.test.ts tests/unit/dashboard-operate-plus.test.tsx --run` — **3 passed, 84 passed, 0 failed** |
| Runtime harness command/scenario and exact result | N/A — jsdom cannot prove rendered 1920 vs 1280 viewport widths; source contract is verifiable: `max-w-7xl 2xl:max-w-[1600px]` shared in layout main and Navbar inner row, no `lg`/`xl` 1600, per-page no duplicate widths, Locations `text-2xl font-semibold tracking-tight` + `border-y bg-surface/50 px-4 py-3`. Typecheck `pnpm exec tsc --noEmit` 0, `biome check --formatter-enabled=false` 0, `format` pre-evidence. Full viewport proof (1920 vs 1280) left for final verify, not fabricated. |
| Rollback boundary | Exact revert: `app/(app)/layout.tsx` (remove `2xl:max-w-[1600px]`), `components/layout/Navbar.tsx` (remove `2xl:max-w-[1600px]`), `app/(app)/locations/locationsManager.tsx` (restore `text-xl font-bold` + `bg-surface border shadow-sm p-4 mb-6 rounded-sm`), `tests/unit/shell.test.ts` + `tests/unit/locations.test.ts` (remove 8 2xl/rhythm tests). No Services/Registro logic, no pagination, no tenant isolation change. |

### Unit-4 (Registro Create — one-shot)
| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm test tests/unit/registro-primary-surface.test.tsx --run` — **1 passed, 21 passed, 0 failed** (after GREEN). Before GREEN: **5 failed** — `source uses useRouter push to /dashboard?createService=1`, `rendered true-empty pushes`, `dashboard page awaits searchParams`, `ServicesDashboard guard/replace`, `rendered trigger opens modal`. Combined: `pnpm test tests/unit/registro-primary-surface.test.tsx tests/unit/dashboard-operate-plus.test.tsx tests/unit/shell.test.ts tests/unit/locations.test.ts --run` — **4 passed, 105 passed, 0 failed**. Full suite: `pnpm run test:run` — **26 passed, 460 passed, 0 failed** (after adding `next/navigation` mock to `service-events-filters.test.tsx`). |
| Runtime harness command/scenario and exact result | N/A — jsdom cannot prove real browser navigation/refresh/back, but contract verified: `router.push("/dashboard?createService=1")` on true-empty vs `clearFilters()` only on filtered-empty, server `await searchParams` → `initialCreateService === "1"` → client `useRef` guard opens modal once + `router.replace("/dashboard")` exactly once (rerender with same prop does not call again, `false` prop does not open). Typecheck `pnpm exec tsc --noEmit` 0, `biome check --formatter-enabled=false` 0 (3 warnings, 2 infos pre-existing). True-empty vs filtered-empty distinction, filters, pagination, loading, and create-modal toolbar button preserved. |
| Rollback boundary | Exact revert: `app/(app)/service-events/serviceEventsManager.tsx` (remove `useRouter` import + `router.push` — restore `clearFilters()` in true-empty), `app/(app)/dashboard/page.tsx` (remove `searchParams?: Promise<...>` param + `await searchParams` + `initialCreateService` prop), `components/services/ServicesDashboard.tsx` (remove `initialCreateService?: boolean` prop + `useRouter` import + `hasConsumedCreateServiceRef` + `useEffect` that opens modal and `router.replace("/dashboard")`), `tests/unit/registro-primary-surface.test.tsx` (remove 5 true-empty/one-shot tests, restore original 16-test baseline + original `next/navigation` mock), `tests/unit/service-events-filters.test.tsx` (remove `next/navigation` mock). No shell/table/status/RUT/custody/brand/ARCHITECTURE change. |

## Deviations from Design
None. Unit-4 implements Registro true-empty `router.push("/dashboard?createService=1")`, filtered-empty `clearFilters()` only, dashboard `await searchParams` server + `initialCreateService` prop, client one-shot guard `hasConsumedCreateServiceRef` + `router.replace("/dashboard")`, no `useSearchParams` (Suspense-safe). Preserves true-empty vs filtered-empty distinction, filters, pagination, loading, create-modal toolbar button, and previous exclusive/table/shell behavior per design `Registro true-empty → router.push → DashboardPage await searchParams → ServiceDashboard opens modal once → router.replace`.

## Issues Found
**Unit-1**: tsc `string[]` vs `ServiceStatus[]` fixed; metric Pendientes overlap fixed.
**Unit-2**: slice before data-testid missed class; parent overflow-hidden clipped gutter.
**Unit-3**:
- `xl:max-w-[1600px]` substring false positive in `2xl:max-w` — fixed to count `max-w-[1600px]` occurrences =1 and check `2xl:` prefix only, not `lg`.
- `text-xl font-bold` globally matched stats card `text-xl font-bold` — fixed to h1-specific regex `/<h1[^>]*text-2xl[^>]*>\s*Gestión/`.
- `shadow-sm p-4 rounded-sm Toolbar` cross-matched stats card before Toolbar comment — fixed to exact card string `bg-surface border border-border shadow-sm p-4 mb-6`.
- Formatter normalized 5 files pre-evidence.
**Unit-4**:
- `Limpiar filtros` `getByRole` matched both toolbar icon button (`aria-label`) and empty-state text button — fixed to `getAllByRole` + `textContent === "Limpiar filtros"` filter (toolbar button has empty textContent).
- `Nuevo servicio` `getByText` matched toolbar button + empty-state + dialog title (multiple) — fixed to `getByText("Complete los detalles para iniciar")` + `getByRole("dialog")` (only when modal open) and `queryByRole("dialog")` absence when false.
- `service-events-filters.test.tsx` broke after adding `useRouter` to `ServiceEventsManager` (no mock) — added `vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/service-events", redirect: vi.fn(), useSearchParams: () => new URLSearchParams() }))` to preserve existing filter tests (4/4) without changing production filtering semantics.
- `rendered trigger` false-prop case needed `queryByRole("dialog")` absence assert to distinguish toolbar button (always visible) from modal dialog.

## Remaining Tasks
- [ ] 5.1 RED `tests/schemas.test.ts`, `tests/services-lifecycle.test.ts`: PUT 400 `IDENTITY_PROTECTED`; storage omit; UI locked; 409 holds.
- [ ] 5.2 GREEN `lib/schemas.ts` `GENERIC_EDIT_OMIT`; `app/api/services/route.ts` reject before Zod; `lib/storage.ts` omit; `components/services/ServicesModal.tsx` read-only. Check tests.
- [ ] 6.1 RED `tests/unit/rut.test.ts`, `tests/pocketbase-filter.test.ts`: `isRutShapedLookup`; bound `{:rutSearch}` vs raw; `isValidRut` writes unchanged.
- [ ] 6.2 GREEN `lib/rut.ts`, `lib/pocketbase-filter.ts`, GET search in `app/api/services/route.ts`. Check tests.
- [ ] 7.1 RED receipt tests + `tests/unit/visual.test.ts`: title `Comprobante de recepción y custodia`; disclaimer; escape; no QR; lockup AA; no `ARCHITECTURE.md`.
- [ ] 7.2 GREEN `lib/custody-receipt.ts`, `components/services/ServicesDetailsModal.tsx`, `assets/brand/bodega-tecnica-mark.svg`, `components/brand/bodega-tecnica-mark.tsx` (drop filename `sr-only`).
- [ ] 7.3 GREEN `git rm` `ARCHITECTURE.md`; drop cites in `docs/CODEBASE-GUIDE.md`, `openspec/config.yaml` only. Check visual/shell tests.

## Workload / PR Boundary
- Mode: stacked PR slice (auto-chain, stacked-to-main)
- Current work unit: unit-4-registro-create — Registro true-empty navigation + dashboard one-shot trigger only. Starts from `fix/service-ui-corrections-03-shell-locations` @ `9ea3dd263b171ce65161b88dfcf5a24c2c271332`, ends after `serviceEventsManager` push, `dashboard/page` async `searchParams`, `ServicesDashboard` one-shot `replace`, plus 5 RED tests and `service-events-filters` mock fix. No identity, RUT, custody, brand, ARCHITECTURE deletion.
- Estimated review budget impact: **Unit-4** code 270 insertions + 10 deletions = 280 / 400 (additions+deletions), well within 400. Slice autonomous, rollback is 3 code files + 2 test files (plus mock fix). Previous slices: unit-1 537 / 800, unit-2 272 / 400, unit-3 250 / 400, cumulative code ~542 lines before docs.
- Stack: now 4 slices (was 3) — bottom `fix/service-ui-corrections` @ `d62d5c6` (#82), `fix/service-ui-corrections-02-table-gutter` @ `6c30e9b` (#83), `fix/service-ui-corrections-03-shell-locations` @ `9ea3dd2` (#84), top `fix/service-ui-corrections-04-registro-create` @ `5982d2b` (#86 pre-progress) → new SHA after this progress commit (see Evidence Revision) — all draft, verified via `gh stack view --json`.

## Status
8/13 tasks complete. Ready for next batch (unit-5 identity). Stack (stacked-to-main): bottom `fix/service-ui-corrections` @ `d62d5c6` (#82), `fix/service-ui-corrections-02-table-gutter` @ `6c30e9b` (#83), `fix/service-ui-corrections-03-shell-locations` @ `9ea3dd2` (#84), top `fix/service-ui-corrections-04-registro-create` @ `5982d2b` pre-progress / new SHA post-progress (#86) — all draft, verified via `gh stack view --json`. Dedicated Herdr worktree at `/home/jona/projects/serviceflow-worktrees/fix-service-ui-corrections` owns the stack branch; primary checkout on `main` preserves dirty `ARCHITECTURE.md` deletion + untracked OpenSpec artifacts losslessly. Issue #81 `status:approved` (enhancement, Frontend/UI) authorizes slices 1–4. Unit-4 PR #86 `type:feature` `Related to #81` base `fix/service-ui-corrections-03-shell-locations` — checks: `Check Issue Reference` SUCCESS, `Check Issue Has status:approved` SUCCESS, `Check PR Has type:*` SUCCESS, `Check PR Cognitive Load` SUCCESS (280/400), `quality` SUCCESS, `e2e` IN_PROGRESS (snapshot before docs commit).

## Recovery Reconciliation — 2026-09-02 (Herdr + `gh stack submit --auto` remediation)

**Dedicated Herdr worktree:** `/home/jona/projects/serviceflow-worktrees/fix-service-ui-corrections` on branch `fix/service-ui-corrections-04-registro-create` (inherits from `fix/service-ui-corrections-03-shell-locations` proven open via `herdr worktree list --json` (workspace `w8V`, is_linked_worktree true). Primary checkout `/home/jona/projects/serviceflow` now on `main`, no longer owns implementation branch. Dirty state preserved losslessly via `git stash push --include-untracked` then `stash apply` in Herdr: `D ARCHITECTURE.md` + `openspec/changes/service-ui-corrections/{design,exploration,preproposal,proposal,research,specs/*,ui-design}.md` (tracked deletion for unit 7 remains uncommitted on purpose).

**Issue reconciliation:** No conforming equivalent existed (search `service-ui-corrections` + `service ui` over open+closed → 0). Created #81 `fix: service UI corrections — dashboard filter, table gutter, shell rhythm, registro, identity, RUT, custody` via `feature_request.yml` (Frontend/UI, `enhancement` + `status:needs-review`), then atomic `status:approved` with `MAINTAIN`/`ADMIN` authority (`viewerPermission` `ADMIN`) and current-session pre-approval. Read-back confirmed `status:approved` + `enhancement`.

**Stack registration (pre-existing, preserved, not rewritten):** `stacked-to-main`, trunk `main` @ `9b48a7961e07107e460464420b34d818de53abef`. No fourth branch created until unit-4 `gh stack add fix/service-ui-corrections-04-registro-create` @ `9ea3dd2` (verified in stack before code).

| Slice | Branch | Commit SHA | Immediate Base | PR | Review Budget | Focused Checks (Herdr re-verified) | Rollback Boundary |
|-------|--------|------------|----------------|----|---------------|-----------------------------------|-------------------|
| 1 | `fix/service-ui-corrections` | `d62d5c64848a281cd80ad88aa76f073edc6759c8` | `main` @ `9b48a796` | #82 https://github.com/jonasotoaguilar/serviceflow/pull/82 (draft, `type:feature`, `Closes #81`, base `main`) | 537 / 800 | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` 27/27 isolated, now 32/32 cumulative; `tsc --noEmit` 0 | `ServicesDashboard.tsx` + `route.ts` + test |
| 2 | `fix/service-ui-corrections-02-table-gutter` | `6c30e9bbba88b0dc1d9d438a436cee35f5652f94` | `d62d5c64848a281cd80ad88aa76f073edc6759c8` | #83 https://github.com/jonasotoaguilar/serviceflow/pull/83 (draft, `type:feature`, `Related to #81`, base `fix/service-ui-corrections`) | 272 / 400 | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` 32/32 (5 gutter RED→GREEN); `tsc` 0; jsdom geometry N/A — DOM verified | `ServicesTable.tsx` + Dashboard parent |
| 3 | `fix/service-ui-corrections-03-shell-locations` | `9ea3dd263b171ce65161b88dfcf5a24c2c271332` | `6c30e9bbba88b0dc1d9d438a436cee35f5652f94` | #84 https://github.com/jonasotoaguilar/serviceflow/pull/84 (draft, `type:feature`, `Related to #81`, base `fix/service-ui-corrections-02-table-gutter`) | 250 / 400 | `pnpm test tests/unit/shell.test.ts tests/unit/locations.test.ts --run` 52/52 + combined 84/84; `tsc` 0 | `layout.tsx`, `Navbar.tsx`, `locationsManager.tsx` + 2 tests |
| 4 | `fix/service-ui-corrections-04-registro-create` | `5982d2ba1cf89020fb1c78eb4c51f93257391e7b` | `9ea3dd263b171ce65161b88dfcf5a24c2c271332` | #86 https://github.com/jonasotoaguilar/serviceflow/pull/86 (draft, `type:feature`, `Related to #81`, base `fix/service-ui-corrections-03-shell-locations`) | 280 / 400 | `pnpm test tests/unit/registro-primary-surface.test.tsx --run` 21/21 (5 RED→GREEN); `pnpm test tests/unit/registro-primary-surface.test.tsx tests/unit/dashboard-operate-plus.test.tsx tests/unit/shell.test.ts tests/unit/locations.test.ts --run` 105/105; `pnpm run test:run` 460/460; `tsc` 0; `biome` 0 | `serviceEventsManager.tsx` + `dashboard/page.tsx` + `ServicesDashboard.tsx` + 2 tests (registro + filters mock) |

**Workflow recovery note:** This `gh stack submit --auto` (PRs #82–#84, stack #85) is explicit remediation of prior deferred submission where three slices were committed without draft identities, violating `stacker-pr` `Draft before next slice`. It is **not** an approved future pattern; subsequent slices (units 4–7) must follow branch-before-code and draft-before-next-slice gates. Chain context, dependency diagrams, and rollback boundaries are recorded in each PR body; all PRs remain draft and target immediate parent (or `main` for slice 1). Check snapshot: PR #82 `Check Issue Reference` pass, `Check Issue Has status:approved` pass, `Check PR Has type:*` pass; `Check PR Cognitive Load` pass (PR83/84 pass, PR82 537 within 800); `quality`/`e2e` as per snapshot (quality fail on #82/#84 unrelated to slice gate, not waited upon per recovery instructions).

## Correction — unit-1-quality-correction (2026-09-02 bounded)

**Work Unit**: unit-1-quality-correction — bounded RED/contract correction for existing slice 1 (no new behavior, no slice 4)
**Attempt token**: `sha256:6c818e5c736ba15f2fd16c05f659bb3481280596a36929f466f7ce8bb8bffded` (parent settles; do not acquire/settle per native attempt)
**Mode**: Strict TDD remains active; this is a regression-test correction discovered by remote CI after the behavior contract changed
**Branch**: `fix/service-ui-corrections` (bottom slice, Herdr worktree `gh stack checkout fix/service-ui-corrections`)
**Stack strategy**: stacked-to-main preserved; `max 800`, `single-pr` exception not needed (test-only slice)

**Root cause**: PR #82 and cumulative #84 `quality` failed only `tests/services-lifecycle.test.ts:319` — old test expected both `pending` and `ready` for `status=pending,ready`. New approved spec (dashboard-operate-plus exclusive single status) requires at most one status and first allowlisted token only. Main passed because old API allowed both via `statusParam.split(",")`. Route `app/api/services/route.ts` is correct (`first = statusParam.split(",")[0]?.trim(); if (ALLOWED_STATUSES.has(first)) status=[first]`); stale test was wrong.

**Correction (RED → GREEN, tests only)**:
- **File**: `tests/services-lifecycle.test.ts` — 2 lines, tests-only, no production change
  - Rename: `it("GET keeps query params ... triangulates comma-separated status")` → `it("GET keeps query params ... exclusive single status first allowlisted token")`
  - Assert: `expect(Object.values(p)).toContain("pending")` kept; `expect(Object.values(p)).toContain("ready")` → `expect(Object.values(p)).not.toContain("ready")` — proves first-token exclusive behavior (`pending` included, `ready` excluded)
  - No weakening: all other asserts preserved (`uid`, `search`, `locationId`, page/limit/total, sort, status 200)
- **Behavioral invariant**: `GET /api/services?status=pending,ready` carries at most one allowlisted status (`pending`) and never stacks — second token (`ready`) is ignored. `p` contains exactly one status (`pending`) among allowlisted set, `ready` absent.

**Evidence — correction slice verified in Herdr worktree**:
| Evidence | Command / Result |
|---|---|
| Focused test (RED→GREEN) | `pnpm test tests/services-lifecycle.test.ts --run` — **21/21 passed** (1 corrected exclusive test + 20 others); before correction this file failed at `expect(Object.values(p)).toContain("ready")` |
| Dashboard exclusive | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` — **27/27 passed** on bottom slice (and 32/32 cumulative on top after rebase) — scalar `ServiceStatus | ""`, close-on-pick, no multi-toggle |
| Full suite (proportional) | `pnpm run test:run` — **26 passed, 438/438 passed** with correction applied (proves no regression) |
| Typecheck | `pnpm exec tsc --noEmit` — **0** |
| Lint | `pnpm exec biome check --formatter-enabled=false` — **0** (3 warnings, 2 infos, 0 errors) — normalize only if required pre-evidence; source already normalized via lint-staged on commit |
| Runtime harness | N/A — no runtime boundary for this GET filter seam beyond tsc+type+unit; jsdom cannot prove PocketBase filter over network, integration is via `mockFilter` seam |

**Commit**: `d62d5c64848a281cd80ad88aa76f073edc6759c8` on `fix/service-ui-corrections` — `test(services): enforce exclusive single-status first token in lifecycle contract` (tests only, conventional, no AI attribution)

**Rebase preservation** (`gh stack rebase --upstack` — mechanical, no ambiguous conflicts):
| Slice | Branch | Previous Head | Rebased Head | Immediate Base | PR |
|---|---|---|---|---|---|
| 1 | `fix/service-ui-corrections` | `91e0ba9dc2db11699fe2b347a35234dbf7f45dfd` | `d62d5c64848a281cd80ad88aa76f073edc6759c8` | `main` @ `9b48a7961e07107e460464420b34d818de53abef` | #82 https://github.com/jonasotoaguilar/serviceflow/pull/82 |
| 2 | `fix/service-ui-corrections-02-table-gutter` | `b01cf97a93ec802202106f656db788874a4b1b12` | `6c30e9bbba88b0dc1d9d438a436cee35f5652f94` | `d62d5c64848a281cd80ad88aa76f073edc6759c8` | #83 https://github.com/jonasotoaguilar/serviceflow/pull/83 |
| 3 | `fix/service-ui-corrections-03-shell-locations` | `a48b61b9fd5565683c2637d0dfc6799488ec700b` | `b4f5de7e1b581b5a5b0968a54c93d52496494419` (pre-progress-update) | `6c30e9bbba88b0dc1d9d438a436cee35f5652f94` | #84 https://github.com/jonasotoaguilar/serviceflow/pull/84 |

**Submit**: `gh stack submit --auto` after rebase — pushed and synced 3 branches; PRs #82/#83/#84 remain draft `type:feature` (`Closes #81` on #82, `Related to #81` on #83/#84), bases `main` / `fix/service-ui-corrections` / `fix/service-ui-corrections-02-table-gutter` verified via `gh stack view --json` and `gh pr view --json baseRefName,headRefName,isDraft`

**Dirty preservation**: `D ARCHITECTURE.md` + `M next-env.d.ts` + untracked `openspec/changes/service-ui-corrections/{design,exploration,preproposal,proposal,research,specs/*,ui-design}.md` + `.herdr/` preserved losslessly via `git stash push --include-untracked` before rebase and `git stash pop` after (temp stash `temp preserve before rebase correction 2026-09-02`); intentional `ARCHITECTURE.md` deletion remains uncommitted for unit 7 as designed

**Scope guard**: No slice 4 or new behavior implemented. No `git push` or `gh pr create` used; only `gh stack` primitives. No new tasks marked complete — `tasks.md` remains 1.1,1.2,2.1,2.2,3.1,3.2 [x], 4.1+ pending. This cumulative top-branch progress update is the sole change on `fix/service-ui-corrections-03-shell-locations`; committed as `docs(openspec): reconcile service-ui-corrections correction + rebased heads` if bytes changed.

**Rollback boundary (correction)**: Revert single commit `d62d5c6` on `fix/service-ui-corrections` — restores stale test (2 lines) without touching `app/api/services/route.ts`, dashboard, shell, or units 2/3. No production rollback needed.

## Evidence Revision
- Unit-1 Commit SHA: d62d5c64848a281cd80ad88aa76f073edc6759c8 (corrected; was 91e0ba9dc2db11699fe2b347a35234dbf7f45dfd)
- Unit-2 Commit SHA: 6c30e9bbba88b0dc1d9d438a436cee35f5652f94 (rebased; was b01cf97a93ec802202106f656db788874a4b1b12)
- Unit-3 Commit SHA: 9ea3dd263b171ce65161b88dfcf5a24c2c271332 (rebased pre-progress; includes docs reconcile 9ea3dd2)
- Unit-4 Commit SHA: 5982d2ba1cf89020fb1c78eb4c51f93257391e7b (new, stacked on 9ea3dd2; next SHA after this progress commit to be recorded)
- Unit-1 Attempt token: sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f
- Unit-2 Attempt token: sha256:d63ae090348edd269cd9a774adfbe082434e5e2f526f286b5d0fc03b1af2c911
- Unit-3 Attempt token: sha256:dadfd6658aab3f9fe389714e89d17b8312b4d6d406d9d6b7973ac76b61e16a3b
- Unit-4 Attempt token: sha256:6412aebf749250cce2424818c939a57f17782186f3338e60ca2338dde5680596 (unit-4-registro-create, stacked-to-main, max 800, parent settles)
- Correction Attempt token: sha256:6c818e5c736ba15f2fd16c05f659bb3481280596a36929f466f7ce8bb8bffded (unit-1-quality-correction, bounded)
- Test run: vitest 4.1.10, 21/21 registro-primary-surface (one-shot, before RED 5 failed), 105/105 shell+dashboard+registro, 460/460 full (with service-events-filters mock)
