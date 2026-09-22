# Manufacture Stock Entry ("Complete Production")

**Frappe DocType:** `Stock Entry` (module: Stock), filtered by `purpose = "Manufacture"` and
`stock_entry_type = "Manufacture"`, linked via `work_order`. Same non-distinct-doctype shape as
`material-transfer.md` — this document covers only the Work-Order-linked Manufacture slice.
**Canonical entity:** `manufacture_entry` (a purpose-filtered view of `stock_entry`)
**Frontend route:** `/manufacturing/work-orders/[name]/complete-production`
**Verification:** `Documentation: VERIFIED` · `Source Code: VERIFIED` — native method body, the
active `Stock Entry.get_items()` branch, live `Manufacturing Settings` values, and Work Order
side-effect chain all read directly from the installed ERPNext v16.34.2 source on the Hetzner
instance (`/home/frappe/frappe-bench/apps/erpnext/erpnext/`, site `frontend`) via SSH by the
`devops` subagent during this package's investigation — not guessed, not carried over from
general ERPNext knowledge · `Runtime Test: NOT RUN` — see "Live QA" below; this session had no
SSH, browser, or write-capable tool access after the read-only source investigation completed
(sandbox denied direct SSH from the main session; only read-only MCP tools and the `devops`
subagent's one investigation pass were available), so no Stock Entry was actually created,
submitted, or inspected this session. Lint/type-check/build only — see "Tests" in the handoff.

## Native mechanism — not reimplemented

This flow calls the same ERPNext whitelisted method Material Transfer already uses,
`erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry`, with
`purpose: "Manufacture"` instead of `"Material Transfer for Manufacture"`. Source-confirmed body
(`work_order.py`, line 2709, v16.34.2):

```python
stock_entry.fg_completed_qty = qty if qty is not None else (flt(work_order.qty) - flt(work_order.produced_qty))
if purpose == "Material Transfer for Manufacture":
    stock_entry.to_warehouse = wip_warehouse
else:  # "Manufacture"
    stock_entry.from_warehouse = (
        work_order.source_warehouse if work_order.skip_transfer and not work_order.from_wip_warehouse else wip_warehouse
    )
    stock_entry.to_warehouse = work_order.fg_warehouse
    if work_order.bom_no:
        stock_entry.inspection_required = frappe.db.get_value("BOM", work_order.bom_no, "inspection_required")
stock_entry.get_items()
stock_entry.set_secondary_items_from_job_card()
stock_entry.set_serial_no_batch_for_finished_good()
```

`fg_completed_qty` defaults to the Work Order's full remaining qty (`qty - produced_qty`) but
accepts any explicit override — this is the mechanism behind "Quantity to Complete Now" (partial
production). `make_stock_entry` itself performs **no validation** on the passed qty; see
"Over-production guard" below for where that's actually enforced.

`Stock Entry.get_items()` (`stock_entry.py`, line 2995) for `purpose == "Manufacture"` branches on
`get_backflush_based_on()` (which reads `Manufacturing Settings.backflush_raw_materials_based_on`,
per-BOM-overridable). **Live-confirmed on this instance:** `backflush_raw_materials_based_on =
"BOM"` and `material_consumption = 0`, so the active path is `get_bom_raw_materials(fg_completed_qty)`
→ `get_bom_items_as_dict(bom_no, company, qty=fg_completed_qty, fetch_exploded=use_multi_level_bom)`
— raw materials computed **fresh from the BOM's own recipe** at the requested `fg_completed_qty`,
each row's `s_warehouse` taken from the BOM row's own `source_warehouse` field (overridden
uniformly to the Work Order's WIP warehouse only if `Work Order.from_wip_warehouse` is checked —
live-confirmed as its own real field, `"Backflush Raw Materials From Work-in-Progress Warehouse"`,
via `get_doctype_fields`). The alternative "Material Transferred for Manufacture" backflush mode
(`add_transfered_raw_materials_in_items`, sourcing proportionally from what was actually
transferred into WIP) is **not the active path on this instance** and therefore not exercised by
this frontend build — `MFG-UNV-013` if this instance's `Manufacturing Settings` is ever changed.

The finished-goods row is added by `load_items_from_bom()` (line 3371): `item_code =
production_item`, `to_warehouse = fg_warehouse`, `qty = fg_completed_qty - process_loss_qty`,
`is_finished_item = 1`. `process_loss_qty` (a Stock Entry header field, not a separate item row)
is computed by `set_process_loss_qty()` from the BOM's `process_loss_percentage` (or any pending
Job Card/operation-level loss) — read from the preview response, never recomputed client-side.

## Field mapping — preview response (`make_stock_entry` → `getManufacturePreview`)

| Response field | Canonical | Type | Notes |
|---|---|---|---|
| `purpose` | `manufacture_entry.purpose` | Data | Always `"Manufacture"` for this flow |
| `stock_entry_type` | `manufacture_entry.stock_entry_type` | Link | Same value as `purpose` — mirrors the pattern already established for Material Transfer's `stock_entry_type` |
| `work_order` | `manufacture_entry.work_order` | Link | |
| `company` | `manufacture_entry.company` | Link | Straight copy from `work_order.company`, no re-lookup |
| `from_bom` | `manufacture_entry.from_bom` | Check | Always `1` here |
| `bom_no` | `manufacture_entry.bom_no` | Link | Straight copy from `work_order.bom_no`, no re-lookup |
| `use_multi_level_bom` | `manufacture_entry.use_multi_level_bom` | Check | Passed through from the Work Order |
| `from_warehouse` | `manufacture_entry.from_warehouse` | Link → Warehouse | `work_order.source_warehouse` only if `skip_transfer && !from_wip_warehouse`; otherwise the WIP warehouse |
| `to_warehouse` | `manufacture_entry.to_warehouse` | Link → Warehouse | Always `work_order.fg_warehouse` — **not defaulted to anything else**; if unset, this app blocks the screen (see "Business rules") |
| `fg_completed_qty` | `manufacture_entry.fg_completed_qty` | Float | The quantity being completed in *this* entry — user-chosen, capped server-side at remaining qty |
| `process_loss_qty` | `manufacture_entry.process_loss_qty` | Float | Header field; subtracted from the FG row's own qty already, not a separate item row |
| `inspection_required` | `manufacture_entry.inspection_required` | Check | Copied from `BOM.inspection_required` |
| `items[].item_code` / `item_name` | `manufacture_entry_item.item_code` / `item_name` | | |
| `items[].qty` / `transfer_qty` | `manufacture_entry_item.qty` / `transfer_qty` | Float | ERPNext's own BOM-scaled quantity for this row at the requested `fg_completed_qty` |
| `items[].s_warehouse` / `t_warehouse` | `manufacture_entry_item.source_warehouse` / `target_warehouse` | Link | Raw material rows carry `s_warehouse` only; the finished-goods row carries `t_warehouse` only — both ERPNext-computed, **not user-editable in this app** (see "Business rules") |
| `items[].is_finished_item` | `manufacture_entry_item.is_finished_item` | Check | `1` on exactly one row (the production item) |
| `items[].secondary_item_type` | `manufacture_entry_item.secondary_item_type` | Select | `Scrap` / `Co-Product` / `By-Product` / `Additional Finished Good` when present — passed through and displayed, not independently verified this session (no scrap items exist on this instance's one real BOM, per `material-transfer.md`'s `MFG-TEST-017` note) — `NEEDS_VERIFICATION` |

## Field mapping — submit payload (`buildManufactureStockEntryFields` → `POST /api/resource/Stock Entry`)

**Deliberately zero client-editable item rows** — a stricter trust boundary than Material
Transfer's. Only `fg_completed_qty`, `posting_date`, and `remarks` are real client input; every
`items[]` row and every header field (`company`/`bom_no`/`use_multi_level_bom`/`from_warehouse`/
`to_warehouse`/`process_loss_qty`/`inspection_required`) is taken verbatim from a **fresh**
`make_stock_entry` call re-run inside the Server Function itself, keyed off the route's own
trustworthy bound `workOrderName` — never a client round-trip of what the page earlier rendered.
This is stricter than Material Transfer because ERPNext's Manufacture flow has **no equivalent of
Material Transfer's "additional item" mechanism** — `add_additional_items()` is specific to the
`"Material Transfer for Manufacture"` purpose (confirmed against the source read this session;
Manufacture's `get_items()` branch has no analogous "extra item the user adds" path) — so there is
no legitimate reason for this screen to accept arbitrary client item rows at all.

| Frontend field | Frappe field | Notes |
|---|---|---|
| (fixed) | `naming_series` | `"MAT-STE-.YYYY.-"` — same single series Stock Entry uses regardless of purpose |
| — | `company` | Server-derived from a fresh `make_stock_entry` call, not client input |
| Posting date | `posting_date` | Hardcoded to today's date in the form (same convention `MaterialTransferForm.tsx` uses — not user-editable in this package) |
| (fixed) | `purpose` / `stock_entry_type` | Both `"Manufacture"` |
| — | `work_order` | The bound route parameter, never a form field |
| Quantity to Complete Now | `fg_completed_qty` | Real client input — validated server-side against a **freshly re-fetched** `work_order.qty - produced_qty` ceiling (never the page's earlier render), then re-passed into a fresh `make_stock_entry(qty=...)` call whose own response becomes every other field below |
| (fixed) | `from_bom` / `bom_no` / `use_multi_level_bom` / `from_warehouse` / `to_warehouse` / `process_loss_qty` / `inspection_required` | All server-derived from that fresh call, not client input |
| Remarks | `remarks` | Optional free text, real client input |
| Items | `items[]` | **Entirely server-derived** — every row (raw materials, the finished-goods row, and any scrap/co-product rows) copied verbatim from the fresh preview's own `items`, zero client editing |

## Business rules

- **`MFG-STK-004`** — Target (FG) Warehouse is mandatory but has no ERPNext-side default gate.
  `FRAPPE_CURRENT_BEHAVIOR`, source-confirmed: `make_stock_entry` sets `to_warehouse =
  work_order.fg_warehouse` unconditionally for Manufacture purpose — if that field is empty (it's
  optional at Work Order create time, see `work-order.md`), the resulting FG row would have no
  target warehouse and ERPNext would reject the entry at validate/submit time. This app checks
  `preview.to_warehouse` truthiness and blocks the whole screen with a clear message rather than
  letting the user reach a late ERPNext rejection — but this app also has **no Work Order edit UI**
  to let the user fix a missing `fg_warehouse` after create, a real, disclosed gap (not built
  around). All real Work Orders on this instance found during investigation (`MFG-WO-2026-00003`,
  `-00006`, `-00008`) do have `fg_warehouse` set, so this gap is not expected to block QA, but a
  Work Order created without one (via this app's own create form, which allows `fg_warehouse` to
  be blank) would hit this block with no in-app remedy. `NEEDS_VERIFICATION`/follow-up candidate,
  not fixed in this package (out of MFG-CLOSE-1's scope per its own boundary).
- **`MFG-STK-005`** — Over-production guard is enforced only at Stock Entry submit time, not at
  preview time. `FRAPPE_CURRENT_BEHAVIOR`, source-confirmed: `make_stock_entry()` and
  `Stock Entry.get_items()` perform no qty-ceiling validation at all. The actual enforcement is
  `Stock Entry.on_submit()` → `update_work_order()` → `Work Order.update_work_order_qty()`
  (`work_order.py`, line 798), which recomputes `produced_qty` fresh from all submitted Manufacture
  entries and compares `produced_qty + process_loss_qty` against `work_order.qty × (1 +
  overproduction_percentage_for_work_order / 100)` — throws `StockOverProductionError` if exceeded.
  This instance's `overproduction_percentage_for_work_order = 0.0` (live-confirmed), i.e. **zero
  allowance** — any submit that would push production even slightly past `qty` is rejected. This
  app pre-validates `fg_completed_qty ≤ remaining` server-side in `actions.ts` before ever calling
  `make_stock_entry`, purely so a user gets an earlier, clearer message — ERPNext's own submit-time
  check remains the actual enforcement point of record and is never bypassed or duplicated in
  meaning.
- **`MFG-STK-006`** — Concurrent-production race is closed the same way Material Transfer already
  closes its equivalent race (`MFG-SEC-001`'s eligibility re-check pattern): `actions.ts` re-fetches
  the Work Order fresh and re-runs `canCompleteProduction()` inside the Server Function itself,
  immediately before building any Stock Entry field — a Work Order that was eligible when the page
  rendered but was completed/stopped, or had its remaining qty reduced by someone else's concurrent
  Manufacture entry, by the time this action runs, is caught here rather than trusting the page's
  earlier render. The final backstop is still `MFG-STK-005` at ERPNext's own submit time, in case
  two submissions race between this app's re-check and the actual ERPNext write.
- **`MFG-STK-007`** — Raw material consumption source, this instance. `FRAPPE_CURRENT_BEHAVIOR`,
  source + live-config-confirmed: with `backflush_raw_materials_based_on = "BOM"` and
  `material_consumption = 0`, and no real Work Order on this instance having `from_wip_warehouse`
  checked, raw materials are consumed **directly from each BOM item's own configured
  `source_warehouse`**, not necessarily the WIP warehouse a prior Material Transfer moved stock
  into. This means, on this instance's current configuration, a Manufacture entry does not strictly
  require a prior Material Transfer for Manufacture to have happened first — a real, somewhat
  surprising finding from this package's source investigation, not previously documented. Whether
  this holds for every future BOM (a BOM item could carry a different `source_warehouse` than the
  WIP warehouse) is `NEEDS_VERIFICATION` per-BOM; this app never assumes a specific warehouse
  itself, always trusting whatever `s_warehouse` `make_stock_entry` returns per row.
- **`MFG-STK-008`** — No "additional item" mechanism for Manufacture purpose. Source-confirmed
  (see "Field mapping — submit payload" above): unlike Material Transfer's `add_additional_items`,
  there is no ERPNext-native path for a user to add an extra, non-BOM item to a Manufacture Stock
  Entry from this app. This is why the submit payload's `items[]` is 100% server-derived with no
  client item-editing UI at all, rather than mirroring `MaterialTransferForm.tsx`'s "+ Add
  Material" pattern.
- **`MFG-VAL-007`** — Batch/serial guard (frontend-only, fail-closed). This instance's
  `Manufacturing Settings.make_serial_no_batch_from_work_order = 0` (live-confirmed), meaning
  ERPNext's own auto-batch/serial-creation paths for the finished-goods row
  (`set_batchwise_finished_goods`/`add_batchwise_finished_good`) are inactive, and this app builds
  no batch/serial picker UI for either the FG row or raw material rows. `complete-production`'s page
  and `actions.ts` both independently check every row's underlying Item (`has_batch_no`/
  `has_serial_no` via `getItemLineDefaults`) and block the whole screen/submission if any row
  requires it — same fail-closed convention `MaterialTransferForm.tsx` already established, applied
  here to every row (raw material, finished good, and any scrap/co-product row), not just the
  finished item. None of the real BOM's items on this instance currently require batch/serial
  (per `material-transfer.md`'s equivalent note), so this path is built but not live-exercised.
  **Code-review fix (same package):** the first-pass guard used `itemFlags[i]?.has_batch_no`
  optional chaining, which silently treated an Item-lookup failure (`getItemLineDefaults`
  returning `null` on a network blip/permission issue/deleted Item) the same as "doesn't require
  batch/serial" — a fail-*open* gap on a lookup error, contradicting this rule's own "fail-closed"
  framing. Fixed in both `page.tsx` and `actions.ts`: an unverifiable item now blocks with its own
  distinct "Could not verify ..." message, checked before the batch/serial check — same shape
  `transfer-materials/actions.ts`'s `if (!defaults) return { error: ... }` guard already used for
  additional-item rows.

## Work Order side-effects on submit

Source-confirmed (`stock_entry.py` `on_submit()` → `update_work_order()`, `work_order.py`):

- **`produced_qty`** (Work Order header) — `Work Order.update_work_order_qty()` recomputes it
  fresh from `get_transferred_or_manufactured_qty()` (sum of all submitted Manufacture entries'
  `fg_completed_qty`), not incremented in place — `db_set("produced_qty", qty)`.
- **`consumed_qty`** (per `Work Order Item` child row, not a header field) — recalculated by
  `update_consumed_qty_for_required_items()` → `get_consumed_qty()`: `SUM(Stock Entry Detail
  .transfer_qty)` across submitted Stock Entries with `purpose in ("Manufacture", "Material
  Consumption for Manufacture")`, `s_warehouse IS NOT NULL`, matched by `item_code`/`original_item`.
  Written by every Manufacture *and* Material Transfer submit/cancel (both call `update_status()`).
- **`process_loss_qty`** (Work Order header, distinct field from the Stock Entry's own header
  field of the same name) — `Work Order.set_process_loss_qty()`, summed from submitted Stock
  Entries (or operation-level loss if `track_semi_finished_goods`).
- **`status`** — `Work Order.get_status()`: `"Completed"` once `produced_qty + process_loss_qty >=
  qty` at full precision; `"In Process"` if any material transferred or any operation not
  `"Pending"`; `"Not Started"` otherwise.
- **`additional_costs`** — `add_additional_cost(self, work_order)` pulls Job Card operation costs
  into the Stock Entry's own `additional_costs` table when present; not exercised on this instance
  (no Job Cards populated with cost data). Preserved verbatim if ERPNext returns it — never
  stripped or recomputed (§19 of this package's own instructions).

## Eligibility gate — `canCompleteProduction()` (`erpStatus.ts`)

Deliberately conservative, **not** a mirrored Desk button-visibility rule (no Desk
`work_order.js` "Manufacture"/"Finish" button source was read this session — only the underlying
`make_stock_entry` mechanics were, via the `devops` subagent's SSH investigation): `docstatus ===
1` AND status not in `{Closed, Completed, Stopped}` AND `!track_semi_finished_goods` AND
`transfer_material_against !== "Job Card"` AND remaining qty (`qty - produced_qty`) `> 0`.
`skip_transfer` is deliberately **not** checked (unlike `canTransferMaterials`) — a Work Order that
skips the transfer step still needs a Manufacture entry to actually produce; `skip_transfer` only
changes where raw materials are sourced from (`MFG-STK-007`), not whether Manufacture is allowed.

## Stock impact

Source warehouse (per BOM item's own `source_warehouse`, or uniformly the WIP warehouse if
`from_wip_warehouse` is checked — `MFG-STK-007`) → target warehouse (the Work Order's FG
warehouse). Writes `Work Order.produced_qty` (recomputed, not incremented) and each required
item's `consumed_qty` on submit; a Draft has zero stock effect, same `MFG-WF-003` rule Material
Transfer already established (Draft never moves stock for any Stock Entry purpose).

## Accounting impact

`NEEDS_VERIFICATION` — not inspected this session (no live Stock Entry was created to inspect
resulting GL Entries; the source investigation covered stock/Work-Order mechanics, not the
accounting posting chain). ERPNext's Manufacture Stock Entry is well known to post GL entries for
raw material consumption and finished-goods receipt when perpetual inventory accounting is
enabled, but this instance's actual accounting configuration and the resulting entries were not
verified this session — flagged here rather than asserted.

## API behavior

- Preview: `POST /api/method/erpnext.manufacturing.doctype.work_order.work_order.make_stock_entry`
  with `{work_order_id, purpose: "Manufacture", qty?}` — wrapped by `callMethodWithResult()` /
  `getManufacturePreview()`. Never throws for a normal proposal; a thrown error is a real failure
  (permission/ineligibility/ERPNext down), surfaced as a discriminated `{error}` result, same
  pattern `getMaterialTransferPreview` already established.
- Create: `POST /api/resource/Stock Entry` — wrapped by `createDoc()`.
- Submit: `PUT` via `submitDoc()` — a separate step; if it fails after create succeeds, the Draft
  is left in place (named in the error), same two-step-failure convention as Material Transfer.

## Live QA

**Not run this session.** The `devops` subagent's read-only SSH investigation (source tracing,
live `Manufacturing Settings` values, and a read-only list of real Work Orders) is the only live
verification performed for this package — no Stock Entry was created, submitted, or cancelled,
and no Work Order's `produced_qty`/`consumed_qty`/`status` was observed to change. The main
session itself has no SSH access (denied by the sandbox's credential-exploration classifier on a
direct attempt) and no browser tool in this environment, so it could not independently drive the
built UI end-to-end either. See the package handoff for the full disclosure and the concrete
scenarios (`MFG-WO-2026-00003`, `-00006`, `-00008` — all `docstatus=1`, `wip_warehouse`/
`fg_warehouse` set, `produced_qty=0`, against `BOM-FG-STEEL-BRACKET-ASSY-001`) that are ready for
a live QA pass by a session with write/SSH/browser access.
