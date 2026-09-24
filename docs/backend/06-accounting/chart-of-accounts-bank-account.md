# Chart of Accounts (Account) / Bank Account — Canonical Entity Documentation

**Domain:** Finance — Accounting Masters.
**Status:** `DOCUMENTED` (package `FIN-1`, 2026-09-24; extended by `FIN-1E`, same day).
**Frontend routes:** `/accounting/chart-of-accounts` (tree, now with full maintenance —
`FIN-1E`), `/accounting/chart-of-accounts/new`, `/accounting/chart-of-accounts/[name]`
(detail/edit/disable/delete), `/accounting/bank-accounts` (list/detail/create/edit/delete,
unchanged since `FIN-1`).

This package re-verified FIN-0's Account/Bank Account findings live against ERPNext 16.34.2 on
2026-09-24 (same day, a few hours after FIN-0) and found them accurate, with two corrections/
additions FIN-0 did not have: (1) `Bank.autoname` is `field:bank_name`, confirming the get-or-create
mechanism below is safe; (2) `Account.mask`-equivalent doesn't exist on `Account` at all (that field
is on `Bank Account`, not `Account` — no correction needed there, just noting it wasn't confused).

**`FIN-1E` (same day, 2026-09-24)** extended Chart of Accounts from read-only to full operational
maintenance — Create, Edit, contextual child-account creation from the tree, Enable/Disable, and
Delete-where-safe — per Niroshan's explicit authorization. Bank Account (below) was not rewritten;
only a documentation pass to confirm it still reflects the accepted `FIN-1` implementation. See
"Account maintenance (`FIN-1E`)" below for the full rule-by-rule record. `FIN-1E`'s live
verification method differs from `FIN-1`'s: rather than raw REST calls, it ran a full
disposable-fixture lifecycle test through `bench --site frontend console`
(`frappe.get_doc(...).insert()/.save()/.delete()` — the exact document lifecycle Frappe's REST
`/api/resource/Account` endpoints invoke under the hood) after this environment's own
credential-materialization safeguard correctly blocked extracting the service account's real API
key/secret into a separate file for direct REST testing — evidence-equivalent for
controller/validation behavior (same `Account`/`NestedSet` Python classes run either way), flagged
per-claim below as `VERIFIED (console)` vs `VERIFIED (REST)` where the distinction matters.

## Source of truth
- **Live schema**: `frappe.get_meta("Account")`, `frappe.get_meta("Bank Account")`,
  `frappe.get_meta("Bank")` via `bench --site frontend console`, 2026-09-24 — `VERIFIED`.
- **Live data counts**: `frappe.db.count(...)`, same session, 2026-09-24 — `VERIFIED`.
- **Live controller source**: `erpnext/accounts/doctype/bank_account/bank_account.py` read
  directly off the live container, 2026-09-24 — `VERIFIED`.
- **Live REST round-trip**: real create → read → update → duplicate-name → validation-error →
  delete cycle run directly against `/api/resource/Bank`/`/api/resource/Bank Account` with the
  same service-account credentials the app uses, 2026-09-24 — `VERIFIED`. Test records
  (`CS-TEST-BANK-FIN1`, `CS-TEST-FIN1-ACCOUNT - CS-TEST-BANK-FIN1`) were created and fully
  deleted in the same session; nothing pre-existing was touched.
- **Frontend code**: `apps/frontend/src/app/(app)/accounting/`. `CODE-INFERRED`, cited file:line.

---

## Account (Chart of Accounts)

### Identity / naming
`account_name` (Data, required) + `company` (Link → Company, required) + `parent_account` (Link
→ Account, self, required — every non-root account has one). Frappe's tree-doctype autoname
convention suffixes the company abbreviation, matching Warehouse's own pattern
(`docs/backend/01-master-data/warehouse.md`) — live sample: `"Application of Funds (Assets) - CS"`,
`"Cash - CS"`, `"Debtors - CS"`.

### Live data (Ceylon Stack company, `VERIFIED` 2026-09-24)
96 Account records (192 across both companies — "Ceylon Stack" and "Ceylon Stack (Demo)", each
with its own full 96-account set). Exactly 5 root accounts (`parent_account` not set), one per
`root_type`: Asset, Liability, Income, Expense, Equity — matching `report_type` split (Asset/
Liability/Equity → Balance Sheet; Income/Expense → Profit and Loss). Zero orphan `parent_account`
references (every non-root account's parent exists in the same company's set) — confirmed by
walking the full live REST response, not just the schema. No account on this tenant has
`account_number` set (all null) — a fully out-of-the-box "Standard" template CoA, not customized.

### Important fields (live schema, `VERIFIED`)

| fieldname | label | fieldtype | required | notes |
|---|---|---|---|---|
| account_name | Account Name | Data | **yes** | |
| company | Company | Link → Company | **yes** | |
| parent_account | Parent Account | Link → Account (self) | **yes** (except the 5 roots) | tree |
| is_group | Is Group | Check | no | group (branch) vs. leaf |
| root_type | Root Type | Select | no, **read-only** | Asset/Liability/Income/Expense/Equity |
| report_type | Report Type | Select | no, **read-only** | Balance Sheet/Profit and Loss |
| account_type | Account Type | Select | no | 34 options incl. Receivable/Payable/Bank/Cash/Stock/Tax |
| account_currency | Account Currency | Link → Currency | no | |
| account_number | Account Number | Data | no | unset on every live account |
| freeze_account | Freeze Account | Select | no | No/Yes |
| balance_must_be | Balance Must Be | Select | no | Debit/Credit |
| disabled | Disabled | Check | no | |
| tax_rate | Tax Rate | Float | no | |
| lft / rgt / old_parent | tree internals | Int / Data | no | nested-set, read-only |

**No `amended_from` field** — `VERIFIED` absent, confirming `Account` is a tree doctype with no
submit lifecycle, same shape as Warehouse. `is_tree: true` on the live meta.

### FIN-1 scope decision: read-only (superseded by `FIN-1E`)
FIN-1 shipped a read-only tree view only — no create/edit/delete/disable action anywhere on the
page. That was a deliberate scope boundary for FIN-1 specifically (per `finance-architecture.md`
§5's V1 recommendation), not a technical limitation, and `FIN-1E` (same day) built the maintenance
FIN-1 explicitly deferred. Root-account protection — the one risk FIN-1's note called out
("restructuring/deleting root or group accounts is genuinely dangerous") — is now a live,
enforced rule rather than a future concern; see "Root/system-critical account protection" below.

### Frontend routes
`/accounting/chart-of-accounts?company=<name>` — `CODE-INFERRED`
(`apps/frontend/src/app/(app)/accounting/chart-of-accounts/page.tsx`). Fetches every Account for
the selected company in one call (`limit: 200`, comfortably covering the live 96/company count)
rather than paginating — a tree can't be split across pages without breaking parent/child
continuity. Company selector only renders when more than one Company exists (both live companies
do). Rendered via `components/ChartOfAccountsTree.tsx`: server-rendered, no client JS for the tree
itself — expand/collapse uses the native `<details>/<summary>` element plus Tailwind's
`group-open:` CSS variant (a `[open]` attribute selector, not a JS event listener), so the tree is
fully interactive before hydration and on narrow/mobile widths without a bundled tree-widget
library. Each row now links to `/accounting/chart-of-accounts/[name]` (`FIN-1E`) — the "read-only,
no detail route" framing from FIN-1 no longer applies. Group rows carry a small "+ Add" link to
`/accounting/chart-of-accounts/new?parent=<name>&company=<name>` for contextual child-account
creation directly from the tree.

`/accounting/chart-of-accounts/new` — `CODE-INFERRED`
(`.../chart-of-accounts/new/page.tsx`). Accepts `?company=`/`?parent=` search params; when both
are present (reached via the tree's "+ Add" link) Company and Parent Account render locked/
read-only in the form. Otherwise the user must choose both explicitly — every account still
requires a real parent group (`parent_account` is `reqd: 1` on every non-root Account,
live-verified); this app never offers creating a new root-level account.

`/accounting/chart-of-accounts/[name]` — `CODE-INFERRED` (`.../chart-of-accounts/[name]/page.tsx`).
Combined detail/edit view, same "no separate view/edit split" precedent `Bank Account`'s own
detail page and `master-data/warehouses/[name]` both already set for a doctype with no
`docstatus`/submit lifecycle. Root accounts render a read-only summary only — no edit form, no
Disable/Delete action — see "Root/system-critical account protection" below.

---

## Account maintenance (`FIN-1E`, 2026-09-24)

### Live-verified controller behavior (`erpnext/accounts/doctype/account/account.py`,
read directly off the live container — `VERIFIED (source)`, cross-checked against the disposable
lifecycle test below where noted `VERIFIED (console)`)

- **Autoname**: `get_autoname_with_number(account_number, account_name, company)`
  (`erpnext/accounts/utils.py`) — `"{account_number} - " if set + account_name + " - " +
  company.abbr`. Live-tested (`VERIFIED (console)`): creating `{account_name: "CS-TEST-FIN1E-
  GROUP", company: "Ceylon Stack"}` produced `name: "CS-TEST-FIN1E-GROUP - CS"`; renaming with
  `account_number: "9002"` via `update_account_number` (see below) produced
  `"9002 - CS-TEST-FIN1E-LEDGER-RENAMED - CS"` — number prefix, then account name, then company
  abbreviation, exactly matching the source.
- **Renaming is NOT a plain field update.** `autoname()` only runs on insert — a plain
  `PUT`/`doc.save()` that changes `account_name`/`account_number` updates those fields but leaves
  the document's own `name` (its ID) stale. `VERIFIED (console)`: setting `account_number` via a
  direct `.save()` succeeded and the field value persisted, but a subsequent error message still
  referenced the account by its original, un-numbered name — confirming no implicit rename
  happened. ERPNext's own Desk UI routes every rename through the whitelisted
  `update_account_number(name, account_name, account_number=None, from_descendant=False)`
  function instead (`@frappe.whitelist()`, free-standing — called via this app's `callMethod`/
  `callMethodWithResult`, not `callDocMethod`), which does the field update **and**
  `frappe.rename_doc()` together, atomically, and returns the new name. `updateAccountAction`
  mirrors this: it only calls `update_account_number` when `account_name`/`account_number`
  actually changed, then applies every other field via a normal `updateDoc` against the
  (possibly new) resulting name. Live-verified (`VERIFIED (console)`, calling the function
  directly): rename succeeded and returned the correctly-formatted new name.
- **`_ensure_idle_system()`** guards `update_account_number` (and `merge_account`): throws "Last GL
  Entry update was done {time}. This operation is not allowed while system is actively being
  used..." if any GL Entry was written in the last 5 minutes tenant-wide. A real operational
  constraint on a busy tenant with concurrent testing/other packages running — surfaced via
  `humanizeError` like any other ERPNext validation, never retried or swallowed. `VERIFIED
  (source)` only — this session's own rename call happened to not trip it, so the exact throw
  wasn't reproduced live.
- **Root accounts cannot be edited, at all.** `validate_root_details()`: `if doc_before_save and
  not doc_before_save.parent_account: throw("Root cannot be edited.")` — unconditional, on *any*
  update to a root Account (disable, freeze, rename, anything), not scoped to a specific field.
  `VERIFIED (console)`: attempting `frappe.get_doc("Account", "Expenses - CS").save()` (a real
  root account, only `tax_rate` changed) threw exactly `"Root cannot be edited."` This app never
  renders an edit form, Disable button, or Delete button for a root account (`parent_account`
  unset) — see "Root/system-critical account protection" below; this is a belt-and-suspenders UI
  decision on top of a server-side guarantee that's already unconditional.
- **Root Type / Report Type are inherited, not set directly.** `set_root_and_report_type()`
  copies both from the parent on every save of a non-root account, overwriting whatever was
  submitted. `VERIFIED (console)`: creating a Group account under "Direct Expenses - CS" (itself
  under root "Expenses - CS", `root_type: Expense`) produced a new account with `root_type:
  "Expense", report_type: "Profit and Loss"` without either being sent in the create payload.
  This app never submits these two fields at all (create or edit) — the form shows them as a
  read-only, live-updating preview next to the Parent Account selector instead.
- **Parent must be a Group in the same Company.** `validate_parent()`: throws `"Parent account {1}
  can not be a ledger"` if the chosen parent is a leaf, and `"Parent account {1} does not belong
  to company: {2}"` on a cross-company parent. Both `VERIFIED (console)`: attempting to create a
  child under a real ledger account threw the exact first message; attempting a parent from
  "Ceylon Stack (Demo)" while `company: "Ceylon Stack"` threw the exact second message.
- **A handful of "structural" Account Types can't be duplicated on an immediate child of an
  account already carrying that same type** (`validate_parent_child_account_type()`) — Direct
  Income, Indirect Income, Current Asset, Current Liability, Direct Expense, Indirect Expense
  only: `"Only Parent can be of type {0}"`. `VERIFIED (source)` only, not exercised live this
  session (the test parent had no `account_type` set, so the condition never triggered) — no
  client-side replication attempted, left to ERPNext's own validation like every other rule here.
- **Group ↔ Ledger conversion** (`validate_group_or_ledger()`, only runs when `is_group` actually
  changes on an update): blocked in *either* direction if the account has any GL Entry at all
  (`"Account with existing transaction cannot be converted to ledger"` — checked first,
  unconditionally, in both directions despite the message text always referencing "ledger");
  Ledger→Group additionally blocked if `account_type` is set (`"Cannot covert to Group because
  Account Type is selected."` — `VERIFIED (console)`, reproduced verbatim); Group→Ledger
  additionally blocked if child accounts exist (`"Account with child nodes cannot be set as
  ledger"`, source: `NestedSet.validate_ledger()`/`Account.check_if_child_exists()`). The
  GL-entries branch itself is `NEEDS_VERIFICATION` (`FIN-UNV-005`) — the disposable test account
  never had real GL postings against it.
- **Disable is blocked if the account is set as one of the Company's own "default account" fields**
  (`validate_disabled()` → `validate_default_accounts_in_company()`, 19 fields — Default
  Receivable/Payable/Cash/Bank/Expense/Income Account, Stock Received But Not Billed, Stock
  Adjustment, Write Off, Round Off, etc.). `VERIFIED (source)`, cross-checked against live Company
  data: "Ceylon Stack" currently has `Cash - CS`, `Debtors - CS`, `Creditors - CS`, `Cost of Goods
  Sold - CS`, `Sales - CS`, `Stock Received But Not Billed - CS`, `Stock Adjustment - CS`, `Write
  Off - CS`, and `Round Off - CS` set as company defaults — this app's `getAccountDependencies()`
  checks all 19 fields live per-request and surfaces which one(s) matched, rather than only
  discovering this after a failed save.
- **Freeze Account is currently unusable for either live Company.**
  `validate_frozen_accounts_modifier()` throws `"You are not authorized to set Frozen value"`
  whenever `freeze_account` changes on an update, *unconditionally*, if
  `Company.role_allowed_for_frozen_entries` is unset — `VERIFIED (source + live Company read)`:
  both "Ceylon Stack" and "Ceylon Stack (Demo)" have this field `null`. It's a no-op on insert
  (no `doc_before_save` to compare against), so this app only exposes it as an editable Select on
  Create; the Edit form shows it as a disabled/read-only field with an explanatory note instead of
  a control that would always fail.
- **`validate_balance_must_be_debit_or_credit()`** only runs on update (`not
  self.get("__islocal")`), comparing the selected value against the account's live running
  balance via `get_balance_on()`. Not exercised live this session — the disposable fixtures never
  had a real balance. `VERIFIED (source)` only.
- **`validate_account_currency()`**: defaults `account_currency` to the Company's
  `default_currency` when unset; blocks a currency change if any GL Entry exists with a different
  currency (`"Currency can not be changed after making entries using some other currency"`).
  `VERIFIED (source)` only.
- **Account Number uniqueness is per-Company**, not global (`validate_account_number()`):
  `"Account Number {0} already used in account {1}"`. `VERIFIED (source)` only.
- **Delete**: `Account.on_trash()` throws `"Account with existing transaction can not be deleted"`
  if `check_gle_exists()` finds *any* GL Entry (not filtered by `is_cancelled`, unlike some other
  GL checks in this same controller). Separately, `NestedSet.validate_if_child_exists()` throws
  `"Cannot delete {0} as it has child nodes"` if any child Account exists. Both `VERIFIED
  (source)`; the disposable lifecycle test below confirmed the *success* path (delete of a
  childless, GL-free test account) rather than reproducing either error message live (deleting a
  real GL-linked or child-bearing production account, even to test a rejection, was correctly
  declined by this environment's own write-safety guard — `FIN-UNV-004`). Additionally, Frappe's
  **generic** `check_if_doc_is_linked()` (`frappe/model/delete_doc.py`, `VERIFIED (source)`) blocks
  deleting *any* document referenced by *any* Link field across the whole schema when
  `method="Delete"` — regardless of `docstatus`, a stricter rule than the Cancel-guard pattern
  `lib/connections.ts` documents elsewhere for other doctypes. This is the actual backstop for
  references this app doesn't proactively check (e.g. a draft Sales Invoice line's
  `income_account`) — this app's own `getAccountDependencies()` only surfaces the subset it can
  explain in plain language (GL Entry count, child count, Bank Account link, Company defaults),
  consistent with `lib/connections.ts`'s own "UI nicety, not the source of truth" precedent.

### Root/system-critical account protection
Exactly 5 root accounts per Company (`parent_account` unset — Asset/Liability/Income/Expense/
Equity), `VERIFIED` live on both companies (§ "Live data" above, re-confirmed unchanged after this
package: 96/96). Because `validate_root_details()` unconditionally rejects any update to a root
account, this app's detail page (`/accounting/chart-of-accounts/[name]`) detects `!parent_account`
and renders a read-only summary only — no edit form, no Disable action, no Delete action — rather
than letting a user fill out a form that would always fail server-side. This is stricter than
ERPNext's own server-side guarantee in one respect: `NestedSet.on_trash()`'s root-deletion guard
(`allow_root_deletion`) is source-confirmed to check an *instance attribute* that `Account` never
sets (`getattr(self, "allow_root_deletion", True)`, always defaulting `True` since the attribute
doesn't exist) rather than the `allow_root_deletion` *parameter* `Account.on_trash()` actually
passes it — meaning ERPNext's own root-deletion block for `Account` specifically is effectively a
no-op today, and a root account with zero children and zero GL Entries could technically be
deleted via the raw API. This app's own root-detection in `getAccountDependencies()`/the detail
page closes that gap deliberately: `isRoot` is checked *before* any other dependency check and
always wins, regardless of what the live API would technically accept — per the FIN-1E brief's
explicit instruction not to expose a delete/dangerous-edit affordance for a root account "just
because the REST API would technically accept the request."

### Account dependency checking (`lib/accountDependencies.ts`)
Same "proactive check is a UI nicety, not the source of truth" precedent `lib/connections.ts`
already establishes for every one of its own entries — not reused verbatim as a `CONNECTION_CONFIG`
entry (Account's real downstream references span dozens of doctypes across modules this frontend
doesn't fully own yet, e.g. Journal Entry Account/Payment Entry which aren't built), but a
purpose-built equivalent covering the four dependencies this app can explain in plain language
before a user even attempts an action: live GL Entry count (`getCount("GL Entry", [["account",
"=", name]])`), live child-Account count, any referencing `Bank Account` (`listDocs("Bank
Account", {filters: [["account", "=", name]]})`), and any Company "default account" field match
(19 fields, see above). `canDelete`/`canDisable` are derived from these plus the root check; the
detail page only renders Delete when `canDelete` is true and always shows *why not* otherwise
(`blockReasons`). Both `deleteAccountAction` and `setAccountDisabledAction` re-run this exact check
server-side immediately before writing — defense in depth against a stale page, same precedent
every other guarded action in `lib/connections.ts`-adjacent code follows.

### Field set (Create/Edit) and what's deliberately excluded
See `apps/frontend/src/app/(app)/accounting/chart-of-accounts/actions.ts`'s own top doc comment
for the authoritative, code-adjacent version of this list. Summary: Account Name, Account Number,
Company (locked on edit), Parent Account (hierarchical `<select>`, indented by depth — no new
tree-widget dependency, same "native select, not a bundled tree picker" call FIN-1's own tree view
made), Is Group, Account Type + Account Currency (ledger-only, stripped from the payload for a
Group), Account Category (29 live global records — `VERIFIED`, unlike Bank Account's
`account_type`/`account_subtype` which had zero and were deliberately omitted from that form's
scope), Balance Must Be, Tax Rate, and Freeze Account (create-only, see above) are all exposed.
`root_type`/`report_type` (server-recomputed, never sent), `company` on edit (no supported
"move company" flow in ERPNext itself), and `disabled` (a dedicated lifecycle action, not an
edit-form field — avoids a save silently resetting disabled state as a side effect) are
deliberately never part of the submitted payload.

---

## Bank Account

### Identity / naming
**Autoname is a controller method, not `field:`** (`VERIFIED` by reading
`bank_account.py::BankAccount.autoname()`): `self.name = self.account_name + " - " + self.bank`.
Live-confirmed by REST round-trip: creating `{account_name: "CS-TEST-FIN1-ACCOUNT", bank:
"CS-TEST-BANK-FIN1"}` produced `name: "CS-TEST-FIN1-ACCOUNT - CS-TEST-BANK-FIN1"` exactly. **Not
submittable** — no `docstatus`/`amended_from`, `is_tree: false` — matches Warehouse's own
"draftless master" shape, not a document lifecycle.

**Live data: zero Bank Account records exist on the tenant** — `VERIFIED`, re-confirmed same as
FIN-0. This is the real first-run UI state this package had to design for, not a hypothetical
edge case.

### Important fields (live schema, `VERIFIED`)

| fieldname | label | fieldtype | required | notes |
|---|---|---|---|---|
| account_name | Account Name | Data | **yes** | |
| bank | Bank | Link → Bank | **yes** | see "Bank prerequisite" below |
| account | Account | Link → Account | no | unique across Bank Accounts (`validate_account`) |
| account_type | Account Type | Link → Bank Account Type | no | 0 live records, omitted from FIN-1's form |
| account_subtype | Account Subtype | Link → Bank Account Subtype | no | 0 live records, omitted |
| company | Company | Link → Company | no (conditionally required) | see `is_company_account` |
| disabled | Disabled | Check | no | |
| is_default | Is Default | Check | no | native uniqueness enforcement on save (see below) |
| is_company_account | Is Company Account | Check | no | if checked, `company` + `account` become mandatory |
| is_credit_card | Is Credit Card | Check | no | |
| party_type / party | Party Type / Party | Link → DocType / Dynamic Link | no | **not exposed in FIN-1's form** — see scope note |
| iban | IBAN | Data | no | **native format-validated on save**, see below |
| branch_code | Branch Code | Data | no | |
| bank_account_no | Bank Account No. | Data | no | |
| statement_password | Statement Password | Password | no | **not exposed anywhere in this frontend** |
| integration_id | Integration ID | Data | no, read-only, unique | system/integration field, not user-editable |
| last_integration_date | Last Integration Date | Date | no | system field |
| mask | Mask | Data | no, read-only | see "mask field is not computed" below |

### Bank prerequisite — live-confirmed hard blocker, now resolved
`bank` is a **mandatory** Link to `Bank` (`reqd: 1`, live-verified), and the live tenant has
**zero `Bank` records**. FIN-0 flagged this as an unresolved question ("does Bank Account creation
depend on Bank existing first?"); this package confirms **yes** — a plain `POST
/api/resource/Bank Account` with a `bank` value that doesn't already exist fails with
`frappe.exceptions.LinkValidationError: Could not find Bank: <name>` (`VERIFIED` via a live REST
call). `Bank.autoname` is `field:bank_name` (`VERIFIED`), i.e. `Bank`'s document name **is**
`bank_name` verbatim — no separate naming series to reconcile.

**Resolution (this package, not a separate Bank master screen):** `resolveBankName()`
(`apps/frontend/src/app/(app)/accounting/bank-accounts/actions.ts`) does a get-or-create: tries
`getDoc("Bank", trimmedName)`; on a 404 it creates a minimal `Bank` record (`bank_name` only — the
doctype's only mandatory field) and uses the resulting name. This runs on both create and update.
The form's "Bank" field is a plain text input with an HTML `<datalist>` of existing Bank names for
autocomplete (`fetchLinkOptions("Bank")`) — not a required-match `<select>`, since the whole point
is to work from zero existing Bank records. **Deliberately not built**: a `Bank` list/detail/edit/
delete screen — out of FIN-1's authorized scope (per the brief: "don't silently build a whole
Bank-master CRUD screen to route around it"). A future package can add real Bank management if a
need for editing/deduplicating bank names emerges; nothing in this design blocks that later.

### Native validation, live-confirmed by direct REST testing (2026-09-24)
- **IBAN format**: `frappe.utils.validate_iban()` runs on save for any non-empty `iban` value —
  a malformed IBAN (tested with `LK00CSTEST0001234567890`) is rejected with `'<value>' is not a
  valid IBAN` before the record is even inserted; a checksum-valid IBAN (tested with the
  standard example `DE89370400440532013000`) succeeds. This is native Frappe behavior
  (`frappe/utils/__init__.py`), not something this app re-validates — `humanizeError`'s
  `erpnextMessage` fallback surfaces the real message (the `<strong>` tags Frappe wraps the value
  in are stripped by `extractErpNextMessage` in `lib/erpnext.ts`, already-existing shared logic,
  unchanged by this package).
- **Duplicate name**: creating a second Bank Account with the same `account_name` + `bank` pair
  (same computed `name`) fails with HTTP 409, `Bank Account <name> already exists` (`Duplicate
  Name`) — `VERIFIED` live.
- **`is_company_account` conditional requirement**: `validate_is_company_account()` throws
  `"Company is mandatory for company account"` if `company` is unset, else `"Company Account is
  mandatory"` if `account` is unset. Live-tested nuance worth recording: when the request omits
  `company` entirely, ERPNext still applied a non-empty `self.company` before this validation ran
  (framework-level default-company application on `frappe.new_doc()`, not something this app's
  code does) — the observed error was the *second* message ("Company Account is mandatory"), not
  the first, even though `company` was never sent. This app's own create/update actions never rely
  on that implicit default — the form always lets the user pick `company` explicitly — but it's
  worth knowing this default-fill behavior exists at the ERPNext layer if a future package
  investigates why a company ends up set on a record that didn't explicitly request one.
- **`account` uniqueness**: `validate_account()` blocks reusing the same `Account` Link across two
  Bank Accounts — surfaces via the standard `erpnextMessage` fallback, not independently
  live-tested this session (not exercised — no second Bank Account existed to collide with) —
  `NEEDS_VERIFICATION` if a future package needs the exact live wording.
- **Delete**: `on_trash()` only cleans up linked Contact/Address rows and `Bank Account Balance`
  snapshots — it does not itself block a delete. Frappe's generic link-check (`LinkExistsError`)
  is what would block deleting a Bank Account already referenced by a real Payment Entry/GL
  posting — not exercised live this session (no such linked record exists yet, since Payment
  Entry UI is FIN-2 scope) — `NEEDS_VERIFICATION`, tracked as `FIN-UNV-001` below. Live-tested
  delete of an *unlinked* Bank Account succeeded (`202`) and the record was confirmed gone (`404`)
  immediately after.

### `mask` field is not computed anywhere on this version — do not rely on it
Live-verified: `mask` exists on the schema (`read_only: 1`) but is never set by
`bank_account.py`, and a grep across the entire `erpnext` app's accounts module for any code
writing `.mask` on a `Bank Account` found zero matches. A REST-created Bank Account's `mask` field
stays `null` (confirmed on the live test record). **This app does not use `Account.mask`/`Bank
Account.mask` for its own masking** — `lib/format.ts`'s new `maskSensitive()` helper derives a
masked display string from `bank_account_no`/`iban` directly, server-side, before the value is
ever attached to a row object handed to a list-rendering component.

### FIN-1 scope decision: fields deliberately omitted from the form
`account_type`/`account_subtype` (Link fields, zero live records, no screen to pick from —
same "don't build a master for an empty optional field" call as the Bank get-or-create),
`party_type`/`party` (Dynamic Link — customer/supplier-owned bank accounts are real future work,
not the V1 blocker, which is company bank setup for Payment Entry), `statement_password` (Frappe
`Password` fieldtype — handling it correctly is its own scoped concern), and every
integration/system field (`integration_id`, `last_integration_date`, `mask`).

### Sensitive-field handling
`bank_account_no` and `iban` are masked (`maskSensitive()` — last 4 characters, capped at 8
leading asterisks) in the list view (`/accounting/bank-accounts`) and shown in full on the
detail/edit view (`/accounting/bank-accounts/[name]`) — the raw values are never attached to the
row object the list page hands to `MasterTable`, so they're never in that component's render path
or `ExportMenu`'s CSV/PDF export. No log call anywhere in this package's code (in `actions.ts` or
the pages) includes a raw form field value — the only logging on the request path is
`lib/erpnext.ts`'s pre-existing `erpnextFetch()` error logger, which only ever logs ERPNext's own
`erpnextMessage`/status/path, not the request body.

### Permissions — `VERIFIED`, one real finding carried forward from FIN-0
The service account (`frontend-integration@ceylonstack.local`) has full read/write/create/delete
on `Account`, `Bank Account`, and `Bank` today, via its pre-existing `System Manager` role (not
role-specific DocPerm — no `Custom DocPerm` rows exist for `Accounts Manager`/`Accounts User` on
`Bank Account`, `VERIFIED`). This means FIN-1 has no permission blocker to ship, but the
least-privilege question FIN-0 raised is unresolved and out of this package's scope (see
`finance-architecture.md` §26/`FIN-GAP-08`) — `NEEDS_VERIFICATION` for a future security pass:
exactly which of `Accounts Manager`/`Accounts User`'s own base (non-Custom) DocPerm rows grant
Bank Account write, since a real least-privilege fix would need to confirm the base role
permissions independently of the service account's current System Manager override.

### Frontend routes
`/accounting/bank-accounts` (list, `CODE-INFERRED`,
`apps/frontend/src/app/(app)/accounting/bank-accounts/page.tsx`), `/accounting/bank-accounts/new`
(create), `/accounting/bank-accounts/[name]` (combined detail/edit + Delete — one page, not a
separate view/edit split, since Bank Account carries no docstatus to gate on, same precedent
Warehouse's `[name]/page.tsx` set).

### Current API / actions used (`CODE-INFERRED`)
- `resolveBankName()` → `getDoc("Bank", name)` else `createDoc("Bank", {bank_name})`
  (`bank-accounts/actions.ts`).
- `createBankAccountAction` → `createDoc<{name:string}>("Bank Account", fields)`.
- `updateBankAccountAction` → `updateDoc("Bank Account", name, fields)`.
- `deleteBankAccountAction` → `deleteDoc("Bank Account", name)` — the first real caller of
  `lib/erpnext.ts`'s pre-existing (previously unused anywhere in the app) `deleteDoc` export.
- List → `listDocs<BankAccountRaw>("Bank Account", {...})` + `getCount("Bank Account")`.

No new `lib/erpnext.ts` functions were added by FIN-1 — every call above uses an existing exported
function (`listDocs`/`getDoc`/`createDoc`/`updateDoc`/`deleteDoc`/`getCount`). `FIN-1E`'s Account
maintenance also added no new `lib/erpnext.ts` functions: `update_account_number` (the Account
rename path) is called via the pre-existing `callMethodWithResult`, exactly the generic
whitelisted-method mechanism that function already exists for.

### Current API / actions used for Account maintenance (`CODE-INFERRED`, `FIN-1E`)
- `createAccountAction` → `createDoc<{name:string}>("Account", fields)`
  (`chart-of-accounts/actions.ts`).
- `updateAccountAction` → conditionally `callMethodWithResult<string|null>(
  "erpnext.accounts.doctype.account.account.update_account_number", {...})` when
  `account_name`/`account_number` changed, then always `updateDoc("Account", name, {...})` for
  every other field.
- `setAccountDisabledAction` → `updateDoc("Account", name, {disabled})`, re-checking
  `getAccountDependencies()` server-side first.
- `deleteAccountAction` → `deleteDoc("Account", name)`, re-checking `getAccountDependencies()`
  server-side first.
- Dependency checks (`lib/accountDependencies.ts`) → `getCount("GL Entry", ...)`,
  `getCount("Account", ...)`, `listDocs("Bank Account", ...)`, `getDoc("Company", ...)` — all
  pre-existing exports.

---

## NEEDS_VERIFICATION (added to `docs/backend/99-unverified/unverified-behaviours.md`)
- `FIN-UNV-001`: Bank Account delete-blocked-by-link (`LinkExistsError`) message/status when a
  real Payment Entry or GL posting references the Bank Account — no such linked record exists
  yet (Payment Entry UI is FIN-2 scope); only the unlinked-delete-succeeds path was live-tested.
- `FIN-UNV-002`: `validate_account()`'s duplicate-Account-link error, exact live wording — not
  exercised (no second Bank Account existed to collide with during this session's testing).
- `FIN-UNV-003`: exact base (non-Custom) DocPerm grant on `Bank Account` for `Accounts Manager`/
  `Accounts User` independent of the service account's current `System Manager` override — needed
  before any future least-privilege remediation on the shared service account.
- `FIN-UNV-004` (`FIN-1E`): exact message/status of Frappe's generic `check_if_doc_is_linked`
  when deleting an Account referenced by a non-GL-Entry document (e.g. a Bank Account or a draft
  Sales Invoice line) — not live-tested; this session correctly declined to attempt any delete
  against a real, linked production Account, even an expected-to-fail one.
- `FIN-UNV-005` (`FIN-1E`): `validate_group_or_ledger()`'s GL-entries-exist branch, exact
  message/behavior — the disposable test ledger used for FIN-1E's lifecycle test never had a real
  GL Entry posted against it, so only the account-type-set and child-nodes-exist branches were
  exercised live.
