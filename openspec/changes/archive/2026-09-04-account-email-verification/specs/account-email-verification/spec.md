# Account Email Verification Specification

## Purpose

Require verified accounts before operational authentication.

## Requirements

### Requirement: Verified-Only Operational Authentication

Usable tokens and sessions MUST be issued only to verified accounts for every enabled operational method. The application guard MUST reject existing, forged, or stale unverified credentials. Unverified accounts MUST NOT be grandfathered.

#### Scenario: Verified login succeeds

- GIVEN a verified account with valid credentials
- WHEN the user signs in
- THEN a usable session MUST be issued

#### Scenario: Unverified auth and stale tokens denied

- GIVEN an unverified account or a forged or stale unverified token
- WHEN authentication or the application guard runs
- THEN operational access MUST be denied

### Requirement: Registration Without Session

Registration MUST create an unverified account, request verification, MUST NOT authenticate or set an auth cookie, and MUST redirect to login. Login MUST show a visible callout that email was sent and verification is required before sign-in.

#### Scenario: Register redirects with callout

- GIVEN valid new-account details
- WHEN registration succeeds
- THEN an unverified account exists, no auth cookie is set, and login shows the verification callout

#### Scenario: Router navigation preserved

- GIVEN in-scope login or register form navigation
- WHEN the form navigates
- THEN existing router push and refresh MUST remain

### Requirement: Neutral Request, Resend, and Unverified Login

Request and resend MUST be enumeration-neutral for unknown, unverified, and already-verified addresses. Unverified login MUST fail without a session and MUST offer only that same guidance.

#### Scenario: Neutral resend

- GIVEN an unknown or already-verified email
- WHEN request or resend is submitted
- THEN the outcome MUST match a successful unverified resend without revealing existence, state, or delivery

#### Scenario: Unverified login fails safely

- GIVEN an unverified account with valid credentials
- WHEN the user signs in
- THEN sign-in MUST fail without a session and resend guidance MUST stay enumeration-neutral

### Requirement: Verification Callback Token Handling

The callback MUST accept the provider token, confirm once or idempotently if already verified, MUST NOT expose or log the token, and MUST remove it from the browser URL.

#### Scenario: Valid or already-verified token

- GIVEN a valid unused token or a token for an already-verified account
- WHEN the callback runs
- THEN confirmation MUST succeed and the token MUST NOT appear in logs or the post-outcome URL

#### Scenario: Invalid token fails closed

- GIVEN a missing, expired, or forged token
- WHEN the callback runs
- THEN confirmation MUST fail and the token MUST NOT be logged or left in the URL

### Requirement: Env-Backed Mail Settings

SMTP settings MUST be env-backed and MUST fail closed when mandatory config is absent. Secrets MUST NOT be persisted or exposed. Sender MUST be ServiceFlow <no-reply@serviceflow.jonasotoaguilar.space>. Links MUST use https://serviceflow.jonasotoaguilar.space. Resend DNS MUST be runtime provider inputs, not hardcoded.

#### Scenario: Missing mandatory SMTP

- GIVEN required SMTP values are absent
- WHEN settings apply or mail send is attempted
- THEN the operation MUST fail closed without exposing secrets

#### Scenario: Sender, origin, and DNS

- GIVEN mandatory mail configuration is present
- WHEN verification mail is composed or DNS is presented
- THEN sender and origin MUST match the confirmed values and DNS MUST be runtime provider inputs

### Requirement: Tests and Docs Without Release

Default tests MUST pass without real SMTP except one explicit staging deliverability check. Stale README and release-facing docs MUST be updated.

#### Scenario: Default suite without SMTP

- GIVEN the default test suite
- WHEN it runs
- THEN it MUST pass without a live SMTP provider

#### Scenario: Staging check and docs

- GIVEN staging mail config and stale README or release-facing docs
- WHEN the explicit deliverability check runs
- THEN one verification test email is sent, docs are updated, and no version bump, tag, or publication occurs
