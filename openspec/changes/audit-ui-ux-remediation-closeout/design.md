# Design: Audit UI/UX Remediation Closeout

## Technical Approach

Close frozen `audit-ui-ux-remediation` from `38640512f6119e4edde346158797be61dd62fff6`. Live `pr-check.yml` is `const limit = 400` + `size:exception` only. Install derived `DEFAULT_LIMIT = 800` overlay. Live 0.40.1 Admin then two-op `pb.createBatch().send()` (`A:enable_configure_batch_atomic`) with durable `operationKey` uniqueness. Mandatory Registro filter WU always-renders the existing panel before verify-ui. Predecessor stays `blocked`.

## Architecture Decisions

|Topic|Options|Tradeoff|Decision|
|---|---|---|---|
|PR gate|Verbatim / overlay / new ci.yml|Asset `const limit = 400` + `size:exception` only|Derived `DEFAULT_LIMIT = 800`; one `size:<N>` overrides; multiple numeric fail; `size:exception` warns. Keep four jobs, read-only perms, concurrency, issue/type, `github-script@v9`.|
|Writes|A batch / B sequential|B rejected (preproposal rev 3)|Drop `canBatch = false` sequential else on status, transfer, `updateService`. One two-op `send()`. `kind: created` stays out.|
|Enablement|Dashboard / env|No speculative config|Dashboard only after that env row exists. UNKNOWN until seen.|
|Idempotency|Re-read / platform key / app key|Re-read races; no evidenced platform key|Opaque `operationKey` + unique indexes.|
|Telemetry|console / vendor|Only `console.error` exists|One allowlisted JSON line.|
|Registro panel|Always-static / `showFilters` / new wrapper|Hides controls|Always mount existing surface container. Delete `showFilters`, outer toggle L144–152, outer ChevronDown, `{showFilters &&` L154. Static `h2` “FILTROS DE BÚSQUEDA” (current classes; not a button; no panel `aria-expanded`). Keep inner Tipo/Estado/Sede dropdowns/chevrons. Keep grid (wide row; 390px stack). No overflow-x; clear on-screen `min-h-11 min-w-11`. Preserve labels/date min-max. No `setPage` on field change; `clearFilters` still `setPage(1)`. Names on Desde, Hasta, Tipo, Estado, Sede, clear.|

## Data Flow

    Browser → route (getAuthUser + ownership) → sendLifecycleBatch → /api/batch
                    └── uid+sid+key lookup ──┘

    /service-events always-mounted panel: field change fetchLogs(page, filters); clearFilters empties + setPage(1)

## File Changes

Create: `.github/workflows/pr-check.yml`, `lib/lifecycle-batch.ts`, `tests/unit/lifecycle-batch.test.ts`, `tests/unit/pr-check.test.ts`, `tests/unit/service-events-filters.test.tsx`. Modify: `pocketbase/v1.collections.json`, `lib/types.ts`, `lib/pocketbase-filter.ts`, status/transfer routes, `lib/storage.ts`, `ServicesDashboard.tsx`, `docs/CODEBASE-GUIDE.md`. Mandatory: `app/(app)/service-events/serviceEventsManager.tsx` (outer disclosure off). Conditional: `ServicesTable.tsx` if verify-ui `remediation_required`. Frozen: predecessor, index, `openspec/config.yaml`. Do not change `getServiceEvents` query fields.

## Interfaces / Contracts

`sendLifecycleBatch(...)` throws `{ status, error, code }`.

**Key.** `Idempotency-Key` or `body.operationKey`; `^[A-Za-z0-9_-]{16,64}$`. UUID once per action until terminal 2xx/4xx. Invalid → 400 `INVALID_OPERATION_KEY`.

**Lookup.** `userId = {:uid} && ServiceId = {:sid} && operationKey = {:key}` plus `getAuthUser` ownership. Never key-only. Cross-tenant → 403 `NOT_FOUND`.

**Schema.** Keep ids `pbc_2579451501`/`pbc_863811952`. `operationKey` text max 64 optional on events; `lifecycleSeq` number optional on both; not missing=0. Unique `(ServiceId, operationKey)` and `(ServiceId, lifecycleSeq)`. Additive `deleteMissing:false`; no backfill; legacy NULL ok. Status/transfer set both (`lifecycleSeq: (service.lifecycleSeq ?? 0) + 1`). `kind: created` omits both. No platform key API.

**Reconcile.** match+to=200; mismatch=422 `OPERATION_KEY_REUSED`; absent+not-from=409 `TRANSITION_CONFLICT`; absent+from=send once. Timeout/5xx re-lookup. One same-key resend if absent+from else 500. Absent+to=500 (never sequential). 403 `/Batch requests are not allowed/i`=`BATCH_UNAVAILABLE`+runbook; never retry/sequential. Nested 4xx/tenant deny → 4xx, both rolled back. Same-key race: one event, loser 200. Diff-key same slot: one event, loser 409. Log `{event,outcome,code,kind,statusClass,keyFp}`; no raw key/token/PII.

## Testing Strategy

RED first. Filter proof is RTL, not source grep.

|Requirement / Scenario|Implementation|Tests|Verification|
|---|---|---|---|
|PR >800 unlabeled fails; `size:exception` warns; one `size:<N>` ok; two+ numeric fail; missing `status:approved` or 0/N `type:*` fail|`DEFAULT_LIMIT=800`; keep four jobs|`tests/unit/pr-check.test.ts`|installed 800, not `const limit=400`|
|second-op 4xx rolls back both; tenant deny 4xx; 403 `BATCH_UNAVAILABLE` no retry/sequential; timeout/races one event|two-op `send()`; unique indexes; scoped re-lookup|mock 4xx zero writes; other-tenant 403; 403 spies; timeout→200 one row; two keys→one+409|live unchanged; never 200 cross-tenant|
|Always-visible filters; no outer disclosure; no page reset; keyboard; clear → page 1|no `setPage` on fields; keep `clearFilters`|`tests/unit/service-events-filters.test.tsx`: render `ServiceEventsManager` (mock `getServiceEvents`; vitest+RTL+`fireEvent`); controls visible; heading not button; no outer `aria-expanded`; field change keeps `page`; clear → `page: 1`|verify-ui `/service-events`: initial, no disclosure, overflow/44px/wrap|
|fresh `pnpm test:run`, `tsc --noEmit`, `build`, `check` vs live PB 0.40.1 after filter WU|independent sdd-verify; mocks ≠ live||binds `38640512f6119e4edde346158797be61dd62fff6`|
|verify-ui `/dashboard`, `/locations`, `/service-events`; 1280×800 + 390×844; light/dark; normal/empty/validation/dialog/error/menu; overflow; English copy; auth unavailability `unavailable`/`blocked` never pass|parent auth; overflow eval||never pass if blocked|
|private auth/screenshots 0700/0600 + cleanup|0700/0600 + delete|||

## Threat Matrix

VCS/PR CLI rows N/A (no git/gh composition). Registro filter WU: N/A (no routing/shell/VCS/PR/process boundary).

|Boundary|Safe / fail|RED|
|---|---|---|
|Authn/tenant|401; 403 `NOT_FOUND` cross-tenant|401; other-tenant 403; never 200|
|Operation-key|scoped `uid+sid+key` + ownership; no oracle|invalid/replay/reuse; other-tenant 403; `keyFp` only|
|Atomic persistence|unique claim; timeout re-reconciles; no sequential|failed send: zero writes; unique: one event|
|Error disclosure|403 Spanish+runbook; no stack/secrets|403 body has no internals|
|Telemetry secrecy|allowlist only|forbids token/`pb_auth`/raw key|
|Live Admin config|missing env → no `/api/batch`|UNKNOWN env never sends batch|

## Migration / Rollout

Additive schema; no backfill; `deleteMissing:false`. Rollback: revert fields/indexes; `git rm .github/workflows/pr-check.yml`. Filter rollback: revert `serviceEventsManager.tsx` + `tests/unit/service-events-filters.test.tsx` only.

Slices under 800 / auto-chain: (1) `pr-check.yml` + GUIDE; (2) schema + types + pocketbase-filter; (3) helper + routes + storage + dashboard; (4) mandatory Registro filters + RTL RED (~120–220 authored; own stacked PR; not verify-gated); (5) verify-ui remediations if reproduced. Decision needed before apply: No. Chained PRs recommended: Yes. 800-line budget risk: High. Filter WU MUST land before final verification. Auto-chain does not authorize verify/archive/attempt. Acquire attempt only immediately before runtime apply/verify/remediation.

## Open Questions

- [ ] Dashboard path/fields/limits UNKNOWN until apply-time 0.40.1 Admin inspection.
