# Manufacturing — Backend Knowledge Baseline

Domain status: `DOCUMENTED` (partial) — see `docs/backend/15-migration/migration-status.md`.

## What's covered here (2026-09-17 baseline)

Documented against the actual current frontend build in `apps/frontend/src/app/(app)/manufacturing/`,
per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §10-11 ("only document functionality that
exists in the current build"):

- [`work-order.md`](work-order.md) — Work Order list, detail (6 tabs), and create. Fields,
  business rules, lifecycle, relationships.
- [`material-transfer.md`](material-transfer.md) — Material Transfer for Manufacture (the
  Stock Entry flow triggered from Work Order Detail). Fields, business rules, stock impact.
- [`job-card.md`](job-card.md) — read-only fields only (surfaced on the Work Order detail page's
  Job Cards tab). Job Card's own lifecycle is out of scope until it gets its own frontend package.
- [`bom.md`](bom.md) — 2026-09-19 investigation baseline (BOM/BOM Item/BOM Operation schema,
  lifecycle, costing, multi-level, Production Plan relationship, Operation/Routing/Workstation
  classification). **Investigated only, not implemented** — the Manufacturing Masters (BOM)
  package concluded Gate B (no usable BOM frontend exists to canonicalize); see `PROGRESS.md`
  and `docs/operations/AI_WORK_LOG.md` for the full handoff.
- [`production-plan.md`](production-plan.md) — 2026-09-19 discovery/canonicalization baseline
  (header/child-table schema, Sales Order sourcing rules, multi-BOM resolution, sub-assembly
  explosion, material requirement formula, Work Order/Material Request generation, accounting/
  stock impact). **Investigated only, not implemented** — zero frontend footprint, zero live
  Production Plan documents exist to test against; source-derived behavior is flagged
  `MFG-UNV-010`. See `PROGRESS.md` for the recommended next package (PP-1: canonical read-only
  List/Detail).

## What's explicitly NOT covered

Per the Current Mission priority lock in `CLAUDE.md` ("Manufacturing frontend unlocked
2026-09-17... create/submit/cancel actions [now partially built — see note below], Job Card
list/detail, BOM, Workstations, and OEE are each their own future scoped package"):

- **BOM as its own entity/page** — no create/edit/versioning UI; only read via `getDoc("BOM", ...)`
  for the Work Order create preview. Domain investigated (schema, lifecycle, costing, multi-level,
  Production Plan relationship) 2026-09-19 without building any frontend — see [`bom.md`](bom.md).
- **Job Card list/detail pages** — no dedicated route exists; fields are read only via the Work
  Order detail page.
- **Workstations** — not touched by the frontend at all yet.
- **OEE** — not touched by the frontend; belongs to `apps/mes-service` eventually, not
  `apps/frontend`.
- **Work Order Submit/Cancel** — Work Order Create exists (see `work-order.md`), but every
  created Work Order stays at `docstatus 0` (Draft); there is no Submit or Cancel action in the
  frontend for Work Order itself.
- **Production Plan (planning workspace)** — no route, action, or component anywhere. Domain
  investigated (schema, Sales Order sourcing, multi-BOM resolution, sub-assembly explosion, MRP
  formula, Work Order/Material Request generation) 2026-09-19 without building any frontend — see
  [`production-plan.md`](production-plan.md).

> **Note on drift with `CLAUDE.md`'s Current Mission text**: as of this baseline, Work Order
> Create (Package 3) and Material Transfer for Manufacture (Package 5) have actually been built,
> code-reviewed, and QA-passed (see `PROGRESS.md`/`QA_LOG.md`, 2026-09-17 entries) — ahead of
> `CLAUDE.md`'s current mission-lock wording, which still lists "create ... actions" as gated.
> This documentation baseline reflects the real, reviewed frontend as it stands; it does not
> itself change the mission lock, which requires Niroshan's explicit approval to reorder per
> `CLAUDE.md`'s own rule. Flagged for Niroshan's attention, not resolved unilaterally here.

## Source of truth for this baseline

Live-verified against the real Hetzner ERPNext instance (not guessed) via:
`mcp__ceylon-stack__get_doctype_fields`, `list_documents`, `get_work_order_detail`,
`get_job_card_detail`, and direct `bench console` transactions during Packages 2–5 (see
`PROGRESS.md` 2026-09-17 entries for the full trail). Anything not covered by that trail is
flagged `NEEDS_VERIFICATION` in `docs/backend/99-unverified/unverified-behaviours.md`.
