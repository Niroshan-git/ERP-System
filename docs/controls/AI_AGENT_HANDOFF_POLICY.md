# Ceylon Stack AI Agent Handoff Policy

**Status:** Binding handoff policy for meaningful engineering packages
**Scope:** Claude Code → Codex → Claude correction and acceptance lifecycle
**Related controls:** `AI_DUAL_AGENT_OPERATING_MODEL.md`, `CLAUDE.md`, root `AGENTS.md`

This policy defines coordination evidence. It does not replace the package sizes, quality gates,
documentation rules, or release mechanisms already defined in the canonical controls.

## Package Identification

Every meaningful package must have a stable package or task identifier. Reuse the identifier in
the approved mission, `PROGRESS.md`, `QA_LOG.md`, branch/commit description, and work log where it
already exists—for example, the established module package labels such as “Manufacturing Package
5.” Do not create a parallel global numbering series merely for this handoff process.

If no identifier exists, use a concise stable descriptive identifier approved in the package
scope, such as `<module>-<feature>`, and use it consistently. Renaming a package after handoff
requires a cross-reference so history remains traceable.

## Claude Start

At package start Claude records, in its working context or the package's existing planning
record:

- package identifier and objective;
- included and excluded scope;
- affected module;
- expected frontend and backend impact;
- expected master-data impact;
- expected accounting impact; and
- expected inventory impact.

Unknown impact is recorded as `NEEDS_VERIFICATION`, not assumed to be absent. Start notes need not
be added to `AI_WORK_LOG.md`; that ledger begins tracking a package when it becomes meaningful for
cross-agent coordination.

## Claude Completion Handoff

Claude must provide this handoff when implementation reaches handoff readiness. Empty sections
must state `NOT APPLICABLE`, `NOT RUN`, or `NEEDS_VERIFICATION` as appropriate.

```text
CLAUDE PACKAGE HANDOFF

Package ID:
Module:
Objective:

IMPLEMENTATION
Summary:
Files Changed:

FRONTEND
Pages:
Components:
Routes:
Business Logic:

BACKEND
Entities:
DocTypes:
APIs:
Server Actions:
Database Impact:

ERP BUSINESS LOGIC
Rules Added:
Rules Changed:
Lifecycle Impact:
Validation Impact:

MASTER DATA
Entities Used:
Entities Added:
Cross-Module Impact:

FINANCIAL / OPERATIONAL IMPACT
Accounting:
Inventory:
Costing:
Manufacturing:

TESTING
Tests Run:
Passed:
Failed:
Not Run:

DOCUMENTATION
Files Updated:
Backend Knowledge Updated:
Frontend Knowledge Updated:

KNOWN ISSUES:

NEEDS_VERIFICATION:

COMMIT / CHANGE BOUNDARY:
```

The boundary should identify the implementation commit range when committed, or an explicit
working-tree file set and baseline commit when uncommitted. Claude updates its portion of
`docs/operations/AI_WORK_LOG.md` to `CLAUDE_HANDOFF` without marking Codex review complete.

## Codex Intake

Codex independently determines:

- the actual Git branch, baseline, commit range, diff, and changed files;
- unrelated pre-existing or concurrent working-tree changes;
- relevant canonical policies and architecture decisions;
- affected modules, entities, APIs, database and configuration behavior;
- tests available and tests claimed; and
- documentation expected under existing package-closure rules.

Codex must not assume the handoff is complete or correct. If a reliable package boundary cannot
be established, Codex records the issue as `BLOCKED` or `NEEDS_VERIFICATION` rather than reviewing
an ambiguous change set as though it were complete.

## Codex Review

Within the established boundary Codex reviews, where applicable:

- implementation correctness and maintainability;
- architecture and policy compliance;
- ERP business rules, lifecycle, validation, numbering, cancellation, and audit behavior;
- centralized master-data use;
- database/backend entities, relationships, APIs, transactions, and migration knowledge;
- frontend routes, fields, components, permissions, terminology, and state representation;
- frontend/backend field, calculation, validation, and lifecycle alignment;
- accounting, inventory, costing, manufacturing, and cross-module effects;
- security and permission enforcement;
- test coverage and QA evidence;
- canonical documentation completeness; and
- changelog, decision, work-log, and Git traceability.

The detailed acceptance report remains the report defined in root `AGENTS.md`.

## Review Results

Findings use the existing dual-agent severity vocabulary:

- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`
- `DOCUMENTATION`
- `NEEDS_VERIFICATION`

Codex assigns one acceptance state:

- `PASS`
- `PASS WITH NON-BLOCKING FINDINGS`
- `CHANGES REQUIRED`
- `BLOCKED — NEEDS VERIFICATION`

No package may receive `PASS` while an unresolved `CRITICAL` or `HIGH` finding exists. Test and
evidence results are separately reported as `PASSED`, `FAILED`, `NOT RUN`, `NOT APPLICABLE`, or
`NEEDS_VERIFICATION`.

## Return to Claude

`CRITICAL` and `HIGH` implementation findings normally return to Claude. `MEDIUM` findings also
return when they prevent an existing Definition of Done or package acceptance condition. Each
returned finding uses:

```text
Finding ID:
Severity:
File/Area:
Evidence:
Expected Behavior:
Actual Behavior:
Recommended Direction:
```

The finding states the required outcome and relevant constraints. Codex avoids writing Claude's
implementation solution unless the Product Owner explicitly authorizes Codex to modify
application code. Claude records the correction and its validation against the same finding ID.

## Re-Review

After Claude supplies corrections, Codex reviews the affected package and relevant regression
areas. Codex must inspect the new Git diff and rerun appropriate validation; a statement that a
finding was fixed is not evidence that it was fixed.

Previously accepted areas need not be exhaustively repeated unless the correction can affect
them. Every returned finding is explicitly marked `RESOLVED`, left `OPEN`, converted to
`NEEDS_VERIFICATION`, or accepted as risk by the Product Owner.

## Documentation Closure

After technical acceptance, Codex verifies that the following existing records are updated where
applicable:

- backend documentation and canonical mappings;
- frontend documentation;
- master ERD and relationships;
- business-rule IDs and test scenarios;
- `QA_LOG.md`;
- `PROGRESS.md`;
- architecture decisions;
- migration status;
- unverified behaviors; and
- product/release documentation and the existing external-plan synchronization process.

Use the repository's existing files and conventions. Do not create substitute QA, progress,
decision, migration, or release records inside the handoff or work log.

## Final Package Closure

A package reaches `RELEASE_READY` only after required implementation, developer QA, Claude
handoff, Codex acceptance, correction/re-review, documentation closure, and all other existing
package-closure requirements are satisfied.

`AI_WORK_LOG.md` records that coordination state. Git remains authoritative for actual changes;
`QA_LOG.md` for detailed QA execution; `PROGRESS.md` for chronological product progress; ADRs for
durable decisions; and `docs/backend/` for canonical backend knowledge.
