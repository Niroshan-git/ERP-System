# Work Order

**Frappe DocType:** `Work Order` (module: Manufacturing)
**Canonical entity:** `work_order`
**Frontend routes:** `/manufacturing/work-orders` (list), `/manufacturing/work-orders/[name]`
(detail — read-only plus Submit, `MFG-WF-004`), `/manufacturing/work-orders/new` (create)
**Verification:** `Documentation: VERIFIED` · `Source Code: PARTIALLY_VERIFIED` (fields
confirmed live; controller logic confirmed only for the paths exercised below) · `Runtime Test:
VERIFIED` for `MFG-TEST-001`–`005` (see Test Scenarios) · `Runtime Test: PARTIAL` for the
2026-09-18 Work Order Operation field-copy correction (`MFG-VAL-006`, `MFG-UNV-007`) —
schema/reference fields (`bom`, `base_hour_rate`) read-only-verified live against the one real BOM
on this instance; lint/type-check/build clean; no live Work Order create was performed this
session (see the Regression coverage note under Test scenarios) · **Independent review:
`CX-MFG-001`/`CX-MFG-002` `CLOSED`** (Codex final re-review, 2026-09-18, commit `a2b5cb8`) — this
covers the reviewed field-mapping correction, not the remaining `MFG-UNV-007` runtime scenarios
below, which stay `NEEDS_VERIFICATION` and non-blocking · `Runtime Test: VERIFIED` for
`MFG-TEST-006`–`007` (Submit, 2026-09-21, `MFG-WF-004`) · **Independent review: `CLAUDE_HANDOFF`,
not yet accepted** under `docs/controls/TEMP_DUAL_CLAUDE_MODE.md` — see `AI_WORK_LOG.md`'s
2026-09-21 "Work Order — Submit" entry

## Field mapping

| Frontend field | Canonical `work_order.*` | Frappe `Work Order.*` | Type | Required | Editable after submit | Notes |
|---|---|---|---|---|---|---|
| `name` (URL param / row ID) | `id` | `name` | Data (auto, `naming_series: MFG-WO-.YYYY.-`) | auto | no | |
| `status` | `status` | `status` | Select | system-set | n/a | Enum: `Draft / Submitted / Not Started / In Process / Stock Reserved / Stock Partially Reserved / Completed / Stopped / Closed / Cancelled` (live-verified via `get_doctype_fields`) |
| `company` | `company` | `company` | Link → Company | yes (create) | no | |
| Production Item cell | `production_item` | `production_item` | Link → Item | yes (create) | no | Create restricted client-side to items with `default_bom` set — see `MFG-VAL-001` |
| item name display | `item_name` | `item_name` | Data | auto-fetched | no | |
| Quantity | `qty` | `qty` | Float | yes (create), `> 0` | **no**, per `MFG-VAL-002` | |
| Produced qty (progress bar) | `produced_qty` | `produced_qty` | Float | system-set | n/a | Written by ERPNext's own Manufacture-purpose Stock Entry flow on submit — this frontend now triggers that flow (`MFG-WF-005`, `manufacture-completion.md`), but the value itself is always ERPNext's own recompute, never written directly |
| Process loss qty | `process_loss_qty` | `process_loss_qty` | Float | system-set | n/a | |
| BOM | `bom_no` | `bom_no` | Link → BOM | yes (create) | no | Auto-filled from the item's `default_bom` when exactly one active+default BOM exists; editable otherwise |
| Stock UOM | `stock_uom` | `stock_uom` | Link → UOM | auto | no | |
| Sales Order | `sales_order` | `sales_order` | Link → Sales Order | optional | no | Linked in detail view to `/sales/orders/[name]` |
| Project | `project` | `project` | Link → Project | optional | no | |
| Source Warehouse | `source_warehouse` | `source_warehouse` | Link → Warehouse | optional | no | No ERPNext-native default exists (`Manufacturing Settings` carries no default-warehouse fields — live-checked) |
| WIP Warehouse | `wip_warehouse` | `wip_warehouse` | Link → Warehouse | optional | no | |
| Target/FG Warehouse | `fg_warehouse` | `fg_warehouse` | Link → Warehouse | optional | no | |
| Planned start | `planned_start_date` | `planned_start_date` | Datetime | yes (create) | no | Frontend converts `<input type="datetime-local">` → `"YYYY-MM-DD HH:MM:SS"` |
| Planned end | `planned_end_date` | `planned_end_date` | Datetime | optional | no | May be entirely absent on a record (ERPNext omits the key, does not return `null` — live-confirmed) |
| Actual start / end | `actual_start_date` / `actual_end_date` | same | Datetime | system-set | n/a | |
| Use multi-level BOM | `use_multi_level_bom` | `use_multi_level_bom` | Check | optional, default 0 | no | Passed straight through; explosion happens server-side |
| Skip transfer | `skip_transfer` | `skip_transfer` | Check | n/a (not set by this app) | — | Read by `canTransferMaterials()` gating logic |
| Transfer material against | `transfer_material_against` | `transfer_material_against` | Select | n/a (not set by this app) | — | Read by `canTransferMaterials()`; `"Job Card"` value routes transfer elsewhere (not built here) |
| Track semi-finished goods | `track_semi_finished_goods` | `track_semi_finished_goods` | Check | n/a (not set by this app) | — | Read by `canTransferMaterials()` |
| `creation` / `modified` | `created_at` / `updated_at` | `creation` / `modified` | Datetime | system | n/a | |

### Child entity: Work Order Item (`required_items`)

Canonical `work_order_item`, 1:N under `work_order`. Frappe child DocType `Work Order Item`.

| Frontend field | Canonical `work_order_item.*` | Frappe field | Notes |
|---|---|---|---|
| Item cell | `item_code` / `item_name` | `item_code` / `item_name` | |
| Required | `required_qty` | `required_qty` | Auto-populated by ERPNext from `bom_no` × `qty` on insert (`MFG-CALC-001`). **Not editable after submit** (`MFG-VAL-002`) |
| Transferred | `transferred_qty` | `transferred_qty` | Written only by a submitted Material Transfer for Manufacture Stock Entry — see `material-transfer.md` |
| Consumed | `consumed_qty` | `consumed_qty` | Written by a Manufacture-purpose Stock Entry — built `MFG-CLOSE-1` (`MFG-WF-005`), see `manufacture-completion.md` |
| Source | `source_warehouse` | `source_warehouse` | |
| ADDITIONAL tag | `is_additional_item` | `is_additional_item` | Real ERPNext field, set only when a Material Transfer Stock Entry adds a non-BOM line (`add_additional_items`) — never inferred client-side |
| (not rendered) | `voucher_detail_reference` | `voucher_detail_reference` | Back-link to the Stock Entry Detail row that added an additional item; read during QA, not rendered in the UI |
| Stock UOM | `stock_uom` | `stock_uom` | |

### Child entity: Work Order Operation (`operations`)

Canonical `work_order_operation`, 1:N under `work_order`. Frappe child DocType
`Work Order Operation`. Field list live-confirmed via `get_doctype_fields` (2026-09-18,
`CX-MFG-002` re-remediation) against both `Work Order Operation` and `BOM Operation` — the
columns below are every field this app now copies from the source BOM Operation on create,
plus the lifecycle fields ERPNext itself sets that this app never sends.

| Frontend field | Canonical field | Frappe field | Set by this app on create? | Notes |
|---|---|---|---|---|
| Operation | `operation` | `operation` | Yes | |
| BOM reference | `bom` | `bom` | Yes (2026-09-18, final correction) | Set to the create payload's `bom_no` directly — this app never explodes multi-level BOMs, so every copied operation's owning BOM (`BOM Operation.parent`, a Frappe child-table meta field, not a declared schema field) is always that same top-level `bom_no`. Live-confirmed: both real operation rows on this instance have `parent === bom_no`. Previously omitted entirely — `CX-MFG-002` second re-review |
| Workstation | `workstation` | `workstation` | Yes | |
| Workstation Type | `workstation_type` | `workstation_type` | Yes (2026-09-18) | Previously dropped — `CX-MFG-002` |
| Sequence | `sequence_id` | `sequence_id` | Yes (2026-09-18) | Previously claimed carried-through by this doc's own comment but never actually mapped — `CX-MFG-002` |
| Status | `status` | `status` | No | ERPNext's own controller sets this |
| Time (mins) | `time_in_mins` | `time_in_mins` | Yes | Scaled `qty / bom.quantity` **unless** the source `BOM Operation.fixed_time` is set, in which case sent unscaled (2026-09-18 fix — see `MFG-VAL-006` below) |
| Completed Qty | `completed_qty` | `completed_qty` | No | ERPNext's own controller sets this |
| Batch Size | `batch_size` | `batch_size` | Yes (2026-09-18) | Previously dropped — `CX-MFG-002` |
| Hour Rate | `hour_rate` | `hour_rate` | Yes (2026-09-18, final correction) | Source is `BOM Operation.base_hour_rate` (company currency), **not** `BOM Operation.hour_rate` (transaction currency) — `Work Order Operation.hour_rate` is schema-confirmed as a currency-link-free `Float`, meaning company currency is the correct target. First 2026-09-18 pass wrongly copied `hour_rate`; corrected same day on Codex's second re-review (`CX-MFG-002`). On this instance the BOM's currency (`LKR`) equals the company's default (`LKR`, `conversion_rate: 1.0`), so `hour_rate === base_hour_rate` here and the distinction is not yet runtime-observable; see `MFG-UNV-007` for the foreign-currency scenario, still `NEEDS_VERIFICATION` |
| Quality Inspection Required | `quality_inspection_required` | `quality_inspection_required` | Yes (2026-09-18) | Previously dropped — feeds the Quality Readiness tab's `jobCardsWithTemplate` population once Job Cards are generated from this operation |
| Is Subcontracted | `is_subcontracted` | `is_subcontracted` | Yes (2026-09-18) | Previously dropped |
| Skip Material Transfer | `skip_material_transfer` | `skip_material_transfer` | Yes (2026-09-18) | Previously dropped |
| Backflush From WIP Warehouse | `backflush_from_wip_warehouse` | `backflush_from_wip_warehouse` | Yes (2026-09-18) | Previously dropped |
| Source/WIP/FG Warehouse (per-operation override) | `source_warehouse`/`wip_warehouse`/`fg_warehouse` | same | Yes (2026-09-18) | Previously dropped |
| Description | `description` | `description` | Yes (2026-09-18) | Previously dropped |
| Planned/Actual Start/End, Planned Operating Cost | `planned_start_time` etc. | same | No | ERPNext's own controller derives these during `validate()` |
| FG/Semi-FG per-operation routing | `finished_good` / `finished_good_qty` / `bom_no` | same | **Deliberately not copied** | Semi-finished-goods routing — this app doesn't build multi-level/semi-finished Work Orders (same no-BOM-explosion boundary as `required_items`, see `MFG-CALC-001`) |

**`MFG-UNV-004a`** — historical, superseded 2026-09-17, then again 2026-09-18: this table
stayed **empty on a plain REST insert** even when the BOM had operations. Live-confirmed
(Package 3 QA): ERPNext's `validate()` auto-populates `required_items` from the BOM but does
**not** auto-populate `operations` the same way — that table is normally filled by Desk's own
client-side form script, not by `validate()` alone. **Fixed** (governance-closure finding
`CX-MFG-002`, first pass 2026-09-17): `createWorkOrderAction` began explicitly building and
sending `operations`, copied from the BOM's own `operations` (re-fetched server-side via
`getBomDetails`, not a client-submitted copy). **Codex's re-review of that first pass** found it
incomplete — only `operation`/`workstation`/scaled `time_in_mins` were sent, and every
operation's time was scaled unconditionally, including `fixed_time` operations that shouldn't
scale at all. **Re-fixed 2026-09-18 (second pass):** the field set was expanded to match the two
doctypes' live schemas, but **Codex's second re-review** found the expanded mapping still wrong
on two points: it copied `BOM Operation.hour_rate` (transaction currency) instead of
`base_hour_rate` (company currency), and it omitted the operation-level BOM reference
(`BOM Operation.parent → Work Order Operation.bom`). **Final correction 2026-09-18 (third pass):**
`hour_rate` now sources from `base_hour_rate`, and every operation now sets `bom: bom_no` — see
`MFG-VAL-006` and `MFG-UNV-007` for the full reasoning and what remains unverified. **Codex's
final re-review (2026-09-18) closed `CX-MFG-002`** against this third-pass correction — no
blocking findings remain on this field-copy mapping. This closure concerns the reviewed field
mapping itself; it does not certify the broader native-persistence-comparison and
foreign-currency-runtime items still open under `MFG-UNV-007` as tested — those remain
non-blocking `NEEDS_VERIFICATION`.

- **`MFG-VAL-006`** — `fixed_time` scaling exemption. `REQUIRED_CEYLON_BEHAVIOR` (reasoned from
  the field's own schema and label, not independently confirmed against ERPNext's native
  controller — see `MFG-UNV-007`): `BOM Operation.fixed_time` (Check) has no corresponding field
  on `Work Order Operation` at all (live-confirmed via `get_doctype_fields`) — its only possible
  purpose is to gate whether `time_in_mins` scales with the Work Order's quantity at copy time.
  This app now reads it purely as a scaling switch: `fixed_time` true → the BOM's own
  `time_in_mins` is sent unscaled; otherwise → scaled by `qty / bom.quantity`, same as before.

## Business rules

- **`MFG-VAL-001`** — Production Item create restriction (frontend-only, not an ERPNext DocType
  constraint): the "New Work Order" form only lists items where `default_bom` is set
  (`listManufacturableItemOptions`, filter `default_bom is set`). `FRAPPE_ONLY_IMPLEMENTATION_DETAIL`:
  this is this frontend's chosen definition of "manufacturable," not a Frappe-enforced rule —
  ERPNext itself will accept a Work Order for any item given an explicit `bom_no`.
- **`MFG-CALC-001`** — Required qty scaling. `REQUIRED_CEYLON_BEHAVIOR` / `FRAPPE_CURRENT_BEHAVIOR`
  (they match): `required_qty = bom_item.qty * (work_order.qty / bom.quantity)`. Live-verified
  twice against the one real BOM on this instance (qty=7 and qty=13) — exact match to ERPNext's
  own server-computed `required_items`. The frontend's BOM-preview-on-create screen computes this
  client-side for display only; the actual `required_items` values that land on the created
  document are always ERPNext's own server-side computation, never sent by the client.
- **`MFG-VAL-002`** — Update-after-submit block on `required_items`. `FRAPPE_CURRENT_BEHAVIOR`,
  source + live confirmed (Package 4 investigation): neither the parent `required_items` field
  nor any `Work Order Item` child field carries `allow_on_submit: 1`, so Frappe's core
  `_validate_update_after_submit()` rejects any edit to `item_code`/`required_qty`/row count once
  `docstatus = 1`. Live-reproduced error: `UpdateAfterSubmitError: "Row #1: Not allowed to change
  Required Qty after submission..."`. This is core Frappe safety, not a gap — do not build a
  workaround around it; see `MFG-WF-002` for the actual native path.
- **`MFG-VAL-003`** — Draft-stage `required_qty` edits are silently reverted, but `item_code`
  substitutions persist. `FRAPPE_CURRENT_BEHAVIOR`, live-confirmed (Package 4): while
  `Manufacturing Settings.allow_editing_of_items_and_quantities_in_work_order = 0` (current site
  value), every save calls `set_required_items(reset_only_qty=True)`, which resets `required_qty`
  on any row whose `item_code` still matches the BOM — but never resets `item_code` itself, so a
  raw item substitution on a Draft row does persist. Known edge case: nothing merges duplicate
  `item_code` rows if a substitution creates one.
- **`MFG-WF-001`** — **Superseded 2026-09-21 (Submit only — see `MFG-WF-004` below).** This frontend
  previously only ever called `createDoc`, never `submitDoc`/`cancelDoc`, on Work Order itself, so
  every Work Order created here stayed at `docstatus 0` (Draft) indefinitely from this app's
  perspective. Submit is now built (`MFG-WF-004`); Cancel remains a distinct, still-unscoped future
  package — this rule's "Cancel" half still holds.
- **`MFG-WF-004`** (2026-09-21) — Work Order Submit. `submitWorkOrderAction`
  (`manufacturing/work-orders/actions.ts`) calls the same generic `submitDoc("Work Order", name)`
  mechanism already used for Sales Order/Purchase Order/Production Plan (`lib/erpnext.ts`) —
  `docstatus 0 → 1` via a plain REST update, letting ERPNext's own `validate()`/`on_submit()` run
  server-side; nothing here re-implements or pre-validates that logic client-side. A `DocActionBar`
  Submit button renders in the detail page header whenever `doc.docstatus === 0`. **Live-confirmed
  submit-time validation (2026-09-21 QA):** ERPNext's native `Work Order.on_submit() →
  validate_warehouse()` requires `wip_warehouse` to be set and rejects submit with `"Work-in-Progress
  Warehouse is required before Submit"` (HTTP 417) otherwise — reproduced live against
  `MFG-WO-2026-00014` (created without a WIP warehouse), surfaces cleanly through
  `humanizeSubmitError`/`DocActionBar` as readable text, not a crash. Confirmed clean rollback: the
  document's `docstatus`/`status`/child rows were unchanged after the rejected attempt. Happy path
  independently confirmed against a second Draft Work Order that already had `wip_warehouse` set
  (`MFG-WO-2026-00008`): submit succeeded (`docstatus 1`, `status` "Not Started"), and
  `canTransferMaterials()` (`erpStatus.ts`) correctly flipped to `allowed: true` immediately after,
  closing the loop this doc's own "Stock impact" section previously only described in the abstract.
  Full remaining submit-time validation surface (beyond the WIP-warehouse check) is
  `NEEDS_VERIFICATION` — not exhaustively probed this session.
- **`MFG-WF-003`** (PP-5, 2026-09-20) — Work Order can now also be created via **Production Plan →
  Make Work Order** (`ProductionPlanMakeWorkOrderAction.tsx` / `lib/actions/productionPlanWorkOrder.ts`
  → ERPNext's native `WorkOrderCreationService.make_work_order`), a second creation path alongside
  this doctype's own `/manufacturing/work-orders/new` form. Live-confirmed (`MFG-WO-2026-00009`,
  2026-09-20): starts `docstatus 0`/Draft, same as this app's own create flow (`MFG-WF-001` still
  holds — nothing submits it), but with `production_plan`/`production_plan_item`/
  `production_plan_sub_assembly_item` back-references populated and inserted with
  `flags.ignore_mandatory = True` / `flags.ignore_validate = True` — ERPNext trusts its own
  upstream Production Plan data and bypasses Work Order's normal create-time validation entirely
  for this path (a real trust-boundary distinction from this app's own `createDoc` path, which runs
  full validation). See `production-plan.md`'s "Work Order Generation (PP-5)" section for the full
  quantity semantics, the live-confirmed duplicate-generation finding (re-running "Make Work Order"
  before submitting the Work Order it just created generates a second full-quantity one, since
  ERPNext's own pending-qty calculation only nets out *Submitted* Work Orders), and the
  live-confirmed cancel-cascade (cancelling the source Production Plan hard-deletes any still-Draft
  Work Order it created, via `delete_draft_work_order()`).
- **`MFG-WF-005`** (MFG-CLOSE-1) — Production completion. `submitProductionAction`
  (`manufacturing/work-orders/[name]/complete-production/actions.ts`) calls the same native
  `make_stock_entry(purpose="Manufacture")` mechanism Material Transfer already uses — see
  `material-transfer.md`'s sibling doc, `manufacture-completion.md`, for the full field mapping,
  business rules, and Work Order side-effect chain (`produced_qty`/`consumed_qty`/`process_loss_qty`/
  `status`, all source-traced live on the Hetzner instance by the `devops` subagent). Supports
  partial production via a re-previewed `fg_completed_qty`. `produced_qty` on this document is
  written by ERPNext's own submit-time recompute, never by this frontend directly — this closes
  the `work-order.md` field-mapping table's own long-standing note that `produced_qty` was "not
  written by this frontend (no Manufacture entry UI built)".
- **`MFG-WF-002`** — The ERPNext-native mechanism for a Work-Order-specific material deviation
  during production (add a non-BOM item, remove one, substitute one) is **Stock-Entry-driven, not
  a Work Order edit** — see `material-transfer.md`'s `MFG-STK-001`/`MFG-STK-002` and
  `work_order.py`'s `add_additional_items()`/`remove_additional_items()`. This was a deliberate
  investigation outcome (Package 4), not an assumption.

## Document lifecycle

| Action | Built in this frontend? | Behavior |
|---|---|---|
| Create | **Yes — two paths** | (1) Direct: `createDoc("Work Order", {...})` → `docstatus 0`. ERPNext's `validate()` auto-populates `required_items`; `operations` is now sent explicitly by this app (see `MFG-UNV-004a`, fixed 2026-09-17, field set corrected 2026-09-18). (2) Via Production Plan → Make Work Order (PP-5, 2026-09-20): native `make_work_order`, also `docstatus 0`, but with Production Plan back-references and `ignore_mandatory`/`ignore_validate` flags — see `MFG-WF-003`. |
| Save (Draft edit) | No | Not exposed; see `MFG-VAL-003` for what would happen if it were. |
| Submit | **Yes (2026-09-21, `MFG-WF-004`)** | `submitDoc("Work Order", name)` via a header `DocActionBar` button, shown when `docstatus === 0`. Runs ERPNext's own `validate()`/`on_submit()` server-side, including the live-confirmed WIP-warehouse-required check. Submitting is what makes `canTransferMaterials()` return true — live-confirmed, not just assumed. |
| Cancel | No | Future package. |
| Amend | No | Not investigated. |

## Relationships

See `docs/backend/11-relationships/master-erd.md`. Summary: `work_order` 1:N `work_order_item`,
1:N `work_order_operation`, 1:N `job_card` (external, `job_card.work_order`), 1:N `stock_entry`
(filtered to Material Transfer for Manufacture), N:1 `bom` (`bom_no`), N:1 `item`
(`production_item`), N:1 optional `sales_order`/`project`, N:1 optional `warehouse` in three
independent roles.

## Stock impact

Work Order itself does not move stock — it is the planning document. Stock movement happens via
linked Stock Entries: Material Transfer for Manufacture (documented in `material-transfer.md`,
writes `required_items[].transferred_qty`) and Manufacture-purpose entries (writes `consumed_qty`
and `produced_qty` — built `MFG-CLOSE-1`, see `manufacture-completion.md` for the full mechanics,
source-traced live against the installed ERPNext v16.34.2).

## Accounting impact

`NEEDS_VERIFICATION` — Work Order itself does not appear to post GL entries directly (it's a
planning/production-tracking document); GL impact happens at the linked Stock Entry / Manufacture
entry level. Not inspected this session — see `docs/backend/99-unverified/unverified-behaviours.md`.

## API behavior

Canonical contract (not yet formalized as a versioned API — this frontend calls Frappe's REST API
directly per `FRONTEND_GUIDE.md`'s API-layer rule, all through `lib/erpnext.ts`):

- List: `GET /api/resource/Work Order` with `fields`/`filters`/`limit_start`/`limit_page_length`/
  `order_by` — wrapped by `listDocs()`.
- Detail: `GET /api/resource/Work Order/{name}` — wrapped by `getDoc()`. Child tables
  (`required_items`, `operations`) come embedded in this single response; no extra request.
- Create: `POST /api/resource/Work Order` with the field payload in `buildWorkOrderFields()` —
  wrapped by `createDoc()`.

## Test scenarios (behavioral, live-run — see `QA_LOG.md` 2026-09-17 for full detail)

**`MFG-TEST-001`** — Create at qty=7 against `FG-STEEL-BRACKET-ASSY` /
`BOM-FG-STEEL-BRACKET-ASSY-001` (base qty 1) → `MFG-WO-2026-00007`, `docstatus 0`/`Draft`,
`required_items` = 5.6 / 28.0 / 0.35 (matches `qty × bom_item.qty` at qty=7 exactly).

**`MFG-TEST-002`** — Same BOM, qty=13 → `MFG-WO-2026-00008`, `required_items` = 10.4 / 52.0 / 0.65
(matches exactly).

**`MFG-TEST-003`** — Invalid `bom_no` on create → clean `LinkValidationError`, no orphan document
created.

**`MFG-TEST-004`** — Fractional qty (2.5) against a whole-number-UOM item → clean `ValidationError`,
no orphan document created.

**`MFG-TEST-005`** (Package 4 investigation) — Submitted-stage `required_qty` edit via plain doc
update → `UpdateAfterSubmitError`, confirms `MFG-VAL-002`.

**`MFG-TEST-006`** (2026-09-21, Submit package QA) — Submit attempted against `MFG-WO-2026-00014`
(Draft, no `wip_warehouse` set) → clean `417` rejection, `"Work-in-Progress Warehouse is required
before Submit"`, surfaced via `humanizeSubmitError`. Document unchanged after the failed attempt
(`docstatus 0`/`Draft`, no partial state). Confirms `MFG-WF-004`'s WIP-warehouse business rule.

**`MFG-TEST-007`** (2026-09-21, Submit package QA) — Submit against `MFG-WO-2026-00008` (Draft,
`wip_warehouse` already set) → `200`, `docstatus 1`, `status` "Not Started". Submit button correctly
disappears; Transfer Materials correctly appears (`canTransferMaterials()` now `allowed: true`).
**Note:** this document was submitted live during this QA session as a substitute for
`MFG-WO-2026-00014` (which could not reach Submitted per `MFG-TEST-006`) and is now permanently
`docstatus 1` — Cancel is out of scope for this package, so this state is not reversible from this
frontend. See `QA_LOG.md`'s 2026-09-21 Submit entry and `AI_WORK_LOG.md` for the full account of how
this substitution happened (it was not pre-authorized for this specific document).

**Regression coverage note (2026-09-18, `CX-MFG-002` remediation, all three passes):** this
repository has no automated test runner configured (`apps/frontend/package.json` has no `test`
script and no test files exist anywhere in the app) — verification for every prior Manufacturing
package has been `npm run lint` / `npx tsc --noEmit` / `npm run build` plus a live QA pass against
the Hetzner instance (see `QA_LOG.md`), not unit/integration tests. This fix follows the same
pattern: lint, type-check, and build all pass clean (see this package's `CLAUDE PACKAGE HANDOFF`).
The final (third) pass additionally used two read-only, non-mutating live checks against the real
instance: (1) two candidate native BOM→Work-Order population methods were called directly at their
**module-level dotted paths** (`/api/method/<dotted.path>` GET) and both returned `AttributeError`,
confirming those two specific invocation paths are unavailable on the installed ERPNext modules —
this rules out those paths only, not an identically named method exposed as a Frappe
**Document-bound method** (the separate `run_doc_method` boundary Desk's own `frm.call()` uses),
which was not tested; see `docs/backend/99-unverified/unverified-behaviours.md`'s `MFG-UNV-007`
for the precise scope of this evidence. Ceylon Stack retained the manual parity mapping for this
package's currently supported create flow on that basis, leaving the document-method boundary open
for future investigation rather than treating it as ruled out. (2) the one real BOM's operation
rows were read directly, confirming `parent === bom_no` (validating the `bom` mapping) and
`hour_rate === base_hour_rate` on this same-currency instance (meaning the costing fix is not yet
runtime-observable here — no live Work Order create was performed this session to avoid creating
another test document without QA sign-off). Introducing a test framework remains out of scope.
Live QA re-run creating an actual Work Order against a real BOM with a `fixed_time` operation and,
separately, against a BOM priced in a non-company transaction currency (neither currently exists
on this instance) is the concrete way to close `MFG-UNV-007`'s remaining uncertainty.
