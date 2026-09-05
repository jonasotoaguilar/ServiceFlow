# ADR-0001: Verified-only PocketBase authRule

## Status

Proposed

## Date

2026-09-04

## Context

ServiceFlow issues `pb_auth` after `users.authWithPassword` with no email check. Every operational account must be verified before a usable token exists. PocketBase v0.40.1 has no `onlyVerified` option. The durable question is where verification is enforced so later auth methods cannot bypass it.

## Decision

Set `users.authRule` to `"verified = true"` on PocketBase v0.40.1. That expression runs after record authentication and before the auth-token response, covering every token-issuing method. The Next.js `getAuthUser` / layout guard additionally rejects `verified !== true` as defense in depth, not as the authority.

Changing `authRule` rotates the collection auth-token secret. That invalidation is accepted; there are no production users to grandfather.

## Alternatives Considered

### App-layer gating only

- Why it was credible: `getAuthUser` already fail-closes on `authRefresh`; no schema change.
- Why it was not selected: PocketBase would still issue tokens to unverified records. Any client or future method could use them.

### Custom Next.js verification tokens

- Why it was credible: full control of mail and confirm.
- Why it was not selected: duplicates PocketBase verification, needs superuser writes from the app, and is a second token authority.

## Consequences

- Enables: one choke point for password auth now and OTP/OAuth2 later without per-method gates.
- Costs or constrains: later auth work must keep `authRule: "verified = true"`; register must not call `authWithPassword` / `saveAuthCookie`; local sessions rotate when the rule is applied.
- Follow-up: persist the rule in `pocketbase/v1.collections.json` and live-assert after import (merge is unsupported).

## Revisit When

Installed PocketBase leaves the v0.40.1 line, or a new first-party verified-only option replaces `authRule`.
