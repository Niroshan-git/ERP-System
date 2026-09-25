---
title: Opportunity
module: CRM
type: document
status: LIVE
frontend_route: /crm/opportunities
canonical_entity: opportunity
backend_doc: docs/backend/16-crm/crm-architecture.md
last_verified: 2026-09-25
---

## Overview

An Opportunity represents a qualified sales prospect — a potential deal with estimated value and probability that moves through sales stages toward conversion.

## Business Purpose

Traces a sales prospect from initial qualification through to a firm commercial offer. Opportunities help sales teams prioritize where to invest effort by tracking deal value, probability, expected close dates, and sales stages.

## Where to Find It

CRM → Opportunities (`/crm/opportunities`)

## Prerequisites

```config
required: Lead or Customer (the opportunity source party)
conditional: Company
```

## Process Flow

```flow
Lead
Opportunity
Quotation
Sales Order
```

An Opportunity can be created from a Lead (via conversion) or directly for an existing Customer. Customer-partied Opportunities can be handed off to a Quotation.

## How to Create

1. Navigate to CRM → Opportunities.
2. Select New Opportunity.
3. Select the party type (Lead or Customer) and the specific party. Party selection is locked after creation.
4. Enter the title.
5. Select the Opportunity Type and Sales Stage.
6. Enter the expected closing date, probability, and opportunity amount.
7. Optionally add products/services line items.
8. Save.

Opportunities can also be created from the Lead detail page via the Convert to Opportunity action.

## Important Fields

`opportunity_from` — whether the source is a Lead or Customer (locked after creation). `party_name` — the specific Lead or Customer. `title` — descriptive title. `opportunity_type` — classification. `sales_stage` — current pipeline stage. `expected_closing` — expected close date. `probability` — win probability (percentage). `opportunity_amount` — estimated deal value. `status` — current status. `items[]` — optional products/services line items.

## Document Lifecycle

Opportunity follows a status-driven lifecycle, not a strict Draft/Submitted/Cancelled workflow.

```flow
Open
Replied
Quotation
Converted
  - Lost
  - Closed
```

## Available Actions

Edit · Change Status · Mark as Lost · Create Quotation (Customer-partied Opportunities only)

## Stock Impact

NO STOCK IMPACT — Opportunity is a CRM pipeline document.

## Accounting Impact

NO ACCOUNTING IMPACT — Opportunity does not create any financial transactions.

## Related Documents

```flow
Lead
Opportunity
Quotation
```

Lead → Opportunity conversion creates an Opportunity with field mappings from the Lead. Customer-partied Opportunities can create Quotations via the handoff action, feeding directly into the Sales Quotation flow.

## Common Scenarios

A Lead can generate multiple Opportunities. The Opportunity → Quotation handoff is only available for Customer-partied Opportunities (not Lead-partied ones, since a Quotation requires a Customer).

## Troubleshooting

"Cannot create Quotation from this Opportunity" — Quotation creation requires a Customer-partied Opportunity. If the Opportunity is Lead-partied, convert the Lead to a Customer first.

## Limitations

Pipeline Workspace (Kanban-style board view) is planned but not built (CRM-4). Per-user permission enforcement is not yet live — all users share one service account's ERPNext access.

## Technical Reference

ERPNext doctype: `Opportunity` (child: `Opportunity Item`). Frontend route: `/crm/opportunities` (list), `/crm/opportunities/[name]` (detail). Party type uses Dynamic Link (`opportunity_from` + `party_name`). Full architecture and field mapping: `docs/backend/16-crm/crm-architecture.md`.
