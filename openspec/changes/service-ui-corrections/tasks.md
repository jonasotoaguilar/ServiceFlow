# Tasks: Service UI Corrections

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1600–2200 |
| 400-line budget risk | High |
| 800-line session budget | Exceeded as one PR |
| Chained PRs recommended | Yes |
| Suggested split | 7 gh-stack slices |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
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
| 7 | Custody + lockup + docs | PR 7 | `tests/unit/visual.test.ts` `tests/unit/shell.test.ts` | 58mm no QR; Navbar AA | custody, brand, `ARCHITECTURE.md`, guide, config |

## Phase 1: Exclusive Status

- [x] 1.1 RED `tests/unit/dashboard-operate-plus.test.tsx`: drop `toggleStatusInFilter`; replace-one; all-status omits; GET first token.
- [x] 1.2 GREEN `components/services/ServicesDashboard.tsx` + GET `app/api/services/route.ts`: `statusFilter: ServiceStatus \| ""`; close on pick. Check that file.

## Phase 2: Reachable Actions

- [x] 2.1 RED same test: Acciones unclipped 1280/1366/1920; cards 390/375.
- [x] 2.2 GREEN `components/services/ServicesTable.tsx` `overflow-x-auto` + gutter; no parent clip. Check + chrome-devtools those viewports.

## Phase 3: Shell Rhythm

- [ ] 3.1 RED `tests/unit/shell.test.ts`, `tests/unit/locations.test.ts`: `2xl:max-w-[1600px]`; Locations `text-2xl font-semibold tracking-tight`.
- [ ] 3.2 GREEN `app/(app)/layout.tsx`, `components/layout/Navbar.tsx`, `app/(app)/locations/locationsManager.tsx`. Check tests.

## Phase 4: Registro Create

- [ ] 4.1 RED `tests/unit/registro-primary-surface.test.tsx`: true-empty `push("/dashboard?createService=1")`; filter-empty clears; one-shot; Suspense-safe.
- [ ] 4.2 GREEN `app/(app)/service-events/serviceEventsManager.tsx`, `app/(app)/dashboard/page.tsx` await `searchParams`, `ServicesDashboard.tsx` open+`replace`. Check tests.

## Phase 5: Identity

- [ ] 5.1 RED `tests/schemas.test.ts`, `tests/services-lifecycle.test.ts`: PUT 400 `IDENTITY_PROTECTED`; storage omit; UI locked; 409 holds.
- [ ] 5.2 GREEN `lib/schemas.ts` `GENERIC_EDIT_OMIT`; `app/api/services/route.ts` reject before Zod; `lib/storage.ts` omit; `components/services/ServicesModal.tsx` read-only. Check tests.

## Phase 6: RUT Lookup

- [ ] 6.1 RED `tests/unit/rut.test.ts`, `tests/pocketbase-filter.test.ts`: `isRutShapedLookup`; bound `{:rutSearch}` vs raw; `isValidRut` writes unchanged.
- [ ] 6.2 GREEN `lib/rut.ts`, `lib/pocketbase-filter.ts`, GET search in `app/api/services/route.ts`. Check tests.

## Phase 7: Custody, Lockup, Docs

- [ ] 7.1 RED receipt tests + `tests/unit/visual.test.ts`: title `Comprobante de recepción y custodia`; disclaimer; escape; no QR; lockup AA; no `ARCHITECTURE.md`.
- [ ] 7.2 GREEN `lib/custody-receipt.ts`, `components/services/ServicesDetailsModal.tsx`, `assets/brand/bodega-tecnica-mark.svg`, `components/brand/bodega-tecnica-mark.tsx` (drop filename `sr-only`).
- [ ] 7.3 GREEN `git rm` `ARCHITECTURE.md`; drop cites in `docs/CODEBASE-GUIDE.md`, `openspec/config.yaml` only. Check visual/shell tests.
