# Appwrite Server Access Specification

## Purpose

Defines how the system accesses Appwrite: server-side admin-SDK access only, collections created without world-writable permissions, the `serviceflow-db` database identity, removal of the unauthenticated proxy path, and no debug logging on access paths. All access targets the isolated development Appwrite environment; production Appwrite is out of scope for this change.

## Requirements

### Requirement: Admin-SDK-only access

The system MUST perform all Appwrite data access server-side through the admin SDK. Direct client-side collection access MUST NOT be granted.

#### Scenario: Server action reads data

- GIVEN a server action that needs Appwrite documents
- WHEN the action executes with valid admin credentials
- THEN the data is returned successfully

#### Scenario: Direct client access attempt

- GIVEN a client request that attempts collection access without admin credentials
- WHEN the request reaches Appwrite
- THEN it is denied because no role-based permission exists

### Requirement: Locked collection permissions

Collection creation MUST apply empty permission lists; no role MAY be granted read, write, update, or delete. Setup MUST be idempotent.

#### Scenario: Fresh setup

- GIVEN a clean development environment
- WHEN setup creates the collections
- THEN every collection has an empty permission list with no `Role.any()` grants

#### Scenario: Repeated setup

- GIVEN collections that already exist
- WHEN setup runs again
- THEN existing collections keep empty permissions and are not duplicated

### Requirement: `serviceflow-db` database identity

All application code MUST reference the database named `serviceflow-db`. The legacy `Service-system-db` name MUST NOT be referenced.

#### Scenario: Connection resolves

- GIVEN the configured development environment
- WHEN application code resolves its database
- THEN it targets `serviceflow-db`

#### Scenario: Legacy database ignored

- GIVEN a development environment with legacy `Service-system-db` data
- WHEN the application runs
- THEN it never reads or writes the legacy database

### Requirement: No unauthenticated Appwrite proxy path

The system MUST NOT expose any route that forwards requests to Appwrite without authentication.

#### Scenario: Proxy route removed

- GIVEN the previous unauthenticated `/api/proxy/*` rewrite
- WHEN the codebase is audited for Appwrite-forwarding routes
- THEN no unauthenticated Appwrite-forwarding route exists

### Requirement: No debug logging on access paths

Appwrite access code MUST NOT emit debug logging.

#### Scenario: Session creation is silent

- GIVEN a session is created
- WHEN access code executes
- THEN no debug log output is produced
