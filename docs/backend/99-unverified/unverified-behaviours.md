# Unverified Behaviours

Per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §6. Never invent Frappe behavior — anything
uncertain is logged here with how it should be verified. This must never block delivery.

## MFG — Manufacturing

### MFG-UNV-001 — Work Order Desk list-view indicator colors not independently confirmed
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** `apps/frontend/src/lib/erpStatus.ts`'s `WORK_ORDER_STATUS_TONE` map (Draft/
Submitted/Not Started/In Process/Stock Reserved/Stock Partially Reserved/Completed/Stopped/
Closed/Cancelled → tone) is this app's own reasonable mapping onto its 3-tone system. Unlike
every other status function in that file, it was **not** built by reading `work_order_list.js`'s
real `get_indicator` source (no SSH/devops access in the session that built it) — only the
`status` field's enum itself was live-verified via `get_doctype_fields`.
**How to verify:** SSH to the Hetzner instance, read
`erpnext/manufacturing/doctype/work_order/work_order_list.js`'s `get_indicator` function body
directly (same method already used for every other status function in `erpStatus.ts`), then
compare/update the tone map to match.

### MFG-UNV-002 — Item Alternative substitution path unexercised end-to-end
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** Confirmed by source reading only (`item_alternative.py`,
`get_alternative_items`, `Stock Entry Detail.original_item`/`allow_alternative_item`) — the
mechanism exists in ERPNext, but no `Item Alternative` records exist on this instance and no item
has `allow_alternative_item` set, so it has never been exercised live.
**How to verify:** Set up `Item Alternative` master data + `allow_alternative_item` on a real item
and BOM, then live-test a substitution through a Material Transfer for Manufacture Stock Entry.

### MFG-UNV-003 — `transfer_extra_materials_percentage` headroom behavior above 0%
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** Only the `0%` (no headroom) case has been live-tested (excess-quantity
transfer correctly rejected). The actual headroom arithmetic when this `Manufacturing Settings`
value is non-zero has not been exercised.
**How to verify:** Set `transfer_extra_materials_percentage` to a non-zero value on a test/staging
instance and re-run the excess-quantity transfer scenario from
`docs/backend/05-manufacturing/material-transfer.md`'s test scenarios.

### MFG-UNV-004 — Job Card and BOM document lifecycle
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** Job Card fields are read (via the Work Order detail page's Job Cards tab
and `apps/mcp-server`'s `get_job_card_detail`/`list_job_cards` tools) but Job Card's own
Create/Save/Submit/Cancel lifecycle, validations, and downstream effects (time logs, operation
completion, OEE feed) have not been investigated. Same for BOM as its own entity — only read via
`getDoc("BOM", ...)` for the Work Order create preview; BOM's own versioning/approval/costing
lifecycle is undocumented.
**How to verify:** Scoped investigation when the Job Card or BOM frontend package is picked up,
per the Current Mission priority lock.

### MFG-UNV-005 — Accounting (GL) impact of Material Transfer for Manufacture
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** A submitted Material Transfer for Manufacture Stock Entry is known to move
stock (source warehouse → WIP warehouse, live-confirmed via `Bin.actual_qty` and Work Order
`transferred_qty`), but the resulting GL Entry (debit/credit account roles, whether it posts at
all given this is a stock-to-stock transfer rather than a stock-to-expense one) has not been
inspected on this instance.
**How to verify:** Submit a real Material Transfer for Manufacture Stock Entry on the dev instance
and inspect the resulting `GL Entry` rows directly (`bench console` or Desk's own GL Entry report).

### MFG-UNV-006 — `+ Add Material` doesn't pre-check already-fully-transferred lines
**Status:** `NEEDS_VERIFICATION` (flagged non-blocking by `code-reviewer` during Package 5)
**What's uncertain:** `MaterialTransferForm.tsx`'s "+ Add Material" lets a user re-add an item
whose required quantity is already fully transferred, tagging it `ADDITIONAL` client-side before
ERPNext's own server-side check would reject it as excess (under the current 0% headroom). Purely
a client-side pre-check gap — ERPNext's own submit-time validation is still authoritative — but
not fixed, since it was judged cosmetic.
**How to verify:** Not urgent; revisit if headroom (`MFG-UNV-003`) is ever raised above 0%, which
would change how "already satisfied" is judged client-side too.

### MFG-UNV-007 — Work Order Operation field-copy convention on create
**Status:** `NEEDS_VERIFICATION`, non-blocking (Codex governance-closure finding `CX-MFG-002`;
first fix 2026-09-17 returned `CHANGES REQUIRED`; re-fix 2026-09-18 returned `CHANGES REQUIRED`
again on the costing/BOM-reference mapping specifically; final correction 2026-09-18 accepted by
Codex's final re-review — `CX-MFG-002` is `CLOSED` as a finding, commit `a2b5cb8` — but the
underlying field-copy convention documented here still carries open, non-blocking runtime
verification; see `docs/backend/05-manufacturing/work-order.md`'s Work Order Operation table and
`MFG-VAL-006`)

**Source/schema-verified (via `get_doctype_fields` against the installed instance, 2026-09-18):**
- `BOM Operation` has both `hour_rate` (Currency, linked to the BOM's transaction currency) and
  `base_hour_rate` (Currency, explicitly labelled "Base Hour Rate (Company Currency)").
- `Work Order Operation.hour_rate` is a plain `Float` with no currency-link `options` at all —
  i.e. it is not transaction-currency-aware, consistent with it being meant to hold the
  company-currency value.
- `Work Order Operation` has its own `bom` field (Link → BOM) with no equivalent field on `BOM
  Operation` — `BOM Operation`'s own owning-BOM reference is the Frappe child-table meta field
  `parent`, not a declared schema field (so it never appeared in the `get_doctype_fields` dump).
- Two candidate native population entry points were tested directly against the live instance as
  **module-level dotted-path calls** (read-only GET against `/api/method/<dotted.path>`, both
  errored before any write) and confirmed unavailable **at that specific invocation boundary**:
  `erpnext.manufacturing.doctype.work_order.work_order.get_items_and_operations_from_bom` and
  `erpnext.manufacturing.doctype.bom.bom.make_work_order` both returned
  `AttributeError: module '...' has no attribute '...'` — the installed Python modules genuinely
  export no function at either dotted path. **Scope of this evidence, precisely:** this rules out
  those two module-level invocation paths only. It does **not** prove that an identically named
  method is unavailable as a **Frappe Document-bound method** — the boundary ERPNext Desk actually
  uses for form-triggered calls like `frm.call({doc, method: "..."})`, which POSTs to a different
  endpoint (`run_doc_method`) than a plain module-level `/api/method/<dotted.path>` GET. Desk may
  invoke `get_items_and_operations_from_bom` (or an equivalent) as such a document method; that
  boundary was not tested this session and remains open for future investigation. Given that gap,
  Ceylon Stack retained the manual parity mapping below for this package's currently supported
  create flow rather than build against an unverified native path.

**Runtime-verified (read-only GET against the one real BOM on this instance,
`BOM-FG-STEEL-BRACKET-ASSY-001`, 2026-09-18):** both of its operation rows have `parent ===
"BOM-FG-STEEL-BRACKET-ASSY-001"` (i.e. `parent === bom_no`, confirming the `bom: bom_no` mapping
is correct for this app's non-exploded, single-top-level-BOM scope) and `hour_rate === 
base_hour_rate` (1200.0 and 900.0 respectively) — this BOM's currency (`LKR`) equals both
companies' default currency (`LKR`, `conversion_rate: 1.0`), so the `hour_rate`/`base_hour_rate`
correction produces **no observable difference on this instance today**. The bug this fixes only
manifests when a BOM is priced in a non-company transaction currency, which no BOM on this
instance currently is.

**Ceylon Stack mapping, current (2026-09-18 final correction):** copies every `BOM Operation`
field that also exists on `Work Order Operation`, isn't a Work-Order-lifecycle field ERPNext
computes itself, and has a correct-currency/correct-reference source: `operation`, `bom` (from
`bom_no`, not a per-row fetch), `workstation`, `workstation_type`, `sequence_id`, `time_in_mins`
(scaled `qty / bom.quantity` unless `fixed_time`), `batch_size`, `hour_rate` (from `BOM
Operation.base_hour_rate`, not `hour_rate`), `quality_inspection_required`, `is_subcontracted`,
`skip_material_transfer`, `backflush_from_wip_warehouse`,
`source_warehouse`/`wip_warehouse`/`fg_warehouse`, `description`.

**Still genuinely unconfirmed (all non-blocking for the accepted `CX-MFG-002` correction):**
1. **Native persistence comparison.** Whether ERPNext's own native BOM→Work Order copy (Desk's
   client-side form script, `work_order.js`, and/or a Document-bound method it calls) sends this
   exact field set and applies the same `fixed_time` scaling rule for: fixed operations,
   scaled/non-fixed operations, operation costing, the BOM reference, and the routing/warehouse/
   operation flags — reasoned from schema/labels and narrowed by the module-level-only probe
   above, but neither `work_order.js`'s client-side logic nor a Document-bound method invocation
   was read or tested this session (no SSH/`bench console`/vendored-source access). A supported
   document-method boundary for native invocation remains a legitimate avenue for a future
   package, not ruled out by this session's evidence.
2. **Work Order validation/controller override behavior.** Whether `validate()` itself overrides
   any of the supplied fields (particularly `hour_rate`/`batch_size`) from the Workstation or
   Operation master regardless of what this app sends.
3. **Foreign-currency runtime scenario.** A BOM priced in a transaction currency other than the
   company's default (`conversion_rate != 1`) end to end — reasoned correct from the field schema
   (`Work Order Operation.hour_rate` should end up equal to the source `BOM
   Operation.base_hour_rate`), not runtime-exercised, because no such BOM exists on this instance.

**How to verify:** (1) Create a real Work Order from Desk itself (not this app) against a BOM that
has at least one `fixed_time` operation, at a qty different from the BOM's reference quantity, and
diff the resulting Work Order Operation rows — including costing, BOM reference, and routing/
warehouse/operation flags — against this app's create payload for the same inputs. (2) Create or
price a BOM in a non-LKR transaction currency with a non-1 `conversion_rate` and confirm the
created Work Order Operation's `hour_rate` equals that BOM's `base_hour_rate`, not its
`hour_rate`. (3) If pursued, investigate whether `get_items_and_operations_from_bom` (or an
equivalent) exists as a Document-bound method reachable via Frappe's `run_doc_method` boundary,
as a supported native alternative to the current manual mapping. No BOM with a `fixed_time`
operation or a foreign transaction currency currently exists on this instance.

### MFG-UNV-008 — Duplicate `item_code` rows in `required_items` / Material Transfer preview
**Status:** `NEEDS_VERIFICATION` (Codex governance-closure finding `CX-MFG-006`, partially
mitigated 2026-09-17)
**What's uncertain:** Package 4's investigation live-confirmed that a Draft-stage item
substitution can leave two `Work Order Item` rows sharing the same `item_code` (nothing merges
them). Whether ERPNext's own `make_stock_entry` (the RPC `getMaterialTransferPreview` calls) ever
returns two `items` rows with the same `item_code` in its response — as opposed to merging them
server-side before returning — has not been confirmed. Mitigated defensively regardless: React
`key`s in both the Work Order Detail Materials tab and `MaterialTransferForm.tsx` now use row
index rather than `item_code`, and `MaterialTransferForm.tsx`'s per-row qty/warehouse state
(`qtyByIndex`/`warehouseByIndex`) is now index-keyed too, so a duplicate `item_code` can no longer
collapse two rows' state into one — but whether the scenario can actually reach this screen at all
remains unconfirmed.
**How to verify:** Reproduce Package 4's substitution steps live (leaving a duplicate `item_code`
in `required_items`), then call `make_stock_entry` against that Work Order and inspect whether the
response's `items` array contains one merged row or two duplicate rows.

## General

Add new entries here as they're discovered during other domain baselines (Sales, Inventory,
Buying). Do not remove an entry until it's actually been verified — replace its `STATUS` line and
note how/when it was resolved instead of deleting the record.
