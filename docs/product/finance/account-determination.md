---
title: Account Determination
module: Finance
type: document
status: PARTIAL
frontend_route: /accounting/account-determination
canonical_entity: account_determination
backend_doc: docs/backend/06-accounting/account-determination.md
last_verified: 2026-09-25
---

## Overview

Account Determination is the configuration layer connecting Company, Item, Item Group, Customer,
Customer Group, and Supplier records to the G/L accounts Sales, Buying, Inventory, and
Manufacturing transactions actually post to. ERPNext resolves the account to use for a given
transaction line by checking these masters in order, most-specific first — this feature makes that
chain visible and editable without needing ERPNext's own Desk interface.

## Business Purpose

Lets a Finance/accounting admin control which G/L accounts a transaction lands on without editing
every transaction manually — set a default once at the Company level, then override it for a
specific Item, Item Group, Customer, Customer Group, or Supplier only where the business genuinely
needs a different account (e.g. one product line's revenue posts to a different income account, or
one key customer's receivable posts to a dedicated account). ERPNext remains the sole accounting
authority — this feature only writes to ERPNext's own canonical fields, it never runs independent
posting logic.

## Where to Find It

- **Company-level defaults**: Accounting → Account Determination (`/accounting/account-determination`).
- **Per-record overrides**: open any Item, Item Group, Customer, Customer Group, or Supplier and
  select its "Accounting" tab, alongside the existing "Details" tab.

## Prerequisites

```config
required: Company (every account default is scoped to a specific Company)
optional: Account, Cost Center, Warehouse records already created for that Company — the account/cost-center/warehouse dropdowns only offer postable (non-group) records belonging to the selected Company
```

## How to Create / Use

1. **Company defaults**: go to Accounting → Account Determination, pick a Company if more than one
   exists, and fill in the General / Sales & Receivables / Purchasing & Payables / Inventory /
   Manufacturing tabs. Save.
2. **Item or Item Group override**: open the Item or Item Group, select the "Accounting" tab, pick
   the Company (if more than one exists), and set Income/Expense/COGS/Inventory/Discount/
   Provisional/Deferred Revenue/Deferred Expense/Expenses-Added-To-Stock accounts, Buying/Selling
   Cost Center, Default Warehouse, Default Price List, and/or Default Supplier. Save.
3. **Customer, Customer Group, or Supplier override**: open the record, select the "Accounting"
   tab, pick the Company, and set the Receivable/Payable Account and Advance Account. Save.
4. Leaving a field blank keeps whatever value was already saved for that Company's row — it does
   not clear it. To view or edit a different Company's row, use the Company selector at the top of
   the Accounting tab; this reloads the page but keeps the Accounting tab active.

## Important Fields

**Company** (`Account` doctype fields, ~28 total) — the fallback used when nothing more specific
overrides it: `default_receivable_account`, `default_payable_account`, `default_income_account`,
`default_expense_account` (labeled "Default Cost of Goods Sold Account" in ERPNext's own UI — a
genuine label/fieldname mismatch), `default_inventory_account`, and more (see the backend
reference for the full list).

**Item / Item Group** (`Item Default` child-table row, one per Company) — `income_account`,
`expense_account`, `default_cogs_account`, `default_inventory_account`, `buying_cost_center`,
`selling_cost_center`, `default_discount_account`, `default_provisional_account`,
`deferred_revenue_account`, `deferred_expense_account`, `expenses_added_to_stock_account` (+
contra), `default_warehouse`, `default_price_list`, `default_supplier`.

**Customer / Customer Group / Supplier** (`Party Account` child-table row, one per Company) —
`account` (the receivable account for Customer/Customer Group, the payable account for Supplier)
and `advance_account`.

## Document Lifecycle

These are configuration rows, not workflow documents — there is no draft/submit/cancel lifecycle.
A row for a given Company either exists (with some or all fields set) or doesn't yet; saving the
form creates it if needed or updates the existing one.

## Available Actions

View · Edit (Company-level and per-record overrides) · switch between Companies.

## Integration With Other Modules

Feeds Sales (Sales Invoice/Delivery Note/Quotation account resolution), Buying (Purchase
Invoice/Receipt/Order), Inventory (Stock Entry, stock valuation postings), and Manufacturing (Work
Order/BOM operating-cost postings) — every one of those transaction types asks ERPNext's own
resolution logic to check these masters before falling back to the Company default. See the backend
reference for the exact, source-verified resolution order per accounting role.

## Limitations

Brand and Supplier Group participate in the same resolution chains (Brand sits between Item Group
and Company for Item Default; Supplier Group sits between Supplier and Company for Party Account)
but have no override UI yet — neither has any other frontend page in this app to attach it to.
Payment Entry, Journal Entry, AR/AP visibility, and financial statement reports are separate,
not-yet-authorized Finance packages and are not part of this feature. An "Effective Account" / "Why
This Account?" explainer (showing which tier actually won for a given transaction) and an automated
configuration-health check are planned but not yet built.

## Accounting Impact

NO DIRECT GL IMPACT — this feature only edits configuration fields on Company/Item/Item Group/
Customer/Customer Group/Supplier; it does not post any G/L entries itself. It changes which
accounts *future* transactions will resolve to, once ERPNext's own transaction logic runs.
