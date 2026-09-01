# Research: audit-ui-ux-remediation-closeout

```yaml
schema: gentle-ai.sdd-research/v1
revision: 1
change: audit-ui-ux-remediation-closeout
outcome: done
selected_questions:
  - id: Q1
    question: "For PocketBase server 0.40.1, what is the supported batch record API contract, why can POST /api/batch return 403 Batch requests are not allowed, and what product/implementation choices follow for a status/transfer operation that updates a service and creates a lifecycle event?"
    status: supported
admission:
  requested:
    documentation:
      granted: true
      provider: context7
      source_ids: ["pocketbase-api-records-batch"]
    open_web:
      granted: false
      provider: none
      source_ids: []
  observed:
    documentation:
      granted: true
      provider: context7
      source_ids: ["pocketbase-api-records-batch"]
    open_web:
      granted: false
      provider: none
      source_ids: []
  capability_declaration: "gentle-ai.sdd-research-capability/v1"
  denial: none
  partial_evidence: false
```

## 1. Sources

| id | class | title | publisher | URL | accessed_at | authority |
|---|---|---|---|---|---|---|
| pocketbase-api-records-batch | documentation | PocketBase API Records — Batch | PocketBase (Official PocketBase documentation) | https://pocketbase.io/docs/api-records | 2026-08-26 | Official PocketBase documentation via Context7 library `/websites/pocketbase_io` |

Validated excerpts admitted for this lane (verbatim, all mapped to `pocketbase-api-records-batch`):

1. "Performs multiple create, update, upsert, or delete operations in a single transactional request. Requires explicit configuration in the Dashboard settings."
2. "JavaScript example uses `const batch = pb.createBatch(); ... await batch.send();`."
3. "`POST /api/batch` processes create, update, upsert, and delete requests in one batch."
4. "The batch API enables transactional create, update, upsert, and delete operations for multiple records in a single request. This feature must be explicitly enabled and configured in the Dashboard settings."
5. "Batch operations run in one transaction and should use bounded processing/body sizes; avoid slow external calls or large uploads."
6. "Ordinary record update remains supported through `pb.collection('demo').update(id, body)`."

No open-web sources were granted or used. No additional documentation claims beyond these six excerpts are admitted.

## 2. Validated Claims (each claim → source ID)

| claim_id | claim | source_ids | excerpt_refs |
|---|---|---|---|
| C1 | The batch API performs multiple create, update, upsert, or delete operations in a single transactional request. | pocketbase-api-records-batch | 1, 4 |
| C2 | Batch capability must be explicitly enabled and configured in the Dashboard settings; it is not available by default without that configuration. | pocketbase-api-records-batch | 1, 4 |
| C3 | JavaScript SDK contract is `pb.createBatch()` to build the batch and `await batch.send()` to execute it. | pocketbase-api-records-batch | 2 |
| C4 | HTTP contract is `POST /api/batch` processing create, update, upsert, and delete requests in one batch. | pocketbase-api-records-batch | 3 |
| C5 | The batch API enables transactional create, update, upsert, and delete for multiple records in a single request; operations run in one transaction. | pocketbase-api-records-batch | 4, 5 (transactional portion) |
| C6 | Batch operations run in one transaction and should use bounded processing/body sizes; avoid slow external calls or large uploads. | pocketbase-api-records-batch | 5 |
| C7 | Ordinary single-record update remains supported through `pb.collection('demo').update(id, body)` without using batch. | pocketbase-api-records-batch | 6 |

All seven claims are directly supported by the admitted excerpts. No claim extends beyond the quoted evidence.

## 3. Evidence-Only Conclusion

Batch is a supported PocketBase feature on server 0.40.1 per official API Records documentation, but it requires explicit server configuration in the Dashboard settings before it can be used. A `403 Batch requests are not allowed` response on `POST /api/batch` is consistent with batch not being enabled/configured on the target deployment.

Only this conclusion is supported. The exact Dashboard toggle name, settings path, configuration file, or environment variable, and the deployment's current setting value, were not included in the admitted excerpts and were not inspected in this research phase. Whether the deployment at 0.40.1 has batch enabled, disabled, or partially configured therefore remains to be inspected and reproduced in a later verification/implementation phase against the live instance and its Admin UI settings.

No assertion is made about PocketBase versions prior to 0.40.1, about other 4xx/5xx codes, or about error payload shape beyond the literal `403 Batch requests are not allowed`.

## 4. Contradiction Record

Contradiction between admitted evidence and predecessor exploration's provisional statement:

- Predecessor `exploration.md` §3.D.1 provisional candidate (to be re-proven): "`PocketBase batch 403` → Fix: drop `createBatch()` (unsupported in PB 0.40.1) in favor of sequential writes..." — phrasing suggests 0.40.1 does not support batch at all.
- Admitted documentation (excerpts 1, 4) states batch IS supported in PocketBase and requires explicit enablement/configuration in Dashboard settings.

Resolution: The provisional "does not support" statement is superseded by the official documentation. Correct interpretation: batch is supported but not available until explicitly enabled/configured. The 403 is therefore an enablement/configuration condition, not a version-capability absence. This correction is recorded here and does not mutate the predecessor file, which remains frozen as required.

## 5. Freshness and Uncertainty

**Freshness:**

- Retrieved: 2026-08-26 via Context7 library `/websites/pocketbase_io` (source bundle `pocketbase-api-records-batch`).
- Executed: 2026-08-27. Elapsed ~1 day; considered fresh for PocketBase 0.40.1 documentation at time of writing.
- Authority: Official PocketBase documentation at https://pocketbase.io/docs/api-records.
- Re-validate if documentation URL shows newer `batch` configuration details, alternative endpoint, or 0.40.1 deprecation notes on next spec/design.

**Uncertainty (explicit, not validated):**

- The precise Admin/Dashboard location or field name that enables batch (e.g., Settings → Batch, or `BATCH_ENABLED` flag) is not quoted in the excerpts beyond the phrase "Dashboard settings". The exact UI path and storage (DB settings table vs. env vs. config file) is unverified and must be inspected in a live 0.40.1 Admin UI during implementation.
- The exact mapping of every 403 trigger to batch-disabled vs. other authorization/rate-limit paths is not detailed in the excerpts beyond the observed message `Batch requests are not allowed`. Other 403 causes cannot be inferred.
- Transactional guarantees (isolation level, rollback on partial failure within the batch transaction, quota/body-size limits in bytes/records) are described only as "one transaction" and "bounded processing/body sizes; avoid slow external calls or large uploads" — numeric limits are not evidenced.
- The ordinary update claim (C7) uses `demo` as example collection; applicability to `services` and `service_events` collections is by analogy and must be verified against actual collection schemas and API rules.

## 6. Product Choices — Separate from Evidence (Non-Authoritative Evaluation)

The following options are presented for maintainer decision in later spec/design. They are not selected here and do not extend the evidence claims.

### Option A — Enable and Configure Batch to Retain Atomic Updates

- Description: Enable batch in the PocketBase Admin Dashboard settings (per excerpts 1, 4) on the target 0.40.1 deployment and keep `POST /api/batch` / `pb.createBatch().send()` for the status/transfer operation (update `services` + create `service_events`/`service_lifecycle` event in one transaction).
- Consequences: Preserves atomicity — both writes succeed or both roll back within the single batch transaction (C5). Keeps the operation transactional as documented (C5, C6) and avoids compensation logic. Requires Admin access, deployment configuration change, and documentation of the enablement step for all environments (dev/staging/prod). Introduces operational coupling: if batch is disabled on any environment, the feature regresses to 403. Must respect bounded body/processing guidance (C6) — keep batch to exactly the two writes (service update + event create) with small JSON payloads.
- What spec/design must decide if A is chosen: Exact Dashboard setting path and flag; environment matrix for enablement; batch payload shape (update vs. upsert vs. create within `POST /api/batch`); transactional error mapping (which batch sub-error maps to HTTP 4xx vs. 500 and what client retry is allowed); idempotency on retry; observability (logging the batch idempotency key if any); fallback if batch remains unavailable on a given deployment.

### Option B — Sequential Writes with Explicit Compensation/Rollback, Accept Non-Atomic Failure Handling

- Description: Do not rely on `POST /api/batch`. Use sequential ordinary writes: `pb.collection('services').update(id, body)` (C7) followed by `pb.collection('service_events').create(...)`. On second-write failure, apply compensation (e.g., revert the service status/location update or mark event as pending and reconcile), or surface partial-success state to the operator.
- Consequences: No Dashboard configuration required; works regardless of batch enablement. Loses single-transaction atomicity — failure between writes leaves service updated without its lifecycle event (or vice versa) unless compensation succeeds. Requires explicit error handling, compensation semantics, and product decision on what "partial success" means for audit trail. Bounded processing guidance (C6) still applies to avoid slow external calls, but transactionality is no longer provided by the platform. Simpler operationally, more complex in application logic.
- What spec/design must decide if B is chosen: Exact sequential order (service first vs. event first and why); compensation strategy (automatic revert vs. manual operator reconciliation vs. outbox/pending queue); idempotency keys for retry; how to handle concurrent status/transfer on same service; observability for partial failures; user-facing copy for compensated vs. failed states; test matrix for failure injection on each write.

### Common Consequences for Both Options

- Both must use `services` tenant isolation and API rules as existing; neither invents a new pipeline.
- Both must be verified live against PocketBase 0.40.1 after the chosen path is implemented; mocked unit tests alone did not catch the 403 (predecessor verify-report 40/51, 6 failing scenarios).
- Later spec/design must capture the chosen contract explicitly (batch vs. sequential) and update `specs/service-lifecycle`, `specs/service-events`, `design.md`, and `tasks.md` with the exact write path, error codes, and rollback semantics. No product choice is made in this research artifact.

## 7. Scope and Immutability

- This research does not edit `openspec/changes/audit-ui-ux-remediation`, production files, `.github`, or the git index. Predecessor remains frozen (`blocked`, not archived) as declared in `openspec/changes/audit-ui-ux-remediation-closeout/exploration.md`. Candidate tree `38640512f6119e4edde346158797be61dd62fff6` remains the baseline for later verification.
- Non-goals remain: no new backend beyond the chosen batch/sequential path, no CSV import, no speculative compatibility layers, no workflow invention until `sdd-propose`.
- Execution language: English artifacts.

## 8. References for Next Phase

- Superseded provisional claim location: `openspec/changes/audit-ui-ux-remediation-closeout/exploration.md` §3.D.1 and `openspec/changes/audit-ui-ux-remediation/verify-report.md` findings `ui-002`/`ui-003` (`403 Batch requests are not allowed.` on `/api/batch`).
- Staged index baseline: `38640512f6119e4edde346158797be61dd62fff6` (preserved, not mutated).
- Validated source bundle: `pocketbase-api-records-batch` retrieved 2026-08-26 from https://pocketbase.io/docs/api-records via Context7 `/websites/pocketbase_io`.

---

*Persistence: `gentle-ai.sdd-research/v1` revision 1, outcome `done`, all selected questions supported. Documentation grant `pocketbase-api-records-batch` admitted; open-web not granted and not claimed. Product choices are non-authoritative and deferred to spec/design.*
