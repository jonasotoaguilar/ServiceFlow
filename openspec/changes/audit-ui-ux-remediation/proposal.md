# Proposal: Audit UI/UX Remediation

## Intent

Operators cannot trust counts, shell, loading, or domain actions. Cards count the current page (`ServicesDashboard.tsx:194-218`); Completadas zeros totals while PocketBase pending=1. Dashboard Navbar `top=32` at 1280 vs Sedes/Movimientos `top=0`. Table unmounts to `Cargando...`. Status/location sit in generic edit. RUT lacks módulo-11. UI says Completada. POST honors client status. Logs store transfers.

## Scope

### In Scope

Global stats, not page or status-card. Search/location do not change cards (exploration recommendation). Semantic card tokens; no dynamic Tailwind interpolation. Boneyard exact-layout skeletons; refetch keeps table + `aria-busy`; reduced-motion static; no `Cargando...` cut; no layout shift. Eliminate the current 32px dashboard top/side displacement at 1280 (before-state evidence only). One shared shell: Navbar `top:0`, equal framing/gutters/`max-w-7xl` across dashboard/Sedes/Registro/mobile. Generic edit ≠ status transition ≠ location transfer; auditable. ≥1 active/default location; bootstrap + server block zero; empty users: ensure-on-auth; no compatibility layers. Shared RUT módulo-11 client+server; required. `completed` displays `Entregada`; storage unchanged. Create always `pending`; UI cannot pick status; server enforces. Movimientos → `Registro`; transfers + status transitions; filter + pagination. Taller Claro on tables/modal/login: opaque `bg-surface`, no glass/blur; 44px IconButton; `destructive` red errors; UTC dates; `next-themes` system+Navbar toggle. Boneyard via `pnpm add boneyard-js`.

### Out of Scope

CSV historic import; unrelated backend/security; clock-based theme switching; speculative compatibility layers; hosting/infra.

## Capabilities

### New Capabilities
- `dashboard-operations`: stats, tokens, Boneyard
- `authenticated-app-shell`: shell, Taller Claro, a11y
- `service-lifecycle`: edit vs status/transfer; pending create; Entregada
- `location-invariants`: ≥1 active/default; bootstrap; no zero
- `chilean-rut`: módulo-11 client+server; required
- `service-events`: rename; transfer+status; filter+pagination

### Modified Capabilities
None

## Approach

Keep stack. Server stats; shared shell; dedicated status/transfer contracts; shared RUT validator; `statusLabel`; DESIGN.md tokens. Delivery: `auto-chain`, 400-line budget; multiple autonomous slices. Boundaries deferred to sdd-tasks. Do not select `chain_strategy`.

## Affected Areas

Dashboard, Navbar, layouts, locations, locationLogs, storage, services API, schemas, RUT helper, collections JSON, globals.css, lockfile (`boneyard-js` apply-only).

## Risks

Class purge (High: explicit tokens). `boneyard-js` supply chain (Med: verify then pin). Oversized PRs (High: sdd-tasks slices).

## Rollback Plan

Revert PRs. Remove `boneyard-js` if added. Schema additive; do not migrate `completed`.

## Dependencies

`DESIGN.md`; pnpm 11; no credentials.

## Success Criteria

- [ ] Cards stable across pagination, status, search, location (desktop+mobile); semantic tokens; Boneyard bones; refetch `aria-busy`; reduced-motion static; no `Cargando...` cut
- [ ] Header `top===0` `bottom===65`, equal gutters on dashboard/Sedes/Registro at 1280 and 390
- [ ] Generic edit cannot change status/location; no zero locations; invalid RUT rejected client+server; `completed` shows `Entregada`; create forced `pending`
- [ ] Registro lists transfers and status changes with filter+pagination; UI matches Taller Claro Operacional; zoom, 44px, dialog a11y, reduced motion
