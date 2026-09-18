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
| Manufacturing Package 2 | Manufacturing (frontend) | Work Order detail view — read-only, 6 tabs (Details/Materials/Operations/Job Cards/Quality Readiness/Comments) | `CLAUDE_HANDOFF` (remediated) | `CODEX_REVIEW_COMPLETE` (re-review) | `ACCEPTED` as part of combined re-review; combined release remains blocked by Packages 3/5 | `25b882e` → remediation `517f2ea` (bundled with Pkg 3, Pkg 5); `2fbe2a6` coordination only | 1 resolved (`CX-MFG-003`) | Live QA not independently rerun | 2026-09-17 |
| Manufacturing Package 3 | Manufacturing (frontend) | Work Order Create — Draft-only, BOM-scaled Materials/Operations preview, optional Material Readiness | `CLAUDE_HANDOFF` (re-remediated) | `CODEX_REVIEW_COMPLETE` (2026-09-18 second re-review) | `RETURNED_TO_CLAUDE` — `CX-MFG-002` remains open | `25b882e` → `517f2ea` → re-remediation `3a04733`; `d0fb4bf` coordination only | `CX-MFG-002` remains `OPEN` — fixed-time scaling is corrected, but the manual copy still differs from native ERPNext semantics: it maps BOM transaction-currency `hour_rate` instead of native `base_hour_rate as hour_rate`, and omits the native parent-BOM reference (`parent as bom`) | `MFG-UNV-007` remains; installed-version runtime persistence still requires live verification after correction | 2026-09-18 |
| Manufacturing Package 5 | Manufacturing (frontend) | Material Transfer for Manufacture — native `make_stock_entry` reuse, partial transfer, additional-material support, Draft-vs-Submit | `CLAUDE_HANDOFF` (re-remediated) | `CODEX_REVIEW_COMPLETE` (2026-09-18 second re-review) | `ACCEPTED` for `CX-MFG-001`; combined release remains blocked by Package 3 / `CX-MFG-002` | `25b882e` → `517f2ea` → re-remediation `3a04733`; `d0fb4bf` coordination only | `CX-MFG-001` `CLOSED` — in-action session verification, fresh Work Order eligibility, fresh native preview, and aggregate per-item running ceiling independently confirmed | Accounting impact (`MFG-UNV-005`); ERPNext duplicate-item response (`MFG-UNV-008`); live runtime re-verification remains post-correction QA | 2026-09-18 |

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

Corrections submitted against this review's findings and **committed as `517f2ea`** on branch
`frontend` (on top of the original package boundary `25b882e`) — see `QA_LOG.md`'s matching
2026-09-17 correction entry for developer-QA evidence. Real live-instance re-verification of
these fixes is Codex's re-review to confirm, not self-certified here per this policy's
Re-Review section. `npm run lint`, `npx tsc --noEmit`, and `npm run build` all re-run clean
after every change below, and again immediately before this commit.

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

**Remediation commit:** `517f2ea` — "fix(manufacturing): remediate Codex package review
findings". 15 files (see `git show --stat 517f2ea`): `PROGRESS.md`, `QA_LOG.md`,
`apps/frontend/README.md`, `apps/frontend/src/app/(app)/manufacturing/work-orders/actions.ts`,
`.../work-orders/[name]/page.tsx`, `.../work-orders/[name]/transfer-materials/{actions.ts,
page.tsx}`, `apps/frontend/src/components/MaterialTransferForm.tsx`,
`apps/frontend/src/lib/actions/bomLookup.ts`, `docs/backend/05-manufacturing/{work-order,
job-card,material-transfer}.md`, `docs/backend/99-unverified/unverified-behaviours.md`,
`docs/ceylon-stack-documentation.html`, `docs/operations/AI_WORK_LOG.md` (this file, committed
in the same commit up to the point before this paragraph). Not pushed to `origin/frontend` —
governance did not direct a push. Working tree was clean before staging, and only these 15
files (all already known to this review as part of the remediation scope) were staged and
committed — no unrelated or pre-existing changes included.

### Codex Re-Review — remediation `517f2ea` (2026-09-17)

Review boundary independently verified on branch `frontend`: original package `25b882e`,
remediation `517f2ea`, and coordination-only follow-up `2fbe2a6` (only this ledger changed in the
follow-up). Working tree was clean at intake. Re-review state: `CHANGES REQUIRED`.

Independent checks: `npm run lint` — PASSED; `npx tsc --noEmit` — PASSED; `npm run build` —
PASSED with the existing dynamic-route/network diagnostics and middleware deprecation warning.
No live ERPNext mutations were run.

| ID | Re-review state | Evidence / required outcome |
|---|---|---|
| `CX-MFG-001` | `PARTIALLY RESOLVED` — blocking | Header/master fields are freshly re-derived from `make_stock_entry`, but `workOrderName` remains a bound Server Function argument and is incorrectly documented as server-verified/untamperable. Next.js documents Server Functions as directly POST-callable and requires authentication/authorization inside each function. Both transfer actions accept that caller-controlled identifier without validating the current app session or authorizing the requested Work Order. In addition, per-item ceilings are applied per submitted row via an `item_code` map, so duplicate crafted rows are not aggregate-capped before Draft creation. Required: authenticate/authorize in each mutation, validate the requested Work Order identity rather than trusting `.bind`, and aggregate/reject duplicate submitted rows against the fresh preview ceiling before creating a Stock Entry; retain ERPNext submit validation as the final stock authority. |
| `CX-MFG-002` | `PARTIALLY RESOLVED` — blocking | Operations are now persisted from a fresh BOM, but the payload is not behaviorally equivalent to ERPNext's native BOM→Work Order copy. It sends only `operation`, `workstation`, and scaled `time_in_mins`; it omits at least `fixed_time`, `sequence_id` (despite the comment claiming it is carried), `workstation_type`, `batch_size`, and other native routing fields. Consequently fixed-time operations are incorrectly scaled, and routing/capacity semantics can be lost. Required: reproduce the installed ERPNext version's native operation-copy semantics/fields (prefer a native server method if available) and verify with fixed-time and quantity-scaled BOM operations. `MFG-UNV-007` cannot remain a harmless deferred uncertainty while incorrect values can be persisted. |
| `CX-MFG-003` | `RESOLVED` | Numerator now filters `jobCardsWithTemplate`, the same eligible population used by the denominator. |
| `CX-MFG-004` | `RESOLVED` | README and release-document stale Manufacturing claims were corrected; package commit references were updated. |
| `CX-MFG-005` | `NOT APPLICABLE / historical` | No authoritative prior finding with this ID exists in the original Codex findings table. The sequence jumps from `CX-MFG-004` to `CX-MFG-006`. Later Claude prose reconstructed it as handoff traceability; that is not an authoritative Codex finding. |
| `CX-MFG-006` | `RESOLVED` for frontend identity/state; `MFG-UNV-008` remains `NEEDS_VERIFICATION` | Required-material React keys and qty/warehouse state are index-scoped, so duplicate `item_code` rows no longer collapse UI state. Whether the installed ERPNext `make_stock_entry` response can contain duplicates remains unverified and non-blocking by itself. The separate aggregate-tampering defect is tracked under blocking `CX-MFG-001`. |

Remaining non-blocking uncertainties: `MFG-UNV-005` accounting/GL impact, `MFG-UNV-008`
ERPNext duplicate-row response behavior, and live-instance verification of the remediation.
Documentation cannot close while it describes the bound action argument as trustworthy and the
operation scaling as an acceptable deferred convention. Combined package release remains
`BLOCKED` and is returned to Claude; do not start the next Manufacturing package.

### Claude Re-Remediation — `CX-MFG-001` / `CX-MFG-002` second pass (2026-09-18)

Scope: only the two still-blocking findings from Codex's `517f2ea` re-review above. No new
Manufacturing package, CRM, Finance, or Master Data implementation work was started — per this
session's explicit instruction to close only this blocker. Working tree at intake had three
pre-existing uncommitted files unrelated to Manufacturing (`CLAUDE.md`,
`docs/architecture/decisions/README.md`, `docs/master-data-architecture.md` — a prior session's
Master Data architecture pass — plus two new untracked planning docs,
`docs/ceylon-stack-master-plan.md`/`docs/ceylon-stack-master-backlog.md`, from this session's own
preceding audit turn); none of these were staged, modified, or included in this package's commit.

**`CX-MFG-001` — resolved (pending Codex confirmation).** Root cause was two-fold, both inside
`transfer-materials/actions.ts`'s `buildStockEntryFields`:
1. No session re-check inside the mutating Server Function itself. Fixed by applying this app's
   own established pattern (`lib/actions/comments.ts`'s `postCommentAction`) — read the session
   cookie via `cookies()`/`verifySession` and fail closed before anything else runs.
2. No re-check that the Work Order is still eligible at submission time (only the page render had
   called `canTransferMaterials()`). Fixed by fetching the Work Order doc fresh and re-running
   `canTransferMaterials()` inside the action.
3. The per-item ceiling was applied independently per submitted row against the same full
   preview ceiling, so duplicate rows for one `item_code` could sum past it. Fixed with a running
   `remainingByItem` ledger decremented per row.
See `docs/backend/05-manufacturing/material-transfer.md`'s new `MFG-SEC-001` for the full
reasoning, including the explicit documented assumption that this app's ERPNext access is a
single shared service account (`lib/erpnext.ts`) with no per-user Frappe permission delegation —
"authorizing the Work Order" is therefore session-validity + fresh-eligibility, not a per-user
ACL this app doesn't have.

**`CX-MFG-002` — resolved (pending Codex confirmation).** Root cause: the BOM→Work Order
`operations` copy sent only 3 fields and scaled every operation's time unconditionally. Rather
than guess ERPNext's internal copy semantics (no SSH/`bench console` access this session either),
the live MCP tool `get_doctype_fields` was used to pull the real, current field schemas for both
`BOM Operation` and `Work Order Operation` directly from the running Hetzner instance. Fixed
`work-orders/actions.ts`'s `buildWorkOrderFields` to copy every field present on both doctypes
that isn't a Work-Order-lifecycle field ERPNext sets itself, and to gate `time_in_mins` scaling on
the source operation's `fixed_time` flag (present only on `BOM Operation`, confirming its sole
purpose is deciding whether time scales with quantity). `finished_good`/`bom_no` per-operation
semi-finished-goods routing was deliberately excluded — out of scope, matching this app's existing
no-multi-level-BOM-explosion boundary. See `docs/backend/05-manufacturing/work-order.md`'s
expanded Work Order Operation table and `MFG-VAL-006`, and `MFG-UNV-007` (updated) for what
remains genuinely unconfirmed (native controller override behavior, exact Desk scaling match).

**Checks run:** `npm run lint` — PASSED (clean). `npx tsc --noEmit` — PASSED (clean, no output).
`npm run build` — PASSED, exit 0 (confirmed via direct exit-code check after an initial run
through a truncating pipe falsely showed exit 1 — re-run without truncation showed the real
result); only the same pre-existing `erpnextFetch network error` static-generation diagnostics
and middleware-deprecation warning seen in every prior round, no new errors or warnings. No
automated test suite exists in this repository (`apps/frontend/package.json` has no `test`
script) — this is a pre-existing repository-wide condition, not something skipped for this
package; see the Regression coverage notes added to both `work-order.md` and
`material-transfer.md`. No live ERPNext mutation was performed this session; `get_doctype_fields`
(via the `ceylon-stack` MCP server, live against `http://62.238.22.161:8080`, confirmed via
`ping`) was used read-only, for schema lookup only.

**Files changed:** `apps/frontend/src/app/(app)/manufacturing/work-orders/[name]/transfer-materials/actions.ts`,
`apps/frontend/src/app/(app)/manufacturing/work-orders/actions.ts`,
`apps/frontend/src/lib/actions/bomLookup.ts`, `docs/backend/05-manufacturing/work-order.md`,
`docs/backend/05-manufacturing/material-transfer.md`,
`docs/backend/99-unverified/unverified-behaviours.md`, `docs/operations/AI_WORK_LOG.md`.
**Commit:** `3a04733` on branch `frontend` (recorded via a small coordination-only follow-up
edit to this ledger after the fact, matching the `517f2ea`/`2fbe2a6` precedent — the hash isn't
known until after the commit exists).

Handed back to Codex for independent re-review of `CX-MFG-001` and `CX-MFG-002` only. Not
self-declared accepted. Combined package release (Packages 2/3/5) remains gated on that review;
do not start the next Manufacturing package, Master Data implementation, CRM, or Finance work
until Codex responds.

### Codex Second Re-Review — remediation `3a04733` (2026-09-18)

Boundary independently verified on branch `frontend`: implementation commit `3a04733`, parent
`2fbe2a6`; coordination-only follow-up `d0fb4bf` changes only this ledger. The pre-existing
uncommitted `CLAUDE.md`, ADR-index, Master Data architecture, master-plan, and master-backlog work
remains outside both commits. Review state: `CHANGES REQUIRED`.

Independent checks: `npm run lint` — PASSED; `npx tsc --noEmit` — PASSED; `npm run build` —
PASSED with the existing dynamic-route/network diagnostics and middleware deprecation warning.
No automated test runner exists and no live ERPNext mutation was performed.

| ID | Second re-review state | Evidence / required outcome |
|---|---|---|
| `CX-MFG-001` | `CLOSED` | The mutating Server Function now verifies the signed app session before ERP calls, fetches the bound Work Order fresh, re-runs `canTransferMaterials`, obtains a fresh native `make_stock_entry` preview, and decrements a per-item running quantity ledger. One row, split duplicate rows, exact-ceiling totals, over-ceiling totals, forged positive rows, and stale-page submissions therefore cannot make pending-item payload quantity exceed the fresh preview ceiling before ERPNext's own final validation. Zero/negative/non-finite quantities are discarded. Live runtime exercise remains non-blocking QA evidence, not an open implementation defect. |
| `CX-MFG-002` | `OPEN` — blocking | `fixed_time` scaling is now correct for the simple top-level BOM case, and the listed routing flags/warehouses are copied. However, the manual payload still does not reproduce native ERPNext operation-copy semantics. ERPNext's native `OperationsService` selects `base_hour_rate as hour_rate` because Work Order operation costing is in company currency, while this code sends BOM Operation `hour_rate` (transaction currency). It also carries `parent as bom`; this payload omits the Work Order Operation `bom` reference. The installed schema evidence recorded in this package confirms `base_hour_rate` on BOM Operation and `bom` on Work Order Operation, so this is not merely an unknown controller override. Minimum remediation: use the installed version's native `get_items_and_operations_from_bom`/Work Order mapping path if callable through the REST boundary; otherwise reproduce its installed-version source mapping, including `base_hour_rate → hour_rate` and `parent → bom`, then live-compare fixed and scaled operations (including non-1 conversion currency) against Desk/native output. Update `work-order.md` and `MFG-UNV-007`, which currently overstate parity. |

Remaining non-blocking verification: `MFG-UNV-005` (material-transfer GL impact),
`MFG-UNV-008` (whether native preview emits duplicate item rows), and live runtime regression of
the closed material-transfer paths. Combined release remains blocked only by `CX-MFG-002` and is
returned to Claude; do not start another Manufacturing package or another module.

### Claude Final Remediation — `CX-MFG-002` only (2026-09-18, third pass)

Scope: only the single remaining blocker from Codex's second re-review above (currency mapping +
missing BOM reference). No new Manufacturing package, Job Card/BOM/Workstation/OEE work, Master
Data, CRM, or Finance work started, per this session's explicit narrow-scope instruction.
`CX-MFG-001` was not reopened or touched (Codex closed it).

Working tree at intake carried the same three pre-existing uncommitted files as the prior pass
(`CLAUDE.md`, `docs/architecture/decisions/README.md`, `docs/master-data-architecture.md`) plus
the two untracked planning docs (`docs/ceylon-stack-master-plan.md`,
`docs/ceylon-stack-master-backlog.md`) — none staged, modified, or included in this commit.

**Native-invocation investigation (required first per this package's governance instructions):**
no vendored ERPNext source and no SSH/`bench console` access exist in this session. Two plausible
native BOM→Work-Order population entry points were tested directly against the live installed
instance via authenticated read-only GET (both error before any write occurs):
`erpnext.manufacturing.doctype.work_order.work_order.get_items_and_operations_from_bom` and
`erpnext.manufacturing.doctype.bom.bom.make_work_order`. Both returned `AttributeError: module
'...' has no attribute '...'` — hard evidence from the installed Python modules themselves, not a
guess, that neither exists at those dotted paths on this install. Per the explicit instruction not
to introduce "a fragile unsupported endpoint merely to avoid manual mapping," further undocumented
method-name guessing against the production instance was judged the wrong tradeoff. **Option B
(manual parity mapping) selected.**

**`CX-MFG-002` — corrected (pending Codex confirmation).** Two fixes in
`work-orders/actions.ts`'s `buildWorkOrderFields`:
1. **Costing currency:** `hour_rate` now sources from the source `BOM Operation.base_hour_rate`
   (company currency) instead of `hour_rate` (transaction currency) — confirmed via
   `get_doctype_fields` that `Work Order Operation.hour_rate` is a plain currency-link-free
   `Float`, and `BOM Operation.base_hour_rate` is explicitly labelled "Base Hour Rate (Company
   Currency)".
2. **Missing BOM reference:** every copied operation now sets `bom: bom_no` — `Work Order
   Operation.bom` is the native target field; the source-side `BOM Operation.parent` is a Frappe
   child-table meta field (never a declared schema field, so absent from the `get_doctype_fields`
   dump), and is structurally always equal to `bom_no` for this app's non-exploded, single-BOM
   create path — live-confirmed against the one real BOM on this instance (`parent ===
   "BOM-FG-STEEL-BRACKET-ASSY-001"` on both of its operation rows).

Both real operation rows on this instance also show `hour_rate === base_hour_rate` (BOM currency
`LKR` = both companies' default `LKR`, `conversion_rate: 1.0`), so the currency fix is verified
correct by schema and live read, but not yet runtime-observable via a live Work Order create on
this instance — no BOM in a foreign transaction currency exists to exercise it. See
`docs/backend/99-unverified/unverified-behaviours.md`'s updated `MFG-UNV-007` for the full
verified-vs-unverified breakdown.

**Checks run:** `npm run lint` — PASSED (clean). `npx tsc --noEmit` — PASSED (clean, no output).
`npm run build` — PASSED, exit 0; only the same pre-existing `erpnextFetch network error`
static-generation diagnostics seen in every prior round, no new errors or warnings. No live
ERPNext mutation was performed this session — only authenticated read-only GET calls (two method
probes that errored before any write, plus one BOM detail read) against the live instance.

**Files changed:** `apps/frontend/src/app/(app)/manufacturing/work-orders/actions.ts`,
`apps/frontend/src/lib/actions/bomLookup.ts`, `docs/backend/05-manufacturing/work-order.md`,
`docs/backend/99-unverified/unverified-behaviours.md`, `docs/operations/AI_WORK_LOG.md`.

Handed back to Codex for independent re-review of `CX-MFG-002` only. Not self-declared closed —
only Codex may set that per this policy's Re-Review section. Do not start another Manufacturing
package, Master Data, CRM, or Finance work until Codex responds.
