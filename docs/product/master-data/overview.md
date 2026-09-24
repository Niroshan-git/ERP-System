---
title: Master Data — Overview
module: Master Data
type: module-overview
status: LIVE
backend_doc: docs/backend/01-master-data/README.md
last_verified: 2026-09-22
---

## Purpose

Shared business entities — Item, Customer, Supplier, Warehouse, UOM, Price List, Item Group,
Customer Group, Supplier Group, Territory, Contact, Address, BOM — have exactly one canonical
identity and one canonical route (`/master-data/*`), regardless of which transactional module
(Sales, Buying, Stock, Manufacturing) a user reaches them from. This avoids the classic ERP
problem of the same "Customer" concept being duplicated per module.

## Main Functions

Item, Item Group, Price List  
Canonicalized under `/master-data/*` 2026-09-18.

Customer, Customer Group, Contact, Address, Territory, Supplier  
Canonicalized under `/master-data/*` 2026-09-19 (Supplier moved out of Buying).

Warehouse  
Canonicalized under `/master-data/warehouses` 2026-09-19.

BOM  
Full list/create/detail/edit/Submit/Cancel/Amend lifecycle at `/master-data/boms` — the one
Master Data entity with a full document lifecycle rather than a plain CRUD master.

Batch, Serial No  
Deliberately kept under `/stock/*` — hybrid masters (transaction-generated/operational, not
structural), confirmed twice per ADR-007.

Not yet built  
Supplier Group, Operations, Workstations, Company, Cost Center, Project, UOM have no dedicated
screen yet.

## Required Configuration

```config
unknown: Whether Customer and Supplier are unified into a single "Business Partner" concept at the data level — open architecture decision, not resolved (see docs/master-data-architecture.md §10)
```

## Related Documents

See `docs/architecture/decisions/README.md` ADR-007 for the full ownership-model decision and
`docs/master-data-architecture.md` for the package sequence and current gaps (including
`MD-UNV-003`: the Customer/Supplier ↔ Contact/Address Dynamic Link relationship ERPNext supports
natively is not wired up anywhere in this frontend).

## Technical Reference

Canonical field mappings for Item, Item Group, UOM, Warehouse, Customer, Supplier, Contact,
Address, and Territory: `docs/backend/01-master-data/`. BOM is cross-referenced from
`docs/backend/05-manufacturing/bom.md` rather than duplicated.
