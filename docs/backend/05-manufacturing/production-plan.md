# Production Plan — Backend Knowledge Baseline

Domain status: `DOCUMENTED` (schema + business-rule source-verified; **create flow
live-write-verified** as of PP-2, 2026-09-20; **submit lifecycle source-verified AND
live-verified, and implemented**, as of PP-3, same day; **sub-assembly explosion and
raw-material/shortage calculation source-verified AND live-verified, and implemented**, as of
PP-4, same day — see "Sub-Assembly Planning + Material Requirements (PP-4)" below. **Make Work
Order (finished-good path) source-verified AND live-verified, and implemented**, as of PP-5, same
day — including a live-confirmed duplicate-generation finding, see "Work Order Generation (PP-5)"
below. **Make Material Request (finished-good/Purchase-type path) source-verified AND
live-verified, and implemented**, as of PP-6, same day — including its own live-confirmed
duplicate-generation finding (a different mechanism than Work Order's) and a live-confirmed
Production-Plan-cancel-blocked-by-linked-Submitted-Material-Request finding, see "Material Request
Generation (PP-6)" below — this also **upgrades** PP-4's own §C.1 clarification (recorded on trust,
not independently verified at the time) to independently live-verified for the Material-Request
case. Cancel remains investigated and its safe-path cleanup behavior live-confirmed, but
deliberately not shipped as an app feature pending one remaining unresolved case (external,
non-Ceylon-Stack-created *Submitted Work Order* specifically — see PP-6's §DD for what is now
resolved vs. still open). Amend is discovery-only. `reserve_stock`/Stock Reservation Entry
creation, multi-location "Get Items for Purchase / Transfer", and sub-assembly/subcontract Work
Order/Material Request generation (no test data exists on this instance) remain
unverified/unimplemented). See `docs/backend/15-migration/migration-status.md`.

PP-1 (2026-09-19) was a discovery/canonicalization pass only, read-only. PP-2 (2026-09-20) added
Draft-only create. PP-3 (2026-09-20, same day) added Submit only. PP-4 (2026-09-20, same day)
added Get Sub Assembly Items + Get Items for Purchase Only (single-warehouse Material
Requirements calc) on an existing saved Draft. PP-5 (2026-09-20, same day) added Make Work Order.
PP-6 (2026-09-20, same day) added Make Material Request — see "Frontend footprint" below for
exactly what shipped and what's still out of scope.

## Source of truth for this baseline

Two independent sources, cross-checked against each other:

1. **Live schema** — `mcp__ceylon-stack__get_doctype_fields` against the real Hetzner instance for
   `Production Plan`, `Production Plan Item`, `Production Plan Sub Assembly Item`, `Production Plan
   Sales Order`, `Production Plan Material Request`, `Production Plan Item Reference`, `Material
   Request Plan Item`, `Production Plan Material Request Warehouse`, `Work Order`, `Material
   Request`, `Material Request Item`. `mcp__ceylon-stack__list_documents` confirms **zero
   Production Plan documents exist on this instance** — no real transaction data to observe.
2. **ERPNext core source** — `frappe/erpnext` GitHub (`erpnext/manufacturing/doctype/production_plan/
   production_plan.py` and its `services/` submodules: `sales_order_planning.py`, `sub_assembly.py`,
   `work_order_planning.py`, `material_request.py`), fetched read-only via `gh api` for the actual
   business-rule implementation. **Version-match confidence: high but not exact** — nearly every
   field name, option list, and button pulled from live schema matches this source exactly
   (`get_items_from`, `combine_items`, `skip_available_sub_assembly_item`, `combine_sub_items`,
   `ignore_existing_ordered_qty`, the full child-table set, `Work Order.production_plan`/
   `production_plan_item`/`production_plan_sub_assembly_item`, `Material Request Item.production_plan`/
   `material_request_plan_item`). One confirmed drift: the source's `_submit_material_requests()`
   reads `self.doc.get("submit_material_request")`, but no `submit_material_request` field exists in
   the live `Production Plan` schema — the installed version is close to but not identical to the
   fetched `frappe/erpnext` branch. Treat source-derived behavioral claims below as **high-confidence
   reference, not live-confirmed** until exercised against a real document on this instance.

No ERPNext core files were modified; nothing here changes `apps/frontend` or `apps/smart_factory`.

## Header — verified fields (live schema)

| Field | Fieldname | Type | Notes |
|---|---|---|---|
| Naming Series | `naming_series` | Select | `MFG-PP-.YYYY.-` |
| Company | `company` | Link → Company | Required |
| Get Items From | `get_items_from` | Select | `""` / `Sales Order` / `Material Request` — chooses the demand source |
| Posting Date | `posting_date` | Date | Required |
| Reserve Stock | `reserve_stock` | Check | Drives `update_stock_reservation()` on submit — see Accounting/Stock impact |
| Item Code / Customer / Warehouse / Project / Sales Order Status | `item_code`, `customer`, `warehouse`, `project`, `sales_order_status` | Link/Select | Filter criteria for "Get Sales Orders", not stored demand data |
| From/To Date, From/To Delivery Date | `from_date`, `to_date`, `from_delivery_date`, `to_delivery_date` | Date | Filter criteria for "Get Sales Orders" |
| Consolidate Sales Order Items | `combine_items` | Check | See "combine_items behavior" below |
| Get Sales Orders | `get_sales_orders` | **Button** | Populates `sales_orders` child table (server call) |
| Sales Orders | `sales_orders` | Table → Production Plan Sales Order | Stored once fetched |
| Get Material Request | `get_material_request` | **Button** | Populates `material_requests` child table |
| Material Requests | `material_requests` | Table → Production Plan Material Request | Stored once fetched |
| Get Finished Goods | `get_items` | **Button** | Populates `po_items` from `sales_orders`/`material_requests` + `get_items_from` |
| Assembly Items | `po_items` | Table → Production Plan Item, required | The finished-goods planning rows — see below |
| Production Plan Item Reference | `prod_plan_references` | Table → Production Plan Item Reference | Only populated when `combine_items` merges rows — traces a combined row back to its original Sales Orders |
| Sub Assembly Warehouse | `sub_assembly_warehouse` | Link → Warehouse | |
| Consider Projected Qty in Calculation | `skip_available_sub_assembly_item` | Check | Confusing label vs. fieldname — see "Sub-assembly availability skipping" below |
| Consolidate Sub Assembly Items | `combine_sub_items` | Check | |
| Get Sub Assembly Items | `get_sub_assembly_items` | **Button** | Populates `sub_assembly_items` via BOM explosion |
| Sub Assembly Items | `sub_assembly_items` | Table → Production Plan Sub Assembly Item | |
| Download Required Materials | `download_materials_required` | **Button** | Client-side export, no doc mutation |
| Include Non Stock Items / Include Subcontracted Items / Consider Minimum Order Qty / Include Safety Stock in Required Qty Calculation | `include_non_stock_items`, `include_subcontracted_items`, `consider_minimum_order_qty`, `include_safety_stock` | Check | Raw-material calc toggles |
| Consider Projected Qty in Calculation (RM) | `ignore_existing_ordered_qty` | Check | **Inverted-sounding name** — when checked, projected (Bin) qty IS considered in the shortage calc; unchecked ignores it. Same naming-quirk pattern as `skip_available_sub_assembly_item`. |
| For Warehouse | `for_warehouse` | Link → Warehouse | |
| Get Items for Purchase Only / Get Items for Purchase / Transfer | `get_items_for_mr`, `transfer_materials` | **Button** | Populate `mr_items` |
| Raw Materials | `mr_items` | Table → Material Request Plan Item | The material-requirement rows — see MRP section |
| Total Planned Qty / Total Produced Qty | `total_planned_qty`, `total_produced_qty` | Float, **server-calculated** | Sum of `po_items.planned_qty` / `produced_qty` — see `calculate_total_planned_qty()`/`calculate_total_produced_qty()` |
| Status | `status` | Select | `Draft / Submitted / Not Started / In Process / Completed / Closed / Cancelled / Material Requested` — **server-calculated** via `set_status()`, never set directly by a user |
| Warehouses | `warehouses` | Table MultiSelect → Production Plan Material Request Warehouse | |
| Amended From | `amended_from` | Link → Production Plan | Standard Frappe amend pattern — confirms Production Plan is **submittable** |

## Child tables — verified fields

### Production Plan Sales Order (`sales_orders`)
`sales_order` (Link, required), `sales_order_date`, `customer`, `grand_total`, `status` — a
denormalized snapshot row per selected Sales Order, populated by the "Get Sales Orders" button.

### Production Plan Item (`po_items`) — the finished-goods planning row
`item_code` (required), `bom_no` (required — **not `default_bom`, a per-row override**),
`planned_qty` (required), `stock_uom` (required), `warehouse` (FG warehouse), `planned_start_date`
(required), `pending_qty`, `ordered_qty`, `produced_qty`, `description`, `include_exploded_items`
(the "Use Multi-Level BOM" equivalent for this row), `sales_order`/`sales_order_item` (reference,
optional), `material_request`/`material_request_item` (reference, optional),
`product_bundle_item`, `item_reference`, `temporary_name` (client-side row correlation before
save — see `_rename_temporary_references()`).

### Production Plan Sub Assembly Item (`sub_assembly_items`)
`production_item` (the sub-assembly's own item code), `parent_item_code` (the finished good it
belongs to), `bom_no`, `bom_level` (explosion depth), `type_of_manufacturing` (`In House` /
`Subcontract` / `Material Request` — **the single field that decides what downstream document
gets created**, see "Work Order generation" below), `required_qty`, `projected_qty`, `qty` ("Qty to
Order"), `fg_warehouse`, `supplier`/`purchase_order` (subcontract-only), `sales_order`/
`sales_order_item`, `production_plan_item` (back-reference to the `po_items` row it exploded
from), `wo_produced_qty`, `stock_reserved_qty`, `ordered_qty`, `received_qty`, `schedule_date`,
`uom`/`stock_uom`, `actual_qty`.

### Production Plan Material Request (`material_requests`)
`material_request` (Link, required), `material_request_date` — snapshot row for "Get Items From:
Material Request" mode, symmetric to Production Plan Sales Order.

### Material Request Plan Item (`mr_items`) — the raw-material requirement row
`item_code` (required), `warehouse` (required, target), `from_warehouse` (Material Transfer only),
`material_request_type` (`Purchase`/`Material Transfer`/`Material Issue`/`Manufacture`/
`Subcontracting`/`Customer Provided`), `quantity` (required, **the computed required qty**),
`requested_qty` (**how much has already been turned into a Material Request** — the qty-to-request
math is `quantity - requested_qty`, see MRP section), `actual_qty` ("Qty In Stock"),
`ordered_qty`, `safety_stock`, `min_order_qty`, `from_bom` (**read only** — a source-BOM trace
field, not a user-set selector, see "Multiple-BOM support" below), `main_item_code`, `required_bom_qty`,
`projected_qty`, `stock_reserved_qty`, `reserved_qty_for_production`, `sales_order`,
`sub_assembly_item_reference` (back-reference to a `sub_assembly_items` row when this raw material
came from a sub-assembly's own BOM, not the top-level finished good), `schedule_date`, `uom`,
`conversion_factor`.

### Production Plan Item Reference (`prod_plan_references`)
`item_reference` (the combined `po_items` row it points to), `sales_order`, `sales_order_item`,
`qty` — exists **only when `combine_items` is checked**; see "combine_items behavior".

### Production Plan Material Request Warehouse (`warehouses`)
`warehouse` only — a plain multi-select scoping table, not independently investigated further
(no source logic exercised it in the files read).

## STORED vs. SERVER-CALCULATED vs. BUTTON-GENERATED

This is the key distinction the discovery package asked for:

- **STORED** (user-entered or fetched-then-persisted): `company`, `posting_date`, `get_items_from`,
  all filter-criteria fields, all six `Check` toggles, `sub_assembly_warehouse`, `for_warehouse`,
  and every child-table row once a "Get ..." button has run — rows are plain child-table data from
  that point on, editable like any other Frappe grid.
- **SERVER-CALCULATED** (never user-entered, recomputed by Python on `validate()`/`on_submit()`):
  `total_planned_qty`, `total_produced_qty`, `status`, `po_items.pending_qty` (independent rows
  only — rows with a Sales Order/Material Request reference get their pending qty from that source
  instead), `Sales Order Item.production_plan_qty` (written back to the **Sales Order**, not
  Production Plan, by `update_sales_order()` on submit).
- **BUTTON/ACTION-GENERATED** (a distinct server call the user triggers, not a background
  recompute): "Get Sales Orders" (`get_open_sales_orders`), "Get Material Request"
  (`get_pending_material_requests`), "Get Finished Goods" (`get_items`/`combine_so_items`), "Get
  Sub Assembly Items" (`get_sub_assembly_items`), "Get Items for Purchase Only" / "Get Items for
  Purchase / Transfer" (`get_items_for_material_requests`), "Download Required Materials"
  (client-side export only, no server mutation), **"Make Work Order"** (`make_work_order` — creates
  Work Order/Purchase Order documents, not a Production Plan field), **"Make Material Request"**
  (`make_material_request` — creates Material Request documents).

## Sales Order → Production Plan (demand sourcing)

Source: `services/sales_order_planning.py` (`SalesOrderSourcingService`).

- **Eligibility is `docstatus = 1` (submitted) only** — the Sales Order Item query filters
  `so_item.docstatus == 1`. Draft Sales Orders are never eligible.
- **Pending-quantity filter**: a Sales Order Item is only pulled in while
  `stock_qty - stock_reserved_qty > work_order_qty` — i.e. it still has quantity not yet covered by
  an existing Work Order. The pulled `pending_qty` itself is computed as
  `qty - max(work_order_qty, delivered_qty * conversion_factor, 0)` — already-delivered or
  already-planned quantity is subtracted before it ever reaches `po_items`.
- **BOM required to be pulled in at all**: an item with no active (`is_active = 1`), submitted BOM
  is silently skipped (`if not bom_no: continue` in `add_items()`) — it never appears as a
  `po_items` row. This is a real gate, not a warning.
- **Multiple Sales Orders can feed one Production Plan** — `sales_orders` is a table; "Get Finished
  Goods" processes the full list at once.
- **`combine_items` ("Consolidate Sales Order Items")**: merges `po_items` rows **by `bom_no`, not
  by `item_code`** — two Sales Orders demanding the same item but resolving to *different* BOMs do
  NOT combine into one row. When it does combine, the original per-Sales-Order breakdown is
  preserved in `prod_plan_references` (qty per Sales Order/Sales Order Item), and the combined
  row's own `sales_order` field is cleared.
- **Partially-planned quantities**: handled automatically by the pending-qty filter above — running
  "Get Finished Goods" again against the same Sales Orders after a partial plan/Work Order only
  pulls the remaining uncovered quantity, it does not re-pull the full original quantity.
- **Warehouse resolution**: the Sales Order Item's own `warehouse` is carried straight through to
  the `po_items` row — Production Plan does not independently resolve a warehouse for top-level
  finished goods (contrast with `for_warehouse`, which scopes raw-material requirement calc only).
- **BOM selection at pull time**: `bom_no = SalesOrderItem.bom_no or Item.default_bom` — the Sales
  Order Item's own BOM override (if the Sales Order flow ever set one) wins; otherwise the Item's
  default BOM. The resulting `po_items.bom_no` is a plain editable field afterward, so a user can
  override it in the grid to any other active BOM for that item — this is exactly the multi-BOM
  override path Ceylon Stack already built for Work Order create (`listBomsForItem` in
  `apps/frontend/src/lib/actions/bomLookup.ts`) and should reuse here rather than reinvent.
- **"Get Items From: Material Request" mode** is structurally symmetric (`get_mr_items()`): eligible
  Material Request Items are `docstatus = 1`, `qty > ordered_qty`, and resolve to an active BOM the
  same way.

## Multiple-BOM support (confirms the BOM package's `Item 1───<BOM` finding) — corrected 2026-09-19

Production Plan never assumes one BOM per item — `Item 1───<BOM` (multiple active BOMs per Item)
remains valid and is used throughout this doctype. **This does not mean every BOM-bearing field in
Production Plan's child tables is an equivalent, independently user-overridable selector** — the
original version of this section incorrectly generalized that way; corrected per Codex review
finding `CX-MFG-PP-001`. The three BOM-bearing fields have three distinct roles:

1. **`po_items.bom_no` (finished-good BOM selection) — user-editable.** Resolved at pull time as
   `SalesOrderItem.bom_no or Item.default_bom` (see "Sales Order → Production Plan" above), then
   left as a plain, directly-editable `Link → BOM` field on the `po_items` grid row afterward — a
   user can override it to any other `docstatus=1, is_active=1` BOM for that item, same UX pattern
   as Work Order create's BOM `<select>`. No dedicated "choose a BOM" dialog exists server-side;
   the row's `bom_no` field is just edited directly. This is the one BOM field this baseline
   confirms as an independent per-row selector.
2. **`sub_assembly_items.bom_no` (sub-assembly BOM reference) — server-derived from explosion, not
   confirmed as an independent user selector.** This field belongs to the server-generated
   sub-assembly explosion structure (`get_sub_assembly_items()`, entirely server-side — see
   "Sub-assemblies" below) and records which BOM a given sub-assembly row exploded against.
   Whether ERPNext additionally lets a user re-point this field to a different BOM after explosion,
   the way `po_items.bom_no` can be edited, was **not** established by the source read this pass —
   do not describe it as equivalent to the finished-good selector above without further evidence.
3. **`mr_items.from_bom` (raw-material source-BOM trace) — READ ONLY, not a BOM selector.** Per the
   `Material Request Plan Item` DocType definition, `from_bom` is a read-only traceability field
   recording which BOM a raw-material requirement row descended from. It is not a field a user, or
   a future Ceylon Stack frontend, sets or overrides. **A future frontend must not offer a BOM
   override control against `mr_items.from_bom`** based on this canonical model.

## Sub-assemblies (BOM explosion)

Source: `services/sub_assembly.py` (`SubAssemblyService`) + `services/sub_assembly_queries.py`
(explosion algorithm itself — **not read in this pass**, out of scope; only the calling contract
was verified).

- **BOM explosion is entirely server-side** (`get_sub_assembly_items()` in
  `sub_assembly_queries.py`) — Ceylon Stack must not reimplement it, per the discovery brief's
  explicit instruction.
- **`type_of_manufacturing` per sub-assembly row is the branch point** for what gets created later:
  `In House` → a Work Order; `Subcontract` → a consolidated subcontracting Purchase Order (grouped
  by supplier); `Material Request` → **no Work Order at all**, the sub-assembly is instead treated
  as a raw material to be requested/purchased outright. Default is `In House` unless the BOM's own
  `is_sub_contracted_item` flag says otherwise.
- **`track_semi_finished_goods` BOMs are explicitly excluded** from sub-assembly explosion — a row
  whose BOM has that flag set is skipped with a message, not exploded (`_bom_tracks_semi_finished`).
  This is the same flag `bom.md` flagged as schema-confirmed-but-behavior-unverified; Production
  Plan's own handling of it is now source-confirmed (skip, don't explode).
- **`skip_available_sub_assembly_item` ("Consider Projected Qty in Calculation")**: when checked,
  the explosion checks the sub-assembly warehouse's projected quantity and skips creating a
  sub-assembly row (and its would-be Work Order) if enough is already available there — this is the
  "available sub-assembly" availability check the discovery brief asked about. If it's checked but
  `sub_assembly_warehouse` isn't set, the server throws (`_validate_sub_assembly_row`).
- **`combine_sub_items`** aggregates sub-assembly rows by
  `(production_item, fg_warehouse, bom_no, type_of_manufacturing)` — a different, narrower key than
  top-level `combine_items`' by-`bom_no`-only key.
- **Nested/multi-level explosion**: `bom_level` on each sub-assembly row records explosion depth,
  confirming multi-level (sub-assembly-of-a-sub-assembly) explosion is a real, supported case —
  runtime behavior for a real multi-level BOM is `NEEDS_VERIFICATION` (no such BOM exists on this
  instance; see `bom.md`'s own `MFG-UNV-009` point 2).

## Material Requirement Planning (raw materials)

Source: `services/material_request.py`, `_required_qty_for_mr()` specifically.

The conceptual/base shortage calculation:

```
safety_stock   = row.safety_stock if include_safety_stock else 0
projected_qty  = max(0, bin.projected_qty) if ignore_existing_ordered_qty else 0
available_qty  = projected_qty − already_consumed_by_other_rows_for_same_item+warehouse
required_qty   = max(0, row.qty − (available_qty − safety_stock))
```

This is the useful conceptual/base expression, not a claim that it's the literal, final formula for
every row in every case — ERPNext backend processing remains authoritative and may additionally
apply conditions on top of it, such as minimum-order-quantity rounding (`consider_minimum_order_qty`,
applied per Sales-Order group via `_apply_minimum_order_qty_to_order`, not globally — see below),
UOM conversion/rounding, and other server-side rules already noted elsewhere in this section.

- `required_qty` (the shortage) is what lands in `mr_items.quantity` — this **is the backend's own
  authoritative shortage number**, matching exactly the "Required / Available / Shortage" table
  shape from the discovery brief's target UX. The frontend should display this, not recompute it —
  do not reimplement this formula (or its minimum-order-qty/UOM adjustments) in a future frontend.
- `ignore_existing_ordered_qty` (labelled "Consider Projected Qty in Calculation (RM)" — note the
  inverted-sounding name vs. its fieldname) is the toggle for whether Bin-level projected quantity
  is considered at all; unchecked, every row is treated as zero-available and the full BOM-exploded
  quantity becomes the requirement.
- `include_non_stock_items` / `include_subcontracted_items` / `consider_minimum_order_qty` further
  filter/adjust which rows appear and their final purchase quantity (minimum order qty rounding is
  applied per Sales-Order group via `_apply_minimum_order_qty_to_order`, not globally).
- `requested_qty` (already turned into a real Material Request) is tracked separately from
  `quantity` (the total requirement) — re-running "Get Items for Purchase / Transfer" does not
  double-count what's already been requested; "Make Material Request" only requests
  `quantity − requested_qty`.

## Work Order generation

Source: `services/work_order_planning.py` (`WorkOrderCreationService.make_work_order`), triggered
by the whitelisted `make_work_order()` method (a Desk button, not investigated in `.js` this pass —
**whether it requires `docstatus = 1` is enforced client-side, not by any check in the Python read
this pass; `NEEDS_VERIFICATION`**).

- **One Work Order per `po_items` row, one Work Order per `sub_assembly_items` row** (In House type
  only) — "a Work Order can reference only one Production Plan row" is an explicit code comment.
  Multiple Work Orders absolutely can originate from one Production Plan (one per finished good row
  + one per in-house sub-assembly row).
- **Duplicate-creation prevention is quantity-based, not a hard block**: `ProductionPlanWorkOrderQuantities.
  get_pending_quantities()` computes remaining un-ordered qty per row (existing non-cancelled Work
  Orders already netted out); `create_work_order()` skips silently if the resulting qty is `<= 0`.
  Re-running "Make Work Order" after a Work Order already exists for a row creates nothing further
  once that row's demand is fully covered — but nothing stops a second Work Order for the same row
  while quantity remains (e.g. a partially-produced/cancelled prior Work Order).
- **BOM and warehouse are carried straight from the Production Plan row**: `bom_no`,
  `use_multi_level_bom` (from `include_exploded_items`), `fg_warehouse` (from the row's
  `warehouse`), and `source_warehouse` (resolved from `BOM.default_source_warehouse`, not the
  Production Plan row itself). If the Production Plan itself has `sub_assembly_items`, every
  finished-good Work Order forces `use_multi_level_bom = 0` — multi-level BOM explosion happens via
  the sub-assembly rows/their own Work Orders instead, not by one exploded Work Order.
  `production_plan`, `production_plan_item` (or `production_plan_sub_assembly_item` for
  sub-assembly rows), `sales_order`/`sales_order_item`, `material_request`/`material_request_item`,
  and `project` are all copied onto the created Work Order as back-references — this is the
  concrete field-level answer to "how does Work Order know which Production Plan row created it."
- **Subcontract-type sub-assembly rows never become Work Orders** — they're consolidated by
  supplier into a single subcontracting Purchase Order per supplier instead
  (`make_subcontracted_purchase_order`), with partially-received quantities netted out
  (`_consolidate_subcontracted_po`).
- Every created Work Order is inserted with `flags.ignore_mandatory = True` and
  `flags.ignore_validate = True` — Production Plan bypasses Work Order's own normal validation on
  creation (relying on its own upstream data being correct), which is a notable trust boundary if
  Ceylon Stack ever builds this action natively.

## Material Request generation

Source: `services/material_request.py`, `MaterialRequestService.make_material_request()`.

- Triggered by the whitelisted `make_material_request()` method, separate from "Get Items for
  Purchase / Transfer" (which only populates `mr_items`, doesn't create documents).
- **Grouping key: `(sales_order, material_request_type, "")`** — one Material Request per unique
  combination, i.e. a single "Make Material Request" click can create several Material Requests at
  once if `mr_items` spans multiple Sales Orders and/or request types.
- **Requested-vs-required tracking**: `qty_to_request = quantity − requested_qty` per row; a row
  with nothing left to request is skipped, so re-running the action is idempotent.
- **The back-reference lives on `Material Request Item` (the child row), not on `Material Request`
  itself** — confirmed via live schema: `Material Request Item.production_plan` (Link → Production
  Plan) and `Material Request Item.material_request_plan_item` (Data, points back to the `mr_items`
  row name). `Material Request` (the parent doctype) has no Production Plan field at all — only
  `work_order`/`job_card` Link fields, which belong to a different sourcing path entirely.
  **Anyone building this UI must join through the child table**, not assume a parent-level field.
- A group warehouse can never be a Material Request target — the server throws explicitly if
  `mr_items.warehouse` resolves to a group warehouse.
- `submit_material_request` (source-referenced, whether to auto-submit created Material Requests)
  is the one confirmed schema drift noted above — **not present on this instance's live Production
  Plan schema**, so whatever controls that behavior here is unconfirmed;
  `NEEDS_VERIFICATION`.

## Accounting / stock impact — corrected 2026-09-19 (`CX-MFG-PP-003`)

The original version of this section imprecisely implied financial/stock effects occur "in" Work
Orders, Material Requests, Material Transfers, and Purchase Orders themselves. Corrected: three
distinct categories, from Production Plan down to an actual posting.

**A. Production Plan's own direct effect — reservation, not posting.** Production Plan itself
posts **no GL entries** — it is a planning document, not a stock or accounting transaction.
However, source-derived (`NEEDS_VERIFICATION` — see below), its lifecycle processing does have a
direct **stock-reservation** side effect: `update_bin_qty()` (called on submit/cancel/close) writes
to `Bin` reserved-quantity fields for both raw materials (`update_reserved_qty_for_production_plan`)
and in-house sub-assembly finished goods (`update_reserved_qty_for_for_sub_assembly`) — independent
of whether any Work Order/Material Request has been created yet. This is a reservation-quantity
side effect, **not a stock-ledger posting** — no `Stock Ledger Entry`/`GL Entry` is created by this
step. `reserve_stock` additionally triggers full Stock Reservation Entries
(`reserve_stock_for_production_plan`, a separate service not read this pass —
`NEEDS_VERIFICATION`).

**B. Planning / order documents Production Plan generates — no direct posting either.** Work
Order, Material Request, and Purchase Order are operational/planning/order documents. Merely
creating one of these (via "Make Work Order" / "Make Material Request", or the subcontracting PO
path) does not itself post an inventory movement or a GL entry — their existence drives subsequent
executable/posting transactions instead.

**C. Downstream stock/accounting posting documents — the actual ledger effect.** The real
stock-ledger and/or GL impact happens further downstream, in documents such as Material Transfer
Stock Entry, Manufacture Stock Entry, Purchase Receipt, and Purchase Invoice (already covered by
`work-order.md`, `material-transfer.md`, and `MFG-UNV-005`) — not in the planning/order documents
themselves.

```
Production Plan
        ↓ (Bin reservation-qty side effect only — no posting)
planning / order documents (Work Order, Material Request, Purchase Order)
        ↓ (no posting on creation)
execution / posting documents (Material Transfer / Manufacture Stock Entry, Purchase Receipt,
Purchase Invoice, ...)
        ↓
stock ledger and/or accounting impact
```

- **On cancel**: any still-Draft Work Order created from the plan is deleted outright
  (`delete_draft_work_order` — `docstatus = 0` only; submitted Work Orders are left alone),
  sub-assembly/material-request child rows are wiped, and stock reservation is unwound.
- All of the above beyond "Production Plan posts no GL entries directly" is **source-derived, not
  live-observed** — no live Production Plan document exists on this instance to confirm the `Bin`
  reservation-qty write actually occurs as described; see `MFG-UNV-012`.

## Relationships / cardinality (for `master-erd.md`)

```
PRODUCTION_PLAN ||--o{ PRODUCTION_PLAN_ITEM : "po_items (1:N)"
PRODUCTION_PLAN ||--o{ PRODUCTION_PLAN_SUB_ASSEMBLY_ITEM : "sub_assembly_items (1:N)"
PRODUCTION_PLAN ||--o{ MATERIAL_REQUEST_PLAN_ITEM : "mr_items (1:N)"
PRODUCTION_PLAN ||--o{ PRODUCTION_PLAN_SALES_ORDER : "sales_orders (1:N)"
PRODUCTION_PLAN ||--o{ PRODUCTION_PLAN_MATERIAL_REQUEST : "material_requests (1:N)"
PRODUCTION_PLAN ||--o{ PRODUCTION_PLAN_ITEM_REFERENCE : "prod_plan_references (1:N, only when combine_items)"
PRODUCTION_PLAN_ITEM }o--|| ITEM : "N:1 (item_code)"
PRODUCTION_PLAN_ITEM }o--|| BOM : "N:1 (bom_no, per-row override, not Item.default_bom)"
PRODUCTION_PLAN_ITEM }o--o| SALES_ORDER : "N:1 optional (sales_order)"
PRODUCTION_PLAN_ITEM }o--o| MATERIAL_REQUEST : "N:1 optional (material_request)"
PRODUCTION_PLAN_SUB_ASSEMBLY_ITEM }o--|| ITEM : "N:1 (production_item)"
PRODUCTION_PLAN_SUB_ASSEMBLY_ITEM }o--|| BOM : "N:1 (bom_no)"
PRODUCTION_PLAN_SUB_ASSEMBLY_ITEM }o--o| PRODUCTION_PLAN_ITEM : "N:1 optional (production_plan_item back-ref)"
WORK_ORDER }o--o| PRODUCTION_PLAN : "N:1 optional (work_order.production_plan)"
WORK_ORDER }o--o| PRODUCTION_PLAN_ITEM : "N:1 optional, by name (work_order.production_plan_item)"
WORK_ORDER }o--o| PRODUCTION_PLAN_SUB_ASSEMBLY_ITEM : "N:1 optional, by name (work_order.production_plan_sub_assembly_item)"
MATERIAL_REQUEST_ITEM }o--o| PRODUCTION_PLAN : "N:1 optional (material_request_item.production_plan) — NOT on Material Request parent"
MATERIAL_REQUEST_ITEM }o--o| MATERIAL_REQUEST_PLAN_ITEM : "N:1 optional, by name (material_request_plan_item back-ref)"
PURCHASE_ORDER }o--o| PRODUCTION_PLAN : "N:1 optional, subcontracted sub-assembly rows only (source-referenced, NEEDS_VERIFICATION on live schema)"
```

## Native document-method invocation on an unsaved document (`run_doc_method`) — new 2026-09-20

Production Plan's own "Get Sales Orders"/"Get Material Request"/"Get Finished Goods" buttons are
**bound Document methods** (`@frappe.whitelist()` directly on the `ProductionPlan` class —
`get_open_sales_orders`, `get_pending_material_requests`, `get_items`/`combine_so_items`, source:
`erpnext/manufacturing/doctype/production_plan/production_plan.py`, confirmed via `gh api` against
`frappe/erpnext`), not free-standing module-level functions. Desk calls these against a completely
new, **never-saved** form — the "Get Sales Orders" button works before the document has ever been
created. This is a different REST boundary from both `callMethod`/`callMethodWithResult`
(`/api/method/<dotted.path>`, module-level functions) and `callDocMethod`
(`/api/resource/<doctype>/<name>` + `run_method`, requires an **existing, saved** document) that
`lib/erpnext.ts` already had.

**The real mechanism**: Frappe's `frappe.handler.run_doc_method`
(`/api/method/run_doc_method`, source-read from `frappe/frappe`'s `frappe/handler.py` this
session) — when called with a `dt`/`dn` pair it loads an existing saved doc; when called with a
`docs` payload instead, it does `doc = frappe.get_doc(docs, check_permission=True)` (building an
in-memory `Document` from the payload, never touching the DB for a fetch) then
`doc.run_method(method)`, and **always** returns the resulting whole document via
`frappe.response.docs.append(doc)` regardless of the method's own return value — several of these
service methods (`get_open_sales_orders` in particular) return `None` and mutate `self` in place,
so the caller must read the returned `docs[0]`, not `message`. New `lib/erpnext.ts` function:
`callRunDocMethod<T>(doc, method)`.

**Live-verified payload requirement (`MFG-PP2-001`, closed)**: a bare `{doctype: "Production
Plan", ...header fields}` payload with no `name` key **fails** on this installed instance —
`frappe.get_doc(docs)` resolves it as a fetch-by-name with `name` defaulting to `None`, and 404s
with `"Production Plan None not found"` (`DoesNotExistError`) rather than constructing a fresh
unsaved Document. The payload must include an explicit placeholder `name` (e.g.
`"new-production-plan-1"`) plus `__islocal: 1` and `__unsaved: 1` — the same flags Desk's own
client-side new-doc state carries — for `is_new()`/`check_if_latest()` to treat it correctly as
new. Confirmed live 2026-09-20 via a full round-trip against the real instance: `get_open_sales_orders`
→ `combine_so_items` → plain `createDoc` (`POST /api/resource/Production Plan`) created a real
Draft `MFG-PP-2026-00001` with correct `po_items`/`total_planned_qty`, then it was deleted
(Draft-only delete, zero GL/stock impact — see "Accounting / stock impact" above, `update_bin_qty()`
only fires on submit/cancel/close).

**Chaining `combine_so_items`, not `get_items` directly**: `combine_so_items()`'s own source
branches — if `combine_items` is off, or `po_items` is still empty, it just calls `get_items()`;
if `combine_items` is on and rows already exist, it re-merges by `bom_no` instead. Calling
`combine_so_items` unconditionally (the same method the real "Get Finished Goods" button invokes)
covers both cases correctly without the frontend needing to branch on `combine_items` itself.

## Frontend footprint

**PP-1 (2026-09-19) shipped the first read-only foundation.** Routes:
`/manufacturing/production-plans` (list) and `/manufacturing/production-plans/[name]` (detail,
7 tabs: Overview, Finished Goods, Demand Sources, Sub-Assemblies, Material Requirements,
Generated Work Orders, Traceability). Strictly read-only — no create/edit/delete/submit/cancel,
no "Get ..."/"Make ..." button, no client-side planning/shortage/explosion calculation; every
value displayed is a backend-recorded field, sourced via `getDoc`/`listDocs` (Frappe REST), same
API layer every other document page uses. `productionPlanStatus()` added to `lib/erpStatus.ts`
(trusts the `status` field directly, same shape as `workOrderStatus`, tone mapping not mirrored
from a Desk indicator — no `production_plan_list.js` source was read). Work Order traceability
(section 11) queries `Work Order` filtered by `production_plan = doc.name`, using the explicit
backend back-reference fields, not Item/BOM inference. Material Request traceability (section 12)
is explicitly deferred, not approximated — see the detail page's Traceability tab. This baseline
made the package buildable without re-deriving the model from scratch, as intended.

**PP-2 (2026-09-20) added Draft-only create.** New route
`/manufacturing/production-plans/new` — a wizard: (1) Company/Posting Date/Get Items From +
filter-criteria header fields; (2) "Get Sales Orders"/"Get Material Request" (native
`get_open_sales_orders`/`get_pending_material_requests` via `run_doc_method`, see above);
(3) "Get Finished Goods" (native `combine_so_items`); (4) an editable `po_items` table
(`bom_no`, `planned_qty`, `warehouse`, `planned_start_date` only — every other field, including
`item_code`/`pending_qty`/`sales_order` back-references, is left exactly as ERPNext resolved it,
not second-guessed); (5) "Save as Draft" — a plain REST `POST /api/resource/Production Plan` of
the accumulated state (docstatus 0), same "trust the preview, persist it as-is" precedent as
`createWorkOrderAction`. New: `lib/actions/productionPlanCreate.ts` (the three native-method
wrappers), `lib/productionPlanRows.ts` (hidden-JSON-field child-table parsing, mirrors
`lib/bomRows.ts`), `components/ProductionPlanCreateForm.tsx`,
`manufacturing/production-plans/actions.ts` (`createProductionPlanAction`, session-checked —
the only step that actually persists anything). `lib/erpnext.ts` gained `callRunDocMethod`.

**PP-2 amended (2026-09-20, same day, folded in before independent review)** to add demand-row
curation: the Sales Orders/Material Requests preview table (step 2) now renders a per-row
checkbox plus the already-fetched-but-previously-unshown `sales_order_date`/
`material_request_date` and `grand_total` fields, and "Get Finished Goods" filters
`sales_orders`/`material_requests` down to only the checked rows before calling native
`combine_so_items` — client-side row curation only, no new ERPNext call and no reimplementation
of ERPNext's own eligibility/pending-qty logic. Motivated by a design review that (correctly)
flagged the original all-or-nothing table as the one native-Desk capability (deleting a grid row
before "Get Items") this wizard hadn't replicated. Also added: helper text under "Consolidate
Sales Order Items" explaining the by-BOM merge + traceability behavior, and helper text under a
disabled "Save as Draft" naming what's still missing. This amendment predates and is folded into
PP-2's still-pending independent review (PP-2 had not yet been reviewed/accepted when this was
added — see `docs/operations/AI_WORK_LOG.md`), not a separate package.

**PP-2 second amendment (2026-09-20, same day) — fixed a silent-failure bug found via live
testing.** Real usage against the Hetzner instance surfaced that clicking "Get Finished Goods"
against certain Sales Orders produced no visible result and no error — the wizard didn't check
whether `combine_so_items` actually returned any `po_items` rows. Root cause, confirmed live via
`mcp__ceylon-stack__list_documents` against `BOM` (`docstatus=1, is_active=1`): **only one
active, submitted BOM exists on this instance** (`BOM-FG-STEEL-BRACKET-ASSY-001`, for
`FG-STEEL-BRACKET-ASSY`) — any Sales Order whose item isn't that one silently yields zero
`po_items` rows per the already-documented BOM gate above ("BOM required to be pulled in at
all"). This is expected ERPNext behavior (a real gate, not a bug in ERPNext), but the frontend
gave no feedback when it happened. Fixed: `runFetch` now takes a `kind: "demand" |
"finished-goods"` parameter; when `kind === "finished-goods"` and the returned `po_items` is
empty, it surfaces an explicit error naming the two documented native causes (missing active/
submitted BOM, or remaining qty already fully covered by an existing Work Order) instead of
silently doing nothing. `tsc`/`eslint` re-run clean.

**Explicitly out of scope for PP-2** (unchanged from PP-1's own deferred list, still true):
submit/cancel, "Get Sub Assembly Items" (BOM explosion), raw-material requirement calc/"Get
Items for Purchase/Transfer", "Make Work Order", "Make Material Request", `reserve_stock`
wiring beyond storing the field, editing an already-saved Draft (create-only — no
`/production-plans/[name]/edit` route). Each remains its own future scoped package.

`MFG-UNV-012` is **partially resolved** by this package: the create flow itself (demand
sourcing, finished-goods population, Draft persistence) is now live-confirmed, not merely
source-derived — see `MFG-PP2-001` above. Submit/cancel lifecycle, `update_bin_qty()`/stock
reservation, `reserve_stock_for_production_plan`, Work Order/Material Request generation, and
the Sub Assembly/raw-material calculation paths remain entirely unexercised and still
`NEEDS_VERIFICATION`.

Zero Production Plan documents exist on the instance as of this package (re-confirmed via
`mcp__ceylon-stack__list_documents` immediately before implementation) — the list page's
zero-record empty state ("No Production Plans found.") is therefore the only state this package
could exercise live; every other behavior (multi-row tables, child-table rendering, entity links
resolving to a real linked document) is verified by code/type/build correctness only, not by
observing it against real data. This does not resolve `MFG-UNV-012` — see that entry.

**Canonical routing decision** (per discovery brief §12): Production Plan is a transactional
planning document, not master data — it belongs under `/manufacturing/production-plans`, never
under `/master-data/`. Entity links from a future Production Plan detail page should resolve to the
already-canonical routes: Item → `/master-data/items/[name]`, BOM → `/master-data/boms/[name]`,
Warehouse → `/master-data/warehouses/[name]`, Work Order → `/manufacturing/work-orders/[name]`,
Sales Order → `/sales/orders/[name]`, Material Request → `/buying/material-requests/[name]` — all
five already exist and should be reused, not duplicated.

## Submit / Cancel / Amend lifecycle (PP-3, 2026-09-20)

Source: `erpnext/manufacturing/doctype/production_plan/production_plan.py`'s `on_submit()`/
`on_cancel()`, `production_plan.json` (doctype metadata), `production_plan.js` (Desk client
script), and `services/reservation.py` (`ProductionPlanStockReservation`), all fetched read-only
via `gh api` against `frappe/erpnext` this session. **No live write access existed this session**
(no MCP write tool, no frontend login session) — everything below is `SOURCE VERIFIED`, not
`LIVE VERIFIED`, unless explicitly marked otherwise. This is a narrower, more precise version of
the same drift risk already flagged in `MFG-UNV-012`: the installed instance is close to but not
proven identical to this fetched branch.

### A. Submit is plain Frappe native submit — confirmed

`production_plan.json`'s doctype-level `is_submittable: 1`, and `amended_from` in the schema,
both confirm this (already noted in the header table above). Nothing about Production Plan's
submit path is special-cased at the REST boundary — Ceylon Stack's existing `submitDoc(doctype,
name)` helper (`lib/erpnext.ts`, `PATCH` the doc with `docstatus: 1` via `/api/resource/<doctype>/
<name>`, the same mechanism already used for Sales Order/Purchase Order/Work Order/Delivery
Note/etc.) is the correct, sufficient mechanism — no new lifecycle framework was introduced.

### B. `on_submit()` — exact source, line by line

```python
def on_submit(self):
    self.update_bin_qty()
    self.update_sales_order()
    self.add_reference_to_raw_materials()
    self.update_stock_reservation()
```

- **`update_bin_qty()`**: for every `mr_items` row with a `warehouse`, writes a `Bin` reserved-qty
  update (`update_reserved_qty_for_production_plan()`); for every `sub_assembly_items` row with
  `fg_warehouse` **and** `type_of_manufacturing == "In House"`, writes a different `Bin`
  reserved-qty update (`update_reserved_qty_for_for_sub_assembly()`). **Both child tables are
  populated only by "Get Sub Assembly Items" and "Get Items for Purchase/Transfer" — actions this
  app does not perform (still locked).** A Production Plan created through this app's current
  create flow (PP-2) always has empty `mr_items`/`sub_assembly_items`, so `update_bin_qty()` is a
  guaranteed no-op for every Production Plan this app can itself submit today. This does **not**
  post a Stock Ledger Entry or GL Entry either way — it is a `Bin`-table reserved-qty field write,
  consistent with what `production-plan.md`'s existing Accounting/Stock section already documented
  as source-derived.
- **`update_sales_order()`**: for every `po_items` row with a `sales_order`/`sales_order_item`
  reference, writes `Sales Order Item.production_plan_qty` (a plain field update via
  `frappe.db.set_value`, not a full Sales Order re-save) to the sum of `planned_qty` across
  submitted (`docstatus=1`) Production Plan Item rows referencing that same Sales Order Item. **This
  is the one real, always-possible persistent side effect for an app-created, Sales-Order-sourced
  Production Plan** — submitting one **will** write to the source Sales Order's line-item
  `production_plan_qty` field. It never touches Sales Order Item `qty`/`delivered_qty`/
  `billed_qty`/GL, and it does not re-submit or lock the Sales Order itself.
- **`add_reference_to_raw_materials()`**: for every `mr_items` row, tries to match it to a
  `sub_assembly_items` row by `(production_item == main_item_code, bom_no == from_bom)` and sets
  `sub_assembly_item_reference`; throws only if `reserve_stock` is checked **and** a row's
  `main_item_code`/`from_bom` looks inconsistent with the matched BOM's own item. No-op (empty
  loop, no throw possible) when `mr_items` is empty, which — as above — is always true for a
  Production Plan this app can currently submit.
- **`update_stock_reservation()`**: `if not self.reserve_stock: return` — an explicit early exit.
  **This app's create form never sets `reserve_stock`** (`ProductionPlanCreateForm.tsx` has no
  such field; it defaults to `0`/unchecked server-side), so this is also a guaranteed no-op today.
  If it were checked, source shows it calls `reserve_stock_for_production_plan(self)` →
  `ProductionPlanStockReservation(doc).reserve()`, which — via `StockReservation(...)
  .make_stock_reservation_entries()` — **does create real `Stock Reservation Entry` documents**
  (a genuine persistent side effect, separate from the Bin reserved-qty write above). This
  confirms `MFG-UNV-012`'s uncertainty (4) beyond the Bin-only claim: `reserve_stock` submit-time
  behavior is a document-creation side effect, not merely a field write — but it is moot for this
  app today since the field is never set to `1` by anything this app builds.

**Submit side-effect matrix (for a Production Plan created by this app's current PP-2 create
flow specifically — `reserve_stock=0`, `mr_items=[]`, `sub_assembly_items=[]`):**

| Effect | Result | Evidence |
|---|---|---|
| Stock Ledger Entry | NO | **LIVE VERIFIED** (`MFG-PP-2026-00004`, 2026-09-20 — 0 rows before/after submit) |
| GL Entry | NO | **LIVE VERIFIED** (same test — 0 rows before/after submit) |
| Work Order creation | NO | **LIVE VERIFIED** (same test — 0 rows) + SOURCE VERIFIED (`on_submit()` never calls `make_work_order`; that's a separate whitelisted method, button-gated to `docstatus === 1` in `production_plan.js`, never auto-invoked) |
| Material Request creation | NO | SOURCE VERIFIED — same reasoning, `make_material_request` is separate and button-gated (not independently re-checked live this pass, no `mr_items` existed to make one from) |
| Purchase Order creation | NO | SOURCE VERIFIED |
| Bin reserved-qty update | NO (no-op — no `mr_items`/`sub_assembly_items` rows exist to iterate) | **LIVE VERIFIED** — `reserved_qty`/`projected_qty`/`actual_qty` on the real `Bin` row were identical before and after submit |
| Stock Reservation Entry creation | NO (`reserve_stock` never set by this app) | **LIVE VERIFIED** (0 `Stock Reservation Entry` rows for this plan, before/after) |
| Sales Order Item `production_plan_qty` write | **YES**, when sourced from a Sales Order | **LIVE VERIFIED** — `0.0` → `30.0` on submit, reverted to `0.0` on cancel, exact values |
| Other persistent effect | `status` recomputed to `Draft`→`Submitted`/`Not Started`/etc. via `set_status()` (called from `validate()`, not `on_submit()` itself) | **LIVE VERIFIED** — `status: "Draft"` → `"Submitted"` on the real document |

**Runtime verification performed: `LIVE VERIFIED`, 2026-09-20, against the real Hetzner
instance.** With the user's explicit go-ahead (this is a genuine lifecycle transition on a real
business Sales Order, not a zero-trace create+delete like PP-2's own live test), a full round
trip was run directly against ERPNext's REST API using the app's own "Frontend Integration"
service-account credentials (the same credentials `apps/frontend` uses at runtime; read from the
existing `apps/frontend/.env.local`, never written/modified/printed):

1. `get_open_sales_orders` → `combine_so_items` against `SAL-ORD-2026-00007` (the same Sales
   Order PP-2's own live test used) reproduced PP-2's exact result: one `po_items` row
   (`FG-STEEL-BRACKET-ASSY`, `BOM-FG-STEEL-BRACKET-ASSY-001`, `planned_qty: 30`,
   `warehouse: "Finished Goods - CS"`) — confirms the Sales Order's pending qty was unaffected by
   any activity between PP-2 and PP-3.
2. **Baseline captured before creating anything**: `Sales Order Item rgs0926h83`
   (`FG-STEEL-BRACKET-ASSY` on `SAL-ORD-2026-00007`) had `production_plan_qty: 0.0`; `Bin`
   (`FG-STEEL-BRACKET-ASSY` @ `Finished Goods - CS`) had `reserved_qty: 30.0`,
   `projected_qty: 80.0`, `actual_qty: 0.0`.
3. `POST /api/resource/Production Plan` (mirroring `createProductionPlanAction`'s exact payload
   shape) created a real Draft, `MFG-PP-2026-00004` (`docstatus: 0`, `reserve_stock: 0`,
   `mr_items: []`, `sub_assembly_items: []` — the exact precondition this section's analysis
   assumed).
4. **`PUT /api/resource/Production Plan/MFG-PP-2026-00004` with `{"docstatus": 1}`** — the exact
   same REST call `submitDoc()`/`submitProductionPlanAction` makes — returned `200`, `docstatus:
   1`, `status: "Submitted"`.
5. **Immediately after submit**, re-queried everything the matrix below predicts:
   - `Sales Order Item rgs0926h83.production_plan_qty`: `0.0` → **`30.0`** — the one predicted
     real side effect, confirmed live, exact value.
   - `Bin` (`FG-STEEL-BRACKET-ASSY` @ `Finished Goods - CS`): **unchanged** — `reserved_qty: 30.0`,
     `projected_qty: 80.0`, `actual_qty: 0.0` — confirms `update_bin_qty()` was a genuine no-op.
   - `Stock Ledger Entry` count for this Production Plan: **0**. `GL Entry` count: **0**.
     `Work Order` count (`production_plan = MFG-PP-2026-00004`): **0**. `Stock Reservation
     Entry` count (`from_voucher_no = MFG-PP-2026-00004`): **0**.
   - This live-confirms every row of the submit side-effect matrix below, exactly as predicted
     from source — no discrepancy found.
6. **Cleanup**: `PUT .../MFG-PP-2026-00004` with `{"docstatus": 2}` (direct REST — Cancel is not
   a shipped app feature, this was solely for test cleanup, using the same underlying mechanism
   the eventual Cancel feature would) — returned `200`, `status: "Cancelled"`. Re-queried
   afterward: `Sales Order Item.production_plan_qty` reverted to **`0.0`** (exactly as
   `update_sales_order()`'s re-run-on-cancel logic in §C below predicts — this plan's own rows are
   now excluded from the `docstatus=1` sum); `Bin` values unchanged; SLE/GL/WO/SRE counts still
   all `0`. The only residual trace on the instance is `MFG-PP-2026-00004` itself, permanently in
   `Cancelled` status (expected and harmless — Frappe cancelled docs are retained for audit, not
   deleted).

This is the strongest possible confirmation available without a second real submit: the
mechanism (`submitDoc` → plain REST PATCH → ERPNext's own `on_submit()`) is proven not just by
analogy to other doctypes' submits, but by this exact Production Plan lifecycle, live, on this
exact instance.

### C. Cancel — investigated, deliberately NOT implemented this package

```python
def on_cancel(self):
    self.db_set("status", "Cancelled")
    self.delete_draft_work_order()
    self.delete_production_plan_schedule()
    self.update_bin_qty()
    self.update_sales_order()
    self.update_stock_reservation()
    self.delete_sub_assembly_and_material_rows()
```

- `delete_draft_work_order()`: deletes (hard `frappe.delete_doc`) any **Draft only**
  (`docstatus=0`) Work Order referencing this plan; submitted Work Orders are explicitly left
  alone (`docstatus=0` filter). Not destructive to submitted business documents.
- `delete_production_plan_schedule()`: deletes rows from a **new doctype not previously
  documented in this baseline**, `Production Plan Schedule` (feeds the Desk-only "Production
  Schedule"/"Plan Visualizer" custom buttons, both gated `docstatus === 1` in `production_plan.js`
  and neither built by this app) — irrelevant to any Production Plan this app creates, since
  nothing here ever writes to that doctype.
- `update_bin_qty()`, `update_sales_order()`, `update_stock_reservation()`: same functions as
  submit, re-run on cancel — for an app-created plan (empty `mr_items`/`sub_assembly_items`,
  `reserve_stock=0`) these are the same guaranteed no-ops as above, **except**
  `update_sales_order()`, which recomputes `Sales Order Item.production_plan_qty` — since this
  plan's own Production Plan Item rows are now `docstatus=2` (excluded from
  `get_so_wise_planned_qty`'s `docstatus=1` filter), the recompute correctly writes the value back
  down (to whatever other still-submitted plans contribute, or `0`) — a deliberate, expected
  un-planning of the source Sales Order line, not a bug.
- `delete_sub_assembly_and_material_rows()`: hard-deletes `Production Plan Sub Assembly Item`/
  `Material Request Plan Item` rows for this plan and clears both tables in memory — no-op for an
  app-created plan (both already empty).

**Live-confirmed, 2026-09-20 (test cleanup, not a shipped feature):** cancelling
`MFG-PP-2026-00004` (a plan with zero downstream Work Orders/Material Requests, `reserve_stock=0`)
via the same `docstatus: 2` REST mechanism succeeded (`200`, `status: "Cancelled"`) and behaved
exactly as `on_cancel()`'s source predicts: `Sales Order Item.production_plan_qty` reverted
`30.0` → `0.0`; `Bin`, `Stock Ledger Entry`, `GL Entry`, `Work Order`, and `Stock Reservation
Entry` all remained unchanged/zero. This narrows uncertainty (2) above (no live cancel had been
run) but **does not resolve uncertainty (1)**: this test plan never had any downstream Work
Order/Material Request to begin with, so Frappe's generic submitted-document cancel-block
behavior when an *externally-created* (Desk, not this app) submitted Work Order/Material Request
still links back to the plan remains untested.

**Additional finding (PP-3 QA pass, 2026-09-20):** on this instance, a separate `qa-tester` live
test found that a *Cancelled* Production Plan (`docstatus: 2`) with nothing linking to it could
still be hard-deleted via a plain `DELETE /api/resource/Production Plan/<name>` call (200/202,
then confirmed 404 on refetch) — narrower than "cancelled Frappe documents are always retained
for audit," which generally holds for *Submitted* documents but is not an absolute guarantee for
every *Cancelled* one on every instance/permission configuration. Not relied upon by anything in
this app (no delete action is exposed for a submitted/cancelled Production Plan here) — noted
purely as an evidence correction to the general assumption stated earlier in this document.

**Why Cancel is still deferred as a shipped feature, despite this successful cleanup test:** the
one still-unresolved question — (1) above — is exactly the scenario that matters for a plan a
*user* of this app might submit and then, after using Desk directly to create downstream
documents against it, try to cancel from this app. Per the PP-3 brief's own instruction ("Cancel
is NOT automatically authorized merely because Submit is" / "Only implement Cancel in PP-3 if...
no unresolved destructive lifecycle ambiguity remains"), Cancel is left **locked as an app
feature** — no Cancel button/action was added — pending a future package that either reads
Frappe's generic cancel-link-check source or live-tests the downstream-linked-document case
specifically.

### C.1 Cancel — clarification carried in from the PP-4 package brief (2026-09-20)

The PP-4 package brief instructed this session to record, as accepted upstream evidence: *"Production
Plan cancellation with submitted linked downstream documents is source-confirmed to fail safely
through Frappe backlink checking / LinkExistsError."* Recorded here per that instruction, but with
its evidence provenance stated honestly: **this session did not itself re-derive or independently
verify the specific Frappe mechanism (`LinkExistsError`/backlink checking) behind that claim** —
no `frappe/frappe` source path implementing a generic cancel-time backlink check was read this
session, and no live test exercised the actual scenario (an app-created plan being cancelled while
an *externally*-created submitted Work Order/Material Request still links back to it — the one
scenario `on_cancel()`'s own source, read directly in §C above, does not itself guard against:
`delete_draft_work_order()` only ever touches Draft Work Orders, `update_bin_qty()`/
`update_sales_order()`/`update_stock_reservation()` don't block anything, and nothing else in
`on_cancel()`'s own body raises). If this specific mechanism needs to be cited as evidence for
shipping Cancel as a feature, it should first be independently confirmed the same way every other
claim in this document was — either a source read of the actual Frappe check that would run, or a
live test of the exact linked-submitted-document scenario. Cancel is **still not shipped** as an
app feature by PP-4 for exactly this reason — this clarification does not change that.

### D. Amend — discovery only, not implemented

`amended_from: DF.Link | None` in the schema and `is_submittable: 1` together confirm Production
Plan supports the standard Frappe amend pattern (a new Draft copy referencing the cancelled
original via `amended_from` — already displayed read-only on the detail page since PP-1). No
Amend action was built; per the PP-3 brief, Amend stays discovery-only unless "trivial, native,
fully verified, and explicitly justified" — it is not, since Cancel itself (its prerequisite) is
still locked.

### E. `allow_on_submit` — none

`production_plan.json`: **zero** fields anywhere in the doctype (header or child tables) are
flagged `allow_on_submit`. A Submitted Production Plan is fully immutable through the standard
field-save path — every mutation ERPNext performs against a Submitted plan (status changes,
Bin/reservation writes, the "Close"/"Re-open" custom buttons) goes through whitelisted methods
using `db_set`/direct DB writes, bypassing the normal submitted-doc field-permission check
entirely, not through `allow_on_submit`. Nothing here is exposed by this app.

### F. Button/action visibility by docstatus — confirmed from `production_plan.json` + `production_plan.js`

| Action | Visible when | Evidence |
|---|---|---|
| Get Sales Orders / Get Material Request | Always (gated by `get_items_from`, not docstatus) | `depends_on` on the field itself: none; section `depends_on` only checks `get_items_from` |
| Get Finished Goods (`get_items`) | `docstatus == 0` only | Field `depends_on: eval:doc.get_items_from && doc.docstatus == 0` — matches PP-2's own Draft-only create flow exactly |
| Get Sub Assembly Items | `docstatus == 0` only | Field `depends_on: eval:doc.po_items && doc.po_items.length && doc.docstatus == 0` — **new finding**: this action is Draft-only, not Submitted-only as `MFG-UNV-012` previously left ambiguous |
| Get Items for Purchase Only / Get Items for Purchase-Transfer (raw-material calc) | No docstatus gate at field or section level | Both `depends_on: None` — visible regardless of docstatus per schema (still locked/out of scope for this app either way) |
| Make Work Order / Subcontract PO, Make Material Request, Close/Re-open, Reserve for Sub-assembly/Raw Materials, Schedule Items, Production Plan Summary/Schedule/Visualizer | `docstatus == 1` only | `production_plan.js` `refresh(frm)`: the entire custom-button block is wrapped in `if (frm.doc.docstatus === 1)` |
| Submit | `docstatus === 0` | Standard Frappe submittable convention, confirmed by `is_submittable: 1` + no workflow doctype involved |
| Cancel | `docstatus === 1` (standard convention) | Not implemented this package — see §C above |

This directly narrows `MFG-UNV-012` uncertainty (3) — whether `make_work_order`/
`make_material_request`/`get_sub_assembly_items` require `docstatus = 1`: **`get_sub_assembly_items`
does not** (Draft-only); **`make_work_order`/`make_material_request` do** (Submitted-only,
confirmed via the Desk button gate, not a `.py`-level check — the underlying whitelisted methods
themselves still carry no server-side docstatus assertion, so this remains a Desk-UI-level
convention, not a hard backend guarantee, exactly as `MFG-UNV-012` already flagged).

### G. Frontend footprint — PP-3 (2026-09-20)

Added: `submitProductionPlanAction` in `manufacturing/production-plans/actions.ts` (calls the
existing `submitDoc("Production Plan", name)` — no new lifecycle helper), and a `DocActionBar`
Submit button on `/manufacturing/production-plans/[name]` visible only when `doc.docstatus === 0`,
same component/pattern already used by Sales Order/Purchase Order/Delivery Note/etc. No cancel
button, no amend button, no downstream "Make ..." action, no editing of a submitted plan. PP-1's
seven read-only tabs and PP-2's Draft create wizard are unchanged.

## Sub-Assembly Planning + Material Requirements (PP-4, 2026-09-20)

Source: full read of `production_plan.py`'s method table, `services/sub_assembly.py`,
`services/sub_assembly_queries.py`, `services/material_request.py`, `services/planning_queries.py`,
and `production_plan.js`'s `get_sub_assembly_items`/`get_items_for_mr`/`transfer_materials`/
`get_items_for_material_requests` handlers, all fetched read-only via `gh api` against
`frappe/erpnext` this session — then **live-verified end to end** against the real Hetzner
instance using the app's own "Frontend Integration" service-account credentials (read from the
existing `apps/frontend/.env.local`, never written/modified/printed). Both native calls below are
implemented; Make Work Order, Make Material Request, `reserve_stock`, and the multi-location
"Get Items for Purchase / Transfer" dialog remain out of scope (deferred, not investigated to the
same depth).

### H. Two different REST boundaries, two different persistence models — the key finding

PP-2/PP-3 already established `run_doc_method` for **Document-bound** whitelisted methods
(`get_open_sales_orders`, `combine_so_items`, `get_sub_assembly_items` — all defined directly on
the `ProductionPlan` class via `@frappe.whitelist()`). PP-4 additionally confirms
`get_items_for_material_requests` is a **different kind of whitelisted method** — a free-standing
module-level function (`services/material_request.py`), re-exported at
`erpnext.manufacturing.doctype.production_plan.production_plan.get_items_for_material_requests`
for backward compatibility, which is the exact dotted path `production_plan.js`'s
`get_items_for_material_requests(frm, warehouses)` handler calls via the generic
`/api/method/<dotted.path>` boundary (`callMethodWithResult` in `lib/erpnext.ts`), not
`run_doc_method`.

This distinction has a real, confirmed consequence for what each call does to the document:

**`get_sub_assembly_items`** (`SubAssemblyService.get_sub_assembly_items`, source read in full):
clears `self.doc.sub_assembly_items` then `self.doc.append(...)`s the BOM-explosion result —
**pure in-memory Document mutation**, zero `frappe.db`/`.save()`/`.insert()` calls anywhere in it
or `sub_assembly_queries.py`'s explosion helpers. Matches Desk's own `production_plan.js`:
`frm.dirty()` is called *before* the RPC (marking the form as having unsaved changes) and the
callback only does `refresh_field("sub_assembly_items")` — no auto-save. **Confirmed this app's
`callRunDocMethod` (`lib/erpnext.ts`, built for PP-2's never-saved-doc case) works identically
against an existing, already-saved Draft** — per `run_doc_method`'s own source
(`frappe.get_doc(docs, check_permission=True)` always builds its in-memory Document from the
payload dict, never touching the DB for a fetch, regardless of whether the payload's `name`
happens to match a real row) — no new `lib/erpnext.ts` helper was needed for this extension.

**`get_items_for_material_requests`** (module-level function, source read in full): reads
Bin/Item/BOM/supplier data and **returns a plain list of computed dicts** — confirmed **zero
persistence side effects of any kind**, not even an in-memory Document mutation, since it never
even holds a `Document` instance (`doc = frappe._dict(frappe.parse_json(doc))` — a plain dict, not
a Frappe `Document`). Matches Desk: the callback manually rebuilds `mr_items` client-side from the
plain array (`frm.set_value("mr_items", []); r.message.forEach(row => frm.add_child(...))`) —
there's no document-level state to discard, unlike the sub-assembly call above.

**Consequence for this app's architecture**: both calls are genuinely read-only against ERPNext
regardless of which boundary they use — the only way either result reaches the database is an
explicit, separate `updateDoc` (`PUT /api/resource/Production Plan/<name>`) this app performs
itself, matching the existing "preview, then save" precedent PP-2 already established for the
create wizard, now applied to an existing saved Draft instead of a never-saved one.

### I. Sub-assembly options actually exposed (scope decision)

Investigated (source, §"Sub-assemblies" above) vs. exposed by this package:

| Field | Classification | Reasoning |
|---|---|---|
| `sub_assembly_warehouse` | **REQUIRED FOR PP-4** | Drives `fg_warehouse` assignment on every non-group-warehouse sub-assembly row; required by the server itself when `skip_available_sub_assembly_item` is checked (`_validate_sub_assembly_row` throws otherwise) — **live-confirmed (qa-tester, PP-4 in-session QA) this is effectively required, not just conditionally**: `skip_available_sub_assembly_item` defaults to `1` (checked) at the `Production Plan` DocType level on this instance, and neither PP-2's create flow nor this package's own save actions set it explicitly, so every Draft this app creates starts with the sub-assembly warehouse gate already active |
| `skip_available_sub_assembly_item` ("Consider Projected Qty in Calculation") | **OPTIONAL BUT USEFUL** | The one behavior-changing toggle worth exposing — skips a sub-assembly row when the warehouse already has enough projected qty |
| `combine_sub_items` | **OPTIONAL BUT USEFUL** | Simple boolean, native consolidation-by-key behavior already documented above |
| `include_exploded_items` (per `po_items` row) | **NOT APPLICABLE — already exists** | PP-2's own `po_items` field, not new to PP-4 |

### J. Material Requirement options actually exposed (scope decision)

| Field | Classification | Reasoning |
|---|---|---|
| `for_warehouse` | **REQUIRED FOR PP-4** | The whole calculation needs a target; Desk's own client-side `get_items_for_mr` handler throws if unset before calling — **live-confirmed (qa-tester, PP-4 in-session QA) this is a Desk-JS-only guard, not backend enforcement**: calling the real `get_items_for_material_requests` endpoint directly with no `for_warehouse` returns `200` with real computed rows (each raw material falls back to its own default warehouse), so this app's own `getMaterialRequirementsPreview` check (`if (!options.for_warehouse) throw ...`) plus the panel's disabled-button guard are doing all of the real enforcement, not ERPNext |
| `ignore_existing_ordered_qty` ("Consider Projected Qty (RM)") | **REQUIRED FOR PP-4** | Decides whether the shortage nets against existing Bin stock at all — the single most consequential toggle for whether the result is useful SME planning output or a maximal worst-case number |
| `include_non_stock_items` | **OPTIONAL BUT USEFUL** | Simple boolean, widens which rows appear |
| `consider_minimum_order_qty` | **OPTIONAL BUT USEFUL** | Simple boolean, rounds purchase qty up to a real MOQ |
| `include_safety_stock` | **OPTIONAL BUT USEFUL** | Simple boolean, nets safety stock into the shortage |
| `include_subcontracted_items` | **DEFERRED** | Ties into subcontracting PO generation, a materially larger business flow out of this package's scope |
| `raw_material_group_warehouse` + multi-location "transfer from" warehouses | **DEFERRED** | The "Get Items for Purchase / Transfer" dialog (picking several source warehouses to net stock from before purchasing the remainder) — this package ships only the simpler, single-warehouse "Get Items for Purchase Only" scope (`get_items_for_mr`'s exact native call shape: `warehouses: [{ warehouse: for_warehouse }]`) |
| Reserve Stock (`reserve_stock`, Reserve/Unreserve for Sub-assembly/Raw Materials) | **NOT APPLICABLE** | Explicitly out of scope per package brief — a separate future package |

### K. Side-effect matrix (PP-4 actions)

| Action | Production Plan mutation | Bin write | Stock Reservation Entry | Stock Ledger Entry | GL Entry | Work Order | Material Request | Purchase Order | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| Get Sub Assembly Items (preview) | In-memory only, discarded at response end | NO | NO | NO | NO | NO | NO | NO | **LIVE VERIFIED** — real saved Draft (`MFG-PP-2026-00005`) re-fetched immediately after the call still showed `sub_assembly_items: []` |
| Get Items for Purchase Only (preview) | NO — not even in-memory (never holds a `Document`) | NO | NO | NO | NO | NO | NO | NO | **LIVE VERIFIED** — same test, `mr_items` still `[]` on re-fetch after the call |
| Save Sub-Assembly Items / Save Material Requirements (this app's own explicit persist step) | YES — plain field `PUT`, `docstatus` stays `0` | NO | NO | NO | NO | NO | NO | NO | **LIVE VERIFIED** — `Bin` for the test item/warehouse (`reserved_qty: 30`, `projected_qty: 80`) was byte-identical before and after saving 3 real `mr_items` rows to the Draft; this narrows the existing `update_bin_qty()`-only-fires-on-submit/cancel/close claim from "source-derived" to "live-confirmed for a Draft field save specifically" |

### L. Runtime verification, 2026-09-20 — full round trip against the real Hetzner instance

With real live-write credentials this session (no explicit go-ahead needed beyond what PP-2/PP-3
already established, since — like PP-2's own test — this leaves zero residual trace, see
cleanup step below):

1. `get_open_sales_orders` → `combine_so_items` against real open Sales Orders on the instance,
   then `POST /api/resource/Production Plan` created a real Draft, `MFG-PP-2026-00005`
   (`FG-STEEL-BRACKET-ASSY`, `BOM-FG-STEEL-BRACKET-ASSY-001`, `planned_qty: 30`,
   `warehouse: "Finished Goods - CS"`, sourced from `SAL-ORD-2026-00007`) — same shape as PP-2's
   and PP-3's own tests.
2. **`get_sub_assembly_items`**, called via `run_doc_method` against the doc **re-fetched by its
   real saved name** (not a placeholder), returned `sub_assembly_items: []` — correct and
   expected: `BOM-FG-STEEL-BRACKET-ASSY-001` (the only active, submitted BOM on this instance) has
   zero sub-assembly components (single-level BOM), so this exercises and confirms the "valid
   empty result" path, not a defect. Re-fetching the saved Draft immediately after confirmed
   nothing was persisted (`sub_assembly_items: []` on the real document, matching the in-memory-
   only claim in §H).
3. **`get_items_for_material_requests`**, called against the same re-fetched doc plus
   `for_warehouse: "Finished Goods - CS"` and `warehouses: [{ warehouse: "Finished Goods - CS" }]`,
   returned 3 real computed rows — `RM-BOLT-M6X20` (qty `120` = `4 × 30`), `RM-COATING-CPD`
   (`1.5` = `0.05 × 30`), `RM-STEEL-SHEET-2MM` (`24` = `0.8 × 30`) — all correctly scaled from the
   BOM's own per-unit component quantities against `planned_qty: 30`, `material_request_type:
   "Purchase"` on every row (no sub-assemblies to route through "Manufacture"/subcontract types),
   `actual_qty: 0` everywhere (this instance has no on-hand stock for these raw materials, so the
   full BOM-required quantity became the shortage regardless of `ignore_existing_ordered_qty` —
   **correction (qa-tester, PP-4 in-session QA): the original wording here claimed this field
   "was left unset/0 for this test", which was not checked against the real schema default.**
   `ignore_existing_ordered_qty` in fact defaults to `1` (checked) at the `Production Plan`
   DocType level on this instance, same as `skip_available_sub_assembly_item` above — so the
   Draft used for this test actually carried `ignore_existing_ordered_qty: 1` already (ERPNext
   applies the schema default on `createDoc`, and neither PP-2's create flow nor this package sets
   it explicitly). The `0` shortage-vs-full-requirement result was identical either way here only
   because the real `Bin.projected_qty` for these items also happened to be `0` on this instance —
   this test did not actually exercise the "some stock, partial shortage" branch of the formula.
   qa-tester's own separate live test (against a different item with real stock at a different
   warehouse) did exercise that branch and confirmed it: same warehouse's Bin with real stock
   correctly reduced the computed `quantity` to `0`, and an empty/zero-stock warehouse correctly
   returned the full BOM-required quantity — see `QA_LOG.md`'s PP-4 entry.). Re-fetching the saved
   Draft again confirmed `mr_items: []` still — zero persistence from this call either, confirming
   §H's "not even in-memory" claim.
4. **`PUT /api/resource/Production Plan/MFG-PP-2026-00005`** with `{ sub_assembly_warehouse,
   sub_assembly_items: [], for_warehouse, mr_items: <the 3 rows above> }` — the exact mechanism
   `saveSubAssemblyItemsAction`/`saveMaterialRequirementsAction` use — returned `200`,
   `mr_items.length === 3`, `sub_assembly_items.length === 0`, `docstatus` unchanged at `0`.
5. **Bin check**: the `FG-STEEL-BRACKET-ASSY` @ `Finished Goods - CS` Bin (`reserved_qty: 30`,
   `projected_qty: 80`, `actual_qty: 0`) was queried before and after step 4 — **byte-identical**,
   confirming saving `mr_items`/`sub_assembly_items` to a Draft via a plain field update does not
   itself trigger `update_bin_qty()` (which `on_submit()`/`on_cancel()`/`set_status(close=...)`
   call explicitly — a Draft field save is none of those).
6. **Cleanup**: `DELETE /api/resource/Production Plan/MFG-PP-2026-00005` — succeeded, zero
   residual trace left on the instance (same zero-trace precedent as PP-2's own create+delete
   test).

### M. Frontend footprint — PP-4 (2026-09-20)

New: `lib/actions/productionPlanPlanning.ts` (`getSubAssemblyItemsPreview`/
`saveSubAssemblyItemsAction`/`getMaterialRequirementsPreview`/`saveMaterialRequirementsAction` —
each re-fetches the real document and re-checks `docstatus === 0` itself before calling ERPNext or
persisting, same defense-in-depth precedent as `updateBomAction`. **Correction (in-session
`code-reviewer` finding, same day):** the first version of the two save actions spread the
caller-supplied `options`/`rows` parameters directly into `updateDoc`'s payload — a real deviation
from this codebase's otherwise-universal "construct the persisted field set explicitly, key by
key" convention (`buildBomFields`, `parseLocationRows`, etc.), since a Server Action is a directly
-invokable endpoint with no runtime enforcement of a TypeScript parameter's shape. Fixed: both save
actions now build the `updateDoc` payload from named fields only, and re-run `rows` through the
same whitelist parser the preview path already uses, before persisting — closing the gap where a
caller invoking a save action directly (skipping the preview step) could have smuggled arbitrary
extra top-level Production Plan fields or child-row keys through), two new whitelisted row parsers
in `lib/productionPlanRows.ts` (`parseProductionPlanSubAssemblyItemRows`/
`parseProductionPlanMaterialRequestPlanItemRows` — drop calculation-only keys the native responses
also carry, e.g. `item_name`/`description`/`main_bom`/`indent`, keeping only fields this baseline
actually documents on each child doctype), and two new client components
(`ProductionPlanSubAssemblyPanel`/`ProductionPlanMaterialRequirementPanel`) that replace the
Sub-Assemblies/Material Requirements tabs' content **only while `docstatus === 0`** — a Submitted
or Cancelled plan still shows PP-1's original static read-only tables, unchanged. Both panels are
read-only-result (no editable cells on the computed rows — unlike PP-2's `po_items`, nothing here
is a genuine user judgment call ERPNext leaves open; "trust the preview, save it as-is") and
require an explicit "Get ..." then a separate explicit "Save ..." click — no auto-persist. The
Material Requirements panel reads sub-assembly rows off the **currently saved** document (not
client-side component state), so saving the Sub-Assemblies tab first is what makes raw materials
explode through sub-assemblies; a single-level-BOM plan (the only kind currently on this instance)
can skip that step and go straight to Material Requirements. No "Make Work Order"/"Make Material
Request" action, no Reserve Stock action, no multi-location "Purchase / Transfer" dialog. PP-1's
five other tabs, PP-2's create wizard, and PP-3's Submit button are unchanged.

## Work Order Generation (PP-5, 2026-09-20)

Source: `production_plan.py`'s `make_work_order()` (a one-line delegator), full read of
`services/work_order_planning.py` (`WorkOrderCreationService`) and
`services/work_order_quantities.py` (`ProductionPlanWorkOrderQuantities`), plus
`production_plan.js`'s `refresh(frm)`/`get_items_for_work_order`/`make_work_order` handlers, all
fetched read-only via `gh api` against `frappe/erpnext` this session — then **live-verified**
against the real Hetzner instance using the app's own "Frontend Integration" service-account
credentials (read from `apps/frontend/.env.local`, never written/modified/printed). This narrows
`MFG-UNV-012`'s Work Order generation uncertainty for the **finished-good path**; sub-assembly/
subcontract Work Order generation remains source-only (no such data exists on this instance — see
"Runtime verification" below).

### N. The exact method, and the key finding: zero server-side lifecycle gate

`make_work_order()` is `@frappe.whitelist()` directly on the `ProductionPlan` class (**Document-bound**,
not module-level — same `run_doc_method` REST boundary as `get_sub_assembly_items`, not
`callMethodWithResult`), takes **no arguments**, and its entire body is
`return WorkOrderCreationService(self).make_work_order()`. That service's own `make_work_order()`
opens with `self.doc.reload()` — the very first thing it does is discard whatever was in the
payload and re-fetch the real document fresh from the DB by name, so (unlike PP-2's never-saved-doc
case) no `__islocal`/`__unsaved` placeholder handling is needed here — a plain re-fetched doc is
sufficient as the `run_doc_method` payload.

**Confirmed (again, consistent with PP-3's own "Button/action visibility by docstatus" finding):
no server-side `docstatus`/`status` assertion exists anywhere in this call chain.** The
`docstatus === 1` gate is exclusively a Desk-UI convention (`production_plan.js refresh()` wraps
the "Work Order / Subcontract PO" button in `if (frm.doc.docstatus === 1)`, further gated by
`frm.doc.status !== "Closed"`/`"Completed"` and a client-side `get_items_for_work_order(frm)`
heuristic that reads `frm.doc.__onload.pending_work_order_qty` or falls back to a naive
`planned_qty > ordered_qty` check) — calling `make_work_order` directly against a Draft or
Cancelled Production Plan would not be rejected by ERPNext itself. Ceylon Stack's own server
action (`makeWorkOrderAction`, `lib/actions/productionPlanWorkOrder.ts`) is therefore the actual
enforcement point: it re-fetches the document and rejects anything but `docstatus === 1` itself,
mirroring `loadDraftOrThrow`'s established defense-in-depth precedent for the Draft-only actions,
just inverted. It deliberately does **not** additionally block on `status` (`"Completed"`/
`"Closed"`) — Desk doesn't enforce that server-side either, so doing so here would make Ceylon
Stack stricter than ERPNext itself for no documented reason; that distinction is left as a
UI-only visibility rule (button hidden, not a hard block) in the page component.

### O. Desk flow — no dialog, one click generates everything pending

`production_plan.js`'s `make_work_order(frm)` handler is exactly:
```js
make_work_order(frm) {
    frappe.call({ method: "make_work_order", freeze: true, doc: frm.doc,
        callback: function () { frm.reload_doc(); } });
},
```
No row-selection dialog, no quantity prompt — Desk asks nothing and generates Work Orders (and any
Subcontract-type Purchase Orders) for **every** row with outstanding pending quantity in one call,
then reloads the whole form. Ceylon Stack's UI mirrors this: one confirm step, one call, no
per-row picker — building a row-selection dialog would be inventing a capability ERPNext's own
Desk doesn't have.

### P. Quantity semantics — server-authoritative, and NOT the same field the Production Plan displays

`WorkOrderCreationService.get_production_items()` sources each row's Work Order `qty` from
`ProductionPlanWorkOrderQuantities(self.doc.name).get_pending_quantities(self.doc)`, **not** from
the stored `po_items.pending_qty`/`ordered_qty` fields the Production Plan detail page displays.
`get_pending_quantities()`:
```python
committed = self.get_committed_quantities()   # docstatus == 1 Work Orders only, this production_plan only
pending[row.name] = max(0, row.planned_qty - committed.get(row.name, 0))
```
`get_committed_quantities()` filters `{"production_plan": self.production_plan, "docstatus": 1}` —
**two consequences, both live-confirmed this session:**

1. **Scoped to Work Orders created from *this* Production Plan specifically** — a Work Order that
   happens to reference the same Sales Order/item through a different path (e.g. created directly
   via this app's own Work Order create flow, or a different Production Plan) does **not** reduce
   the pending qty. Live-observed: `SAL-ORD-2026-00007` already had a real, unrelated Submitted
   Work Order (`MFG-WO-2026-00006`, qty 30, `production_plan: null`) before this test; a fresh
   Production Plan sourced from the same Sales Order still computed the full `pending_qty: 30` —
   ERPNext correctly ignored the unrelated Work Order.
2. **Only counts *Submitted* (`docstatus == 1`) Work Orders — Draft does not count.** This is the
   source of the duplicate-generation finding below.

This app never reimplements this calculation — `makeWorkOrderAction` sends no quantity of its own;
every number in a created Work Order is ERPNext's own computation.

### Q. Duplicate generation — LIVE CONFIRMED, real and reproducible (not hypothetical)

**Finding:** clicking "Make Work Order" a second time, before the Work Order(s) the first click
created have been Submitted, creates a **second full-quantity Work Order for the same row** — not
a skip, not a smaller top-up. This is native ERPNext behavior (a direct consequence of §P's
`docstatus == 1`-only committed-quantity filter), reproduced live this session, not a Ceylon
Stack defect:

1. First call against a real Submitted Production Plan (`MFG-PP-2026-00005`, `po_items` row
   `FG-STEEL-BRACKET-ASSY` × 30) created `MFG-WO-2026-00009` (Draft, qty 30, correct
   `production_plan_item` back-reference).
2. Re-fetching the Production Plan showed `po_items[0].ordered_qty` still `0.0` and
   `pending_qty` still `30.0` — **the stored Production Plan fields are not updated by Work Order
   creation at all**; they're only recomputed on the Production Plan's own next `validate()`/save,
   which `make_work_order()` never triggers (it never calls `self.doc.save()`).
3. Calling `make_work_order` again immediately, with no other state change, created
   `MFG-WO-2026-00010` — **a second Work Order, qty 30, same `production_plan_item`** —
   because `MFG-WO-2026-00009` was still `docstatus 0` and so contributed nothing to
   `get_committed_quantities()`'s `docstatus == 1` filter.
4. `create_work_order()`'s own duplicate guard (`OverProductionError`, via
   `ProductionPlanWorkOrderQuantities.validate_work_order()`) is enforced at a **Work Order's own
   submit** time, not at this creation step — and Draft-stage creation runs with
   `flags.ignore_validate = True` regardless, so nothing in the creation path itself would have
   caught this even if the check were relevant here.

**This app's mitigation, in scope for PP-5 (no client-side quantity logic, no locking framework —
per the package brief's explicit instruction):** an honest, visible warning in the result panel
after a successful generation (`ProductionPlanMakeWorkOrderAction.tsx`) telling the user the
created Work Orders are Draft and that re-running the action before submitting them will create
duplicates — information Desk itself never surfaces. The button itself is not disabled after a
successful run (ERPNext gives this app no reliable signal to know pending qty has reached zero
without re-fetching and re-deriving it, which would be exactly the reimplementation the brief
prohibits) — the warning is the deliberate, in-scope answer instead of a client-side qty guess.

### R. Concurrency

`get_committed_quantities()`'s default call (used by `get_pending_quantities()`, i.e. the read that
decides how much to create) passes `for_update=False` — a plain, non-locking `SELECT`. Two
near-simultaneous "Make Work Order" clicks (two browser tabs, or two users) would both read the
same pending quantity and both create a full-quantity Work Order, independent of the duplicate
Draft-state finding above — the same underlying gap, just triggered by simultaneity instead of
sequential re-clicking. (Contrast: `validate_work_order()`, the check that runs at an individual
Work Order's own *submit* time, does use `for_update=True` — a real locking read — but that step is
downstream of creation and not part of this app's current scope, see `work-order.md`'s `MFG-WF-001`.)
No custom locking framework is added for PP-5, per the package brief's own instruction not to
over-build for an unconfirmed race — but this is not merely theoretical: §Q above proves the
non-locking read already produces duplicates under ordinary sequential use, so a concurrent-click
scenario would behave identically or worse. Recorded here as a known, source-confirmed gap in
ERPNext's own implementation, not a Ceylon Stack one.

**Independent-review addendum (2026-09-20, non-blocking):** a related but distinct nuance in
`makeWorkOrderAction`'s own before/after diff-based reporting (see §S/§U below) — if a *different*
concurrent request against the *same* Production Plan inserts a Work Order between this action's
"before" and "after" snapshot queries, that document would be misattributed to this click's result
panel. This is a reporting-attribution nuance, not the duplicate-*creation* gap above (the document
itself is genuine either way, no data corruption) — flagged by PP-5's independent reviewer as a
LOW-severity observation, not requiring remediation.

### S. Transaction / partial-failure semantics — SOURCE VERIFIED, not separately live-exercised

No explicit `frappe.db.commit()` appears anywhere in `work_order_planning.py`'s creation loop
(`make_work_order_for_finished_goods` → `make_work_order_for_subassembly_items` →
`make_subcontracted_purchase_order`, each iterating and calling `.insert()`). Standard Frappe
request-transaction semantics therefore apply (well-established Frappe behavior, not re-derived
from this file specifically): the whole HTTP request runs inside one DB transaction that commits
only if no exception escapes the request handler. The one exception `create_work_order()` itself
swallows is `OverProductionError` (skip that row, continue the loop); any other exception during
`wo.insert()` (e.g. a validation failure on a later row) would propagate uncaught and roll back
the **entire request** — including Work Orders already inserted earlier in the same loop, since
they share the one uncommitted transaction. **Conclusion: true partial persistence (some created,
some not, from a single click) should not occur** — either the whole batch commits, or an
unhandled exception rolls all of it back. This app's diff-based result reporting (`makeWorkOrderAction`
queries Work Order/Purchase Order state before and after, rather than trusting a fabricated
"success" message) reports whatever actually landed either way, so this claim isn't load-bearing
for correctness even if it turns out to be wrong in some edge case not exercised here.

### T. Side-effect matrix (Make Work Order)

| Effect | Result | Evidence |
|---|---|---|
| Production Plan field write | NO (own fields unchanged by this call — `ordered_qty`/`pending_qty`/`status` stay stale until the plan's own next validate/save) | **LIVE VERIFIED** — re-fetched `MFG-PP-2026-00005` after Work Order creation still showed `ordered_qty: 0.0`, `status: "Submitted"` |
| Work Order insert | YES, one per `po_items` row (finished-good) / one per In-House `sub_assembly_items` row | **LIVE VERIFIED** (finished-good path) / SOURCE VERIFIED (sub-assembly path — no test data) |
| Work Order docstatus on insert | Draft (`0`) — `wo.insert()` only, never `.submit()` | **LIVE VERIFIED** — `MFG-WO-2026-00009`/`-00010` both `docstatus: 0` |
| Purchase Order insert (subcontracted sub-assembly rows only) | NO for this plan (no sub-assembly rows existed) | **LIVE VERIFIED for the no-sub-assembly case** — 0 Purchase Orders found via `Purchase Order Item.production_plan` filter; SOURCE VERIFIED only for the Subcontract-row-present case |
| Bin write | NO | **LIVE VERIFIED** — `FG-STEEL-BRACKET-ASSY @ Finished Goods - CS` Bin byte-identical before/after (`reserved_qty 30 / projected_qty 80 / actual_qty 0`) |
| Stock Reservation Entry | NO from this call itself (separate `reserve_stock` mechanism, not invoked here) | SOURCE VERIFIED, consistent with prior PP-2/3/4 findings |
| Stock Ledger Entry | NO | **LIVE VERIFIED** — 0 rows for `voucher_no = MFG-WO-2026-00009` |
| GL Entry | NO | **LIVE VERIFIED** — 0 rows for `voucher_no = MFG-WO-2026-00009` |
| Material Request | NO (separate `make_material_request` action, not invoked) | SOURCE VERIFIED |

### U. Traceability fields — live-confirmed, exact match to the source read

`MFG-WO-2026-00009` (finished-good Work Order created from `po_items` row `t5v585ubnk`):
`production_plan: "MFG-PP-2026-00005"`, `production_plan_item: "t5v585ubnk"`,
`production_plan_sub_assembly_item: null`, `bom_no: "BOM-FG-STEEL-BRACKET-ASSY-001"`,
`company: "Ceylon Stack"`, `fg_warehouse: "Finished Goods - CS"` (carried from the `po_items` row's
own `warehouse`), `source_warehouse: null` (this BOM has no `default_source_warehouse` set —
confirms the mapping is real, not that it always resolves to a value), `wip_warehouse: null` (no
default WIP warehouse configured for this company in Manufacturing Settings — same reasoning),
`sales_order: "SAL-ORD-2026-00007"`, `project: null`, `use_multi_level_bom: 1` — **not** forced to
`0`, because this Production Plan's `sub_assembly_items` table was empty (the "force `0` when the
plan has sub-assembly rows" branch in `make_work_order_for_finished_goods` did not apply here — the
finding itself is now live-confirmed for the applicable/inapplicable-branch distinction, not just
the source read).

### V. Frontend footprint — PP-5 (2026-09-20)

New: `lib/actions/productionPlanWorkOrder.ts` (`makeWorkOrderAction` — re-fetches and re-checks
`docstatus === 1` fresh, same defense-in-depth precedent as `loadDraftOrThrow`; diffs
`Work Order`/`Purchase Order` back-reference queries before/after the native call instead of
trusting a fabricated name list, since `make_work_order()` itself returns nothing usable — see §N),
new component `ProductionPlanMakeWorkOrderAction.tsx` (two-step inline confirm, no modal framework;
result panel lists created Work Order links via the canonical `/manufacturing/work-orders/[name]`
route, and carries the duplicate-generation warning from §Q), wired into
`production-plans/[name]/page.tsx`'s header action bar next to the existing Submit button, visible
when `docstatus === 1 && status not in ["Completed", "Closed"]` (UI-only convention mirroring Desk,
not server-enforced — see §N). No "Make Material Request" action, no Reserve Stock action, no
subcontract-PO-specific UI (the Purchase Order side effect is only surfaced as an honest notice if
the single native call happens to produce one — see §N of `productionPlanWorkOrder.ts`'s own
doc comments). PP-1's five other tabs, PP-2's create wizard, PP-3's Submit button, and PP-4's two
Draft-only planning panels are unchanged. The Overview tab's scope-disclosure paragraph was
updated to reflect Make Work Order now being available on a Submitted plan.

### W. Runtime verification, 2026-09-20 — full round trip against the real Hetzner instance

With the user's explicit go-ahead (this creates real Draft Work Order documents, not a zero-trace
create+delete):

1. `get_open_sales_orders` confirmed `SAL-ORD-2026-00007` still eligible (its Sales Order Item's
   own stale `work_order_qty: 0.0` field, unrelated to the real `MFG-WO-2026-00006` Work Order
   already linked to it outside any Production Plan — see §P(1)). `combine_so_items` →
   `POST /api/resource/Production Plan` created a real Draft, `MFG-PP-2026-00005`
   (`FG-STEEL-BRACKET-ASSY` × 30, same shape as every prior package's test).
2. `PUT .../MFG-PP-2026-00005` with `{"docstatus": 1}` → `200`, `status: "Submitted"`.
3. **First `make_work_order` call** (via `run_doc_method`, mirroring `makeWorkOrderAction` exactly)
   → created `MFG-WO-2026-00009` — see §U for full field confirmation.
4. **Second `make_work_order` call**, no state change in between → created `MFG-WO-2026-00010`,
   a genuine duplicate — see §Q.
5. **Cleanup**: `PUT .../MFG-PP-2026-00005` with `{"docstatus": 2}` → `200`, `status: "Cancelled"`.
   Re-querying Work Orders for this plan immediately after returned **zero rows** —
   `on_cancel()`'s `delete_draft_work_order()` (already source-documented in this file's own
   "Submit / Cancel / Amend lifecycle" section) **live-confirmed**: both Draft Work Orders were
   hard-deleted automatically as part of cancelling the Production Plan, leaving zero residual
   trace beyond the Cancelled Production Plan itself (same audit-retention pattern as PP-3/PP-4's
   own cleanup). Final checks: `Bin` unchanged, `Sales Order Item.production_plan_qty` reverted to
   `0.0`, both Work Order names 404 on direct fetch.

**Sub-assembly / subcontract Work Order generation: SOURCE VERIFIED / NOT RUNTIME VERIFIED** — no
BOM with sub-assembly components exists on this instance (same gap `bom.md`/`MFG-UNV-009` and
PP-4's own section already flag), so the `type_of_manufacturing` branch logic (§"Work Order
generation" above, under "Sub-assemblies"), the `_sub_assembly_work_order`/
`make_subcontracted_purchase_order` code paths, and the Purchase Order side effect could not be
exercised live this session. Per the package brief's own §24 allowance, this is treated as an
acceptable, honestly-disclosed limitation rather than fabricated coverage.

## Material Request Generation (PP-6, 2026-09-20)

Source: `production_plan.py`'s `make_material_request()` (a one-line delegator), full read of
`services/material_request.py` (`MaterialRequestService`), `erpnext/stock/doctype/material_request/
material_request.py` (`on_submit()`/`update_requested_qty_in_production_plan()`), `hooks.py`'s
`doc_events` wiring, and `production_plan.js`'s `refresh(frm)`/`make_material_request`/
`create_material_request` handlers, all fetched read-only via `gh api` against `frappe/erpnext`
this session — then **live-verified** against the real Hetzner instance using the app's own
"Frontend Integration" service-account credentials (read from `apps/frontend/.env.local`, never
written/modified/printed). This resolves `MFG-UNV-012`'s Material Request generation uncertainty
for the finished-good/Purchase-type path; sub-assembly/subcontract-sourced raw material requests
(`Material Transfer`/`Manufacture`/`Subcontracting` types, multi-location transfer) remain
source-only (no such data exists on this instance).

### X. The exact method, and the critical difference from Make Work Order

`make_material_request()` is `@frappe.whitelist()` directly on the `ProductionPlan` class
(**Document-bound**, same `run_doc_method` REST boundary as `make_work_order`/
`get_sub_assembly_items`), takes no arguments beyond the doc itself, and its body is
`return MaterialRequestService(self).make_material_request()`.

**Critical, security-relevant difference from `make_work_order`:** `WorkOrderCreationService.
make_work_order()` opens with `self.doc.reload()`, discarding the payload and re-fetching the real
document from the DB before doing anything else — so a tampered payload can't influence its
quantity math. `MaterialRequestService.make_material_request()` has **no such reload** — it
iterates `self.doc.mr_items` exactly as received, and (per `lib/erpnext.ts`'s own `callRunDocMethod`
doc comment, already established by PP-2/PP-4) `frappe.get_doc(docs, check_permission=True)` never
touches the DB for a fetch when called with a `docs` payload — it builds the in-memory `Document`
purely from whatever dict is sent. **This means the caller is the entire trust boundary for the
quantity math ERPNext runs.** `makeMaterialRequestAction` (this app's server action) is therefore
not merely defense-in-depth the way `loadSubmittedOrThrow` is for `make_work_order` — it is the
*only* thing preventing a client from smuggling inflated `mr_items.quantity`/fabricated rows into a
real Material Request creation. The action re-fetches the real, saved Production Plan via `getDoc`
and forwards that object completely untouched (plus the one intentional `submit_material_request`
flag) — no caller-supplied row/qty data is ever accepted or merged in.

Confirmed (same as `make_work_order`, `get_sub_assembly_items`): **no server-side `docstatus`
assertion exists in this call chain either** — the `docstatus === 1` gate is exclusively the Desk-UI
convention already documented in "Button/action visibility by docstatus" above. This app's own
`loadSubmittedOrThrow` enforces `docstatus === 1` itself, same precedent as
`productionPlanWorkOrder.ts`.

### Y. Desk flow — a real confirm dialog, unlike Make Work Order's silent one-click

```js
make_material_request(frm) {
    frappe.confirm(
        __("Do you want to submit the material request"),
        function () { frm.events.create_material_request(frm, 1); },
        function () { frm.events.create_material_request(frm, 0); }
    );
},
create_material_request(frm, submit) {
    frm.doc.submit_material_request = submit;
    frappe.call({ method: "make_material_request", freeze: true, doc: frm.doc,
        callback: function (r) { frm.reload_doc(); } });
},
```

Unlike `make_work_order`, Desk **does** ask the user one question before calling this method: Yes →
`submit_material_request = 1`, No → `submit_material_request = 0`. `submit_material_request` is not
a real schema field (confirmed schema drift already noted earlier in this document) — it is a
transient key added directly to the in-memory `frm.doc` object for the duration of this one
`run_doc_method` call, read only via `self.doc.get("submit_material_request")` in
`_submit_material_requests()`, never persisted. This app's `ProductionPlanMakeMaterialRequestAction`
reproduces the same explicit choice (labelled "Keep as Draft" / "Submit immediately"), with the
duplicate-risk tradeoff spelled out — information Desk's own dialog never surfaces.

Button visibility (confirmed from `production_plan.js refresh()`, inside the same
`docstatus === 1` block as the Work Order button): `frm.doc.mr_items && frm.doc.mr_items.length &&
!["Material Requested", "Closed"].includes(frm.doc.status)`. This app mirrors it as a UI-only rule
in the page component, same convention as Work Order's own status gate.

### Z. Grouping, quantity, and requested-qty semantics — source read in full

```python
def make_material_request(self):
    self.validate_mr_subcontracted()
    material_request_map = {}
    material_request_list = []
    for item in self.doc.mr_items:
        qty_to_request = flt(flt(item.quantity) - flt(item.requested_qty), item.precision("quantity"))
        if qty_to_request <= 0:
            continue
        self._add_item_to_material_request(item, qty_to_request, material_request_map, material_request_list)
    if not material_request_list:
        msgprint(_("All items are already requested"))
        return
    self._submit_material_requests(material_request_list)
```

- **Grouping key: `f"{sales_order}:{material_request_type}:"`** — one Material Request per unique
  `(sales_order, material_request_type)` pair among `mr_items` rows with `qty_to_request > 0`. A
  single click can therefore create **multiple** Material Requests (live-confirmed possible, though
  this session's own test data only exercised the one-MR case — a single Sales Order, single type).
  `material_request_type` per row falls back to `Item.default_material_request_type` when the row's
  own value is unset; **no MR-type selection happens at this step** — it uses whatever `mr_items`
  already carries from the earlier "Get Items for Purchase Only" step (PP-4), which on this
  instance's only real BOM always resolved to `Purchase`. `Material Transfer` / `Manufacture` /
  `Subcontracting` types are schema-supported by `mr_items.material_request_type` (PP-4's own
  finding) but **NOT APPLICABLE / NOT test-verified** by this package — this app's action never
  lets the client choose or override the type; it only forwards what ERPNext already computed.
- **`qty_to_request = quantity − requested_qty`, precision-rounded.** This app never reimplements
  or second-guesses this — the whole `mr_items` array is forwarded untouched (see §X).
- **Generated Material Request fields** (`_material_request_item()`, `_new_material_request()`):
  `status: "Draft"` (docstatus 0 until `_submit_material_requests()` optionally submits it),
  `company` from the Production Plan, `material_request_type`, `transaction_date: nowdate()`,
  per-item `item_code`/`qty` (`= qty_to_request`, **not** the row's full `quantity`)/`uom`/
  `warehouse`/`schedule_date` (row's own, or `today + Item.lead_time_days`)/`from_warehouse` (only
  for `Material Transfer` type)/`project` (from the linked Sales Order, if any), and — the
  traceability fields — `production_plan` and `material_request_plan_item` (the `mr_items` row's
  own `name`). **Live-confirmed exact match**, see §CC below.
- **A group warehouse can never be a target** — `_material_request_item()` throws explicitly if
  `mr_items.warehouse` resolves to a group warehouse (not exercised live this session — this
  instance's only real target warehouse, `Finished Goods - CS`, is not a group).
- **`_submit_material_requests()`**: for each newly-built Material Request, `flags.
  ignore_permissions = 1`, `run_method("set_missing_values")`, `.save()` (always — this is what
  actually persists it as Draft), then `if self.doc.get("submit_material_request"):
  material_request.submit()`. **The requested-vs-required tracking this whole calculation depends
  on is a *downstream* effect, not something `make_material_request` itself writes**: `Material
  Request Plan Item.requested_qty` is only incremented by `Material Request.on_submit()` →
  `update_requested_qty_in_production_plan()` (wired via `hooks.py`'s `doc_events: {"Material
  Request": {"on_submit": "...update_completed_and_requested_qty", ...}}` — actually the direct
  call inside `Material Request.on_submit()` itself, not the Stock-Entry-triggered hook function of
  a similar name; that hook function is for a different call site, `update_completed_and_requested_qty`,
  triggered by Stock Entry submit/cancel against the *Material Request* itself, not this path) —
  which does `frappe.db.set_value("Material Request Plan Item", d.material_request_plan_item,
  "requested_qty", requested_qty + d.qty)` for every item row with both `production_plan` and
  `material_request_plan_item` set, then reloads the Production Plan and re-derives/writes its
  `status` (`doc.set_status()` + `doc.db_set("status", doc.status)`).

**This is the source of a real, live-confirmed duplicate-generation gap — see §AA.**

### AA. Duplicate generation — LIVE CONFIRMED, same class of gap as Work Order, different mechanism

**Finding:** clicking "Make Material Request" a second time with "Keep as Draft" selected both
times, before the first Material Request has been submitted, creates a **second full-quantity
Material Request for the same requirement** — not a skip, not a smaller top-up.

Live-reproduced this session (`MFG-PP-2026-00006`, sourced from `SAL-ORD-2026-00007`,
`FG-STEEL-BRACKET-ASSY` × 30, 3 raw-material `mr_items` rows — same test item as every prior
package):

1. First call, `submit_material_request: 0` → created `MAT-MR-2026-00005` (Draft, 3 items:
   `RM-BOLT-M6X20` qty 120, `RM-COATING-CPD` qty 1.5, `RM-STEEL-SHEET-2MM` qty 24 — exact BOM-scaled
   quantities, matching PP-4's own preview numbers exactly).
2. Re-fetching the Production Plan immediately after showed `mr_items[].requested_qty` still `0`
   for all three rows — confirms `requested_qty` is untouched by Draft creation, exactly as §Z
   predicts (the `on_submit()` hook never fired).
3. Second call, same params, no state change in between → created `MAT-MR-2026-00006` — a genuine
   second full-quantity duplicate (`RM-BOLT-M6X20` qty 120 again, etc.), because `requested_qty`
   was still `0` for every row.
4. After deleting both Draft duplicates (cleanup) and calling a third time with
   `submit_material_request: 1` → created a Submitted Material Request; the Production Plan's
   `mr_items[].requested_qty` immediately matched `quantity` exactly (`120`/`1.5`/`24`) — confirming
   `on_submit()`'s increment fired synchronously within the same request.
5. A fourth call, same params (`submit_material_request: 1`, no other state change) → created
   **zero** new Material Requests — `qty_to_request <= 0` for every row, confirming
   `_submit_material_requests()`'s own `msgprint("All items are already requested")` no-op path and
   proving the auto-submit path is genuinely idempotent on re-click, unlike the Draft path.

**Root-cause distinction from Work Order's duplicate finding (PP-5, §Q):** Work Order's gap is a
*read-side* filter (`get_committed_quantities()` only counts `docstatus == 1` Work Orders when
computing pending qty at *creation* time). Material Request's gap is a *write-side* omission
(`make_material_request()` never updates `requested_qty` itself — only a downstream document's own
`on_submit()` does). Same user-visible symptom (Draft-state re-click duplicates), different
mechanism — worth stating precisely rather than assuming Work Order's exact code path.

**This app's mitigation, in scope for PP-6 (no client-side quantity/locking logic, matching the
package brief's explicit instruction and PP-5's own precedent):** the Draft/Submit choice is
presented explicitly (mirroring Desk's own dialog, see §Y) with the duplicate-risk tradeoff spelled
out in the confirm panel and repeated as a warning after a Draft-result, so the user makes an
informed choice — not a client-side qty guess or locking framework.

### BB. Concurrency and transaction semantics

`make_material_request()`'s own read (`self.doc.mr_items`, whatever the payload carries) has no
locking of any kind — it's a plain in-memory loop, not even a fresh `SELECT`. Two near-simultaneous
calls against the same Production Plan (two tabs, two users, or this app's own action clicked
twice quickly) would each independently compute the same `qty_to_request` from the same stale
`requested_qty` and each create a full-quantity Material Request — the same underlying gap as §AA,
just triggered by simultaneity instead of sequential re-clicking. `Material Request Plan Item.
requested_qty`'s own write, in `update_requested_qty_in_production_plan()`, is a plain
`frappe.get_value()` read-then-`frappe.db.set_value()` write with **no `for_update=True`** either —
a genuine, source-confirmed lost-update race is possible if two Material Requests referencing the
same `mr_items` row were submitted concurrently, though this is materially less likely to be hit in
practice than the sequential Draft-reclick case above. No locking framework is added for PP-6, per
the same package-brief instruction PP-5 followed.

No explicit `frappe.db.commit()` appears in `_submit_material_requests()`'s per-Material-Request
loop — standard Frappe request-transaction semantics apply (well-established, not re-derived from
this file specifically): the whole request commits atomically only if no exception escapes it. No
exception is explicitly swallowed inside this loop (contrast Work Order's `OverProductionError`
catch) — an exception partway through (e.g. the second of three grouped Material Requests failing
`set_missing_values()`) would roll back the entire request, including any Material Request already
`.save()`d earlier in the same loop, since Frappe requests don't commit per-statement. **SOURCE
VERIFIED, not separately live-exercised** — this session's own test never produced more than one
Material Request per call, so the multi-MR partial-failure path itself was not directly observed.

### CC. Side-effect matrix (Make Material Request)

| Effect | Result | Evidence |
|---|---|---|
| Production Plan field write | NO (own fields, e.g. `mr_items[].requested_qty`, unchanged by this call itself) | **LIVE VERIFIED** — re-fetched immediately after a Draft-generating call, `requested_qty` still `0` on every row |
| Material Request insert | YES, one per distinct `(sales_order, material_request_type)` group | **LIVE VERIFIED** — `MAT-MR-2026-00005`/`-00006` |
| Material Request docstatus on insert | Draft (`0`) unless `submit_material_request` truthy, then Submitted (`1`) in the same request | **LIVE VERIFIED** — both paths exercised |
| `Material Request Plan Item.requested_qty` write | NO for Draft; YES (`quantity` added) immediately on Submit, via `Material Request.on_submit()` — not by `make_material_request()` itself | **LIVE VERIFIED** — both paths |
| Traceability fields (`production_plan`, `material_request_plan_item` on `Material Request Item`) | YES, exact match | **LIVE VERIFIED** — see full item dump below |
| Bin write | Not directly tested this session (no stock existed at the test warehouse either way) | SOURCE VERIFIED — `make_material_request()` itself contains no `Bin`/stock-ledger code path; any Bin `indented_qty` effect would come from `Material Request.update_requested_qty()`, a separate, unrelated method keyed off `is_stock_item`, not exercised/diffed this session |
| Stock Ledger Entry | NO | SOURCE VERIFIED — no stock-posting code anywhere in `make_material_request()`'s call chain |
| GL Entry | NO | SOURCE VERIFIED — same reasoning |
| Work Order | NO (separate `make_work_order` action, not invoked) | SOURCE VERIFIED |
| Purchase Order | NO (this call never creates one; only the Buying module's own PO-from-MR flow, out of scope, would) | SOURCE VERIFIED |
| Stock Reservation Entry | NO (separate `reserve_stock` mechanism, not invoked) | SOURCE VERIFIED, consistent with prior packages |

Live item-level dump (`MAT-MR-2026-00005`, Draft, first call):

```
company: "Ceylon Stack", material_request_type: "Purchase", transaction_date: "2026-09-20"
items:
  RM-BOLT-M6X20      qty 120  uom Nos    warehouse "Finished Goods - CS"  production_plan MFG-PP-2026-00006  material_request_plan_item k1blivo8sk
  RM-COATING-CPD     qty 1.5  uom Litre  warehouse "Finished Goods - CS"  production_plan MFG-PP-2026-00006  material_request_plan_item k1b80cnstd
  RM-STEEL-SHEET-2MM qty 24   uom Kg     warehouse "Finished Goods - CS"  production_plan MFG-PP-2026-00006  material_request_plan_item k1b630a247
```

### DD. New finding: Production Plan cancel is blocked by a linked Submitted Material Request

Not predicted by this package's brief, discovered incidentally during cleanup: attempting to cancel
`MFG-PP-2026-00006` (`docstatus: 2`) while the Submitted Material Request it created
(`MAT-MR-2026-00006`, from the auto-submit test) still existed failed with a genuine Frappe
`LinkExistsError`:

```
Cannot delete or cancel because Production Plan MFG-PP-2026-00006 is linked with
Material Request MAT-MR-2026-00006
```

This **independently confirms**, for the first time with a real reproduction, the claim
`production-plan.md`'s own §C.1 (PP-4) recorded on trust without independent verification:
"Production Plan cancellation with submitted linked downstream documents is source-confirmed to
fail safely through Frappe backlink checking / `LinkExistsError`." That claim can now be upgraded
from "recorded per instruction, not independently verified" to **LIVE VERIFIED**, at least for the
Material-Request-linked case specifically (the Work-Order-linked case remains as PP-5 left it —
Work Orders are Draft-only at creation and get auto-deleted on cancel via `delete_draft_work_order()`
before this check would ever matter for that path, and no *Submitted* Work Order linked to a
Ceylon-Stack-created plan has been produced to test the WO-linked variant of this same check).

Also newly confirmed: **`on_cancel()` has no Material-Request-deletion step at all** (contrast
`delete_draft_work_order()`, which *does* auto-delete Draft Work Orders on cancel) — so even a
still-*Draft* Material Request created from a plan would **not** be auto-cleaned by cancelling the
Production Plan; it would need to be manually deleted first, same as the Submitted case above, just
without the `LinkExistsError` blocking the cancel itself (a Draft downstream document doesn't
trigger Frappe's backlink check the way a Submitted one does). This app does not ship a Cancel
feature (per PP-3's own scope decision, unchanged), so this is recorded as canonical-model
knowledge, not something requiring a UI change.

### EE. A live-reproduced bug in this app's own query helper (not an ERPNext defect)

While diffing before/after Material Request state during this test, the nested list-filter query
`Material Request?filters=[["Material Request Item","production_plan","=","<name>"]]` was observed
to return **one row per matching child item, not one per distinct parent** — a 3-item Material
Request came back 3 times in the same response. `productionPlanMaterialRequest.ts`'s
`listMaterialRequestNames()` and the Traceability tab's own query in `page.tsx` were both written
to expect this and dedupe by `name` before use — fixed before shipping. **The same nested-filter
pattern already exists, unfixed, in the previously-accepted PP-5 code**
(`productionPlanWorkOrder.ts`'s `listSubcontractPurchaseOrderNames`, querying `Purchase Order` via
`Purchase Order Item.production_plan`) — not fixed as part of this package (out of PP-6's scope,
and no live sub-assembly/subcontract data exists on this instance to have actually triggered it
yet, so it has produced no observed incorrect output so far). Flagged here for a future
remediation package to fix at the source.

**PP-5R remediation (2026-09-20):** fixed at the source. `listSubcontractPurchaseOrderNames` now
dedupes with the identical `[...new Set(rows.map((r) => r.name))]` pattern `listMaterialRequestNames`
already uses — same nested-filter shape, same fix. This is a read-only result-normalization change:
no ERPNext data is written, `make_work_order`'s own logic and PP-5's Draft-duplicate-generation
caveat (§Q) are untouched. Still **SOURCE VERIFIED / NOT RUNTIME VERIFIED** — no live
sub-assembly/subcontract test data exists on this instance to exercise the duplicate-parent-row
case end-to-end (same gap noted above), so this closes the known defect at the code level without
upgrading its evidence level. The result panel (`ProductionPlanMakeWorkOrderAction.tsx`) was also
updated to link each returned Purchase Order via the canonical `/buying/purchase-orders/[name]`
route (that route already existed, confirmed by inspection — not newly built here), matching how
Work Order names and PP-6's Material Request names are already linked, instead of the previous
plain count + "see the Buying module" text.

### FF. Frontend footprint — PP-6 (2026-09-20)

New: `lib/actions/productionPlanMaterialRequest.ts` (`makeMaterialRequestAction` — re-fetches and
re-checks `docstatus === 1` fresh, forwards the untouched fetched document plus one
`submit_material_request` flag, never merges any caller-supplied row data; diffs `Material Request`
back-references before/after the native call, deduped by name per §EE), new component
`ProductionPlanMakeMaterialRequestAction.tsx` (two-step inline confirm offering "Keep as Draft" /
"Submit immediately", mirroring Desk's own dialog with the duplicate-risk tradeoff spelled out;
result panel lists created Material Requests via the canonical `/buying/material-requests/[name]`
route), wired into `production-plans/[name]/page.tsx`'s header action bar next to the existing Make
Work Order button, visible when `docstatus === 1 && mr_items.length > 0 && status not in
["Material Requested", "Closed"]` (UI-only convention mirroring Desk's own button gate, not
server-enforced — see §X). The Traceability tab's previously-deferred "Material Request
Traceability" placeholder is replaced with a real table (Material Request / Docstatus / Type /
Date), joined through `Material Request Item.production_plan` per the canonical model, deduped per
§EE. The Overview tab's scope-disclosure paragraph was updated to reflect both "Make ..." actions
now being independently available on a Submitted plan. PP-1's other tabs, PP-2's create wizard,
PP-3's Submit button, PP-4's two Draft-only planning panels, and PP-5's Make Work Order action are
unchanged.

### GG. Runtime verification, 2026-09-20 — full round trip against the real Hetzner instance

With the user's explicit go-ahead (this creates and submits real Material Request documents, not a
zero-trace create+delete):

1. `get_open_sales_orders` → tried each eligible Sales Order's `combine_so_items` result in turn
   until one yielded `po_items` (same known single-active-BOM gate as every prior package) →
   `SAL-ORD-2026-00007` again, `FG-STEEL-BRACKET-ASSY` × 30 → `POST /api/resource/Production Plan`
   created `MFG-PP-2026-00006` (Draft).
2. `get_items_for_material_requests` (module-level, `for_warehouse` set **both** on the doc payload
   and in the `warehouses` array — omitting it from the doc payload silently produced zero rows,
   a real, easy-to-miss requirement not previously exercised this precisely) → 3 raw-material rows,
   exact BOM-scaled quantities (see §Z).
3. `PUT` saved `for_warehouse` + `mr_items` to the Draft (mirrors `saveMaterialRequirementsAction`).
4. `PUT` `{"docstatus": 1}` → Submitted.
5. First `make_material_request` (`submit_material_request: 0`) → `MAT-MR-2026-00005` (Draft, 3
   items, exact traceability — see §CC).
6. Re-fetch: `mr_items[].requested_qty` still `0` on all 3 rows.
7. Second `make_material_request`, same params → `MAT-MR-2026-00006` — the duplicate, §AA.
8. Deleted both Draft Material Requests (cleanup) — succeeded, Draft docs are freely deletable.
9. Third `make_material_request` (`submit_material_request: 1`) → a new Submitted Material Request
   (Frappe's naming series reused the name `MAT-MR-2026-00006` after the prior same-named Draft was
   deleted — a naming-series-revert-on-delete coincidence that only affected this multi-step test
   script's own before/after bookkeeping across cleanup boundaries, not `makeMaterialRequestAction`
   itself, which only ever diffs within one single action call).
10. Re-fetch: `mr_items[].requested_qty` now exactly `120`/`1.5`/`24` — matches `quantity` exactly.
11. Fourth `make_material_request`, same params → zero new documents (§AA point 5).
12. Cleanup: cancelled the Submitted Material Request (`docstatus: 2`, succeeded) → deleted it
    (succeeded — a Cancelled Material Request was deletable here, same non-guaranteed-retention
    pattern PP-3's own QA pass already found for a Cancelled Production Plan). Then cancelled the
    Production Plan itself — **this only succeeded after** the linked Material Request was gone
    (§DD's `LinkExistsError` finding, discovered when attempted in the other order) — then deleted
    it. Final state: zero residual documents on the instance from this test (`MFG-PP-2026-00006`,
    `MAT-MR-2026-00005`, `MAT-MR-2026-00006` all confirmed 404 on re-fetch).

**Sub-assembly/subcontract-sourced Material Request generation (`Manufacture`/`Subcontracting`
types, `_collect_po_items()`'s `sub_assembly_items` branch): SOURCE VERIFIED / NOT RUNTIME
VERIFIED** — same gap as PP-4/PP-5's own sub-assembly limitations, no BOM with sub-assembly
components exists on this instance.

## Multi-Level BOM & Subassembly Runtime Qualification (PP-7, 2026-09-20)

**Package type: discovery only.** No application code was changed. No Ceylon Stack test data was
created — the controlled runtime test (temporary `PP7-TEST-*` Items/BOMs/Sales Order/Production
Plan on the same Hetzner dev instance every prior PP package has used, per this repo's established
practice) was authorized and attempted, but the write step was blocked by this session's own
sandbox permission classifier ("Remote Shell Writes") before any record was created on the ERPNext
instance — a tooling-environment block, not an ERPNext or governance one. **Everything below is
`SOURCE VERIFIED / RUNTIME DEFERRED`, not `LIVE VERIFIED`** — nothing in this section should be
read as promoting `MFG-UNV-012` to live-confirmed. Read-only SSH access to the real installed
ERPNext v16.34.2 source on the live instance was available and used throughout.

### HH. Correction to prior source-path citations (contrary evidence, per governance §4)

PP-4's and PP-6's entries above cite `erpnext/manufacturing/doctype/production_plan/services/
sub_assembly.py`, `services/sub_assembly_queries.py`, `services/material_request.py`, and
`services/planning_queries.py`; PP-5's/PP-5R's entries cite `services/work_order_planning.py`.
**No `production_plan/services/` directory exists on the actual installed instance** (confirmed via
direct `find`/`ls` against `frappe_docker-backend-1`, ERPNext `v16.34.2`, site `62.238.22.161`) —
`get_sub_assembly_items` (both the Document-bound method and the separate module-level recursive
helper), `get_items_for_material_requests`, `make_work_order` (and its
`make_work_order_for_finished_goods`/`make_work_order_for_subassembly_items`/
`make_subcontracted_purchase_order` helpers), and `make_material_request` are **all defined directly
in the single file** `erpnext/manufacturing/doctype/production_plan/production_plan.py` (~2400
lines). This is flagged as required by governance rather than silently corrected: the earlier
*behavioral* claims (Document-bound vs. module-level, in-memory-only mutation, no `reload()` in
`make_material_request`, etc.) all independently re-verified true against the real file in this
session — only the **file-path citations** were wrong, most likely written from a differently
organized upstream/GitHub reference rather than the actual running container. Prior sections are
left as-is (not rewritten) per governance's "do not rewrite historical entries" norm; this note is
the correction of record.

### II. `make_work_order` — confirmed to generate BOTH finished-good and subassembly Work Orders

Direct source read, `production_plan.py`:773-960. `make_work_order()` (`@frappe.whitelist()`,
Document-bound) does, in order: `self.reload()` → `make_work_order_for_finished_goods()` →
`make_work_order_for_subassembly_items()` → `make_subcontracted_purchase_order()`. This answers
§2.E's core question directly from source: **it creates Work Orders for both**, in the same call,
not one or the other. `make_work_order_for_finished_goods` forces `use_multi_level_bom = 0` on the
finished-good Work Order whenever `self.sub_assembly_items` is non-empty — i.e., once sub-assembly
planning has run, the FG Work Order is explicitly told not to explode further, because the
subassembly Work Orders already cover that. `create_work_order()` (the shared helper both paths
call) silently swallows only `OverProductionError` (matches PP-5's §S claim exactly, now confirmed
for the subassembly path too, since it's the same helper) and calls `wo.insert()` with
`ignore_mandatory`/`ignore_validate` flags — a real database write, Draft only (no `.submit()`).

### JJ. `make_work_order_for_subassembly_items` — per-row routing and traceability fields

For each `sub_assembly_items` row: `type_of_manufacturing == "Subcontract"` rows are diverted to
`make_subcontracted_purchase_order` (never get a Work Order); `type_of_manufacturing == "Material
Request"` rows are skipped entirely here (they're raw-material-request candidates instead, see
§LL); everything else ("In House") gets a Work Order via `prepare_data_for_sub_assembly_items()`.

**Traceability — confirmed field-by-field (§2.F), and a real asymmetry with finished-good WOs:**
`prepare_data_for_sub_assembly_items` copies `production_item, item_name, fg_warehouse,
description, bom_no, stock_uom, bom_level, schedule_date, sales_order, sales_order_item` from the
sub-assembly row, then explicitly sets `use_multi_level_bom = 0`, `production_plan = self.name`,
`production_plan_sub_assembly_item = row.name`. **`production_plan_item` is never set on a
subassembly Work Order** — only on the finished-good Work Order (via `get_production_items()`,
keyed by the `po_items` row name; not independently re-read line-by-line this session, but
consistent with the existing §N/§U claims and the "A Work Order can reference only one Production
Plan row" comment adjacent to it in source). `Work Order` doctype schema confirms all cited
fieldnames exist: `production_plan`, `production_plan_item`, `production_plan_sub_assembly_item`,
`bom_no`, `sales_order`, `sales_order_item`, `fg_warehouse`, `wip_warehouse`, `from_wip_warehouse`,
`source_warehouse` (`work_order.json`, direct grep). `source_warehouse` for a subassembly Work
Order comes from `BOM.default_source_warehouse` of that subassembly's own BOM, not a Production
Plan field. **Correction (CX-MFG-PP7-DISC-002, PP-7R, live-verified 2026-09-21):** the claim above
that `fg_warehouse` "comes from company defaults, same as the finished-good path" was factually
inaccurate and is withdrawn. The actual mechanism, confirmed both from source and now from a live
Work Order: `work_order_data` is first populated with the company-default `fg_warehouse` (same
`get_default_warehouse`/`set_default_warehouses` helper used everywhere else), but
`prepare_data_for_sub_assembly_items()` then unconditionally copies the sub-assembly row's own
`fg_warehouse` field over that initial value (already correctly stated two paragraphs above — this
correction concerns §JJ's warehouse-summary sentence only, not the row-copy claim itself, which was
always right). Row-level `fg_warehouse` on a `sub_assembly_items` row is itself sourced from
`self.sub_assembly_warehouse` if set (`get_sub_assembly_items`'s own `warehouse=self.
sub_assembly_warehouse` parameter, threaded through to each generated row), so in practice the
header's Sub Assembly Warehouse field — not the company default — determines a subassembly Work
Order's `fg_warehouse` whenever it's set. `wip_warehouse` and `scrap_warehouse` are **not** part of
that row-copy override and remain company-default-only for subassembly Work Orders exactly as
originally claimed — only `fg_warehouse` was wrong. **Live evidence:** `MFG-PP-2026-00006` had
`sub_assembly_warehouse = "Work In Progress - CS"`, set deliberately distinct from the company's
default FG warehouse (`Finished Goods - CS`) specifically to make this distinguishable; the
resulting subassembly Work Order (`MFG-WO-2026-00011`, `production_item: "PP7-TEST-SUB"`) persisted
with `fg_warehouse: "Work In Progress - CS"` — the header override, not the company default — while
its sibling finished-good Work Order (`MFG-WO-2026-00010`) persisted `fg_warehouse: "Finished Goods
- CS"` (the `po_items` row's own warehouse, per §U, unaffected by this correction).
`wip_warehouse`/`source_warehouse` were `NULL` on both live rows (no WIP/source warehouse
configured for either BOM/company on this instance — consistent with, not contradicting, the
company-default claim for those two fields specifically).

**Quantity**, for both FG and subassembly rows, comes from `ProductionPlanWorkOrderQuantities(self.name).get_pending_quantities(self)`
— a "pending" calculation, not a raw planned-qty copy — matching §P's existing claim, now confirmed
to apply identically to the subassembly path via the same shared class.

### KK. `get_sub_assembly_items` — multi-level recursion and `skip_available_sub_assembly_item`, precisely

Two distinct functions share this name: a Document-bound whitelisted method (`production_plan.py`:1043,
builds `self.sub_assembly_items` from `self.po_items`) and a module-level recursive helper
(`production_plan.py`:2052, the actual explosion engine). The bound method loops each `po_items`
row and calls the module-level helper once per row with `row.bom_no` as the starting point.

**Multi-level traversal is genuinely recursive**, confirmed from source: for each `d.expandable`
component from `get_bom_children(parent=bom_no)`, if `d.value` (a linked BOM number) is present, the
function calls **itself** with that BOM as the new parent and `indent=indent+1` — this is what
answers "what happens with more than one BOM level" (§2.B): it keeps recursing to whatever depth the
BOM structure actually has, not a fixed 2-level assumption. `parent_item_code` on each row is
`frappe.get_cached_value("BOM", bom_no, "item")` — the item code of the assembly this component
belongs to at that level (not the top-level finished good) — combined with `bom_level`/`indent`
(both set to the current recursion depth), this is how the flat `sub_assembly_items` table encodes a
tree: reconstruct it by grouping on `(parent_item_code, bom_level)`, not by any explicit parent-row
ID link. `data.production_plan_item = row.name` is set once, at the top of each `po_items` row's own
explosion — every sub-assembly row generated from exploding one finished-good row carries that same
`production_plan_item` back-reference, regardless of how deep it sits in that row's own subtree.

**Clarification (CX-MFG-PP7-DISC-001, PP-7R):** `get_bom_children` performs **no BOM-selection
algorithm of its own** — it is an alias for `bom.get_children` and simply returns each BOM Item
child row as-is, including whatever `bom_no` (`d.value`) is already stored on that row. Which BOM a
component resolves to is decided once, at BOM-authoring time (a BOM Item row is auto-linked to the
component item's active/default submitted BOM when the BOM is saved), not by this function or by
`get_sub_assembly_items` at explosion time. **Live evidence:** `BOM-PP7-TEST-FG-001`'s `PP7-TEST-SUB`
component row carried `bom_no: "BOM-PP7-TEST-SUB-001"` immediately on BOM creation, before
`get_sub_assembly_items` was ever called — confirming the linkage `get_bom_children` reads is
pre-existing data, not something it computes.

**`skip_available_sub_assembly_item` — exact semantics (§2.C), fully source-traced, corrected and
deepened per CX-MFG-PP7-DISC-004 (PP-7R, 2026-09-21):**
- **Validation-time**: if enabled without `self.sub_assembly_warehouse` set, the bound method throws
  immediately, before any explosion happens. **Live-verified**: `MFG-PP-2026-00006` threw exactly
  this error (`"Row #1: Please select the Sub Assembly Warehouse"`) on the first `get_sub_assembly_
  items()` attempt, before `sub_assembly_warehouse` was set — also newly confirming
  `skip_available_sub_assembly_item` **defaults to enabled** (`"default": "1"` in
  `production_plan.json`), a previously undocumented default that makes this validation the common
  case, not an edge case, for any caller that doesn't explicitly clear the checkbox.
- **Correction — this is not a simple "cache first result, reuse it" model.** Direct re-read of the
  module-level helper (`production_plan.py`:2052-2069) shows the Bin lookup itself IS cached per
  `item_code` (`bin_details.setdefault(...)`, fetched once), but the **availability check is not a
  simple cache hit/miss** — the line `_bin_dict.original_projected_qty = _bin_dict.projected_qty`
  resets the working balance back to the item's fixed, never-mutated `Bin.projected_qty` on *every*
  occurrence of that `item_code`, for as long as that item_code has not yet been recorded as
  exhausted. Concretely, within one `po_items` (finished-good) row's own explosion: if occurrence 1
  of an item needs less than the full `Bin.projected_qty`, it is marked fully covered and the
  decremented remainder is **discarded**, not carried forward — occurrence 2 of the *same* item_code
  elsewhere in that row's subtree is checked again against the *original, undiminished*
  `Bin.projected_qty`, not a running balance. Only when a *single* occurrence's requirement exceeds
  the (still-full) `Bin.projected_qty` does that occurrence register a shortfall, and that item_code
  is appended to an in-memory "already processed" list — from that point on, in the *entire remaining
  traversal* (including later, unrelated `po_items` rows, since each row's tracking list is seeded
  from every item_code that has appeared in any earlier row's exploded output), every further
  occurrence of that item_code skips the reduction logic entirely and is charged the full theoretical
  quantity with **zero** stock credit. Net effect: available stock can be credited more than once
  across sibling occurrences that each individually stay within it (no true cross-occurrence
  drawdown while every check keeps passing), but the moment any single occurrence exceeds the
  available balance, that item is "used up" for the rest of the document, not just that branch. **Not
  independently re-verified this session against non-zero stock** — the PP-7R fixture deliberately
  carried no stock for `PP7-TEST-RM-A`/`RM-B`/`RM-C` per governance (§22 of the PP-7R brief: don't
  post stock solely to exercise this flag), so only the zero-`Bin.projected_qty` path (`>0` check
  false, reduction skipped entirely, full required qty charged) is `LIVE VERIFIED` — confirmed by
  `MFG-PP-2026-00006`'s `mr_items` output matching the fixture's full theoretical quantities exactly
  (RM-A: 80, RM-B: 100, RM-C: 30, for 10 planned FG). The reset/exhaustion mechanics described above
  remain `SOURCE VERIFIED / RUNTIME DEFERRED` — a future package with authorized stock-posting scope
  would be needed to exercise the sufficiency branch live.
- **Effect on generated rows**: the row is **always appended** to `sub_assembly_items` regardless of
  available stock — `stock_qty` (the actual production-need quantity) gets reduced toward 0 as
  available `Bin.projected_qty` is consumed, but `required_qty` (the gross theoretical need) is
  captured *before* that reduction and left untouched. A fully-stock-covered row still appears in
  the table with `stock_qty = 0`; it does **not** disappear from the Production Plan. It does,
  however, produce **no Work Order**, because `make_work_order_for_subassembly_items` explicitly
  skips any row where `qty <= 0`.
- **Cascades down the tree**: the (possibly stock-reduced) `stock_qty` is passed as the *next
  recursion level's* `to_produce_qty` — so if a subassembly is fully covered by existing stock, its
  own children (deeper subassemblies or raw materials) are computed with `to_produce_qty = 0` too,
  suppressing production need for that entire subtree. This is a materially important multi-level
  behavior not previously documented: stock sufficiency at one level doesn't just skip that one
  Work Order, it collapses the need for everything beneath it in that branch.
- **Not a stock mutation** at any point — confirmed no `.insert()`/`.save()`/`.submit()` call
  anywhere in this function. Purely planning-time.

Phantom items (`d.is_phantom_item`) are excluded from `bom_data` entirely (no row generated) —
noted for completeness, not exercised by this session's planned minimal test structure.

`set_default_supplier_for_subcontracting_order()` (called at the end of the bound method) looks up
`Item Default.default_supplier` for each `Subcontract`-typed row and sets `row.supplier` — an
in-memory field set at the same trust boundary as everything else in this method, not a separate
write.

### LL. `get_items_for_material_requests` — confirmed pure function, and the three explosion paths

Module-level, `@frappe.whitelist()`, `production_plan.py`:1745. Confirmed **zero persistence calls**
anywhere in the function body (matches the existing §X/PP-4 claim) — it only builds and returns an
`mr_items` list.

**How subassembly rows feed in**: any `sub_assembly_items` row with `type_of_manufacturing ==
"Material Request"` is appended directly to the working item list as its own raw-material-request
candidate (`item_code = sa_row.production_item`, `required_qty = sa_row.qty`,
`include_exploded_items = 0` — i.e., requested as-is, not exploded further). This is the third
`type_of_manufacturing` value beyond `"In House"`/`"Subcontract"` — a subassembly can be planned to
be simply purchased/requested rather than manufactured or subcontracted, and it flows into Material
Request generation, not Work Order generation, when set that way (§G note below).

**Flattening is confirmed** (§2.D's "are subassembly components flattened" question): once any
`sub_assembly_items` exist on the document, every `po_items` row automatically gets
`include_exploded_items = 1`. Three distinct code paths are then selected by flag combination:
- `get_raw_materials_of_sub_assembly_items()` — when exploding **and** `skip_available_sub_assembly_item`
  **and** sub-assembly rows exist: reuses the already-stock-adjusted `sub_assembly_items` quantities
  rather than recomputing from a fresh BOM explosion, keeping Material Request quantities consistent
  with whatever stock reduction §KK already applied.
- `get_exploded_items()` — when exploding **and** `include_subcontracted_items`, without the
  stock-aware flag: a full, non-stock-aware multi-level BOM flatten.
- `get_subitems()` — the non-exploded fallback: direct BOM children only, not multi-level.

Not independently traced this session (flagged, not overclaimed): the exact `ordered_qty`
subtraction formula inside `get_material_request_items()` (what `ignore_existing_ordered_qty`
precisely nets against) — §2.D's question is answered at the "what does the flag gate" level
(it also enables `get_materials_from_other_locations()`, a transfer-location lookup, when combined
with a `warehouses` list), not at the exact arithmetic level. `for_warehouse` is confirmed as the
target/receiving warehouse the Bin-based shortage calculation is checked against, and is excluded
from its own transfer-source candidate list. No frontend reimplementation of any of this exists in
Ceylon Stack, consistent with the standing PP-4 rule.

### MM. Side-effect classification (§2.H), source-confirmed this session

| Method | Classification | Evidence |
|---|---|---|
| `get_sub_assembly_items` (bound) | IN-MEMORY MUTATION | appends to `self.sub_assembly_items`; no `frappe.db`/`.save()` call in the method body |
| `get_sub_assembly_items` (module-level recursive helper) | READ ONLY | `get_bom_children`/`get_bin_details` reads only; returns data, no writes |
| `get_items_for_material_requests` | READ ONLY | builds and returns `mr_items`; zero persistence calls |
| `make_work_order` → finished-good path | DOWNSTREAM DOCUMENT CREATION | `wo.insert()`, Draft only |
| `make_work_order` → subassembly (In House) path | DOWNSTREAM DOCUMENT CREATION | same `create_work_order()`/`wo.insert()` helper, Draft only |
| `make_work_order` → subassembly (Subcontract) path | DOWNSTREAM DOCUMENT CREATION | `make_subcontracted_purchase_order()` calls `po.insert()` — a real Purchase Order, Draft, not just a notice |
| `make_work_order` → subassembly (Material Request) path | none (no document created here) | row is skipped by `make_work_order_for_subassembly_items`; only surfaces later via `make_material_request` |
| `skip_available_sub_assembly_item` stock check | READ ONLY | `Bin.projected_qty` lookup only, no mutation |

No `STOCK POSTING` or `ACCOUNTING POSTING` classification applies to anything reached from this
call graph — consistent with every prior PP package's finding that Production Plan planning and
Draft Work Order/Purchase Order/Material Request generation are non-posting. Not independently
re-confirmed by a live before/after GL/SLE query this session (see blocker below); this is a source
classification, not a runtime-proven absence.

### NN. Duplicate-generation (§2.G) — source-level answer, not yet runtime-confirmed for subassemblies

PP-5's live-confirmed finished-good duplicate-generation finding (§Q: re-running `make_work_order`
before submitting the Work Order it just created generates a second full-quantity one, because
`ProductionPlanWorkOrderQuantities.get_pending_quantities()` only nets against *Submitted* Work
Orders) reads, from source, as **equally applicable to the subassembly path** — both
`make_work_order_for_finished_goods` and `make_work_order_for_subassembly_items` source their
quantity from the exact same `ProductionPlanWorkOrderQuantities(self.name).get_pending_quantities(self)`
call, keyed by `production_plan_item`/`production_plan_sub_assembly_item` respectively, with no
different Draft-counting logic between the two paths. This is a strong source-level inference, not
a generalization from insufficient evidence — the mechanism is literally the same function call —
but per governance §16/§28, it is recorded as `SOURCE VERIFIED / RUNTIME DEFERRED`, not asserted as
live-confirmed, since no subassembly Work Order has actually been created twice on this instance to
watch it happen.

### OO. Runtime qualification — blocked, environment-level, not governance-level

Environment identity was confirmed unambiguous before any write was attempted: SSH to
`62.238.22.161` (`ubuntu-4gb-hel1-4`), `docker ps` confirmed the same `frappe_docker-*` stack this
whole project uses, `bench --site 62.238.22.161 list-apps` confirmed `frappe`/`erpnext`/
`smart_factory` — the same single Hetzner instance every prior PP package's live testing ran
against, not a separate untested environment. Read-only queries against it (source file discovery,
`Company`/`Warehouse`/`Customer`/`Item` lookups, an existing single-level BOM's structure) all
succeeded normally over multiple calls.

The actual write step — creating the `PP7-TEST-*` Items/BOMs described in the package brief's
minimal test structure — was denied by this Claude Code session's own sandbox permission classifier
("[Remote Shell Writes]") before the command executed. This is a tooling/environment guardrail in
this particular session, separate from and additional to the repository's own governance
authorization for temporary PP-7 test data. No workaround was attempted. **No test data of any kind
was created on the ERPNext instance** — there is nothing to clean up, and no residual risk from this
session's attempt.

**Discovery decision for the runtime-verification objective specifically:** `C. RUNTIME
QUALIFICATION BLOCKED — STATE EXACT BLOCKER` (see the package handoff for the full statement). This
does not apply to the source-discovery objective, which is substantially complete (§HH–NN above).

**Superseded 2026-09-21 (PP-7R):** the blocker described above was specific to that prior session's
own sandbox permission classifier, not a standing environment or governance restriction. A
follow-up session confirmed both SSH and Frappe-console write capability against the same instance
(a throwaway `PP7R-CAPTEST` Item was created and deleted before any fixture work began, specifically
to prove write capability rather than assume it), then completed the runtime qualification this
section could not. See §PP below for the full result; §HH–OO above are left unchanged as the
historical record of the blocked attempt.

### PP. PP-7R — Controlled Multi-Level Runtime Qualification, live-confirmed (2026-09-21)

Environment re-confirmed identical to every prior PP package before any write: SSH to
`62.238.22.161`, `docker ps` showing the same `frappe_docker-*` stack (image `frappe/erpnext:
v16.34.2`), `bench version` inside `frappe_docker-backend-1` confirming `frappe 16.33.1` /
`erpnext 16.34.2` / `smart_factory 0.0.1`, site `frontend` (`default_site` in
`common_site_config.json`) with `installed_apps: ["frappe", "erpnext", "smart_factory"]`. A
pre-test positive-absence sweep (`Item`/`BOM`/`Sales Order`/`Production Plan`/`Work Order`/
`Material Request`/`Purchase Order`/`Stock Ledger Entry`/`GL Entry`/`Stock Reservation Entry`, all
filtered on the `PP7%`/`%PP7%` naming pattern) returned zero rows everywhere, matching the
independent Gate A reviewer's own prediction exactly.

**Fixture** (company `Ceylon Stack` — the convention every prior PP package used, not the
`(Demo)` company; warehouses `Stores - CS`/`Work In Progress - CS`/`Finished Goods - CS`; customer
`Grant Plastics Ltd.`, reused from prior PP1–PP6 manufacturing test Sales Orders after the
originally-planned `QA Test Customer Sales E2E` turned out to be `disabled` and correctly rejected
the Sales Order with `PartyDisabled` — confirmed by re-querying for the document afterward rather
than trusting the in-memory object, which still carried a name/qty from the failed attempt):

| Item | Item Group | Role |
|---|---|---|
| `PP7-TEST-FG` | Products | Finished good, sold |
| `PP7-TEST-SUB` | Sub Assemblies | Subassembly (1 level deep) |
| `PP7-TEST-RM-A` / `RM-B` | Raw Material | `BOM-PP7-TEST-SUB-001` components |
| `PP7-TEST-RM-C` | Raw Material | `BOM-PP7-TEST-FG-001` direct component |

`BOM-PP7-TEST-SUB-001` (submitted, default): 1 `PP7-TEST-SUB` = 4 `RM-A` + 5 `RM-B`.
`BOM-PP7-TEST-FG-001` (submitted, default): 1 `PP7-TEST-FG` = 2 `PP7-TEST-SUB` + 3 `RM-C`. Its
`PP7-TEST-SUB` row's `bom_no` was auto-populated to `BOM-PP7-TEST-SUB-001` at BOM save time, before
any explosion method ran — direct evidence for CX-MFG-PP7-DISC-001 (§KK). Sales Order
`SAL-ORD-2026-00040`: 10 × `PP7-TEST-FG`, submitted.

**Flow reproduced exactly matching this app's own accepted integration path** (same native
methods `lib/actions/productionPlanCreate.ts`/`productionPlanPlanning.ts`/`productionPlanWorkOrder.ts`
call via `run_doc_method`, invoked directly here since a live browser session wasn't in scope):
`get_open_sales_orders` → sales_orders table set to just `SAL-ORD-2026-00040` (the native
`get_open_sales_orders` call itself, run without a customer/item filter, correctly pulled *every*
open Sales Order on the company including unrelated PP1–PP6 fixtures — expected, undocumented-
elsewhere-until-now behavior, not a defect — so the table was narrowed to the one SO under test
before combining, exactly as a real user selecting rows in the grid would) → `combine_so_items` →
`po_items` correctly populated (`PP7-TEST-FG`, `bom_no: BOM-PP7-TEST-FG-001`, `planned_qty: 10`,
`warehouse: Finished Goods - CS`) → `insert()` → `MFG-PP-2026-00006` (Draft, independently
re-queried after insert to confirm persistence, not just the in-memory object).

**`get_sub_assembly_items`**: first call threw `"Row #1: Please select the Sub Assembly Warehouse"`
— live confirmation that `skip_available_sub_assembly_item` defaults enabled (see §KK correction
above). Retried with `sub_assembly_warehouse = "Work In Progress - CS"` (deliberately different
from the company default FG warehouse, to make CX-MFG-PP7-DISC-002 distinguishable rather than
inconclusive): produced exactly one `sub_assembly_items` row — `production_item: PP7-TEST-SUB`,
`bom_no: BOM-PP7-TEST-SUB-001`, `qty: 20` (2 × 10, correct), `bom_level: 0`, `parent_item_code:
PP7-TEST-FG`, `fg_warehouse: "Work In Progress - CS"` (the header override, not the company
default — see §JJ correction), `type_of_manufacturing: "In House"`, `supplier: null`. `RM-C` does
**not** appear here (it has no BOM — it flows to `mr_items` directly instead, correctly). Saved;
independently re-queried via raw SQL (bypassing the ORM entirely) and matched exactly.

**`get_items_for_material_requests`** (the free-standing function, called directly — matches
§LL's "confirmed pure function" claim: attempting to persist its raw output into `mr_items` failed
with `MandatoryError: warehouse` for all three rows, exactly as expected since the function itself
never sets a `warehouse` when none is passed in, and the failed `save()` left zero rows persisted,
independently confirmed via SQL count) returned exactly the expected multi-level-flattened set:

| item_code | quantity | main_item_code | from_bom | Expected (§14 sanity check) |
|---|---|---|---|---|
| `PP7-TEST-RM-C` | 30.0 | `PP7-TEST-FG` | `BOM-PP7-TEST-FG-001` | 30 ✓ |
| `PP7-TEST-RM-A` | 80.0 | `PP7-TEST-SUB` | `BOM-PP7-TEST-SUB-001` | 80 ✓ |
| `PP7-TEST-RM-B` | 100.0 | `PP7-TEST-SUB` | `BOM-PP7-TEST-SUB-001` | 100 ✓ |

All three exactly match the hand-computed expectation for 10 FG — direct confirmation that
multi-level flattening (§LL) correctly nets a two-level tree (FG → SUB → RM-A/RM-B, plus FG → RM-C
directly) into one flat raw-material list, live, not just from source.

**Submit** (`MFG-PP-2026-00006`, `docstatus 0 → 1`): zero `Stock Ledger Entry`/`GL Entry` rows for
any `PP7%` item or this plan's name, before and after — matching the standing "submit never posts"
claim, now live-confirmed for a plan that actually has non-empty `sub_assembly_items` (every prior
live submit test had empty `sub_assembly_items`/`mr_items`).

**`make_work_order`**, called once: generated exactly two Draft Work Orders in the same call,
confirming §II's "both in one call" claim live for the first time —

| | `MFG-WO-2026-00010` (FG) | `MFG-WO-2026-00011` (SUB) |
|---|---|---|
| `production_item` | `PP7-TEST-FG` | `PP7-TEST-SUB` |
| `qty` | 10 | 20 |
| `bom_no` | `BOM-PP7-TEST-FG-001` | `BOM-PP7-TEST-SUB-001` |
| `sales_order` | `SAL-ORD-2026-00040` | `SAL-ORD-2026-00040` |
| `production_plan_item` | *(set, row `tfkcfro0p9`)* | `NULL` |
| `production_plan_sub_assembly_item` | `NULL` | *(set, row `uu3a86p472`)* |
| `fg_warehouse` | `Finished Goods - CS` | `Work In Progress - CS` |
| `source_warehouse` / `wip_warehouse` | `NULL` / `NULL` | `NULL` / `NULL` |
| `docstatus` | 0 (Draft) | 0 (Draft) |

This is a live, first-time confirmation of the exact asymmetry §JJ predicted from source
(`production_plan_item` XOR `production_plan_sub_assembly_item`, never both), and of the
`fg_warehouse` correction above. `source_warehouse`/`wip_warehouse` being `NULL` on both rows is
consistent with (not contrary to) source: neither BOM has a `default_source_warehouse` set, and no
WIP warehouse is configured in this company's Manufacturing Settings — the same "no default
configured, so nothing to carry" reasoning §U already established for the FG path, now confirmed to
apply identically to the subassembly path. A second `make_work_order` invocation (to runtime-test
subassembly duplicate-generation, §NN) was deliberately **not** performed — not required for this
package's primary objective and would have added cleanup risk for no acceptance-relevant benefit;
subassembly duplicate-generation remains `SOURCE VERIFIED / RUNTIME DEFERRED`.

**Side-effect audit** (before/after, via independent raw SQL, bypassing the ORM): `Stock Ledger
Entry`, `GL Entry`, `Stock Entry Detail`, `Material Request Item`, and `Purchase Order Item` all
returned zero rows for any `PP7%` item at every checkpoint (post-Draft-creation, post-submit,
post-Make-Work-Order) — no unexpected posting anywhere in the flow.

**No Material Request was created** (per governance: not required to close a specifically-scoped
gap, and this package's primary objective — multi-level explosion + subassembly Work Order
generation — was already fully exercised via `get_items_for_material_requests`'s direct-call
evidence above).

**Cleanup**, in dependency order, each step independently verified: delete both Draft Work Orders →
cancel + delete `MFG-PP-2026-00006` → cancel + delete `SAL-ORD-2026-00040` → cancel + delete
`BOM-PP7-TEST-FG-001` → cancel + delete `BOM-PP7-TEST-SUB-001` → delete all 5 `PP7-TEST-*` Items.
Every step succeeded without error; no `--force`/link-bypass flags used. Post-cleanup positive-
absence sweep (raw SQL, same shape as the pre-test sweep) confirmed **zero** residual rows across
`Item`/`BOM`/`Sales Order`/`Production Plan`/`Work Order`/`Material Request`/`Purchase Order`/
`Stock Ledger Entry`/`GL Entry`/`Stock Reservation Entry`.

**CX-MFG-PP7-DISC-003** (positive absence checks finding zero `PP7`-pattern records before this
package began): confirmed correct and **resolved** by this session's own independent pre-test
sweep, which found the same zero-everywhere result the original reviewer reported. No remediation
was ever needed.

**No application code was changed.** This package is evidence/documentation only —
`git diff --check` and the working-tree diff for this commit touch only `docs/`.

## Cancel (PP-8, 2026-09-21)

Implements the last standard Frappe lifecycle transition Production Plan was missing: Submitted →
Cancelled (`docstatus` 1→2), via the same generic `cancelDoc()` mechanism every other cancellable
doctype in this app already uses — no bespoke cancellation logic, no new whitelisted method.
Resolves the two `NEEDS_VERIFICATION` items PP-6's own discovery had left open (Submitted Work
Order's blocking behavior; a linked Draft Material Request's fate on cancel).

**New**: `cancelProductionPlanAction(name)` (`manufacturing/production-plans/actions.ts`) —
re-fetches the document and independently re-checks `docstatus === 1` before doing anything, then
re-derives `getConnections("Production Plan", name)` itself (never trusts a client-supplied "no
blockers" claim) to build a named blocking-document error, mirroring
`cancelPurchaseOrderAction`'s exact shape. A new `"Production Plan"` entry was added to
`lib/connections.ts`'s `CONNECTION_CONFIG` (Work Order, Material Request, and subcontract Purchase
Order) — Work Order's back-reference is a **direct field on Work Order itself**, not a child
table, but Frappe's own filter syntax treats a 4-tuple `[doctype, field, op, value]` identically to
a plain 3-tuple filter when `doctype` equals the doctype being listed (the standard example in
Frappe's own `get_list` docs), so the existing `getConnections()` function needed no code change
to support it — Material Request and Purchase Order reuse the exact same child-row-back-reference/
dedupe shape PP-6/PP-5R already established. No new query architecture was created. UI: a Cancel
button (`DocActionBar`, `variant="danger"`) in the detail page's header, visible whenever
`docstatus === 1` (not gated by `status`, since `on_cancel()` itself carries no such check) — either
rendered directly, or replaced with a plain blocking-message line when `cancelBlocking.length > 0`,
matching Purchase Order's own detail-page convention exactly.

**Live-verified, 2026-09-21**, against the real Hetzner instance, replicating exactly the REST call
sequence the shipped server action performs (create/submit Production Plan → optionally generate a
Work Order/Material Request → attempt cancel → observe → clean up), using a small dedicated test
Sales Order (`SAL-ORD-2026-00040`, qty 5 of the existing `FG-STEEL-BRACKET-ASSY` item — the
project's one real Sales Order with spare eligible quantity, `SAL-ORD-2026-00007`, already had its
full 30-unit quantity consumed by an unrelated pre-existing Submitted Work Order
`MFG-WO-2026-00006` with no `production_plan` back-reference, confirmed via live schema query — not
a Production-Plan-generated document, left untouched):

- **Safe cancel** (no downstream documents): `MFG-PP-2026-00006` submitted with zero blocking
  documents → cancel succeeded, `docstatus` 1→2. `LIVE VERIFIED`.
- **Draft Work Order**: `MFG-PP-2026-00007` → Make Work Order created a Draft Work Order → cancel
  succeeded → the Draft Work Order was confirmed **auto-deleted** (`delete_draft_work_order()`),
  re-confirming PP-5's own finding independently. `LIVE VERIFIED`.
- **Submitted Work Order** (previously `NEEDS_VERIFICATION`): `MFG-PP-2026-00010` → Make Work Order
  → the generated Work Order was submitted (after setting `wip_warehouse`, which ERPNext requires
  before Work Order submit and which `make_work_order` does not default when no company default WIP
  warehouse is configured — confirmed live, a genuine prerequisite gap unrelated to Cancel itself,
  noted here for whoever next builds Work Order Create's own warehouse defaulting) → cancelling the
  Production Plan was **blocked** with `frappe.exceptions.LinkExistsError` naming the Work Order —
  the same generic mechanism that already blocks on a Submitted Material Request. This app's own
  proactive guard (the `getConnections`-based check inside `cancelProductionPlanAction`) correctly
  identified the Submitted Work Order as blocking *before* the raw ERPNext call was attempted, so
  the shipped UI never surfaces the raw `LinkExistsError` text. **Resolved: `LIVE VERIFIED`.**
- **Draft Material Request** (previously `NEEDS_VERIFICATION`): `MFG-PP-2026-00014` → Get Items for
  Purchase Only against a deliberately zero-stock warehouse (`Work In Progress - CS`, to force a
  real non-zero shortage — the project's one stocked raw-material warehouse, `Stores - CS`, already
  holds far more than this test's demand, so the first attempt produced a correct-but-useless
  zero-quantity row) → Make Material Request (kept Draft) created `MAT-MR-2026-00006` → cancelling
  the Production Plan **succeeded** (a Draft Material Request does **not** block cancel, confirming
  `check_if_doc_is_linked`'s Submitted-only semantics extends to Material Request the same way it
  already does for every other doctype) → the Draft Material Request was independently re-fetched
  afterward and confirmed **not auto-deleted, not auto-cancelled** — it is left exactly as-is,
  silently orphaned, still carrying its now-Cancelled Production Plan's back-reference. This is a
  genuine, newly-confirmed asymmetry with Work Order's own auto-delete-Draft cascade. **Resolved:
  `LIVE VERIFIED`.** Per this package's own conservative-scope instruction, no orphan-cleanup logic
  was implemented — resolving/deleting an orphaned Draft Material Request left over from a
  cancelled plan is a separate business decision, out of PP-8's boundary; the orphan created by this
  test was deleted manually as test cleanup, not by any shipped app feature.
- **Submitted Material Request**: `MFG-PP-2026-00015` → same Get Items for Purchase Only/zero-stock
  setup → Make Material Request with immediate submit → cancelling the Production Plan was
  **blocked** with `LinkExistsError` naming the Material Request, re-confirming PP-6's own finding
  independently, with the proactive guard again catching it first. `LIVE VERIFIED` (re-confirmed).
- **Invalid-state guard**: a raw `docstatus: 2` PUT against an existing Draft Production Plan
  (`MFG-PP-2026-00001`, pre-existing, untouched) was rejected by ERPNext itself
  (`DocstatusTransitionError`); the same call against an already-Cancelled plan
  (`MFG-PP-2026-00006`) was rejected with `"Cannot edit cancelled document"`. Confirms the premise
  behind `cancelProductionPlanAction`'s own explicit `docstatus === 1` pre-check — the shipped
  action never reaches ERPNext for either invalid case, returning a plain, friendly message instead.
- **Side effects**: a positive-absence sweep of `GL Entry`/`Stock Ledger Entry` created during the
  entire test window returned zero rows for both — no unintended financial/stock impact from any
  Cancel scenario above, matching source (`on_cancel()` posts nothing itself).

**Cleanup**: every Production Plan created for this test was fully exercised through to Cancelled;
Frappe retains cancelled documents for audit and does not permit deleting one still linked to
another cancelled document (same finding PP-3 already recorded) — `SAL-ORD-2026-00040` and the six
`MFG-PP-2026-00*` test plans above remain on the instance, permanently Cancelled, by design, not as
an unresolved residual-trace risk. The one Draft artifact this test's own cleanup *could* remove
(the orphaned Draft Material Request) was deleted; the Submitted Work Order/Material Request
created for the blocking-scenario tests were cancelled (not deletable once Submitted) as part of
resolving their own blocking condition before the enclosing plan could be cancelled.

**Explicitly not implemented, per this package's own boundary**: Amend; any cleanup/orphan-handling
for a Draft Material Request left behind by a cancelled plan; Reserve Stock/Stock Reservation Entry
un-reservation on cancel (this app's create form never sets `reserve_stock`, so no live plan this
app can create ever exercises that branch — a Desk-created plan with `reserve_stock=1` remains
`NEEDS_VERIFICATION`); subcontract Purchase Order's own cancel-blocking behavior (the
`CONNECTION_CONFIG` entry is wired and structurally identical to the already-verified Material
Request case, but no subcontract Purchase Order test data exists on this instance to exercise it
live — same recurring gap PP-5/PP-5R/PP-7R already disclosed, `SOURCE VERIFIED / NOT RUNTIME
VERIFIED` only).

## NEEDS_VERIFICATION

See `docs/backend/99-unverified/unverified-behaviours.md` → `MFG-UNV-012` for the consolidated
list. As of PP-7R (2026-09-21), multi-level subassembly explosion, multi-level material-requirement
flattening (zero-stock case), subassembly Work Order generation, subassembly Work Order
backreference asymmetry, and the `fg_warehouse` precedence question are `LIVE VERIFIED`. As of PP-8
(2026-09-21), Cancel's behavior against a Submitted Work Order, a Draft Material Request, and a
Submitted Material Request are all now `LIVE VERIFIED` too (see "Cancel (PP-8...)" above). Still
`NEEDS_VERIFICATION`/`SOURCE VERIFIED, RUNTIME DEFERRED`: `skip_available_sub_assembly_item`'s
stock-sufficiency/exhaustion branch against non-zero stock, subassembly duplicate-generation on a
second `make_work_order` call, subcontract-typed subassembly rows (including their own
cancel-blocking behavior), Reserve Stock/Stock Reservation Entry's cancel/un-reservation behavior,
and any concurrency/high-volume behavior. Note: this item was originally misassigned `MFG-UNV-010`
— a number already in use by an unrelated BOM verification item — and was renumbered to
`MFG-UNV-012` per Codex review finding `CX-MFG-PP-004`.
