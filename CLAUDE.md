# CLAUDE.md — Smart Factory on ERPNext

This file gives any Claude session working in this project folder the full context needed to help effectively, without re-explaining the project from scratch.

## What This Project Is

A Smart Factory concept system built on top of **ERPNext/Frappe** (open-source, GPL-3.0), with the goal of eventually whitelabeling and selling it to manufacturing clients (starting with local clients in Sri Lanka).

**Product name: Ceylon Stack.** "Smart Factory on ERPNext" is still the accurate internal/technical description of the stack (see below) — Ceylon Stack is the name used in anything client- or marketing-facing (pitch deck, frontend, ERPNext Desk branding). Full approved design system: `DESIGN.md`. Dev quick-reference tokens + asset files: `docs/brand.md` / `docs/brand/`.

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

This repo will move to a separate GitHub account from the current
`Niroshan-git/ERP-System` one — the account and remote have not been
finalized yet, so don't assume that URL is still current once that happens.

## Ground Rules for Any Assistant Working On This

- Never suggest modifying ERPNext/Frappe core files. Everything custom goes in the `smart_factory` app or in the separate frontend/MES services.
- Don't assume Oracle Cloud is still the target host — it was abandoned. Hetzner is current.
- Don't put real passwords, API keys, or private key contents into any file in this repo. Reference a password manager instead.
- This is being built by one person (Niroshan) with a background in SAP B1/Odoo/Acumatica ERP consulting, Power BI, and Python/PySpark — technical explanations can assume real development literacy, but Frappe/ERPNext-specific concepts (DocTypes, bench, hooks) may still need to be explained since that framework is new territory.
- **Whenever a feature or plan phase is fully shipped and verified, invoke the `release-tracker` subagent before considering the task done.** It updates `docs/ceylon-stack-documentation.html`'s Live/Building/Planned status labels and changelog, and syncs the Notion "Smart Factory on ERPNext – Weekly Implementation Plan" page (checks off completed tasks, adds newly-scoped ones) — both documents are expected to stay current, not just checked back into every few days.
