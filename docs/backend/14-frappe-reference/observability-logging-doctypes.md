# Frappe Native Logging / Audit DocTypes — Reference

**Status:** Reference, live-schema-verified 2026-09-23 against the running instance (`http://62.238.22.161:8080`, via the `ceylon-stack` MCP data connector, logged in as Administrator).
**Package:** O-1 (Observability & Audit Center — discovery only, no code).
**Purpose:** Per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md`, this is the Frappe-plumbing reference (`14-frappe-reference/`) backing the cross-cutting design in `docs/observability-architecture.md`. It is not a business-domain canonical mapping (no `docs/backend/<domain>/` doc applies — Observability/Audit is platform infrastructure, not an ERP domain), so it lives here rather than under a numbered domain folder.

All doctypes below are Frappe/ERPNext **core** (`module: Core`) — nothing here was added by `smart_factory` (verified: no `Error Log` / `trace_id` / `fingerprint` references anywhere in `apps/smart_factory`, and `smart_factory` currently exposes **zero** `@frappe.whitelist()` methods).

## Error Log

`FRAPPE_CURRENT_BEHAVIOR`. Frappe's own unhandled-exception store.

| Field | Type | Notes |
|---|---|---|
| `method` | Data | Used as the record's title |
| `error` | Code | Full traceback text |
| `trace_id` | Data | **Already exists natively** — a ready-made correlation-ID field |
| `fingerprint` | Data | Frappe's own error-grouping/dedup key |
| `fingerprint_stats` | HTML | Renders grouped-occurrence stats in Desk |
| `reference_doctype` / `reference_name` | Link / Data | Links the error to the document being processed, when known |
| `metadata` | Code | Free-form JSON |
| `seen` | Check | Read/unread flag |

**Implication for the mission:** the mission's proposed correlation-ID format (`CS-YYMMDD-XXXXXX`) has a native home to land in — `trace_id` — rather than needing a parallel error-storage doctype. Nothing currently writes to it from this project; `apps/frontend/src/lib/erpnext.ts`'s `erpnextFetch()` only sees the HTTP response Frappe already sent back, it never triggers a fresh `Error Log` write itself. Genuine server-side exceptions inside `smart_factory` (once it has any custom logic) would land here automatically via Frappe's own exception handling.

`NEEDS_VERIFICATION`: whether `trace_id` is populated automatically per-request by the framework, or only when explicit code passes it to `frappe.log_error(...)`. Determines whether reusing this field costs custom code or is close to free.

## Activity Log

`FRAPPE_CURRENT_BEHAVIOR`. Frappe's native login/logout + generic document-linked activity record.

| Field | Type | Notes |
|---|---|---|
| `subject` | Small Text | Required |
| `content` | Text Editor | Free text |
| `operation` | Select | **Fixed options: `Login`, `Logout`, `Impersonate` only** — no Create/Update/Submit/Cancel |
| `status` | Select | `Success`, `Failed`, `Linked`, `Closed` |
| `user` / `full_name` | Link(User) / Data | |
| `ip_address`, `communication_date` | Data / Datetime | |
| `reference_doctype`/`reference_name`, `timeline_doctype`/`timeline_name`, `link_doctype`/`link_name` | Link/Dynamic Link | Three independent linking mechanisms |

**Implication:** native `operation` values don't cover the mission's "Create/Submit/Cancel/Material Transfer/workflow action" business-activity list — that's `CEYLON_STACK_REQUIRED` regardless (see main doc). More importantly: **every write this app makes to ERPNext runs under one shared service account** (`frontend-integration@...` — see `apps/frontend/README.md`'s "Auth model" section, and the `addComment()` doc comment in `lib/erpnext.ts`). Any native `Activity Log`/`Version` record Frappe creates as a result of our server actions will show the **service account**, not the real human — the real identity only exists in this app's own `ceylon_session` cookie. `user` is a plain `Link(User)` field though, not auto-populated only from the session — a whitelisted method could legitimately set it to the real human's `User` record (they have one; `verifyErpNextLogin()` already authenticates their real ERPNext credentials) if we choose to log activity that way. That makes `Activity Log` a `NATIVE_EXTEND` candidate rather than requiring a brand-new doctype for user activity, provided `smart_factory` gains a whitelisted method to write it.

`NEEDS_VERIFICATION`: does `verifyErpNextLogin()`'s POST to `/api/method/login` (real human credentials, used only to verify — see docstring) itself create a native `Activity Log` "Login" entry under the real human's `User`? Plausible (it's Frappe's standard login endpoint) but unconfirmed.

## Version

`FRAPPE_CURRENT_BEHAVIOR`. Field-level diff engine backing Desk's document timeline and its "Audit Trail" report (below).

| Field | Type | Notes |
|---|---|---|
| `ref_doctype` | Link(DocType) | Required |
| `docname` | Data | Required |
| `data` | Code | JSON diff blob |
| `table_html` | HTML | Render-only |

Already consumed by this app: `getDocInfo()` in `lib/erpnext.ts` calls Frappe's `frappe.desk.form.load.get_docinfo` whitelisted method (the same one Desk's form sidebar uses) to fetch `comments` + `versions` + `infoLogs` for a document — direct `/api/resource/Version` REST reads 403 for the service account (documented in that function's comment), `get_docinfo` is the only viable path. This is the mechanism Phase 11 (Audit Trail) should extend, not replace.

## "Audit Trail" (Desk report/UI, not a stored table)

`FRAPPE_ONLY_IMPLEMENTATION_DETAIL`. Confirmed to exist as a doctype-like entry (`module: Core`), but its fields (`doctype_name`, `document`, `start_date`/`end_date`, `version_table`, `rows_added`, `rows_removed` — all `HTML`/`Section Break` except the two Link/Dynamic Link filters) show it's a **report page that queries `Version`**, not an independent stored audit table. Confirms `Version` is the single source of truth for field-change history — do not build a parallel one.

## Integration Request

`FRAPPE_CURRENT_BEHAVIOR`. Frappe's native shape for logging calls to/from external services (used by ERPNext's own payment-gateway integrations etc.).

| Field | Type | Notes |
|---|---|---|
| `request_id`, `integration_request_service`, `is_remote_request` | Data/Data/Check | |
| `status` | Select | `Queued`, `Authorized`, `Completed`, `Cancelled`, `Failed` |
| `url`, `request_headers`, `data` | Small Text/Code/Code | |
| `response_headers`, `output`, `error` | Code | |
| `reference_doctype` / `reference_docname` | Link / Dynamic Link | |

**Implication:** this is built for calls **ERPNext itself** initiates outward, not for inbound calls from `apps/frontend`. It is not automatically populated by our `erpnextFetch()` traffic. It's a strong shape match for Phase 12 (Integration Monitoring) if `smart_factory` gains a whitelisted method that lets our Next.js layer create `Integration Request` records for its own outbound calls — `NATIVE_EXTEND`, not automatic reuse.

## Other native logs verified present (Core module)

| DocType | Fields (verified) | Relevance |
|---|---|---|
| `Deleted Document` | `deleted_name`, `deleted_doctype`, `restored`, `new_name`, `data` | Native soft-delete/restore trail — relevant if any Cancel/Delete flow needs "what was removed" |
| `Permission Log` | `changed_by`, `changed_at`, `status` (Updated/Removed/Added), `for_doctype`/`for_document`, `reference`, `changes` | Native permission-change audit — out of scope for this mission's Phase 9-12, relevant context for Phase 13 |
| `View Log` | `viewed_by`, `reference_doctype`/`reference_name` | Native "who viewed this document" — not required by the mission, noted for completeness |
| `Access Log` | `export_from`, `user`, `reference_document`, `timestamp`, `file_type`, `method`, `report_name`, `filters` | Native report/data-export audit — narrower than general request logging |
| `API Request Log` | `path`, `method`, `user` | Thin — no timing, status, or correlation field; not a substitute for real request logging |
| `Scheduled Job Log` | `status` (Scheduled/Complete/Failed), `scheduled_job_type`, `details`, `debug_log` | Native background-job log — relevant only once `smart_factory` or `mes-service` register scheduled jobs (none currently found) |
| `Log Settings` / `Logs To Clear` | `logs_to_clear` (Table) | **Native retention/cleanup config** for Frappe's own logs (Error Log, Activity Log, etc.) — Phase 14 (retention) should extend this rather than invent a parallel cleanup job for anything stored natively |

## Summary for the classification table

See `docs/observability-architecture.md` for how these map to the mission's NATIVE / NATIVE_EXTEND / CEYLON_STACK_REQUIRED / NOT_REQUIRED classification per requirement area.
