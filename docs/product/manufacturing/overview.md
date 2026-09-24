---
title: Manufacturing — Overview
module: Manufacturing
type: module-overview
status: LIVE
backend_doc: docs/backend/05-manufacturing/README.md
last_verified: 2026-09-24
---

## Purpose

Manufacturing turns a Bill of Materials and a production plan into finished goods — the layer
that gives Ceylon Stack its name, eventually adding live machine/shop-floor visibility (OEE) on
top of ERPNext's native Manufacturing module.

## Process Flow

```flow
BOM
Work Order
Material Transfer
Complete Production
Finished Goods
```

Production Plan sits in front of Work Order as an optional planning layer, generating Work
Orders and Material Requests from Sales Orders or manual demand.

## Main Functions

BOM  
Full list/create/read/edit(Draft)/Submit/Cancel/Amend lifecycle, plus submitted-BOM
Active/Inactive/Default availability toggles. Lives in the Master Data module, not Manufacturing.

Work Order  
Full list/detail/create/Submit/Cancel. See the Work Order page for full detail.

Material Transfer for Manufacture  
Moves raw materials from store to work-in-progress against a submitted Work Order.

Complete Production (Manufacture Stock Entry)  
Posts finished goods against a submitted Work Order, partial production supported.

Job Card  
Read-only list/detail plus Cancel. Time-log/execution actions (Start/Pause/Complete) are not
built yet (`MFG-JOBCARD-2`, Planned).

Production Plan  
Full list/detail/create(Draft)/Submit/Cancel, sub-assembly planning, and Make Work Order / Make
Material Request generation — all delegating to ERPNext's own native whitelisted methods.

## Required Configuration

```config
required: Item (with a default BOM), BOM (Submitted), Warehouse
conditional: Workstation, Operation (not yet built — no dedicated screen exists for either)
```

## Integration With Other Modules

Manufacturing → Inventory: Material Transfer and Complete Production both move real stock via
`Bin` and the Stock Ledger. Manufacturing → Sales: Production Plan can pull demand from open
Sales Orders.

## Limitations

Workstations and Production Execution (shop-floor progress/completion tracking against Job Cards)
are Planned, not built. The MES/OEE service (machine/sensor data → OEE calculation) is a separate
FastAPI service, not started.

## Related Documents

See the Release Log's "Manufacturing & OEE (Smart Factory)" section for the full shipped feature
list and package-by-package verification history (`MFG-*`, `PP-*`).

## Technical Reference

Canonical field/lifecycle documentation: `docs/backend/05-manufacturing/` (bom, work-order,
material-transfer, manufacture-completion, job-card, production-plan).
