# Delta for Registro Primary Surface

## MODIFIED Requirements

### Requirement: Contextual Empty States

When Registro has no rows, the page MUST show a Spanish-constant explanation and a contextual next action. True-empty (no events and no active filters) MUST offer create that navigates to Services with a one-shot `createService` trigger and MUST open the Services create modal exactly once, then remove the trigger so refresh or back-forward MUST NOT reopen it. Filter-empty MUST only clear filters and MUST NOT open create or navigate to Services. Empty MUST NOT be italic-only text without an action. Reading the trigger MUST be Suspense-safe for Next.js `useSearchParams` (no unhandled fallback blank).
(Previously: offered create vs clear without one-shot modal deep-link, trigger cleanup, or Suspense-safe navigation.)

#### Scenario: True empty offers create

- GIVEN Registro with no events and no active filters
- WHEN the list region renders
- THEN Spanish copy MUST explain there are no records
- AND a contextual create action MUST be available

#### Scenario: True empty opens create modal once

- GIVEN Registro true-empty
- WHEN the operator activates Nuevo servicio
- THEN the app MUST open the Services create modal exactly once
- AND the create trigger MUST be removed from the URL after open
- AND a later refresh MUST NOT reopen the modal

#### Scenario: Filtered empty offers recovery

- GIVEN Registro filters that match zero rows
- WHEN the empty state renders
- THEN Spanish copy MUST explain no matches
- AND a contextual action MUST let the operator clear filters

#### Scenario: Filtered empty only clears filters

- GIVEN Registro filter-empty
- WHEN the operator activates the empty-state action
- THEN filters MUST reset and page MUST return to an unfiltered query
- AND the Services create modal MUST NOT open

#### Scenario: Suspense-safe create trigger

- GIVEN Dashboard consumes `createService` from the URL
- WHEN navigation from Registro true-empty occurs
- THEN the page MUST NOT fail with an unhandled Suspense/`useSearchParams` error
- AND the operator MUST reach the create modal on success
