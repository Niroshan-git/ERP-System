# CLAUDE.md — Smart Factory on ERPNext

This file gives any Claude session working in this project folder the full context needed to help effectively, without re-explaining the project from scratch.

## What This Project Is

A Smart Factory concept system built on top of **ERPNext/Frappe** (open-source, GPL-3.0), with the goal of eventually whitelabeling and selling it to manufacturing clients (starting with local clients in Sri Lanka).

**Product name: Ceylon Stack.** "Smart Factory on ERPNext" is still the accurate internal/technical description of the stack (see below) — Ceylon Stack is the name used in anything client- or marketing-facing (pitch deck, frontend, ERPNext Desk branding). Full approved design system: `DESIGN.md`. Dev quick-reference tokens + asset files: `docs/brand.md` / `docs/brand/`.

This file is the **master entry point** for the repo's control system. Everything binding lives in `docs/controls/`; every other doc (`PLAN.md`, `PROGRESS.md`, `QA_LOG.md`, `README.md`) is a tracking or reference doc, not a rulebook. If in doubt about process, start here.

**Long-term product/business vision:** a north-star plan (`docs/ceylon-stack-master-plan.md`) and its current-state audit (`docs/ceylon-stack-master-backlog.md`) exist as drafts in the working tree but are not yet committed to this repo, so they are not linked here. A future package that formally commits and takes ownership of those documents should restore the links in this paragraph. Neither doc is binding — `docs/controls/` and the Current Mission lock below still govern day-to-day sequencing.

## Binding Control Documents (Read First)

These five documents, all in [`docs/controls/`](docs/controls/), are **binding** for all work in this repo — this is the single source of truth for process rules; nothing outside `docs/controls/` overrides them. Every Claude session, and every subagent, must read the ones relevant to its task before doing meaningful implementation work:

1. [`docs/controls/DEVELOPMENT_SYSTEM_RULES.md`](docs/controls/DEVELOPMENT_SYSTEM_RULES.md) — architecture rules, module sequencing, quality gates, scope control
2. [`docs/controls/AGENT_OPERATING_GUIDE.md`](docs/controls/AGENT_OPERATING_GUIDE.md) — agent roles/authority, standard operating procedure, Definition of Ready
3. [`docs/controls/AGENT_USAGE_POLICY.md`](docs/controls/AGENT_USAGE_POLICY.md) — session and subagent discipline, review/QA cadence, cost control
4. [`docs/controls/FRONTEND_GUIDE.md`](docs/controls/FRONTEND_GUIDE.md) — binding ruleset for `apps/frontend` specifically (API layer, document pattern, component reuse, module build order, Definition of Done)
5. [`docs/controls/BACKEND_KNOWLEDGE_POLICY.md`](docs/controls/BACKEND_KNOWLEDGE_POLICY.md) — binding project-wide: every meaningful ERP frontend feature must leave behind a canonical field/entity/relationship/business-rule spec in `docs/backend/`, capturing the Frappe reference implementation as a blueprint for the future Ceylon Stack native backend, without blocking delivery

**They override casual user requests when there's a conflict.** A request that conflicts with any of these is not a green light to proceed anyway — stop, name the specific rule in conflict, and propose a compliant alternative. See Enforcement below.

### Dual-Agent Coordination (Claude Code + Codex)

OpenAI Codex is a second, independent engineering agent used for review only — Claude Code remains the primary implementation agent, and Codex does not add a competing policy system on top of the five documents above. Before treating a meaningful package as release-ready, see `AGENTS.md` (Codex's own entry point), [`docs/controls/AI_DUAL_AGENT_OPERATING_MODEL.md`](docs/controls/AI_DUAL_AGENT_OPERATING_MODEL.md) (separation of duties/authority boundaries), and [`docs/controls/AI_AGENT_HANDOFF_POLICY.md`](docs/controls/AI_AGENT_HANDOFF_POLICY.md) (handoff/review lifecycle). Claude records coordination state in `docs/operations/AI_WORK_LOG.md` at handoff, but never marks Codex's independent review complete on its behalf.

**TEMPORARY (2026-09-20 through 2026-09-25):** Codex independent-review capacity is unavailable. During this window only, [`docs/controls/TEMP_DUAL_CLAUDE_MODE.md`](docs/controls/TEMP_DUAL_CLAUDE_MODE.md) stands in for Codex's reviewer role using two independent Claude accounts (CLAUDE-A / CLAUDE-B) with mandatory cross-review — no account may review or accept its own package. This does not replace or relax any other binding document. Expected reversion to normal Claude→Codex governance: 2026-09-26, with a Codex reconciliation audit of everything accepted under this mode.

### Current Mission (priority lock, as of 2026-09-24)

Do not reorder without explicit approval from Niroshan.

**Updated 2026-09-24 (package `FIN-GOV-1`):** Niroshan explicitly authorized Finance as the new
primary implementation stream, superseding the module-first framing below wherever it conflicts.
Evidence/reasoning: `docs/backend/06-accounting/finance-architecture.md` (FIN-0 discovery, closed
2026-09-24) and `docs/ceylon-stack-master-backlog.md` §5 decision #1 (now resolved).

**Updated 2026-09-24 (package `FIN-1F`):** Niroshan explicitly authorized enhancing the already-
`ACCEPTED` Chart of Accounts (`FIN-1`/`FIN-1E`) into a SAP Business One-inspired hierarchy UX
(Drawer/Title Account/Active Account/Level concepts, presentation-only — no new DocType fields,
ERPNext remains canonical). This is an extension layered on top of the Finance V1 sequence below,
not a reordering of it — FIN-2 (Payment Entry + AR/AP visibility) remains **not authorized** and
FIN-1F does not unblock it. Because the full FIN-1F brief was too broad for one package, it runs
as sub-packages FIN-1F-1..4 (see `docs/backend/06-accounting/chart-of-accounts-sap-b1-architecture.md`
for the split and the SAP B1 concept mapping; `PROGRESS.md`'s `FIN-1F-1` entry for what's shipped
so far).

**Updated 2026-09-24 (package `CRM-1`):** Niroshan explicitly authorized starting the CRM stream
ahead of full Finance V1 completion — specifically `CRM-1` (Lead management: list/detail/create/
edit/status/search/filter, Lead→Opportunity and Lead→Customer conversion entry points, Contact/
Address reuse), per CRM-0's `docs/backend/16-crm/crm-architecture.md` roadmap and the `CRM-1`
mission brief. This is an explicit exception to item 4 below (which otherwise still gates CRM
behind Finance V1 foundations) and to `docs/ceylon-stack-master-backlog.md` §5 decision #2 (still
open) — it does not resolve that backlog decision or reopen CRM-2..5, and it does not change
Finance V1's priority for any session not working CRM-1. FIN-2 remains **not authorized**.

**Updated 2026-09-25 (package `CRM-2`):** Niroshan issued a dedicated `CRM-2` mission brief —
Opportunity management (list/detail/create/edit, Lead- or Customer-partied direct creation, stage/
status/probability/expected-value tracking, Mark Lost via `declare_enquiry_lost`, and the
Opportunity → Quotation handoff into the existing canonical Sales Quotation flow), per `CRM-0`'s
`docs/backend/16-crm/crm-architecture.md` roadmap and the `CRM-1` precedent for how a CRM package
gets authorized. Same exception shape as `CRM-1`'s note above — does not resolve
`docs/ceylon-stack-master-backlog.md` §5 decision #2, does not reopen `CRM-3`..`CRM-5`, and does not
change Finance V1's priority for any session not working CRM. This note was written back to this
file after the fact (implementation was already underway when the gap was caught by this package's
own `code-reviewer` pass) — see `PROGRESS.md`'s `CRM-2` entry for the full sequence; future CRM
packages should record their dated authorization note here **before** implementation starts, matching
`CRM-1`'s own precedent, not after.

**Updated 2026-09-25 (package `CRM-3`):** Niroshan issued a dedicated `CRM-3` mission brief —
Activities & Follow-ups: Call/Meeting/Follow-up/Note logging against Lead and Opportunity using only
native ERPNext mechanisms (`Communication`/`Event`/`ToDo`/`CRM Note` — no new custom doctype), a
unified per-record activity timeline, next-follow-up/overdue derivation, and a `/crm/activities`
salesperson work-queue workspace, per `CRM-0`'s `docs/backend/16-crm/crm-architecture.md` §8/§18
roadmap and the `CRM-1`/`CRM-2` precedent for how a CRM package gets authorized. Same exception shape
as `CRM-1`/`CRM-2`'s notes above — does not resolve `docs/ceylon-stack-master-backlog.md` §5 decision
#2, does not reopen or authorize `CRM-4`/`CRM-5`, and does not change Finance V1's priority for any
session not working CRM. **Same timing lapse `CRM-2`'s own note above disclosed, repeated here**: this
note was written back to this file after implementation was already underway, not before — see
`PROGRESS.md`'s `CRM-3` entry for the full sequence; the standing instruction remains that future CRM
packages record their dated authorization note here **before** implementation starts.

**Updated 2026-09-25 (package `FIN-1G`):** Niroshan explicitly authorized `FIN-1G — Account
Determination & Predefined Accounts` — the accounting configuration layer connecting Company,
Item/Item Group, Customer/Customer Group, Supplier/Supplier Group, Warehouse, and Tax to the G/L
accounts that Sales/Buying/Inventory/Manufacturing transactions post to, plus an "Effective
Account" / "Why This Account?" explanation layer. This is an extension layered on top of the
already-`ACCEPTED` Chart of Accounts (`FIN-1`/`FIN-1E`/`FIN-1F`) — same relationship FIN-1F had to
FIN-1 — not a reordering of the Finance V1 sequence below. **FIN-2 (Payment Entry + AR/AP
visibility) remains not authorized** and FIN-1G does not unblock it; FIN-1G explicitly excludes
Payment Entry, Journal Entry, AR/AP workspace, financial statements, bank reconciliation, and any
custom GL/posting engine (ERPNext stays the sole accounting authority — Ceylon Stack provides
configuration UX/visibility/explanation only, never independent posting logic). Runs as internal
sub-packages FIN-1G-A (ERPNext discovery) through FIN-1G-G (cross-module GL verification), per the
mission brief's own sequencing rule ("do not skip A/B and jump directly to UI") — see
`docs/backend/06-accounting/account-determination.md` once FIN-1G-A/B land.

**Updated 2026-09-25 (package `FIN-1G-C`):** FIN-1G-A/B discovery (commit `a64a6c0`) and its
independent review (commit `bd860bf`) are both closed — gate result `SAFE TO START FIN-1G-C: YES`
per `docs/backend/06-accounting/account-determination.md` §"Control gate". Niroshan's session brief
for FIN-1G-C was scoped far wider than that gate's own definition of the package (it bundled in
inheritance UX, the Effective Account/"Why This Account?" explainer, the configuration-health
engine, Inventory Mode A/B, the Fixed Asset branch, Receivable/Payable posting-dependent handling,
Tax UX, a reusable account selector, deep links, and a setup-assistant foundation — i.e. the scope
`account-determination.md` §14 splits across `FIN-1G-C` through `FIN-1G-G`). Flagged as a conflict
with `AGENT_USAGE_POLICY.md` §8 (same shape as its own "build the whole module" invalid-package
example) and confirmed with Niroshan before implementation started: this session builds **only**
the narrow `FIN-1G-C` scope `account-determination.md` §14 defines — the Company-level Account
Determination workspace (navigation foundation + read/edit for the Company fields in §2, organized
by domain, with a derived, non-hardcoded Simple Setup summary). `FIN-1G-D` (Item/Item
Group/Brand/Customer/Supplier inheritance UX), `FIN-1G-E` (Effective Account + "Why This
Account?"), `FIN-1G-F` (configuration health engine), and `FIN-1G-G` (cross-module GL
verification) remain separate, not-yet-authorized future packages — this note does not authorize
them. **FIN-2 remains not authorized** and FIN-1G-C does not unblock it.

**Updated 2026-09-25 (package `LP-0`/`LP-1`):** Niroshan issued a dedicated Layout, Print &
Document Output Engine V1 mission brief and explicitly confirmed — when this note's absence was
flagged before any implementation started — that it runs as a **new exception stream, the same
shape as `CRM-1`/`CRM-2`/`CRM-3`**: authorized to proceed now, alongside Finance V1 and the CRM
exceptions, without superseding Finance V1's priority for any session not working this package.
Unlike `CRM-2`/`CRM-3`, this note was written **before** implementation started, per the standing
instruction those two packages' own notes issued. Scope: `LP-0` (discovery — read-only, complete
this session, no unrelated files touched) and `LP-1` (Company Print Profile source mapping —
ERPNext-owned vs. Ceylon-Stack-owned data ownership boundary, canonical print document model,
documented in `docs/backend/17-layout-print/`; no UI, no new DocType). Niroshan also resolved
`LP-0`'s §11 PDF-architecture fork explicitly: **reuse Frappe's native PDF generation** (already
proven — 7 shipped Sales Invoice Print Formats live-verified on the Hetzner instance) rather than
a second rendering engine, accepting the cost of maintaining a synchronized Jinja Print Format
alongside the React preview template — see `docs/architecture/decisions/README.md` ADR-009. `LP-2`
onward (the actual adapter/canonical-model/template code, starting with the Sales Invoice pilot)
is a **separate future package**, not authorized by this note to start in the same session as
`LP-0`/`LP-1`, per the one-package-per-session rule (`AGENT_USAGE_POLICY.md` §4.1). Email (`LP-8`)
is confirmed **not implementable today** — the live instance has zero `Email Account` records — and
must not be claimed as working; only the integration boundary should be designed. `FIN-2` remains
**not authorized** and this note does not touch or reorder Finance V1 or CRM.

**Updated 2026-09-25 (package `CRM-4`):** Niroshan issued a dedicated `CRM-4` mission brief —
Pipeline Workspace: transforming the existing Lead + Opportunity + Activity foundation into a
sales-management workspace at `/crm` (KPI summary — open opportunity count, pipeline value,
probability-weighted pipeline, expected-to-close, overdue follow-ups, no-next-action count —
pipeline board grouped by verified Opportunity stage, a Sales Attention Queue reusing CRM-3's
`getNextFollowup`/`followupBucket` derivation, owner/stage/status/follow-up-health filtering, and
My/All Opportunities visibility), per `CRM-0`'s `docs/backend/16-crm/crm-architecture.md` roadmap
and the `CRM-1`/`CRM-2`/`CRM-3` precedent for how a CRM package gets authorized. This note is
written **before** implementation starts, per the standing instruction `CRM-2`'s and `CRM-3`'s own
notes issued (and the same shape `LP-0`/`LP-1` already followed). Same exception shape as the prior
CRM notes above — does not resolve `docs/ceylon-stack-master-backlog.md` §5 decision #2, does not
reopen or authorize `CRM-5`, and does not change Finance V1's priority for any session not working
CRM. Per the mission brief's own instruction, Won/Lost analytics (win rate, won/lost revenue,
conversion rate) are explicitly **not** implemented as authoritative KPIs — `CRM-UNV-010`/
`CRM-UNV-011`'s unresolved won/lost-semantics gap is preserved, not silently closed. Opportunity
stage mutation from the board is implemented only if CRM-2's existing verified stage-update path
can be reused safely (explicit action, not drag-and-drop, no direct client-side ERPNext mutation);
otherwise deferred and documented. `FIN-2` remains **not authorized** and this note does not touch
or reorder Finance V1.

1. **Finance V1 — primary stream.** FIN-0 (architecture/discovery) CLOSED 2026-09-24. Canonical
   sequence: FIN-1 (Chart of Accounts read + Bank Account CRUD) → FIN-2 (Payment Entry + AR/AP
   visibility) → FIN-3 (Journal Entry) → FIN-4 (General Ledger / Trial Balance / Profit & Loss /
   Balance Sheet, via native ERPNext reports) → FIN-5 (Bank Transactions) → FIN-6 (cross-module
   accounting verification + Finance V1 closure). Do not resurrect the older, superseded FIN-1..
   FIN-9 numbering. See `docs/backend/06-accounting/finance-architecture.md` for full detail, the
   gap register (`FIN-GAP-01..12`), and the Finance/Master Data ownership boundary.
2. **Critical integration/release fixes** affecting already-built modules (Sales, Inventory,
   Buying, Manufacturing) — always in scope regardless of the freezes below.
3. **Remaining approved V1 module work** — lower priority than Finance V1 while it's active:
   - **Sales core** — hardened, frozen. Quotation → Sales Order → Delivery Note → Sales Invoice;
     bug fixes/critical polish only unless explicitly re-opened.
   - **Inventory MVP** — accepted. Items (shared/clean), Warehouses, Stock Balance, basic Stock
     Entry (Receipt/Issue/Transfer).
   - **Buying core cycle** — accepted. Purchase Order → Purchase Receipt → Purchase Invoice.
   - **Manufacturing — frozen at its current V1 boundary (2026-09-24) while Finance is the active
     primary stream.** Work Orders (list/detail/create/submit/cancel), Material Transfer, Complete
     Production, Job Card (read-only + cancel), and BOM (full lifecycle) have all shipped and been
     accepted. Do not expand Manufacturing (Workstations, OEE, Job Card execution/time-log) during
     this freeze, except for: critical defects, integration/accounting-impact defects Finance
     discovers while tracing Manufacturing→GL flows, release blockers, or a package Niroshan
     explicitly authorizes.
4. **CRM** — `CRM-1` (Leads), `CRM-2` (Opportunities), `CRM-3` (Activities & Follow-ups), and
   `CRM-4` (Pipeline Workspace) have shipped as explicit, dated exceptions (see the authorization
   notes above). Beyond those four, CRM otherwise remains gated behind the preceding V1
   foundations (Finance included) per `docs/ceylon-stack-master-backlog.md` §5 decision #2 (still
   open) — `CRM-5` needs its own separate authorization, the same way `CRM-4` needed its own
   beyond `CRM-3`'s.
5. **Later architecture programs** (e.g. tenant/module provisioning) — stay deferred unless
   separately unlocked.
6. **Layout, Print & Document Output Engine** — `LP-0` (discovery) and `LP-1` (Company Print
   Profile source mapping) have shipped as an explicit, dated exception (see the authorization note
   above), the same pattern as the CRM exceptions. `LP-2` onward (canonical model/adapter code,
   template engine, Sales Invoice pilot) needs its own separate package/session and is **not**
   authorized by this note.

### Operating Mode

- **Default = single agent + one small package per session.** "Build the whole module" is not a valid package — see `docs/controls/AGENT_USAGE_POLICY.md` §8 for valid/invalid examples.
- **No broad multi-agent sessions by default.** Subagent spawning is for review, QA, release tracking, or a clearly scoped specialist problem — not "just in case" (`docs/controls/AGENT_USAGE_POLICY.md` §5).
- **Review required after meaningful implementation** (`code-reviewer`); **QA required for core-flow changes** (`qa-tester`) — see Definition of Ready in `docs/controls/AGENT_OPERATING_GUIDE.md` §8.

### Package Closure Rules (every package, before it's "done")

A package is not complete until all of the following happen — this is the project's Definition of Done at the process level, not just the code level:

1. **Code review** (`code-reviewer`) for any meaningful implementation change.
2. **QA** (`qa-tester`) for anything touching a core flow (Sales, Stock/Inventory, Buying).
3. **`QA_LOG.md`** updated with what was tested and its result.
4. **`PROGRESS.md`** updated with what actually changed.
5. **`docs/backend/`** updated per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` for any meaningful ERP frontend feature — canonical field mapping, relationships, business rules, stock/accounting impact, or an explicit `NEEDS_VERIFICATION` flag in `99-unverified/`.
6. **`docs/product/`** updated for any meaningful **user-facing** ERP feature (a new business document, a new lifecycle action, a changed prerequisite/configuration step) — per the schema in `docs/tools/generate-docs.js`'s `SECTION_MODES` table (frontmatter + `## Section` markdown, see any existing file under `docs/product/` for the pattern). Not every package needs this — a package that only changes something already covered by an existing `docs/product/` page, or that has no end-user-visible surface (internal refactor, review-only, ops), records **Documentation Impact: NONE** instead of skipping the question silently.
7. **`docs/ceylon-stack-documentation.html`** regenerated (`node docs/tools/generate-docs.js`, then `node docs/tools/validate-docs.js`) whenever `docs/product/` changed, and its Release Log status labels/changelog (`docs/tools/templates/release-log-content.html`, `release-log-nav.html`, `last-updated.txt`) updated when a feature or phase ships — via the `release-tracker` subagent, not by hand. Never hand-edit the generated HTML file directly; it's a build artifact of the templates + `docs/product/` + `docs/backend/`, regenerated from source every time — see ADR-008 in `docs/architecture/decisions/README.md`.
8. **Notion "Smart Factory on ERPNext – Weekly Implementation Plan"** synced for remaining/newly-scoped tasks — also via `release-tracker`.
9. **Committed to GitHub** with a clear commit message. Work isn't done while it only exists as uncommitted changes.

Skipping any of these for a package that touches a core flow is a policy violation, not a shortcut — see `docs/controls/AGENT_USAGE_POLICY.md` §6/§12. When closing a package, name the Documentation Impact explicitly (Module Overview / User Guide / Configuration / Process Flow / Lifecycle / Stock Impact / Accounting Impact / Technical Reference — each `UPDATED` or `N/A`, plus `HTML Regenerated: YES` and `Documentation Validation: PASS`) rather than a bare "documentation updated."

### Enforcement

If a request conflicts with `docs/controls/DEVELOPMENT_SYSTEM_RULES.md`, `docs/controls/AGENT_OPERATING_GUIDE.md`, `docs/controls/AGENT_USAGE_POLICY.md`, `docs/controls/FRONTEND_GUIDE.md`, or `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` — refuse it and propose the compliant alternative instead of proceeding. Naming the conflicting rule/section is part of a valid refusal, not optional politeness.

## Core Architecture Decision

**Headless approach** — this is the central design choice and should not be relitigated without a strong reason:

- **ERPNext/Frappe core stays completely unmodified.** No edits to core files, ever. This keeps the GPL-3.0 obligations clean and keeps upgrades painless.
- **All custom logic lives in a separate Frappe app** (`smart_factory`), installed alongside ERPNext, not merged into it.
- **The frontend is being built independently** (Next.js, hosted on Vercel), talking to ERPNext purely through its REST API. A client that only calls an API is not considered a derivative work under GPL-3.0 — this is what gives the frontend and custom app genuine proprietary status, separate from ERPNext's license.
- **The real-time IoT/MES layer** (sensor data → OEE calculation → pushing status back into ERPNext) is also a separate custom service, not part of ERPNext itself.

This split is what makes the whole thing legally sellable as a whitelabel product — see `PLAN.md` for the full reasoning if it needs re-explaining to someone new.

## Current Infrastructure

- **Hosting:** Hetzner Cloud, CX23 (2 vCPU / 4GB RAM / 40GB SSD), Helsinki (`eu-central`) — roughly €4.50–7/month
- **Server:** `ubuntu-4gb-hel1-4`, Ubuntu 26.04, public IP `62.238.22.161`
- **Stack:** ERPNext + MariaDB + Redis, deployed via `frappe_docker`'s `pwd.yml` quick-start
- **Access:** SSH as `root`, key-based auth (private key stays local only — never in this repo or any chat)
- **GitHub repo (custom app code):** https://github.com/Niroshan-git/ERP-System.git

### Why Hetzner and not Oracle Cloud
Oracle's Always Free ARM tier (home region Singapore) was the original plan — it's genuinely free forever, but hit persistent "out of host capacity" errors that didn't resolve after repeated retries. Rather than keep fighting Oracle's shared capacity, the project moved to a cheap paid Hetzner VPS. This was the right call: the cost (~$5/month) is trivial against the time lost, and Hetzner provisioned successfully on the first real attempt.

## What's Done So Far

See `PROGRESS.md` for the full chronological log. Short version: server is live, ERPNext is deployed and running, initial company setup wizard is complete, and a GitHub repo exists for the custom app code (not yet populated — the `smart_factory` app hasn't been created yet).

## What's Next

See `PLAN.md` for the full week-by-week plan. Immediate next steps:
1. Finish the Manufacturing module walkthrough (Items, BOM, Work Order, Job Card) with test data
2. Set up the VS Code Remote-SSH + Dev Containers workflow to edit code live inside the backend container
3. Create the `smart_factory` custom Frappe app and push it to the GitHub repo above
4. Change the ERPNext Administrator password from the `pwd.yml` default before this goes any further

## Repository Structure (monorepo)

This project is a single monorepo — one repo, one folder per service.
See the root `README.md` for the full layout; short version:

- `apps/smart_factory/` — the custom Frappe app (created via `bench new-app`, not hand-built)
- `apps/mcp-server/` — MCP server wrapping ERPNext's REST API (dev/ops tool now, possible client-facing feature later)
- `apps/mes-service/` — FastAPI MES/OEE service
- `apps/frontend/` — Next.js dashboard
- `infra/docker/`, `infra/scripts/` — deployment config and ops scripts
- `docs/architecture.md` — layered architecture notes
- `docs/controls/` — the five binding control documents (see above). Process rules live only here — don't duplicate them elsewhere in the repo.
- `docs/controls/FRONTEND_GUIDE.md` — binding dev rules for `apps/frontend` (API layer, document pattern, component reuse, module build order, Definition of Done). Read before any frontend work.
- `docs/backend/` — the canonical-model / Frappe-mapping knowledge base built up per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md`. Grows as features are built, not ahead of them — see `docs/backend/README.md`.

This repo will move to a separate GitHub account from the current
`Niroshan-git/ERP-System` one — the account and remote have not been
finalized yet, so don't assume that URL is still current once that happens.

## Ground Rules for Any Assistant Working On This

- Never suggest modifying ERPNext/Frappe core files. Everything custom goes in the `smart_factory` app or in the separate frontend/MES services.
- Don't assume Oracle Cloud is still the target host — it was abandoned. Hetzner is current.
- Don't put real passwords, API keys, or private key contents into any file in this repo. Reference a password manager instead.
- This is being built by one person (Niroshan) with a background in SAP B1/Odoo/Acumatica ERP consulting, Power BI, and Python/PySpark — technical explanations can assume real development literacy, but Frappe/ERPNext-specific concepts (DocTypes, bench, hooks) may still need to be explained since that framework is new territory.
- **Any work on `apps/frontend` must follow `docs/controls/FRONTEND_GUIDE.md`.** It's the binding ruleset for the API layer (`lib/erpnext.ts` is the only place that calls ERPNext), the list/form/document pattern, component reuse (extend the existing 54 components, don't fork new ones), and the per-document Definition of Done. `frontend-dev`, `product-designer`, `code-reviewer`, and `qa-tester` should treat it as ground truth for anything touching the frontend. **The module build order is superseded by the Current Mission priority lock above** (Sales → Inventory MVP → Buying → Manufacturing) — treat that as current, not the order implied elsewhere in this or other docs.
- **`docs/controls/DEVELOPMENT_SYSTEM_RULES.md` and `docs/controls/AGENT_USAGE_POLICY.md` are binding project-wide**, not just for frontend work — they govern architecture/sequencing and session/subagent discipline respectively for every part of the monorepo.
- **Whenever a feature or plan phase is fully shipped and verified, invoke the `release-tracker` subagent before considering the task done.** It updates the Release Log templates (`docs/tools/templates/release-log-content.html`/`release-log-nav.html`/`last-updated.txt`) that feed `docs/ceylon-stack-documentation.html`'s Live/Building/Planned status labels and changelog, regenerates the HTML (`node docs/tools/generate-docs.js`), and syncs the Notion "Smart Factory on ERPNext – Weekly Implementation Plan" page (checks off completed tasks, adds newly-scoped ones) — both documents are expected to stay current, not just checked back into every few days.
- **`docs/ceylon-stack-documentation.html` is a generated build artifact, not a source file** (since DOCS-HELP-1, 2026-09-25) — never hand-edit it directly. Its sources are `docs/tools/templates/` (Release Log, owned by `release-tracker`), `docs/product/` (Product/Implementation Guide markdown, owned by whichever package ships the user-facing feature), and `docs/backend/` (Technical Architecture, owned by `BACKEND_KNOWLEDGE_POLICY.md`). Regenerate with `node docs/tools/generate-docs.js` and check with `node docs/tools/validate-docs.js` after touching any of those three. See ADR-008 in `docs/architecture/decisions/README.md`.

## graphify — Codebase Knowledge Graph

This project has a knowledge graph at `graphify-out/` (god nodes, community structure, cross-file relationships) covering the whole monorepo, weighted toward `apps/frontend`, its shared `lib/`/`components/`, and the root/`docs/` control markdown. Its purpose is to cut token usage by letting agents query structure instead of grepping/reading large folders — it is a **navigation aid, not a source of truth, and not a fifth binding document.**

Usage rules:
- Before broad codebase exploration, query the graph first: `graphify query "<question>"`, `graphify path "<A>" "<B>"` for relationships between two things, `graphify explain "<concept>"` for one concept. A `PreToolUse` hook (`.claude/settings.json`) already nudges toward this automatically on broad greps/finds or raw reads of source files — it's advisory only and never blocks a call.
- Do not dump large folders or run broad greps into context when a graph query can locate the relevant files/symbols instead.
- After a graph lookup, use normal file reads only for the specific files/symbols identified — don't re-read what the query already answered.
- Read `graphify-out/GRAPH_REPORT.md` only for a broad architecture review, or when query/path/explain don't surface enough.
- **Graphify does not override any document in `docs/controls/`** (`DEVELOPMENT_SYSTEM_RULES.md`, `AGENT_OPERATING_GUIDE.md`, `AGENT_USAGE_POLICY.md`, `FRONTEND_GUIDE.md`). It has no authority over architecture, sequencing, review/QA, or subagent/package discipline. The Current Mission priority lock and one-package-per-session rules apply exactly as before — a graph query never justifies expanding scope beyond the assigned package.
- After modifying code in a package, run `graphify "D:\_07_ERP\ERP System" --update` (AST-only, no API/subagent cost) to refresh the graph before review/QA.
- After a doc-heavy package (new/changed control markdown under `docs/controls/`, other `docs/`, brand docs), run a full `/graphify` rebuild — `--update` alone only re-extracts code (AST), not doc/markdown semantic content.

Preferred session flow (see Current Mission above and `docs/controls/AGENT_OPERATING_GUIDE.md` §8 for the Definition of Ready):
1. Read current mission / assigned package
2. Query the graph for relevant structure and files
3. Implement only the assigned package
4. Code review (`code-reviewer`)
5. QA (`qa-tester`) if a core flow is affected
6. Update `QA_LOG.md`, `PROGRESS.md`, documentation HTML, and Notion as required
7. Refresh the graph (`--update`, or a full rebuild if docs changed) and commit
