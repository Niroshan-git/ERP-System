# Accounting / Finance — Backend Knowledge Baseline

Domain status: `FIN-1 + FIN-1E ACCEPTED`, `FIN-1F-1 IN PROGRESS` (FIN-0 discovery closed +
`FIN-GOV-1` governance authorization, both 2026-09-24; `FIN-1` implemented same day, commit
`58760a0`; `FIN-1E` extended Chart of Accounts to full create/edit/disable/delete maintenance same
day, commits `3c50478` + fix `387590a` — see `QA_LOG.md`'s 2026-09-24 `FIN-1E` entry). Chart of
Accounts (full maintenance) and Bank Account (full CRUD) are real, live-verified, accepted
frontend screens — see `docs/backend/15-migration/migration-status.md` for the canonical status
row. `FIN-1F` (owner-authorized SAP Business One-inspired CoA UX enhancement, split into
sub-packages FIN-1F-1..4) is layered on top without reopening FIN-1/FIN-1E.

This folder now holds four documents, per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §4:

- [`finance-architecture.md`](finance-architecture.md) — FIN-0 discovery/architecture package
  (2026-09-24): live ERPNext v16 Finance doctype inventory, existing frontend footprint audit,
  Chart of Accounts / Journal Entry / GL Entry / Payment Entry / Bank / Tax / Cost Center models,
  native financial report architecture, cross-module GL traceability, new-tenant readiness
  matrix, ownership matrix, gap register, and the FIN-1..FIN-6 build sequence. Historical —
  describes the state *before* FIN-1 implemented Chart of Accounts/Bank Account; see
  [`chart-of-accounts-bank-account.md`](chart-of-accounts-bank-account.md) for what was actually
  built and any corrections to this document's assumptions.
- [`chart-of-accounts-bank-account.md`](chart-of-accounts-bank-account.md) — **FIN-1
  implementation package** (2026-09-24): canonical field mapping, live-verified validation rules
  (IBAN format check, duplicate-name handling, `is_company_account` conditional requirement, the
  Bank-record-must-exist-first blocker and its get-or-create resolution), permissions, and
  `NEEDS_VERIFICATION` items for `Account` and `Bank Account`. Read this one first for anything
  touching the live Chart of Accounts or Bank Account screens — it supersedes
  `finance-architecture.md`'s §5/§12 where the two differ (this document re-verified those
  sections live the same day and found them accurate, with additions noted inline).
- [`chart-of-accounts-sap-b1-architecture.md`](chart-of-accounts-sap-b1-architecture.md) —
  **FIN-1F package** (2026-09-24 onward): SAP Business One research findings, the Drawer/Title/
  Active/Level concept mapping onto ERPNext's `Account` doctype (derived only, no new fields),
  and where Ceylon Stack intentionally differs from SAP B1. Read this before touching the Chart
  of Accounts page for any FIN-1F sub-package.

## Reading order for a future implementation package (FIN-2 onward)

1. `finance-architecture.md` §"Accounting authority boundary" — the non-negotiable architecture
   rule (ERPNext remains the accounting engine; Ceylon Stack orchestrates/presents, never
   recalculates).
2. `chart-of-accounts-bank-account.md` in full — what FIN-1 actually shipped, so FIN-2 doesn't
   re-derive already-live-verified Account/Bank Account facts.
3. `finance-architecture.md`'s "Gap register" and "Recommended Finance V1 build sequence"
   sections for what's still ahead (FIN-2: Payment Entry + AR/AP visibility is next).
4. Cross-reference `docs/backend/02-sales/sales-invoice.md` and
   `docs/backend/03-purchasing/purchase-invoice.md` for the GL posting fields already documented
   there (`debit_to`/`credit_to`, `income_account`/`expense_account`, `cost_center`) — do not
   re-document them here.
5. Cross-reference `docs/backend/05-manufacturing/manufacture-completion.md` for the only
   live-verified Manufacturing→GL example (Manufacture Stock Entry, perpetual inventory).
