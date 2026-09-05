## Exploration: account-email-verification

### Current State

Auth is username/password against the PocketBase `users` auth collection, fronted by Next.js Server Actions. `register` (`app/actions/auth.ts:37`) creates the user then immediately calls `authWithPassword` and `saveAuthCookie`, so a brand-new account receives a session with no verification step. `login` (`app/actions/auth.ts:8`) authenticates and sets the `pb_auth` cookie the same way, mapping 400/401 to "Credenciales inválidas". `getAuthUser` (`lib/auth.ts:10`) revalidates server-side via `authRefresh` and fails closed on error, but never inspects `verified`. The `app/(app)/layout.tsx` guard therefore admits unverified users.

The collection artifact (`pocketbase/v1.collections.json`) declares `users` minimally (fields, CRUD rules, indexes, id) with public create (`createRule: ""`) and no `authRule`, verification, or mail settings. `scripts/pb-init.mjs` imports collections only (`deleteMissing: false`); nothing owns SMTP, sender identity, or verification templates — there is no SMTP env anywhere (`compose.yaml`, `Dockerfile`, `.env.example` have none). The installed PocketBase JS SDK exposes `requestVerification(email)` and `confirmVerification(token)`, matching the confirmed REST contract. No verify callback route/page exists. Tests (`tests/auth-session.test.ts`, mocked SDK) and the Playwright smoke test (`e2e/smoke.spec.ts`) both assume register-then-immediate-dashboard, so they will need updating. Uncommitted router changes in both auth forms (`router.push` + `router.refresh` replacing `window.location.assign`) must be preserved.

### Affected Areas

- `app/actions/auth.ts` — register must stop issuing sessions; login must distinguish unverified; new `requestVerification`/`resendVerification` and `confirmVerification` actions
- `app/verify/page.tsx` (new) — token callback route/page confirming verification via `confirmVerification`
- `app/login/page.tsx`, `app/register/page.tsx`, `components/auth/login-form.tsx`, `components/auth/register-form.tsx` — check-email state, unverified-login notice, resend UI (preserve uncommitted router navigation)
- `lib/auth.ts` — fail closed for unverified records (`verified !== true` → null/clear)
- `pocketbase/v1.collections.json` + `scripts/pb-init.mjs` (or a settings seam) — server-side fail-closed rule (`authRule: verified = true` to be verified live) and SMTP/template ownership
- `tests/auth-session.test.ts`, `tests/schema-artifact.test.ts`, `e2e/smoke.spec.ts` (+ `e2e/pb-admin.ts`) — cover unverified denial, resend neutrality, confirm flow; E2E needs a no-SMTP verification path
- `compose.yaml`, `.env.example`, deployment docs — Resend SMTP host/port/auth/TLS and sender `no-reply@serviceflow.jonasotoaguilar.space`; app URL `https://serviceflow.jonasotoaguilar.space/...` in the verification template
- Release pipeline (`.github/workflows/release.yml` + `scripts/release-*`) — pending patch release waits for this change

### Approaches

1. **PocketBase-native verification with `authRule` fail-closed** — Set users `authRule` to `verified = true` (verify live first); register creates the record and calls `requestVerification` without logging in; new `/verify` page calls `confirmVerification(token)`; login maps unverified denial to a check-email + resend UI; `getAuthUser` also rejects `verified !== true` as defense in depth. SMTP via Resend, sender `no-reply@serviceflow.jonasotoaguilar.space`, template link to `https://serviceflow.jonasotoaguilar.space/verify?token={TOKEN}`.
   - Pros: Smallest durable slice; enforcement lives in PocketBase so every client (web, E2E, future API consumers) fails closed; no custom crypto or token plumbing; reuses SDK methods
   - Cons: Requires confirming live `authRule` semantics and import-merge behavior of the minimal artifact; template/SMTP setup is outside current automation
   - Effort: Medium

2. **App-layer gating only (no `authRule` change)** — Keep PocketBase auth open; `register` skips auto-login and `getAuthUser`/layout redirect unverified users to a check-email page.
   - Pros: No PocketBase schema/settings changes; E2E unaffected at the PB layer
   - Cons: Not fail-closed — any direct PocketBase API call with the token still yields a valid session, so the "no session before verification" requirement is unenforceable; contradicts the security contract
   - Effort: Low (rejected on correctness grounds)

3. **Custom token flow owned by Next.js** — Issue own signed verification tokens, send via Resend SDK, confirm through a Route Handler that flips `verified` via superuser client.
   - Pros: Full control of mail UX and token lifetime
   - Cons: Hand-rolled auth-adjacent crypto and mail plumbing; superuser credential inside app runtime; duplicates what PocketBase already provides; largest test surface
   - Effort: High

### Recommendation

Approach 1. It is the only option that satisfies "no session before verification" at the authoritative boundary. Proposal must first resolve three live unknowns against the installed PocketBase (not the minimal artifact): (a) exact `authRule` expression enforcing verified-only auth; (b) whether the collections import preserves or resets auth/verification options, i.e. whether `authRule` belongs in `v1.collections.json` or a separate settings step; (c) how verification templates reference the token placeholder so the link targets `/verify`. SMTP/template configuration needs an explicit owner (scripted superuser settings update vs. documented manual admin step); secrets stay env-only and are never persisted. Existing unverified accounts need a decided behavior (grandfather vs. force-verify) before apply.

### Risks

- The minimal `users` artifact may not round-trip `authRule`/verification options through `/api/collections/import` — proposal must test against live PocketBase or enforcement silently stays open
- Verification mail depends on Resend SMTP credentials plus DNS (SPF/DKIM) for `serviceflow.jonasotoaguilar.space`; deliverability cannot be verified locally — needs a staging send with user-supplied env
- Resend-verification endpoint is an account-enumeration oracle unless it returns a neutral response — must be specified
- E2E smoke assumes instant sessions; without a fake/SMTP-bypass verification path (superuser API confirm in `pb-admin.ts`), the suite cannot run offline
- `confirmVerification` tokens in URLs leak via logs/history — `/verify` must consume the token server-side, never log it, and redirect after confirm
- Scope creep risk: grandfathering existing unverified users and password-reset interplay are adjacent, not this change — keep them out unless proposal justifies inclusion

### Ready for Proposal

Yes — proceed to proposal with these orchestrator-to-user notes: confirm the grandfathering decision for pre-existing unverified accounts; confirm who owns SMTP/template setup (scripted vs. manual admin) for production; do NOT ask for Resend secrets now — they are needed only at runtime verification time. Review budget (800 changed lines) is sufficient for the recommended slice.
