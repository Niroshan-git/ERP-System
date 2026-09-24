---
title: Purchasing — Overview
module: Purchasing
type: module-overview
status: LIVE
last_verified: 2026-09-16
---

## Purpose

Purchasing (the Buying module in the sidebar) covers procuring goods from suppliers — from
requesting materials through to paying the supplier's invoice.

## Process Flow

```flow
Material Request
Request for Quotation
Supplier Quotation
Purchase Order
Purchase Receipt
Purchase Invoice
```

## Main Functions

Material Request, Request for Quotation, Supplier Quotation, Purchase Order, Purchase Receipt,
Purchase Invoice — the full core purchasing cycle, live-verified end to end 2026-09-16 (partial-
quantity Purchase Receipt, correct `Bin` stock impact, missing-mandatory-field and
cancel-while-linked error guards).

## Required Configuration

```config
required: Supplier, Item, UOM
conditional: Tax Template, Payment Terms
```

## Integration With Other Modules

Purchasing → Inventory: Purchase Receipt moves real stock via `Bin`. Purchasing → Finance:
Purchase Invoice creates the supplier payable.

## Limitations

There is no direct Material Request → Purchase Order shortcut — only via Request for Quotation +
Supplier Quotation. Flagged for a future product decision, not scheduled work.

## Related Documents

See the Release Log's "Buying Module" section for the full shipped feature list, the Buying
Reports hub, and verification history.

## Technical Reference

Canonical field/lifecycle documentation: `docs/backend/03-purchasing/` (purchase-order,
purchase-receipt, purchase-invoice). Material Request, Request for Quotation, and Supplier
Quotation are NEEDS_VERIFICATION — not yet given their own `docs/backend/` documents.
