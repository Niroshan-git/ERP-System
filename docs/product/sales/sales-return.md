---
title: Sales Return
module: Sales
type: document
status: LIVE
frontend_route: /sales/returns
canonical_entity: sales_return
backend_doc: docs/backend/02-sales/sales-return.md
last_verified: 2026-09-25
---

## Overview

A Sales Return records the return of goods from a customer back into inventory. It reverses the stock movement of the original Delivery Note.

## Business Purpose

Handles the practical reality that customers sometimes return goods — whether due to defects, wrong items, or order changes. The Sales Return adds stock back to the warehouse and maintains an auditable link to the original delivery.

## Where to Find It

Sales → Sales Returns (`/sales/returns`), or created from a submitted Delivery Note via the Create Sales Return action.

## Prerequisites

```config
required: Original Delivery Note (submitted), Customer, Items (from original delivery)
conditional: Batch/Serial Nos (must match original delivery if item uses tracking)
```

## Process Flow

```flow
Delivery Note (Original)
Sales Return (Draft)
Submit (Adds Stock Back)
```

## How to Create

1. From a submitted Delivery Note, use the Create Sales Return action.
2. The return pre-fills with the original Delivery Note's customer, items, and references.
3. Enter the quantity to return for each line item — the UI displays quantities as positive numbers.
4. The return quantity cannot exceed the originally delivered quantity minus any previously returned quantity.
5. Review the return details.
6. Save (creates a Draft).
7. Submit — this adds stock back to the warehouse.

## Important Fields

`is_return` — set to `1`, identifying this as a return Delivery Note. `return_against` — the `name` of the original Delivery Note being returned against. `items[]` — line items with `qty` (stored as **negative** values internally, though the UI shows positive return quantities), `warehouse` (return destination), and `dn_detail` (links each returned line to the exact original delivery line).

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted branches to **Cancelled** (which would reverse the stock addition, effectively re-deducting the returned quantities).

## Available Actions

Edit (Draft only) · Submit · Cancel · Post Comment

## Stock Impact

Target Warehouse — Quantity Increased (stock added back on Submit).

The return creates an inbound stock movement, reversing the outbound movement of the original Delivery Note. Cancelling a Sales Return reverses this, deducting the stock again.

## Accounting Impact

`NEEDS_VERIFICATION` — In standard ERPNext with perpetual inventory, a Sales Return reverses the COGS/Inventory entries of the original Delivery Note. The exact GL behavior on this instance has not been independently verified.

## Related Documents

```flow
Sales Order
Delivery Note
Sales Return
```

The Sales Return links back to both the Delivery Note (`return_against`) and, if applicable, the originating Sales Order via the `against_sales_order` / `so_detail` references inherited from the original delivery lines.

## Common Scenarios

Partial returns are supported — a customer can return a subset of delivered items/quantities. Each return line tracks the remaining returnable quantity (original delivered qty minus already returned qty).

## Troubleshooting

"Return quantity exceeds deliverable quantity" — The quantity to return on any line cannot exceed the originally delivered quantity minus quantities already returned in previous Sales Returns against the same Delivery Note.

## Limitations

A Sales Return is technically a Delivery Note with `is_return=1` and negative quantities — it is not a separate ERPNext DocType. Batch/serial reversal for tracked items may require the exact same batch/serial numbers used in the original delivery. Credit Note (financial reversal via Sales Invoice with `is_return=1`) is a separate process from the physical goods return documented here.

## Technical Reference

ERPNext doctype: `Delivery Note` with `is_return=1` (child: `Delivery Note Item`). Frontend route: `/sales/returns` (list), `/sales/returns/[name]` (detail). Backend contract: quantities are stored as negative values; `return_against` references the original DN; `dn_detail` links each returned row to the original shipped row. Full specification: `docs/backend/02-sales/sales-return.md`.
