# Locations History Specification

## Purpose

Define location create/update/toggle/delete behavior, optional address, duplicate-name normalization, active and delete constraints, movement history, denormalized `userId` on logs, and tenant isolation. Collection fields, native ids, and API rules are owned by `pocketbase-schema`. Service status and CRUD rules are owned by `services-lifecycle`. Authentication is owned by `auth-session`.

## Requirements

### Requirement: Tenant-isolated location access

Location reads and writes MUST use the authenticated user from `getAuthUser`. Every persisted location and location log MUST store `userId` equal to the owning user's PocketBase id. A second user MUST NOT list, update, toggle, or delete another user's locations, and MUST NOT see another user's movement history. Unauthenticated location or history operations MUST fail without writing data.

#### Scenario: Owner lists only own locations

- GIVEN user A and user B each own a location
- WHEN user A lists locations
- THEN the result MUST include user A's location
- AND it MUST NOT include user B's location

#### Scenario: Peer cannot mutate a location

- GIVEN user A owns a location
- AND user B is authenticated
- WHEN user B updates, toggles, or deletes that location id
- THEN the location MUST remain unchanged
- AND user B MUST receive a not-found or unauthorized error

#### Scenario: Unauthenticated mutation is rejected

- GIVEN no valid session
- WHEN create, update, toggle, or delete location is invoked
- THEN no location record MUST change
- AND the result MUST be an unauthenticated error

### Requirement: Optional address

Location `address` MUST be optional. When provided, the stored value MUST be trimmed. An empty or whitespace-only address MUST be stored as absent/null. When present, `address` MUST NOT exceed 200 characters.

#### Scenario: Location can be created without address

- GIVEN an authenticated user
- AND a unique valid name
- AND no address
- WHEN the location is created
- THEN the location MUST persist
- AND `address` MUST be empty or absent

#### Scenario: Address is stored trimmed

- GIVEN an authenticated user
- AND a unique valid name
- AND an address with surrounding whitespace
- WHEN the location is created or updated
- THEN the stored `address` MUST be the trimmed value

#### Scenario: Oversized address is rejected

- GIVEN an authenticated user
- AND an address longer than 200 characters
- WHEN the location is created or updated
- THEN the write MUST fail
- AND the stored location MUST NOT contain that address

### Requirement: Duplicate name normalization

Location names MUST be unique per user after `normalizeString`: lowercase, Unicode NFD, strip combining marks, and trim. Duplicate detection MUST include the owner's existing locations and MUST ignore another user's names. Create MUST reject a normalized collision. Update MUST reject a normalized collision with a different location owned by the same user. Name is required after trim. Updates MUST reject names shorter than 3 characters or longer than 100 characters.

#### Scenario: Exact duplicate name is rejected

- GIVEN the user already has a location named `Taller Centro`
- WHEN the user creates another location named `Taller Centro`
- THEN the create MUST fail with a duplicate-name error
- AND no second location MUST be stored

#### Scenario: Accent-insensitive duplicate is rejected

- GIVEN the user already has a location named `Ñuñoa`
- WHEN the user creates a location whose normalized name equals that record
- THEN the create MUST fail with a duplicate-name error

#### Scenario: Same name is allowed for another tenant

- GIVEN user A owns a location named `Taller`
- WHEN user B creates a location named `Taller`
- THEN user B's location MUST be created

#### Scenario: Update may keep its own name

- GIVEN the user owns a location named `Taller`
- WHEN the user updates that location with the same name and a new address
- THEN the update MUST succeed

#### Scenario: Empty name is rejected

- GIVEN an authenticated user
- WHEN a location is created or updated with a blank name
- THEN the write MUST fail
- AND no location name MUST become empty

### Requirement: Active flag

A newly created location MUST have `isActive` true. An owner MUST be able to toggle `isActive` without deleting the location or its history. Listing MAY restrict results to active locations when the caller requests only active records.

#### Scenario: Create starts active

- GIVEN an authenticated user creates a valid location
- WHEN the record is stored
- THEN `isActive` MUST be true

#### Scenario: Toggle does not delete

- GIVEN the owner has an active location with history
- WHEN the owner sets `isActive` to false
- THEN the location MUST remain stored
- AND `isActive` MUST be false
- AND related services and logs MUST remain

#### Scenario: Only-active list hides inactive

- GIVEN the owner has one active and one inactive location
- WHEN locations are listed with the only-active flag
- THEN the inactive location MUST NOT appear

### Requirement: Delete constraints

A location MUST NOT be deleted when any service references it as `locationId`, or when any location log references it as `fromLocationId` or `toLocationId`. `hasHistory` MUST be true when the location has pending or ready services, completed services, or any movement logs. Delete MUST be allowed only when the owner requests it and `hasHistory` is false and no service references remain.

#### Scenario: Location with a service cannot be deleted

- GIVEN the owner has a location referenced by at least one service
- WHEN the owner deletes that location
- THEN the location MUST remain
- AND the error MUST state that a location with service or movement history cannot be deleted

#### Scenario: Location with only logs cannot be deleted

- GIVEN the owner has a location with no current services
- AND a location log references it as `fromLocationId` or `toLocationId`
- WHEN the owner deletes that location
- THEN the location MUST remain
- AND the same history-guard error MUST be returned

#### Scenario: Unused location can be deleted

- GIVEN the owner has a location with no services and no logs
- WHEN the owner deletes that location
- THEN the location record MUST be removed

### Requirement: Movement history

When an owner updates a service and `locationId` changes, the system MUST insert a `location_logs` row with denormalized `userId` equal to the service owner's id, `ServiceId` equal to the service id, `fromLocationId` equal to the previous location, `toLocationId` equal to the new location, and `changedAt` set to now. If the update is the transition that sets `status` to `completed` from a non-completed status, the system MUST NOT write a movement log for that location change. Deleting a service MUST delete its location logs.

#### Scenario: Location change writes a log

- GIVEN an owner has a non-completed service at location A
- WHEN the owner updates that service to location B without completing it
- THEN a `location_logs` record MUST exist with `fromLocationId` A and `toLocationId` B
- AND `userId` MUST equal the service owner's id

#### Scenario: Completing with a location change skips the log

- GIVEN an owner has a non-completed service at location A
- WHEN the owner updates it to `completed` and location B in the same write
- THEN no new `location_logs` row MUST be created for that change

#### Scenario: Unchanged location writes no log

- GIVEN an owner updates a service without changing `locationId`
- WHEN the update succeeds
- THEN no new `location_logs` row MUST be created

#### Scenario: Service delete removes its logs

- GIVEN a service has one or more location logs
- WHEN the owner deletes that service
- THEN those location logs MUST be removed

### Requirement: History listing

Location history listing MUST require authentication, MUST filter by the denormalized `userId`, MUST default to 1-based `page` 1 and `limit` 20, and MUST return `{ data, total, page, limit }` when successful. Results MUST be ordered by `changedAt` descending. Optional `locationId` MUST match logs where that id is `fromLocationId` or `toLocationId`. Optional `startDate` and `endDate` MUST bound `changedAt`. Another user's logs MUST NOT appear.

#### Scenario: Owner sees only own logs

- GIVEN user A and user B each have movement logs
- WHEN user A lists location logs
- THEN `data` MUST contain only logs whose `userId` is user A
- AND `total` MUST count only those logs

#### Scenario: Location filter uses from or to

- GIVEN the owner has logs that enter and leave a location
- WHEN history is listed with that `locationId`
- THEN logs with either `fromLocationId` or `toLocationId` equal to it MUST be included
- AND unrelated logs MUST be omitted

#### Scenario: Unauthenticated history list fails

- GIVEN no valid session
- WHEN location logs are requested
- THEN the result MUST be an unauthenticated error
- AND `data` MUST NOT be returned
