# UI Design: page-ui-redesign

Supplemental experiential HOW. Specs own observable WHAT. Native `design.md` owns technical HOW. Root `DESIGN.md` stays Taller Claro incumbent-only until Archive. Binding visual authority: human-selected **Andén Ordenado** (`anden-ordenado`). Archivo Vivo and Mesa de Trazabilidad are rejected and must not be mixed in.

## Surfaces and mode

Dashboard, Registro, Locations, Navbar. Mode: **operate**. Visual authority: **redesign** (Bodega Técnica / Andén Ordenado future).

Authoritative comp: `.sdd/changes/page-ui-redesign/ui/design/bodega-anden-ordenado.png` (1280×800 + 390×844 inset).

## Confirmed direction

Warehouse bay holding warranties in course — shelf-slot/andén, not a refresh cycle. Headline band leads. Rank from scale and grouping. Tinta `#2F5B8A` is a rare stamp/action accent (primary fill + focus), never body chrome. No glass, gradient, glow, `border-l-4`, `tracking-widest`, or generic admin-template equal-tile hierarchy.

Focal order: headline + primary action → 2+3 facts → filter strip → rows.

## Composition

Dashboard (from the selected comp): headline band (`Servicios` h2, count as 13px mono, `Nuevo servicio` trailing). At 390×844 the band wraps; the action stays on-screen.

Metric block is asymmetric, never five equal tiles:

- Two large facts: Pendientes, Entregadas (ready+completed).
- Three muted secondary facts: Por Vencer, Críticos, Canceladas.

At 390 the 2+3 hierarchy is preserved (large pair stays larger; secondaries wrap smaller/muted), not flattened to equal tiles.

Toolbar is a low strip/bar (hairline, no shadow, not an elevated surface): search + sort, then compact sede/estado. `gap-3` inside the strip; `gap-6` between sections. Table wrapper `rounded-sm`; cells `px-4 py-3`.

Registro: same headline rhythm. Filters remain a visible strip (Desde, Hasta, Tipo, Estado, Sede). Operational ids (boleta, dates, origin→destination, actor) use ch-aligned Fira Code. Do not add Mesa’s second audit ply on Dashboard.

Locations: same craft floor.

## Type / color / material

Keep Fira Sans/Code via `next/font`. Visible text ≥13px; drop `tracking-widest` and `text-[10px]`. Labels: 13px medium, 0.01em. Large metric numbers ~32px/600 on the pair; ~20px/600 on secondaries. Boleta/RUT/dates/origin→destination/actor: `font-mono` with ch-aligned columns.

Material: zinc / tinta / papel. Light zinc + slate-blue primitives stay. Dark is a composed zonal ramp of existing hex, not an invert and not OKLCH invention. Stamp accent is rare. Days chips use semantic pending/ready/cancelled tokens, not raw `*-500/10`.

## Identity

Mark: 32×32 authored SVG, 2px stroke, `currentColor`, 8px square, 2×2 shelf slot with one filled bay. Wordmark “Bodega Técnica”. Product name ServiceFlow is muted and hidden at 390px. Do not ship a generated raster crop. `assets/icon/icon.png` is no longer the sole mark.

## Interaction / motion

Metrics are not pointer or keyboard controls. Filters stay the existing strip widgets. Motion 150–200ms opacity/transform only; no `transition-all` on facts; no playful gravity. Keep the global reduced-motion collapse.

## Responsive

390×844 is authoritative: create action visible; 2+3 hierarchy preserved; filters wrap (search full width, then Recientes / sede / estado); boleta, sede, ingreso, días, estado, and actions stay in viewport without horizontal overflow. Product may truncate. Desktop keeps the full table. `IconButton` stays 44px.

## States

Loading: Boneyard exact-layout on empty first paint (`dashboard-stats`, `dashboard-table`); populated refetch overlay + `aria-busy`. Empty: one-line Spanish explanation plus create or clear. Error: Spanish problem plus retry; no English `status`/`transfer` tokens. Badges: icon + text.

## Design-system delta

Change-local only: craft floor `p-4/gap-4/8px`, Bodega lockup, dark subtle remap, 2+3 metric topology, strip toolbar. Do not edit root `DESIGN.md` in this change.

## Verification

- Squint: headline > 2 large facts > 3 muted facts > strip > table. Not five equal tiles. Not an elevated toolbar surface.
- 390×844 first viewport: action, 2+3, wrapped filters, operational fields and row actions visible, unclipped.
- Computed AA for body, labels, status, and controls against the actual surface and the 11-step ramp.
- Keyboard skips metrics; strip remains reachable.
- No `border-l-4`, glass, gradient, glow, or `tracking-widest` used as rank.
