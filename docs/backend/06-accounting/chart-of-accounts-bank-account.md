# Chart of Accounts (Account) / Bank Account — Canonical Entity Documentation

**Domain:** Finance — Accounting Masters.
**Status:** `DOCUMENTED` (package `FIN-1`, 2026-09-24).
**Frontend routes:** `/accounting/chart-of-accounts` (read-only tree), `/accounting/bank-accounts`
(list/detail/create/edit/delete).

This package re-verified FIN-0's Account/Bank Account findings live against ERPNext 16.34.2 on
2026-09-24 (same day, a few hours after FIN-0) and found them accurate, with two corrections/
additions FIN-0 did not have: (1) `Bank.autoname` is `field:bank_name`, confirming the get-or-create
mechanism below is safe; (2) `Account.mask`-equivalent doesn't exist on `Account` at all (that field
is on `Bank Account`, not `Account` — no correction needed there, just noting it wasn't confused).

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

### FIN-1 scope decision: read-only
FIN-1 exposes a read-only tree view only — no create/edit/delete/disable action anywhere on this
page. This is a deliberate scope boundary (per `finance-architecture.md` §5's V1 recommendation
and the FIN-1 package brief), not a technical limitation: Account create/edit is realistic future
work (adding a sub-ledger is a common SME need) but restructuring/deleting root or group accounts
is genuinely dangerous (breaks every downstream GL/report assumption) and should stay Desk-gated
even once account mutation is built.

### Frontend route
`/accounting/chart-of-accounts?company=<name>` — `CODE-INFERRED`
(`apps/frontend/src/app/(app)/accounting/chart-of-accounts/page.tsx`). Fetches every Account for
the selected company in one call (`limit: 200`, comfortably covering the live 96/company count)
rather than paginating — a tree can't be split across pages without breaking parent/child
continuity. Company selector only renders when more than one Company exists (both live companies
do). Rendered via `components/ChartOfAccountsTree.tsx`: server-rendered, no client JS — expand/
collapse uses the native `<details>/<summary>` element plus Tailwind's `group-open:` CSS variant
(a `[open]` attribute selector, not a JS event listener), so the tree is fully interactive before
hydration and on narrow/mobile widths without a bundled tree-widget library. No per-account detail
route exists — every field a user needs (account type, currency, account number, disabled state)
is shown inline on each row instead of behind a click-through, consistent with "read-only, not a
full document app" for this package.

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

No new `lib/erpnext.ts` functions were added — every call above uses an existing exported
function (`listDocs`/`getDoc`/`createDoc`/`updateDoc`/`deleteDoc`/`getCount`), per the FIN-1
brief's instruction to only extend that file if genuinely needed.

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
