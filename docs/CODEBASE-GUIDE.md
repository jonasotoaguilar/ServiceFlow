# Codebase Guide — ServiceFlow (PocketBase)

Navigational index for contributors and agents. Not a README, not the architecture map. Points at the live PocketBase seams.

## Who this is for

Contributors and agents who need the right file without rereading the repo.

## 90-second mental model

ServiceFlow is a Next.js 16 App Router app. Every request builds a request-scoped `PocketBase` client from `POCKETBASE_URL` and the `pb_auth` cookie, validates via `authRefresh`, and enforces tenant isolation with bound `userId = {:uid}` plus collection rules `userId = @request.auth.id`. Schema lives in `pocketbase/v1.collections.json` and is applied out of band; the app never hosts PocketBase.

## Seams — where to look

| Area | File | Use when |
|------|------|----------|
| Env | `lib/env.ts` | Validate `POCKETBASE_URL` (`http`/`https` absolute, Zod `PocketBaseEnvSchema`, `getPocketBaseUrl()` fail-closed, no admin vars) |
| Request client | `lib/pocketbase.ts` | Build per-request `new PocketBase(url)`; hydrate `authStore` from `pb_auth` only; `saveAuthCookie` / `clearAuthCookie` (`httpOnly`, `sameSite=lax`, `path=/`, `secure` in prod) |
| Filters | `lib/pocketbase-filter.ts` | Pure templates `serviceListBinding`, `locationListBinding`, `logListBinding` + `applyBinding` sole `pb.filter` site; `LIKE` `~` search, status allowlist |
| Auth identity | `lib/auth.ts` | `getAuthUser()` → `await cookies()` + `authRefresh` server validation; forged/unreachable → `null` fail-closed |
| Auth actions | `app/actions/auth.ts` | `login` / `register` / `logout`; Zod `loginSchema` / `registerSchema` before PocketBase; `passwordConfirm` + `authWithPassword`; deterministic Spanish errors; `pb_auth` only |
| Services | `lib/storage.ts` + `app/api/services/route.ts` | `getServices` / `saveService` / `updateService` / `deleteService` via `getList`/`create`/`update`/`delete`; native 15-char ids; `{ data, total, page, limit }`; `LIKE` on `clientName`/`invoiceNumber`/`rut`; `originLocationId` immutable (hook + API guard) |
| Locations | `app/actions/locations.ts` | `getLocations` (tenant-bound `locationListBinding`), create/update/toggle/delete with Zod + `normalizeString` + history guard (`locationId || originLocationId`, `fromLocationId || toLocationId`); `hasHistory`/`activeCount` computed via paginated `totalItems` |
| History / Registro | `app/actions/logs.ts` + `lib/storage.ts` movement + `app/(app)/service-events/serviceEventsManager.tsx` | `getLocationLogs` via `logListBinding`; `ServiceEventsManager` footer-only pager, filter strip, plain `/dashboard` empty-state navigation |
| Hooks | `pb_hooks/services.pb.js`, `pb_hooks/locations.pb.js`, `pb_hooks/backfill-origin.pb.js` | JSVM hooks: origin immutability, active-invariant triggers/JS guards, deterministic backfill (`cronAdd`/`cronRemove`, `onBootstrap` + `onCollectionAfterCreateSuccess`) |
| Validation | `lib/schemas.ts` | `ServiceSchema` (`sku`, `failureDescription`, `entryDate` required, `originLocationId` optional, RUT `41.421.442-1→8`), `LocationCreateSchema` / `LocationUpdateSchema` (`address` optional, max 200); `loginSchema` / `registerSchema` |
| Schema artifact | `pocketbase/v1.collections.json` | Versioned collections `users`, `services` (`originLocationId` indexed), `locations`, `service_events`; text FKs, indexes, tenant rules `userId = @request.auth.id`; no seed rows |

## Collections (artifact)

`pocketbase/v1.collections.json` is the canonical schema. `users` (auth) fields `email`/`password`/`name`; `locations` has `name`, `userId`, `isActive`, `address` (optional), `createdAt`/`updatedAt`; `services` has `userId`, `clientName`, `product`, `locationId`, `originLocationId` (immutable, indexed), `entryDate`, `status` (`pending` default), etc.; `service_events` has `userId`, `ServiceId`, `fromLocationId`, `toLocationId`, `changedAt`, `kind`. Apply is explicit operator step (Admin UI import or hand transcription) — the Next.js process never applies schema. Registro metrics: active = `pending`/`ready` at current `locationId`, completed = `originLocationId`, cancelled = neither.

## Session and tenancy

- Cookie: `pb_auth` (`JSON { token, record }`), never logged, `httpOnly` + `sameSite=lax`.
- Validation: `getAuthUser` `authRefresh` before identity; RSC validates, Action/Route may persist refreshed cookie.
- Isolation: every list binds `userId = {:uid}`; API rules enforce `userId = @request.auth.id` on all CRUD for `services`/`locations`/`location_logs`; unauthenticated → `401`/redirect.

## PocketBase Batch (0.40.1) — live enablement matrix and 403 runbook

Bounded live inspection via available local/trusted runtime only. No credentials read or exposed. `staging`/`prod` inaccessible — every unobserved value stays UNKNOWN per spec; evidence gap recorded.

### Enablement matrix

| Environment | Dashboard path | batch.enabled | batch.maxRequests | batch.timeout | batch.maxBodySize | Observed (UTC) | Source |
|---|---|---|---|---|---|---|---|
| dev | Settings → Application → Batch Web API | false | 50 | 3 | 0 (Default to 128MB) | 2026-08-27 | live superuser GET /api/settings at 127.0.0.1:8090 — PocketBase 0.40.1 |
| staging | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | inaccessible — no trusted runtime access; evidence gap — not observed |
| prod | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | inaccessible — no trusted runtime access; evidence gap — not observed |

Field IDs observed: `batch.enabled` (checkbox Enable (experimental)), `batch.maxRequests` (Max requests in a batch), `batch.timeout` (Max processing time in seconds), `batch.maxBodySize` (Max body size in bytes, placeholder Default to 128MB). Admin accordion `batchApiAccordion` (`ri-archive-stack-line` Batch Web API) inside Settings → Application (`pageApplicationSettings`). API: `GET/PATCH /api/settings` with `batch` object; `POST /api/batch` returns `403` `Batch requests are not allowed` when `batch.enabled` is `false`, and `400` when enabled with empty requests.

### Gate — block where UNKNOWN

If any of Dashboard path, `batch.enabled`, `batch.maxRequests`, `batch.timeout`, or `batch.maxBodySize` is UNKNOWN for the target environment, the system MUST NOT send `POST /api/batch`. UNKNOWN enablement MUST NOT send batch — treat as unavailable. No `pb.createBatch().send()` until that environment row is documented after live inspection. UNKNOWN rows blocked where undocumented — never send batch.

### 403 Runbook (operator)

- Symptom: `POST /api/batch` → `403` `Batch requests are not allowed`.
- Cause: batch not enabled/configured on that PocketBase 0.40.1 deployment (`batch.enabled` is `false`).
- Operator action: Enable via Dashboard at Settings → Application → Batch Web API: check Enable (experimental), confirm `Max requests in a batch`, `Max processing time`, `Max body size`, Save. Re-inspect via `GET /api/settings` as superuser; verify `batch.enabled` is `true` before retry. No credentials in code or logs.
- System behavior on 403: operator-facing failure `BATCH_UNAVAILABLE` with runbook link. The system MUST NOT retry on 403 and MUST NOT fall back to sequential writes. The system MUST NOT retry and MUST NOT sequential — never send `services` update then `service_events` create as fallback; no silent sequential fallback.

## Docker — worktree isolation

- Host ports `APP_PORT` / `POCKETBASE_PORT` are configurable in `.env` (defaults `3000`/`8090`) to run worktrees side-by-side.
- Volume `pocketbase-data` is project-scoped (`COMPOSE_PROJECT_NAME`, default = directory name); previously fixed `serviceflow-pocketbase-local-data` — copy once with `docker run --rm -v serviceflow-pocketbase-local-data:/from -v <project>_pocketbase-data:/to alpine cp -a /from/. /to/`.
- Canonical mount: `./pb_hooks:/pocketbase/hooks:ro` and `./pb_migrations:/pocketbase/migrations:ro`. Build context excludes `.agents`, `.herdr`, `.codegraph`, `pb_data`, `.sdd`.

## What is NOT current

- No in-repo PocketBase provisioning; the PocketBase artifact `pocketbase/v1.collections.json` is applied out of band.
- No proxy or janitor remains; current auth is `pb_auth` only.

## Reading path

1. This guide
2. `lib/env.ts` and `lib/pocketbase.ts` (request client)
3. `lib/pocketbase-filter.ts` (bound filters)
4. `pocketbase/v1.collections.json` (schema)
5. `PRODUCT.md` (product intent) and `DESIGN.md` (visual system)

## Checklist

- [ ] Every linked path above exists
- [ ] No new work reads legacy `session` for auth
- [ ] Filters use `applyBinding` with `{:param}` only

## Next step

Open `DESIGN.md` for the visual system or `lib/pocketbase.ts` to trace a request, and `PRODUCT.md` for product intent.
