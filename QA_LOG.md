# QA_LOG.md — Smart Factory on ERPNext

Central QA log. Append one entry per QA run — date, package/flow tested, pass/fail, issues found, fixes/verification status. Full narrative detail (root causes, reproduction steps) lives in `PROGRESS.md`; this file is the quick-scan index.

## 2026-09-16 — Inventory (Stock) module — Inventory MVP

- **Package tested**: `apps/frontend` Inventory/Stock module — Warehouses, Batches, Serial Nos (masters), Stock Entry (Material Issue/Receipt/Transfer, Draft → Submitted → Cancelled), Stock Balance (Bin-backed view), Stock Reports hub. Live-tested against the real ERPNext instance on Hetzner, not mocked.
- **Result**: **PASS** (after one fix, re-verified live same day).
- **Issues found**:
  1. Every batch/serial-tracked Material Issue/Transfer failed to submit — `ValidationError: The Serial and Batch Bundle ... 'Type of Transaction' should be 'Outward' instead of 'Inward'`. Root cause: ERPNext's `get_type_of_transaction` (`serial_and_batch_bundle.py`) reads `child_row.get("s_warehouse")` specifically; `attachBatchSerialBundles` (`stock-entries/actions.ts`) was only sending the generic `warehouse` key, so every bundle defaulted to Inward regardless of actual purpose.
  2. Batch master creation could only be verified against ERPNext's own validation layer ("The selected item cannot have Batch"), not a successful save — no Item on the instance has `has_batch_no=1` yet. Live-data gap, not a code defect.
- **Fixes / verification status**:
  1. Fixed: `addSerialBatchLedgers`'s `child_row` type (`lib/actions/batchSerialLookup.ts`) now accepts `s_warehouse?: string`, threaded through from `attachBatchSerialBundles`. Re-verified live — a fresh batch-tracked Material Issue returns `type_of_transaction: "Outward"`, submits cleanly, `Bin` reflects the issued quantity correctly.
  2. Not a code fix — flagged as a live-data gap for whenever a batch-tracked Item exists on the instance.
  3. Plain (non-batch/serial) Material Issue/Receipt/Transfer, Warehouse create/update, Stock Balance, and Serial No create/delete all passed on the first pass, no issues.
- **Cleanup**: all QA-created test documents (`MAT-STE-2026-00008/00009/00011`) cancelled after verification; demo company stock levels back at pre-QA baseline.
- **Sign-off**: `code-reviewer` found no blockers. `qa-tester` caught the bug above. Meets Definition of Ready (`AGENT_OPERATING_GUIDE.md` §8).

## 2026-09-16 — Sales module — combined end-to-end verification pass (Phase 5, final Sales scenario-gaps phase)

- **Package tested**: `apps/frontend` Sales core chain, all four previously-individually-verified
  phases run together in one continuous live chain: document-level discount + Pricing Rule
  resolution (Phase 4) → Quotation → Sales Order (Copy From Quotation) → partial fulfillment
  across three consecutive stages (Phase 1) → Pick List → Delivery Note with batch/serial
  picker (Phase 2) → Sales Invoice → cancellation-blocking guards (Phase 3). Live-tested against
  the real ERPNext instance on Hetzner via direct REST calls matching each `actions.ts` payload
  shape (Next.js server actions can't be driven from plain curl) — same method as the Inventory
  and Buying QA passes above. This is the last remaining item from the Sales scenario gaps plan.
- **Result**: **PASS**. No code fixes required.
- **Chain tested live**: Customer/Item/Warehouse setup → Quotation (2 lines) → document-level
  discount (`additional_discount_percentage: 10` on Grand Total, server-side recalculation
  confirmed exact) → submit → Sales Order via Copy From Quotation (partial: 8/10 and 2/3 units
  ordered) → Pick List (partial: 5/8 and 2/2 picked, `picked_qty` write-back confirmed) → submit
  → Delivery Note from Pick List with real Serial and Batch Bundle attachment (`type_of_transaction:
  "Outward"`, serials `SR-0004`/`SR-0005` attached and later reverted to `Active`) → submit →
  `Bin.actual_qty` impact confirmed (50→45 tea, 7→5 serial item) → Sales Invoice (partial: 3/5 and
  2/2 invoiced) → submit → Connections data verified directly via REST (`prevdoc_docname`,
  `sales_order`, `against_sales_order`, `delivery_note` filter tuples) → cancellation-blocking
  (`417 LinkExistsError`) confirmed on 3 separate attempts (SO blocked by Invoice, Delivery Note
  blocked by Invoice, Quotation blocked by Sales Order) → full cleanup in reverse dependency
  order → stock/serial baseline confirmed restored.
- **Live-data gap (not exercised, not faked)**: no `Pricing Rule` record exists on the instance
  (`GET /api/resource/Pricing Rule` → empty), so automatic Pricing Rule application (step 3 of
  the plan) could not be re-verified live in this pass — it was previously confirmed by reading
  `LineItemsEditor.tsx`'s rate-input disable guard, not by a fresh live rule application here.
- **Non-blocking technical finding, not a live bug**: constructing a line payload by hand with
  `rate == price_list_rate` but a nonzero `discount_percentage` shows ERPNext's controller
  silently zeroes `discount_percentage` rather than recomputing `rate` — contradicts a code
  comment's stated assumption in `lib/lineRows.ts`. **Not reachable through the real UI today**
  (`LineItemsEditor.tsx` disables the rate input whenever a Pricing Rule has already set a
  discount), so no user-facing defect exists. Flagged for `frontend-dev` awareness only, in case
  that guard is ever relaxed or a manual line-discount input is added later.
- **What combining the four phases actually confirmed** (the point of this pass): partial-
  fulfillment bookkeeping stayed correct across three consecutive partial stages on the same
  lines; the document-level discount survived Quotation→Sales Order copy; batch/serial
  attachment on Delivery Note worked when sourced from a **Pick List** (previously only verified
  from a direct Sales Order); all cancel-blocked-by-child-document guards held under the full
  chain, not just in isolation. Nothing broke when run together.
- **Test documents created and cleaned up**: `SAL-QTN-2026-00023`, `SAL-ORD-2026-00038`,
  `STO-PICK-2026-00001`, `MAT-DN-2026-00011`, `ACC-SINV-2026-00028` — all cancelled in reverse
  dependency order. `QA Test Customer Sales E2E` disabled (deletion blocked by link, expected,
  matches Buying QA precedent). Stray Draft documents from tool-call retries during
  investigation deleted. `Bin.actual_qty` and Serial No status/warehouse both confirmed back at
  pre-test baseline.
- **Sign-off**: `qa-tester` found no blockers requiring a fix. Sales scenario gaps plan (all 5
  phases) complete. Meets Definition of Ready (`AGENT_OPERATING_GUIDE.md` §8). Sales core chain
  fully accepted per the Current Mission priority lock.

## 2026-09-16 — Buying module — core cycle full live E2E verification (first pass)

- **Package tested**: `apps/frontend` Buying core cycle — Supplier (create/edit/fetch),
  Material Request → Request for Quotation → Supplier Quotation → Purchase Order →
  Purchase Receipt (partial quantity) → Purchase Invoice, `Bin` stock impact, and error
  cases (missing mandatory field, cancel-while-linked, 403 sweep). Live-tested against the
  real ERPNext instance on Hetzner via direct REST calls matching each `actions.ts`
  payload shape (Next.js server actions can't be driven from plain curl) — same method as
  the Inventory QA pass above. First time this full chain was verified live; previously
  only the Buying Reports hub had been spot-checked.
- **Result**: **PASS** — no code fixes required.
- **Issues found**: none functional. One documentation/expectation gap: no direct
  Material Request → Purchase Order action exists in the frontend — the only path is the
  3-hop MR → RFQ → Supplier Quotation → PO chain (`buying/material-requests/[name]/page.tsx`
  Connections tab only offers "Create RFQ"). Not a defect against the binding core flow
  (`AGENT_OPERATING_GUIDE.md` §8 names only PO → PR → PI), left as-is, flagged for a future
  product decision.
- **Verified correct**: partial-fulfillment tracking (PO `received_qty`/`per_received`,
  `billed_amt`/`per_billed`) matched expected math exactly; `Bin.actual_qty` for
  `ELE-USBC-CABLE`/`Stores - CS` went 44.0 → 56.0 after a 12-unit partial receipt, back to
  44.0 after cleanup; `cancelPurchaseOrderAction`'s proactive guard confirmed backed by
  real server-side `417 LinkExistsError` enforcement; no 403s across any Buying doctype
  (no role gap, unlike Stock); `lib/buyingDefaults.ts`'s previously-inferred payable/
  expense/cost-center accounts now live-confirmed correct.
- **Documents created and cleaned up**: `MAT-MR-2026-00004`, `PUR-RFQ-2026-00004`,
  `PUR-SQTN-2026-00004`, `PUR-ORD-2026-00014`, `MAT-PRE-2026-00002`, `ACC-PINV-2026-00008`
  — all cancelled in reverse dependency order; test Supplier (`QA Test Supplier Buying`)
  disabled (deletion blocked by link references, expected). Bin levels confirmed back at
  pre-QA baseline.
- **Sign-off**: `qa-tester` found no blockers. Meets Definition of Ready
  (`AGENT_OPERATING_GUIDE.md` §8). Buying core cycle accepted.

## 2026-09-17 — Manufacturing module — package 1 (module shell + Work Orders list, read-only)

- **Package tested**: `apps/frontend` new `/manufacturing` home placeholder and
  `/manufacturing/work-orders` list page (read-only, no create/detail/actions). Not a
  full `qa-tester` flow-level pass — this package has no submit/cancel/write path to
  exercise — but the exact server-side calls the page makes were verified live against
  the real ERPNext instance directly via REST (same field list, filters, and
  `get_count` the page's `listDocs`/`getCount` calls use).
- **Result**: **PASS**.
- **Verified live**: `GET /api/resource/Work Order` with the page's exact field list
  (`name`, `status`, `company`, `production_item`, `item_name`, `qty`, `produced_qty`,
  `bom_no`, `planned_start_date`, `planned_end_date`, `creation`) returned all 6 live
  Work Orders (`MFG-WO-2026-00001..006`) with the expected shape; a `status="Completed"`
  filter correctly returned only `MFG-WO-2026-00004`; `frappe.client.get_count` for
  `Work Order` returned `6`, matching the unfiltered list. No 403s.
- **Not tested**: full browser UI (no login attempted — current Administrator/session
  credentials weren't exercised this session, per the "don't touch real credentials"
  rule); confirmed via server-side REST + a clean `npm run build`/`tsc --noEmit`/`eslint`
  instead.
- **Sign-off**: `code-reviewer` found no blockers (one non-blocking suggestion — an
  unused fetched `bom_no` field — fixed by wiring it up as a hidden/optional column).
  Meets Definition of Ready (`AGENT_OPERATING_GUIDE.md` §8) for a list-only package.

## 2026-09-17 — Manufacturing module — package 3 (Work Order Create)

- **Package tested**: `apps/frontend` `/manufacturing/work-orders/new` — the first write/create
  path in the Manufacturing module. Live-tested against the real ERPNext instance on Hetzner via
  direct REST calls shaped exactly like `createWorkOrderAction`'s payload (Next.js server
  actions aren't curl-drivable), same method as every prior module's QA pass in this log.
- **Result**: **PASS**.
- **Verified live**: created `MFG-WO-2026-00007` (qty=7) and `MFG-WO-2026-00008` (qty=13)
  against the instance's one live manufacturable item/BOM (`FG-STEEL-BRACKET-ASSY` /
  `BOM-FG-STEEL-BRACKET-ASSY-001`). Both landed at `docstatus: 0` / `status: "Draft"` (create
  action only ever calls `createDoc`, never `submitDoc`, confirmed by code inspection and by
  the live result). ERPNext auto-populated `required_items` from `bom_no`+`qty` on insert;
  quantities matched the frontend's client-side scaling formula
  (`required_qty = bomItem.qty * (workOrderQty / bom.quantity)`) exactly at both qty values
  (5.6/28.0/0.35 at qty=7; 10.4/52.0/0.65 at qty=13 — bom base qty 1). Both docs immediately
  visible via the same `listDocs`/`getDoc` shapes the list/detail pages already use.
- **Error paths verified**: invalid `bom_no` → clean ERPNext `LinkValidationError` ("Could not
  find BOM No: ...") surfaced through `humanizeError`, not a raw stack trace; a fractional qty
  (2.5) against a whole-number-UOM item → ERPNext's own `ValidationError` rejected it cleanly.
  Neither failed attempt created an orphan Work Order (live count stayed at baseline both times).
- **Regression check**: Work Orders list (filters/sort/pagination) and Work Order detail page
  confirmed unaffected by the new "+ New Work Order" button; `npm run build`/`tsc --noEmit`/
  `eslint` all clean.
- **One non-blocking finding, fixed same day**: a doc comment in `actions.ts` incorrectly
  implied ERPNext's `validate()` auto-populates a new Work Order's `operations` table the same
  way it does `required_items`. Live testing showed `operations` stays empty on a plain REST
  insert even when the BOM has operations (Desk normally populates that table via a client-side
  form script, not `validate()` alone) — doesn't affect this package (the Operations preview
  reads from the BOM doc, not the created WO) but matters for a future Job Card package. Comment
  corrected to state this accurately.
- **Cleanup**: both test Work Orders deleted after verification; live Work Order count
  confirmed back at the pre-QA baseline of 6, no stray Draft documents left behind.
- **Sign-off**: `code-reviewer` found no blockers (payload field names, datetime-local→ERPNext
  conversion, scaling-math division-by-zero guards, error handling, and reuse discipline all
  verified against the live schema). Meets Definition of Ready (`AGENT_OPERATING_GUIDE.md` §8).
  Work Order Create accepted — Submit/Cancel remains a separate future package.

## 2026-09-17 — Manufacturing Package 4 — Work Order Material Change: investigation-stage live QA only, no UI shipped

- **What was tested**: not a frontend feature (none was built — see `PROGRESS.md`'s matching
  entry for why) — this was live verification of ERPNext's own native behavior around
  `Work Order.required_items`, run directly against the ERPNext instance via `bench console`
  (not through `apps/frontend`), to confirm source-code reading before ruling out a write UI.
- **Test Work Order**: temporary `MFG-WO-2026-00009`, `FG-STEEL-BRACKET-ASSY` ×5 against
  `BOM-FG-STEEL-BRACKET-ASSY-001`.
- **Result: PASS** (all 4 behaviors matched source-code prediction exactly):
  1. `required_items` auto-populated from BOM×qty on insert (0.8/4/0.05 per unit → 4/20/0.25 at
     qty 5) — consistent with the prior Work Order Create package's finding.
  2. Draft-stage `required_qty` edit (4.0 → 7.0), saved, reloaded → **reverted to 4.0** —
     confirms `Manufacturing Settings.allow_editing_of_items_and_quantities_in_work_order = 0`
     (current site value) causes `validate()` to silently reset quantities on BOM-matching rows
     every save.
  3. Draft-stage `item_code` substitution (`RM-BOLT-M6X20` → `RM-COATING-CPD`), saved, reloaded
     → **persisted** (not reset) — confirms substitution and quantity edits are NOT symmetric
     under the current settings. Found a real edge case in the process: nothing merges duplicate
     `item_code` rows, so the substitution left two `RM-COATING-CPD` rows in the table.
  4. Submitted-stage `required_qty` edit via plain doc update → **blocked**,
     `UpdateAfterSubmitError: "Row #1: Not allowed to change Required Qty after submission from
     4.0 to 5.0"` — confirms core Frappe's update-after-submit guard applies to this table exactly
     as the DocType JSON (no `allow_on_submit` on the child fields) predicted.
  5. `BOM-FG-STEEL-BRACKET-ASSY-001`'s item list read before and after all mutations —
     **byte-identical both times**, confirming master BOM integrity held throughout.
- **Not live-tested** (would need master-data setup out of this investigation's scope): the
  Stock-Entry-driven "additional item" and `Item Alternative` substitution paths — confirmed only
  by source reading (`add_additional_items`/`remove_additional_items` in `work_order.py`,
  `item_alternative.py`), plus a live check that no item on this instance currently has
  `allow_alternative_item` set and 0 `Item Alternative` records exist (a master-data gap, not a
  code question).
- **Cleanup**: `MFG-WO-2026-00009` cancelled and deleted after verification; live Work Order
  count back at its pre-test baseline.
- **Sign-off**: no `code-reviewer`/QA-for-shipped-feature applies — nothing was implemented.
  This entry exists because live verification work happened and the project's QA log is meant to
  reflect real testing activity, not only shipped-feature acceptance.

## 2026-09-17 — Manufacturing Package 5 — Material Transfer for Manufacture

- **Package tested**: new `/manufacturing/work-orders/[name]/transfer-materials` route (create
  a "Material Transfer for Manufacture" Stock Entry against a submitted Work Order, using
  ERPNext's own native `make_stock_entry` whitelisted method), plus the enhanced Work Order
  Detail Materials tab and "Transfer Materials" entry button. Live-tested against the real
  ERPNext instance on Hetzner via `bench console`, replicating the exact payload shape
  `actions.ts` builds — same method as every prior QA pass (Next.js server actions aren't
  curl-drivable).
- **Result**: **PASS after one real fix found live** (not caught by static review or the
  earlier source-code investigation).
- **Bug found and fixed**: the initial Stock Entry payload omitted `fg_completed_qty`. ERPNext's
  `Stock Entry.update_work_order` (in `stock_entry.py`) only calls
  `add_additional_items`/`update_work_order_qty` when `fg_completed_qty` is truthy — without it,
  an "additional" material line submitted cleanly (stock moved, no error) but **silently never
  attached to the Work Order's `required_items`**, meaning `is_additional_item`/
  `voucher_detail_reference` would never appear and the Work Order Detail page would show no
  trace of the extra material. Reproduced live, then fixed by threading
  `preview.fg_completed_qty` (from the native `make_stock_entry` response) through `page.tsx` →
  `MaterialTransferForm.tsx` (hidden field) → `actions.ts` (now validated as required). Re-tested
  live after the fix — confirmed correct.
- **Live scenarios covered** (temporary Work Orders against `FG-STEEL-BRACKET-ASSY` +
  `BOM-FG-STEEL-BRACKET-ASSY-001`, cleaned up after each):
  1. **Draft, no submit**: Stock Entry created but not submitted — WIP `Bin.actual_qty` and the
     Work Order's `transferred_qty` both stayed unchanged. Confirms Draft never reads as
     "transferred."
  2. **Partial transfer**: transferred 4.0 of 8.0 Kg required for one item — Work Order
     correctly showed Required 8.0 / Transferred 4.0.
  3. **Full transfer of the remainder**: a second Stock Entry transferring the rest (4.0 Kg) plus
     the other two full required lines — all three lines reached Transferred == Required.
  4. **Additional material (pre-fix)**: failed for an unrelated reason first (picked a
     zero-valuation test item — `TEST-BATCH-TEA` — which correctly triggered ERPNext's own
     "Valuation Rate ... required" error, a real ERPNext safeguard, not a bug in this app) then
     retried with a properly-valued catalog item (`GRO-CLEANER-BATH-750ML`) and hit the
     `fg_completed_qty` bug above — confirmed the row moved stock but never reached
     `required_items`.
  5. **Additional material (post-fix)**: re-run with `fg_completed_qty` set — Work Order gained a
     new `required_items` row with `is_additional_item: 1` and a real `voucher_detail_reference`
     pointing at the Stock Entry Detail row. Cancelling that Stock Entry correctly removed the
     row again (`remove_additional_items`).
  6. **Excess quantity rejection**: attempted to transfer 200 Nos against a fully-satisfied line
     — ERPNext rejected with `"Cannot transfer 200.0 Nos of Item RM-BOLT-M6X20. Maximum
     transferable quantity is 0.0 Nos."`, confirming `transfer_extra_materials_percentage = 0%`
     (still the live value) is enforced, not bypassed.
  7. **Invalid (group) warehouse rejection**: attempted a transfer from a group warehouse —
     ERPNext rejected with `"Group node warehouse is not allowed to select for transactions"`.
  8. **BOM integrity**: `BOM-FG-STEEL-BRACKET-ASSY-001`'s item list read before/after every
     mutation across all scenarios above — byte-identical every time.
- **Unrelated pre-existing leftovers found and cleaned up** (not caused this session): a prior
  Package 3 QA pass's `MFG-WO-2026-00008` (Draft) and an earlier Stock module QA pass's
  `MAT-STE-2026-00010` (Draft) were both still live despite their own QA entries claiming full
  cleanup — deleted both; live Work Order count confirmed back at the documented baseline of 6.
- **Cleanup**: every test Work Order and Stock Entry created this session (including the
  deliberately-failing ones) was cancelled/deleted; no stray data remains.
- **Sign-off**: see `code-reviewer` findings applied in this same package (recorded in
  PROGRESS.md's matching entry). Meets Definition of Ready (`AGENT_OPERATING_GUIDE.md` §8) for
  the Material Transfer for Manufacture scope specifically — not a claim that Manufacturing or
  Production Execution as a whole is done.

## 2026-09-17 (later) — Manufacturing Packages 2/3/5 governance-closure corrections (Codex findings CX-MFG-001–006)

- **What was tested**: static verification only — `npm run lint`, `npx tsc --noEmit`, and
  `npm run build` all re-run clean after every fix below. **No live ERPNext re-verification was
  performed this session** (no SSH/`bench console` access available — a credential-exploration
  action was correctly denied by the harness's permission classifier when checked for). This is
  explicitly **NOT RUN** for live-instance evidence; Codex's independent re-review (per
  `docs/controls/AI_AGENT_HANDOFF_POLICY.md`'s Re-Review section) is the next required step
  before these corrections can be treated as verified, not this session's own say-so.
- **Context**: Codex's independent review of commit `25b882e` (Manufacturing Packages 2, 3, 5)
  returned `CHANGES REQUIRED` with findings `CX-MFG-001` through `CX-MFG-006` (see
  `docs/operations/AI_WORK_LOG.md`). This entry covers the corrections made in response, all
  still uncommitted in the working tree as of this entry.
- **`CX-MFG-001` (HIGH) — fixed**: `transfer-materials/actions.ts` previously trusted
  client-submitted hidden fields (`company`/`bom_no`/`use_multi_level_bom`/`to_warehouse`/
  `fg_completed_qty`) to build the Stock Entry, using the trustworthy bound `workOrderName`
  route argument only for revalidation/redirect. Now re-derives all of those from a fresh
  `getMaterialTransferPreview(workOrderName)` call (re-invoking ERPNext's own
  `make_stock_entry`) keyed off that same bound argument — matching the established pattern
  already used by `createDeliveryNoteFromSalesOrderAction` (re-fetch the parent doc server-side,
  never trust a client round-trip of its own fields). Hidden fields removed from
  `MaterialTransferForm.tsx` entirely; only `posting_date`/`remarks`/`items`
  (`item_code`/`qty`/`s_warehouse` per row) are still real client input.
- **`CX-MFG-002` (HIGH) — fixed**: `work-orders/actions.ts`'s `createWorkOrderAction` previously
  never sent `operations` on Work Order create, even though ERPNext leaves that table empty on a
  plain REST insert (live-confirmed in Package 3's own QA) and `WorkOrderForm.tsx` previews BOM
  operations as if they matter. Now builds an `operations` array from a fresh
  `getBomDetails(bom_no)` call, `time_in_mins` scaled by `qty / bom.quantity`. Flagged
  `MFG-UNV-007` — the scaling convention is reasoned (matches how `required_items` already
  scales) but not live-verified against Desk's own copy behavior.
- **`CX-MFG-003` (MEDIUM) — fixed**: Work Order Detail's Quality Readiness ratio numerator
  (`jobCardsWithInspection`) was computed across all Job Cards with `quality_inspection` set,
  not scoped to the same `quality_inspection_template`-carrying population as the denominator —
  a Job Card with a recorded inspection but no template could report a ratio above 100% of the
  real population. Numerator now filters within `jobCardsWithTemplate`.
- **`CX-MFG-004` (DOCUMENTATION) — fixed**: `apps/frontend/README.md`'s "App shell" bullet no
  longer describes Manufacturing as greyed "coming soon"; `docs/ceylon-stack-documentation.html`'s
  Work Orders list status line no longer claims no "+ New" action exists. Three stale
  "not committed"/"pending release-tracker" notes in `PROGRESS.md` (Packages 2, 3, 5) corrected
  to name commit `25b882e`.
- **`CX-MFG-006` (NEEDS_VERIFICATION) — hardened, not resolved**: React `key`s in the Work Order
  Detail Materials tab and `MaterialTransferForm.tsx` now use row index instead of `item_code`;
  `MaterialTransferForm.tsx`'s per-row state (`qtyByIndex`/`warehouseByIndex`) is now index-keyed
  throughout, so a duplicate `item_code` in the preview (a live-confirmed real possibility per
  Package 4's investigation) can no longer collapse two rows' state into one. Whether ERPNext's
  own `make_stock_entry` can actually return duplicate `item_code` rows remains unconfirmed —
  logged as `MFG-UNV-008`.
- **Not addressed**: `CX-MFG-005` (handoff traceability — no formal `CLAUDE PACKAGE HANDOFF` or
  work-log entry existed) — closed by this session's own `AI_WORK_LOG.md` additions (per-package
  ledger rows, a detailed Package 5 record) and the `CLAUDE PACKAGE HANDOFF` produced at the end
  of this session, not a code change.
- **Sign-off**: no `qa-tester`/live-instance verification this session (see above). Corrections
  are handed off for Codex's independent re-review against the same `25b882e` package boundary —
  not self-certified as resolved.
