---
title: Inventory — Overview
module: Inventory
type: module-overview
status: LIVE
last_verified: 2026-09-16
---

## Purpose

Inventory (the Stock module in the sidebar) tracks what's physically on hand and how it moves —
warehouses, batch/serial tracking, and manual stock movements outside the Sales/Purchasing/
Manufacturing document chains.

## Main Functions

Warehouses  
Full master list/create/edit.

Batches & Serial Nos  
Masters for both tracking types, used by Delivery Note and Stock Entry's batch/serial picker.

Stock Entry  
Material Issue / Material Receipt / Material Transfer, with the real Draft → Submitted →
Cancelled workflow.

Stock Balance  
A live, filterable view backed directly by ERPNext's own `Bin` doctype (fills the role ERPNext's
native "Stock Balance" report can't — that report is a background-job report this app has no
polling machinery for).

## Required Configuration

```config
required: Item, Warehouse, UOM
conditional: Batch/Serial numbering series (only if an Item has has_batch_no/has_serial_no enabled)
```

## Integration With Other Modules

Sales → Inventory: Delivery Note, Pick List. Purchasing → Inventory: Purchase Receipt.
Manufacturing → Inventory: Material Transfer, Manufacture Stock Entry.

## Related Documents

See the Release Log's "Inventory / Stock Module" section for the full shipped feature list and
the real `s_warehouse` bug QA caught and fixed during this module's build.

## Technical Reference

Canonical field/lifecycle documentation: `docs/backend/04-inventory/` (batch, serial-no,
stock-entry).
