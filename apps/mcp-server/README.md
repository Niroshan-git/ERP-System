# mcp-server — Ceylon Stack Developer MCP

MCP server exposing Ceylon Stack's data platform (backed by ERPNext today,
and eventually MES/OEE) as tools for an AI assistant — e.g. "list open
Work Orders", "check OEE for Machine 3", "create a Job Card". Talks to
ERPNext **only** through its REST API (same API-key auth as the frontend)
— it is a pure API client, never a Frappe app, and never touches ERPNext
core.

**This is the developer tier: full read access, unrestricted DocType/field
scope.** It is deliberately not what a client would get — see "Two-tier
access model" below.

## Two use cases this can serve (see project chat notes)

- **Dev/ops tool** (this server, today): speeds up building and testing
  the project itself — query the ERPNext instance without hand-clicking
  the Desk UI. Full read access, meant for the developer only.
- **Product feature** (future, separate tier): a conversational layer for
  client-facing use later ("which machines are down right now?") — same
  underlying data, but role/DocType-scoped and presented under Ceylon
  Stack terminology rather than raw ERPNext DocType names. Not built yet
  — see below.

## Two-tier access model

- **Dev tier (this server)**: the Administrator API key, full read access
  to any DocType via the generic discovery tools below. No permission
  scoping beyond what ERPNext itself enforces for that user. Not safe to
  hand to a client as-is.
- **Client tier (planned, not built)**: per `docs/mcp-agents-plan.md`
  Phase 2(b), a separate, restricted server/config built once there's a
  real client role to scope it against — an allow-list of DocTypes/fields
  per role, likely backed by a lower-privilege ERPNext API user rather
  than Administrator, with tool names/descriptions in Ceylon Stack terms
  instead of raw DocType names. Deliberately deferred until a real client
  conversation defines what a role should actually be allowed to see.

## Structure

```
mcp-server/
├── src/
│   ├── server.py            # MCPServer instance + tool definitions, stdio entrypoint
│   ├── erpnext_client.py    # thin async REST client (token auth, generic get_list/get_doc)
│   └── config.py            # loads + validates ERPNEXT_URL / API_KEY / API_SECRET from .env
├── .env.example              # ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET (never the real .env)
├── requirements.txt
└── README.md
```

Stack: Python, using the official `mcp` SDK's `MCPServer` high-level API
(decorator-based tools, stdio transport — the standard way Claude Code /
Claude Desktop consume an MCP server). Requires `mcp>=2.0` — that release
renamed the older `FastMCP` class to `MCPServer` (same decorator-based
`.tool()`/`.run()` interface, different import path:
`mcp.server.mcpserver`).

## Setup

1. `cd apps/mcp-server && pip install -r requirements.txt`
2. `cp .env.example .env` and fill in real values — generate an API
   key/secret in ERPNext under **Settings → My Settings → API Access**.
   `.env` is gitignored at the repo root; never commit it or paste the
   key/secret into chat.

## Run

```
python -m src.server              # stdio transport, for a real MCP client (e.g. Claude Code's .mcp.json)
pip install "mcp[cli]"            # one-time, only needed for the inspector below
mcp dev src/server.py             # MCP inspector — for manually calling tools while testing
```

## Tools (current — full-access discovery, dev tier)

Everything currently exposed is **read-only** but has **no artificial
scope restriction** — any DocType, any filter, any field — since this is
the developer's own full-access tier, not the (future) client tier:

- **`ping()`** — confirms the connection is working; returns the connected user + `ERPNEXT_URL`. Run this first.
- **`list_doctypes(module=None)`** — lists record types, optionally filtered by module (up to 500 per call).
- **`get_doctype_fields(doctype)`** — returns the field schema (fieldname, label, fieldtype, reqd, options) for any record type.
- **`list_documents(doctype, filters=None, fields=None, limit=100, offset=0)`** — generic read of any record type's documents. Default 100 rows/call, hard ceiling 2000/call regardless of the requested `limit` (protects the live 2 vCPU/4GB Hetzner box from one runaway request — not a data-access restriction); page through larger result sets with `offset`.

Verified end-to-end against the live instance (2026-09-12): `ping`,
`list_doctypes`, `get_doctype_fields`, and `list_documents` all confirmed
working. Along the way, fixed a real bug in `erpnext_client.py`'s
`_request`: `/api/resource/...` REST calls wrap their result under
`"data"`, while `/api/method/...` RPC calls wrap it under `"message"` —
the client now unwraps whichever key is actually present instead of
assuming `"message"` everywhere (which silently made `get_doctype_fields`
return an empty list).

## What's deliberately not built yet

Per `docs/mcp-agents-plan.md` and `.claude/agents/mcp-dev.md`, any
business-specific tool (Work Order, Job Card, BOM, Item, downtime,
create/update actions) is **hard-gated behind Phase 0** — a full ERPNext
walkthrough producing `docs/erp-inventory.md` — which hasn't run yet
(no manufacturing master data exists on the live instance). Building
those tools against a guessed schema is the documented failure mode this
project is explicitly avoiding. The discovery tools above are generic
enough to be useful now, and can even help run that Phase 0 walkthrough
once someone points them at the live instance.

The client-scoped tier described above is also not built yet, for the
same reason: no real client role exists yet to design the scoping around.
