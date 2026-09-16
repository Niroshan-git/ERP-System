# CLAUDE.md — Smart Factory on ERPNext

This file gives any Claude session working in this project folder the full context needed to help effectively, without re-explaining the project from scratch.

## What This Project Is

A Smart Factory concept system built on top of **ERPNext/Frappe** (open-source, GPL-3.0), with the goal of eventually whitelabeling and selling it to manufacturing clients (starting with local clients in Sri Lanka).

**Product name: Ceylon Stack.** "Smart Factory on ERPNext" is still the accurate internal/technical description of the stack (see below) — Ceylon Stack is the name used in anything client- or marketing-facing (pitch deck, frontend, ERPNext Desk branding). Full approved design system: `DESIGN.md`. Dev quick-reference tokens + asset files: `docs/brand.md` / `docs/brand/`.

This file is the **master entry point** for the repo's control system. Everything binding lives in `docs/controls/`; every other doc (`PLAN.md`, `PROGRESS.md`, `QA_LOG.md`, `README.md`) is a tracking or reference doc, not a rulebook. If in doubt about process, start here.

## Binding Control Documents (Read First)

These four documents, all in [`docs/controls/`](docs/controls/), are **binding** for all work in this repo — this is the single source of truth for process rules; nothing outside `docs/controls/` overrides them. Every Claude session, and every subagent, must read the ones relevant to its task before doing meaningful implementation work:

1. [`docs/controls/DEVELOPMENT_SYSTEM_RULES.md`](docs/controls/DEVELOPMENT_SYSTEM_RULES.md) — architecture rules, module sequencing, quality gates, scope control
2. [`docs/controls/AGENT_OPERATING_GUIDE.md`](docs/controls/AGENT_OPERATING_GUIDE.md) — agent roles/authority, standard operating procedure, Definition of Ready
3. [`docs/controls/AGENT_USAGE_POLICY.md`](docs/controls/AGENT_USAGE_POLICY.md) — session and subagent discipline, review/QA cadence, cost control
4. [`docs/controls/FRONTEND_GUIDE.md`](docs/controls/FRONTEND_GUIDE.md) — binding ruleset for `apps/frontend` specifically (API layer, document pattern, component reuse, module build order, Definition of Done)

**They override casual user requests when there's a conflict.** A request that conflicts with any of these is not a green light to proceed anyway — stop, name the specific rule in conflict, and propose a compliant alternative. See Enforcement below.

### Current Mission (priority lock, as of Sep 2026)

Do not reorder without explicit approval from Niroshan:

1. **Harden Sales core** — Quotation → Sales Order → Delivery Note → Sales Invoice — then freeze major new Sales features
2. **Inventory MVP next** — Items (shared/clean), Warehouses, Stock Balance, basic Stock Entry (Receipt/Issue/Transfer)
3. **Buying — core cycle only** — Purchase Order → Purchase Receipt → Purchase Invoice; keep reports light
4. **Manufacturing frontend is locked** until Inventory MVP is accepted — advisory/domain input is fine, implementation is not

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
5. **`docs/ceylon-stack-documentation.html`** status labels/changelog updated when a feature or phase ships — via the `release-tracker` subagent, not by hand.
6. **Notion "Smart Factory on ERPNext – Weekly Implementation Plan"** synced for remaining/newly-scoped tasks — also via `release-tracker`.
7. **Committed to GitHub** with a clear commit message. Work isn't done while it only exists as uncommitted changes.

Skipping any of these for a package that touches a core flow is a policy violation, not a shortcut — see `docs/controls/AGENT_USAGE_POLICY.md` §6/§12.

### Enforcement

If a request conflicts with `docs/controls/DEVELOPMENT_SYSTEM_RULES.md`, `docs/controls/AGENT_OPERATING_GUIDE.md`, `docs/controls/AGENT_USAGE_POLICY.md`, or `docs/controls/FRONTEND_GUIDE.md` — refuse it and propose the compliant alternative instead of proceeding. Naming the conflicting rule/section is part of a valid refusal, not optional politeness.

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
- `docs/controls/` — the four binding control documents (see above). Process rules live only here — don't duplicate them elsewhere in the repo.
- `docs/controls/FRONTEND_GUIDE.md` — binding dev rules for `apps/frontend` (API layer, document pattern, component reuse, module build order, Definition of Done). Read before any frontend work.

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
- **Whenever a feature or plan phase is fully shipped and verified, invoke the `release-tracker` subagent before considering the task done.** It updates `docs/ceylon-stack-documentation.html`'s Live/Building/Planned status labels and changelog, and syncs the Notion "Smart Factory on ERPNext – Weekly Implementation Plan" page (checks off completed tasks, adds newly-scoped ones) — both documents are expected to stay current, not just checked back into every few days.

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
