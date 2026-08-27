# Tasks: Audit UI/UX Remediation Closeout

## Review Workload Forecast

|Field|Value|
|---|---|
|Estimated changed lines|~1243 (25+278+120+650+170) excl. planning PR|
|400-line budget risk|High|
|800-line budget risk|High|
|Chained PRs recommended|Yes|
|Suggested split|WU1→WU2→WU3→WU4→WU5→WU6 stacked-to-main; WU6 verify|
|Delivery strategy|auto-chain|
|Chain strategy|stacked-to-main|

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
800-line budget risk: High

### Suggested Work Units

|Unit|Goal|PR|Focused test command|Runtime harness|Rollback boundary|
|---|---|---|---|---|---|
|1|Admin+GUIDE|PR1|`pnpm vitest run tests/unit/codebase-guide-batch.test.ts`|Admin|Revert GUIDE|
|2|pr-check 800|PR2|`pnpm vitest run tests/unit/pr-check.test.ts`|label dry-run|`git rm pr-check.yml`|
|3|Schema|PR3|`pnpm test:run tests/schema-artifact.test.ts`|PB import|Revert `v1.collections.json`|
|4|Batch|PR4|`pnpm vitest run tests/unit/lifecycle-batch.test.ts`|batch|Revert helper+routes|
|5|Registro filters|PR5|`pnpm vitest run tests/unit/service-events-filters.test.tsx && tsc --noEmit`|`/service-events`|Revert `serviceEventsManager.tsx`+test|
|6|Verify|verify|`pnpm test:run && tsc --noEmit && build && check`|PB+playwright|Delete temps|

## Phase 1: Admin (WU1)

- [x] 1.1 RED `tests/unit/codebase-guide-batch.test.ts` expects matrix in `docs/CODEBASE-GUIDE.md`
- [x] 1.2 Inspect PB 0.40.1 Admin; record path/fields/limits; UNKNOWN until seen
- [x] 1.3 Update `docs/CODEBASE-GUIDE.md` matrix+runbook; gate UNKNOWN; `write-tree`=`38640512f...`

## Phase 2: PR Gate 800 (WU2)

- [x] 2.1 RED `tests/unit/pr-check.test.ts` (>800 fails one `size:<N>` ok two+ fail exception warns)
- [x] 2.2 Copy `assets/workflows/pr-check.yml`→`.github/workflows/pr-check.yml`; `DEFAULT_LIMIT=800` if 400
- [x] 2.3 Keep 4 jobs `read` perms concurrency `github-script@v9`; `actionlint`+vitest green

## Phase 3: Schema (WU3)

- [x] 3.1 RED `tests/schema-artifact.test.ts` `operationKey`/`lifecycleSeq` optional unique `(ServiceId,operationKey)`/`(ServiceId,lifecycleSeq)` `kind:created` omits
- [x] 3.2 Update `pocketbase/v1.collections.json` additively; keep IDs; `deleteMissing:false`
- [x] 3.3 Update `lib/types.ts`+`lib/pocketbase-filter.ts`; `test:run`+`tsc` pass

## Phase 4: Batch (WU4)

- [x] 4.1 RED 401/403 `uid+sid+key`+`getAuthUser`; invalid `^[A-Za-z0-9_-]{16,64}$`→400 reuse→422 second-op 4xx→0 writes 403 no retry timeout→re-lookup races 200/409
- [x] 4.2 Create `lib/lifecycle-batch.ts` `sendLifecycleBatch` (validate lookup reconcile 200/422/409/500 never sequential)
- [x] 4.3 Integrate `app/api/services/[id]/status/route.ts`+`transfer/route.ts`+`lib/storage.ts`+`ServicesDashboard.tsx` UUID map 400/403/409/422/500
- [x] 4.4 GREEN `tests/unit/lifecycle-batch.test.ts` rollback+one event; `test:run` green

## Phase 5: Registro Filters (WU5)

- [x] 5.1 RED `tests/unit/service-events-filters.test.tsx` (Vitest+jsdom+RTL+fireEvent mock `getServiceEvents`): controls visible first paint heading is static `h2` not button no outer `aria-expanded` inner dropdowns interactive filter changes preserve current page (e.g. page 2 remains page 2 while requerying) and clear resets to page 1
- [x] 5.2 Implement `app/(app)/service-events/serviceEventsManager.tsx`: remove ONLY outer disclosure `showFilters`, outer toggle button, outer heading `ChevronDown`, and outer conditional wrapper `{showFilters &&}`; static `h2` always grid; preserve inner Tipo/Estado/Sede dropdown states, buttons, chevrons, menus, and legitimate inner `aria-expanded` semantics
- [x] 5.3 GREEN responsive/a11y: wide row 390px stack/wrap no overflow-x clear >=44px `min-h-11 min-w-11` labels/focus
- [x] 5.4 Verify `pnpm vitest run tests/unit/service-events-filters.test.tsx`+`tsc`+`check`; rollback manager+test only

## Phase 6: Verification (WU6)

- [ ] 6.1 Acquire native verification authority against CURRENT post-WU5 successor candidate identity; prove candidate descends from/preserves starting baseline tree `38640512f6119e4edde346158797be61dd62fff6` and predecessor stays `blocked`; do NOT bind final verification to obsolete initial tree
- [ ] 6.2 Run `test:run`+`tsc`+`build`+`check` vs PB 0.40.1
- [ ] 6.3 Auth verify-ui: `/service-events` first-paint visible no OUTER disclosure/chevron/`aria-expanded` on filter panel (inner dropdown chevrons/menus/`aria-expanded` remain expected and interactive) keyboard 1280×800+390×844 light/dark no overflow clear>=44px; `/dashboard` `/locations` `snapshot --boxes`+`screenshot`+`eval`; unavailable→blocked never pass
- [ ] 6.4 Enforce 0700/0600+cleanup; overflow/English→`remediation_required`; `sdd-verify-validate`; fix `ServicesTable.tsx` only if reproduced
