# Service Identity Immutability Specification

## Purpose

Generic service edit may correct operational details. Client identity, boleta/invoice reference, and SKU stay immutable at UI and authoritative write boundaries.

## Requirements

### Requirement: Mutable Operational Fields

On generic edit, the system MUST allow updates to contact/phone, failure description, email, repair cost, and notes when valid. Dedicated status/transfer flows MUST remain the only status and location mutations.

#### Scenario: Mutable fields persist

- GIVEN an existing non-completed service
- WHEN the operator saves contact, failure description, email, repair cost, and notes
- THEN stored values MUST match the submitted valid payload
- AND status and location MUST stay unchanged

#### Scenario: Invalid mutable field rejected

- GIVEN an edit with an invalid email or contact
- WHEN the operator submits
- THEN the write MUST fail closed
- AND previously stored identity fields MUST remain unchanged

### Requirement: Immutable Client Boleta And Sku

`clientName`, `invoiceNumber` (boleta), and `sku` MUST be non-editable in the edit UI (read-only or omitted; not submitted as writable inputs). Authoritative `PUT /api/services` and storage update MUST omit those fields from the persisted payload. If a client sends them, the server MUST reject with 400 and MUST NOT change stored values. Lifecycle protections (400 `LIFECYCLE_PROTECTED`, 409 `IMMUTABLE_STATUS`) MUST remain.

#### Scenario: UI blocks identity edits

- GIVEN Services edit for an existing service
- WHEN the form renders
- THEN client, boleta/invoice reference, and SKU MUST NOT be editable controls
- AND submit MUST NOT send those fields as mutable values

#### Scenario: PUT rejects identity mutation

- GIVEN a current service with client A, boleta B, SKU C
- WHEN `PUT /api/services` includes a different client, boleta, or SKU
- THEN the response MUST be 400
- AND stored client, boleta, and SKU MUST remain A, B, and C

#### Scenario: Storage omits identity fields

- GIVEN an authorized generic update
- WHEN storage applies the payload
- THEN client, boleta, and SKU MUST NOT be written
- AND mutable operational fields MAY be written

#### Scenario: Completed service still blocked

- GIVEN a completed or cancelled service
- WHEN generic edit is attempted
- THEN the existing 409 immutable-status rule MUST still apply
