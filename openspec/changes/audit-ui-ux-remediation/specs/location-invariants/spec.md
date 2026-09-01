# Location Invariants Specification

## Purpose

Guarantee every user has exactly one default location and at least one active location, with idempotent bootstrap and safe default changes.

## Requirements

### Requirement: Exactly One Default and At Least One Active

Every authenticated user MUST have exactly one default location and at least one active location. The default MUST be active. Locations are tenant-owned; a user MUST NOT see or mutate another tenant's locations.

#### Scenario: Fresh user has one default active sede

- GIVEN a newly registered user
- WHEN locations are listed
- THEN exactly one location exists, it is active, and it is the default

#### Scenario: Foreign location is hidden

- GIVEN tenant B owns a location
- WHEN tenant A lists locations
- THEN B's location is absent

### Requirement: Idempotent Registration and Ensure-on-Auth

User registration MUST create the default active location if the user has none. Subsequent authentication MUST ensure the same invariant. Both paths MUST be idempotent: retries MUST NOT create a second default or duplicate name for the same user when a qualifying location already exists.

#### Scenario: Register then login does not duplicate

- GIVEN registration already created the default location
- WHEN the user authenticates again
- THEN location count is unchanged and the same location remains default

#### Scenario: Existing user with zero locations is repaired once

- GIVEN an existing user with zero locations
- WHEN that user authenticates
- THEN exactly one active default location is created
- AND a second auth does not create another

### Requirement: Cannot Delete or Deactivate Into Invalid State

The system MUST reject delete or deactivate of the current default. The system MUST reject any delete or deactivate that would leave zero active locations. A location referenced by services or Registro events MUST NOT be hard-deleted; deactivate MAY be used only when another active location remains and the target is not default.

#### Scenario: Default delete is rejected

- GIVEN the user's default location
- WHEN delete is requested
- THEN the location remains and an error is shown

#### Scenario: Last active deactivate is rejected

- GIVEN one active location (the default) and optional inactive locations
- WHEN deactivate is requested on the active location
- THEN it stays active and default

### Requirement: Safe Default Change

Changing default MUST be an explicit action. The target MUST be an active location owned by the user. The change MUST leave exactly one default: the previous default becomes non-default and remains active unless a later allowed deactivate occurs. The change MUST be rejected if the target is missing, inactive, or foreign. After a successful change, the former default MAY be deactivated only if at least one other location stays active.

#### Scenario: Default moves to another active sede

- GIVEN active locations A (default) and B
- WHEN the operator sets B as default
- THEN B is the only default and A is active non-default

#### Scenario: Inactive target cannot become default

- GIVEN location B is inactive
- WHEN set-default to B is requested
- THEN the current default is unchanged
