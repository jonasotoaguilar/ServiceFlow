# Apply Progress — service-ui-corrections

**Change**: service-ui-corrections
**Mode**: Strict TDD
**Work Unit**: unit-3-shell-locations (Shell + Locations) — stacked on unit-2
**Attempt tokens**: 
- unit-1 `sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f`
- unit-2 `sha256:d63ae090348edd269cd9a774adfbe082434e5e2f526f286b5d0fc03b1af2c911`
- unit-3 `sha256:dadfd6658aab3f9fe389714e89d17b8312b4d6d406d9d6b7973ac76b61e16a3b`
**Date**: 2026-09-02
**Branch**: fix/service-ui-corrections-03-shell-locations (stacked on fix/service-ui-corrections-02-table-gutter)
**Stack strategy**: stacked-to-main (auto-chain, 800-line session budget, PR3 third slice)

## Completed Tasks

- [x] 1.1 RED `tests/unit/dashboard-operate-plus.test.tsx`: drop `toggleStatusInFilter`; replace-one; all-status omits; GET first token.
- [x] 1.2 GREEN `components/services/ServicesDashboard.tsx` + GET `app/api/services/route.ts`: `statusFilter: ServiceStatus | ""`; close on pick.
- [x] 2.1 RED same test: Acciones unclipped 1280/1366/1920; cards 390/375.
- [x] 2.2 GREEN `components/services/ServicesTable.tsx` `overflow-x-auto` + gutter; no parent clip.
- [x] 3.1 RED `tests/unit/shell.test.ts`, `tests/unit/locations.test.ts`: `2xl:max-w-[1600px]`; Locations `text-2xl font-semibold tracking-tight`.
- [x] 3.2 GREEN `app/(app)/layout.tsx`, `components/layout/Navbar.tsx`, `app/(app)/locations/locationsManager.tsx`. Check tests.

## Files Changed (cumulative)

| File | Action | What Was Done |
|------|--------|---------------|
| `tests/unit/dashboard-operate-plus.test.tsx` | Modified (unit-1 + unit-2) | Unit-1 exclusive scalar + Unit-2 gutter (32 tests) |
| `components/services/ServicesDashboard.tsx` | Modified (unit-1 + unit-2) | Scalar status + parent unclip |
| `app/api/services/route.ts` | Modified (unit-1) | GET first allowlisted token only |
| `components/services/ServicesTable.tsx` | Modified (unit-2) | `overflow-x-auto custom-scrollbar` + `min-w-[960px]` |
| `tests/unit/shell.test.ts` | Modified (unit-3) | Added 5 2xl/shell rhythm tests (max-w-7xl 2xl:max-w-[1600px] shared, no 2xl at 1280, Locations header/toolbar band) |
| `tests/unit/locations.test.ts` | Modified (unit-3) | Added 3 Locations rhythm tests (title 2xl, toolbar border-y band, shell inheritance) |
| `app/(app)/layout.tsx` | Modified (unit-3) | `max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8` |
| `components/layout/Navbar.tsx` | Modified (unit-3) | Inner row `max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8` |
| `app/(app)/locations/locationsManager.tsx` | Modified (unit-3) | Header `text-2xl font-semibold tracking-tight` + toolbar `border-y bg-surface/50 px-4 py-3 mb-6` (was card `bg-surface border shadow-sm p-4 rounded-sm`) |
| `openspec/changes/service-ui-corrections/tasks.md` | Modified | Marked 1.1,1.2,2.1,2.2,3.1,3.2 as [x] |
| `openspec/changes/service-ui-corrections/apply-progress.md` | Modified | Merged unit-1 + unit-2 + unit-3, corrected unit-2 SHA to b01cf97 |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/unit/dashboard-operate-plus.test.tsx` | Unit+Integration | ✅ 22/22 | ✅ 8 failed | ✅ 27/27 | ✅ 5 exclusive | ✅ Clean |
| 1.2 | `tests/unit/dashboard-operate-plus.test.tsx` + `app/api/services/route.ts` + `components/services/ServicesDashboard.tsx` | Unit | ✅ same | ✅ multi `join` failed | ✅ 27/27 + tsc 0 | ✅ same 5 | ✅ `Set<ServiceStatus>` |
| 2.1 | `tests/unit/dashboard-operate-plus.test.tsx` | Unit+Integration DOM | ✅ 27/27 | ✅ 5 failed (overflow, min-w, parent clip) | ✅ 32/32 | ✅ 5 gutter | ✅ slice fixes |
| 2.2 | `components/services/ServicesTable.tsx` + `components/services/ServicesDashboard.tsx` | Unit | ✅ same | ✅ same 5 | ✅ 32/32 + tsc 0 + biome 0 | ✅ same 5 | ✅ Minimal gutter |
| 3.1 | `tests/unit/shell.test.ts` + `tests/unit/locations.test.ts` | Unit | ✅ 44/44 baseline (shell+locations before unit-3) | ✅ **8 failed** (2xl missing, title old, toolbar card) | ✅ **52/52** | ✅ 8 cases: layout 2xl, Navbar shared, no 2xl at 1280, per-page no duplicate, Locations h1 2xl, toolbar border-y, shell inheritance (x2) | ✅ Fixed xl substring false positive, h1 whitespace |
| 3.2 | `app/(app)/layout.tsx` + `components/layout/Navbar.tsx` + `app/(app)/locations/locationsManager.tsx` | Unit | ✅ same baseline | ✅ same 8 | ✅ 52/52 + 84/84 with dashboard-operate-plus + tsc 0 + biome 0 | ✅ same 8 | ✅ Minimal 2xl + title + band, no per-page widths |

### Test Summary

- **Total tests**: 52 in shell+locations (44 baseline + 8 new), 32 in dashboard-operate-plus, 84 combined
- **Total passing**: 52/52 shell+locations, 32/32 dashboard, 84/84 combined
- **Layers**: Unit (source)
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

## Deviations from Design
None. Unit-3 implements shared `max-w-7xl 2xl:max-w-[1600px]` in main and Navbar, no 2xl at 1280, Locations title `text-2xl font-semibold tracking-tight`, header `gap-4 mb-6`, toolbar `border-y bg-surface/50 px-4 py-3`. Preserves mobile gutters, nav behavior, Locations functionality.

## Issues Found
**Unit-1**: tsc `string[]` vs `ServiceStatus[]` fixed; metric Pendientes overlap fixed.
**Unit-2**: slice before data-testid missed class; parent overflow-hidden clipped gutter.
**Unit-3**:
- `xl:max-w-[1600px]` substring false positive in `2xl:max-w` — fixed to count `max-w-[1600px]` occurrences =1 and check `2xl:` prefix only, not `lg`.
- `text-xl font-bold` globally matched stats card `text-xl font-bold` — fixed to h1-specific regex `/<h1[^>]*text-2xl[^>]*>\s*Gestión/`.
- `shadow-sm p-4 rounded-sm Toolbar` cross-matched stats card before Toolbar comment — fixed to exact card string `bg-surface border border-border shadow-sm p-4 mb-6`.
- Formatter normalized 5 files pre-evidence.

## Remaining Tasks
- [ ] 4.1 RED `tests/unit/registro-primary-surface.test.tsx`: true-empty `push("/dashboard?createService=1")`; etc.
- [ ] 4.2 GREEN `app/(app)/service-events/serviceEventsManager.tsx`, `app/(app)/dashboard/page.tsx`, `ServicesDashboard.tsx` create trigger.
- [ ] 5.1 RED `tests/schemas.test.ts`, `tests/services-lifecycle.test.ts`: PUT 400 `IDENTITY_PROTECTED`; etc.
- [ ] 5.2 GREEN `lib/schemas.ts`, `app/api/services/route.ts`, `lib/storage.ts`, `components/services/ServicesModal.tsx`.
- [ ] 6.1 RED `tests/unit/rut.test.ts`, `tests/pocketbase-filter.test.ts`: `isRutShapedLookup`; etc.
- [ ] 6.2 GREEN `lib/rut.ts`, `lib/pocketbase-filter.ts`, GET search.
- [ ] 7.1 RED receipt/shell tests + `tests/unit/visual.test.ts`
- [ ] 7.2 GREEN custody/lockup assets
- [ ] 7.3 GREEN `git rm ARCHITECTURE.md`; guide/config cleanup

## Workload / PR Boundary
- Mode: stacked PR slice (auto-chain, stacked-to-main)
- Current work unit: unit-3-shell-locations — shared shell + Locations rhythm only. Starts from `fix/service-ui-corrections-02-table-gutter` @ `b01cf97`, ends after 2xl widths + Locations title/toolbar band. No registro create, identity, RUT, custody.
- Estimated review budget impact: **Unit-3** code-only ~4 lines (layout 1, Navbar 1, locationsManager 2) + tests ~80 lines, but stacked diff vs previous top is 4 code lines + 80 test lines = ~84 lines (code) or 272 total with tasks/progress. Well within 800. No `size:exception`. Slice autonomous, rollback is 3 files + 2 test files.
- Previous slices: unit-1 ~519 lines, unit-2 ~9 lines, cumulative code ~532.

## Status
6/13 tasks complete. Ready for next batch (unit-4 registro create). Stack: bottom `fix/service-ui-corrections` @ `91e0ba9`, middle `fix/service-ui-corrections-02-table-gutter` @ `b01cf97`, top `fix/service-ui-corrections-03-shell-locations` pending commit. No PR published; awaiting verification before `gh stack submit --auto`.

## Evidence Revision
- Unit-1 Commit SHA: 91e0ba9dc2db11699fe2b347a35234dbf7f45dfd
- Unit-2 Commit SHA: b01cf97a93ec802202106f656db788874a4b1b12
- Unit-3 Commit SHA: pending (to be filled after work-unit commit on `fix/service-ui-corrections-03-shell-locations`)
- Unit-1 Attempt token: sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f
- Unit-2 Attempt token: sha256:d63ae090348edd269cd9a774adfbe082434e5e2f526f286b5d0fc03b1af2c911
- Unit-3 Attempt token: sha256:dadfd6658aab3f9fe389714e89d17b8312b4d6d406d9d6b7973ac76b61e16a3b
- Test run: vitest 4.1.10, 52/52 shell+locations, 84/84 combined
