# BOM (Bill of Materials) — Backend Knowledge Baseline

Domain status: `INVESTIGATED, READ-ONLY FRONTEND IMPLEMENTED` — see
`docs/backend/15-migration/migration-status.md`. Written during the Master Data Manufacturing
Masters (BOM) investigation package, 2026-09-19, which concluded **Gate B — no usable BOM frontend
existed at that time to canonicalize** (see `PROGRESS.md`/`docs/operations/AI_WORK_LOG.md` for the
full handoff). The Manufacturing Masters — BOM Package 4A (also 2026-09-19, immediately following
Codex's acceptance of this investigation) then built the first canonical, **read-only** BOM entity
frontend: `/master-data/boms` (list) and `/master-data/boms/[name]` (detail) — see "Frontend
capability" below for what changed. This document's field/schema/lifecycle/costing knowledge is
otherwise unchanged by that package; no BOM create/edit/submit/cancel/amend/cost-recompute action
was added, and none of `MFG-UNV-009`'s open behavioral questions were resolved by displaying
existing backend values.

## Source of truth for this baseline

Live-verified against the real Hetzner ERPNext instance via `mcp__ceylon-stack__get_doctype_fields`
(`BOM`, `BOM Item`, `BOM Operation`) and `list_documents`/`list_doctypes`, 2026-09-19. Frontend
capability verified by direct repository read of `apps/frontend/src/lib/actions/bomLookup.ts`,
`WorkOrderForm.tsx`, `MaterialTransferForm.tsx`, `WorkOrdersTable.tsx`, and the Work Order detail
page. Anything not covered by that trail is flagged `NEEDS_VERIFICATION` below and cross-referenced
in `docs/backend/99-unverified/unverified-behaviours.md`.

**Only one real BOM exists on this instance**: `BOM-FG-STEEL-BRACKET-ASSY-001` (item
`FG-STEEL-BRACKET-ASSY`, company `Ceylon Stack`, `docstatus: 1`, `is_active: 1`, `is_default: 1`,
`with_operations: 1`, `routing: null`, `bom_creator: null`, `amended_from: null`). It has no
sub-assembly components, so multi-level BOM behavior below is schema-verified but **not**
behavior-verified against real nested data.

## Identity

| Field | Fieldname | Type | Required | Notes |
|---|---|---|---|---|
| Company | `company` | Link → Company | yes | |
| Item to Manufacture | `item` | Link → Item | yes | The finished/semi-finished good this BOM produces |
| Item Name | `item_name` | Data | no | Denormalized copy of `item`'s name |
| Quantity (Output Qty) | `quantity` | Float | yes | Base quantity this BOM's component quantities are expressed against — this is the `bom.quantity` the frontend's `bomLookup.ts` already reads and scales against (`bomItem.qty * (workOrderQty / bom.quantity)`) |
| Unit Of Measure | `uom` | Link → UOM | no | |
| Currency | `currency` | Link → Currency | yes | Transaction currency |
| Conversion Rate | `conversion_rate` | Float | yes | To company currency |

Naming: real record observed as `BOM-<ITEM>-<NNN>` (ERPNext's default BOM naming series) — not
independently confirmed as a fixed rule since only one record exists; treat as `NEEDS_VERIFICATION`
if a naming-dependent feature is ever built.

## Status / configuration fields

| Field | Fieldname | Type | Notes |
|---|---|---|---|
| Is Active | `is_active` | Check | |
| Is Default | `is_default` | Check | Drives `Item.default_bom` — this is what `apps/frontend`'s `listManufacturableItemOptions` (`itemLookup.ts`) and `listBomsForItem` (`bomLookup.ts`) both key off today |
| Is Phantom BOM | `is_phantom_bom` | Check | Phantom BOMs are exploded through at stock-transaction time and never appear as their own stock item — `NEEDS_VERIFICATION` for actual transaction-time behavior, not exercised by this frontend |
| Allow Alternative Item | `allow_alternative_item` | Check | Enables `Item Alternative` substitution — cross-referenced in `material-transfer.md`'s Alternative Item note (left unbuilt, no `Item Alternative` master data configured on this instance) |
| With Operations | `with_operations` | Check | Gate for whether the `operations` child table is used |
| Track Semi Finished Goods | `track_semi_finished_goods` | Check | Newer ERPNext field for per-operation semi-finished-goods tracking — not used by the one real BOM, `NEEDS_VERIFICATION` |
| Transfer Material Against | `transfer_material_against` | Select: `Work Order` / `Job Card` | Controls whether Material Transfer for Manufacture happens at the Work Order or Job Card level — the one real BOM's value not independently re-checked in this pass; `material-transfer.md`'s built flow assumes Work Order-level transfer |
| Routing | `routing` | Link → Routing | Optional alternate way of defining operations via a reusable `Routing` master instead of inline `operations` rows — `null` on the one real BOM (it uses inline `operations` + `with_operations` instead) |
| Quality Inspection Required | `inspection_required` | Check | |
| Quality Inspection Template | `quality_inspection_template` | Link → Quality Inspection Template | |
| Default Source/Target Warehouse | `default_source_warehouse` / `default_target_warehouse` | Link → Warehouse | |
| Consume Components Based On | `backflush_based_on` | Select: `BOM` / `Material Transferred for Manufacture` | |
| Set rate of sub-assembly item based on BOM | `set_rate_of_sub_assembly_item_based_on_bom` | Check | Relevant only when this BOM references a child BOM as a sub-assembly component |
| Finished Goods based Operating Cost | `fg_based_operating_cost` | Check | + `operating_cost_per_bom_quantity` |

## Document lifecycle

**BOM is a submittable doctype** (has `amended_from: Link → BOM`, the standard Frappe
amend-pattern field). The one real BOM is `docstatus: 1` (submitted). Draft → Submit → Cancel →
Amend semantics were **not independently exercised** in this pass (no write/transition was
performed, per this package's "no backend modification" and read-only investigation scope) —
`NEEDS_VERIFICATION` for: what submit-time validation actually runs, whether a submitted BOM can
be edited in place (ERPNext core convention says no — submitted docs are immutable except via
amend — but not confirmed against this instance), and what happens to Work Orders/Job Cards
already referencing a BOM that later gets cancelled/amended.

## BOM Item (child table, `items`)

Confirmed as a genuine **child entity** (`options: "BOM Item"`, a Table fieldtype on `BOM.items`),
not an independent master — matches the architecture brief's expected default and this package's
`NOT AUTHORIZED: create /master-data/bom-items` boundary.

| Field | Fieldname | Type | Notes |
|---|---|---|---|
| Item Code | `item_code` | Link → Item, required | Component item |
| Item Name | `item_name` | Data | Denormalized |
| Item operation | `operation` | Link → Operation | Which operation (from the parent BOM's `operations` table) this component is consumed at |
| Operation ID | `operation_row_id` | Int | Row-id join to the `operations` child table |
| Do Not Explode | `do_not_explode` | Check | When this component is itself a BOM (`bom_no` set) — whether to explode it into its own sub-components or keep it flat |
| BOM No | `bom_no` | Link → BOM | **This is the sub-assembly / nested-BOM pointer** — set when this component item is itself manufactured via another BOM |
| Source Warehouse | `source_warehouse` | Link → Warehouse | |
| Allow Alternative Item | `allow_alternative_item` | Check | Row-level override of the parent's `allow_alternative_item` |
| Is Stock Item | `is_stock_item` | Check | Denormalized from `Item` |
| Qty | `qty` | Float, required | In `uom` |
| UOM | `uom` | Link → UOM, required | |
| Stock Qty | `stock_qty` | Float | `qty` converted to `stock_uom` |
| Stock UOM | `stock_uom` | Link → UOM | |
| Conversion Factor | `conversion_factor` | Float | |
| Rate | `rate` | Currency (transaction currency) | |
| Basic Rate (Company Currency) | `base_rate` | Currency (company currency) | |
| Amount / Amount (Company Currency) | `amount` / `base_amount` | Currency | `qty * rate` / `qty * base_rate` |
| Qty Consumed Per Unit | `qty_consumed_per_unit` | Float | |
| Has Variants | `has_variants` | Check | |
| Include Item In Manufacturing | `include_item_in_manufacturing` | Check | |
| Original Item | `original_item` | Link → Item | Populated when this row is an Alternative Item substitution (same convention already documented for `Stock Entry Detail.original_item` in `master-erd.md`) |
| Sourced by Supplier | `sourced_by_supplier` | Check | Subcontracting flag |
| Is Sub Assembly Item | `is_sub_assembly_item` | Check | Denormalized true when `bom_no` is set |
| Is Phantom Item | `is_phantom_item` | Check | |

The current frontend's `BomItemRow` type (`bomLookup.ts`) reads only `item_code`, `item_name`,
`qty`, `uom`, `rate` — a deliberate narrow read for the Work Order create preview, not the full
schema above.

## BOM Operation (child table, `operations`)

Also a genuine child entity (`options: "BOM Operation"`). Field set already fully documented in
`apps/frontend/src/lib/actions/bomLookup.ts`'s `BomOperationRow` type and cross-verified in
`work-order.md`'s Work Order Operation section (that's where the `hour_rate`/`base_hour_rate`
copy-source correction, `CX-MFG-002`, is recorded) — not re-duplicated here. Confirmed via this
package's live `get_doctype_fields` call that the schema `bomLookup.ts`'s doc comments describe
is still accurate, with two additions not previously called out in `work-order.md`:
- `finished_good` / `finished_good_qty` / `bom_no` on `BOM Operation` — per-operation semi-finished
  routing fields, deliberately not copied to Work Order Operation (already noted in `bomLookup.ts`
  and `work-order.md`).
- `add_raw_materials` — a `Button` fieldtype (Desk UI action, not a data field; irrelevant to any
  REST-based frontend).

## Other BOM child tables (not read by this frontend, schema-only)

| Table | Fieldname | Purpose |
|---|---|---|
| BOM Secondary Item | `secondary_items` | Byproduct/secondary output items — real field, zero frontend/data footprint, `NEEDS_VERIFICATION` |
| BOM Explosion Item | `exploded_items` | Backend-computed flattened multi-level component list — ERPNext populates this server-side; this app must never compute it client-side (matches this package's "no BOM explosion logic in the frontend" boundary) |
| BOM Website Item / BOM Website Operation | `show_in_website`-gated | Website/e-commerce display tables — out of scope, no e-commerce surface in this project |

## Costing

All costing fields are real, schema-confirmed, and backend-computed — this frontend does not
read or recompute any of them today (`getBomDetails` in `bomLookup.ts` only fetches
`name`/`quantity`/`items`/`operations`, not cost fields):

| Field | Fieldname | Notes |
|---|---|---|
| Raw Material Cost | `raw_material_cost` / `base_raw_material_cost` | |
| Operating Cost | `operating_cost` / `base_operating_cost` | |
| Secondary Items Cost | `secondary_items_cost` / `base_secondary_items_cost` | |
| Total Cost | `total_cost` / `base_total_cost` | |
| Cost Allocation | `cost_allocation` / `cost_allocation_per` | |
| Process Loss | `process_loss_percentage` / `process_loss_qty` | |
| Rate Of Materials Based On | `rm_cost_as_per` | Select: `Valuation Rate` / `Last Purchase Rate` / `Price List`, + `buying_price_list`/`price_list_currency`/`plc_conversion_rate` when `Price List` is chosen |

`NEEDS_VERIFICATION`: the actual recompute trigger (ERPNext's "Update Cost" Desk action / a
scheduled job / submit-time only), and whether `total_cost` on the one real BOM currently
reflects live valuation rates or a stale snapshot — not queried in this pass since it would be
a read with no frontend consumer to act on it.

## BOM Creator (separate doctype, not BOM itself)

`BOM Creator` (+ `BOM Creator Item`) is a distinct, newer ERPNext doctype — a guided/interactive
BOM-building tool that produces a `BOM` document as its output (`BOM.bom_creator` links back to
it). It is **not** an alternate BOM identity; it's a separate authoring workflow. The one real
BOM's `bom_creator` field is `null` (created directly, not via BOM Creator). Not investigated
further — out of this package's scope, and not referenced anywhere in the frontend.

## Item relationships

- `BOM.item` → the finished/semi-finished good (`Item`)
- `BOM Item.item_code` → each component (`Item`)
- `BOM Item.bom_no` → nested/child BOM when a component is itself a manufactured sub-assembly
- `Item.default_bom` → the reverse pointer ERPNext maintains automatically when a BOM is marked
  `is_default`; this is the field the frontend already depends on (`listManufacturableItemOptions`,
  `WorkOrderForm.tsx`'s auto-select)

No canonical `/master-data/boms/[name]` route exists, so no entity link can be added yet — see
"Frontend capability gap" below.

## Multi-level / nested BOM — schema-confirmed, NOT behavior-verified

`BOM Item.bom_no` (sub-assembly pointer) and `BOM.exploded_items` (backend-computed flat list)
both exist and match the architecture brief's expected model. **No real nested BOM data exists on
this instance** (the one real BOM has zero sub-assembly components), so the following are all
`NEEDS_VERIFICATION` rather than confirmed:
- Actual multi-level explosion behavior end-to-end
- Circular-reference protection
- Default-BOM selection when a sub-assembly item has more than one active BOM
- Interaction between `do_not_explode` and `use_multi_level_bom` (the latter already documented
  on the Work Order side in `work-order.md`)

The frontend's own multi-level posture is already decided and unchanged by this investigation:
`use_multi_level_bom` is passed through to Work Order create as a plain boolean; ERPNext explodes
server-side; the frontend never performs its own explosion (`work-order.md`, `bomLookup.ts`).

## Work Order relationship

Fully documented in `docs/backend/05-manufacturing/work-order.md` (BOM selector behavior,
`bom_no` auto-fill from `default_bom`, the Work Order Operation field-copy convention and its
`CX-MFG-002` correction trail) — not re-duplicated here. At the time of this investigation, the
Work Order list and detail pages both rendered `bom_no` as **plain text**, not an entity link
(`WorkOrdersTable.tsx`, Work Order detail page's `DocField`, `MaterialTransferForm.tsx`) because no
canonical BOM route existed to link to. **Updated by Package 4A (2026-09-19):** all three now
render `bom_no` as a `/master-data/boms/[name]` entity link when present — see "Frontend
capability" above. The Work Order create BOM `<select>` itself remains an unchanged selector, not
a link, per that package's own explicit selector-vs-navigation boundary.

## Production Plan relationship

`Production Plan` (+ `Production Plan Item`, `Production Plan Sub Assembly Item`, `Production Plan
Sales Order`, `Production Plan Material Request`, `Production Plan Item Reference`) is a real,
independent ERPNext doctype (confirmed via `list_doctypes`, module `Manufacturing`). **Zero
frontend footprint**: no route, no action file, no component, no reference anywhere in
`apps/frontend`. Not investigated further — out of this package's scope. Classified as a **future
Manufacturing package** (transactional planning document that consumes BOMs, not a master itself).

## Stock / accounting boundary

BOM defines manufacturing requirements only. It has no direct stock ledger or GL posting impact
of its own — Work Orders, Job Cards, and Stock Entries are what move stock and post to accounts
(see `material-transfer.md` and `work-order.md`). This investigation did not touch, and found no
evidence of, any BOM-triggered stock or accounting side effect.

## Operation / Routing / Workstation — classification (informational only, not this package's scope)

Per this package's investigation brief, classified for whoever picks up the next Manufacturing
Masters package:

| Doctype | Classification | Notes |
|---|---|---|
| `Operation` | **B — backend-supported, frontend-missing** | Real independent master (`istable: 0`, module `Manufacturing`). Its value is rendered read-only in `WorkOrderForm.tsx`'s BOM operations preview and the Work Order detail page's Operations tab, and referenced as a Link fieldname (`BOM Operation.operation`, `BOM Item.operation`) — but there is no independent Operation list, detail/entity page, CRUD, or canonical master route anywhere in the frontend. |
| `Routing` | **B — backend-supported, frontend-missing** | Real independent master. `BOM.routing` is a Link to it; the one real BOM has `routing: null` (uses inline `operations` instead). No frontend read of `Routing` at all. |
| `Workstation` (+ `Workstation Type`) | **B — backend-supported, frontend-missing** | Real independent masters. `BOM Operation.workstation`/`workstation_type` and `Work Order Operation.workstation` are Links to them; the frontend reads/displays the *value* (already covered in `work-order.md`'s Operations tab) but never fetches/lists/links the `Workstation` record itself — matches `CLAUDE.md`'s explicit "Workstations — not touched by the frontend at all yet." |

None of these three were canonicalized, modified, or given new routes in this package — that
would require its own separately authorized package per this package's isolation boundary.

## Frontend capability (updated 2026-09-19, Package 4A)

At the time of this investigation (Gate B), nothing existed beyond `listBomsForItem` +
`getBomDetails` (`bomLookup.ts`) — a narrow read-only lookup used exclusively inside
`WorkOrderForm.tsx`'s Work Order create flow — plus unlinked plain-text display of `bom_no` on the
Work Order list, Work Order detail, and Material Transfer pages. That gap is now closed for
**read-only entity navigation only**:

- **Canonical routes:** `/master-data/boms` (minimal read-only list — search/Item/Company/Status
  filters, no "+ New") and `/master-data/boms/[name]` (detail — Overview/Components/Operations/
  Costing/More Info tabs). Both fetch directly via `getDoc`/`listDocs` against `BOM` — deliberately
  **not** routed through `bomLookup.ts`'s `getBomDetails`/`listBomsForItem`, which stay exactly as
  they were (narrow field set, silently-swallowed errors) because they're relied on by the Work
  Order create flow's own established behavior; the detail page instead follows the same
  `getDoc`+`ErpNextError`+`notFound()` pattern as the Work Order/Item/Warehouse detail pages.
- **Entity links added:** Work Order list (`WorkOrdersTable.tsx`) and detail page's `bom_no`,
  Material Transfer's `bom_no` (`MaterialTransferForm.tsx`), a BOM component row's own `bom_no`
  (nested/sub-assembly pointer) and `source_warehouse`, and a BOM's own `item`/`amended_from` all
  now resolve to their canonical `/master-data/*` route instead of plain text. A "View BOM →"
  link (opens in a new tab, so it can't interrupt an in-progress Work Order create form) was added
  next to `WorkOrderForm.tsx`'s existing read-only materials preview.
- **Explicitly still absent:** any create/edit/submit/cancel/amend/cost-recompute action for BOM;
  any Operation/Routing/Workstation entity screen; any Production Plan screen; any change to the
  Work Order create BOM `<select>` (still a plain selector, not replaced with navigation) or to
  Material Transfer's own transfer logic.
- **What this does and does not resolve:** this is a display-only capability change. It does not
  independently verify any of `MFG-UNV-009`'s open behavioral questions (lifecycle transitions,
  multi-level explosion, costing recompute trigger, phantom/semi-finished behavior, Production
  Plan's runtime relationship) — those remain `NEEDS_VERIFICATION` exactly as before.
