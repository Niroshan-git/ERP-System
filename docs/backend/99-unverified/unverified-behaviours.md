# Unverified Behaviours

Per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §6. Never invent Frappe behavior — anything
uncertain is logged here with how it should be verified. This must never block delivery.

## MFG — Manufacturing

### MFG-UNV-001 — Work Order Desk list-view indicator colors not independently confirmed
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** `apps/frontend/src/lib/erpStatus.ts`'s `WORK_ORDER_STATUS_TONE` map (Draft/
Submitted/Not Started/In Process/Stock Reserved/Stock Partially Reserved/Completed/Stopped/
Closed/Cancelled → tone) is this app's own reasonable mapping onto its 3-tone system. Unlike
every other status function in that file, it was **not** built by reading `work_order_list.js`'s
real `get_indicator` source (no SSH/devops access in the session that built it) — only the
`status` field's enum itself was live-verified via `get_doctype_fields`.
**How to verify:** SSH to the Hetzner instance, read
`erpnext/manufacturing/doctype/work_order/work_order_list.js`'s `get_indicator` function body
directly (same method already used for every other status function in `erpStatus.ts`), then
compare/update the tone map to match.

### MFG-UNV-002 — Item Alternative substitution path unexercised end-to-end
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** Confirmed by source reading only (`item_alternative.py`,
`get_alternative_items`, `Stock Entry Detail.original_item`/`allow_alternative_item`) — the
mechanism exists in ERPNext, but no `Item Alternative` records exist on this instance and no item
has `allow_alternative_item` set, so it has never been exercised live.
**How to verify:** Set up `Item Alternative` master data + `allow_alternative_item` on a real item
and BOM, then live-test a substitution through a Material Transfer for Manufacture Stock Entry.

### MFG-UNV-003 — `transfer_extra_materials_percentage` headroom behavior above 0%
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** Only the `0%` (no headroom) case has been live-tested (excess-quantity
transfer correctly rejected). The actual headroom arithmetic when this `Manufacturing Settings`
value is non-zero has not been exercised.
**How to verify:** Set `transfer_extra_materials_percentage` to a non-zero value on a test/staging
instance and re-run the excess-quantity transfer scenario from
`docs/backend/05-manufacturing/material-transfer.md`'s test scenarios.

### MFG-UNV-004 — Job Card document lifecycle
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** Job Card fields are read (via the Work Order detail page's Job Cards tab
and `apps/mcp-server`'s `get_job_card_detail`/`list_job_cards` tools) but Job Card's own
Create/Save/Submit/Cancel lifecycle, validations, and downstream effects (time logs, operation
completion, OEE feed) have not been investigated.
**How to verify:** Scoped investigation when the Job Card frontend package is picked up, per the
Current Mission priority lock.

*(BOM's own lifecycle was split out into `MFG-UNV-009` below after the 2026-09-19 BOM domain
investigation narrowed — but did not fully resolve — what's uncertain.)*

### MFG-UNV-009 — BOM document lifecycle, multi-level explosion, and costing recompute
**Status:** `NEEDS_VERIFICATION` (schema-verified, behavior-unverified — narrowed from the
former `MFG-UNV-004` by the 2026-09-19 Manufacturing Masters (BOM) investigation package, which
concluded Gate B: no usable BOM frontend exists, so this remained read-only investigation)
**What's confirmed** (live `get_doctype_fields`/`list_documents`, 2026-09-19): BOM is a
submittable doctype (`amended_from` field present); the one real BOM on this instance is
`docstatus: 1`; `BOM Item`/`BOM Operation` are genuine child entities; `BOM Item.bom_no` is the
schema-confirmed nested/sub-assembly BOM pointer; costing fields (`raw_material_cost`,
`total_cost`, etc.) are real and backend-computed. Full detail in
`docs/backend/05-manufacturing/bom.md`.
**What's still uncertain:** (1) actual Draft→Submit→Cancel→Amend validation and downstream effects
on Work Orders/Job Cards already referencing a since-cancelled/amended BOM — no write/transition
was exercised, per this investigation's read-only, no-backend-modification scope; (2) real
multi-level BOM explosion, circular-reference protection, and default-BOM selection for a
multi-BOM sub-assembly item — the one real BOM has zero sub-assembly components, so there is no
real nested data to observe; (3) BOM costing's actual recompute trigger (Desk "Update Cost"
action vs. scheduled job vs. submit-time only) and whether the one real BOM's `total_cost`
currently reflects live valuation rates; (4) phantom/semi-finished BOM behavior at
stock-transaction time — `bom.md`'s Status/configuration fields table flags `is_phantom_bom`
(phantom BOMs are exploded through at stock-transaction time and never appear as their own stock
item) and `track_semi_finished_goods` (per-operation semi-finished-goods tracking) as
schema-confirmed fields whose actual transaction-time behavior is unexercised — the one real BOM
does not use either; (5) Production Plan's actual runtime relationship with BOM — `bom.md`'s
"Production Plan relationship" section confirms `Production Plan` (+ its child doctypes) is a
real, independent `Manufacturing`-module doctype via `list_doctypes`, but this is schema
existence only, not runtime verification: `apps/frontend` has zero Production Plan footprint (no
route, action file, or component), so no representative Production Plan → BOM consumption →
resulting manufacturing behavior (Work Order/Material Request generation, sub-assembly explosion)
has been observed.
**2026-09-19 update (Manufacturing Masters — BOM Package 4A):** a read-only BOM entity frontend
(`/master-data/boms`, `/master-data/boms/[name]`) now exists and displays this doctype's header,
status/lifecycle (docstatus-derived Draft/Submitted/Cancelled), components, operations, and
backend-recorded costing fields — see `docs/backend/05-manufacturing/bom.md`'s "Frontend
capability" section. This is a **display-only** change and does not resolve any of the four
numbered uncertainties above: no lifecycle transition, multi-level explosion, cost recompute, or
phantom/semi-finished-goods stock transaction was performed or observed. The one real BOM on this
instance (`BOM-FG-STEEL-BRACKET-ASSY-001`) still has zero sub-assembly components, so nested-BOM
entity-link rendering (`BOM Item.bom_no` → `/master-data/boms/[bom_no]`) was verified only for
route/link construction, not against real nested data — remains `NEEDS_VERIFICATION`.

**2026-09-19 update (BOM Package 4B remediation — CX-MFG-BOM-4B-001/002):** source-verified (not
live-verified) that `is_active`/`is_default` are marked `allow_on_submit: 1` on the `BOM` DocType
and that `on_update_after_submit()` calls `manage_default_bom()` — see `bom.md`'s "Verified
lifecycle and availability rules" section. The frontend now exposes narrow Activate/Deactivate and
Set as Default actions on a submitted BOM (`activateBomAction`/`deactivateBomAction`/
`setDefaultBomAction` in `master-data/boms/actions.ts`) built on that verified contract. This does
**not** resolve uncertainty (1) above: the actual runtime effect of deactivating a BOM (or changing
its default) on Work Orders/Job Cards that already reference it was not exercised — no live write
access existed this session either. Uncertainty (1) is read as covering deactivation as well as
cancel/amend, not just the latter.

**How to verify:** Scoped investigation (and any resulting write-testing) when a BOM Management
frontend package is separately authorized and built, per the Current Mission priority lock —
not before, since no such package exists to exercise these paths against. For (4) specifically:
configure a real phantom BOM (`is_phantom_bom`) and/or a `track_semi_finished_goods` BOM on the
dev instance, then submit a Stock Entry or Work Order that consumes it and inspect whether the
phantom item is exploded through (never appearing as its own stock movement) as documented. For
(5): build or exercise a representative `Production Plan` against the real BOM, then trace its
resulting Work Order/Material Request generation and any sub-assembly BOM explosion it triggers.

### MFG-UNV-012 — Production Plan runtime behavior (no live document exists)
**2026-09-21 update (PP-8 — Cancel, live test, resolving the two items PP-6 had left open):**
`cancelProductionPlanAction` shipped (`docstatus` 1→2 via the existing generic `cancelDoc()`).
Live-verified against the real Hetzner instance: (a) a **Submitted Work Order** blocks Production
Plan cancel via `LinkExistsError`, the same generic mechanism already confirmed for Submitted
Material Request — this app's own proactive guard (`getConnections("Production Plan", name)`,
via a new `CONNECTION_CONFIG` entry in `lib/connections.ts`) detects it first and returns a named
message instead of the raw error; (b) a **Draft Material Request** does *not* block cancel (unlike
Work Order's Draft-auto-delete cascade, it is left completely as-is — not deleted, not cancelled,
silently orphaned with a dangling reference to the now-Cancelled plan), a genuine asymmetry now
confirmed rather than assumed from source; (c) re-confirmed, independently, that a Draft Work Order
is auto-deleted and a Submitted Material Request blocks cancel (both previously established by
PP-5/PP-6). No cleanup/orphan-handling for the Draft Material Request case was implemented — out of
PP-8's scope by design, recorded here as a real, live-confirmed native behavior for a future package
to account for if it's ever judged worth fixing. Subcontract Purchase Order's own cancel-blocking
behavior remains `SOURCE VERIFIED / NOT RUNTIME VERIFIED` (the `CONNECTION_CONFIG` entry is wired,
structurally identical to the verified Material Request case, but no live subcontract PO data exists
on this instance). Reserve Stock/Stock Reservation Entry's un-reservation-on-cancel behavior remains
`NEEDS_VERIFICATION` (moot for any plan this app's own create form can produce, since it never sets
`reserve_stock`). Full detail, including exact test-plan names and side-effect verification (zero
`GL Entry`/`Stock Ledger Entry` created), in `production-plan.md`'s new "Cancel (PP-8...)" section.
**Status:** `NEEDS_VERIFICATION`, **partially resolved 2026-09-20 (PP-2, then further narrowed and
live-verified by PP-3, PP-4, PP-5, and PP-6, all same day)** — demand sourcing and Draft creation
are live-confirmed (PP-2, see below); submit lifecycle is now `LIVE VERIFIED` and implemented
(PP-3, see below); sub-assembly explosion (`get_sub_assembly_items`) and single-warehouse
raw-material shortage calculation (`get_items_for_material_requests`) are now `LIVE VERIFIED` and
implemented (PP-4, see below); finished-good Work Order generation (`make_work_order`) is
`LIVE VERIFIED` and implemented (PP-5), including a live-confirmed duplicate-generation finding
(re-running the action before submitting the Work Order it just created generates a second
full-quantity one) and a live-confirmed cancel-cascade (cancelling the source Production Plan
hard-deletes any still-Draft Work Order it created) — see `production-plan.md`'s "Work Order
Generation (PP-5)" section; **finished-good Material Request generation (`make_material_request`)
is now `LIVE VERIFIED` and implemented (PP-6)**, including a live-confirmed duplicate-generation
finding of its own (re-running the action before submitting the Draft Material Request it just
created generates a second full-quantity one — the same class of gap as Work Order, but via a
different mechanism: `requested_qty` only updates on `Material Request.on_submit()`) and a new,
unplanned finding: cancelling the source Production Plan is **blocked** (`LinkExistsError`) while a
Submitted Material Request it created still exists — the opposite of Work Order's auto-delete
cascade, since `on_cancel()` has no Material-Request-deletion step at all — see
`production-plan.md`'s "Material Request Generation (PP-6)" section. Cancel's safe-path behavior is
live-confirmed as test cleanup but not shipped as an app feature; amend was investigated but
deliberately left unimplemented; stock reservation (beyond confirming `reserve_stock=0` is a
no-op), sub-assembly/subcontract Work Order generation (no test data exists on this instance), and
multi-location "Get Items for Purchase / Transfer" remain entirely unexercised and unimplemented.

**2026-09-20 update (PP-6 — Material Request generation, source read + live test):** full source
read of `services/material_request.py`'s `MaterialRequestService.make_material_request()`,
`erpnext/stock/doctype/material_request/material_request.py` (`on_submit()`/
`update_requested_qty_in_production_plan()`), `hooks.py`'s `doc_events` wiring, and
`production_plan.js`'s `make_material_request`/`create_material_request` handlers — see
`production-plan.md`'s "Material Request Generation (PP-6)" section for full detail. Key
resolutions: (a) `make_material_request` is Document-bound (`run_doc_method`, same boundary as
`make_work_order`) but, unlike `make_work_order`, has **no `self.doc.reload()`** — it trusts
whatever `mr_items` the caller's payload carries, making the caller (this app's server action) the
entire trust boundary against a tampered quantity; (b) grouping is by `(sales_order,
material_request_type)` — live-confirmed one Production Plan can and did produce multiple distinct
Material Requests when those differ, one when they don't; (c) `requested_qty` (the field the
qty-to-request math nets against) is incremented **only** by `Material Request.on_submit()`, not by
mere Draft creation — live-confirmed: a Draft Material Request left `requested_qty` at `0`, and
re-running the action created a second full-quantity duplicate; auto-submitting
(`submit_material_request: 1`) increments it immediately, and a follow-up call correctly created
zero new documents; (d) a real, live-reproduced bug was found in this app's own diffing helper
during testing (not an ERPNext bug): the nested `[Material Request Item, production_plan, =,
<name>]` list filter returns one PARENT row per MATCHING CHILD row, not one per distinct parent —
fixed in `productionPlanMaterialRequest.ts`/`page.tsx` before shipping (dedupe by `name`); the
**same pattern also existed in the accepted PP-5 code**
(`productionPlanWorkOrder.ts`'s `listSubcontractPurchaseOrderNames`, `Purchase Order Item`) — not
fixed here (out of this package's scope; no live sub-assembly/subcontract data exists to have
triggered it yet), flagged for a future remediation package. **Fixed 2026-09-20 (PP-5R):** same
`[...new Set(...)]` dedupe applied to `listSubcontractPurchaseOrderNames`; still SOURCE VERIFIED /
NOT RUNTIME VERIFIED for the duplicate-parent-row case specifically, since no live
sub-assembly/subcontract data exists on this instance to exercise it end-to-end — see
`production-plan.md`'s "PP-5R remediation" note.

**2026-09-20 update (PP-7 — multi-level BOM/subassembly discovery, source read only, runtime
blocked):** full source read of `get_sub_assembly_items` (both the Document-bound method and the
recursive module-level helper), `get_items_for_material_requests`, `make_work_order` and its
`make_work_order_for_finished_goods`/`make_work_order_for_subassembly_items`/
`make_subcontracted_purchase_order` helpers, directly against the real installed
`production_plan.py` on the live instance — see `production-plan.md`'s "Multi-Level BOM &
Subassembly Runtime Qualification (PP-7)" section (§HH–OO) for full detail. Key resolutions,
`SOURCE VERIFIED / RUNTIME DEFERRED` (not live-confirmed — see blocker below): (a) **contrary
evidence, per governance**: prior PP-4/PP-5/PP-6/PP-5R entries cite a
`production_plan/services/*.py` file split that does not exist on the real instance — all these
methods live directly in `production_plan.py`; the behavioral claims themselves independently
re-verified true, only the file-path citations were wrong (§HH); (b) `make_work_order` confirmed
from source to generate Work Orders for **both** finished goods and subassemblies in the same call,
plus subcontracted Purchase Orders for `Subcontract`-typed subassembly rows (§II); (c) subassembly
Work Orders get `production_plan` + `production_plan_sub_assembly_item` set but **never**
`production_plan_item` — a real, confirmed asymmetry with finished-good Work Orders (§JJ); (d)
multi-level BOM explosion is genuinely recursive to arbitrary depth, not a fixed 2-level assumption
(§KK); (e) `skip_available_sub_assembly_item` is a read-only `Bin.projected_qty` check whose stock
reduction **cascades down the entire subtree** beneath a fully-covered subassembly, not just that
one row (§KK — a previously undocumented multi-level behavior); (f) a third
`type_of_manufacturing` value, `"Material Request"`, exists alongside `"In House"`/`"Subcontract"`
and routes a subassembly straight into Material Request generation instead of Work Order generation
(§LL); (g) PP-5's live-confirmed finished-good duplicate-generation mechanism reads from source as
equally applicable to subassembly Work Orders (same underlying `get_pending_quantities()` call),
but this is a source inference, not runtime-confirmed for the subassembly case (§NN). **Superseded
2026-09-21 (PP-7R):** the runtime block below was session-specific, not a standing restriction — see
the PP-7R update further down for the completed live test that promotes (b)–(f) above to `LIVE
VERIFIED`.

**Blocked, not skipped:** the controlled runtime test (temporary `PP7-TEST-*` Items/BOMs/Sales
Order/Production Plan, same authorized pattern as PP-4's live test data) was attempted against the
same Hetzner instance every prior package used — environment identity confirmed unambiguous — but
the write step was denied by this session's own sandbox permission classifier ("Remote Shell
Writes") before any record was created. No test data exists on the instance; nothing needed
cleanup. Sub-assembly/subcontract Work Order generation, multi-level Material Request flattening,
`skip_available_sub_assembly_item`'s stock-cascade behavior, and subassembly duplicate-generation
therefore all remain `SOURCE VERIFIED / RUNTIME DEFERRED`, not promoted to `LIVE VERIFIED` — the
next attempt needs either this environment's write permission granted, or the same test run
performed from a session/tooling context without that restriction.

**2026-09-21 update (PP-7R — controlled multi-level runtime qualification, live test,
completing PP-7):** the write-permission blocker recorded in the PP-7 update below was specific to
that prior session's sandbox classifier, not a standing restriction — a follow-up session confirmed
both SSH and Frappe-console write capability (verified with a throwaway, immediately-deleted test
Item before any fixture work began) and completed the runtime test PP-7 could not. Full evidence,
fixture detail, and side-effect audit in `production-plan.md`'s new "§PP. PP-7R" section. **Promoted
to `LIVE VERIFIED`**: (a) multi-level BOM explosion is genuinely recursive against a real two-level
fixture (FG → SUB → RM-A/RM-B, plus FG → RM-C directly) — `get_sub_assembly_items` produced exactly
one `PP7-TEST-SUB` row (`qty: 20` for 10 planned FG), correctly omitting the non-BOM `RM-C` leaf; (b)
multi-level material-requirement flattening — `get_items_for_material_requests` returned exactly
`RM-A: 80`, `RM-B: 100`, `RM-C: 30`, matching the hand-computed expectation for the full two-level
tree exactly; (c) `make_work_order` generates both a finished-good and a subassembly Work Order in
one call, live-confirmed for the first time (`MFG-WO-2026-00010`/`-00011`); (d) the
`production_plan_item` XOR `production_plan_sub_assembly_item` asymmetry between FG and subassembly
Work Orders is live-confirmed, not just source-derived; (e) **CX-MFG-PP7-DISC-002 resolved**: a
subassembly Work Order's `fg_warehouse` is the header `sub_assembly_warehouse` override, not the
company default (`MFG-WO-2026-00011` persisted `fg_warehouse: "Work In Progress - CS"`, the
deliberately-distinct override value, not the company's `Finished Goods - CS` default) —
`production-plan.md`'s §JJ text claiming otherwise was wrong and has been corrected; (f)
**CX-MFG-PP7-DISC-001 resolved**: `get_bom_children` performs no BOM-selection logic itself, it
only reads the `bom_no` already stored on a BOM Item row (confirmed live: `BOM-PP7-TEST-FG-001`'s
`PP7-TEST-SUB` row carried `bom_no: "BOM-PP7-TEST-SUB-001"` immediately on save, before any
explosion method ran); (g) **CX-MFG-PP7-DISC-004 refined**: `skip_available_sub_assembly_item`
defaults to *enabled* (`"default": "1"`, previously undocumented — live-confirmed by the
"Please select the Sub Assembly Warehouse" throw on first attempt), and its stock-check is not a
simple cache-and-reuse — a closer source re-trace (not itself runtime-exercised; the fixture
deliberately carried zero stock per governance) found the working balance resets per occurrence
until a single occurrence exceeds it, at which point that item_code is exhausted for the rest of
the document, not just that branch — see `production-plan.md`'s §KK correction for the full
mechanics; (h) **CX-MFG-PP7-DISC-003 resolved** — a fresh pre-test positive-absence sweep
independently reproduced the original reviewer's zero-everywhere finding. **Still `SOURCE VERIFIED /
RUNTIME DEFERRED`, not promoted**: `skip_available_sub_assembly_item`'s actual stock-sufficiency/
exhaustion branch (needs non-zero stock, out of this package's scope), subassembly
duplicate-generation on a second `make_work_order` call (deliberately not performed — no
acceptance-relevant benefit, added cleanup risk), subcontract-typed subassembly rows (explicitly
out of scope), and any concurrency/high-volume behavior. All test data (`PP7-TEST-*` Items, both
BOMs, the Sales Order, the Production Plan, both Draft Work Orders) was fully cleaned up and a
post-cleanup absence sweep confirmed zero residual rows. No application code was changed — this is a
documentation/evidence-only package; final PP-7 acceptance still requires independent review.

**2026-09-20 update (PP-4 — sub-assembly explosion + raw-material calc, source read + live
test):** full source read of `services/sub_assembly.py`, `services/sub_assembly_queries.py`,
`services/material_request.py`, `services/planning_queries.py`, and
`production_plan.js`'s corresponding button handlers — see `production-plan.md`'s "Sub-Assembly
Planning + Material Requirements (PP-4)" section for the full detail. Key resolutions: (a)
`get_sub_assembly_items` is a Document-bound whitelisted method that mutates only the in-memory
document (no `frappe.db`/`.save()` call anywhere in it), confirmed live against a real *saved*
Draft (`MFG-PP-2026-00005`) — re-fetching the document immediately after the call showed nothing
persisted; (b) `get_items_for_material_requests` is a *different* kind of whitelisted method — a
free-standing module-level function, not Document-bound — confirmed to make zero persistence
calls of any kind (it never even constructs a `Document`, just a plain dict), live-confirmed the
same way; (c) this app's own explicit "Save" step (a plain `updateDoc` field `PUT`) was
live-confirmed not to trigger `update_bin_qty()` or any other side effect — the real `Bin` row for
the test item/warehouse was byte-identical before and after saving 3 real computed `mr_items` rows
to the Draft, narrowing the existing "only submit/cancel/close call `update_bin_qty()`" claim from
source-derived to live-confirmed for a Draft field save specifically; (d) `get_sub_assembly_items`
returning an empty result for the one real BOM on this instance (`BOM-FG-STEEL-BRACKET-ASSY-001`,
which has zero sub-assembly components) exercised and confirmed the "valid empty result, not a
defect" path only — a BOM with sub-assemblies has still never been observed on this instance, so
real multi-level explosion (`bom_level > 0`, `type_of_manufacturing: "Subcontract"`/`"Material
Request"` branches) remains entirely unexercised, same gap `MFG-UNV-009`(4)/(5) already flagged
for BOM itself. Make
Work Order, Make Material Request, `reserve_stock`, and multi-location "Get Items for Purchase /
Transfer" were not implemented or independently investigated this pass — still `NEEDS_
VERIFICATION`. A clarification the PP-4 package brief asked to carry into `production-plan.md`
about Cancel's behavior against externally-linked submitted downstream documents was recorded with
its evidence provenance disclosed (not independently re-verified this session) — see
`production-plan.md`'s §C.1; this does **not** change Cancel's still-unshipped status.

**2026-09-20 update (PP-3 — submit lifecycle, source read + live test):** full source read of
`production_plan.py`'s `on_submit()`/`on_cancel()`, `production_plan.json` (doctype metadata:
`is_submittable: 1`, zero `allow_on_submit` fields), `production_plan.js` (Desk client script
button-visibility gates), and `services/reservation.py` — see `production-plan.md`'s "Submit /
Cancel / Amend lifecycle" section for the full matrix and evidence. Key resolutions: (a) submit
itself never creates a Work Order, Material Request, Purchase Order, or Stock Reservation Entry,
and posts no GL/Stock Ledger Entry — its only real side effect for a Production Plan this app can
currently create is writing `Sales Order Item.production_plan_qty` back onto the source Sales
Order (when Sales-Order-sourced), plus a Bin reserved-qty write that is a guaranteed no-op today
since `mr_items`/`sub_assembly_items` are always empty for an app-created plan; (b) uncertainty
(3) from the original filing is resolved for `get_sub_assembly_items` specifically — it is gated
`docstatus == 0` (Draft-only) in the doctype JSON, not Submitted-only; `make_work_order`/
`make_material_request` remain confirmed Submitted-only (Desk-JS-level gate, not a `.py`-level
assertion — still a UI convention, not a hard backend guarantee); (c) uncertainty (4) is now more
precise: `reserve_stock` at submit calls `reserve_stock_for_production_plan()`, which **does**
create real `Stock Reservation Entry` documents (a document-creation side effect, not merely a
Bin field write) — but this app's create form never sets `reserve_stock`, so it's moot for any
plan this app builds.

**Live-verified same day**, with the user's explicit go-ahead: a full round trip against the real
Hetzner instance — create a real Draft (`MFG-PP-2026-00004`, from `SAL-ORD-2026-00007`, the same
Sales Order PP-2's own live test used) → submit it via the exact `submitDoc()` REST mechanism →
confirm `Sales Order Item.production_plan_qty` went `0.0` → `30.0` with zero `Bin`/`Stock Ledger
Entry`/`GL Entry`/`Work Order`/`Stock Reservation Entry` change → cancel it (direct `docstatus: 2`
REST call, test cleanup only, Cancel is not a shipped feature) → confirm `production_plan_qty`
reverted to `0.0` with everything else still unchanged. Every row of the submit side-effect
matrix is now `LIVE VERIFIED`, not merely source-derived. Submit is implemented
(`submitProductionPlanAction`, reusing the existing `submitDoc()` REST mechanism already proven
for every other submittable doctype in this app). Cancel's *safe-path* behavior (a plan with no
downstream Work Orders/Material Requests, `reserve_stock=0`) is now live-confirmed to work exactly
as `on_cancel()`'s source predicts, but Cancel is still **not shipped as an app feature**: this
test plan never had any downstream Work Order/Material Request, so uncertainty (1) below — whether
Frappe's *generic* submitted-document cancel-block additionally applies when an external,
non-Ceylon-Stack-created submitted Work Order/Material Request links back to the plan — remains
untested and `NEEDS_VERIFICATION`. Amend remains discovery-only (`amended_from` +
`is_submittable: 1` confirm the standard pattern exists; not implemented, not justified as
trivial while Cancel is still locked as a feature).
**ID note (2026-09-19):** originally filed as `MFG-UNV-010`, which collided with the pre-existing
BOM detail-page verification item below of the same ID (`CX-MFG-PP-004`). Renumbered to
`MFG-UNV-012` — the BOM item keeps its original `MFG-UNV-010` identity unchanged, since it was
filed first (commit `ad8ad92`); every cross-reference to the Production Plan item across the
repository was updated atomically to match.
**What's confirmed** (2026-09-19 Production Planning discovery package — live
`get_doctype_fields`/`list_documents` + read-only `frappe/erpnext` GitHub source for
`production_plan.py` and its `services/` submodules, no live write access, no ERPNext core files
touched): full header/child-table schema; that Production Plan is submittable
(`amended_from` present); that Sales Order eligibility is `docstatus=1` + an active BOM +
`stock_qty - stock_reserved_qty > work_order_qty`; that `combine_items` groups by `bom_no` and
records the original Sales Order breakdown in `prod_plan_references`; that the finished-good
Production Plan row's BOM selection (`po_items.bom_no`) resolves as `SalesOrderItem.bom_no or
Item.default_bom` and is user-editable/overridable afterward (multi-BOM support, consistent with
`bom.md`'s `Item 1───<BOM` finding) — this applies specifically to `po_items.bom_no`, not to every
BOM-bearing Production Plan field: `sub_assembly_items.bom_no` is server-derived from explosion and
not confirmed independently user-selectable, and `mr_items.from_bom` is read-only source-BOM
traceability, never a frontend selector (see `production-plan.md`'s "Multiple-BOM support"
section for the full distinction); that sub-assembly explosion is entirely
server-side and branches on `type_of_manufacturing` (In House → Work Order, Subcontract →
consolidated Purchase Order, Material Request → no Work Order); that
`skip_available_sub_assembly_item` skips creating a sub-assembly row when the sub-assembly
warehouse already has enough projected qty; that the raw-material shortage formula is
`max(0, required_qty - (available_qty - safety_stock))` with `available_qty` sourced from Bin
`projected_qty` only when `ignore_existing_ordered_qty` is checked; that Work Order generation is
one-per-`po_items`-row/one-per-in-house-`sub_assembly_items`-row with quantity-based (not hard)
duplicate prevention; that the Production Plan → Material Request back-reference lives on
`Material Request Item` (`production_plan`, `material_request_plan_item`), never on the `Material
Request` parent doctype. Full detail in `docs/backend/05-manufacturing/production-plan.md`.
**Live-confirmed 2026-09-20 (PP-2 create flow):** a full `get_open_sales_orders` → `combine_so_items`
→ plain `createDoc` round-trip against the real instance created an actual Draft
`MFG-PP-2026-00001` from a real, live Sales Order (`SAL-ORD-2026-00007`, item
`FG-STEEL-BRACKET-ASSY`, BOM `BOM-FG-STEEL-BRACKET-ASSY-001`), with `po_items` and
`total_planned_qty` (30) computed correctly by ERPNext itself, then deleted as cleanup. This
confirms: the Sales Order eligibility/pending-qty query, `po_items.bom_no` resolution, and Draft
persistence all behave as documented. See `production-plan.md`'s `MFG-PP2-001` for the
`run_doc_method` payload requirement this also surfaced (needs explicit `name`/`__islocal`/
`__unsaved` on an unsaved-doc payload, or the live instance 404s).
**What's still uncertain:** (1) everything **beyond the create/submit/sub-assembly-planning/
finished-good-Work-Order-generation flows now shipped (PP-2 through PP-5)** remains source-derived,
not live-observed — Make Material Request generation, sub-assembly/subcontract Work Order
generation, and stock-reservation lifecycle have not been run and inspected; (2) a confirmed schema
drift exists between the fetched GitHub source and the live instance — the source's Material
Request auto-submit path reads `self.doc.get("submit_material_request")`, but no such field exists
in the live `Production Plan` schema, meaning the installed ERPNext version is close to but not
identical to the fetched branch, so any source-derived claim could have similar small drifts
elsewhere; (3) **partially resolved (PP-5, 2026-09-20):** `make_work_order` is now live-confirmed
to carry **no server-side `docstatus`/`status` assertion of any kind** — the `docstatus = 1` gate
is exclusively Desk `.js`/button-visibility, exactly as already suspected for `get_sub_assembly_items`.
`make_material_request` was not re-checked this pass and remains open on the same question; (4)
`reserve_stock_for_production_plan` (Stock Reservation Entry creation) was not read — `reserve_stock`'s
full effect beyond the `Bin` reserved-qty update is unconfirmed; (5) **resolved (PP-5, 2026-09-20):**
`Purchase Order Item.production_plan` (Link → Production Plan) is now **live-schema-confirmed**
via `get_doctype_fields` against the real instance — the back-reference lives on the child row
(`Purchase Order Item`), not the parent `Purchase Order` doctype, matching the Python read exactly.
The actual subcontract-PO creation flow itself remains source-only — no Subcontract-type
sub-assembly row exists on this instance to exercise it live (see `production-plan.md`'s "Work
Order Generation (PP-5)" §W).
**How to verify:** Sales Order → Draft Production Plan creation (PP-2), Submit (PP-3), and Get Sub
Assembly Items / Get Items for Purchase Only (PP-4) are all now live-verified. Cancel needs
Frappe's generic submitted-document cancel-block behavior read/tested before it can be shipped as
a feature — specifically whether cancelling is blocked when an externally-created (Desk, not this
app) submitted Work Order/Material Request still links back to the plan; PP-3's own live cancel
test used a plan with no such downstream documents, so this specific case remains open (the PP-4
package brief asked this session to record an upstream claim about this exact mechanism —
`LinkExistsError`/backlink checking — but that claim's evidence provenance was disclosed rather
than treated as independently re-verified; see `production-plan.md`'s §C.1). The remaining
multi-level-explosion/downstream-generation gap needs a BOM with at least one sub-assembly
component (none exists on this instance yet) run through: Get Sub Assembly Items (now real, not
hypothetical — PP-4 ships it) → Make Work Order/Make Material Request → downstream generation,
comparing actual results against the formulas/rules documented in `production-plan.md`. Do this
once a Production Plan generation-action package (a future package, explicitly out of scope for
PP-4) exists.

### MFG-UNV-005 — Accounting (GL) impact of Material Transfer for Manufacture
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** A submitted Material Transfer for Manufacture Stock Entry is known to move
stock (source warehouse → WIP warehouse, live-confirmed via `Bin.actual_qty` and Work Order
`transferred_qty`), but the resulting GL Entry (debit/credit account roles, whether it posts at
all given this is a stock-to-stock transfer rather than a stock-to-expense one) has not been
inspected on this instance.
**How to verify:** Submit a real Material Transfer for Manufacture Stock Entry on the dev instance
and inspect the resulting `GL Entry` rows directly (`bench console` or Desk's own GL Entry report).

### MFG-UNV-006 — `+ Add Material` doesn't pre-check already-fully-transferred lines
**Status:** `NEEDS_VERIFICATION` (flagged non-blocking by `code-reviewer` during Package 5)
**What's uncertain:** `MaterialTransferForm.tsx`'s "+ Add Material" lets a user re-add an item
whose required quantity is already fully transferred, tagging it `ADDITIONAL` client-side before
ERPNext's own server-side check would reject it as excess (under the current 0% headroom). Purely
a client-side pre-check gap — ERPNext's own submit-time validation is still authoritative — but
not fixed, since it was judged cosmetic.
**How to verify:** Not urgent; revisit if headroom (`MFG-UNV-003`) is ever raised above 0%, which
would change how "already satisfied" is judged client-side too.

### MFG-UNV-007 — Work Order Operation field-copy convention on create
**Status:** `NEEDS_VERIFICATION`, non-blocking (Codex governance-closure finding `CX-MFG-002`;
first fix 2026-09-17 returned `CHANGES REQUIRED`; re-fix 2026-09-18 returned `CHANGES REQUIRED`
again on the costing/BOM-reference mapping specifically; final correction 2026-09-18 accepted by
Codex's final re-review — `CX-MFG-002` is `CLOSED` as a finding, commit `a2b5cb8` — but the
underlying field-copy convention documented here still carries open, non-blocking runtime
verification; see `docs/backend/05-manufacturing/work-order.md`'s Work Order Operation table and
`MFG-VAL-006`)

**Source/schema-verified (via `get_doctype_fields` against the installed instance, 2026-09-18):**
- `BOM Operation` has both `hour_rate` (Currency, linked to the BOM's transaction currency) and
  `base_hour_rate` (Currency, explicitly labelled "Base Hour Rate (Company Currency)").
- `Work Order Operation.hour_rate` is a plain `Float` with no currency-link `options` at all —
  i.e. it is not transaction-currency-aware, consistent with it being meant to hold the
  company-currency value.
- `Work Order Operation` has its own `bom` field (Link → BOM) with no equivalent field on `BOM
  Operation` — `BOM Operation`'s own owning-BOM reference is the Frappe child-table meta field
  `parent`, not a declared schema field (so it never appeared in the `get_doctype_fields` dump).
- Two candidate native population entry points were tested directly against the live instance as
  **module-level dotted-path calls** (read-only GET against `/api/method/<dotted.path>`, both
  errored before any write) and confirmed unavailable **at that specific invocation boundary**:
  `erpnext.manufacturing.doctype.work_order.work_order.get_items_and_operations_from_bom` and
  `erpnext.manufacturing.doctype.bom.bom.make_work_order` both returned
  `AttributeError: module '...' has no attribute '...'` — the installed Python modules genuinely
  export no function at either dotted path. **Scope of this evidence, precisely:** this rules out
  those two module-level invocation paths only. It does **not** prove that an identically named
  method is unavailable as a **Frappe Document-bound method** — the boundary ERPNext Desk actually
  uses for form-triggered calls like `frm.call({doc, method: "..."})`, which POSTs to a different
  endpoint (`run_doc_method`) than a plain module-level `/api/method/<dotted.path>` GET. Desk may
  invoke `get_items_and_operations_from_bom` (or an equivalent) as such a document method; that
  boundary was not tested this session and remains open for future investigation. Given that gap,
  Ceylon Stack retained the manual parity mapping below for this package's currently supported
  create flow rather than build against an unverified native path.

**Runtime-verified (read-only GET against the one real BOM on this instance,
`BOM-FG-STEEL-BRACKET-ASSY-001`, 2026-09-18):** both of its operation rows have `parent ===
"BOM-FG-STEEL-BRACKET-ASSY-001"` (i.e. `parent === bom_no`, confirming the `bom: bom_no` mapping
is correct for this app's non-exploded, single-top-level-BOM scope) and `hour_rate === 
base_hour_rate` (1200.0 and 900.0 respectively) — this BOM's currency (`LKR`) equals both
companies' default currency (`LKR`, `conversion_rate: 1.0`), so the `hour_rate`/`base_hour_rate`
correction produces **no observable difference on this instance today**. The bug this fixes only
manifests when a BOM is priced in a non-company transaction currency, which no BOM on this
instance currently is.

**Ceylon Stack mapping, current (2026-09-18 final correction):** copies every `BOM Operation`
field that also exists on `Work Order Operation`, isn't a Work-Order-lifecycle field ERPNext
computes itself, and has a correct-currency/correct-reference source: `operation`, `bom` (from
`bom_no`, not a per-row fetch), `workstation`, `workstation_type`, `sequence_id`, `time_in_mins`
(scaled `qty / bom.quantity` unless `fixed_time`), `batch_size`, `hour_rate` (from `BOM
Operation.base_hour_rate`, not `hour_rate`), `quality_inspection_required`, `is_subcontracted`,
`skip_material_transfer`, `backflush_from_wip_warehouse`,
`source_warehouse`/`wip_warehouse`/`fg_warehouse`, `description`.

**Still genuinely unconfirmed (all non-blocking for the accepted `CX-MFG-002` correction):**
1. **Native persistence comparison.** Whether ERPNext's own native BOM→Work Order copy (Desk's
   client-side form script, `work_order.js`, and/or a Document-bound method it calls) sends this
   exact field set and applies the same `fixed_time` scaling rule for: fixed operations,
   scaled/non-fixed operations, operation costing, the BOM reference, and the routing/warehouse/
   operation flags — reasoned from schema/labels and narrowed by the module-level-only probe
   above, but neither `work_order.js`'s client-side logic nor a Document-bound method invocation
   was read or tested this session (no SSH/`bench console`/vendored-source access). A supported
   document-method boundary for native invocation remains a legitimate avenue for a future
   package, not ruled out by this session's evidence.
2. **Work Order validation/controller override behavior.** Whether `validate()` itself overrides
   any of the supplied fields (particularly `hour_rate`/`batch_size`) from the Workstation or
   Operation master regardless of what this app sends.
3. **Foreign-currency runtime scenario.** A BOM priced in a transaction currency other than the
   company's default (`conversion_rate != 1`) end to end — reasoned correct from the field schema
   (`Work Order Operation.hour_rate` should end up equal to the source `BOM
   Operation.base_hour_rate`), not runtime-exercised, because no such BOM exists on this instance.

**How to verify:** (1) Create a real Work Order from Desk itself (not this app) against a BOM that
has at least one `fixed_time` operation, at a qty different from the BOM's reference quantity, and
diff the resulting Work Order Operation rows — including costing, BOM reference, and routing/
warehouse/operation flags — against this app's create payload for the same inputs. (2) Create or
price a BOM in a non-LKR transaction currency with a non-1 `conversion_rate` and confirm the
created Work Order Operation's `hour_rate` equals that BOM's `base_hour_rate`, not its
`hour_rate`. (3) If pursued, investigate whether `get_items_and_operations_from_bom` (or an
equivalent) exists as a Document-bound method reachable via Frappe's `run_doc_method` boundary,
as a supported native alternative to the current manual mapping. No BOM with a `fixed_time`
operation or a foreign transaction currency currently exists on this instance.

### MFG-UNV-008 — Duplicate `item_code` rows in `required_items` / Material Transfer preview
**Status:** `NEEDS_VERIFICATION` (Codex governance-closure finding `CX-MFG-006`, partially
mitigated 2026-09-17)
**What's uncertain:** Package 4's investigation live-confirmed that a Draft-stage item
substitution can leave two `Work Order Item` rows sharing the same `item_code` (nothing merges
them). Whether ERPNext's own `make_stock_entry` (the RPC `getMaterialTransferPreview` calls) ever
returns two `items` rows with the same `item_code` in its response — as opposed to merging them
server-side before returning — has not been confirmed. Mitigated defensively regardless: React
`key`s in both the Work Order Detail Materials tab and `MaterialTransferForm.tsx` now use row
index rather than `item_code`, and `MaterialTransferForm.tsx`'s per-row qty/warehouse state
(`qtyByIndex`/`warehouseByIndex`) is now index-keyed too, so a duplicate `item_code` can no longer
collapse two rows' state into one — but whether the scenario can actually reach this screen at all
remains unconfirmed.
**How to verify:** Reproduce Package 4's substitution steps live (leaving a duplicate `item_code`
in `required_items`), then call `make_stock_entry` against that Work Order and inspect whether the
response's `items` array contains one merged row or two duplicate rows.

### MFG-UNV-010 — BOM detail page: status-tone mapping and authenticated route walkthrough
**Status:** `NEEDS_VERIFICATION` (non-blocking, Manufacturing Masters — BOM Package 4A, 2026-09-19)
**What's uncertain:** (1) `erpStatus.ts`'s `bomStatus` uses the same generic docstatus-only
fallback shape as `stockEntryStatus`/`rfqStatus` (Draft/Submitted/Cancelled, live-confirmed BOM has
no separate `status` Select field) — but, like `MFG-UNV-001` for Work Order, no Desk `bom_list.js`
`get_indicator` source was read this session (no SSH/devops access), so the tone choices are this
app's own reasonable mapping, not a mirrored Desk indicator. (2) The new `/master-data/boms` and
`/master-data/boms/[name]` routes were confirmed to sit behind the same auth middleware as every
other page (unauthenticated requests 307-redirect to `/login?next=...` with the target path
correctly preserved/encoded) and were confirmed against the live BOM/BOM Item/BOM Operation schema
via direct `get_doctype_fields`/`list_documents` calls — but no authenticated browser click-path
through the rendered page was performed in this session (no test login credentials available),
matching the same non-blocking gap already accepted for the Master Data Item/Business Partner/
Warehouse domain packages.
**How to verify:** (1) SSH to the Hetzner instance, read `erpnext/manufacturing/doctype/bom/
bom_list.js`'s `get_indicator` function body directly, compare/update `bomStatus`'s tone map to
match. (2) Log in through the real frontend with valid credentials and click through
`/master-data/boms` → a real BOM's detail page → its component/operation/nested-BOM links.

### MFG-UNV-011 — BOM create/edit: non-Draft update rejection and zero-rate component acceptance
**Status:** `NEEDS_VERIFICATION` (non-blocking, Manufacturing Masters — BOM Package 4B, 2026-09-19)
**What's uncertain:** Package 4B added `createDoc`/`updateDoc` calls against the real `BOM`
doctype for the first time (`/master-data/boms/new`, and Draft-only inline edit on
`/master-data/boms/[name]`) — see `docs/backend/05-manufacturing/bom.md`'s "Mutation contract"
section for the exact payload shape. No live write-testing was possible this session (no working
ERPNext frontend login credentials existed; the one credential documented in `PROGRESS.md` is
confirmed stale/rejected; MCP tools available this session are read-only). Two specific behaviors
this app's own logic assumes, neither independently confirmed against the real server:
1. That ERPNext rejects an `updateDoc` call against a BOM with `docstatus !== 0` — `updateBomAction`
   re-fetches and checks this itself as a frontend-side safety net (mirroring every other
   submittable doctype's own Draft-only edit gating already established in this app — Purchase
   Order, Sales Order, Work Order), but BOM's own Python controller
   (`erpnext/manufacturing/doctype/bom/bom.py`) was not read this session, so a BOM-specific
   override of Frappe's generic "submitted docs are immutable except via amend" convention can't
   be ruled out from static reading alone.
2. That a `BOM Item` row with `rate: 0` is actually accepted despite `rate` being schema-marked
   `reqd: true` — reasoned correct from Frappe's own generic mandatory-field check (which treats a
   field as missing only for `None`/`[]`/an empty string, not a falsy numeric `0` — confirmed by
   reading that check's own logic, not guessed), but not confirmed against BOM's specific
   controller, which could add a stricter check on top.
**How to verify:** Once real login credentials exist for this frontend: create a Draft BOM with at
least one zero-rate component (an Item with no `standard_rate` set) and save it; separately, submit
a Draft BOM via Desk (this app has no Submit action) and then attempt to edit it through this app's
own `/master-data/boms/[name]` page, confirming the edit is correctly refused both client-side and
by ERPNext itself.

**2026-09-19 update (BOM Package 4B remediation):** uncertainty (1) is now narrowed, not fully
closed. Codex's remediation review read ERPNext's actual `bom.py`/`bom.json` controller source
(not available to the original Package 4B session) and confirmed structural BOM fields remain
non-editable after submit under Frappe's generic submitted-document immutability, while
`is_active`/`is_default` are the one explicit `allow_on_submit` exception — see `bom.md`. That is
still a source read, not a live write test, so the *exact* rejection behavior (error message,
HTTP status) for a structural update against a submitted BOM remains unconfirmed. A third,
narrower item is added by this same remediation: whether the new submitted-BOM availability
actions (`activateBomAction`/`deactivateBomAction`/`setDefaultBomAction`) actually succeed against
the live server, and whether `manage_default_bom()`'s default-reassignment behaves as the source
suggests (clearing the previous default, updating `Item.default_bom`) — not exercised, no live
write credentials this session either.

## MD — Master Data

Logged during the MD-R2 backend-knowledge baseline (2026-09-22), covering Item, Item Group, UOM,
Warehouse, Customer, Supplier, Contact, Address, Territory. BOM's own unverified items remain under
`MFG-UNV-009`/`010`/`011` above — not duplicated here, see `docs/backend/01-master-data/bom.md`.

### MD-UNV-001 — Doctype-level `autoname` property not directly queryable this session
**Status:** `NEEDS_VERIFICATION` (low priority — largely mitigated below)
**What's uncertain:** `mcp__ceylon-stack__get_doctype_fields` returns a doctype's declared field
list only, not framework-level metadata (`autoname`, `is_submittable`, `is_tree`). The literal
`autoname` string was never read for any of the 9 doctypes in this baseline. This was substantially
mitigated by live sample data (`list_documents`) confirming the *actual resulting* `name` pattern
for 7 of 9: Item (`name == item_code`), Item Group (`== item_group_name`), UOM (`== uom_name`),
Customer (`== customer_name`), Supplier (`== supplier_name`), Territory (`== territory_name`),
Warehouse (`== "{warehouse_name} - {company abbr}"`). Contact and Address remain open — see
`MD-UNV-005`.
**How to verify:** Read each DocType's JSON definition directly (SSH or Desk) for the exact
`autoname` string, or query doctype metadata through a tool that exposes it, if one becomes
available.

### MD-UNV-002 — Submittable status inferred from field-list absence, not read directly
**Status:** `NEEDS_VERIFICATION` (low priority — standard ERPNext behavior for all 9)
**What's uncertain:** None of Item, Item Group, UOM, Warehouse, Customer, Supplier, Contact,
Address, or Territory returned a `docstatus` field from `get_doctype_fields`, which is consistent
with "not submittable" but is an indirect proxy — the tool does not expose `is_submittable`
directly, so this conclusion is tagged `DOCUMENTATION-INFERRED`, not `VERIFIED`, throughout
`docs/backend/01-master-data/`.
**How to verify:** Read each DocType's JSON definition's `is_submittable` field directly, or
attempt a live `submitDoc` call against a test record and confirm the expected rejection.

### MD-UNV-003 — Customer/Supplier ↔ Contact/Address relationship not wired up in this frontend
**Status:** `NEEDS_VERIFICATION` (register-taxonomy tag per `BACKEND_KNOWLEDGE_POLICY.md` §6, no
other status value exists in this document — do not read the tag as implying ERPNext's own behavior
is unknown; see the two-part breakdown below)
**Independent review, 2026-09-22 (MD-R2 closure pass):** independently re-derived, not merely
re-asserted from the MD-R2 filing — a repo-wide `grep` for `link_doctype`, `primary_contact`, and
`primary_address` across `apps/frontend/src/` returned zero matches anywhere, and
`contacts/actions.ts`/`addresses/actions.ts` were read in full and confirmed to never reference
`links`. This finding separates into two genuinely different things that were previously blended
under one status line:
1. **CONFIRMED GAP (fact, not uncertain — settled, not open for further verification):**
   `createContactAction`/`createAddressAction` never write to the `links` child table; the
   Customer/Supplier Master Data screens never expose `customer_primary_contact`/
   `customer_primary_address` (or the Supplier equivalents) or any linked-record list; Contact and
   Address list pages are global and unfiltered. A Contact or Address created through
   `/master-data/contacts` or `/master-data/addresses` today has no relationship to any
   Customer/Supplier from this frontend's own perspective, even though `AddressContactFields.tsx`
   on Sales transactional documents can still select any existing Contact/Address by name.
   ERPNext's own `Dynamic Link` mechanism itself (Contact/Address's `links` child table,
   `link_doctype`/`link_name`) is separately live-schema `VERIFIED` and not in question either.
2. **NEEDS PRODUCT DECISION (genuinely open, not resolved by this entry or this closure pass):**
   whether/how a future Master Data or CRM package should wire this up — out of scope for MD-R2 and
   for this closure pass, and **not implemented or fixed here.**
**How to verify / resolve:** Not a documentation task — this is a product/scope decision for a
future Master Data or CRM package (see `docs/master-data-architecture.md` §12's CRM dependency map,
which assumes this linkage works). Confirm whether linking is out of v1 scope intentionally, or
schedule it as its own package once prioritized. Canonical ownership of Customer/Supplier/
Contact/Address stays under Master Data regardless of when/how this is resolved — a future CRM
package consumes these canonical entities, it does not fork competing `/crm/customers`,
`/crm/contacts`, or `/crm/addresses` routes or introduce Business Partner unification as a side
effect of closing this gap.

**2026-09-22 update (relationship architecture/discovery package, `CLAUDE_HANDOFF`, not
implemented):** the ERPNext relationship mechanism itself is now fully source-verified — full
detail, design, and a proposed `MD-REL-1`–`MD-REL-5` implementation sequence in
[`docs/backend/11-relationships/party-contact-address-architecture.md`](../11-relationships/party-contact-address-architecture.md).
Key resolutions this pass added on top of the `CONFIRMED GAP`/`NEEDS PRODUCT DECISION` split above
(does not change either): (a) Dynamic Link supports Customer and Supplier sharing the same Contact/
Address, by design, not a defect (`SOURCE VERIFIED`, GitHub `develop`); (b) "primary" is genuinely
two independent mechanisms — `is_primary_contact`/`is_primary_address` (a field on Contact/Address
itself, unscoped per link) versus `customer_primary_contact`/`_primary_address` (a denormalized
pointer field on the party) — whether they're kept in sync is unconfirmed, `MD-UNV-006`; (c) Frappe's
generic `_validate_links()` checks only that a Dynamic Link target exists and isn't cancelled, never
permission — meaning any future relationship-write action must allowlist `link_doctype` itself,
since nothing in ERPNext's schema restricts it; (d) renaming a party auto-cascades to every
`Dynamic Link.link_name` referencing it (`rename_dynamic_links`, `SOURCE VERIFIED`), so this is not
a migration concern for the Dynamic Link layer itself, unlike the still-open `MD-UNV-004`; (e) a new
finding — Buying has **no** Contact/Address selection UI of any kind today (`PurchaseOrderForm.tsx`
grep-confirmed zero matches), so implementing this relationship carries zero Buying-side regression
risk, unlike Sales' `AddressContactFields.tsx`. Six new `NEEDS_VERIFICATION` items opened by this
pass: `MD-UNV-006` through `MD-UNV-011` (see the architecture doc's §17 for the full list — not
duplicated here to avoid two sources of truth for the same six items). Still not implemented, not
self-declared `ACCEPTED` — this is architecture/discovery only, requiring Niroshan's sign-off before
`MD-REL-1` starts.

### MD-UNV-006 — Do `customer_primary_contact`/`is_primary_contact` (and Address equivalents) auto-sync?
**Status:** `NEEDS_VERIFICATION`. Blocks `MD-REL-4` (primary Contact/Address behavior package).
**What's uncertain:** Whether writing `Customer.customer_primary_contact` (a plain Link field) also
sets that Contact's own `is_primary_contact=1` server-side, or whether these are two entirely
independent fields a caller must both maintain. Neither `customer.py` nor `supplier.py`'s controller
source was read this session.
**How to verify:** Read `erpnext/selling/doctype/customer/customer.py` and
`erpnext/buying/doctype/supplier/supplier.py` directly, or set `customer_primary_contact` on a real
test Customer via Desk and check whether the linked Contact's `is_primary_contact` flag changes.

### MD-UNV-007 — Exact source location of stale-primary-pointer cleanup
**Status:** `NEEDS_VERIFICATION`, non-blocking.
**What's uncertain:** Frappe's own `contacts` module documentation this session referenced
`get_primary_link_fields()`/`clear_stale_primary_link()`-shaped logic (clearing a party's primary
pointer field when the underlying Dynamic Link is removed) but the exact defining file/function body
was not independently re-read and quoted.
**How to verify:** Grep the installed `frappe` app directly (SSH) for `clear_stale_primary_link` and
read its full body and call sites.

### MD-UNV-008 — `deduplicate_dynamic_links()` exact behavior on a duplicate link
**Status:** `NEEDS_VERIFICATION`, non-blocking.
**What's uncertain:** Whether attempting to link the same `(link_doctype, link_name)` pair to a
Contact/Address twice is silently collapsed to one row or raises a validation error. Confirmed only
that the function exists and runs on every save (`SOURCE VERIFIED`, GitHub `develop`).
**How to verify:** Attempt to save a Contact/Address with a duplicate `links` row against a test
record and observe the actual response.

### MD-UNV-009 — Does rename refresh `customer_primary_contact`/`_primary_address` too?
**Status:** `NEEDS_VERIFICATION`, non-blocking (this app doesn't expose rename today, `MD-UNV-004`).
**What's uncertain:** `rename_dynamic_links()` is confirmed to update `Dynamic Link.link_name` on
rename. Whether Frappe's broader `rename_doc()` sweep also updates plain `Link` fields like
`customer_primary_contact` was inferred from the surrounding source structure, not independently
read and quoted.
**How to verify:** Read the plain-`Link`-field update code path in
`frappe/model/rename_doc.py` directly, or rename a test record with a populated
`customer_primary_contact` pointing at it and observe whether the pointer field updates.

### MD-UNV-010 — Does ERPNext's REST create accept a nested `links` array for Contact/Address?
**Status:** `NEEDS_VERIFICATION`. Blocks `MD-REL-1`'s exact implementation shape (not the
architecture).
**What's uncertain:** Whether `POST /api/resource/Contact` (or `Address`) with a `links` array in
the JSON body creates the child rows in one request, the way this app's REST layer already relies on
for other child tables (assumed by analogy, not tested against Contact/Address specifically).
**How to verify:** A single test `createDoc("Contact", { first_name: "...", links: [{ link_doctype:
"Customer", link_name: "<test customer>" }] })` call against the live instance, then confirm via
`getDoc` that the row persisted.

### MD-UNV-011 — Any role/permission restriction on writing Contact/Address `links`?
**Status:** `NEEDS_VERIFICATION`, non-blocking (moot today — this app's writes all run under one
shared service account with fixed permissions, see
`docs/backend/11-relationships/party-contact-address-architecture.md` §2.5).
**What's uncertain:** Whether Contact/Address's controller enforces anything beyond generic Frappe
create/write permission on who may populate `links` (e.g. any role-based restriction on attaching to
Customer vs. Supplier specifically). Not found in the source read this session; a full permission-hook
investigation was out of scope.
**How to verify:** Read Contact/Address's `permission` definitions in their DocType JSON, and any
`has_permission`/`get_permission_query_conditions` hook registered against either in `hooks.py`.

### MD-UNV-004 — Item/Customer/Supplier rename-safety generalizes beyond Item
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** `docs/master-data-architecture.md` §10 item 2 already flags whether changing
`Item.item_code` safely cascades to existing transaction references. Live data confirmed this
session that Customer and Supplier are *also* name-field-autonamed (`name == customer_name` /
`name == supplier_name`), so the identical rename-safety question applies to them — not previously
stated explicitly. Not tested this session for any of the three.
**How to verify:** Attempt a live rename (`frappe.rename_doc` or the Desk rename action) on a
disposable test Item/Customer/Supplier with at least one existing transaction reference, and
confirm whether the reference updates, breaks, or is blocked.

### MD-UNV-005 — Address (and Contact collision-suffix) naming pattern not sample-verified
**Status:** `NEEDS_VERIFICATION`
**What's uncertain:** `list_documents("Address", ...)` returned zero records on this instance —
Address's naming pattern could not be empirically confirmed at all this session (schema-only,
`DOCUMENTATION-INFERRED`). Separately, Contact's naming base pattern (`name` derived from
`first_name`) was confirmed from 2 live records, but neither exercised a name collision, so the
exact suffix format on collision is unconfirmed for Contact.
**How to verify:** Once real Address records exist on this instance (or a disposable test record is
created), sample via `list_documents`/`get_doctype_fields`-adjacent tooling to confirm the pattern.
For Contact, create two records with identical `first_name`/`last_name` and observe the resulting
`name` values.

## General

Add new entries here as they're discovered during other domain baselines (Sales, Inventory,
Buying). Do not remove an entry until it's actually been verified — replace its `STATUS` line and
note how/when it was resolved instead of deleting the record.

## Finance (FIN-1, 2026-09-24)

Full detail in `docs/backend/06-accounting/chart-of-accounts-bank-account.md`'s own
`NEEDS_VERIFICATION` section — summarized here per this file's own convention of one canonical
list across domains.

### FIN-UNV-001 — Bank Account delete-blocked-by-link exact behavior
**Status:** `NEEDS_VERIFICATION`, non-blocking (delete of an *unlinked* Bank Account was
live-tested and works: HTTP 202, confirmed gone via a follow-up GET returning 404).
**What's uncertain:** What Frappe's generic `LinkExistsError` message/status looks like when
deleting a Bank Account that's actually referenced by a real Payment Entry or GL posting — no
such linked record exists yet on the live tenant (Payment Entry UI is FIN-2 scope, not built).
**How to verify:** Once FIN-2 ships and a real Payment Entry references a Bank Account, attempt
`deleteBankAccountAction` against it and confirm `humanizeError`'s `erpnextMessage` fallback
surfaces a sensible message.

### FIN-UNV-002 — `Bank Account.validate_account()` duplicate-Account-link error wording
**Status:** `NEEDS_VERIFICATION`, non-blocking.
**What's uncertain:** The controller (`bank_account.py`) throws when the same `Account` Link is
reused across two Bank Accounts, but this wasn't exercised live this session — no second Bank
Account existed to collide with during FIN-1's REST test pass.
**How to verify:** Create two Bank Accounts pointing at the same `account` value and confirm the
exact live error text `humanizeError` would surface.

### FIN-UNV-003 — Base (non-Custom) DocPerm grant on Bank Account for Accounts Manager/Accounts User
**Status:** `NEEDS_VERIFICATION`, non-blocking today (service account has `System Manager`,
overriding everything below it — `FIN-GAP-08`).
**What's uncertain:** No `Custom DocPerm` rows exist for either role on `Bank Account`
(confirmed empty), meaning whatever access they have comes from the doctype's own base
`permissions` list in its JSON definition — not independently read/quoted this session.
**How to verify:** Read `Bank Account`'s DocType JSON `permissions` array directly, or test
against a real non-System-Manager user holding only `Accounts Manager`/`Accounts User`.

## Finance (FIN-1E, 2026-09-24)

`FIN-1E` (Chart of Accounts maintenance — Create/Edit/Disable/Delete) live-verified almost every
rule below via a full disposable-fixture lifecycle test run through `bench --site frontend
console` (`frappe.get_doc(...).insert()/.save()/.delete()` — the exact document lifecycle Frappe's
REST `/api/resource/Account` endpoints invoke under the hood, not a separate code path) rather
than raw REST calls like `FIN-1` used. This session deliberately did not extract or materialize
the service account's real API key/secret into any file (blocked by this environment's own
credential-materialization safeguard, correctly) — the console-based method is evidence-equivalent
for controller/validation behavior (same `Account`/`NestedSet` Python classes, same `validate()`/
`on_trash()` methods run either way) but does not exercise Frappe's HTTP-layer permission/
serialization wrapper itself. Full detail in
`docs/backend/06-accounting/chart-of-accounts-bank-account.md`'s "Account maintenance" section.

### FIN-UNV-004 — Generic `check_if_doc_is_linked` exact message when deleting an Account referenced by a non-GL-Entry document
**Status:** `NEEDS_VERIFICATION`, non-blocking (the underlying mechanism is source-confirmed:
`frappe/model/delete_doc.py::get_linked_docs()`, `method="Delete"`, blocks on *any* Link reference
across the whole schema regardless of `docstatus` — stricter than the Cancel-guard pattern
`lib/connections.ts` already documents elsewhere).
**What's uncertain:** This session deliberately did not attempt a delete against any real,
GL-linked production Account (even a safe, expected-to-fail attempt was correctly blocked by this
environment's own write-safety guardrail) — so the exact `LinkExistsError` message/HTTP status
Ceylon Stack's `humanizeError` would actually render for this specific doctype was not captured
live. `Account.on_trash()`'s own `check_gle_exists()` guard (a narrower, Account-specific check)
*was* source-read and is the one this app's own proactive `getAccountDependencies()` check mirrors
directly.
**How to verify:** Attempt deleting a disposable test Account that has been referenced by a
disposable Bank Account or a disposable draft Sales Invoice line, on a future package with looser
write-safety constraints or direct maintainer access, and confirm the exact surfaced message.

### FIN-UNV-005 — `validate_group_or_ledger()`'s GL-entries branch, exact message/behavior when converting an account that actually has GL Entries
**Status:** `NEEDS_VERIFICATION`, non-blocking (the code path is source-confirmed —
`check_gle_exists()` is checked first, unconditionally, in both conversion directions).
**What's uncertain:** The disposable test ledger used for FIN-1E's live lifecycle test never had
any GL Entry posted against it, so only the *other* two `validate_group_or_ledger()` branches were
exercised live (Ledger→Group blocked by a set `account_type`; a clean Group→Ledger conversion
succeeding). The "Account with existing transaction cannot be converted to ledger" message was
read from source, not reproduced against a real disposable account with real GL postings.
**How to verify:** Post a real (disposable) GL Entry against a disposable test Account (e.g. via a
throwaway Stock Entry or Journal Entry once FIN-3 exists), then attempt an Is Group toggle on it
through this app's Edit form and confirm the exact surfaced message.

## CRM

Logged during the `CRM-0` architecture/discovery package (2026-09-24), covering Lead, Opportunity,
Prospect. Full context in `docs/backend/16-crm/crm-architecture.md`. **Updated 2026-09-24 (`CRM-1`):**
`CRM-UNV-002` and `CRM-UNV-004` resolved via `CRM-1`'s live fixture testing — Lead's `CRM-LEAD-.YYYY.-`
naming confirmed, and, more significantly, **`Opportunity.is_submittable: 0`** confirmed (corrects
`crm-architecture.md`'s prior "very likely submittable" inference). `CRM-UNV-008` newly logged (a
scoping deferral, not a fresh unknown). **Updated 2026-09-25 (`CRM-2`):** `CRM-UNV-009` (Opportunity
status-tone mapping) and `CRM-UNV-010` (mutation paths not live-exercised — QA access gap, disclosed
and shipped anyway per Niroshan's explicit choice) newly logged, both non-blocking.
`CRM-UNV-001`/`003`/`005`/`006`/`007` remain open, all still non-blocking for `CRM-2`'s shipped scope
— none was required to resolve before this package started, per `CRM-2`'s own first-gate
live-verification pass (`crm-architecture.md` §25.1). **Updated 2026-09-25 (`CRM-3`):**
`CRM-UNV-011` (mutation paths and `followupBucket()` classification not live-exercised — same QA
access-gap class as `CRM-UNV-010`) newly logged, non-blocking. Two real, non-blocking bugs QA
found were fixed same session rather than logged as unverified (Meeting `starts_on`/`ends_on`
missing seconds; no way to complete an overdue Meeting) — see `crm-architecture.md` §26.8 and
`QA_LOG.md`'s `CRM-3` entry for detail. **Updated 2026-09-25 (`CRM-4`):** `CRM-UNV-012` (pipeline
aggregation and stage mutation not live-exercised — zero live Opportunity/ToDo/Event/Communication
records plus no frontend login credentials this session) newly logged, non-blocking; this session's
live schema/data reads (`mcp__ceylon-stack__*`) re-confirmed every field `CRM-4` depends on matches
`CRM-2`/`CRM-3`'s own earlier findings exactly.

### CRM-UNV-001 — Is `CRM Settings.enable_frappe_crm_data_synchronization` actually enabled?
**Status:** `NEEDS_VERIFICATION`, non-blocking, low priority.
**What's uncertain:** `CRM Settings` is a Single doctype; `mcp__ceylon-stack__list_documents` cannot
fetch a Single's stored value the way it lists normal doctype rows. Whether this tenant has native
Frappe CRM data-sync turned on was not confirmed. Irrelevant to `CRM-1`..`CRM-5`'s own design either
way — Ceylon Stack builds directly against ERPNext's REST API regardless.
**How to verify:** A `getDoc`-equivalent call against `CRM Settings`, or SSH/`bench console` read of
`frappe.db.get_single_value("CRM Settings", "enable_frappe_crm_data_synchronization")`.

### CRM-UNV-002 — Lead/Prospect naming mode not empirically confirmed
**Status:** `RESOLVED` (`CRM-1`, 2026-09-24) for Lead; Prospect remains unconfirmed (still
`POST-V1`, no frontend exists to create one).
**Resolution:** `CRM-1`'s own live-fixture testing (create → convert → cleanup, see
`docs/backend/16-crm/crm-architecture.md`'s implementation update) created real Lead records and
confirmed `naming_series: "CRM-LEAD-.YYYY.-"` produces `CRM-LEAD-2026-00001`-shaped names, exactly
as the live schema declared — no surprises.

### CRM-UNV-003 — Is `Opportunity.opportunity_from`'s valid-value set enforced server-side?
**Status:** `NEEDS_VERIFICATION`, non-blocking for `CRM-1`; must be treated as unenforced (i.e.
Ceylon Stack must allowlist it itself) regardless of the answer, per `crm-architecture.md` §9.3's
rule — same class of finding as `MD-UNV-*`'s `link_doctype` allowlist requirement in
`party-contact-address-architecture.md` §2.5.
**What's uncertain:** The live schema shows `opportunity_from` as an unrestricted `Link → DocType`.
Practical values `{Lead, Customer, Prospect}` are inferred from `mapper.py`'s usage and the
`Prospect Opportunity` child table's existence, not confirmed via a server-side validation hook read.
**How to verify:** Read `Opportunity.validate()`'s full body (only `map_fields`/`set_opportunity_type`/
`set_exchange_rate`/`calculate_totals`/etc. were enumerated this session, not each one's full body) or
attempt a live write with an out-of-set `opportunity_from` value and observe whether it's rejected.

### CRM-UNV-004 — Is Opportunity genuinely a submittable (Draft/Submit/Cancel/Amend) doctype?
**Status:** `RESOLVED` (`CRM-1`, 2026-09-24) — **`Opportunity.is_submittable: 0`**, confirmed via a
direct live DocType metadata read against the real Hetzner instance. This **corrects**
`crm-architecture.md`'s `DOCUMENTATION-INFERRED: yes, submittable` working assumption (§5.2/§6/§18),
which had reasoned from `amended_from`'s field presence alone — that inference turned out wrong.
Opportunity is draftless, exactly like Lead/Customer/Supplier: no Submit/Cancel/Amend UI is needed
for `CRM-2`, only plain `createDoc`/`updateDoc`. `amended_from`'s presence on a non-submittable
doctype is itself a minor, newly-noted oddity (harmless leftover/reserved field, not acted on
further here).
**Resolution note for future documents:** `amended_from`-field-presence is not a reliable
`is_submittable` proxy on this ERPNext version — prefer a direct metadata/DocType JSON read over
inferring from field presence when the distinction is load-bearing for a package's scope, as it was
here for `CRM-2`.

### CRM-UNV-005 — Exact field mapping for Opportunity's own outbound mapper functions
**Status:** `NEEDS_VERIFICATION`, non-blocking for `CRM-1`/`CRM-2`; relevant before `CRM-5`.
**What's uncertain:** `erpnext.crm.doctype.opportunity.mapper.make_customer`/`make_quotation`/
`make_supplier_quotation`/`make_request_for_quotation` are `SOURCE VERIFIED` **to exist** (confirmed
via `opportunity.js`'s "Create" button dotted-paths) but their exact field-mapping bodies were not
fetched and quoted this session, unlike the Lead-side equivalents in `lead/mapper.py` (§6 of
`crm-architecture.md`, fully quoted).
**How to verify:** Fetch and quote `erpnext/crm/doctype/opportunity/mapper.py` in full, the same way
`lead/mapper.py` was this session, before `CRM-5` implements the Opportunity→Quotation handoff.

### CRM-UNV-006 — Exact trigger for `Opportunity.status` `Open → Replied`
**Status:** `NEEDS_VERIFICATION`, non-blocking.
**What's uncertain:** Plausibly a Communication-received hook (consistent with `crm/utils.py`'s
`link_communications`/`update_modified_timestamp` helpers, source-confirmed to exist this session),
not traced to a specific code path that writes `status = "Replied"`.
**How to verify:** Read the full `Communication` `doc_events` wiring in `hooks.py` for the `Opportunity`
(and `Lead`) doctype, or observe a real inbound email against a disposable test Opportunity.

### CRM-UNV-007 — Exact trigger for `Opportunity.status` `→ Converted`
**Status:** `NEEDS_VERIFICATION`, non-blocking for `CRM-1`/`CRM-2`; relevant before `CRM-5` if that
package wants to reflect this state automatically rather than requiring an explicit Ceylon Stack-side
update (the same explicit-update requirement already confirmed necessary for `Lead.status`, §6).
**What's uncertain:** Not confirmed whether any native ERPNext code sets this automatically (e.g. on
Sales Order creation against the Opportunity) or whether, like Lead's own conversion methods, it is
left entirely to the caller.
**How to verify:** Grep `erpnext/crm/doctype/opportunity/opportunity.py` and any Sales Order hook for
a `status = "Converted"` write, or observe live behavior once a disposable Opportunity → Quotation →
Sales Order chain is run end to end.

### CRM-UNV-008 — Lead's Contact/Address create-with-link extension, deferred out of `CRM-1`
**Status:** `DEFERRED`, not `NEEDS_VERIFICATION` in the investigative sense — a scoping decision,
recorded here so it isn't silently missing. **Logged 2026-09-24 (`CRM-1` code review).**
**What's deferred:** `crm-architecture.md` §5.4/§18 named extending `createContactAction`/
`createAddressAction` with an optional `link_doctype`/`link_name` pair (allowlisted to `"Lead"`) as
part of `CRM-1`'s scope, so Lead create/edit could optionally create-and-link a Contact/Address via
the Dynamic Link mechanism. `CRM-1` did not build this — Lead's own flat `email_id`/`mobile_no`/
`phone`/`website` fields already satisfy the required "Contact Information" display on Lead Detail,
and the master `MD-REL-1` relationship-action-layer package (`docs/backend/11-relationships/
party-contact-address-architecture.md`) — which this extension point assumed already existed — has
not shipped at all yet (`contacts/actions.ts`/`addresses/actions.ts` confirmed unmodified, no
`partyDoctype`/`partyName` parameter exists on either action today).
**How to close:** Either as a small `CRM-1`-follow-up once `MD-REL-1` ships (reuse its allowlist
mechanism, widen to include `"Lead"`), or explicitly folded into a future `CRM` package. Non-blocking
for `CRM-2`+.

### CRM-UNV-009 — Opportunity list-view status-indicator tone mapping not independently confirmed
**Status:** `NEEDS_VERIFICATION`, non-blocking. **Logged 2026-09-25 (`CRM-2` package.)**
**What's uncertain:** `lib/erpStatus.ts`'s `opportunityStatus()` (Open/Replied → alert, Quotation →
signal, Converted → success, Lost/Closed → neutral) is this app's own reasonable mapping onto its
three-tone system — same class of gap already logged for `leadStatus`/`bomStatus`/`stockEntryStatus`
(`MFG-UNV-001`/`MFG-UNV-010`). No Desk `opportunity_list.js::get_indicator` source was read this
session (no SSH/devops access).
**How to verify:** SSH to the Hetzner instance, read
`erpnext/crm/doctype/opportunity/opportunity_list.js`'s `get_indicator` function body directly (same
method already used for every other status function in `erpStatus.ts`), then compare/update the tone
map to match.

### CRM-UNV-010 — `CRM-2` mutation paths not live-exercised (QA access gap, disclosed)
**Status:** `NEEDS_VERIFICATION`, non-blocking (shipped with this gap disclosed per Niroshan's
explicit choice — see `QA_LOG.md`'s `CRM-2` entry). **Logged 2026-09-25.**
**What's uncertain:** `CRM-2`'s QA pass had no browser/devtools access and no write-capable ERPNext
credentials at all, so it could only verify live schema state (read-only) and trace code paths
against it — it correctly declined to touch any `.env` file or attempt an auth bypass, avoiding a
repeat of `CRM-1`'s `SESSION_SECRET` incident, but as a result **no Opportunity/Quotation/Lost Reason
record was ever actually created, edited, marked Lost, or converted to a Quotation this session.**
Every code path traced matches the live-verified schema and (for the Lead-derivation logic)
`CRM-1`'s own already-live-verified conversion mapping, but none of `CRM-2`'s own five create/edit/
mark-lost/handoff scenarios has been runtime-observed.
**How to verify:** A future session with real browser/login credentials or write-capable ERPNext API
access should run the full test plan `QA_LOG.md`'s `CRM-2` entry describes: create both a Lead- and a
Customer-partied Opportunity (confirming the contact-field derivation lands correctly, not just that
the code looks correct), edit one, create one `Opportunity Lost Reason` fixture and exercise
`declare_enquiry_lost` for real, and run the full Opportunity → Quotation handoff end to end
(confirming the created Quotation's fields and the source Opportunity's `status → "Quotation"`
follow-up write both land correctly) — then clean up every fixture and confirm via a fresh query.

### CRM-UNV-011 — `CRM-3` mutation paths and `followupBucket()` classification not live-exercised (QA access gap, disclosed)
**Status:** `NEEDS_VERIFICATION`, non-blocking (shipped with this gap disclosed — same posture as
`CRM-UNV-010`). **Logged 2026-09-25.**
**What's uncertain:** `CRM-3`'s QA pass had no `mcp__ceylon-stack__*` tools, no browser, and no
write-capable ERPNext credentials at all this session (narrower access than even `CRM-2`'s QA
pass, which at least had read-only schema tools) — confirmed the live instance is reachable
(`ping` → 200) but every unauthenticated schema/data read returned `PermissionError`. As a result,
no Call/Meeting/Follow-up/Note was ever actually created against a disposable test Lead or
Opportunity this session, `followupBucket()`'s Overdue/Due Today/Upcoming classification was not
checked against a real due date, and completing a follow-up/meeting (ToDo/Event status transition)
was not live-exercised. Every code path traced matches the live-verified schema from
`crm-architecture.md` §26.1 (itself confirmed by a `get_doctype_fields` read earlier in this same
day's work, before this QA pass ran), but none of `CRM-3`'s own five create/complete scenarios has
been runtime-observed.
**How to verify:** A future session with real browser/login credentials or write-capable ERPNext
API access should run the full test plan `QA_LOG.md`'s `CRM-3` entry describes: log one Call, one
Meeting, one Follow-up, and one Note against a disposable test Lead and Opportunity; confirm each
appears correctly in the unified timeline and (Follow-up/Meeting only) in `/crm/activities`;
confirm a real overdue/due-today/upcoming due date buckets correctly; complete a Follow-up and a
Meeting and confirm both stay visible in history while dropping out of the open/overdue count; then
clean up every test document created.

### CRM-UNV-012 — `CRM-4` pipeline aggregation and stage mutation not live-exercised (zero live data + no frontend login, disclosed)
**Status:** `NEEDS_VERIFICATION`, non-blocking (shipped with this gap disclosed — same posture as
`CRM-UNV-010`/`CRM-UNV-011`). **Logged 2026-09-25.**
**What's uncertain:** `CRM-4`'s session had live **read-only** access to the real Hetzner instance
via `mcp__ceylon-stack__*` tools (`ping` confirms `logged_in_as: "Administrator"`) — broader than
`CRM-3`'s QA pass, but still no write-capable ERPNext credentials and no frontend (Next.js app)
login credentials at all. `list_documents` confirms zero live `Opportunity`, `ToDo`
(`reference_type: "Opportunity"`), `Event`, or `Communication` records exist on the instance, so
`lib/crmPipeline.ts`'s bulk-fetch-then-group aggregation (weighted value, next-follow-up,
closing-soon/past-expected-close, stale-days, KPI totals) and `updateOpportunityStageAction`'s
`sales_stage` write have never executed against a real record. Every field name and the `Sales
Stage` seed-data order were re-confirmed live via `get_doctype_fields`/`list_documents` this
session (matching `crm-architecture.md` §25.1/§26.1's earlier findings exactly), and the aggregation
logic was independently traced by a `code-reviewer` pass, but none of it has been runtime-observed
against real data. An unauthenticated `curl` of `/crm` correctly redirected to `/login`, confirming
only the route/middleware wiring, not the data-fetching path.
**How to verify:** A future session with frontend login credentials and/or write-capable ERPNext API
access should: create one disposable Customer-partied Opportunity plus one open `ToDo` against it
(varying `expected_closing`/`probability`/`sales_stage` across a couple of fixtures to exercise more
than one Attention Queue bucket), load `/crm`, confirm the KPI tiles/Attention Queue/board all show
the expected values, exercise the stage-change `<select>` and confirm both the success path
(`sales_stage` actually updates in ERPNext) and a simulated failure path (network/permission error)
revert the card's visible stage correctly, then delete every fixture and confirm via a fresh query.
