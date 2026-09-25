---
title: Bank Account
module: Finance
type: document
status: LIVE
frontend_route: /accounting/bank-accounts
canonical_entity: bank_account
backend_doc: docs/backend/06-accounting/chart-of-accounts-bank-account.md
last_verified: 2026-09-25
---

## Overview

A Bank Account record represents a bank account held by the company, linking it to the Chart of Accounts for financial tracking.

## Business Purpose

Maintains the company's bank account details within the ERP system, enabling future payment processing and bank reconciliation capabilities. Bank Accounts connect the physical banking world to the company's accounting structure.

## Where to Find It

Accounting → Bank Accounts (`/accounting/bank-accounts`)

## Prerequisites

```config
required: Account Name, Bank, Company
conditional: Account Number, IBAN
```

The Bank master record is auto-created via a get-or-create helper the first time a Bank Account references a bank name that doesn't exist yet.

## How to Create

1. Navigate to Accounting → Bank Accounts.
2. Select New Bank Account.
3. Enter the account name.
4. Select or enter the bank name (auto-created if new).
5. Select the company.
6. Enter the account number and/or IBAN.
7. Configure flags: Is Default, Is Company Account, Disabled.
8. Save.

## Important Fields

`account_name` — display name for the bank account. `bank` — the Bank master record. `company` — the owning company. `account` — linked Chart of Accounts account. `bank_account_no` — account number (masked on list view for security). `iban` — IBAN (masked on list view). `is_default` — default bank account flag. `is_company_account` — whether this is a company-owned account.

## Document Lifecycle

Bank Account is a draftless master record.

```flow
Active
Disabled
```

## Available Actions

Create · Edit · Disable / Enable

## Stock Impact

NO STOCK IMPACT

## Accounting Impact

The Bank Account links to a specific GL account in the Chart of Accounts. Future Payment Entry transactions will use this bank account as the payment source or destination.

## Related Documents

Referenced by: Future Payment Entry (PLANNED). Linked to: Chart of Accounts (via `account` field), Bank master.

## Limitations

Bank reconciliation is not yet built. Payment Entry is not yet built — Bank Accounts are currently configuration-only, preparing for when payment processing is implemented. Account number and IBAN are masked in the list view for security.

## Technical Reference

ERPNext doctype: `Bank Account`. Depends on `Bank` master (auto-created). Frontend route: `/accounting/bank-accounts` (list), `/accounting/bank-accounts/[name]` (detail). Draftless — no submitDoc/cancelDoc. Full field mapping: `docs/backend/06-accounting/chart-of-accounts-bank-account.md`.
