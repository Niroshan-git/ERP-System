---
title: Sales Invoice
module: Sales
type: document
status: LIVE
frontend_route: /sales/invoices
canonical_entity: sales_invoice
backend_doc: docs/backend/02-sales/sales-invoice.md
last_verified: 2026-09-25
---

## Overview

A Sales Invoice is the billing document that creates the customer's receivable (Accounts Receivable) and posts to the General Ledger.

## Business Purpose

Formalizes the financial transaction — converting a delivered order into a recorded revenue event with a receivable balance owed by the customer. This is where the sale becomes an accounting reality.

## Where to Find It

Sales → Sales Invoices (`/sales/invoices`), or created from a submitted Sales Order or Delivery Note via the Create Sales Invoice action.

## Prerequisites

```config
required: Customer, Item, Receivable Account (debit_to), Income Account (per item), Cost Center (per item)
conditional: Sales Order or Delivery Note (if invoicing against an existing order/delivery), Tax Template
```

## Process Flow

```flow
Sales Order
Delivery Note
Sales Invoice (Draft)
Submit (Posts GL)
Payment (PLANNED)
```

A Sales Invoice can also be created directly from a Sales Order (without requiring a Delivery Note first), or independently.

## How to Create

1. Navigate to Sales → Sales Invoices, select New Sales Invoice. Or from a submitted Sales Order or Delivery Note, use Create Sales Invoice.
2. If created from a Sales Order or Delivery Note, the customer, items, quantities, and references pre-fill from remaining uninvoiced quantities.
3. Confirm the posting date.
4. Review items — `income_account` and `cost_center` are populated from ERPNext defaults.
5. Review totals and taxes.
6. Save (creates a Draft).
7. Submit — this posts to the General Ledger, creating the customer receivable.

## Important Fields

`customer` — the billed Customer. `posting_date` — invoice date. `debit_to` — the Accounts Receivable account (mandatory, populated from defaults). `items[]` — line items, each carrying `item_code`, `qty`, `rate`, `income_account`, `cost_center`, and source references (`sales_order`/`so_detail`, `delivery_note`/`dn_detail`). `naming_series` — auto-assigned (ACC-SINV-.YYYY.-).

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted branches to **Cancelled** (requires that no Payment Entry or other downstream document is linked — Payment Entry is not yet built in Ceylon Stack).

## Available Actions

Edit (Draft only) · Submit · Cancel · Amend (from Cancelled) · Post Comment

## Stock Impact

NO DIRECT STOCK IMPACT from the Sales Invoice itself. Stock movement is handled by the Delivery Note. However, ERPNext supports a "Sales Invoice with stock update" mode — `NEEDS_VERIFICATION` whether this mode is used in this Ceylon Stack instance.

## Accounting Impact

Customer Receivable (Debit To) — DR

Sales Revenue (Income Account, per item) — CR

Tax accounts — CR (if applicable)

The GL Entry is posted on Submit. Cancellation reverses the GL entries.

## Related Documents

```flow
Quotation
Sales Order
Delivery Note
Sales Invoice
```

A Sales Invoice maintains full traceability back to both the Sales Order and Delivery Note via `sales_order`/`so_detail` and `delivery_note`/`dn_detail` on each line item.

## Common Scenarios

Partial invoicing is supported — a single Sales Order can generate multiple Sales Invoices, each covering a subset of ordered quantities. The frontend dynamically calculates remaining uninvoiced quantities.

## Troubleshooting

"Cannot cancel this Sales Invoice" — Cancellation is blocked if submitted downstream documents reference this invoice.

"Missing required fields" — `debit_to` (receivable account), `income_account`, and `cost_center` are mandatory per ERPNext's GL posting requirements. These are typically auto-populated from company/item defaults.

## Limitations

Payment Entry is not yet built — there is no in-app way to record payment against a Sales Invoice. The receivable balance exists in ERPNext's native AR but is not visible in the Ceylon Stack frontend. Credit Notes are implemented as return Sales Invoices (`is_return=1`).

## Technical Reference

ERPNext doctype: `Sales Invoice` (child: `Sales Invoice Item`). Frontend route: `/sales/invoices` (list), `/sales/invoices/[name]` (detail). Mandatory GL fields: `debit_to`, per-item `income_account` and `cost_center`. Full field mapping: `docs/backend/02-sales/sales-invoice.md`.
