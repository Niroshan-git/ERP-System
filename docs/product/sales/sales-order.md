---
title: Sales Order
module: Sales
type: document
status: LIVE
frontend_route: /sales/orders
canonical_entity: sales_order
backend_doc: docs/backend/02-sales/sales-order.md
last_verified: 2026-09-25
---

## Overview

A Sales Order is a confirmed customer order that commits the business to supply goods or services. It is the central document in the sales cycle, linking upstream from Quotations and downstream to Delivery Notes and Sales Invoices.

## Business Purpose

Converts a customer's intent to buy into a firm commitment — with quantities, pricing, delivery dates, and warehouse assignments. The Sales Order controls fulfillment (Delivery Notes) and billing (Sales Invoices), tracking partial and complete delivery/invoicing across its life.

## Where to Find It

Sales → Sales Orders (`/sales/orders`)

## Prerequisites

```config
required: Customer, Item, UOM
conditional: Price List, Tax Template, Payment Terms, Warehouse
```

## Process Flow

```flow
Quotation
Sales Order
Delivery Note
Sales Invoice
  - Payment (PLANNED)
```

A Sales Order can also be created directly without a preceding Quotation.

## How to Create

1. Navigate to Sales → Sales Orders.
2. Select New Sales Order.
3. Choose the customer.
4. Enter the transaction date and expected delivery date.
5. Optionally enter the customer's Purchase Order reference (PO No, PO Date).
6. Add items — select item code, quantity, rate, UOM, and delivery warehouse per line.
7. Review quantities and pricing.
8. Optionally apply a document-level discount.
9. Configure address, contact, and terms if applicable.
10. Save (creates a Draft).
11. Submit when ready to commit.

A Sales Order can also be created from a submitted Quotation using the "Copy From" pattern — pulling lines from one or more open Quotations for the same Customer and Company.

## Important Fields

`customer` — the ordering Customer. `transaction_date` — order date. `delivery_date` — expected fulfillment date. `po_no` / `po_date` — customer's purchase order reference. `items[]` — line items, each carrying `item_code`, `qty`, `rate`, `warehouse`, and remaining-quantity tracking fields (`delivered_qty`, `billed_amt`). `apply_discount_on` / `additional_discount_percentage` / `discount_amount` — document-level discount, shared across Quotation, Sales Order, and Sales Invoice.

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted also branches to **Closed** (`close_or_unclose_sales_orders`, reversible) and **Cancelled** (blocked if linked submitted Delivery Notes or Sales Invoices exist — those must be cancelled first).

## Available Actions

Edit (Draft only) · Submit · Close / Re-open · Cancel (if no linked submitted documents) · Amend (from Cancelled) · Create Delivery Note · Create Sales Invoice · Post Comment

## Stock Impact

NO DIRECT STOCK IMPACT — a Sales Order itself does not move physical stock. However, ERPNext updates reserved stock quantities when a Sales Order is submitted (`ordered_qty` on `Bin`). Actual stock movement occurs when a Delivery Note is created and submitted from this Sales Order.

## Accounting Impact

NO ACCOUNTING IMPACT — a Sales Order does not create any GL Entry. Accounting transactions are created downstream by the Sales Invoice.

## Related Documents

```flow
Quotation
Sales Order
Delivery Note
Sales Invoice
```

A Sales Order can source from one or more Quotations (via Copy From). It can spawn multiple partial Delivery Notes and multiple partial Sales Invoices.

## Common Scenarios

Partial fulfillment is fully supported — a single Sales Order can generate multiple Delivery Notes and multiple Sales Invoices, each covering a subset of the ordered quantities. ERPNext natively tracks `delivered_qty` and `billed_amt` per line to prevent over-delivery or over-billing.

## Troubleshooting

"Cannot cancel this Sales Order" — Cancellation is blocked when submitted downstream documents (Delivery Notes or Sales Invoices) still reference this order. Cancel those documents first, then retry.

"Cannot create Delivery Note — no remaining quantity" — All ordered quantities have already been delivered. Check the Connections panel for existing Delivery Notes.

## Limitations

Payment Entry is not yet built — there is no in-app way to record payment against a Sales Order or its linked Sales Invoice. Close/Re-open uses ERPNext's native `close_or_unclose_sales_orders` whitelisted method.

## Technical Reference

ERPNext doctype: `Sales Order` (child: `Sales Order Item`). Frontend route: `/sales/orders` (list), `/sales/orders/[name]` (detail). Server actions: `apps/frontend/src/app/(app)/sales/orders/actions.ts`. Conversion contracts: `against_sales_order` + `so_detail` on Delivery Note lines; `sales_order` + `so_detail` on Sales Invoice lines. Full field mapping and lifecycle: `docs/backend/02-sales/sales-order.md`.
