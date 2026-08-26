# PRD: ServiceFlow

Garage and repair-shop service lifecycle management on a PocketBase-only backend. Track incoming repairs, assign them to branches, and monitor status until delivery. Every operator starts from an empty PocketBase.

## Quick Path

1. Visitor registers with name, email, password (public self-registration) and receives a `pb_auth` httpOnly session.
2. Authenticated user creates service tickets with client, product, and `locationId`.
3. Tickets progress `pending → ready → completed` (or `cancelled`) with date invariants.
4. Moving a ticket between locations creates a `location_logs` entry; history is tenant-scoped.
5. Dashboard lists with `{ data, total, page, limit }`, LIKE search, and status/location filters.

## User Personas

- **Shop Owner / Manager**: oversees tickets, branch workloads, and location history.
- **Technician**: registers tickets, updates status, changes service location.

## User Stories

- As a visitor, I want to register with email/password so I can access my own data without an invite.
- As a technician, I want to register a service ticket so the repair is tracked.
- As a technician, I want to change a ticket's location so work flows between branches.
- As a manager, I want to search tickets by client, invoice, or RUT with LIKE so I find any active service.
- As a manager, I want to view location history filtered by location and date so I can audit movements.
- As any user, I want to log in with email/password into an isolated tenant so I see only my data.

## Current State (PocketBase contract)

- **Backend**: PocketBase is the only data and auth backend. Next.js uses `POCKETBASE_URL` plus the `pb_auth` user session.
- **Auth / session**: `pb_auth` is `httpOnly`, `sameSite=lax`, `path=/`, `secure` in production; `expires` from JWT `exp` when parseable, otherwise session cookie. Value is never logged. Validation is server-side via `authRefresh` before returning identity; forged or unreachable → unauthenticated (`null`/`401`) fail-closed.
- **Empty start**: this PocketBase environment starts empty. Notice on `/login` and `/register` reads: `Este entorno PocketBase comienza vacío.` No import wizard, no dual-write, no id mapping, no password migration.
- **Tenancy**: every list binds `userId = {:uid}` and collection API rules enforce `userId = @request.auth.id` on all CRUD for `services`, `locations`, and `location_logs`. A second user sees none of the first user's rows. Unauthenticated RSC/actions/API redirect or `401`.
- **Ids**: PocketBase-native 15-character ids (15-char). Create omits `id`; no `crypto.randomUUID` / `generateId`, no `$id` preservation.
- **Lists**: `{ data, total, page, limit }` with 1-based `page` (default 1) and `limit` (default 20). `total` is `totalItems`. Empty match returns `{ data: [], total: 0, page, limit }`.
- **Search**: LIKE search uses `~` against `clientName`, `invoiceNumber`, `rut` with bound `{:search}` only. Status is allowlisted to `pending|ready|completed|cancelled`; `locationId` is bound. Raw input is never interpolated.
- **Locations**: `address` is optional, trimmed, max 200, blank → omitted. Duplicate names are rejected per `normalizeString` (lowercase, NFD, strip combining, trim) per user. `isActive` is `true` on create and togglable; delete is blocked when any service or log references the location.
- **Schema**: versioned artifact `pocketbase/v1.collections.json` (`users`, `services`, `locations`, `location_logs`) is applied out of band to the already-running local `127.0.0.1:8090` and the existing Dokploy-managed PocketBase. The Next.js process never applies schema and never hosts PocketBase.
- **Validation**: Zod at every untrusted edge (`loginSchema`, `registerSchema`, `ServiceSchema`, `LocationCreateSchema`/`LocationUpdateSchema`, `PocketBaseEnvSchema`). `POST`/`PUT` `/api/services` validate before any write.

## Features

- Service ticket CRUD with Zod boundary, status/date invariants, and tenant isolation.
- Status workflow `pending`, `ready`, `completed` (immutable), `cancelled` (fills `cancellationDate` when absent).
- Multi-location (branch) management with normalized duplicate detection and optional `address`.
- Location-movement audit log (`location_logs` with denormalized `userId`, `ServiceId`, `fromLocationId`, `toLocationId`, `changedAt`); skipped when completing.
- Dashboard with pagination envelope, LIKE search, multi-status filter, location filter, and sort `entryDate` / `-entryDate`.
- History listing with `fromLocationId = {:lid} || toLocationId = {:lid}` and `changedAt` date bounds, sort `-changedAt`.
- Public self-registration; Chilean RUT and phone formatting; dark-only glassmorphism UI.

## Non-Goals

- No data, user, or password import; no `session` compatibility bridge.
- No dual-write or id-mapping table; no preservation of legacy `$id` / `DB_ID` / collection names.
- No PocketBase binary, container, volume, reverse proxy, TLS, backup, or Dokploy lifecycle in this repository.
- No runtime admin credentials or admin API schema apply from Next.js; no `POCKETBASE_ADMIN_*` as active config.
- No migration wizard, invite-only flow, or admin-provisioned accounts beyond public registration.
- No new E2E layer, coverage provider, or UI-kit/status-vocabulary changes.

## Constraints

- Runtime locator is single `POCKETBASE_URL` (`http`/`https` absolute, Zod-validated, fail-closed, no default host).
- Cookie flags and tenant rules are non-negotiable (httpOnly/lax/path/secure; `userId = @request.auth.id`).
- Ordered writes only (PocketBase has no multi-record transaction): service update → then `location_logs` create; service delete → delete `location_logs` by `ServiceId` first, abort if any delete fails, then delete service.
- External PocketBase down or unreachable → fail closed with generic error; no anonymous success.

## Roadmap

| Phase | Scope |
|-------|-------|
| Shipped (WU1–WU10b) | PocketBase request client, bound filters, auth + notice, tenant-scoped reads, service writes with native ids, location CRUD + movement + history, LIKE search + envelope, env/README/guide, PRD/ARCH, hygiene — completed |
| Shipped (WU10c) | English documentation remediation — translate README, correct ARCH/PRD/GUIDE to PocketBase-only |
| Out of change | PocketBase hosting/ops, import/migration tooling, CI/Husky/Dependabot/CODEOWNERS/SECURITY/DESIGN changes beyond WU10c |

## Success Criteria

- Unauthenticated access redirects or `401`; authenticated tenant sees only own rows.
- Register → notice → login → location create → service create/search → move → history → logout → second user sees nothing.
- `pnpm test:run`, `pnpm exec tsc --noEmit`, `pnpm run lint` pass with mocked PocketBase and no live network.
