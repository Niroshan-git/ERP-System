---
title: Architecture — The Headless Stack
module: Getting Started
type: module-overview
status: LIVE
last_verified: 2026-09-25
---

## Overview

One rule underpins everything in Ceylon Stack: ERPNext/Frappe core is never modified. Everything
custom talks to it only through its REST API.

```flow
Shop floor / IoT
MES (mes-service)
ERPNext core (+ custom apps)
Frontend
```

## Business Purpose

**Why headless.** A client that only calls an API is not a derivative work under GPL-3.0. That's
what makes the custom apps and frontend genuinely proprietary, sellable IP — separate from
ERPNext's own license.

**Repo layout.** `apps/smart_factory` · `apps/ceylon_services` · `apps/mcp-server` ·
`apps/mes-service` · `apps/frontend` — one monorepo, one folder per service.

## Related Documents

See `CLAUDE.md`'s "Core Architecture Decision" and `docs/architecture.md` for the full reasoning,
and `docs/architecture/decisions/README.md` (ADR-001) for the formal decision record.

## Technical Reference

Frontend: Next.js (`apps/frontend`), hosted on Vercel, talking to ERPNext purely through its REST
API via `lib/erpnext.ts`. Backend: ERPNext/Frappe (unmodified core) plus a separate custom Frappe
app (`smart_factory`). MES/IoT layer: a separate FastAPI service (`apps/mes-service`), not yet
built (Planned).
