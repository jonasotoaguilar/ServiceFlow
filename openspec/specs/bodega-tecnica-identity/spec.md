# Bodega Tecnica Identity Specification

## Purpose

Bodega Técnica is future visual authority for Operate+ surfaces. Taller Claro stays incumbent-only. Identity ships new assets and a verified craft floor without research-derived palette, type, or logo claims.

## Requirements

### Requirement: Future Visual Authority

The product MUST treat Bodega Técnica as future visual authority. Taller Claro MUST remain incumbent-only evidence. `PRODUCT.md` and `DESIGN.md` MUST stay unmodified until Archive. Hierarchy MUST come from scale and grouping. Status and section emphasis MUST NOT use `border-l-4`.

#### Scenario: Authority on redesigned pages

- GIVEN Dashboard, Registro, Locations, and Navbar after this change
- WHEN an operator views those surfaces
- THEN Bodega Técnica identity rules MUST apply
- AND Taller Claro MUST NOT be treated as future authority

#### Scenario: Hierarchy without left-border crutch

- GIVEN metric, total, or section containers
- WHEN they render
- THEN visual rank MUST use size, grouping, or type—not `border-l-4`

### Requirement: New Brand Assets Without Research Claims

The system MUST ship a new brand mark and supporting assets. The current icon MUST NOT remain the sole identity. Specs and UI MUST NOT assert source-backed palette, type pairing, or logo claims. Research.md MUST NOT be used as validated identity evidence.

#### Scenario: Navbar uses new mark

- GIVEN an authenticated session
- WHEN Navbar renders
- THEN a new Bodega Técnica mark MUST appear
- AND the prior icon-only treatment MUST NOT be the only brand asset

#### Scenario: No fabricated research authority

- GIVEN identity tokens or assets
- WHEN they are documented or applied
- THEN they MUST NOT cite blocked research as source-backed palette, type, or logo proof

### Requirement: Craft Floor, Dark Contrast, and Spanish Chrome

Visible UI text MUST be at least 13px. Default operational containers MUST use `p-4`, `gap-4`, and 8px radius. Locations MUST share this floor. Dark theme MUST remain. Text and controls MUST meet computed WCAG AA against the actual surface; AAA MAY be claimed only with the same computed evidence. Unmeasured OKLCH or invented contrast claims MUST NOT be used. User-facing chrome and errors MUST be Spanish-constant.

#### Scenario: 13px floor and compact rhythm

- GIVEN Dashboard, Registro, Locations, table headers, badges, and meta
- WHEN those surfaces render
- THEN no visible text MUST be below 13px
- AND default cards, toolbars, and table wrappers MUST use `p-4`, `gap-4`, and 8px radius

#### Scenario: Dark contrast is evidenced

- GIVEN dark theme enabled
- WHEN body, labels, and status text are measured on their surfaces
- THEN contrast MUST meet WCAG AA by computation
- AND no unmeasured OKLCH claim MUST be treated as proof

#### Scenario: Spanish-constant chrome

- GIVEN dialogs, nav, buttons, and errors
- WHEN copy is shown
- THEN it MUST be Spanish
- AND English internal tokens MUST NOT appear

### Requirement: Preserved Shell and No Backend Change

App shell geometry, Boneyard exact-layout skeletons, populated-refetch `aria-busy`, dialog accessibility, and icon-plus-text status badges MUST be preserved. This capability MUST NOT change backend, schema, batch writes, RUT, pagination, or query semantics.

#### Scenario: Shell and loading contracts hold

- GIVEN authenticated layout with empty then populated lists
- WHEN first load and later refetch occur
- THEN Navbar plus `main` shell MUST remain
- AND empty first paint MUST use Boneyard skeletons
- AND populated refetch MUST expose `aria-busy` without replacing the list layout

#### Scenario: Dialogs and badges unchanged in contract

- GIVEN a status or transfer dialog and a status badge
- WHEN the operator opens the dialog or reads the badge
- THEN dialog a11y (role, focus trap, Esc, return focus) MUST remain
- AND the badge MUST include icon and text, not color alone

#### Scenario: No API or schema mutation

- GIVEN this identity change
- WHEN pages render or operators filter
- THEN request payloads, collections, and query matching MUST match current behavior
