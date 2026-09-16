# ERPNext Inventory — Phase 0 Walkthrough

Live, read-only inventory of the Hetzner ERPNext instance, per `docs/mcp-agents-plan.md` §
Phase 0. Compiled 2026-09-16 via SSH (`root@62.238.22.161`) + `docker exec frappe_docker-backend-1
bench --site <site> console`, running read-only `frappe.get_all`/`frappe.db.count` queries. No
data was created, modified, or deleted. No secret values (passwords, API key/secret contents,
private key contents) appear anywhere below.

This supersedes the "fresh install, no manufacturing master data" assumption baked into
`docs/mcp-agents-plan.md`, `.claude/agents/manufacturing-floor.md`, and `.claude/agents/mcp-dev.md`
— real (if thin) Manufacturing master data already exists on `frontend`. Those files' "Current
reality" sections should be corrected in a documentation-alignment pass; not done here since this
task is discovery-only.

## Summary

- Primary manufacturing-pilot site is `frontend` (`http://62.238.22.161:8080`), 2 companies
  (Ceylon Stack, Ceylon Stack (Demo)), both LKR / Sri Lanka.
- Manufacturing master data exists but is thin: 1 BOM, 2 Workstations, 6 Work Orders, 6 Job
  Cards, 0 Quality Inspection Templates. Enough to unblock `mcp-dev` Phase 1 tool design against
  real field/naming shapes, not enough breadth for a full vertical demo yet.
- No role/permission scoping exists anywhere on the instance — every non-Administrator System
  User (including the frontend's own service account) carries nearly the full ERPNext role
  catalog, including `System Manager`. This is the single biggest gap for any real client
  rollout or a scoped MCP client tier.
- Sri Lanka VAT setup is a partial skeleton (tax templates + GL accounts exist per company), not
  the "nothing exists" gap `docs/erpnext-full-reference.md` describes — still real work remains
  (no Tax Category, no SVAT/e-invoicing logic).
- `smart_factory` (the custom app) contains zero DocTypes — confirmed both live (`Module Def`
  "Smart Factory" has no child DocTypes) and in the local repo (`apps/smart_factory/smart_factory/`
  has only `boot.py` + CSS/JS branding hooks). All Manufacturing/OEE business logic is still
  entirely ahead.
- Administrator password status was **not re-verified this session** (no login attempt made,
  by design — see Ground Rules) — treated as still the `pwd.yml` default per the existing
  `PROGRESS.md`/`ACCESS.md` record, since changing/testing it is a "confirm before doing" action
  this task didn't have explicit approval for.

## Installed Apps

Checked via `bench --site <site> list-apps` on each of the 3 provisioned sites.

| App | Version | Branch | Where installed |
|---|---|---|---|
| `frappe` | 16.33.1 | UNVERSIONED | all sites |
| `erpnext` | 16.34.2 | UNVERSIONED | all sites |
| `smart_factory` | 0.0.1 | `main` | `frontend` only |
| `ceylon_services` | 0.0.1 | `1` | `gym-demo`, `verify-provision-test` |
| `hrms` (Frappe HR) | 16.18.1 | `version-16` | `gym-demo`, `verify-provision-test` |

`smart_factory` is branding-only today (see Existing Customizations below) — no Manufacturing/OEE
DocTypes, server scripts, or hooks beyond Desk theming exist in it, live or in the repo.

## Sites / Companies

`bench list-sites` on the container shows 3 provisioned sites (plus 2 DNS aliases for 2 of them):

- **`frontend`** — the manufacturing pilot site this walkthrough focuses on. Bare-IP alias
  `62.238.22.161` resolves here too (documented `sites/62.238.22.161 -> sites/frontend` symlink,
  per `PROGRESS.md`).
  - Companies: **Ceylon Stack** (abbr `CS`, currency LKR, country Sri Lanka) and
    **Ceylon Stack (Demo)** (abbr `CSD`, same currency/country) — two companies on one site, used
    to separate "real" test data from demo/throwaway data per earlier QA passes.
  - Fiscal Year: single record, `2026` (2026-01-01 to 2026-12-31), not disabled. No prior-year
    fiscal years exist.
  - Warehouses: 11 total — the standard 5-warehouse set (All Warehouses group, Stores, Work In
    Progress, Finished Goods, Goods In Transit) per company (×2 = 10), plus one disabled leftover
    test warehouse (`Test Frontend WH - CS`).
- **`gym-demo`** (`gym-demo.62-238-22-161.nip.io`) — service-vertical demo site (`ceylon_services`
  + `hrms`), out of scope for Manufacturing but confirmed still provisioned and app-installed
  correctly.
- **`verify-provision-test`** (`verify-provision-test.62-238-22-161.nip.io`) — **not referenced in
  `PROGRESS.md`**; a throwaway/leftover site from earlier provisioning verification work (same
  apps as `gym-demo`, one Company: "Provision Test Co"). Flagged under Risks/Gaps — worth a
  keep-or-delete decision, not acted on here (destructive, out of this task's scope).

## Modules Enabled

`Module Def` records confirm the standard ERPNext + Frappe module set is installed and active on
`frontend` — no modules have been selectively disabled. Relevant to Manufacturing: `Manufacturing`,
`Stock`, `Quality Management`, `Selling`, `Buying`, `Accounts` are all present (from `erpnext`).
`Smart Factory` appears as its own Module Def (from `smart_factory`) but currently has no DocTypes
registered under it. `Regional` (erpnext) exists as a module but — consistent with
`erpnext-full-reference.md` — carries no Sri Lanka-specific regional compliance package; India/UAE/
etc. regional logic ships in that module for other countries, not Sri Lanka.

## Users / Roles / API Access

3 System Users total on `frontend`, all enabled:

| User | Purpose | Roles |
|---|---|---|
| `Administrator` | Superuser | Full role set (all Manager/User roles) |
| `frontend-integration@ceylonstack.local` | Service account `apps/frontend` uses for all server-side ERPNext calls (per `FRONTEND_GUIDE.md`) | 43 roles — effectively the **entire** ERPNext role catalog, including `System Manager`, every `*Manager` role, `Customer`, `Supplier` |
| `erpmini4220@gmail.com` | Appears to be the real/human login (not referenced by name in `PROGRESS.md`, but role set matches a working administrator-equivalent account, not a scoped one) | 41 roles — same pattern, effectively full access |

**No role scoping exists anywhere on this instance.** All three System Users carry
`System Manager` plus nearly every domain Manager role. This matches `apps/mcp-server/README.md`'s
own "dev tier: Administrator key, no scoping" description, but the gap is broader than just the
MCP server — the frontend's own service account is just as unscoped. A real client rollout needs
role-appropriate accounts (e.g. a shop-floor supervisor should not hold `System Manager` or
`Accounts Manager`) before this goes anywhere near a paying client.

API keys: `frappe.db` confirms exactly 2 users have an API key generated — `Administrator` and
`frontend-integration@ceylonstack.local`. Only their **existence** was checked (`api_key is set`);
no key or secret value was read, printed, or logged. This matches `apps/mcp-server/.env` (existence
confirmed on the local filesystem, contents not read) and the frontend's documented service-account
auth model.

No Website Users (portal-only customer/supplier logins) exist yet — all 3 users are `System User`
type.

## Existing Master Data

Counted live via `frappe.db.count()` on `frontend`:

| DocType | Count | Notes |
|---|---|---|
| Item | 30 | Mixed set — see breakdown below |
| Item Group | 10 | Mostly retail-oriented (Groceries & Household, Electronics & Accessories, Apparel & Footwear, Demo Item Group) plus the 4 manufacturing-relevant ones (Raw Material, Products, Sub Assemblies, Consumable, Services) |
| BOM | 1 | `BOM-FG-STEEL-BRACKET-ASSY-001` — submitted, active, default |
| Workstation | 2 | `Assembly Line 1`, `Coating Station` |
| Work Order | 6 | `MFG-WO-2026-00001..006` — 1 Cancelled, 1 In Process, 2 Not Started, 1 Completed, 1 Cancelled (see naming series note below) |
| Job Card | 6 | `PO-JOB00001..00006` — Assembly + Coating operations, mostly Open, 1 Completed |
| Quality Inspection Template | **0** | None exist — real gap |
| Quality Inspection | 0 | None exist (consistent with no template existing) |
| Routing | 0 | Operations are on the one BOM directly, not via a reusable Routing |
| Production Plan | 0 | MRP/capacity-planning flow untested |
| Batch | 3 | All QA-test items (`TEST-BATCH-TEA`, `TEST-BATCH-01`), not manufacturing-flow items |
| Serial No | 10 | All from the Stock module's own QA pass, not manufacturing-flow items |
| Warehouse | 11 | See Sites/Companies above |
| Customer | 11 | From Sales module QA/demo work |
| Supplier | 5 | From Buying module QA/demo work |
| Sales Order | 31 | Mostly Sales/Stock QA-pass artifacts (cancelled test docs noted in `PROGRESS.md`) |
| Purchase Order | 14 | Same, Buying QA-pass artifacts |
| Stock Entry | 11 | Same, Stock QA-pass artifacts |
| Material Request | 4 | Same |

**Item breakdown (30 total)**: 4 true manufacturing-flow items — 1 finished good
(`FG-STEEL-BRACKET-ASSY`, "Steel Bracket Assembly") + 3 raw materials
(`RM-STEEL-SHEET-2MM`, `RM-BOLT-M6X20`, `RM-COATING-CPD`); 16 realistic Sri Lankan
retail/grocery/apparel/electronics items (`GRO-*`, `ELE-*`, `APP-*` codes — Ceylon Tea, Basmati
Rice, LED Desk Lamp, etc.) from the Sales/Stock demo passes; 10 generic `SKU001`-`SKU010` demo
items (Laptop, T-shirt, Camera, etc. — pre-existing ERPNext demo data, not something this project
created); 3 batch/serial QA-test items (`TEST-*`).

**Work Order status detail**: `MFG-WO-2026-00001` and `-00005` are Cancelled, `-00002` is In
Process, `-00003` and `-00006` are Not Started, `-00004` is Completed. All 6 target the same single
finished good (`FG-STEEL-BRACKET-ASSY`) — there is no second manufactured item to test against.
Company split: 5 on "Ceylon Stack", 1 (`-00003`) on "Ceylon Stack (Demo)".

**Job Card detail**: 2 Job Cards per non-cancelled Work Order (Assembly + Coating operations,
matching the 2 Workstations), all `docstatus=0` (Draft/Open) except `PO-JOB00001` which is
submitted and Completed.

This matches the `project_manufacturing_oee_plan` "M0 DONE" milestone referenced in prior session
memory — the master data is real, not a demo/placeholder set, just narrow (one product line).

## Existing Customizations

- **Custom Fields**: 12 exist, all on core Frappe/ERPNext doctypes (`Communication`, `Email
  Account`, `Contact`, `Address`, `UTM Campaign`, `Print Settings` ×3, `DocShare`, `DocPerm`,
  `Custom DocPerm`) — these match Frappe/ERPNext's own framework-level fields added by
  migrations/fixtures on this version, not anything authored for this project. No
  Manufacturing/Item/Work Order custom fields exist.
- **Client Scripts**: 0.
- **Server Scripts**: 0.
- **Workflows**: 0 — no document approval workflows configured anywhere.
- **Print Formats** (non-standard): 1 (`IRS 1099 Form`, for Supplier) — this is a shipped ERPNext
  print format, not something built for this project.
- **Letter Heads**: 2 (`Company Letterhead - Grey` — default, `Company Letterhead`).
- **`smart_factory` app**: `boot_session` hook (rewrites app-switcher/sidebar branding),
  `app_include_css`/`app_include_js` (Desk theming). Zero DocTypes, zero server-side business
  logic. Confirmed both live (`Module Def="Smart Factory"` has no child DocTypes) and in the local
  repo (`apps/smart_factory/smart_factory/` contains only `boot.py`, `public/css/`, `public/js/`).
- **Sri Lanka tax scaffold (partial, not "not present")**: `Sales Taxes and Charges Template`,
  `Purchase Taxes and Charges Template`, and `Item Tax Template` each have one record per company
  (`Sri Lanka Tax - CS`, `Sri Lanka Tax - CSD`), and a `VAT - CS`/`VAT - CSD` GL account exists per
  company. No `Tax Category` records exist. This is a name/account skeleton only — no evidence of
  SVAT (suspended VAT) handling, e-invoicing, or rate-tier logic; `docs/erpnext-full-reference.md`'s
  "no Sri Lanka regional pack, needs custom work" conclusion still holds, just starting from a
  small head start rather than zero.

## Manufacturing Readiness

**What's already there**: 1 finished good with 1 active BOM, 2 Workstations, a working Work
Order → Job Card chain exercised through several statuses (Not Started → In Process → Completed,
plus 2 Cancelled), correct naming series in use.

**What's genuinely missing before Manufacturing frontend/MCP work should assume "real data
exists"**:
1. **Zero Quality Inspection Templates** — the one Manufacturing master-data checklist item from
   `PLAN.md` Week 1-2 that is completely unaddressed, not just thin.
2. **Only one product line** — every Work Order/Job Card targets the same single item
   (`FG-STEEL-BRACKET-ASSY`). No second BOM, no multi-level BOM (raw material → sub-assembly →
   finished good), no alternate routing.
3. **No Routing or Production Plan records** — MRP/capacity planning is completely unexercised.
4. **No OEE-relevant fields on Job Card** — confirmed via the DocType field check implicit in
   `smart_factory` having zero DocTypes; `PLAN.md`'s planned downtime-reason fields don't exist
   yet, matching `manufacturing-floor.md`'s own stated expectation.
5. **Naming series differ from what `docs/mcp-agents-plan.md` assumed**: Work Order is
   `MFG-WO-.YYYY.-` (matches expectation), but **Job Card is `PO-JOB.#####`**, not the `JC-.YYYY.-`
   pattern the plan document guessed. Any MCP tool or frontend code that assumes a `JC-` prefix
   will not match real IDs. Item's configured naming series is `STO-ITEM-.YYYY.-`, but none of the
   30 existing Items actually follow it (all use manual/custom codes) — Item naming on this
   instance is effectively free-text, not series-driven, in practice.
6. **Manufacturing frontend remains locked** per the Current Mission priority lock — this
   walkthrough being complete removes one of its two stated unlock conditions (Phase 0 done); the
   other (Inventory MVP acceptance) already shipped 2026-09-16 per `QA_LOG.md`. Whether to
   formally unlock Manufacturing frontend work is a founder decision, not made by this task.

## MCP / Agent Readiness

- `apps/mcp-server` exists and works at the **dev tier**: `ping`, `list_doctypes`,
  `get_doctype_fields`, `list_documents` — 4 generic, read-only, unscoped tools, verified
  end-to-end against `frontend` per `apps/mcp-server/README.md`. `apps/mcp-server/.env` exists on
  the local filesystem (existence confirmed via `ls`, contents not read) holding the Administrator
  API key.
- Per `docs/mcp-agents-plan.md` and `.claude/agents/mcp-dev.md`, any business-specific tool (Work
  Order, Job Card, BOM, Item, downtime, create/update actions) was explicitly gated behind this
  Phase 0 walkthrough producing `docs/erp-inventory.md`. **That gate is now cleared** — this file
  is the ground-truth schema/naming reference `mcp-dev` needs (see naming series note above,
  especially the Job Card prefix correction).
- Client-scoped tier (Phase 2b) remains correctly deferred — no real client role exists yet to
  design permission scoping against, and this walkthrough confirms there's no role-scoping
  precedent anywhere on the instance to build from yet either (see Users/Roles above).
- 15 project subagents exist under `.claude/agents/` (`devops`, 6 roster agents, 9 development/
  implementation agents including this one). `manufacturing-floor.md` and `mcp-dev.md`'s "Current
  reality" sections both still describe a "no manufacturing master data exists" baseline that this
  walkthrough shows is now partially outdated — worth a documentation-alignment correction pass
  (not performed here — out of scope for a read-only discovery task).

## Risks / Gaps

1. **No permission scoping anywhere** — every non-Administrator account (including the frontend's
   own service account) holds nearly the full role catalog, including `System Manager`. This is
   the single largest blocker to any real client engagement, not just to a client-facing MCP tier.
2. **Administrator password** — not re-verified this session (no login attempted, by design); the
   existing `PROGRESS.md`/`ACCESS.md` record of "still the `pwd.yml` default" stands until someone
   explicitly confirms and changes it.
3. **Zero Quality Inspection Templates** — blocks any Quality module demo/testing entirely.
4. **Single-product-line Manufacturing data** — not broad enough to give the apparel/agro/etc.
   roster agents anything vertical-specific to reason about; today's data is generically
   "steel bracket assembly," not tied to any of the playbook's named industries.
5. **Sri Lanka VAT is a name/account skeleton, not real compliance logic** — don't treat the
   existing `Sri Lanka Tax - CS/CSD` templates as "the VAT gap is closed."
6. **Undocumented site** `verify-provision-test` (company "Provision Test Co") exists on the
   server with no record in `PROGRESS.md` — likely a leftover from earlier HR-portfolio
   provisioning verification work. Flagged for a keep/delete decision; not deleted here (out of
   this task's read-only scope).
7. **Naming series mismatch** — `docs/mcp-agents-plan.md` guessed `JC-.YYYY.-` for Job Card; the
   real live series is `PO-JOB.#####`. Anything built against the guessed format will break against
   real IDs.
8. **`smart_factory`'s presence on the `frontend` (nginx) container is a manual `docker cp` +
   symlink, not baked into an image** — this is a pre-existing, already-documented gap in
   `PROGRESS.md`, not newly discovered here, and was not re-verified in this pass (only
   `backend`'s `list-apps` was checked).
9. **`docs/ceylon-stack-documentation.html`'s "AI Agents (MCP)" roadmap card** (§14) contains the
   sentence "gated behind a full walkthrough of the live ERPNext instance (**not yet run**)" —
   that clause is now stale as of this task. The section's overall status label (`Planned`) is
   still accurate (the tool/agent roster itself isn't built), so per this task's instructions the
   file was left untouched; the stale sentence is a small text correction for a future
   documentation-alignment/`release-tracker` pass, not a status-label change.

## Recommended Next Package

**Primary**: a narrow `erp-functional-consultant` master-data package — **create a Quality
Inspection Template for `FG-STEEL-BRACKET-ASSY`** (the one existing finished good), the single
fully-missing item from the Manufacturing master-data checklist. Small, single-doctype, no
frontend/DocType risk, closes the most concrete gap this walkthrough found.

**Also now unblocked, founder's call which to prioritize next**: `mcp-dev` can begin Phase 1
(business-specific read tools — Work Order/Job Card/BOM/Item lookups) using this document as the
schema/naming reference, per `docs/mcp-agents-plan.md`'s own sequencing. Keep it to the "read/
reporting" tool group only per that plan's phasing, and correct the Job Card naming-series
assumption noted above before wiring any tool to it.

Either way, per `docs/controls/AGENT_USAGE_POLICY.md` §8: one package, one session, review/QA per
that package's own closure rules — not both at once.

---

## Addendum — 2026-09-16 (later): Quality Inspection Template gap closed

The one fully-missing Manufacturing master-data item flagged above has been addressed by
a follow-up `erp-functional-consultant` package (see `PROGRESS.md`'s matching dated entry
for full detail). This addendum corrects the now-stale facts above; the rest of this
document (Phase 0 findings as of 2026-09-16) still stands as a point-in-time record and
was not rewritten.

**Corrections:**

- **Existing Master Data table, `Quality Inspection Template` row**: was `0 | None exist —
  real gap`. Now: **1** — `Steel Bracket Assembly - Final QC`, linked to
  `Item.quality_inspection_template` on `FG-STEEL-BRACKET-ASSY`. `Quality Inspection
  Parameter` (previously also 0, not separately tabled above) now has **5** records:
  `Visual Finish`, `Dimension Check (Length)`, `Hole Alignment`, `Weld/Joint Integrity`,
  `Final Pass/Fail`. `Quality Inspection` (actual inspection results) remains **0** by
  design — this package created the reusable template only, not fake pass/fail data.
- **Manufacturing Readiness, point #1** ("Zero Quality Inspection Templates — the one
  Manufacturing master-data checklist item from `PLAN.md` Week 1-2 that is completely
  unaddressed"): **resolved**. `PLAN.md` line 38 is now checked off.
- **Risks/Gaps, point #3** ("Zero Quality Inspection Templates — blocks any Quality module
  demo/testing entirely"): **resolved** — a real template with 5 realistic parameters now
  exists and is linked to the instance's one finished good, unblocking Quality module
  demo/testing for that item.

Everything else in this document (users/roles, VAT skeleton, single-product-line
limitation, naming series notes, `verify-provision-test` site, `smart_factory` app state)
is unaffected by this change and still accurate as of the original compile date.
