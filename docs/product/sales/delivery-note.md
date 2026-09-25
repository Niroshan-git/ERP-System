---
title: Delivery Note
module: Sales
type: document
status: LIVE
frontend_route: /sales/delivery-notes
canonical_entity: delivery_note
backend_doc: docs/backend/02-sales/delivery-note.md
last_verified: 2026-09-25
---

## Overview

A Delivery Note records the physical delivery of goods to a customer and is the document that actually moves stock out of the warehouse.

## Business Purpose

Translates a confirmed Sales Order into a real shipment — documenting what was sent, from which warehouse, in what quantities, and with what batch/serial tracking. Submitting a Delivery Note is the action that reduces actual inventory.

## Where to Find It

Sales → Delivery Notes (`/sales/delivery-notes`), or created directly from a submitted Sales Order via the Create Delivery Note action.

## Prerequisites

```config
required: Customer, Item, Warehouse (source), Sufficient Stock
conditional: Sales Order (if fulfilling an order), Batch/Serial Nos (if item tracking is enabled)
```

## Process Flow

```flow
Sales Order
Delivery Note (Draft)
Attach Batch/Serial (if applicable)
Submit (Posts Stock)
Sales Invoice
```

## How to Create

1. Navigate to Sales → Delivery Notes, select New Delivery Note. Or from a submitted Sales Order, use Create Delivery Note.
2. If created from a Sales Order, the customer, items, and quantities pre-fill from remaining undelivered quantities.
3. Confirm the source warehouse for each line item.
4. If items require batch or serial tracking, use the batch/serial picker to assign specific batches or serial numbers.
5. Review quantities.
6. Save (creates a Draft).
7. Submit — this posts the stock movement, reducing actual inventory in the source warehouse.

## Important Fields

`customer` — the receiving Customer. `posting_date` — date of physical shipment. `items[]` — line items, each carrying `item_code`, `qty`, `warehouse` (source), `against_sales_order` and `so_detail` (links back to the originating Sales Order). Batch/serial tracking is handled via a separate Serial and Batch Bundle ledger attached while the document is in Draft.

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted branches to **Cancelled** (blocked if linked submitted Sales Invoices exist). A Submitted Delivery Note can also have a Sales Return created against it.

## Available Actions

Edit (Draft only) · Submit · Cancel (if no linked submitted invoices or returns) · Create Sales Invoice · Create Sales Return · Post Comment

## Stock Impact

Source Warehouse — Quantity Reduced (actual stock decreases on Submit).

The stock movement is posted to the Stock Ledger via ERPNext's native Bin bookkeeping. Cancelling a Delivery Note reverses the stock movement.

## Accounting Impact

`NEEDS_VERIFICATION` — In standard ERPNext with perpetual inventory enabled, submitting a Delivery Note posts COGS (debit) and Inventory (credit) GL entries. The exact GL behavior on this instance has not been independently verified.

## Related Documents

```flow
Sales Order
Delivery Note
Sales Invoice
```

A Delivery Note can also be the source for a Sales Return (a return Delivery Note with `is_return=1` and negative quantities).

## Common Scenarios

Partial delivery is supported — a single Sales Order can generate multiple Delivery Notes, each covering a subset of the ordered items/quantities. ERPNext tracks `delivered_qty` per Sales Order line.

Batch and serial tracking uses a two-step process: create the Draft first, then attach batch/serial bundles while in Draft, then Submit.

## Troubleshooting

"Cannot cancel this Delivery Note" — Cancellation is blocked when submitted downstream documents (Sales Invoices or Sales Returns) reference this note. Cancel those documents first.

"Insufficient stock" — Submit will fail if the source warehouse does not have enough actual stock for the specified items and quantities.

## Limitations

No Pick List → Delivery Note shortcut outside the Sales Order context is documented. Batch/serial attachment requires a two-step API flow (create Draft, then attach bundles) due to ERPNext's architecture.

## Technical Reference

ERPNext doctype: `Delivery Note` (child: `Delivery Note Item`). Frontend route: `/sales/delivery-notes` (list), `/sales/delivery-notes/[name]` (detail). Conversion to Sales Invoice maps both `dn_detail` → `delivery_note` AND `so_detail` → `sales_order` for complete traceability. Full field mapping: `docs/backend/02-sales/delivery-note.md`.
