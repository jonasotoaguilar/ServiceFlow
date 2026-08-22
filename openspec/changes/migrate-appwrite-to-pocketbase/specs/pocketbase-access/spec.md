# PocketBase Access Specification

## Purpose

Define how ServiceFlow connects to PocketBase at runtime: environment URL validation, per-request client construction, `pb_auth` session hydration, cookie security, and the absence of admin credentials. Schema contents live in `pocketbase-schema`. Login, registration, logout, and `getAuthUser` product behavior live in `auth-session`.

## Requirements

### Requirement: Validated PocketBase URL

The system MUST obtain the PocketBase base URL only from the `POCKETBASE_URL` environment variable. The value MUST be a non-empty absolute `http` or `https` URL. The system MUST fail closed when `POCKETBASE_URL` is missing, empty, or not a valid absolute URL. The system MUST NOT read Appwrite environment variables to locate PocketBase. The system MUST NOT require or accept PocketBase admin email, admin password, or admin token environment variables at runtime.

#### Scenario: Valid URL enables a client

- GIVEN `POCKETBASE_URL` is set to a valid absolute URL such as `http://127.0.0.1:8090`
- WHEN the server constructs a PocketBase client
- THEN the client MUST target that URL and MUST NOT use any other backend locator

#### Scenario: Missing URL fails closed

- GIVEN `POCKETBASE_URL` is unset or empty
- WHEN any request would construct a PocketBase client
- THEN the system MUST NOT contact a default host
- AND the operation MUST fail without treating the caller as authenticated

#### Scenario: Invalid URL fails closed

- GIVEN `POCKETBASE_URL` is not a valid absolute `http` or `https` URL
- WHEN any request would construct a PocketBase client
- THEN the system MUST reject the configuration
- AND the operation MUST fail closed

#### Scenario: No runtime admin credentials

- GIVEN the application runtime environment
- WHEN the PocketBase access path is initialized
- THEN it MUST authenticate only with a user session from `pb_auth` when present
- AND it MUST NOT log in as a PocketBase admin
- AND it MUST NOT read admin credential environment variables

### Requirement: Per-request client and authStore hydration

Each incoming server request that talks to PocketBase MUST use a request-scoped client. That client MUST hydrate its `authStore` only from the `pb_auth` cookie when the cookie is present and well-formed. The system MUST NOT reuse a mutable `authStore` across concurrent requests. The system MUST NOT treat a PocketBase token from query strings, request bodies, or non-`pb_auth` cookies as the session.

#### Scenario: Authenticated request hydrates from pb_auth

- GIVEN a request includes a well-formed `pb_auth` cookie for a valid PocketBase user token
- WHEN the server builds the PocketBase client for that request
- THEN the client's `authStore` MUST represent that user for the duration of the request
- AND later requests MUST NOT inherit that `authStore` unless they also present `pb_auth`

#### Scenario: Missing pb_auth yields an unauthenticated client

- GIVEN a request has no `pb_auth` cookie
- WHEN the server builds the PocketBase client
- THEN the client MUST be unauthenticated
- AND the request MUST NOT gain a user identity from any other cookie

#### Scenario: Malformed pb_auth is ignored for identity

- GIVEN a request includes a `pb_auth` cookie that cannot be loaded as a PocketBase auth store
- WHEN the server hydrates the client
- THEN the client MUST remain unauthenticated
- AND the system MUST NOT throw an identity that another user could inherit

### Requirement: Server validation before returning identity

`authStore.isValid` (expiry-only) is insufficient to trust identity. Before returning user identity from `pb_auth`, the system MUST validate the token/record against the PocketBase server (canonical `authRefresh` or equivalent). A forged cookie with future `exp` or tampered record (e.g., victim `id`) or invalid signature MUST yield unauthenticated (`null`/401) and MUST NOT run any Appwrite admin query. Server failure or unreachable PocketBase MUST fail closed (unauthenticated, generic error, no identity).

#### Scenario: Forged cookie is rejected

- GIVEN a `pb_auth` cookie with future `exp` but forged payload/tampered `id` or invalid signature
- WHEN the server validates via `authRefresh` (or equivalent)
- THEN the request MUST be unauthenticated and MUST NOT return the forged identity

#### Scenario: Server validation failure fails closed

- GIVEN `authRefresh` (or equivalent) fails or PocketBase is unreachable
- WHEN identity is resolved
- THEN the request MUST be unauthenticated and MUST NOT fall back to raw cookie or Appwrite admin lookup

### Requirement: pb_auth cookie security

When the system writes a session cookie after a successful PocketBase authentication, the cookie name MUST be `pb_auth`. The cookie MUST be `httpOnly`, MUST use `sameSite=lax`, MUST set `path=/`, and MUST set `secure` when the process is running in production. The cookie lifetime MUST NOT exceed the PocketBase auth token expiry. The cookie value MUST NOT be written to application logs.

#### Scenario: Production cookie flags

- GIVEN the process is running in production
- WHEN a session cookie is written
- THEN the cookie MUST be named `pb_auth`
- AND it MUST be `httpOnly`
- AND it MUST be `secure`
- AND it MUST use `sameSite=lax`
- AND it MUST use `path=/`

#### Scenario: Non-production cookie flags

- GIVEN the process is not running in production
- WHEN a session cookie is written
- THEN the cookie MUST still be named `pb_auth`
- AND it MUST be `httpOnly`
- AND it MUST use `sameSite=lax`
- AND it MUST use `path=/`
- AND `secure` MAY be omitted so local HTTP development can store the cookie

### Requirement: Legacy session cookie ignored and cleared

The system MUST ignore the legacy Appwrite cookie named `session` for authentication. When an incoming request includes a `session` cookie, the response MUST clear that cookie. The system MUST NOT dual-read `session` and `pb_auth`, MUST NOT copy `session` into `pb_auth`, and MUST NOT accept `session` as a PocketBase token.

#### Scenario: Legacy cookie cannot authenticate

- GIVEN a request includes a `session` cookie and no `pb_auth` cookie
- WHEN the server resolves the PocketBase identity
- THEN the request MUST be unauthenticated
- AND the response MUST instruct the client to delete the `session` cookie

#### Scenario: Legacy cookie cleared beside a valid pb_auth

- GIVEN a request includes both a `session` cookie and a valid `pb_auth` cookie
- WHEN the server resolves the PocketBase identity
- THEN identity MUST come only from `pb_auth`
- AND the response MUST still instruct the client to delete the `session` cookie

### Requirement: Unreachable PocketBase fails closed

When PocketBase is unreachable or returns an unexpected transport failure while establishing access, the system MUST fail closed. The failure MUST NOT be treated as a successful anonymous session, and MUST NOT leak internal connection details to the client.

#### Scenario: Backend unavailable

- GIVEN `POCKETBASE_URL` is valid
- AND the PocketBase instance cannot be reached
- WHEN a request requires PocketBase access
- THEN the caller MUST NOT be treated as authenticated
- AND the client-visible error MUST NOT include internal host diagnostics
