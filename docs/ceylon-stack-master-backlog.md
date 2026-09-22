# Ceylon Stack — Master Plan Audit & Dependency-Aware Backlog

**Date:** 2026-09-18, corrected 2026-09-22.
**Author:** Claude Code, per `docs/ceylon-stack-master-plan.md` §28 ("Claude Execution Instruction")
**Status:** Analysis/planning only. No code was written or changed to produce this document, per
the master plan's own governance rule (§25: *"Document it. Do not automatically build it."*).

**2026-09-22 correction note:** the original 2026-09-18 pass was written before the Manufacturing
PP-1–PP-8 track shipped and before the Master Data Item/Business Partner/Warehouse domain packages
shipped — both happened 2026-09-18/19, overlapping this document's own writing. Three sections
below (§2's Manufacturing and Master Data rows, §3, §5 item 3, §6) are corrected in place with
inline notes rather than silently rewritten, so the original analysis stays visible as historical
record. This correction changed documentation only.

**Relationship to other docs:** this is a reference/tracking doc, same tier as `PLAN.md` and
`PROGRESS.md` — it does **not** override anything in `docs/controls/`. Where this backlog implies
a change to sequencing, route namespace, or module scope, that change requires Niroshan's sign-off
before any control document is edited or any implementation package starts, per
`docs/controls/DEVELOPMENT_SYSTEM_RULES.md` §9.

---

## 1. Method

Per master plan §28, this audit worked from actual repository state, not assumption:

- `git log`, `git status`, `git diff` on the working tree (branch `frontend`, 22 commits ahead of
  `origin/frontend`, two files uncommitted from the prior session plus one new untracked file).
- `CLAUDE.md`, all five `docs/controls/` documents, `PLAN.md`, `PROGRESS.md` (full chronological
  log), `docs/backend/README.md`, `docs/architecture/decisions/README.md`, and
  `docs/operations/AI_WORK_LOG.md`.
- The uncommitted, in-flight work already sitting in the tree: `docs/master-data-architecture.md`
  (new) and its ADR-007 entry, and the still-open Codex re-review of the Manufacturing package
  remediation.
- Directory structure of `apps/frontend/src/app/(app)/` to confirm which modules physically exist
  as routes versus which are only mentioned in planning docs.

No live ERPNext instance was queried for this pass (this is a documentation audit, not a QA pass).

---

## 2. Current repository state vs. master plan Stage 01 ("ERP Core")

The master plan's Stage 01 core-module list is: **CRM, Sales, Purchasing, Inventory,
Manufacturing, Finance, Master Data.** Mapped against what actually exists in
`apps/frontend/src/app/(app)/` today:

| Master plan Stage 01 module | Repo reality | Roadmap-stage status |
|---|---|---|
| **Sales** | Built and hardened. Quotation → Sales Order → Delivery Note → Sales Invoice, partial fulfillment, Pick & Pack (live-verified), pricing/discounts, Reports hub (17/18 native reports live). Declared stable per Current Mission. | Stage 01 — **substantially complete**, frozen for new features per Current Mission. |
| **Inventory** | Warehouses, Batches, Serial Nos, Stock Entry (Receipt/Issue/Transfer), Stock Balance, Stock Reports hub (Stock Balance live, rest "coming soon"). Shipped, reviewed, QA'd 2026-09-16 (QA caught a real `s_warehouse` bug review missed). | Stage 01 — **MVP complete**. |
| **Purchasing/Procurement** | Purchase Order → Purchase Receipt → Purchase Invoice core cycle shipped and accepted 2026-09-16. Buying Reports hub: 13 of native reports live. The master plan's full procurement chain (Purchase Request → RFQ → Supplier Quotation → PO → GRN → Supplier Invoice → three-way match) is **not** fully built — only the PO→Receipt→Invoice core cycle exists, which is a deliberate scope cut ("keep reports light", Current Mission item 3), not an oversight. | Stage 01 — **core cycle only**, by design. Requisition/RFQ/Supplier Quotation stages are a documented gap, not yet scoped. |
| **Manufacturing** | **UPDATED 2026-09-22 — no longer blocked.** The `CX-MFG-001`/`CX-MFG-002` block described below in §3 was resolved after this audit's original 2026-09-18 pass; Production Plan PP-1 through PP-8 (planning, Draft create, Submit, Sub-Assembly/Material Requirements, Work Order Generation + PP-5R remediation, Material Request Generation, Multi-Level BOM runtime qualification PP-7/PP-7R, Cancel) are all independently **ACCEPTED (SHIPPED)** per `docs/controls/TEMP_DUAL_CLAUDE_MODE.md`'s session log, with no unresolved HIGH/CRITICAL findings. Work Order — Submit (`MFG-WF-004`) is implemented and QA-passed but **PARTIAL** — still `CLAUDE_HANDOFF`, awaiting independent review. BOM (`/master-data/boms`) is **independently ACCEPTED as of 2026-09-22** — see Master Data row below, no longer PARTIAL. Job Card list/detail, Workstations, and OEE are **PLANNED** — native ERPNext capability exists for all three, but no Ceylon Stack frontend has been built for any of them. | Stage 01 — **substantially shipped**; PP track and BOM both ACCEPTED, one item (Work Order Submit) still awaiting independent review. §3 below is historical, not current — see its correction note. |
| **Finance** | No dedicated Finance/Accounting module or routes exist in `apps/frontend`. The only verified accounting behavior is incidental: installing the whitelabeled HR app and running payroll produced a real, balanced Journal Entry against ERPNext's GL (`PROGRESS.md`, 2026-09-13) — this proves ERPNext's own GL works, not that Ceylon Stack has a Finance module. `docs/controls/DEVELOPMENT_SYSTEM_RULES.md` §3 lists "Light Accounting + Dashboards" as sequencing priority 5, but the **Current Mission priority lock in `CLAUDE.md` does not include Finance at all** — it stops at Manufacturing. | Stage 01 — **not started, and not currently in the priority lock.** See §5, open decision #1. |
| **CRM** | No CRM routes or module exist in `apps/frontend`. "CRM" appears in the repo only as a *future whitelabel product* candidate (Frappe's separate CRM app, alongside Helpdesk/Insights — a product-portfolio idea, not Ceylon Stack's own Lead→Opportunity→Quotation pipeline). The master plan's CRM section (Leads, Opportunities, Pipeline, lead conversion) has **no corresponding entry anywhere in the Current Mission priority lock.** | Stage 01 — **not started, and not currently in the priority lock.** See §5, open decision #2. |
| **Master Data** | **UPDATED 2026-09-22 — SHIPPED, not a pending proposal.** This audit's original 2026-09-18 entry (below, struck through in spirit not in text) described Master Data as "investigated, not yet implemented" based on `docs/master-data-architecture.md`'s original 2026-09-17 draft. That draft was stale even at the time of this backlog's original writing: a separate session had already shipped the Item domain, Business Partner domain, and Inventory Structure (Warehouse) domain to canonical `/master-data/*` routes on 2026-09-18/19, each independently reviewed and **ACCEPTED**, plus BOM (Package 4A/4B). BOM's own review history: Package 4A never independently reviewed before `MD-R1`; Package 4B independently reviewed by Codex, `CHANGES REQUIRED`, partially remediated by `6c38f7b`; `MD-R1` (2026-09-22) then independently reviewed the complete shipped BOM surface, also `CHANGES REQUIRED`; `23886ac` remediated those findings; a separate-account/session governance confirmation subsequently accepted that remediation. **BOM is now independently ACCEPTED.** Supplier Group, Operations, Workstations, and Financial/Organizational masters (Company, Cost Center, Project, UOM) remain **PLANNED** — no dedicated screens exist. `docs/backend/01-master-data/` — required by `BACKEND_KNOWLEDGE_POLICY.md` for the four shipped domains — **now exists** (package MD-R2, `5d291db`, 2026-09-22, independently reviewed and ACCEPTED; see `docs/master-data-architecture.md` §8/§9); it surfaced one confirmed frontend gap, not resolved by that package (Customer/Supplier ↔ Contact/Address linkage, `MD-UNV-003`). | Stage 01 — **fully shipped and independently accepted** (Item/Business Partner/Warehouse/BOM domains all ACCEPTED, backend-knowledge baseline ACCEPTED); `MD-UNV-003` relationship architecture is the one concrete remaining gap, not a new architecture decision. |

**Bottom line (corrected 2026-09-22):** five of the master plan's seven Stage-01 modules (Sales,
Inventory, Buying-core, Manufacturing, Master Data) are real, shipped, working code, each with at
least one domain/package independently accepted. Two (CRM, Finance) don't exist at all and aren't
currently scheduled. No module in this table is "architecture done, implementation not started" any
longer — that framing described a stale document, not repository reality.

---

## 3. Manufacturing package release — RESOLVED 2026-09-22, historical record below

**Correction (2026-09-22):** the block described in this section was resolved after this audit's
original 2026-09-18 pass. Production Plan PP-1 through PP-8 all shipped and were independently
ACCEPTED afterward, with no unresolved HIGH/CRITICAL findings (`docs/controls/TEMP_DUAL_CLAUDE_MODE.md`
session log). The findings and quote below are preserved as the historical record of what was
blocking at the time this document was originally written — they do not describe current
repository state and should not be treated as an open gate on any package.

This is not a new finding — it's already recorded in `docs/operations/AI_WORK_LOG.md` — but it is
the most load-bearing fact for this audit, because master plan §25 rule 2 ("Is the previous
dependency complete?") makes it a hard gate on **any** further Manufacturing work:

- Combined package (Work Order detail, Work Order Create, Material Transfer) commit `25b882e`,
  remediated in `517f2ea`, was re-reviewed by Codex on 2026-09-17 and returned **`CHANGES
  REQUIRED`**.
- **`CX-MFG-001` (blocking, partially resolved):** the material-transfer Server Functions
  authenticate the *data* (re-fetching from a fresh `make_stock_entry` preview) but not the
  *caller* — `workOrderName` is a bound argument that Next.js still treats as directly
  POST-callable, and nothing in either action validates the current session against the requested
  Work Order. Duplicate crafted rows also aren't aggregate-capped against the fresh ceiling before
  Draft creation.
- **`CX-MFG-002` (blocking, partially resolved):** the BOM→Work Order operations copy on Create
  sends only `operation`/`workstation`/scaled `time_in_mins`, omitting `fixed_time`,
  `sequence_id`, `workstation_type`, `batch_size` and other native routing fields — so fixed-time
  operations get incorrectly scaled and routing/capacity semantics are lost relative to ERPNext's
  own native copy behavior.
- The work log's own words: *"Combined package release remains `BLOCKED` and is returned to
  Claude; **do not start the next Manufacturing package.**"*

**Implication at the time this was written:** Job Card list/detail, BOM, Workstations, and OEE
could not be scheduled as NEXT work until this remediation closed. **This has since happened** —
BOM shipped and, as of 2026-09-22, independently ACCEPTED (see §2's Master Data row), and the PP track
delivered Production Plan → Work Order → Material Transfer → Material Request → multi-level BOM →
Cancel, all ACCEPTED. Job Card and Workstations remain genuinely not started, but not because of
this historical block — see §6's NEXT section.

---

## 4. Backend knowledge policy debt

`docs/backend/README.md` states plainly: *"Sales, Inventory, Buying, Purchasing, Accounting, and
Tax are all real, shipped functionality in the frontend already... but have no backend
documentation yet."* Manufacturing (Work Order + Material Transfer) and, **as of 2026-09-22, Master
Data** (package MD-R2, `5d291db`, independently reviewed and ACCEPTED) have reached `DOCUMENTED`
status in `docs/backend/15-migration/migration-status.md`; everything else is still
`FRAPPE_REFERENCE`. Master Data's baseline covers all 9 priority doctypes (Item, Item Group, UOM,
Warehouse, Customer, Supplier, Contact, Address, Territory) plus a BOM cross-reference, and
surfaced one confirmed frontend gap — the Customer/Supplier ↔ Contact/Address `Dynamic Link`
relationship is not wired up anywhere in this frontend (`MD-UNV-003`, not resolved by this
package). See `docs/master-data-architecture.md` §8/§9 for detail.

This matters because `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` is one of the five binding
control documents, and its Package Closure Rule (`CLAUDE.md` item 5) requires backend
documentation for *any meaningful ERP frontend feature* — Sales and Inventory/Buying shipped
before this policy existed (2026-09-17), so this is accumulated debt, not a new violation, but it
is real debt against a currently-binding rule and master plan §28 rule 7 ("Is backend behavior
understood?").

---

## 5. Open decisions for Niroshan (not decided by this audit)

Per master plan §25 and `DEVELOPMENT_SYSTEM_RULES.md` §9 ("Architecture & sequencing decisions →
Founder/product owner"), these are flagged, not resolved:

1. **Finance/Accounting sequencing.** `DEVELOPMENT_SYSTEM_RULES.md`'s own table ranks it priority
   5, but the live Current Mission lock in `CLAUDE.md` doesn't mention it at all after
   Manufacturing. The master plan treats Finance as core to Stage 01, "deeply integrated rather
   than a separate isolated module." Decide: does Finance get a slot in the priority lock after
   Manufacturing closes, or does it stay implicit (ERPNext's own GL, no dedicated Ceylon Stack UI)
   for longer?
2. **CRM's place in the sequence.** The master plan puts CRM at the very start of the customer
   lifecycle diagram (Lead → Opportunity → Quotation → ... ) and lists it first among Stage 01
   modules, ahead of Sales in the diagram even though Sales was built first in practice. The
   Current Mission lock has no CRM entry at all. Decide: is CRM genuinely Stage 01 (add it to the
   lock, likely after Manufacturing unblocks), or does the existing "whitelabel Frappe CRM as a
   future product" idea (`project_product_portfolio_plan` memory) satisfy this instead of a native
   Ceylon Stack CRM build?
3. **Master Data implementation timing — RESOLVED, moot.** This item asked whether to fold the
   architecture doc's first package into the release window. **Overtaken by events:** the Item,
   Business Partner, and Warehouse domain packages shipped and were independently ACCEPTED
   2026-09-18/19, before this decision was ever made. Master Data backend-knowledge capture
   (`docs/master-data-architecture.md` §9, MD-R2) is **done** — `5d291db`, independently reviewed
   and ACCEPTED 2026-09-22. BOM independent review (`MD-R1`) is also **done** — reviewed
   2026-09-22 (`CHANGES REQUIRED`), remediated (`23886ac`), and independently accepted by a
   separate-account/session governance confirmation the same day. What remains open, narrower
   still, is `MD-UNV-003` relationship architecture/remediation planning — a product/scope
   decision, not a sequencing gate. Net-new Master Data screens (Supplier Group, Operations/Workstations, Financial/Organizational
   masters) remain genuinely gated on product prioritization — that part of the original question
   is still open.
4. **Full Purchasing chain.** Confirm the PO→Receipt→Invoice-only cut is intentional and durable
   for v1, or whether Purchase Request/RFQ/Supplier Quotation should be scoped once Buying's core
   is exercised more in practice.

---

## 6. Dependency-aware backlog

Categorization follows master plan §28 item 13 exactly. "Package" sizing follows
`docs/controls/AGENT_USAGE_POLICY.md` §8 (one small package per session — nothing below is meant
to be built as a single session).

### CURRENT RELEASE (blocks everything else; work here before any NEXT item starts)

1. **RESOLVED, removed 2026-09-22 — was "close the Manufacturing package 2/3/5 remediation loop."**
   The PP track superseded and closed this; see §3's correction note. No action remains here.
2. **Change the ERPNext Administrator password from the `pwd.yml` default.** Still an open
   checkbox in `PLAN.md` Week 1-2 and an explicit `CLAUDE.md` ground rule ("before this goes any
   further"). Zero dependencies, should not wait on anything else. Not re-verified during this
   2026-09-22 correction pass (documentation-only scope) — status unconfirmed either way.
3. **Decide and record** open items #1 (Finance sequencing), #2 (CRM sequencing), and #4 (full
   Purchasing chain) in §5 — item #3 (Master Data timing) is resolved, see §5. This is a
   conversation + a short ADR/CLAUDE.md update, not code.
4. **Backend-knowledge baseline for Sales** (highest-traffic shipped module) — one scoped
   documentation package under `BACKEND_KNOWLEDGE_POLICY.md`.
5. **RESOLVED, closed 2026-09-22 — was "Backend-knowledge baseline for Master Data."**
   `docs/backend/01-master-data/` now exists (package MD-R2, `5d291db`), independently reviewed and
   **ACCEPTED** 2026-09-22; see §4 and `docs/master-data-architecture.md` §8/§9. No action remains
   here. One confirmed frontend gap surfaced, not resolved by this package: Customer/Supplier ↔
   Contact/Address linkage (`MD-UNV-003`) — a future product/scope decision, tracked in
   `docs/backend/99-unverified/unverified-behaviours.md`, not a CURRENT RELEASE blocker.
6. **RESOLVED, closed 2026-09-22 — was "BOM independent review."** Package 4A never independently
   reviewed before `MD-R1`; Package 4B independently reviewed by Codex (`CHANGES REQUIRED`),
   partially remediated by `6c38f7b`; `MD-R1` (2026-09-22) independently reviewed the complete
   shipped BOM surface, also `CHANGES REQUIRED`; `23886ac` remediated those findings; a
   separate-account/session governance confirmation accepted that remediation the same day. **BOM
   is now independently ACCEPTED** — see `docs/master-data-architecture.md` §9. No action remains
   here.

### NEXT (once CURRENT RELEASE clears; still Stage 01/02 per master plan)

- Remaining Manufacturing frontend packages not yet started: Job Card list/detail, Workstations,
  OEE (each its own scope per `CLAUDE.md`'s existing note). BOM is no longer in this bucket — it
  shipped, see CURRENT RELEASE item 6.
- Backend-knowledge baselines for Inventory, Buying, and Tax (Accounting baseline depends on
  decision #1 in §5).
- Remaining net-new Master Data screens (Supplier Group, Operations/Workstations,
  Financial/Organizational masters) from `docs/master-data-architecture.md` §9 (MD-R3–MD-R5) —
  product-prioritization decision, not a sequencing gate.
- Whichever of CRM / Finance decisions #1–2 resolve to "build now" — scoped as its own module
  build-out following the same Definition-of-Ready cadence as Sales/Inventory/Buying.
- Close remaining Reports hub gaps (Sales 17/18, Buying 13/native, Stock mostly "coming soon") —
  Stage 04 "standard reporting" per master plan §21, explicitly *not* the advanced reporting
  platform, so it belongs here rather than in LATER.
- Stage 02 "Business Integrity" validation pass (master plan §26 / Stage 02) once Stage-01 modules
  above are complete: accounting/stock/manufacturing integration checks, permissions, audit trail
  — largely QA/backend-documentation work rather than new UI.

### LATER (Stage 03–06 — explicitly deferred by the master plan until transactional modules are stable)

- Workflow engine + rule engine (Stage 03).
- Approval platform / approval inbox (Stage 03).
- Analytics semantic/metric layer (Stage 04, the *governed* layer — distinct from the standard
  reports already in NEXT).
- Self-service Report Builder / dashboard designer (Stage 05).
- Modeling Studio (financial/sales/manufacturing planning, scenario analysis) (Stage 06).
- Excel Workspace (upload/map/join/model against ERP data) (Stage 06).

### RESEARCH (Stage 07–09 — architecture-only until LATER items exist to build on)

- AI Analyst platform (governed query layer, AI Report Builder, AI Excel/Financial/Management/
  Workflow assistants) — master plan §17 governance model (permission → business rule →
  validation → confirmation → action → audit log) should be the design reference whenever this is
  scoped, not something to prototype early.
- Mobile application (management, approvals, operational, AI mobile) — `apps/mcp-server` and the
  existing REST API surface are the eventual integration points, nothing to build yet.
- Advanced automation ecosystem (webhooks, n8n, WhatsApp/email triggers). `apps/mcp-server`
  already exists as an early, narrower seed of this (dev/ops tool wrapping ERPNext's REST API as
  scoped tools) — worth noting as prior art when this stage is eventually scoped, not something to
  expand now.

---

## 7. What this audit deliberately does not do

Per master plan §25 and §28 item 14: this document estimates packages and sequencing, it does not
implement anything, and it does not resolve the open decisions in §5. No control document was
edited. No code in `apps/frontend`, `apps/smart_factory`, `apps/mes-service`, or `apps/mcp-server`
was touched. The dual-agent governance in `docs/controls/AI_DUAL_AGENT_OPERATING_MODEL.md` and
`AI_AGENT_HANDOFF_POLICY.md` is unaffected — Codex's review of the Manufacturing remediation
remains the next required step for that specific package (§3), independent of this document.
