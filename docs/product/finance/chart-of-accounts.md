---
title: Chart of Accounts
module: Finance
type: document
status: LIVE
frontend_route: /accounting/chart-of-accounts
canonical_entity: account
backend_doc: docs/backend/06-accounting/chart-of-accounts-bank-account.md
last_verified: 2026-09-25
---

## Overview

The Chart of Accounts is the hierarchical structure of all accounting accounts used by the company. It is the foundation of the entire financial module.

## Business Purpose

Organizes every account the business uses to record financial transactions — assets, liabilities, equity, income, and expenses — into a navigable tree structure. Every GL entry posted by Sales Invoices, Purchase Invoices, and other transactional documents references accounts from this chart.

## Where to Find It

Accounting → Chart of Accounts (`/accounting/chart-of-accounts`)

## Prerequisites

```config
required: Company (a Chart of Accounts is always scoped to a specific Company)
```

## How to Create / Use

1. Navigate to Accounting → Chart of Accounts.
2. The chart displays as a SAP B1-inspired hierarchy with levels: Drawer, Title Account, Active Account, Control Account.
3. To add a new account, select the parent account and create a child.
4. Set the account name, root type (Asset, Liability, Equity, Income, Expense), and report type (Balance Sheet or Profit and Loss).
5. Configure whether the account is a Group (can have children) or a Ledger (posts transactions).
6. Save.

## Important Fields

`account_name` — display name. `parent_account` — position in the hierarchy. `root_type` — Asset, Liability, Equity, Income, or Expense. `report_type` — Balance Sheet or Profit and Loss. `is_group` — whether this account can have sub-accounts. `account_currency` — the currency for this account.

## Document Lifecycle

Accounts are draftless master records.

```flow
Active
Disabled
```

System accounts (root accounts, default company accounts) have strict protections against editing or deletion.

## Available Actions

Create · Edit (including rename) · Enable / Disable · Delete (with dependency check)

## Stock Impact

NO STOCK IMPACT — Accounts are configuration records.

## Accounting Impact

The Chart of Accounts defines where financial transactions are recorded. Every GL entry references accounts from this chart. Changes to the chart structure affect how future transactions are classified and reported.

## Related Documents

Referenced by: Sales Invoice (`debit_to`, `income_account`), Purchase Invoice (`credit_to`, `expense_account`), Stock Entry (inventory accounts), Bank Account.

## Troubleshooting

"Cannot delete this account" — An account with child accounts or existing GL entries cannot be deleted. Disable it instead.

"Cannot edit this account" — System accounts (root accounts, default company accounts) are protected from certain edits.

## Limitations

The SAP B1-style hierarchy presentation is purely visual — no new DocType fields are created. Financial reports (Trial Balance, P&L, Balance Sheet) are not yet built in the Ceylon Stack frontend. Opening balance entry is not yet available.

## Technical Reference

ERPNext doctype: `Account`. Tree structure using Frappe's nested-set model. Frontend route: `/accounting/chart-of-accounts`. Presentation layers a SAP B1-inspired Drawer/Title/Active/Control Account hierarchy on top of ERPNext's native tree. Full architecture: `docs/backend/06-accounting/chart-of-accounts-bank-account.md`, `docs/backend/06-accounting/chart-of-accounts-sap-b1-architecture.md`.
