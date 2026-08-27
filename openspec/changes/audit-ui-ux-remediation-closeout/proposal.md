# Proposal: Audit UI/UX Remediation Closeout

## Intent

Close frozen-blocked `audit-ui-ux-remediation` from `38640512f6119e4edde346158797be61dd62fff6`: 800-line PR gate, atomic batch (`A:enable_configure_batch_atomic`), verify-ui, remediate only reproduced failures.

## Supersedes

Successor of frozen `audit-ui-ux-remediation`. `gentle-ai sdd-status` 2.5.0-rc.1 returns `supersedes: []`; this section is source of truth. Baseline hash is mandatory.

## Predecessor Frozen

Stays `blocked`. No archive, edits, settle/reset/finish, or staged-index mutation. Attempt `sha256:8e2c0ab0c41ed635faf5caa1cb54e910415d9d52707121f1a2d999e85e25d890` is historical only.

## Scope

### In Scope
- Copy ci-cd `pr-check.yml` verbatim (already `DEFAULT_LIMIT = 800`). 400→800 only if apply-time asset differs. Preserve every existing gate.
- Bounded live 0.40.1 Admin inspection before implement; document discovered Dashboard path/field/limits; enable dev/staging/prod. Official docs admit only Dashboard enablement/configuration.
- Two-op transactional batch (`services` update + `service_events` create); small JSON; no silent sequential fallback; error mapping; application retry; observability; 403 operator behavior.
- Verification vs baseline with authenticated verify-ui; remediate only reproduced failures.

### Out of Scope
- Predecessor mutation/archive/settle/reset/finish/index.
- Reopen rejected `B:sequential_writes_compensation` (no Dashboard config vs lost atomicity + compensation).
- Second pipeline, CSV, hosting, global `openspec/config.yaml`.
- Attempt acquire in propose; re-apply predecessor 21 tasks; invented Dashboard paths, `maxRequests`, or platform idempotency-key behavior.

## Capabilities

### New Capabilities
- `pull-request-review-budget`: canonical `pr-check.yml` at existing 800 default; all gates preserved.
- `pocketbase-batch-operations`: live-inspected enablement, env matrix, two-op atomic batch, 403 operator behavior, application retry.
- `audit-closeout-verification`: baseline-bound sdd-verify + authenticated verify-ui; remediate only `remediation_required`.

### Modified Capabilities
None

## Approach

Copy canonical `pr-check.yml` verbatim. Inspect live Admin UI; document actual batch control. Keep `pb.createBatch().send()` with those two ops. Map rule/validation sub-errors to 4xx; unexpected to 500; `403 Batch requests are not allowed` to operator failure + runbook, never sequential writes. Retry timeout/5xx only with application idempotency; never retry 403; no platform idempotency key unless inspection evidences one. Verify first; remediate only `remediation_required`. Propose acquires no attempt. Delivery `auto-chain`, 800 authored lines.

## Affected Areas

New: `.github/workflows/pr-check.yml`. Modified if reproduced: status/transfer routes, `ServicesTable.tsx`, `serviceEventsManager.tsx`. Frozen: `openspec/changes/audit-ui-ux-remediation/**`.

## Risks

Predecessor mutation (High: empty predecessor diff). Baseline identity loss (High: `git write-tree` stays `38640512f6119e4edde346158797be61dd62fff6` until authorized apply). Unknown batch path/403 (Med: live Admin inspection; operator runbook; no sequential fallback). Status `supersedes: []` (Low: declarative section; non-blocking). Scope creep (Med: reproduced failures only; auto-chain if >800).

## Rollback Plan

`git rm .github/workflows/pr-check.yml`. Disable Dashboard batch per documented path/env. Revert remediation commits.

## Dependencies

Preproposal rev 3; research rev 1; candidate `38640512f6119e4edde346158797be61dd62fff6`; PocketBase 0.40.1 Admin.

## Success Criteria

- [ ] Canonical `pr-check.yml` at observed 800 default; other gates intact; live Admin inspection documented; two-op atomic batch; 403 is operator failure, not sequential fallback
- [ ] sdd-verify + authenticated verify-ui pass, or remediations of reproduced failures pass
- [ ] Predecessor diff empty; baseline preserved until authorized apply; authored diff ≤800 or auto-chained
