---
title: Item
module: Master Data
type: document
status: LIVE
frontend_route: /master-data/items
canonical_entity: item
backend_doc: docs/backend/01-master-data/item.md
last_verified: 2026-09-25
---

## Overview

An Item is the fundamental product or material record — everything that can be sold, purchased, manufactured, or stocked in Ceylon Stack.

## Business Purpose

Provides a single, canonical definition for every product, raw material, or service the business deals with. Items are referenced by every transactional document — Sales Orders, Purchase Orders, BOMs, Stock Entries, and more.

## Where to Find It

Master Data → Items (`/master-data/items`). Items also appear as link fields across Sales, Purchasing, Manufacturing, and Inventory modules.

## Prerequisites

```config
required: Item Group, UOM (stock UOM)
conditional: Batch/Serial naming series (if batch or serial tracking is enabled)
```

## How to Create

1. Navigate to Master Data → Items.
2. Select New Item.
3. Enter the Item Code (permanent identifier — cannot be changed after creation).
4. Enter the Item Name.
5. Select the Item Group.
6. Select the default Stock UOM (Unit of Measure).
7. Optionally set the Standard Selling Rate.
8. Configure tracking options: Maintain Stock, Has Batch No, Has Serial No, Has Expiry Date.
9. If batch or serial tracking is enabled, configure the naming series.
10. Add a description if needed.
11. Save.

## Important Fields

`item_code` — permanent identifier, immutable after creation. `item_name` — display name (defaults to `item_code` if left blank). `item_group` — classification category (required). `stock_uom` — default unit of measure (required). `standard_rate` — default selling rate. `is_stock_item` — whether this item maintains physical stock (defaults to enabled). `has_batch_no` / `has_serial_no` / `has_expiry_date` — inventory tracking flags. `disabled` — soft-disable flag (edit only, not on creation).

## Document Lifecycle

Item is a draftless master record — it has no Draft/Submitted/Cancelled workflow.

```flow
Active
Disabled
```

Once created, an Item can be edited freely (except `item_code`) or disabled via the `disabled` flag. There is no delete action — Items are soft-disabled instead.

## Available Actions

Create · Edit · Disable / Enable

## Stock Impact

The Item itself does not move stock. Its `is_stock_item` flag determines whether transactional documents (Delivery Notes, Purchase Receipts, Stock Entries) create stock movements for this item. `has_batch_no` and `has_serial_no` determine whether batch/serial tracking is required on stock transactions.

## Accounting Impact

`NEEDS_VERIFICATION` — In standard ERPNext, the Item Default child table carries per-Company income/expense account defaults that are used when creating Sales Invoices and Purchase Invoices. This child table is not exposed in the Ceylon Stack frontend. Default account resolution currently relies on the Account Determination hierarchy (Item → Item Group → Company defaults).

## Related Documents

Items are referenced across all transactional modules:
- Sales: Quotation, Sales Order, Delivery Note, Sales Invoice
- Purchasing: Purchase Order, Purchase Receipt, Purchase Invoice
- Manufacturing: BOM, Work Order
- Inventory: Stock Entry, Stock Balance

## Troubleshooting

"Item Code already exists" — Item Code must be unique. If you see this error, an Item with that code already exists in the system.

"Cannot find Item Group" — The selected Item Group must exist in Master Data before creating an Item.

## Limitations

The Ceylon Stack frontend exposes approximately 14 of the 140+ fields available on the ERPNext Item doctype. Fields not exposed include: variants, supplier/customer-specific details, reorder levels, barcodes, quality inspection templates, fixed asset configuration, and detailed accounting defaults. These features exist in ERPNext but are not surfaced in this application.

## Technical Reference

ERPNext doctype: `Item`. Frontend route: `/master-data/items` (list), `/master-data/items/[name]` (detail), `/master-data/items/new` (create). Form component: `ItemForm.tsx`. Server actions: `apps/frontend/src/app/(app)/master-data/items/actions.ts` (createItemAction, updateItemAction). No submitDoc/cancelDoc/deleteDoc — Item is draftless. Full field mapping: `docs/backend/01-master-data/item.md`.
