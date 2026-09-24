---
title: Lead
module: CRM
type: document
status: LIVE
frontend_route: /crm/leads
canonical_entity: lead
backend_doc: docs/backend/16-crm/crm-architecture.md
last_verified: 2026-09-24
---

## Overview

A Lead is a prospective customer captured before any commercial relationship exists — the entry
point of the CRM pipeline.

## Business Purpose

Lets a sales team track who they're talking to before there's a confirmed sales opportunity, and
converts cleanly into an Opportunity or Customer once the conversation is real.

## Where to Find It

CRM → Leads (`/crm/leads`)

## Prerequisites

```config
unknown: No hard prerequisite master data confirmed — a Lead can be created standalone. NEEDS_VERIFICATION: whether Territory/Industry/Lead Source master data must pre-exist for the filters to be meaningful.
```

## Process Flow

```flow
Lead
Opportunity
Customer
```

## How to Create

1. Navigate to CRM → Leads.
2. Select New Lead (`/crm/leads/new`).
3. Enter the Lead's details.
4. Save.
5. From the Lead detail page, use Convert to Opportunity or Convert to Customer once ready.

## Important Fields

Status — one of `Lead / Open / Replied / Opportunity / Quotation / Lost Quotation / Interested /
Converted / Do Not Contact`. Status does **not** auto-transition on conversion — this app
explicitly sets it (a deliberate correction to ERPNext's own native conversion mapper, which
never updates Lead status itself).

Lead Type — Client / Channel Partner / Consultant (used as the closest real, filterable
classification available; confirmed against live ERPNext during `CRM-1`).

## Document Lifecycle

Lead has no Draft/Submitted/Cancelled workflow (it is not a submittable doctype) — it moves
through its `status` field instead, ending at `Converted` or `Do Not Contact`.

## Available Actions

Edit · Change Status · Convert to Opportunity · Convert to Customer

## Roles & Permissions

Status changes are enforced through a server-side allowlist, not just a UI-hidden control — a
gap this app closed itself: once a Lead is no longer manually settable (e.g. already converted),
the status control shows read-only text instead of allowing a silent revert back to open status.

## Stock Impact

NO STOCK IMPACT

## Accounting Impact

NO ACCOUNTING IMPACT

## Related Documents

Lead → Opportunity conversion creates an Opportunity with the same field mapping ERPNext's own
native `lead/mapper.py` uses. Lead → Customer conversion creates a canonical
`/master-data/customers` record with `lead_name` set as the conversion-provenance pointer.

## Common Scenarios

A Lead can generate more than one Opportunity — the Convert-to-Opportunity action stays available
after first use.

## Limitations

No Competitor picker on the Lead itself (that's a Quotation/Opportunity Mark Lost concept). Per-
user permission enforcement is not yet live — every logged-in person currently shares one service
account's ERPNext access (see Platform Hardening in the Release Log).

## Technical Reference

ERPNext doctype: `Lead`. Frontend: `apps/frontend/src/app/(app)/crm/leads/`. Conversion logic:
`lib/actions/leadConversion.ts` (deliberately kept separate from
`master-data/customers/actions.ts`). Full field mapping and live-verified behavior:
`docs/backend/16-crm/crm-architecture.md` §5.1, §6, §24.
