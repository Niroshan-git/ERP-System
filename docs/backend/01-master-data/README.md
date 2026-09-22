# Master Data — Domain Overview

**Status:** `DOCUMENTED` (baseline complete, package MD-R2, 2026-09-22).
**Scope:** the 9 priority DocTypes named in this package's brief, plus a cross-reference for BOM
(already documented elsewhere — see below). Supplier Group, Operation, Workstation, Company, Cost
Center, Project, and UOM-as-its-own-screen are **not** covered — none has a dedicated frontend
screen yet; see `docs/master-data-architecture.md` §9 for their status.

This is the first population of this folder — it was named/reserved by
`docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §4 and referenced by
`docs/backend/15-migration/migration-status.md` since 2026-09-17, but stayed empty until this
package, per the policy's own "grows with real implementation, not ahead of it" rule (§4) — three
Master Data domain packages had already shipped and been independently accepted before this
documentation debt was closed.

## Files in this folder

| File | Covers | Status |
|---|---|---|
| [`item.md`](item.md) | Item, Item Group, UOM | `DOCUMENTED` |
| [`customer-supplier.md`](customer-supplier.md) | Customer, Supplier | `DOCUMENTED` |
| [`secondary-masters.md`](secondary-masters.md) | Contact, Address, Territory | `DOCUMENTED` |
| [`warehouse.md`](warehouse.md) | Warehouse | `DOCUMENTED` |
| [`bom.md`](bom.md) | BOM — **cross-reference only**, canonical doc stays at `docs/backend/05-manufacturing/bom.md` | `DOCUMENTED` (pointer) |

## Method

Every doctype in this baseline was verified two ways, both live against the real Hetzner ERPNext
instance via the `ceylon-stack` MCP server, not assumed from general Frappe knowledge:

1. **Live schema** — `mcp__ceylon-stack__get_doctype_fields(doctype)` for the full declared field
   list (fieldname/label/fieldtype/required/Link target). Tagged `VERIFIED` throughout.
2. **Live sample data** — `mcp__ceylon-stack__list_documents(doctype, fields=[...], limit=5)` to
   confirm actual naming behavior empirically, not just from schema shape. This directly resolved
   naming for 7 of 9 doctypes (Item, Item Group, UOM, Customer, Supplier, Territory, Warehouse all
   confirmed to name themselves from their own human-readable field, not a generic series — even
   though a `naming_series` field is *also* present in the schema for Item/Customer/Supplier).
   Contact and Address naming could not be fully confirmed this way — Address has zero live records
   on this instance, and Contact's two live records didn't exercise a naming collision. See
   `MD-UNV-001`/`MD-UNV-005`.

Frontend code (`apps/frontend/src/app/(app)/master-data/`, relevant `components/`, `lib/`) was read
directly for every route, action, and form component claim — cited file:line throughout, tagged
`CODE-INFERRED`.

One doctype-level limitation applies across the whole baseline: `get_doctype_fields` returns a
doctype's declared fields only, not framework metadata (`autoname` string, `is_submittable`,
`is_tree`). Submittability was inferred from the absence of a `docstatus` field (a reasonable but
indirect proxy) — see `MD-UNV-002`. This is disclosed per-doctype in each document rather than
silently upgraded to `VERIFIED`.

## Master Data ownership matrix (summary — see each document for full detail)

| Entity | Frappe DocType | Frontend route | Submittable | Naming | Review status |
|---|---|---|---|---|---|
| Item | `Item` | `/master-data/items` | No (`VERIFIED` absent) | `name == item_code` (`VERIFIED` live) | ACCEPTED |
| Item Group | `Item Group` | `/master-data/item-groups` | No | `name == item_group_name` (`VERIFIED` live) | ACCEPTED |
| UOM | `UOM` | *(none — dropdown only)* | No | `name == uom_name` (`VERIFIED` live) | N/A, no screen |
| Warehouse | `Warehouse` | `/master-data/warehouses` | No | `{warehouse_name} - {company abbr}` (`VERIFIED` live) | ACCEPTED |
| Customer | `Customer` | `/master-data/customers` | No | `name == customer_name` (`VERIFIED` live) | ACCEPTED |
| Supplier | `Supplier` | `/master-data/suppliers` | No | `name == supplier_name` (`VERIFIED` live) | ACCEPTED |
| Contact | `Contact` | `/master-data/contacts` | No | first-name-derived (`VERIFIED` base pattern, collision suffix `NEEDS_VERIFICATION`) | ACCEPTED |
| Address | `Address` | `/master-data/addresses` | No | `NEEDS_VERIFICATION` (zero live records) | ACCEPTED |
| Territory | `Territory` | `/master-data/territories` | No | `name == territory_name` (`VERIFIED` live) | ACCEPTED |
| BOM | `BOM` | `/master-data/boms` | **Yes** (documented in `05-manufacturing/bom.md`) | `NEEDS_VERIFICATION` (see that document) | **`ACCEPTED` (2026-09-22)** — Pkg 4A never reviewed; Pkg 4B reviewed once (`CHANGES REQUIRED`, 2 of 3 findings fixed); `MD-R1` reviewed fresh, `CHANGES REQUIRED`, remediated (`23886ac`), then accepted by a separate-account/session governance confirmation |

"Review status" reflects `docs/operations/AI_WORK_LOG.md`/`docs/controls/TEMP_DUAL_CLAUDE_MODE.md`
as of 2026-09-22, reconciled in `docs/master-data-architecture.md`. Documenting a doctype here does
not by itself change its review status — that only changes via the independent-review process
recorded in those two files (as it did for BOM, `2026-09-22`, above).

## Key architectural findings from this baseline

1. **All Master Data entities in this frontend are single-sourced** — no duplication found across
   Item, Item Group, UOM, Warehouse, Customer, Supplier, Contact, Address, or Territory. Confirms
   `docs/master-data-architecture.md`'s own finding, now at the field level rather than only the
   route level.
2. **No delete action exists anywhere in this frontend for any of these 9 doctypes** — confirmed by
   a whole-folder grep for `deleteDoc` across `apps/frontend/src/app/(app)/master-data/` returning
   zero matches. Every master here is Create/Update only from this UI's perspective.
3. **The real Customer/Supplier ↔ Contact/Address relationship (ERPNext's `Dynamic Link`
   mechanism) is not wired up in this frontend at all** — the single most significant finding of
   this baseline. See `MD-UNV-003` and the Master Data ERD's notes
   (`docs/backend/11-relationships/master-erd.md`).
4. **Two form-component patterns coexist by design**: Customer and Supplier use bespoke components
   (`CustomerForm.tsx`, `SupplierForm.tsx`) for their distinct layout needs; Item uses its own
   bespoke `ItemForm.tsx`; Item Group, Warehouse, Contact, Address, and Territory all use the
   generic `MasterForm`/`FieldSpec[]` pattern. This matches `FRONTEND_GUIDE.md`'s documented
   convention, confirmed here at the code level for every doctype in scope.
5. **Every frontend form exposes a small subset of its doctype's real schema** — e.g. Item exposes
   ~14 of 140+ live fields, Customer exposes 5 of ~50. This is a deliberate, disclosed scope cut in
   every case investigated (not an oversight) — each document's field table marks exactly which
   live-schema fields are and are not reachable from this UI, so a future package extending any of
   these forms knows precisely what's already decided versus what's genuinely new scope.

## Relationship to other documents

- `docs/backend/11-relationships/master-erd.md` — extended with a Master Data ERD in this package.
- `docs/backend/15-migration/migration-status.md` — Master Data row updated to `DOCUMENTED`.
- `docs/backend/99-unverified/unverified-behaviours.md` — `MD-UNV-001` through `MD-UNV-005` added.
- `docs/master-data-architecture.md` — the IA/navigation/roadmap layer this entity catalog sits
  under; not duplicated here.
