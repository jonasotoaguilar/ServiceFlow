# Proposal: Audit UI/UX Remediation Closeout

## Intent

Close frozen-blocked `audit-ui-ux-remediation` from `38640512f6119e4edde346158797be61dd62fff6`: 800-line PR gate, atomic batch (`A:enable_configure_batch_atomic`), always-visible Registro filters.

## Supersedes

`gentle-ai sdd-status` 2.5.0-rc.1 returns `supersedes: []`; source of truth. Baseline hash is mandatory.

## Predecessor Frozen

Stays `blocked`. No archive, edits, settle/reset/finish, or staged-index mutation. Attempt `sha256:8e2c0ab0c41ed635faf5caa1cb54e910415d9d52707121f1a2d999e85e25d890` is historical.

## Scope

### In Scope
- Copy ci-cd `pr-check.yml` verbatim (`DEFAULT_LIMIT = 800`). 400→800 only if apply-time asset differs. Preserve every existing gate.
- Live 0.40.1 Admin inspection; document Dashboard path/field/limits; enable all envs.
- Two-op transactional batch (`services` update + `service_events` create); no silent sequential fallback; 403 operator behavior.
- **Mandatory, not verify-gated:** always-visible Registro `/service-events` filters; remove `showFilters`/toggle/chevron/conditional render; keep Desde, Hasta, Tipo, Estado, Sede, clear; wrap/stack, no expand.
- Verify-ui vs baseline; remediate only reproduced failures (not the filter mandate).

### Out of Scope
Predecessor mutation/archive/settle/reset/finish/index; reopen `B:sequential_writes_compensation`; second pipeline, CSV, hosting, global `openspec/config.yaml`; attempt acquire in propose; re-apply predecessor 21 tasks; invented Dashboard paths/`maxRequests`/platform idempotency-key; filter query semantics, new fields, restyle beyond always-visible layout.

## Capabilities

### New Capabilities
- `pull-request-review-budget`: `pr-check.yml` at 800 default; all gates preserved.
- `pocketbase-batch-operations`: live-inspected enablement, small JSON, two-op atomic batch, 403 operator behavior, application retry, observability.
- `audit-closeout-verification`: baseline-bound sdd-verify + authenticated verify-ui; remediate only `remediation_required`.
- `registro-filter-visibility`: always-visible `/service-events` filters; no outer collapse; date/dropdown/clear stay interactive; wrap/stack; keyboard/a11y; no horizontal overflow.

### Modified Capabilities
None

## Approach

Copy `pr-check.yml`. Keep `pb.createBatch().send()` two ops. Rule/validation → 4xx; unexpected → 500; 403 → operator failure + runbook, never sequential writes. Retry timeout/5xx with application idempotency; never 403; no platform idempotency key unless inspection evidences one. Always-render Registro filters; drop `showFilters`. Verify first; remediate only `remediation_required` except filter mandate. `auto-chain`/`stacked-to-main`; extra slice if UI + remaining WUs exceed 800.

## Affected Areas

New: `.github/workflows/pr-check.yml`. Mandatory modified: `app/(app)/service-events/serviceEventsManager.tsx` (`showFilters` L57, toggle L143–152, `{showFilters && (...)}` L154). Modified if reproduced: status/transfer routes, `ServicesTable.tsx`. Frozen: `openspec/changes/audit-ui-ux-remediation/**`.

## Risks

Predecessor mutation (High: empty predecessor diff). Baseline identity loss (High: write-tree stays `38640512f6119e4edde346158797be61dd62fff6`). Unknown batch path/403 (Med: live Admin; runbook; no sequential fallback). Scope creep (Med: reproduced failures only except filter mandate). Filter overflow (Med: wrap/stack).

## Rollback Plan

`git rm .github/workflows/pr-check.yml`. Disable Dashboard batch per documented path/env. Revert filter-visibility and remediation commits.

## Dependencies

Preproposal rev 3; research rev 1; candidate `38640512f6119e4edde346158797be61dd62fff6`; PocketBase 0.40.1.

## Success Criteria

- [ ] `pr-check.yml` at 800; gates intact; Admin inspection; two-op atomic batch; 403 is operator failure
- [ ] Registro filters always rendered (Desde, Hasta, Tipo, Estado, Sede, clear); no collapse/toggle/chevron; wrap/stack without overflow; keyboard/a11y
- [ ] sdd-verify + verify-ui pass, or reproduced remediations pass
- [ ] Predecessor diff empty; baseline preserved until authorized apply; authored diff ≤800 or auto-chained stacked-to-main
