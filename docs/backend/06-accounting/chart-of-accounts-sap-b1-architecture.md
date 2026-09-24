# Chart of Accounts — SAP Business One-Inspired Architecture (FIN-1F)

Domain status: `FIN-1F-1 IN PROGRESS` (2026-09-24) — Drawer/Title/Active/Level concept mapping +
drawer navigation only. FIN-1 and FIN-1E remain `ACCEPTED` and unchanged; see
[`chart-of-accounts-bank-account.md`](chart-of-accounts-bank-account.md) for their canonical
field/behavior documentation, which this document does not repeat.

Niroshan explicitly authorized enhancing the accepted Chart of Accounts into a SAP Business
One-inspired hierarchy UX (owner brief, 2026-09-24). Because the full brief (drawer navigation,
tree redesign, account detail inspector, contextual same/sub-level creation, search, level
filtering, responsive rework) is too broad for one reviewable package, it was split into
sub-packages:

- **FIN-1F-1** (this package): SAP B1 research, the Drawer/Title/Active/Level concept mapping
  below, and drawer navigation cards on the existing list page.
- FIN-1F-2: tree row redesign (classification/level columns, level-through-N filtering, search
  with hierarchy context).
- FIN-1F-3: account detail inspector panel, contextual action menu (⋮), Add Same-Level Account,
  Add Sub-Level Account, hierarchy-aware Parent Account selector.
- FIN-1F-4: responsive rework, `is_group` conversion-safety verification writeup, final live QA,
  release-tracker sync.

FIN-2 (Payment Entry + AR/AP visibility) remains **not authorized** by this package.

## 1. SAP Business One research findings

SAP Business One's Chart of Accounts window organizes accounts as a fixed hierarchy:

- **Drawers** — the top level (Level 1) is presented as a cabinet drawer per account category.
  SAP B1 splits these into Balance Sheet drawers (Assets, Liabilities, Equity/Capital & Reserves)
  and Profit & Loss drawers (Revenue/Turnover, Cost of Sales, Expenses/Operating Costs,
  Financing, Other Revenue & Expenses/Taxation).
- **Levels** — SAP B1's tree supports up to 10 levels: **Levels 1–3 are Title accounts** (used
  for structuring only), **Levels 4–10 are Active accounts** (postable).
- **Title accounts** summarize/roll up the balances of the accounts beneath them and cannot be
  posted to directly.
- **Active accounts** (shown in black or green in SAP B1's UI) are the postable ledger accounts
  transactions actually hit.
- **Add Sub-Level Account** creates a new account one level below the selected account, with the
  selected account becoming its parent.
- **Add Same-Level Account** creates a new account at the same level as the selected account,
  under the same parent. Both actions are only available when "Use Segmentation Accounts" is
  disabled in Company Details — Ceylon Stack has no equivalent segmentation-account concept, so
  this is not a relevant constraint here.

Sources:
- [Chart of Accounts Window — SAP Business One (help.sap.com)](https://help.sap.com/docs/SAP_BUSINESS_ONE/68a2e87fb29941b5bf959a184d9c6727/45114b7229fc4805e10000000a1553f6.html)
- [Chart of Accounts (SAP Business One) — sap-b1-blog.com](https://sap-b1-blog.com/en/glossary/chart-of-accounts-sap-business-one/)
- [Chart of Accounts in SAP Business One — Concepts, vinasystem.com](https://www.vinasystem.com/en/blogs/sap-hana/chart-of-accounts-in-sap-business-one-chart-of-accounts-concepts)
- [How to see or activate Add Same-Level/Sub-Level Account — SAP Q&A](https://answers.sap.com/questions/315885/how-to-see-or-activate-the-add-same-level-account.html)
- [Sub-accounts (SAP Business One) — sap-b1-blog.com](https://sap-b1-blog.com/en/glossary/sub-accounts-sap-business-one/)

## 2. Ceylon Stack / ERPNext mapping

| SAP B1 concept  | Ceylon Stack / ERPNext                                                              |
|-----------------|----------------------------------------------------------------------------------------|
| Drawer          | Derived presentation concept — the top ancestor (`root_type` account) of any Account's `parent_account` chain. Not a field; computed by `buildAccountPresentation()` in [`lib/accountHierarchy.ts`](../../../apps/frontend/src/lib/accountHierarchy.ts). |
| Title Account   | `Account.is_group = 1`. Presented as classification `"TITLE"`. Cannot post (ERPNext itself enforces this at GL Entry validation, not something Ceylon Stack re-implements). |
| Active Account  | `Account.is_group = 0`. Presented as classification `"ACTIVE"`. Postable ledger account. |
| Level           | Derived hierarchy depth, 1-indexed (drawer/root = Level 1), computed from `parent_account` — never persisted. `AccountPresentation.level` in `lib/accountHierarchy.ts`. |
| Parent article  | `Account.parent_account` (ERPNext's own tree field — no new field introduced). |

No new DocType fields, no `ceylon_drawer`/`ceylon_account_level`/`ceylon_title_account`/
`ceylon_active_account` records — per the FIN-1F owner brief's Data Model Rule, ERPNext's
existing `Account` tree remains the sole source of truth. `classification`, `level`, `drawer`,
and `drawerLabel` are computed in the frontend from `is_group` / `parent_account` on every page
load and are not stored anywhere.

## 3. Where Ceylon Stack intentionally differs from SAP Business One

- **No fixed level cap.** SAP B1 hard-codes Levels 1–3 as Title and 4–10 as Active, with a
  10-level ceiling. Ceylon Stack does **not** enforce a level-to-classification mapping or a
  level ceiling — classification comes directly from `is_group` at any depth, and the live tree
  is only 4 levels deep today but nothing stops a 6th or 7th level if a future ERPNext CoA needs
  it. The UX may visually optimize for Levels 1–5 (per the owner brief), but deeper structures
  stay functional.
- **No "Use Segmentation Accounts" toggle.** ERPNext has no equivalent concept, so Same-Level/
  Sub-Level creation (FIN-1F-3) will always be available where `is_group` permits it, with no
  hidden Company Details switch gating it.
- **No black/green text-color convention.** SAP B1 distinguishes Title vs. Active accounts partly
  by font color. Ceylon Stack uses its own accessible badge system (`TITLE`/`ACTIVE` text badges,
  not color alone) per Ceylon Stack's design tokens — see `DESIGN.md`.
- **"Active" terminology collision.** SAP B1's "Active Account" (a postable classification) is a
  different concept from Ceylon Stack's existing `disabled` field (an operational
  enabled/disabled status, already shipped in FIN-1E as an "Enabled"/"Disabled" badge). FIN-1F UI
  must always pair "Classification: Active/Title Account" with "Status: Enabled/Disabled" rather
  than reusing the bare word "Active" for both — this is the terminology rule to apply everywhere
  the SAP B1 badge and the FIN-1E status badge coexist.

## 4. FIN-1F-1 implementation notes

- `buildAccountPresentation(accounts)` (`lib/accountHierarchy.ts`) extends the existing FIN-1E
  `buildAccountOptions()` depth-first walk with `level` (depth + 1), `classification`
  (`is_group` → `TITLE`/`ACTIVE`), and `drawer`/`drawerLabel` (resolved by walking
  `parent_account` up to the root, memoized per account). `AccountOption`/`buildAccountOptions`
  themselves are untouched — the Parent Account selector in `AccountForm.tsx` keeps its existing
  0-indexed `depth` contract.
- `summarizeDrawers(presentation)` produces one row per drawer (`total`/`titles`/`actives`/
  `disabled` counts) purely from the already-loaded Account list — no report or GL call, per the
  owner brief's "do not add balance logic yet" and "avoid expensive report calls merely to
  decorate the page."
- `AccountDrawerNav` (new component) renders one card per drawer plus an "All Drawers" reset, as
  links carrying `?company=<company>&drawer=<root account>`. `page.tsx` filters the same
  in-memory Account array to the selected drawer's subtree before handing it to the unchanged
  `ChartOfAccountsTree` — filtering by drawer can never orphan a node, since every account in a
  subtree shares its root's drawer by construction.
- An unrecognized `?drawer=` value (e.g. a stale link after an account is deleted) falls back to
  "All Drawers" rather than showing an empty tree.

## 5. Live QA (FIN-1F-1)

`npx tsc --noEmit`, `npx eslint`, and `npx next build` all pass clean for the changed files. A
dev server was already running on the app's usual port when this package was built, and the
authenticated dashboard session behind it wasn't available to drive from this environment — so
rather than skip verification, the exact `buildAccountPresentation`/`summarizeDrawers` derivation
logic was run standalone against a live `frappe.client.get_list` fetch of `Account` for company
"Ceylon Stack" (same fields, same `company` filter, same `order_by: lft asc` the page itself
uses), bypassing only the dashboard's own login — not ERPNext:

- Fetched 96 live Account records, grouped into exactly 5 drawers: Application of Funds (Assets),
  Source of Funds (Liabilities), Equity, Income, Expenses — matching the documented root set.
- Per-drawer counts: Assets 30 (12 titles/18 active), Liabilities 20 (7/13), Equity 6 (1/5),
  Income 7 (3/4), Expenses 33 (4/29) — drawer totals sum to 96/96, no accounts dropped or
  double-counted.
- Level range 1–4 (matches the documented tree depth); every root resolves to `level = 1` and
  `drawer = own name`; every account's `classification` matches its `is_group` exactly (0
  mismatches); every resolved `drawer` value is itself a real Account name (0 orphans).
- **Still outstanding before this sub-package can be called fully verified:** clicking through the
  actual `AccountDrawerNav` UI in an authenticated browser session (drawer filter round-trip,
  "All Drawers" reset, invalid-`?drawer=` fallback) — someone with dashboard access should do a
  quick click-through before/alongside independent review.
- No Account records created or modified — this package is read/derive-only.
