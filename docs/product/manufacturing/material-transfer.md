---
title: Material Transfer for Manufacture
module: Manufacturing
type: document
status: LIVE
canonical_entity: material_transfer
backend_doc: docs/backend/05-manufacturing/material-transfer.md
last_verified: 2026-09-25
---

## Overview

Material Transfer for Manufacture moves raw materials from a source warehouse to a work-in-progress (WIP) warehouse as part of the manufacturing process. It is an action within the Work Order workflow, not an independent top-level function.

## Business Purpose

Ensures that raw materials required for production are formally moved from storage to the manufacturing floor, maintaining accurate stock visibility across warehouses throughout the production process.

## Where to Find It

Accessed from within a submitted Work Order — use the Transfer Materials action on the Work Order detail page. The resulting Stock Entry appears under Stock → Stock Entries.

```callout:info
Material Transfer is not a standalone menu item in Manufacturing. It is a Work Order action that creates a Stock Entry with purpose "Material Transfer for Manufacture".
```

## Prerequisites

```config
required: Work Order (submitted), BOM (with required items), Source Warehouse, WIP Warehouse
conditional: Sufficient stock in source warehouse for required materials
```

## Process Flow

```flow
Work Order (Submitted)
Transfer Materials
Stock Entry (Draft)
Submit (Moves Stock)
```

## How to Create

1. Open a submitted Work Order.
2. Select Transfer Materials.
3. The Stock Entry pre-fills with the Work Order's required items, scaled to the production quantity.
4. Confirm source and WIP warehouses.
5. Review material quantities.
6. Submit — stock moves from source warehouse to WIP warehouse.

## Important Fields

`work_order` — the linked Work Order. `stock_entry_type` — "Material Transfer for Manufacture". `items[]` — raw materials from the BOM's `required_items`, with `s_warehouse` (source) and `t_warehouse` (WIP). `qty` — quantity to transfer (scaled from BOM quantities based on production quantity).

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted branches to **Cancelled**.

## Stock Impact

Source Warehouse — Quantity Reduced
WIP Warehouse — Quantity Increased

Transfer updates `transferred_qty` on the Work Order's `required_items[]`, tracking how much of each material has been moved to the shop floor.

## Accounting Impact

`NEEDS_VERIFICATION` — Standard ERPNext with perpetual inventory may post inventory-to-inventory GL entries for warehouse transfers. Not independently verified.

## Related Documents

```flow
BOM
Work Order
Material Transfer
Complete Production
Finished Goods
```

Material Transfer is one step in the manufacturing execution sequence, sitting between Work Order submission and production completion.

## Troubleshooting

"Cannot cancel Work Order" — If a submitted Material Transfer Stock Entry exists against the Work Order, it must be cancelled first before the Work Order can be cancelled.

"Insufficient stock in source warehouse" — The source warehouse must have enough stock for the required materials. Check the Stock Balance or adjust the Material Readiness panel on the Work Order.

## Limitations

Partial material transfers are supported (transfer a subset of required items), but the Material Readiness check on the Work Order detail page shows the overall status. Alternative item substitution during transfer is not built.

## Technical Reference

ERPNext creates this via `make_stock_entry(work_order, purpose="Material Transfer for Manufacture")` whitelisted method. The resulting document is a standard Stock Entry (`docs/backend/04-inventory/stock-entry.md`) with `stock_entry_type: Material Transfer for Manufacture` and `work_order` set. Backend specification: `docs/backend/05-manufacturing/material-transfer.md`.
