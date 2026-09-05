# Archive Report: account-email-verification

**Change**: `account-email-verification`
**Archived to**: `openspec/changes/archive/2026-09-04-account-email-verification/`
**Archive date**: 2026-09-04
**Artifact store**: `openspec`
**Worktree**: `/home/jona/projects/serviceflow-worktrees/feat-account-email-verification`
**HEAD at verification**: `aead365f7f358ba96360deed3765013c1389b211`
**Archive branch**: `feat/account-email-verification-archive`
**Expected base**: `feat/account-email-verification-ui` @ `aead365f7f358ba96360deed3765013c1389b211`
**Approved issue**: #108
**Delivery**: auto-chain / stacked-to-main

## Final-State Authority

This report is the terminal record at close. Intermediate snapshots (`apply-progress.md`, `verify-report.md`) are history, not current truth where superseded by explicit final-state facts and the persisted tasks artifact.

**Authority ranking applied**:
1. Persisted `tasks.md` — 14/14 checked, zero unchecked boxes (`grep -c "- [ ]"` returns 0).
2. Explicit final-state facts from the orchestrator launch prompt (outrank snapshots).
3. Intermediate snapshots — valid only at their time.

**Contradictions**: None. All launch-prompt facts are corroborated by repository evidence (persisted `tasks.md`, `verify-report.md` verdict `pass_with_warnings` with 0 critical findings, `git log` HEAD `aead365`). No unrankable contradictions to record.

## Task Completion Gate

- [x] Archived `tasks.md` inspected: **14/14 tasks complete**, 0 incomplete, no stale unchecked implementation tasks.
- [x] `verify-report.md` verdict **PASS WITH WARNINGS**, 0 blockers, 0 CRITICAL findings, 6/6 requirements, 12/12 scenarios compliant.
- [x] HEAD at verification `aead365f7f358ba96360deed3765013c1389b211` matches `git log` and the expected archive base.

Gate **PASS** — no CRITICAL, no stale checkboxes.

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `account-email-verification` | Created | Full spec (6 requirements, 12 scenarios): Verified-Only Operational Authentication; Registration Without Session; Neutral Request, Resend, and Unverified Login; Verification Callback Token Handling; Env-Backed Mail Settings; Tests and Docs Without Release |

**Merge verification**: No main spec existed for this capability, so the delta spec was copied mechanically (`cp` to temp file, `diff -r` empty, `mv` into place) as the full source-of-truth spec. No existing specs were modified; all unrelated domains preserved.

## Source of Truth Updated

The following spec now reflects the shipped behavior:
- `openspec/specs/account-email-verification/spec.md` (new)

## Archive Contents

- proposal.md ✅
- specs/ ✅ (`account-email-verification/spec.md`, 6 requirements / 12 scenarios)
- design.md ✅
- tasks.md ✅ (14/14 tasks complete)
- verify-report.md ✅ (PASS WITH WARNINGS, 0 CRITICAL)
- apply-progress.md ✅
- research.md / exploration.md / ui-design.md / preproposal.yaml ✅ (supporting evidence)
- archive-report.md ✅ (this file, additive-only)

Active changes directory no longer contains `account-email-verification`; only `archive/` and the unrelated `audit-ui-ux-remediation/` remain.

## Final Test and Verification State at Close

- `pnpm test:run`: 557/557 passed, exit 0.
- `npx tsc --noEmit`: exit 0.
- `pnpm test:e2e e2e/smoke.spec.ts`: 1 passed, exit 0. No SMTP used.

## Remaining Warnings at Close (Not Later Fixed)

Per the orchestrator's final-state facts, these warnings remain open at close and are intentionally carried, not resolved:

1. Vitest coverage below 80% on `lib/auth.ts` and `app/login/page.tsx`.
2. Stryker mutation campaign incomplete: a source-reading test blocked the dry-run (instrumented `lib/auth.ts` no longer contains the literal `collection("users")` the test expects), so no killed/survived score was produced. Recorded as test-adequacy evidence only.
3. Operator staging test-email (`POST /api/settings/test/email` with `verification` template) never executed; it is operator-only and outside the default suite.

## Constraints Honored

- No version bump, tag, or publication (`package.json` remains `2.0.2` per verify-report).
- Root `PRODUCT.md` and `DESIGN.md` not edited.
- UI design note (archive-report only): the login `registered=1` info callout plus resend-ack pattern (`components/auth/login-form.tsx`, `components/ui/alert.tsx` with `role="alert"` / `aria-live="polite"`, 44px resend target, existing `router.push` + `router.refresh` preserved) is the reusable auth-callout pattern for future auth messaging.
- ADR `docs/adr/0001-verified-only-authrule.md` left in place with status `Proposed`; no status change invented (no repo ADR convention requiring `Accepted` on archive was proven).

## Stack Context

Stack PRs at archive (all draft): #109 research, #110 design, #112 foundation, #113 server, #114 UI. This archive slice is the next/last SDD work unit on `feat/account-email-verification-archive` based on `feat/account-email-verification-ui` @ `aead365`.

## Structural Readback (Mandatory Verbatim `diff -r`)

### New spec mechanical copy (empty diff is pass)

```text
$ diff -r "openspec/changes/account-email-verification/specs/account-email-verification/spec.md" "<temp>" && mv temp to openspec/specs/account-email-verification/spec.md
(no output — empty diff, pass)
$ diff -r "openspec/changes/account-email-verification/specs/account-email-verification/spec.md" "openspec/specs/account-email-verification/spec.md"
(no output — empty diff, exit 0, pass)
```

### Archive move readback (empty diff is pass)

```text
$ diff -r "$snapshot_root/source" "$destination"
(no output — empty diff, exit 0, pass)
```

`archive-report.md` is additive-only and excluded from the source/destination comparison (it did not exist in the source snapshot).
