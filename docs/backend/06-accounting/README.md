# Accounting / Finance — Backend Knowledge Baseline

Domain status: `DISCOVERY` (FIN-0, 2026-09-24) — see `docs/backend/15-migration/migration-status.md`
for the canonical status row (not edited by this package to avoid colliding with concurrent
uncommitted work on that file — see `finance-architecture.md` §"Documentation created/updated").

**No Finance frontend exists yet.** This folder currently holds one document, produced by the
FIN-0 discovery/architecture package, per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §4
(folder created only once the corresponding investigation is real, not ahead of time — this
qualifies because FIN-0 is a live, evidence-backed discovery pass, not a placeholder).

- [`finance-architecture.md`](finance-architecture.md) — FIN-0 discovery/architecture package
  (2026-09-24): live ERPNext v16 Finance doctype inventory, existing frontend footprint audit
  (zero — Sales/Purchase Invoice display is Sales/Buying-owned, not duplicated here), Chart of
  Accounts / Journal Entry / GL Entry / Payment Entry / Bank / Tax / Cost Center models, native
  financial report architecture (General Ledger, Trial Balance, P&L, Balance Sheet, AR, AP —
  all confirmed live Script Reports), cross-module GL traceability (Sales/Buying/Stock/
  Manufacturing → GL), new-tenant readiness matrix, ownership matrix, gap register, and the
  recommended FIN-1..FIN-N build sequence. **No implementation authorized by this package** —
  see that document's control gate.

## Reading order for a future implementation package

1. `finance-architecture.md` §"Accounting authority boundary" — the non-negotiable architecture
   rule (ERPNext remains the accounting engine; Ceylon Stack orchestrates/presents, never
   recalculates).
2. Its "Gap register" and "Recommended Finance V1 build sequence" sections.
3. Cross-reference `docs/backend/02-sales/sales-invoice.md` and
   `docs/backend/03-purchasing/purchase-invoice.md` for the GL posting fields already documented
   there (`debit_to`/`credit_to`, `income_account`/`expense_account`, `cost_center`) — do not
   re-document them here.
4. Cross-reference `docs/backend/05-manufacturing/manufacture-completion.md` for the only
   live-verified Manufacturing→GL example (Manufacture Stock Entry, perpetual inventory).
