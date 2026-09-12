# Architecture

## Layered view

```
Shop floor / IoT  -->  Integration & MES  -->  ERPNext core  -->  Analytics & digital twin
  (sensors,             (mes-service:            (unmodified,       (frontend dashboards,
   simulator)            MQTT -> OEE calc)         + smart_factory   OEE trends, downtime
                                                    custom app)       Pareto, optional
                                                                      Three.js twin)
```

Everything outside the "ERPNext core" box talks to it **only** through its
REST API. Nothing outside that box is a Frappe app or touches core files.

## Why this split (headless architecture)

- ERPNext/Frappe core (GPL-3.0) stays completely unmodified — no core edits, ever.
- `apps/smart_factory` is a separate installed Frappe app for anything that
  genuinely needs to run inside Frappe (DocTypes, server scripts, hooks).
- `apps/frontend`, `apps/mcp-server`, and `apps/mes-service` are all pure
  API clients. A client that only calls an API is not considered a
  derivative work under GPL-3.0 — this is what makes the whitelabel product
  legally sellable as proprietary software layered on an open-core ERP.

Full reasoning: see `CLAUDE.md` and `PROGRESS.md` → "Architecture & Planning Decisions".

## Data flow (once mes-service + mcp-server exist)

1. Machine (simulated → real later) publishes readings to MQTT
2. `mes-service` subscribes, computes OEE, writes events to Postgres/TimescaleDB
3. `mes-service` calls ERPNext's REST API to update Job Card / Work Order status
4. `frontend` reads from both the ERPNext API and Postgres/mes-service to render dashboards
5. `mcp-server` wraps the same ERPNext (and later mes-service) API surface as
   tools, for AI-assisted dev/ops now, and potentially a client-facing
   conversational layer later

## Multi-client path (see PLAN.md → "Multi-Client / Commercial Notes")

Frappe's multi-site support means one Hetzner instance can eventually host
isolated UAT + Live sites per client without a new server each time. Not
needed until the first real client — free-tier / current single-server
setup is prototype-only.
