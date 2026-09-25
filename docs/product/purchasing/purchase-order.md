---
title: Purchase Order
module: Purchasing
type: document
status: LIVE
frontend_route: /buying/purchase-orders
canonical_entity: purchase_order
backend_doc: docs/backend/03-purchasing/purchase-order.md
last_verified: 2026-09-25
---

## Overview

A Purchase Order is a formal commitment to purchase goods from a supplier at agreed quantities and prices.

## Business Purpose

Creates a documented, auditable purchasing commitment — telling a supplier what to deliver, when, and at what price. The Purchase Order drives downstream receiving (Purchase Receipt) and billing (Purchase Invoice) workflows.

## Where to Find It

Buying → Purchase Orders (`/buying/purchase-orders`)

## Prerequisites

```config
required: Supplier, Item, UOM
conditional: Warehouse (target), Tax Template, Payment Terms, Supplier Quotation (if converting)
```

## Process Flow

```flow
Supplier Quotation
Purchase Order
Purchase Receipt
Purchase Invoice
```

A Purchase Order can also be created directly without a preceding Supplier Quotation.

## How to Create

1. Navigate to Buying → Purchase Orders.
2. Select New Purchase Order.
3. Choose the supplier.
4. Enter the transaction date and required-by date (schedule date).
5. Add items — select item code, quantity, rate, UOM, and target warehouse per line.
6. Each line can have its own schedule date for staggered deliveries.
7. Review quantities and pricing.
8. Save (creates a Draft).
9. Submit when ready to commit.

A Purchase Order can also be created from a submitted Supplier Quotation.

## Important Fields

`supplier` — the supplying Supplier. `transaction_date` — order date. `schedule_date` — overall required-by date. `items[]` — line items, each carrying `item_code`, `qty`, `rate`, `uom`, `warehouse` (target), `schedule_date` (per-line), and tracking fields (`received_qty`). `supplier_quotation` / `supplier_quotation_item` — references to source Supplier Quotation (if created from one).

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted branches to **Cancelled** (blocked if linked submitted Purchase Receipts or Purchase Invoices exist — those must be cancelled first).

## Available Actions

Edit (Draft only) · Submit · Cancel (if no linked submitted documents) · Create Purchase Receipt · Create Purchase Invoice · Post Comment

## Stock Impact

NO DIRECT STOCK IMPACT — a Purchase Order does not move physical stock. ERPNext updates expected/ordered stock quantities when a Purchase Order is submitted. Actual stock movement occurs when a Purchase Receipt is created and submitted.

## Accounting Impact

NO ACCOUNTING IMPACT — a Purchase Order does not create any GL Entry. Accounting transactions are created downstream by the Purchase Invoice.

## Related Documents

```flow
Supplier Quotation
Purchase Order
Purchase Receipt
Purchase Invoice
```

A Purchase Order can spawn multiple partial Purchase Receipts and multiple partial Purchase Invoices.

## Common Scenarios

Partial receiving is fully supported — a single Purchase Order can generate multiple Purchase Receipts, each covering a subset of the ordered quantities. ERPNext natively tracks `received_qty` per line.

## Troubleshooting

"Cannot cancel this Purchase Order" — Cancellation is blocked when submitted downstream documents (Purchase Receipts or Purchase Invoices) still reference this order. Cancel those documents first, then retry.

## Limitations

There is no direct Material Request → Purchase Order shortcut — the path goes through Request for Quotation and Supplier Quotation. UOM conversion is forced to 1:1 (`stock_uom` mirrors `uom`) in the current frontend implementation.

## Technical Reference

ERPNext doctype: `Purchase Order` (child: `Purchase Order Item`). Frontend route: `/buying/purchase-orders` (list), `/buying/purchase-orders/[name]` (detail). Conversion contracts: `purchase_order` + `purchase_order_item` on Purchase Receipt lines; `purchase_order` + `po_detail` on Purchase Invoice lines. Full field mapping: `docs/backend/03-purchasing/purchase-order.md`.
