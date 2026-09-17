# Job Card (read-only fields only)

**Frappe DocType:** `Job Card` (module: Manufacturing)
**Canonical entity:** `job_card`
**Frontend surface:** no dedicated route — fields are read only on the Work Order detail page's
Job Cards tab (`/manufacturing/work-orders/[name]`) and via `apps/mcp-server`'s
`list_job_cards`/`get_job_card_detail` tools (a separate consumer, different purpose).
**Verification:** `Documentation: PARTIALLY_VERIFIED` — fields confirmed live via
`get_doctype_fields`; lifecycle/behavior is `NEEDS_VERIFICATION` (`MFG-UNV-004`).

This is intentionally a thin document — Job Card has no create/detail/list page of its own in
`apps/frontend` yet (a future scoped package per the Current Mission priority lock). Do not treat
this as a full Job Card baseline.

## Fields read (Work Order detail page's Job Cards tab)

| Field | Frappe field | Type | Notes |
|---|---|---|---|
| Job Card ID | `name` | Data | Rendered as **plain text, deliberately not a link** — no Job Card detail route exists |
| Status | `status` | Select | |
| Operation | `operation` | Link → Operation | |
| Workstation | `workstation` | Link → Workstation | |
| For Qty | `for_quantity` | Float | |
| Completed Qty | `total_completed_qty` | Float | |
| Expected Start/End | `expected_start_date` / `expected_end_date` | Date | |
| Actual Start/End | `actual_start_date` / `actual_end_date` | Date | |
| Quality Inspection Template | `quality_inspection_template` | Link → Quality Inspection Template | Job Card's own direct field, confirmed live — **not** inferred from the production Item's own template default (see Quality Readiness note below) |
| Quality Inspection | `quality_inspection` | Link → Quality Inspection | Job Card's own direct field |

## Business rule

- **`MFG-VAL-006`** — Quality Readiness must read Job Card's own fields, never the Item-level
  default. `REQUIRED_CEYLON_BEHAVIOR`: the Work Order detail page's "Quality Readiness" section
  counts Job Cards whose own `quality_inspection_template` is set and reports how many of those
  have a matching `quality_inspection` recorded — deliberately does **not** fall back to the
  production Item's own `quality_inspection_template` config default, since that would be
  inferring Work-Order-level quality readiness from an unrelated Item-level setting. Confirmed
  live: both fields are currently `null` on this instance's real Job Cards (no inspections
  entered yet — not a query failure). Note: `apps/mcp-server`'s own `get_work_order_detail`/
  `get_job_card_detail` tools take the Item-level approach instead, for a different, narrower
  purpose — the two are not inconsistent, they answer different questions.

## Relationships

`job_card` N:1 `work_order` (`work_order`), N:1 optional `workstation`, N:1 optional
`quality_inspection_template`/`quality_inspection`. See
`docs/backend/11-relationships/master-erd.md`.

## Not documented (out of scope until Job Card gets its own package)

Create/Save/Submit/Cancel lifecycle, time log tracking, operation-completion semantics, downstream
effect on Work Order `operations[].completed_qty`, and any OEE feed. See `MFG-UNV-004`.
