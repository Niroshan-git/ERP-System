---
title: Quotation
module: Sales
type: document
status: LIVE
frontend_route: /sales/quotations
canonical_entity: quotation
backend_doc: docs/backend/02-sales/quotation.md
last_verified: 2026-09-16
---

## Overview

A Quotation is a commercial offer given to a customer before an order is confirmed.

## Business Purpose

Lets a sales team put a firm, itemized offer in front of a customer — with pricing, tax, and
validity — without yet committing stock or creating an accounting transaction. It's the
negotiation stage of the sales cycle.

## Where to Find It

Sales → Quotations (`/sales/quotations`), or via CRM → Opportunities → Create Quotation for a
Customer-partied Opportunity.

## Prerequisites

Before creating a Quotation:

```config
required: Customer, Item, UOM
conditional: Price List, Tax Template, Pricing Rule, Payment Terms
```

## Process Flow

```flow
Customer
Quotation
Submit
Customer Decision
  - Lost / Expired
  - Accepted → Sales Order
```

If the customer accepts, the Quotation converts to a Sales Order (in full, or partially, or via
Copy From alongside other Quotations). If they don't, it can be marked Lost or left to expire.

## How to Create

1. Navigate to Sales → Quotations.
2. Select New Quotation.
3. Select the customer.
4. Enter transaction date, validity, and any document-level discount.
5. Add items — quantity, UOM, and rate resolve automatically through ERPNext's own Pricing Rule
   engine when a rule matches (manual rate editing is disabled on that line when it does).
6. Review quantities and pricing.
7. Save (creates a Draft).
8. Submit.

## Important Fields

`party_name` — the target Customer. `transaction_date` / `valid_till` — offer date and expiry.
`apply_discount_on` / `additional_discount_percentage` / `discount_amount` — document-level
discount fields, shared across Quotation, Sales Order, and Sales Invoice. `docstatus` — Draft /
Submitted / Cancelled, with an additional `Lost` status layered on top via `declare_enquiry_lost`.

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted also branches to **Lost** (`declare_enquiry_lost`, with a selectable Lost Reason) and
**Cancelled**. A Cancelled Quotation can be Amended into a fresh Draft (`amended_from` set, every
field/item carried over, guarded against a duplicate amend).

## Available Actions

Edit (Draft only) · Submit · Set as Lost · Cancel · Amend (from Cancelled) · Create Sales Order
(from Submitted, blocked if Lost)

## Stock Impact

NO STOCK IMPACT — a Quotation never touches `Bin` or the Stock Ledger.

## Accounting Impact

NO ACCOUNTING IMPACT — a Quotation never creates a GL Entry.

## Related Documents

```flow
Quotation
Sales Order
Delivery Note
Sales Invoice
```

A Sales Order can also be built via "Copy From", pulling lines from one or more open Quotations
for the same Customer and Company.

## Common Scenarios

Accepting a Quotation line by line and in partial quantities across more than one Sales Order is
fully supported — ERPNext's own real remaining-quantity tracking is used, not a simplified
one-shot copy.

## Troubleshooting

A Lost Quotation cannot be converted to a Sales Order — this app added a guard ERPNext itself
doesn't enforce server-side (Desk only hides the button); it's blocked here on the Quotation page,
the create-order redirect, and inside the create-Sales-Order action itself.

## Limitations

No Competitor picker on "Set as Lost" — no Competitor master data exists on this instance yet, and
ERPNext doesn't require it server-side.

## Technical Reference

ERPNext doctype: `Quotation` (child: `Quotation Item`). Frontend actions:
`apps/frontend/src/app/(app)/sales/quotations/actions.ts`. Full field mapping (frontend → canonical
→ ERPNext), lifecycle state diagram, and the Quotation → Sales Order conversion contract:
`docs/backend/02-sales/quotation.md`.
