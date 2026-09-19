# Production Plan — Backend Knowledge Baseline

Domain status: `DOCUMENTED` (schema + business-rule source-verified, **zero runtime/live-write
verification** — no Production Plan document exists on the instance). See
`docs/backend/15-migration/migration-status.md`.

This is a **discovery/canonicalization pass only** — per `CLAUDE.md`'s Current Mission and the
2026-09-19 Production Planning discovery package. No frontend exists yet for Production Plan (see
"Frontend footprint" below); nothing here should be read as describing built behavior.

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

## NEEDS_VERIFICATION

See `docs/backend/99-unverified/unverified-behaviours.md` → `MFG-UNV-012` for the consolidated
list (no live Production Plan document exists to test any of this against; all of it is
source-derived, high-confidence but not live-confirmed). Note: this item was originally
misassigned `MFG-UNV-010` — a number already in use by an unrelated BOM verification item — and was
renumbered to `MFG-UNV-012` per Codex review finding `CX-MFG-PP-004`.
