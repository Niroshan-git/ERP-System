# Finance / Accounting — FIN-0 Discovery & V1 Architecture

**Package:** FIN-0 | **Type:** Discovery / Architecture / V1 Planning | **Implementation authorization:** NONE (superseded — see update below)
**Date:** 2026-09-24 | **Status:** `CLAUDE_HANDOFF` — pending independent review and pending a
governance decision (see "Control gate" at the end of this document).

**Update, same day (`FIN-1`):** governance was authorized (`FIN-GOV-1`, see the Control gate
below) and `FIN-1` (Chart of Accounts read + Bank Account CRUD) was implemented and live-verified
the same day. This document is now historical for §5 (Chart of Accounts) and §12 (Bank & Cash) —
see `chart-of-accounts-bank-account.md` for the implementation, corrected/re-verified findings,
and any live-tested detail this discovery pass didn't reach (e.g. IBAN format validation, the
exact `Bank`-record-must-exist-first mechanics, `Bank Account.mask` never actually being
computed anywhere in this ERPNext version). Everything else in this document (§6-§35, the FIN-2..
FIN-6 sequence) is unchanged and still current.

No Finance UI, mutation API, or accounting calculation code was added by this package. This is a
documentation-only discovery pass, evidence-gathered via three read-only agents (live-server SSH,
frontend code audit, existing-docs cross-check) plus a repo-safety pass in the main session.

---

## 1. Repository baseline (at time of discovery)

Branch `frontend`. Substantial uncommitted foreign WIP existed and was **not touched**:
Sales lifecycle (`delivery-notes`, `invoices`, `orders`, `quotations` actions/pages), login/auth
rework (`login/page.tsx`, new `login/layout.tsx`, `forgot-password`, `api/dev/`), Observability
(`observability.py`, `serverProvider.ts`), and in-progress Master Data docs
(`docs/backend/01-master-data/*.md`, `docs/master-data-architecture.md`,
`docs/operations/AI_WORK_LOG.md`). This package added only new files under
`docs/backend/06-accounting/` and left every modified/untracked foreign file alone.

Recent commit history (last 5): observability O-10A checkpoint, Manufacturing Work Order
blocker-link + Stock Entry cancel verification, observability integration monitoring,
observability user-activity/audit-trail, Job Card Cancel. Manufacturing lifecycle work
(Work Order/Job Card/BOM cancel, Production Plan) is recently and heavily active — see §"Control
gate" for why this matters to Finance sequencing.

---

## 2. Deployed ERPNext / Frappe version — LIVE VERIFIED

Confirmed via `bench version` on the live Hetzner site `frontend` (host `62.238.22.161`):

- **Frappe 16.33.1**
- **ERPNext 16.34.2**
- `smart_factory` 0.0.1 also installed on this site. `hrms`/`ceylon_services` exist on the server
  but are **not** installed on the `frontend` site (they run on the separate `gym-demo` site).

All Finance findings below are v16-specific, gathered by live `frappe.get_meta(...)` queries and
`frappe.get_all(...)` reads via `bench console` — not assumed from general ERPNext knowledge.

---

## 3. Existing Finance frontend footprint — LIVE + CODE VERIFIED

**Zero dedicated Finance module exists anywhere in the monorepo** — not in `apps/frontend`, not
in `apps/smart_factory` (grepped for Account/GL Entry/Payment Entry/Journal Entry/accounting
terms: no matches at all beyond an unrelated "service account" string match in
`observability.py`).

What already exists, because it belongs to Sales/Buying, not Finance:

| Concept | Classification | Evidence |
|---|---|---|
| Sales Invoice | **LIVE** (Sales-owned) | Full list/detail/create/submit/cancel at `sales/invoices/`. Detail page shows Grand Total + Outstanding, real status badges mirroring ERPNext's `get_indicator`. No payment-capture action. |
| Purchase Invoice | **LIVE** (Buying-owned) | Same shape at `buying/purchase-invoices/`. No payment action. |
| Payment Entry / Payment Entry Reference | **PARTIAL** | Real `listDocs` query surfaces linked Payment Entries under a Sales Invoice's Connections tab and is used as a genuine cancel-block guard (`sales/invoices/actions.ts`) — mirrors ERPNext's own `check_if_doc_is_linked`. But the generated link target `hrefBase: "/accounting/payment-entries"` (`lib/connections.ts`) has **no route** — clicking 404s today. |
| Account / Chart of Accounts | **ZERO** | No matches in `src/`. `masterDataWorkspace.ts` explicitly documents Cost Center/Project/Currency/Tax/Payment Terms as deliberately-omitted "no route" items. |
| Journal Entry, Journal Entry Account, GL Entry | **ZERO** | No matches anywhere. |
| Payment Request, Bank Account, Bank Transaction, Bank Reconciliation, Mode of Payment | **ZERO** | No matches. |
| Payment Terms / Sales Returns / Credit Notes | **ZERO (roadmap placeholder)** | Sidebar has `soon: true`, unclickable, greyed-out nav entries — not real screens. |
| Sales/Purchase Taxes and Charges Template | **PARTIAL** | One label reference in a workspace card list; no dedicated screen. |
| Trial Balance, General Ledger, P&L, Balance Sheet, Cash Flow | **ZERO** | Not referenced anywhere, not even as placeholders. |

**Bottom line:** Finance V1 must not rebuild Sales/Purchase Invoice amount/outstanding/status
display — that's live and correct. The one concrete gap directly touching existing frontend
plumbing is the dead `/accounting/payment-entries` link already wired into the Connections tab.

### Reusable reporting infrastructure — CODE VERIFIED

`lib/erpnext.ts` is confirmed to be the single real API layer (per `FRONTEND_GUIDE.md`'s rule) —
every ERPNext call found in the audited areas routes through it. It already exports
`runReport(reportName, filters)`, which `POST`s to `/api/method/frappe.desk.query_report.run` —
the exact endpoint ERPNext Desk's own report view calls. This is **already proven in production
for two Accounts-module reports** (Sales Register, Item-Wise Sales Register) plus Sales/Purchase
Analytics and Stock Balance, each paired with `components/ReportTable.tsx` (renders whatever
dynamic `columns`/`result` shape the report returns) and `components/ReportFilterBar.tsx`. A
Finance V1 package consuming General Ledger, Trial Balance, P&L, or Balance Sheet can reuse this
exact `runReport` + `ReportTable` + `ReportFilterBar` triad with **no new API-layer code**.

---

## 4. Accounting authority boundary (architecture rule — non-negotiable)

**ERPNext is the accounting authority.** Ceylon Stack must never become an independent
accounting engine. ERPNext/Frappe remains responsible for double-entry posting, GL Entry
creation, debit/credit balancing, outstanding-amount tracking, stock valuation, tax, cost-center
accounting, fiscal-year/posting-period validation, and cancellation/reversal. Ceylon Stack's role
is to orchestrate native ERPNext documents (create/submit/cancel via the same doctypes and, where
they exist, the same helper methods ERPNext Desk itself uses — e.g. Payment Entry's
`get_payment_entry` from an invoice), expose accounting state, and consume native report output
verbatim. Any future proposal to reproduce ERPNext accounting math in Next.js is an architecture
violation, not an optimization.

---

## 5. Chart of Accounts — LIVE VERIFIED

Two Company records exist on the live site: **"Ceylon Stack"** and **"Ceylon Stack (Demo)"**,
both `default_currency: LKR`, `country: Sri Lanka`, `chart_of_accounts: Standard`,
`create_chart_of_accounts_based_on: Standard Template`. This confirms:

1. **A new ERPNext company already receives a full default CoA** — no manual setup was needed for
   either company.
2. "Ceylon Stack" has 96 Account records (27 group / 69 leaf), suffixed `- CS`, covering all five
   `root_type`s with correct `report_type` split (Balance Sheet vs. Profit and Loss). Nothing
   customized — standard ERPNext taxonomy (Debtors, Cash, Stock In Hand, fixed-asset
   subaccounts, etc.).
3. `master-data-architecture.md` (§ Financial/Organizational masters) explicitly states
   **"Chart of Accounts/Account remains explicitly out of v1 scope per `FRONTEND_GUIDE.md` §4"** —
   i.e. nobody currently claims ownership of it. `ceylon-stack-master-plan.md`'s Finance section
   implies Finance would build it. This is an **open ownership conflict** — see §"Cross-module
   ownership matrix".
4. **V1 recommendation:** read-only tree view + leaf-account create/rename only (mirrors what a
   real SME actually needs post-setup: adding a sub-ledger, not restructuring root accounts).
   Group-account restructuring, deletion, and merging are dangerous and should stay Desk-only,
   gated behind an explicit `NEEDS_VERIFICATION`-style warning if ever exposed.

Account doctype fields (SOURCE/LIVE VERIFIED via `frappe.get_meta`): `company`, `root_type`
(Asset/Liability/Income/Expense/Equity), `report_type` (Balance Sheet/Profit and Loss),
`account_type` (34-option select incl. Receivable/Payable/Bank/Cash/Stock/Tax/Round Off),
`parent_account`, `is_group`, `freeze_account`, `balance_must_be`, `account_currency`.

---

## 6. Opening balances — CODE + SOURCE VERIFIED, NEEDS_VERIFICATION for live mechanics

ERPNext's native mechanisms for opening balances are: (a) Journal Entry with `is_opening: "Yes"`
for GL account openings, (b) Sales Invoice / Purchase Invoice with `is_opening_entry` semantics or
simply dated-in-the-past invoices for AR/AP openings, (c) opening Stock Entries for inventory
value. No custom "Opening Balance" table exists or should be built. **Zero Journal Entries exist
on the live site today** (confirmed count = 0), so no opening-balance pattern has actually been
exercised yet on this tenant — classify the *mechanism* as SOURCE VERIFIED, but its *live
behavior on this tenant* as `NEEDS_VERIFICATION`. Given the empty JE ledger and the fact this is
squarely "how does a brand-new tenant get migrated in," opening balances belong with onboarding/
migration tooling (a dedicated package), not bundled into FIN-1's Chart-of-Accounts scope.

---

## 7. Journal Entry — LIVE VERIFIED (schema), zero live data

Header: `company`, `voucher_type` (18 options: Journal Entry, Bank Entry, Cash Entry, Credit
Card Entry, Debit/Credit Note, Contra Entry, Excise Entry, Write Off Entry, Opening Entry,
Depreciation Entry, Exchange Rate Revaluation, Exchange Gain Or Loss, Deferred Revenue,
Deferred Expense, Tax Withholding, ...), `accounts` (child → Journal Entry Account),
`total_debit`/`total_credit`/`difference`, `cheque_no`/`cheque_date`, `write_off_based_on`,
`is_opening`, tax-withholding fields, `auto_repeat`.

Journal Entry Account (child): `account`, `party_type`/`party`, `cost_center`, `project`,
`debit`/`credit` (+ `_in_account_currency`), `reference_type` (Sales Invoice, Purchase Invoice,
Journal Entry, Sales Order, Purchase Order, Expense Claim, Asset, Loan, Payroll Entry, Employee
Advance, Payment Entry, Bank Transaction, ...) + `reference_name`, `is_advance`.

**Zero Journal Entry records exist on the live tenant** — this is a genuinely clean-slate,
unexercised area of the ERPNext instance.

Invariant `Total Debit = Total Credit` is enforced natively by ERPNext on submit — Ceylon Stack
should mirror it client-side only as a UX convenience (disable Submit until balanced), never as
the authoritative check. ERPNext's own validation remains the final gate.

**V1 recommendation:** a minimal Journal Entry create/submit/cancel form (Bank/Cash/Journal
voucher types only to start) is the smallest safe manual-accounting workflow — everything else
in Finance V1 (AR/AP, Payment Entry) can be built without it, but a business will eventually need
manual entries for things like depreciation or corrections.

---

## 8. GL Entry — LIVE VERIFIED, confirmed READ-ONLY by design

Fields: `posting_date`, `fiscal_year`, `account`, `account_currency`, `against`, `party_type`/
`party`, `voucher_type`/`voucher_no`, `against_voucher_type`/`against_voucher`, `debit`/`credit`
(+ `_in_account_currency`/`_in_transaction_currency`/`_in_reporting_currency`), `cost_center`,
`project`, `company`, `is_opening`, `is_advance`, `is_cancelled`, `to_rename`.

**GL Entry is system-generated only.** Confirmed via live DocPerm check on the `Accounts
Manager`/`Accounts User` roles: both have `read=1, report=1` but `write=0, create=0` on GL Entry
— standard ERPNext behavior, not a gap. **Ceylon Stack must never expose generic GL Entry CRUD.**
196 GL Entry records currently exist on the live tenant; the 10 most recent are all
`voucher_type: Stock Entry` (Stock In Hand ↔ Stock Adjustment pairs), i.e. real postings already
exist from prior Inventory MVP testing — confirming GL Entry generation genuinely works on this
tenant, not just in theory.

**V1 recommendation:** GL Entry is exposed only through the native General Ledger report (§13),
never as a document type of its own.

---

## 9. Accounts Receivable — LIVE VERIFIED (chain), CODE VERIFIED (existing Sales ownership)

Chain: Customer → Sales Invoice (`debit_to` = receivable account, `income_account`/
`cost_center` per row — already documented in `docs/backend/02-sales/sales-invoice.md`) → GL
posting on submit → `outstanding_amount` → Payment Entry (`payment_type: Receive`) → allocation
via Payment Entry Reference → outstanding reduction → cancellation/reversal on Payment Entry
cancel.

Live counts: **28 Sales Invoices (21 submitted)**, **6 Payment Entries (all submitted)** already
exist on the tenant from prior Sales testing. Credit Note handling is already documented
(`docs/backend/02-sales/credit-note.md`: `is_return = 1` reverses the AR ledger posting).

**Finance must not duplicate the Sales Invoice workspace.** Finance's job here is: (a) a
Payment Entry create/list/detail flow (currently the only real gap — the dead
`/accounting/payment-entries` link), reachable both standalone and from an invoice's "Record
Payment" action using ERPNext's native `get_payment_entry(doctype, docname)` helper method
(prefer this over manually reconstructing Payment Entry field defaults), and (b) an Accounts
Receivable / ageing view consuming the native report (§14).

**V1 vs. post-V1:** partial payment, multi-invoice allocation, and basic write-off are V1
(native Payment Entry already supports all three — no custom logic needed). Advance payment
against a not-yet-created invoice, overpayment-as-credit, and detailed ageing-bucket
configuration are V1-important but can slip if scope needs cutting. Full ageing customization
(bucket sizes, per-customer terms) is post-V1.

---

## 10. Accounts Payable — LIVE VERIFIED (chain), CODE VERIFIED (existing Buying ownership)

Chain: Supplier → Purchase Invoice (`credit_to` = payable account, `expense_account`/
`cost_center` — documented in `docs/backend/03-purchasing/purchase-invoice.md`, which notes the
frontend already hardcodes these via `getBuyingDefaults()`) → GL posting on submit →
`outstanding_amount` → Payment Entry (`payment_type: Pay`) → allocation → outstanding reduction
→ cancellation/reversal.

Live counts: **8 Purchase Invoices (7 submitted)** exist from prior Buying testing. Same
architecture as AR, mirrored: Finance exposes Payment Entry (Pay direction) + an Accounts
Payable view, does not duplicate the Purchase Invoice workspace. Supplier credits and detailed
ageing classify the same as AR (post-V1 for full customization).

---

## 11. Payment Entry — LIVE VERIFIED (schema), 6 live records, single most important Finance V1 transaction type

Fields: `payment_type` (Receive/Pay/Internal Transfer), `party_type`/`party`, `paid_from`/
`paid_to` (+ `account_type`/`currency` per side), `paid_amount`/`received_amount` (+ `base_*`),
`references` (child → Payment Entry Reference), `taxes` (Advance Taxes and Charges),
`deductions` (Payment Entry Deduction), `cost_center`, `project`, `status` (Draft/Submitted/
Cancelled), `mode_of_payment`, `bank_account`/`party_bank_account`.

Payment Entry Reference (child): `reference_doctype`/`reference_name`, `due_date`, `bill_no`,
`total_amount`, `outstanding_amount`, `allocated_amount`, `exchange_rate`/
`exchange_gain_loss`, `account`.

ERPNext provides `get_payment_entry(dt, dn)` as the native helper for creating a Payment Entry
pre-populated from an invoice — **prefer this over manually reconstructing Payment Entry field
defaults** (paid_from/paid_to, currency, exchange rate all come pre-resolved).

Service account (`frontend-integration@ceylonstack.local`) already holds `Accounts User`/
`Accounts Manager`, both with full read/write/create/submit/cancel/report DocPerm on Payment
Entry — **no permission work needed to start building this.**

**This is the FIN-1/FIN-2-adjacent package with the highest leverage**: it fixes the one real
existing frontend gap (dead link), unlocks both AR and AP payment recording with one shared UI,
and touches the least new surface area since ERPNext's helper methods do most of the work.

---

## 12. Bank & Cash — LIVE VERIFIED, currently empty

Live data: **5 standard Mode of Payment records** (Cheque, Cash, Credit Card, Wire Transfer,
Bank Draft), all enabled, none customized. **Zero Bank Account records, zero Bank Transaction
records** — bank reconciliation has no live data to build or test against yet.

Bank Account fields: `account` (link to Account), `bank`, `account_type`/`account_subtype`,
`is_default`, `is_company_account`, `is_credit_card`, `iban`, `bank_account_no`,
integration-id fields. Bank Transaction fields: `date`, `status` (Pending/Settled/
Unreconciled/Reconciled/Cancelled), `bank_account`, `deposit`/`withdrawal`, `payment_entries`
(child), `party_type`/`party`, `allocated_amount`/`unallocated_amount`.

**Classification:**
- `V1 BLOCKER`: Bank Account CRUD (a business cannot record a bank-received/paid Payment Entry
  meaningfully without at least one Bank Account existing) + Mode of Payment → Account mapping
  (`Mode of Payment Account` child table) visibility, since Payment Entry's `paid_from`/`paid_to`
  defaults derive from it.
- `V1 IMPORTANT`: manual Bank Transaction entry (a simple ledger of what hit the bank).
- `POST-V1`: full bank-statement import + auto-reconciliation matching. Do not include this in
  V1 scope — it would materially expand the package for a capability most SMEs manage via their
  bank's own portal early on.

---

## 13. Tax — CODE VERIFIED (existing Sales/Buying handling), no independent engine needed

Sales Taxes and Charges / Purchase Taxes and Charges templates, item tax templates, and
inclusive/exclusive tax handling already exist inside the Sales/Buying invoice flows per their
respective `docs/backend/02-sales/` and `docs/backend/03-purchasing/` docs (not re-documented
here). Finance must not build an independent tax engine. Sri Lankan SME-specific tax
localization (VAT reporting formats, etc.) is explicitly out of scope for FIN-0 per the package
brief and should be its own later package once V1's core accounting is stable.

---

## 14. Cost Centers & dimensions — LIVE VERIFIED, minimal setup today

Live data: **2 Cost Center records** — `Ceylon Stack - CS` (group, root) and `Main - CS` (leaf).
No sub-department cost centers configured yet. Fields: `cost_center_name`,
`parent_cost_center`, `company`, `is_group`, tree fields (`lft`/`rgt`).

`master-data-architecture.md` already pre-claims Cost Center as Master-Data-owned "once built"
(alongside Company, Project, UOM) — this is consistent and should be honored: **Finance consumes
Cost Center via Master Data, does not build its own Cost Center CRUD.** Project-dimension
references appear in Journal Entry, Sales Invoice, Purchase Invoice, Payment Entry, and GL Entry
schemas (all confirmed above) but with only one non-group Cost Center existing today, Project
accounting is **post-V1** — there is no live multi-cost-center or multi-project data to justify
building filtering/reporting for it now.

---

## 15. Multi-currency — LIVE VERIFIED (config), not exercised

10 currencies enabled (GBP, AED, CHF, LKR, JPY, INR, USD, CNY, AUD, EUR). Both companies use
LKR as base currency. Account/Journal Entry Account/GL Entry/Payment Entry all carry
currency + exchange-rate fields natively (confirmed in schema dumps above), so the native
capability is present. No live evidence of a foreign-currency transaction existing yet on this
tenant. Given Sri Lankan SMEs plausibly invoice or pay in USD/other currencies, **do not
dismiss multi-currency from V1 scope on this discovery pass** — but do not build it in FIN-0.
Recommend re-assessing after FIN-1 ships, once real customer requirements are known; if no
concrete near-term need surfaces, defer full multi-currency UI (exchange-gain/loss display,
multi-currency Payment Entry reconciliation) to post-V1 while keeping the underlying ERPNext
fields available (single-currency LKR flows work today with zero extra effort either way).

---

## 16. Fiscal Year / posting controls — LIVE VERIFIED

One Fiscal Year record: `2026` (2026-01-01 to 2026-12-31), not disabled. No accounting-period
freeze/closed-period configuration found beyond ERPNext's standard `Account.freeze_account`
field (none of the 96 accounts have it set). A new customer needs at minimum one Fiscal Year
record — ERPNext does not auto-create this the way it auto-creates the CoA, so **Fiscal Year
setup belongs in the same "new tenant readiness" checklist as Company creation**, not in Finance
V1 itself (it's a one-time setup action, likely still Desk-driven or part of onboarding
tooling).

---

## 17. Sales → Finance integration — LIVE + CODE VERIFIED

Sales Invoice → GL Entries (`debit_to` receivable account, `income_account`/`cost_center` per
row) → outstanding amount → Payment Entry → allocation → outstanding reduction. Already
documented at the Sales-Invoice level in `docs/backend/02-sales/sales-invoice.md`
("posting to the General Ledger upon submission", `debit_to` = "Mandatory Receivable Account").
Cancellation reversal is native ERPNext behavior (GL Entries get `is_cancelled: 1` /
reversing entries per standard Frappe accounting) — not independently re-verified in this
package since it's already the established, unmodified ERPNext contract; flag as
`NEEDS_VERIFICATION` only if a future package needs a live-QA'd example.

---

## 18. Buying → Finance integration — LIVE + CODE VERIFIED

Purchase Invoice → GL Entries (`credit_to` payable account, `expense_account`/`cost_center`) →
tax → Payment Entry → outstanding reduction. Documented in
`docs/backend/03-purchasing/purchase-invoice.md` ("posts to the General Ledger upon
submission"). Same cancellation-reversal note as §17 applies.

---

## 19. Stock → Finance integration — LIVE VERIFIED (evidence exists, not yet documented at the Stock layer)

`docs/backend/04-inventory/stock-entry.md` currently only documents "posts to Stock Ledger," with
no GL discussion. However, the live GL Entry sample (§8) confirms perpetual-inventory postings
are actively happening (`Stock In Hand` ↔ `Stock Adjustment` pairs from Stock Entries). This is a
real gap in `04-inventory/`'s own documentation, not a Finance-owned gap — flagging it here as a
cross-reference rather than duplicating stock-valuation documentation inside this folder.

---

## 20. Manufacturing → Finance integration — CODE VERIFIED (already documented elsewhere)

`docs/backend/05-manufacturing/manufacture-completion.md` already contains a **live-verified**
example: "This Company (`Ceylon Stack`) has `enable_perpetual_inventory: 1`. GL Entries were
created correctly — debit `Stock In Hand - CS` 96,000 / credit `Stock Adjustment - CS` 96,000,"
plus a noted edge case where a zero-operations, equal-cost disposable BOM produced no GL Entries
at all, and that this instance has no distinct per-warehouse stock GL accounts configured.
Material Transfer for Manufacture's own GL impact remains an open item: `99-unverified/
unverified-behaviours.md` entry **`MFG-UNV-005`** — "the resulting GL Entry (debit/credit account
roles, whether it posts at all given this is a stock-to-stock transfer) has not been inspected."
This is Manufacturing-domain-owned and should stay there; Finance only cross-references it.

---

## 21. Native financial report architecture — LIVE VERIFIED, decision made

All six confirmed present as native Frappe **Script Reports** (`is_standard: Yes`,
`module: Accounts`, not disabled):

| Report | Reference doctype |
|---|---|
| General Ledger | GL Entry |
| Trial Balance | GL Entry |
| Profit and Loss Statement | GL Entry |
| Balance Sheet | GL Entry |
| Accounts Receivable | Sales Invoice |
| Accounts Payable | Purchase Invoice |

**Decision: Ceylon Stack calls native ERPNext report logic (option A in the FIN-0 brief),
not a Ceylon Stack read-model built from GL Entry, and not a Next.js recalculation.** This is
already the established, working pattern (`runReport` → `/api/method/frappe.desk.query_report.run`
→ `ReportTable`/`ReportFilterBar`, §3) — General Ledger / Trial Balance / P&L / Balance Sheet /
AR / AP each become a thin presentation package on top of infrastructure that already exists and
is already proven for two other Accounts-module reports. No new API-layer code is needed; only
new pages + filter wiring per report.

Report-execution permission for Script Reports is typically gated by the `roles` list on the
Report doctype record itself (not DocPerm) — the service account's `Accounts Manager` role
strongly implies access, but this specific point was not independently queried live and is
flagged `NEEDS_VERIFICATION` before a report-consuming package assumes it works.

---

## 22. General Ledger / Trial Balance / Profit & Loss / Balance Sheet

Given §21's decision, these four report packages should each ship as: filter bar (account, date
range, party, cost center, project as applicable) → `runReport` call → `ReportTable`. General
Ledger and Trial Balance share almost identical filter shapes (account/date/cost-center/party)
and could plausibly ship as one package with two report targets; P&L and Balance Sheet share a
different filter shape (period, cost center/project, no account/party filter) and could pair
similarly. See §"Recommended Finance V1 build sequence" for the actual package split
recommendation.

---

## 23. AR/AP reporting — LIVE VERIFIED (report exists), high SME value

Both Accounts Receivable and Accounts Payable are confirmed live Script Reports keyed off
Sales Invoice / Purchase Invoice respectively, with native ageing-bucket support. Given 28 Sales
Invoices and 8 Purchase Invoices already exist with real outstanding balances, this report
pairing has real data to render against today, unlike GL/Trial Balance/P&L/Balance Sheet
(which have thinner data — 196 GL Entries, all from stock postings, zero JEs). **AR/AP
visibility is judged higher V1 value than the four GL-rooted statements**, consistent with the
brief's own default expectation — recommend sequencing it earlier.

---

## 24. New-tenant readiness matrix

*"If a completely new SME tenant is provisioned today, can they begin accounting through Ceylon
Stack without ERPNext Desk?"*

| Capability | ERPNext Default? | Ceylon Stack CRUD? | Desk Required Today? | V1 Classification |
|---|---|---|---|---|
| Company | No (setup wizard) | No | Yes | Out of Finance V1 (onboarding tooling) |
| Chart of Accounts | **Yes** (auto-generated on company creation) | No | No (already works) | Read view = V1 blocker; edit = V1 important |
| Fiscal Year | No | No | Yes | Out of Finance V1 (onboarding tooling) |
| Currency | Yes (10 pre-enabled) | No | No (already works) | No gap |
| Cost Center | Partial (root + one default leaf auto-created) | No (Master-Data-owned) | Only for sub-cost-centers | No gap for V1 (single cost center is enough) |
| Bank/Cash account | No | No | Yes | **V1 blocker** |
| Mode of Payment | Yes (5 defaults) | No | No (already works) | No gap |
| Customer / Supplier | No | Yes (Master Data) | No (already works) | No gap |
| Tax configuration | No | No (Sales/Buying-owned) | Yes | Out of Finance V1 |
| Opening balances | Partial (native JE/invoice mechanisms exist) | No | Yes | Out of Finance V1 (migration/onboarding package) |

**Answer: No, not yet.** The single hardest blocker is Bank Account setup — without it, Payment
Entry (the highest-leverage V1 package) can't be meaningfully used for bank-based payments (cash
payments would work today with the existing Cash Mode of Payment). Chart of Accounts, Currency,
Cost Center, and Mode of Payment all already work out of the box.

---

## 25. Finance V1 customer profile

**In scope (SME Standard Accounting):** single company, accrual accounting, LKR base currency
with optional foreign-currency transactions (pending re-assessment per §15), standard AR/AP,
customer/supplier payments via Payment Entry, basic bank/cash (Bank Account CRUD + manual Bank
Transaction), Journal Entries for manual corrections, inventory accounting (already working,
Stock/Manufacturing-owned), Trial Balance, P&L, Balance Sheet, General Ledger, AR/AP ageing.

**Explicitly out of scope:** multi-company consolidation, intercompany transactions, budgeting,
advanced accounting dimensions beyond Cost Center, complex treasury, automated bank-statement
reconciliation, deferred revenue/expense, fixed-asset accounting, and Sri Lanka-specific tax
localization (VAT filing formats etc. — a later, dedicated package).

---

## 26. Security / permissions — LIVE VERIFIED, one real finding

The frontend's service account, **`frontend-integration@ceylonstack.local`**, already holds 42
roles including `Accounts Manager`, `Accounts User`, and — notably — **`System Manager`**, plus
nearly every other business role (Sales, Purchase, Stock, Manufacturing, HR, Projects,
Maintenance, Support, Website, Script Manager, ...), assigned directly rather than via a Role
Profile. Confirmed DocPerm: full read/write/create/submit/cancel/report on Journal Entry and
Payment Entry; read+report only (no write/create) on GL Entry, as expected.

**This is a pre-existing over-provisioning condition, not introduced by this package.** It
means: (a) Finance V1 has no permission blockers to start building against, but (b) the service
account is not scoped to least-privilege for a shared-credential architecture — a compromise of
this one account would grant System Manager access to the entire ERPNext instance, not just
Finance-adjacent data. This is flagged for Niroshan's/the security-specialist agent's awareness;
**not fixed or reduced in this package** (FIN-0 is read-only-discovery, and role changes are a
cross-cutting security decision, not Finance-scoped).

Two other findings, not verified in this pass and worth a future dedicated check: whether every
financial-statement-viewing action should require its own frontend-level authorization gate
(today, anyone who can reach the frontend can call any `runReport`-backed page, since the
service account itself has broad access — there is no per-Ceylon-Stack-user role distinction
yet), and whether financial figures could leak through unhandled error messages (the existing
error-humanization layer's Finance-specific coverage was not exercised in this pass).

---

## 27. Audit trail

No Finance-specific audit system should be built. The Observability architecture already
captures correlation IDs, Ceylon Stack user identity, and ERPNext document creation/submission/
cancellation events (per `docs/backend/14-frappe-reference/observability-logging-doctypes.md`
and the O-1/O-2/O-10A packages referenced in recent commit history) — a Finance package should
reuse it, not duplicate it. Not independently re-verified for Finance-specific voucher types in
this pass.

---

## 28. Error UX

Not exercised live in this pass (no Finance UI exists to trigger errors against). Known ERPNext
native error surfaces that a future package must plan for: unbalanced Journal Entry, invalid/
frozen account, closed posting period, missing exchange rate, invalid payment allocation
(over-allocation), insufficient outstanding amount, and cancellation blocked by downstream
documents (mirrors the same `check_if_doc_is_linked` pattern already handled for Sales Invoice →
Payment Entry). Whether the existing error-humanization layer already covers these message
shapes is `NEEDS_VERIFICATION` — recommend a short live-error-capture pass as part of FIN-2
rather than guessing.

---

## 29. Proposed navigation / information architecture (not implemented)

```
Finance
├── Overview                  (dashboard — post-V1, see brief §31)
├── Payments                  (Payment Entry list/detail/create — fixes the dead link)
├── Receivables                (AR report + linked Sales Invoices)
├── Payables                   (AP report + linked Purchase Invoices)
├── Journal Entries            (list/detail/create/submit/cancel)
├── General Ledger             (native report)
├── Trial Balance               (native report)
├── Profit & Loss               (native report)
├── Balance Sheet                (native report)
└── Bank & Cash
    ├── Bank Accounts           (CRUD)
    └── Bank Transactions        (manual entry, list)

Master Data (existing module — not duplicated here)
├── Chart of Accounts          ← open ownership question, see §30
├── Cost Centers                (already pre-claimed by Master Data)
└── (Currency/Tax remain out of scope per existing master-data-architecture.md)
```

This reconciles with the existing canonical Master Data architecture rather than re-claiming
Cost Center; it deliberately does **not** resolve Chart of Accounts ownership (see next section)
since that's a real open conflict, not a documentation oversight.

---

## 30. Cross-module ownership matrix

| Entity | Canonical owner (as of this discovery) | Finance usage |
|---|---|---|
| Customer | Master Data | Receivables |
| Supplier | Master Data | Payables |
| Cost Center | Master Data ("once built" — already pre-claimed) | Consumed by JE/Payment Entry/reports |
| Currency | **Unclaimed** — `master-data-architecture.md` doesn't mention it; master plan lists it under centralized Master Data | Consumed by Account/Payment Entry |
| **Chart of Accounts / Account** | **Unclaimed / conflicting** — `master-data-architecture.md` says "out of v1 scope"; master plan implies Finance owns it | Finance's core accounting master |
| Sales Invoice | Sales | Accounting source (read/link only) |
| Purchase Invoice | Buying | Accounting source (read/link only) |
| Stock Entry | Stock/Inventory | Accounting source (read/link only) |
| Work Order / Manufacture Stock Entry | Manufacturing | Accounting context (read/link only) |
| Payment Entry | **Finance** (new) | Owned transaction |
| Journal Entry | **Finance** (new) | Owned transaction |
| GL Entry | ERPNext/System | Read-only, via native reports only |
| Bank Account / Bank Transaction | **Finance** (new) | Owned master + transaction |
| Mode of Payment | **Finance** (new, or Master Data — same open-question pattern as Cost Center) | Consumed by Payment Entry |

**RESOLVED 2026-09-24 (package `FIN-GOV-1`), per Niroshan's explicit authorization:** Finance owns
Chart of Accounts/Account, Journal Entry, Payment Entry, Bank Account/Transaction, Cost Center,
and other accounting dimensions/financial controls. Currency stays a shared, non-duplicated
ERPNext reference — no module builds Currency CRUD; Finance owns only the accounting-specific
configuration/behavior built on top of it (account currency, exchange-rate handling, multi-currency
statements). Cost Center specifically moved from Master Data's "once built" list to Finance
ownership — a change from this document's original recommendation below, which proposed Master
Data keep it; the owner's explicit decision supersedes that proposal. `docs/master-data-
architecture.md` §11/§14 updated to match. Original recommendation, preserved for audit trail: this
section had proposed Finance own Chart of Accounts and Master Data keep Currency and Cost Center,
as a recommendation pending Niroshan's confirmation — the confirmed decision differs only on Cost
Center, which the owner assigned to Finance instead.

---

## 31. Gap register

| ID | Capability | Evidence | Customer impact | Classification | Recommended package | Dependency |
|---|---|---|---|---|---|---|
| FIN-GAP-01 | Payment Entry has no UI; existing Connections-tab link 404s | `lib/connections.ts` hrefBase, live-audited | Users can't view/record payments without Desk | V1 BLOCKER | FIN-2 | Bank Account (FIN-GAP-05) for bank-mode payments |
| FIN-GAP-02 | No Journal Entry UI | Zero live JEs, zero frontend code | Manual corrections require Desk | V1 IMPORTANT | FIN-3 | — |
| FIN-GAP-03 | No AR/AP visibility | Native reports exist, unconsumed | Can't see who owes/is owed without Desk | V1 BLOCKER | FIN-2 (paired with Payment Entry) | — |
| FIN-GAP-04 | No General Ledger/Trial Balance/P&L/Balance Sheet UI | Native reports exist, unconsumed | Can't see financial statements without Desk | V1 IMPORTANT | FIN-4 | `runReport` infra (already exists) |
| FIN-GAP-05 | Zero Bank Account records; no CRUD | Live-verified empty | Payment Entry unusable in bank mode | V1 BLOCKER | FIN-1 (bundled — see §32) | — |
| FIN-GAP-06 | Chart of Accounts has no read view | 96 live accounts, no frontend | Can't see account structure without Desk | V1 BLOCKER | FIN-1 | Ownership decision (§30) |
| FIN-GAP-07 | Chart of Accounts / Currency ownership unresolved | Conflicting docs (§30) | Blocks correct module placement | DOCUMENTATION / UX ONLY | **RESOLVED 2026-09-24 (`FIN-GOV-1`)** — Finance owns CoA/Cost Center, Currency stays shared | Niroshan decision — given |
| FIN-GAP-08 | Service account over-provisioned (System Manager + all business roles) | Live DocPerm/role audit | Security posture, not a Finance feature gap | OPTIONAL / cross-cutting | security-specialist review | Independent of Finance sequencing |
| FIN-GAP-09 | Stock Entry → GL not documented at the Stock layer | `04-inventory/stock-entry.md` silent on GL despite live GL Entries existing | Documentation gap only | DOCUMENTATION / UX ONLY | Stock-domain doc fix, not Finance | — |
| FIN-GAP-10 | Manufacturing→Finance sequencing itself unresolved in priority lock | `CLAUDE.md` Current Mission lock excludes Finance entirely | Governance, not technical | DOCUMENTATION / UX ONLY | **RESOLVED 2026-09-24 (`FIN-GOV-1`)** — Finance is now the primary stream, Manufacturing frozen at its V1 boundary | Niroshan decision — given |
| FIN-GAP-11 | Bank reconciliation / statement import | Zero Bank Transactions live | No reconciliation workflow | POST-V1 | Deferred | Bank Account must exist first |
| FIN-GAP-12 | Multi-currency transaction UI | Native fields exist, unexercised | Foreign-currency SMEs can't transact via Ceylon Stack | POST-V1 (re-assess after FIN-1) | Deferred pending evidence | — |

---

## 32. Recommended Finance V1 build sequence

The originally proposed FIN-0→FIN-9 roadmap is **merged/reordered** based on evidence gathered:
Chart of Accounts read-view and Bank Account setup are cheap and unblock everything downstream;
Payment Entry (paired with AR/AP visibility) delivers the most real business value per unit of
work since 28 Sales Invoices and 8 Purchase Invoices already sit with live outstanding balances;
the four GL-rooted statements share one infrastructure pass (already built — `runReport`) and
differ only in filter shape, so they're split into two presentation packages instead of four.

| Package | Name | Outcome | ERPNext contract | Dependencies | Risk | Exit gate |
|---|---|---|---|---|---|---|
| **FIN-1** | Accounting masters (read) | Chart of Accounts tree view (read-only), Bank Account CRUD, Mode of Payment → Account mapping visibility | `Account` (read), `Bank Account` (CRUD), `Mode of Payment` (read) | Ownership decision (§30) resolved first | LOW | User can see CoA and create a Bank Account without Desk |
| **FIN-2** | Payment Entry + AR/AP visibility | Payment Entry list/detail/create (Receive & Pay), wired from Sales/Purchase Invoice "Record Payment" via native `get_payment_entry`, fixes the dead Connections-tab link; AR + AP native-report pages | `Payment Entry`, `Payment Entry Reference`, native AR/AP Script Reports | FIN-1 (Bank Account must exist for bank-mode payments) | MEDIUM (submit/cancel + allocation logic) | User can record and view a payment against a real invoice, and see who owes/is owed, without Desk |
| **FIN-3** | Journal Entry | Minimal JE create/submit/cancel (Bank/Cash/Journal voucher types) | `Journal Entry`, `Journal Entry Account` | FIN-1 | MEDIUM | User can post and view a manual balanced entry without Desk |
| **FIN-4** | Native financial statements | General Ledger + Trial Balance (one package, shared filter shape) and Profit & Loss + Balance Sheet (one package, shared filter shape) via `runReport` | Native Script Reports (§21) | FIN-2/FIN-3 (need real postings to view meaningfully) | LOW (infra already proven) | User can view all four statements for a date range without Desk |
| **FIN-5** | Bank & Cash transactions | Manual Bank Transaction entry, list per Bank Account | `Bank Transaction` | FIN-1 | LOW | User can log a bank movement without Desk |
| **FIN-6** | Cross-module accounting verification + closure audit | Live-QA every flow above against real Sales/Buying/Manufacturing/Stock documents; resolve remaining `NEEDS_VERIFICATION` items (§6, §17, §18, §21, §28); update `99-unverified/` and `migration-status.md` | — | FIN-1..FIN-5 | LOW | Independent review + QA sign-off; docs closed out |

---

## 33. Packages removed/merged from the originally proposed roadmap

- **FIN-1 (masters) absorbs Bank Account CRUD** rather than deferring it to the old FIN-5 slot —
  Payment Entry is unusable in bank mode without it, so it must land before FIN-2, not after.
- **FIN-3 (old: AR+Payments) and FIN-4 (old: AP+Payments) are merged into one FIN-2** — AR and AP
  already share one Payment Entry architecture natively (`payment_type: Receive` vs. `Pay` on the
  same doctype); building two separate packages would just duplicate the same form twice.
- **FIN-6 (old: GL) + FIN-7 (old: Trial Balance) + FIN-8 (old: P&L/Balance Sheet) collapse into
  one FIN-4** (split internally into two presentation sub-packages by filter shape) since the
  reporting infrastructure (`runReport`) is a single, already-proven pass, not four separate
  builds.
- **Old FIN-5 (Bank & Cash) is renumbered to FIN-5** (transactions only) since its masters half
  moved into FIN-1.
- Tax is **not** a numbered FIN package at all in this recommendation — per §13, existing Sales/
  Buying tax handling is sufficient for V1, and Sri Lankan localization is deliberately deferred.

---

## 34. V1 blockers (summary)

1. **Governance**: Finance is not currently in `CLAUDE.md`'s Current Mission priority lock — see
   Control gate below.
2. **Ownership decision**: Chart of Accounts and Currency ownership (§30) must be resolved before
   FIN-1 starts, or FIN-1 risks contradicting `master-data-architecture.md`.
3. **Bank Account emptiness**: not a blocker to *building* FIN-1/FIN-2, but a blocker to a new
   tenant using Payment Entry meaningfully until at least one Bank Account is created (via FIN-1).

## 35. Deferred Finance backlog (post-V1)

Bank-statement import/auto-reconciliation (FIN-GAP-11), full multi-currency transaction UI
(FIN-GAP-12, pending re-assessment), Cash Flow report, Finance dashboard (brief §31 — needs V1
data to be meaningful first), advanced accounting dimensions beyond Cost Center, Sri Lanka tax
localization, fixed-asset accounting, budgeting, intercompany/consolidation.

---

## 36. Documentation created/updated

Created (new, untracked, does not touch any foreign WIP):
- `docs/backend/06-accounting/README.md`
- `docs/backend/06-accounting/finance-architecture.md` (this file)

**Not updated in this package**, deliberately, to avoid colliding with concurrent uncommitted
work already touching these exact files: `docs/backend/15-migration/migration-status.md`,
`docs/operations/AI_WORK_LOG.md`, `PROGRESS.md`. A future package (or Niroshan, before the next
Finance package starts) should add the Accounting row update to `migration-status.md` once the
current Master Data WIP touching that file is committed, to avoid a merge conflict with this
package's findings.

---

## Control gate

**Original finding (2026-09-24, FIN-0):** the two blockers below were identified and this gate was
set to NO pending Niroshan's explicit decisions:

1. `CLAUDE.md`'s Current Mission priority lock didn't mention Finance at all, and
   `docs/controls/DEVELOPMENT_SYSTEM_RULES.md` §3 ranked it priority 5, after Manufacturing.
2. Chart of Accounts/Currency/Cost Center ownership conflicted between `master-data-
   architecture.md` and `ceylon-stack-master-plan.md`.

**RESOLVED same day, package `FIN-GOV-1` (2026-09-24):** Niroshan explicitly authorized Finance as
the primary implementation stream (Manufacturing frozen at its V1 boundary, narrow exceptions
only) and resolved the ownership boundary (Finance owns Chart of Accounts/Account, Journal Entry,
Payment Entry, Bank Account/Transaction, Cost Center; Currency stays a shared, non-duplicated
reference). `CLAUDE.md`, `docs/controls/DEVELOPMENT_SYSTEM_RULES.md` §3/§10, `docs/controls/
FRONTEND_GUIDE.md` §4, `docs/master-data-architecture.md` §5/§11/§14, and `docs/ceylon-stack-
master-backlog.md` §5 were all updated to match — see each file's own 2026-09-24/`FIN-GOV-1`
annotation. See §30 above for the ownership resolution in full.

**SAFE TO START FIN-1: YES**

FIN-1 (Chart of Accounts read + Bank Account CRUD) is the recommended immediate next package — low
risk, unblocks FIN-2 (Bank Account is a prerequisite for bank-mode Payment Entry), touches no
existing live document type, and both governance blockers above are now resolved.

**Independent review request:** `FIN-GOV-1`'s governance/documentation changes should still get an
independent read (Codex, or CLAUDE-B under the temporary dual-Claude mode per `docs/controls/
TEMP_DUAL_CLAUDE_MODE.md` while it remains in effect) before FIN-1 implementation is treated as
unconditionally clear to start — no code was written by either FIN-0 or FIN-GOV-1, but the
sequencing/ownership decisions recorded across six files are consequential enough to warrant a
second read, per this repo's standing dual-agent review policy.

**Update (`FIN-1`, same day, 2026-09-24):** implementation proceeded same-day per Niroshan's
explicit authorization (see the CLAUDE_HANDOFF this package produced). Chart of Accounts
(read-only tree, `/accounting/chart-of-accounts`) and Bank Account (full CRUD,
`/accounting/bank-accounts`) both shipped, both live-verified against the real Hetzner tenant
(96-account tree rendered correctly with zero orphan parent references; a real test Bank Account
was created, read, updated, and deleted through the same REST calls the app's server actions make,
then fully cleaned up). See `chart-of-accounts-bank-account.md` for the full implementation
record. This package's own independent-review request above (for `FIN-GOV-1`'s governance
changes) remains open and is not satisfied by `FIN-1`'s own implementation review request — they
are two separate review asks, both still pending as of this update.
