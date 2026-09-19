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
**Status:** `NEEDS_VERIFICATION`, **partially resolved 2026-09-20 (PP-2)** — demand sourcing and
Draft creation are now live-confirmed (see below); submit/cancel lifecycle, stock reservation,
sub-assembly explosion, and Work Order/Material Request generation remain unexercised.
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
**What's still uncertain:** (1) everything **beyond the create flow above** remains
source-derived, not live-observed — no actual Work Order/Material Request generation,
sub-assembly explosion, or submit/cancel/stock-reservation lifecycle has been run and inspected
(zero Production Plan documents are left on the instance between sessions, by design — the one
created for this verification was deleted); (2) a confirmed schema drift exists between the
fetched GitHub source and the live
instance — the source's Material Request auto-submit path reads `self.doc.get(
"submit_material_request")`, but no such field exists in the live `Production Plan` schema,
meaning the installed ERPNext version is close to but not identical to the fetched branch, so any
source-derived claim could have similar small drifts elsewhere; (3) whether `make_work_order`/
`make_material_request`/`get_sub_assembly_items` etc. actually require `docstatus = 1` (Submitted)
before they're callable — that gate is enforced in Desk `.js`/button visibility, not in the `.py`
read this pass; (4) `reserve_stock_for_production_plan` (Stock Reservation Entry creation) was not
read — `reserve_stock`'s full effect beyond the `Bin` reserved-qty update is unconfirmed; (5)
`Purchase Order.production_plan`-style back-reference for subcontracted sub-assembly rows was
inferred from the Python (`production_plan` passed into `_subcontract_po_item`) but not confirmed
against the live `Purchase Order`/`Purchase Order Item` schema.
**How to verify:** Sales Order → Draft Production Plan creation is now verified (above, PP-2). The
remaining gap needs a BOM with at least one sub-assembly component (none exists on this instance
yet) submitted through: Submit → sub-assembly explosion → Make Work Order/Make Material Request →
downstream generation, comparing actual results against the formulas/rules documented in
`production-plan.md`. Do this once a Production Plan submit/action package (a future package,
explicitly out of scope for PP-2) exists.

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

## General

Add new entries here as they're discovered during other domain baselines (Sales, Inventory,
Buying). Do not remove an entry until it's actually been verified — replace its `STATUS` line and
note how/when it was resolved instead of deleting the record.
