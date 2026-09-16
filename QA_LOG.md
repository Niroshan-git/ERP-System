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
