# Registro Specification

## Purpose

Replace Movimientos with Registro: tenant-isolated history of transfers and status changes, filterable and paginated.

## Requirements

### Requirement: Transfer and Status Event Kinds

Registro MUST persist two kinds: `transfer` and `status`. Each event MUST record actor, timestamp, and before/after values (`fromLocationId`/`toLocationId` or `fromStatus`/`toStatus`). Transfer events MUST be written only by a successful location transfer. Status events MUST be written only by a successful dedicated status transition. Generic field edits MUST NOT write Registro events.

#### Scenario: Transfer appears in Registro

- GIVEN a successful transfer A → B by user U at time T
- WHEN Registro is listed for that tenant
- THEN one `transfer` row shows U, T, A → B

#### Scenario: Status change appears in Registro

- GIVEN a successful `pending` → `ready` by user U at time T
- WHEN Registro is listed
- THEN one `status` row shows U, T, `pending` → `ready`
- AND `completed` displays as `Entregada` while storage stays `completed`

#### Scenario: Failed mutation writes nothing

- GIVEN a rejected transfer or disallowed status change
- WHEN Registro is listed
- THEN no new event exists

### Requirement: Filters, Pagination, Tenant Isolation

Registro MUST filter by kind, date range, location, and status. Lists MUST paginate with a stable sort (newest first). A user MUST only read events for their tenant. Cross-tenant ids MUST not leak rows. Unauthenticated access MUST be denied.

#### Scenario: Kind filter

- GIVEN transfer and status events
- WHEN the operator filters kind=`transfer`
- THEN only transfer rows are returned

#### Scenario: Date, location, and status filters

- GIVEN events on two days, two locations, and mixed statuses
- WHEN the operator applies date range, location, or status
- THEN only matching events are returned
- AND pagination still pages the filtered set

#### Scenario: Other tenant events are hidden

- GIVEN tenant B has events
- WHEN tenant A lists Registro
- THEN B's events are absent even if A guesses ids

### Requirement: Consistent Authenticated Display

The surface label MUST be `Registro`, not `Movimientos`. Layout, gutters, Navbar, density, badges, and mono timestamps MUST match Dashboard and Sedes. On 390×844, primary event fields (kind, from → to, time, actor) MUST be readable without horizontal drag to reveal them.

#### Scenario: Nav and heading say Registro

- GIVEN an authenticated session
- WHEN Navbar and the history page render
- THEN the visible name is `Registro`

#### Scenario: Mobile event row is readable

- GIVEN a transfer event on 390×844
- WHEN the list renders
- THEN kind, from → to, actor, and time are visible without horizontal scrolling
