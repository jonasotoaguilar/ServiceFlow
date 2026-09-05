# ServiceFlow — Service Management System

A modern web application for managing the product service lifecycle. Register service intakes, manage status, control locations (branches), and track metrics such as wait times and costs. The live backend is **PocketBase** for authentication and data.

## Technologies

- **Core Framework**: [Next.js 16](https://nextjs.org/) (Turbopack + App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React 19](https://react.dev/)
- **Styles**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Authentication**: [PocketBase](https://pocketbase.io/)
- **Containerization**: [Docker](https://www.docker.com/) & Docker Compose (PocketBase + app)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)

## Prerequisites

- Node `22`, `pnpm@11.1.1` (enforced via `packageManager`)
- Docker + Docker Compose (for local PocketBase)

## Features

- **Service management**: Full CRUD for service tickets with inline validation (`sku`, `failureDescription`, `entryDate` required), RUT check, and field-level errors.
- **Status workflow**: `pending`, `ready`, `completed`, `cancelled` (read-only after `completed`); dashboard filter is exclusive single-status with right-side check (no pill).
- **Registro**: Chronological `service_events` log with filter strip and footer-only pagination; `Nuevo servicio` in the empty state navigates to plain `/dashboard` — no in-place modal, no duplicate header pager.
- **Location control**: Branch management with movement history; `address` optional on `locations` (trim, max 200, blank → omitted).
- **Location metrics**: Active = `pending`/`ready` at current `locationId`; Completed = immutable `originLocationId`; `cancelled` counts neither. `originLocationId` is set on create and enforced read-only thereafter.
- **Search & Pagination**: Filter by client, product, or invoice number with `LIKE` (`~`) search and `{ data, total, page, limit }` envelope; exact `total` via `totalItems` with no arbitrary page cap.
- **Tenancy**: Isolation by `userId` + collection rules `userId = @request.auth.id`; PocketBase-native 15-character ids.

## Environment Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ServiceFlow
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env` and adjust if needed:

   ```bash
   cp .env.example .env
   ```

   ```env
   POCKETBASE_URL=http://127.0.0.1:8090
   APP_PORT=3000
   POCKETBASE_PORT=8090
   POCKETBASE_ADMIN_EMAIL=admin@local.test
   POCKETBASE_ADMIN_PASSWORD=admin123456
   ```

   | Variable | Reader | Default | Notes |
   |---|---|---|---|
   | `POCKETBASE_URL` | Next.js app only | `http://127.0.0.1:8090` (host) / `http://pocketbase:8090` (compose network) | Only locator read by the app; validated as `http`/`https` absolute URL. |
   | `APP_PORT` / `POCKETBASE_PORT` | Compose host bindings | `3000` / `8090` | Change to run multiple worktrees in parallel without collisions. |
    | `POCKETBASE_ADMIN_*` | `pocketbase` + `pocketbase-init` only | `admin@local.test` / `admin123456` | Local superuser for schema import; never read by Next.js; keep real `.env` gitignored. |
    | `PB_SMTP_PASSWORD` | `pocketbase-init` only | unset (skip SMTP) | Resend API key. Unset/empty skips mail settings so default tests work; whitespace-only fails closed. Never mounted on the Next.js app. |
    | `PB_META_APP_URL` | `pocketbase-init` only | `https://serviceflow.jonasotoaguilar.space` | Optional verification-link origin override. |

   No admin credentials are baked into the app image.

3. **Install dependencies**

   ```bash
   pnpm install --frozen-lockfile
   ```

4. **Apply the schema**

   The versioned artifact is `pocketbase/v1.collections.json` (collections `users`, `services` with `originLocationId`, `locations`, `service_events`; optional `address`; required `service_events.userId`; tenant rules `userId = @request.auth.id`, no business rows).

   - **Local compose**: `pocketbase-init` imports the artifact automatically with `PUT /api/collections/import` and `deleteMissing:false` after PocketBase is healthy — no manual step.
   - **External / Dokploy instance**: open the Admin UI (`http://127.0.0.1:8090/_/` or the managed URL), import `pocketbase/v1.collections.json` if supported, otherwise transcribe fields, indexes, and rules manually. Update the existing `users` collection — do not create a second one.
   - Verify: 4 collections, `address` optional, `originLocationId` indexed, `userId` required in logs, 0 business rows, tenant rules present, `users` create public and list/delete blocked.
   - Next.js never calls the admin API; only `pocketbase-init` (local) or the operator uses it.

## Development

```bash
pnpm dev
```

The app is available at `http://localhost:3000` (or `http://localhost:${APP_PORT}` if you overrode `APP_PORT`).

## Docker (local full stack)

PocketBase stays in `compose.yaml`. The default `app` service is a production image (used by CI). For live reload of local code, overlay `compose.dev.yaml` so Next runs `pnpm dev` with the repo bind-mounted. PocketBase and its volume are unchanged.

```bash
# live reload (PocketBase + Next watching this checkout)
pnpm dev:stack
# equivalent:
docker compose -f compose.yaml -f compose.dev.yaml up
```

Rebuild the production-like app image (no live reload):

```bash
docker compose up --build -d --wait
```

| Endpoint | URL |
|---|---|
| App | `http://127.0.0.1:${APP_PORT:-3000}` |
| PocketBase API | `http://127.0.0.1:${POCKETBASE_PORT:-8090}` |
| PocketBase Admin UI | `http://127.0.0.1:${POCKETBASE_PORT:-8090}/_/` |

PocketBase uses the pinned community image `adrianmusante/pocketbase:0.40.1` (digest-pinned, non-root 1001, state at `/pocketbase`, healthcheck `GET /api/health`). A one-shot `pocketbase-init` container imports `pocketbase/v1.collections.json` with `deleteMissing:false`. In the live-reload overlay the app reaches PocketBase at `http://pocketbase:8090` on the compose network.

**Worktree isolation**

- Compose exposes `APP_PORT` and `POCKETBASE_PORT` via `${APP_PORT:-3000}` / `${POCKETBASE_PORT:-8090}` so two worktrees can run side-by-side by setting different ports in each `.env`.
- Volume `pocketbase-data` is project-scoped (Compose project name, default = directory name). Previously fixed as `serviceflow-pocketbase-local-data`. To preserve existing local data, copy it once:
  ```bash
  docker run --rm -v serviceflow-pocketbase-local-data:/from -v <project>_pocketbase-data:/to alpine cp -a /from/. /to/
  ```
  where `<project>` is your `COMPOSE_PROJECT_NAME` (directory name if unset).
- Hooks and migrations use one canonical image path: `./pb_hooks:/pocketbase/hooks:ro` and `./pb_migrations:/pocketbase/migrations:ro` (not `/pb/*`).
- `.dockerignore` excludes worktree runtime dirs (`.agents`, `.herdr`, `.codegraph`, `pb_data`, `.sdd`) to keep `pnpm build` from failing with `ENOENT`.

Stop:

```bash
docker compose down
```

`pocketbase-data` persists across restarts. Do not run `down -v` or `prune` unless you intend to wipe local data. Production/Dokploy remains out of scope for this local compose.

## Project Structure

- `/app`: Next.js routes and pages (App Router).
- `/components`: Reusable UI components.
- `/lib`: `pocketbase.ts` (per-request client, `pb_auth`), `pocketbase-filter.ts` (templates `{:param}` + `pb.filter`), `env.ts` (`POCKETBASE_URL` + Zod), `auth.ts` (`getAuthUser` validated via `authRefresh`), `storage.ts` (service CRUD with `originLocationId`), `schemas.ts` (Zod), `types.ts`, `format-date.ts`.
- `/pocketbase`: Artifact `v1.collections.json`.
- `/pb_hooks`: PocketBase JSVM hooks (`services.pb.js`, `locations.pb.js`, `backfill-origin.pb.js`).
- `/pb_migrations`: PocketBase JS migrations (image-canonical `/pocketbase/migrations`).
- `/tests`: Vitest suite (mocked PocketBase, no network).

## Authentication & Session

- **Public registration**: any user can register without an invite; `users` create `""`. Registration creates an unverified account, calls `requestVerification` best-effort, sets no `pb_auth` cookie, and navigates to `/login?registered=1` where an info callout explains verification is required before sign-in.
- **Verified-only session**: usable tokens are issued only to verified accounts (`users` `authRule: "verified = true"` plus the app guard rejecting `verified !== true` fail-closed). Unknown, wrong-password, and unverified logins share the same `Credenciales inválidas` error with an always-visible enumeration-neutral resend; no extra unverified-only copy.
- **Verification callback**: `/verify?token={TOKEN}` is consumed server-side via `confirmVerification` and redirects to `/verify?status=ok|fail` without leaving the token in the URL or logs. Bare `/verify` fails closed.
- **Session**: `pb_auth` cookie with `httpOnly`, `sameSite=lax`, `path=/`, `secure` in production, `expires` from JWT `exp`; value is never logged. Server validation via `authRefresh` before returning identity; forged/unreachable → `null`/401 fail-closed.
- **Tenancy**: every list binds `userId = {:uid}` and collection rules enforce `userId = @request.auth.id`; a second tenant sees no foreign rows.
- **Verification mail (SMTP)**: Resend SMTP is applied by `pocketbase-init` only from `PB_SMTP_PASSWORD` (required) plus optional `PB_META_APP_URL` (default `https://serviceflow.jonasotoaguilar.space`); sender `ServiceFlow <no-reply@serviceflow.jonasotoaguilar.space>`. Unset/empty password skips SMTP so default runs work; partial config fails closed. Secrets are never logged or baked into the app image.
- **Operator-only staging check**: one `POST /api/settings/test/email` with `{ "template": "verification" }` using operator user env. It is NOT part of the default suite — `pnpm test:run` and `pnpm test:e2e` pass without SMTP and never send real mail.

## Data & Lifecycle

- **Native ids**: PocketBase generates native 15-character ids; no UUID pre-generation and no `$id` preservation.
- **Pagination**: `{ data, total, page, limit }` via `getList(page, perPage, { filter, sort })`; `total` from `totalItems`; `LIKE` search (`~`) on `clientName`, `invoiceNumber`, `rut`; status allowlist `pending|ready|completed|cancelled`. No fixed page cap; history pagination uses exact `totalItems`/`totalPages`.
- **Origination**: `originLocationId` is set to `locationId` on create, immutable on update (hook + API guard), indexed in `services`. Backfill resolves from earliest `service_events.kind = 'created'` or falls back to `locationId` only when no `location_changed` history exists; ambiguous rows stay unresolved.
- **Locations**: `address` optional (trim, max 200, blank → omitted); `isActive` toggle; delete blocked by history (`services.locationId || originLocationId` or `service_events.fromLocationId || toLocationId`); at least one active location per user is enforced at DB triggers, JS hooks, and UI.
- **Registro metrics**: Row counts per location derive from the same origin contract:

  | Metric | Counts | Source field |
  |---|---|---|
  | Active | `pending` + `ready` | current `services.locationId` |
  | Completed | `completed` | immutable `services.originLocationId` |
  | Cancelled | neither | — |

  Guards prevent deleting a location with current or origin history via direct PocketBase writes.
- **Navigation**: `Registro` empty-state CTA pushes plain `/dashboard`; no `?createService=1` query, no in-place modal.
