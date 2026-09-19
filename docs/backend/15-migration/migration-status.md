# Migration Status

Per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §8. Status scale (do not skip stages):

```
FRAPPE_REFERENCE → DOCUMENTED → CONTRACT_DEFINED → NATIVE_DEVELOPMENT → SHADOW_TESTING → NATIVE_PRODUCTION → FRAPPE_RETIRED
```

**No domain has begun native development.** A `DOCUMENTED` status below means backend knowledge
capture has started for that domain in `docs/backend/`, not that a contract or native code exists.

| Domain | Status | Notes |
|---|---|---|
| Master Data (Item, Warehouse, Customer, Supplier, UOM) | `FRAPPE_REFERENCE` | Used extensively by Sales/Inventory/Buying/Manufacturing frontend; no dedicated `docs/backend/01-master-data/` docs written yet. |
| Sales (Quotation → Sales Order → Delivery Note → Sales Invoice, Pick List) | `FRAPPE_REFERENCE` | Frontend core hardened per Current Mission; no `docs/backend/02-sales/` docs written yet — first candidate for the next baseline pass. |
| Purchasing / Buying (PO → Purchase Receipt → Purchase Invoice) | `FRAPPE_REFERENCE` | Core cycle accepted 2026-09-16; no `docs/backend/03-purchasing/` docs written yet. |
| Inventory / Stock (Warehouses, Batches, Serial Nos, Stock Entry, Stock Balance) | `FRAPPE_REFERENCE` | MVP shipped 2026-09-16; no `docs/backend/04-inventory/` docs written yet. Directly touched by Manufacturing's Material Transfer (Stock Entry), documented from the Manufacturing side only — see `docs/backend/05-manufacturing/material-transfer.md`. |
| **Manufacturing — Work Order + Material Transfer for Manufacture** | `DOCUMENTED` | This baseline pass (2026-09-17). Covers Work Order list/detail/create and the Material Transfer for Manufacture Stock Entry flow. See `docs/backend/05-manufacturing/`. |
| Manufacturing — BOM (as an entity) | `FRAPPE_REFERENCE` | Read-only canonical entity frontend shipped 2026-09-19 (Package 4A): `/master-data/boms` (list) + `/master-data/boms/[name]` (detail) — header/status, Components, Operations, Costing, More Info; `bom_no` plain-text references converted to entity links. Create + Draft-only edit shipped same day (Package 4B): `/master-data/boms/new` and inline edit on the detail page when `docstatus === 0`, via `createDoc`/`updateDoc` — see `docs/backend/05-manufacturing/bom.md`'s "Mutation contract" section for the exact field set. Still no Submit/Cancel/Amend/"Update Cost" action anywhere, and no live write-testing was performed (no working frontend login credentials this session) — the non-Draft-update rejection and zero-rate-component acceptance are `NEEDS_VERIFICATION`, not confirmed. Full schema/lifecycle/costing/multi-level/Operation-Routing-Workstation-classification investigation remains in `docs/backend/05-manufacturing/bom.md`; lifecycle/multi-level/costing-recompute behavior itself is still `NEEDS_VERIFICATION` (`MFG-UNV-009`) — Draft-stage create/edit does not resolve that. |
| Manufacturing — Job Card, Workstations, OEE | `FRAPPE_REFERENCE` | Not yet built in the frontend beyond read-only fields surfaced on the Work Order detail page's Job Cards tab (see `docs/backend/05-manufacturing/job-card.md`). Each is its own future scoped package per the Current Mission priority lock. |
| Accounting (GL, AR, AP) | `FRAPPE_REFERENCE` | Not directly built as its own frontend module; GL impact of Sales/Buying/Manufacturing transactions is largely `NEEDS_VERIFICATION` — see `docs/backend/99-unverified/unverified-behaviours.md`. |
| Tax | `FRAPPE_REFERENCE` | Not yet documented. |
| Workflows / permissions / document lifecycle (cross-cutting) | `FRAPPE_REFERENCE` | Draft/Submit/Cancel/update-after-submit behavior documented per-domain as encountered (see Work Order's lifecycle section), not yet as its own cross-cutting doc. |

## Migration order (policy §8, do not begin out of order without justification)

Lower to higher complexity: Master Data → CRM → Sales → Purchasing → Workflow → Inventory →
Manufacturing → Tax → Accounting/GL. Accounting, inventory valuation, manufacturing costing, and
financial statements stay on Frappe the longest.

## Next candidates for `DOCUMENTED` status

Ordered by what's already built and reviewed in the frontend (per `PROGRESS.md`) but still
undocumented here: **Sales** (largest surface, hardened first per Current Mission) → **Inventory
MVP** → **Buying core cycle**. Manufacturing's remaining pieces (Job Card, BOM, Workstations, OEE)
follow only as their own frontend packages get built, per the Current Mission priority lock in
`CLAUDE.md`.
