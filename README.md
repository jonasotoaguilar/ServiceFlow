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

## Features

- **Service management**: Full CRUD for service tickets.
- **Status workflow**: `pending`, `ready`, `completed`, `cancelled` (read-only after completion).
- **Time calculation**: Elapsed days (business days).
- **Location control**: Branch management with movement history; `address` optional on `locations`.
- **Search & Pagination**: Filter by client, product, or invoice number with `LIKE` (`~`) search and `{ data, total, page, limit }` envelope.
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
   POCKETBASE_ADMIN_EMAIL=admin@local.test
   POCKETBASE_ADMIN_PASSWORD=admin123456
   ```

   - `POCKETBASE_URL` is the only locator read by the Next.js app; local default `http://127.0.0.1:8090` (host) and `http://pocketbase:8090` (inside compose network).
   - `POCKETBASE_ADMIN_*` is local-only for the compose PocketBase superuser — never read by Next.js. Keep real `.env` gitignored; `.env.example` documents placeholders.
   - No admin credentials are baked into the app image.

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Apply the schema**

   The versioned artifact is `pocketbase/v1.collections.json` (collections `users`, `services`, `locations`, `location_logs`, with optional `address` and required `location_logs.userId`; tenant rules `userId = @request.auth.id`, no business rows).

   - **Local compose**: `pocketbase-init` imports the artifact automatically with `PUT /api/collections/import` and `deleteMissing:false` after PocketBase is healthy — no manual step.
   - **External / Dokploy instance**: open the Admin UI (`http://127.0.0.1:8090/_/` or the managed URL), import `pocketbase/v1.collections.json` if supported, otherwise transcribe fields, indexes, and rules manually. Update the existing `users` collection — do not create a second one.
   - Verify: 4 collections, `address` optional, `userId` required in logs, 0 business rows, tenant rules present, `users` create public and list/delete blocked.
   - Next.js never calls the admin API; only `pocketbase-init` (local) or the operator uses it.

## Development

```bash
pnpm dev
```

The app is available at `http://localhost:3000`.

## Docker (local full stack)

`compose.yaml` runs **PocketBase + the Next.js app** so you can use the full stack in Docker without an external PocketBase.

```bash
# from the repo root
docker compose up --build -d --wait
```

- App: http://127.0.0.1:3000
- PocketBase API: http://127.0.0.1:8090
- PocketBase Admin UI: http://127.0.0.1:8090/_/

PocketBase uses the pinned community image `adrianmusante/pocketbase:0.40.1` (digest-pinned, non-root 1001, state at `/pocketbase`, healthcheck `GET /api/health`). A one-shot `pocketbase-init` container imports `pocketbase/v1.collections.json` with `deleteMissing:false`. The app container is built from the existing `Dockerfile` and reaches PocketBase via compose DNS at `http://pocketbase:8090` (`POCKETBASE_URL` inside the network).

Stop:

```bash
docker compose down
```

Volumes (`pocketbase-data` → `serviceflow-pocketbase-local-data`) persist data across restarts. Do not run `down -v` or `prune` unless you intend to wipe local data. Production/Dokploy remains out of scope for this local compose.

## Project Structure

- `/app`: Next.js routes and pages (App Router).
- `/components`: Reusable UI components.
- `/lib`: `pocketbase.ts` (per-request client, `pb_auth`), `pocketbase-filter.ts` (templates `{:param}` + `pb.filter`), `env.ts` (`POCKETBASE_URL` + Zod), `auth.ts` (`getAuthUser` validated via `authRefresh`), `storage.ts` (service CRUD), `schemas.ts` (Zod), `types.ts`.
- `/pocketbase`: Artifact `v1.collections.json`.
- `/tests`: Vitest suite (mocked PocketBase, no network).

## Authentication & Session

- **Public registration**: any user can register without an invite; `users` create `""`.
- **Session**: `pb_auth` cookie with `httpOnly`, `sameSite=lax`, `path=/`, `secure` in production, `expires` from JWT `exp`; value is never logged. Server validation via `authRefresh` before returning identity; forged/unreachable → `null`/401 fail-closed.
- **Tenancy**: every list binds `userId = {:uid}` and collection rules enforce `userId = @request.auth.id`; a second tenant sees no foreign rows.

## Data & Lifecycle

- **Empty start**: this PocketBase environment starts empty (notice on `/login` and `/register`). No import, no dual-write, no id mapping.
- **Native ids**: PocketBase generates native 15-character ids; no UUID pre-generation and no `$id` preservation.
- **Pagination**: `{ data, total, page, limit }` via `getList(page, perPage, { filter, sort })`; `total` from `totalItems`; `LIKE` search (`~`) on `clientName`, `invoiceNumber`, `rut`; status allowlist `pending|ready|completed|cancelled`.
- **Locations**: `address` optional (trim, max 200, blank → omitted); `isActive` toggle; delete blocked by history (`location_logs`).
