# Chart of Accounts — SAP Business One-Inspired Architecture (FIN-1F)

Domain status: `FIN-1F-1 IN PROGRESS`, `FIN-1F-2 IN PROGRESS` (2026-09-24) — Drawer/Title/
Active/Control/Level concept mapping, drawer navigation, and a three-pane SAP B1-style layout.
FIN-1 and FIN-1E remain `ACCEPTED` and unchanged; see
[`chart-of-accounts-bank-account.md`](chart-of-accounts-bank-account.md) for their canonical
field/behavior documentation, which this document does not repeat.

Niroshan explicitly authorized enhancing the accepted Chart of Accounts into a SAP Business
One-inspired hierarchy UX (owner brief, 2026-09-24). Because the full brief (drawer navigation,
tree redesign, account detail inspector, contextual same/sub-level creation, search, level
filtering, responsive rework) is too broad for one reviewable package, it was split into
sub-packages. After FIN-1F-1 shipped, Niroshan reviewed a reference screenshot of SAP B1's own
Chart of Accounts window (detail panel on the left, tree in the middle with a Level control,
drawer tabs as a vertical rail on the right, Title/Active/**Control** accounts each a distinct
color) and asked for the eventual detail panel to be a **live inline edit form**, SAP B1-style,
not a read-only-plus-edit-link panel — which re-sequenced FIN-1F-2/3 below (originally FIN-1F-2
was "tree redesign + level filtering + search" and FIN-1F-3 was "detail panel + contextual
actions"; the two are now split by editing-risk instead):

- **FIN-1F-1** (shipped): SAP B1 research, the Drawer/Title/Active/Level concept mapping below,
  and drawer navigation cards on the existing list page.
- **FIN-1F-2** (this package): the three-pane layout itself — inline detail panel (left, **read
  display only** in this package), tree + Display Level control (middle), vertical drawer rail
  (right, supersedes FIN-1F-1's horizontal cards) — plus the Title/Active/**Control** three-way
  classification and its color coding.
- FIN-1F-3: converts the detail panel into a live inline edit form (SAP B1-style — the actual
  re-sequencing driver above), Add Same-Level Account, Add Sub-Level Account (which implement
  §8's account coding structure via auto-suggested `account_number` values), hierarchy-aware
  Parent Account selector.
- FIN-1F-4: search with hierarchy context, responsive rework, `is_group` conversion-safety
  verification writeup, final live QA, release-tracker sync.

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
- **Control Accounts** are G/L accounts that automatically consolidate Business Partner
  (Customer/Vendor) sub-ledger balances — whenever a document posts against a Business Partner,
  SAP B1 registers the journal entry against both the Business Partner's own balance and its
  linked control account. Manual journal entries are blocked against a control account; only the
  receivable/payable control accounts themselves appear in the Chart of Accounts (individual
  Business Partner balances don't).

Sources:
- [Chart of Accounts Window — SAP Business One (help.sap.com)](https://help.sap.com/docs/SAP_BUSINESS_ONE/68a2e87fb29941b5bf959a184d9c6727/45114b7229fc4805e10000000a1553f6.html)
- [Chart of Accounts (SAP Business One) — sap-b1-blog.com](https://sap-b1-blog.com/en/glossary/chart-of-accounts-sap-business-one/)
- [Chart of Accounts in SAP Business One — Concepts, vinasystem.com](https://www.vinasystem.com/en/blogs/sap-hana/chart-of-accounts-in-sap-business-one-chart-of-accounts-concepts)
- [How to see or activate Add Same-Level/Sub-Level Account — SAP Q&A](https://answers.sap.com/questions/315885/how-to-see-or-activate-the-add-same-level-account.html)
- [Sub-accounts (SAP Business One) — sap-b1-blog.com](https://sap-b1-blog.com/en/glossary/sub-accounts-sap-business-one/)
- [How to Set SAP Business One Control Account — sap-business-one-tips.com](https://www.sap-business-one-tips.com/en/how-to-defined-control-account-in-sap-business-one/)
- [How to Define a Control Account in SAP Business One — sterling-team.com](https://www.sterling-team.com/news/en/how-to-define-a-control-account-in-sap-business-one/)

## 2. Ceylon Stack / ERPNext mapping

| SAP B1 concept  | Ceylon Stack / ERPNext                                                              |
|-----------------|----------------------------------------------------------------------------------------|
| Drawer          | Derived presentation concept — the top ancestor (`root_type` account) of any Account's `parent_account` chain. Not a field; computed by `buildAccountPresentation()` in [`lib/accountHierarchy.ts`](../../../apps/frontend/src/lib/accountHierarchy.ts). |
| Title Account   | `Account.is_group = 1`. Presented as classification `"TITLE"`. Cannot post (ERPNext itself enforces this at GL Entry validation, not something Ceylon Stack re-implements). |
| Active Account  | `Account.is_group = 0` and `account_type` is **not** `Receivable`/`Payable`. Presented as classification `"ACTIVE"`. Postable ledger account. |
| Control Account | `Account.is_group = 0` and `account_type` is `Receivable` or `Payable` — the accounts ERPNext's Customer/Supplier records point to (`default_receivable_account`/`default_payable_account`) and Sales/Purchase Invoices + Payment Entries post to automatically. Presented as classification `"CONTROL"`. |
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
- **No hard posting block on Control Accounts.** SAP B1 physically blocks manual journal entries
  against a control account. ERPNext does **not** — a Journal Entry can post directly against a
  `Receivable`/`Payable` account (this is sometimes required, e.g. opening-balance entries or
  write-offs). Ceylon Stack's `"CONTROL"` badge is informational/presentational only; it does not
  gate Journal Entry (FIN-3, unbuilt) posting in any way. Documenting this now so a future FIN-3
  package doesn't assume a restriction ERPNext never enforced.
- **Control detection is heuristic, not a native ERPNext flag.** ERPNext has no `is_control`-style
  field — Ceylon Stack infers "Control Account" from `account_type ∈ {Receivable, Payable}`, the
  same two types Company/Customer/Supplier default-account fields use. A tenant that (unusually)
  assigns `Receivable`/`Payable` to an account never linked to any Business Partner would still
  show a `"CONTROL"` badge under this heuristic — live-verified on the real tenant (see §6) that
  the 3 accounts this classifies as Control are exactly the ones acting as such (Debtors,
  Creditors, Employee Advances), but this isn't a guarantee for every future ERPNext tenant.

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
  actual drawer-navigation UI in an authenticated browser session (drawer filter round-trip,
  "All Drawers" reset, invalid-`?drawer=` fallback) — someone with dashboard access should do a
  quick click-through before/alongside independent review.
- No Account records created or modified — this package is read/derive-only.

## 6. FIN-1F-2 implementation notes

- **Three-way classification.** `classify()` in `lib/accountHierarchy.ts` now returns `"TITLE"`
  (`is_group=1`) / `"CONTROL"` (`is_group=0` and `account_type` is `Receivable` or `Payable`) /
  `"ACTIVE"` (`is_group=0`, everything else) — `AccountClassification` widened from 2 to 3 values.
  `DrawerSummary` gained a `controls` count alongside `titles`/`actives`. `CLASSIFICATION_BADGE_CLASS`
  / `CLASSIFICATION_LABEL` are exported once from `lib/accountHierarchy.ts` and reused by both
  `ChartOfAccountsTree` (badge in the tree row) and `AccountDetailPanel` (badge in the panel), so
  the three colors can't drift between the two surfaces.
- **Three-pane layout** (`page.tsx`): a flex row ordered, on desktop, detail panel → tree → drawer
  rail (matching the SAP B1 reference screenshot exactly), collapsing to a single column on
  narrow viewports (rail as a horizontal scroll strip, then the tree, then the panel) — full
  responsive polish is still FIN-1F-4's scope; this is a first-pass layout, not pixel-tuned.
- **`AccountDrawerRail`** replaces FIN-1F-1's `AccountDrawerNav` (renamed/rewritten, not layered —
  the horizontal-card version was never reviewed or accepted, so replacing it outright is safe).
  Same `?drawer=` contract as before.
- **`AccountLevelControl`** — "Display Level" pills (All/1/2/3/4/5+), `?level=N` filters the same
  in-memory presentation to `level <= N`. Live-verified this can never orphan a tree node: level
  strictly increases down any parent chain, so removing every node above a level cutoff always
  leaves a complete, self-contained subtree (see §7). An account whose real children all fall
  above the cutoff renders as a leaf in the truncated view — expected "hierarchy cut off here"
  behavior per the owner brief's §21, not a bug.
- **`AccountDetailPanel`** — new left-docked inline panel. Selecting a tree row now sets
  `?account=<name>` (via `ChartOfAccountsTree`'s new `buildAccountHref` prop) instead of
  navigating to `/accounting/chart-of-accounts/[name]`; the page fetches that one account's full
  doc (`getDoc`, 404 handled the same way `[name]/page.tsx` already does) and renders it read-only
  — code, classification, level, drawer, parent, account type, currency, status. Root accounts
  get the same "protected, no edit" framing `[name]/page.tsx` already uses. The panel's **[Edit]**
  link still goes to the existing, unchanged `[name]` route — this package does not touch
  `AccountForm.tsx`, `actions.ts`, or the `[name]`/`new` routes at all. `?account=` is validated
  against the full company Account set (not the currently-filtered/visible subset) — selecting an
  account and then narrowing the drawer/level filter around it doesn't clear the selection.
- No `lib/erpnext.ts` changes; no new DocType fields; no new API calls beyond the one extra
  `getDoc` when an account is selected (same call `[name]/page.tsx` already makes for the same
  purpose).

## 7. Live QA (FIN-1F-2)

`npx tsc --noEmit`, `npx eslint`, and `npx next build` all pass clean. Same standalone-script
method as FIN-1F-1 (dashboard login unreachable from this environment) — extended to fetch
`account_type` and run the widened `classify()`/`summarizeDrawers()`/new `maxLevel()` logic
against both live companies ("Ceylon Stack" and "Ceylon Stack (Demo)"):

- Both companies: 96/96 accounts, drawer totals still reconcile exactly, `maxLevel` = 4.
- Control accounts correctly identified in both companies: **Debtors** (`Receivable`),
  **Creditors** (`Payable`), **Employee Advances** (`Payable`) — 0 with a classification that
  doesn't match their own `is_group`/`account_type`.
- Level-cutoff orphan check: filtered to `level <= 1` (5 kept), `level <= 2` (20 kept), and
  `level <= 3` (78 kept) on the real tree — 0 orphans at every cutoff (every kept node's parent,
  if one exists, was also kept).
- **Still outstanding**, same as FIN-1F-1: an authenticated browser click-through (select a tree
  row → panel populates; change Display Level → tree truncates correctly; switch drawers → panel/
  level selection resets as expected; the [Edit] link still reaches the working `[name]` form).
- No Account records created or modified.

Independent code review (same day) found no blocking issues and confirmed the level-cutoff
orphan-safety and `?account=`/`?level=`/`?drawer=` validation claims above by tracing the logic
directly rather than re-checking assertions. Two non-blocking notes were applied: the tree row's
classification badge keeps its short enum text deliberately (a comment now says why, vs. the
panel's full `CLASSIFICATION_LABEL`), and the Display Level control's max-level pill count is now
scoped to the active drawer's own subtree rather than the whole tenant (`treeMaxLevel` filters by
`validDrawer` before calling `maxLevel()`).

## 8. Account coding structure (design, not yet implemented — targets FIN-1F-3)

Niroshan asked for a SAP B1-style **account coding structure** to organize the CoA well. SAP B1's
own equivalent is **Account Segmentation**: an account code is built from up to 10 fixed-width
segments (a leading "natural account segment" identifying the type, then sub-segments per
level), configured once at Company setup and locked once the first G/L account exists — a
one-time, irreversible-after-first-use structural decision, not something to copy literally into
a live ERPNext tenant that already has 96 posted-against accounts per company.

Ceylon Stack instead adopts the **classic 4-digit block convention** (thousands/hundreds/tens/
ones per level — the same numbering style QuickBooks/Xero/Acumatica-style charts use, chosen
over SAP B1's exact segment mechanics for recognizability and because it needs no upfront
"segment width" configuration step):

| Digit position | Level | Meaning |
|---|---|---|
| Thousands (1 digit, 1–5) | Level 1 (Drawer) | `1`=Asset, `2`=Liability, `3`=Equity, `4`=Income, `5`=Expense — fixed 1 digit forever, since ERPNext's `root_type` is a permanent 5-value enum on the `Account` doctype itself, not tenant data that could grow. |
| Hundreds (1 digit, 0–9) | Level 2 | `0` = unassigned/this account stops at Level 1 scope; `1`–`9` = sibling ordinal under the drawer. |
| Tens (1 digit, 0–9) | Level 3 | Same pattern, one level down. |
| Ones (1 digit, 0–9) | Level 4 | Same pattern; the account's own `classification` (Title/Active/Control) still comes from `is_group`/`account_type` as documented in §2 — a nonzero ones digit does not by itself imply "Active." |

Example (matches the preview Niroshan approved): `1000` Assets (drawer) → `1100` Current Assets
(L2 title) → `1110` Cash and Bank (L3 title) → `1111` Main Bank (L4 active), `1112` Petty Cash (L4
active) → `1120` Accounts Receivable (L3 title) → `1121` Trade Debtors (L4 control).

**Overflow rule** (a title with more than 9 direct children at one digit position): append an
extra digit rather than colliding two accounts on the same code, e.g. a 10th child under `1100`
becomes `11010` instead of wrapping back to a used single digit. Documented now as a known edge
case for FIN-1F-3 to implement, not resolved further here since it isn't exercised until real
create traffic hits it.

### 8.1 Scope: new accounts only, no retrofit (Niroshan's explicit decision, 2026-09-24)

None of the 192 existing Account records (96 per company) have `account_number` set today (§5 of
`chart-of-accounts-bank-account.md`). Niroshan explicitly chose **not** to retrofit them — this
convention applies going forward, to accounts created after FIN-1F-3 ships Add Same-Level/
Sub-Level Account, not as a live-data migration folded into a UX package. Reasoning recorded for
future sessions: an `account_number` change routes through ERPNext's rename mechanism
(`update_account_number`, per FIN-1E), touching the account's own `name` and every GL Entry that
references it — a real accounting-data migration across the whole live tenant, which deserves its
own reviewed, QA'd package (or an explicit decision to skip it forever) if it's ever wanted, not a
silent side effect of a numbering-convention rollout.

### 8.2 Auto-suggestion algorithm (for FIN-1F-3 to implement)

Because existing accounts stay uncoded, a new account's **parent** usually has no
`account_number` either — there's no numeric base to build the child's suggested code from by
reading `parent.account_number` alone. The algorithm therefore derives a **virtual** base code for
any parent (coded or not) from the same drawer/level/sibling-position data `buildAccountPresentation()`
already computes, and never writes that virtual code back onto the (uncoded) parent:

1. Take the parent's `drawer` (already resolved) → the thousands digit (1–5) is fixed regardless
   of whether the parent itself has a real code.
2. Walk the parent's own ancestor chain (already available via `parent_account`) to determine
   which digit position (hundreds/tens/ones) the new child's own sibling-ordinal digit occupies —
   this is exactly `level` from `buildAccountPresentation`, needing no new derivation.
3. Sibling ordinal: prefer the highest **already-assigned** `account_number` among true siblings
   (children of the same parent) at that digit position, +1, if any sibling was created under
   this convention already; otherwise fall back to `(existing sibling count, coded or not) + 1` —
   i.e., a brand-new numbered sibling under an old uncoded title still gets a sensible next slot
   rather than colliding with `0` or with an uncoded sibling that will never get a real code.
4. Add Same-Level Account reuses the **parent's** own suggestion (same digit position, next
   ordinal after the selected account, not the selected account's own children).
5. Add Sub-Level Account uses the **selected account** as the new parent (one digit position
   deeper, ordinal starts at 1 unless the selected account already has children).
6. The suggested code always prefills the form field — it is never silently auto-submitted;
   the create form's existing validation (uniqueness, etc.) still governs the final save, same as
   every other field `AccountForm.tsx` already handles.

This design is deliberately buildable without touching any existing Account record — it only
ever writes `account_number` on the newly-created account itself, going through the same
`createDoc`/`update_account_number` path FIN-1E already established, with no new
`lib/erpnext.ts` surface required.
