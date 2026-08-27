# Dashboard Operations Specification

## Purpose

Tenant-global dashboard metrics and loading behavior so operators can trust counts and keep table layout during fetch.

## Requirements

### Requirement: Tenant-Global Stats Independent of Table Controls

The system MUST compute dashboard card counts for the authenticated tenant across all of that tenant's services. Counts MUST NOT change when the operator changes table status filter, search, location filter, or pagination. Cards MAY highlight the active table status filter. Cards MUST NOT derive values from the current page slice.

#### Scenario: Counts stay stable when Completadas is selected

- GIVEN tenant has one `pending` service and zero `completed` services
- WHEN the operator selects the Completadas / Entregada table filter
- THEN pending and other card numbers remain the prior global values
- AND the table MAY show zero rows

#### Scenario: Pagination and search do not rewrite cards

- GIVEN more services than one page and a non-empty search that matches a subset
- WHEN the operator changes page or search
- THEN card numbers remain the tenant-global totals
- AND table rows follow the control

#### Scenario: Other tenant data is excluded

- GIVEN two tenants each have services
- WHEN tenant A views the dashboard
- THEN cards count only tenant A services

### Requirement: Semantic Card Tokens With Explicit Classes

Each status card MUST use DESIGN.md semantic status tokens (`pending`, `ready`, `completed`/`Entregada`, `cancelled`) via explicit, static class or data-attribute variants. The system MUST NOT build color classes at runtime (no `border-${status}` or `border-xxx!` interpolation). Active filter emphasis MUST use token border/fill, not color alone. Status on cards MUST show icon and text.

#### Scenario: Active card uses token classes

- GIVEN the pending filter is active
- WHEN the dashboard renders
- THEN the pending card uses the pending token pair and a static active variant
- AND no interpolated Tailwind color string is present

#### Scenario: Color-only status is rejected

- GIVEN a card or badge for any status
- WHEN rendered
- THEN both a status icon and a visible status label are present

### Requirement: Exact-Layout Initial Skeleton

When the dashboard first loads with an empty service list, the system MUST show Boneyard exact-layout bones for stats and table that match desktop and mobile geometry. Bones MUST exist for 375px and 1280px. The system MUST NOT show a standalone `Cargando...` replacement. Under `prefers-reduced-motion: reduce`, bones MUST be static (no shimmer). Adding `boneyard-js` MUST wait until apply verifies version, lifecycle scripts, peers, npmjs provenance, and a pnpm lockfile pin. Implementation MUST use pnpm, not npm or `package-lock.json`.

#### Scenario: First empty load shows bones

- GIVEN no cached rows and a delayed first fetch
- WHEN the dashboard paints
- THEN stats and table bones occupy the final layout boxes
- AND no standalone `Cargando...` node is shown
- AND measured container size matches the later populated size (no layout shift)

#### Scenario: Reduced motion disables shimmer

- GIVEN `prefers-reduced-motion: reduce`
- WHEN initial bones render
- THEN fill is static solid using skeleton tokens

### Requirement: Populated Refetch Preserves Table

When rows already exist and filters or pagination refetch, the system MUST keep the table mounted with the same dimensions and visible content, set `aria-busy="true"` on the container, and MUST NOT replace it with `Cargando...` or empty bones. Overlay MAY reduce opacity. After success, `aria-busy` MUST become false. Height MUST stay stable at normal and throttled latency.

#### Scenario: Filter refetch keeps rows

- GIVEN a populated table
- WHEN the operator changes a table filter during a delayed fetch
- THEN existing rows and table height remain
- AND the container has `aria-busy="true"` until the response settles
- AND no standalone `Cargando...` appears
