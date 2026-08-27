```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:410502b8f7d05fd5cc6285c1058fa18b526f2cdcabb18c9097d1e963ddf1119d
verdict: fail
blockers: 3
critical_findings: 4
requirements: 14/24
scenarios: 40/51
test_command: pnpm test:run
test_exit_code: 0
test_output_hash: sha256:2026a077be170371f9647aa000228ed765f33f025b75130e2b3ff0b527017452
build_command: pnpm run build
build_exit_code: 0
build_output_hash: sha256:5d967a9f11bbec9b2426b0d94bebbd1df99ae3245780017aa87a0885de14e736
```

## Verification Report

**Change**: audit-ui-ux-remediation
**Version**: N/A
**Mode**: Strict TDD

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 21 |
| Tasks complete | 21 |
| Tasks incomplete | 0 |

OpenSpec `tasks.md` has all 21 boxes `[x]`. OpenSpec `apply-progress.md` records 21/21 plus later remediation and service-data-integrity gate evidence. No unchecked core tasks.

### Build & Tests Execution
**Build**: ✅ Passed
```text
pnpm run build
$ next build
▲ Next.js 16.3.0 (Turbopack)
✓ Compiled successfully in 6.6s
Finished TypeScript in 2.9s
Generating static pages using 11 workers (8/8)
exit 0
```

**Typecheck**: ✅ Passed
```text
pnpm exec tsc --noEmit
(exit 0, empty stdout/stderr)
tsc_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

**Tests**: ✅ 332 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
pnpm test:run
$ vitest run
 Test Files  19 passed (19)
      Tests  332 passed (332)
   Duration  4.27s
exit 0
```

**Focused service-data suites**: ✅ 75 passed / 0 failed
```text
pnpm test:run tests/unit/service-data-integrity.test.ts tests/unit/lifecycle.test.ts tests/unit/registro.test.ts tests/schema-artifact.test.ts tests/services-lifecycle.test.ts
 Test Files  5 passed (5)
      Tests  75 passed (75)
exit 0
```

**Quality check**: `pnpm check` exit 0 — 0 errors, 3 warnings (`!important` in `styles/globals.css` reduced-motion), 2 infos (`useLiteralKeys` in `tests/unit/bones.test.ts`).

**Coverage**: 51% lines overall (660/1294) / threshold: 0% → ✅ Above project threshold. Report polluted by `.next` parse errors (non-blocking).

### Spec Compliance Matrix
| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Single Shared Shell Geometry | Desktop headers match | `tests/unit/shell.test.ts` + verify-ui eval 1280: dashboard/locations/registro `top=0` `bottom=65` `width=1265` | ✅ COMPLIANT |
| Single Shared Shell Geometry | Mobile headers match | `tests/unit/shell.test.ts` + verify-ui 390 header `top=0` `bottom=65`; hamburger `top-16` not eval-proven across all three routes after scroll | ⚠️ PARTIAL |
| Taller Claro Operacional Surfaces | Glass and glow are absent | `tests/unit/tokens.test.ts` + `visual.test.ts` + screenshots opaque surfaces | ✅ COMPLIANT |
| Status, Targets, Zoom, Dialogs, Motion | Dialog keyboard contract | `tests/unit/tokens.test.ts` + verify-ui Escape closed create/edit/status/transfer/details | ✅ COMPLIANT |
| Status, Targets, Zoom, Dialogs, Motion | Zoom is allowed | `tests/unit/tokens.test.ts` > viewport userScalable true | ✅ COMPLIANT |
| Mobile Table Progressive Disclosure | Actions visible on narrow viewport | verify-ui 390 eval: actions `left=966` `visible=false`; wrap `scrollWidth=1028` `clientWidth=341`; screenshot `dashboard-mobile-light-normal.png` | ❌ FAILING |
| RUT Required and Normalized | Formatted valid RUT is accepted | `tests/unit/rut.test.ts` + live create `12.345.678-5` stored | ✅ COMPLIANT |
| RUT Required and Normalized | Missing RUT is rejected | `tests/unit/rut.test.ts` | ✅ COMPLIANT |
| Módulo-11 Check on Client and Server | Valid K check digit | `tests/unit/rut.test.ts` | ✅ COMPLIANT |
| Módulo-11 Check on Client and Server | Valid zero check digit | `tests/unit/rut.test.ts` | ✅ COMPLIANT |
| Módulo-11 Check on Client and Server | Wrong check digit is rejected | `tests/unit/rut.test.ts` | ✅ COMPLIANT |
| Módulo-11 Check on Client and Server | Malformed body is rejected | `tests/unit/rut.test.ts` | ✅ COMPLIANT |
| Historical Invalid RUT Is Not Bulk-Migrated | Historic invalid row still lists | `tests/unit/rut.test.ts` historic readable; no live historic-invalid dashboard row | ⚠️ PARTIAL |
| Historical Invalid RUT Is Not Bulk-Migrated | Edit of historic invalid RUT must fix it | `tests/unit/rut.test.ts` | ✅ COMPLIANT |
| Tenant-Global Stats Independent of Table Controls | Counts stay stable when Completadas is selected | `tests/unit/stats.test.ts` | ✅ COMPLIANT |
| Tenant-Global Stats Independent of Table Controls | Pagination and search do not rewrite cards | `tests/unit/stats.test.ts` | ✅ COMPLIANT |
| Tenant-Global Stats Independent of Table Controls | Other tenant data is excluded | `tests/unit/stats.test.ts` | ✅ COMPLIANT |
| Semantic Card Tokens With Explicit Classes | Active card uses token classes | `tests/unit/stats.test.ts` + live cards icon+text | ✅ COMPLIANT |
| Semantic Card Tokens With Explicit Classes | Color-only status is rejected | `tests/unit/stats.test.ts` + live Pendiente/Entregadas icons | ✅ COMPLIANT |
| Exact-Layout Initial Skeleton | First empty load shows bones | `tests/unit/bones.test.ts`; live empty state after load is copy, not delayed bones | ⚠️ PARTIAL |
| Exact-Layout Initial Skeleton | Reduced motion disables shimmer | `tests/unit/bones.test.ts` | ✅ COMPLIANT |
| Populated Refetch Preserves Table | Filter refetch keeps rows | `tests/unit/bones.test.ts` aria-busy; live delayed-fetch height not measured | ⚠️ PARTIAL |
| Exactly One Default and At Least One Active | Fresh user has one default active sede | `tests/unit/locations.test.ts` + live `Sede Principal` after register | ✅ COMPLIANT |
| Exactly One Default and At Least One Active | Foreign location is hidden | `tests/unit/locations.test.ts` | ✅ COMPLIANT |
| Idempotent Registration and Ensure-on-Auth | Register then login does not duplicate | `tests/unit/locations.test.ts` | ✅ COMPLIANT |
| Idempotent Registration and Ensure-on-Auth | Existing user with zero locations is repaired once | `tests/unit/locations.test.ts` | ✅ COMPLIANT |
| Cannot Delete or Deactivate Into Invalid State | Default delete is rejected | `tests/unit/locations.test.ts` | ✅ COMPLIANT |
| Cannot Delete or Deactivate Into Invalid State | Last active deactivate is rejected | `tests/unit/locations.test.ts` | ✅ COMPLIANT |
| Safe Default Change | Default moves to another active sede | `tests/unit/locations.test.ts` | ✅ COMPLIANT |
| Safe Default Change | Inactive target cannot become default | `tests/unit/locations.test.ts` | ✅ COMPLIANT |
| Transfer and Status Event Kinds | Transfer appears in Registro | unit expects `location_changed`; live PATCH `/transfer` 500; Registro stayed at 1 `Creación` row | ❌ FAILING |
| Transfer and Status Event Kinds | Status change appears in Registro | unit expects `status_changed`; live PATCH `/status` 500 | ❌ FAILING |
| Transfer and Status Event Kinds | Failed mutation writes nothing | `tests/unit/registro.test.ts` + live 500 left Registro count=1 | ✅ COMPLIANT |
| Filters, Pagination, Tenant Isolation | Kind filter | `tests/unit/registro.test.ts` | ✅ COMPLIANT |
| Filters, Pagination, Tenant Isolation | Date, location, and status filters | `tests/unit/registro.test.ts` | ✅ COMPLIANT |
| Filters, Pagination, Tenant Isolation | Other tenant events are hidden | `tests/unit/registro.test.ts` | ✅ COMPLIANT |
| Consistent Authenticated Display | Nav and heading say Registro | `tests/unit/shell.test.ts` + live heading `Registro` | ✅ COMPLIANT |
| Consistent Authenticated Display | Mobile event row is readable | verify-ui 390 wrap `810/341`; from/to/time off-screen `registro-mobile-dark-normal.png` | ❌ FAILING |
| Generic Edit Excludes Status and Location | Edit cannot change status or sede | `tests/unit/lifecycle.test.ts` + live edit dialog only email/cost/notes | ✅ COMPLIANT |
| Generic Edit Excludes Status and Location | Generic write with status is rejected | `tests/unit/lifecycle.test.ts` + `service-data-integrity.test.ts` `LIFECYCLE_PROTECTED` including date keys | ✅ COMPLIANT |
| Generic Edit Excludes Status and Location | Foreign service is forbidden | `tests/unit/lifecycle.test.ts` | ✅ COMPLIANT |
| Create Selects Initial Owned Location | Default sede preselected | live create dialog preselected `Sede Norte` (newest), not default `Sede Principal` (SHOULD) | ⚠️ PARTIAL |
| Create Selects Initial Owned Location | Other valid initial sede | live create persisted `Sede Norte` | ✅ COMPLIANT |
| Create Selects Initial Owned Location | Invalid initial sede rejected | `tests/unit/lifecycle.test.ts` | ✅ COMPLIANT |
| Dedicated Status Transitions | Pending to ready stamps readyDate | live PATCH `/api/services/{id}/status` 500; PocketBase `Batch requests are not allowed.` | ❌ FAILING |
| Dedicated Status Transitions | Completed cannot change | `tests/unit/registro.test.ts` | ✅ COMPLIANT |
| Dedicated Location Transfer | Transfer to owned active sede | live PATCH `/transfer` 500 same batch 403 | ❌ FAILING |
| Dedicated Location Transfer | Transfer to foreign sede is rejected | `tests/unit/registro.test.ts` + `service-data-integrity.test.ts` `INVALID_LOCATION` | ✅ COMPLIANT |
| Create Always Pending | Form has no status control | live create dialog; `tests/unit/lifecycle.test.ts` | ✅ COMPLIANT |
| Create Always Pending | Client status is ignored | `tests/unit/lifecycle.test.ts` | ✅ COMPLIANT |
| Entregada Display Mapping | Badge shows Entregada | `tests/unit/lifecycle.test.ts` + live KPI `Entregadas` | ✅ COMPLIANT |

**Compliance summary**: 40/51 scenarios compliant (5 PARTIAL, 6 FAILING)

### Correctness (Static Evidence)
| Requirement | Status | Notes |
|------------|--------|-------|
| Single Shared Shell Geometry | ⚠️ Partial | Shared `(app)/layout`; live 1280 geometry matches; mobile hamburger alignment not fully proven |
| Taller Claro Operacional Surfaces | ✅ Implemented | Tokens; screenshots opaque zinc surfaces light/dark |
| Status, Targets, Zoom, Dialogs, Motion | ✅ Implemented | 44px IconButton; Escape closes dialogs; zoom meta |
| Mobile Table Progressive Disclosure | ❌ Incomplete | `ServicesTable` still `overflow-x-auto`; actions at x=966 on 390px |
| RUT Required and Normalized | ✅ Implemented | `lib/rut.ts` + live create |
| Módulo-11 Check | ✅ Implemented | Shared client/server |
| Historical Invalid RUT | ⚠️ Partial | Write rejected; no live historic-invalid list proof |
| Tenant-Global Stats | ✅ Implemented | Cards independent; live pending=1 after create |
| Semantic Card Tokens | ✅ Implemented | Static `STATUS_CARD` |
| Exact-Layout Initial Skeleton | ⚠️ Partial | Bones wired; live empty is copy not delayed skeleton |
| Populated Refetch | ⚠️ Partial | `aria-busy` present |
| Location invariants | ✅ Implemented | Ensure-on-auth created `Sede Principal` |
| Registro events + filters | ❌ Incomplete | Create event writes `service_events` `created`; live status/transfer 500 |
| Consistent Authenticated Display | ❌ Incomplete | Nav/heading Registro; mobile row not fully visible |
| Service lifecycle create/edit | ✅ Implemented | POST pending; PUT `LIFECYCLE_PROTECTED`; edit UI omits status/location |
| Dedicated status/transfer | ❌ Incomplete | Unit mocks pass; live PB batch 403 → HTTP 500 |
| Entregada mapping | ✅ Implemented | Storage `completed`; UI `Entregada`/`Entregadas` |

Stale planning wording (not rewritten): `design.md` / proposal still say extend `location_logs` with `kind transfer|status`. Runtime writers use `service_events` id `pbc_2579451501` with `created`/`location_changed`/`status_changed`. `grep` of `*.ts`/`*.tsx`/`*.json` runtime paths has no `location_logs` writes (only test `not.toContain` guards).

### Coherence (Design)
| Decision | Followed? | Notes |
|----------|-----------|-------|
| Shared `app/(app)/layout.tsx` chrome | ✅ Yes | Navbar + `max-w-7xl`; live header 65px |
| Hard-rename `/locationLogs` → `/registro` | ✅ Yes | |
| `getServiceStats` independent of table | ✅ Yes | |
| Boneyard apply-only `pnpm add` + `./bones` | ✅ Yes | Pin 1.9.0 |
| Replace tokens; delete glass | ✅ Yes | Local theme provider (next-themes removed) |
| Harden dialog a11y | ✅ Yes | |
| Dedicated status/transfer vs generic PUT | ⚠️ Partial | Contracts exist; live batch path fails closed with 500 |
| `locations.isDefault` + ensure-on-auth | ✅ Yes | |
| Extend `location_logs` with kind `transfer\|status` | ❌ No | Hard-renamed to `service_events` + `created`/`location_changed`/`status_changed` (disclosed; planning not rewritten) |
| Shared `lib/rut.ts` | ✅ Yes | |
| Mobile table + card fallback | ❌ No | Overflow-x table remains |
| Sequential event write with rollback | ⚠️ Partial | Create path succeeded; status/transfer prefer `createBatch()` which PB 0.40.1 rejected (`Batch requests are not allowed.`) |

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Found in apply-progress including gate-retry RED 3 failed / 6 passed then GREEN 9/9 |
| All tasks have tests | ✅ | 21/21 map to unit files plus `audit-remediation` / `service-data-integrity` |
| RED confirmed (tests exist) | ✅ | Change test files exist |
| GREEN confirmed (tests pass) | ✅ | 332/332 pass on this run |
| Triangulation adequate | ⚠️ | Most tasks 2+ cases; live status/transfer not covered by unmocked PB batch |
| Safety Net for modified files | ⚠️ | Task 1.2 still marked N/A (new) on later-modified `tokens.test.ts` |

**TDD Compliance**: 4/6 checks passed

---

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 320 | 19 | vitest |
| Integration | 12 | 5 | @testing-library/react + jsdom |
| E2E | 0 | 0 | Playwright installed (`e2e/smoke.spec.ts`) but not executed by `pnpm test:run`; verify-ui used playwright-cli 0.1.18 |
| **Total** | **332** | **19** | |

Change-authored files (it/test counts): tokens 16, shell 22, stats 16, visual 39, bones 17, rut 19, locations 22, lifecycle 16, registro 20, audit-remediation 10, service-data-integrity 9.

---

### Changed File Coverage
| File | Line % | Branch % | Uncovered Lines | Rating |
|------|--------|----------|-----------------|--------|
| `lib/pocketbase-filter.ts` | 100% | 96% | 28 | ✅ Excellent |
| `lib/schemas.ts` | 100% | 83% | 43 | ✅ Excellent |
| `lib/rut.ts` | 100% | 82% | 14-29,47,57 | ✅ Excellent |
| `app/api/services/route.ts` | 91% | 83% | 184,231,266-267 | ⚠️ Acceptable |
| `app/actions/logs.ts` | 96% | 81% | 84-85 | ✅ Excellent |
| `app/actions/auth.ts` | 94% | 75% | 31,62,75 | ⚠️ Acceptable |
| `lib/status.ts` | 80% | 54% | 33,39 | ⚠️ Acceptable |
| `app/api/services/[id]/transfer/route.ts` | 69% | 78% | batch/error paths | ⚠️ Low |
| `lib/storage.ts` | 75% | 65% | 315,332-335,349 | ⚠️ Low |
| `app/api/services/[id]/status/route.ts` | 62% | 44% | batch/error paths | ⚠️ Low |
| `lib/service-days.ts` | 71% | 50% | 12,26-28 | ⚠️ Low |
| `lib/format-date.ts` | 63% | 50% | 32-41 | ⚠️ Low |
| `lib/locations.ts` | 45% | 33% | 158,183,200-215 | ⚠️ Low |
| `app/api/services/stats/route.ts` | 0% | 0% | 7-16 | ⚠️ Low |
| `app/(app)/layout.tsx` | 0% | 0% | 6-22 | ⚠️ Low |
| `app/(app)/registro/logsManager.tsx` | 0% | 0% | 1-490 | ⚠️ Low |
| `app/(app)/locations/locationsManager.tsx` | 0% | 0% | 1-574 | ⚠️ Low |

**Average changed file coverage**: ~62% lines among files listed in the v8 report. `.next` noise excluded.

---

### Assertion Quality
| File | Line | Assertion | Issue | Severity |
|------|------|-----------|-------|----------|
| `tests/unit/bones.test.ts` | 324-359 | empty-load skeleton `if (hasSkeleton)` | Incomplete cycle — skeleton not required | WARNING |
| `tests/unit/stats.test.ts` | 77 | `expect(mod).toBeDefined()` | Type-only fallback without value | WARNING |
| `tests/unit/tokens.test.ts` | 238-239 | `close.className` matches `h-11`/`w-11` | Implementation-detail CSS class | WARNING |

Prior CRITICAL tautology `expect(true).toBe(true)` at `tests/unit/bones.test.ts:195` is gone; that test now asserts bone JSON existence and CSS var usage. Guard remains in `tests/unit/audit-remediation.test.ts`.

**Assertion quality**: 0 CRITICAL, 3 WARNING

---

### Quality Metrics
**Linter**: ⚠️ 3 warnings (`noImportantStyles` on reduced-motion `!important`) / 0 errors
**Type Checker**: ✅ No errors

### Mutation Testing Evidence

Stryker 9.6.1 is installed (`pnpm test:mutate`). Parent-delivered prior verify-report mutation block status was `unavailable` (ENXIO copying `.codegraph/daemon.sock`). User/attempt binding: do not retry a failed/unavailable campaign; do not modify project config to force mutation. One bounded campaign was therefore not re-executed.

```json
{
  "schema": "gentle-ai.mutation-evidence/v1",
  "change_name": "audit-ui-ux-remediation",
  "campaign_id": "cam-20260826T224839Z-47388927",
  "campaign_type": "full",
  "generated_at": "2026-08-26T22:48:39Z",
  "candidate_fingerprint": "sha256:f28be9bdea3f8137acc7c021d1114d06ae8acb95fae1dddbe6579a14a677914f",
  "candidate_binding_strength": "strong",
  "scope_fingerprint": "sha256:17f60a7d4199f61cca8fd9bed4541cfb094ed1a825bd812686a4104a5a7b7a35",
  "baseline_suite_hash": "sha256:2026a077be170371f9647aa000228ed765f33f025b75130e2b3ff0b527017452",
  "baseline_hash_kind": "opaque",
  "tool": { "name": "stryker", "version": "9.6.1" },
  "config_fingerprint": "sha256:aaba0df4d03d482d29bc58e335366c1f95f7f4fdaac5e2118469fc9794b7a7a8",
  "harness_disposition": "reused",
  "repro": {
    "cwd": ".",
    "command": "not executed — prior unavailable ENXIO on .codegraph/daemon.sock; no retry",
    "seed": null,
    "timeout_seconds": 0
  },
  "counts": { "total": 0, "killed": 0, "survived": 0, "timeout": 0, "error": 0 },
  "counts_source": "executed",
  "survivors": [],
  "selected_mutant_ids": [],
  "incremental_eligible": false,
  "prior_evidence_revision": "sha256:61fa2e43f40a857bae4fc81c87ac0d5189fe1cfa78417d101a51ba28e9f8155b",
  "cache_manifest": [],
  "invalidation_reasons": [
    {
      "kind": "invalidated",
      "reason": "prior_unavailable",
      "prior_evidence_revision": "sha256:61fa2e43f40a857bae4fc81c87ac0d5189fe1cfa78417d101a51ba28e9f8155b"
    }
  ],
  "status": "unavailable",
  "error": "ENXIO: no such device or address, copyfile '.codegraph/daemon.sock' -> '.stryker-tmp/sandbox-*/.codegraph/daemon.sock' — not retried"
}
```

### UI Verification Evidence

```json
{
  "schema": "gentle-ai.ui-verification-evidence/v1",
  "change_name": "audit-ui-ux-remediation",
  "campaign_id": "ui-cam-20260826T224202Z-47388927",
  "generated_at": "2026-08-26T22:48:39Z",
  "attempt_token": "sha256:037907654a679e2d07acd7d85ba6ccedf97f475ba68b4702db07c9fe1a177a5d",
  "scope_fingerprint": "sha256:17f60a7d4199f61cca8fd9bed4541cfb094ed1a825bd812686a4104a5a7b7a35",
  "baseline_suite_hash": "sha256:2026a077be170371f9647aa000228ed765f33f025b75130e2b3ff0b527017452",
  "baseline_hash_kind": "opaque",
  "tool": { "name": "playwright-cli", "version": "0.1.18", "entrypoint": "npx --yes --package=@playwright/cli@0.1.18 playwright-cli" },
  "repro": {
    "cwd": ".",
    "base_url": "http://127.0.0.1:3001",
    "commands": [
      "docker compose -f compose.yaml -f compose.dev.yaml run --rm pocketbase-init",
      "pnpm exec next start -p 3001",
      "npx --yes --package=@playwright/cli@0.1.18 playwright-cli -s=verify-ui open http://127.0.0.1:3001/login",
      "npx --yes --package=@playwright/cli@0.1.18 playwright-cli -s=verify-ui resize 1280 800",
      "npx --yes --package=@playwright/cli@0.1.18 playwright-cli -s=verify-ui screenshot --filename=/tmp/opencode/verify-ui-audit/<cell>.png --type png",
      "npx --yes --package=@playwright/cli@0.1.18 playwright-cli -s=verify-ui resize 390 844"
    ],
    "sessions": ["verify-ui"]
  },
  "scope": {
    "changed_routes": ["/login", "/dashboard", "/locations", "/registro"],
    "changed_components": ["Navbar", "ServiceDashboard", "ServiceTable", "ServiceModal", "ServiceDetailsModal", "LocationsManager", "logsManager", "ThemeProvider", "Dialog", "IconButton"],
    "derived_states": ["normal", "empty", "validation", "dialog", "error", "menu"]
  },
  "matrix": {
    "routes": ["/login", "/dashboard", "/locations", "/registro"],
    "themes": ["light", "dark"],
    "viewports": [
      { "name": "desktop", "width": 1280, "height": 800 },
      { "name": "mobile", "width": 390, "height": 844 }
    ],
    "states": ["normal", "empty", "validation", "dialog", "error", "menu"],
    "cells": 25,
    "cells_attempted": 25,
    "cells_completed": 25
  },
  "screenshots": {
    "inspected": 25,
    "files": [
      { "route": "/login", "viewport": "desktop", "theme": "light", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/login-desktop-light-normal.png", "inspected": true },
      { "route": "/register", "viewport": "desktop", "theme": "light", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/register-desktop-light-normal.png", "inspected": true },
      { "route": "/register", "viewport": "desktop", "theme": "light", "state": "validation", "path": "/tmp/opencode/verify-ui-audit/register-desktop-light-validation.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "light", "state": "empty", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-light-empty.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "light", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-light-normal.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "light", "state": "dialog", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-light-dialog-create.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "light", "state": "dialog", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-light-dialog-edit.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "light", "state": "dialog", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-light-dialog-status.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "light", "state": "error", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-light-dialog-status-error.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "light", "state": "dialog", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-light-dialog-transfer.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "light", "state": "error", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-light-dialog-transfer-error.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "light", "state": "dialog", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-light-dialog-details.png", "inspected": true },
      { "route": "/locations", "viewport": "desktop", "theme": "light", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/locations-desktop-light-normal.png", "inspected": true },
      { "route": "/locations", "viewport": "desktop", "theme": "light", "state": "dialog", "path": "/tmp/opencode/verify-ui-audit/locations-desktop-light-dialog.png", "inspected": true },
      { "route": "/registro", "viewport": "desktop", "theme": "light", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/registro-desktop-light-normal.png", "inspected": true },
      { "route": "/registro", "viewport": "desktop", "theme": "light", "state": "dialog", "path": "/tmp/opencode/verify-ui-audit/registro-desktop-light-filters.png", "inspected": true },
      { "route": "/dashboard", "viewport": "mobile", "theme": "light", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/dashboard-mobile-light-normal.png", "inspected": true },
      { "route": "/dashboard", "viewport": "mobile", "theme": "light", "state": "menu", "path": "/tmp/opencode/verify-ui-audit/dashboard-mobile-light-menu.png", "inspected": true },
      { "route": "/dashboard", "viewport": "mobile", "theme": "dark", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/dashboard-mobile-dark-normal.png", "inspected": true },
      { "route": "/registro", "viewport": "mobile", "theme": "dark", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/registro-mobile-dark-normal.png", "inspected": true },
      { "route": "/locations", "viewport": "mobile", "theme": "dark", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/locations-mobile-dark-normal.png", "inspected": true },
      { "route": "/dashboard", "viewport": "desktop", "theme": "dark", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/dashboard-desktop-dark-normal.png", "inspected": true },
      { "route": "/locations", "viewport": "desktop", "theme": "dark", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/locations-desktop-dark-normal.png", "inspected": true },
      { "route": "/registro", "viewport": "desktop", "theme": "dark", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/registro-desktop-dark-normal.png", "inspected": true },
      { "route": "/login", "viewport": "desktop", "theme": "dark", "state": "normal", "path": "/tmp/opencode/verify-ui-audit/login-desktop-dark-normal.png", "inspected": true }
    ]
  },
  "findings": [
    {
      "id": "ui-001",
      "route": "/dashboard",
      "viewport": "mobile",
      "theme": "light",
      "state": "normal",
      "kind": "visual",
      "category": "overflow",
      "severity_hint": "needs_remediation",
      "evidence": "dashboard-mobile-light-normal.png: Acciones column not in viewport. eval: action buttons left=966.42 right=1010.42 visible=false; overflow-x-auto wrap scrollWidth=1028 clientWidth=341; visibleActions=[]",
      "remediation_required": true
    },
    {
      "id": "ui-002",
      "route": "/dashboard",
      "viewport": "desktop",
      "theme": "light",
      "state": "error",
      "kind": "runtime",
      "category": "regression",
      "severity_hint": "needs_remediation",
      "evidence": "dashboard-desktop-light-dialog-status-error.png: Spanish error No se pudo cambiar el estado. console 500 PATCH /api/services/{id}/status. next-start.log: ClientResponseError 403 Batch requests are not allowed. on /api/batch",
      "remediation_required": true
    },
    {
      "id": "ui-003",
      "route": "/dashboard",
      "viewport": "desktop",
      "theme": "light",
      "state": "error",
      "kind": "runtime",
      "category": "regression",
      "severity_hint": "needs_remediation",
      "evidence": "dashboard-desktop-light-dialog-transfer-error.png: No se pudo transferir la sede. console 500 PATCH /api/services/{id}/transfer. Same PocketBase batch 403",
      "remediation_required": true
    },
    {
      "id": "ui-004",
      "route": "/registro",
      "viewport": "mobile",
      "theme": "dark",
      "state": "normal",
      "kind": "visual",
      "category": "overflow",
      "severity_hint": "needs_remediation",
      "evidence": "registro-mobile-dark-normal.png: only CREACIÓN and boleta on-screen. eval wrap scrollWidth=810 clientWidth=341; Origen/Destino/Fecha/Actor off-screen",
      "remediation_required": true
    },
    {
      "id": "ui-005",
      "route": "/dashboard",
      "viewport": "desktop",
      "theme": "light",
      "state": "normal",
      "kind": "visual",
      "category": "copy",
      "severity_hint": "needs_remediation",
      "evidence": "dashboard-desktop-light-normal.png and details dialog: Ingreso/history render raw ISO 2026-08-26 00:00:00.000Z and 2026-08-26 22:44:12.420Z instead of calendar-stable Spanish date",
      "remediation_required": true
    },
    {
      "id": "ui-006",
      "route": "/dashboard",
      "viewport": "desktop",
      "theme": "light",
      "state": "dialog",
      "kind": "visual",
      "category": "copy",
      "severity_hint": "observation",
      "evidence": "Status/transfer dialogs mix English internals: actual pending, Cambiar estado status, transfer sede, Transferir sede transfer. Registro filters: Tipo kind, Estado status, resultados pagination. Locations column S. Completados",
      "remediation_required": true
    },
    {
      "id": "ui-007",
      "route": "/dashboard",
      "viewport": "desktop",
      "theme": "light",
      "state": "dialog",
      "kind": "interaction",
      "category": "copy",
      "severity_hint": "observation",
      "evidence": "Status combobox lists Entregada from pending (disallowed transition shown). Create dialog preselected Sede Norte not default Sede Principal (SHOULD)",
      "remediation_required": false
    }
  ],
  "runtime": {
    "console": [
      { "level": "error", "text": "Failed to load resource: 500 PATCH /api/services/{id}/status", "route": "/dashboard" },
      { "level": "error", "text": "Failed to load resource: 500 PATCH /api/services/{id}/transfer", "route": "/dashboard" }
    ],
    "network": [
      { "url": "/api/services/{id}/status", "status": 500, "route": "/dashboard" },
      { "url": "/api/services/{id}/transfer", "status": 500, "route": "/dashboard" }
    ],
    "hydration_warnings": []
  },
  "seo": {
    "applicability": "not_applicable",
    "pages": [],
    "not_applicable_routes": ["/login", "/dashboard", "/locations", "/registro"]
  },
  "metrics": {
    "applicability": "not_applicable",
    "evidence": [],
    "limitations_global": "Authenticated/internal routes; browser-observable only; no Lighthouse/CWV scores"
  },
  "status": "fail",
  "status_reason": "4 remediation_required visual/runtime findings including mobile table actions off-screen and live status/transfer 500",
  "limitations": [
    "Production next start on :3001 used after compose.dev :3000 served chunks that 403'd under Playwright (HMR/websocket). PocketBase remained compose :8090 after pocketbase-init import.",
    "Tablet omitted — no breakpoint-specific requirement.",
    "SEO not_applicable for authenticated/internal routes.",
    "Global playwright-cli 1.59 lacked Chrome; campaign used pinned @playwright/cli@0.1.18.",
    "Compose.dev Next on :3000 not used for authenticated matrix after JS 403s."
  ],
  "retained_artifacts": []
}
```

### Issues Found
**CRITICAL**:
- FAILING scenario `Actions visible on narrow viewport`: at 390×844 Ver/status/transfer/edit/delete sit at x≈966 inside `overflow-x-auto` (wrap 1028 vs 341). Screenshot `dashboard-mobile-light-normal.png`.
- Live dedicated status transition FAILING: PATCH `/api/services/{id}/status` returns 500; PocketBase `403 Batch requests are not allowed.` Unit mocks still pass.
- Live dedicated transfer FAILING: PATCH `/api/services/{id}/transfer` returns 500 for the same batch 403. No `location_changed` Registro row.
- FAILING scenario `Mobile event row is readable`: Registro wrap 810 vs 341; from/to/time/actor off-screen.

**WARNING**:
- 5 PARTIAL scenarios: mobile header hamburger alignment, historic RUT listing, initial bones layout-shift, refetch height, default sede SHOULD preselect (`Sede Norte` shown).
- ISO timestamps leak in table, details, and Registro (`2026-08-26 00:00:00.000Z`).
- English leftovers in reachable UI: `Cambiar estado status`, `transfer sede`, `Tipo kind`, `Estado status`, `resultados pagination`, `S. Completados`.
- Design `location_logs` / `transfer|status` wording stale vs `service_events` / `created|location_changed|status_changed` (disclosed, not rewritten).
- Changed-file coverage below 80% on status/transfer routes, `lib/locations.ts`, `lib/format-date.ts`, stats route, UI managers.
- Mutation campaign unavailable (ENXIO); not retried.
- Assertion quality: 3 WARNING (incomplete skeleton cycle; type-only; CSS class coupling). Tautology CRITICAL from prior report is fixed.
- `pnpm check` 3 `!important` warnings for reduced-motion.
- Compose.dev Next on :3000 returned 403 for some `/_next/static/chunks` under Playwright; campaign used `pnpm exec next start -p 3001`.

**SUGGESTION**:
- Status combobox shows disallowed `Entregada` from `pending`; server would reject if the live path worked.
- Exclude `.codegraph` from Stryker copy via documented `ignorePatterns` on a future attempt (not retried here).
- Details heading still says `Historial de Movimientos`.

### Verdict
FAIL
Live status/transfer writes 500 on PocketBase batch denial, and required mobile table/Registro actions remain off-screen at 390px. Unit suite 332/332 and typecheck/build passed.
