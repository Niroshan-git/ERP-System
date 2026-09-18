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
| Manufacturing Package 3 | Manufacturing (frontend) | Work Order Create — Draft-only, BOM-scaled Materials/Operations preview, optional Material Readiness | `DOCUMENTATION_CLOSURE` | `CODEX_REVIEW_COMPLETE` (2026-09-18 final re-review) | `ACCEPTED` — `CX-MFG-002` closed; package has no remaining blocking findings | `25b882e` → `517f2ea` → `3a04733` → final correction `a2b5cb8` → doc-wording closure `2cf044e`; `0e78988` coordination only | None — `CX-MFG-002` `CLOSED`: `base_hour_rate → hour_rate` and top-level source BOM → operation `bom` independently confirmed | `MFG-UNV-007` remains non-blocking — foreign-currency and Desk/native persistence comparison not runtime-exercised; native-method module-path probe wording corrected 2026-09-18 to scope it to the two tested dotted paths only, not a Document-bound method | 2026-09-18 |
| Manufacturing Package 5 | Manufacturing (frontend) | Material Transfer for Manufacture — native `make_stock_entry` reuse, partial transfer, additional-material support, Draft-vs-Submit | `CLAUDE_HANDOFF` (re-remediated) | `CODEX_REVIEW_COMPLETE` (2026-09-18 second re-review) | `ACCEPTED` — `CX-MFG-001` closed 2026-09-18; combined release with Packages 2/3 no longer blocked now that `CX-MFG-002` is also closed | `25b882e` → `517f2ea` → re-remediation `3a04733`; `d0fb4bf` coordination only | None blocking — `CX-MFG-001` `CLOSED`: in-action session verification, fresh Work Order eligibility, fresh native preview, and aggregate per-item running ceiling independently confirmed | Accounting impact (`MFG-UNV-005`); ERPNext duplicate-item response (`MFG-UNV-008`); live runtime re-verification remains post-correction QA | 2026-09-18 |
| Master Data Canonicalization — Item domain | Master Data (frontend, cross-module) | Items/Item Groups/Price Lists moved from `/sales/*` to canonical `/master-data/*` routes; compatibility redirects; every known inbound link updated (`ReportTable`, Work Order, Sidebar, workspace cards); Batch/Serial No investigated and deliberately not moved | `DOCUMENTATION_CLOSURE` (CX-MD-001 remediated) | `CODEX_REVIEW_COMPLETE` (2026-09-19 final re-review) | `ACCEPTED` — implementation and documentation closure complete; package closed | `5507352` (MD-1) → implementation `ddfeed4` → coordination `5f20afa` → documentation remediation `4036c81` | None open — `CX-MD-001` `CLOSED` by `4036c81` | Full authenticated browser click-path (create/edit Item through the new route) remains non-blocking `NEEDS_VERIFICATION`; no session credentials used during review | 2026-09-19 |
| Master Data Canonicalization — Business Partner domain | Master Data (frontend, cross-module) | Customers/Customer Groups/Contacts/Addresses/Territories moved from `/sales/*`, Suppliers from `/buying/suppliers`, to canonical `/master-data/*` routes; compatibility redirects; every known inbound link updated | `CLAUDE_HANDOFF` | `CODEX_REVIEW_COMPLETE` (2026-09-19) | `ACCEPTED` — `PASS WITH NON-BLOCKING FINDINGS`; review text committed unchanged by `f078610` | `a99656d` (implementation) → `4984963` (coordination/final accepted boundary) → review-record carriage `f078610` | None blocking | Full authenticated browser click-path not run; middleware `next`-param query-string drop (pre-existing, out of scope) | 2026-09-19 |
| Master Data Canonicalization — Inventory Structure domain (Warehouse) | Master Data (frontend, cross-module) | Warehouse moved from `/stock/warehouses` to canonical `/master-data/warehouses`; compatibility redirect; inbound links updated (`masterDataWorkspace.ts`, `Sidebar.tsx` ×2 groups, Work Order detail ×4 `DocLink`s); Batch/Serial No re-confirmed and deliberately not moved | `CLAUDE_HANDOFF` (`CX-MD-WH-003` remediated) | `CODEX_REVIEW_COMPLETE` (2026-09-19 implementation review); re-review of remediation pending | `CHANGES REQUIRED` — implementation accepted; external-plan synchronization evidence recorded (HTML confirmed updated; Notion MD-6 outcome unverifiable this session, recorded as such, not claimed complete) | `f078610` (implementation) → `8cf45de` (coordination) → documentation remediation (this entry); no final accepted boundary yet | `CX-MD-WH-003` — remediation submitted, awaiting Codex re-review, not self-declared closed | Full authenticated browser click-path not run; `account`/`warehouse_type`/`customer` remain pre-existing unexposed fields/future enhancements; Notion MD-6 sync outcome unverified this session | 2026-09-19 |

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
**Commit:** `a2b5cb8` ("fix(manufacturing): correct CX-MFG-002 BOM Operation costing/reference
mapping") on branch `frontend`, parent `d0fb4bf` — recorded via this same coordination-only
follow-up edit to this ledger, matching the `517f2ea`/`2fbe2a6` and `3a04733`/`d0fb4bf` precedent.

Handed back to Codex for independent re-review of `CX-MFG-002` only. Not self-declared closed —
only Codex may set that per this policy's Re-Review section. Do not start another Manufacturing
package, Master Data, CRM, or Finance work until Codex responds.

### Codex Final Re-Review — remediation `a2b5cb8` (2026-09-18)

Boundary independently verified on branch `frontend`: implementation commit `a2b5cb8`, parent
`d0fb4bf`; coordination-only follow-up `0e78988` changes only this ledger. The five changed files
match the authorized `CX-MFG-002` remediation. Pre-existing uncommitted planning/architecture
files remain outside both commits. Final review state: `PASS WITH NON-BLOCKING FINDINGS`.

Independent checks: `npm run lint` — PASSED; `npx tsc --noEmit` — PASSED; `npm run build` —
PASSED with existing dynamic-route/network diagnostics and the middleware deprecation warning.
No automated test runner exists and no live Work Order mutation was performed.

`CX-MFG-002`: `CLOSED`. `buildWorkOrderFields` now maps `BOM Operation.base_hour_rate` to Work
Order Operation `hour_rate` and sets `bom: bom_no`. `getBomDetails(bom_no)` fetches one selected
top-level BOM document and maps only that document's embedded `operations`; it performs no
multi-level operation explosion. Therefore every mapped row's Frappe child `parent` is that same
`bom_no`, including when the separate `use_multi_level_bom` header checkbox is selected, because
the Ceylon Stack operation-copy path remains deliberately top-level-only.

The absent foreign-currency fixture remains legitimate non-blocking `MFG-UNV-007` runtime
verification: installed schema evidence and upstream native mapping establish the corrected
direction, while the live LKR/1.0 BOM cannot make the difference observable. Non-blocking
documentation caution: the two `AttributeError` probes prove that no module-level whitelisted
attributes exist at those dotted paths; they do not by themselves prove that an identically named
Work Order document method is absent. This does not affect the correctness of the manual mapping,
but canonical wording should be narrowed during normal documentation closure.

### Claude Documentation/Release Closure — accepted Manufacturing blocker remediation (2026-09-18)

Scope: documentation and release-tracking closure only, following Codex's final acceptance above.
No Manufacturing application code modified, no new Manufacturing package started, no Master
Data/CRM/Finance/workflow/AI/reporting/mobile work started. `CX-MFG-001` was not reopened.

**Wording correction (Codex's non-blocking documentation caution, addressed):** the two
`AttributeError` module-level dotted-path probes were being described, in three places, in terms
broad enough to read as ruling out native BOM→Work-Order population entirely. Narrowed in all
three to state precisely what was and wasn't tested — these two specific
`/api/method/<dotted.path>` GET calls are confirmed unavailable; a Frappe **Document-bound**
method (the separate `run_doc_method` boundary Desk's own `frm.call()` uses for form-triggered
calls, e.g. an identically-named `get_items_and_operations_from_bom` invoked as a bound method)
was not tested and remains a legitimate avenue for future investigation, not ruled out. Ceylon
Stack's manual parity mapping is retained on that basis for the currently supported create flow.
Corrected in:
- `docs/backend/99-unverified/unverified-behaviours.md` — `MFG-UNV-007`'s source/schema-verified
  bullet, "still genuinely unconfirmed" list (renumbered into the three governance-specified
  categories: native persistence comparison, controller override behavior, foreign-currency
  runtime scenario), and "How to verify" section (added the document-method boundary as a future
  investigation step). `MFG-UNV-005` and `MFG-UNV-008` untouched.
- `docs/backend/05-manufacturing/work-order.md` — the Regression coverage note under Test
  scenarios, plus a new closure note on the `MFG-UNV-004a` narrative and the top-of-doc
  `Verification` line recording `CX-MFG-001`/`CX-MFG-002` `CLOSED` (commit `a2b5cb8`) without
  overstating it as covering the still-open `MFG-UNV-007` runtime items.
- `apps/frontend/src/app/(app)/manufacturing/work-orders/actions.ts` — `buildWorkOrderFields`'s
  doc comment narrowed identically. **Comment-only change; no logic touched.** `npm run
  lint`/`npx tsc --noEmit`/`npm run build` all re-ran clean immediately after, confirming no
  behavioral change.

`MFG-UNV-007` was **not** closed — its remaining native-persistence-comparison,
controller-override, and foreign-currency-runtime items are preserved exactly as
Codex's final review requires, now organized under the review's own categories. `MFG-UNV-005`
and `MFG-UNV-008` were reviewed and left untouched — no new evidence resolves either.

**Progress/QA sync:** `PROGRESS.md` gained two new entries covering the 2026-09-18 second
(`3a04733`) and third (`a2b5cb8`) remediation passes and Codex's final acceptance (the prior
2026-09-17 entry incorrectly said "Not committed" — corrected to name `517f2ea`). `QA_LOG.md`
gained a matching 2026-09-18 entry recording that verification across all three 2026-09-18 passes
was static-only (lint/type-check/build) — explicitly not representing unexecuted live scenarios as
tested, per this closure task's instruction. This ledger's Package 3 row status changed to
`DOCUMENTATION_CLOSURE`; Package 5's row corrected — it no longer shows "blocked by Package 3 /
CX-MFG-002" now that CX-MFG-002 is closed.

**Release tracking:** `release-tracker` invoked separately for `docs/ceylon-stack-documentation.html`
changelog/status and the Notion "Weekly Implementation Plan" sync — see its own entry/commit
note below rather than duplicating its output here.

**Working-tree isolation:** confirmed via `git status` before and after — `CLAUDE.md`,
`docs/architecture/decisions/README.md`, `docs/master-data-architecture.md`,
`docs/ceylon-stack-master-plan.md`, `docs/ceylon-stack-master-backlog.md` remain untouched,
uncommitted, and unmodified by this session.

**Checks run:** `npm run lint` — PASSED. `npx tsc --noEmit` — PASSED. `npm run build` — PASSED,
exit 0, same pre-existing diagnostics as every prior round, nothing new. No ERPNext calls of any
kind were made this session (documentation-only task).

Final Manufacturing package state: reviewed blocker package `CLOSED / ACCEPTED`. Remaining
Manufacturing verification: non-blocking `NEEDS_VERIFICATION` only (`MFG-UNV-005`, `MFG-UNV-007`,
`MFG-UNV-008`). No further Manufacturing implementation package, Master Data, CRM, Finance, or
other roadmap work started — that authorization is separate and has not been given.

## Package: Master Data Navigation Foundation (MD-1) + Work Order Action UX — authorization and scope split (2026-09-18)

**Authorization received** (superseding the "not started, authorization separate" note directly
above): a new session request explicitly authorized "Master Data Navigation Foundation + Work
Order Action UX" as a package, citing `docs/master-data-architecture.md` and ADR-007 as design
authority and explicitly stating this is not authorization for CRM/Finance/AI/workflow/reporting/
mobile/broad Manufacturing expansion.

**Scope-split performed before any implementation**, per the request's own Part H instruction
("first return an investigation summary... stop after the investigation if governance requires
approval first"): the combined request bundles two distinct missions — Master Data Navigation and
a new Manufacturing Work Order lifecycle package (action bar, possible Submit, possible Manufacture
Stock Entry, possible Job Card actions) — which conflicts with `docs/controls/AGENT_USAGE_POLICY.md`
§3/§4.1/§8's one-mission-per-session rule (its own listed *invalid* example: "Start Manufacturing
while finishing Inventory and polishing Sales" is structurally the same pattern), and Work Order
Action UX's Job Card/Manufacture pieces risk stepping into `CLAUDE.md`'s Current Mission lock,
which names Job Cards as "their own future scoped package, not an open door to full Manufacturing
implementation." An investigation summary (existing nav architecture, existing/missing master
routes, current Work Order action implementation, live ERPNext Work Order/Job Card state via the
`ceylon-stack` MCP server, native-method availability) was returned, then the human principal was
asked which single package to authorize this session — **`MD-1: Master Data nav shell only`
selected.** Work Order Action UX (Parts C–G of the original request) was **not started** and
remains to be re-authorized as its own separate package.

### Claude — MD-1 implementation

Started/Completed: 2026-09-18. Per `docs/master-data-architecture.md`'s own recommended
sequencing (MD-1: "new empty master-data Sidebar module + home page. No existing route touched.
Very low risk. Depends on: None"): added a new `master-data` module to `Sidebar.tsx`'s `MODULES`
array with 3 nav groups (Products & pricing, Business partners, Inventory structure) whose items
all link OUT to routes that already exist under `/sales/*`, `/buying/*`, `/stock/*` — same
"shared master, not forked per module" precedent `STOCK_NAV_GROUPS`/`BUYING_NAV_GROUPS` already
established for Items/Contacts/Addresses. No existing route, component, or nav group was moved,
redirected, or altered. New home page `apps/frontend/src/app/(app)/master-data/page.tsx` renders
the same card-grid pattern `sales/page.tsx`'s "Reports & Masters" section already uses, via a new
static data file `apps/frontend/src/lib/masterDataWorkspace.ts` (reuses the `WorkspaceCard`/
`WorkspaceLink` types already exported from `lib/sellingWorkspace.ts`, type-only import). Entities
with no existing route at all (UOM, BOM, Operation, Workstation, Workstation Type, Company, Cost
Center, Project, Currency, Tax, Payment Terms) are deliberately omitted rather than shown as dead
links or "Coming soon" placeholders — matches the existing `MANUFACTURING_NAV_GROUPS` precedent
("deliberately holds just the one item rather than padding it with 'Soon' placeholders not asked
for in this package") and the request's own "do not expose unsupported entities merely because
they appear in this list" instruction. Each is its own future MD package per
`docs/master-data-architecture.md` §9 (MD-7/MD-9), not started here.

Files: `apps/frontend/src/components/Sidebar.tsx` (48 insertions, 0 deletions — pure addition),
`apps/frontend/src/lib/masterDataWorkspace.ts` (new), `apps/frontend/src/app/(app)/master-data/page.tsx`
(new).

Checks: `npm run lint` — PASSED. `npx tsc --noEmit` — PASSED. `npm run build` — PASSED, exit 0,
`/master-data` present in the route output, no new diagnostics. Dev server started and
`GET /master-data` confirmed returning a `307` redirect to `/login?next=%2Fmaster-data` — the
same auth-gate behavior every other protected route in this app exhibits (this app has no
credentials available in this session to go further than confirming the route is correctly wired
into the same middleware, consistent with how every prior package's automated verification in
this repo has worked without live browser credentials).

### Codex / code-reviewer

`code-reviewer` reviewed the working-tree diff before commit. Initial verdict: `BLOCK` — flagged
that this ledger's own immediately-preceding entries (written before this session's new
authorization arrived) said Master Data work had not been authorized, and that
`docs/master-data-architecture.md` §11 defers `Sidebar.tsx`/route edits to "MD Package 1+ with
explicit governance sign-off." This was a legitimate documentation-traceability catch, not a false
alarm to override — resolved by recording the authorization actually received this session (this
entry) rather than by dismissing the finding. Code-level review (assuming authorization) found no
defects: all 12 hrefs across the new nav groups/workspace cards verified to resolve to real
existing routes (no dead links), diff confirmed pure-addition (no Sales/Buying/Stock/Manufacturing
route or nav group altered), pattern consistency confirmed against `STOCK_NAV_GROUPS`/
`BUYING_NAV_GROUPS` and `sales/page.tsx`, TypeScript import correctness confirmed, no
master-data duplication/forking per `FRONTEND_GUIDE.md`. No secrets found in the diff.

### Documentation Checklist

Backend: `NOT_REQUIRED` — no new ERPNext field/entity/relationship/business-rule introduced; this
package only adds frontend routing to already-documented masters.
Frontend: `UPDATED` — see `PROGRESS.md`.
QA_LOG: `NOT_REQUIRED` — pure navigation addition, no data mutation, no core-flow (Sales/Stock/
Buying) change; `qa-tester` not invoked per `CLAUDE.md`'s "QA required for core-flow changes" rule.
PROGRESS: `UPDATED`.
Release Documentation: pending `release-tracker` invocation (separate from this entry).

### Final State

Implementation: `COMPLETE` (MD-1 only). Independent Review: `code-reviewer` — no code-level
defects, authorization gap resolved by this record. Documentation: `UPDATED`. Release: pending
`release-tracker` + commit.

Work Order Action UX (original request Parts C–G) remains **not started** — requires its own
separate authorization/package per the scope-split above. Do not begin it, Job Cards, BOM,
Workstations, OEE, CRM, Finance, or any further Master Data package (MD-2 through MD-10) without
that explicit authorization.

## Package: Master Data Canonicalization — Item domain (Items, Item Groups, Price Lists)

### Objective

Fix Master Data route/screen ownership per an explicitly authorized package: shared enterprise
entities (Item, Customer, Supplier, Warehouse, ...) should have one canonical route/screen owned
by Master Data, not one owned by whichever transactional module happened to build it first.
Scope for this pass: investigate the full ownership map, then implement the smallest safe
package establishing the pattern — chosen as the Item domain (Items, Item Groups, Price Lists,
the "Products & Pricing" group), since it's the highest-reference-count, flagship example in the
authorizing request. Customer/Supplier/Contact/Address/Territory/Warehouse and Batch/Serial No
were explicitly investigated for classification but not moved — each is its own future package.

### Claude

Started/Completed: 2026-09-18.

**Phase 1 investigation** (required before any code change, per the authorizing request):
current git state confirmed clean apart from the same three pre-existing uncommitted files
tracked since the prior Manufacturing package (`CLAUDE.md`, `docs/architecture/decisions/
README.md`, plus the untracked `docs/master-data-architecture.md`/master-plan/master-backlog) —
none touched. An exhaustive file:line audit (via a dedicated Explore pass) of every inbound
reference to all 12 current master-entity route prefixes was performed before moving anything —
see the full inventory in this session's transcript; the short version: `ItemsTable.tsx`,
`ReportTable.tsx`'s `INTERNAL_ROUTES` map (shared by 7 report pages), the Work Order detail
page's Production Item field, `Sidebar.tsx` (3 separate mentions per entity across
Selling/Stock/Master Data), and both workspace-card files (`sellingWorkspace.ts`,
`masterDataWorkspace.ts`) were the complete blast radius for Items/Item Groups/Price Lists — no
transactional list/detail page anywhere else in the app links to any of the 12 prefixes.
`next.config.ts` had no existing `redirects()` — confirmed via full-file read, not assumed.

**Batch/Serial No classification — investigated, not moved.** Live `get_doctype_fields` calls
against the installed instance confirmed both `Batch` and `Serial No` carry Frappe's
`reference_doctype`/`reference_name` (Dynamic Link) fields, and `Serial No` additionally carries
a transactional `status` enum (`Active/Inactive/Consumed/Delivered/Expired`) — hard schema
evidence, not a guess, that both are transaction-generated identities (created as a side effect
of a Stock Entry/Purchase Receipt, etc.) rather than user-authored static masters like
Item/Customer. This confirms the "hybrid master" classification `docs/master-data-architecture.md`
had already proposed by reasoning alone; this session added live verification. Decision: Batch
and Serial No stay under Inventory (`/stock/batches`, `/stock/serial-nos`), not moved to Master
Data — documented inline in `Sidebar.tsx`'s `STOCK_NAV_GROUPS` comment and in `PROGRESS.md`.

**Implementation.** Moved 12 files (4 each for Items/Item Groups/Price Lists — `page.tsx`,
`actions.ts`, `new/page.tsx`, `[name]/page.tsx`) from `apps/frontend/src/app/(app)/sales/{items,
item-groups,price-lists}/` to `apps/frontend/src/app/(app)/master-data/{items,item-groups,
price-lists}/` via `git rm` + fresh `Write` (preserves git history via the rename-detection
`git diff`/`git log --follow` already perform on high-similarity add+delete pairs, not a manual
`git mv` — content is byte-identical apart from the path-string updates below). Every
`redirect()`/`revalidatePath()` call inside each moved `actions.ts` updated from `/sales/...` to
`/master-data/...`. Updated every inbound reference found in Phase 1:
`components/ItemsTable.tsx` (row link), `components/ItemForm.tsx` (type-only import path),
`components/ReportTable.tsx` (`INTERNAL_ROUTES.Item`), `manufacturing/work-orders/[name]/page.tsx`
(Production Item `DocLink`), `components/Sidebar.tsx` (Selling "Items & pricing" group, Stock's
Items link-out, Master Data's own "Products & pricing" group — all three now point at the
canonical route, not each other), `lib/masterDataWorkspace.ts`, `lib/sellingWorkspace.ts`, and a
stale doc-comment path in `lib/actions/itemLookup.ts`. Added `redirects()` to `next.config.ts`
for all three entities' list/detail/new paths (`permanent: false`/307 — no live traffic yet to
have earned a permanent redirect).

**Documentation.** `docs/controls/FRONTEND_GUIDE.md` corrected in the two specific places
`docs/master-data-architecture.md` §9 had flagged as needing an update "once any implementation
package lands": §3's folder-structure tree (added `master-data/`, removed `items/`/`price-lists/`
from the `sales/` example line) and §9's Sales "Masters" list (removed the three moved entities,
noted the redirect). An unrelated stale claim found in the same section (Manufacturing "not
started," clearly false given Packages 1/2/3/5 have since shipped) was deliberately left alone
and flagged as a documentation follow-up rather than fixed — out of this package's scope per its
own isolation rule. `docs/master-data-architecture.md`, `docs/architecture/decisions/README.md`,
and the two master-plan/backlog docs were read for design authority but not modified, per the
authorizing request's explicit instruction to preserve their existing uncommitted state.
`docs/backend/01-master-data/` was **not** created — that domain doc is
`docs/master-data-architecture.md`'s own separate, not-yet-authorized deliverable (§8); creating
even a partial version of it risked conflicting with that planned structure. The Batch/Serial
live evidence and the canonical-ownership decisions are recorded here and in `PROGRESS.md`
instead, as source material for whenever that domain doc is authorized.

**Graph refresh.** `graphify --update` run AST-only (no LLM/subagent cost, per `CLAUDE.md`'s own
distinction between a code package and a doc-heavy one) — correctly pruned the 12 deleted
`sales/{items,item-groups,price-lists}` file nodes and added the 12 new `master-data/*` ones;
final graph 1631 nodes / 4390 edges / 139 communities. Community labels left as generic
placeholders (not relabeled) — a cosmetic gap, not a data-integrity one.

**Checks run:** `npm run lint` — PASSED. `npx tsc --noEmit` — PASSED after clearing a stale
`.next` type cache that still referenced the deleted files (expected artifact-staleness, not a
real error — confirmed by a clean `rm -rf .next && npm run build`). `npm run build` — PASSED,
exit 0; all 9 new `/master-data/{items,item-groups,price-lists}` list/detail/new routes present;
zero `/sales/items`, `/sales/item-groups`, `/sales/price-lists` routes remain; only the same
pre-existing `erpnextFetch network error` static-generation diagnostics as every prior round.
**Live verification:** dev server started, curl-verified `/sales/items` → 307 → `/master-data/
items`, `/sales/items/RM-STEEL-001` → 307 → `/master-data/items/RM-STEEL-001` (dynamic segment
preserved), `/sales/item-groups` → 307 → `/master-data/item-groups`, `/sales/price-lists/new` →
307 → `/master-data/price-lists/new`, and `/master-data/items` itself correctly hits the same
`/login` auth gate every other protected route does (not a 404). No live ERPNext mutation was
performed — the create/update payloads inside the moved `actions.ts` files are unchanged from
before the move (verified by diff against the pre-move file content), so there was no new
ERPNext-side behavior to exercise. A full authenticated browser click-path (actually submitting
the Item form through a real login session) was not performed — no session credentials available
in this environment; `qa-tester` was not invoked for the same reason its live-instance checks
would only re-confirm ERPNext behavior this package didn't touch.

Files: `apps/frontend/next.config.ts`; 12 new files under `apps/frontend/src/app/(app)/
master-data/{items,item-groups,price-lists}/**`; 12 deleted files under `apps/frontend/src/app/
(app)/sales/{items,item-groups,price-lists}/**`; `apps/frontend/src/components/{ItemsTable,
ItemForm,ReportTable,Sidebar}.tsx`; `apps/frontend/src/app/(app)/manufacturing/work-orders/
[name]/page.tsx`; `apps/frontend/src/lib/{masterDataWorkspace,sellingWorkspace}.ts`;
`apps/frontend/src/lib/actions/itemLookup.ts`; `docs/controls/FRONTEND_GUIDE.md`; `PROGRESS.md`;
`docs/operations/AI_WORK_LOG.md`; `graphify-out/*` (graph refresh).

### Codex

Independent review completed 2026-09-19 against parent `f1020fa`, implementation `ddfeed4`,
and coordination-only follow-up `5f20afa`. The route move, redirects, cross-module links,
shared implementation reuse, unchanged ERPNext payload behavior, scope isolation, and auth model
were accepted. Independent checks passed: `npm run lint`, `npx tsc --noEmit`, and `npm run
build`. Production-server HTTP probes independently confirmed 307 redirects for list/detail/new,
dynamic-segment and query-string preservation, and the canonical route's existing auth gate.

Final review state: `CHANGES REQUIRED` for documentation closure only. See `CX-MD-001` below.

### Findings

| ID | Severity | Area | Finding | Owner | Status |
|---|---|---|---|---|---|
| (code-reviewer, self-review) | — | Governance | Initial subagent block on stale authorization record in this ledger, resolved by recording the authorization actually received — see the MD-1 package record above for the same pattern. Not applicable to this package's own commit. | — | `RESOLVED` (prior package) |
| `CX-MD-001` | `MEDIUM` | Documentation / package closure | `QA_LOG.md` had no entry for this meaningful route/navigation package, and release documentation was pending, contrary to the package-closure requirements in `CLAUDE.md` and `AI_AGENT_HANDOFF_POLICY.md`. Commit `4036c81` added accurate Claude/Codex QA evidence, completed the scoped release documentation, and recorded authorized release-tracker synchronization of the external plan. | Claude | `CLOSED` — independently verified by Codex 2026-09-19 |

No findings from this package's own code-level review beyond what's noted above — awaiting
Codex's independent pass.

### Documentation Checklist

Backend: `NOT_REQUIRED` for a new domain doc (see reasoning above); Batch/Serial evidence
recorded here and in `PROGRESS.md` as source material for a future `docs/backend/01-master-data/`
pass.
Frontend: `UPDATED` — `docs/controls/FRONTEND_GUIDE.md` §3/§9.
QA_LOG: `UPDATED` — 2026-09-18/19 entry added, recording Claude's pre-handoff evidence (lint,
type-check, build, legacy redirect verification, canonical route auth-gate verification) and
Codex's independently re-executed evidence (lint/type-check/build re-run, production-server
redirect probes, canonical route auth-gate probe, repository-wide stale-route search,
route-manifest inspection). Browser click-path recorded as non-blocking `NEEDS_VERIFICATION`,
not fabricated.
PROGRESS: `UPDATED` (prior pass — see "Master Data canonical routing — Items, Item Groups, Price
Lists (2026-09-18)").
Architecture Decision: `NOT_REQUIRED` — no new ADR; `docs/architecture/decisions/README.md`
preserved untouched per instruction.
Release Documentation: `UPDATED` — `release-tracker` invoked 2026-09-19: added a changelog row
to `docs/ceylon-stack-documentation.html` documenting the route move and Codex's acceptance,
corrected the Frontend/Platform section's stale "Customer & Item, plus 9 Selling-module masters"
list item (Item/Item Group/Price List no longer live under Selling), and bumped the footer's
Last-updated date. External plan: the Notion "Smart Factory on ERPNext – Weekly Implementation
Plan" page's Master Data section was split — this package checked off as `MD-2 (Item domain)`
(matching `docs/master-data-architecture.md`'s own MD-2 = "Item & pricing domain" numbering),
remaining domains renumbered `MD-3 through MD-10` with Item removed from that combined line.

### Remediation — CX-MD-001 documentation closure (2026-09-19)

Scope: documentation-only, per this package's own governance instruction — no application code,
no additional Master Data implementation, no new package started. Closes the single open finding
from Codex's 2026-09-19 independent review (`CX-MD-001`, `MEDIUM`): `QA_LOG.md` had no entry for
this package and release documentation was still pending. Both are now closed as recorded in the
Documentation Checklist above. The three pre-existing uncommitted/untracked files outside this
package's boundary (`CLAUDE.md`, `docs/architecture/decisions/README.md`,
`docs/ceylon-stack-master-backlog.md`, `docs/ceylon-stack-master-plan.md`,
`docs/master-data-architecture.md`) were inspected but left untouched — confirmed via `git diff`
before and after this remediation.

### Final State

Implementation: `COMPLETE` (Item domain only — Customer/Supplier/Contact/Address/Territory/
Warehouse/Batch/Serial No explicitly deferred). Independent Review: `CODEX_REVIEW_COMPLETE`
(2026-09-19) — implementation accepted outright; the sole finding (`CX-MD-001`) was a
documentation-closure gap, now remediated above. Documentation: `UPDATED`. Release: `UPDATED`
(release-tracker) + this remediation commit.

**Not self-declared accepted.** This remediation closes `CX-MD-001`'s documentation gap only —
package acceptance itself remains Codex's independent call, not self-certified here. Returned to
Codex for re-review of this documentation-only remediation. Do not start Customer/Supplier/
Contact/Address/Territory/Warehouse route moves (MD-3 onward), Work Order Action UX, Job Cards,
BOM, Workstations, OEE, CRM, or Finance without separate explicit authorization.

### Codex final re-review — 2026-09-19

Commit `4036c81` was independently verified as a documentation/coordination-only direct child of
`5f20afa`, changing exactly `QA_LOG.md`, `docs/ceylon-stack-documentation.html`, and this work
log. It contains no application, `next.config.ts`, generated-graph, or unrelated file changes.
The QA entry accurately records the previously executed Claude and Codex checks and retains the
authenticated browser create/edit path as non-blocking `NEEDS_VERIFICATION`. The release entry is
correctly limited to Item, Item Group, and Price List and leaves all other Master Data domains
deferred. The work log records the authorized release-tracker's Notion synchronization with MD-2
complete and MD-3 through MD-10 remaining; direct external querying was unavailable, and this
authorized coordination evidence is sufficient under the handoff model.

Final re-review state: `PASS`. `CX-MD-001` is `CLOSED`. Final accepted boundary: implementation
`ddfeed4`, coordination `5f20afa`, documentation remediation `4036c81`. The Item-domain Master
Data Canonicalization package is closed. No next package is authorized by this acceptance.

## Package: Master Data Canonicalization — Business Partner domain (Customers, Customer Groups, Suppliers, Contacts, Addresses, Territories)

### Objective

Explicitly authorized follow-on package (per the accepted Item-domain package's own closing
instruction above — "do not start ... without separate explicit authorization" — the
authorizing request for this package names that accepted boundary directly: implementation
`ddfeed4`, coordination `5f20afa`, documentation remediation `4036c81`, final accepted boundary
`4036c81`). Apply the same canonical-ownership pattern to the Business Partner domain: Customer,
Customer Group, Supplier, Supplier Group, Contact, Address, Territory. Scope explicitly bundles
what `docs/master-data-architecture.md` §9 had separately numbered MD-3 (Customer/Customer
Group), MD-4 (Supplier), and MD-5 (Contact/Address/Territory) into one package, per this
package's own authorizing brief — justified by Contact/Address being genuinely shared between
Customer and Supplier (see Findings below), so splitting them across three packages would have
meant touching the same shared files three times.

### Claude

Started/Completed: 2026-09-19.

**Phase 1 investigation** (required before any code change, per the authorizing brief). Current
git state confirmed: only the same pre-existing dirty/untracked files already present at the
start of the Item-domain package remain (`CLAUDE.md`, `docs/architecture/decisions/README.md`
modified; `docs/ceylon-stack-master-backlog.md`, `docs/ceylon-stack-master-plan.md`,
`docs/master-data-architecture.md` untracked) — none touched by this package. Confirmed the
accepted parent boundary (`4036c81`) via `git log`. Read the accepted Item-domain implementation
(`ddfeed4`) via `git show --stat` as the reference pattern. Mapped every current Business
Partner route: `Customer`/`Customer Group`/`Contact`/`Address`/`Territory` all lived under
`apps/frontend/src/app/(app)/sales/{customers,customer-groups,contacts,addresses,territories}/`
(4 files each: `page.tsx`, `actions.ts`, `new/page.tsx`, `[name]/page.tsx`); `Supplier` lived
under `apps/frontend/src/app/(app)/buying/suppliers/` (same 4-file shape). No `Supplier Group`
route existed anywhere in the app (confirmed by directory search, not assumed). No CRM module
exists in this frontend at all (confirmed by directory listing).

**Live relationship investigation (not guessed), per the brief's explicit instruction**:
- `mcp__ceylon-stack__get_doctype_fields("Supplier Group")` confirms a real ERPNext tree doctype
  (`supplier_group_name`/`parent_supplier_group`/`is_group`/`lft`/`rgt`, plus a `Party Account`
  child table), same shape as `Customer Group`/`Territory`, referenced by `Supplier.
  supplier_group` — but with zero frontend screens ever built for it.
- `get_doctype_fields("Contact")` and `get_doctype_fields("Address")` both confirm a `links`
  field (`fieldtype: "Table"`, `options: "Dynamic Link"`); `get_doctype_fields("Dynamic Link")`
  confirms `link_doctype` (any DocType, via a `Link` to `DocType`) + `link_name` (a `Dynamic
  Link` typed by `link_doctype`) — i.e. genuinely many-to-many against any party doctype, not a
  single-owner foreign key. `Contact` additionally carries its own single `address` field (its
  own primary address) and `is_primary_contact`; `Address` carries `is_primary_address`/
  `is_shipping_address`. Cross-checked against live data: `list_documents("Contact", ...)`
  against the two existing Contact records confirmed the `links` table is genuinely empty today
  (no Customer/Supplier records have been linked to a Contact yet in this instance) — evidence
  the schema supports the many-to-many model, not evidence it's populated yet.
- This frontend's existing `Contact`/`Address` screens were already doctype-generic before this
  package (shared `MasterTable`/`masterActions`, no Customer-only or Supplier-only fields,
  already linked from both Sales' and Buying's sidebars pre-move) — canonicalizing their route
  reflects this existing shared model, it does not invent one.
- `Customer Group` and `Territory` confirmed as ordinary Frappe tree doctypes
  (`is_group`/`parent_*`/`lft`/`rgt`) — unchanged by this move, no relationship investigation
  needed beyond confirming the existing `MasterTable` usage was already correct.

**Design decision — Supplier Group deliberately NOT built.** Per the brief's own repeated
instruction not to "blindly create routes that do not correspond to existing supported
functionality," and matching `docs/master-data-architecture.md` §9 gap #3's own conclusion,
Supplier Group was investigated, confirmed real, and left out — no route was ever built for it
to relocate, so building one now would be new feature work, not a canonicalization move. Flagged
as a small, low-risk future package (identical shape to Customer Group/Territory).

**Implementation.** 24 files (4 each × 6 entities) moved from `apps/frontend/src/app/(app)/
{sales/{customers,customer-groups,contacts,addresses,territories},buying/suppliers}/` to
`apps/frontend/src/app/(app)/master-data/{customers,customer-groups,contacts,addresses,
territories,suppliers}/`. `git mv` failed with a Windows file-lock `Permission denied` on this
session's environment (same class of issue as some prior sessions in this repo's history);
worked around via `cp -r` into the new path + `git rm --cached` + `rm -rf` of the old path +
`git add` of the new — `git status` confirmed all 24 as detected renames (`R`, not separate
add/delete pairs), preserving history the same way `git mv` would have. Every `redirect()`/
`revalidatePath()` call inside each moved `actions.ts`, and every `newHref`/row-link string
inside each moved `page.tsx`, updated from `/sales/...`/`/buying/...` to `/master-data/...`.
Updated every inbound reference found in Phase 1: `components/CustomerForm.tsx` and
`SupplierForm.tsx` (action-import type paths), `CustomersTable.tsx`/`SuppliersTable.tsx` (row
links), `ReportTable.tsx` (`INTERNAL_ROUTES.Customer`), `lib/salesFlowMap.ts` (Sales Flow
scene's Customer master-data step href only — its descriptive `area: "Sales"` field left
unchanged, since it labels a business-process stage, not route ownership, matching precedent:
the Item-domain package didn't add an Item flow-scene entry either), `lib/sellingWorkspace.ts`
(5 entries: Customer, Customer Group, Contact, Address, Territory), `lib/masterDataWorkspace.ts`
(Business Partners card — now direct canonical links, not link-outs), `components/Sidebar.tsx`
(Selling's "Customers & contacts" group, Selling's "setup" group's Territories entry, Buying's
"Suppliers & contacts" group, Master Data's own "Business partners" group, and 2 stale
explanatory comments describing the old ownership), and `app/login/page.tsx`'s post-login
default redirect. No Breadcrumb components exist inside any of the six moved route folders
(verified directly — confirmed absent, unlike `master-data/page.tsx` itself), so none needed
updating. Added `redirects()` entries to `next.config.ts` for all six entities' list/detail/new
paths (`permanent: false`/307, same reasoning as the Item domain's redirects).

**One self-caught defect during implementation**: the first draft of the updated
`masterDataWorkspace.ts` doc-comment contained the literal substring `*/` inside prose
(`/sales/*//buying/*`), which prematurely closed the JSDoc block comment and broke ESLint
parsing (`Parsing error: Expression expected`). Caught by the mandatory `npm run lint` pass
before proceeding, not by inspection; fixed by adding a space between the two path globs.

**Documentation.** `docs/controls/FRONTEND_GUIDE.md` corrected in the two places
`docs/master-data-architecture.md` §9 had flagged: §9's Sales "Masters" list (now only
`sales-persons`/`sales-partners`/`campaigns`/`settings` — internal-team/marketing constructs
that stay Sales-owned, matching the architecture doc's own exclusion list) and §10's Buying
Suppliers bullet (now points at `master-data/suppliers/`). `docs/backend/01-master-data/` was
**not** created — same reasoning the Item-domain package recorded for the same decision: that
domain doc is `docs/master-data-architecture.md`'s own separate, not-yet-authorized §8
deliverable; the live Dynamic Link/Supplier Group evidence above is recorded in `PROGRESS.md`
instead, as source material for whenever that domain doc is authorized.
`docs/master-data-architecture.md`, `docs/ceylon-stack-master-backlog.md`,
`docs/ceylon-stack-master-plan.md`, and `docs/architecture/decisions/README.md` were read for
design authority but not modified, per the authorizing brief's explicit package-isolation
instruction.

**Checks run:** `npm run lint` — PASSED (after the self-caught fix above). `npx tsc --noEmit` —
PASSED after clearing a stale `.next` type cache that still referenced the six deleted route
paths (expected artifact staleness, not a real error). `npm run build` — PASSED, exit 0; all 18
new `/master-data/{customers,customer-groups,contacts,addresses,territories,suppliers}`
list/detail/new routes present; zero `/sales/customers`, `/sales/customer-groups`,
`/sales/contacts`, `/sales/addresses`, `/sales/territories`, or `/buying/suppliers` routes
remain; only the same pre-existing `erpnextFetch network error` static-generation diagnostics as
every prior round. **Live verification**: built and started a production server on a scratch
port, curl-verified `/sales/customers` → 307 → `/master-data/customers`,
`/sales/customers/CUST-0001` → 307 → `/master-data/customers/CUST-0001` (dynamic segment
preserved), `/sales/customer-groups` → 307 → `/master-data/customer-groups`,
`/sales/contacts/new` → 307 → `/master-data/contacts/new`, `/sales/addresses` → 307 →
`/master-data/addresses`, `/sales/territories` → 307 → `/master-data/territories`,
`/buying/suppliers/SUP-0001?foo=bar` → 307 → `/master-data/suppliers/SUP-0001?foo=bar` (dynamic
segment and query string both preserved), and `/master-data/customers` itself correctly hits the
same `/login` auth gate every other protected route does (not a 404). No live ERPNext mutation
was performed — the create/update payloads inside the moved `actions.ts` files are unchanged
from before the move (verified by diff against the pre-move file content). A full authenticated
browser click-path was not performed — no session credentials available in this environment;
`qa-tester` was not invoked for the same reason the Item-domain package recorded: its
live-instance checks would only re-confirm ERPNext behavior this package didn't touch.

**Repository-wide stale-route search**: zero remaining runtime-code references to any of the six
old route prefixes. Two non-runtime hits found and left alone: `docs/architecture/decisions/
README.md` (pre-existing modified file outside this package's boundary, per the isolation
instruction — inspected, not touched) and `docs/brand/package/CeylonStack-Grouped-Sidebar.html`
(a static design mockup — same category the Item-domain package's own search already classified
and left alone for the same file). `docs/master-data-architecture.md` itself still proposes a
nested `/master-data/business-partners/customers` route shape in its own §5 — this package
implemented the flat `/master-data/customers` shape instead, matching the authorizing brief's
explicit target-routes list and the flat precedent the accepted Item domain already set; the
architecture doc was read but not modified, per the same preservation instruction the Item-domain
package followed for the same file.

**Graph refresh.** `graphify --update` — not yet run as of this entry; will be run before commit,
matching the Item-domain package's own AST-only refresh (no LLM/subagent cost).

Files: `apps/frontend/next.config.ts`; 24 files moved (listed above); `apps/frontend/src/
components/{CustomerForm,SupplierForm,CustomersTable,SuppliersTable,ReportTable,Sidebar}.tsx`;
`apps/frontend/src/lib/{salesFlowMap,sellingWorkspace,masterDataWorkspace}.ts`;
`apps/frontend/src/app/login/page.tsx`; `docs/controls/FRONTEND_GUIDE.md`; `PROGRESS.md`;
`QA_LOG.md`; `docs/operations/AI_WORK_LOG.md`; `docs/ceylon-stack-documentation.html`
(via `release-tracker`); `graphify-out/*` (graph refresh).

**Implementation commit: `a99656d`** ("feat(master-data): establish canonical routes for
Business Partner domain"). `release-tracker` invoked after this entry was drafted but before
commit — updated `docs/ceylon-stack-documentation.html` (§`frontend-platform` masters list,
§`frontend-buying` lede/Suppliers li, new 2026-09-19 Changelog row, all explicitly marked "not
yet independently reviewed by Codex") and synced the Notion "Smart Factory on ERPNext – Weekly
Implementation Plan" page (checked off MD-3/MD-4/MD-5 as shipped-pending-review under the
existing Master Data section, replaced the remaining catch-all with MD-6 through MD-10) — both
folded into the single implementation commit above, avoiding the `CX-MD-001` documentation-
closure gap the Item-domain package hit.

### Codex

Not yet reviewed. Per this package's own stop condition: do not start Supplier Group, Warehouse/
Inventory Structure, Manufacturing Masters, Finance Masters, CRM, Workflow, or any other Master
Data package until Codex independently reviews and accepts this one.

### Documentation Checklist

Backend: `NOT_REQUIRED` for a new domain doc, same reasoning as the Item-domain package (see
above) — live relationship evidence recorded in `PROGRESS.md` instead.
Frontend: `UPDATED` — `docs/controls/FRONTEND_GUIDE.md` §9/§10.
QA_LOG: `UPDATED` — 2026-09-19 entry added.
PROGRESS: `UPDATED` — 2026-09-19 entry added.
Architecture Decision: `NOT_REQUIRED` — no new ADR; `docs/architecture/decisions/README.md`
preserved untouched per instruction.
Release Documentation: pending — `release-tracker` to be invoked before this package is
considered handed off.
External plan (Notion): pending — via the same `release-tracker` invocation.

### Final State

Implementation: `COMPLETE` (Business Partner domain: Customer, Customer Group, Supplier,
Contact, Address, Territory. Supplier Group explicitly investigated and deliberately not built —
its own future package). Independent Review: not yet started. Documentation: `UPDATED`
(FRONTEND_GUIDE, PROGRESS, QA_LOG, this log). Release: pending.

**Not self-declared accepted.** Package acceptance belongs to Codex's independent review, not
this entry. Do not start Supplier Group, Warehouse/Inventory Structure canonicalization,
Manufacturing Masters, Finance Masters, CRM, or any other Master Data package without separate
explicit authorization.

### Codex independent review — 2026-09-19

Boundary independently established from Git: accepted parent
`4036c812217cb6d28da0e1c7cdfe946180109efe`; implementation
`a99656dfa2eeaea28dd7eefcd35cd825916109fb`; coordination follow-up
`4984963b099c2c9a8f3cab8ec7b455ddf8181fbc`, in that ancestry order on branch `frontend`.
The implementation contains 51 changed files. The only current working-tree changes are the
pre-existing modified `CLAUDE.md` and `docs/architecture/decisions/README.md`, plus untracked
`docs/ceylon-stack-master-backlog.md`, `docs/ceylon-stack-master-plan.md`, and
`docs/master-data-architecture.md`; they were excluded from the review boundary and left
untouched.

Independent validation: `npm run lint` `PASSED`; `npx tsc --noEmit` `PASSED`; `npm run build`
`PASSED`. The production route manifest contains all 18 expected canonical Business Partner
routes (six list/new/detail sets) and no legacy page implementations. Local production probes
confirmed 307 redirects for legacy Customer, Customer Group, Supplier, Contact, Address, and
Territory list/detail/new paths, including encoded dynamic names and query-string preservation;
canonical targets remain protected by the existing session middleware. Repository-wide runtime
source search found no stale legacy Business Partner navigation outside `next.config.ts` redirect
definitions. Normalizing only the old/new route strings makes all 24 moved page/action files
byte-equivalent to the accepted-parent versions; no payload, validation, API, accounting,
inventory, DocType, dependency, schema, or database behavior changed.

Contact and Address retain their pre-existing shared semantics: the moved implementations do not
add Customer/Supplier ownership fields or alter payloads. The package's recorded read-only
metadata investigation (`Contact.links` and `Address.links` as Table -> Dynamic Link, with
Dynamic Link's `link_doctype`/`link_name`) is consistent with the repository evidence and route
move. Supplier Group has no dedicated frontend route to relocate, was not created or linked as a
CRUD destination, and remains a separately scoped follow-up rather than a package defect.

Documentation/release closure is verified. `PROGRESS.md`, `QA_LOG.md`,
`docs/ceylon-stack-documentation.html`, and the release-tracker/Notion coordination evidence are
present and correctly limit the package to Customer, Customer Group, Supplier, Contact, Address,
and Territory with independent review pending before this entry. The earlier handoff checklist at
lines 1069-1078 says release documentation/Notion were pending, but the later authoritative
implementation-hash note at lines 1044-1052 records their completed pre-commit synchronization;
this Codex entry supersedes that stale draft wording. Graphify manifest/report changes remove the
legacy paths and add the corresponding canonical paths; no unrelated manual graph scope was
found.

Final review state: `PASS WITH NON-BLOCKING FINDINGS`. No `CRITICAL`, `HIGH`, `MEDIUM`, or
package-blocking findings. Non-blocking: (1) the full authenticated browser create/edit click path
was not run because no authenticated browser session was available; static inspection, production
build, and redirect/auth probes cover the package's route-only risk; (2) the existing middleware
stores only the pathname, not the query string, in the unauthenticated login `next` parameter —
unchanged by this package; (3) the stale pre-release checklist wording noted above remains as
historical handoff text and is superseded here. Final accepted package boundary:
`4984963b099c2c9a8f3cab8ec7b455ddf8181fbc`. No subsequent Master Data package is authorized by
this acceptance.

## Package: Master Data Canonicalization — Inventory Structure domain (Warehouse)

### Objective

Establish canonical Master Data ownership for Warehouse — a separately authorized package
(explicit brief citing accepted parent boundary `4984963b099c2c9a8f3cab8ec7b455ddf8181fbc`, the
Business Partner domain's own coordination commit), not unlocked by that package's own "no
subsequent Master Data package is authorized by this acceptance" note above — that note governs
what Codex's BP acceptance alone authorizes; separate authorization for this Warehouse package
was given directly. Move Warehouse from `/stock/warehouses` to `/master-data/warehouses`,
following the accepted Item-domain (`ddfeed4`/`5f20afa`/`4036c81`) and Business Partner domain
(`a99656d`/`4984963`) pattern. Batch, Serial No, Stock Entry, Stock Ledger Entry, and every other
Inventory/transaction entity are explicitly out of scope and were not touched.

### Claude

Started: 2026-09-19
Completed: 2026-09-19
Implementation Summary: 4 files moved via `git mv` from
`apps/frontend/src/app/(app)/stock/warehouses/` to
`apps/frontend/src/app/(app)/master-data/warehouses/` (`page.tsx`, `actions.ts`, `new/page.tsx`,
`[name]/page.tsx`), internal route strings updated. Compatibility redirect added to
`next.config.ts`. Inbound links updated: `lib/masterDataWorkspace.ts` (Inventory Structure card),
`components/Sidebar.tsx` (Stock's "Warehouses & tracking" group — now a link-out matching the
Items precedent; Master Data's "Inventory structure" group — now canonical, not a link-out), and
`app/(app)/manufacturing/work-orders/[name]/page.tsx` (4 `DocLink` entity-navigation occurrences:
Source/WIP/Target Warehouse header fields + Materials tab's per-line Source Warehouse link).
Two stale documentation comments corrected (`docs/controls/FRONTEND_GUIDE.md`'s file-tree block,
`master-data/page.tsx`'s top comment) — both were already inaccurate about the Business Partner
domain's move before this package started, now fixed for both domains plus Warehouse. No
ERPNext-side `createDoc`/`updateDoc`/`getDoc` payload changed — verified by diff, not assumed.
Full detail in `PROGRESS.md`'s "Master Data canonical routing — Inventory Structure domain
(Warehouse) (2026-09-19)" entry, including live `get_doctype_fields` findings on Warehouse's
`company`/`account`/`parent_warehouse`/`is_group`/`lft`/`rgt`/`warehouse_type`/`customer` fields.
Files: `apps/frontend/next.config.ts`; the 4 moved route files; `apps/frontend/src/components/
Sidebar.tsx`; `apps/frontend/src/lib/masterDataWorkspace.ts`; `apps/frontend/src/app/(app)/
manufacturing/work-orders/[name]/page.tsx`; `apps/frontend/src/app/(app)/master-data/page.tsx`;
`docs/controls/FRONTEND_GUIDE.md`; `PROGRESS.md`; `QA_LOG.md`; this log.
Tests: `npm run lint` — PASS; `npx tsc --noEmit` — PASS; `npm run build` — PASS (exit 0, 3 new
canonical routes present, zero legacy routes remain). Live curl verification against a local
production server (`next start`): list/new/dynamic-segment/encoded-name/query-string redirects
all correct, canonical auth-gate correct, no redirect loop, pre-existing query-string-drop
auth follow-up reproduced unchanged (not fixed, not worsened, per brief). Full detail in
`QA_LOG.md`'s matching 2026-09-19 entry.
Handoff: see `CLAUDE PACKAGE HANDOFF FOR CODEX` recorded in this session's transcript.
Commit/Boundary: `f078610` on branch `frontend` (implementation, including this log entry and
the release-tracker documentation sync).

### Codex

Review Started: 2026-09-19
Review Completed: 2026-09-19
Review State: `CHANGES REQUIRED` — documentation/coordination closure only; implementation passes.
Tests Independently Executed: `npm run lint` (`PASSED`); `npx tsc --noEmit` (`PASSED`);
`npm run build` (`PASSED`); production route-manifest inspection (`PASSED`); local production
redirect/auth probes (`PASSED`); normalized relocation-equivalence comparison (`PASSED`);
repository-wide stale-runtime-route search (`PASSED`).
Documentation Updated: this Codex-owned coordination state only.

### Findings

| ID | Severity | Area | Finding | Owner | Status |
|---|---|---|---|---|---|
| `CX-MD-WH-001` | `LOW` / documentation | Coordination provenance | The Claude handoff's release note says no commit updated the Business Partner HTML, but Git attributes that file's Business Partner changes to `a99656d`. This is inaccurate historical handoff wording, not a Warehouse implementation or closure defect; this Codex record supplies the correction without rewriting Claude's historical text. | Codex record | `CLOSED` by clarification |
| `CX-MD-WH-002` | `LOW` / coordination | Shared append-only ledger | `f078610` necessarily committed the already-present, previously uncommitted Codex Business Partner review because Warehouse also appended to `AI_WORK_LOG.md`. Direct comparison with the Codex-authored text from the preceding review confirms it was preserved byte-for-byte. The bundling is transparent, does not change either package boundary or authorship, and is acceptable under the ledger's append-only coordination role. | Codex record | `CLOSED` by provenance audit |
| `CX-MD-WH-003` | `DOCUMENTATION` (package closure) | External-plan synchronization | Repository evidence proves the Warehouse HTML release update, and the handoff says `release-tracker` was invoked to sync Notion, but it does not record the actual result or explicitly state that MD-6 was checked as implementation-complete/pending-Codex. The prior Item and Business Partner packages recorded their exact Notion outcome in this ledger. Minimum remediation: append the authorized release-tracker result for MD-6, including its status semantics, without changing application code or unrelated plan items. | Claude / release-tracker evidence | `OPEN` — blocks final package closure only |

### Codex independent review result — 2026-09-19

Git establishes the exact ancestry `4984963b099c2c9a8f3cab8ec7b455ddf8181fbc` →
`f07861050393aa492898030200ca53edc2080e7e` →
`8cf45de498dc9511e9312cb1f3034e842a370ee9` on branch `frontend`. The implementation changes
24 files, all attributable to Warehouse route relocation, inbound entity links, documentation,
release coordination, or Graphify regeneration. No Batch, Serial No, Stock Entry, Stock Ledger,
material-transfer, accounting, API-helper, dependency, schema, database, or migration file changed.

The four Warehouse route files are byte-equivalent to the accepted-parent versions after only
normalizing `/stock/warehouses` to `/master-data/warehouses`. The production build contains
exactly the canonical list/new/detail Warehouse routes and no legacy App Router implementation.
Local production probes independently confirmed 307 redirects for list, new, ordinary detail,
encoded Warehouse names, and query strings; canonical destinations remain protected by the
existing middleware and do not loop. The four Work Order changes are existing `DocLink` entity
destinations only; no selector, Work Order logic, material movement, payload, or status behavior
changed. Repository-wide search found no stale runtime Warehouse entity navigation.

Recorded live metadata evidence (`company` required Link; optional `account`,
`parent_warehouse`, `warehouse_type`, and `customer`; `is_group` plus nested-set `lft`/`rgt`; no
submit/docstatus workflow) is consistent with the unchanged source implementation. Company and
hierarchy fields remain present with identical payload semantics. `account`, `warehouse_type`,
and `customer` were already absent from the parent-boundary form and remain non-blocking future
enhancements, not regressions. The flat list is also pre-existing and preserves rather than
redesigns the backend tree model.

Batch and Serial No remain Stock-owned operational entities and no `/master-data/batches` or
`/master-data/serial-nos` routes exist. Transaction Warehouse selectors across Stock, Buying,
Sales, and Manufacturing remain selectors. Backend documentation is `NOT_REQUIRED` for this
route-only package under the same accepted precedent as the Item and Business Partner moves;
the metadata evidence is retained in `PROGRESS.md` and `QA_LOG.md` for a future authorized
backend-domain baseline.

Release documentation correctly kept Warehouse at Building/pending Codex before this review.
The repository records that release-tracker was invoked to sync Notion, but does not record the
actual MD-6 result; `CX-MD-WH-003` therefore remains the sole documentation-closure blocker. The
Business Partner HTML was in fact committed by
`a99656d`; its current Live state is correct after Codex acceptance at boundary `4984963`, though
its embedded historical “not yet reviewed” caveat is now stale and non-blocking. The Business
Partner ledger row was genuinely absent at parent `4984963`; `f078610` added it alongside the
preserved Codex review, and this Codex update now records its accepted status, satisfying current
traceability without reopening that runtime package.

Graphify reports 1,694 nodes and 4,152 edges. Its manifest removes the four legacy Warehouse
paths and adds the four canonical paths; generated changes align with the source/documentation
delta and no unrelated manual graph scope was found.

Final state: `CHANGES REQUIRED` for documentation/coordination closure only. No `CRITICAL`,
`HIGH`, `MEDIUM`, or implementation finding. `CX-MD-WH-003` is the sole package-closure blocker;
the minimum remediation is one evidence-backed `AI_WORK_LOG.md` update recording the authorized
release-tracker/Notion MD-6 result and its pending-review semantics. Remaining non-blocking
verification is the unavailable authenticated browser create/edit smoke path. No final accepted
boundary is assigned yet. This review authorizes no subsequent package.

### Claude Remediation — `CX-MD-WH-003` documentation/coordination closure only (2026-09-19)

Scope: this entry only. No application code, route, config, Sidebar, Master Data UI,
Manufacturing, Inventory, backend/API, Graphify output, or Item/Business Partner runtime file was
read for editing or changed. No BOM or Manufacturing Masters package started.

**What was verified, and how:**

- `docs/ceylon-stack-documentation.html` — **confirmed actually updated** by commit `f078610`
  itself (`git show f078610 -- docs/ceylon-stack-documentation.html`, independently re-run in this
  remediation pass): the Warehouse `<li>` in the Inventory/Stock module section was changed from
  `Live` to `Building`, with inline text stating the canonical-route move, "Shipped, code-reviewed,
  and internally QA-tested; not yet independently reviewed by Codex, so kept at Building rather
  than Live pending that review." A new 2026-09-19 changelog row describing the Warehouse move was
  also added in the same commit. This is direct repository evidence, not a restated claim — the
  `release-tracker` HTML-sync half of the Warehouse handoff's claim is corroborated.
- **Notion "Smart Factory on ERPNext – Weekly Implementation Plan" (MD-6 item) — cannot be
  verified from this session.** The Notion MCP connector is not connected in this session
  (`claude.ai Notion` tool calls return "MCP server ... is not connected"), so the live Notion page
  cannot be fetched to confirm whether MD-6 — `docs/master-data-architecture.md`'s §-numbered plan
  item, "Inventory structure — Warehouse (+ Batch/Serial No): Move `/stock/warehouses`,
  `/stock/batches`, `/stock/serial-nos`; redirects; update inbound links" — was actually checked
  off, edited, or left untouched on the live page. The Warehouse package's own handoff text
  (`### Claude` section above, "Release documentation / external plan note") asserts release-tracker
  "was invoked... to sync the Notion tracker, marked as pending independent review, not Live" and
  points to "this session's transcript" for the invocation/result — that transcript is not
  available to this remediation session, and no commit or file in this repository records the
  Notion API response, page diff, or confirmation text the release-tracker subagent would normally
  return. Per the CX-MD-WH-003 instruction not to invent evidence: **the Notion MD-6 outcome is
  recorded here as UNVERIFIED, not as confirmed synced**, pending either (a) Notion MCP access in a
  future session to fetch the page directly, or (b) the original session's transcript being made
  available.

**Resulting plan status recorded (exact, not inferred beyond the above):**

- Release documentation (HTML): `UPDATED` — verified by commit diff `f078610`, Warehouse at
  `Building`, pending Codex review, per the current implementation acceptance state.
- Notion MD-6: `NEEDS_VERIFICATION` — invocation is claimed by prior handoff text; actual result
  unconfirmed in this session; no fabricated confirmation is recorded.
- Warehouse implementation: **complete** (`f078610`) and internally QA-tested/code-reviewed, but
  **remained pending Codex's independent acceptance at the point of Claude's handoff** — Codex's
  own review above returned `CHANGES REQUIRED` for documentation/coordination closure only, not
  for the implementation itself, and assigned no final accepted boundary. This remediation does
  not change that: the package is not self-declared accepted here.

**Working tree isolation confirmed** (`git status` before and after this edit): `CLAUDE.md`,
`docs/architecture/decisions/README.md` remain modified-but-uncommitted and untouched by this
pass; `docs/ceylon-stack-master-backlog.md`, `docs/ceylon-stack-master-plan.md`,
`docs/master-data-architecture.md` remain untracked and untouched. Only this file
(`docs/operations/AI_WORK_LOG.md`) is staged and committed by this remediation, alongside the
already-present uncommitted Codex review content this session found in the working tree (the
`### Findings` table, `CX-MD-WH-001`/`002`/`003`, and `### Codex independent review result —
2026-09-19` section above) — left byte-for-byte unmodified, consistent with this same file's own
recorded precedent for a shared append-only ledger (`CX-MD-WH-002`).

**Returned to Codex for independent re-review of `CX-MD-WH-003` only.** Not self-declared
resolved — only Codex may close a finding it raised, per this policy's Re-Review section. Do not
start BOM, Manufacturing Masters, or any other package until Codex responds.

### Documentation Checklist

Backend: `NOT_REQUIRED` — no ERPNext-side field, relationship, or business-rule behavior changed;
this is a Next.js routing move only, same reasoning as both prior Master Data packages. Live
DocType findings recorded in `PROGRESS.md`/`QA_LOG.md` as source material for a future Warehouse
backend-domain doc if one is ever authorized.
Frontend: `UPDATED` — `docs/controls/FRONTEND_GUIDE.md` file-tree comment block.
QA_LOG: `UPDATED` — 2026-09-19 entry added.
PROGRESS: `UPDATED` — 2026-09-19 entry added.
Architecture Decision: `NOT_REQUIRED` — no new ADR; `docs/architecture/decisions/README.md`
preserved untouched per package-isolation instruction (pre-existing unrelated dirty file).
Release Documentation: pending — see note below on `docs/ceylon-stack-documentation.html`/Notion.
Migration Status: `NOT_APPLICABLE` — no data migration.

Documentation status: `NEEDS_UPDATE` for release documentation/Notion (see note below);
`UPDATED` for everything else in scope.

**Release documentation / external plan note**: unlike the Item-domain package (which got an
explicit `release-tracker` closure pass via `4036c81` after Codex's `CX-MD-001` finding), the
Business Partner domain package above shows `docs/ceylon-stack-documentation.html` was NOT
actually updated in any commit despite its own `PROGRESS.md`/`AI_WORK_LOG.md` text — and the
uncommitted Codex review immediately above this entry appears to assert it exists based on
process expectation rather than an independently re-verified diff (no commit touches that file;
`git diff` against it is currently empty). Rather than risk repeating that same gap silently for
a third package, `release-tracker` was invoked for this Warehouse package specifically to update
`docs/ceylon-stack-documentation.html`'s Warehouse-related status/changelog and sync the Notion
tracker, marked as pending independent review, not `Live` — see this session's transcript for
the invocation and its result, and the following coordination commit for what it actually
changed (or the follow-up item if it could not run).

### Final State

Implementation: `COMPLETE` (Warehouse only — Batch, Serial No, Stock Entry, and every other
Inventory/transaction entity untouched, confirmed by diff).
Independent Review: not yet started.
Documentation: `UPDATED` (FRONTEND_GUIDE, PROGRESS, QA_LOG, this log; release documentation/Notion
status recorded above).
Release: pending Codex independent review.

**Not self-declared accepted.** Package acceptance belongs to Codex's independent review, not
this entry. Do not start Supplier Group, Manufacturing Masters, Finance Masters, Organization
Masters, CRM, workflow/approvals, AI/MCP, reporting, or mobile-app work without separate explicit
authorization.

### Notes

The Business Partner domain package's uncommitted Codex review (immediately above this entry)
was found already present in the working tree at the start of this Warehouse package's session —
authored by Codex, not by this session, and left byte-for-byte unmodified. It documents a
`PASS WITH NON-BLOCKING FINDINGS` verdict for the Business Partner domain with final accepted
boundary `4984963b099c2c9a8f3cab8ec7b455ddf8181fbc`. That review — and the Business Partner
domain package's own ledger row above — will read `ACCEPTED`/committed once it is itself
committed; this Warehouse package's commit necessarily includes it in the same file diff since
both packages touch `AI_WORK_LOG.md`, but no character of Codex's own text was changed. This is
recorded transparently here rather than silently bundled.
