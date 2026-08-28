# Registro Filter Visibility Specification

## Purpose

Registro `/service-events` filter controls stay visible at all times. Outer collapse is removed. Existing fields, query matching, and pagination behavior are unchanged.

## Requirements

### Requirement: Always-Visible Filter Panel

The filter panel MUST render expanded and visible on first paint and MUST remain visible. The outer panel MUST NOT be an accordion, disclosure, collapsible, or toggle-controlled region. The page MUST NOT provide an outer expand/collapse button, chevron, panel `aria-expanded`, `showFilters` disclosure state, conditional hide of the filter grid, or any control that conceals the panel.

#### Scenario: Initial render shows filters

- GIVEN an authenticated operator opens `/service-events`
- WHEN the page first renders
- THEN the heading, Desde, Hasta, Tipo, Estado, Sede, and clear MUST be visible without activation
- AND the filter grid MUST NOT be hidden

#### Scenario: No outer collapse control or hidden panel

- GIVEN `/service-events` is rendered
- WHEN the operator inspects the filter region and activates the heading or nearby chrome
- THEN no outer expand/collapse button, chevron, or panel `aria-expanded` control MUST exist
- AND the filter controls MUST stay visible

### Requirement: Preserved Controls and Query Semantics

Visible controls MUST remain Desde and Hasta with current date constraints, Tipo, Estado, Sede, and clear/reset. Individual dropdowns MUST stay interactive. Filter matching and query fields MUST match current behavior. Changing Desde, Hasta, Tipo, Estado, or Sede MUST update that filter and requery using existing pagination behavior. This capability MUST NOT add a pagination reset on those filter changes. Clear/reset MUST reset filter values and page to 1 as current clear behavior does. This capability MUST NOT add fields, change query semantics, or restyle beyond always-visible layout.

#### Scenario: Filter change requeries without pagination reset

- GIVEN filtered Registro results beyond the first page
- WHEN the operator changes Tipo, Estado, Sede, Desde, or Hasta
- THEN the corresponding filter MUST update and the list MUST requery
- AND pagination MUST follow existing behavior
- AND this capability MUST NOT reset the page

#### Scenario: Clear resets filters and page to 1

- GIVEN active Registro filters
- WHEN the operator activates clear/reset
- THEN filters MUST return to the current default unfiltered state
- AND the page MUST reset to 1 as current clear behavior does

### Requirement: Heading, Keyboard, and Accessible Names

The filter heading MUST be static readable heading or text, not a button. Labels and controls MUST be keyboard reachable, show visible focus, and have accessible names.

#### Scenario: Keyboard-only interaction

- GIVEN `/service-events` used with keyboard only
- WHEN the operator tabs through the filter region
- THEN Desde, Hasta, Tipo, Estado, Sede, and clear MUST receive focus with visible focus and accessible names
- AND Enter or Space on the heading MUST NOT collapse the panel

### Requirement: Responsive Layout Without Overflow

Wide layout MAY show controls in one row. At a 390px-wide viewport the panel MUST wrap or stack. All controls MUST remain discoverable. Applicable interactive targets MUST be at least 44px. The page MUST NOT overflow horizontally or place clear off-screen.

#### Scenario: Mobile 390px wrap without overflow

- GIVEN authenticated `/service-events` at 390×844
- WHEN the filter panel renders
- THEN all controls including clear MUST be on-screen without horizontal page overflow
- AND controls MUST wrap or stack while remaining discoverable
- AND applicable targets MUST be at least 44px

### Requirement: Mandatory Closeout Implementation

This capability MUST be implemented in closeout apply before independent verification. Missing a prior `remediation_required` finding MUST NOT skip it.

#### Scenario: Not verify-gated remediation

- GIVEN independent verify-ui has not classified filter collapse as `remediation_required`
- WHEN closeout apply is planned
- THEN always-visible Registro filters MUST still be implemented
- AND MUST NOT be treated as conditional remediation
