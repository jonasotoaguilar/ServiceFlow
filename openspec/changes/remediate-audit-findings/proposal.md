# Proposal: Remediate Audit Findings (F1–F8)

## Intent

Hardening work exists only as uncommitted worktree changes. Formalize, sequence, and verify F1–F8 (critical: world-writable Appwrite collections; high: unauthenticated dead `/api/proxy`). Appwrite is dev-only for this change.

## Scope

### In Scope

- F1: `[]` collection permissions + dry-run-first migration script with tests (S3).
- F2/F5/F6: delete `proxy.ts`, `check_or.ts`, debug logs, legacy `design/` (S1).
- F3/F4: `serviceflow-db` rename; pnpm-only; drop `appwrite@22` (S2).
- F7: commit root contracts `PRD`/`ARCHITECTURE`/`DESIGN`/`SECURITY` (S5).
- F8: CI, PR gates, dependabot, CODEOWNERS, husky (S6).
- S4: run migration on isolated dev Appwrite; capture evidence.

### Out of Scope

- Production Appwrite access/config. E2E layer; coverage provider. New client/proxy paths.

## Capabilities

### New Capabilities

- `appwrite-server-access`: admin-SDK-only; locked permissions; `serviceflow-db`.
- `appwrite-permission-migration`: dry-run default; guarded `--apply`.
- `ci-governance`: CI, PR gates, dependabot, CODEOWNERS, pre-commit.
- `project-contracts`: root docs per convention.

### Modified Capabilities

None — empty spec store; first change.

## Approach

Chained PRs (`auto-chain`), staged from dirty worktree — never clean/reset: S1→S2→S3→S4→S5→S6. Tracker issue (`status:approved` + one `type:*`) first. S3/S6 split per 400-line forecast.

### Dev-Only Environment Guard (MUST)

- Refuse `--apply` in production or when `NEXT_PUBLIC_APPWRITE_ENDPOINT`/project ID mismatches dev allowlist.
- `--apply` requires `--yes`; per-collection plan printed first.

## Affected Areas

| Area                                                    | Impact   | Description                  |
| ------------------------------------------------------- | -------- | ---------------------------- |
| `scripts/setup-appwrite.ts`                             | Modified | `[]` perms, DB rename        |
| `scripts/migrate-appwrite-permissions.ts`               | New      | dry-run/`--apply`, dev guard |
| `tests/permissions.test.ts`                             | New      | unit tests                   |
| `lib/appwrite.ts`                                       | Modified | rename, log removal          |
| `proxy.ts`, `check_or.ts`, `lint_output.txt`, `design/` | Removed  | dead/legacy                  |
| `package.json`, `pnpm-workspace.yaml`, lockfiles        | Modified | pnpm                         |
| Root contracts, `.github/`, `.husky/`                   | New      | docs, CI                     |

## Risks

| Risk                         | Likelihood | Mitigation                    |
| ---------------------------- | ---------- | ----------------------------- |
| `--apply` on production      | Low        | dev-only guard                |
| DB rename orphans dev data   | Med        | old DB kept; S4 re-provisions |
| Worktree-only artifacts lost | Med        | stage by slice                |
| S3/S6 over budget            | High       | split per forecast            |
| Chain blocked on labels      | Med        | tracker first                 |

## Rollback Plan

- Permissions: data untouched; snapshot enables `--restore`; fix-forward least-privilege preferred.
- DB: old DB kept; revert `DB_ID` one-liner.
- Per-slice `git revert`; never reopen permissions.

## Dependencies

- Isolated dev Appwrite project + admin API key (S4).
- Tracker issue with required labels (pre-chain).

## Success Criteria

- [ ] All slices merged; `pnpm test:run` green.
- [ ] S4 evidence: dev only; no `Role.any()` remains.
- [ ] Build/lint/typecheck pass at chain head.
- [ ] Production untouched; proxy rewrite gone.
