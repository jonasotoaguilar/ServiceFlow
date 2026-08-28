# PocketBase Batch Operations Specification

## Purpose

Enable PocketBase 0.40.1 batch for atomic status/transfer (`A:enable_configure_batch_atomic`). Rejected `B:sequential_writes_compensation` MUST NOT reopen.

## Requirements

### Requirement: Live Dashboard Inspection Before Runtime Enablement

Dashboard path, fields, and numeric batch limits MUST stay UNKNOWN until bounded live Admin inspection of PocketBase 0.40.1 documents them per `dev`, `staging`, and `prod`. Runtime batch MUST NOT enable for an environment until that environment's path, fields, and limits are recorded. Specs MUST NOT invent Dashboard paths, `maxRequests`, or a platform idempotency key.

#### Scenario: Missing environment enablement

- GIVEN an environment lacks documented Dashboard path, fields, and numeric limits
- WHEN a status or transfer is requested there
- THEN the system MUST treat batch as unavailable
- AND MUST NOT send `POST /api/batch` as if enabled
- AND MUST NOT fall back to sequential writes

#### Scenario: Documented enablement unlocks that environment only

- GIVEN live inspection documented path, fields, and limits for one environment
- AND batch is enabled there
- WHEN a valid status or transfer is requested against that environment
- THEN the system MAY send `POST /api/batch` via `pb.createBatch().send()`

### Requirement: Two-Operation Atomic Batch

Each status or transfer MUST be one transactional batch: `services` update plus `service_events` create, with bounded small JSON only. Extra operations, slow external calls, and large uploads MUST NOT be included. Existing tenant isolation and collection API rules MUST apply. If the transaction fails, neither write MUST persist.

#### Scenario: Happy path status or transfer

- GIVEN batch is enabled for the target environment
- AND the operator is authorized under existing tenant/API rules
- WHEN the operator submits a valid status or transfer
- THEN both writes MUST succeed in one transaction
- AND the operator MUST observe success

#### Scenario: Second operation validation failure

- GIVEN batch is enabled
- AND the service update would be valid
- AND `service_events` create fails validation
- WHEN the batch is sent
- THEN neither write MUST persist
- AND the client MUST receive a deterministic 4xx from that sub-error

#### Scenario: Tenant or API rule denial

- GIVEN the caller lacks permission under existing collection API rules
- WHEN the batch is sent
- THEN neither write MUST persist
- AND the client MUST receive deterministic 4xx, not 500

### Requirement: No Silent Sequential Fallback on 403

The system MUST NOT implement sequential writes or compensation. HTTP `403` with `Batch requests are not allowed` MUST map to an explicit operator-facing failure plus runbook. The system MUST NOT retry 403.

#### Scenario: Batch disabled 403

- GIVEN the deployment returns `403` `Batch requests are not allowed`
- WHEN a status or transfer is attempted
- THEN the operator MUST see that batch is unavailable
- AND a runbook MUST instruct Dashboard enablement using the documented path
- AND the system MUST NOT issue sequential `services` update then `service_events` create
- AND the system MUST NOT retry

### Requirement: Deterministic Mapping, Application Retry, Observability

Rule and validation sub-errors MUST map to 4xx. Unexpected failures MUST map to 500. Timeout and 5xx MAY retry only with application-level idempotency that prevents duplicate service update and duplicate `service_events`. The system MUST NOT assert a PocketBase platform idempotency key unless live inspection documents one. Observability MUST record outcomes (success, 403, 4xx, 5xx, timeout) without secrets.

#### Scenario: Timeout or retry ambiguity

- GIVEN a batch send times out or returns 5xx with unknown commit state
- WHEN retry is considered
- THEN the client MUST retry only if application idempotency prevents duplicate writes
- AND MUST NOT treat the timeout as success
- AND MUST NOT invent a platform idempotency key

#### Scenario: Unexpected batch failure maps to 500

- GIVEN batch is enabled
- AND the failure is not rule, validation, or 403-not-allowed
- WHEN the batch fails
- THEN the client MUST receive 500
- AND observability MUST record the unexpected failure
