# Proposal: Service UI Corrections

## Intent

Fix clipped actions, multi-select status, Registry empty-state mismatch, identity edit drift, RUT search friction, thin custody print, weak lockup, and stale `ARCHITECTURE.md` refs.

## Scope

### In Scope
- Single-select status; reachable table actions/gutter; 1920 and smaller rhythm; Locations title/spacing
- Registry true-empty `Nuevo servicio` opens Services create modal; filtered-empty clears filters
- Mutable: `contact`, `failureDescription`, `email`, `repairCost`, `notes`. Immutable UI+server/storage: client, boleta/`invoiceNumber`, SKU. Lookup-only RUT normalize; persist `isValidRut`
- 58mm custody print (not boleta/factura/DTE/pago/garantía; no QR); stronger shelf-grid lockup
- Keep `ARCHITECTURE.md` deletion; update `PRODUCT.md`, `docs/CODEBASE-GUIDE.md`, `openspec/config.yaml`

### Out of Scope
- Multi-select, dual RUT columns, SII DTE, QR, A4 replacement, rebrand, import, legal-requirement claims, compatibility shims

## Capabilities

### New Capabilities
- `service-identity-immutability`: client, boleta, SKU immutable on generic edit
- `service-search-normalization`: lookup normalize; persistence validation unchanged
- `service-custody-acknowledgment`: 58mm custody print; classified copy
- `app-shell-page-rhythm`: 2xl shell; shared rhythm; Locations title/spacing

### Modified Capabilities
- `dashboard-operate-plus`: single-select status; reachable table actions
- `registro-primary-surface`: true-empty opens Services modal; filtered-empty clears filters
- `bodega-tecnica-identity`: stronger lockup; documented 2xl shell; tokens unchanged

## Approach

Preproposal r4 confirmed; research r4 `done`.

- `statusFilter: ServiceStatus | ""`; table `overflow-x-auto` + 2xl `max-w-[1600px]`; Locations `text-2xl font-semibold tracking-tight`; `?createService=1` then `replace`
- Schema omit + PUT 400 + storage omit + read-only UI; normalize search only if stripped input matches `^\d+[0-9Kk]?$`
- 58mm is `product choice`. Title `Comprobante de recepción y custodia` (`inference` C-01–C-04). Disclaimer (`inference`+`UX`, not `law`): `Este documento acredita la recepción del equipo para servicio y custodia. No constituye documento tributario, no es boleta ni factura y no acredita pago. Sin validez tributaria ante el SII.` SERNAC 6-month garantía `regulator guidance` (C-05), not repair custody. QR excluded.
- Evolve `bodega-tecnica-mark.svg`; inherit DESIGN.md; stage `git rm`

## Affected Areas

- `ServicesDashboard.tsx`, `ServicesTable.tsx`: filter, overflow, actions
- `layout.tsx`, `locationsManager.tsx`: 2xl width; Locations rhythm
- `serviceEventsManager.tsx`: true-empty navigation
- `ServicesModal.tsx`, `api/services`, `schemas.ts`, `storage.ts`: immutability
- `pocketbase-filter.ts`, `rut.ts`: lookup normalize; `ServicesDetailsModal.tsx`: 58mm template
- `bodega-tecnica-mark.tsx`, `assets/brand/*`: lockup
- `ARCHITECTURE.md` removed; `PRODUCT.md`, `CODEBASE-GUIDE.md`, `openspec/config.yaml` refs

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| RUT hits names | Med | RUT-shaped only |
| Schema drift | Med | Same omit |
| Overflow vs 1920 | Med | Scroll + 2xl |
| Receipt overclaim | Med | Evidence labels |

## Rollback Plan

Revert the PR. No schema migration.

## Dependencies

Research r4 `done` (S-01–S-09). `lib/rut.ts`.

## Success Criteria

- [ ] Single-select; actions reachable 1280–1920; 390px priority; three-page rhythm
- [ ] True-empty opens create modal; filtered-empty clears
- [ ] PUT/UI block client/boleta/SKU; mutable fields save; RUT variants match; persist validation strict
- [ ] Custody print without DTE/boleta/factura/pago/garantía/QR; lockup refined; `ARCHITECTURE.md` deleted
