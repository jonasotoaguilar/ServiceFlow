# ServiceFlow — Service Management System

A modern web application for managing the product service lifecycle. Register service intakes, manage status, control locations (branches), and track metrics such as wait times and costs. The live backend is **PocketBase** for authentication and data.

## Technologies

- **Core Framework**: [Next.js 16](https://nextjs.org/) (Turbopack + App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React 19](https://react.dev/)
- **Styles**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Authentication**: [PocketBase](https://pocketbase.io/)
- **Containerization**: [Docker](https://www.docker.com/) & Docker Compose (app only)
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

   Create a `.env` file at the root:

   ```env
   POCKETBASE_URL=http://127.0.0.1:8090
   ```

   - `POCKETBASE_URL` is the only required locator; local example `http://127.0.0.1:8090`.
   - No secrets are committed; no `POCKETBASE_ADMIN_*` or admin token in the repository.
   - The local instance is assumed already running at `127.0.0.1:8090` (no PocketBase container or Dokploy runbook is added here).

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Apply the schema (explicit, out of band)**

   The versioned artifact is `pocketbase/v1.collections.json` (collections `users`, `services`, `locations`, `location_logs`, with optional `address` and required `location_logs.userId`; tenant rules `userId = @request.auth.id`, no business rows).

   - Open the existing PocketBase Admin UI (local `http://127.0.0.1:8090/_/` or the existing Dokploy instance).
   - Import `pocketbase/v1.collections.json` if the version supports it; otherwise transcribe fields, indexes, and rules manually. Update the existing `users` collection — do not create a second one.
   - Verify: 4 collections, `address` optional, `userId` required in logs, 0 business rows, tenant rules present, `users` create public and list/delete blocked.
   - `POCKETBASE_URL` is changed in a separate step after verification. No admin API is used from Next.js.

## Development

```bash
pnpm dev
```

The app is available at `http://localhost:3000`.

## Docker

1. **Ensure `.env` contains `POCKETBASE_URL`.**

2. **Start the app container:**

   ```bash
   docker-compose up -d --build
   ```

   This repository does not operate PocketBase (no binary, volume, proxy, TLS, backup, or PocketBase/Dokploy compose).

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
- **Legacy (historical)**: the Appwrite `session` cookie handling was removed in WU10 (deleted `proxy.ts`/`clearLegacySessionCookie`); current code uses `pb_auth` only.

## Data & Lifecycle

- **Empty start**: this PocketBase environment starts empty. Previous Appwrite tickets and locations do not appear (temporary notice on `/login` and `/register`). No import, no dual-write, no id mapping.
- **Native ids**: PocketBase generates native 15-character ids; no UUID pre-generation and no `$id` preservation.
- **Pagination**: `{ data, total, page, limit }` via `getList(page, perPage, { filter, sort })`; `total` from `totalItems`; `LIKE` search (`~`) on `clientName`, `invoiceNumber`, `rut`; status allowlist `pending|ready|completed|cancelled`.
- **Locations**: `address` optional (trim, max 200, blank → omitted); `isActive` toggle; delete blocked by history (`location_logs`).

## Historical Rollback

Appwrite was left untouched until acceptance and was not imported. On cutover failure, redeploy the last Appwrite-backed image with the previous env; PocketBase rows are not copied back. The Appwrite mention here is historical only — do not configure Appwrite for new work or run Appwrite setup scripts.
