---
title: Stock Entry
module: Inventory
type: document
status: LIVE
frontend_route: /stock/stock-entries
canonical_entity: stock_entry
backend_doc: docs/backend/04-inventory/stock-entry.md
last_verified: 2026-09-25
---

## Overview

A Stock Entry is a manual stock movement document used to issue, receive, or transfer materials outside the normal Sales/Purchasing document chains.

## Business Purpose

Covers stock movements that don't originate from a customer order or supplier delivery — internal transfers between warehouses, manual material receipts, material issues for consumption, and manufacturing-related material movements.

## Where to Find It

Stock → Stock Entries (`/stock/stock-entries`). Stock Entries are also created as part of the Manufacturing workflow (Material Transfer for Manufacture, Complete Production) via Work Order actions.

## Prerequisites

```config
required: Item, Warehouse (source and/or target depending on purpose), Company
conditional: Work Order (for manufacturing-purpose entries), Batch/Serial Nos (if item tracking is enabled)
```

## Process Flow

```flow
Select Purpose
Add Items
Set Warehouses
Save (Draft)
Submit (Posts Stock)
```

## How to Create

1. Navigate to Stock → Stock Entries.
2. Select New Stock Entry.
3. Select the purpose:
   - **Material Issue** — removes stock from a warehouse (consumption).
   - **Material Receipt** — adds stock into a warehouse (incoming goods outside purchasing).
   - **Material Transfer** — moves stock from one warehouse to another.
4. Set the source warehouse (for Issue/Transfer) and/or target warehouse (for Receipt/Transfer).
5. Add items with quantities.
6. If items require batch or serial tracking, assign the appropriate numbers.
7. Save (creates a Draft).
8. Submit — posts the stock movement.

## Important Fields

`stock_entry_type` / purpose — determines the type of movement (Material Issue, Material Receipt, Material Transfer, Material Transfer for Manufacture, Manufacture). `items[]` — line items, each carrying `item_code`, `qty`, `s_warehouse` (source), `t_warehouse` (target), `uom`, `basic_rate`. `posting_date` — date of the stock movement. `work_order` — linked Work Order (for manufacturing purposes).

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted branches to **Cancelled**.

## Available Actions

Edit (Draft only) · Submit · Cancel · Post Comment

## Stock Impact

Material Issue:
Source Warehouse — Quantity Reduced

Material Receipt:
Target Warehouse — Quantity Increased

Material Transfer:
Source Warehouse — Quantity Reduced
Target Warehouse — Quantity Increased

All stock movements post to the Stock Ledger via ERPNext's native Bin bookkeeping. Cancellation reverses the movement.

## Accounting Impact

`NEEDS_VERIFICATION` — In standard ERPNext with perpetual inventory enabled, Stock Entries generate GL entries (e.g., Inventory debit/credit for transfers, Stock Adjustment for issues/receipts). The exact GL behavior on this instance has not been independently verified.

## Related Documents

Stock Entry is linked to Manufacturing via Work Order:
- Material Transfer for Manufacture — moves raw materials from store to WIP warehouse
- Manufacture (Complete Production) — posts finished goods against a Work Order

## Common Scenarios

The most common use outside manufacturing is warehouse-to-warehouse transfer. Material Receipt is used for opening stock or adjustments. Material Issue covers consumption or write-offs.

## Troubleshooting

"Insufficient stock" — The source warehouse does not have enough actual stock for the specified items and quantities.

## Limitations

Stock Reconciliation (bulk adjustment) is not built in the Ceylon Stack frontend. Complex valuation screens are excluded from V1.

## Technical Reference

ERPNext doctype: `Stock Entry` (child: `Stock Entry Detail`). Frontend route: `/stock/stock-entries` (list), `/stock/stock-entries/[name]` (detail). Manufacturing purposes use `make_stock_entry` whitelisted method on Work Order. Full field mapping: `docs/backend/04-inventory/stock-entry.md`.
