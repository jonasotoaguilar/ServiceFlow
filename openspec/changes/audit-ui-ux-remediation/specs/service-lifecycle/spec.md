# Service Lifecycle Specification

## Purpose

Create assigns one owned location and `pending`. Generic edit cannot change status or location.

## Requirements

### Requirement: Generic Edit Excludes Status and Location

Generic **edit** MUST omit status and location controls. Updates that include `status` or `locationId` MUST be rejected. Only the owner MAY mutate. After create, location changes use transfer; status changes use the status action.

#### Scenario: Edit cannot change status or sede

- GIVEN an owned `pending` service
- WHEN the operator saves generic edit
- THEN status and locationId stay unchanged and neither control is shown

#### Scenario: Generic write with status is rejected

- GIVEN an owned service
- WHEN a generic update includes `status` or `locationId`
- THEN the server rejects it and writes no Registro event

#### Scenario: Foreign service is forbidden

- GIVEN a service owned by tenant B
- WHEN tenant A calls generic update, status, or transfer
- THEN the mutation is denied

### Requirement: Create Selects Initial Owned Location

Create MUST take one active tenant-owned `locationId`. Default SHOULD be preselected. Another owned active location MAY be chosen. Inactive or foreign ids MUST reject with no service.

#### Scenario: Default sede preselected

- GIVEN default active sede A
- WHEN create form opens
- THEN location control shows A selected

#### Scenario: Other valid initial sede

- GIVEN owned active A (default) and B
- WHEN create uses B
- THEN `locationId` is B and no transfer event

#### Scenario: Invalid initial sede rejected

- GIVEN inactive or foreign sede
- WHEN create uses that id
- THEN no service is created

### Requirement: Dedicated Status Transitions

Status MUST use a dedicated action. Allowed: `pending` to `ready` or `cancelled`; `ready` to `completed`, `cancelled`, or `pending`; `completed` and `cancelled` none. `ready` sets `readyDate`; `completed` sets `deliveryDate` and keeps `readyDate`; `cancelled` sets `cancellationDate`; return to `pending` clears those three. Success MUST write a status event (actor, time, before/after). Disallowed MUST reject with no event.

#### Scenario: Pending to ready stamps readyDate

- GIVEN an owned `pending` service
- WHEN the operator confirms `ready`
- THEN status is `ready`, `readyDate` is transition time, and a status event records `pending` to `ready`

#### Scenario: Completed cannot change

- GIVEN an owned `completed` service
- WHEN any status transition is requested
- THEN it is rejected and storage is unchanged

### Requirement: Dedicated Location Transfer

After create, location MUST change only via transfer to an active tenant-owned target. Success MUST persist `locationId` and write a transfer event (actor, time, before/after). Missing, inactive, foreign, or same-location targets MUST reject with no event.

#### Scenario: Transfer to owned active sede

- GIVEN a service at A and owned active B
- WHEN transfer to B is confirmed
- THEN `locationId` is B and a transfer event records A to B

#### Scenario: Transfer to foreign sede is rejected

- GIVEN a location owned by another tenant
- WHEN transfer is requested
- THEN location is unchanged and no event is written

### Requirement: Create Always Pending

Create MUST store `status=pending` with no status control. **Contract (ignore, do not reject):** any client `status` is ignored. Create MUST NOT stamp ready, delivery, or cancellation dates.

#### Scenario: Form has no status control

- GIVEN the new-service form
- WHEN it renders
- THEN no control can set ready, completed, or cancelled, and the location control remains

#### Scenario: Client status is ignored

- GIVEN create with `status=completed` and an owned active `locationId`
- WHEN the server accepts create
- THEN stored status is `pending` and those dates stay empty

### Requirement: Entregada Display Mapping

UI MUST show `Entregada` for `completed`. Storage MUST stay `completed`. Existing rows MUST NOT be migrated.

#### Scenario: Badge shows Entregada

- GIVEN a service stored as `completed`
- WHEN table, details, cards, or Registro render it
- THEN the label is `Entregada` and storage remains `completed`
