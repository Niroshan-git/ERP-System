# Plan — MCP Server & Agents

Two things get conflated under "MCP server agents setup" — worth splitting
before building either:

1. **The MCP server** — a Python service wrapping ERPNext's REST API as a
   small set of tools, per `apps/mcp-server/README.md`.
2. **Agents** — something (this session, or a future client-facing
   assistant) that *uses* those tools. Phase 2 below is about that; it's
   the smaller, later piece.

Building tools against a guess of what ERPNext looks like is how you end up
rebuilding them in three weeks. Phase 0 comes first, on purpose.

## Phase 0 — Full ERP Walkthrough (blocks everything below)

**Goal:** know exactly what's actually configured on the live instance
before designing a single tool. Per `PROGRESS.md`, this is currently a
fresh ERPNext install past only the company setup wizard — no manufacturing
master data yet — so the walkthrough is mostly confirming that baseline
and capturing the exact shape (naming series, field names, roles) the
tools will need to match.

### What to inventory

- **Installed apps & versions** — `bench version`, or Desk → Help → About
- **Enabled modules** — is Manufacturing active? Selling / Buying / Stock / Accounts?
- **Company setup** — company name, currency, fiscal year, warehouses
- **Existing master data** — Items, BOMs, Workstations, Work Orders, Job
  Cards, Quality Inspection templates (expect: none yet)
- **Users & roles** — anything beyond Administrator? Any API users already?
- **API access** — REST API is on by default in Frappe; confirm whether an
  API key/secret already exists, and under which user
- **Existing customizations** — any custom fields / Client Scripts / Server
  Scripts already added by hand via Customize Form (should be none, since
  `smart_factory` doesn't exist yet — worth ruling out rather than assuming)
- **Naming series** — the actual ID format for Job Card / Work Order /
  Item once they exist (e.g. `JC-.YYYY.-`), since tools and agents will
  need to work with real IDs, not assumed ones

**Output:** `docs/erp-inventory.md` — a short, factual record of the above,
becoming the ground truth the MCP tool design is built against.

### How this actually gets done

This needs live access to the Hetzner instance, which I don't have yet.
Two ways to get there — the first is worth doing anyway since the
`mcp-server` app will need the exact same credential:

1. **Generate an ERPNext API key/secret** for the Administrator user
   (Settings → My Settings → API Access), and share it with me only as a
   local `.env` value (gitignored, never pasted into chat or committed).
   I then walk the REST API directly (`/api/resource/...`,
   `/api/method/frappe.client.get_list`) and write the inventory doc.
2. **You walk through it yourself** using the checklist above and share
   findings/screenshots — slower, but keeps the API key out of this
   session entirely if you'd rather.

## Phase 1 — MCP Server Tool Surface

Once Phase 0's findings are in, design a small number of well-scoped
tools — not a 1:1 wrapper of every DocType endpoint. Likely groups:

- **Read/reporting** — list open Work Orders, Job Cards by status, Item/BOM
  lookups, OEE for a machine (once `mes-service` exists)
- **Write/action** — create Job Card, update Job Card status, log a
  downtime reason — gated more carefully than the read tools
- **Discovery** — list available DocTypes/fields, useful while the rest of
  the stack is still being built

Auth: the same API key/secret from Phase 0, stored in
`apps/mcp-server/.env` (gitignored) — never hardcoded.

## Phase 2 — Agents

Two different things could be meant by "agents" here, worth deciding
between explicitly rather than building for both at once:

- **(a) Dev/ops use** — this is basically already covered: a Claude
  session (like this one) using the MCP tools directly to help
  build/test/administer. No separate agent needed.
- **(b) A client-facing conversational layer** — role-scoped assistants
  (e.g. a supervisor-facing one that only reads status, a planner-facing
  one that can create/modify Work Orders), with permission scoping
  enforced at the MCP tool/API-key layer, not trusted to the agent's own
  judgment, since this would eventually run for external clients.

**Honest read on priority:** given the October client/marketing target,
(b) is very likely lower priority than getting real manufacturing master
data into ERPNext and a working frontend dashboard in front of a client —
an agent layer doesn't help close a first deal. (a) is worth building now
specifically because it speeds up everything else between here and October.

## Phase 3 — Remote Access (not started)

**Status (2026-09-12):** `apps/mcp-server` exists and is verified working —
see `apps/mcp-server/README.md` for the current tool list. It runs as a
**local stdio process** only: Claude Code/Desktop launches it as a
subprocess on the developer's own machine, using the local Python install
and the local `apps/mcp-server/.env` (Administrator API key). It is **not**
reachable from claude.ai (web), the mobile app, or any other device —
there's no server listening anywhere for those to reach.

Making it reachable from "anywhere" is a real, separate step, not a config
flag:

- **Transport**: the `mcp` SDK's `MCPServer` supports `streamable-http` (and
  `sse`) in addition to `stdio` — switching transport is the easy part.
- **Hosting**: the server would need to run somewhere with a public
  address — the Hetzner box is the obvious candidate since it already
  hosts ERPNext, but that's additional load/attack-surface on a 2 vCPU/4GB
  instance already running the full stack.
- **Auth is the hard part, and non-optional**: today's server holds an
  **Administrator**-level ERPNext API key. Exposing it over a public HTTP
  endpoint with only that key as protection means anyone who finds the URL
  has full ERPNext access. A public remote server must not be the raw
  dev-tier server — it needs to be (or sit in front of) the **Phase 2(b)
  client-scoped tier** (role/DocType allow-list, lower-privilege API user),
  plus its own access control in front (OAuth token verification — the SDK
  already has `token_verifier`/`auth_server_provider` hooks for this — or
  at minimum a dedicated gateway, never the bare Administrator key on the
  open internet).
- **Sequencing implication**: Phase 3 therefore depends on Phase 2(b)
  existing first (or being built alongside it), which in turn depends on a
  real client role to design the scoping against. Don't jump straight from
  "local dev tool works" to "expose it publicly" without that scoping step
  in between.

Not started. No hosting, transport, or auth decisions have been made yet —
this section exists so "can I reach this from anywhere" has a documented
answer (no, not yet, here's what it would take) rather than being
re-litigated from scratch next time it comes up.

## Sequencing

1. Phase 0 walkthrough — this week, blocks the rest
2. Scaffold `apps/mcp-server` (Python) with 3–5 read-only tools first — **done** (2026-09-12), see `apps/mcp-server/README.md`
3. Validate against the real dev instance — **done**, verified live against the Hetzner instance
4. Add write/action tools once read tools are solid — still blocked on Phase 0 (`docs/erp-inventory.md` doesn't exist yet)
5. Revisit Phase 2(b) only once there's a real client conversation asking for it
6. Revisit Phase 3 (remote access) only once Phase 2(b) exists — see above
