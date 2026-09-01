# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — Shop Manager / Owner**: oversees the service lifecycle across branches (Sedes). Situation: at the shop counter or back-office desktop, reviewing ticket volume, workload per location, and movement history. Job: ensure every incoming repair is tracked, routed to the right branch, and delivered or cancelled with an auditable trail.

**Primary — Technician**: registers incoming service tickets, updates status, and moves tickets between locations. Situation: repetitive operational work at the workshop desk (desktop-first), scanning and updating many tickets per day. Job: capture client/product/location correctly once, then advance the ticket with minimal friction.

No third role (reception/admin) confirmed — reception duties are covered by Technician. Mobile/field use is secondary; desktop at the shop is the primary context.

## Product Purpose

ServiceFlow manages the garage and repair-shop service lifecycle on a PocketBase-only backend. It lets a shop register service intakes, assign them to branches, and monitor status until delivery — replacing spreadsheets with a tenant-isolated, searchable system of record.

Success means: a technician registers a ticket in seconds, finds any ticket by client / invoice / RUT, moves it between Sedes with history, and a manager can audit what moved where and when — all with only the user's own data visible.

## Positioning

The meaningfully different mechanism is the full repair cycle with branch traceability on a single PocketBase backend and no extra infrastructure: `pending → ready → completed` (or `cancelled`) with date invariants, per-ticket location assignment, `location_logs` audit entries on every move, and LIKE (`~`) search scoped to the authenticated tenant. A neighboring product using a spreadsheet or a generic ticket tool cannot truthfully claim tenant-bound PocketBase rules (`userId = @request.auth.id`), ordered writes without invented transactions, and zero-admin provisioning.

## Operating Context

**Workflows (factual):**
1. Visitor self-registers (name, email, password) → receives `pb_auth` httpOnly session → notice → login.
2. Authenticated user creates locations (Sedes) with optional `address` (trimmed, max 200, blank omitted) and manages `isActive`.
3. User creates service tickets with client, product, and `locationId` (Zod-validated).
4. Tickets progress `pending → ready → completed` (immutable after `completed`) or `cancelled` (fills `cancellationDate` when absent).
5. Moving a ticket between locations creates a `location_logs` entry (`userId`, `ServiceId`, `fromLocationId`, `toLocationId`, `changedAt`) — skipped when completing.
6. Dashboard lists with `{ data, total, page, limit }`, LIKE search on `clientName`/`invoiceNumber`/`rut`, status/location filters, and `entryDate` sort.
7. History view filters by location (`fromLocationId = {:lid} || toLocationId = {:lid}`) and `changedAt` date bounds, sorted `-changedAt`.

**Environments and tools:** Next.js 16 App Router (Turbopack) + React 19 + Tailwind CSS v4 + PocketBase 0.40.1. Local dev via `pnpm dev` or `docker compose -f compose.yaml -f compose.dev.yaml up` (PocketBase at `127.0.0.1:8090`, app at `3000`). External/Dokploy-managed PocketBase applied out of band from versioned artifact `pocketbase/v1.collections.json` (4 collections, zero business rows). No PocketBase binary or hosting logic in this repo.

**Rituals and constraints:** request-scoped `new PocketBase(getPocketBaseUrl())` per request, `pb_auth` cookie only (`httpOnly`, `sameSite=lax`, `path=/`, `secure` in prod, `expires` from JWT `exp`), server validation via `authRefresh` before identity (fail-closed), Zod at every untrusted edge.

## Capabilities and Constraints

**Confirmed capabilities:**
- Service ticket CRUD via `getList`/`create`/`update`/`delete`; PocketBase-native 15-char ids (create omits `id`); no `crypto.randomUUID`.
- Status workflow `pending`, `ready`, `completed`, `cancelled` with allowlist enforcement and date invariants.
- Multi-location management with normalized duplicate detection (`normalizeString`: lowercase, NFD, strip combining, trim) per user; delete blocked when any service or log references the location.
- Location-movement audit (`location_logs`); ordered writes only: service update → then `location_logs` create; service delete → delete `location_logs` by `ServiceId` first, abort if any delete fails.
- Dashboard pagination envelope `{ data, total, page, limit }` (1-based `page`/`limit`, `total` is `totalItems`); LIKE search with bound `{:search}` only, never interpolated.
- History listing with tenant-bound `logListBinding`.
- Public self-registration; Chilean RUT and phone formatting; `revalidatePath` after location mutations.

**Durable technical constraints (must preserve):**
- Backend is PocketBase only. No Postgres, no second DB, no dual-write or id-mapping table, no `$id`/`DB_ID` preservation.
- Runtime locator is single `POCKETBASE_URL` (`http`/`https` absolute, Zod-validated, fail-closed, no default host). No `POCKETBASE_ADMIN_*` read by the app.
- Tenant isolation: every list binds `userId = {:uid}` and collection API rules enforce `userId = @request.auth.id` on all CRUD for `services`, `locations`, `location_logs`. Unauthenticated RSC → redirect `/login`; API → `401`.
- Cookie flags `httpOnly`/`lax`/`path=/`/`secure-in-prod` non-negotiable; value never logged.
- Address is optional, trimmed, max 200, blank omitted; `isActive` true on create and togglable.
- Schema artifact `pocketbase/v1.collections.json` is versioned and applied out of band; Next.js never applies schema or hosts PocketBase.
- No data/user/password import, no session bridge, no migration wizard, no invite-only flow.

**Explicitly undecided / not required to decide now:**
- Pricing, licensing, marketing copy, testimonials, benchmarks, or deployment SLAs.
- Visual voice beyond the incumbent `DESIGN.md` (operate-mode, workshop-bright system already documented).
- Additional analytics or SLA targets beyond the existing <2s page load with bound indexes.

## Brand Commitments

- **Name:** ServiceFlow (confirmed, from `package.json` and `app/layout.tsx` metadata).
- **Voice and assets:** no established brand voice, logo, or palette commitment beyond what `DESIGN.md` already codifies (Fira Sans + Fira Code, zinc/ink system). No invented testimonials, customers, prices, or case studies.
- **Identity constraint:** workshop-bright, compact, operational — the product is a tool, not a marketing site. Future work must preserve that restraint.

## Evidence on Hand

- **Product intent:** `PRD.md`, `ARCHITECTURE.md`, `docs/CODEBASE-GUIDE.md` — all aligned on PocketBase-only lifecycle.
- **Schema artifact:** `pocketbase/v1.collections.json` — collections `users`, `services`, `locations`, `location_logs` with indexes and tenant rules; canonical source.
- **Implementation:** `app/(app)/dashboard`, `app/(app)/locations`, `app/(app)/service-events`, `app/api/services/**`, `lib/pocketbase.ts`, `lib/pocketbase-filter.ts`, `lib/schemas.ts`, `lib/storage.ts`.
- **Visual truth:** `DESIGN.md` (Taller Claro Operacional) — zinc neutrals + desaturated ink `#2F5B8A`, density 6, 8–12px radii, Boneyard skeletons. Incumbent system to preserve for refinement or replace explicitly if rebranded.
- **Verification:** `tests/**` (Vitest, mocked PocketBase, two-tenant tests), `e2e/**` (Playwright), `boneyard.config.json` + `src/bones/**`.
- **Absences that must not be fabricated:** no real customer data, no testimonials, no pricing, no production PocketBase instance in this repo. Empty-list returns `{ data: [], total: 0, page, limit }` — do not invent seed rows.

## Product Principles

1. **Tenant isolation is non-negotiable.** Every read/write proves `userId = @request.auth.id` at both app and rule layers; a second user sees nothing.
2. **Operate before adorn.** Speed, scanability, and predictable density beat decoration; familiarity across repetitions is a feature.
3. **One backend, ordered writes.** PocketBase is the only truth; without transactions, updates precede logs and deletes clean logs first — no silent fallback or retry on 403 batch.
4. **Validate at the edge, fail closed.** Zod before any write, `authRefresh` before identity, unreachable PocketBase → generic error, never anonymous success.
5. **Preserve the audit trail.** Every location move is a log entry with actor and timestamp; history is the proof managers rely on.

## Accessibility & Inclusion

No product-specific accessibility standard beyond the incumbent system has been established. The durable baseline from `DESIGN.md` and `app/layout.tsx` is: zoom allowed (`viewport maximumScale >= 5, userScalable: true`), WCAG AA contrast (AAA for primary and badge pairs, verified 6.3–17.7:1), visible 2px focus ring in `#2F5B8A`, 44px minimum hit targets, `prefers-reduced-motion` and `prefers-reduced-transparency` honored, dialogs with `role="dialog"` + focus trap + `Esc` to close. Future surfaces must meet at least AA and preserve these contracts.

