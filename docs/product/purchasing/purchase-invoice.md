---
title: Purchase Invoice
module: Purchasing
type: document
status: LIVE
frontend_route: /buying/purchase-invoices
canonical_entity: purchase_invoice
backend_doc: docs/backend/03-purchasing/purchase-invoice.md
last_verified: 2026-09-25
---

## Overview

A Purchase Invoice is the billing document that records the supplier's invoice and creates the Accounts Payable liability.

## Business Purpose

Formalizes the financial obligation to pay a supplier — converting received goods or services into a recorded expense/liability event. This is where the purchase becomes an accounting reality.

## Where to Find It

Buying → Purchase Invoices (`/buying/purchase-invoices`), or created from a submitted Purchase Order or Purchase Receipt via the Create Purchase Invoice action.

## Prerequisites

```config
required: Supplier, Item, Payable Account (credit_to), Expense Account (per item), Cost Center (per item)
conditional: Purchase Order or Purchase Receipt (if invoicing against an existing order/receipt), Tax Template
```

## Process Flow

```flow
Purchase Order
Purchase Receipt
Purchase Invoice (Draft)
Submit (Posts GL)
Payment (PLANNED)
```

A Purchase Invoice can also be created directly from a Purchase Order (without requiring a Purchase Receipt first).

## How to Create

1. Navigate to Buying → Purchase Invoices, select New Purchase Invoice. Or from a submitted Purchase Order or Purchase Receipt, use Create Purchase Invoice.
2. If created from a Purchase Order or Purchase Receipt, the supplier, items, quantities, and references pre-fill from remaining unbilled quantities.
3. Confirm the posting date and due date.
4. Optionally enter the supplier's invoice reference (Bill No, Bill Date).
5. Review items — `expense_account` and `cost_center` are populated from buying defaults.
6. Review totals and taxes.
7. Save (creates a Draft).
8. Submit — this posts to the General Ledger.

## Important Fields

`supplier` — the invoicing Supplier. `posting_date` — invoice date. `due_date` — payment due date. `bill_no` / `bill_date` — supplier's physical invoice reference. `credit_to` — the Accounts Payable account (mandatory, populated from defaults). `items[]` — line items, each carrying `item_code`, `qty`, `rate`, `expense_account`, `cost_center`, and source references (`purchase_order`/`po_detail`, `purchase_receipt`/`pr_detail`).

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted branches to **Cancelled**.

## Available Actions

Edit (Draft only) · Submit · Cancel · Amend (from Cancelled) · Post Comment

## Stock Impact

NO DIRECT STOCK IMPACT from the Purchase Invoice itself. Stock movement is handled by the Purchase Receipt.

## Accounting Impact

Expense / COGS Account (per item) — DR

Supplier Payable (Credit To) — CR

Tax accounts — DR (if applicable)

The GL Entry is posted on Submit. Cancellation reverses the GL entries.

## Related Documents

```flow
Purchase Order
Purchase Receipt
Purchase Invoice
```

A Purchase Invoice maintains full traceability back to both the Purchase Order and Purchase Receipt via `purchase_order`/`po_detail` and `purchase_receipt`/`pr_detail` on each line item.

## Common Scenarios

Partial invoicing is supported — a single Purchase Order can generate multiple Purchase Invoices. The frontend dynamically calculates remaining unbilled quantities via `getBilledQtyByPoDetail` or `getBilledQtyByPrDetail`.

## Troubleshooting

"Missing required fields" — `credit_to` (payable account), `expense_account`, and `cost_center` are mandatory per ERPNext's GL posting requirements. These are typically auto-populated from buying defaults.

## Limitations

Payment Entry is not yet built — there is no in-app way to record payment against a Purchase Invoice. The payable balance exists in ERPNext's native AP but is not visible in the Ceylon Stack frontend.

## Technical Reference

ERPNext doctype: `Purchase Invoice` (child: `Purchase Invoice Item`). Frontend route: `/buying/purchase-invoices` (list), `/buying/purchase-invoices/[name]` (detail). Mandatory GL fields: `credit_to`, per-item `expense_account` and `cost_center`. Full field mapping: `docs/backend/03-purchasing/purchase-invoice.md`.
