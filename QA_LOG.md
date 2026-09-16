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
