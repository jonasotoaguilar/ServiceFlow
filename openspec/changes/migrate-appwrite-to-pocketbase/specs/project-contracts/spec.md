# Project Contracts Specification

## Purpose

Define the documentation and environment-example contracts that MUST be accurate after ServiceFlow talks only to PocketBase. This capability covers `.env.example`, `README.md`, `PRD.md`, `ARCHITECTURE.md`, and `CODEBASE-GUIDE`. Runtime access rules live in `pocketbase-access`. Schema apply rules live in `pocketbase-schema`. This change MUST NOT create or modify CI workflows, Husky hooks, Dependabot config, `CODEOWNERS`, root `SECURITY.md`, or `DESIGN.md`.

## Requirements

### Requirement: Environment example documents PocketBase only

The committed environment example MUST document `POCKETBASE_URL` as the only required backend locator, with a local example value of `http://127.0.0.1:8090` and no committed secrets. It MUST NOT document PocketBase admin email, admin password, or admin token variables. After Appwrite removal is accepted, it MUST NOT document `NEXT_PUBLIC_APPWRITE_*` or `APPWRITE_API_KEY` as active configuration.

#### Scenario: PocketBase URL is documented

- GIVEN the committed environment example
- WHEN a new operator reads the required variables
- THEN `POCKETBASE_URL` MUST be listed
- AND a local example MUST be `http://127.0.0.1:8090`
- AND no secret value MUST be committed

#### Scenario: Admin credentials are absent

- GIVEN the committed environment example
- WHEN the file is scanned for PocketBase admin variables
- THEN no admin email, password, or token variable MUST be present

#### Scenario: Appwrite keys are not active config

- GIVEN the change is complete
- WHEN the environment example is read as current setup
- THEN Appwrite project, endpoint, and API key variables MUST NOT be documented as required

### Requirement: README describes PocketBase setup

`README.md` MUST describe ServiceFlow as using PocketBase for authentication and data. It MUST tell operators to set `POCKETBASE_URL`, run against an already-available local PocketBase at `127.0.0.1:8090` in development, and apply the versioned schema artifact explicitly. It MUST NOT instruct operators to run `scripts/setup-appwrite.ts` or to supply an Appwrite API key. It MUST NOT add a PocketBase container or Dokploy runbook to this repository.

#### Scenario: Stack section names PocketBase

- GIVEN the current `README.md`
- WHEN the technology list is read
- THEN the database and authentication backend MUST be PocketBase
- AND Appwrite MUST NOT be listed as the active backend

#### Scenario: Setup does not call Appwrite scripts

- GIVEN the current `README.md`
- WHEN the local setup steps are followed
- THEN they MUST NOT require `scripts/setup-appwrite.ts`
- AND they MUST NOT require Appwrite Cloud credentials

### Requirement: Product and architecture contracts exist and are accurate

The repository MUST contain `PRD.md` and `ARCHITECTURE.md` that describe the PocketBase-backed system. Those documents MUST state: public self-registration; `pb_auth` httpOnly cookies; tenant isolation by `userId` plus collection API rules; empty-start cutover with no Appwrite import; PocketBase-native 15-character ids; `{ data, total, page, limit }` lists; LIKE search; optional location `address`; and schema applied out of band to the existing Dokploy-managed PocketBase. They MUST NOT describe Appwrite as the live backend, MUST NOT describe a dual-write or session-compatibility bridge, and MUST NOT claim this repository operates PocketBase hosting.

#### Scenario: PRD reflects current product

- GIVEN `PRD.md`
- WHEN the product behavior is read
- THEN it MUST describe tenant-scoped services, locations, history, public registration, and the temporary empty-start notice
- AND it MUST NOT promise Appwrite data import

#### Scenario: ARCHITECTURE reflects current seams

- GIVEN `ARCHITECTURE.md`
- WHEN the backend section is read
- THEN it MUST name PocketBase as the only data/auth backend
- AND it MUST state that the Next.js process uses `POCKETBASE_URL` plus user session only
- AND it MUST state that schema application is explicit and outside the app process

### Requirement: CODEBASE-GUIDE is PocketBase accurate

The repository MUST contain a `CODEBASE-GUIDE` that tells contributors where auth, storage, schema artifact, and validation live after the migration. The guide MUST name PocketBase collections and the `pb_auth` session cookie. It MUST NOT present `lib/appwrite.ts`, `node-appwrite`, or Appwrite collection setup as current instructions.

#### Scenario: Guide points at current seams

- GIVEN `CODEBASE-GUIDE`
- WHEN a contributor looks up how data is accessed
- THEN the guide MUST point at the PocketBase access seam and the versioned schema artifact
- AND it MUST NOT instruct new work to import `node-appwrite`

#### Scenario: Guide does not revive abandoned Appwrite ops

- GIVEN `CODEBASE-GUIDE`
- WHEN setup and migration sections are read
- THEN they MUST NOT document Appwrite permission migrators, Appwrite API keys, or dual backends

### Requirement: Stale Appwrite claims are removed from in-scope docs

In-scope documents (`README.md`, `PRD.md`, `ARCHITECTURE.md`, `CODEBASE-GUIDE`, and the environment example) MUST NOT document removed Appwrite-only components as active behavior, including the unauthenticated `proxy.ts` rewrite and Appwrite admin-key session creation. References to Appwrite MAY remain only as historical cutover notes that state the project was left untouched until acceptance and was not imported.

#### Scenario: Dead proxy is not documented as live

- GIVEN the in-scope documents
- WHEN they are scanned for the unauthenticated Appwrite proxy rewrite
- THEN that rewrite MUST NOT be described as active behavior

#### Scenario: Historical notes stay historical

- GIVEN an in-scope document mentions Appwrite
- WHEN that mention is read in context
- THEN it MUST be clearly historical or a rollback note
- AND it MUST NOT instruct operators to configure Appwrite for new work

### Requirement: Governance files stay out of this change

This change MUST NOT add or modify CI workflows, Husky hooks, lint-staged config, Dependabot config, `CODEOWNERS`, root `SECURITY.md`, or `DESIGN.md`. Absence of those files MUST remain acceptable for this change.

#### Scenario: Out-of-scope files are untouched

- GIVEN the migration change
- WHEN its file set is inspected
- THEN CI, Husky, Dependabot, `CODEOWNERS`, root `SECURITY.md`, and `DESIGN.md` MUST be unchanged

#### Scenario: Missing SECURITY or DESIGN is not a defect here

- GIVEN the repository has no root `SECURITY.md` or `DESIGN.md`
- WHEN this change is evaluated
- THEN that absence MUST NOT be treated as an open requirement of this change
