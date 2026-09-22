# BOM (Bill of Materials) — Backend Knowledge Baseline

Domain status: `INVESTIGATED, READ-ONLY + DRAFT-MUTABLE + SUBMIT + SUBMITTED-AVAILABILITY-MUTABLE
FRONTEND IMPLEMENTED` — see `docs/backend/15-migration/migration-status.md`. Written during the
Master Data Manufacturing Masters (BOM) investigation package, 2026-09-19, which concluded **Gate B
— no usable BOM frontend existed at that time to canonicalize** (see `PROGRESS.md`/`docs/operations/
AI_WORK_LOG.md` for the full handoff). The Manufacturing Masters — BOM Package 4A (also 2026-09-19,
immediately following Codex's acceptance of this investigation) then built the first canonical,
**read-only** BOM entity frontend: `/master-data/boms` (list) and `/master-data/boms/[name]`
(detail). Package 4B (also 2026-09-19) added **BOM create and Draft-only edit** on top of that; a
same-day remediation (`CX-MFG-BOM-4B-001`/`002`) then added a narrow **submitted-BOM
Active/Inactive + Default availability action**, on top of Draft structural edit, and made the
Draft edit form opt-in behind an explicit "Edit BOM" action instead of automatic. `MFG-CLOSE-0c`
(2026-09-22) then added **BOM Submit** — see "Frontend capability", "Mutation contract",
"Submitted-BOM availability contract", and the new "Submit contract" below for what changed.
This document's field/schema/lifecycle/costing knowledge is otherwise unchanged by these packages;
no Cancel/Amend/cost-recompute action exists anywhere, and none of `MFG-UNV-009`'s open
behavioral questions (multi-level explosion, costing recompute trigger, phantom/semi-finished
transaction behavior, Production Plan runtime relationship) were resolved — this frontend only
covers Draft-stage create/edit, Submit, plus submitted-stage availability/default, not the full
submitted-document lifecycle (Cancel/Amend remain unbuilt).

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

The installed-instance sample is not evidence of one-to-one cardinality. ERPNext's upstream BOM
controller (reviewed 2026-09-19) explicitly generates a versioned document name by finding
existing BOMs for the same item and incrementing the three-digit suffix. The canonical
relationship is therefore **Item 1 -> many BOM documents**. Each BOM has its own document identity
(`BOM-<ITEM>-<NNN>` by the standard controller), while `BOM.item` is a non-unique Link to the
finished Item. Cancelled and submitted names participate in version-index calculation, so an old
BOM is not overwritten when another BOM is created for the same Item.

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

ERPNext's standard `BOM.autoname()` finds existing non-amended BOM names for the Item and assigns
`BOM-<ITEM>-<NNN>` using the next version index. This verifies document identity and Item-to-BOM
one-to-many cardinality. A naming-dependent customization should still account for site-level
naming customization rather than hard-code the standard format.

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
amend-pattern field). The one real BOM is `docstatus: 1` (submitted). Draft → Submit is now built
and live-verified (`MFG-CLOSE-0c`, 2026-09-22, see "Submit contract" below); Cancel → Amend remain
unbuilt and were not exercised through live writes. The verified exception is that ERPNext permits
the availability fields described below to change after submit.

### Verified lifecycle and availability rules (2026-09-19 Codex review)

`docstatus` and BOM availability are separate state axes:

- `docstatus` is Draft (0), Submitted (1), or Cancelled (2). Normal structural BOM fields are not
  editable after submission.
- `is_active` and `is_default` are both marked `allow_on_submit: 1` in ERPNext's BOM DocType, so
  these two fields can legitimately be maintained on a submitted BOM without cancellation/amend.
- `on_update_after_submit()` validates BOM links and calls `manage_default_bom()`.
- Multiple active submitted BOMs may exist for one Item. Only one is kept as default:
  `manage_default_bom()` delegates to Frappe's default-management helper, which unsets the
  competing default for that Item and synchronizes `Item.default_bom`. If an active submitted BOM
  is the only default candidate, ERPNext promotes it to default. If a BOM is inactive, the same
  routine unsets its default flag and clears `Item.default_bom` when it points to that BOM.
- A Draft can carry the checkbox value, but default management is invoked on submit and on an
  allowed update after submit; a Draft is not an eligible Work Order default/selection because
  ERPNext's BOM query filters to `docstatus = 1` and `is_active = 1`.
- Cancellation explicitly sets both `is_active` and `is_default` to 0. A cancelled BOM is retained
  as a historical document and is not an active Work Order choice.

These rules were verified by reading ERPNext's upstream `bom.json`, `bom.py`, and BOM query source;
no live write/transition was performed. The effect on already-submitted historical Work Orders and
Job Cards remains `NEEDS_VERIFICATION`, although the frontend uses BOM document names as references
and contains no delete/overwrite path.

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
- **Explicitly still absent (Package 4A):** any create/edit/submit/cancel/amend/cost-recompute
  action for BOM; any Operation/Routing/Workstation entity screen; any Production Plan screen; any
  change to the Work Order create BOM `<select>` (still a plain selector, not replaced with
  navigation) or to Material Transfer's own transfer logic.
- **What this does and does not resolve:** this is a display-only capability change. It does not
  independently verify any of `MFG-UNV-009`'s open behavioral questions (lifecycle transitions,
  multi-level explosion, costing recompute trigger, phantom/semi-finished behavior, Production
  Plan's runtime relationship) — those remain `NEEDS_VERIFICATION` exactly as before.

## Mutation contract (Package 4B, 2026-09-19)

`/master-data/boms/new` (create) and `/master-data/boms/[name]` (Draft-only edit, inline on the
detail page when `docstatus === 0`) — see `apps/frontend/src/app/(app)/master-data/boms/actions.ts`.

- **Create payload:** a single `createDoc("BOM", fields)` call. `fields` carries every header
  field this document already lists under Identity/Status-configuration above
  (`item`, `item_name`, `company`, `quantity`, `uom`, `currency`, `conversion_rate`,
  `with_operations`, `is_active`, `is_default`, `allow_alternative_item`, `is_phantom_bom`,
  `track_semi_finished_goods`, `inspection_required`, `routing`, `transfer_material_against`,
  `default_source_warehouse`, `default_target_warehouse`) plus `items`/`operations` child-table
  arrays built client-side (`BomComponentsEditor`/`BomOperationsEditor`) and parsed server-side
  (`lib/bomRows.ts`). No costing field (`raw_material_cost`/`operating_cost`/`total_cost`/etc.) is
  ever sent — ERPNext computes those itself on insert, matching this app's backend-authoritative
  costing rule established in Package 4A.
- **BOM Item fields sent:** `item_code`, `item_name`, `qty`, `uom`, `rate`, `source_warehouse`,
  `operation`, `bom_no`, `allow_alternative_item`. Not sent (left for ERPNext to compute):
  `stock_qty`, `stock_uom`, `conversion_factor`, `base_rate`, `amount`, `base_amount`,
  `is_stock_item`, `is_sub_assembly_item`, `is_phantom_item`. `uom` is always the component item's
  own `stock_uom` (no separate purchase/stock UOM concept exposed) — same single-UOM
  simplification `buying/purchase-orders/actions.ts` already uses for Purchase Order Item.
- **BOM Operation fields sent:** `operation`, `workstation`, `time_in_mins`, `batch_size`,
  `hour_rate`, `description`. Not sent: `base_hour_rate`, `cost_per_unit`, `base_cost_per_unit`,
  `operating_cost`, `base_operating_cost`, `sequence_id`, `fixed_time`, `is_subcontracted`,
  `finished_good`/`finished_good_qty`/`bom_no` (per-operation semi-finished routing, out of this
  package's scope), `quality_inspection_required`, `skip_material_transfer`,
  `backflush_from_wip_warehouse`, `source_warehouse`/`wip_warehouse`/`fg_warehouse`. `hour_rate`
  here is the BOM's own transaction-currency field (not `base_hour_rate`) — this is the BOM being
  authored directly in its own currency, unlike `work-orders/actions.ts`'s BOM→Work-Order-Operation
  copy, which has a documented reason (`CX-MFG-002`) to prefer `base_hour_rate` instead.
- **Update payload:** identical field set via `updateDoc("BOM", name, fields)` — a full
  header+child-table overwrite, not a partial patch of only changed fields. `docstatus` is never
  included in either payload; `updateBomAction` re-fetches the BOM's current `docstatus` and
  refuses to call `updateDoc` at all unless it's `0` (Draft) — a frontend-side safety check, not a
  substitute for ERPNext's own server-side enforcement, which was **not independently live-tested
  this session** (see `NEEDS_VERIFICATION` below).
- **Not implemented, and deliberately so:** Cancel, Amend, "Update Cost". Submit is now built (see
  "Submit contract" below). A submitted or cancelled BOM (`docstatus` 1 or 2) falls straight through
  to Package 4A's existing read-only view — this app has no path back into edit mode for it at all
  right now, by design.
- **`NEEDS_VERIFICATION` — no live write-testing was possible this session** (no working ERPNext
  frontend login credentials existed; MCP tools are read-only). Specifically unconfirmed against
  the real server:
  1. Whether ERPNext actually rejects an `updateDoc` call against a non-Draft BOM the way this
     app's own `updateBomAction` guard assumes (Frappe's generic core convention says yes — a
     submitted document is immutable except via amend — consistent with how this app already
     treats every other submittable doctype (Purchase Order, Sales Order, Work Order), but BOM's
     own controller (`erpnext/manufacturing/doctype/bom/bom.py`) was not read this session, so a
     BOM-specific override can't be ruled out from static reading alone).
  2. Whether a `BOM Item` row with `rate: 0` (e.g. a component Item with no `standard_rate`
     configured) is actually accepted despite `rate` being schema-marked `reqd: true` — Frappe's
     generic mandatory-field check does not treat a numeric `0` as "missing" (confirmed by reading
     Frappe's own `Document._get_missing_mandatory_fields` logic, which checks for `None`/`[]`/an
     empty string, not falsy-zero), but whether BOM's own controller adds a stricter check on top
     of the generic one was not confirmed against the real server.
  3. The actual create → Draft → edit → re-save round trip end-to-end.
  4. Whether ERPNext independently accepts a `currency` value coming from this form's
     unfiltered `fetchLinkOptions("Currency")` list even when that currency isn't in the site's
     "enabled currencies" configuration — a pre-existing pattern already shared by Price Lists and
     the RFQ→Supplier-Quotation currency selector, not newly introduced here, so not blocking.
  **How to verify:** once real login credentials exist for this frontend, create a Draft BOM with
  at least one zero-rate component, save it, submit it via Desk (not this app — no Submit action
  exists here), then attempt an edit through this app's own UI and confirm it's correctly refused.

## Submitted-BOM availability contract (Package 4B remediation, 2026-09-19)

Added in direct response to `CX-MFG-BOM-4B-001`/`002` (Codex independent review): the mutation
contract above only ever covered a **Draft** BOM. It said nothing about a submitted one, which
this project's own `bom.py`/`bom.json` source read (see "Verified lifecycle and availability
rules" above) confirms is not fully immutable — `is_active`/`is_default` are `allow_on_submit`.

- **Routes/actions:** `/master-data/boms/[name]` now opens in view mode for every `docstatus`,
  including Draft — a Draft's structural edit form only appears at `?edit=1`, reached via an
  explicit "Edit BOM" button, not automatically. A submitted BOM (`docstatus === 1`) gets its own
  action row instead: "Activate BOM"/"Deactivate BOM" (`activateBomAction`/`deactivateBomAction`)
  and, only when Active and not already Default, "Set as Default" (`setDefaultBomAction`) — all
  three in `master-data/boms/actions.ts`.
- **Payload, deliberately narrow:** each action sends exactly one field —
  `{ is_active: 1 }` / `{ is_active: 0 }` / `{ is_default: 1 }` — as a literal object this module
  constructs itself, never built from `formData`. `is_default` is only ever sent as `1`, never `0`;
  this app does not compute or send "unset the previous default" itself, relying on ERPNext's own
  `manage_default_bom()` to do that server-side (see CLAUDE remediation §8's explicit instruction
  not to guess that state client-side).
- **Server-side guard (`setBomAvailability`):** re-fetches the BOM (`docstatus`, `is_active`) from
  ERPNext itself before every mutation — never trusts the page/button that triggered the call.
  Rejects with an error unless `docstatus === 1`; additionally rejects a `Set as Default` call
  unless the BOM is currently Active (defense-in-depth for the same "inactive BOM must never look
  like the effective default" rule the UI already enforces by only showing the button when Active).
  After a successful mutation, redirects to the same detail route (`?saved=1`), forcing a fresh
  `getDoc` read rather than assuming the resulting state — same "backend is authoritative, then
  re-fetch" pattern this contract's own Update payload section already established for Draft edits.
- **Not implemented by this remediation:** Submit, Cancel, Amend, any structural field change on a
  submitted BOM (item, quantity, currency, components, operations, warehouses, routing — all of
  those remain Draft-only via `updateBomAction`/`BomForm`), BOM explosion, Operation/Workstation/
  Routing masters, Production Plan, Batch/Serial changes, new costing logic, or any Work Order
  lifecycle change. `bomStatus()`/the BOM list (`BomsTable.tsx`) were not changed — both already
  exposed BOM/Item/status/Active/Default columns before this remediation.
- **`NEEDS_VERIFICATION` — no live write-testing was possible this session either** (same
  credential gap as the rest of this contract): whether `activateBomAction`/`deactivateBomAction`/
  `setDefaultBomAction` actually succeed against the real server; whether `manage_default_bom()`
  behaves exactly as the source suggests (clearing the previous default, syncing `Item.default_bom`)
  when exercised live; the actual runtime effect on existing Work Orders/Job Cards of deactivating a
  BOM they reference (Work Order's own BOM selection query filters to `docstatus = 1 AND
  is_active = 1`, source-confirmed, but nothing was observed for an *already-referencing* Work
  Order). See `docs/backend/99-unverified/unverified-behaviours.md`'s `MFG-UNV-009`/`MFG-UNV-011`
  for the canonical tracking entries.

## Submit contract (`MFG-CLOSE-0c`, 2026-09-22)

Closes the direct-Work-Order production-readiness gap identified by this same package's own
BOM-eligibility investigation (see `docs/operations/AI_WORK_LOG.md`'s 2026-09-22 "MFG-CLOSE-0a/0b"
entry): a Draft BOM created through this app could previously never be used to create a Work Order
directly (`WorkOrder.validate()` → `validate_bom_no()` hard-rejects a non-Submitted BOM), and this
app had no way to submit one without ERPNext Desk.

- **Route/action:** `/master-data/boms/[name]`'s header now shows a "Submit BOM" button
  (`DocActionBar`, `submitBomAction` in `master-data/boms/actions.ts`) alongside "Edit BOM" whenever
  `docstatus === 0`. No new route.
- **Mechanism:** `submitDoc("BOM", name)` — the same generic `docstatus 0 → 1` REST mechanism already
  used for Sales Order/Purchase Order/Work Order/Production Plan (`lib/erpnext.ts`). Runs `BOM.validate()`/
  `BOM.on_submit()` server-side; nothing here re-implements or pre-validates that logic.
- **Server-side guard:** re-fetches the BOM and rejects with "Only a Draft BOM can be submitted."
  unless `docstatus === 0`, before calling `submitDoc` — the same re-fetch-before-write pattern
  `updateBomAction`/`setBomAvailability` already established in this file, added here specifically to
  handle a BOM submitted by another session between page render and this action running (this
  package's own explicit stale-state requirement).
- **Live-verified end to end** (`MFG-CLOSE-0c`, disposable Item/BOM fixture, created/tested/cleaned
  up in one non-committed transaction, independently re-confirmed absent afterward — no `ignore_validate`
  or other bypass flag used anywhere in this test):
  1. BOM created Draft (`docstatus: 0`, `is_default: 0`, matching `BomForm`'s real default checkbox
     state) via the exact `buildBomFields()` payload shape.
  2. Submitted via the same `submitDoc`/`.submit()` mechanism `submitBomAction` uses →
     `docstatus: 1`.
  3. **Native side effect confirmed live, not just source-derived:** `manage_default_bom()` (called
     from `BOM.on_submit()`) automatically set `is_default: 1` on this BOM and
     `Item.default_bom` from `null` to this BOM's name — with no "Is Default" checkbox ever set by
     this test. This is ERPNext's own native first-submitted-BOM-for-an-item behavior
     (`bom.py`'s `manage_default_bom()`: if no other submitted default already exists for the item,
     the newly-submitted one becomes it), not something this action requests, controls, or should
     try to suppress — a second BOM submitted for the same item does not get this treatment (source-
     confirmed, not separately re-tested).
  4. **Direct Work Order creation against the newly-submitted BOM succeeded** with zero bypass
     flags (`WorkOrder.validate()` → `validate_bom_no()` passed normally) — the actual business
     acceptance criterion this package exists to satisfy.
  5. **Production Plan regression confirmed**: the same submitted BOM also worked correctly through
     `ProductionPlan.create_work_order()` (the real native "Make Work Order" mechanism, which — per
     this same investigation's earlier finding — always bypasses `validate_bom_no()` via
     `ignore_validate` regardless of BOM docstatus; this step confirms the submitted-BOM path
     specifically still behaves as expected, not that the bypass was removed or should be).
- **Not implemented by this package, and deliberately so:** Cancel, Amend, any structural change to
  a submitted BOM (unchanged from the Mutation/Availability contracts above). No change to
  `bomStatus()` — Draft/Submitted/Cancelled were already generic docstatus-derived labels, unaffected
  by adding a new transition between two already-modeled states.
