# Account Determination & Predefined Accounts — Canonical Reference

**Domain:** Finance — Accounting Configuration.
**Package:** `FIN-1G-A` (ERPNext discovery) + `FIN-1G-B` (canonical determination matrix), 2026-09-25.
**Status:** `DOCUMENTED` — discovery/architecture only. No frontend UI shipped by this package
(`FIN-1G-C` onward — Account Determination workspace, master-data inheritance UX, Effective
Account/"Why This Account?" explainer, configuration health check, cross-module GL verification —
remain unimplemented; see "Recommended next steps" at the end of this document).

This document answers, for every accounting role a Ceylon Stack transaction depends on (revenue,
COGS, receivable, payable, inventory, cost center, tax, manufacturing WIP/FG/operating-cost): where
does the G/L account actually come from, in what resolution order, verified against the real
ERPNext 16.34.2 Python source and live data on the Hetzner tenant — not assumed from general
ERPNext knowledge or from SAP B1/other-ERP mental models. Per `FIN-1G`'s owner brief, several of the
brief's own working assumptions turned out to be wrong once checked against this specific version;
those corrections are called out explicitly below rather than silently fixed, since they matter for
anyone building on top of this doc later.

**Accounting authority boundary (restated, non-negotiable — see `finance-architecture.md` §4):**
ERPNext is the sole accounting/posting authority. Nothing in this document, or in any future
`FIN-1G` UI built on top of it, should reproduce this resolution logic as independent Ceylon Stack
posting code. Ceylon Stack's job is to make ERPNext's own resolution *visible and explainable*,
and to write configuration to the canonical ERPNext fields identified below — never to decide,
client-side, which account a transaction should use.

## Source of truth

- **Live DocType field schema**: `Company`, `Item`, `Item Group`, `Item Default`, `Customer`,
  `Customer Group`, `Supplier`, `Supplier Group`, `Party Account`, `Warehouse`, `Sales Taxes and
  Charges Template`, `Sales Taxes and Charges`, `Item Tax Template`, `Mode of Payment`, `Mode of
  Payment Account`, `Work Order`, `BOM` — queried live via the `ceylon-stack` MCP server
  (`get_doctype_fields`, backed by `frappe.get_meta`) against the real Hetzner tenant, 2026-09-25 —
  `VERIFIED`.
- **Live resolution-order source code**: read directly off the live container
  (`root@62.238.22.161`, `frappe_docker-backend-1`, `/home/frappe/frappe-bench/apps/erpnext/`) —
  `VERIFIED`, exact file:line citations inline throughout. Gathered by a dedicated devops
  discovery pass, 2026-09-25.
- **Live config/data counts**: `bench --site frontend console` (`frappe.db.count`,
  `frappe.get_cached_value`, read-only) against Company "Ceylon Stack" — `VERIFIED`, 2026-09-25.
- Two companies exist on the tenant ("Ceylon Stack", "Ceylon Stack (Demo)"); all live-data findings
  below are for "Ceylon Stack" unless noted.

---

## 1. Correction to the brief's working assumptions

The `FIN-1G` brief (§4/§6/§8) assumed Item Group, Customer Group, and Supplier Group might carry
their own direct Account fields (`Income Account`, `Expense Account`, `Receivable Account`, etc.).
**They don't.** Verified live schema shows:

- **Item Group and Item share one child-table doctype, `Item Default`** (fieldname
  `item_group_defaults` on Item Group, `item_defaults` on Item — same underlying doctype), one row
  per Company, carrying `income_account`, `expense_account`, `default_cogs_account`,
  `default_inventory_account`, `buying_cost_center`, `selling_cost_center`,
  `default_discount_account`, `default_provisional_account`, `deferred_revenue_account`,
  `deferred_expense_account`, `expenses_added_to_stock_account`/`_contra_account`,
  `purchase_expense_account`/`_contra_account`, `default_warehouse`, `default_price_list`,
  `default_supplier`. **Brand** also has this same child table (`brand_defaults`) and participates
  in the same resolution chain — the brief didn't ask about Brand, but it's a real, active tier and
  is included below.
- **Customer Group, Customer, Supplier Group, and Supplier share one child-table doctype, `Party
  Account`** (fieldname `accounts` in all four), one row per Company, carrying `account` (the
  receivable/payable account) and `advance_account`.
- **Company** is the only level with direct (non-table) Account fields — confirmed ~35 of them
  across Accounts/Stock/Manufacturing/Fixed-Asset sections (full list below).

This matters for any future UI: "does Item Group X have its own Income Account" is really "does
Item Group X have an `Item Default` row for this Company with `income_account` set" — a
per-company child-table lookup, not a simple field read.

---

## 2. Company — direct account default fields (`VERIFIED`, live schema)

Full set confirmed via live `Company` doctype metadata:

| Field | Label | Role |
|---|---|---|
| `default_receivable_account` | Default Receivable Account | AR fallback |
| `default_payable_account` | Default Payable Account | AP fallback |
| `default_income_account` | Default Income Account | Revenue fallback |
| `default_expense_account` | **"Default Cost of Goods Sold Account"** (label) | Expense/COGS fallback — genuine label/fieldname mismatch in ERPNext's own UI, worth flagging to anyone reading Desk directly |
| `default_inventory_account` | Default Inventory Account | Stock asset fallback |
| `stock_adjustment_account` | Stock Adjustment Account | Stock Entry adjustment postings |
| `stock_received_but_not_billed` | Stock Received But Not Billed | PR/PI-with-stock-update expense-side fallback (see §4) |
| `default_provisional_account` | Default Provisional Account | non-stock provisional accounting |
| `service_expense_account` | Service Expense Account | non-stock/service item expense fallback (checked before the universal Company fallback — see §4) |
| `purchase_expense_account` / `purchase_expense_contra_account` | — | gated by `Accounts Settings.book_stock_expense_gl_entries` (off by default — see §5) |
| `expenses_added_to_stock_account` / `_contra_account` | — | Item Default-overridable (see §5 correction) |
| `default_bank_account` / `default_cash_account` | — | Payment Entry defaults |
| `write_off_account`, `default_discount_account` | — | — |
| `exchange_gain_loss_account`, `unrealized_exchange_gain_loss_account` | — | — |
| `round_off_account`, `round_off_cost_center`, `round_off_for_opening` | — | — |
| `default_deferred_revenue_account`, `default_deferred_expense_account` | — | — |
| `default_advance_received_account`, `default_advance_paid_account` | — | — |
| `cost_center` | Default Cost Center | Cost Center final fallback (see §7) |
| `default_finance_book` | — | — |
| `default_wip_warehouse`, `default_fg_warehouse`, `default_scrap_warehouse` | — | Manufacturing warehouse defaults (Warehouse links, not Account links — see §8) |
| `default_operating_cost_account` | Default Operating Cost Account | BOM/Work Order operating + non-stock cost (see §8) — **no Item/Item Group override chain**, Company-only |
| `accumulated_depreciation_account`, `depreciation_expense_account`, `disposal_account`, `capital_work_in_progress_account`, `asset_received_but_not_billed` | — | Fixed Asset defaults — out of `FIN-1G` scope, listed for completeness |

**Confirmed absent** (grepped `company.json` directly): no generic "default tax account" field, no
direct "WIP Account" field (only `default_wip_warehouse`, a Warehouse link — see §9).

---

## 3. Sales revenue account (`income_account`) resolution — `VERIFIED (source)`

Order, most-specific first:

1. Item's own `Item Default` row for the transaction's company — `income_account`
2. Item Group's `Item Default` row — `income_account`
3. Brand's `Item Default` row — `income_account`
4. Whatever value already sits on the transaction line (a "don't clobber an existing entry" guard,
   not a real master-data tier — only relevant when `get_item_details` re-runs on an already-filled
   row)
5. Company `default_income_account`

Source: `erpnext/stock/get_item_details.py`, `get_default_income_account()` (steps 1-4) + a later
generic per-field fallback loop, ~line 641-650, comment: *"if default specified in item is for
another company, fetch from company"* (step 5). `item`/`item_group`/`brand` dicts are built by
`get_item_defaults()` (`item.py:1418`), `get_item_group_defaults()` (`item_group.py:87`),
`get_brand_defaults()` (`brand.py:31`) — each overlays the base doc with the one matching
`Item Default` row for the transaction's company.

---

## 4. Purchase expense account resolution — `VERIFIED (source)`, real version-specific branch

Same Item → Item Group → Brand → (existing-row guard) chain as §3, but the **Company-level
fallback field itself depends on context** — `get_item_details.py` ~line 629-639:

- Default: Company `default_expense_account`
- **Exception**: if the item `is_stock_item` **and** perpetual inventory is enabled for the company
  **and** (`doctype == "Purchase Receipt"` **or** (`doctype == "Purchase Invoice"` and
  `update_stock`)) → uses Company `stock_received_but_not_billed` instead.

So a Purchase Invoice raised against an existing Purchase Receipt (no `update_stock`) falls to
`default_expense_account`; a standalone Purchase Receipt, or a direct Purchase Invoice with
`update_stock=1`, falls to `stock_received_but_not_billed` (the liability-clearing account)
instead. This is a real, verified branch, not an assumption.

**Non-stock/service items** get an additional pre-check before the Company-level chain above even
runs: `get_item_details.py` ~line 598-599 — if `not item.is_stock_item` and expense_account is
still blank, use Company `service_expense_account` first, and only fall through to
`default_expense_account`/`stock_received_but_not_billed` if that's also blank.

---

## 5. COGS account (`default_cogs_account`) — real and used, **correction to brief's assumption**

The brief's working assumption (based on Stock Entry GL evidence from `finance-architecture.md`
§20) was that `default_cogs_account` might be vestigial. **It is not** — it's genuinely used, but
only for **Sales Invoice and Delivery Note** lines (Sales Order has no GL impact at all).
`get_default_expense_account()` branches on doctype:

1. If `doctype in ["Sales Invoice", "Delivery Note"]`: Item `default_cogs_account` → Item Group
   `default_cogs_account` → Brand `default_cogs_account` → Company `default_expense_account`. If
   any of these resolve, that value is used.
2. Otherwise (or if all of the above are blank): falls through to the generic `expense_account`
   chain from §4.

Confirmed this value is actually posted, not decorative — it lands on the line's `expense_account`
field, which `StockController.get_gl_entries()` (`stock_controller.py:754`) uses directly as the
debit side of the COGS entry, credited against the warehouse's inventory account. Only fires when
`update_stock` is set and perpetual inventory is enabled — the Stock Entry GL evidence
(`Stock In Hand`/`Stock Adjustment` pairs) documented in `finance-architecture.md` §20 is a
**different, unrelated code path** (Stock Entry, not Sales Invoice/Delivery Note COGS posting) —
the two don't contradict each other, they're just different transaction types.

**Correction to brief §20 (Inventory role list)**: `expenses_added_to_stock_account` /
`_contra_account` are **not** Company-only as the brief assumed — they're overridable on `Item
Default` too, same Item → Item Group → Brand → Company chain
(`get_expenses_added_to_stock_accounts()`, `stock_controller.py`). `stock_received_but_not_billed`
**is** genuinely Company-only (no override field exists anywhere in the schema).

A separate, gated alternate purchase-accounting mode exists: `purchase_expense_account` /
`purchase_expense_contra_account` (also Item-Default-overridable, same chain), used only when
`Accounts Settings.book_stock_expense_gl_entries` is enabled — confirmed **off** by default on this
tenant. Not part of the mainline flow; noted for completeness.

---

## 6. Customer receivable / Supplier payable account resolution — `VERIFIED (source)`

Both resolve through the same function, `erpnext/accounts/party.py:426`, `get_party_account()` —
its own docstring states the order and the live code confirms it exactly:

1. The party's own `Party Account` row (company-matched) — e.g. Customer's own row
2. The party's **group's** `Party Account` row (company-matched) — group = the party's own
   `customer_group`/`supplier_group` field. **Confirmed this inheritance is genuinely wired up in
   code**, not a dead/unused field.
3. Company `default_receivable_account` / `default_payable_account`

A non-master-data override layers on top: if the party already has posted GL Entries in a
different account currency than what steps 1-3 resolved, a currency-continuity safeguard
(`get_party_gle_currency()`/`get_party_gle_account()`, same file) overrides to whichever account
matches the existing GL currency. This can visibly change the resolved account but is a
consistency guard, not a "which master wins" rule — worth surfacing in any future "Why This
Account?" explainer as a distinct badge/reason, not folded into the Customer/Group/Company chain.

**Live finding**: zero `Party Account` rows exist for any Customer/Customer Group/Supplier/
Supplier Group on this tenant — every receivable/payable posting today resolves straight to
Company `default_receivable_account`/`default_payable_account`.

---

## 7. Cost Center resolution — `VERIFIED (source)`

`get_default_cost_center()` (`get_item_details.py:1058`):

1. `Project.cost_center`, if the transaction has a Project set (overrides everything else)
2. Context-dependent: if the transaction is selling-side (has a Customer) → Item
   `selling_cost_center` → Item Group `selling_cost_center` → Brand `selling_cost_center`; if
   buying-side (has a Supplier) → the equivalent `buying_cost_center` chain
3. Whatever is already on the transaction line (existing-row guard)
4. Validity check: if the resolved Cost Center's own `company` doesn't match the transaction's
   company, it's discarded (not a ranking step, a correctness check)
5. Company's own `cost_center` field (final fallback)

**Confirmed "pulled default, freely overwritable" behavior**: like Account fields, Cost Center is
filled onto a transaction row only when blank (`accounts_controller.py` ~1143-1146) — never
clobbers a manually-set value. A secondary safety net (~1186-1190) re-applies the document's own
header-level cost center (or the Company default) specifically for items added via Pricing
Rule/promotional schemes that bypass the normal item-lookup call.

---

## 8. Warehouse stock/inventory account resolution — `VERIFIED (source)`, two distinct code paths

**The resolution mechanism itself changes entirely** depending on Company
`enable_item_wise_inventory_account` (confirmed `0`/off on "Ceylon Stack"):

**Path A — `enable_item_wise_inventory_account = 0` (the live/default case):**
`get_warehouse_account_map()` → per-warehouse `get_warehouse_account()`
(`erpnext/stock/__init__.py:19,56`):

1. The Warehouse's own `account` field
2. The nearest ancestor Warehouse in the tree with `account` set (walks up `parent_warehouse` via
   the nested-set `lft`/`rgt` query — this is warehouse-hierarchy inheritance, **not** an Item
   default)
3. Company `default_inventory_account`
4. If still nothing, **and** the company has exactly one `Account` with `account_type="Stock"`, it
   is silently auto-used (a real gotcha worth a health-check warning — a CoA with exactly one Stock
   account gets implicit behavior nobody configured explicitly)
5. Otherwise: hard error (`frappe.throw`)

**Path B — `enable_item_wise_inventory_account = 1`:** Warehouse's `account` field is bypassed
entirely. `get_item_wise_inventory_account_map()` (`stock_controller.py:2658`), keyed by
`item_code`: Item `default_inventory_account` → Item Group's → Brand's → **hard error if none
set** (Company `default_inventory_account` is **not** consulted at all in this mode).

**Live finding**: only 1 of 6 warehouses (`Finished Goods - CS`) has its own `account` set; the
other 5 inherit Company `default_inventory_account`.

---

## 9. Manufacturing — WIP / Finished Goods / operating cost — `VERIFIED (source)`

- **No direct Company-level "WIP Account" field exists** — only `default_wip_warehouse` (a
  Warehouse link, distinct from the unrelated Fixed-Asset `capital_work_in_progress_account`).
  `Work Order.wip_warehouse`/`.fg_warehouse` default from these Company fields when not manually
  set on the Work Order (`work_order.py` ~591-595). The resulting Manufacture-type Stock Entry then
  resolves its actual GL account through the **exact same warehouse-account chain as §8** — there
  is no separate manufacturing-specific account-resolution path.
- **`default_operating_cost_account`** — genuinely used, in `bom.py`'s `add_additional_cost()`: a
  **single Company-level field with no Item/Item Group/Brand override chain**, used directly as
  the expense account for BOM operations cost and non-stock-item cost lines added to a
  Manufacture-type Stock Entry's Additional Costs (which feeds FG valuation).

**Live config gap found (not a code finding — flag for Niroshan directly)**: on "Ceylon Stack",
`default_wip_warehouse` and `default_fg_warehouse` are both currently **unset** at Company level,
while `default_operating_cost_account` (`Stock Adjustment - CS`) and `default_inventory_account`
(`Stock In Hand - CS`) are set. New Work Orders today require manually picking WIP/FG warehouses
each time, or will error — this is exactly the kind of gap the `FIN-1G-F` configuration health
check (not built in this package) should surface automatically once it exists.

---

## 10. Tax account resolution — `VERIFIED (source)`, fully template-driven

Confirmed **no** Company-level default tax account field exists at all (grepped `company.json` for
`tax_account`/`default_tax`: zero matches). Sales/Purchase Taxes and Charges Template rows each
carry their own `account_head` (required Link to Account) directly — the account is chosen per
template row, not inherited from any master.

An `Item Tax Template` (assignable at Item or Item Group level) can override the **rate** for a
given account, but **never substitutes a different account**: the item-level override map is keyed
by `account_head`, and `_get_tax_rate()` (`taxes_and_totals.py:397`) only ever looks up "does this
template row's account have a matching item-level rate override" — the account itself always comes
from the Sales/Purchase Taxes template row.

---

## 11. Determination matrix summary

| Accounting Role | Transaction | Resolution order (most-specific first) | Company fallback field | Ceylon Stack owner |
|---|---|---|---|---|
| Revenue | Sales Order/Invoice/DN line | Item → Item Group → Brand (`Item Default.income_account`) → Company | `default_income_account` | Finance / Item |
| Expense (general) | Purchase Invoice/Receipt line | Item → Item Group → Brand (`Item Default.expense_account`) → Company (field varies — see §4) | `default_expense_account` or `stock_received_but_not_billed` | Buying / Item |
| Expense (service item) | Purchase Invoice/Receipt line, non-stock item | as above, but Company `service_expense_account` checked before the general Company fallback | `service_expense_account` | Buying / Item |
| COGS | Sales Invoice / Delivery Note only | Item → Item Group → Brand (`Item Default.default_cogs_account`) → Company `default_expense_account` → (else falls to general Expense chain) | `default_expense_account` | Finance / Item |
| Receivable | Sales Invoice / Payment Entry (Receive) | Customer's own `Party Account` → Customer Group's `Party Account` → Company (+ currency-continuity override) | `default_receivable_account` | Finance |
| Payable | Purchase Invoice / Payment Entry (Pay) | Supplier's own `Party Account` → Supplier Group's `Party Account` → Company (+ currency-continuity override) | `default_payable_account` | Finance |
| Inventory / Stock Asset | Stock movement, any doctype | Path A (default): Warehouse → ancestor Warehouse → Company → (single-Stock-account auto-fallback) → error. Path B (`enable_item_wise_inventory_account=1`): Item → Item Group → Brand → error (no Company fallback) | `default_inventory_account` | Inventory |
| Expenses Added To Stock | Purchase Receipt/Invoice valuation | Item → Item Group → Brand (`Item Default`) → Company | `expenses_added_to_stock_account` | Inventory / Buying |
| Stock Received But Not Billed | PR / PI-with-`update_stock` | Company only, no override tier | `stock_received_but_not_billed` | Finance |
| Cost Center | Any transaction line | Project → (selling: Item/Item Group/Brand `selling_cost_center`; buying: `buying_cost_center`) → existing-row guard → Company | `cost_center` | Finance |
| Output/Input Tax | Sales/Purchase line | Sales/Purchase Taxes and Charges Template row `account_head` (item tax template can override rate only, never the account) | none (no Company field) | Finance |
| WIP / Finished Goods | Work Order / Manufacture Stock Entry | Work Order's own `wip_warehouse`/`fg_warehouse` (defaults from Company) → resolved via the same Warehouse account chain as Inventory above | `default_wip_warehouse`/`default_fg_warehouse` (Warehouse links, not Account links) | Manufacturing |
| Manufacturing Operating Cost | BOM operations / Work Order additional costs | Company only, no Item/Item Group/Brand override | `default_operating_cost_account` | Manufacturing |

---

## 12. NEEDS_VERIFICATION

- **Accounting-dimension interaction**: no accounting-dimension logic was found inside any of the
  resolution functions read (`get_item_details.py`, `party.py`, `stock_controller.py`'s
  account-resolution functions) — dimensions appear to be an additive/parallel GL Entry concern,
  not something that changes which *account* wins. Not chased further into the dimensions module
  itself — flag `NEEDS_VERIFICATION` if a future package needs this nailed down precisely.
- **Single-Stock-account auto-fallback** (§8, Path A step 4): not confirmed whether this has ever
  actually fired on "Ceylon Stack" (didn't count `Account` rows with `account_type="Stock"` — the
  CoA has more than one, so unlikely, but not counted). `NEEDS_VERIFICATION`.

---

## 13. Live data snapshot (Company "Ceylon Stack", 2026-09-25, `bench console` read-only)

- `Item Default` rows: **21 total**, all `parenttype="Item"` (zero Item Group-level or Brand-level
  rows exist anywhere on this tenant). Of those 21, **every single one only sets
  `default_warehouse`** — none have `income_account`, `expense_account`, `default_cogs_account`,
  `buying_cost_center`, `selling_cost_center`, or `default_inventory_account` populated. Every
  Sales/Purchase transaction today falls through the full chain to Company-level defaults for
  every account/cost-center field.
- `Party Account` rows: **0** across Customer/Customer Group/Supplier/Supplier Group combined.
- Warehouse accounts: 1 of 6 (`Finished Goods - CS`) has its own `account`; the rest inherit
  Company `default_inventory_account`.
- `enable_item_wise_inventory_account = 0`, `book_stock_expense_gl_entries = 0` (both off — the
  mainline/simpler code paths in §8/§5 are what's actually active).
- Confirmed live Company defaults: `default_income_account="Sales - CS"`,
  `default_expense_account="Cost of Goods Sold - CS"`,
  `default_inventory_account="Stock In Hand - CS"`, `default_receivable_account="Debtors - CS"`,
  `default_payable_account="Creditors - CS"`, `default_operating_cost_account="Stock Adjustment -
  CS"`, `default_wip_warehouse=None`, `default_fg_warehouse=None` (see §9 gap).

---

## 14. Recommended next steps (not built in this package)

Per the `FIN-1G` mission brief's own internal sequencing (do not skip discovery/matrix and jump
straight to UI — this package covers `FIN-1G-A`/`FIN-1G-B` only):

- `FIN-1G-C` — Company/predefined Account Determination workspace (read/edit surface for the
  Company-level fields in §2, organized by the General/Sales/Purchasing/Inventory/Manufacturing/
  Banking/Tax categories the brief proposes, adjusted to match what's verified above).
- `FIN-1G-D` — Item/Item Group/Brand and Customer/Customer Group/Supplier/Supplier Group
  inheritance UX (surface + edit `Item Default`/`Party Account` rows, using the standardized
  Account selector from §35 of the brief).
- `FIN-1G-E` — Effective Account + "Why This Account?" explainer, built directly from the verified
  resolution orders in §3-§10 above (this doc is the primary input for that explainer's logic — it
  should not be re-derived).
- `FIN-1G-F` — Configuration health check, surfacing gaps like the unset WIP/FG warehouses found in
  §9 automatically rather than requiring another live-discovery pass to find them.
- `FIN-1G-G` — Cross-module GL verification (confirm Ceylon Stack's displayed "effective account"
  actually matches what ERPNext posts, for a representative transaction in each role above).

`FIN-2` (Payment Entry + AR/AP visibility) remains separately authorized/not-yet-started and is
unaffected by this package.

---

## Control gate

All findings above are extensively source-cited (exact file:line per claim, live `bench console`
data counts) but were gathered by a single `devops` subagent pass in one session, not
cross-checked by a second independent agent/session. Per the `FIN-1G` brief's own §45/§46
requirement — mirroring `FIN-0`'s own precedent of flagging discovery/architecture findings for
independent review before being treated as unconditionally settled — **independent review of this
document is requested and not yet performed.**

**SAFE TO START FIN-1G-C: PENDING** independent review of this document's resolution-order
findings (§3-§10) and the determination matrix (§11).
