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
   **Implemented 2026-09-23** as `/admin/observability` (not `/admin/system-logs` — the
   mission brief that authorized this package used "Observability" throughout, and no
   other admin section exists yet to disambiguate against), gated on O-2's
   `isSystemManager` (O-5, the finer role-tier extension this table originally proposed,
   was folded into O-2 already — see the Superseded note above). DEMO data only — see
   `docs/observability-frontend-architecture.md` for the full write-up.
6. **O-7** — Error Explorer (search by trace ID, filters, detail view) reading `Error Log`. (`frontend-dev`)
   **Implemented 2026-09-23** as `/admin/observability/errors` + `/admin/observability/traces/[traceId]`
   (Trace Detail folded into O-7 rather than split out — one investigation flow, per the
   mission brief this was built against). DEMO data only, same as O-6 — see
   `docs/observability-frontend-architecture.md`'s "O-7" section. Real `Error Log` reads
   still don't exist (see the `NEEDS_VERIFICATION` note below on REST read permissions) —
   `provider.ts`'s `getErrors`/`getTrace`/`getTechnicalDetails` are the seam waiting for them.
7. **O-8** — User Activity view reading `Activity Log` + the O-2 business-activity records. (`frontend-dev`)
8. **O-9** — Audit Trail view reading `Version` via `getDocInfo()`, per-document history navigation. (`frontend-dev`)
9. **O-10** — Integration monitoring via `Integration Request`-shaped records for our outbound calls. (`frappe-dev` + `frontend-dev`)
10. **O-11** — Manufacturing trace demonstration (end-to-end one-correlation-ID trace through a real Work Order flow), full test pass, documentation closure.

**Superseded note (2026-09-23):** this 10-package split was this doc's own proposal at the end of
O-1, written before Niroshan reviewed it. Niroshan's subsequent explicit package brief for "O-2 —
IDENTITY + CORRELATION FOUNDATION" (the mission text this package was actually built against)
redefined O-2's scope to bundle what this table lists separately as O-2 (backend API surface),
O-3 (frontend correlation propagation), and O-5 (session/role model) into one package — with an
explicit rationale (§4 below: splitting actor resolution from correlation ID generation would
recreate the "thread it through every page" anti-pattern one level up). That brief, not this
table, is the approved scope for what's implemented below; a `code-reviewer` pass flagged the
mismatch against this table as a possible unapproved scope expansion, which is why this note
exists — the brief is the real authorization, this table is now stale for O-2/O-3/O-5 specifically
and should be treated as superseded for those three rows. O-4 and O-6 through O-11 remain
un-started and this breakdown still applies to them.

**Second superseded note (2026-09-24):** this table's O-9/O-10 rows are also now stale.
Niroshan's explicit mission brief for Integration Monitoring assigned it **O-9** (not this
table's O-10), reusing the number this table had originally given to Audit Trail — which,
per O-8's own implemented scope, actually shipped bundled with User Activity as one "O-8"
package, never as its own separate O-9. The real-backend convergence/hardening package this
table doesn't separately name is now **O-10** — see
`docs/observability-frontend-architecture.md`'s "O-9: Integration Monitoring" section for
the full, current numbering and its documented O-10 gap list. Treat this table's O-8/O-9/O-10
rows as historical context only, not the current plan.

## O-2: Identity + Correlation Foundation (implemented, 2026-09-23)

**Status:** implemented, code-committed (`2e297fe`), backend live-tested and independently
reviewed (one real finding fixed — see "Independent code review" below); no complete
authenticated browser E2E (see limitations). Not self-declared `ACCEPTED`.

### 1. Trust boundary

- **Who authenticates the human?** `lib/erpnext.ts`'s `verifyErpNextLogin()` — one POST of the
  real email/password to Frappe's own `/api/method/login`. That's the only place a human's
  actual ERPNext credential is ever checked.
- **What's in `ceylon_session`?** `{ email, fullName, isSystemManager, exp }` (see §3 below for
  `isSystemManager`), HMAC-SHA256 signed (`lib/session.ts`), httpOnly, `secure` in production,
  `sameSite: "lax"`, 12h `maxAge` (`app/api/auth/login/route.ts`).
- **Can the browser forge identity or roles?** No. The cookie is httpOnly (JS on the page
  cannot read or write it) and HMAC-signed with `SESSION_SECRET` (server-only env var, never
  sent to the client) — a forged or tampered cookie value fails `verifySession()`'s signature
  check and is treated as no session at all. Nothing about identity or role is ever read from
  a request header or body field; `getActorContext()` (`lib/actorContext.ts`) is the only
  source, and it reads exclusively from the verified cookie.
- **Which server component asserts identity to Frappe, and how does Frappe know to trust it?**
  Frappe never independently verifies the *human's* identity on data calls — every ERPNext
  call from this app authenticates as the shared service account
  (`frontend-integration@ceylonstack.local`) via its API key/secret
  (`ERPNEXT_API_KEY`/`ERPNEXT_API_SECRET`, server-only, never reaches the browser). *That
  credential itself* is the real trust boundary: any request bearing it is, by construction,
  a request from Ceylon Stack's own trusted server code, since nothing else holds it. The
  actor identity riding inside that already-trusted channel (as a plain argument to
  `smart_factory.api.observability.log_operation`) is asserted, not independently
  re-authenticated by Frappe — this is a deliberate, documented trust model, not an oversight:
  security against a forged actor lives entirely in "only trusted Next.js server code ever
  constructs this call, from a server-verified session, never from client input" (see §7's
  `_check_caller()`), not in any Frappe-side re-verification of the human. This matches the
  pre-existing, already-documented limitation in `apps/frontend/README.md`'s "Auth model":
  ERPNext's own per-user permissions are not enforced today regardless — every logged-in
  person already effectively has the integration account's access, gated only by this app's
  UI. O-2 does not change that; it adds an *attribution* layer on top of it, not a new
  authorization layer underneath it.
- **What happens when identity is missing?** `getActorContext()` returns `null` rather than
  throwing; `reportOperation()`'s `actor` param is nullable throughout, so a missing actor
  still produces a valid (if less attributable) Error Log / Activity Log entry rather than
  blocking anything. In practice this should be rare: `middleware.ts` already rejects any
  request without a valid session for every route except `/login`.
- **What happens when identity is invalid (tampered/expired cookie)?** `verifySession()`
  already returns `null` for a bad signature or an expired `exp`; `middleware.ts` redirects to
  `/login`. Unchanged by O-2.
- **What happens when the correlation ID is missing or malformed?** Always regenerated. Both
  the frontend (`lib/correlationId.ts`'s `isValidCorrelationId()`) and the backend
  (`observability.py`'s `CORRELATION_ID_RE`) validate the exact `CS-\d{6}-[0-9A-F]{6}` shape;
  anything else is silently replaced with a freshly generated one rather than rejected — an
  inbound ID is a hint for trace continuity, never something the operation depends on.

### 2. No blind impersonation

`smart_factory.api.observability.log_operation` never calls `frappe.set_user()`. It always
runs as the execution principal (`frappe.session.user`, the service account) and instead
*attributes* the record to the actor via plain field values — `Activity Log.user` is set to
the actor's real `User` record when it resolves to one (`frappe.db.exists("User", actor_email)`
— see §7), otherwise falls back to the execution principal. Both identities are preserved in
every record: `Error Log.metadata` (JSON) always includes both `actor_email` /
`actor_full_name` and `execution_principal`; `Activity Log.content` always states both
("Actor: ... / Execution principal: ..."). Native `Version`/`owner`/`modified_by` on the
documents themselves are never touched — they continue to correctly show the service account
as who Frappe itself thinks made the change, which is architecturally true and shouldn't be
falsified.

### 3. Session / role strategy

Investigated storing the human's full ERPNext role list in the session cookie (as the original
mission text suggested) and chose not to: `apps/frontend/README.md`'s "Auth model" already
documents that ERPNext's own per-user permissions aren't enforced in this app at all today —
every logged-in person already has the integration account's effective access. Ceylon Stack
currently has exactly one access distinction that matters (system-manager-level vs not, for a
future Admin/System Logs gate), and inventing Support/Audit tiers with no real backing role
yet would be speculative. So `SessionPayload` gained one derived boolean,
`isSystemManager` (`lib/session.ts`), resolved once at login from real ERPNext role data via
`resolveActorRoles()` → `smart_factory.api.observability.resolve_actor_roles` → `frappe.get_roles(email)`
— never from anything the browser supplies. Kept deliberately small per the mission's own
"avoid unnecessarily large session payloads" guidance. **Staleness:** bounded by the existing
12h session TTL (`session.ts`'s `SESSION_TTL_MS`, already documented as "floor shift length,
not a SaaS remember-me") — a role revoked mid-session stays stale until re-login or natural
expiry, an accepted limitation consistent with that existing design, not a new one introduced
here. **Backward compatibility:** `isSystemManager` is optional on `SessionPayload`; a cookie
issued before this field existed parses fine and is treated as `false`.

### 4. Request context

No `AsyncLocalStorage`-based ambient context was built. Investigated it and rejected it as
premature for this package: Next.js Server Actions have no single hook every action already
passes through before its own code runs, so establishing ambient context would require
wrapping every action file's body — exactly the "page A/B/C manually send actor" pattern the
mission asked to avoid, just moved one level up. Instead, both correlation ID and actor are
resolved **inside `lib/erpnext.ts`'s `erpnextFetch()` and its write wrappers** — the one
chokepoint every current and future ERPNext call already goes through
(`FRONTEND_GUIDE.md`'s API-layer rule) — so no page or action file needs to change at all.
Actor resolution (`getActorContext()`, a `cookies()` read + HMAC verify) only happens on the
error path and inside the write wrappers (`createDoc`/`updateDoc`/`deleteDoc`), not on every
plain read, to avoid adding cost to the common case.

### 5. Correlation ID lifecycle

Format: `CS-YYMMDD-XXXXXX` (UTC date + 6 hex chars from `crypto.randomUUID()`,
`lib/correlationId.ts`). Always generated server-side, per logical write/error — never
client-supplied, never trusted as-is from an inbound value (regenerated if malformed on both
frontend and backend). One ID is generated per `erpnextFetch()` call by default; the write
wrappers (`createDoc`/`updateDoc`/`deleteDoc`) generate one ID and pass it through both the
actual ERPNext call and the subsequent activity report, so a single business operation's
success/failure report shares the ID with its own ERPNext request. `ErpNextError` now carries
`correlationId` as a field — safe to surface to the user as a support reference (Phase 6 of
the original mission; not yet wired into any UI — deferred to a future package, out of scope
for this foundation). Backend: `Error Log.trace_id` is the canonical store (native field,
confirmed in O-1). Multi-call operations that want one shared ID across several
`erpnextFetch()` calls can pass one explicitly via `opts.correlationId` (not yet needed by any
existing call site — `createDoc`/`updateDoc`/`deleteDoc` are each a single call). Deliberately
NOT built: `AsyncLocalStorage`-based automatic sharing across an entire multi-call action — see
§4; flagged as a future option if a real multi-call correlation need shows up, not built
speculatively now.

### 6/7. smart_factory API surface (backend propagation)

New module: `apps/smart_factory/smart_factory/api/observability.py` — establishes the pattern
for future Ceylon Stack backend extensions (one `api/<module>.py` per concern, one shared
caller-identity check, explicit field allowlist, no arbitrary client data). Two
`@frappe.whitelist()` methods:

- **`log_operation(correlation_id, actor_email, actor_full_name, severity, operation, reference_doctype, reference_name, message, detail)`**
  — ERROR/CRITICAL severities write native `Error Log` (`trace_id` = correlation ID,
  `metadata` = JSON with both actor and execution-principal identity). Any call naming a
  business `operation` (regardless of severity) also writes native `Activity Log`, attributed
  to the actor's real `User` record when `actor_email` resolves to one, `status` set to
  `Success`/`Failed` from severity. Never raises for expected failure modes — internal
  Error Log / Activity Log write failures are caught and meta-logged via `frappe.log_error()`,
  never surfaced to the caller.
- **`resolve_actor_roles(email)`** — returns the real ERPNext roles for a human right after
  they pass `verifyErpNextLogin()`, via `frappe.get_roles()`. Used once at login (§3).

**Authentication/trust check:** both methods call `_check_caller()`, which requires
`frappe.session.user == "frontend-integration@ceylonstack.local"` (the one service account
`apps/frontend` uses — not a secret, only its key/secret are, so hardcoding the email as an
allowlist is safe) — live-verified to reject any other caller (see Testing). No new ERPNext
Role was created or granted; this avoids a live-server provisioning dependency for this
package, at the cost of the allowlist being an email-equality check rather than a role
membership check. **NEEDS_VERIFICATION-adjacent design note, not a defect:** if the service
account's identity ever changes, this constant needs updating alongside it.

**Input validation:** `severity` is validated against `{INFO, WARNING, ERROR, CRITICAL}`
(defaults to `INFO` if invalid); `reference_doctype`/`reference_name` are only attached if
`reference_doctype` names a real DocType *and* `reference_name` names a document that
currently exists (see the real bug found in Testing below for why the existence check, not
just the DocType check, is required); all free-text fields are length-truncated before
persisting. No request/response body is ever accepted or stored — only this fixed, named
field set.

### 8. Future Audit Trail join

Deliberately built nothing new for field-level diffs — native `Version` (already reachable via
`getDocInfo()`, confirmed in O-1) remains the sole source for "old value → new value". This
package's contribution is the join key: any future Audit Trail view can correlate a `Version`
row (via its `ref_doctype`/`docname`/timestamp) with the `Activity Log` row this package now
writes for the same operation (same `reference_doctype`/`reference_name`, close timestamp,
same correlation ID visible in `content`) to recover the real actor `Version` alone can't show
— see O-1's "shared-service-account identity gap" finding. No schema change to `Version`
itself; nothing here duplicates its storage.

### 9. Central erpnext.ts integration

All wiring lives in `lib/erpnext.ts`, `lib/erpnextAuth.ts` (auth/BASE_URL split out to avoid a
circular import between `erpnext.ts` and the new `lib/observability.ts`), `lib/actorContext.ts`,
`lib/correlationId.ts`, `lib/observability.ts`, and `lib/redact.ts`. Zero page/`actions.ts`
files were changed — every existing and future caller of `createDoc`/`updateDoc`
(incl. `submitDoc`/`cancelDoc`, which now pass a labeled `operation` through it)/`deleteDoc`
inherits correlation ID generation and actor-attributed activity reporting automatically;
every `erpnextFetch()` failure (all 20+ existing exported functions funnel through it)
inherits correlation ID generation and error reporting automatically. `callMethod`/
`callDocMethod`/`callRunDocMethod`/`runReport`/list-and-get reads were deliberately **not**
instrumented with business-activity reporting (only their *failures* get a correlation ID +
Error Log report, same as everything else) — they're either read-only or too varied in
purpose (e.g. `callMethodWithResult` backs both real writes and pure info-fetches like
`get_auto_data`) to label meaningfully without guessing; scoped out of this foundation
package, left for a future package if real activity-log gaps show up in practice.

Success-path activity reporting and failure-path error reporting are both deferred via
Next.js 16's `after()` (`next/server`) so neither adds latency to the request they describe —
confirmed available and stable for Server Actions/Route Handlers in the installed Next 16.3.5
(`node_modules/next/dist/docs/.../after.md`). `actor` is always resolved *before* scheduling
`after()`, not inside its callback — Next.js forbids calling `cookies()` inside an `after()`
callback from a Server Component (only Server Actions/Route Handlers may), and `erpnextFetch()`
is called from both.

### 10. Redaction

Everything sent to `smart_factory.api.observability.log_operation` is built from a fixed,
named field list (`lib/observability.ts`'s `ReportOperationArgs`) — never a raw request/response
body dump. `lib/redact.ts`'s `redactString()` is defense-in-depth on top of that allowlist,
applied to the free-text `message`/`detail` strings only, stripping `Authorization:` headers,
`token`/`Bearer` values, `ceylon_session=` cookie values, and `password`/`secret`/`api key`-style
key=value pairs. The raw `ceylon_session` cookie value itself is never read into any log —
only its already-verified, decoded `email`/`fullName`/`isSystemManager` payload is.

### 11. Failure / degradation behavior

Telemetry failure never blocks or fails the business operation it describes: `reportOperation()`
(`lib/observability.ts`) catches every error internally and returns a `recorded: false` result
rather than throwing; `scheduleFailureReport()`/`reportBusinessActivity()` in `erpnext.ts` wrap
the `after()` scheduling call itself in try/catch too. On the backend, `log_operation()` catches
Error Log / Activity Log write failures independently (one store's failure doesn't block the
other) and meta-logs via `frappe.log_error()` rather than raising. **Distinction the mission
asked for:** this means a write can succeed while its observability record silently doesn't
land — Ceylon Stack does not currently claim a hard audit guarantee (e.g. "every Submit is
provably logged"); it's best-effort telemetry layered over ERPNext's own unconditional native
`Version` history, which remains authoritative regardless of whether this package's Activity
Log attribution succeeded for any given call.

### Testing

Executed against the live Hetzner instance (`bench --site frontend console`, service account
switched via `frappe.set_user()` for the success-path cases) and locally:

- ✅ Unauthenticated HTTP call to both new endpoints → `403` (curl, no credentials).
- ✅ Authenticated-as-wrong-user call (Administrator, not the service account) →
  `frappe.PermissionError` raised, nothing written.
- ✅ Malformed inbound `correlation_id` → replaced with a freshly generated valid one.
- ✅ `CRITICAL` severity → both `Error Log` (`trace_id` set) and `Activity Log` written.
- ✅ `INFO` severity → `Activity Log` only, no `Error Log` row (kept clean of routine noise).
- ✅ `resolve_actor_roles("Administrator")` → real role list + `is_system_manager: true`.
- ✅ `resolve_actor_roles()` for a nonexistent user → safe empty result, no error.
- ✅ **Real bug found and fixed during testing:** a `reference_doctype`/`reference_name` naming
  a document that no longer exists (e.g. reporting a `delete` operation *after* the delete
  already succeeded, or any stale reference) made the entire `Activity Log` write silently
  fail — `Activity Log.reference_name` is a Dynamic Link, and beyond the generic link
  validation `ignore_links=True` skips, `Activity Log`'s own `validate()` hook
  (`set_timeline_doc`) unconditionally calls `frappe.get_doc(reference_doctype, reference_name)`
  with no flag to suppress it. Fixed by checking the referenced document actually exists
  (not just that the DocType exists) before attaching it as a reference — a dangling
  reference now degrades gracefully (activity still logged, reference field just omitted)
  instead of losing the whole record. Re-verified: dangling reference → logged without the
  link; real reference → correctly attached. All test records cleaned up from the live
  instance afterward.
- ✅ `npx tsc --noEmit`, `npx eslint` (scoped to this package's files), and `npm run build`
  (full project) all run clean.
- ✅ Dev server boots cleanly (`npm run dev`), unauthenticated routes behave correctly
  (`/login` → 200, `/` → 307 redirect via existing `middleware.ts`, unchanged by O-2).
- ❌ **Not executed:** a full authenticated browser flow (real human login → a real write →
  confirming the resulting `Activity Log` entry appears attributed to that human, and that a
  real ERPNext validation failure produces a correlation ID visible to a real request) — this
  needs a real ERPNext user's login password, which this session was not given and should not
  request or handle. Flagged for `qa-tester` or Niroshan to close with real credentials.

### Independent code review (2026-09-23)

A `code-reviewer` pass against the code found one real, blocking issue and confirmed
everything else in this doc's claims by tracing the actual code, not just reading the comments:

- **Fixed:** `lib/redact.ts`'s `Authorization:` pattern only matched the scheme word
  ("Bearer"/"token"), not the credential after it — `PATTERNS.reduce()` applies patterns
  sequentially over the same string, so by the time the `Bearer`/`token` patterns ran, the word
  they match on had already been consumed by the broken `Authorization:` pattern, leaving the
  actual secret untouched in the output. Fixed to capture "Authorization:" plus up to two
  whitespace-separated tokens in one match (covers both "Bearer &lt;token&gt;" and "token
  &lt;key&gt;:&lt;secret&gt;" shapes), verified against representative inputs with a standalone
  node script (Bearer/JWT, `token key:secret`, `ceylon_session=...`, `password: ...` — all now
  fully redacted; ordinary text with no secrets passes through unchanged).
- **Confirmed, not just claimed:** actor/role forgery is impossible via this chain (traced end
  to end — `getActorContext()` is the only source, reads only the HMAC-verified cookie);
  `after()`/`cookies()` ordering holds against the actual Next 16 docs and both real call sites;
  no circular import between `erpnext.ts` and `observability.ts`; `_check_caller()` has no
  bypass within this diff's surface; all 29 existing `updateDoc()` call sites remain valid
  against the new optional 4th parameter; an old session cookie without `isSystemManager`
  parses correctly.
- **Minor, non-blocking:** `actor_full_name`/`actor_email` aren't length-truncated in
  `observability.py` before being persisted (inconsistent with `message`/`detail`/`operation`,
  which are) — can only fail safely (whole write silently dropped via the existing try/except),
  not crash the caller. Left as a follow-up rather than blocking this package.
- **Scope concern, addressed above:** flagged that this package's actual scope (session/role +
  correlation propagation + backend API surface, all together) didn't match this doc's own
  O-2/O-3/O-5 split from the end of O-1 — resolved by the "Superseded note" added to the
  "Proposed package breakdown" section above: Niroshan's explicit O-2 package brief, not that
  table, is what this was actually built against.

### Known limitations / NEEDS_VERIFICATION

- The full end-to-end authenticated-browser trace is not yet demonstrated (see Testing above)
  — recommended as part of `qa-tester`'s pass or a Manufacturing-domain trace demonstration in
  a later package (the original mission's Phase 16).
- `_check_caller()`'s allowlist is an email-equality check against the one known service
  account, not an ERPNext Role membership check — see §6/7 for why, and what would need to
  change if the service account's identity is ever rotated.
- Correlation ID is not yet surfaced anywhere in the UI (no `error.tsx`/`global-error.tsx`
  exists yet — confirmed absent in O-1, still true) — `ErpNextError.correlationId` exists and
  is populated, ready for a future package to render it.
- `actor_full_name`/`actor_email` aren't length-truncated in `observability.py` (code review
  finding, non-blocking — see above).
- **This package's working-tree diff was discarded outside git twice during implementation**
  (once independently confirmed by a `code-reviewer` subagent whose own `git`/`find` checks came
  back empty against the same paths mid-review) — each time rebuilt from the session's own
  record of what it had just written and already live-tested, verified byte-identical against
  the live Hetzner deployment (`observability.py`, unaffected both times since it was deployed
  via a separate SSH/docker action). The code is now committed (`2e297fe`), which should make it
  resilient to a further working-tree-level discard; see `PROGRESS.md`'s O-2 entry for the full
  account.

## Needs verification (flagged, not yet logged to `docs/backend/99-unverified/`)

`docs/backend/99-unverified/unverified-behaviours.md` has pre-existing uncommitted changes from other in-progress work at the time of this discovery pass — appending here risked colliding with that edit, so these are tracked in this doc for now and should be merged into `99-unverified/` in a follow-up once that file's pending edit is resolved/committed:

- Does `verifyErpNextLogin()`'s call to `/api/method/login` create a native `Activity Log` "Login" entry under the real human's `User`, or does something about the service-account architecture suppress it?
- Is `Error Log.trace_id` populated automatically per-request by the framework, or only when code explicitly passes it to `frappe.log_error(...)`?
- Exact permission requirements for the service account to read `Error Log` / `Activity Log` / `Version` via REST (the existing `get_docinfo` 403-workaround in `erpnext.ts` suggests direct REST reads on at least `Version` are blocked for this account — likely true for `Error Log`/`Activity Log` too, meaning O-7/O-8/O-9 will need whitelisted read methods, not raw `/api/resource/...` calls).
