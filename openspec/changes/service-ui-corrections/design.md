# Design: Service UI Corrections

## Technical Approach

Eight local corrections on the existing Next.js 16 + PocketBase operate stack. No new collections, query names, or brand tokens. Specs: `dashboard-operate-plus`, `registro-primary-surface`, `app-shell-page-rhythm`, `service-identity-immutability`, `service-search-normalization`, `service-custody-acknowledgment`, `bodega-tecnica-identity`. `PRODUCT.md`/`DESIGN.md` stay read-only until archive.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Scalar `statusFilter` vs Radix Select | Least churn vs shared primitive | Keep custom dropdown; `ServiceStatus \| ""`; close after pick |
| Table scroll vs sticky Acciones | Spec asks gutter+scroll | `overflow-x-auto` on table region; sticky not required |
| Server `searchParams` vs client `useSearchParams` | Next 16 async params avoid CSR bailout | Await on `dashboard/page.tsx`; client `replace` once |
| Dual RUT column vs bind-time normalize | Schema vs lookup-only | No new field; RUT-shaped → extra bound `{:rutSearch}` |
| Silent omit vs 400 on identity keys | Spec requires reject | `Object.hasOwn` → 400 `IDENTITY_PROTECTED` before Zod |
| Bitmap logo vs SVG | Geometry must stay vector | Refine `bodega-tecnica-mark.svg` + TSX; no raster |

## Data Flow

Exclusive status:

    toolbar pick → statusFilter: Status|"" → GET ?status=pending|omit
    GET takes first allowlisted token only → serviceListBinding status:[one]

Create trigger:

    Registro true-empty → router.push("/dashboard?createService=1")
    DashboardPage await searchParams → initialCreateService
    ServiceDashboard opens modal once → router.replace("/dashboard")
    filtered-empty → clearFilters only

Identity write:

    UI omits clientName/invoiceNumber/sku
         │
         ▼
    PUT Object.hasOwn(identity) ──400 IDENTITY_PROTECTED──► no write
         │ absent
         ▼
    GenericEditSchema.omit(lifecycle+identity) → updateService payload omit same

RUT lookup: strip `[.\-\s]`; if `^\d+[0-9Kk]?$` then `rut ~ {:rutSearch}` with `normalizeRut`; name/invoice keep raw `{:search}`. Persistence still `normalizeRut` + `isValidRut`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `components/services/ServicesDashboard.tsx` | Modify | Scalar status; table overflow owner; consume create trigger |
| `components/services/ServicesTable.tsx` | Modify | Desktop `overflow-x-auto` + right gutter; mobile cards unchanged |
| `app/(app)/layout.tsx` | Modify | `max-w-7xl 2xl:max-w-[1600px]`; keep `px-4 sm:px-6 lg:px-8 py-8` |
| `components/layout/Navbar.tsx` | Modify | Same 2xl width as `main` |
| `app/(app)/locations/locationsManager.tsx` | Modify | `text-2xl font-semibold tracking-tight`; shared header/toolbar band |
| `app/(app)/service-events/serviceEventsManager.tsx` | Modify | True-empty `push("/dashboard?createService=1")` |
| `app/(app)/dashboard/page.tsx` | Modify | Await `searchParams`; pass `initialCreateService`; Suspense if any client URL hook remains |
| `lib/schemas.ts` | Modify | Export `GENERIC_EDIT_OMIT` (lifecycle + identity) |
| `app/api/services/route.ts` | Modify | Identity `Object.hasOwn` 400; GET first status token; RUT-shaped search |
| `lib/storage.ts` | Modify | `updateService` omit identity |
| `components/services/ServicesModal.tsx` | Modify | Edit: read-only identity, strip from PUT |
| `lib/rut.ts` | Modify | `isRutShapedLookup` |
| `lib/pocketbase-filter.ts` | Modify | Bound raw + optional `rutSearch` |
| `lib/custody-receipt.ts` | Create | Escape + 58mm HTML mapping |
| `components/services/ServicesDetailsModal.tsx` | Modify | Use helper; no QR |
| `assets/brand/bodega-tecnica-mark.svg` | Modify | Stronger shelf-grid geometry |
| `components/brand/bodega-tecnica-mark.tsx` | Modify | Sync SVG; accessible name; drop filename `sr-only` |
| `docs/CODEBASE-GUIDE.md`, `openspec/config.yaml` | Modify | Drop live `ARCHITECTURE.md` cites |
| `ARCHITECTURE.md` | Delete | Stage `git rm`; do not replace |
| `PRODUCT.md` | Archive-only | Citation cleanup; not Apply |
| Tests listed below | Modify/Create | RED for exclusive status, identity 400, RUT lookup, trigger, shell 2xl |

## Interfaces / Contracts

```ts
export const IDENTITY_FIELDS = ["clientName", "invoiceNumber", "sku"] as const;
// PUT 400 { error, code: "IDENTITY_PROTECTED" } — no persist
// 409 IMMUTABLE_STATUS and 400 LIFECYCLE_PROTECTED unchanged
// GET status: first allowlisted token or omit; no new query names
```

Mutable generic edit: `contact`, `failureDescription`, `email`, `repairCost`, `notes` (plus existing `product`/`rut`/`entryDate`). Status/location stay on PATCH routes.

Receipt copy (Chilean Spanish, classified): title `Comprobante de recepción y custodia` (`inference`); disclaimer exact research string (`inference`+`UX`); retiro line (`UX`); omit email/cost/notes when absent; no accessories/condition unless stored; boleta labeled folio interno; no QR/DTE/pago/garantía-as-this-doc.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Exclusive status; `isRutShapedLookup`; PUT 400 + storage omit; receipt escape/copy; shell 2xl | Vitest; rewrite `toggleStatusInFilter` asserts in `dashboard-operate-plus.test.tsx`; extend `shell.test.ts` |
| Integration | Edit form omits identity; Registro true-empty push; filtered-empty clears | Testing Library + mocked `next/navigation` |
| E2E / rendered | Actions at 1920×1080, 1366×768, 1280×800; mobile cards 390×844, 375×667; lockup AA | Playwright + chrome-devtools; `openspec/ui.yaml` self-register |

strict_tdd: RED then GREEN. Existing tests that require `toggleStatusInFilter` or exclusive `max-w-7xl` must change in the same unit.

## Threat Matrix

N/A — no agent routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. App `searchParams` is in-process Next routing.

Security at app edges: bound `{:search}`/`{:rutSearch}` only; HTML-escape receipt fields; identity rejected at PUT not only UI.

## Migration / Rollout

No schema migration. Stage `ARCHITECTURE.md` deletion in this change. Chained PRs likely vs 800-line review budget (tasks forecast).

## Open Questions

- None blocking. A4 print remains out of scope.
