# Ceylon Stack Backend Knowledge Base

This folder is the canonical-model / Frappe-mapping knowledge base for Ceylon Stack, built up incrementally per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` (binding — read it first).

**Purpose:** capture the business behavior currently implemented via Frappe/ERPNext — field mappings, entities, relationships, business rules, calculations, document lifecycle, stock/accounting/tax impact — as a canonical spec independent of Frappe's specific implementation. This is the blueprint that will eventually let Ceylon Stack replace Frappe module by module with a native backend, without redesigning the frontend.

**This is not a copy of ERPNext.** Frappe is the current reference implementation and behavioral benchmark, not the target architecture. Every document should distinguish `REQUIRED_CEYLON_BEHAVIOR` from `FRAPPE_CURRENT_BEHAVIOR` from `FRAPPE_ONLY_IMPLEMENTATION_DETAIL`.

## How this folder grows

Per §4 of the policy, domain subfolders (`01-master-data/`, `02-sales/`, `03-purchasing/`, `04-inventory/`, `05-manufacturing/`, `06-accounting/`, `07-tax/`, `08-workflows/`, etc.) are created only as the corresponding frontend feature is actually built or investigated — not created empty ahead of time.

**As of 2026-09-17 (backend knowledge system activation + first baseline):**

- `00-architecture/README.md` — the canonical-model layer stack and the two-backends framing (Frappe as reference, Ceylon Stack canonical model as the product architecture). Read this first for orientation.
- `05-manufacturing/` — first domain baseline: Work Order (list/detail/create) and Material Transfer for Manufacture, documented against the real current frontend build. Job Card documented as read-only fields only (no dedicated page yet). See `05-manufacturing/README.md`.
- `11-relationships/master-erd.md` — Mermaid ERD, currently covering only the Manufacturing entities above.
- `15-migration/migration-status.md` — per-domain status; Manufacturing (Work Order + Material Transfer) is the first domain to reach `DOCUMENTED`, everything else is still `FRAPPE_REFERENCE`.
- `99-unverified/unverified-behaviours.md` — 6 `NEEDS_VERIFICATION` items logged from the Manufacturing baseline (Desk indicator colors, Item Alternative, headroom >0%, Job Card/BOM lifecycle, GL impact, a client-side pre-check gap).

Sales, Inventory, Buying, Purchasing, Accounting, and Tax are all real, shipped functionality in the frontend already (see `PROGRESS.md`) but have **no backend documentation yet** — they are the next candidates for a baseline pass, in that rough order (per the Current Mission priority lock), not because Manufacturing is commercially ahead of them.

## Full structure reference

See `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §4 for the complete folder layout and §5 for what each domain document must capture per feature. Architecture Decision Records for durable cross-cutting decisions (not day-to-day implementation choices) live separately in `docs/architecture/decisions/README.md`.
