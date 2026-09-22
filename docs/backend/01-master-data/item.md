# Item, Item Group, UOM — Canonical Entity Documentation

**Domain:** Master Data — Products & Pricing.
**Status:** `DOCUMENTED` (this package, MD-R2, 2026-09-22).
**Frontend routes:** `/master-data/items` (list/detail/create — Item), `/master-data/item-groups`
(list/detail/create — Item Group). UOM has **no dedicated route** — consumed only as a Link-field
option source.

## Source of truth for this baseline

- **Live schema**: `mcp__ceylon-stack__get_doctype_fields("Item" | "Item Group" | "UOM")` against
  the live Hetzner ERPNext instance, 2026-09-22. Tagged `VERIFIED` below.
- **Frontend code**: direct reads of `apps/frontend/src/app/(app)/master-data/{items,item-groups}/`
  and `apps/frontend/src/components/{ItemForm.tsx,MasterForm.tsx}`. Tagged `CODE-INFERRED` below,
  cited file:line.
- **Doctype-level metadata gap** (applies to every doctype in this package, not just these three):
  `get_doctype_fields` returns the field list only — it does not expose doctype-level properties
  such as `autoname`, `is_submittable`, or `is_tree`. Where those properties matter, this document
  states what was actually confirmed (field-list evidence) versus what is standard Frappe
  convention not independently re-verified this session. See `MD-UNV-001`/`MD-UNV-002`.

---

## 1. Item

### Identity / naming
- `item_code` (Data, **required**, `VERIFIED` live schema) is the field the frontend treats as the
  permanent identity — `ItemForm.tsx` disables the `item_code` input on edit (`CODE-INFERRED`,
  `apps/frontend/src/components/ItemForm.tsx:48`), and `updateItemAction` never sends `item_code`
  on update (`CODE-INFERRED`, `apps/frontend/src/app/(app)/master-data/items/actions.ts:54-88`).
- A `naming_series` field also exists in the live schema (option string `STO-ITEM-.YYYY.-`), but
  the frontend never sets it and doesn't expose it as a form field.
- **Whether Frappe's `autoname` property is literally `field:item_code` (not merely
  frontend-assumed) is `NEEDS_VERIFICATION` — see `MD-UNV-001`.**

### Important fields (live schema, `VERIFIED`) vs. frontend-exposed (`CODE-INFERRED`)

| fieldname | label | fieldtype | required (schema) | Link target | Exposed in `ItemForm.tsx`? |
|---|---|---|---|---|---|
| item_code | Item Code | Data | **yes** | — | yes (disabled on edit) |
| item_name | Item Name | Data | no | — | yes |
| item_group | Item Group | Link | **yes** | Item Group | yes |
| stock_uom | Default UOM | Link | **yes** | UOM | yes |
| standard_rate | Standard Selling Rate | Currency | no | — | yes |
| description | Description | Text Editor | no | — | yes |
| is_stock_item | Maintain Stock | Check | no | — | yes (defaults true on create) |
| disabled | Disabled | Check | no | — | yes (edit only) |
| has_batch_no / has_serial_no / has_expiry_date | tracking flags | Check | no | — | yes |
| batch_number_series / serial_no_series | naming series | Data | no | — | yes (conditional on flags) |
| brand | Brand | Link | no | Brand | **no** — `NEEDS_VERIFICATION` whether Brand is used anywhere else in this instance (carried from `docs/master-data-architecture.md` §10 item 4) |
| image | Image | Attach Image | no | — | no |
| is_fixed_asset / asset_category | fixed-asset fields | Check/Link | no | Asset Category | no |
| is_sales_item / is_purchase_item | Allow Sales/Purchase | Check | no | — | no |
| has_variants / variant_of | variant fields | Check/Link | no | Item (self) | no |
| opening_stock | Opening Stock | Float | no | — | no |
| valuation_method | Valuation Method | Select | no | FIFO/Moving Average/LIFO | no |
| weight_uom | Weight UOM | Link | no | UOM | no |
| country_of_origin / customs_tariff_number | trade fields | Link | no | Country / Customs Tariff Number | no |
| sales_uom / purchase_uom | Default Sales/Purchase UOM | Link | no | UOM | no |
| quality_inspection_template | Quality Inspection Template | Link | no | Quality Inspection Template | no |
| default_bom | Default BOM | Link | no | BOM | no — read via `getBomDetails`/BOM lookup on Work Order create, not on Item's own form |

`Item` has 140+ live fields across 10 Desk tabs (Details/Accounting/UOM/Tax/Inventory/Variants/
Purchasing/Sales/Manufacturing/Quality/Pricing/Connections) — `VERIFIED`. `ItemForm.tsx` exposes
roughly 14 of them; the code comment at `ItemForm.tsx:113-119` explicitly names `create_new_batch`
and `shelf_life_in_days` as "out of scope for this pass" — `CODE-INFERRED`, not accidental.

### Required fields (schema, `VERIFIED`)
`item_code`, `item_group`, `stock_uom`. Enforced again client/server-action side before the
`createDoc` call (`CODE-INFERRED`, `apps/frontend/src/app/(app)/master-data/items/actions.ts:23-25`).

### Link fields (`VERIFIED` live schema)
`item_group → Item Group` (required), `stock_uom → UOM` (required), `sales_uom`/`purchase_uom` →
`UOM`, `weight_uom → UOM`, `brand → Brand`, `variant_of → Item` (self), `asset_category → Asset
Category`, `country_of_origin → Country`, `customs_tariff_number → Customs Tariff Number`,
`quality_inspection_template → Quality Inspection Template`, `default_bom → BOM`.

### Child tables (`VERIFIED` live schema — none read/written by this frontend, `CODE-INFERRED`)
`item_defaults` (Item Default), `uoms` (UOM Conversion Detail), `taxes` (Item Tax), `barcodes`
(Item Barcode), `reorder_levels` (Item Reorder), `supplier_items` (Item Supplier), `customer_items`
(Item Customer Detail), `attributes` (Item Variant Attribute). None of these appear in
`ItemForm.tsx` or `items/actions.ts` — confirmed by the same file reads that built the field table
above.

### Lifecycle / docstatus
No `docstatus`/`amended_from` field anywhere in the 140+-field live schema — `VERIFIED` absent.
Item is Create/Save only in ERPNext terms; this frontend offers Create/Update, never Delete
(`deleteDoc` not called anywhere in `items/actions.ts` or `items/page.tsx` — `CODE-INFERRED`,
confirmed by grep across the whole `master-data` folder finding no `deleteDoc` usage at all).

### Create/update/delete restrictions
- Create: `item_code`/`item_group`/`stock_uom` required; `item_name` falls back to `item_code` if
  left blank (`CODE-INFERRED`, `items/actions.ts:33`).
- Update: `item_code` never sent (immutable post-create in this frontend's model); `disabled` only
  editable on update, not create (`CODE-INFERRED`, `items/actions.ts:54-88,72`).
- Delete: not exposed anywhere in this frontend for Item.

### `allow_on_submit`
Not applicable — Item is not a submittable doctype.

### Cross-document dependencies
Referenced by line items across every transactional module (Sales Order Item, Purchase Order
Item, Stock Entry Detail, BOM Item, Work Order Item, etc.) — `item_code` is the join key
everywhere. Not independently re-enumerated here; see each domain's own backend doc (e.g.
`docs/backend/05-manufacturing/work-order.md`) for the transaction-side field mapping.

### Stock / accounting / manufacturing implications
- **Stock:** `is_stock_item`, `has_batch_no`/`has_serial_no`/`has_expiry_date`, `valuation_method`
  govern Stock Ledger behavior — `FRAPPE_CURRENT_BEHAVIOR`, not re-derived here (see
  `docs/backend/04-inventory/` once that domain gets its own baseline — does not exist yet).
- **Accounting:** Item Default child table (not exposed in this frontend) carries per-Company
  income/expense account defaults in standard ERPNext — `DOCUMENTATION-INFERRED`, not confirmed
  against this instance's actual `Item Default` records this session.
- **Manufacturing:** `default_bom` links an Item to its BOM; Work Order Create restricts item
  selection to items with `default_bom` set (`CODE-INFERRED`, `FRONTEND_GUIDE.md:314`, already
  documented in `docs/backend/05-manufacturing/work-order.md`).

### Frontend route
`/master-data/items` (list), `/master-data/items/[name]` (detail/edit), `/master-data/items/new`
(create). `CODE-INFERRED`.

### Frontend → canonical → Frappe mapping (fields this frontend actually uses)

| Frontend field (`ItemForm.tsx`) | Canonical entity.field | Frappe `Item`.field |
|---|---|---|
| Item Code | `item.item_code` | `item_code` |
| Item Name | `item.item_name` | `item_name` |
| Item Group | `item.item_group_id` | `item_group` (Link) |
| Stock UOM | `item.stock_uom_id` | `stock_uom` (Link) |
| Standard Rate | `item.standard_rate` | `standard_rate` |
| Maintain Stock | `item.is_stock_item` | `is_stock_item` |
| Disabled | `item.disabled` | `disabled` |
| Has Batch/Serial/Expiry No | `item.has_batch_no` / `has_serial_no` / `has_expiry_date` | same |

### Current API / actions used (`CODE-INFERRED`)
- `createItemAction` → `createDoc<{name:string}>("Item", {...})` (`items/actions.ts:31`).
- `updateItemAction` → `updateDoc("Item", name, {...})` (`items/actions.ts:67`).
- List → `listDocs<ItemRow>("Item", {fields:[...9 fields...], limit, start, orderBy:"modified desc"})`
  + `getCount("Item")` (`items/page.tsx:18-33`).
- Detail → `getDoc<ItemDoc>("Item", name)` (`items/[name]/page.tsx:29`).
- No `submitDoc`/`cancelDoc`/`deleteDoc` calls anywhere for Item.

### Backend hooks/methods relied upon
None beyond ERPNext's standard REST create/read/update for this doctype — no whitelisted custom
method call found for Item in this frontend. `NEEDS_VERIFICATION` whether ERPNext's own
`item.py` controller validations (e.g. `item_code` uniqueness, UOM conversion consistency) are
triggered identically via the plain REST path this frontend uses versus Desk's own save path —
not independently tested this session.

### Migration considerations (future Ceylon Stack native backend)
- `item_code` as both business key and Frappe `name` is `FRAPPE_CURRENT_BEHAVIOR`
  (autoname-from-field). A native backend should decide explicitly whether the permanent identity
  is a surrogate ID with `item_code` as a mutable/unique business key, or whether `item_code`
  itself stays immutable — this is exactly the open question in `docs/master-data-architecture.md`
  §10 item 2 (Item rename behavior), not resolved by this documentation pass.
  `REQUIRED_CEYLON_BEHAVIOR` still undecided.
- The ~126 live fields this frontend does not expose are `FRAPPE_REFERENCE` only — do not assume
  they're needed for a native backend's v1 Item model; scope them when/if a frontend package
  actually exposes them.
- `item_defaults`/`uoms`/`taxes`/`barcodes`/`reorder_levels`/`supplier_items`/`customer_items`/
  `attributes` child tables are `FRAPPE_CURRENT_BEHAVIOR`, unused by this frontend — do not port
  them speculatively.

---

## 2. Item Group

### Identity / naming
`item_group_name` (Data, **required**, `VERIFIED`). `lft`/`rgt`/`old_parent` fields present in the
live schema confirm Item Group is a Frappe **Tree** doctype (nested-set model) — `VERIFIED`.
Autoname mechanism itself (`field:item_group_name` vs. something else) is `NEEDS_VERIFICATION`
(`MD-UNV-001`) — same doctype-metadata gap as Item.

### Important / required / link fields (`VERIFIED` live schema)
13 fields total. `item_group_name` (required), `parent_item_group` (Link → Item Group, self,
optional), `is_group` (Check), `image` (Attach Image), `item_group_defaults` (Table → Item
Default), `taxes` (Table → Item Tax), `lft`/`rgt`/`old_parent` (tree internals).

### Child tables
`item_group_defaults`, `taxes` — neither read/written by this frontend (`CODE-INFERRED`, absent
from `MasterForm` field spec below).

### Lifecycle / docstatus
No `docstatus` field — `VERIFIED` absent, not submittable.

### Create/update/delete restrictions
Create/Update only via generic `MasterForm`; no delete wired (`CODE-INFERRED`,
`item-groups/actions.ts`, `item-groups/page.tsx` — no `deleteDoc` call).

### `allow_on_submit`
Not applicable — not submittable.

### Frontend route
`/master-data/item-groups` (list/detail/create). `CODE-INFERRED`.

### Frontend → canonical → Frappe mapping
Exactly 3 fields exposed via `MasterForm`'s `FieldSpec[]` (`item-groups/new/page.tsx:8-12`,
`item-groups/[name]/page.tsx:27-31`, identical in both): `item_group_name` (text, required),
`parent_item_group` (link dropdown via `fetchLinkOptions("Item Group")`), `is_group` (checkbox).
`image`, `item_group_defaults`, `taxes` are live-schema fields **not** exposed anywhere in this
frontend.

### Current API / actions used
`createItemGroupAction`/`updateItemGroupAction` → `createDoc`/`updateDoc("Item Group", ...)` via
the shared `fieldsFromFormData` helper (`apps/frontend/src/lib/masterActions.ts:23-40`,
`item-groups/actions.ts:13-46`). List → `listDocs("Item Group", {fields:["name",
"parent_item_group","is_group"], orderBy:"name asc"})` + `getCount`.

### Backend hooks/methods, cross-document dependencies, stock/accounting/manufacturing implications
Item Group is a pure classification/hierarchy master referenced by `Item.item_group` and by
Sales/Item pricing rules in standard ERPNext (`DOCUMENTATION-INFERRED`, not independently
re-verified this session). No dedicated hook/whitelisted-method usage found in this frontend.

### Migration considerations
Tree structure (`lft`/`rgt`) is a `FRAPPE_ONLY_IMPLEMENTATION_DETAIL` for nested-set queries — a
native backend can model the same hierarchy with an adjacency list or a different tree encoding;
`REQUIRED_CEYLON_BEHAVIOR` is "Item Group is hierarchical," not "uses nested-set integers."
`is_group` (leaf vs. branch) is the actual product-required semantic to preserve.

---

## 3. UOM

### Identity / naming
`uom_name` (Data, **required**, `VERIFIED`) — the only required field. 8 live fields total: `uom_name`,
`symbol`, `common_code`, `description`, `category` (Link → UOM Category), `enabled` (Check),
`must_be_whole_number` (Check). No child tables, no tree fields (flat doctype, unlike Item
Group/Warehouse) — `VERIFIED`.

### Lifecycle / docstatus
No `docstatus` — `VERIFIED` absent, not submittable.

### Frontend route
**None.** Confirmed by directory search under `apps/frontend/src/app/(app)/master-data/` — no
`uom`/`uoms` folder exists (`CODE-INFERRED`).

### Create/update/delete restrictions
No create/update/delete path exists in this frontend for UOM at all — it is read-only reference
data, consumed exclusively as Link-field options.

### Current API / actions used
`fetchLinkOptions("UOM")` → `listDocs("UOM", {fields:["name"], limit:500, orderBy:"name asc"})`
(`apps/frontend/src/lib/linkOptions.ts:9-16`), called from exactly two places
(`items/[name]/page.tsx:35`, `items/new/page.tsx:6`) to populate `ItemForm.tsx`'s `stock_uom`
dropdown. No other UOM usage found anywhere else under `master-data/`.

### Cross-document dependencies / stock / accounting / manufacturing implications
UOM underpins unit-conversion logic across Item, Stock Entry, Sales/Purchase line items in
standard ERPNext (`DOCUMENTATION-INFERRED`) — this frontend does not build or expose any of that
conversion logic; it only lets a user pick a UOM name for `Item.stock_uom`.

### Migration considerations
UOM is the simplest master in this package — a flat reference list. Low migration risk/complexity;
candidate for early native-backend migration per `ADR-004`'s "Master Data first" ordering, but no
frontend CRUD exists to migrate yet, only a read dependency from Item.

---

## NEEDS_VERIFICATION — this document's contribution to the register

See `docs/backend/99-unverified/unverified-behaviours.md` `MD-UNV-001` and `MD-UNV-002` (shared
across all Master Data doctypes in this package, not duplicated per-doctype here).
