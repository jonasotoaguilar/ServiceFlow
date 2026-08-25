# Codebase Guide — ServiceFlow (PocketBase)

Navigational index for contributors and agents. Not a README, not the architecture map. Points at the live PocketBase seams.

## Who this is for

Contributors and agents who need the right file without rereading the repo.

## 90-second mental model

ServiceFlow is a Next.js 16 App Router app. Every request builds a request-scoped `PocketBase` client from `POCKETBASE_URL` and the `pb_auth` cookie, validates via `authRefresh`, and enforces tenant isolation with bound `userId = {:uid}` plus collection rules `userId = @request.auth.id`. Schema lives in `pocketbase/v1.collections.json` and is applied out of band; the app never hosts PocketBase and never imports Appwrite data.

## Seams — where to look

| Area | File | Use when |
|------|------|----------|
| Env | `lib/env.ts` | Validate `POCKETBASE_URL` (`http`/`https` absolute, Zod `PocketBaseEnvSchema`, `getPocketBaseUrl()` fail-closed, no admin vars) |
| Request client | `lib/pocketbase.ts` | Build per-request `new PocketBase(url)`; hydrate `authStore` from `pb_auth` only; `saveAuthCookie` / `clearAuthCookie` (`httpOnly`, `sameSite=lax`, `path=/`, `secure` in prod) |
| Filters | `lib/pocketbase-filter.ts` | Pure templates `serviceListBinding`, `locationListBinding`, `logListBinding` + `applyBinding` sole `pb.filter` site; `LIKE` `~` search, status allowlist |
| Auth identity | `lib/auth.ts` | `getAuthUser()` → `await cookies()` + `authRefresh` server validation; forged/unreachable → `null` fail-closed |
| Auth actions | `app/actions/auth.ts` | `login` / `register` / `logout`; Zod `loginSchema` / `registerSchema` before PocketBase; `passwordConfirm` + `authWithPassword`; deterministic Spanish errors; `pb_auth` only |
| Services | `lib/storage.ts` + `app/api/services/route.ts` | `getServices` / `saveService` / `updateService` / `deleteService` via `getList`/`create`/`update`/`delete`; native 15-char ids; `{ data, total, page, limit }`; `LIKE` on `clientName`/`invoiceNumber`/`rut` |
| Locations | `app/actions/locations.ts` | `getLocations` (tenant-bound `locationListBinding`), create/update/toggle/delete with Zod + `normalizeString` + history guard |
| History | `app/actions/logs.ts` + `lib/storage.ts` movement | `getLocationLogs` via `logListBinding`; movement `location_logs` create on `locationId` change (not when completing) |
| Validation | `lib/schemas.ts` | `ServiceSchema`, `LocationCreateSchema` / `LocationUpdateSchema` (`address` optional, max 200); `loginSchema` / `registerSchema` |
| Schema artifact | `pocketbase/v1.collections.json` | Versioned collections `users`, `services`, `locations`, `location_logs`; text FKs, indexes, tenant rules `userId = @request.auth.id`; no seed rows |

## Collections (artifact)

`pocketbase/v1.collections.json` is the canonical schema. `users` (auth) fields `email`/`password`/`name`; `locations` has `name`, `userId`, `isActive`, `address` (optional), `createdAt`/`updatedAt`; `services` has `userId`, `clientName`, `product`, `locationId`, `entryDate`, `status` (`pending` default), etc.; `location_logs` has `userId`, `ServiceId`, `fromLocationId`, `toLocationId`, `changedAt`. Apply is explicit operator step (Admin UI import or hand transcription) — the Next.js process never applies schema.

## Session and tenancy

- Cookie: `pb_auth` (`JSON { token, record }`), never logged, `httpOnly` + `sameSite=lax`.
- Validation: `getAuthUser` `authRefresh` before identity; RSC validates, Action/Route may persist refreshed cookie.
- Isolation: every list binds `userId = {:uid}`; API rules enforce `userId = @request.auth.id` on all CRUD for `services`/`locations`/`location_logs`; unauthenticated → `401`/redirect.
- Legacy (historical): Appwrite `session` handling and `proxy.ts` janitor were removed in WU10a; current code uses `pb_auth` only and has no legacy cookie handling.

## What is NOT current

- `lib/appwrite.ts` and `node-appwrite` / `appwrite` SDK are deleted (WU10b) — historical rollback only; do not use for new work.
- Appwrite collection setup is not the live setup; the PocketBase artifact `pocketbase/v1.collections.json` is.
- The old unauthenticated Appwrite proxy rewrite is not live and `proxy.ts` is deleted; no janitor remains (WU10a).

## Reading path

1. This guide
2. `lib/env.ts` and `lib/pocketbase.ts` (request client)
3. `lib/pocketbase-filter.ts` (bound filters)
4. `pocketbase/v1.collections.json` (schema)
5. `ARCHITECTURE.md` (system map) and `PRD.md` (product intent)

## Checklist

- [ ] Every linked path above exists
- [ ] No new work imports `node-appwrite` or reads legacy `session` for auth
- [ ] Filters use `applyBinding` with `{:param}` only

## Next step

Open `ARCHITECTURE.md` for the system map or `lib/pocketbase.ts` to trace a request.
