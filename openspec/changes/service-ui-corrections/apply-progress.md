# Apply Progress — service-ui-corrections

**Change**: service-ui-corrections
**Mode**: Strict TDD
**Work Unit**: unit-1-exclusive-status (Exclusive status)
**Attempt token**: sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f
**Date**: 2026-09-02
**Branch**: fix/service-ui-corrections
**Stack strategy**: stacked-to-main (auto-chain, 800-line session budget, PR1 bottom slice)

## Completed Tasks

- [x] 1.1 RED `tests/unit/dashboard-operate-plus.test.tsx`: drop `toggleStatusInFilter`; replace-one; all-status omits; GET first token.
- [x] 1.2 GREEN `components/services/ServicesDashboard.tsx` + GET `app/api/services/route.ts`: `statusFilter: ServiceStatus | ""`; close on pick.

## Files Changed

| File | Action | What Was Done |
|------|--------|---------------|
| `tests/unit/dashboard-operate-plus.test.tsx` | Modified | Removed obsolete `toggleStatusInFilter` assertions; added exclusive scalar, single-query, close-on-pick, pointer/keyboard exclusive source + interactive tests (27 tests) |
| `components/services/ServicesDashboard.tsx` | Modified | `statusFilter: ServiceStatus | ""`; replaced toggle with replace-one; all-status `setStatusFilter("")` + close; query `params.set("status", statusFilter)` single; `hasActiveFilters`/`handleClearFilters`/`getSelectedLabel`/`isSelected` scalar; menu closes after pick |
| `app/api/services/route.ts` | Modified | GET accepts at most one allowlisted status: first comma token only, allowlist `pending/ready/completed/cancelled`, `status: ServiceStatus[] | undefined` with single element or omit |
| `openspec/changes/service-ui-corrections/tasks.md` | Modified | Marked 1.1 and 1.2 as [x] |
| `openspec/changes/service-ui-corrections/apply-progress.md` | Created | This progress file |

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/unit/dashboard-operate-plus.test.tsx` | Unit + Integration (Testing Library) | ✅ 22/22 baseline passing before edit | ✅ Written (8 failed initially, source + interactive exclusive) | ✅ Passed (27/27 after GREEN) | ✅ 5 exclusive cases: scalar/query/close, GET single, pointer replace+all-reset+no-comma, keyboard Enter/Space exclusive, second-does-not-remain | ✅ Clean — removed multi helpers, no duplication, scalar state |
| 1.2 | `tests/unit/dashboard-operate-plus.test.tsx` + `app/api/services/route.ts` (source assertions) + `components/services/ServicesDashboard.tsx` | Unit | ✅ Baseline same file | ✅ Written (RED failed on multi `join`, `includes`, `length`, `toggleStatusInFilter`, GET `split as any[]`) | ✅ Passed (typecheck + 27/27) | ✅ Triangulated via same 5 cases + scalar label/clear/close checks | ✅ Clean — single close behavior, allowlist Set<ServiceStatus> |

### Test Summary

- **Total tests written**: 27 in `dashboard-operate-plus.test.tsx` (19 preserved + 8 new exclusive, 3 refactored from obsolete toggle asserts)
- **Total tests passing**: 27/27
- **Layers used**: Unit (source assertions) + Integration (Testing Library render + fireEvent + waitFor)
- **Approval tests**: None — refactoring with behavior change, not preservation
- **Pure functions created**: None — state-driven UI, scalar filter is direct replacement

## Work Unit Evidence

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `pnpm test tests/unit/dashboard-operate-plus.test.tsx --run` — 1 passed, 27 passed, 0 failed (after GREEN). Before GREEN: 1 failed, 8 failed / 19 passed. |
| Runtime harness command/scenario and exact result | N/A — no runtime boundary for exclusive status slice. Design specifies no schema/pagination/tenant change; behavior is client filter + GET query. Typecheck `pnpm exec tsc --noEmit` passes (0 errors after ServiceStatus import fix). Lint `pnpm exec biome check --formatter-enabled=false` — 3 files checked, no errors. Formatter `biome format --write` applied before verification, no post-verification mutation. |
| Rollback boundary | Exact revert: `tests/unit/dashboard-operate-plus.test.tsx` (restore toggle asserts), `components/services/ServicesDashboard.tsx` (restore `ServiceStatus[]`, `toggleStatusInFilter`, `join(",")`, `length`/`includes` logic), `app/api/services/route.ts` (restore `statusParam.split(",") as any[]`). No other files or behaviors affected; metrics, loading, tenant isolation, pagination, query names, non-status filters, RUT/identity unchanged. |

## Deviations from Design

None — implementation matches design: scalar `statusFilter: ServiceStatus | ""`, close after pick, accurate label/active-filter/query, GET first allowlisted token only, no comma multi-select preservation, RUT/identity untouched.

## Issues Found

- `pnpm exec tsc --noEmit` initially failed: `string[]` not assignable to `ServiceStatus[]` in `app/api/services/route.ts` after exclusive change. Fixed by importing `ServiceStatus` and typing `Set<ServiceStatus>` + `ServiceStatus[]`.
- Interactive exclusive test initially asserted `container.textContent.notContain("Pendientes")` which falsely failed due to metric card containing same word. Fixed to assert trigger button text exclusively (`pendingTrigger` undefined, `finalTrig` === "Entregada").
- Formatting: `biome format --write` normalized 3 files before evidence capture.

## Remaining Tasks

- [ ] 2.1 RED same test: Acciones unclipped 1280/1366/1920; cards 390/375.
- [ ] 2.2 GREEN `components/services/ServicesTable.tsx` `overflow-x-auto` + gutter; no parent clip.
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

- Mode: stacked PR slice (auto-chain)
- Current work unit: unit-1-exclusive-status (Exclusive status)
- Boundary: dashboard + GET status exclusive only. Starts from `fix/service-ui-corrections` HEAD 9b48a79, ends after scalar status + GET single token. No parent overflow, shell, registro, identity, RUT, custody, docs changes.
- Estimated review budget impact: ~517 changed lines (328 insertions + 189 deletions across 3 code files; tasks/progress excluded from budget). Within 800-line session budget. No `size:exception` needed. Slice is autonomous with focused tests + typecheck/lint.

## Status

2/13 tasks complete. Ready for next batch (unit-2 table gutter). Stack bottom `fix/service-ui-corrections` holds unit-1. No PR published yet; awaiting parent orchestrator verification before `gh stack submit --auto` (draft).

## Evidence Revision

- Commit SHA: pending (to be filled after work-unit commit)
- Attempt token: sha256:66f7c75e9e2d9d31226dbf0d6eb069a79d8ed1a4f080141efae09fb7b67da65f
- Test run hash: vitest 4.1.10, 27/27, jsdom
