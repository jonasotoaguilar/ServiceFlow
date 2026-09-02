# Tasks: Page UI Redesign — Andén Ordenado (anden-ordenado)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1150–1350 (S1 ~300 S2 ~480 S3 ~380) |
| 400-line budget risk | High |
| 800-line session risk | High |
| Chained PRs recommended | Yes |
| Suggested split | S1→S2→S3 |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Identity + BrandMark + Locations | PR1 | `pnpm test:run tests/unit/dark-contrast.test.ts` | `pnpm dev` 390+1280 vs `.sdd/changes/page-ui-redesign/ui/design/bodega-anden-ordenado.png` (read-only) | `styles/globals.css`, `assets/brand/*`, `components/brand/*`, `components/ui/page-empty-state.tsx`, `components/layout/Navbar.tsx`, `app/(app)/locations/*` |
| 2 | Dashboard headline+2+3+strip+390 | PR2 | `pnpm test:run tests/unit/dashboard-operate-plus.test.tsx` | `pnpm dev` 390×844; keyboard | `components/services/ServicesDashboard.tsx`, `components/services/ServicesTable.tsx` |
| 3 | Registro rank2+empty/error+390 | PR3 | `pnpm test:run tests/unit/registro-primary-surface.test.tsx` | `pnpm dev` 390 | `components/layout/Navbar.tsx`, `app/(app)/service-events/*` |

`PRODUCT.md` (read-only) `DESIGN.md` (read-only). No backend/query/schema.

## Phase 1: Identity S1 ~300

- [x] 1.1 RED `tests/unit/dark-contrast.test.ts` — AA from `styles/globals.css`; fail `#71717a` on `#18181b`, pass `#fafafa`/`#a1a1aa`; 11-step ramp actual-token
- [x] 1.2 GREEN `styles/globals.css` — `.dark --color-foreground-subtle`→`#a1a1aa`, 11-step zinc, no OKLCH, tinta `#2F5B8A` stamp-only zinc/tinta/papel
- [x] 1.3 Create `assets/brand/bodega-tecnica-mark.svg` — 32×32 `currentColor` 2px, 8px square 2×2 slot one filled
- [x] 1.4 Create `components/brand/bodega-tecnica-mark.tsx` — SVG lockup no `next/image`, Bodega Técnica, hide ServiceFlow
- [x] 1.5 Create `components/ui/page-empty-state.tsx` — `{title,description,actionLabel,onAction}` Spanish
- [x] 1.6 Modify `components/layout/Navbar.tsx` — lockup replaces cycle, no glow/`border-l-4`
- [x] 1.7 Modify `app/(app)/locations/locationsManager.tsx` — `p-4`/`gap-4`/8px, ≥13px, `font-mono` ch, no `border-l-4`/`tracking-widest`/`text-[10px]`
- [x] 1.8 Verify S1 — `pnpm test:run` + `tsc --noEmit` + `pnpm check`; render 1280×800+390×844 vs comp

## Phase 2: Dashboard S2 ~480

- [x] 2.1 RED `tests/unit/dashboard-operate-plus.test.tsx` — headline Servicios+13px mono+Nuevo servicio before metrics (390 visible); metrics `<article>` no `toggleStatus`/`border-l-4` not tabbable; strip `toggleStatusInFilter` only; Boneyard+`aria-busy`; Spanish
- [x] 2.2 GREEN `components/services/ServicesDashboard.tsx` — headline first, 2 large+3 muted never five equal, delete `toggleStatus`, `border-y` strip not card, `gap-3`/`gap-6`, quiet 150-200ms opacity/transform
- [x] 2.3 GREEN `components/services/ServicesTable.tsx` — ≥13px, `font-mono` ch boleta/RUT/dates, semantic days, `rounded-sm` `px-4 py-3`, 390 grid boleta/sede/ingreso/días/estado/actions no `overflow-x-auto`
- [x] 2.4 Verify S2 — `pnpm test:run tests/unit/dashboard-operate-plus.test.tsx` + `bones.test.ts` green; keyboard skips metrics; 390 no overflow

## Phase 3: Registro S3 ~380

- [x] 3.1 RED `tests/unit/registro-primary-surface.test.tsx` — nav Servicios→Registro→Sedes; filters Desde/Hasta/Tipo/Estado/Sede; true-empty vs filtered; error retry; 390 fields; aria-busy — 11 failed RED then 12 passed GREEN
- [x] 3.2 GREEN `components/layout/Navbar.tsx` — reorder Servicios Registro Sedes, active text-foreground+border-primary
- [x] 3.3 GREEN `app/(app)/service-events/page.tsx` + `serviceEventsManager.tsx` — initialError, PageEmptyState Spanish, keep getServiceEvents params, 390 p-4/gap-4 aria-busy Boneyard quiet icon+text
- [x] 3.4 Verify S3 — pnpm test:run 429 incl service-events-filters green; tsc 0; pnpm check warnings; pnpm test:e2e smoke 1 passed + s3-check 1 passed; rendered 1280+390 populated/empty/filtered/dark keyboard no overflow

## Phase 4: Proof

- [x] 4.1 `pnpm test:run` + `tsc --noEmit` + `pnpm check` green; no `border-l-4`/gradient/glow/glass/`tracking-widest`, dialog a11y + icon+text + Boneyard intact — 429 passed, tsc 0, check 107 files 3 warnings+3 infos check-only, smoke 1 passed, final-apply 1 passed
- [x] 4.2 Rendered `pnpm dev` vs `.sdd/changes/page-ui-redesign/ui/design/bodega-anden-ordenado.png` (read-only) 1280×800+390×844 — headline>2>3>strip>table, `border-y` strip, 390 unclipped; `pnpm test:e2e` — Dashboard/Registro/Locations light+dark 1280+390 verified final-apply 12 png +12 html
