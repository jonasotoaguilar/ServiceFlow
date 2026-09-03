# UI Design: service-ui-corrections

## Surfaces and mode

Operate. Services, Registro, Locations inherit Taller Claro / Bodega Técnica. Receipt print and 2xl shell **extend** that world. Brand mark is identity refinement, not a new world. No `design/chosen.yaml`. Tokens in root `DESIGN.md` stay frozen.

## Direction and hierarchy

Workshop-bright, compact, zinc + ink `#2F5B8A`. Task path: headline → facts → toolbar → list → row action. Squint order must stay: title/count, primary create, filters, records, Acciones. Locations currently leads with a denser `text-xl font-bold` stack; it must optically match Servicios/Registro (`text-2xl font-semibold tracking-tight`, `gap-4 mb-6` band).

## Composition

Shared authenticated column: `max-w-7xl` until 2xl, then `max-w-[1600px]`, gutters `px-4 sm:px-6 lg:px-8 py-8`. Navbar inner row uses the same cap so lockup, nav, and content share one edge. Locations toolbar drops the isolated card chrome for the operate band: `border-y bg-surface/50 px-4 py-3`. Metrics stay non-interactive facts; filters stay a separate strip.

Overflow ownership: page never scrolls sideways. Desktop table region owns `overflow-x-auto custom-scrollbar` and a right gutter so Acciones sit fully in the pane at 1280/1366/1920. Parent list card must not `overflow-hidden` clip that gutter. Below `md`, keep card list; boleta, sede, ingreso, días, estado, actions stay in the 390/375 viewport without horizontal page overflow.

Estado control: one selected chip/check, not stacked pills. All-status is a single reset row. Close the menu after pick so it reads as radio, not multi-toggle.

## Type, color, material

No new fonts, hues, radii, or shadows. Headlines: Fira Sans 24px/600/−0.015em. Operational IDs stay Fira Code. Status still icon+text on tinted badges. Receipt print is thermal ink on paper: black dashed rules, 8–10pt, no zinc UI chrome, no primary fill, no QR.

## Identity / lockup

Evolve the existing 32×32 shelf-grid: outer frame, 2×2 bays, one filled bay. Strengthen geometry (optical ~1.5px stroke at 32, slightly tighter inner inset, rx ~1.5 on the 16px frame) so the mark reads at Navbar `h-8`. Keep filled bay top-left. Wordmark “Bodega Técnica” + muted “ServiceFlow” (hidden below `sm`). Decorative SVG `aria-hidden`; accessible name is the visible wordmark—remove the filename `sr-only`. Contrast: `on-primary` on `primary` (existing 7.04:1). Sync `assets/brand/bodega-tecnica-mark.svg` with the TSX inline path. No generated PNG.

## Interaction and motion

150–200ms opacity/transform only. Dropdown close on select. Dialogs keep role, trap, Esc, return focus. Create from Registro is a one-shot interrupt: modal opens, URL trigger vanishes, refresh does not replay. Filtered empty is recovery (clear), not create.

## States

True-empty: explanation + `Nuevo servicio`. Filtered-empty: no-matches + `Limpiar filtros`. Edit identity fields: read-only mono display, not disabled-looking inputs that still submit. Receipt omits correo, costo, and notas when empty—no blank cost box. Loading: Boneyard first paint; populated refetch `aria-busy` overlay, no list swap.

## Design-system delta

Documented 2xl content width (1600px) as the only shell geometry change. Shared title/toolbar rhythm. Refined lockup asset. Print template is a custody document, not a UI card. Promote into root `DESIGN.md` only at archive.

## Verification

Rendered at 1920×1080, 1366×768, 1280×800, 390×844, 375×667: header top 0 / height 65; three pages same content width; Acciones unclipped; mobile cards unclipped; lockup legible AA; receipt 58mm title+disclaimer, no QR. Contrast and 44px targets per `DESIGN.md`.
