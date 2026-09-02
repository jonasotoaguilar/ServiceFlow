# Design: Page UI Redesign

## Technical Approach

Implement human-selected Andén Ordenado (`anden-ordenado`) in existing App Router client managers. Specs: `bodega-tecnica-identity`, `dashboard-operate-plus`, `registro-primary-surface`. Archivo Vivo (five equal tiles) and Mesa de Trazabilidad (Dashboard second-ply) are rejected and MUST NOT merge. No backend, schema, query, RUT, or pagination change. Roots stay read-only until Archive.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|---|---|---|---|
| World | Andén / 5-equal / Mesa | 5-equal is flat; Mesa leaks Registro | Andén Ordenado only |
| Metrics | `toggleStatus` buttons / 2+3 articles | Split is more layout | Two large + three muted articles; delete `toggleStatus`; keep `toggleStatusInFilter` |
| Toolbar | Elevated `rounded-lg p-4` / hairline strip | Elevation competes with facts | `border-y` strip; no shadow |
| Rank | `border-l-4` / scale+group | Left border is a crutch | Size, grouping, type |
| Mark | Recolor cycle icon / authored SVG | Icon-only fails spec | Shelf-slot SVG 32×32, 8px, 2px stroke |
| Type/color | New families / Fira + zinc/tinta/papel | New type reads as research | Fira Sans/Code; tinta `#2F5B8A` stamp only |
| Dark AA | Invent OKLCH / token hex + 11-step ramp | Unmeasured OKLCH banned | Compute `.dark` pairs; remap `#71717a` to `#a1a1aa` |
| Empty | Italic / `PageEmptyState` | Extra UI file | Shared component; not `Alert` |
| 390×844 | `overflow-x-auto` / stack | Overflow hides actions | Structural stack; product may truncate |

## Data Flow

```
Navbar lockup → sticky shell (unchanged)
DashboardPage → ServiceDashboard
  headline → 2+3 facts (display)
  strip → existing /api/services params
  first empty load → Boneyard dashboard-stats | dashboard-table
  refetch → aria-busy
Registro → ServiceEventsManager (always mounted)
  getServiceEvents → list | PageEmptyState | retry
```

```
Operator → strip → setState → 300ms debounce
  → GET /api/services?page,limit,search,status,location,sortOrder
  → table mounted + aria-busy
  → facts never write filters
```

## File Changes

Create: `assets/brand/bodega-tecnica-mark.svg`, `components/brand/bodega-tecnica-mark.tsx` (SVG lockup, not `next/image`), `components/ui/page-empty-state.tsx`, `tests/unit/dark-contrast.test.ts`, `tests/unit/dashboard-operate-plus.test.tsx`, `tests/unit/registro-primary-surface.test.tsx`.

Modify: `styles/globals.css` (`.dark` subtle remap); `components/layout/Navbar.tsx` (lockup; Servicios, Registro, Sedes; drop glow); `components/services/ServicesDashboard.tsx` (headline first; 2+3 articles; strip; `Nuevo servicio` in band); `components/services/ServicesTable.tsx` (13px; semantic days; 390 stack); `app/(app)/service-events/page.tsx` (always mount; `initialError`); `app/(app)/service-events/serviceEventsManager.tsx` (empty/error; 390; `aria-busy`; ch-mono ids); `app/(app)/locations/locationsManager.tsx` (craft floor; no `border-l-4`).

Keep: `app/(app)/layout.tsx` shell gutters; `DESIGN.md` read-only.

## Interfaces / Contracts

Keep `fetchServices` keys and `getServiceEvents` params. `getServiceStats` unchanged; Entregadas = `ready + completed` display-only.

```tsx
type PageEmptyStateProps = { title: string; description: string; actionLabel: string; onAction: () => void };
type ServiceTableEmpty = { emptyMode: "true-empty" | "filtered"; onEmptyAction: () => void };
```

Nav: Servicios, Registro, Sedes. Keep `card-pending|ready|upcoming|critical|cancelled` on articles (`card-ready` = Entregadas).

11-step ramp (existing hex): `#ffffff` `#fafafa` `#f4f4f5` `#e4e4e7` `#d4d4d8` `#a1a1aa` `#71717a` `#52525b` `#3f3f46` `#27272a` `#18181b`. `#fafafa` on `#18181b` 16.97:1; `#71717a` on `#18181b` 3.67:1 fails body — remap to `#a1a1aa` 6.91:1. `#3a6fa3` on `#18181b` 3.36:1 and on `#27272a` 2.82:1 — stamp fill only (`#ffffff` on `#3a6fa3` 5.27:1). No 13px muted text on `#3f3f46` (4.07:1). Status pairs already AA.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | AA+ramp; no `border-l-4`; 13px; 2+3 not five buttons; metrics not tabbable; nav | Vitest+RTL; RED first |
| Integration | Strip-only filter; true vs filtered empty; retry | RTL; keep `service-events-filters` |
| Contract | Shell, Boneyard, `aria-busy`, dialog a11y, icon+text badges | Existing `shell`/`bones`/`visual`/`tokens` |
| Rendered | 390×844 action, 2+3, wrapped filters, unclipped fields | Playwright |

`strict_tdd: true`. Query/lifecycle/RUT tests stay green. No new packages.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR, executable-file, or process-integration boundary. Navbar reuses existing `Link` hrefs.

## Migration / Rollout

No schema or flags. Auto-chain; each slice under 400 reviewer lines and never over 800 authored lines:

1. Identity — tokens, ramp tests, BrandMark, Locations craft, Navbar lockup (order unchanged).
2. Dashboard Andén Ordenado — headline, 2+3, strip, 390 table, Spanish dialogs.
3. Registro — nav order, empty/error retry, 390 rows, `aria-busy`.

Rollback: revert slice PRs.

## Open Questions

None.
