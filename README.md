# Ceylon Stack ("Smart Factory on ERPNext")

Monorepo for Ceylon Stack, the Smart Factory whitelabel product. Approved brand & design system: `DESIGN.md`. See `CLAUDE.md` for full
project context and ground rules, `PLAN.md` for the week-by-week build plan,
and `PROGRESS.md` for the running log of what's actually been done.

**Target:** client-ready demo + start of marketing outreach next month.

## Repository Layout

```
ERP System/
├── CLAUDE.md              # Master entry point: project context & ground rules for any assistant/dev
├── PLAN.md                # Week-by-week implementation plan
├── PROGRESS.md            # Chronological log of work done
├── QA_LOG.md              # Log of QA passes against core flows
├── README.md              # This file
├── .gitignore
├── apps/
│   ├── smart_factory/     # Custom Frappe app (installed alongside ERPNext core — never edit core)
│   ├── mcp-server/        # MCP server exposing ERPNext data/actions as tools (REST API client only)
│   ├── mes-service/       # FastAPI service: MQTT ingest -> OEE calc -> writes to ERPNext + Postgres
│   └── frontend/          # Next.js dashboard (Vercel), talks to ERPNext + MES only via API
├── infra/
│   ├── docker/            # docker-compose overrides / frappe_docker config for this project
│   └── scripts/           # Deployment, backup, and setup scripts (server-side ops), incl. sync-app-branch.sh
└── docs/
    ├── architecture.md    # Layered architecture diagram + notes
    ├── brand.md           # Brand/design token reference
    ├── brand/
    │   └── package/       # Full approved brand asset package (logos, SVG/PNG, guidelines)
    ├── ceylon-stack-documentation.html  # Client-facing product doc (Live/Building/Planned status)
    └── controls/          # Binding control docs — see CLAUDE.md
        ├── DEVELOPMENT_SYSTEM_RULES.md
        ├── FRONTEND_GUIDE.md
        ├── AGENT_OPERATING_GUIDE.md
        └── AGENT_USAGE_POLICY.md
```

## Architecture (short version)

Headless split — ERPNext/Frappe core is never modified. Every custom piece
(`smart_factory`, `mcp-server`, `mes-service`, `frontend`) talks to ERPNext
only through its REST API. This is what keeps the custom layer legally
separate and proprietary under ERPNext's GPL-3.0 license. Full reasoning in
`CLAUDE.md` and `docs/architecture.md`.

## App branches (bench installability)

`bench get-app`/`bench install-app` expect a git repo's root to *be* the
Frappe app's root (`pyproject.toml`, `hooks.py`, etc. directly at top
level) — they can't consume an app nested inside a monorepo folder. Rather
than splitting `smart_factory` into its own repo, this repo also carries a
branch named exactly `smart_factory` whose root **is** just that app's
files, generated from `apps/smart_factory/` via `git subtree split`:

```bash
infra/scripts/sync-app-branch.sh smart_factory
```

Run this after committing changes to `apps/smart_factory/` on `main` and
that app needs to reach a bench (new client site, or a live-server
`git pull`). `main` keeps developing `apps/smart_factory/` normally — the
branch is a generated artifact, not a place to edit directly. The same
script will handle `ceylon_services` once that app exists.

## Getting Started

Each `apps/*` folder has its own README with setup instructions once that
service exists. Server/infra details (SSH, hosting) are in `CLAUDE.md` —
none of that (keys, passwords, IPs used for real credentials) belongs in
this repo itself.

## Status

See `PROGRESS.md`. Short version as of this folder structure being set up:
ERPNext is deployed and running on Hetzner; `smart_factory`, `mcp-server`,
`mes-service`, and `frontend` are all still to be built.
