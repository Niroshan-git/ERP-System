# Job Card

**Frappe DocType:** `Job Card` (module: Manufacturing)
**Canonical entity:** `job_card`
**Frontend surface today:** read-only list (`/manufacturing/job-cards`) and detail
(`/manufacturing/job-cards/[name]`) pages, shipped `MFG-JOBCARD-1` (2026-09-23) — plus the
pre-existing read-only fields on the Work Order detail page's Job Cards tab (now linked to the
new detail route instead of plain text) and `apps/mcp-server`'s `list_job_cards`/
`get_job_card_detail` tools (a separate consumer, different purpose). No create/submit/cancel/
execution capability exists yet — see "Proposed Ceylon Stack architecture" below for what's next.
**Verification:** `Documentation: VERIFIED` — full model, lifecycle, time-log, quantity, and
Cancel/Amend contract confirmed via direct read of the live ERPNext v16.34.2 / Frappe v16.33.1
source (`job_card.py`, `job_card_time_log.py`, `work_order.py`, `frappe/model/{document,delete_doc}.py`)
and one disposable-fixture live test (`TEST-JOBCARD-0-*`, cleaned up, real data confirmed
untouched) during `MFG-JOBCARD-0`. Resolves `MFG-UNV-004`. `MFG-JOBCARD-1`'s read-only frontend
was independently live-QA'd against the real instance (zero-mutation, field-shape cross-check
against real API responses) and code-reviewed with no blocking findings — see `QA_LOG.md`.

## Fields (full model, not just what the Work Order tab currently reads)

| Field | Frappe field | Type | Notes |
|---|---|---|---|
| Job Card ID | `name` | Data | Autoname `naming_series: "PO-JOB.#####"` |
| Work Order | `work_order` | Link → Work Order | Reqd |
| Operation | `operation` | Link → Operation | Reqd. The Operation *master* name — can repeat across rows |
| Operation row ref | `operation_id` | Data | The real per-row FK: the exact `Work Order Operation` **child-row name**, not the Operation master |
| Workstation | `workstation` | Link → Workstation | Reqd (bypassed via `ignore_mandatory` on auto-creation if the BOM operation didn't set one) |
| BOM | `bom_no` | Link → BOM | |
| For Qty | `for_quantity` | Float | Cumulative across a Job Card's lifecycle (see "Quantity" below) |
| Pending Qty | `pending_qty` | Float | `for_quantity` minus completed/loss |
| Completed Qty | `total_completed_qty` | Float | Sum of `time_logs[].completed_qty`, or `min()` across `sub_operations` if present |
| Process Loss Qty | `process_loss_qty` | Float | |
| Manufactured Qty | `manufactured_qty` | Float | Derived by reading submitted Stock Entries, not authoritative on its own |
| Transferred / Requested Qty | `transferred_qty` / `requested_qty` | Float | Material-transfer-against-Job-Card tracking |
| Status | `status` | Select | `Open, Work In Progress, Partially Transferred, Material Transferred, On Hold, Submitted, Cancelled, Completed` — **derived, not a source of truth after cancel** (see "Lifecycle" below) |
| docstatus | `docstatus` | Int | Standard 0/1/2 — the actual source of truth for "is this cancelled" |
| Is Paused | `is_paused` | Check | |
| Is Corrective Job Card | `is_corrective_job_card` | Check | Rework job card against the same operation, via `for_job_card` self-link |
| Track Semi-Finished Goods | `track_semi_finished_goods` | Check | Gates whether this Job Card can directly drive `Work Order.produced_qty` |
| Skip Material Transfer | `skip_material_transfer` | Check | |
| Sequence ID | `sequence_id` | Int | Enforces upstream-before-downstream operation completion ordering |
| Hour Rate / WIP-Source-Target Warehouse | various | | Costing/stock inputs, read by Stock Entry mapping, not written by Job Card itself |
| Quality Inspection Template / Quality Inspection | `quality_inspection_template` / `quality_inspection` | Link | Already documented, see "Business rule" below (unchanged from prior baseline) |
| Amended From | `amended_from` | Link → Job Card | Standard Frappe amend field |

### Child tables

- **`time_logs` → Job Card Time Log** — the real time-tracking table. `employee` (Link, optional, Active-only), `from_time`, `to_time`, `time_in_mins` (**server-computed**, `time_diff_in_minutes`), `completed_qty` (non-negative), `operation` ("Sub Operation" label). `job_card_time_log.py` has zero controller logic of its own — all validation lives on the parent `JobCard` doc.
- **`scheduled_time_logs` → Job Card Scheduled Time** — capacity-planning projection, separate from actual time logs.
- **`items` → Job Card Item** — only populated for semi-finished-goods tracking or `transfer_material_against == "Job Card"`. `required_qty` (editable), `transferred_qty`/`consumed_qty` (read-only, server-derived).
- **`secondary_items` → Job Card Secondary Item** — BOM secondary-item consumption for semi-finished tracking.
- **`sub_operations` → Job Card Operation** — populated only if the Operation master has configured Sub Operations; drives `total_completed_qty` via a bottleneck (`min()`) rule when present.
- **`employee`** — `TableMultiSelect[Job Card Time Log]`, a derived/deduplicated roster rebuilt by `set_employees()` on every validate; not independently editable.

### Relationships

`job_card` N:1 `work_order` (via both `work_order` and the more precise `operation_id` → `Work Order Operation` child row), N:1 optional `workstation`, N:1 optional `quality_inspection_template`/`quality_inspection`, 1:N `time_logs`/`items`/`sub_operations`. See `docs/backend/11-relationships/master-erd.md`.

## Business rule (unchanged from prior baseline)

- **`MFG-VAL-006`** — Quality Readiness reads Job Card's own `quality_inspection_template`/`quality_inspection` fields, never the Item-level default. See prior write-up (`CX-MFG-003` fix, 2026-09-17) — not re-verified this pass, not in scope for this discovery package.

## Creation contract — `SOURCE VERIFIED` + `LIVE VERIFIED`

Job Cards are **auto-generated on Work Order submit**, not normally created through a manual "New" flow (the DocType technically permits manual create, but nothing in this app's own or ERPNext's default UX does that):

```python
# work_order.py
def on_submit(self):
    ...
    self.create_job_card()

def create_job_card(self):
    for idx, row in enumerate(self.operations):
        qty = self.qty
        while qty > 0:
            qty = split_qty_based_on_batch_size(self, row, qty)
            if row.job_card_qty > 0:
                self.prepare_data_for_job_card(row, idx, ...)
```

**One Job Card per Work Order Operation row**, and only if `self.operations` is non-empty — i.e. **only if the BOM has Operations attached at all** (this is the real gate, see "Operation/Workstation dependency" below). If `Operation.create_job_card_based_on_batch_size` is set, the while-loop splits one operation into multiple Job Cards by batch size — both real Operations on this instance (`Assembly`, `Coating`) have that flag off, so today it's 1:1.

Auto-creation sets `doc.flags.ignore_mandatory = True` before insert, so `workstation`/`operation` being `reqd` at the field level doesn't block auto-creation even if the BOM operation row lacked a Workstation — a manual create through the API would not get this bypass.

Multiple Job Cards against the same operation is an explicit, designed-for case: batch splitting, and **corrective Job Cards** (`make_corrective_job_card()`, `is_corrective_job_card`, `for_job_card` self-link) for rework, kept separate from normal quantity accounting. Partial completion is supported via `pending_qty` carrying the un-completed remainder forward; the exact mechanism for who/what creates a follow-on Job Card to consume that `pending_qty` was not traced this session — `NEEDS_VERIFICATION`.

**Pre-existing gotcha, already correctly handled in shipped code:** a server-side Work Order `insert()` that sets `bom_no` without also copying the BOM's `operations` produces an empty `operations` table and **zero Job Cards** on submit — this app's own Work Order create action (`manufacturing/work-orders/actions.ts`) already explicitly guards against this (documented in its own code comments: re-fetches the BOM server-side via `getBomDetails` and copies `operations` onto the create payload, specifically because ERPNext's own operations-population is normally client-JS-only). Confirmed by reading that file directly — **not a defect, a corroborating check.**

## Lifecycle — `SOURCE VERIFIED` + `LIVE VERIFIED`

Not a simple named state machine. `status` is recomputed by `set_status()` from `docstatus` + `is_paused` + `transferred_qty` + `total_completed_qty`, but **`update_status` (the flag that actually persists the recompute to the DB) defaults to `False` in most call paths, including `on_cancel`'s.**

**Load-bearing quirk, confirmed live:** cancelling a submitted Job Card leaves `status` **stale** in the database (e.g. still reading `"Completed"` after `docstatus` has already moved to `2`) — `on_cancel()` never calls `set_status(update_status=True)`. **A future Job Card UI must derive "Cancelled" display state from `docstatus == 2`, never from the literal `status` string** — the same "docstatus is truth, status is a display hint" lesson this project already applies to Work Order/BOM. `on_discard()` (deleting an unsaved Draft) does correctly set `status="Cancelled"`, but that's a different, non-cancel code path.

There is no literal Start/Pause/Resume/Complete *state machine* — instead, four whitelisted **methods** mutate `time_logs` and let `set_status()` infer a display status:

| Method | Effect |
|---|---|
| `start_timer(**kwargs)` | Validates docstatus, opens a time log (`add_time_logs(from_time=...)`) |
| `pause_job(**kwargs)` | `db_set("is_paused", 1)`, closes the open time log |
| `resume_job(**kwargs)` | `db_set("is_paused", 0)`, opens a new time log |
| `complete_job_card(**kwargs)` | Sets cumulative `for_quantity`, validates the qty-conservation invariant, closes the time log, optional `auto_submit` |

`validate_on_hold()` force-resets `is_paused` to 0 if no `time_logs` exist yet — guards against pausing before starting.

**Second, lower-stakes quirk, live-confirmed:** the parent Work Order's own `status` also doesn't revert when its Job Card is cancelled (stays `"In Process"` even with zero remaining active Job Cards) — worth a defensive cross-check against this app's existing Work Order status rendering, though not urgent since Work Order's own detail page already treats `docstatus`/native fields as truth elsewhere.

## Time log model — `SOURCE VERIFIED`

`add_time_logs()`/`add_time_logs_for_employess()` (verbatim, misspelled, in source) do the real work. **Server-calculated, never client-trusted:** `time_in_mins`. **Client-supplied, validated:** `from_time`, `to_time`, `employee`, `completed_qty` (checked against the qty-conservation invariant at submit). Multiple employees log concurrently as separate time-log rows. Overlap validation is real: `get_overlap_for()`/`has_overlap()` block a double-booked employee (already has an open Job Card elsewhere) and block a Workstation exceeding its `production_capacity` for overlapping windows — raising `OverlapError` (`ValidationError` subclass).

Actual whitelisted method names present in source: `start_timer`, `pause_job`, `resume_job`, `complete_job_card`, `make_time_log` (module-level, older/simpler entry point), `make_stock_entry_for_semi_fg_item`, `get_required_items`, plus module-level `make_subcontracting_po`, `get_operation_details`, `get_operations`, `make_material_request`, `make_stock_entry`, `get_job_details`, `make_corrective_job_card`.

## Quantity / partial-completion model — `SOURCE VERIFIED` + `LIVE VERIFIED`

Conservation invariant enforced at submit: `total_completed_qty + process_loss_qty + pending_qty == for_quantity`.

Over-completion guarded two ways: `validate_job_card_qty()` sums all non-cancelled Job Cards against the same `work_order`+`operation_id` and throws if they'd exceed the Work Order's qty (plus Manufacturing Settings' overproduction allowance); `validate_sequence_id()` blocks a downstream operation's Job Card from out-completing an upstream one when `sequence_id` is set.

Feeds into Work Order via `update_work_order()` → sums across all submitted, non-corrective Job Cards for that operation → writes onto the matching `Work Order Operation` child row (`completed_qty`, `process_loss_qty`, `pending_qty`, `actual_*` dates) → `wo.calculate_operating_cost()`/`set_actual_dates()`. Separately, `update_semi_finished_good_details()` (only when `finished_good` tracking is used) sums `manufactured_qty` and writes `Work Order.produced_qty` directly — **this is the field that gates this project's already-shipped Complete Production / Manufacture Stock Entry eligibility.**

**Live-confirmed:** submitting a Job Card with `for_quantity == total_completed_qty` (simple, non-semi-finished BOM) flipped the parent Work Order's own `status` to `"In Process"` even without touching `produced_qty` — Job Card completion visibly affects Work Order display regardless of the semi-finished path.

## Work Order integration & Cancel/Amend contract — `SOURCE VERIFIED` + `LIVE VERIFIED` (core finding of this package)

Confirms the prior project finding exactly: `Work Order.validate_cancel()` never mentions Job Card — it only checks `status != "Stopped"` and submitted Stock Entries. The actual Job Card block comes from **Frappe's generic static-link cancel guard** (`frappe/model/document.py` → `check_if_doc_is_linked` → `frappe/model/delete_doc.py`'s `get_linked_docs`), which scans every DocType with a Link field to `Work Order` and only flags a match `if docstatus.is_submitted()` — **draft (`docstatus 0`) Job Cards never block Work Order cancel, only submitted ones do.**

**Full live-verified flow** (disposable fixture `TEST-JOBCARD-0-*`, cleaned up, real data confirmed untouched — `modified` timestamps unchanged on the real BOM/Item/Operation):

1. Work Order submit → Job Card `PO-JOB00017` auto-created (`status="Open"`, `docstatus=0`).
2. Time log added, `status` recomputes to `"Work In Progress"`.
3. Job Card submit → succeeds, `status="Completed"`, `docstatus=1`. Parent Work Order status → `"In Process"`.
4. Work Order cancel attempt while Job Card still submitted → **blocked**, exact live error: `LinkExistsError: Cannot delete or cancel because Work Order MFG-WO-2026-00036 is linked with Job Card PO-JOB00017`.
5. Job Card cancel → **succeeds** (no submitted Manufacture Stock Entry existed yet to conflict). `docstatus=2`; `status` field left stale at `"Completed"` (the quirk above).
6. Work Order's own `operations` row for that operation recalculates back down (`completed_qty=0`) via the Job Card's `on_cancel → update_work_order()` call.
7. Work Order cancel retried → **succeeds**, `docstatus=2`.

**Minimum native mechanism needed for a future Ceylon Stack UI**: exactly the same shape as this project's existing BOM/WO cancel pattern — open the blocking Job Card, call the generic `cancelDoc("Job Card", name)` wrapper. No special-casing required for the base case.

**One real ordering dependency, source-confirmed but not live-exercised this session** (`NEEDS_VERIFICATION`): `validate_produced_quantity()` blocks a Job Card's own cancel if a submitted Manufacture Stock Entry already used it for valuation — exact message: *"The Job Card X is used to calculate the valuation cost for the finished good Y. Kindly cancel the Manufacturing Entries first against the work order Z."* This means the real reversal order, once Manufacture Stock Entries exist, is: **cancel Manufacture Stock Entry → cancel Job Card → cancel Work Order** — the same cascade-of-independent-native-cancels pattern already established, not a new architectural shape, but the exact UX/error text for this path wasn't live-reproduced this session (would require a fixture that actually consumes stock through to a Manufacture entry).

## Operation / Workstation dependency — `LIVE VERIFIED`, clear answer

`JOB CARDS CAN PROCEED FIRST`

Live counts on this instance: 2 Operation masters (`Assembly`, `Coating`), 2 Workstation masters (`Assembly Line 1`, `Coating Station`, `production_capacity=1` each), and exactly 1 BOM has Operations attached (`BOM-FG-STEEL-BRACKET-ASSY-001`, 2 rows: Assembly @ Assembly Line 1, 45 min; Coating @ Coating Station, 20 min). Both masters already exist and are populated; Job Card never requires *creating* a new Operation/Workstation, only *linking to* existing ones. A Job Card list/detail/cancel frontend needs read access to Operation/Workstation as reference data (trivial, same shape as any existing Link-field display), not a management UI for them. Adding Operation/Workstation master-data CRUD, if ever needed, is a small separate future package, not a hard prerequisite here.

## Stock / accounting effect — `SOURCE VERIFIED`

**Job Card itself never creates Stock Ledger Entries or GL Entries.** It only produces Stock Entry *documents* (draft, or auto-submitted only if explicitly requested) — the actual SLE/GL trigger is that Stock Entry's own submit, which is this project's already-shipped Complete Production feature. Two mapper paths: `make_stock_entry()` (Job Card + Job Card Items → draft "Material Transfer for Manufacture" Stock Entry, via `get_mapped_doc`, never auto-submitted) and `make_stock_entry_for_semi_fg_item(auto_submit=False)` (→ "Manufacture"-purpose Stock Entry, submitted only if explicitly told to). `manufactured_qty`/`get_consumed_process_loss()` both *read* already-submitted Stock Entries to derive Job Card fields — causality runs Stock Entry submit → Job Card fields updated, never the reverse. A future Job Card UI needs no custom costing logic, only the existing `createDoc`/`submitDoc` wrappers.

## Permissions — `SOURCE VERIFIED` + `LIVE VERIFIED`

Only 3 roles have any access at all: **System Manager, Manufacturing User, Manufacturing Manager** — full create/read/write/delete/submit/cancel/amend/share, no field-level restriction, no workflow states, no separate "operator" role scoped to time-log-only actions. This app's service account (`frontend-integration@ceylonstack.local`) already holds both relevant roles — **no new role provisioning needed.**

## Live data snapshot — `LIVE VERIFIED`

12 Job Cards total: 11 `Open`/draft (never started), 1 `Completed` (the only one ever carried through submit — presumably earlier manual testing, not routine use). 6 of 15 Work Orders have a Job Card; 10 have populated `operations` rows. Only 2 Operation masters, 2 Workstation masters, 1 BOM with Operations. **Signal: Job Card is currently almost entirely a byproduct of Work Order submission on this instance, not an actively-used shop-floor tool** — worth weighing against build priority alongside the rest of the gated Manufacturing backlog (Workstations, OEE).

## `NEEDS_VERIFICATION`

- `MFG-UNV-013` (new) — the exact mechanism/UI for who picks up a Job Card's carried-forward `pending_qty` after a partial completion (a second Job Card? manual re-open?).
- `MFG-UNV-014` (new) — exact error UX when a Job Card cancel is blocked by an already-submitted Manufacture Stock Entry (`validate_produced_quantity()`), not live-reproduced this session.
- `MFG-UNV-015` (new) — whether Work Order's own status display should defensively handle "Job Card cancelled but parent WO status didn't revert" (cosmetic, not a correctness bug in ERPNext, but worth a UX check once a Job Card UI exists).

---

## Proposed Ceylon Stack architecture (design only — not implemented this package)

### Routes

- **`/manufacturing/job-cards`** — list, filterable by status/Work Order/Workstation. Given the live data signal (11/12 untouched drafts), the list's main early job is probably "which Job Cards are actually in progress or completed" more than volume browsing.
- **`/manufacturing/job-cards/[name]`** — detail: header (Work Order/Operation/Workstation links, qty summary), a Time Logs section (read-only list to start, matching the "read/list/detail first" pattern already used for every other Manufacturing doctype in this project), and the Cancel action (the actual motivating capability).
- **Work Order detail's existing Job Cards tab** gets its `name` column turned into a real link to `/manufacturing/job-cards/[name]` (currently deliberately plain text per the pre-existing doc note "no Job Card detail route exists") — this is the natural contextual entry point, consistent with how BOM/Stock Entry links already work elsewhere on that page.

### Suggested package sequence (dependency-ordered, evidence-based, not forced to match the illustrative shape in the brief)

1. **`MFG-JOBCARD-1` — Read-only list + detail + Work Order contextual link. `SHIPPED` (2026-09-23).** Zero lifecycle actions, as scoped. `docstatus`-derived state (`jobCardStatus()` in `lib/erpStatus.ts`), not the raw `status` field, per the quirk above — live-QA'd. Work Order detail's Job Cards tab and the Work Order Cancel blocker-preview message both now link a Job Card name to the real detail route instead of plain text.
2. **`MFG-JOBCARD-LC-1` — Cancel.** The actual motivating capability (unblocks Work Order cancel without Desk). Native `cancelDoc("Job Card", name)`, same defense-in-depth re-fetch/re-check pattern as every prior lifecycle package this project has shipped. Needs `MFG-JOBCARD-1`'s detail page to exist first (a Cancel action needs somewhere to live). Should surface `validate_produced_quantity()`'s rejection message (see `MFG-UNV-014`) via the same `humanizeCancelError` pass-through pattern, not a custom message.
3. **`MFG-JOBCARD-2` — Time-log/execution actions** (`start_timer`/`pause_job`/`resume_job`/`complete_job_card`). Bigger scope — this is the actual shop-floor execution UX, not just lifecycle plumbing, and given the live-data signal that Job Card is barely used today, this is reasonably deferred until there's a concrete operational need, rather than assumed urgent.
4. **`MFG-OPERATION-1` / `MFG-WORKSTATION-1`** — not required before any of the above (see "Operation/Workstation dependency"); only worth scoping if the business needs to add a 3rd operation/workstation, independent of Job Card's own timeline.

Recommended next package: **`MFG-JOBCARD-LC-1`** — Cancel is the package that actually closes the "Desk dependency" gap this whole investigation was motivated by, and its hard prerequisite (`MFG-JOBCARD-1`'s detail page) is now shipped.

### Operator experience (derived from the actual lifecycle, not assumed)

For the two packages above (`MFG-JOBCARD-1`/`LC-1`), the real flow is short because there's no execution UI yet: **Work Order detail → Job Cards tab → click a Job Card name → detail page → if submitted and blocking a Work Order cancel, click Cancel → return to Work Order, cancel succeeds.** A future `MFG-JOBCARD-2` would add: detail page → Start → (shop floor performs work) → enter completed qty/time → Complete — mapping directly onto `start_timer`/`complete_job_card`, not an invented sequence.

### Mobile-readiness (architectural only, not built)

Time-log entry (`MFG-JOBCARD-2`, when it happens) is the piece that will actually run on a shop-floor tablet/phone — worth keeping in mind now: (1) `start_timer`/`complete_job_card` take a minimal payload (qty, optional employee/time), which maps well to large single-purpose touch targets rather than a dense form; (2) `employee` is optional and multi-select-capable server-side, which could later support a "who's logged in at this workstation" tablet-mode pattern without a schema change; (3) nothing in the native model assumes barcode/QR input, so that would be a pure frontend addition (e.g. scanning a Job Card ID into a search box) with no backend dependency. None of this needs deciding now — just noting it doesn't conflict with anything in `MFG-JOBCARD-1`/`LC-1`'s scope.

### Future OEE data contract (architectural only, not built)

Trustworthy fields/events a future OEE package could read without needing a second execution model: `time_logs[].from_time`/`to_time`/`time_in_mins` (runtime), gaps between a Job Card's `pause_job`/`resume_job` calls (downtime), `Workstation`'s own capacity fields cross-referenced with scheduled vs. actual time logs (utilization), `for_quantity` vs. `total_completed_qty`/`process_loss_qty` (yield/reject). All of this already exists natively once any Job Card time-logging happens — OEE would be a read-only aggregation layer over data Job Card already produces, not a feature requiring its own tracking mechanism.
