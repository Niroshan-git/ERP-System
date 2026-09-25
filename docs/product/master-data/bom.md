---
title: Bill of Materials (BOM)
module: Master Data
type: document
status: LIVE
frontend_route: /master-data/boms
canonical_entity: bom
backend_doc: docs/backend/05-manufacturing/bom.md
last_verified: 2026-09-25
---

## Overview

A Bill of Materials (BOM) defines the raw materials and operations required to manufacture a finished product. It is the recipe that Work Orders use to plan and execute production.

## Business Purpose

Provides a structured, versioned definition of what goes into making a product — materials, quantities, operations, and standard costs. Every manufacturing run starts from a BOM.

## Where to Find It

Master Data → Bills of Materials (`/master-data/boms`). BOMs also appear as link fields on Work Orders and Items (as `default_bom`).

```callout:info
BOM lives under Master Data in Ceylon Stack's navigation, not under Manufacturing. Cross-links from the Manufacturing module reference it here.
```

## Prerequisites

```config
required: Item (the finished product), Company, UOM, Currency
conditional: Operation, Workstation (if using routing/operations)
```

## How to Create

1. Navigate to Master Data → Bills of Materials.
2. Select New BOM.
3. Select the production Item (the finished good this BOM produces).
4. Enter the quantity this BOM produces.
5. Select the Company, UOM, and Currency.
6. Add component items — specify each raw material, its quantity, and UOM.
7. Optionally add operations (with workstation, time, and batch size).
8. Configure options: Is Active, Is Default, Allow Alternative Item.
9. Set source and target warehouses if applicable.
10. Save (creates a Draft).
11. Submit to make it available for Work Orders.

## Important Fields

`item` — the finished product this BOM is for. `quantity` — how many units this BOM produces. `items[]` (BOM Items) — component materials with `item_code`, `qty`, `uom`. `operations[]` (BOM Operations) — optional routing/operation sequence. `is_active` — whether this BOM is available for use. `is_default` — whether this is the default BOM for the Item (used by Work Order auto-selection). `docstatus` — Draft / Submitted / Cancelled.

## Document Lifecycle

```flow
Draft
Submitted
```

A Submitted BOM can be toggled between **Active** and **Inactive** and can be **Set as Default** for its Item. A Submitted BOM can be **Cancelled**, and a Cancelled BOM can be **Amended** (creating a new Draft with all fields/items carried over).

## Available Actions

Edit (Draft only) · Submit · Cancel · Amend (from Cancelled) · Activate / Deactivate · Set as Default

## Stock Impact

NO STOCK IMPACT — a BOM is a planning/definition document. Stock movements occur when a Work Order uses this BOM to perform Material Transfers and Complete Production.

## Accounting Impact

NO DIRECT ACCOUNTING IMPACT — BOM defines standard costs but does not post any GL entries. Actual costing occurs at the Stock Entry level during manufacturing.

## Related Documents

```flow
BOM
Work Order
Material Transfer
Complete Production
```

Referenced by: Work Order (`bom_no`), Item (`default_bom`), Production Plan.

## Common Scenarios

An Item can have multiple BOMs — for different production methods, batch sizes, or cost variants. Only one can be the Default BOM (used for auto-selection on Work Order create). Multi-level BOMs (sub-assemblies) are supported via ERPNext's native BOM explosion.

## Troubleshooting

"Cannot create Work Order — no BOM found" — The Item must have a default BOM set. Submit and activate a BOM, then set it as default.

"Cannot edit this BOM" — Only Draft BOMs can be edited. If the BOM is Submitted, cancel it and amend to create a new editable Draft.

## Limitations

No Workstation or Operation dedicated screen exists in Ceylon Stack yet — these are referenced as link fields on BOM operations but cannot be managed in-app. Alternative Item substitution is not built.

## Technical Reference

ERPNext doctype: `BOM` (children: `BOM Item`, `BOM Operation`). Frontend route: `/master-data/boms` (list), `/master-data/boms/[name]` (detail). Submittable doctype with full Draft/Submit/Cancel/Amend lifecycle. Cross-referenced from `docs/backend/05-manufacturing/bom.md` (Manufacturing context) and `docs/backend/01-master-data/` (Master Data context).
