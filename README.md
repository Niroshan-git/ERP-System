# Ceylon Stack ("Smart Factory on ERPNext")

Monorepo for Ceylon Stack, the Smart Factory whitelabel product. Approved brand & design system: `DESIGN.md`. See `CLAUDE.md` for full
project context and ground rules, `PLAN.md` for the week-by-week build plan,
and `PROGRESS.md` for the running log of what's actually been done.

**Target:** client-ready demo + start of marketing outreach next month.

## Repository Layout

```
ERP System/
├── CLAUDE.md              # Project context & ground rules for any assistant/dev
├── PLAN.md                # Week-by-week implementation plan
├── PROGRESS.md            # Chronological log of work done
├── README.md              # This file
├── .gitignore
├── apps/
│   ├── smart_factory/     # Custom Frappe app (installed alongside ERPNext core — never edit core)
│   ├── mcp-server/        # MCP server exposing ERPNext data/actions as tools (REST API client only)
│   ├── mes-service/       # FastAPI service: MQTT ingest -> OEE calc -> writes to ERPNext + Postgres
│   └── frontend/          # Next.js dashboard (Vercel), talks to ERPNext + MES only via API
├── infra/
│   ├── docker/            # docker-compose overrides / frappe_docker config for this project
│   └── scripts/           # Deployment, backup, and setup scripts (server-side ops)
└── docs/
    └── architecture.md    # Layered architecture diagram + notes
```

## Architecture (short version)

Headless split — ERPNext/Frappe core is never modified. Every custom piece
(`smart_factory`, `mcp-server`, `mes-service`, `frontend`) talks to ERPNext
only through its REST API. This is what keeps the custom layer legally
separate and proprietary under ERPNext's GPL-3.0 license. Full reasoning in
`CLAUDE.md` and `docs/architecture.md`.

## Getting Started

Each `apps/*` folder has its own README with setup instructions once that
service exists. Server/infra details (SSH, hosting) are in `CLAUDE.md` —
none of that (keys, passwords, IPs used for real credentials) belongs in
this repo itself.

## Status

See `PROGRESS.md`. Short version as of this folder structure being set up:
ERPNext is deployed and running on Hetzner; `smart_factory`, `mcp-server`,
`mes-service`, and `frontend` are all still to be built.
