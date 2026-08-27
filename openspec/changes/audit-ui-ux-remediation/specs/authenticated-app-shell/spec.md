# Authenticated App Shell Specification

## Purpose

One shared authenticated chrome and Taller Claro Operacional visual/a11y contract across Dashboard, Sedes, and Registro.

## Requirements

### Requirement: Single Shared Shell Geometry

Authenticated routes MUST share one shell that owns Navbar and content framing. Navbar MUST be a direct child of the viewport-filling container with `top = 0`. Header height MUST be 64px plus 1px border (65px total). The system MUST remove the current dashboard 32px top/side displacement. Gutters MUST be `px-4 sm:px-6 lg:px-8` and content `py-8`. Max width MUST be `max-w-7xl` on Navbar inner row and main. Dashboard, Sedes, and Registro MUST NOT wrap the shell in an extra `p-4 md:p-8` frame.

#### Scenario: Desktop headers match

- GIVEN viewport 1280×800
- WHEN Dashboard, Sedes, and Registro are measured at scroll 0 and after scroll
- THEN each header `top === 0`, `bottom === 65`, and `left`/`width` are equal
- AND first content `left`/`width`/`padding` are equal

#### Scenario: Mobile headers match

- GIVEN viewport 390×844
- WHEN the same three routes are measured before and after scroll
- THEN header `top === 0`, `bottom === 65`, and framing matches across routes
- AND the hamburger menu top aligns to the header bottom (`top-16`)

### Requirement: Taller Claro Operacional Surfaces

Authenticated UI MUST use DESIGN.md light semantic tokens (zinc-50 ground, white surface, zinc-900 text, ink `#2F5B8A`). Type MUST be Fira Sans with Fira Code for operational data. Density MUST be card `p-4`/`gap-4` and table `px-4`/`py-3`. Radius MUST be 8–10px on cards/inputs/buttons and 12px only on dialogs. Borders MUST be 1px hairline. The system MUST NOT use glass, backdrop-blur, glow, gradients, or runtime-dynamic color classes.

#### Scenario: Glass and glow are absent

- GIVEN Dashboard, Sedes, or Registro
- WHEN computed styles are inspected
- THEN no `backdrop-filter` blur, glow orb, or gradient fill is applied
- AND surfaces use background/surface/border tokens

### Requirement: Status, Targets, Zoom, Dialogs, Motion

Status MUST show icon plus text. Interactive controls MUST have a 44px minimum hit target. Viewport MUST allow zoom (`userScalable` true; `maximumScale` omitted or ≥5). Dialogs MUST expose `role="dialog"`, `aria-modal="true"`, focus trap, Escape close, and return focus; max height 90dvh. Motion MUST be 150–200ms transform/opacity only. Under `prefers-reduced-motion: reduce`, transitions MUST collapse and no shimmer/loop MAY run.

#### Scenario: Dialog keyboard contract

- GIVEN an open create/edit/status/transfer dialog
- WHEN Tab cycles and Escape is pressed
- THEN focus stays inside until Escape
- AND Escape closes and returns focus to the trigger

#### Scenario: Zoom is allowed

- GIVEN any authenticated or auth page
- WHEN the viewport meta is read
- THEN pinch zoom is not blocked

### Requirement: Mobile Table Progressive Disclosure

At 390×844, tables MUST surface primary row actions without requiring horizontal drag to a hidden column. The system MAY use collapsible rows, priority columns, or a card fallback. Horizontal scroll alone is not sufficient if actions stay off-screen.

#### Scenario: Actions visible on narrow viewport

- GIVEN a service row on 390×844
- WHEN the operator views the list
- THEN Ver / status / transfer / delete actions are reachable without horizontal scrolling
