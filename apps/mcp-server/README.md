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
- **`get_manufacturing_overview()`** — **dev-tier, read-only**, first
  business-specific tool (Phase 1). Returns a compact Manufacturing
  readiness/status snapshot: counts of BOM / Workstation / Work Order /
  Job Card / Quality Inspection Template; the 5 most recently modified
  Work Orders and Job Cards (key fields only); whether the reference
  finished good (`FG-STEEL-BRACKET-ASSY`) has a Quality Inspection
  Template attached, and which one; and a `gaps` array flagging missing
  or risky readiness items (e.g. zero BOMs, zero Quality Inspection
  Templates, the reference item missing its template). Built against the
  real schema/naming facts in `docs/erp-inventory.md` (Phase 0), not
  guessed field names — e.g. Job Card's naming series is `PO-JOB.#####`,
  not the `JC-.YYYY.-` pattern earlier docs assumed.

Verified end-to-end against the live instance (2026-09-12): `ping`,
`list_doctypes`, `get_doctype_fields`, and `list_documents` all confirmed
working. Along the way, fixed a real bug in `erpnext_client.py`'s
`_request`: `/api/resource/...` REST calls wrap their result under
`"data"`, while `/api/method/...` RPC calls wrap it under `"message"` —
the client now unwraps whichever key is actually present instead of
assuming `"message"` everywhere (which silently made `get_doctype_fields`
return an empty list).

`get_manufacturing_overview` verified end-to-end against the live instance
(2026-09-16): real counts (1 BOM, 2 Workstations, 6 Work Orders, 6 Job
Cards, 1 Quality Inspection Template), real recent Work Orders
(`MFG-WO-2026-0000x`) and Job Cards (`PO-JOB0000x`), and the
`Steel Bracket Assembly - Final QC` template correctly resolved for
`FG-STEEL-BRACKET-ASSY`. All requests made were `GET` — no write calls.

- **`get_work_order_detail(work_order_name)`** — **dev-tier, read-only**,
  second business-specific tool (Phase 1). Given a Work Order name, returns
  its header (status, company, production_item, item_name, qty,
  produced_qty, process_loss_qty, planned_start_date, planned_end_date,
  bom_no), its Job Cards (name, operation, workstation, status,
  for_quantity, total_completed_qty, expected/actual start/end dates,
  ordered by creation, bounded to 50), Quality readiness (the production
  item's `quality_inspection_template`, plus up to 5 `Quality Inspection`
  records filtered by `item_code` — Quality Inspection links to Job Card,
  not directly to Work Order, so this is item-level, not Work-Order-level,
  matching per `docs/erp-inventory.md`'s schema notes), a `gaps` array, and
  a `source` note. Validates `work_order_name` is non-empty and returns a
  clean `{"error": ...}` dict (not an unhandled exception) for an empty
  name or a Work Order that doesn't exist.

  Verified end-to-end against the live instance (2026-09-16) against
  `MFG-WO-2026-00002` (In Process — returned its 2 real Job Cards,
  `PO-JOB00001`/`PO-JOB00002`, with real statuses/quantities), `-00004`
  (Completed — 0 Job Cards, correctly empty) and `-00001` (Cancelled), a
  nonexistent name, and an empty string. The
  `Steel Bracket Assembly - Final QC` template resolved correctly. All
  requests issued were `GET` — confirmed via HTTP-method interception, zero
  writes.

  One real ERPNext quirk surfaced during verification, not a bug in this
  tool: for Completed/Cancelled Work Orders, `planned_end_date` — a field
  genuinely defined on the Work Order doctype — is entirely absent from the
  REST response (not just `null`). The tool's `gaps` array flags this as
  "ERPNext omitted this field from the response" rather than asserting
  schema drift, since the field *is* defined; root cause on the ERPNext
  side wasn't investigated further (out of this package's scope).

- **`list_work_orders(status=None, production_item=None, limit=20)`** —
  **dev-tier, read-only**, third business-specific tool (Phase 1). Lists
  Work Orders newest-first (`order_by="creation desc"`), optionally
  filtered by `status` and/or `production_item` (equality filters passed
  straight through to `frappe.client.get_list`). Returns a compact
  `applied_filters` / `total_returned` / `work_orders` / `gaps` / `source`
  shape — each Work Order carries `name`, `status`, `company`,
  `production_item`, `item_name`, `qty`, `produced_qty`, `bom_no`,
  `planned_start_date`, `planned_end_date`, `creation`. `limit` is clamped
  to `[1, 100]` (default 20). Exists to help an agent discover the Work
  Order `name` to pass into `get_work_order_detail`, complementing that
  tool and `get_manufacturing_overview`.

  Verified end-to-end against the live instance (2026-09-16): unfiltered
  call returned all 6 real Work Orders (`MFG-WO-2026-00001..006`),
  newest-first; `status="Completed"` returned exactly `-00004`;
  `production_item="FG-STEEL-BRACKET-ASSY"` returned all 6 (the instance's
  only manufactured item, per `docs/erp-inventory.md`); combined
  `status="Not Started"` + that production item returned exactly `-00003`
  and `-00006`; `limit=0` clamped to 1, `limit=9999` clamped to 100. 6 HTTP
  requests total across the run, confirmed via HTTP-method interception —
  all `GET`, zero writes. `code-reviewer` pass: no blocking findings.

- **`list_job_cards(status=None, work_order=None, workstation=None, limit=20)`** —
  **dev-tier, read-only**, fourth business-specific tool (Phase 1). Lists Job
  Cards newest-first (`order_by="creation desc"`), optionally filtered by
  `status`, `work_order`, and/or `workstation` (equality filters passed
  straight through to `frappe.client.get_list`). Returns a compact
  `applied_filters` / `total_returned` / `job_cards` / `gaps` / `source`
  shape — each Job Card carries `name`, `status`, `work_order`,
  `production_item`, `operation`, `workstation`, `for_quantity`,
  `total_completed_qty`, `expected_start_date`, `expected_end_date`,
  `actual_start_date`, `actual_end_date`, `creation`. `limit` is clamped to
  `[1, 100]` (default 20). Lets Manufacturing Floor / MCP workflows inspect
  execution-level work without already knowing a Job Card name or its parent
  Work Order, complementing `list_work_orders`, `get_work_order_detail`, and
  `get_manufacturing_overview`.

  `production_item` (live-confirmed via `get_doctype_fields("Job Card")` as
  "Final Product", a Link to Item) is included here even though it isn't in
  the existing `JOB_CARD_DETAIL_FIELDS` set used by `get_work_order_detail`'s
  Job Card sub-list — a deliberate, documented choice for this list tool, not
  an inconsistency to fix.

  Verified end-to-end against the live instance (2026-09-17): unfiltered call
  returned all 6 real Job Cards (`PO-JOB00001..00006`), newest-first;
  `status="Completed"` returned exactly `PO-JOB00001`;
  `work_order="MFG-WO-2026-00002"` returned its 2 real Job Cards
  (`PO-JOB00001`, `PO-JOB00002`); `workstation="Coating Station"` returned
  exactly the 3 Job Cards on that workstation; combined `work_order` +
  `workstation` returned exactly 1 matching card; `limit=0` clamped to 1,
  `limit=9999` clamped to 100. 7 HTTP requests total across the run,
  confirmed via HTTP-method interception — all `GET`, zero writes.
  `code-reviewer` pass: no blocking findings.

## What's deliberately not built yet

Phase 0 (`docs/erp-inventory.md`) is complete, which unblocked the
business-specific read tools above. Still deliberately not built: any
write/action tool (create Job Card, update status, log downtime), any
other business-specific read tool (BOM/Item single-record lookups, OEE),
and the client-scoped tier — per `docs/mcp-agents-plan.md` Phase 1/2
sequencing and `docs/controls/AGENT_USAGE_POLICY.md`'s one-package-at-a-time
rule. The client-scoped tier is still deferred for the same reason it
always was: no real client role exists yet to design the scoping around.
