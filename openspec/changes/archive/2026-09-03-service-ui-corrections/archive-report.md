# Archive Report: service-ui-corrections

**Change**: `service-ui-corrections`
**Archived to**: `openspec/changes/archive/2026-09-03-service-ui-corrections/`
**Archive date**: 2026-09-03
**Artifact store**: `openspec`
**Worktree**: `/home/jona/projects/serviceflow-worktrees/fix-service-ui-corrections`
**Top PR at archive start**: #93 `fix/service-ui-corrections-11-stryker-sandbox` @ `5d552ab3eb7ed18568aa84961b884a7f2eb0ebd8`
**Archive branch**: `docs/service-ui-corrections-12-archive`
**Trunk**: `main` @ `9b48a7961e07107e460464420b34d818de53abef`

## Final-State Authority

This report is the terminal record at close. Intermediate snapshots (`apply-progress.md` @ `2026-09-03 04:58`, `verify-report.md` evidence `sha256:5283a414...`) are history, not current truth where superseded by explicit final-state facts and persisted task artifact.

**Authority ranking applied**:
1. Persisted `tasks.md` — 16/16 checked, no stale unchecked tasks.
2. Explicit final-state facts from orchestrator launch prompt (higher than snapshots).
3. Intermediate snapshots — valid only at their time.

**Contradictions resolved**:
- Superseded failed verification `sha256:39ce...` reported custody mismatch/CRITICAL-like failure. Fixed in PR #91 commit `8bbe81f84cbdb0c39431e5388a04b250e06fa0b9` (title `Comprobante de recepción y custodia`, disclaimer `Este documento acredita la recepción del equipo para servicio y custodia. No constituye documento tributario, no es boleta ni factura y no acredita pago. Sin validez tributaria ante el SII.`, print label `Imprimir comprobante`). Fresh verify passed.
- Stryker EISDIR and Vitest sandbox pollution were fixed in PR #93 commit `5d552ab3eb7ed18568aa84961b884a7f2eb0ebd8`. Fresh campaign completed 302 mutants, 207 killed, 76 survived, 19 no coverage, score 68.54 / covered 73.14, thresholds high80 low60 break:null — classified as non-blocking test-adequacy warning, not unresolved config failure.
- Frozen pre-archive topology hash `sha256:3864...` (10-PR) superseded by current 11-PR hash `sha256:bba0521e4ef321f77919c8db8e1ccdf3d3fe1e18d666860db7d8577d55b7fe83` (verified via final `verify-report` ordered heads match). Repository topology evidence used where discrepancy existed.
- `verify-report` scenario PARTIAL on `Canonical Docs Without Architecture File / Stale references are gone` due to `PRODUCT.md` still citing `ARCHITECTURE.md` at verify time. **Resolved during Archive**: `PRODUCT.md` edited to remove obsolete `ARCHITECTURE.md` reference (see § Docs Promotions). Post-archive, no stale active `ARCHITECTURE` references remain.

No unrankable contradictions; all launch-prompt facts corroborated by repository evidence (commits, `git ls-files`, rendered viewports, test/build outputs).

## Task Completion Gate

- [x] `openspec/changes/archive/2026-09-03-service-ui-corrections/tasks.md` inspected: **16/16 tasks complete**, 0 incomplete.
- [x] `verify-report.md` @ `sha256:5283a4144daf3f846febf2dc0c632c6f521bdfbb31dac7c7a99167091b9697e9` verdict **PASS WITH WARNINGS**, 0 blockers, 0 critical findings, 17/17 requirements, 41/41 scenarios (40 compliant + 1 partial archive-only, now resolved).
- [x] `apply-progress.md` confirms same 16/16 and TDD RED→GREEN per unit.

Gate **PASS** — no stale unchecked implementation tasks, no CRITICAL.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `app-shell-page-rhythm` | Created | Full spec (2 requirements, 4 scenarios): Shared Large-Screen Content Width, Shared Title And Vertical Rhythm |
| `service-custody-acknowledgment` | Created | Full spec (3 requirements, 5 scenarios): Custody Purpose, Fifty-Eight Millimeter, Fields From Current Record Only |
| `service-identity-immutability` | Created | Full spec (2 requirements, 6 scenarios): Mutable Operational Fields, Immutable Client Boleta And Sku |
| `service-search-normalization` | Created | Full spec (3 requirements, 5 scenarios): Name And Rut Lookup Equivalence, Non-Rut Text, Strict Persistence Validation |
| `bodega-tecnica-identity` | Updated | ADDED Canonical Docs Without Architecture File (1 req, 2 scenarios); MODIFIED New Brand Assets Without Research Claims (add refined shelf-grid lockup + token freeze, 3 scenarios); MODIFIED Preserved Shell and No Backend Change (allow 2xl widening via `app-shell-page-rhythm`, add identity token freeze) — preserved Future Visual Authority + Craft Floor |
| `dashboard-operate-plus` | Updated | ADDED Exclusive Single Status Filter (1 req, 3 scenarios); ADDED Reachable Table Actions Across Viewports (1 req, 3 scenarios); MODIFIED Separate Filter Toolbar (exclusive estado exception) — preserved Headline-Led Dashboard, Informational Non-Interactive Metrics, 390px Operational Column Priority, Preserved Loading Overlay |
| `registro-primary-surface` | Updated | MODIFIED Contextual Empty States (one-shot `createService` trigger + Suspense-safe, 5 scenarios vs prior 2) — preserved Registro Nav Rank Two, Contextual Error States, Preserved Filter Visibility and Queries, 390px Operational Context |

**Merge verification**: Existing specs preserved unrelated requirements by name; no dropped content. New full specs verified against delta semantics (purpose + requirements match delta verbatim). `openspec/specs/` now contains 11 domains (7 prior + 4 new).

## Source of Truth Updated

The following main specs now reflect the shipped behavior:
- `openspec/specs/app-shell-page-rhythm/spec.md` (new)
- `openspec/specs/bodega-tecnica-identity/spec.md` (updated)
- `openspec/specs/dashboard-operate-plus/spec.md` (updated)
- `openspec/specs/registro-primary-surface/spec.md` (updated)
- `openspec/specs/service-custody-acknowledgment/spec.md` (new)
- `openspec/specs/service-identity-immutability/spec.md` (new)
- `openspec/specs/service-search-normalization/spec.md` (new)

Unrelated specs (`audit-closeout-verification`, `pocketbase-batch-operations`, `pull-request-review-budget`, `registro-filter-visibility`) unchanged.

## Docs Promotions (Archive-only)

### PRODUCT.md
- **Before**: `Evidence on Hand` → `Product intent: PRD.md, ARCHITECTURE.md, docs/CODEBASE-GUIDE.md`
- **After**: `Product intent: PRD.md, docs/CODEBASE-GUIDE.md` — obsolete `ARCHITECTURE.md` reference removed.
- Durable product truth preserved per `references/product-context.md`; no changelog/test-count prose added. `git ls-files | grep ARCHITECTURE` now 0 outside historical `openspec/changes/**`. Resolves the lone PARTIAL warning in verify-report.

### DESIGN.md
- **Shell rhythm (verified reusable)**: `Layout` → Shell constraint now `max-w-7xl until 2xl, then max-w-[1600px] (1536px+)` shared across Dashboard, Registro, Locations; `App Shell & Navigation` → Owner now `max-w-7xl 2xl:max-w-[1600px]` and Navbar inner row reuses same cap.
- **Bodega Técnica shelf-grid mark/lockup (verified reusable)**: `Components` → `Navbar` now documents refined 32×32 shelf-grid (outer 16×16 frame at 8,8 rx1.5, 1.5px stroke, 2×2 bays one filled top-left, `aria-hidden` decorative, wordmark “Bodega Técnica” + muted “ServiceFlow” hidden below `sm`, accessible name via visible wordmark, no `sr-only` filename, contrast 7.04:1 on primary).
- Tokens (YAML) unchanged; format preserved; no one-off receipt details; no change-log prose. Promotion derived from `ui-design.md` (41 lines) + rendered viewports + `assets/brand/bodega-tecnica-mark.svg` / `components/brand/bodega-tecnica-mark.tsx`.

**Validation**:
- `npx @google/design.md lint DESIGN.md` → exit 0, no `broken-ref`/`missing-primary`/`contrast-ratio`/`section-order` errors. Warnings are expected `orphaned-tokens` on primitives referenced via semantics (e.g., `zinc-50` → `background`), not blocking.
- Existing `DESIGN.md` lint prior was clean; promotion preserves correctness.

## Structural Readback (Mandatory Verbatim `diff -r`)

### New spec mechanical copies (empty diff is pass)

```
=== app-shell-page-rhythm ===
temp:openspec/specs/app-shell-page-rhythm/.spec.md.6jKQOO
cp ok
diff ok empty
mv ok to openspec/specs/app-shell-page-rhythm/spec.md
done app-shell-page-rhythm diff output was empty as proved above

=== service-custody-acknowledgment ===
temp:openspec/specs/service-custody-acknowledgment/.spec.md.HR4U6v
cp ok
diff ok empty
mv ok to openspec/specs/service-custody-acknowledgment/spec.md
done service-custody-acknowledgment diff output was empty as proved above

=== service-identity-immutability ===
temp:openspec/specs/service-identity-immutability/.spec.md.6GISFp
cp ok
diff ok empty
mv ok to openspec/specs/service-identity-immutability/spec.md
done service-identity-immutability diff output was empty as proved above

=== service-search-normalization ===
temp:openspec/specs/service-search-normalization/.spec.md.Rc5fmn
cp ok
diff ok empty
mv ok to openspec/specs/service-search-normalization/spec.md
done service-search-normalization diff output was empty as proved above
```

Each `diff -r` between delta source and temp copy was empty (no diff output → verified byte-identity).

### Archive move (empty diff is pass)

```
snapshot_root=/tmp/sdd-archive.5NB0Xt
snapshot cp done
/tmp/sdd-archive.5NB0Xt/source: apply-progress.md, design.md, exploration.md, preproposal.yaml, proposal.md, research.md, specs/*, tasks.md, ui-design.md, verify-report.md
attempt git mv
git mv succeeded
source gone, now diff snapshot vs destination
diff -r empty -> PASS
archive move verified empty diff
active changes dir no longer has source:
openspec/changes: archive, audit-ui-ux-remediation
```

`diff -r` between pre-move snapshot (`/tmp/sdd-archive.5NB0Xt/source`) and `openspec/changes/archive/2026-09-03-service-ui-corrections` was empty (no output, exit 0). Archive-report is additive and excluded from this comparison, per contract.

## Archive Contents

- `proposal.md` ✅ (3.7K, intent fixed)
- `specs/` ✅ (7 domains: `app-shell-page-rhythm`, `bodega-tecnica-identity`, `dashboard-operate-plus`, `registro-primary-surface`, `service-custody-acknowledgment`, `service-identity-immutability`, `service-search-normalization`)
- `design.md` ✅ (6.3K, 8 corrections, no new tokens)
- `tasks.md` ✅ (16/16 complete)
- `verify-report.md` ✅ (evidence `sha256:5283a414...`, PASS WITH WARNINGS)
- `exploration.md` ✅ (25K)
- `research.md` ✅ (36K) + `preproposal.yaml` ✅ (11K) + `ui-design.md` ✅ (3.6K)
- `apply-progress.md` ✅ (81K, includes custody/Stryker remediations)
- `archive-report.md` ✅ (this file, additive)

Active `openspec/changes/service-ui-corrections` absent ✅; archived at `openspec/changes/archive/2026-09-03-service-ui-corrections/` ✅; archived `tasks.md` has 0 unchecked tasks ✅.

## Verification Evidence (Final)

- **HEAD at verify**: `5d552ab3eb7ed18568aa84961b884a7f2eb0ebd8` (also current archive base)
- **Build**: ✅ `pnpm run build` Next.js 16.3.0 Turbopack compiled, 4 routes, exit 0
- **Tests**: ✅ 30 files, **514/514 passed**, 0 failed (`pnpm test:run`, Vitest 4.1.10, 4.65s)
- **Typecheck**: ✅ `tsc --noEmit` exit 0
- **Lint**: ✅ `pnpm check` (Biome) exit 0, 3 warnings / 2 infos pre-existing, 0 errors
- **E2E**: ✅ `pnpm test:e2e` 1 passed (`e2e/smoke.spec.ts`, 11.9s)
- **Coverage**: exit 0, headline 37.02% polluted by `.next` include (threshold not fail); changed lib files: `custody-receipt.ts` 96.55%, `pocketbase-filter.ts` 100%, `rut.ts` 86.95%, `schemas.ts` 100%, `storage.ts` 74.04% (<80), `app/api/services/route.ts` 93.33%
- **Mutation**: campaign completed without EISDIR, `.agents` untouched, `.stryker-tmp` absent after run; 302 mutants, 207 killed, 76 survived, 19 no coverage, score 68.54 / covered 73.14, thresholds high80 low60 break:null → non-blocking warning
- **Rendered**: 5 viewports via chrome-devtools MCP, PocketBase 127.0.0.1:8090 healthy, `next dev` 127.0.0.1:3000 200, user `verify-ui-903@example.com`:
  - 1920×1080 main 1600px, header top0 height65, Servicios 24px/600/−0.6px, Eliminar 44×44 right 1703.5, no overflow
  - 1366×768 Eliminar right 1266.5, wrap overflow-x auto, no overflow
  - 1280×800 main 1280px (2xl not applied), Eliminar right 1216, no overflow
  - 390×844 cards boleta/sede/ingreso/días/estado/actions, Eliminar right 340, scrollWidth 390
  - 375×667 same, Eliminar right 325, scrollWidth 375
  - Locations 1920 h1 24px/600/−0.6px, toolbar border-y bg-surface/50 px-4 py-3; Registro 1920 main 1600px, true-empty Nuevo servicio → create dialog, URL trigger consumed; Status exclusive Pendientes→Reparadas replaces, Limpiar restores; RUT `12.345.678-5` hits BOL-903; Edit SKU/BOLETA/CLIENTE disabled, email/phone/cost editable; Print Imprimir comprobante exact title/disclaimer 58mm folio, no QR/HTTP/DTE; Logo 17.72:1 light /14.27:1 dark, SVG aria-hidden; Keyboard dialog focus trap, return focus to Editar.
- **Topology**: frozen hash `sha256:bba0521e4ef321f77919c8db8e1ccdf3d3fe1e18d666860db7d8577d55b7fe83` (11-PR aggregate), trunk `main` `9b48a796`, ordered heads #82 `d62d5c6` #83 `6c30e9b` #84 `9ea3dd2` #86 `5e8bdc4` #87 `5ef3c0a` #88 `1a3a5fc` #89 `ba6d78b` #90 `da20b84` #91 `8bbe81f` #92 `192ab7b` #93 `5d552ab`, all `isDraft:true` OPEN, `needsRebase:false`. `gh pr checks --required` reports no required checks set (informational suite pass, not failure).

**Warnings (non-blocking)**:
1. Mutation score 68.54 < high80 (see § above) — test-adequacy warning, break:null preserves exit 0.
2. `lib/storage.ts` 74.04% <80, coverage headline polluted — informational.
3. `gh pr checks --required` reports no required set on all 11 branches — informational (informational watch passes).

**No CRITICAL**, no blockers.

## Delivery / Chain Metadata

- **This archive slice**: `docs/service-ui-corrections-12-archive` (type:docs, Related #81) → base `#93`, chain **12/12**, immediate base `fix/service-ui-corrections-11-stryker-sandbox` @ `5d552ab`, no follow-up.
- **#93 becomes**: 11/12, follow-up → new draft #new (archive). Body positions updated accordingly.
- **Budget**: Authored additions+deletions ≤800 (honest). Mechanical copies/moves excluded from golfing. Estimated authored ~350 (`PRODUCT.md` 1, 3 merged specs 105, 4 new specs 207, `DESIGN.md` ~30, archive-report additive ~0 counted separately). Cohesive split preserved; no deletion of comments/tests to fit budget.

## Superseded History (for audit)

- Failed verification `sha256:39ce...` (custody mismatch) is retained only as history; its claims are superseded by `8bbe81f` and final `sha256:5283a414...` PASS WITH WARNINGS. Future readers must not re-apply the stale failure.
- Intermediate `verify-report` PARTIAL on PRODUCT.md is now resolved (see Docs Promotions). Archive does not echo stale PARTIAL as current.
- Stryker EISDIR failure is not current; current campaign completed with `.stryker-tmp` cleanup on success/failure.

## SDD Cycle Complete

The change `service-ui-corrections` has been fully planned, implemented, verified, and archived. Source of truth (`openspec/specs/*`, `PRODUCT.md`, `DESIGN.md`) reflects the shipped behavior. The next change may start.

## Skill Resolution

- `sdd-archive` (v2.0) — mechanical sync + move + report
- `stacker-pr` (v1.1) — Herdr worktree + `gh stack` lifecycle
- `herdr-worktree` — dedicated worktree `fix-service-ui-corrections`
- `branch-pr` — type:docs, Related #81
- `chained-pr` — stacked-to-main, 12/12
- `work-unit-commits` — docs work unit with rollback boundary
- `documentation` + `cognitive-doc-design` — durable docs promotion
- `sdd-ui` + `product-context` + `design-system-context` + `ui-design-contract` — reusable UI truth promotion, no one-off receipt

---
*Generated on `docs/service-ui-corrections-12-archive` before commit; HEAD `5d552ab3eb7ed18568aa84961b884a7f2eb0ebd8` is the verified evidence revision. Budget, lint, and readback evidence recorded verbatim.*
