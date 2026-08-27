# Tasks: Audit UI/UX Remediation Closeout

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1030 (60+200+120+650) |
| 400-line budget risk | High |
| 800-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | WU1→WU2→WU3→WU4 stacked-to-main; WU5 verify |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
800-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | PB 0.40.1 Admin + GUIDE matrix | PR1 | `pnpm exec tsc --noEmit` | Live Admin dev/staging/prod | Revert GUIDE |
| 2 | Derived `pr-check.yml` 800 | PR2 | `pnpm vitest run tests/unit/pr-check.test.ts` | label dry-run | `git rm pr-check.yml` |
| 3 | Schema keys + indexes | PR3 | `pnpm test:run tests/schema-artifact.test.ts` | PB import dry-run | Revert `v1.collections.json` |
| 4 | 2-op batch helper + routes | PR4 | `pnpm vitest run tests/unit/lifecycle-batch.test.ts` | Live PB `/api/batch` | Revert helper + routes |
| 5 | Verify after WU1-4; conditional fix | verify | `pnpm test:run && pnpm exec tsc --noEmit && pnpm run build && pnpm check` | Live PB + playwright | Delete 0700/0600 temps |

## Phase 1: Prerequisite — Admin (WU1)

- [x] 1.1 RED `tests/unit/codebase-guide-batch.test.ts` expects matrix in `docs/CODEBASE-GUIDE.md`
- [x] 1.2 Inspect live PB 0.40.1 Admin per env; record path/fields/limits; keep UNKNOWN until seen
- [x] 1.3 Update `docs/CODEBASE-GUIDE.md` matrix + 403 runbook; gate UNKNOWN envs; verify `git write-tree` = `38640512f6119e4edde346158797be61dd62fff6`

## Phase 2: Derived PR Gate 800 (WU2)

- [x] 2.1 RED `tests/unit/pr-check.test.ts` (>800 fails, one `size:<N>` ok, two+ fail, exception warns)
- [x] 2.2 Copy `assets/workflows/pr-check.yml` (`limit=400`) to `.github/workflows/pr-check.yml`; set `DEFAULT_LIMIT=800` if 400
- [x] 2.3 Keep 4 jobs, `read` perms, concurrency, `github-script@v9`; `actionlint` + vitest green

## Phase 3: Additive Schema (WU3)

- [ ] 3.1 RED `tests/schema-artifact.test.ts` for `operationKey`/`lifecycleSeq` optional, unique `(ServiceId,operationKey)`/`(ServiceId,lifecycleSeq)`, `kind:created` omits
- [ ] 3.2 Update `pocketbase/v1.collections.json` additively; keep IDs; `deleteMissing:false`
- [ ] 3.3 Update `lib/types.ts` + `lib/pocketbase-filter.ts`; `pnpm test:run` + `tsc --noEmit` pass

## Phase 4: Atomic Batch (WU4)

- [ ] 4.1 RED 401/403 via `uid+sid+key` + `getAuthUser`; invalid `^[A-Za-z0-9_-]{16,64}$`→400; reuse→422; second-op 4xx→0 writes; 403 no retry/sequential; timeout→re-lookup; races 200/409
- [ ] 4.2 Create `lib/lifecycle-batch.ts` `sendLifecycleBatch` (validate, scoped lookup, reconcile 200/422/409/500, never sequential, log `{event,outcome,code,kind,statusClass,keyFp}`)
- [ ] 4.3 Integrate `app/api/services/[id]/status/route.ts` + `transfer/route.ts` + `lib/storage.ts` + `ServicesDashboard.tsx` (UUID per submit); map 400/403/409/422/500
- [ ] 4.4 GREEN `tests/unit/lifecycle-batch.test.ts` proves rollback + one event; `pnpm test:run` green

## Phase 5: Independent Verification (WU5)

- [ ] 5.1 Acquire native attempt only before runtime; bind `38640512f6119e4edde346158797be61dd62fff6`; predecessor `blocked`
- [ ] 5.2 Run `pnpm test:run` + `tsc --noEmit` + `build` + `check` vs live PB 0.40.1
- [ ] 5.3 Auth verify-ui in `sdd-verify`: `/dashboard` `/locations` `/service-events` 1280×800+390×844 light/dark normal/empty/validation/dialog/error/menu `snapshot --boxes`+`screenshot`+`eval`
- [ ] 5.4 Enforce 0700/0600 + cleanup; `unavailable`/`blocked` never pass; overflow/English→`remediation_required`; `sdd-verify-validate`; fix `ServicesTable.tsx` only if required
