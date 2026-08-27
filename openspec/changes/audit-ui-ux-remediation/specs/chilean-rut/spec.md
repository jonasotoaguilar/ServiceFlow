# Chilean RUT Specification

## Purpose

Require a normalized, módulo-11 valid Chilean RUT on every new write and edit, on both client and server.

## Requirements

### Requirement: RUT Required and Normalized

Every service create and every edit that submits `rut` MUST include a RUT. The system MUST normalize input by stripping dots, hyphens, and spaces and uppercasing digit `K` before validation and storage. Empty, whitespace-only, and omitted RUT MUST fail validation on create and on edit of the field. Client and server MUST share the same rules.

#### Scenario: Formatted valid RUT is accepted

- GIVEN create with `rut` `12.345.678-5` that passes módulo 11
- WHEN client and server validate
- THEN both accept and the stored value is the single normalized form

#### Scenario: Missing RUT is rejected

- GIVEN create or edit with empty `rut`
- WHEN the form submits or the server validates
- THEN both reject and no service write occurs

### Requirement: Módulo-11 Check on Client and Server

A RUT MUST pass Chilean módulo-11 (factors 2–7 from the right; remainder 11→0, 10→K). Client MUST block submit with a visible field error. Server MUST reject invalid RUT even if the client is bypassed. Valid DV `K` and `0` MUST be accepted. Malformed bodies MUST be rejected.

#### Scenario: Valid K check digit

- GIVEN a body whose módulo-11 DV is `K` (any common punctuation)
- WHEN client and server validate
- THEN both accept

#### Scenario: Valid zero check digit

- GIVEN a body whose módulo-11 DV is `0`
- WHEN client and server validate
- THEN both accept

#### Scenario: Wrong check digit is rejected

- GIVEN `12.345.678-0` when the computed DV is not `0`
- WHEN client or server validates
- THEN both reject and storage is unchanged

#### Scenario: Malformed body is rejected

- GIVEN `12.345.678`, `abcdefgh-k`, `12.345.678-99`, or embedded letters other than trailing `K`
- WHEN client or server validates
- THEN both reject

### Requirement: Historical Invalid RUT Is Not Bulk-Migrated

Existing stored RUTs that fail módulo-11 MUST remain readable. The system MUST NOT rewrite them in a bulk migration. Any new create or any edit that includes `rut` MUST enforce the current rules. Display of a historic invalid value MUST NOT by itself force a write.

#### Scenario: Historic invalid row still lists

- GIVEN a stored service whose `rut` fails módulo-11
- WHEN the operator opens the dashboard or details without saving
- THEN the row remains and `rut` is unchanged

#### Scenario: Edit of historic invalid RUT must fix it

- GIVEN that historic service
- WHEN the operator saves an edit that includes the same invalid `rut`
- THEN client and server reject until a valid RUT is supplied
