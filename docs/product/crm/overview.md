---
title: CRM — Overview
module: CRM
type: module-overview
status: LIVE
frontend_route: /crm
backend_doc: docs/backend/16-crm/crm-architecture.md
last_verified: 2026-09-25
---

## Purpose

CRM tracks a prospective customer from first contact through to becoming a paying customer, on
top of ERPNext's real `Lead`/`Opportunity` doctypes — the first CRM frontend surface this product
has ever had (added 2026-09-24 as a dated exception ahead of full Finance V1 completion; see
`CLAUDE.md`'s Current Mission lock). **CRM V1 is now `V1 FROZEN`** (`CRM-5`, 2026-09-25) — the
`Lead → Opportunity → Quotation → Sales Order` lifecycle is verified end-to-end through ERPNext's
own canonical mechanisms; no new CRM V1 features ship without a fresh, dated authorization. See
`docs/backend/16-crm/crm-architecture.md` §28 for the full closure account.

## Process Flow

```flow
Lead
Opportunity
Activities
Quotation
Sales Order
```

## Main Functions

Leads  
Full list/create/detail, with Lead → Opportunity and Lead → Customer conversion. **Live,
ACCEPTED** 2026-09-24.

Opportunities  
Full list/create/detail, Mark Lost, and an Opportunity → Quotation handoff for Customer-partied
Opportunities (now carrying Contact/Address context through, fixed by `CRM-5`). **Live** —
implementation-complete, code-reviewed, and source-verified end-to-end into Sales by `CRM-5`; live
create/edit/Mark-Lost/Quotation-handoff mutations remain untested against real data on this
instance, tracked as `CRM-UNV-010` (non-blocking, disclosed).

Activities & Follow-ups  
Call/Meeting/Follow-up/Note logging on Lead and Opportunity, a unified per-record activity
timeline, next-follow-up/overdue derivation, and a cross-record `/crm/activities` work queue. See
`activities.md`. **Live** — implementation-complete, code-reviewed, and QA'd; live mutation
verification remains open (`CRM-UNV-011`, non-blocking, disclosed).

Pipeline Workspace  
KPI summary, a Sales Stage board, and an Attention Queue (overdue/due-today/no-next-action/
closing-soon/past-expected-close/stale) over the active pipeline. See `pipeline.md`. **Live** —
implementation-complete and code-reviewed; zero live Opportunity records exist on the instance, so
live rendering/mutation remains tracked as `CRM-UNV-012` (non-blocking, disclosed).

CRM → Sales Integration & V1 Closure (`CRM-5`)  
Verified the full `Lead → Opportunity → Quotation → Sales Order` chain end-to-end (source-level,
this instance has zero live Lead/Opportunity records to run a live disposable-fixture test
against) and fixed one real defect: the Opportunity → Quotation handoff was silently dropping the
Opportunity's Contact/Address. Confirmed no duplicated Customer/Contact/Address/Quotation/Sales
Order implementation exists anywhere in CRM. **CRM V1 status: `V1 ACCEPTED WITH DISCLOSED GAPS`,
now `V1 FROZEN`.**

## Required Configuration

```config
required: Neither — an Opportunity can start directly from an existing Customer or from a Lead (via conversion); both party types are supported at creation (crm-architecture.md §25.3)
conditional: A Customer must exist before the Opportunity → Quotation handoff will work — a Lead-partied Opportunity must convert its Lead to a Customer first
```

## Integration With Other Modules

CRM → Sales: the Opportunity → Quotation handoff feeds directly into the canonical Sales
Quotation flow (Customer-partied Opportunities only), carrying items, territory, customer group,
and — as of `CRM-5` — Contact/Address through. The resulting Quotation preserves a
`Quotation.opportunity` back-reference; once submitted and converted to a Sales Order (existing
Sales flow, unmodified), the Sales Order Item's native `prevdoc_docname` completes the traceable
chain back through the Quotation to the originating Opportunity. CRM → Master Data: Lead →
Customer conversion creates a canonical `/master-data/customers` record; the Opportunity's own
Contact/Address picker reuses Master Data's canonical `Contact`/`Address` records directly, no
CRM-owned copy.

## Related Documents

`docs/backend/16-crm/crm-architecture.md` for the full architecture and package roadmap.

## Technical Reference

ERPNext doctypes: `Lead`, `Opportunity`, plus `ToDo`/`Event`/`Communication`/`CRM Note` for
Activities (`CRM-3`). No separate Ceylon Stack CRM doctype exists anywhere in this module.
