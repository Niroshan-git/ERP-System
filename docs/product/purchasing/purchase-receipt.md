---
title: Purchase Receipt
module: Purchasing
type: document
status: LIVE
frontend_route: /buying/purchase-receipts
canonical_entity: purchase_receipt
backend_doc: docs/backend/03-purchasing/purchase-receipt.md
last_verified: 2026-09-25
---

## Overview

A Purchase Receipt (also known as a Goods Receipt Note / GRN) records the physical receipt of goods from a supplier into a warehouse.

## Business Purpose

Documents what was actually received from a supplier — confirming quantities, verifying items, and posting the inbound stock movement. This is where ordered goods become actual inventory.

## Where to Find It

Buying → Purchase Receipts (`/buying/purchase-receipts`), or created from a submitted Purchase Order via the Create Purchase Receipt action.

## Prerequisites

```config
required: Supplier, Item, Warehouse (target)
conditional: Purchase Order (if receiving against an order)
```

## Process Flow

```flow
Purchase Order
Purchase Receipt (Draft)
Submit (Posts Stock)
Purchase Invoice
```

## How to Create

1. Navigate to Buying → Purchase Receipts, select New Purchase Receipt. Or from a submitted Purchase Order, use Create Purchase Receipt.
2. If created from a Purchase Order, the supplier, items, and quantities pre-fill from remaining unreceived quantities.
3. Confirm the posting date.
4. Confirm the target warehouse for each line item.
5. Enter the received quantity per line.
6. Save (creates a Draft).
7. Submit — this posts the stock movement, increasing actual inventory in the target warehouse.

## Important Fields

`supplier` — the source Supplier. `posting_date` — date of receipt. `items[]` — line items, each carrying `item_code`, `qty`, `received_qty`, `rate`, `warehouse` (target), `purchase_order` and `purchase_order_item` (links back to the originating Purchase Order).

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted branches to **Cancelled** (blocked if linked submitted Purchase Invoices exist).

## Available Actions

Edit (Draft only) · Submit · Cancel (if no linked submitted invoices) · Create Purchase Invoice · Post Comment

## Stock Impact

Target Warehouse — Quantity Increased (actual stock increases on Submit).

The stock movement is posted to the Stock Ledger via ERPNext's native Bin bookkeeping. Cancelling a Purchase Receipt reverses the stock movement.

## Accounting Impact

`NEEDS_VERIFICATION` — In standard ERPNext with perpetual inventory enabled, submitting a Purchase Receipt debits the Inventory/Warehouse account and credits Stock Received But Not Billed (SRBNB). The exact GL behavior on this instance has not been independently verified.

## Related Documents

```flow
Purchase Order
Purchase Receipt
Purchase Invoice
```

A Purchase Receipt maintains traceability back to the Purchase Order via `purchase_order`/`purchase_order_item` on each line.

## Common Scenarios

Partial receiving is supported — a single Purchase Order can generate multiple Purchase Receipts. The frontend dynamically calculates remaining unreceived quantities from the Purchase Order.

## Troubleshooting

"Cannot cancel this Purchase Receipt" — Cancellation is blocked when a submitted Purchase Invoice references this receipt. Cancel the invoice first.

## Limitations

The current frontend does not implement a separate batch/serial attach step for Purchase Receipts (unlike Delivery Notes which use a two-step process). Batch/serial handling on receipt `NEEDS_VERIFICATION`.

## Technical Reference

ERPNext doctype: `Purchase Receipt` (child: `Purchase Receipt Item`). Frontend route: `/buying/purchase-receipts` (list), `/buying/purchase-receipts/[name]` (detail). Conversion to Purchase Invoice maps both `pr_detail` → `purchase_receipt` AND `po_detail` → `purchase_order` for complete traceability. Full field mapping: `docs/backend/03-purchasing/purchase-receipt.md`.
