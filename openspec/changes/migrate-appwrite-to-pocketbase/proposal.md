# Proposal: Replace Appwrite with PocketBase

**Change**: `migrate-appwrite-to-pocketbase`
**Supersedes**: remediate-audit-findings (16/26, cancelled, not archived)

ServiceFlow will stop using Appwrite and talk only to PocketBase. Development targets a local instance at `127.0.0.1:8090`. Production already has a Dokploy-managed PocketBase on Jona's VPS; this repo connects through environment configuration and does not operate that service.

PocketBase starts empty. Users register again. No Appwrite rows or passwords are imported. Login, registration, and the first authenticated session show a temporary notice that previous Appwrite tickets and locations will not appear. The live Appwrite project stays untouched until cutover succeeds, then Appwrite leaves this codebase.

## Intent

Replace the Appwrite-coupled auth and data path with a PocketBase-backed path that preserves today's product behavior: tenant isolation, auth gating, public self-registration, httpOnly cookies, Zod validation, `{ data, total, page, limit }`, service status rules, location lifecycle, optional location `address`, and location-history delete guards.

SQLite `LIKE`-style search (`~`) is the accepted search semantic for this small personal dataset.

## Locked decisions

| Topic | Decision |
| --- | --- |
| Backend | Full Appwrite → PocketBase replacement |
| Dev instance | External local PocketBase at `http://127.0.0.1:8090` |
| Prod instance | Existing Dokploy-managed PocketBase; connect by env only |
| Data | Empty start; no import of users, Services, locations, or logs |
| Passwords | No reset/migration flow; users register fresh |
| Registration | Public self-registration stays open |
| Empty-start notice | Temporary login/register or first-session notice: new PocketBase is empty; previous Appwrite tickets/locations will not appear |
| Session cookie | Rotate to `pb_auth`; ignore and delete the legacy Appwrite `session` cookie; no compatibility bridge |
| Record IDs | PocketBase-native 15-character ids; no preservation or mapping layer |
| Location schema | Optional `address` is first-class |
| Search | PocketBase filter `~` / SQLite LIKE is enough |
| Runtime secrets | Non-admin only (`POCKETBASE_URL` + user session cookie) |
| Appwrite project | Untouched until accepted cutover; then remove integration |
| Governance | CI, Husky, Dependabot, CODEOWNERS, root `SECURITY.md`, and `DESIGN.md` stay outside this change |

## Scope

### In scope

- PocketBase JS SDK factory and session helpers (`lib/pocketbase.ts`) replacing `lib/appwrite.ts` as the data/auth seam.
- Auth: register, login, logout, `getAuthUser()` against PocketBase `users`; httpOnly `pb_auth` cookie with `secure` in production, `sameSite=lax`, `path=/`. Incoming legacy `session` cookies are ignored and cleared. No dual-read or dual-write bridge.
- Temporary empty-start notice on login, registration, or first session: the new environment starts empty and previous Appwrite tickets/locations will not appear. Remove the notice after cutover communication is done, not as a permanent product surface.
- Storage/actions/API rewrite for `services`, `locations`, and `location_logs` with app-level `userId` checks plus collection API rules `userId = @request.auth.id`.
- Versioned collection schema/rules artifact in this repo (JS migrations or exported collection JSON). Design will pick the format and the explicit apply step for the existing Dokploy service.
- PocketBase-generated 15-character record ids. Stop pre-generating UUIDs. Do not keep Appwrite `$id` values or an id-mapping table.
- Preserve public contracts: Zod at the boundary, pagination envelope, status/date rules, duplicate location names via `normalizeString`, `isActive` toggle, `hasHistory` delete guard, denormalized `userId` on logs, optional `address`.
- Parameterized PocketBase filters only (`{:param}`); never concatenate search input.
- Docs: README env rewrite; add PocketBase-accurate `PRD.md` and `ARCHITECTURE.md`.
- Neutral hygiene that still helps this cutover: delete `proxy.ts`, `check_or.ts`, `lint_output.txt`; drop unused `appwrite` client SDK; after acceptance drop `node-appwrite`, setup script, and Appwrite env keys.
- Tests for auth gate, tenant filter, schema/validation, and lifecycle rules (`pnpm test:run`).

### Out of scope

- Any PocketBase binary, container, volume, reverse proxy, TLS, backup job, or Dokploy lifecycle in this repository.
- Runtime admin credentials, admin token env vars, or ServiceFlow applying schema through an admin API.
- Appwrite data transfer, dual-write, password import, forced reset, or id preservation.
- Reading or accepting the legacy `session` cookie after cutover.
- Copying `remediate-audit-findings` Appwrite permission-migration, dev-target-guard, or `Role.any()` setup hunks.
- Appwrite `DB_ID` rename (`serviceflow-db`).
- New E2E layer, coverage provider, CI, Husky, Dependabot, CODEOWNERS, root `SECURITY.md`, or `DESIGN.md`.
- Changing UI kit, status vocabulary, or inventing new product workflows beyond the temporary empty-start notice.

## Approach

Strangler on this branch; one backend in production at cutover.

1. **Seams first.** Add `lib/pocketbase.ts` that builds a server client from `POCKETBASE_URL` and the `pb_auth` cookie. Point `lib/auth.ts`, `app/actions/auth.ts`, `lib/storage.ts`, location/log actions, and `app/api/services` at that factory. Keep exported storage signatures so dashboard/UI churn stays small.
2. **User-scoped runtime.** Login/register use public `users` auth. The cookie stores the PocketBase auth token under `pb_auth`. Every request reconstructs `authStore` from that cookie only. If a request still carries the Appwrite `session` cookie, ignore it and delete it. No admin login in the Next.js process.
3. **Empty-start communication.** Show a short, temporary notice on login, registration, or first session so returning users do not expect old Appwrite tickets or locations. Do not build a migration wizard or import path around that notice.
4. **Schema out of band.** Commit a versioned schema/rules artifact. Local and production PocketBase apply it explicitly (copy/import/restart on the already-managed service). How Dokploy applies that artifact is a design question; this change must not invent admin credentials to do it from the app.
5. **Native ids.** Let PocketBase generate 15-character record ids. Relations stay usable through the current `locationId` / `ServiceId` fields (relation type vs string is a design detail). No custom-id injection and no mapping table.
6. **Rules + app checks.** Default-deny collection rules require `userId = @request.auth.id`. App code still filters and ownership-checks. Two-user tests prove isolation.
7. **Search/pagination adapter.** Map today's query params to PocketBase `getList(page, perPage, { filter, sort })` and return `{ data, total, page, limit }`.
8. **Cut over, then delete Appwrite.** Keep Appwrite code until the PocketBase path is accepted; then remove SDK, scripts, env, docs references, and the leftover `session` cookie path.

### Smallest end-to-end first slice

Prove auth + one tenant-scoped read against empty local PocketBase without deleting Appwrite and without touching production.

1. Add `pocketbase` JS SDK and document `POCKETBASE_URL=http://127.0.0.1:8090` (no values committed).
2. Add the versioned schema artifact for `users` (auth) and `locations` (including optional `address`) with tenant rules.
3. Implement `lib/pocketbase.ts` + rewrite `getAuthUser` / login / register / logout onto `pb_auth`. Clear any leftover `session` cookie. Keep public self-registration.
4. Show the temporary empty-start notice on login/register or first session.
5. Point `getLocations` at `locations` with `userId = {:uid}`.
6. Add Vitest coverage for unauthenticated gate and tenant filter (mocked PocketBase). Existing schema tests stay green.
7. Verify locally: register → see notice → login → empty locations list. Appwrite project and production image stay unchanged.

Later slices, in order: services CRUD + search/pagination + status dates; location mutations and history logs; rule hardening tests; docs/hygiene; Appwrite removal after acceptance.

## Capability / spec deltas

Main spec store is empty. `remediate-audit-findings` specs stay in that cancelled change and are not archived or copied.

| Capability | Delta | Notes |
| --- | --- | --- |
| `pocketbase-access` | New | Server SDK, `POCKETBASE_URL`, `pb_auth` authStore, no admin runtime |
| `pocketbase-schema` | New | Versioned collections/indexes/rules; explicit apply; empty start; native 15-char ids |
| `auth-session` | New | Public register/login/logout/`getAuthUser`; `pb_auth` only; clear legacy `session`; temporary empty-start notice |
| `services-lifecycle` | New | CRUD, status/date rules, LIKE search, stable pagination envelope |
| `locations-history` | New | Optional `address`, duplicate guard, `isActive`, logs, delete guard |
| `project-contracts` | Re-evaluate | PocketBase-accurate `PRD.md` / `ARCHITECTURE.md` / README; drop Appwrite-dev-only claims |
| `ci-governance` | Deferred | CI, Husky, Dependabot, CODEOWNERS, `SECURITY.md`, `DESIGN.md` stay out |
| `appwrite-server-access` | Abandoned | Do not carry forward |
| `appwrite-permission-migration` | Abandoned | Do not copy |

## Affected areas

| Area | Impact | Description |
| --- | --- | --- |
| `lib/appwrite.ts`, `lib/auth.ts`, `lib/storage.ts` | Replace | PocketBase factory, `pb_auth` session, collection calls |
| `app/actions/auth.ts`, `locations.ts`, `logs.ts` | Modified | Same product actions, new backend; clear leftover `session` |
| `app/login`, `app/register`, first-session UI | Modified | Temporary empty-start notice |
| `app/api/services/route.ts` | Modified | Stop pre-generating UUIDs; keep Zod + envelope |
| `lib/types.ts`, `lib/schemas.ts` | Mostly stable | `id` remains string; values become 15-char PocketBase ids; `address` stays optional |
| `pocketbase/` (or equivalent) | New | Versioned schema/rules artifact |
| `.env.example`, `README.md`, root contracts | Modified/new | PocketBase URL only; no admin secrets |
| `scripts/setup-appwrite.ts`, `node-appwrite`, `appwrite` | Removed after acceptance | Rollback copy is the current Appwrite project + prior image |
| `proxy.ts`, `check_or.ts`, `lint_output.txt` | Removed | Dead Appwrite-adjacent hygiene |
| `Dockerfile`, deploy workflow | Unchanged | Next.js standalone only; no PocketBase image |

## Risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Collection rules too open leak tenants | Med | Default deny; `userId = @request.auth.id`; two-user tests |
| Search filter injection | Med | Bind `{:search}` only; reject raw interpolation in review |
| Schema not applied on prod PocketBase | Med | Cutover checklist: artifact applied, collections/rules visible, then flip `POCKETBASE_URL` |
| External PocketBase down or unreachable | Med | Document precondition; app fails closed; ops stay on Dokploy, not this repo |
| Returning users expect old Appwrite data | Med | Temporary login/register/first-session notice; no import path |
| Leftover Appwrite `session` cookie confuses auth | Low | Ignore and delete `session`; read/write `pb_auth` only |
| Public registration remains an open account surface | Low | Keep current product policy; do not add invite-only or admin-provisioning in this change |
| Accidental Appwrite deletion before acceptance | Low | Cleanup is the last gated slice; live Appwrite project is not migrated or deleted by this repo |
| Oversized PRs vs 400-line budget | High | Slice as first-slice → services → locations/logs → docs/hygiene → Appwrite removal |

## Rollback and cutover

**During development.** Appwrite Cloud/project is not written, imported from, or deleted. Feature-branch failures revert with `git revert` / previous commit. Local PocketBase is disposable.

**Cutover (production).**

1. Confirm the Dokploy PocketBase is up, TLS/backups are ops-owned, and the versioned schema/rules artifact has been applied explicitly.
2. Deploy the PocketBase-backed ServiceFlow image with `POCKETBASE_URL` pointing at that instance. Do not ship admin credentials.
3. Register a fresh user, confirm the empty-start notice, and walk login → locations → service create/search → location move/log → logout.
4. Keep the previous Appwrite-backed image and the untouched Appwrite project as rollback.

**Rollback.** Redeploy the last Appwrite-backed image and Appwrite env. PocketBase data created after cutover is not copied back. Users created on PocketBase do not exist on Appwrite. The `pb_auth` cookie will not authenticate against Appwrite; that is expected.

**After acceptance.** Remove Appwrite integration from this repo only, including the unused `session` cookie path. Deleting the Appwrite cloud project is operational and outside this change.

## Success criteria

- [ ] Local register/login/logout against `127.0.0.1:8090` with httpOnly `pb_auth` flags preserved.
- [ ] Legacy Appwrite `session` cookie is ignored and removed; no compatibility bridge remains.
- [ ] Login, registration, or first session shows a temporary notice that PocketBase starts empty and previous Appwrite tickets/locations will not appear.
- [ ] Public self-registration still works without an invite or admin-created account.
- [ ] New records use PocketBase 15-character ids; no Appwrite `$id` preservation layer exists.
- [ ] Authenticated user can CRUD own services/locations/logs; a second user sees none of them.
- [ ] Unauthenticated RSC/actions/API still redirect or 401.
- [ ] Dashboard list keeps `{ data, total, page, limit }` and LIKE search across clientName / invoiceNumber / rut.
- [ ] Location `address` optional; duplicate name, `isActive`, and history delete guards unchanged.
- [ ] Runtime env has no Appwrite keys and no PocketBase admin credentials.
- [ ] Schema/rules live in a versioned in-repo artifact; production apply is documented, not performed by the app.
- [ ] `pnpm test:run`, lint, and `tsc --noEmit` pass.
- [ ] Appwrite project still intact until acceptance; Appwrite code/deps removed only after that gate.
- [ ] CI, Husky, Dependabot, CODEOWNERS, root `SECURITY.md`, and `DESIGN.md` are unchanged by this migration.

## Neutral hygiene re-evaluation

From cancelled `remediate-audit-findings` (not archived):

| Candidate | Verdict |
| --- | --- |
| Delete `proxy.ts`, `check_or.ts`, `lint_output.txt` | Include |
| Drop unused `appwrite@22`; later `node-appwrite` | Include (staged) |
| Dual lockfile / pnpm-workspace | Include only if it stays a small docs/hygiene slice |
| `PRD.md` / `ARCHITECTURE.md` / README | Include, PocketBase-accurate |
| CI, Husky, Dependabot, CODEOWNERS, `SECURITY.md`, `DESIGN.md` | Out of this change |
| Permission migrator, dev-target guard, Appwrite perm tests, `[]` setup hunk | Never copy |
