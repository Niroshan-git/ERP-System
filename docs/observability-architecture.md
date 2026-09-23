# Observability, Audit & System Logging — Architecture (Package O-1: Discovery)

**Status:** DRAFT — output of Package O-1 (discovery only, no code changed). Not binding like `docs/controls/`; this is a design/planning doc, same tier as `docs/architecture.md`.
**Origin:** Niroshan requested a full Ceylon Stack Observability & Audit Center as one 19-phase end-to-end mission. That conflicts with `docs/controls/AGENT_USAGE_POLICY.md` §3/§8/§10.6 ("build the whole module" is an explicitly invalid package) and the Current Mission priority lock in `CLAUDE.md` (this initiative isn't on it). Niroshan approved treating it as a new tracked initiative, broken into small packages, starting with this read-only discovery pass. See the package breakdown at the end of this doc.
**Companion doc:** `docs/backend/14-frappe-reference/observability-logging-doctypes.md` — the live-verified native DocType field reference this design draws on.

## What exists today (baseline)

- **API layer:** `apps/frontend/src/lib/erpnext.ts` — the single chokepoint for all ERPNext calls (`erpnextFetch()`), per `FRONTEND_GUIDE.md`. On any non-2xx response or network failure it calls `logError()` and throws (`ErpNextError`, carrying `status` + a sanitized `erpnextMessage` extracted from Frappe's own validation message — HTML-stripped, already distinguishing "safe business message" from raw body).
- **Existing logging utility:** `apps/frontend/src/lib/errorLog.ts` — dev-only. Appends JSON lines to a gitignored `logs/error.log` for local tailing. In production it's skipped entirely in favor of a bare `console.error`, relying on Vercel's ephemeral function logs. No correlation ID, not queryable, no admin surface, no severity levels, no redaction step.
- **Session/auth model:** `apps/frontend/src/lib/session.ts` — a signed HMAC cookie (`ceylon_session`) holding `{ email, fullName, exp }` only. **No role field exists in the session today.** All ERPNext writes run under one shared service account (`frontend-integration@...`, see `apps/frontend/README.md`), not the real human's identity — `verifyErpNextLogin()` checks the real person's credentials once at login, but that identity never reaches ERPNext's own writes afterward.
- **Error boundaries:** no `error.tsx` or `global-error.tsx` exists anywhere under `apps/frontend/src/app/` — unhandled errors currently fall through to Next.js's default crash page, with no correlation ID and no safe user-facing message.
- **Custom backend surface:** `apps/smart_factory` currently exposes **zero** `@frappe.whitelist()` methods. Any backend-side observability work (writing our correlation ID into `Error Log.trace_id`, logging `Activity Log` under the real human, a role-lookup endpoint, `Integration Request`-shaped records for our own outbound calls) requires creating the app's first custom API surface.

## Phase 1 classification

| Requirement area | Classification | Reasoning |
|---|---|---|
| Backend exception storage | **NATIVE** | `Error Log` already has `trace_id`, `fingerprint`, `error`, `method`, `metadata`, `reference_doctype`/`reference_name` — built for exactly this. |
| Document field-change history | **NATIVE** | `Version` (+ Desk's own "Audit Trail" report, confirmed to be a UI over `Version`, not a separate table) is the real mechanism; already partially wired via `getDocInfo()` in `erpnext.ts`. |
| Login/logout capture | **NATIVE** (unconfirmed extent) | `Activity Log`'s `operation` Select natively supports `Login`/`Logout`/`Impersonate`. `NEEDS_VERIFICATION`: whether `verifyErpNextLogin()`'s real-credential check already triggers this automatically. |
| Native log retention/cleanup | **NATIVE** | `Log Settings` + `Logs To Clear` already manage retention for Frappe's own logs — extend, don't duplicate. |
| Business-activity capture (Create/Submit/Cancel/Material Transfer/workflow actions) | **NATIVE_EXTEND** | `Activity Log`'s `operation` values don't cover these, but `user`/`reference_doctype`/`reference_name`/`content` are generic enough that a `smart_factory` whitelisted method can write real business-activity rows under the *real human's* `User` record instead of the service account — avoids a parallel doctype. |
| Correlating our errors with `Error Log` | **NATIVE_EXTEND** | Reuse `trace_id` as (or paired with) our correlation ID, once a `smart_factory` whitelisted method threads it through. |
| Integration/API-call monitoring (Next.js → ERPNext direction) | **NATIVE_EXTEND** | `Integration Request` is the right shape (`status`, `url`, headers, `output`/`error`, reference doctype/name) but is built for ERPNext-initiated outbound calls, not inbound REST from us — needs a `smart_factory` method to create records on our behalf. |
| Correlation-ID generation/propagation (UI → server action → API layer → ERPNext → response) | **CEYLON_STACK_REQUIRED** | Nothing native generates or threads an app-level trace ID through this specific path. |
| Central frontend/server logging abstraction (structured, severity, source, redaction) | **CEYLON_STACK_REQUIRED** | `errorLog.ts` today is dev-only, unstructured, unqueryable. Must read/write through native stores where possible (see rows above), not duplicate them, but the abstraction layer itself doesn't exist. |
| Sanitization/redaction of secrets | **CEYLON_STACK_REQUIRED** | No centralized redaction exists anywhere in the request path today. |
| User-facing safe error + reference ID | **CEYLON_STACK_REQUIRED** | No `error.tsx`/`global-error.tsx` exists; server actions currently propagate raw errors. |
| Role-gated Admin/System Logs access | **CEYLON_STACK_REQUIRED** | The session has no role concept at all yet — this is a prerequisite, not just a filter on an existing permission system. |
| Admin System Logs UI (Overview/Errors/Activity/Audit/Integrations) | **CEYLON_STACK_REQUIRED** | New frontend routes, reading from the native + extended stores above. |
| SQL query profiling (`Recorder`/`Recorder Event`/`Recorder Query`) | **NOT_REQUIRED** | Dev-only DB profiler, not admin-facing observability — out of scope. |
| A parallel audit database | **NOT_REQUIRED** | Explicitly ruled out by the mission itself and by `Version` already covering this natively. |

## Key architectural risk: the shared-service-account identity gap

This is the single biggest finding from discovery. Every write this app makes to ERPNext — Create, Update, Submit, Cancel, Material Transfer, everything — happens under one shared Frappe user (`frontend-integration@...`). Native `owner`/`modified_by` on any document, and any `Version`/`Activity Log` record Frappe generates as a side effect, will show that service account, **not** the real human who clicked the button in the browser. The real identity exists only in the app-level `ceylon_session` cookie (`email` + `fullName`, no role), and today it never travels any further than session validation.

Practically: **Audit Trail (Phase 11)** and **User Activity (Phase 10)** cannot answer "who did this" from native Frappe records alone. Either has to be solved once, centrally (a `smart_factory` whitelisted method that accepts the real human's identity from the frontend and writes it explicitly into `Activity Log.user` / a correlation record), not patched per-page later. This should be built as part of the central logging service (see package breakdown), not deferred.

The same gap blocks **Phase 13 (Access Control)** at its foundation: there is no role tier in the session today, so "System Manager / Support / Audit / Normal user" has nothing to gate on yet.

## Correlation ID design (proposal, not yet implemented)

Format: `CS-YYMMDD-XXXXXX` (date + 6 base32/hex chars from `crypto.randomUUID()`), matching the mission's example (`CS-260923-F82A41`).

Generation point: at the entry of each server action (or a shared wrapper around them), not the browser — so the ID is trustworthy enough to correlate with backend records rather than being client-suppliable. Threaded through:
1. Server action generates the ID, attaches it to whatever it logs locally.
2. Passed explicitly into `erpnextFetch()` calls (new optional param) so `logError()` entries carry it.
3. Passed into any `smart_factory` whitelisted-method calls, which write it into `Error Log.trace_id` / the new business-activity record, so a backend-side failure is correlatable with the same ID the user sees.
4. Surfaced to the user only on failure, in a safe message ("Unable to submit Work Order WO-00042. Reference: CS-260923-F82A41.") — never on success paths.

This is a proposal for the next package to implement and validate against real request flow, not a committed design.

## Proposed package breakdown

Each is one session, one package, with its own code review / QA per `docs/controls/AGENT_USAGE_POLICY.md` and `CLAUDE.md`'s Package Closure Rules — not one combined session:

1. **O-2** — `smart_factory`'s first whitelisted API surface: correlation-aware error logging (write to `Error Log.trace_id`) + a business-activity write method that records the real human's identity. (`frappe-dev`)
2. **O-3** — Frontend central logging abstraction: correlation ID generation/propagation through `erpnext.ts` and server actions, replacing `errorLog.ts`. (`frontend-dev`)
3. **O-4** — Redaction/sanitization layer + safe user-facing error UI with reference ID (`error.tsx`/`global-error.tsx`). (`product-designer` + `frontend-dev`)
4. **O-5** — Session/role model extension (adds a role tier to `ceylon_session`, sourced from the real user's ERPNext roles) — prerequisite for Phase 13 access control. (`frappe-dev` + `frontend-dev`)
5. **O-6** — Admin `/admin/system-logs` shell + Overview tab, gated on O-5's roles. (`frontend-dev`)
6. **O-7** — Error Explorer (search by trace ID, filters, detail view) reading `Error Log`. (`frontend-dev`)
7. **O-8** — User Activity view reading `Activity Log` + the O-2 business-activity records. (`frontend-dev`)
8. **O-9** — Audit Trail view reading `Version` via `getDocInfo()`, per-document history navigation. (`frontend-dev`)
9. **O-10** — Integration monitoring via `Integration Request`-shaped records for our outbound calls. (`frappe-dev` + `frontend-dev`)
10. **O-11** — Manufacturing trace demonstration (end-to-end one-correlation-ID trace through a real Work Order flow), full test pass, documentation closure.

## Needs verification (flagged, not yet logged to `docs/backend/99-unverified/`)

`docs/backend/99-unverified/unverified-behaviours.md` has pre-existing uncommitted changes from other in-progress work at the time of this discovery pass — appending here risked colliding with that edit, so these are tracked in this doc for now and should be merged into `99-unverified/` in a follow-up once that file's pending edit is resolved/committed:

- Does `verifyErpNextLogin()`'s call to `/api/method/login` create a native `Activity Log` "Login" entry under the real human's `User`, or does something about the service-account architecture suppress it?
- Is `Error Log.trace_id` populated automatically per-request by the framework, or only when code explicitly passes it to `frappe.log_error(...)`?
- Exact permission requirements for the service account to read `Error Log` / `Activity Log` / `Version` via REST (the existing `get_docinfo` 403-workaround in `erpnext.ts` suggests direct REST reads on at least `Version` are blocked for this account — likely true for `Error Log`/`Activity Log` too, meaning O-7/O-8/O-9 will need whitelisted read methods, not raw `/api/resource/...` calls).
