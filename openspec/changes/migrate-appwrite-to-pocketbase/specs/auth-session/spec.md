# Auth Session Specification

## Purpose

Define public register, login, logout, and `getAuthUser` behavior against PocketBase `users`, including fresh-account-only cutover, the temporary empty-start notice, auth gating, and deterministic error semantics. Cookie flags, `pb_auth` hydration, and legacy `session` clearing are owned by `pocketbase-access`. The `users` collection and its API rules are owned by `pocketbase-schema`.

## Requirements

### Requirement: Public self-registration

The system MUST allow unauthenticated visitors to register with `name`, `email`, and `password` against PocketBase `users`. Registration MUST remain public: no invite, approval queue, or admin-created account MUST be required. Input MUST be validated at the server boundary before PocketBase is called. `name` MUST have at least 2 characters, `email` MUST be a valid email, and `password` MUST have at least 8 characters. On success the system MUST create the PocketBase user, establish a `pb_auth` session as specified by `pocketbase-access`, and MUST NOT require a separate first login.

#### Scenario: Valid registration creates a session

- GIVEN a visitor submits a valid name, unused email, and password of at least 8 characters
- WHEN registration is processed
- THEN a new PocketBase `users` record MUST exist
- AND a `pb_auth` cookie MUST be written
- AND the caller MUST receive a success result

#### Scenario: Invalid registration input is rejected

- GIVEN a visitor submits a name shorter than 2 characters, an invalid email, or a password shorter than 8 characters
- WHEN registration is processed
- THEN no PocketBase user MUST be created
- AND no `pb_auth` cookie MUST be written
- AND the caller MUST receive a validation error, not a generic success

#### Scenario: Duplicate email is rejected

- GIVEN a PocketBase user already exists for the submitted email
- WHEN another visitor registers with that email
- THEN no second user MUST be created
- AND the caller MUST receive a deterministic registration-failure result
- AND the result MUST NOT include PocketBase internals

### Requirement: Fresh accounts only

Users MUST register new PocketBase accounts. The system MUST NOT import Appwrite accounts, MUST NOT accept Appwrite passwords, MUST NOT offer a password-reset migration, and MUST NOT sign in an Appwrite identity.

#### Scenario: Prior Appwrite credentials do not authenticate

- GIVEN an email and password that existed only on Appwrite
- AND no PocketBase `users` record exists for that email
- WHEN login is attempted
- THEN authentication MUST fail with the invalid-credentials result
- AND no Appwrite session MUST be created

### Requirement: Login

The system MUST authenticate email and password against PocketBase `users`. Input MUST be validated at the server boundary: `email` MUST be a valid email and `password` MUST be non-empty. On success the system MUST write a `pb_auth` cookie as specified by `pocketbase-access`. On credential failure the system MUST return the same invalid-credentials result regardless of whether the email exists. Login MUST NOT leak whether the email is registered.

#### Scenario: Valid credentials create a session

- GIVEN a registered PocketBase user
- WHEN that user submits the correct email and password
- THEN a `pb_auth` cookie MUST be written
- AND the caller MUST receive a success result

#### Scenario: Wrong password is a generic failure

- GIVEN a registered PocketBase user
- WHEN that user submits the correct email and an incorrect password
- THEN no authenticated session MUST be established
- AND the caller MUST receive the invalid-credentials result

#### Scenario: Unknown email is the same generic failure

- GIVEN no PocketBase user exists for the submitted email
- WHEN login is attempted with a non-empty password
- THEN the caller MUST receive the same invalid-credentials result used for a wrong password

#### Scenario: Invalid login input is rejected before PocketBase

- GIVEN the submitted email is not a valid email or the password is empty
- WHEN login is processed
- THEN PocketBase authentication MUST NOT be attempted
- AND the caller MUST receive a validation error

### Requirement: Logout

Logout MUST clear the `pb_auth` cookie and MUST redirect the user to `/login`. Logout MUST also clear a leftover `session` cookie when present. After logout, `getAuthUser` MUST return unauthenticated.

#### Scenario: Authenticated user logs out

- GIVEN a request with a valid `pb_auth` cookie
- WHEN logout is invoked
- THEN the `pb_auth` cookie MUST be deleted
- AND the user MUST be redirected to `/login`

#### Scenario: Logout clears leftover session cookie

- GIVEN a request that still has a `session` cookie
- WHEN logout is invoked
- THEN the `session` cookie MUST be deleted
- AND the user MUST be redirected to `/login`

### Requirement: getAuthUser

`getAuthUser` MUST resolve the current user only through the request-scoped PocketBase client defined by `pocketbase-access`. When `pb_auth` represents a valid PocketBase user, it MUST return `{ id, email, name }` using the PocketBase user id. When no valid session exists, it MUST return `null` and MUST NOT throw to callers. A leftover `session` cookie MUST NOT make `getAuthUser` return a user.

#### Scenario: Valid session returns the PocketBase user

- GIVEN a valid `pb_auth` cookie for a PocketBase user
- WHEN `getAuthUser` runs
- THEN it MUST return that user's PocketBase `id`, email, and name

#### Scenario: Missing session returns null

- GIVEN no `pb_auth` cookie
- WHEN `getAuthUser` runs
- THEN it MUST return `null`

#### Scenario: Legacy session is not a user

- GIVEN only a `session` cookie is present
- WHEN `getAuthUser` runs
- THEN it MUST return `null`

### Requirement: Unauthenticated gates

Unauthenticated access to `/dashboard`, `/locations`, and `/locationLogs` MUST redirect to `/login`. Unauthenticated HTTP access to `/api/services` MUST return status `401` with `{ error: "Unauthorized" }`. Unauthenticated location and history mutations MUST fail without writing data.

#### Scenario: Protected page redirects

- GIVEN no valid `pb_auth` session
- WHEN `/dashboard`, `/locations`, or `/locationLogs` is requested
- THEN the response MUST redirect to `/login`

#### Scenario: Protected services API returns 401

- GIVEN no valid `pb_auth` session
- WHEN `GET`, `POST`, `PUT`, or `DELETE` `/api/services` is requested
- THEN the response status MUST be `401`
- AND the body MUST be `{ error: "Unauthorized" }`

### Requirement: Temporary empty-start notice

Login, registration, or the first authenticated session MUST show a temporary notice that the PocketBase environment starts empty and that previous Appwrite tickets and locations will not appear. The notice MUST NOT offer import, password migration, or data recovery. The notice is temporary communication and MUST NOT be specified as a permanent product surface.

#### Scenario: Returning user is told the store is empty

- GIVEN a user registers or logs in to the new PocketBase environment
- WHEN the login, registration, or first-session view is rendered
- THEN the user MUST see a notice that previous Appwrite tickets and locations will not appear

#### Scenario: Notice does not start a migration

- GIVEN the empty-start notice is visible
- WHEN the user reads the available actions
- THEN there MUST be no import, reset, or restore action attached to the notice

### Requirement: Deterministic auth errors

Auth actions MUST use one result shape for callers: success or an `error` string. Validation failures MUST be distinguishable from credential failures. Server or PocketBase transport failures MUST return a generic failure string and MUST NOT include stack traces, filter strings, admin details, or raw PocketBase exception text.

#### Scenario: Credential error text is stable

- GIVEN any failed login caused by unknown email or wrong password
- WHEN the action returns
- THEN the `error` string MUST be the same invalid-credentials message

#### Scenario: Internal failures are not leaked

- GIVEN PocketBase returns an unexpected error during login or registration
- WHEN the action returns
- THEN the caller MUST receive a generic error string
- AND the string MUST NOT contain PocketBase exception text
