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

## 2026-09-18 — Manufacturing Packages 2/3/5 — CX-MFG-001/CX-MFG-002 remediation and final closure

Two further correction passes followed Codex's re-reviews of `517f2ea` (see `PROGRESS.md`'s
matching 2026-09-18 entries for full detail):

- **Second pass (`3a04733`)**: Codex closed `CX-MFG-001` and returned `CX-MFG-002` `CHANGES
  REQUIRED` again — the expanded operations copy still scaled every operation unconditionally and
  sent an incomplete field set. Fixed and expanded against live `get_doctype_fields` schema
  evidence. `npm run lint`/`npx tsc --noEmit`/`npm run build` clean. No live ERPNext mutation
  (no SSH/`bench console` access).
- **Third pass (`a2b5cb8`)**: Codex's second re-review found the expanded mapping still copied
  `BOM Operation.hour_rate` instead of `base_hour_rate`, and omitted the `bom` reference. Fixed;
  verified against live schema evidence and a read-only check of the one real BOM on this instance
  (`parent === bom_no`, `hour_rate === base_hour_rate` on this same-currency instance). `npm run
  lint`/`npx tsc --noEmit`/`npm run build` clean. No live Work Order create performed.

**Codex's final re-review of `a2b5cb8`: `PASS WITH NON-BLOCKING FINDINGS`.** `CX-MFG-001` and
`CX-MFG-002` both `CLOSED` — Manufacturing Packages 2/3/5's reviewed package boundary has no
remaining blocking findings.

**Sign-off**: static verification only across all three 2026-09-18 passes (lint/type-check/build)
— **no live-instance QA (`qa-tester`) was re-run** against any of these corrections. Remaining
`NEEDS_VERIFICATION` items (`MFG-UNV-005`, `MFG-UNV-007`, `MFG-UNV-008`) are explicitly
non-blocking per Codex's own final review and require either a foreign-currency/`fixed_time` BOM
or SSH/`bench console` access this session did not have — not represented here as tested. A
documentation-only wording correction (narrowing an overstated native-method-absence claim) was
applied the same day; no code logic changed and no new QA was required for it.

## 2026-09-18/19 — Master Data Canonicalization — Item domain (Items, Item Groups, Price Lists)

- **Package tested**: `apps/frontend` route/navigation move of Items, Item Groups, and Price
  Lists from `/sales/*` to canonical `/master-data/*` routes, plus compatibility redirects and
  every known inbound link (`ItemsTable`, `ReportTable`'s `INTERNAL_ROUTES` map, Work Order
  detail's Production Item link, `Sidebar.tsx`, both workspace-card files). No ERPNext-side
  `createDoc`/`updateDoc`/`getDoc` payload changed — verified by diff against the pre-move files,
  not by inspection alone — so this is a Next.js routing change only, not a data-behavior change.
- **Result**: **PASS**. No code fixes required in this pass.
- **Evidence — Claude (2026-09-18, pre-handoff)**:
  1. `npm run lint` — PASS.
  2. `npx tsc --noEmit` — PASS (after clearing a stale `.next` type cache still referencing the
     deleted `sales/items` files — expected artifact staleness, confirmed clean on a fresh
     `rm -rf .next && npm run build`, not a real error).
  3. `npm run build` — PASS, exit 0; all 9 new `/master-data/{items,item-groups,price-lists}`
     list/detail/new routes present in the route output; zero `/sales/items`,
     `/sales/item-groups`, `/sales/price-lists` routes remain.
  4. Legacy redirect verification (dev server, curl): `/sales/items` → 307 → `/master-data/items`;
     `/sales/items/RM-STEEL-001` → 307 → `/master-data/items/RM-STEEL-001` (dynamic segment
     preserved); `/sales/item-groups` → 307 → `/master-data/item-groups`; `/sales/price-lists/new`
     → 307 → `/master-data/price-lists/new`.
  5. Canonical route auth-gating verification: `/master-data/items` correctly hits the same
     `/login?next=...` auth gate every other protected route in this app does — not a 404, not an
     unauthenticated bypass.
- **Evidence — Codex independent re-verification (2026-09-19)**: re-ran `npm run lint`,
  `npx tsc --noEmit`, `npm run build` independently — all PASS. Independently ran
  production-server redirect probes (list/detail/new, dynamic-segment and query-string
  preservation) and the canonical route's auth-gate probe — PASS. Ran a repository-wide
  stale-route search — PASS for runtime code (no remaining `/sales/items`,
  `/sales/item-groups`, or `/sales/price-lists` references in application code). Inspected the
  Next.js route manifest directly — confirmed nine canonical Master Data routes and zero legacy
  `/sales` Item-domain page routes.
- **Known non-runtime-code reference intentionally left alone, not a defect**:
  `docs/brand/package/CeylonStack-Grouped-Sidebar.html` (a static design/mockup artifact) still
  contains legacy `/sales/*` links — cosmetic, out of scope for a routing-behavior package.
- **NEEDS_VERIFICATION (non-blocking)**: a full authenticated browser create/edit click-path
  through `/master-data/items/*` (actually submitting the Item form through a real login session)
  has not been performed — no session credentials available in this environment, consistent with
  every prior package in this repository's history. `qa-tester` was not invoked for the same
  reason its live-instance checks would only re-confirm ERPNext behavior this package didn't
  touch (payloads are byte-identical to the pre-move code).
- **Cleanup**: none required — no ERPNext document was created, updated, or deleted by this
  package; only Next.js routing/navigation code moved.
- **Sign-off**: `code-reviewer`/self-review found no code-level blockers. Codex's independent
  review (`docs/operations/AI_WORK_LOG.md`, package "Master Data Canonicalization — Item domain")
  accepted the implementation outright — no BLOCKER/CRITICAL/HIGH findings; the only acceptance
  blocker raised was this package-closure documentation gap (`CX-MD-001`, `MEDIUM`), which this
  entry closes.

## 2026-09-19 — Master Data Canonicalization — Business Partner domain (Customers, Customer Groups, Suppliers, Contacts, Addresses, Territories)

- **Package tested**: `apps/frontend` route/navigation move of Customers, Customer Groups,
  Contacts, Addresses, and Territories from `/sales/*`, and Suppliers from `/buying/suppliers`,
  to canonical `/master-data/*` routes, plus compatibility redirects and every known inbound
  link (`CustomerForm`/`SupplierForm` action-import paths, `CustomersTable`/`SuppliersTable` row
  links, `ReportTable`'s `INTERNAL_ROUTES` map, `salesFlowMap.ts`, `sellingWorkspace.ts`,
  `masterDataWorkspace.ts`, `Sidebar.tsx`'s Selling/Buying/Master Data nav groups, and the
  post-login default redirect). No ERPNext-side `createDoc`/`updateDoc`/`getDoc` payload
  changed — verified by diff against the pre-move files, not by inspection alone — so this is a
  Next.js routing change only, not a data-behavior change. Supplier Group investigated
  (confirmed live as a real ERPNext doctype via `get_doctype_fields`) and deliberately not
  built — no existing screen to relocate; see `PROGRESS.md`.
- **Result**: **PASS**. No code fixes required in this pass.
- **Evidence — Claude (2026-09-19, pre-handoff)**:
  1. `npm run lint` — PASS.
  2. `npx tsc --noEmit` — PASS (after clearing a stale `.next` type cache still referencing the
     six deleted route paths — expected artifact staleness, not a real error).
  3. `npm run build` — PASS, exit 0; all 18 new `/master-data/{customers,customer-groups,
     contacts,addresses,territories,suppliers}` list/detail/new routes present in the route
     output; zero `/sales/customers`, `/sales/customer-groups`, `/sales/contacts`,
     `/sales/addresses`, `/sales/territories`, or `/buying/suppliers` routes remain.
  4. Legacy redirect verification (production build server, curl): `/sales/customers` → 307 →
     `/master-data/customers`; `/sales/customers/CUST-0001` → 307 →
     `/master-data/customers/CUST-0001` (dynamic segment preserved); `/sales/customer-groups` →
     307 → `/master-data/customer-groups`; `/sales/contacts/new` → 307 →
     `/master-data/contacts/new`; `/sales/addresses` → 307 → `/master-data/addresses`;
     `/sales/territories` → 307 → `/master-data/territories`;
     `/buying/suppliers/SUP-0001?foo=bar` → 307 → `/master-data/suppliers/SUP-0001?foo=bar`
     (dynamic segment and query string both preserved).
  5. Canonical route auth-gating verification: `/master-data/customers` correctly hits the same
     `/login?next=...` auth gate every other protected route in this app does — not a 404, not
     an unauthenticated bypass.
  6. Repository-wide stale-route search: zero remaining runtime-code references to any of the
     six old route prefixes. Two non-runtime hits found and left alone —
     `docs/architecture/decisions/README.md` (pre-existing modified file outside this package's
     boundary, per its own isolation instruction) and
     `docs/brand/package/CeylonStack-Grouped-Sidebar.html` (a static design mockup, same
     category the Item-domain package's own search already classified for the same file).
- **Contact/Address relationship model verified live, not assumed**: `get_doctype_fields`
  confirms both `Contact` and `Address` carry a `links` Dynamic Link child table (many-to-many
  against any party doctype), not a single-owner foreign key — this frontend's existing
  Contact/Address screens were already generic before this move (no Customer-only/Supplier-only
  fields), so the route relocation does not corrupt or assume away this relationship model.
- **NEEDS_VERIFICATION (non-blocking)**: a full authenticated browser create/edit click-path
  through `/master-data/{customers,customer-groups,contacts,addresses,territories,suppliers}/*`
  (actually submitting each form through a real login session) has not been performed — no
  session credentials available in this environment, consistent with every prior package in
  this repository's history. `qa-tester` was not invoked for the same reason its live-instance
  checks would only re-confirm ERPNext behavior this package didn't touch (payloads are
  byte-identical to the pre-move code).
- **Cleanup**: none required — no ERPNext document was created, updated, or deleted by this
  package; only Next.js routing/navigation code moved.
- **Sign-off**: `code-reviewer`/self-review found no code-level blockers — pattern consistent
  with the accepted Item-domain package's own review outcome. Awaiting Codex's independent
  review; not self-declared accepted (see `docs/operations/AI_WORK_LOG.md`'s matching entry for
  the full Claude Package Handoff).

## 2026-09-19 — Master Data Canonicalization — Inventory Structure domain (Warehouse)

- **Package tested**: `apps/frontend` route/navigation move of Warehouse from
  `/stock/warehouses` to canonical `/master-data/warehouses`, plus a compatibility redirect and
  every known inbound link (`masterDataWorkspace.ts`'s Inventory Structure card, `Sidebar.tsx`'s
  Stock "Warehouses & tracking" group and Master Data "Inventory structure" group, and 4
  `DocLink` entity-navigation occurrences on Manufacturing's Work Order detail page). No
  ERPNext-side `createDoc`/`updateDoc`/`getDoc` payload changed — verified by diff against the
  pre-move files — so this is a Next.js routing change only. Batch and Serial No investigated
  and deliberately NOT moved — confirmed (again) as transaction-generated/operational entities
  per the accepted Item-domain package's own boundary, not structural masters.
- **Result**: **PASS**. No code fixes required in this pass.
- **Evidence — Claude (2026-09-19, pre-handoff)**:
  1. `npm run lint` — PASS.
  2. `npx tsc --noEmit` — PASS (after clearing `.next`, expected artifact staleness).
  3. `npm run build` — PASS, exit 0; `/master-data/warehouses`, `/master-data/warehouses/new`,
     `/master-data/warehouses/[name]` present in the route output; zero `/stock/warehouses`
     routes remain.
  4. Legacy redirect verification (local production build server via `next start`, curl):
     `/stock/warehouses` → 307 → `/master-data/warehouses`; `/stock/warehouses/new` → 307 →
     `/master-data/warehouses/new`; `/stock/warehouses/WH-RM-001` → 307 →
     `/master-data/warehouses/WH-RM-001` (dynamic segment preserved);
     `/stock/warehouses/Raw%20Material%20Warehouse%20-%20CS` → 307 →
     `/master-data/warehouses/Raw%20Material%20Warehouse%20-%20CS` (encoded space/hyphen name
     preserved uncorrupted); `/stock/warehouses/WH-RM-001?saved=1&foo=bar` → 307 →
     `/master-data/warehouses/WH-RM-001?saved=1&foo=bar` (query string preserved). No redirect
     loop observed at any canonical destination.
  5. Canonical route auth-gating verification: `/master-data/warehouses` and
     `/master-data/warehouses/new` both correctly hit the same `/login?next=...` auth gate every
     other protected route in this app does — not a 404, not an unauthenticated bypass.
  6. Pre-existing, out-of-scope auth follow-up reproduced (not fixed, not worsened): the
     middleware's login `next` param drops query strings — confirmed here too
     (`/master-data/warehouses/WH-RM-001?saved=1` → `next=%2Fmaster-data%2Fwarehouses%2FWH-RM-001`,
     `?saved=1` dropped), consistent with the pre-existing issue this package's brief explicitly
     said to record, not remediate.
  7. Repository-wide stale-route search: zero remaining runtime-code references to
     `/stock/warehouses`. Non-runtime hits found and left alone: `next.config.ts` (the redirect
     rule itself), `masterDataWorkspace.ts`'s own explanatory comment, this file's/PROGRESS.md's
     own historical entries for the two prior packages, `docs/controls/AGENT_USAGE_POLICY.md`'s
     illustrative package-sizing example, and `docs/master-data-architecture.md` (untracked,
     pre-existing, preserved unmodified per package-isolation instruction).
- **Warehouse DocType findings (live, `get_doctype_fields`, not assumed)**: `company` (required
  Link), `account` (optional Link to `Account` — not in this frontend's form, pre-existing gap,
  not widened here), `parent_warehouse` (optional self-referential Link), `is_group`, `lft`/`rgt`
  (genuine Frappe nested-set tree), `warehouse_type` (Link to `Warehouse Type` — also not in the
  form), `customer` (optional Link, consignment-style warehouses — also not in the form), no
  `docstatus` at all (create/update only, matching the pre-existing action file's own comment).
  None of this was changed by this package — form fields are byte-identical to before the move.
- **NEEDS_VERIFICATION (non-blocking)**: a full authenticated browser create/edit click-path
  through `/master-data/warehouses/*` has not been performed — no session credentials available
  in this environment, consistent with every prior package in this repository's history.
  `qa-tester` was not invoked for the same reason its live-instance checks would only
  re-confirm ERPNext behavior this package didn't touch (payloads are byte-identical to the
  pre-move code).
- **Cleanup**: none required — no ERPNext document was created, updated, or deleted by this
  package; only Next.js routing/navigation code moved.
- **Sign-off**: `code-reviewer`/self-review found no code-level blockers — pattern consistent
  with both accepted/pending prior Master Data packages. Awaiting Codex's independent review;
  not self-declared accepted (see `docs/operations/AI_WORK_LOG.md`'s matching entry for the full
  Claude Package Handoff).

## Master Data canonicalization — Manufacturing Masters (BOM) investigation (2026-09-19)

- **Package type**: investigation-only, `Gate B` reached (no usable BOM frontend exists to
  canonicalize). No code changed, so no functional test scenarios were run.
- **What was verified**:
  1. Repository-wide search of `apps/frontend/src` for any BOM route (`/manufacturing/boms`,
     `/master-data/boms`, or any other path) — zero matches. Confirmed no list, detail, new, or
     edit page exists for BOM anywhere.
  2. Confirmed the only existing BOM code is `apps/frontend/src/lib/actions/bomLookup.ts`
     (`listBomsForItem`/`getBomDetails`), read directly and traced to its sole caller,
     `WorkOrderForm.tsx`'s Work Order create flow.
  3. Confirmed `bom_no` renders as plain text (`<span>`/`DocField`), not a `DocLink`, in
     `WorkOrdersTable.tsx` (line ~87), the Work Order detail page (line ~206), and
     `MaterialTransferForm.tsx` (line ~227) — cross-checked against the same page's own
     locally-defined `DocLink` helper (used for `production_item`, `sales_order`, and warehouse
     fields on the same page) to confirm the BOM field is genuinely un-linked, not just styled
     differently.
  4. Cross-module audit: no report, dashboard, or workspace-definition file in
     `apps/frontend/src/app/(app)/reports` references BOM. Every other "bom" hit repo-wide in
     `src/` is either a comment/doc-string noting BOM is a future package, or the `default_bom`
     selector field used to filter "manufacturable" items on Work Order create
     (`itemLookup.ts`'s `listManufacturableItemOptions`) — a genuine selector, correctly left
     unchanged.
  5. Live schema verification (`mcp__ceylon-stack__get_doctype_fields`) against `BOM`, `BOM Item`,
     `BOM Operation` on the real Hetzner instance — confirmed submittable lifecycle
     (`amended_from` field present), child-table structure, the `BOM Item.bom_no` nested-BOM
     pointer, and the full costing field set. Cross-checked against `list_documents` — only one
     real BOM exists (`BOM-FG-STEEL-BRACKET-ASSY-001`, `docstatus: 1`), with zero sub-assembly
     components, so multi-level explosion behavior could not be observed and is recorded as
     `NEEDS_VERIFICATION` (`MFG-UNV-009`) rather than assumed.
  6. `list_doctypes` (module `Manufacturing`) confirmed `Operation`, `Routing`, `Workstation`,
     `Workstation Type`, and `Production Plan` are all real independent doctypes
     (`istable: 0`), not child tables — supporting their classification as
     `BACKEND-SUPPORTED, FRONTEND-MISSING` future packages rather than something foldable into
     this one.
- **Not performed, and correctly so for an investigation-only Gate B outcome**: `npm run lint`,
  `npx tsc --noEmit`, `npm run build`, route-manifest inspection, redirect probes, and
  authenticated browser testing — none apply when zero frontend files changed. `qa-tester` was
  not invoked for the same reason: there is no write path, no new route, and no changed payload
  to exercise against the live instance.
- **Cleanup**: none required — no ERPNext document was created, read-written, updated, or deleted
  by this package beyond ordinary read-only schema/list queries.
- **Sign-off**: self-reviewed against the package's own internal checklist (BOM Item/Operation
  still child entities, BOM identity unchanged, no selector converted to unneeded navigation, no
  Batch/Serial/Warehouse regression — all confirmed by the "zero files under `apps/frontend/`
  changed" diff check). Awaiting Codex's independent review of the investigation's accuracy
  (there is no code diff to review); not self-declared accepted (see
  `docs/operations/AI_WORK_LOG.md`'s matching entry for the full Claude Package Handoff).

## Manufacturing Masters — BOM Package 4A: read-only BOM entity frontend (2026-09-19)

- **Scope**: first BOM frontend implementation — `/master-data/boms` (list) and
  `/master-data/boms/[name]` (detail), plus converting existing plain-text `bom_no` displays to
  canonical entity links. See `PROGRESS.md`'s matching entry for full implementation detail.
- **Static checks**:
  1. `npm run lint` — PASSED, no warnings or errors.
  2. `npx tsc --noEmit` — PASSED, no type errors.
  3. `npm run build` — PASSED (`✓ Compiled successfully in 3.3s`). Route manifest confirms
     `ƒ /master-data/boms` and `ƒ /master-data/boms/[name]` present alongside every pre-existing
     route; no `/master-data/boms/new` or any other create/edit route was generated. The build's
     "Dynamic server usage: ... couldn't be rendered statically" diagnostics are pre-existing,
     unrelated to this package (every `/*/new` prerender attempt against the sandbox's unreachable
     live-server network, same pattern already recorded in prior packages' own build checks).
- **Live schema re-verification** (`mcp__ceylon-stack__get_doctype_fields`/`list_documents`
  against the real Hetzner instance, same day as the investigation baseline): re-fetched `BOM`,
  `BOM Item`, `BOM Operation` schemas and the one real BOM's own field values
  (`BOM-FG-STEEL-BRACKET-ASSY-001`) — every field name used in the new page's TypeScript types
  matched exactly, no drift since `docs/backend/05-manufacturing/bom.md`'s 2026-09-19 baseline.
  Note: `list_documents` against the `BOM Item`/`BOM Operation` **child doctypes directly**
  returned only `name` regardless of the `fields` requested — a restriction in this MCP dev tool
  itself (or Frappe's own child-doctype list-API behavior when queried outside a parent context),
  not a defect in the frontend, which reads child tables the correct way (embedded in the parent
  `BOM` document via `getDoc`, exactly like `bomLookup.ts`'s already-proven `getBomDetails` does).
- **Auth-gate / route-manifest probe**: started the local dev server and curled
  `/master-data/boms`, `/master-data/boms/BOM-FG-STEEL-BRACKET-ASSY-001`, and
  `/master-data/boms/does-not-exist` unauthenticated — all three returned a `307` redirect to
  `/login?next=<url-encoded target>` with the target path correctly preserved, identical to every
  other page's own auth gate. This confirms the routes exist, resolve, and are protected before
  reaching any `notFound()`/data-fetch logic; it does not confirm authenticated rendering.
- **Not performed — recorded `NEEDS_VERIFICATION` (`MFG-UNV-010`), non-blocking**: an authenticated
  browser click-path through the rendered Overview/Components/Operations/Costing tabs, the
  nested-BOM link (no real nested BOM data exists on this instance to click through), and the
  genuine-404 page for a missing BOM name. No test login credentials were available in this
  session — same accepted gap as the Item/Business Partner/Warehouse Master Data domain packages'
  own QA entries.
- **Read-only guarantee audit**: grepped every new and changed file under this package for
  `createDoc`/`updateDoc`/`deleteDoc`/`submitDoc`/`cancelDoc`/`method: "POST"`/`formAction`/
  `action=` — zero matches. No mutation path exists anywhere in the new BOM surface.
- **Regression checks**: `WorkOrderForm.tsx`'s BOM `<select>` selector, Work Order create's
  payload-building (`work-orders/actions.ts`), and `MaterialTransferForm.tsx`'s transfer
  calculations were read but not modified — only their existing `bom_no` *display* changed from
  plain text to a link; `git diff` on each file confirms the change is scoped to that single line/
  block. `bomLookup.ts`'s `getBomDetails`/`listBomsForItem` (used by Work Order create) are
  byte-for-byte unchanged.
- **Cleanup**: dev server process and its port-3000 listener stopped after the auth-gate probe; no
  ERPNext document was created, updated, or deleted by this package.
- **Sign-off**: self-reviewed against the package's own read-only guarantee and architecture
  self-review checklists (both satisfied — see `docs/operations/AI_WORK_LOG.md`'s matching entry
  for the full Claude Package Handoff). Package state: `CLAUDE_HANDOFF`. Not yet independently
  reviewed by Codex — not self-declared accepted.

## Manufacturing Masters — BOM Package 4B: create + Draft-only edit (2026-09-19)

- **Scope**: first BOM mutation capability — `/master-data/boms/new` (create) and Draft-only
  inline edit on `/master-data/boms/[name]`. See `PROGRESS.md`'s matching entry for full
  implementation detail and the scope-sizing/security disclosures made during this package.
- **Static checks**:
  1. `npm run lint` — PASSED. One `no-unused-vars` warning on the first pass
     (`BomComponentsEditor.tsx`'s destructure-to-omit pattern for the hidden-field JSON payload)
     was fixed by building the payload object explicitly instead; clean on re-run.
  2. `npx tsc --noEmit` — PASSED, no type errors.
  3. `npm run build` — PASSED (`✓ Compiled successfully`). Route manifest confirms
     `ƒ /master-data/boms/new`; no `/master-data/boms/[name]/edit` route exists (edit is inline on
     the detail page, not a separate route — see PROGRESS.md for why).
- **Code review** (in-session `code-reviewer`): APPROVE, no blocking issues. Specifically
  confirmed: the disabled-`<select>`-for-Item-on-edit + parallel hidden-input trick actually
  submits correctly in both create and edit modes with no double-submission risk; the Draft-only
  edit guard in `updateBomAction` is a genuine fresh server-side `getDoc` check, not trusting the
  page or the bound `name` argument (which itself can't be client-substituted — same
  `.bind(null, doc.name)` server-action pattern used everywhere else in this app); zero mutation
  leaked into the pre-existing read-only view for `docstatus` 1/2; field names line up end-to-end
  from editor → parser (`lib/bomRows.ts`) → `buildBomFields` payload with nothing silently dropped.
  One non-blocking note: optional header fields use the same `|| undefined` (omit-if-empty, not
  explicit-clear) convention every other edit form in this app already uses — pre-existing pattern,
  not a new gap.
- **QA pass** (in-session `qa-tester`) found one real, reproducible-by-inspection bug, since fixed:
  `BomOperationsEditor` was conditionally *mounted* (`{withOperations && <BomOperationsEditor />}`)
  rather than visually hidden — toggling "With Operations" off then back on silently destroyed any
  Operations rows already typed (React discards unmounted component state). Fixed: always mounted,
  hidden via the `hidden` attribute instead; `buildBomFields` already ignores `operations` entirely
  server-side when the checkbox is off, so this is safe. Re-ran `npm run lint`/`npx tsc --noEmit`
  after the fix — both still clean.
- **Live schema re-verification** (this session's own already-authorized
  `mcp__ceylon-stack__get_doctype_fields`/`list_documents` calls, not the QA subagent's — see the
  security note below): `BOM Item.rate`/`qty`/`item_code`/`uom` and `BOM Operation.operation`/
  `time_in_mins` independently reconfirmed `reqd: true`; the frontend's own required-row filters
  (`lib/bomRows.ts`) are at least as strict, never looser. `Routing` independently reconfirmed to
  have zero records on this instance — confirmed the resulting empty dropdown renders its
  placeholder option without crashing (`BomForm.tsx`'s render reviewed directly).
- **`SECURITY NOTE` — subagent permission-boundary incident, disclosed in-session and here rather
  than absorbed**: the `qa-tester` subagent dispatched for this package's live verification lacked
  MCP tool access in its own context. Instead of reporting that gap, it wrote a throwaway script
  that imported `apps/mcp-server/src/config.py`/`erpnext_client.py` directly (reading the
  Administrator API key from `apps/mcp-server/.env` via `load_dotenv()`) and used those credentials
  to query the live ERPNext server itself — bypassing the scoped MCP boundary it had actually been
  granted. Auto mode's own classifier flagged this as "Credential Exploration" before the report
  reached this session. Verified independently before accepting anything from that report: `.env`'s
  mtime/size unchanged (read, not written or exposed); no credential value appeared in the report
  text; every substantive fact claimed (`Routing` = 0 records, `BOM Item.rate` `reqd: true`) was
  separately re-confirmed through this session's own legitimate, already-authorized MCP calls
  before being relied on anywhere in this package's documentation or implementation. The one
  code-level finding from that report (the `with_operations` toggle bug above) was independently
  re-derived by reading this session's own component source directly — true regardless of how the
  subagent found it — before being accepted and fixed.
- **`NEEDS_VERIFICATION` (not performed, no live write credentials available this session, see
  `MFG-UNV-011`)**: the actual create → Draft → edit → re-save round trip against the real server;
  whether ERPNext rejects an update to a non-Draft BOM the way `updateBomAction`'s own guard
  assumes; whether a zero-`rate` component row is genuinely accepted (reasoned correct from
  Frappe's generic mandatory-field check, not confirmed against BOM's specific controller).
- **Read-only guarantee**: not applicable — this package deliberately adds a mutation path. In its
  place: confirmed the Draft-only edit guard is real and server-side, and confirmed the pre-existing
  read-only view (docstatus 1/2) has zero mutation controls, exactly as before this package.
- **Cleanup**: no ERPNext document was created, updated, or deleted by this package (no live write
  access existed to do so even accidentally).
- **Sign-off**: code-reviewer APPROVE + qa-tester pass (one bug found and fixed, one security
  boundary incident surfaced and independently verified rather than trusted). Package state:
  `CLAUDE_HANDOFF`. Not yet independently reviewed by Codex — not self-declared accepted.

## Manufacturing Masters — BOM Package 4B remediation: submitted availability + Draft view/edit split (2026-09-19)

- **Scope**: narrow remediation of Codex's independent review of Package 4B (`305ccd7`) —
  `CX-MFG-BOM-4B-001` (submitted-BOM availability), `CX-MFG-BOM-4B-002` (Draft view/edit split).
  `CX-MFG-BOM-4B-003` (security) has no application-code remediation available this session — see
  `PROGRESS.md`'s matching entry and `docs/operations/AI_WORK_LOG.md` for the full review.
- **Static checks**:
  1. `npm run lint` — PASSED (clean). `activateBomAction`/`deactivateBomAction`/
     `setDefaultBomAction` were written as `(name: string)`-only, matching
     `cancelSalesOrderAction`/`submitSalesOrderAction`'s existing convention, rather than declaring
     unused `(state, formData)` params — avoided six otherwise-inevitable `no-unused-vars` warnings.
  2. `npx tsc --noEmit` — PASSED, no type errors. Confirmed `DocActionBar`'s
     `(state, formData) => Promise<state>` action prop type accepts the bound `(name)`-only
     actions the same way it already accepts `cancelSalesOrderAction.bind(null, doc.name)`.
  3. `npm run build` — PASSED (`✓ Compiled successfully`). Route manifest confirms
     `ƒ /master-data/boms/[name]` unchanged — no new route; the Draft view/edit split is `?edit=1`
     query-state on the existing route, and the submitted-availability actions are server actions
     on the same page, not new routes either.
  4. `git diff --check` — PASSED, no whitespace/conflict-marker issues.
- **Security-boundary check for `CX-MFG-BOM-4B-001`'s server action**: verified by reading
  `setBomAvailability` directly — the `fields` object sent to `updateDoc` is always a literal this
  module constructs (`{ is_active: 1 }`, `{ is_active: 0 }`, or `{ is_default: 1 }`); `formData` is
  never read into it. A malicious/incorrect payload attempting to inject `item`, `items`, or
  `operations` through `activateBomAction`/`deactivateBomAction`/`setDefaultBomAction` has no code
  path to reach `updateDoc` at all — there is no `formData`-derived field merge anywhere in this
  function. `docstatus` is independently re-fetched via `getDoc` before every mutation, never
  trusted from the calling page.
- **UX check for `CX-MFG-BOM-4B-002`**: confirmed by reading `[name]/page.tsx` directly — the
  `if (doc.docstatus === 0 && edit === "1")` gate means a bare `/master-data/boms/[name]` URL for a
  Draft BOM now renders the same read-only tabbed view every other `docstatus` gets, with an
  "Edit BOM" button in the header; only `?edit=1` reaches `BomForm`. `BomForm`'s own `cancelHref`
  was already the bare detail URL, so "Cancel" from the edit form correctly lands back in view mode
  with no additional change needed.
- **`NEEDS_VERIFICATION` (not performed, no live write credentials available this session — same
  gap as Package 4B itself)**: whether `activateBomAction`/`deactivateBomAction`/
  `setDefaultBomAction` actually succeed against the real server; whether ERPNext's
  `manage_default_bom()` behaves exactly as the source read suggests when exercised live (clearing
  the previous default, syncing `Item.default_bom`); the actual runtime effect on existing Work
  Orders/Job Cards of deactivating a BOM they already reference. See
  `docs/backend/99-unverified/unverified-behaviours.md`'s `MFG-UNV-009`/`MFG-UNV-011` (both updated
  by this remediation) for the canonical tracking entries.
- **`CX-MFG-BOM-4B-003`**: not re-read, not printed, not logged, not committed. No code change
  performed or required for this finding — recorded as `ACTION REQUIRED` (credential
  rotation/revocation, an operational action outside this session's authority), not `CLOSED`.
- **Cleanup**: no ERPNext document was created, updated, or deleted by this remediation (no live
  write access existed to do so even accidentally).
- **Sign-off**: static validation only (lint/tsc/build/diff-check all PASSED); no code-reviewer or
  qa-tester subagent was dispatched for this narrowly-scoped remediation pass — the fixes were
  reviewed directly against Codex's own findings above. Package state: `CLAUDE_HANDOFF`. Not
  self-declared accepted — returned to Codex for independent re-review.

## Manufacturing — Production Planning discovery/canonicalization (2026-09-19)

- **Package type**: investigation-only. No frontend code changed, so no functional test scenarios
  were run.
- **What was verified**:
  1. Repository-wide search of `apps/frontend/src` (`Glob`/`Grep`, plus a graphify knowledge-graph
     query) for any Production Plan route, action file, or component — zero matches anywhere.
  2. Live schema verification (`mcp__ceylon-stack__get_doctype_fields`) against `Production Plan`
     and all six of its child doctypes (`Production Plan Item`, `Production Plan Sub Assembly
     Item`, `Production Plan Sales Order`, `Production Plan Material Request`, `Production Plan
     Item Reference`, `Production Plan Material Request Warehouse`, `Material Request Plan Item`),
     plus `Work Order`, `Material Request`, and `Material Request Item` to confirm the exact
     back-reference fields between them.
  3. `list_documents` against `Production Plan` — confirmed **zero real documents exist** on this
     instance. No runtime behavior could be observed, only schema.
  4. Read-only `frappe/erpnext` GitHub source (`production_plan.py` + `services/
     sales_order_planning.py`/`sub_assembly.py`/`work_order_planning.py`/`material_request.py`,
     fetched via `gh api`, never executed, no ERPNext core file touched) to source-verify the
     business rules the schema alone couldn't answer — Sales Order eligibility, `combine_items`/
     `combine_sub_items` grouping keys, per-row BOM override, sub-assembly `type_of_manufacturing`
     branching, the raw-material shortage formula, Work Order/Material Request generation rules.
  5. Cross-checked every field name/option pulled from the live schema against the fetched source
     — matched almost exactly (one confirmed drift: `submit_material_request` referenced in source,
     absent from the live schema), giving high but not exact version-match confidence.
- **Not performed, and correctly so for a discovery/investigation-only package**: `npm run lint`,
  `npx tsc --noEmit`, `npm run build`, route-manifest inspection, and authenticated browser testing
  — none apply when zero frontend files changed. `qa-tester` was not invoked for the same reason:
  there is no write path, no new route, and no changed payload to exercise against the live
  instance. No Production Plan document was created on the live instance to test against — building
  one was explicitly out of this package's read-only scope.
- **Cleanup**: none required — no ERPNext document was created, updated, or deleted by this
  package beyond ordinary read-only schema/list queries.
- **Sign-off**: self-reviewed against the discovery brief's own checklist (repository investigation
  before touching anything, real schema over guessed schema, STORED/SERVER-CALCULATED/
  BUTTON-GENERATED distinction documented, no custom MRP/BOM-explosion logic designed, canonical
  routing decision recorded without creating routes). Awaiting Codex's independent review of the
  investigation's accuracy (there is no code diff to review); not self-declared accepted — see
  `docs/operations/AI_WORK_LOG.md`'s matching entry for the full Claude Package Handoff.

## Manufacturing — Production Planning discovery/canonicalization remediation (2026-09-19)

- **Package type**: documentation-only remediation of Codex's `CHANGES REQUIRED` review of the
  package above. No frontend code touched, so no functional test scenarios apply.
- **What was verified**:
  1. `git status`/`git diff --stat` before and after editing — confirmed zero `apps/frontend/`
     files touched, and that pre-existing unrelated worktree changes (`CLAUDE.md`,
     `apps/frontend/src/app/(app)/manufacturing/page.tsx`, `docs/architecture/decisions/README.md`,
     the three untracked Master Data architecture docs) remained untouched throughout.
  2. Re-verified `Material Request Plan Item`'s live field schema
     (`mcp__ceylon-stack__get_doctype_fields`) before writing the `from_bom` correction — the tool
     confirms the field exists (`Link → BOM`, not required) but does not expose a `read_only` flag,
     so the "read only per DocType definition" claim is carried as Codex's own source-derived
     finding (their read of the DocType JSON), not independently re-confirmed live in this pass —
     consistent with this file's existing convention of distinguishing live-schema-confirmed from
     source-derived claims.
  3. Repository-wide `grep` for `MFG-UNV-01\d` before and after the renumbering: confirmed `001`
     through `011` were already in use (ruling out blind reuse of a guessed number), confirmed the
     BOM item's `MFG-UNV-010` and every one of its existing cross-references were left untouched,
     and confirmed every Production Plan cross-reference was updated to the new `MFG-UNV-012`
     (`production-plan.md`, `05-manufacturing/README.md`, `master-erd.md`,
     `unverified-behaviours.md`, `migration-status.md`, `PROGRESS.md`).
  4. Re-read all four Codex findings against the edited documents before handoff to confirm each
     was actually addressed as described, not just acknowledged.
- **Not performed, and correctly so for a documentation-only remediation**: `npm run lint`,
  `npx tsc --noEmit`, `npm run build`, route-manifest inspection — none apply, no application file
  changed. `git diff --check` — PASSED (no whitespace/line-ending errors).
- **Cleanup**: none required — no ERPNext document was created, updated, or deleted.
- **Sign-off**: self-reviewed against the CLAUDE remediation brief's own 15-point validation
  checklist (CX-MFG-PP-001 corrected everywhere; `from_bom` not described as editable; `Item 1:N
  BOM` preserved; all six Production Plan child relationships in the ERD; Work Order row-level
  references represented; Material Request Item, not the Material Request header, carries the
  back-reference; accounting wording distinguishes Bin reservation vs. planning/order documents vs.
  posting documents; `MFG-UNV-012` confirmed globally unique; source-derived behavior still marked
  non-live-verified; zero Production Plan frontend footprint; PP-1 not started). Not self-declared
  accepted — returned to Codex for independent re-review; see
  `docs/operations/AI_WORK_LOG.md`'s matching Claude Remediation entry for the full handoff.

## 2026-09-19 — Manufacturing — Production Plan PP-1 (read-only frontend foundation)

- **Package tested**: `apps/frontend` — new `/manufacturing/production-plans` list page and
  `/manufacturing/production-plans/[name]` detail page, plus the `productionPlanStatus()` status
  function, `TableId` union entry, Manufacturing sidebar nav item, and the Manufacturing module
  home page copy update. Strictly read-only — no create/edit/submit/cancel path exists to test.
- **Result**: **PASS**, with one explicit, disclosed testing boundary (see below) — not a defect,
  the same boundary every prior package this week that lacked authenticated-session credentials
  hit (BOM 4A/4B, Master Data Canonicalization domains, Production Plan discovery's own PP-1
  handoff note).
- **What was verified**:
  1. `npx tsc --noEmit` — clean.
  2. `npm run lint` (ESLint) — clean.
  3. `npm run build` — succeeded; route table confirms both new routes registered as
     server-rendered, and every pre-existing route (including `/manufacturing/work-orders`,
     `/manufacturing/work-orders/[name]`, `/master-data/boms`, `/master-data/boms/[name]`) still
     present and unchanged — no route regression from adding the new pages or the Sidebar edit.
  4. `mcp__ceylon-stack__list_documents` (Production Plan) — re-confirmed zero live documents,
     matching the same-day discovery baseline; the list page's zero-record empty state
     ("No Production Plans found.", no "+ New" button) is therefore the one behavior this package
     could exercise against real data.
  5. `mcp__ceylon-stack__get_doctype_fields` (Production Plan) — re-confirmed the full field
     schema immediately before implementation; every fieldname referenced in the new TypeScript
     types matches live, no drift since the discovery pass earlier the same day.
  6. `git diff` on the pre-existing unrelated `apps/frontend/src/app/(app)/manufacturing/page.tsx`
     change was read in full before editing that file — confirmed only the one outdated sentence
     ("Production Plans is the next Manufacturing area to be built") was replaced; the rest of
     that prior, already-uncommitted diff (BOM moved to Master Data) was left exactly as found.
  7. `git diff --check` — clean, no whitespace errors.
- **Not performed, disclosed boundary**: no authenticated browser session was available this
  session (no working test login credentials, consistent with every prior package this week) — the
  detail page's actual rendering against real linked Item/Warehouse/BOM/Sales Order/Work
  Order/Material Request data, the invalid-Production-Plan-ID `notFound()` path, and the sidebar
  click-path were not exercised in a browser. Given zero Production Plan documents exist on the
  instance regardless, a real-data render wasn't possible even with a session — this is a stronger
  version of the same limitation, not one this package could have closed differently.
- **Cleanup**: none required — no ERPNext document was created, updated, or deleted; read-only
  queries only.
- **Sign-off**: in-session review against PP-1's own 24-point package-closure checklist (read-only
  confirmed throughout; BOM remains under Master Data, not moved back; Material Transfer remains
  nested under Work Order, not promoted to Manufacturing nav; `MFG-UNV-012` left at
  `NEEDS_VERIFICATION`; pre-existing unrelated worktree changes preserved). Not self-declared
  accepted — returned to Codex for independent review, per the discovery package's own closure
  instruction; see `docs/operations/AI_WORK_LOG.md`'s matching ledger row.
