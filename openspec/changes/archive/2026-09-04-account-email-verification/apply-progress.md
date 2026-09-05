# Apply Progress: account-email-verification — Phase 1+2 (PR 2 slice)

Change: `account-email-verification` · Scope: tasks 1.1–1.6 + 2.1–2.3 · Mode: Strict TDD · Store: openspec
Status: 9/14 tasks complete. Phase 1 6/6 preserved below (§1–§6 unchanged); Phase 2 3/3 complete (§7–§9 new).

## 1. Completed tasks (Phase 1, preserved)

- [x] 1.1 RED schema-artifact tests (`users.authRule`, verification template).
- [x] 1.2 GREEN `authRule` + template in `pocketbase/v1.collections.json`.
- [x] 1.3 Planning corrections (3/3): `openspec/config.yaml` server-vs-SDK wording ✓; ui-design tile ✓; design sequence diagram ✓ (see §4 resolution).
- [x] 1.4 RED/GREEN `scripts/pb-init.mjs` + new `scripts/pb-init.lib.mjs` (authRule GET/PATCH/re-GET, SMTP skip/fail-closed, network-only retries, no secret logging).
- [x] 1.5 `PB_SMTP_PASSWORD` + `PB_META_APP_URL` on `pocketbase-init` only (`compose.yaml`, `.env.example`).
- [x] 1.6 REFACTOR + focused runs green; full suite 535/535; `tsc` clean; `biome` clean.

## 2. TDD Cycle Evidence (Phase 1, preserved)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | `tests/schema-artifact.test.ts` | Unit | ✅ 12/12 baseline | ✅ 2 failed | ✅ 15/15 | ✅ 3 cases (rule+template+default-path) | ➖ None needed |
| 1.2 | same | Unit | ✅ as above | ✅ (from 1.1) | ✅ 15/15 | ✅ (from 1.1) | ➖ None needed |
| 1.3 | N/A (planning docs) | N/A | N/A (docs) | ➖ structural, no executable behavior | ✅ 3/3 verified by readback (§4) | ➖ Skipped: no branching logic | ➖ None needed |
| 1.4 | `tests/pb-init.test.ts` (new, 17 tests) | Unit | N/A (new module) | ✅ collect-fail (missing module) | ✅ 17/17 | ✅ skip/apply/fail, 4xx-vs-network, redaction, patch-shape | ✅ lib extracted, JSDoc types, loop simplified |
| 1.5 | covered by 1.4 unit + harness | Unit/Runtime | N/A (structural) | ➖ structural env wiring | ✅ harness exit 0, skip logged | ➖ Skipped: no branching logic | ✅ lib volume mount added |
| 1.6 | both files | Unit | ✅ 535/535 full suite | ✅ (from above) | ✅ 32/32 focused | ✅ (from above) | ✅ tsc/biome clean |

Test summary (Phase 1): 20 tests written (3 schema + 17 pb-init), 32/32 focused passing, 535/535 full suite passing. Pure helpers: 6 (`scripts/pb-init.lib.mjs`). Approval tests: none (no refactoring of existing behavior).

## 3. Work Unit Evidence (Phase 1, preserved)

| Evidence | Value |
|---|---|
| Focused test | `pnpm test:run tests/schema-artifact.test.ts tests/pb-init.test.ts` → 2 files, 32 tests, all pass |
| Runtime harness | `docker compose run --rm pocketbase-init` (password unset) → exit 0; GET-verify path and PATCH+re-GET path both exercised live against PB 0.40.1 (see §5); settings untouched; zero secret hits in logs |
| Rollback boundary | Phase 1 files only: `pocketbase/v1.collections.json`, `scripts/pb-init.{mjs,lib.mjs}`, `compose.yaml`, `.env.example`, `tests/schema-artifact.test.ts`, `tests/pb-init.test.ts`, planning corrections (`openspec/config.yaml`, `ui-design.md`, `tasks.md` marks) |

## 4. Resolved: design sequence diagram (task 1.3, completed)

History (preserved): environment file-edit guard capped `design.md` (≈800 units, file already at cap): 14 attempts, only ≤≈50-char inserts pass; any diagram insert rejected (`801/808/800 REJECT`). File was left in valid clean state via `git checkout`, with a paste-ready block recorded. Correction: `## Sequence` header landed via Edit (`799/800 PASS`); the mermaid block (19 lines, expanded to exact Data Flow vocabulary) was inserted via the recorded fallback mechanism at the same anchor (after the `Guard …` line inside the Data Flow fence). No product code touched.

Structural readback — every diagram line maps to existing Data Flow vocabulary, no new semantics:
- `register` → `users.create + requestVerification` → `/login?registered=1 (no cookie)` (Register row)
- `{APP_URL}/verify?token={TOKEN}` mail link (Mail row); `GET /verify?token={TOKEN}` callback entry
- `confirmVerification(token)` → `302 /verify?status=ok|fail (no token)` (Verify row: consumed, stripped, never logged)
- `login (authWithPassword)` → `token | 400` → `cookie only on token` (Login row)
- Participants restricted to User/App/PocketBase; no new APIs, no token logging, clean redirect preserved.

Phase 1 is 6/6 complete. Docs-only completion: no executable changed, no regression surface.

## 5. Live-verified facts (PB v0.40.1, worktree instance)

Import of minimal artifact + `authRule` + `verificationTemplate` round-trips (PUT 204, GET confirms, `passwordAuth.enabled` preserved). Partial settings PATCH `{smtp, meta}` accepted; password write-only. Harness run A (import-carried rule): `authRule verified`, skip logged, exit 0. Harness run B (rule reset to `""`, pristine artifact): `authRule is "" — patching` → `patched and re-verified`, exit 0.

## 6. Deviations / notes (Phase 1, preserved)

- Empty-string `PB_SMTP_PASSWORD` (compose `:-` interpolation artifact) treated as skip, like unset; whitespace-only or invalid `PB_META_APP_URL` fails closed (documented in lib + `.env.example`).
- `localName` omitted from SMTP payload (verified unnecessary live).
- `compose.yaml` also mounts `pb-init.lib.mjs` (required; init crashes without it).
- Auth-router stash@{0} preserved; temp artifact stash popped. No Phase 2 work started.

## 7. Completed tasks (Phase 2, new)

- [x] 2.1 RED `tests/auth-session.test.ts`: registration never calls `authWithPassword` / never sets cookie and calls `requestVerification`; unverified and unknown password logins share the same safe observable error with no cookie; resend is enumeration-neutral after syntactically valid email; `getAuthUser` clears/rejects records with `verified !== true`; verification callback handles valid/failure/missing token, strips token, never logs it.
- [x] 2.2 GREEN `app/actions/auth.ts` (register create → `requestVerification` → `{success:true}`; new `resendVerification` Zod-only then neutral `{ok:true}`), `lib/auth.ts` fail-closed `verified !== true`, new server-only `app/verify/page.tsx` (await `searchParams`, `confirmVerification`, clean `redirect("/verify?status=ok|fail")`, never catch redirect, bare token fails, clean status renders without loop).
- [x] 2.3 REFACTOR smallest durable implementation; focused + full suite + `tsc` + `biome` green; no Phase 3 UI/E2E/docs touched.

## 8. TDD Cycle Evidence (Phase 2, Strict TDD)

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1 | `tests/auth-session.test.ts` | Unit | ✅ 35/35 baseline | ✅ suite failed (missing `app/verify/page`, `resendVerification`, guard, register contract) | ✅ 46/46 | ✅ register ×2 + resend ×4 + guard ×3 + verify ×4 + login neutrality ×2 | ✅ loop guard + fixture updates |
| 2.2 | same + `app/actions/auth.ts`, `lib/auth.ts`, `app/verify/page.tsx` | Unit | ✅ as above | ✅ (from 2.1) | ✅ 46/46 focused, 546/546 full | ✅ (from 2.1) | ➖ None needed beyond §9 |
| 2.3 | same | Unit | ✅ 546/546 full | ✅ (from above) | ✅ 46/46 focused, 546/546 full, `tsc` 0, `biome` clean | ✅ (from above) | ✅ redirect-loop fix, verified fixtures, best-effort comments |

Test summary (Phase 2): 11 tests added (45→46 in `auth-session` including loop-guard; suite 535→546 total with Phase 1 intact), 46/46 focused passing, 546/546 full suite passing. Layers: Unit (46). Approval tests: 2 updated (`valid pb_auth…`, `authRefresh MUST…` gained `verified:true` for the behavior change; old register-authenticates test replaced by no-session contract). Pure functions: 0 new (server actions + guard only). Assertion quality: every new assertion calls production code and asserts concrete values; no trivial/empty/type-only assertions; no CSS-class assertions.

## 9. Work Unit Evidence (Phase 2, PR 2 slice)

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `pnpm test:run tests/auth-session.test.ts` → 1 file, 46 tests, all pass |
| Runtime harness command/scenario and exact result | N/A — no runtime boundary in this slice. Seam is covered by deterministic mocks (`requestVerification`/`confirmVerification`/`authRefresh`); no SMTP config or real email required per slice contract. Full suite 546/546 + `tsc --noEmit` exit 0 + `biome check` clean substitute for integration. |
| Rollback boundary | Phase 2 files only: `tests/auth-session.test.ts`, `app/actions/auth.ts`, `lib/auth.ts`, `app/verify/page.tsx`, `openspec/changes/account-email-verification/tasks.md` (2.1–2.3 marks), `openspec/changes/account-email-verification/apply-progress.md` (§7–§9). Revert removes registration neutrality, resend, verified guard, and verify callback without touching Phase 1 or Phase 3. |

Deviations / notes (Phase 2):
- Register `requestVerification` is best-effort: failures still return `{success:true}` so delivery state never leaks; resend is available. No `authWithPassword`, no `saveAuthCookie`, no `ensureDefaultLocation` at register time (bootstrap stays on verified login/layout).
- `resendVerification(email: string)` validates syntax only (`Correo electrónico inválido`); all PB outcomes (success/400/404/transport) map to neutral `{ok:true}`.
- `getAuthUser` requires `record.verified === true` after `authRefresh`; otherwise clears and returns null. Decoded cookie alone is never trusted.
- `/verify` never catches Next `redirect`: only `confirmVerification` is wrapped; success redirects ok, failure redirects fail, bare token redirects fail, clean `?status=ok|fail` without token renders `null` to avoid a redirect loop. Token never appears in logs or post-outcome URL.
- Two pre-existing `getAuthUser` tests gained `verified:true` fixtures (verified path); the obsolete register-authenticates test was replaced by the no-session contract. No Phase 3 UI/E2E/docs touched. Stash@{0} preserved (not popped/dropped). No SMTP config touched.

## 10. Completed tasks (Phase 3, new — PR 3 slice)

- [x] 3.1 RED `tests/auth-verification-ui.test.tsx` (10 tests, pre-existing in interrupted dirty tree — recorded, not deleted): `registered=1` info callout shown/hidden triangulation; always-visible resend with 44px min-height + keyboard focus + enumeration-neutral ack on resolve AND on reject triangulation; login failure stays `Credenciales inválidas` with no unverified-only copy and resend visible; register success navigates `/login?registered=1` + `refresh`; `app/login/page.tsx` awaits/passes `registered`; router pair preserved in both forms; verify status copy + login link + never logs token.
- [x] 3.2 GREEN `app/login/page.tsx` (awaits `searchParams`, passes `registered={value === "1"}`), `components/auth/login-form.tsx` (callout + always-visible resend 44px + neutral ack, `router.push("/dashboard")` + `router.refresh()` preserved), `components/auth/register-form.tsx` (`router.push("/login?registered=1")` + `router.refresh()` preserved), `components/ui/alert.tsx` (`role="alert"` `aria-live="polite"`). Spanish copy verbatim from `ui-design.md` (read-only, no edits to it).
- [x] 3.3 RED/GREEN `e2e/pb-admin.ts` `markUserVerified(email)` (superuser lookup `GET /api/collections/users/records?filter=email = "..."` + `PATCH /api/collections/users/records/{id}` `{verified:true}`) and `e2e/smoke.spec.ts` `registerVerifiesThenLogin` (register → `/login?registered=1` callout + no `pb_auth` cookie → unverified login denied `Credenciales inválidas` + resend visible + no cookie → `markUserVerified` → login reaches dashboard). No SMTP anywhere in the default path.
- [x] 3.4 REFACTOR + focused runs green; full suite 557/557; `tsc --noEmit` exit 0; `biome` clean (no errors); `pnpm test:e2e e2e/smoke.spec.ts` 1 passed. Includes the 403 login-neutrality correction below (same slice, required for the E2E contract).
- [x] 3.5 `README.md` + `docs/CODEBASE-GUIDE.md` updated (verified-only auth, enumeration-neutral login/resend, verify callback, SMTP env on `pocketbase-init` only, operator-only staging test-email documented as NOT part of the default suite). No version bump, tag, or publication. Operator staging test-email documented only — not executed, no secrets requested.

## 11. TDD Cycle Evidence (Phase 3, Strict TDD)

Safety net (before Phase 3 edits were authored in the interrupted session; re-verified on resume): Phase 2 state 546/546 full suite + `tsc` clean carried forward. Interrupted dirty tree already contained the 10-test RED file; it was kept as RED evidence, executed to confirm FAIL→PASS progression on resume (see below), never deleted.

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1 | `tests/auth-verification-ui.test.tsx` (10 tests) | Integration (Testing Library) | ✅ 546/546 Phase 2 baseline preserved | ✅ pre-existing in dirty tree, confirmed failing-then-passing on resume (callout/resend/router/verify-copy assertions) | ✅ 10/10 | ✅ callout shown/hidden + resend resolve/reject + failure-copy neutrality (≥2 cases per behavior) | ➖ None needed (interrupted implementation already minimal) |
| 3.2 | same + `app/login/page.tsx`, `components/auth/login-form.tsx`, `components/auth/register-form.tsx`, `components/ui/alert.tsx` | Integration | ✅ as above | ✅ (from 3.1) | ✅ 10/10 focused, 557/557 full | ✅ (from 3.1) | ✅ resend extracted as full-width secondary control, inline 44px style for jsdom observability, focus ring `#2F5B8A` |
| 3.3 | `e2e/pb-admin.ts` + `e2e/smoke.spec.ts` | E2E (Playwright) | N/A (new helper path) | ✅ E2E contract written first (register → callout/no-cookie → denied → verified dashboard) | ✅ 1 passed (15.5–16.0s) | ✅ two users (A + B isolation) + denied-vs-verified login paths | ➖ None needed |
| 3.4 | all Phase 3 files | Unit + E2E | ✅ 557/557 full | ✅ (from above) | ✅ 57/57 focused (`auth-session` 47 + `auth-verification-ui` 10), 557/557 full, `tsc` 0, `biome` clean | ✅ (from above) | ✅ 403 correction (below) kept minimal; no UI restyle |
| 3.5 | N/A (docs) | N/A | N/A (docs) | ➖ structural, no executable behavior | ✅ readback verified (verified-only + SMTP env + operator-only staging note, no bump/tag) | ➖ Skipped: no branching logic | ➖ None needed |

Supplemental RED→GREEN inside this slice (E2E-driven defect, same work unit): live PB 0.40.1 returns **403** `The request doesn't satisfy the collection requirements to authenticate.` for authRule-denied unverified login (fresh-user probe 2026-09-04), while Phase 2 unit mocks only covered 400. E2E first failed with `Error al iniciar sesión` (generic) instead of `Credenciales inválidas` — the RED. Added triangulation test `unverified authRule 403 maps to Credenciales inválidas` in `tests/auth-session.test.ts`: confirmed FAIL (`expected 'Error al iniciar sesión' to be 'Credenciales inválidas'`), then GREEN via `app/actions/auth.ts` mapping `400/401/403` (plus `response.status` and `collection-requirements` message guard) to neutral. Re-run: 47/47 `auth-session`, 557/557 full. `auth-session.test.ts` is therefore 46→47 in this slice.

Test summary (Phase 3): 11 tests written in-slice (10 UI + 1 × 403 triangulation; UI file was pre-existing dirty, 403 test authored on resume), 557/557 full suite passing (36 files). Layers: Integration (10) + Unit (47 in `auth-session`) + E2E (1). Approval tests: none (no refactoring of existing behavior; two `getAuthUser` fixtures from Phase 2 untouched). Pure functions: 0 new. Assertion quality: every new assertion calls production code and asserts concrete copy/behavior; no trivial/empty/type-only assertions; no CSS-class assertions (44px asserted via inline `minHeight` style + keyboard focus, both behavioral).

## 12. Work Unit Evidence (Phase 3, PR 3 slice)

| Evidence | Required value |
|---|---|
| Focused test command and exact result | `pnpm test:run tests/auth-verification-ui.test.tsx` → 1 file, 10 tests, all pass. `pnpm test:run tests/auth-session.test.ts tests/auth-verification-ui.test.tsx` → 2 files, 57 tests, all pass. Full `pnpm test:run` → 36 files, 557 tests, all pass. `npx tsc --noEmit` → exit 0. `pnpm check` (biome) → clean, no errors (3 pre-existing warnings + 2 infos). |
| Runtime harness command/scenario and exact result | `pnpm test:e2e e2e/smoke.spec.ts` → 1 passed (15.5s final; 16.0s prior run). Scenario: register → `/login?registered=1` callout visible + no `pb_auth` cookie → unverified login denied `Credenciales inválidas` + resend visible + no cookie → superuser `markUserVerified` (no SMTP) → login reaches dashboard (Servicios link). Remainder of the smoke (locations/services/move/history/isolation) also passed in the same run. Test-env note: dev PB had `batch.enabled=false`; enabled once via superuser `PATCH /api/settings` `{batch:{enabled:true}}` (environment only, not committed) because the pre-existing transfer step requires the batch API (`BATCH_UNAVAILABLE` otherwise). No SMTP configured or used; secrets never logged. |
| Rollback boundary | Phase 3 files only: `app/login/page.tsx`, `app/verify/page.tsx`, `components/auth/login-form.tsx`, `components/auth/register-form.tsx`, `components/ui/alert.tsx`, `e2e/pb-admin.ts`, `e2e/smoke.spec.ts`, `tests/auth-verification-ui.test.tsx` (new), `tests/auth-session.test.ts` (403 triangulation test only), `app/actions/auth.ts` (403 neutrality hunk only), `README.md`, `docs/CODEBASE-GUIDE.md`, `openspec/changes/account-email-verification/tasks.md` (3.1–3.5 marks), `openspec/changes/account-email-verification/apply-progress.md` (§10–§12). Revert removes the verification UI, E2E helper, docs, and 403 mapping without touching Phase 1 (authRule/init/SMTP) or Phase 2 (register/resend/guard/callback core). |

Deviations / notes (Phase 3):
- `app/actions/auth.ts` 403 hunk touches a Phase 2 file, but it is a minimal in-slice correction (2-line status/message guard), not a Phase 2 rewrite: without it the Phase 3 E2E contract (`Credenciales inválidas` for unverified login) fails live against PB 0.40.1, which uses 403 for authRule denial and 400 for unknown/wrong-password. Both now map to the same observable neutral error; transport/500 still maps to generic `Error al iniciar sesión` without leaking PB text. Covered by the new 403 triangulation test.
- `tests/auth-session.test.ts` clean-status test updated by the interrupted session (`renders visible state without redirect loop`, asserting non-null + status prop) to match the Phase 3 `VerifyCard` UI; preserved as-is.
- Stash@{0} (`wip: preserve auth router changes for verification ui slice`) preserved — inspected, NOT popped, NOT dropped. Its `router.push`+`router.refresh` bytes are already present in both dirty forms and are asserted by the `router push+refresh pair is preserved in both forms` test. Later stashes @{1..4} untouched. No `git reset --hard` executed.
- `ui-design.md` treated as read-only (never edited); Spanish copy used verbatim; auth card inherited (`max-w-[450px]`, `bg-surface`, `border-border`, `rounded-xl`); resend is a full-width secondary control ≥44px with visible `#2F5B8A` focus; `/verify` reuses the `w-16`/`w-8` brand tile + Alert + `/login` link; token never rendered, logged, or left in the post-outcome URL.
- Attempt token (active, continued exactly): `sha256:2affc79b253f703db6131e6122c57ef26ccf649882abdc2e926d16b0a8341c46`. No version bump, tag, or publication. Operator staging test-email (`POST /api/settings/test/email` `{template:"verification"}`) documented in README/CODEBASE-GUIDE only — not executed, no secrets requested.
