---
title: Finance — Overview
module: Finance
type: module-overview
status: PARTIAL
backend_doc: docs/backend/06-accounting/finance-architecture.md
last_verified: 2026-09-25
---

## Purpose

Finance is Ceylon Stack's newest module (added 2026-09-24) — configuration and visibility over
ERPNext's real accounting core. Ceylon Stack does not run its own posting engine: ERPNext remains
the sole accounting authority, and this module provides configuration UX and visibility on top of
it, never independent GL logic.

## Main Functions

Chart of Accounts  
Full maintenance of ERPNext's real Account hierarchy for the active company — create, edit
(including renames), enable/disable, and dependency-checked delete. A SAP B1-inspired hierarchy
presentation (Drawer / Title Account / Active Account / Control Account / Level) is layered on
top, purely presentational — no new DocType fields.

Bank Account  
Full CRUD for ERPNext's `Bank Account` doctype, with account number/IBAN masked on the list view.

Account Determination  
Company-level G/L account/warehouse/cost-center defaults (`/accounting/account-determination`),
plus per-record overrides on an "Accounting" tab on Item, Item Group, Customer, Customer Group,
and Supplier — see `docs/product/finance/account-determination.md`. Brand and Supplier Group
overrides are not yet built (no frontend page exists for either yet).

Payment Entry, AR/AP visibility, Journal Entry, GL/financial reports  
**Planned, not built.** `FIN-2` (Payment Entry + AR/AP visibility) is the recommended next Finance
package but is **not yet authorized** — do not describe these as available.

## Required Configuration

```config
required: Company, Chart of Accounts (ERPNext's default or a company-specific one)
conditional: Bank (auto-created via a get-or-create helper the first time a Bank Account references one that doesn't exist yet)
```

## Integration With Other Modules

Sales → Finance: Sales Invoice creates the customer receivable (native ERPNext posting, not
visible in this app's UI yet). Purchasing → Finance: Purchase Invoice creates the supplier
payable, same caveat. Manufacturing → Finance: GL impact of Manufacture Stock Entries is
NEEDS_VERIFICATION (see the Work Order and Manufacturing pages).

## Limitations

There is no in-app way yet to record a payment, view outstanding receivables/payables, post a
manual Journal Entry, or run a General Ledger/Trial Balance/P&L/Balance Sheet report. All of that
exists natively in ERPNext Desk today but is not surfaced in this frontend.

## Related Documents

See the Release Log's "Finance / Accounting Module" section for the full shipped feature list and
verification history (`FIN-1`, `FIN-1E`, `FIN-1F-1`, `FIN-1F-2`).

## Technical Reference

Canonical field/lifecycle documentation: `docs/backend/06-accounting/` (finance-architecture,
chart-of-accounts-bank-account, chart-of-accounts-sap-b1-architecture, account-determination).
