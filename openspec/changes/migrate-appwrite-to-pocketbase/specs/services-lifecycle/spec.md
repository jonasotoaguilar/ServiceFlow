# Services Lifecycle Specification

## Purpose

Define user-scoped service CRUD, boundary validation, status and date invariants, the `{ data, total, page, limit }` list envelope, parameterized LIKE search, and ownership error behavior. Collection fields, native ids, and API rules are owned by `pocketbase-schema`. Location movement logs created when `locationId` changes are owned by `locations-history`. Session identity is owned by `auth-session`.

## Requirements

### Requirement: Authenticated tenant-scoped service access

Every service read or write MUST use the authenticated PocketBase user from `getAuthUser`. List, create, update, and delete MUST be limited to records whose `userId` equals that user. The system MUST also send `userId` from the server identity, never from an untrusted client-owned claim, when creating a service. A second user MUST NOT see or mutate the first user's services.

#### Scenario: Owner lists only own services

- GIVEN user A and user B each own at least one service
- WHEN user A lists services
- THEN the `data` array MUST contain only user A's services
- AND user B's services MUST NOT appear

#### Scenario: Peer cannot update or delete

- GIVEN user A owns a service
- AND user B is authenticated
- WHEN user B updates or deletes that service id
- THEN the service MUST remain unchanged
- AND user B MUST receive an ownership failure

#### Scenario: Create ignores client-supplied owner

- GIVEN an authenticated user
- WHEN a create payload includes a different `userId` or omits `userId`
- THEN the stored `userId` MUST be the authenticated user's PocketBase id

### Requirement: Boundary validation

`POST` and `PUT` `/api/services` MUST validate the payload at the HTTP boundary before persistence. `invoiceNumber` MUST be a non-empty trimmed string. `clientName` MUST have at least 2 trimmed characters. `contact` MUST have at least 6 trimmed characters. `product` MUST have at least 2 trimmed characters. `locationId` MUST be present. `status`, when provided, MUST be one of `pending`, `ready`, `completed`, or `cancelled`. `email`, when provided and not empty, MUST be a valid email. Invalid payloads MUST return status `400` with `{ error: "Validation failed" }` and MUST NOT write a record.

#### Scenario: Valid payload is accepted

- GIVEN an authenticated user
- AND a payload that satisfies the service validation rules
- WHEN `POST /api/services` is called
- THEN the service MUST be persisted
- AND the response status MUST be `201`

#### Scenario: Invalid payload is rejected

- GIVEN an authenticated user
- AND a payload that omits `clientName` or has an invalid `status`
- WHEN `POST` or `PUT /api/services` is called
- THEN the response status MUST be `400`
- AND the body MUST include `{ error: "Validation failed" }`
- AND no service record MUST be written or updated

### Requirement: Native ids on create

Creating a service MUST let PocketBase assign the record id as specified by `pocketbase-schema`. The API MUST NOT generate a UUID or any other client/server id and send it as the new record id.

#### Scenario: Create does not send a pre-generated id

- GIVEN an authenticated user submits a valid create payload
- WHEN the service is persisted
- THEN PocketBase MUST assign the record id
- AND the returned `id` MUST be that PocketBase id

### Requirement: Status and date invariants

A new service without `status` MUST be stored as `pending`. A new service without `entryDate` MUST store the current timestamp as `entryDate`. When `status` is `cancelled` and `cancellationDate` is absent, the system MUST set `cancellationDate` to the current timestamp before persistence. A service whose stored `status` is `completed` MUST NOT be updated. Status vocabulary MUST remain `pending`, `ready`, `completed`, and `cancelled`.

#### Scenario: Defaults on create

- GIVEN a valid create payload with no `status` and no `entryDate`
- WHEN the service is stored
- THEN `status` MUST be `pending`
- AND `entryDate` MUST be set

#### Scenario: Cancellation date is filled

- GIVEN a valid create or update whose `status` is `cancelled`
- AND `cancellationDate` is omitted
- WHEN the request is processed
- THEN `cancellationDate` MUST be set to the current timestamp

#### Scenario: Completed service is immutable

- GIVEN a service whose stored `status` is `completed`
- WHEN an authenticated owner submits an update
- THEN the stored record MUST NOT change
- AND the caller MUST receive a failure

### Requirement: Pagination envelope

Service lists MUST accept 1-based `page` and `limit` and MUST default `page` to 1 and `limit` to 20 when omitted. The response MUST be `{ data, total, page, limit }` where `data` is the page of services, `total` is the unpaginated match count, `page` is the requested page, and `limit` is the requested page size. An empty match MUST still return that envelope with `data` as an empty array. Sort MUST be by `entryDate` and MUST honor `sortOrder` `asc` or `desc`.

#### Scenario: Default page

- GIVEN an authenticated user with more than 20 matching services
- WHEN the list is requested without `page` or `limit`
- THEN the response MUST include at most 20 items in `data`
- AND `page` MUST be 1
- AND `limit` MUST be 20
- AND `total` MUST be the full match count

#### Scenario: Empty page keeps the envelope

- GIVEN an authenticated user with zero matching services
- WHEN the list is requested
- THEN the response MUST be `{ data: [], total: 0, page, limit }`

#### Scenario: Page 2 returns the next slice

- GIVEN an authenticated user with 25 matching services and default `limit`
- WHEN `page=2` is requested
- THEN `data` MUST contain the remaining items
- AND `total` MUST be 25
- AND `page` MUST be 2

### Requirement: Parameterized LIKE search and filters

When `search` is provided, the list MUST match records whose `clientName`, `invoiceNumber`, or `rut` satisfies a PocketBase `~` / SQLite LIKE comparison against that term. The filter MUST bind the search value as a parameter (`{:param}` or equivalent SDK binding). The system MUST NOT concatenate raw search input into the filter string. Optional `status` (comma-separated list) and `location` (`locationId`) filters MUST further restrict the same query. Search semantics MAY be case-insensitive LIKE and MUST NOT claim Appwrite full-text behavior.

#### Scenario: Search matches current fields

- GIVEN the owner has services distinguishable by `clientName`, `invoiceNumber`, and `rut`
- WHEN the list is requested with a `search` value that matches only one of those fields
- THEN `data` MUST include the matching service
- AND non-matching services MUST be omitted
- AND `total` MUST reflect only the matches

#### Scenario: Search input is bound, not interpolated

- GIVEN a `search` value that contains filter metacharacters
- WHEN the list query is built
- THEN the value MUST be passed as a bound parameter
- AND the filter expression MUST NOT be built by string-concatenating the raw input

#### Scenario: Status and location filters compose with search

- GIVEN matching and non-matching services across statuses and locations
- WHEN `search`, `status`, and `location` are all provided
- THEN every returned service MUST satisfy all three constraints

### Requirement: Deterministic service API errors

Unauthenticated `/api/services` access MUST follow `auth-session`. `PUT` or `DELETE` without an id MUST return status `400`. Ownership failures and unexpected persistence failures MUST NOT leak PocketBase internals. Unexpected server failures MAY return status `500` with a generic error string.

#### Scenario: Update without id

- GIVEN an authenticated user
- AND a valid service payload that omits `id`
- WHEN `PUT /api/services` is called
- THEN the response status MUST be `400`
- AND no record MUST be updated

#### Scenario: Delete without id

- GIVEN an authenticated user
- WHEN `DELETE /api/services` is called without `id`
- THEN the response status MUST be `400`
- AND no record MUST be deleted

#### Scenario: Delete removes the owner's service

- GIVEN an authenticated user owns a service
- WHEN `DELETE /api/services?id=` that service id is called
- THEN the service MUST be removed
- AND related location logs MUST be removed as specified by `locations-history`
- AND the response MUST indicate success
