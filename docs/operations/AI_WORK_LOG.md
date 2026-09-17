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
| Manufacturing Package 2 | Manufacturing (frontend) | Work Order detail view — read-only, 6 tabs (Details/Materials/Operations/Job Cards/Quality Readiness/Comments) | CLAUDE_HANDOFF | `CODEX_REVIEW_COMPLETE` | `RETURNED_TO_CLAUDE` | `25b882e` (bundled with Pkg 3, Pkg 5) | 2 | Live QA not independently rerun | 2026-09-17 |
| Manufacturing Package 3 | Manufacturing (frontend) | Work Order Create — Draft-only, BOM-scaled Materials/Operations preview, optional Material Readiness | CLAUDE_HANDOFF | `CODEX_REVIEW_COMPLETE` | `RETURNED_TO_CLAUDE` | `25b882e` (bundled with Pkg 2, Pkg 5) | 2 | Persisted Work Order operations behavior | 2026-09-17 |
| Manufacturing Package 5 | Manufacturing (frontend) | Material Transfer for Manufacture — native `make_stock_entry` reuse, partial transfer, additional-material support, Draft-vs-Submit | CLAUDE_HANDOFF | `CODEX_REVIEW_COMPLETE` | `RETURNED_TO_CLAUDE` | `25b882e` (bundled with Pkg 2, Pkg 3) | 3 | Accounting impact; duplicate-item transfer behavior; live QA not independently rerun | 2026-09-17 |

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

## Package: Manufacturing Package 5

### Objective

Material Transfer for Manufacture — give the frontend a way to move raw materials against a
submitted Work Order using ERPNext's own native `make_stock_entry` mechanism, after Package 4's
investigation ruled out a direct `Work Order.required_items` editor (blocked by core Frappe's
`UpdateAfterSubmitError` once submitted). Scope: Material Transfer for Manufacture only — no
Manufacture/finished-goods entry, no Job Cards, no BOM editing.

### Claude

Started: 2026-09-17
Completed: 2026-09-17
Implementation Summary: New route
`/manufacturing/work-orders/[name]/transfer-materials` (`page.tsx` + `actions.ts`), new
`components/MaterialTransferForm.tsx`, new `lib/actions/workOrderTransfer.ts`. Calls ERPNext's
whitelisted `erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry` (same method
Desk's "Start" button uses) rather than reimplementing outstanding-qty math. Supports partial
transfer, additional non-BOM materials (tagged `ADDITIONAL`), Draft-vs-Submit distinction. Work
Order Detail Materials tab rebuilt with Required/Transferred/Remaining/Consumed/Source/Readiness
columns plus a related Stock Entries list. Full detail in `PROGRESS.md`'s
"Manufacturing frontend Package 5 — Material Transfer for Manufacture (2026-09-17)" entry.
Files: see `git show --stat 25b882e` (bundled commit, also contains Packages 2 and 3).
Tests: live QA against the real ERPNext instance (8 scenarios, see `QA_LOG.md`'s matching
2026-09-17 entry) — PASS.
Handoff: see `CLAUDE PACKAGE HANDOFF` recorded in this session's transcript /
`PROGRESS.md`/`QA_LOG.md` entries dated 2026-09-17.
Commit/Boundary: `25b882e` on branch `frontend`.

### Codex

Review Started: 2026-09-17
Review Completed: 2026-09-17
Review State: `CHANGES REQUIRED` as part of the combined commit/package review below
Tests Independently Executed: `npm run lint` — PASSED; `npx tsc --noEmit` — PASSED;
`npm run build` — PASSED with existing dynamic-route/network diagnostics
Documentation Updated: Codex coordination state only; canonical package documentation requires
correction as recorded below

### Findings

| ID | Severity | Area | Finding | Owner | Status |
|---|---|---|---|---|---|
| MFG5-01 | MEDIUM | Frontend / server action | `getMaterialTransferPreview` collapsed a real ERPNext error (permission denial, ineligible Work Order) into the same `null` result as "nothing left to transfer" | Claude | RESOLVED — now returns a discriminated `{ preview } \| { error }` result |
| MFG5-02 | LOW | Frontend / UX | `MaterialTransferForm`'s "+ Add Material" doesn't pre-check the Work Order's already-fully-transferred required items before tagging a re-added item `ADDITIONAL` | Claude | ACCEPTED_RISK — cosmetic only; ERPNext's own server-side matching decides the real outcome under the live 0% headroom setting |
| MFG5-03 | — | Live bug (pre-fix) | Stock Entry payload omitted `fg_completed_qty`, so ERPNext's `Stock Entry.update_work_order` silently never attached additional materials to `required_items` (stock still moved) | Claude | RESOLVED — `fg_completed_qty` threaded through from the `make_stock_entry` response, `actions.ts` now requires it |
| `CX-MFG-001` | `HIGH` | Material-transfer server actions | Client-posted Work Order/header/line fields are used to create and submit the Stock Entry without re-fetching and binding them to the route Work Order; the bound Work Order name is used only for revalidation/redirect. | Claude | `OPEN` |
| `CX-MFG-006` | `NEEDS_VERIFICATION` | Material rows | Work Order Item duplicates are a live-known possibility, but transfer/detail UI state and React keys are indexed by `item_code`; behavior for duplicate item rows is not established. | Claude | `NEEDS_VERIFICATION` |

Finding status: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `ACCEPTED_RISK`, or
`NEEDS_VERIFICATION`.

### Documentation Checklist

Backend: UPDATED — `docs/backend/05-manufacturing/material-transfer.md`
Frontend: UPDATED — `apps/frontend/README.md`, `docs/controls/FRONTEND_GUIDE.md` §11
ERD: NOT_REQUIRED (no new entities, reused `Stock Entry`/`Work Order`)
Business Rules: UPDATED — `docs/backend/05-manufacturing/material-transfer.md`
QA_LOG: UPDATED — 2026-09-17 entry, 8 scenarios, PASS
PROGRESS: UPDATED — 2026-09-17 entry
Architecture Decision: NOT_REQUIRED
Migration Status: NOT_REQUIRED
Release Documentation: `docs/ceylon-stack-documentation.html` UPDATED (committed in `25b882e`); Notion sync via `release-tracker` in progress as of this closure pass — see Notes

Documentation status: `NEEDS_UPDATE` pending Notion sync confirmation (see Notes).

### Final State

Implementation: `CHANGES REQUIRED`
Independent Review: `CODEX_REVIEW_COMPLETE`
Documentation: `NEEDS_UPDATE`
Release: `BLOCKED` — returned to Claude

### Notes

Package 4 (Work Order Material Change investigation, same day) shipped no code — it established
live, via `bench console`, that direct `required_items` edits are blocked post-submit and that
Stock-Entry-driven transfer is the only ERPNext-supported path, which this package then built.
Not logged as its own ledger row since nothing was implemented; see `PROGRESS.md`'s
"Manufacturing frontend Package 4" entry for the investigation record.

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

## Package: Manufacturing Packages 2, 3, and 5

### Objective

Review the combined committed package adding Work Order detail, Draft creation, and Material
Transfer for Manufacture without expanding into Work Order Submit/Cancel, Job Card management,
BOM management, Workstations, or OEE.

### Codex

Review Started: 2026-09-17
Review Completed: 2026-09-17
Review State: `CHANGES REQUIRED`
Tests Independently Executed: `npm run lint` — PASSED; `npx tsc --noEmit` — PASSED;
`npm run build` — PASSED with existing dynamic-route/network diagnostics.
Documentation Updated: This coordination record only. No application or canonical package
documentation changed.

### Findings

| ID | Severity | Area | Finding | Owner | Status |
|---|---|---|---|---|---|
| `CX-MFG-001` | `HIGH` | Material-transfer server actions | Client-posted Work Order/header/line fields are used to create and submit the Stock Entry without re-fetching and binding them to the route Work Order; the bound Work Order name is used only for revalidation/redirect. | Claude | `OPEN` |
| `CX-MFG-002` | `HIGH` | Work Order Create | A BOM with operations is previewed to the user, but a plain REST create persists an empty `operations` child table; the created Work Order is not behaviorally equivalent to the represented operation-bearing Work Order. | Claude | `OPEN` |
| `CX-MFG-003` | `MEDIUM` | Quality Readiness | The numerator counts every Job Card with an inspection while the denominator counts only Job Cards with a template, so mixed records can report an incorrect readiness ratio. | Claude | `OPEN` |
| `CX-MFG-004` | `DOCUMENTATION` | Frontend/release records | `apps/frontend/README.md` still describes Manufacturing as greyed/coming soon, and release text still says the Work Orders list has no New action even though Work Order Create shipped. | Claude | `OPEN` |
| `CX-MFG-006` | `NEEDS_VERIFICATION` | Material rows | Work Order Item duplicates are a live-known possibility, but transfer/detail UI state and React keys are indexed by `item_code`; behavior for duplicate item rows is not established. | Claude | `NEEDS_VERIFICATION` |

### Documentation Checklist

Backend: `UPDATED`
Frontend: `NEEDS_UPDATE`
ERD: `UPDATED`
Business Rules: `UPDATED`
QA_LOG: `UPDATED`
PROGRESS: `UPDATED`
Architecture Decision: `NOT_REQUIRED`
Migration Status: `UPDATED`
Release Documentation: `NEEDS_UPDATE`

### Final State

Implementation: `CHANGES REQUIRED`
Independent Review: `CODEX_REVIEW_COMPLETE`
Documentation: `NEEDS_UPDATE`
Release: `BLOCKED`

### Notes

The repository was clean at intake. Package boundary is commit `25b882e` (20 files, combining
Manufacturing Packages 2, 3, and 5). Live ERPNext mutation scenarios recorded in `QA_LOG.md` were
not independently rerun because this review did not authorize external data mutation. Accounting
impact remains `MFG-UNV-005` / `NEEDS_VERIFICATION`.

### Claude Corrections — governance-closure pass (2026-09-17)

Corrections submitted against this review's findings, uncommitted in the working tree as of this
note (see `QA_LOG.md`'s matching 2026-09-17 correction entry for developer-QA evidence — real
live-instance re-verification of these fixes is Codex's re-review to confirm, not self-certified
here per this policy's Re-Review section). `npm run lint`, `npx tsc --noEmit`, and `npm run build`
all re-run clean after every change below.

- **`CX-MFG-001` (HIGH, OPEN → corrected, pending re-review):** `transfer-materials/actions.ts`'s
  `buildStockEntryFields` is now `async` and re-derives `company`/`bom_no`/`use_multi_level_bom`/
  `to_warehouse`/`fg_completed_qty` from a **fresh** `getMaterialTransferPreview(workOrderName)`
  call (re-invoking ERPNext's own `make_stock_entry`) keyed off the bound, server-verified
  `workOrderName` argument — never from the client-submitted hidden fields, which have been
  removed from `MaterialTransferForm.tsx` entirely. Per-row `item_code`/`qty`/`s_warehouse`
  remain the only real client input; a row matching the fresh preview's pending items is capped
  at ERPNext's own proposed ceiling and takes its master-data fields from that preview row, and a
  row outside the pending list (additional material) has its master-data fields re-derived via a
  fresh `getItemLineDefaults` lookup. See `docs/backend/05-manufacturing/material-transfer.md`'s
  updated field-mapping section for the full server-derived-vs-client-supplied table.
- **`CX-MFG-002` (HIGH, OPEN → corrected, pending re-review):** `work-orders/actions.ts`'s
  `createWorkOrderAction` now sends an `operations` array on create, built from a fresh
  `getBomDetails(bom_no)` call (not a client-submitted copy), with `time_in_mins` scaled by
  `qty / bom.quantity` (same convention `required_items` already uses). Flagged
  `MFG-UNV-007` in `docs/backend/99-unverified/unverified-behaviours.md` — the scaling
  convention itself is reasoned, not live-verified against Desk's own copy behavior (no
  SSH/`bench console` access in this session).
- **`CX-MFG-003` (MEDIUM, OPEN → corrected, pending re-review):**
  `work-orders/[name]/page.tsx`'s Quality Readiness numerator is now computed as
  `jobCardsWithTemplate.filter(jc => jc.quality_inspection)` instead of
  `jobCards.filter(jc => jc.quality_inspection)`, so a Job Card with a recorded inspection but
  no template can no longer inflate the ratio above its real population. See
  `docs/backend/05-manufacturing/job-card.md`'s `MFG-VAL-006` for the updated rule text.
- **`CX-MFG-004` (DOCUMENTATION, OPEN → corrected):** `apps/frontend/README.md`'s "App shell"
  bullet no longer describes Manufacturing as greyed "coming soon" (it's real and unlocked, per
  the README's own later "Manufacturing module" bullet, which was already accurate).
  `docs/ceylon-stack-documentation.html`'s "Work Orders list" status line no longer claims no
  "+ New" action exists — it now names the "+ New Work Order" button and Work Order Create.
  Three stale "not committed"/"pending release-tracker" notes in `PROGRESS.md` (Packages 2, 3, 5)
  were also corrected to name commit `25b882e`, and this ledger itself now carries per-package
  rows and a detailed Package 5 record that didn't exist before this session (closing what an
  earlier snapshot of this review tracked as `CX-MFG-005`, handoff traceability).
- **`CX-MFG-006` (NEEDS_VERIFICATION, unchanged — hardened, not resolved):** React `key`s in
  both the Work Order Detail Materials tab and `MaterialTransferForm.tsx` now use row index, and
  `MaterialTransferForm.tsx`'s `qtyByItem`/`warehouseByItem` state was renamed
  `qtyByIndex`/`warehouseByIndex` and re-keyed by row index throughout — a duplicate `item_code`
  in the preview can no longer collapse two rows' state into one. Whether ERPNext's own
  `make_stock_entry` can actually return duplicate `item_code` rows in the first place remains
  unconfirmed — logged as `MFG-UNV-008`, still `NEEDS_VERIFICATION`, not claimed resolved.

**Requesting re-review of these corrections against this same package boundary.** Claude Status
for Packages 2/3/5 above should be read as re-handed-off pending Codex's independent
verification, not self-certified as `RESOLVED` — only Codex's re-review may set that per this
policy's Re-Review section.
