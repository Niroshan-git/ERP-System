---
title: Supplier
module: Master Data
type: document
status: LIVE
frontend_route: /master-data/suppliers
canonical_entity: supplier
backend_doc: docs/backend/01-master-data/customer-supplier.md
last_verified: 2026-09-25
---

## Overview

A Supplier is a business partner from whom goods or services are purchased. It is the canonical party record referenced across the Purchasing module.

## Business Purpose

Maintains a single, authoritative record for every vendor the business buys from — linking their identity and classification to all downstream purchasing transactions.

## Where to Find It

Master Data → Suppliers (`/master-data/suppliers`). Suppliers also appear as link fields in Purchase Orders, Purchase Receipts, and Purchase Invoices.

## Prerequisites

```config
required: Supplier Name
conditional: Supplier Group, Country
```

## How to Create

1. Navigate to Master Data → Suppliers.
2. Select New Supplier.
3. Enter the Supplier Name.
4. Select the Supplier Type (Company, Individual, or Partnership).
5. Optionally assign a Supplier Group and Country.
6. Save.

## Important Fields

`supplier_name` — the supplier's display name. `supplier_type` — Company, Individual, or Partnership. `supplier_group` — classification group. `country` — supplier's country. `disabled` — soft-disable flag.

## Document Lifecycle

Supplier is a draftless master record — no Draft/Submitted/Cancelled workflow.

```flow
Active
Disabled
```

Once created, a Supplier can be edited or disabled. There is no delete action.

## Available Actions

Create · Edit · Disable / Enable

## Stock Impact

NO STOCK IMPACT — Supplier is a master record.

## Accounting Impact

NO DIRECT ACCOUNTING IMPACT from the Supplier record itself. However, the Supplier is the party referenced on Purchase Invoices, which create payable (AP) entries. Default payable accounts are resolved via buying defaults.

## Related Documents

Referenced by: Purchase Order, Purchase Receipt, Purchase Invoice, Supplier Quotation.

## Limitations

Contact and Address linking is not yet wired up in the Ceylon Stack frontend (same limitation as Customer — `MD-UNV-003`). Per-supplier payment terms and pricing are not exposed.

## Technical Reference

ERPNext doctype: `Supplier`. Frontend route: `/master-data/suppliers` (list), `/master-data/suppliers/[name]` (detail). Draftless — no submitDoc/cancelDoc. Legacy routes (`/buying/suppliers`) 307-redirect to `/master-data/suppliers`. Full field mapping: `docs/backend/01-master-data/customer-supplier.md`.
