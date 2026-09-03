# Service Search Normalization Specification

## Purpose

Dashboard search matches client name or RUT despite punctuation, hyphen, whitespace, and K-case variants, without weakening persistence validation or interpolating filters.

## Requirements

### Requirement: Name And Rut Lookup Equivalence

Search MUST match `clientName` or `rut` (and existing invoice search) using bound parameters only. When the stripped input matches `^\d+[0-9Kk]?$`, lookup MUST normalize punctuation, hyphen, whitespace, and K-case so equivalent RUT spellings hit the stored normalized RUT. Persistence MUST still require `isValidRut` after `normalizeRut`. Search MUST NOT invent a second persisted RUT column.

#### Scenario: Punctuation-equivalent RUT hits

- GIVEN a stored service whose RUT is the normalized form of `20.884.087-K`
- WHEN the operator searches `20.884.087-K`, `20884087-k`, or `20884087k`
- THEN that service MUST appear
- AND the filter MUST use bound `{:search}` (or equivalent bound params), never string interpolation

#### Scenario: Whitespace and hyphen variants

- GIVEN the same stored RUT
- WHEN the operator searches with extra spaces or mixed hyphens around the digits
- THEN the service MUST still match after strip/normalize
- AND persistence validation MUST remain unchanged

### Requirement: Non-Rut Text Stays Name Search

If stripped input does not match `^\d+[0-9Kk]?$`, the system MUST treat the query as raw text (name/invoice) and MUST NOT coerce it into a RUT token.

#### Scenario: Malformed text does not normalize as RUT

- GIVEN services named `20Ab` or similar
- WHEN the operator searches `20Ab` or other non-RUT-shaped text
- THEN matching MUST use the raw term against name/invoice paths
- AND the query MUST NOT be rewritten as a normalized RUT

#### Scenario: Empty search is unfiltered

- GIVEN a populated list
- WHEN search is cleared
- THEN RUT normalization MUST NOT apply
- AND the list MUST follow unfiltered search semantics

### Requirement: Strict Persistence Validation Unchanged

Create and update MUST still transform RUT with `normalizeRut` and reject values that fail `isValidRut`. Lookup normalization MUST NOT relax that refine.

#### Scenario: Invalid RUT still rejected on write

- GIVEN a create or update payload with an invalid RUT
- WHEN validation runs
- THEN the write MUST fail
- AND search-normalization rules MUST NOT accept that value for persistence
