# Material Transfer for Manufacture

**Frappe DocType:** `Stock Entry` (module: Stock), filtered by `purpose = "Material Transfer for
Manufacture"` and `stock_entry_type = "Material Transfer for Manufacture"`, linked via
`work_order`. Not a distinct doctype from ordinary Stock Entry — this document covers only the
Work-Order-linked slice relevant to Manufacturing.
**Canonical entity:** `material_transfer` (a purpose-filtered view of `stock_entry`)
**Frontend route:** `/manufacturing/work-orders/[name]/transfer-materials`
**Verification:** `Documentation: VERIFIED` · `Source Code: VERIFIED` (native method traced) ·
`Runtime Test: VERIFIED` (see Test Scenarios; includes one real bug found and fixed live)

## Native mechanism — not reimplemented

This flow calls ERPNext's own whitelisted method
`erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry` — the exact method Desk's
own "Start" button calls (confirmed by reading `work_order.js` live on the Hetzner instance) —
via `callMethodWithResult`, passing only `work_order_id` + `purpose: "Material Transfer for
Manufacture"`. No outstanding-qty math is recomputed client-side; ERPNext's response is trusted
directly.

## Field mapping — preview response (`make_stock_entry` → `getMaterialTransferPreview`)

| Response field | Canonical | Type | Notes |
|---|---|---|---|
| `purpose` | `material_transfer.purpose` | Data | Always `"Material Transfer for Manufacture"` for this flow |
| `work_order` | `material_transfer.work_order` | Link | |
| `company` | `material_transfer.company` | Link | |
| `from_bom` | `material_transfer.from_bom` | Check | Always `1` here |
| `bom_no` | `material_transfer.bom_no` | Link | |
| `use_multi_level_bom` | `material_transfer.use_multi_level_bom` | Check | Passed through from the Work Order |
| `to_warehouse` | `material_transfer.to_warehouse` | Link → Warehouse | ERPNext's default: the Work Order's WIP warehouse |
| `fg_completed_qty` | `material_transfer.fg_completed_qty` | Float | **Critical field** — see `MFG-STK-001` |
| `items[].item_code` / `item_name` | `material_transfer_item.item_code` / `item_name` | | |
| `items[].qty` / `transfer_qty` | `material_transfer_item.qty` / `transfer_qty` | Float | ERPNext's own proposed remaining-to-transfer amount, headroom included |
| `items[].transferred_qty` | `material_transfer_item.transferred_qty` | Float | Cumulative so far, read from Work Order Item |
| `items[].actual_qty` | `material_transfer_item.actual_qty` | Float | Real Bin-backed stock at the source warehouse — authoritative, no separate lookup |
| `items[].s_warehouse` / `t_warehouse` | `material_transfer_item.source_warehouse` / `target_warehouse` | Link | Defaults; user-editable in the form |
| `items[].allow_alternative_item` | `material_transfer_item.allow_alternative_item` | Check | Already ANDed with the Work Order's own flag — see `MFG-UNV-002` |
| `items[].original_item` | `material_transfer_item.original_item` | Link | Populated only on an `Item Alternative` substitution — unexercised on this instance |

## Field mapping — submit payload (`buildStockEntryFields` → `POST /api/resource/Stock Entry`)

**Server-derived vs. client-supplied (updated 2026-09-17, `CX-MFG-001` fix):** only
`posting_date`, `remarks`, and each line's `item_code`/`qty`/`s_warehouse` are real client input.
`company`/`bom_no`/`use_multi_level_bom`/`to_warehouse`/`fg_completed_qty` and every other
per-line field (`item_name`/`uom`/`stock_uom`/`conversion_factor`) are re-derived server-side
inside `buildStockEntryFields` from a **fresh** `make_stock_entry` call (and, for a non-pending
line, a fresh `Item` lookup) keyed off the route's own trustworthy bound `workOrderName` —
never trusted from a client-submitted hidden field. This closed a real gap: a tampered hidden
`<input>` previously could have posted the transfer against the wrong company/warehouse or with
a stale `fg_completed_qty`, since only the bound `workOrderName` argument (verified server-side
by Next.js) was actually trustworthy before this fix — the rest were plain form fields.

| Frontend field | Frappe field | Notes |
|---|---|---|
| (fixed) | `naming_series` | `"MAT-STE-.YYYY.-"` |
| — | `company` | Server-derived from a fresh `make_stock_entry` call, not client input |
| Posting date | `posting_date` | Required, real client input |
| (fixed) | `purpose` / `stock_entry_type` | Both `"Material Transfer for Manufacture"` |
| — | `work_order` | The bound route parameter, never a form field |
| (fixed) | `from_bom` | From the fresh `make_stock_entry` response |
| — | `bom_no` | Server-derived, not client input |
| — | `use_multi_level_bom` | Server-derived, not client input |
| — | `to_warehouse` | Server-derived; applied uniformly to every line's `t_warehouse` |
| — | `fg_completed_qty` | **Server-derived, not client input** — see `MFG-STK-001` |
| Remarks | `remarks` | Optional free text, real client input |
| Line: item/qty/source warehouse | `items[].item_code` / `qty` / `s_warehouse` | Real client input. A row matching a pending item from the fresh preview is capped at ERPNext's own proposed qty and takes `item_name`/`uom`/`stock_uom`/`conversion_factor` from that preview row; a row not in the pending list (an additional item) has those fields re-derived via a fresh `Item` lookup — never from the client |

## Business rules

- **`MFG-STK-001`** — `fg_completed_qty` gate for additional items. `FRAPPE_CURRENT_BEHAVIOR`,
  live-confirmed bug-then-fix (Package 5): ERPNext's `Stock Entry.update_work_order` (in
  `stock_entry.py`) only calls `add_additional_items()`/`update_work_order_qty()` when
  `self.fg_completed_qty` is truthy. Omitting it let a Stock Entry with a non-BOM item submit
  cleanly (stock moved, no error) while **silently never attaching that item to the Work Order's
  `required_items`** — `is_additional_item`/`voucher_detail_reference` never appeared. This app
  fixed it by threading `preview.fg_completed_qty` from `make_stock_entry`'s own response through
  the form and validating it's present before submit. **Any future integration against this
  method must set `fg_completed_qty` or additional-item attachment silently fails.**
- **`MFG-STK-002`** — Additional material lifecycle. `FRAPPE_CURRENT_BEHAVIOR`, source +
  live-confirmed: submitting an extra (non-BOM) item line calls `add_additional_items()`, which
  inserts a `Work Order Item` row with `is_additional_item=1` and `voucher_detail_reference`
  pointing back to the originating Stock Entry Detail row — bypassing the update-after-submit
  block (`MFG-VAL-002`) because it's a targeted server-side child-row insert, not `doc.save()`.
  Cancelling that Stock Entry calls `remove_additional_items()`, which deletes the row again.
  Gated by `Manufacturing Settings.validate_components_quantities_per_bom` (off on this instance).
- **`MFG-STK-003`** — Quantity headroom. `FRAPPE_CURRENT_BEHAVIOR`: total transferable qty per
  item is capped at `required_qty × (1 + Manufacturing Settings.transfer_extra_materials_percentage
  / 100)`, currently `0%` on this instance (live-confirmed: a 200-unit excess transfer attempt was
  rejected with `"Cannot transfer 200.0 Nos of Item RM-BOLT-M6X20. Maximum transferable quantity
  is 0.0 Nos."`). Non-zero-headroom behavior is `NEEDS_VERIFICATION` (`MFG-UNV-003`).
- **`MFG-VAL-004`** — Warehouse validity is enforced server-side, not just by the frontend's
  warehouse picker (`getStockDefaults()` already filters to `is_group=0, disabled=0`, but ERPNext
  itself independently rejects a group warehouse: live-confirmed `"Group node warehouse is not
  allowed to select for transactions"`).
- **`MFG-WF-003`** — Draft never moves stock; only Submit does. Live-confirmed: a Draft Material
  Transfer for Manufacture Stock Entry left `Bin.actual_qty` and the Work Order's
  `transferred_qty` unchanged. The frontend exposes this as two separate actions
  (`saveTransferDraftAction` vs. `submitTransferAction`) rather than one implicit save-and-submit.
- **`MFG-VAL-005`** — Batch/serial guard (frontend-only safety, not an ERPNext-enforced block at
  this step): rows whose item has `has_batch_no`/`has_serial_no` set are disabled in the form with
  an explanatory message, since no batch/serial picker UI exists yet. None of the 3 real raw
  materials on this instance currently require it, so this path is built but not live-exercised
  against a real batch/serial item.

## Eligibility gate — `canTransferMaterials()` (`erpStatus.ts`)

Mirrors ERPNext Desk's own "Start" button visibility rule verbatim, read from `work_order.js`
(not guessed): `docstatus === 1` AND status not in `{Closed, Completed, Stopped}` AND
`!skip_transfer` AND `transfer_material_against !== "Job Card"` AND `!track_semi_finished_goods`
AND at least one `required_items` row has `transferred_qty < required_qty`. Desk's own
"Additional Material Transfer" button (shown once nothing is pending but headroom still allows
more) is out of scope — headroom is 0% on this instance, live-confirmed.

## Stock impact

Source warehouse (per-line, user-selectable) → target warehouse (uniformly the Work Order's WIP
warehouse, from `to_warehouse`). Increases `work_order_item.transferred_qty` on submit; a
Draft has zero stock effect (`MFG-WF-003`).

## Accounting impact

`NEEDS_VERIFICATION` — not inspected this session. See `MFG-UNV-005`.

## API behavior

- Preview: `POST /api/method/erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry`
  with `{work_order_id, purpose}` — wrapped by `callMethodWithResult()` /
  `getMaterialTransferPreview()`. Never throws for "nothing pending" (returns `items: []`); a
  thrown error is always a real failure (permission/ineligibility/ERPNext down), surfaced as a
  discriminated `{error}` result distinct from the empty-items case (a code-review fix during
  Package 5 — a 403 previously looked identical to "nothing to transfer").
- Create: `POST /api/resource/Stock Entry` — wrapped by `createDoc()`.
- Submit: `PUT` via `submitDoc()` — a separate step; if it fails after create succeeds, the
  Draft is left in place (named in the error) rather than silently discarded.

## Test scenarios (live-run — see `QA_LOG.md` 2026-09-17 Package 5 for full detail)

**`MFG-TEST-010`** — Draft, not submitted: `Bin.actual_qty` and `transferred_qty` both unchanged.
Confirms `MFG-WF-003`.

**`MFG-TEST-011`** — Partial transfer: 4.0 of 8.0 Kg required → Work Order shows Required 8.0 /
Transferred 4.0.

**`MFG-TEST-012`** — Full transfer of the remainder on a second visit → Transferred 8.0 /
Remaining 0 across all lines.

**`MFG-TEST-013`** — Additional material, pre-fix: submitted without `fg_completed_qty` → stock
moved but `required_items` never gained the new row. Confirms the `MFG-STK-001` bug.

**`MFG-TEST-014`** — Additional material, post-fix: same scenario with `fg_completed_qty` set →
new `required_items` row with `is_additional_item: 1` and a real `voucher_detail_reference`;
cancelling the Stock Entry removed the row again. Confirms `MFG-STK-001`/`MFG-STK-002`.

**`MFG-TEST-015`** — Excess quantity (200 units against a fully-satisfied line) → rejected,
confirms `MFG-STK-003`.

**`MFG-TEST-016`** — Group warehouse as source → rejected, confirms `MFG-VAL-004`.

**`MFG-TEST-017`** — BOM (`BOM-FG-STEEL-BRACKET-ASSY-001`) read before/after every mutation across
all scenarios above — byte-identical every time. Confirms Material Transfer for Manufacture never
touches the master BOM.
