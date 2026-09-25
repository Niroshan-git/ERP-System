---
title: CRM — Overview
module: CRM
type: module-overview
status: PARTIAL
frontend_route: /crm
backend_doc: docs/backend/16-crm/crm-architecture.md
last_verified: 2026-09-25
---

## Purpose

CRM tracks a prospective customer from first contact through to becoming a paying customer, on
top of ERPNext's real `Lead`/`Opportunity` doctypes — the first CRM frontend surface this product
has ever had (added 2026-09-24 as a dated exception ahead of full Finance V1 completion; see
`CLAUDE.md`'s Current Mission lock).

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
Opportunities. **Building** — implementation-complete and code-reviewed, but this session's QA was
access-constrained (no browser/write credentials), so live create/edit/Mark-Lost/Quotation-handoff
mutations are tracked as `CRM-UNV-010`, not yet closed.

Activities & Follow-ups  
Call/Meeting/Follow-up/Note logging on Lead and Opportunity, a unified per-record activity
timeline, next-follow-up/overdue derivation, and a cross-record `/crm/activities` work queue. See
`activities.md`. **Building** — implementation-complete, code-reviewed, and QA'd this session; not
yet reviewed/accepted by Niroshan.

Pipeline Workspace  
**Planned** (`CRM-4`) — not started, not authorized.

## Required Configuration

```config
unknown: Whether a Customer must already exist for an Opportunity, or a Lead is always the starting point — see docs/backend/16-crm/crm-architecture.md §25.3 for the design decision made this package
```

## Integration With Other Modules

CRM → Sales: the Opportunity → Quotation handoff feeds directly into the canonical Sales
Quotation flow (Customer-partied Opportunities only). CRM → Master Data: Lead → Customer
conversion creates a canonical `/master-data/customers` record.

## Related Documents

`docs/backend/16-crm/crm-architecture.md` for the full architecture and package roadmap.

## Technical Reference

ERPNext doctypes: `Lead`, `Opportunity`, plus `ToDo`/`Event`/`Communication`/`CRM Note` for
Activities (`CRM-3`). No separate Ceylon Stack CRM doctype exists anywhere in this module.
