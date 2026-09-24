# Frappe Native Logging / Audit DocTypes — Reference

**Status:** Reference, live-schema-verified 2026-09-23 against the running instance (`http://62.238.22.161:8080`, via the `ceylon-stack` MCP data connector, logged in as Administrator). **Updated 2026-09-24 (O-10B):** several O-1-era `NEEDS_VERIFICATION` items resolved against real data; `Version.data`'s real JSON shape and `Activity Log.content`'s real embedded-correlation/actor format documented for the first time.
**Package:** O-1 (Observability & Audit Center — discovery only, no code); addenda from O-10B (real read foundation).
**Purpose:** Per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md`, this is the Frappe-plumbing reference (`14-frappe-reference/`) backing the cross-cutting design in `docs/observability-architecture.md`. It is not a business-domain canonical mapping (no `docs/backend/<domain>/` doc applies — Observability/Audit is platform infrastructure, not an ERP domain), so it lives here rather than under a numbered domain folder.

All doctypes below are Frappe/ERPNext **core** (`module: Core`) — nothing here was added by `smart_factory` beyond the `api/observability.py` whitelisted methods that read/write them (O-2's writes, O-10B's reads).

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

**Implication for the mission:** the mission's proposed correlation-ID format (`CS-YYMMDD-XXXXXX`) has a native home to land in — `trace_id` — rather than needing a parallel error-storage doctype. `apps/smart_factory`'s O-2 package (`api/observability.py`'s `log_operation`) now writes it explicitly for every ERROR/CRITICAL Ceylon Stack telemetry event. Genuine server-side exceptions inside `smart_factory` (once it has any custom logic) land here automatically via Frappe's own exception handling.

**RESOLVED (O-10B, live-verified 2026-09-24):** `trace_id` is populated **only when explicit code sets it** — never automatically by the framework. Confirmed by direct inspection of real `Error Log` rows on the live instance: every framework-generated exception (a `wkhtmltopdf` PDF-rendering failure, a malformed `run_doc_method` call, an internal `'NoneType' object has no attribute...`) has `trace_id: null`; only rows written by this project's own `log_operation` have it set. Practical implication for O-10B's read API: `Error Log` is a genuine mix of Ceylon Stack telemetry and unrelated Frappe/framework noise — any read query over this table that means "Ceylon Stack's own correlated errors" must filter `trace_id is set` explicitly, never assume every row is relevant.

**RESOLVED (O-10B, live-verified 2026-09-24):** direct `/api/resource/Error Log` REST reads were not re-tested (moot — see below), but a **privileged backend read** (a `smart_factory` whitelisted method using `frappe.get_all()`/`frappe.db.count()`, the same pattern `log_operation`'s writes already use via `ignore_permissions=True`) reads `Error Log` without any permission friction — the O-1-era assumption that reads would need the same `get_docinfo`-style workaround `Version` needed does not apply once the read happens through a whitelisted method rather than raw `/api/resource/...` REST.

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

**Largely RESOLVED (O-10B, live-verified 2026-09-24):** real `Activity Log` rows confirm Frappe's `/api/method/login` endpoint does create native `Login`/`Logout` entries automatically — including a `status: "Failed"`, `user: "owner@gym-demo.test"`, `subject: "Invalid login credentials"` row that can only plausibly have come from an app-level login attempt (not a Desk browser session) against a non-Administrator account, i.e. exactly the shape `verifyErpNextLogin()`'s POST would produce. Not a controlled, this-app-specific test (the O-2 package that owns `verifyErpNextLogin()` did not run one), so treat this as strong observational evidence, not a direct confirmed test.

**New finding (O-10B, live-verified 2026-09-24):** `Activity Log` rows written by `smart_factory.api.observability.log_operation` embed both the correlation ID and the real human actor as **plain text lines inside `content`**, not as dedicated fields — `content` is literally `"Correlation: <id>\nActor: <name> <<email>>\nExecution principal: <email>\n<message>"` (the `Actor:` line only present when `actor_email` was supplied). `operation` (the fixed Login/Logout/Impersonate Select) is **never** set by `log_operation` — the business-activity label lives entirely in `subject`. O-10B's read API recovers both the correlation ID and actor from `content` via regex against this exact format (`_extract_actor_from_activity_content`/`_extract_correlation_from_activity_content` in `api/observability.py`) rather than adding new dedicated fields — a live, deliberate design choice, not a workaround for a blocker. **Also observed live:** at least one real `Activity Log` row has `actor_email` present in its sibling `Error Log.metadata` but its own `content`'s `Actor:` line has no `<email>` bracket at all (`"Actor: Ceylon Stack \n"`) — the parser correctly returns no actor for this row rather than guessing; flagged as real-data messiness worth remembering, not a parser bug (see `PROGRESS.md`'s O-10B entry).

## Version

`FRAPPE_CURRENT_BEHAVIOR`. Field-level diff engine backing Desk's document timeline and its "Audit Trail" report (below).

| Field | Type | Notes |
|---|---|---|
| `ref_doctype` | Link(DocType) | Required |
| `docname` | Data | Required |
| `data` | Code | JSON diff blob |
| `table_html` | HTML | Render-only |

Already consumed by this app: `getDocInfo()` in `lib/erpnext.ts` calls Frappe's `frappe.desk.form.load.get_docinfo` whitelisted method (the same one Desk's form sidebar uses) to fetch `comments` + `versions` + `infoLogs` for a document — direct `/api/resource/Version` REST reads 403 for the service account (documented in that function's comment), `get_docinfo` is the only viable path **for a per-document lookup**.

**O-10B addendum (live-verified 2026-09-24):** for a *general*, filterable, paginated Audit Trail (not scoped to one already-known document), `get_docinfo` is the wrong tool — it always returns comments+versions+infoLogs bundled for exactly one `doctype`+`name`, with no filter/pagination contract of its own. `smart_factory.api.observability.list_audit` instead reads `Version` directly via `frappe.get_all()` inside a whitelisted method (the same "privileged read bypasses the REST 403" pattern documented above for `Error Log`) — `get_docinfo`'s 403 workaround was a limitation of *unprivileged* REST access, not of `Version` itself.

**`Version.data`'s real JSON shape, live-verified against real `Work Order` versions (not assumed from Frappe source):**
```json
{
  "added": [],
  "changed": [["fieldname", "previousValue", "newValue"], ...],
  "removed": [],
  "row_changed": [
    ["child_table_fieldname", rowIndex, "childRowName",
      [["child_fieldname", "previousValue", "newValue"], ...]]
  ],
  "data_import": null,
  "updater_reference": null
}
```
`changed` covers simple field-level diffs (a `null` `previousValue` means the field was newly set; a `null` `newValue` means it was cleared — used by O-10B's `AuditChangeType` derivation). `row_changed` covers per-row child-table field changes; `added`/`removed` (whole rows added/removed) were `[]` in every real sample observed so far — their exact populated shape remains `NEEDS_VERIFICATION` against a real add/remove-row edit, handled defensively (a conservative summary, never a guessed per-field diff) by O-10B's `normalizeVersionData()` until then. `docstatus` transitions inside `changed` (`0`->`1`, `1`->`2`) are the reliable, native signal for "this Version represents a Submit/Cancel," used by O-10B to derive a human-readable `action` label without inventing one.

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

**Implication:** this is built for calls **ERPNext itself** initiates outward, not for inbound calls from `apps/frontend`. It is not automatically populated by our `erpnextFetch()` traffic. It's a strong shape match for Integration Monitoring if `smart_factory` gains a whitelisted method that lets our Next.js layer create `Integration Request` records for its own outbound calls — `NATIVE_EXTEND`, not automatic reuse.

**RESOLVED (O-10B, live-verified 2026-09-24):** confirmed **zero rows** exist in `Integration Request` on the live instance — the `NATIVE_EXTEND` path above has not been built, and no other backend surface records this app's own outbound calls as integration events either. Classified `NOT_CURRENTLY_AVAILABLE` per the O-10B mission's own classification scheme — Integration Monitoring's provider methods (`getIntegrationSummary`/`getIntegrationEvents`) honestly return zero/empty results rather than fabricating figures. Building the `NATIVE_EXTEND` write path (a `log_integration_event`-style whitelisted method, or extending `log_operation` itself with `integration`/`integrationType`/`durationMs` fields) remains a real, undone backend task for a future package, not something O-10B's read-only scope could close.

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
