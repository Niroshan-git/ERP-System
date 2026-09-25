# Ceylon Stack Backend Knowledge Base

This folder is the canonical-model / Frappe-mapping knowledge base for Ceylon Stack, built up incrementally per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` (binding — read it first).

**Purpose:** capture the business behavior currently implemented via Frappe/ERPNext — field mappings, entities, relationships, business rules, calculations, document lifecycle, stock/accounting/tax impact — as a canonical spec independent of Frappe's specific implementation. This is the blueprint that will eventually let Ceylon Stack replace Frappe module by module with a native backend, without redesigning the frontend.

**This is not a copy of ERPNext.** Frappe is the current reference implementation and behavioral benchmark, not the target architecture. Every document should distinguish `REQUIRED_CEYLON_BEHAVIOR` from `FRAPPE_CURRENT_BEHAVIOR` from `FRAPPE_ONLY_IMPLEMENTATION_DETAIL`.

## How this folder grows

Per §4 of the policy, domain subfolders (`01-master-data/`, `02-sales/`, `03-purchasing/`, `04-inventory/`, `05-manufacturing/`, `06-accounting/`, `07-tax/`, `08-workflows/`, etc.) are created only as the corresponding frontend feature is actually built or investigated — not created empty ahead of time.

**As of 2026-09-17 (backend knowledge system activation + first baseline):**

- `00-architecture/README.md` — the canonical-model layer stack and the two-backends framing (Frappe as reference, Ceylon Stack canonical model as the product architecture). Read this first for orientation.
- `05-manufacturing/` — first domain baseline: Work Order (list/detail/create) and Material Transfer for Manufacture, documented against the real current frontend build. Job Card documented as read-only fields only (no dedicated page yet). See `05-manufacturing/README.md`.

**Added 2026-09-22 (package MD-R2):**

- `01-master-data/` — Item, Item Group, UOM, Warehouse, Customer, Supplier, Contact, Address,
  Territory, each live-schema- and live-sample-verified against the real ERPNext instance. BOM is
  cross-referenced from here to its existing canonical doc in `05-manufacturing/bom.md` rather than
  duplicated. See `01-master-data/README.md` for the full ownership matrix and key findings —
  including a real, disclosed gap: the Customer/Supplier ↔ Contact/Address relationship ERPNext
  supports natively is not wired up anywhere in this frontend (`MD-UNV-003`).
- `11-relationships/master-erd.md` — extended with a Master Data ERD alongside the existing
  Manufacturing one.
- `15-migration/migration-status.md` — Master Data row updated to `DOCUMENTED`.
- `99-unverified/unverified-behaviours.md` — 5 more `NEEDS_VERIFICATION` items logged
  (`MD-UNV-001` through `MD-UNV-005`).

**Added 2026-09-24 (package `CRM-0`):**

- `16-crm/` — CRM domain discovery/architecture (Lead, Opportunity, Prospect), live-schema- and
  GitHub-source-verified. **Discovery only — no CRM frontend exists.** See `16-crm/README.md`.
  Numbered `16` rather than fitted into the original `01-08` domain-folder sequence, since CRM was not
  among the domains `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §4 enumerated when that structure was
  written (2026-09-17); renumbering existing folders to insert it earlier would break every existing
  cross-reference in already-committed docs.
- `11-relationships/master-erd.md` — extended with a CRM ERD.
- `15-migration/migration-status.md` — new CRM row (`DOCUMENTED`, discovery-only).
- `99-unverified/unverified-behaviours.md` — new `## CRM` section, `CRM-UNV-001` through `CRM-UNV-007`.

**Added 2026-09-25 (packages `LP-0`/`LP-1`):**

- `17-layout-print/` — Layout, Print & Document Output Engine discovery/architecture: live-verified
  `Print Format`/`Letter Head`/`Company`/`Address`/`Email Account` capability on the real Hetzner
  instance, ERPNext-owned vs. Ceylon-Stack-owned data boundary, canonical print document model, and
  the `LP-0`–`LP-9` package sequence. **Discovery + source-mapping only — no CRM/Sales/Purchasing
  document frontend print/PDF/email surface exists yet.** Not added to the migration-order table in
  this file — it's a cross-cutting output/presentation layer over existing transaction domains, not
  a business domain of its own being migrated. See `17-layout-print/README.md`.

Sales, Buying, Inventory, Purchasing, Accounting, and Tax are all real, shipped functionality in the frontend already (see `PROGRESS.md`) but still have **no backend documentation** — they remain the next candidates for a baseline pass, in that rough order (per the Current Mission priority lock and `docs/ceylon-stack-master-backlog.md` §4/§6), not because Manufacturing or Master Data are commercially ahead of them.

## Full structure reference

See `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §4 for the complete folder layout and §5 for what each domain document must capture per feature. Architecture Decision Records for durable cross-cutting decisions (not day-to-day implementation choices) live separately in `docs/architecture/decisions/README.md`.
