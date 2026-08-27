# Design: Audit UI/UX Remediation Closeout

## Technical Approach

Close frozen `audit-ui-ux-remediation` from `38640512f6119e4edde346158797be61dd62fff6`. Live `pr-check.yml` is `const limit = 400` + `size:exception` only. Install derived `DEFAULT_LIMIT = 800` overlay. Live 0.40.1 Admin inspection then two-op `pb.createBatch().send()` (`A:enable_configure_batch_atomic`) with durable `operationKey` uniqueness. Baseline verify-ui; remediate only reproduced `remediation_required`. No attempt. Predecessor stays `blocked`.

## Architecture Decisions

|Topic|Options|Tradeoff|Decision|
|---|---|---|---|
|PR gate|Verbatim / overlay / new ci.yml|Asset `const limit = 400` + `size:exception` only|Snapshot once. Derived `DEFAULT_LIMIT = 800`; one `size:<N>` overrides; multiple numeric labels fail; `size:exception` warns. Keep four jobs, read-only perms, concurrency, issue/type, `github-script@v9`. Not the 400 asset.|
|Writes|A batch / B sequential|B rejected (preproposal rev 3)|Drop `canBatch = false` sequential else on status, transfer, location-change `updateService`. One two-op `send()`. `kind: created` stays out.|
|Enablement|Dashboard / env|No speculative config|Dashboard only after that env row exists. UNKNOWN until seen.|
|Idempotency|Re-read / platform key / app key|Re-read races; no evidenced platform key|Opaque `operationKey` + unique indexes. No new package.|
|Telemetry|console / vendor|Only `console.error` exists|One allowlisted JSON line; fingerprint only.|

## Data Flow

    Browser → route (getAuthUser + ownership) → sendLifecycleBatch → /api/batch
                    └── uid+sid+key lookup ──┘

## File Changes

Create: `.github/workflows/pr-check.yml`, `lib/lifecycle-batch.ts`, `tests/unit/lifecycle-batch.test.ts`, `tests/unit/pr-check.test.ts`. Modify: `pocketbase/v1.collections.json` (keep ids), `lib/types.ts`, `lib/pocketbase-filter.ts`, status/transfer routes, `lib/storage.ts`, `ServicesDashboard.tsx` (one key per submit), `docs/CODEBASE-GUIDE.md`, schema tests. Conditional: `ServicesTable.tsx`, `serviceEventsManager.tsx` if verify-ui `remediation_required`. Frozen: predecessor, index, `openspec/config.yaml`.

## Interfaces / Contracts

`sendLifecycleBatch(...)` throws `{ status, error, code }`.

**Key.** `Idempotency-Key` or `body.operationKey`; `^[A-Za-z0-9_-]{16,64}$`. Client UUID once per action; reuse until terminal 2xx/4xx. Invalid → 400 `INVALID_OPERATION_KEY`.

**Lookup.** Every lookup is scoped by `ServiceId`, `operationKey`, API rule `userId = @request.auth.id`, and `getAuthUser` ownership (`current.userId === user.id`). Binding: `userId = {:uid} && ServiceId = {:sid} && operationKey = {:key}`. Never key-only. Cross-tenant replay → 403 `NOT_FOUND`; no oracle.

**Schema** (keep `service_events` `pbc_2579451501`, `services` `pbc_863811952`): `operationKey` text max 64 required false no default on events; `lifecycleSeq` number required false no default on both. Not `missing=0`. Unique `idx_service_events_ServiceId_operationKey` `(ServiceId, operationKey)` and `idx_service_events_ServiceId_lifecycleSeq` `(ServiceId, lifecycleSeq)`. Additive `pocketbase-init` import `deleteMissing:false`; no backfill. Legacy rows keep both absent/NULL. Unique indexes permit multiple legacy NULLs. New status/transfer MUST populate both (`lifecycleSeq: (service.lifecycleSeq ?? 0) + 1` in app only). `kind: created` omits both. No platform idempotency API.

**Reconcile.** match+to-state=200; mismatch=422 `OPERATION_KEY_REUSED`; absent+not-from=409 `TRANSITION_CONFLICT`; absent+from=send once. Timeout/5xx → scoped re-lookup, not success. One same-key resend if still absent+from; then 500. Absent+to-state=500 (never sequential). 403 `/Batch requests are not allowed/i`=`BATCH_UNAVAILABLE`+runbook; never retry; never sequential. Nested 4xx → same-class, both rolled back. Tenant/API deny → 4xx, both rolled back. Same-key race: unique `operationKey` → one event, loser 200. Different keys, same slot: unique `lifecycleSeq` → one event, loser 409. Log `{event,outcome,code,kind,statusClass,keyFp}`; never raw key/token/PII.

## Testing Strategy

RED before production. Mocks ≠ live.

|Requirement / Scenario|Implementation|Tests|Verification|
|---|---|---|---|
|PR >800 no override/exception fails|`DEFAULT_LIMIT=800`; unlabeled fail; split/auto-chain only|`tests/unit/pr-check.test.ts`|installed 800, not `const limit=400`|
|`size:exception` warns and passes|warning then pass|fixture >800 + exception|warning path|
|one numeric `size:<N>`; multiple numeric fail|one overrides; two+ fail|both cases|overlay script|
|missing `status:approved` or 0/N `type:*` fail|keep issue/type jobs|unapproved; 0 and 2 `type:*`|four jobs intact|
|second-op validation rollback both, 4xx|two-op `send()`; nested 4xx; neither persists|mock create 4xx → zero writes|live service unchanged|
|tenant/API deny rollback both, 4xx|ownership + `userId=@request.auth.id`|other-tenant 403; no 500|live never 200|
|403 batch: operator/runbook, no retry, no sequential|`BATCH_UNAVAILABLE`; one send|403 spies; no sequential|operator-only|
|timeout/5xx + same-key/diff-key races: one event|unique indexes; scoped re-lookup; never sequential|timeout→200 one row; two keys→one+409|live one row|
|fresh `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run build`, `pnpm check` vs live PB 0.40.1|independent sdd-verify; mocks ≠ live|exact exits|binds `38640512f6119e4edde346158797be61dd62fff6`|
|verify-ui `/dashboard`, `/locations`, `/service-events` (Registro); 1280×800 + 390×844; light/dark; normal/empty/validation/dialog/error/menu; mobile overflow; English copy; auth/app unavailability `unavailable`/`blocked` never pass|parent auth; exact routes; overflow eval|those cells|never pass if blocked|
|private auth/screenshots 0700/0600 + cleanup|dir 0700, files 0600; delete unless parent retains|temp gone; no secrets|cleanup listed|

## Threat Matrix

VCS/PR CLI rows N/A (no git/gh composition).

|Boundary|Safe / fail|RED|
|---|---|---|
|Authn/tenant|401; 403 `NOT_FOUND` cross-tenant; fail-closed|401; other-tenant 403; never 200|
|Operation-key|scoped `uid+sid+key` + ownership; no oracle|invalid/replay/reuse; other-tenant 403; `keyFp` only|
|Atomic persistence|unique claim; timeout re-reconciles; no sequential|failed send: zero writes; unique: one event|
|Error disclosure|403 Spanish+runbook; no stack/secrets|403 body has no internals|
|Telemetry secrecy|allowlist only|forbids token/`pb_auth`/raw key|
|Live Admin config|missing env → no `/api/batch`|UNKNOWN env never sends batch|

## Migration / Rollout

Additive schema; no backfill; `deleteMissing:false`; legacy NULL kept. Rollback: revert fields/indexes and re-import. Sequential writes are not rollback. Disable Dashboard batch per documented path. `git rm .github/workflows/pr-check.yml`.

Slices under 800 / auto-chain: (1) derived `pr-check.yml` + CODEBASE-GUIDE; (2) schema + types + filter + tests; (3) helper + routes + storage + dashboard key + unit tests; (4) verify-ui remediations only if reproduced. Decision needed before apply: No. Chained PRs recommended: Yes. 800-line budget risk: High. Auto-chain does not authorize verify/archive/attempt. Acquire attempt only immediately before runtime apply/verify/remediation.

## Open Questions

- [ ] Dashboard path/fields/limits UNKNOWN until apply-time 0.40.1 Admin inspection.
