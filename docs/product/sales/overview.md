---
title: Sales — Overview
module: Sales
type: module-overview
status: LIVE
last_verified: 2026-09-25
---

## Purpose

Sales covers the commercial cycle from quoting a customer through to getting paid — the most
mature and fully accepted module in Ceylon Stack today (Quotation → Sales Order → Delivery Note
→ Sales Invoice, frozen/hardened per the Current Mission priority lock).

## Process Flow

```flow
Lead
Opportunity
Quotation
Sales Order
Delivery Note
Sales Invoice
Payment
```

Payment Entry is not yet built (see Finance → Overview) — a Sales Invoice today does not yet have
an in-app way to record the customer's payment against it.

## Main Functions

Quotation  
Commercial offer provided to a customer before confirming an order. See the Quotation page for
full detail.

Sales Order  
Confirmed customer order representing the commitment to supply goods/services. Supports "Copy
From" one or more Quotations (SAP B1-style), and multiple partial Sales Orders from one
Quotation.

Delivery Note  
Records physical delivery and the resulting stock movement, with an optional Pick List stage in
front of it and a SAP B1-style multi-batch/multi-serial picker on its lines.

Sales Invoice  
Creates the customer receivable/accounting transaction. Supports multiple partial Sales Invoices
from one Sales Order.

## Required Configuration

```config
required: Company, Customer, Item, UOM
conditional: Tax Template, Price List, Pricing Rule, Payment Terms
```

## Integration With Other Modules

CRM → Sales: Opportunity → Quotation handoff. Sales → Inventory: Delivery Note and Pick List move
real stock via `Bin`. Sales → Finance: Sales Invoice creates the GL-facing receivable (Journal/GL
posting itself is native ERPNext — see Finance → Overview for what's built in this app so far).

## Related Documents

See the Release Log's "Sales Documents", "Partial Fulfillment & Copy From Quotation", and "Sales
Module — Scenario Gaps Plan" sections for the full shipped feature list and verification history.

## Technical Reference

Canonical field/lifecycle documentation: `docs/backend/02-sales/` (quotation, sales-order,
delivery-note, sales-invoice, pick-list, sales-return, credit-note, cancellation-guards,
secondary-sales-masters, selling-settings — each independently documented).
