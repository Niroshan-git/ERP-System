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

### MFG-UNV-007 — Work Order Operation `time_in_mins` qty-scaling convention on create
**Status:** `NEEDS_VERIFICATION` (Codex governance-closure finding `CX-MFG-002`, fixed 2026-09-17)
**What's uncertain:** `work-orders/actions.ts`'s `createWorkOrderAction` now sends an `operations`
array on Work Order create (previously omitted — ERPNext's own `validate()` populates
`required_items` from `bom_no`+`qty` on a plain REST insert but leaves `operations` empty,
live-confirmed). Each `time_in_mins` is scaled by `qty / bom.quantity` — the same ratio this
package already uses for `required_items`' quantities — but this specific scaling convention for
*operation time* has not been independently confirmed against Desk's own client-side BOM→Work
Order copy behavior (no SSH/`bench console` access in the session that made this fix). It is a
reasoned choice (BOM operation time is defined against the BOM's own reference `quantity`), not a
verified one.
**How to verify:** Create a real Work Order from Desk itself (not this app) against a BOM with
operations, at a qty different from the BOM's reference quantity, and compare the resulting Work
Order Operation `time_in_mins` values to what this app's scaling produces for the same inputs.

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
