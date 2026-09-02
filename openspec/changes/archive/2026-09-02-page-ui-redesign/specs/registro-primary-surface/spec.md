# Registro Primary Surface Specification

## Purpose

Registro is the second primary operator surface after Dashboard. Empty and error recovery stay Spanish-constant and contextual. Existing always-visible filters and query semantics stay unchanged.

## Requirements

### Requirement: Registro Nav Rank Two

Navbar MUST present Registro as the second primary destination immediately after Dashboard. Registro MUST remain reachable from desktop and 390px navigation. Rank MUST NOT place Registro after Locations or other secondary items.

#### Scenario: Desktop nav order

- GIVEN an authenticated desktop Navbar
- WHEN destinations render
- THEN Dashboard MUST be first primary
- AND Registro MUST be the next primary destination

#### Scenario: 390px nav order

- GIVEN authenticated Navbar at 390px
- WHEN the operator opens navigation
- THEN Dashboard MUST appear first
- AND Registro MUST appear second among primary destinations

### Requirement: Contextual Empty States

When Registro has no rows, the page MUST show a Spanish-constant explanation and a contextual next action. True-empty MUST offer create. Filter-empty MUST offer clear or equivalent recovery. Empty MUST NOT be italic-only text without an action.

#### Scenario: True empty offers create

- GIVEN Registro with no events and no active filters
- WHEN the list region renders
- THEN Spanish copy MUST explain there are no records
- AND a contextual create action MUST be available

#### Scenario: Filtered empty offers recovery

- GIVEN Registro filters that match zero rows
- WHEN the empty state renders
- THEN Spanish copy MUST explain no matches
- AND a contextual action MUST let the operator clear filters

### Requirement: Contextual Error States

Load or action failures MUST show Spanish-constant copy that names the problem and a recovery action. Errors MUST NOT expose English internal tokens. Successful retry MUST restore the list without changing filter or query semantics.

#### Scenario: Load failure offers retry

- GIVEN Registro fails to load
- WHEN the error state renders
- THEN the message MUST be Spanish-constant and name the failure
- AND a retry or equivalent recovery action MUST be available

#### Scenario: Action failure stays Spanish

- GIVEN an in-page Registro action fails
- WHEN the error is shown
- THEN copy MUST be Spanish-constant
- AND English tokens such as status or transfer MUST NOT appear

### Requirement: Preserved Filter Visibility and Queries

Always-visible Registro filters from `registro-filter-visibility` MUST remain. Desde, Hasta, Tipo, Estado, Sede, and clear MUST stay visible without outer collapse. Filter matching, pagination, and query fields MUST be unchanged. This capability MUST NOT change backend, schema, batch writes, RUT, or query semantics.

#### Scenario: Filters stay visible after rank change

- GIVEN `/service-events` after Registro is nav rank 2
- WHEN the page first paints
- THEN filter controls MUST be visible without activation
- AND no outer collapse control MUST exist

#### Scenario: Filter change does not add query behavior

- GIVEN filtered Registro results
- WHEN the operator changes Tipo, Estado, Sede, Desde, or Hasta
- THEN matching MUST follow current semantics
- AND this capability MUST NOT reset pagination beyond current behavior

### Requirement: 390px Operational Context

At 390px, Registro rows MUST keep operational context on-screen: boleta, sede or origin/destination context, ingreso or date, estado or tipo as applicable, and actions. Product MAY be summarized. Horizontal page overflow MUST NOT hide actions.

#### Scenario: Row context at 390px

- GIVEN at least one Registro row at 390×844
- WHEN the row renders
- THEN boleta, location context, date, status or type, and actions MUST remain in viewport
- AND product MAY be summarized
