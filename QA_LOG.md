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
