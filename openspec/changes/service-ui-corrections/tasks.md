# Tasks: Service UI Corrections

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1600–2200 |
| 400-line budget risk | High |
| 800-line session budget | Exceeded as one PR |
| Chained PRs recommended | Yes |
| Suggested split | 10 gh-stack slices (7A–7D pre-implementation split) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

Choose chain strategy before apply; `gh stack` only. Archive-only: `PRODUCT.md`, `DESIGN.md`. Threat matrix N/A. FBC: PR1=tracker; later PRs base on prior.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Exclusive status | PR 1 | `tests/unit/dashboard-operate-plus.test.tsx` | Estado 1280 | dashboard + GET status |
| 2 | Table gutter | PR 2 | same | Acciones 1920/1366/1280; cards 390/375 | `ServicesTable.tsx` |
| 3 | Shell + Locations | PR 3 | `tests/unit/shell.test.ts` `tests/unit/locations.test.ts` | 1920 vs 1280 | layout, Navbar, locations |
| 4 | Registro create | PR 4 | `tests/unit/registro-primary-surface.test.tsx` | True-empty once; filter-empty clears | events + dashboard trigger |
| 5 | Identity omit | PR 5 | `tests/schemas.test.ts` `tests/services-lifecycle.test.ts` | Read-only; PUT 400 | schemas, route, storage, modal |
| 6 | RUT lookup | PR 6 | `tests/unit/rut.test.ts` `tests/pocketbase-filter.test.ts` | `20.884.087-K` hits | rut, filter, GET |
| 7A | OpenSpec research (7B proposal, 7C 7.1/7.2, 7D 7.3) | PR 7 | Structural readback | readable | `exploration.md` (186) + `research.md` (207) + `preproposal.yaml` (197) |

## Phase 1: Exclusive Status

- [x] 1.1 RED `tests/unit/dashboard-operate-plus.test.tsx`: drop `toggleStatusInFilter`; replace-one; all-status omits; GET first token.
- [x] 1.2 GREEN `components/services/ServicesDashboard.tsx` + GET `app/api/services/route.ts`: `statusFilter: ServiceStatus \| ""`; close on pick. Check that file.

## Phase 2: Reachable Actions

- [x] 2.1 RED same test: Acciones unclipped 1280/1366/1920; cards 390/375.
- [x] 2.2 GREEN `components/services/ServicesTable.tsx` `overflow-x-auto` + gutter; no parent clip. Check + chrome-devtools those viewports.

## Phase 3: Shell Rhythm

- [x] 3.1 RED `tests/unit/shell.test.ts`, `tests/unit/locations.test.ts`: `2xl:max-w-[1600px]`; Locations `text-2xl font-semibold tracking-tight`.
- [x] 3.2 GREEN `app/(app)/layout.tsx`, `components/layout/Navbar.tsx`, `app/(app)/locations/locationsManager.tsx`. Check tests.

## Phase 4: Registro Create

- [x] 4.1 RED `tests/unit/registro-primary-surface.test.tsx`: true-empty `push("/dashboard?createService=1")`; filter-empty clears; one-shot; Suspense-safe.
- [x] 4.2 GREEN `app/(app)/service-events/serviceEventsManager.tsx`, `app/(app)/dashboard/page.tsx` await `searchParams`, `ServicesDashboard.tsx` open+`replace`. Check tests.

## Phase 5: Identity

- [x] 5.1 RED `tests/schemas.test.ts`, `tests/services-lifecycle.test.ts`: PUT 400 `IDENTITY_PROTECTED`; storage omit; UI locked; 409 holds.
- [x] 5.2 GREEN `lib/schemas.ts` `GENERIC_EDIT_OMIT`; `app/api/services/route.ts` reject before Zod; `lib/storage.ts` omit; `components/services/ServicesModal.tsx` read-only. Check tests.

## Phase 6: RUT Lookup

- [x] 6.1 RED `tests/unit/rut.test.ts`, `tests/pocketbase-filter.test.ts`: `isRutShapedLookup`; bound `{:rutSearch}` vs raw; `isValidRut` writes unchanged.
- [x] 6.2 GREEN `lib/rut.ts`, `lib/pocketbase-filter.ts`, GET search in `app/api/services/route.ts`. Check tests.

## Phase 7: Custody, Lockup, Docs

- [x] 7.1 RED receipt tests + `tests/unit/visual.test.ts`: title `Comprobante de recepción y custodia`; disclaimer `Este documento acredita la recepción del equipo para servicio y custodia. No constituye documento tributario, no es boleta ni factura y no acredita pago. Sin validez tributaria ante el SII.`; 58mm; escape; no QR; lockup AA; print `Imprimir comprobante`.
- [x] 7.2 GREEN `lib/custody-receipt.ts`, `components/services/ServicesDetailsModal.tsx`, `assets/brand/bodega-tecnica-mark.svg`, `components/brand/bodega-tecnica-mark.tsx` (drop filename `sr-only`).
- [x] 7.3 GREEN `git rm` `ARCHITECTURE.md`; drop cites in `docs/CODEBASE-GUIDE.md`, `openspec/config.yaml` only. Check visual/shell tests.
