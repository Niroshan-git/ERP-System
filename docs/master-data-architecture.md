# Master Data Architecture

**Status:** Baseline, reconciled against shipped implementation (2026-09-22). Originally authored
2026-09-17 as a forward-looking proposal, written when master-data routes genuinely still lived
under `/sales/*`/`/buying/*`/`/stock/*`. Before this document was ever committed, a separate
session shipped most of what it proposed — under ad hoc package names ("Master Data
Canonicalization — Item domain", "— Business Partner domain", "— Inventory Structure domain",
"Manufacturing Masters — BOM Package 4A/4B") — on 2026-09-18/19. This pass corrects the document to
match Git/`docs/operations/AI_WORK_LOG.md` evidence rather than adopt a stale premise. See
`docs/architecture/decisions/README.md` ADR-007 for the durable decision this document backs
(also corrected in this pass).

**This correction pass changed documentation only.** No route, no `Sidebar.tsx` edit, no
application code — everything described as "shipped" below was already shipped before this pass
started; this pass only makes the written record agree with it.

**Relationship to other docs:**
- `docs/architecture.md` — deployment/runtime layered architecture (shop floor → MES → ERPNext →
  analytics). Different diagram, complementary.
- `docs/backend/00-architecture/README.md` — the canonical-model layer stack this document's
  entity catalog would follow, once written (see §8 — this is a real, currently-open gap, not
  hypothetical).
- `docs/controls/FRONTEND_GUIDE.md` §9/§10/§10a — **already accurate and already updated** for the
  `/master-data/*` moves (confirmed live in the file, not assumed). This document does not need to
  trigger that update; it already happened alongside the domain packages that shipped it.
- `docs/controls/DEVELOPMENT_SYSTEM_RULES.md` — remains binding and unchanged by this document.

---

## 1. Executive Summary

**Master Data is not a proposal. It is a shipped, partially-reviewed domain.**

As of 2026-09-22, `Sidebar.tsx` (`apps/frontend/src/components/Sidebar.tsx:328`) has a `master-data`
module ("Master Data", `Database` icon) alongside Sales/Buying/Stock/Manufacturing, and
`apps/frontend/src/app/(app)/master-data/` contains real route folders: `addresses`, `boms`,
`contacts`, `customer-groups`, `customers`, `item-groups`, `items`, `price-lists`, `suppliers`,
`territories`, `warehouses`. The old `/sales/items`, `/sales/customers`, `/sales/contacts`,
`/sales/addresses`, `/sales/territories`, `/sales/item-groups`, `/sales/price-lists`,
`/sales/customer-groups`, `/buying/suppliers`, and `/stock/warehouses` route folders **no longer
exist** — confirmed by direct directory listing, not inferred from a comment. Old paths redirect
(307, not removed outright) per `FRONTEND_GUIDE.md` §9/§10.

**What shipped, by domain package (all dated 2026-09-18/19, all pre-dating this document's original
version):**
1. **Item domain** (`ddfeed4`/`5f20afa`/`4036c81`) — Item, Item Group, Price List → `/master-data/*`.
   **Independently reviewed and ACCEPTED** (`AI_WORK_LOG.md`, `CX-MD-001` closed).
2. **Business Partner domain** (`a99656d`/`4984963`) — Customer, Customer Group, Supplier, Contact,
   Address, Territory → `/master-data/*`. **Independently reviewed and ACCEPTED** (`PASS WITH
   NON-BLOCKING FINDINGS`).
3. **Inventory Structure domain** (`f078610`/`8cf45de`/`7447574`/`2a7076c`) — Warehouse →
   `/master-data/warehouses`. Batch and Serial No were investigated **twice** (once during this
   package, once during the original architecture pass) and deliberately **not** moved — they stay
   Stock-owned as hybrid masters (created as a side effect of a Stock Entry/Delivery Note, then
   referenced as a master identity afterward). **Independently reviewed and ACCEPTED**
   (`CX-MD-WH-003` closed).
4. **Manufacturing Masters — BOM** (`ad8ad92`/`de6733c`/`9fe773e` for 4A, `305ccd7` for 4B) — first
   BOM frontend: read-only list/detail (`/master-data/boms`, Package 4A), then create + Draft-only
   inline edit (`/master-data/boms/new`, Package 4B). Full header form, component/operation
   child-table CRUD. Submit/Cancel/Amend explicitly deferred, not built. **In-session
   `code-reviewer`/`qa-tester` both passed, but this is still `CLAUDE_HANDOFF` — it has never
   received independent (Codex/cross-account) review.** This is why
   `docs/ceylon-stack-documentation.html` correctly keeps BOM at "Building," not "Live," even
   though the code exists and works. Treat BOM's frontend as shipped-but-not-release-ready, not as
   fully closed.

**What is still genuinely not built:** Supplier Group (dedicated screen — currently a
`fetchLinkOptions` dropdown only), Operations, Workstations, and every Financial/Organizational
master (Company, Cost Center, Project, UOM, Brand exposure on Item).

**What's still true from the original analysis:** no master entity is duplicated in code —
`lib/erpnext.ts` (`listDocs`/`getDoc`/`createDoc`/`updateDoc`/`submitDoc`/`cancelDoc`/`deleteDoc`,
all doctype-parameterized) remains the single API layer; every domain package above moved a route,
it did not fork a new implementation.

**A gap this document's original version claimed to close but didn't — now closed, 2026-09-22
(MD-R2):** `docs/backend/01-master-data/` **now exists.** The original version of this document
(committed `caf1a46`) claimed it would be created "in this pass" but wasn't; that debt was closed
the same day by a separate package, `5d291db` (MD-R2), independently reviewed and **ACCEPTED**
2026-09-22. `docs/backend/15-migration/migration-status.md` now lists Master Data at `DOCUMENTED`.
See §8 for the current state.

---

## 2. Master Data Inventory — Current State (verified 2026-09-22)

| Entity | Current Route | Status | ERPNext DocType | Consuming Modules | Notes |
|---|---|---|---|---|---|
| Item | `/master-data/items` | **Shipped, ACCEPTED** | `Item` | Sales, Buying, Stock, Manufacturing | Redirect from `/sales/items` still live |
| Item Group | `/master-data/item-groups` | **Shipped, ACCEPTED** | `Item Group` | Sales, Manufacturing | — |
| Price List | `/master-data/price-lists` | **Shipped, ACCEPTED** | `Price List` | Sales | — |
| Customer | `/master-data/customers` | **Shipped, ACCEPTED** | `Customer` | Sales | Bespoke form, not `MasterForm` |
| Customer Group | `/master-data/customer-groups` | **Shipped, ACCEPTED** | `Customer Group` | Sales | — |
| Supplier | `/master-data/suppliers` | **Shipped, ACCEPTED** | `Supplier` | Buying | Bespoke form, not `MasterForm` |
| Contact | `/master-data/contacts` | **Shipped, ACCEPTED** | `Contact` | Sales, Buying | Shared since before this domain moved |
| Address | `/master-data/addresses` | **Shipped, ACCEPTED** | `Address` | Sales, Buying | Shared since before this domain moved |
| Territory | `/master-data/territories` | **Shipped, ACCEPTED** | `Territory` | Sales | — |
| Warehouse | `/master-data/warehouses` | **Shipped, ACCEPTED** | `Warehouse` | Stock, Manufacturing | `account`/`warehouse_type` unexposed (future) |
| Batch | `/stock/batches` | **Deliberately not moved** | `Batch` | Stock, Manufacturing | Hybrid master, confirmed twice |
| Serial No | `/stock/serial-nos` | **Deliberately not moved** | `Serial No` | Stock, Manufacturing | Hybrid master, confirmed twice |
| BOM | `/master-data/boms` | **Shipped, `CLAUDE_HANDOFF` — not independently reviewed** | `BOM` | Manufacturing | List/detail/create/Draft-edit; no Submit/Cancel/Amend |
| Supplier Group | *(none — dropdown only)* | **Not built** | `Supplier Group` | Buying | §10 open question unchanged |
| Sales Person, Sales Partner, Campaign | `/sales/*` | **Deliberately stayed Sales-owned** | various | Sales | Internal-team/marketing, not shared masters |
| Operation, Workstation | *(none)* | **Not built** | `Operation`, `Workstation` | Manufacturing | Gated by Manufacturing mission lock |
| Company, Cost Center, Project, UOM | *(none — dropdown only)* | **Not built** | various | All | Net-new feature work, low urgency |
| Brand | *(unconfirmed)* | **`NEEDS_VERIFICATION`** | `Brand` | — | Not re-investigated this pass |

---

## 3. Current Cross-Module Navigation — What Already Works

Every cross-module link investigated in the original pass has since been repointed at the real
canonical routes, not link-outs to `/sales/*`:

- Buying's Sidebar "Suppliers & contacts" group links to `/master-data/contacts` and
  `/master-data/addresses` (`Sidebar.tsx:187-189`) — these became true canonical routes as part of
  the Business Partner domain package, 2026-09-19 (`Sidebar.tsx:159-162` comment records this
  history explicitly).
- Stock's Sidebar "Warehouses & tracking" group links Items to `/master-data/items` and Warehouses
  to `/master-data/warehouses` (`Sidebar.tsx:225,228`) — both are canonical link-outs, not forked
  copies (`Sidebar.tsx:202-205` comment).
- Work Order detail's Production Item, Sales Order, and warehouse fields resolve to
  `/master-data/items/[name]`, `/sales/orders/[name]`, `/master-data/warehouses/[name]`
  respectively — updated as part of each domain package's own inbound-link sweep.
- Material Transfer's warehouse fields resolve to `/master-data/warehouses/[name]`.
- Work Order list/detail's `bom_no` (Package 4A) links to `/master-data/boms/[name]` — the one
  BOM-related link that exists despite BOM's own screen remaining unreviewed.

**Still not following it, because no route exists to link to:** Job Card (no detail route yet, own
future package per Current Mission).

---

## 4. Target Architecture — Largely Achieved

```
MASTER DATA (shared domain, own module in the Sidebar)         ← SHIPPED, this exact structure
        │
   ┌────┼────────────┬─────────────┬──────────────┐
   │              │              │              │
Products      Business       Inventory      Manufacturing   Financial /
& Pricing     Partners       Structure       Masters        Organizational
 SHIPPED       SHIPPED        SHIPPED     PARTIAL (BOM only,   NOT BUILT
                                          unreviewed)
   │              │              │              │              │
   └──────────────┴──────────────┴──────────────┴──────────────┘
                              │
        ┌─────────────────────┼─────────────────────┬────────────────┐
        │                     │                     │                │
      SALES                BUYING              INVENTORY       MANUFACTURING
        │                                                             │
        └─────────────────────────────── FINANCE (future) ───────────┘
```

Transactional routes (`Sales Order`, `Purchase Order`, `Stock Entry`, `Work Order`, ...) were not
touched by any of the domain packages above and remain exactly where they were.

### Canonical ownership rule — confirmed in force

For every shared master entity that has shipped, there is exactly one canonical route
(`/master-data/<entity>` for list, `/master-data/<entity>/[name]` for detail) and exactly one
component pair rendering it. No exceptions found during this reconciliation pass.

---

## 5. Frontend Information Architecture — Current State

```
MASTER DATA                                               STATUS
│
├── Overview                                              SHIPPED (module home)
│
├── Products & Pricing
│   ├── Items                    /master-data/items       SHIPPED, ACCEPTED
│   ├── Item Groups              /master-data/item-groups  SHIPPED, ACCEPTED
│   ├── Price Lists              /master-data/price-lists  SHIPPED, ACCEPTED
│   └── Brands                                             NOT BUILT — NEEDS_VERIFICATION whether
│                                                           Item.brand is even exposed (§10)
│
├── Business Partners
│   ├── Customers                /master-data/customers        SHIPPED, ACCEPTED
│   ├── Customer Groups          /master-data/customer-groups  SHIPPED, ACCEPTED
│   ├── Suppliers                /master-data/suppliers        SHIPPED, ACCEPTED
│   ├── Supplier Groups                                        NOT BUILT (§10 open question)
│   ├── Contacts                 /master-data/contacts         SHIPPED, ACCEPTED
│   ├── Addresses                /master-data/addresses        SHIPPED, ACCEPTED
│   └── Territories              /master-data/territories      SHIPPED, ACCEPTED
│
├── Inventory Structure
│   ├── Warehouses               /master-data/warehouses   SHIPPED, ACCEPTED
│   ├── Batches                  /stock/batches (stays)    Deliberately not moved (hybrid master)
│   └── Serial Nos               /stock/serial-nos (stays) Deliberately not moved (hybrid master)
│
├── Manufacturing Masters
│   ├── BOMs                     /master-data/boms         SHIPPED, unreviewed (`CLAUDE_HANDOFF`)
│   ├── Operations                                          NOT BUILT — gated by Manufacturing lock
│   └── Workstations                                        NOT BUILT — gated by Manufacturing lock
│
└── Financial / Organizational                              NOT BUILT — every field today is a
    ├── Companies                                           fetchLinkOptions() dropdown only
    ├── Cost Centers
    ├── Projects
    └── UOM
```

Sales Persons, Sales Partners, and Campaigns remain deliberately Sales-owned (internal-team/
marketing constructs, not cross-module shared masters) — unchanged from the original analysis.
Chart of Accounts/Account remains explicitly out of v1 scope per `FRONTEND_GUIDE.md` §4.

---

## 6. Cross-Module Navigation Rules — Current State

| From (transaction) | Entity clicked | Resolves to (now) |
|---|---|---|
| Sales Order / Quotation / Invoice / Delivery Note | Customer | `/master-data/customers/[name]` |
| Purchase Order / Receipt / Invoice / RFQ / Supplier Quotation | Supplier | `/master-data/suppliers/[name]` |
| Any line item, any module | Item | `/master-data/items/[name]` |
| Stock Entry, Work Order, any warehouse field | Warehouse | `/master-data/warehouses/[name]` |
| Work Order Create/Detail | BOM | `/master-data/boms/[name]` (unreviewed screen, but the link works) |
| Any document | Contact / Address | `/master-data/contacts/[name]` / `/master-data/addresses/[name]` |

**Rule (still in force, now enforced by shipped code, not aspiration):** a transactional module
does not render its own copy of a master's detail view. This was verified against the actual
routes above, not re-asserted from the original doc.

---

## 7. Database / Future Ceylon Stack Backend Principles

Unchanged from the original analysis — these are architecture principles, not route claims, and
nothing found during this reconciliation pass contradicts them:

- **Canonical identity, not display name.** Frappe's `name` field doubles as both the permanent
  document ID and the autoname-derived business key for `Item`/`Customer`/`Supplier`/`Warehouse` in
  this instance.
- **Master vs. transaction vs. system data** — classification unchanged.
- **Hybrid masters** (Batch, Serial No) — classification re-confirmed twice now (original pass,
  then again during the Inventory Structure domain package), no longer an open question.
- **Tenant/company ownership** — `Company` is the closest boundary; most investigated masters are
  not company-scoped in ERPNext. Still `NEEDS_VERIFICATION`/open design question (§10).
- **Snapshot vs. reference** — unchanged; already how ERPNext's own child tables work.
- **Soft-delete only** — unchanged; `deleteDoc` still not wired to any master list page's UI action.

---

## 8. Backend Knowledge Deliverable — DONE (2026-09-22, MD-R2)

The original version of this document claimed `docs/backend/01-master-data/` would be created "in
this pass." It was not — that gap was tracked as open debt in this section for the rest of
2026-09-22 until package **MD-R2** (`5d291db`) closed it the same day, independently reviewed and
**ACCEPTED**. `docs/backend/15-migration/migration-status.md`'s Master Data row now reads
`DOCUMENTED`. The folder covers all 9 priority doctypes plus a BOM cross-reference, exactly as
originally scoped:

- `docs/backend/01-master-data/README.md` — domain overview
- `docs/backend/01-master-data/item.md` — Item, Item Group, UOM
- `docs/backend/01-master-data/customer-supplier.md` — Customer, Supplier
- `docs/backend/01-master-data/warehouse.md` — Warehouse
- `docs/backend/01-master-data/secondary-masters.md` — Contact, Address, Territory
- `docs/backend/01-master-data/bom.md` — cross-reference only; BOM's canonical documentation stays
  at `docs/backend/05-manufacturing/bom.md` (reconciled against the existing `MFG-UNV-008`,
  `CX-MD-BOM-001`/`002` history rather than duplicated, per `BACKEND_KNOWLEDGE_POLICY.md` §5)
- `docs/backend/11-relationships/master-erd.md` — extended with a Master Data ERD
- `docs/backend/15-migration/migration-status.md` — Master Data row updated to `DOCUMENTED`

One real finding surfaced by this baseline and independently confirmed during its review: the
Customer/Supplier ↔ Contact/Address relationship ERPNext natively supports (`Dynamic Link`) is not
wired up anywhere in this frontend — `MD-UNV-003` in
`docs/backend/99-unverified/unverified-behaviours.md`. This is a **confirmed frontend functional
gap**, not documented-but-unresolved uncertainty about ERPNext's own behavior, and it is a product/
scope decision for a future package, not something this baseline or its review closed. Item 2 in §9
below, which pointed at this as the next actionable package, is resolved as a result.

---

## 9. Gaps, Dependencies, and Recommended Remaining Packages

### CURRENT STATE (verified, not asserted)
- Master Data module exists in `Sidebar.tsx`, with real routes.
- Item, Business Partner, and Inventory Structure domains: shipped and independently ACCEPTED.
- BOM: shipped. Package 4A never independently reviewed; Package 4B reviewed once by Codex
  (`CHANGES REQUIRED`, 2 of 3 findings fixed same day, the security finding left `ACTION REQUIRED`
  until operator-confirmed credential rotation 2026-09-22). `MD-R1` (2026-09-22) reviewed the whole
  package fresh and also returned `CHANGES REQUIRED`; a remediation pass followed the same day —
  still `CLAUDE_HANDOFF`, awaiting independent re-review, not self-declared `ACCEPTED`.
- `FRONTEND_GUIDE.md` already documents this accurately (§9/§10/§10a) — no control-document
  update needed as a result of this correction pass.
- `docs/backend/01-master-data/` **exists** (since 2026-09-22, package MD-R2, `5d291db`,
  independently reviewed and ACCEPTED) — see §8. No longer open debt.

### GAPS (what's actually left)
1. **BOM independent review.** **Done, 2026-09-22 — `MD-R1`.** The whole package was
   independently reviewed fresh (not merely re-checked against the old Package 4B-era Codex
   findings) and returned `CHANGES REQUIRED`: one new MEDIUM code finding (now fixed by the same-day
   remediation pass) and the still-then-open `CX-MFG-BOM-4B-003` security finding (now recorded as
   resolved per operator-confirmed credential rotation). **`MD-R1` remains `CLAUDE_HANDOFF`** — the
   remediation itself has not yet received independent re-review, so BOM has still not moved from
   "Building" to "Live."
2. ~~Backend knowledge capture (§8).~~ **DONE 2026-09-22 (MD-R2, `5d291db`, ACCEPTED)** — see §8.
3. **Supplier Group, Operations, Workstations, Company, Cost Center, Project, UOM, Brand exposure**
   — all net-new feature work, not reorganization. Operations/Workstations additionally gated by
   the Manufacturing Current Mission lock — do not build ahead of that regardless of Master Data
   packaging.
4. **`FRONTEND_GUIDE.md`'s Sidebar/route documentation for the still-unbuilt domains** — not
   urgent; nothing to document until something ships.

### REMAINING PACKAGE SEQUENCE (renumbered against what's actually left, not the original MD-1–MD-10)

| # | Package | Status | Scope | Risk | Depends on |
|---|---|---|---|---|---|
| MD-R1 | BOM independent review | **Reviewed 2026-09-22 — `CHANGES REQUIRED`; same-day remediation pass complete, still `CLAUDE_HANDOFF`** | Independent review of shipped Package 4A/4B code (`ad8ad92`…`6c38f7b`); found 1 new MEDIUM code finding (fixed) + carried-forward `CX-MFG-BOM-4B-003` (now recorded resolved per operator-confirmed credential rotation); awaiting independent re-review | Low (review only) | None |
| MD-R2 | Backend knowledge — Master Data domain | **DONE (2026-09-22)** — `5d291db`, independently reviewed and **ACCEPTED** | Wrote `docs/backend/01-master-data/*` per §8, for all four already-shipped domain packages; surfaced `MD-UNV-003` (confirmed frontend gap, not resolved) | None (docs only) | None |
| MD-R3 | Supplier Group screen | Not started | New feature — resolve the §10 open question first (dedicated screen vs. dropdown) | Low | Product decision |
| MD-R4 | Manufacturing masters — Operations/Workstations | Not started, gated | Net-new screens under `/master-data/*` | New feature | Manufacturing Current Mission sequencing — do not start out of turn |
| MD-R5 | Financial/organizational masters | Not started, low urgency | First-ever screens for Company, Cost Center, Project, UOM | New feature | Product prioritization |
| MD-R6 | Ongoing migration/backend readiness | Ongoing | Keep `docs/backend/01-master-data/` and `master-erd.md` current as MD-R3–MD-R5 ship | None (docs only) | Runs alongside all of the above |

The original MD-1 through MD-10 sequence in this document's earlier draft is **superseded** — most
of what it described as "MD-1 through MD-7" already shipped under different names before that draft
was ever committed. It is preserved in Git history (this document's prior version) for audit
traceability, not reproduced here as if still pending.

---

## 10. Open Architecture Decisions / NEEDS_VERIFICATION — Unchanged, Still Open

Per `BACKEND_KNOWLEDGE_POLICY.md` §6 — none of these were resolved by the domain packages that
shipped since the original draft, and none should be inferred as resolved:

1. **Business Partner unification.** Still fully open. ERPNext keeps `Customer`/`Supplier` as
   separate DocTypes with no shared Party table; the shipped Business Partner *domain package* only
   grouped them under one Sidebar section and route prefix, it did **not** unify them at the data or
   component level (`CustomerForm.tsx` and Supplier's bespoke form remain separate). **Needs
   Niroshan's decision, not assumed here** — see §6 of the baseline task this document supports.
2. **Item rename behavior.** Unchanged, not tested since the original draft.
3. **Multi-tenancy mapping.** Unchanged — `Company` vs. a future `tenant_id` concept remains
   undecided; most masters are not Company-scoped in ERPNext today.
4. **Brand.** Still unconfirmed whether `ItemForm.tsx` exposes `Item.brand`.
5. **Supplier Group.** Still undecided whether it needs its own screen.
6. **Batch/Serial No classification.** No longer open — confirmed twice now (original pass, then
   again during the Inventory Structure domain package). Resolved: hybrid masters, stay under Stock.
7. **Cost Center / Project field-level detail.** Unchanged, not fetched.

---

## 11. Module Ownership vs. Data Ownership

A rule this document formalizes, consistent with everything shipped so far and with §4's
"Canonical ownership rule":

**Modules own business processes. Master Data owns shared business entities.**

| Module | Owns (process/transaction) | Does not own |
|---|---|---|
| Sales | Quotation, Sales Order, Delivery Note, Sales Invoice, Pick List | Customer, Item, Contact, Address, Territory, Price List — consumes them via `/master-data/*` |
| Buying | Material Request, RFQ, Supplier Quotation, Purchase Order, Purchase Receipt, Purchase Invoice | Supplier, Item, Contact, Address — consumes them via `/master-data/*` |
| Stock | Stock Entry, Stock Balance | Warehouse, Item — consumes them via `/master-data/*`; owns Batch/Serial No (hybrid, transaction-originated, deliberately not moved) |
| Manufacturing | Production Plan, Work Order, Job Card | BOM — consumes/renders it via `/master-data/boms`, does not fork its own BOM view; owns Work Order/Job Card process state |
| Master Data | Nothing transactional | Item, Item Group, Price List, Customer, Customer Group, Supplier, Contact, Address, Territory, Warehouse, BOM, and (once built) Supplier Group, Operation, Workstation, Company, Cost Center, Project, UOM |
| CRM (not built) | Lead, Opportunity, Activities (once built) | Customer, Contact, Address — must consume `/master-data/*`, not fork them (§12) |

A module may **link to** a Master Data entity's canonical route. It must not **render its own
copy** of that entity's list/detail view, even for convenience. This is not a new rule — it is
what every shipped domain package already does; this section makes it explicit so it survives past
the people who happened to build it that way.

---

## 12. CRM Dependency Map (planning reference only — CRM not started, not authorized by this document)

CRM does not exist in this repository (`QA_LOG.md`: "No CRM module exists in this frontend —
confirmed by directory listing, not assumed"). This section exists so that **when** CRM discovery
starts, it inherits the Master Data ownership rule from day one instead of rediscovering it:

```
Lead
    ↓
Opportunity
    ↓
Customer conversion  ← writes/updates a real Customer record
    ↓
Customer  (canonical: /master-data/customers/[name] — already shipped, ACCEPTED)
    ├── Contact  (canonical: /master-data/contacts/[name] — already shipped, ACCEPTED)
    └── Address  (canonical: /master-data/addresses/[name] — already shipped, ACCEPTED)
```

**Binding principle for whenever CRM is scoped:** CRM must not introduce `/crm/customers`,
`/crm/contacts`, or `/crm/addresses` as second implementations. Canonical Customer, Contact, and
Address already live at `/master-data/*` — CRM links to those routes, the same way Buying and Stock
already link to them today (§3). Lead and Opportunity are new entities with no existing canonical
home; they would be CRM-owned (per §11's table) unless a future decision says otherwise.

This section documents a dependency, not a schedule. It does not add CRM to the Current Mission
priority lock, and it does not authorize CRM discovery — see §13's readiness gates and
`docs/ceylon-stack-master-backlog.md` §5 decision #2.

---

## 13. Implementation Readiness Gates

**Master Data (remaining packages — MD-R1 through MD-R6, §9).** None of them require a new gate:
Master Data's architecture is already accepted and already largely implemented, per §1–§6. MD-R1
(BOM independent review) and MD-R2 (backend knowledge capture) can start without further sign-off —
no undecided architecture question blocks either one. MD-R3 through MD-R5 (net-new screens) are
gated on ordinary product prioritization, not architecture readiness.

**CRM discovery — not gated on Master Data architecture at all, but not authorized here.** Before
CRM discovery starts (whenever it's scheduled, per `docs/ceylon-stack-master-backlog.md` §5
decision #2), it should confirm:
- Canonical Customer/Contact/Address routes still resolve at `/master-data/customers`,
  `/master-data/contacts`, `/master-data/addresses` (§12).
- No `/crm/customers`-shaped duplicate is introduced (§11/§12's binding principle).
- Lead/Opportunity are scoped as CRM-owned process entities, not routed through Master Data.
These are confirmation checks against an already-accepted architecture, not new decisions — CRM
discovery does not need to wait on any Master Data package above to start, and this document does
not itself authorize CRM discovery to begin.

---

## 14. Governance Note

- This correction pass modified documentation only: this file and ADR-007 in
  `docs/architecture/decisions/README.md`. No route, `Sidebar.tsx`, or application code was
  touched — everything described as shipped above was already shipped before this pass began.
- **No overlap with active review work.** Manufacturing Production Plan PP-1 through PP-8 are all
  independently ACCEPTED per `docs/controls/TEMP_DUAL_CLAUDE_MODE.md`'s session log and
  `AI_WORK_LOG.md` — the "Manufacturing package 2/3/5 remediation currently BLOCKED" state that an
  earlier draft of `docs/ceylon-stack-master-backlog.md` recorded (`CX-MFG-001`/`CX-MFG-002`,
  commit `25b882e`/`517f2ea`) has since been resolved and superseded by the PP track; that backlog
  document is corrected in this same pass.
- **One real open review item:** BOM Package 4A/4B (`CLAUDE_HANDOFF`, never independently reviewed).
  This document does not authorize starting that review — it identifies it as the next actionable
  Master Data item (MD-R1). **Correction, 2026-09-22 (MD-R1 remediation pass):** this line was
  already imprecise when written — Package 4B specifically *had* been independently reviewed by
  Codex on 2026-09-19 (`CHANGES REQUIRED`), only Package 4A had genuinely never been reviewed. See
  §9's CURRENT STATE bullet above for the accurate, current history.
- This document does not authorize MD-R3 through MD-R6, Business Partner unification, or any other
  undecided item above. It is the corrected record of what already happened, plus what's actually
  left — not a new implementation authorization.
