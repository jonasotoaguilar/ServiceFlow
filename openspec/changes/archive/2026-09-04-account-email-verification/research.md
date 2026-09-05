# Research: account-email-verification

```yaml
schema: gentle-ai.sdd-research/v1
revision: 2
change: account-email-verification
outcome: done
rerun_of: 1
rerun_reason: gatekeeper_retry_version_authority_v0401
selected_questions:
  - id: Q1
    question: "PocketBase 0.40 auth collection: exact server-side rule/setting that blocks every auth method for `verified = false`, including password auth, and whether `authRule: \"verified = true\"` is the supported expression."
    status: supported
    reason: v0401_authRule_verified_true_established_onlyVerified_absent
  - id: Q2
    question: "PocketBase JS SDK and REST methods/signatures for `requestVerification` and `confirmVerification`, their error/response behavior relevant to a Next.js server action/page."
    status: supported
    reason: v0401_sdk_source_bodies_paths_codes_established
  - id: Q3
    question: "PocketBase verification email template placeholders and exact action URL construction for a frontend callback carrying the token."
    status: supported
    reason: v0401_placeholder_constants_and_default_template_action_url_established
  - id: Q4
    question: "PocketBase settings API/schema for SMTP, sender identity, TLS/auth, verification templates, and whether a superuser can automate these settings safely; identify exact fields and update semantics."
    status: supported
    reason: v0401_settings_routes_fields_redaction_established_always_set_env_path
  - id: Q5
    question: "Resend SMTP official host, ports/TLS mode, username convention, API-key password usage, sender-domain verification requirements, and DNS records/constraints for `serviceflow.jonasotoaguilar.space`."
    status: supported
    reason: smtp_core_and_per_domain_retrieval_contract_established_no_static_values
  - id: Q6
    question: "Security guidance for neutral resend responses, token handling, no-session-before-verification, and a test strategy that does not require real SMTP except one explicit staging deliverability check."
    status: supported
    reason: v0401_neutral_204_sourced_offline_negative_closed_by_product_requirement
admission:
  requested:
    documentation:
      granted: true
      provider: context7_and_ctx_fetch
      source_ids: [P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-11, P-12, P-13, P-14, P-15, P-16, P-17, P-18, P-19, P-20]
    open_web:
      granted: true
      provider: ctx_fetch_and_index
      source_ids: [P-04, P-12, P-13, P-14, P-17, P-18]
  observed:
    documentation:
      granted: true
      provider: context7_and_ctx_fetch
      source_ids: [P-01, P-02, P-03, P-04, P-05, P-06, P-07, P-08, P-09, P-10, P-11, P-12, P-13, P-14, P-15, P-16, P-17, P-18, P-19, P-20]
    open_web:
      granted: true
      provider: ctx_fetch_and_index
      source_ids: [P-04, P-12, P-13, P-14, P-17, P-18]
  capability_declaration: "gentle-ai.sdd-research-capability/v1"
  denial: null
  partial_evidence: false
  inferred_capability: false
```

## 1. Retained Selected Intent (pre-source-access, canonical)

Selected research for change `account-email-verification` (artifact store `openspec`, execution mode `auto`).
Revision 1 intent is preserved verbatim: exploration artifact
`openspec/changes/account-email-verification/exploration.md` (password auth against PocketBase
`users` collection via Next.js Server Actions, register auto-logs-in today, no verification step,
minimal collection artifact with public create and no verification/mail settings, no SMTP env
anywhere, SDK exposes `requestVerification`/`confirmVerification`, no verify callback route exists).

**Canonical desired content retained before any source access:** official PocketBase and Resend
documentation evidence sufficient to specify (a) the server-side enforcement that denies sessions
to unverified users across all auth methods, (b) exact SDK/REST verification calls and their
errors for server actions/pages, (c) template placeholders and callback URL construction,
(d) settings API fields and safe superuser automation, (e) Resend SMTP parameters and
domain/DNS requirements for the stated sender domain and app origin, (f) neutral-response,
token-handling, and no-real-SMTP test guidance. Only official PocketBase and Resend documentation
admitted; anything not established is marked `not found`, never inferred.

This revision 2 is the single automatic gatekeeper retry. It preserves the original selected
intent, all validated revision 1 evidence, the confirmed product decisions, and the canonical
desired content, and corrects version authority to the installed server line `v0.40.1`.

Product decisions are orchestrator-owned and kept separate per Hard Rule (see section 7). No
product code was inspected, no implementation performed, no commits, pushes, PRs, or releases.

## 2. Admission Verification (exact grants)

Runtime capability declaration received: `gentle-ai.sdd-research-capability/v1` with
`documentation=[context7_resolve-library-id, context7_query-docs, ctx_fetch_and_index, ctx_search]`
and `open-web=[ctx_fetch_and_index, ctx_search]`.

- Verification: exact grants match requested classes. `documentation` exercised via
  `context7_resolve-library-id` (PocketBase, Resend), `context7_query-docs`
  (`/pocketbase/js-sdk`, `/pocketbase/pocketbase`, `/websites/resend`), `ctx_fetch_and_index`,
  and `ctx_search`. `open-web` exercised via `ctx_fetch_and_index` and `ctx_search` only.
- No capability inferred from Bash, persistence, filenames, or inherited tools. No
  product-runtime tools used. `ctx_batch_execute` was suggested by a search throttle notice but
  is outside the declared grants and was NOT used.
- Observed grants equal requested grants. No denial. Outcome is `done`: every selected question
  is supported by admitted sources; platform absences are closed as source-backed negative
  results with the implementation obligation carried explicitly (see V-15, section 5).

## 3. Sources (all version-pinned; v0.40.1 tag unless stated)

| id | class | title | publisher | URL | accessed_at | authority |
|---|---|---|---|---|---|---|
| P-01 | documentation | PocketBase v0.40.1 source — `core/collection_model_auth_options.go` (authRule, auth options, defaults) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/core/collection_model_auth_options.go | 2026-09-04 | first-party source, installed line |
| P-02 | documentation | PocketBase v0.40.1 source — `core/collection_model_auth_templates.go` (placeholder constants, default templates) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/core/collection_model_auth_templates.go | 2026-09-04 | first-party source, installed line |
| P-03 | documentation | PocketBase v0.40.1 source — `core/collection_model.go` (auth-rule change rotates auth token secret) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/core/collection_model.go | 2026-09-04 | first-party source, installed line |
| P-04 | open-web | PocketBase v0.40.1 source — `mails/record.go` (template resolution, default placeholders, sender) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/mails/record.go | 2026-09-04 | first-party source, installed line |
| P-05 | documentation | PocketBase v0.40.1 source — `apis/record_auth_verification_request.go` (request handler, neutral 204s) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/apis/record_auth_verification_request.go | 2026-09-04 | first-party source, installed line |
| P-06 | documentation | PocketBase v0.40.1 source — `apis/record_auth_verification_confirm.go` (confirm handler, token error) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/apis/record_auth_verification_confirm.go | 2026-09-04 | first-party source, installed line |
| P-07 | documentation | PocketBase v0.40.1 source — `apis/record_auth_verification_request_test.go` (paths, bodies, status codes) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/apis/record_auth_verification_request_test.go | 2026-09-04 | first-party source, installed line |
| P-08 | documentation | PocketBase v0.40.1 source — `apis/record_auth_verification_confirm_test.go` (token bodies, 204s, OAuth2-link clearing) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/apis/record_auth_verification_confirm_test.go | 2026-09-04 | first-party source, installed line |
| P-09 | documentation | PocketBase v0.40.1 source — `apis/record_auth_with_password.go` + `apis/record_auth_otp_request.go` (auth entry points) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/apis/record_auth_with_password.go | 2026-09-04 | first-party source, installed line |
| P-10 | documentation | PocketBase v0.40.1 source — `apis/settings.go` (settings routes, superuser-only, clone-on-update) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/apis/settings.go | 2026-09-04 | first-party source, installed line |
| P-11 | documentation | PocketBase v0.40.1 source — `core/settings_model.go` (SMTP hidePassword, sensitive-field masking) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/core/settings_model.go | 2026-09-04 | first-party source, installed line |
| P-12 | documentation | PocketBase docs — API Settings (endpoints, smtp/meta fields, redaction, test-email) | PocketBase | https://pocketbase.io/docs/api-settings/ | 2026-09-04 | first-party docs (current; field-level facts cross-checked with P-10/P-11) |
| P-13 | documentation | PocketBase docs — Authentication (stateless tokens, authRefresh check) | PocketBase | https://pocketbase.io/docs/authentication/ | 2026-09-04 | first-party docs (current) |
| P-14 | documentation | PocketBase docs — Collections (auth system fields incl. `verified`) | PocketBase | https://pocketbase.io/docs/collections/ | 2026-09-04 | first-party docs (current; `verified` usage cross-checked with P-05) |
| P-15 | documentation | PocketBase JS SDK v0.26.2 source — `RecordService.ts` (request/confirmVerification bodies) | PocketBase | https://raw.githubusercontent.com/pocketbase/js-sdk/v0.26.2/src/services/RecordService.ts | 2026-09-04 | first-party SDK source |
| P-16 | documentation | PocketBase JS SDK docs — RecordService signatures, `ClientResponseError` handling (via Context7) | PocketBase (via Context7) | https://github.com/pocketbase/js-sdk/blob/master/_autodocs/api-reference/RecordService.md | 2026-09-04 | first-party SDK docs |
| P-17 | documentation | Resend docs — SMTP transport (host, ports, username, API-key password, TLS modes) | Resend | https://resend.com/docs/send-with-smtp | 2026-09-04 | first-party docs |
| P-18 | documentation | Resend docs — domain claim/create API (per-domain DNS records), dashboard domain docs | Resend | https://resend.com/docs/add-a-domain | 2026-09-04 | first-party docs |
| P-19 | documentation | PocketBase v0.40.1 CHANGELOG (tag pinning evidence) | PocketBase | https://raw.githubusercontent.com/pocketbase/pocketbase/v0.40.1/CHANGELOG.md | 2026-09-04 | first-party changelog, installed line |
| P-20 | documentation | PocketBase source — OTP request handler enumeration guard (master; analogy only) | PocketBase (via Context7) | https://github.com/pocketbase/pocketbase/blob/master/apis/record_auth_otp_request.go | 2026-09-04 | first-party source (master; used only as analogy, not for v0.40 behavior) |

Version-authority note: every server-behavior claim below cites a `v0.40.1`-tagged source
(P-01–P-11, P-15, P-19). No v0.40 behavior is asserted solely from `master`. Resend docs and
pocketbase.io docs are versionless currents; field-level facts from them are cross-checked
against v0.40.1 source where they touch server behavior.

## 4. Validated Claims (each maps to source IDs)

| claim_id | claim | source_ids | excerpt_refs |
|---|---|---|---|
| V-01 | v0.40.1 has NO `onlyVerified`/`OnlyVerified` auth-collection option. Full-text search over all indexed v0.40.1 sources returns no such symbol; the v0.20.0 `onlyVerified` changelog entry is historical only. The v0.40.1 mechanism is `authRule`. | [P-01], [P-19] | negative result: `OnlyVerified` queries across all v0.40.1-indexed files return no results; P-01 defines the auth gate as `AuthRule` (see V-02) |
| V-02 | v0.40.1 auth collections expose `AuthRule *string` (`form:"authRule" json:"authRule"`). The field doc states it is applied after record authentication and right before returning the auth token response; the documented verified-only expression is `"verified = true"`; empty string allows any record; `nil` disallows authentication altogether, explicitly including password and OAuth2. | [P-01] | P-01 excerpts: "`AuthRule could be used to specify additional record constraints applied after record authentication and right before returning the auth token response to the client.`" / "`For example, to allow only verified users you could set it to \"verified = true\".`" / "`Set it to nil to disallow authentication altogether for the collection (that includes password, OAuth2, etc.).`" / "`AuthRule *string \`form:\"authRule\" json:\"authRule\"\``" |
| V-03 | The gate is a single choke point: `AuthRule` is evaluated after authentication, before the auth-token response is returned, so one rule covers every token-issuing auth path (password, OAuth2, OTP) without per-method configuration. | [P-01] | P-01 excerpt: "`applied after record authentication and right before returning the auth token response to the client`" |
| V-04 | In collection export JSON the rule is represented as the `authRule` key of the auth-collection options (`form`/`json` tags `authRule`); a `nil`/missing rule denies all auth, an empty string allows all. Collection-import merge semantics for auth options remain a live apply-time check, not a sourced claim. | [P-01] | P-01 excerpt: struct tags `form:"authRule" json:"authRule"`; doc lines for empty-string vs nil semantics (V-02) |
| V-05 | Changing `AuthRule` invalidates previously issued auth tokens: on auth-rule change the collection auth-token secret is rotated to a new random string. | [P-03] | P-03 excerpt: "`// invalidate previously issued auth tokens on auth rule change`" / "`e.Collection.AuthToken.Secret = security.RandomString(50)`" |
| V-06 | New auth collections default to `AuthRule` empty-string (authentication allowed), with token durations: auth 432000s (5d), password-reset 1800s, email-change 1800s, verification 86400s (1 day), file 180s. Proposal must therefore set `authRule: "verified = true"` explicitly; the default does NOT enforce verification. | [P-01] | P-01 excerpt: "`AuthRule: types.Pointer(\"\"),`" with `VerificationToken: TokenConfig{ Secret: ..., Duration: 86400, // 1day }` in `setDefaultAuthOptions` |
| V-07 | Exact v0.40.1 verification placeholder constants: `{APP_NAME}`, `{APP_URL}`, `{TOKEN}`, `{OTP}`, `{OTP_ID}`, `{ALERT_INFO}`. | [P-02] | P-02 excerpt: "`EmailPlaceholderAppName string = \"{APP_NAME}\"` / `EmailPlaceholderAppURL string = \"{APP_URL}\"` / `EmailPlaceholderToken string = \"{TOKEN}\"` / `EmailPlaceholderOTP string = \"{OTP}\"` / `EmailPlaceholderOTPId string = \"{OTP_ID}\"` / `EmailPlaceholderAlertInfo string = \"{ALERT_INFO}\"`" |
| V-08 | v0.40.1 default verification template: subject `Verify your {APP_NAME} email`; body greets, thanks at `{APP_NAME}`, and renders a Verify button whose default action URL is `{APP_URL}/_/#/auth/confirm-verification/{TOKEN}`. A custom frontend callback (e.g. `/verify?token=…` at the app origin, per product decision) replaces this default URL in the collection template; the default is NOT asserted as the product callback. | [P-02] | P-02 excerpt: "`Subject: \"Verify your \" + EmailPlaceholderAppName + \" email\"`" / body `href="` + EmailPlaceholderAppURL + "/_/#/auth/confirm-verification/" + EmailPlaceholderToken + `"` |
| V-09 | Verification mail is rendered from the collection's `VerificationTemplate` with only the token passed explicitly; `{APP_NAME}`/`{APP_URL}` are registered as default system placeholders from settings meta, and the sender comes from settings meta (`SenderName`, `SenderAddress`). | [P-04] | P-04 excerpts: "`resolveEmailTemplate(app, authRecord, authRecord.Collection().VerificationTemplate, map[string]any{ core.EmailPlaceholderToken: token, })`" / "`// register default system placeholders`" with `placeholders[core.EmailPlaceholderAppName] = app.Settings().Meta.AppName` and `placeholders[core.EmailPlaceholderAppURL] = app.Settings().Meta.AppURL` |
| V-10 | REST request-verification: `POST /api/collections/{collection}/request-verification` with JSON body `{"email": "…"}`. Empty body → 400 with `email: validation_required`; malformed JSON → 400. Unknown email → eager `204 No Content` (no mail sent) as enumeration protection. A repeat request while a resend key exists for an unverified record → eager `204` with a throttling error logged server-side. Mail is dispatched in the background (`FireAndForget`); the client never sees the send result. | [P-05], [P-07] | P-05 excerpts: "`record, err := e.App.FindAuthRecordByEmail(collection, form.Email)`" → "`// eagerly write 204 response as a very basic measure against emails enumeration`" + "`e.NoContent(http.StatusNoContent)`" / "`if !record.Verified() && e.App.Store().Has(resendKey)`" → "`e.NoContent(http.StatusNoContent)`" + "`try again later`" / "`// run in background because we don't need to show the result to the client`" + "`routine.FireAndForget`". P-07 excerpts: empty data → 400 `"email":{"code":"validation_required","message":"Cannot be blank."}`; `{"email":"missing@example.com"}` → 204 with zero mails sent |
| V-11 | REST confirm-verification: `POST /api/collections/{collection}/confirm-verification` with JSON body `{"token": "…"}`. Invalid/expired token → 400 `Invalid or expired verification token.` Success (including already-verified records and records from collections without login) → `204`, record marked verified, pre-existing OAuth2 links cleared. | [P-06], [P-08] | P-06 excerpt: "`FindAuthRecordByToken(form.Token, core.TokenTypeVerification)`" → "`e.BadRequestError(\"Invalid or expired verification token.\", err)`". P-08 excerpts: valid token → 204; valid token (already verified) → 204; token from collection without allowed login → 204 with external-auth cleanup |
| V-12 | JS SDK (v0.26.2 source): `requestVerification(email, …)` sends `POST` with body `{email}` and resolves `Promise<boolean>`; `confirmVerification(verificationToken, …)` sends `POST` with body `{token}` and resolves `Promise<boolean>`. SDK failures surface as `ClientResponseError` (status + response details). | [P-15], [P-16] | P-15 excerpts: "`async requestVerification( email: string, bodyOrOptions?: any, query?: any, ): Promise<boolean> { … body: { email: email, }`" / "`async confirmVerification( verificationToken: string, … ): Promise<boolean> { … body: { token: verificationToken, }`". P-16 excerpts: signature docs + `ClientResponseError` catch pattern with `error.status`/`error.response` |
| V-13 | Settings automation surface (v0.40.1): `GET /api/settings`, `PATCH /api/settings`, `POST /api/settings/test/email` (plus `/test/s3`), all behind superuser auth. Update clones current settings for the change event, then binds the request body. | [P-10] | P-10 excerpts: "`subGroup := rg.Group(\"/settings\").Bind(RequireSuperuserAuth())`" / "`subGroup.GET(\"\", settingsList)` / `subGroup.PATCH(\"\", settingsSet)` / `POST(\"/test/email\", settingsTestEmail)`" / "`if clone, err := e.App.Settings().Clone(); err == nil { event.OldSettings = clone }`" |
| V-14 | Settings secret handling (v0.40.1): SMTP config carries `enabled, host, port, username, password, authMethod (PLAIN default / LOGIN), tls, localName`. On read, secret fields are redacted (`*******` per docs) and the v0.40.1 model blanks the SMTP password in JSON serialization (`hidePassword`). Established automation path: the automation ALWAYS sets the SMTP password explicitly from env on every apply via superuser `PATCH /api/settings`; it never reads back and re-sends a secret, so redacted-secret resend semantics are never relied upon. Whether a bare omission preserves a stored secret is NOT asserted. | [P-11], [P-12] | P-11 excerpts: "`copy.SMTP.hidePassword = true`" / "`if c.hidePassword {` … `Password string \`json:\"password,omitempty\"\`` … `}{alias(c), \"\"}`" / "`sensitiveFields := []*string{ &copy.SMTP.Password, &copy.S3.Secret, &copy.Backups.S3.Secret, }`" with "`// mask all sensitive fields`". P-12 excerpts: "`Secret/password fields are automatically redacted with _*******_ characters.`" / "`Only superusers can perform this action.`" |
| V-15 | `POST /api/settings/test/email` sends a real message for template `verification` (also `password-reset`, `email-change`) and is the single explicit staging deliverability check; failure surfaces as `Failed to send the test email.` | [P-10], [P-12] | P-10 excerpt: "`settingsTestEmail`" route + "`Failed to send the test email. Raw error:`". P-12: test-email template enum incl. `verification` (retained revision 1 evidence, re-accessed page) |
| V-16 | Resend SMTP core: host `smtp.resend.com`; ports `25, 465, 587, 2465, 2587`; username `resend`; password is the Resend API key. Port 465 uses implicit TLS; port 587 uses STARTTLS. | [P-17] | P-17 excerpts (Context7 + fetched page): "`Host: smtp.resend.com`" / "`Port: 25, 465, 587, 2465, or 2587`" / "`Username: resend`" / "`Password: YOUR_API_KEY (re_xxxxxxxxx)`"; Nodemailer `secure: true, port: 465`; PHPMailer `SMTPSecure = 'tls', Port = 587` |
| V-17 | Resend domain/DNS retrieval contract (reclassified, no static values): sending requires an owned, added-and-verified domain. DNS values are provider-generated per-domain runtime inputs: `POST /domains` returns a per-domain `records` array (SPF MX+TXT on the `send` subdomain, three DKIM CNAMEs, tracking CNAME); `POST /domains/claim` returns a per-domain TXT verification record; the dashboard Records tab shows each domain's DKIM/SPF configurations and DMARC parameters. No DNS hostname/value is a documentation constant; all values are copied from the Resend dashboard/API at domain-setup time. | [P-18] | P-18 excerpts: "`POST /domains` … returns DNS verification records" with `records: [SPF MX `feedback-smtp.us-east-1.amazonses.com`, SPF TXT `v=spf1 include:amazonses.com ~all`, 3× DKIM CNAME, Tracking CNAME]` (illustrative example values, NOT reusable constants) / "`POST /domains/claim` … `record: { type: TXT, value: resend-domain-verification=… }`" / "`Under the Records tab for each added domain, you can view the DKIM and SPF configurations generated by Resend`" |
| V-18 | Request-verification is enumeration-neutral by platform primitive (v0.40.1): unknown emails get the same eager `204` as existing ones with zero mails sent. The neutral app-level resend response remains a confirmed product requirement layered on top, not a sourced claim. | [P-05], [P-07] | Same excerpts as V-10 (missing-email 204, zero mails) |
| V-19 | Offline E2E token access — source-backed negative result: no public offline verification-token issuance/retrieval API exists in the admitted v0.40.1 sources. The request handler only ever sends mail asynchronously (`FireAndForget`); tests exercise confirmation with server-side-minted JWTs inside the test harness. The research question is therefore CLOSED by absence: E2E without real SMTP is an implementation obligation carried explicitly — admin-side (superuser/test-harness) token setup — not a platform primitive. | [P-05], [P-08] | P-05: mail path is exclusively `routine.FireAndForget(mails.SendRecordVerification…)` with no token returned to the caller. P-08: confirm tests submit pre-minted JWT `token` bodies with no retrieval step. Absence: no `GET`-token/offline-issue endpoint in P-05/P-06/P-10 |
| V-20 | No-session-before-verification platform support: the Web APIs are stateless (no server sessions); an existing token is checked via auth-refresh, which errors on invalid tokens; `AuthRule` denies token issuance to unverified records at the choke point; rotating the rule rotates the token secret. The app-level rules (register does not log in, no session use before verification) remain confirmed product requirements layered on the platform gate. | [P-01], [P-03], [P-13] | P-13 (re-accessed): stateless APIs, `authRefresh` validity check. V-02/V-05 excerpts for the gate and rotation |

**Carried revision 1 evidence (unchanged, still valid):** auth-with-password endpoint shape
(`POST …/auth-with-password`, identity + password), OTP auto-verify/enumeration-guard analogy
(P-20, master, analogy only), `verified` as a first-class auth-record accessor used by the v0.40.1
request handler (`record.Verified()`).

**Expressly corrected revision 1 items:** `onlyVerified` is NOT the v0.40.1 setting (V-01);
`authRule: "verified = true"` IS the supported expression (V-02, was "not found"); exact
placeholder spellings ARE established (V-07, was "not found"); the default action-URL format IS
established (V-08, was "not found"); exact REST bodies ARE established (`{email}`, `{token}`,
V-10–V-12, was "truncated"); request-verification neutrality IS platform-sourced (V-18, was
"not found"); offline-token access is a closed source-backed negative (V-19, was "ambiguous").

**Claims NOT emitted (fail-closed):**

- No claim of collection-import merge semantics for auth options — only the serialized
  `authRule` key is claimed (V-04); merge behavior is an apply-time live check.
- No claim that bare omission of `smtp.password` on PATCH preserves the stored secret (V-14);
  the automation path always sets it explicitly from env.
- No static Resend DNS values for `serviceflow.jonasotoaguilar.space` — values are per-domain
  runtime inputs by contract (V-17).
- No claim of a public offline token API — closed negative (V-19).

## 5. Contradictions, Uncertainty, and Freshness

**Contradictions:** None between admitted sources. A revision 1 tension is resolved, not
contradicted: the v0.20.0 `onlyVerified` changelog entry describes a superseded option name;
v0.40.1 source establishes `authRule` as the mechanism and `OnlyVerified` as absent.

**Uncertainty (explicit, residual only):**

- Q1 — `authRule: "verified = true"` is the v0.40.1-supported verified-only expression with a
  single choke point covering all token-issuing paths (V-02, V-03). Residual: per-method
  coverage is asserted from the field doc's explicit password/OAuth2 naming plus the choke-point
  placement; apply-time login smoke tests confirm per enabled method.
- Q2 — bodies (`{email}`, `{token}`), paths, and status codes established from v0.40.1 server
  source and tests (V-10–V-12). Residual (non-blocking, outside the product path): the exact
  response code when re-requesting verification for an already-verified address is not quoted;
  the product's neutral app response makes it non-blocking.
- Q3 — placeholders, defaults, and sender fully established (V-07–V-09). No residual.
- Q4 — routes, fields, redaction, and the always-set-env-secret automation path established
  (V-13–V-15). Residual: import-merge and omission-preservation semantics are deliberately
  unasserted and never relied upon.
- Q5 — transport core and the per-domain retrieval contract established; no static values exist
  to assert (V-16, V-17). No residual.
- Q6 — neutrality is platform-sourced (V-18); offline access is a closed negative with the
  obligation carried explicitly (V-19); staging check is the test-email endpoint (V-15). The
  neutral resend UX and server-side token consumption remain product requirements by design
  (section 7), which is the correct classification, not a gap.

**Freshness:**

- All v0.40.1 tag sources and all doc pages accessed 2026-09-04 (this run). Tag pin `v0.40.1`
  verified via the tag CHANGELOG (P-19) and tag-pinned raw URLs.
- Re-validate before proposal if the installed server version changes; names above are valid
  for the `v0.40.1` line only.

## 6. Evidence-Only Conclusion (no claims beyond admitted)

Q1 is answered `authRule: "verified = true"`, not `onlyVerified`: the v0.40.1 auth-collection
option is the `authRule` expression evaluated at a single choke point after authentication and
before token issuance, with `nil` denying all auth methods; changing it rotates the token
secret; defaults allow auth, so the proposal must set the rule explicitly. Q2 is answered with
exact SDK signatures and REST bodies (`{email}`, `{token}`), success `204`s, and error codes
from v0.40.1 server source and tests. Q3 is answered with exact placeholder constants, the
default template, and its default action URL. Q4 is answered with routes, field tables,
redaction behavior, and the always-set-env-secret automation path. Q5 is answered with SMTP
transport core plus the per-domain DNS retrieval contract, with static values correctly
reclassified as runtime inputs. Q6 is answered with platform-sourced neutral `204`s, a
source-backed offline-access negative closed by the confirmed admin-side test requirement, and
the test-email staging check. Outcome is `done`: proposal may proceed, carrying only the
explicitly non-blocking residuals above.

## 7. Product Choices — Separate from Evidence (Non-Authoritative)

Orchestrator-owned product truth, recorded here only as received and NOT validated by this research:

- No production users yet; no migration/grandfathering requirement.
- Every operational user MUST have a verified account; unverified users must not receive or use a session.
- Registration creates the account, requests verification mail, does not log in, then redirects to `/login`.
- Login shows a visible box/callout stating the verification email was sent and verification is required.
- Mail transport is Resend SMTP; sender/domain target `ServiceFlow <no-reply@serviceflow.jonasotoaguilar.space>`;
  verification link uses public app origin `https://serviceflow.jonasotoaguilar.space`.
- SMTP and verification-template settings automated from environment configuration; no secrets in Git.
- User supplies environment values only when runtime verification requires them.
- Existing local router push/refresh changes in login/register forms remain in scope.

---

*Persistence: `gentle-ai.sdd-research/v1` revision 2, outcome `done`, admission granted
(documentation via context7_resolve-library-id + context7_query-docs + ctx_fetch_and_index +
ctx_search; open-web via ctx_fetch_and_index + ctx_search), twenty sources (P-01 through P-20),
twenty validated claims (V-01 through V-20), bounded quotations only, absences stated as
source-backed negative results with obligations carried explicitly. Retained intent, canonical
desired content, validated revision 1 evidence, and confirmed product decisions preserved.
No proposal/spec/design/tasks produced; no code implemented or inspected. Evidence is sufficient
for proposal without asserting any not-found fact.*
