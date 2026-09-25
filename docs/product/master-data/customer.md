---
title: Customer
module: Master Data
type: document
status: LIVE
frontend_route: /master-data/customers
canonical_entity: customer
backend_doc: docs/backend/01-master-data/customer-supplier.md
last_verified: 2026-09-25
---

## Overview

A Customer is a business partner to whom goods or services are sold. It is the canonical party record referenced across Sales, CRM, and Finance modules.

## Business Purpose

Maintains a single, authoritative record for every buyer the business transacts with — linking their identity, classification, and territory to all downstream sales transactions.

## Where to Find It

Master Data → Customers (`/master-data/customers`). Customers also appear as link fields in Quotations, Sales Orders, Delivery Notes, Sales Invoices, and CRM Leads/Opportunities.

## Prerequisites

```config
required: Customer Name
conditional: Customer Group, Territory
```

## How to Create

1. Navigate to Master Data → Customers.
2. Select New Customer.
3. Enter the Customer Name.
4. Select the Customer Type (Company, Individual, or Partnership).
5. Optionally assign a Customer Group and Territory.
6. Save.

Customers can also be created via CRM Lead → Customer conversion, which sets `lead_name` as the conversion-provenance pointer.

## Important Fields

`customer_name` — the customer's display name. `customer_type` — Company, Individual, or Partnership. `customer_group` — classification group. `territory` — geographic territory. `disabled` — soft-disable flag.

## Document Lifecycle

Customer is a draftless master record — no Draft/Submitted/Cancelled workflow.

```flow
Active
Disabled
```

Once created, a Customer can be edited or disabled. There is no delete action.

## Available Actions

Create · Edit · Disable / Enable

## Stock Impact

NO STOCK IMPACT — Customer is a master record.

## Accounting Impact

NO DIRECT ACCOUNTING IMPACT from the Customer record itself. However, the Customer is the party referenced on Sales Invoices, which create receivable (AR) entries. Default receivable accounts are resolved via the Account Determination hierarchy.

## Related Documents

Referenced by: Quotation, Sales Order, Delivery Note, Sales Invoice, Sales Return, CRM Lead (conversion target), CRM Opportunity.

## Troubleshooting

"Customer Name already exists" — Customer names must be unique.

## Limitations

Contact and Address linking via ERPNext's Dynamic Link architecture exists natively but the linking action is not yet wired up in the Ceylon Stack frontend (see `MD-UNV-003`). Per-customer payment terms, credit limits, and pricing rules are not exposed in the frontend.

## Technical Reference

ERPNext doctype: `Customer`. Frontend route: `/master-data/customers` (list), `/master-data/customers/[name]` (detail). Draftless — no submitDoc/cancelDoc. Legacy routes (`/sales/customers`) 307-redirect to `/master-data/customers`. Full field mapping: `docs/backend/01-master-data/customer-supplier.md`.
