# Project Contracts Specification

## Purpose

Defines the root-level project contract documents — product, architecture, design, and security — which MUST reflect the system's current behavior and its development-environment-only Appwrite constraint.

## Requirements

### Requirement: Root contract documents

The repository root MUST contain `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, and `SECURITY.md`, maintained alongside the existing `README.md` and `CHANGELOG.md`.

#### Scenario: Contracts present

- GIVEN the repository root
- WHEN the file listing is inspected
- THEN all four contract documents exist

### Requirement: Contract accuracy

Contracts MUST describe the current system. They MUST NOT document removed components as active behavior and MUST document that Appwrite integration and migration are restricted to the isolated development environment.

#### Scenario: No stale references

- GIVEN the current contract documents
- WHEN they are scanned for removed components such as the unauthenticated proxy rewrite
- THEN no removed component is documented as active behavior

#### Scenario: Development-only guard documented

- GIVEN the current contract documents
- WHEN the Appwrite environment section is read
- THEN it states that integration and migration target an isolated development environment and refuse production

### Requirement: Security reporting

`SECURITY.md` MUST define a path for reporting vulnerabilities.

#### Scenario: Report path exists

- GIVEN `SECURITY.md`
- WHEN the vulnerability disclosure section is read
- THEN a contact path for security reports is defined
