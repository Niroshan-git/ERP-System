# Ceylon Stack AI Work Log

**Purpose:** Lightweight Claude Code ↔ Codex coordination and audit ledger.
**Authority:** Coordination state only.

This log does not replace `PROGRESS.md`, `QA_LOG.md`, Git history, architecture decision records,
backend knowledge, migration status, or release documentation. Those sources remain authoritative
for their respective subjects. Git is authoritative for actual code changes.

## Status Vocabulary

- `PLANNED`
- `CLAUDE_IN_PROGRESS`
- `CLAUDE_HANDOFF`
- `CODEX_REVIEW`
- `RETURNED_TO_CLAUDE`
- `CODEX_REVIEW_COMPLETE`
- `DOCUMENTATION_CLOSURE`
- `RELEASE_READY`
- `BLOCKED`

## Package Ledger

| Package | Module | Description | Claude Status | Codex Status | Overall Status | Commit/Boundary | Open Findings | Needs Verification | Last Updated |
|---|---|---|---|---|---|---|---:|---|---|

Add one row per meaningful engineering package. Do not log individual prompts. Detailed records
below are optional and should be added only when a package needs findings, re-review, or closure
context that cannot fit clearly in the ledger row.

## Package Record Template

Copy this section for a package only when useful.

```markdown
## Package: <ID>

### Objective

<Concise objective and scope boundary>

### Claude

Started:
Completed:
Implementation Summary:
Files:
Tests:
Handoff:
Commit/Boundary:

### Codex

Review Started:
Review Completed:
Review State:
Tests Independently Executed:
Documentation Updated:

### Findings

| ID | Severity | Area | Finding | Owner | Status |
|---|---|---|---|---|---|

Finding status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `ACCEPTED_RISK`, or
`NEEDS_VERIFICATION`.

### Documentation Checklist

Backend:
Frontend:
ERD:
Business Rules:
QA_LOG:
PROGRESS:
Architecture Decision:
Migration Status:
Release Documentation:

Documentation status: `UPDATED`, `NOT_REQUIRED`, `NEEDS_UPDATE`, or
`NEEDS_VERIFICATION`.

### Final State

Implementation:
Independent Review:
Documentation:
Release:

### Notes

<Keep concise. Link to authoritative records instead of copying them.>
```

## Missing-Work Detection

The ledger must make incomplete coordination visible:

- `Claude Status = CLAUDE_HANDOFF` with Codex not started means independent review is missing.
- Codex review passed while any required documentation item is `NEEDS_UPDATE` means documentation
  closure is missing.
- Implementation marked complete with QA `NOT RUN` means QA evidence is missing unless QA is
  explicitly `NOT APPLICABLE` under canonical policy.
- Accounting, inventory, costing, security, or lifecycle impact marked `NEEDS_VERIFICATION`
  remains unverified and must not be represented as fully proven behavior.
- An ambiguous commit/change boundary prevents reliable independent acceptance.
- `RELEASE_READY` is inconsistent with open blocking findings, failed required tests, incomplete
  documentation closure, or unmet package-closure rules.

When an inconsistency exists, keep the package in the applicable active or `BLOCKED` state and
link to the authoritative finding or missing record.

## Work Log Rules

1. Log meaningful engineering packages, not every prompt or agent interaction.
2. Use the package identifier already established by the project; do not create a parallel
   numbering system.
3. Claude updates its portion when implementation reaches handoff.
4. Codex updates its portion during independent review and verifies final completeness.
5. Git remains authoritative for actual code changes.
6. `QA_LOG.md` remains authoritative for detailed QA execution.
7. `PROGRESS.md` remains authoritative for chronological product progress.
8. Architecture decision records remain authoritative for durable architectural decisions.
9. `docs/backend/` remains authoritative for canonical backend knowledge and migration state.
10. This work log is authoritative only for Claude/Codex coordination state.
11. Keep notes concise and link to canonical sources instead of duplicating their narratives.
12. Packages already in progress when this policy is introduced may finish under their existing
    closure process; do not retroactively reclassify or disturb their implementation boundary.
