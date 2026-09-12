# mcp-server

MCP server exposing ERPNext (and eventually MES/OEE) data as tools for an
AI assistant — e.g. "list open Work Orders", "check OEE for Machine 3",
"create a Job Card". Talks to ERPNext **only** through its REST API
(same API-key auth as the frontend) — it is a pure API client, never a
Frappe app, and never touches ERPNext core.

## Two use cases this can serve (see project chat notes)

- **Dev/ops tool**: speeds up building and testing the project itself —
  query and manipulate the ERPNext instance without hand-clicking the Desk UI.
- **Product feature**: a conversational layer for client-facing use later
  ("which machines are down right now?") — same server, tighter auth/
  multi-tenant scoping before it ships to clients.

## Suggested structure (fill in as it's built)

```
mcp-server/
├── src/
│   ├── server.(py|ts)       # MCP server entrypoint
│   ├── erpnext_client.*     # thin REST client (auth, resource/<doctype> calls)
│   └── tools/                # one file per tool group (items, work_orders, oee, ...)
├── .env.example              # ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET (never the real .env)
├── requirements.txt / package.json
└── README.md
```

## Setup (TODO once the stack is chosen — Python or Node)

1. Generate an API key/secret in ERPNext: Settings → My Settings → API Access
2. Never commit the key/secret — put it in `.env`, keep `.env.example` with blank values in the repo
3. Wrap the ERPNext REST endpoints you need as MCP tools
