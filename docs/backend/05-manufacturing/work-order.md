# Work Order

**Frappe DocType:** `Work Order` (module: Manufacturing)
**Canonical entity:** `work_order`
**Frontend routes:** `/manufacturing/work-orders` (list), `/manufacturing/work-orders/[name]`
(detail, read-only), `/manufacturing/work-orders/new` (create)
**Verification:** `Documentation: VERIFIED` · `Source Code: PARTIALLY_VERIFIED` (fields
confirmed live; controller logic confirmed only for the paths exercised below) · `Runtime Test:
VERIFIED` (see Test Scenarios)

## Field mapping

| Frontend field | Canonical `work_order.*` | Frappe `Work Order.*` | Type | Required | Editable after submit | Notes |
|---|---|---|---|---|---|---|
| `name` (URL param / row ID) | `id` | `name` | Data (auto, `naming_series: MFG-WO-.YYYY.-`) | auto | no | |
| `status` | `status` | `status` | Select | system-set | n/a | Enum: `Draft / Submitted / Not Started / In Process / Stock Reserved / Stock Partially Reserved / Completed / Stopped / Closed / Cancelled` (live-verified via `get_doctype_fields`) |
| `company` | `company` | `company` | Link → Company | yes (create) | no | |
| Production Item cell | `production_item` | `production_item` | Link → Item | yes (create) | no | Create restricted client-side to items with `default_bom` set — see `MFG-VAL-001` |
| item name display | `item_name` | `item_name` | Data | auto-fetched | no | |
| Quantity | `qty` | `qty` | Float | yes (create), `> 0` | **no**, per `MFG-VAL-002` | |
| Produced qty (progress bar) | `produced_qty` | `produced_qty` | Float | system-set | n/a | Written by ERPNext's own Manufacture-purpose Stock Entry flow — not written by this frontend (no Manufacture entry UI built) |
| Process loss qty | `process_loss_qty` | `process_loss_qty` | Float | system-set | n/a | |
| BOM | `bom_no` | `bom_no` | Link → BOM | yes (create) | no | Auto-filled from the item's `default_bom` when exactly one active+default BOM exists; editable otherwise |
| Stock UOM | `stock_uom` | `stock_uom` | Link → UOM | auto | no | |
| Sales Order | `sales_order` | `sales_order` | Link → Sales Order | optional | no | Linked in detail view to `/sales/orders/[name]` |
| Project | `project` | `project` | Link → Project | optional | no | |
| Source Warehouse | `source_warehouse` | `source_warehouse` | Link → Warehouse | optional | no | No ERPNext-native default exists (`Manufacturing Settings` carries no default-warehouse fields — live-checked) |
| WIP Warehouse | `wip_warehouse` | `wip_warehouse` | Link → Warehouse | optional | no | |
| Target/FG Warehouse | `fg_warehouse` | `fg_warehouse` | Link → Warehouse | optional | no | |
| Planned start | `planned_start_date` | `planned_start_date` | Datetime | yes (create) | no | Frontend converts `<input type="datetime-local">` → `"YYYY-MM-DD HH:MM:SS"` |
| Planned end | `planned_end_date` | `planned_end_date` | Datetime | optional | no | May be entirely absent on a record (ERPNext omits the key, does not return `null` — live-confirmed) |
| Actual start / end | `actual_start_date` / `actual_end_date` | same | Datetime | system-set | n/a | |
| Use multi-level BOM | `use_multi_level_bom` | `use_multi_level_bom` | Check | optional, default 0 | no | Passed straight through; explosion happens server-side |
| Skip transfer | `skip_transfer` | `skip_transfer` | Check | n/a (not set by this app) | — | Read by `canTransferMaterials()` gating logic |
| Transfer material against | `transfer_material_against` | `transfer_material_against` | Select | n/a (not set by this app) | — | Read by `canTransferMaterials()`; `"Job Card"` value routes transfer elsewhere (not built here) |
| Track semi-finished goods | `track_semi_finished_goods` | `track_semi_finished_goods` | Check | n/a (not set by this app) | — | Read by `canTransferMaterials()` |
| `creation` / `modified` | `created_at` / `updated_at` | `creation` / `modified` | Datetime | system | n/a | |

### Child entity: Work Order Item (`required_items`)

Canonical `work_order_item`, 1:N under `work_order`. Frappe child DocType `Work Order Item`.

| Frontend field | Canonical `work_order_item.*` | Frappe field | Notes |
|---|---|---|---|
| Item cell | `item_code` / `item_name` | `item_code` / `item_name` | |
| Required | `required_qty` | `required_qty` | Auto-populated by ERPNext from `bom_no` × `qty` on insert (`MFG-CALC-001`). **Not editable after submit** (`MFG-VAL-002`) |
| Transferred | `transferred_qty` | `transferred_qty` | Written only by a submitted Material Transfer for Manufacture Stock Entry — see `material-transfer.md` |
| Consumed | `consumed_qty` | `consumed_qty` | Written by a Manufacture-purpose Stock Entry (not built in this frontend) |
| Source | `source_warehouse` | `source_warehouse` | |
| ADDITIONAL tag | `is_additional_item` | `is_additional_item` | Real ERPNext field, set only when a Material Transfer Stock Entry adds a non-BOM line (`add_additional_items`) — never inferred client-side |
| (not rendered) | `voucher_detail_reference` | `voucher_detail_reference` | Back-link to the Stock Entry Detail row that added an additional item; read during QA, not rendered in the UI |
| Stock UOM | `stock_uom` | `stock_uom` | |

### Child entity: Work Order Operation (`operations`)

Canonical `work_order_operation`, 1:N under `work_order`. Frappe child DocType
`Work Order Operation`.

| Frontend field | Canonical field | Frappe field | Notes |
|---|---|---|---|
| Operation | `operation` | `operation` | |
| Workstation | `workstation` | `workstation` | |
| Status | `status` | `status` | |
| Time (mins) | `time_in_mins` | `time_in_mins` | |
| Completed Qty | `completed_qty` | `completed_qty` | |
| Batch Size | `batch_size` | `batch_size` | |
| Planned/Actual Start/End | `planned_start_time` etc. | same | |

**`MFG-UNV-004a`** — `NEEDS_VERIFICATION`: this table stays **empty on a plain REST insert**
even when the BOM has operations. Live-confirmed (Package 3 QA): ERPNext's `validate()`
auto-populates `required_items` from the BOM but does **not** auto-populate `operations` the
same way — that table is normally filled by Desk's own client-side form script, not by
`validate()` alone. A future Job Card package must populate `operations` explicitly rather than
assume a REST-created Work Order already carries it.

## Business rules

- **`MFG-VAL-001`** — Production Item create restriction (frontend-only, not an ERPNext DocType
  constraint): the "New Work Order" form only lists items where `default_bom` is set
  (`listManufacturableItemOptions`, filter `default_bom is set`). `FRAPPE_ONLY_IMPLEMENTATION_DETAIL`:
  this is this frontend's chosen definition of "manufacturable," not a Frappe-enforced rule —
  ERPNext itself will accept a Work Order for any item given an explicit `bom_no`.
- **`MFG-CALC-001`** — Required qty scaling. `REQUIRED_CEYLON_BEHAVIOR` / `FRAPPE_CURRENT_BEHAVIOR`
  (they match): `required_qty = bom_item.qty * (work_order.qty / bom.quantity)`. Live-verified
  twice against the one real BOM on this instance (qty=7 and qty=13) — exact match to ERPNext's
  own server-computed `required_items`. The frontend's BOM-preview-on-create screen computes this
  client-side for display only; the actual `required_items` values that land on the created
  document are always ERPNext's own server-side computation, never sent by the client.
- **`MFG-VAL-002`** — Update-after-submit block on `required_items`. `FRAPPE_CURRENT_BEHAVIOR`,
  source + live confirmed (Package 4 investigation): neither the parent `required_items` field
  nor any `Work Order Item` child field carries `allow_on_submit: 1`, so Frappe's core
  `_validate_update_after_submit()` rejects any edit to `item_code`/`required_qty`/row count once
  `docstatus = 1`. Live-reproduced error: `UpdateAfterSubmitError: "Row #1: Not allowed to change
  Required Qty after submission..."`. This is core Frappe safety, not a gap — do not build a
  workaround around it; see `MFG-WF-002` for the actual native path.
- **`MFG-VAL-003`** — Draft-stage `required_qty` edits are silently reverted, but `item_code`
  substitutions persist. `FRAPPE_CURRENT_BEHAVIOR`, live-confirmed (Package 4): while
  `Manufacturing Settings.allow_editing_of_items_and_quantities_in_work_order = 0` (current site
  value), every save calls `set_required_items(reset_only_qty=True)`, which resets `required_qty`
  on any row whose `item_code` still matches the BOM — but never resets `item_code` itself, so a
  raw item substitution on a Draft row does persist. Known edge case: nothing merges duplicate
  `item_code` rows if a substitution creates one.
- **`MFG-WF-001`** — This frontend only ever calls `createDoc`, never `submitDoc`/`cancelDoc`, on
  Work Order itself. Every Work Order created here stays at `docstatus 0` (Draft) indefinitely
  from this app's perspective — Submit/Cancel is a distinct future scoped package.
- **`MFG-WF-002`** — The ERPNext-native mechanism for a Work-Order-specific material deviation
  during production (add a non-BOM item, remove one, substitute one) is **Stock-Entry-driven, not
  a Work Order edit** — see `material-transfer.md`'s `MFG-STK-001`/`MFG-STK-002` and
  `work_order.py`'s `add_additional_items()`/`remove_additional_items()`. This was a deliberate
  investigation outcome (Package 4), not an assumption.

## Document lifecycle

| Action | Built in this frontend? | Behavior |
|---|---|---|
| Create | **Yes** | `createDoc("Work Order", {...})` → `docstatus 0`. ERPNext's `validate()` auto-populates `required_items`; `operations` stays empty (`MFG-UNV-004a`). |
| Save (Draft edit) | No | Not exposed; see `MFG-VAL-003` for what would happen if it were. |
| Submit | No | Future package. Submitting is what actually makes `canTransferMaterials()` return true, and is a prerequisite Desk-side action this app assumes already happened for a Work Order it displays. |
| Cancel | No | Future package. |
| Amend | No | Not investigated. |

## Relationships

See `docs/backend/11-relationships/master-erd.md`. Summary: `work_order` 1:N `work_order_item`,
1:N `work_order_operation`, 1:N `job_card` (external, `job_card.work_order`), 1:N `stock_entry`
(filtered to Material Transfer for Manufacture), N:1 `bom` (`bom_no`), N:1 `item`
(`production_item`), N:1 optional `sales_order`/`project`, N:1 optional `warehouse` in three
independent roles.

## Stock impact

Work Order itself does not move stock — it is the planning document. Stock movement happens via
linked Stock Entries: Material Transfer for Manufacture (documented in `material-transfer.md`,
writes `required_items[].transferred_qty`) and Manufacture-purpose entries (writes `consumed_qty`
and `produced_qty` — **not built in this frontend**, `NEEDS_VERIFICATION` for exact mechanics).

## Accounting impact

`NEEDS_VERIFICATION` — Work Order itself does not appear to post GL entries directly (it's a
planning/production-tracking document); GL impact happens at the linked Stock Entry / Manufacture
entry level. Not inspected this session — see `docs/backend/99-unverified/unverified-behaviours.md`.

## API behavior

Canonical contract (not yet formalized as a versioned API — this frontend calls Frappe's REST API
directly per `FRONTEND_GUIDE.md`'s API-layer rule, all through `lib/erpnext.ts`):

- List: `GET /api/resource/Work Order` with `fields`/`filters`/`limit_start`/`limit_page_length`/
  `order_by` — wrapped by `listDocs()`.
- Detail: `GET /api/resource/Work Order/{name}` — wrapped by `getDoc()`. Child tables
  (`required_items`, `operations`) come embedded in this single response; no extra request.
- Create: `POST /api/resource/Work Order` with the field payload in `buildWorkOrderFields()` —
  wrapped by `createDoc()`.

## Test scenarios (behavioral, live-run — see `QA_LOG.md` 2026-09-17 for full detail)

**`MFG-TEST-001`** — Create at qty=7 against `FG-STEEL-BRACKET-ASSY` /
`BOM-FG-STEEL-BRACKET-ASSY-001` (base qty 1) → `MFG-WO-2026-00007`, `docstatus 0`/`Draft`,
`required_items` = 5.6 / 28.0 / 0.35 (matches `qty × bom_item.qty` at qty=7 exactly).

**`MFG-TEST-002`** — Same BOM, qty=13 → `MFG-WO-2026-00008`, `required_items` = 10.4 / 52.0 / 0.65
(matches exactly).

**`MFG-TEST-003`** — Invalid `bom_no` on create → clean `LinkValidationError`, no orphan document
created.

**`MFG-TEST-004`** — Fractional qty (2.5) against a whole-number-UOM item → clean `ValidationError`,
no orphan document created.

**`MFG-TEST-005`** (Package 4 investigation) — Submitted-stage `required_qty` edit via plain doc
update → `UpdateAfterSubmitError`, confirms `MFG-VAL-002`.
