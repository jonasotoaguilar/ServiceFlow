# Apply Progress — service-ui-corrections

**Change**: service-ui-corrections
**Mode**: Strict TDD
**Work Unit**: unit-2-table-gutter (Table gutter) — stacked on unit-1
**Attempt tokens**: 
- unit-1 `sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f`
- unit-2 `sha256:d63ae090348edd269cd9a774adfbe082434e5e2f526f286b5d0fc03b1af2c911`
**Date**: 2026-09-02
**Branch**: fix/service-ui-corrections-02-table-gutter (stacked on fix/service-ui-corrections)
**Stack strategy**: stacked-to-main (auto-chain, 800-line session budget, PR2 second slice)

## Completed Tasks

- [x] 1.1 RED `tests/unit/dashboard-operate-plus.test.tsx`: drop `toggleStatusInFilter`; replace-one; all-status omits; GET first token.
- [x] 1.2 GREEN `components/services/ServicesDashboard.tsx` + GET `app/api/services/route.ts`: `statusFilter: ServiceStatus | ""`; close on pick.
- [x] 2.1 RED same test: Acciones unclipped 1280/1366/1920; cards 390/375.
- [x] 2.2 GREEN `components/services/ServicesTable.tsx` `overflow-x-auto` + gutter; no parent clip.

## Files Changed (cumulative)

| File | Action | What Was Done |
|------|--------|---------------|
| `tests/unit/dashboard-operate-plus.test.tsx` | Modified (unit-1 + unit-2) | Unit-1: removed `toggleStatusInFilter` asserts, added exclusive scalar tests (27). Unit-2: added 5 gutter tests (overflow ownership, gutter, mobile cards, rendered DOM desktop/mobile) + fixed 390 structural expectation to require `hidden md:block overflow-x-auto` (now 32 tests) |
| `components/services/ServicesDashboard.tsx` | Modified (unit-1 + unit-2) | Unit-1: scalar `ServiceStatus \| ""` etc. Unit-2: removed `overflow-hidden` from table card wrapper (`bg-surface border rounded-sm relative`) so right gutter not clipped |
| `app/api/services/route.ts` | Modified (unit-1) | GET first allowlisted token only |
| `components/services/ServicesTable.tsx` | Modified (unit-2) | Desktop wrapper `hidden md:block overflow-x-auto custom-scrollbar`, table `min-w-[960px]` for stable gutter; mobile `md:hidden` cards unchanged |
| `openspec/changes/service-ui-corrections/tasks.md` | Modified | Marked 1.1,1.2,2.1,2.2 as [x] |
| `openspec/changes/service-ui-corrections/apply-progress.md` | Modified | Merged unit-1 + unit-2 progress, fixed unit-1 SHA placeholder |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/unit/dashboard-operate-plus.test.tsx` | Unit + Integration | ✅ 22/22 | ✅ 8 failed initially | ✅ 27/27 | ✅ 5 exclusive cases | ✅ Clean |
| 1.2 | `tests/unit/dashboard-operate-plus.test.tsx` + `app/api/services/route.ts` + `components/services/ServicesDashboard.tsx` | Unit | ✅ same | ✅ multi `join`/`includes` failed | ✅ 27/27 + tsc 0 | ✅ same 5 | ✅ `Set<ServiceStatus>` |
| 2.1 | `tests/unit/dashboard-operate-plus.test.tsx` | Unit + Integration (DOM) | ✅ 27/27 baseline (unit-1 GREEN) | ✅ 5 failed initially (overflow, min-w, parent clip, mobile md:hidden slice, rendered DOM overflow) | ✅ 32/32 | ✅ 5 gutter cases: overflow ownership, gutter+Acciones, mobile cards 390/375, rendered desktop overflow+min-w, rendered mobile no-scroll | ✅ Clean — slice fixes for class-before-data-testid, source regex robust |
| 2.2 | `components/services/ServicesTable.tsx` + `components/services/ServicesDashboard.tsx` | Unit | ✅ same baseline | ✅ same 5 RED | ✅ 32/32 + tsc 0 + biome 0 | ✅ same 5 | ✅ Minimal gutter: `overflow-x-auto` + `min-w-[960px]` only, no parent clip |

### Test Summary

- **Total tests**: 32 in `dashboard-operate-plus.test.tsx` (27 from unit-1 + 5 new gutter, 1 refactored 390 expectation)
- **Total passing**: 32/32
- **Layers**: Unit (source) + Integration (Testing Library DOM)
- **Approval tests**: None
- **Pure functions**: None

## Work Unit Evidence

### Unit-1 (Exclusive status)

| Evidence | Value |
|---|---|
| Focused test | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` — 27/27 (before 8 failed) |
| Runtime harness | N/A — typecheck `tsc --noEmit` 0, `biome check` 0, `format` pre-evidence |
| Rollback | Revert 3 code files to multi `ServiceStatus[]` etc |

### Unit-2 (Table gutter)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` — **1 passed, 32 passed, 0 failed** (after GREEN). Before GREEN: 1 failed, 5 failed / 27 passed. |
| Runtime harness command/scenario and exact result | N/A — jsdom cannot prove pixel geometry at 1280/1366/1920. Source/DOM ownership is verifiable contract: desktop `overflow-x-auto custom-scrollbar` + `min-w-[960px]`, parent not `overflow-hidden`, Acciones `flex-row` reachable, mobile `md:hidden` cards `flex-wrap` without table scroll. Typecheck `pnpm exec tsc --noEmit` 0 errors, `biome check --formatter-enabled=false` 0, `biome format --write` pre-evidence, no post-mutation. Rendered viewport proof (chrome-devtools at 1920/1366/1280/390/375) bounded to final verify, not fabricated. |
| Rollback boundary | Exact revert: `components/services/ServicesTable.tsx` (remove `overflow-x-auto` + `min-w-[960px]`), `components/services/ServicesDashboard.tsx` (restore `overflow-hidden` on card wrapper), `tests/unit/dashboard-operate-plus.test.tsx` (restore `expect(tbl).not.toMatch(/overflow-x-auto/)` and slice checks). No shell 2xl, Locations, registro, identity, RUT, custody changes. |

## Deviations from Design

None. Unit-1 scalar + close + single query. Unit-2 table region owns `overflow-x-auto custom-scrollbar`, parent avoids `overflow-hidden` clip, stable `min-w-[960px]` gutter, mobile cards unchanged, no page overflow. No shell 2xl (unit-3) touched.

## Issues Found

**Unit-1**:
- `tsc` `string[]` vs `ServiceStatus[]` — fixed with `Set<ServiceStatus>`.
- `container.textContent` contains metric "Pendientes" — fixed to trigger button check.
- `biome format` pre-evidence.

**Unit-2**:
- RED slices `tbl.slice(mobileIdx, +800)` missed `md:hidden` class because class is *before* `data-testid`; fixed to whole-file `toContain("md:hidden")` and `notMatch(/services-mobile-list.*overflow/)`.
- Same for desktop wrapper slice forward missing class — fixed to whole-file regex `hidden md:block[^"]*overflow-x-auto`.
- Initial parent `overflow-hidden` clipped gutter — removed from dashboard card wrapper.
- No shell 2xl widening done (intentionally deferred to unit-3 per scope).

## Remaining Tasks

- [ ] 3.1 RED `tests/unit/shell.test.ts`, `tests/unit/locations.test.ts`: `2xl:max-w-[1600px]`; Locations `text-2xl font-semibold tracking-tight`.
- [ ] 3.2 GREEN `app/(app)/layout.tsx`, `components/layout/Navbar.tsx`, `app/(app)/locations/locationsManager.tsx`.
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
- Current work unit: unit-2-table-gutter — Table gutter only. Starts from `fix/service-ui-corrections` @ `91e0ba9`, ends after overflow ownership + gutter + parent unclip. No shell, registro, identity, RUT, custody.
- Estimated review budget impact: **Unit-2**: ~35 lines changed (ServicesTable 2 lines + Dashboard 1 line + tests ~150 lines, but code-only ~5 lines for gutter). Cumulative code for PR2 slice: ~5 lines; PR2 as isolated stacked diff vs PR1 base: ~5 lines. Well within 800. No `size:exception`. Slice autonomous, rollback is 2 files.
- Previous unit-1 slice: ~519 lines (code) within 800, already merged in stack bottom.

## Status

4/13 tasks complete. Ready for next batch (unit-3 shell + Locations). Stack: bottom `fix/service-ui-corrections` (unit-1) @ `91e0ba9`, top `fix/service-ui-corrections-02-table-gutter` (unit-2) pending commit. No PR published; awaiting verification before `gh stack submit --auto`.

## Evidence Revision

- Unit-1 Commit SHA: 91e0ba9dc2db11699fe2b347a35234dbf7f45dfd (exclusive status)
- Unit-2 Commit SHA: 5d75d051c3a55e0688687be42c756e878b09c3a4 (table gutter)
- Unit-1 Attempt token: sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f
- Unit-2 Attempt token: sha256:d63ae090348edd269cd9a774adfbe082434e5e2f526f286b5d0fc03b1af2c911
- Test run: vitest 4.1.10, 32/32, jsdom
