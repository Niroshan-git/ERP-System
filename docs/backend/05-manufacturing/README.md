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
- [`manufacture-completion.md`](manufacture-completion.md) — Manufacture Stock Entry
  ("Complete Production", `MFG-CLOSE-1`, 2026-09-22): `/manufacturing/work-orders/[name]/
  complete-production` calls the same native `make_stock_entry` mechanism as Material Transfer,
  with `purpose: "Manufacture"`. Supports partial production, has zero client-editable item rows
  (stricter than Material Transfer — ERPNext's Manufacture flow has no "additional item"
  mechanism), and writes the Work Order's `produced_qty`/`consumed_qty`/`status` on submit.
  Source-traced live via SSH (`devops` subagent) against the installed ERPNext v16.34.2; **no live
  Stock Entry was created/submitted this session** — `Runtime Test: NOT RUN`, see that doc's "Live
  QA" section.
- [`job-card.md`](job-card.md) — read-only fields only (surfaced on the Work Order detail page's
  Job Cards tab). Job Card's own lifecycle is out of scope until it gets its own frontend package.
- [`bom.md`](bom.md) — started as a 2026-09-19 investigation baseline (BOM/BOM Item/BOM Operation
  schema, lifecycle, costing, multi-level, Production Plan relationship, Operation/Routing/
  Workstation classification), then **implemented**: `/master-data/boms` now has read-only
  list/detail, create, Draft-only edit, Submit (`MFG-CLOSE-0c`, 2026-09-22), submitted-BOM
  Active/Inactive/Default availability actions, and Cancel/Amend (`MFG-CLOSE-2`, 2026-09-23) — see
  `bom.md`'s "Frontend capability"/"Mutation contract"/"Submit contract"/"Submitted-BOM
  availability contract"/"Cancel/Amend contract".
- [`production-plan.md`](production-plan.md) — started as a 2026-09-19 discovery/canonicalization
  baseline (header/child-table schema, Sales Order sourcing rules, multi-BOM resolution,
  sub-assembly explosion, material requirement formula, Work Order/Material Request generation,
  accounting/stock impact), then **implemented**: `/manufacturing/production-plans` now has
  create, submit, Get Sub Assembly Items, Make Work Order, Make Material Request, and cancel with
  real cascade rules (Production Plan Packages PP-1 through PP-8, 2026-09-20/21). Amend and
  multi-location "Get Items for Purchase/Transfer" remain unbuilt. `MFG-UNV-012` (source-derived
  behavior flagged during the original discovery pass, renumbered from a colliding `MFG-UNV-010`,
  see `unverified-behaviours.md`'s ID note — `CX-MFG-PP-004`) has since been substantially
  narrowed by live testing across those packages — see `unverified-behaviours.md` for current
  status, not this line.

## What's explicitly NOT covered

Per the Current Mission priority lock in `CLAUDE.md` ("Manufacturing frontend unlocked
2026-09-17... create/submit/cancel actions [now partially built — see note below], Job Card
list/detail, BOM, Workstations, and OEE are each their own future scoped package"):

- **Job Card list/detail pages** — no dedicated route exists; fields are read only via the Work
  Order detail page.
- **Workstations** — not touched by the frontend at all yet.
- **OEE** — not touched by the frontend; belongs to `apps/mes-service` eventually, not
  `apps/frontend`.
- **Work Order Cancel** — Work Order Create and Submit both exist (see `work-order.md`,
  `MFG-WF-004`); there is still no Cancel action in the frontend for Work Order itself.
- **Production Plan (planning workspace)** — superseded: this is now a fully built, live-verified
  planning workspace (`/manufacturing/production-plans` — create, submit, Get Sub Assembly Items,
  Make Work Order, Make Material Request, cancel with real cascade rules; see
  [`production-plan.md`](production-plan.md)). Amend and multi-location "Get Items for Purchase/
  Transfer" remain unbuilt.

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
