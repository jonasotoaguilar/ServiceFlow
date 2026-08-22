# PocketBase Schema Specification

## Purpose

Define the versioned PocketBase collection artifact, native record identifiers, collection fields, indexes, relations, API rules, empty-start data policy, and the explicit out-of-band apply/verification contract for the existing Dokploy-managed instance. Runtime connection rules live in `pocketbase-access`. Product CRUD and lifecycle rules live in `services-lifecycle` and `locations-history`.

## Requirements

### Requirement: Versioned schema artifact

This repository MUST contain a versioned schema artifact that describes the collections, fields, indexes, relations, and API rules required by ServiceFlow. The artifact MUST be sufficient to initialize an empty PocketBase database to the ServiceFlow schema. The artifact format MAY be JS migrations or exported collection JSON; this specification does not select the format. The application runtime MUST NOT apply or mutate that schema.

#### Scenario: Artifact is present and complete

- GIVEN a clean checkout of this change
- WHEN the schema artifact is inspected
- THEN it MUST declare `users`, `services`, `locations`, and `location_logs`
- AND it MUST declare the fields, indexes, relations, and API rules required below

#### Scenario: Artifact targets an empty database

- GIVEN a PocketBase instance with no ServiceFlow collections or business records
- WHEN an operator applies the versioned artifact through the documented explicit step
- THEN the four collections MUST exist with the required fields, indexes, relations, and rules
- AND no service, location, or location-log records MUST be created by the apply step

### Requirement: Explicit apply and verification without in-repo infra

Schema application MUST be an explicit operator step against the already-managed local or Dokploy PocketBase instance. This repository MUST document that the artifact has to be applied and how an operator verifies the result. This repository MUST NOT add a PocketBase binary, container, volume, reverse proxy, TLS terminator, backup job, or Dokploy lifecycle. The Next.js process MUST NOT apply schema through an admin API. This specification MUST NOT introduce PocketBase admin environment variables.

#### Scenario: Apply is out of band

- GIVEN the versioned schema artifact in this repository
- WHEN ServiceFlow starts
- THEN the application MUST NOT create collections, indexes, or API rules
- AND it MUST NOT authenticate as a PocketBase admin to migrate schema

#### Scenario: Verification precedes cutover

- GIVEN an operator is preparing to point ServiceFlow at a PocketBase instance
- WHEN the documented verification step is followed
- THEN the operator MUST be able to confirm that `users`, `services`, `locations`, and `location_logs` exist
- AND the operator MUST be able to confirm that tenant API rules are present
- AND flipping `POCKETBASE_URL` MUST remain a separate step from applying the artifact

#### Scenario: No hosting added to this repo

- GIVEN the change is complete
- WHEN the repository tree is inspected for PocketBase operations
- THEN it MUST NOT contain a PocketBase server, container definition, persistent volume, or Dokploy compose added to operate PocketBase

### Requirement: Empty start and no compatibility data

Applying the schema MUST leave business data empty. The change MUST NOT import Appwrite users, services, locations, location logs, or password hashes. The change MUST NOT preserve Appwrite `$id` values and MUST NOT maintain an id-mapping table.

#### Scenario: Fresh instance has no product rows

- GIVEN the schema artifact has been applied to an empty PocketBase
- WHEN `services`, `locations`, and `location_logs` are listed
- THEN each collection MUST contain zero records

#### Scenario: No import path exists

- GIVEN the completed change
- WHEN the repository is inspected for data-transfer or password-import tooling
- THEN no Appwrite export/import, dual-write, or password-hash conversion path MUST be present

### Requirement: PocketBase-native record identifiers

New `services`, `locations`, and `location_logs` records MUST use PocketBase-generated identifiers. Those identifiers MUST be the PocketBase-native 15-character record id. The application MUST NOT pre-generate UUIDs or other custom ids for new records. Application types MAY continue to expose the identifier as a string field named `id`.

#### Scenario: New record receives a native id

- GIVEN an authenticated user creates a service or location
- WHEN PocketBase stores the record
- THEN the record `id` MUST be the PocketBase-generated 15-character identifier
- AND the stored id MUST NOT be an application-generated UUID

#### Scenario: No id mapping layer

- GIVEN the completed change
- WHEN identity of a stored record is resolved
- THEN the system MUST use the PocketBase `id` directly
- AND it MUST NOT consult a mapping from Appwrite `$id`

### Requirement: Users auth collection

The schema MUST use a PocketBase auth collection named `users` as the only identity store for ServiceFlow. The collection MUST support email/password authentication and MUST store a display name. Public self-registration MUST be allowed by the create rule. Authenticated users MUST be able to view and update only their own auth record. List and delete access for other users' auth records MUST be denied by default.

#### Scenario: Public create is allowed

- GIVEN an unauthenticated client
- WHEN a new `users` record is created with email, password, and name
- THEN the collection create rule MUST allow the create
- AND no invite or admin-provisioned account MUST be required

#### Scenario: Users cannot read other users

- GIVEN user A is authenticated
- WHEN user A requests another user's `users` record
- THEN PocketBase API rules MUST deny the read

### Requirement: Locations collection

The `locations` collection MUST include: required `name`, required `userId` equal to the owning user's id, `isActive` boolean defaulting to true, optional `address`, and `createdAt` / `updatedAt` timestamps. `address` MUST be first-class in the schema even though the historical Appwrite setup script omitted it. The collection MUST have indexes that support filtering by `userId` and `name`. Relation storage type for foreign keys that point at a location is a design detail; the schema MUST make each location addressable by its PocketBase `id`.

#### Scenario: Optional address is stored

- GIVEN the `locations` collection exists
- WHEN a location is created with no address
- THEN the record MUST persist
- AND `address` MAY be empty or absent

#### Scenario: Required location fields

- GIVEN the `locations` collection exists
- WHEN a create omits `name` or `userId`
- THEN PocketBase MUST reject the record

### Requirement: Services collection

The `services` collection MUST include: required `userId`, optional `invoiceNumber`, required `clientName`, optional `rut`, optional `contact`, optional `email`, required `product`, optional `failureDescription`, optional `sku`, required `locationId` referencing a location, required `entryDate`, optional `deliveryDate`, optional `readyDate`, optional `cancellationDate`, `status` defaulting to `pending`, optional `repairCost` defaulting to 0, and optional `notes`. The collection MUST have indexes that support filtering by `userId`, `status`, and `locationId`, and that support LIKE search on `clientName`, `invoiceNumber`, and `rut`. Whether `locationId` is a PocketBase relation field or a string that stores a location id is a design detail; the value MUST identify a `locations` record by PocketBase `id`.

#### Scenario: Required service fields

- GIVEN the `services` collection exists
- WHEN a create omits `userId`, `clientName`, `product`, `locationId`, or `entryDate`
- THEN PocketBase MUST reject the record

#### Scenario: Status default

- GIVEN a valid service create that does not set `status`
- WHEN the record is stored
- THEN `status` MUST default to `pending`

### Requirement: Location logs collection

The `location_logs` collection MUST include: required denormalized `userId`, required `ServiceId` identifying a service, required `fromLocationId`, required `toLocationId`, and required `changedAt`. The collection MUST have indexes on `userId`, `ServiceId`, `fromLocationId`, and `toLocationId`. Whether those identifiers are relation fields or strings is a design detail; they MUST store PocketBase-native ids of the referenced records. `userId` MUST remain denormalized so history can be filtered without joining through services.

#### Scenario: Log requires denormalized owner

- GIVEN the `location_logs` collection exists
- WHEN a create omits `userId`
- THEN PocketBase MUST reject the record

#### Scenario: Log requires movement fields

- GIVEN the `location_logs` collection exists
- WHEN a create omits `ServiceId`, `fromLocationId`, `toLocationId`, or `changedAt`
- THEN PocketBase MUST reject the record

### Requirement: Default-deny tenant API rules

API rules for `services`, `locations`, and `location_logs` MUST default deny. List, view, create, update, and delete rules for those collections MUST require `userId = @request.auth.id`. Unauthenticated requests MUST NOT list or mutate another user's records through PocketBase's HTTP API. Application-level ownership checks in `services-lifecycle` and `locations-history` are additional, not a substitute for these rules.

#### Scenario: Owner can read own rows

- GIVEN user A is authenticated
- AND a `services` or `locations` record has `userId` equal to user A's id
- WHEN user A lists that collection through PocketBase rules
- THEN the record MUST be visible

#### Scenario: Peer cannot read another tenant

- GIVEN user A owns a record
- AND user B is authenticated
- WHEN user B lists or views that record through PocketBase
- THEN API rules MUST deny access

#### Scenario: Unauthenticated API is denied

- GIVEN no PocketBase auth is present
- WHEN a client lists `services`, `locations`, or `location_logs`
- THEN API rules MUST deny the list
