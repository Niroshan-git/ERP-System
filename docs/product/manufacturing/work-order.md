---
title: Work Order
module: Manufacturing
type: document
status: LIVE
frontend_route: /manufacturing/work-orders
canonical_entity: work_order
backend_doc: docs/backend/05-manufacturing/work-order.md
last_verified: 2026-09-23
---

## Overview

A Work Order is the planning document that authorizes producing a quantity of a manufacturable
Item against a specific BOM.

## Business Purpose

Turns "we need to make 50 of this" into a trackable production job: what raw materials are
required, what routing/operations apply, and how much has actually been transferred, consumed,
and produced so far.

## Where to Find It

Manufacturing → Work Orders (`/manufacturing/work-orders`), or generated from a submitted
Production Plan via Make Work Order.

## Prerequisites

```config
required: Item (with a default BOM set), BOM (Submitted)
conditional: Source/WIP/Target Warehouse (optional at create; WIP warehouse is required by ERPNext at Submit time)
```

## Process Flow

```flow
BOM
Work Order (Draft)
Submit
Material Transfer
Complete Production
Finished Goods
```

## How to Create

1. Navigate to Manufacturing → Work Orders, select + New Work Order.
2. Choose the production Item — restricted to Items with a default BOM set.
3. BOM auto-selects when exactly one active/default BOM exists for the Item.
4. Review the read-only Materials/Operations preview (client-scaled from the BOM's own top-level
   quantities — ERPNext explodes multi-level BOMs server-side, not the frontend).
5. Optionally set Source/WIP/Target warehouses and check the Material Readiness panel.
6. Save — always creates as Draft, never auto-submits.
7. Submit when ready to authorize production (runs ERPNext's own `validate()`/`on_submit()`,
   including the WIP-warehouse-required check).

## Important Fields

`production_item` — the Item being manufactured. `bom_no` — the BOM this Work Order was created
against. `qty` — quantity to produce. `required_items[]` — the raw materials needed (child
entity, `transferred_qty`/`consumed_qty` written by later Stock Entries). `operations[]` — the
routing/operation sequence, each with workstation, time, and batch size.

## Document Lifecycle

```flow
Draft
Submitted
```

Submitted also branches to **Cancelled** (`MFG-WO-LC-1`) — allowed even from a Completed Work
Order, blocked only by still-submitted linked Stock Entries or Job Cards, never by the Completed
status itself. Save/edit of a Draft and Amend are **not** built in this frontend.

## Available Actions

Submit (Draft only) · Cancel (Submitted, if no blocking linked documents) · Transfer Materials ·
Complete Production

## Stock Impact

Work Order itself does not move stock — it is the planning document. Stock movement happens via
its linked Stock Entries: Material Transfer for Manufacture (writes `required_items[].transferred_qty`)
and Manufacture-purpose entries (writes `consumed_qty` and `produced_qty`).

## Accounting Impact

NEEDS_VERIFICATION — Work Order itself does not appear to post GL entries directly (it's a
planning/production-tracking document); GL impact happens at the linked Stock Entry level, not yet
independently inspected. See `docs/backend/99-unverified/unverified-behaviours.md`.

## Related Documents

```flow
BOM
Work Order
Material Transfer
Complete Production
```

A Work Order may also be generated from a submitted Production Plan (Make Work Order), and can
have related Job Cards.

## Common Scenarios

Partial production is supported — Complete Production re-previews `fg_completed_qty` rather than
requiring the full planned quantity in one posting.

## Troubleshooting

Cancel is blocked, not silently allowed, when a submitted Material Transfer, Manufacture Stock
Entry, or Job Card still references the Work Order — the page names the exact blocking document(s)
rather than failing generically.

## Limitations

Alternative Item substitution is not built (no `Item Alternative` master data configured on this
instance). Multi-location "Get Items for Purchase / Transfer" and Reserve Stock are out of scope.

## Technical Reference

ERPNext doctype: `Work Order` (children: `Work Order Item`, `Work Order Operation`). Relationships:
1:N `work_order_item`, 1:N `work_order_operation`, 1:N `job_card`, 1:N `stock_entry` (filtered to
Manufacturing purposes), N:1 `bom` (`bom_no`), N:1 `item` (`production_item`). Full field mapping,
dependency matrix for Cancel, and live QA scenarios: `docs/backend/05-manufacturing/work-order.md`.
