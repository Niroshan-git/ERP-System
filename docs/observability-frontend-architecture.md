# Observability Center — Frontend Architecture

**Status:** Package O-6 (2026-09-23) — navigation shell + Observability Overview screen —
Package O-7 (2026-09-23) — Error Explorer + Trace Detail — and Package O-8 (2026-09-23) —
User Activity + Audit Trail — all implemented. DEMO data only throughout. Not binding like
`docs/controls/`; same tier as
`docs/architecture.md` and `docs/observability-architecture.md` (the backend-side sibling
doc this one builds on top of — read that one first for the trust model, actor-vs-
execution-principal design, and correlation-ID lifecycle this frontend layer displays but
does not define).

**Scope note:** the original mission brief for this package asked for six full screens
(Overview, Error Explorer, Trace Detail, User Activity, Audit Trail, Integrations) plus
their full data architecture in one session. That conflicts with
`docs/controls/AGENT_USAGE_POLICY.md`'s package-size discipline and with this same
initiative's own proposed breakdown (`docs/observability-architecture.md`'s "Proposed
package breakdown": O-6 through O-10, five separate sessions). Niroshan was asked and
chose the compliant path: this package (O-6) is the navigation shell, the shared data
layer, and the Overview screen only. Error Explorer (O-7), Trace Detail (also O-7 per the
UX being one investigation flow), and User Activity + Audit Trail (O-8, built together
per their own mission brief since the two screens are "one investigation system" rather
than independent features) are each their own package, building on the foundation below.
Integration Monitoring (O-10) remains a future package.

## What this package built

- **Navigation:** an "Admin" module in `Sidebar.tsx`, visible only when the signed-in
  session's `isSystemManager` is true (`ModuleDef.requiresSystemManager`), containing one
  "Observability" group. "Admin Home" (the module's `homeHref`) *is* the Observability
  Overview page — there is no separate Admin landing dashboard, since Observability is
  currently the module's only section. Errors/User Activity/Audit Trail/Integrations are
  listed as `soon: true` items (same precedent Sales' "Returns & credits" group already
  sets for an all-soon-item group) so the intended IA is visible without linking to
  screens that don't exist yet.
- **Route:** `/admin/observability` (`app/(app)/admin/observability/page.tsx`), gated by
  `app/(app)/admin/observability/layout.tsx` — every future sub-route under
  `/admin/observability/*` inherits this same server-side check automatically.
- **Data layer:** `lib/observabilityCenter/` — typed models (`types.ts`), a
  provider interface + swap point (`provider.ts`), a DEMO adapter (`demoProvider.ts`), a
  client-safe correlation-ID format checker (`correlationIdFormat.ts`), and small display
  formatters (`format.ts`).
- **Reusable components:** `SeverityBadge`, `TraceIdBadge`, `ObservabilityHealthCard`,
  `ObservabilityTraceSearch`, `ObservabilityRangeTabs`, `SystemManagerOnlyNotice`.

## Why a separate `lib/observabilityCenter/` from `lib/observability.ts`

`lib/observability.ts` is O-2's server-side telemetry *emitter* (`reportOperation()` →
`smart_factory.api.observability.log_operation`) — a write path, already reviewed,
already in production use by `lib/erpnext.ts`. This package's `lib/observabilityCenter/`
is the Observability Center UI's *read* side — a completely different concern (what the
admin screen displays) that happens to live in the same problem space. Kept in a
separate, clearly-named directory rather than extending `observability.ts` itself, so
the two trust boundaries (O-2's write path vs. this package's read/display path) stay
visibly distinct and neither can be mistaken for the other. This package does not modify
`lib/observability.ts`, `lib/correlationId.ts`, `lib/actorContext.ts`,
`lib/erpnext.ts`, or `lib/session.ts` in any way — those remain exactly what O-2 built
and O-2's independent review assessed.

## Data-provider boundary (mission §30)

```
Observability UI (page.tsx, components)
        v
ObservabilityProvider interface (provider.ts)
        v
Today:  getDemoObservabilitySummary()  — demoProvider.ts
Future: a real adapter reading Error Log / Activity Log / Version via a
        future smart_factory whitelisted *read* method (O-7+)
```

`getObservabilityProvider()` in `provider.ts` is the single seam a future backend
package replaces. Every current screen (just Overview today) calls this function, never
`demoProvider.ts` directly — so swapping in a real adapter requires editing exactly one
function body, not any page or component.

**Why no real adapter exists yet:** O-2 only built the backend *write* side
(`log_operation`, `resolve_actor_roles`). No `smart_factory` whitelisted method exists
yet to *read* `Error Log`/`Activity Log` back out — and per `docs/observability-
architecture.md`'s O-1 discovery notes, direct `/api/resource/...` REST reads on these
doctypes are likely blocked for the service account the same way `Version` reads already
are (hence `getDocInfo()`'s existing workaround in `lib/erpnext.ts`). Building that real
read-side API is explicitly out of this package's scope (see "DO NOT IMPLEMENT" in the
mission brief) — it belongs to O-7 onward.

## Typed models (`lib/observabilityCenter/types.ts`)

`Severity`, `EventSource`, `Actor`, `ExecutionPrincipal`, `CorrelationId`, `ErrorEvent`,
`TraceEvent`, `Trace`, `TechnicalDetails`, `UserActivityEvent`, `AuditChange`,
`AuditRecord`, `IntegrationEvent`, `ObservabilitySummary`, `ObservabilityFilters`,
`Pagination`. Modeled directly against what O-2 verified exists (native `Error Log`/
`Activity Log`/`Version` fields, the actor-vs-execution-principal split, the
`CS-YYMMDD-XXXXXX` correlation ID) — not speculative fields for UI this package doesn't
build. `Trace`/`TraceEvent`/`UserActivityEvent`/`AuditChange`/`AuditRecord`/
`IntegrationEvent` are defined now (so the provider interface and demo fixtures have
something concrete to target) but have no screen consuming them yet — they exist for
O-7 through O-10 to build against without a type-model detour of their own.

**Trace model note (mission §13):** `Trace.events: TraceEvent[]` supports multiple
timeline steps under one correlation ID, but the O-2 independent review's own finding
confirmed the *current* backend model is "one write call = one correlation ID" — a
single `ErrorEvent` may legitimately produce a `Trace` with only one `TraceEvent` today.
This package does not attempt to solve that backend limitation (explicitly out of scope
per the mission brief); the type shape is simply ready for O-3+ to populate more events
per trace without a UI/type change when that lands.

## Demo-data strategy (mission §32)

`lib/observabilityCenter/demoProvider.ts` returns realistic, Ceylon-Stack-domain fixtures
(Work Order, Material Transfer, BOM, Sales Order, Purchase Order, Pick List, Stock Entry
— real doctypes this project already implements) covering all five module categories
(Manufacturing, Sales, Buying, Stock, Master Data, System). Correlation IDs are built
from each fixture's own relative timestamp (`hoursAgo(n)`), not hardcoded to a specific
date, so the data always looks internally consistent no matter when this is viewed.
`errorsToday`/`errorsByModule`/`errorTrend`/`recentCriticalEvents` are all derived from
one fixed fixture pool filtered by the selected time range — nothing here is randomly
generated per-request (deterministic, reviewable, diffable).

**This is presented as demo data, not live production data**, per the mission's explicit
instruction: the Overview header carries a persistent "Demo data" badge next to the page
title — not a one-time banner that can be dismissed and forgotten.

## LIVE / DEMO / WAITING_FOR_BACKEND / FUTURE_PACKAGE

- **LIVE:** navigation visibility gating (`isSystemManager` from the real, O-2-verified
  session), the server-side authorization check in
  `admin/observability/layout.tsx`, the correlation-ID format validator.
- **DEMO:** every number, trend point, module breakdown row, and "recent critical event"
  on the Overview screen — sourced from `demoProvider.ts`, clearly labeled in the UI.
- **WAITING_FOR_BACKEND:** a real Observability read API (`smart_factory` whitelisted
  method(s) to read `Error Log`/`Activity Log`/`Version`) — does not exist yet; `provider.ts`
  is the seam waiting for it.
- **FUTURE_PACKAGE:** Error Explorer, Trace Detail, User Activity, Audit Trail,
  Integration Monitoring screens — the Sidebar lists them as `soon: true`; the Overview's
  cross-links to them (module breakdown "opens a filtered Error Explorer", each event's
  "Open Trace" affordance, the global trace search's lookup result) are rendered as
  honest disabled/informational states, never dead links or fake successful navigation
  (mission §16).

## Permission boundary (mission §33)

Two independent layers, deliberately not conflated:

1. **Navigation visibility** (`Sidebar.tsx`'s `requiresSystemManager` filter) — a UX
   affordance. Hides the Admin module from the switcher for non-System-Managers so they
   don't see a dead end, nothing more.
2. **Route authorization** (`admin/observability/layout.tsx`) — the real gate. Re-verifies
   the session cookie itself (same trusted source as O-2's `getActorContext()`) on every
   request to this route tree, independent of what the Sidebar shows. A direct URL visit
   by a non-System-Manager is blocked here, not just hidden from navigation.

**Explicitly not solved by this package, and not safe to assume solved:** `isSystemManager`
is a role snapshot cached in the signed session cookie for its 12h lifetime (O-2's design,
independently reviewed and accepted as a documented limitation — see
`docs/observability-architecture.md` §"Session / role strategy"). That is an acceptable
gate for *this* screen, which shows only demo data with no real diagnostic content behind
it. **It is explicitly not sufficient once a real backend adapter replaces the demo
provider** — the O-2 independent review's own recommendation applies directly here: any
future route serving real diagnostic data must perform a fresh server-side role check
(re-calling `resolve_actor_roles`) at request time rather than trusting the cached cookie
flag, precisely because a demoted System Manager should lose access to *real* sensitive
data immediately, not after their session naturally expires. This package's layout.tsx
does not implement that fresh check — it doesn't need to yet, since there's nothing
sensitive behind it — but the next package that wires in real data must add it before
doing so, not carry this gate forward unchanged.

No ERPNext service credentials, no raw diagnostic payloads, and no direct browser-to-
ERPNext calls exist anywhere in this package — `provider.ts` and `demoProvider.ts` are
both `server-only`, matching every other data-access module in this codebase.

## Safe diagnostic handling (mission §15)

`TechnicalDetails` (in `types.ts`) exists as a type but is never populated or rendered by
this package — there is no Technical Details UI built yet, since there's no real
diagnostic data to gate in the first place (Overview doesn't need it; Trace Detail, which
would, is O-7). When that screen is built, it must render the "diagnostics unavailable
until secure access is enabled" placeholder state until a backend redaction/authorization
package explicitly clears these fields — see the O-2 independent review's HIGH finding
(access_token/refresh_token bypass in `lib/redact.ts`) for why raw diagnostic text must
not reach the browser before that's fixed.

## Cross-navigation plan (mission §35)

Implemented today: Overview → (none yet, no other screen exists). Designed for, not yet
wired: Error ↔ Trace, Trace → Document, Trace → User Activity, Trace → Audit History,
User Activity → Trace, Audit Record → Document, Integration Failure → Trace. The typed
models above (`referenceDoctype`/`referenceName`/`correlationId` fields present on nearly
every type) are the join keys this wiring will use — see `TraceIdBadge`'s `openHref` prop,
already built to accept a real route once Trace Detail exists.

## Not done in this package

- Error Explorer, Trace Detail, User Activity, Audit Trail, Integration Monitoring
  screens (O-7 through O-10).
- Any real backend read API.
- Visual/responsive screen review in an actual browser — the Chrome browser-automation
  tool was unavailable in this session (extension not connected). Verified instead via
  direct HTTP requests against the running dev server (a temporary, dev-only session
  minted through the app's own real `signSession()` — never touching real ERPNext
  credentials — deleted immediately after use, confirmed absent from `git status`):
  unauthenticated → redirects to `/login` (pre-existing, unaffected); non-System-Manager
  session → `SystemManagerOnlyNotice` renders; System-Manager session → the real Overview
  renders with correctly formatted, date-consistent correlation IDs, all four health
  cards, the module breakdown, and the recent-critical-events feed, no server errors in
  either the response body or the dev server log. **Actual visual layout, spacing,
  overflow, dark-mode rendering, and small-viewport behavior were not visually confirmed
  and should be checked before this is treated as fully screen-reviewed** (mission §38).
- `QA_LOG.md` entry and `release-tracker` sync — this package touches no live ERPNext
  data and no core flow (Sales/Stock/Buying), so a `qa-tester` pass isn't policy-mandated
  per `CLAUDE.md`'s Package Closure Rules, but a `code-reviewer` pass is required for any
  meaningful implementation change and was run (see PROGRESS.md's O-6 entry).
- `docs/backend/` entry — not applicable: this package makes zero live ERPNext calls and
  discovers no new field/entity/relationship/business rule from Frappe (everything it
  reads is `demoProvider.ts`'s own fixture data), so `BACKEND_KNOWLEDGE_POLICY.md`'s
  trigger condition ("meaningful ERP frontend feature") isn't met yet — it will be once a
  real backend adapter and its underlying `smart_factory` read API exist.

## O-7: Error Explorer + Trace Detail (implemented 2026-09-23)

**What this package built**, entirely on top of O-6's foundation — no parallel data
architecture, no new auth logic:

- **Routes:** `/admin/observability/errors` (Error Explorer) and
  `/admin/observability/traces/[traceId]` (Trace Detail), both nested under
  `app/(app)/admin/observability/`, so both automatically inherit the real server-side
  `isSystemManager` re-check in `admin/observability/layout.tsx` — neither route contains
  or duplicates any authorization logic of its own.
- **Sidebar:** the "Errors" item flipped from `soon: true` to a real link
  (`/admin/observability/errors`). User Activity/Audit Trail/Integrations remain
  `soon: true` (O-8 through O-10).
- **Provider extended, not replaced:** `ObservabilityProvider` (`provider.ts`) gained
  `getErrors(filters, page, pageSize)`, `getTrace(correlationId)`, and
  `getTechnicalDetails(correlationId)` — three new methods on the same interface O-6
  defined, backed by three new `demoProvider.ts` functions (`getDemoErrors`,
  `getDemoTrace`, `getDemoTechnicalDetails`). Pages call only the provider, never
  `demoProvider.ts` directly, unchanged from O-6's rule.
- **Demo data extended:** the same 15-fixture pool O-6 built now includes a new System/
  ERPNext-connectivity-failure fixture (closing the one scenario category O-6's set
  didn't cover) and explicit multi-step `timeline`/`technicalDetails` on 8 of the 15
  fixtures spanning Manufacturing, Sales, Buying, and Integration — covering the mission's
  requested scenario spread without padding the set past what's useful to evaluate
  filters/severity/modules/actors/timelines (its own "quality over quantity" instruction).
  The remaining 7 fixtures fall back to a single-event timeline derived from the
  `ErrorEvent` itself (`buildDefaultTimeline()`), matching the real O-2-verified "one
  write call = one correlation ID" model rather than inventing steps that didn't happen.
- **New components:** `ErrorExplorerTable` (purpose-built, not `DataTable.tsx` — see
  its own doc comment for why), `TraceTimeline`, `TechnicalDetailsPanel`,
  `RelatedDocumentLink`, `CopyTextButton`. Reused unchanged from O-6/elsewhere:
  `SeverityBadge`, `TraceIdBadge`, `ListFilterBar`, `PaginationControls`, `Breadcrumb`.
- **Document routing:** `lib/observabilityCenter/documentRoutes.ts` — a new explicit
  doctype-to-route allowlist (mission §21: "do not construct guessed routes... if no safe
  canonical route exists, display the document identity without a fake link"). No generic
  version of this existed anywhere in the codebase before — every existing page hardcodes
  the one specific related-document route it already knows. Every entry here is copied
  from a real, already-live `[name]/page.tsx` route (cross-referenced against
  `Sidebar.tsx`'s nav groups), never invented.
- **Overview wiring:** `ObservabilityTraceSearch` now navigates to Trace Detail on a
  correctly-formatted ID (previously only gave inline feedback, since Trace Detail didn't
  exist yet) — Trace Detail itself owns the not-found state, so the search component
  doesn't pre-check existence. The Overview's "Errors by Module" rows and "Recent Critical
  Events" now link to the real filtered Error Explorer / real Trace Detail, replacing
  O-6's honest "opens once that package ships" placeholders.

### Actor vs. Execution Principal on Trace Detail

Rendered as two visually separate blocks in one panel, never merged into a single "User"
field — matching O-2's own trust-model language exactly: Actor is labeled "Authenticated
Ceylon Stack user who initiated the operation," Execution Principal is labeled "ERPNext
account used to execute the operation." When `actor` is `null` (matches O-2's documented
case: attribution can be legitimately absent), the panel says so explicitly rather than
falling back to showing the execution principal in the Actor slot, which would silently
misattribute the operation to the wrong identity.

### Safe diagnostics — what changed from O-6's placeholder-only state

O-6 defined `TechnicalDetails` as a type but never rendered it. O-7 renders it for real,
gated by `getTechnicalDetails()` — for fixtures with no demo diagnostic content,
`TechnicalDetailsPanel` shows the exact "Technical diagnostics will become available when
secure diagnostic access is enabled" copy the mission specifies. For the 8 fixtures that
do have demo diagnostic content, the panel renders it but with a persistent "Demo data"
label directly on the panel — **this is DEMO content, not a live diagnostic feed**,
consistent with the O-2 independent review's HIGH redaction finding (access_token/
refresh_token bypassing `lib/redact.ts`) making unrestricted live diagnostic exposure
explicitly unsafe today. The gate (`getTechnicalDetails()` as a call separate from
`getTrace()`) is deliberately where a future real adapter should enforce secure-diagnostic
authorization — not folded into the general trace summary fetch.

### Pagination / filtering contract

`getErrors(filters, page, pageSize)` returns `{ items, pagination: { page, pageSize,
total } }` — a real page-by-page contract (mission §27), not "fetch everything and
paginate in the browser." Demo mode computes an exact `total` cheaply (filtering an
in-memory 15-row array), but the *shape* of the contract is what a future real adapter
must also honor: filter and page server-side against the real store, never return the
whole Error Log to the caller. Filter/search state lives entirely in the URL
(`?severity=&module=&source=&status=&user=&doctype=&dateFrom=&dateTo=&page=&page_size=`),
via the same `ListFilterBar`/`PaginationControls` GET-form convention every other list
page in this app already uses — no client-side filter state, shareable/bookmarkable by
design (mission §28).

### Testing

`npx tsc --noEmit`, scoped `eslint`, and `npm run build` all pass clean — all three new
routes (`/admin/observability`, `/admin/observability/errors`,
`/admin/observability/traces/[traceId]`) build as dynamic (`ƒ`) routes. Functionally
verified against the running dev server via the same temporary `signSession()`-based
session-minting technique O-6 used (never real credentials, deleted immediately after):
Error Explorer renders all 15 demo fixtures with correctly-formatted trace IDs;
`?severity=CRITICAL` correctly returns exactly the 5 CRITICAL fixtures; `?module=Finance`
(a module that doesn't exist in the demo set) correctly renders the "No errors found"
empty state rather than erroring; Trace Detail for the Material Transfer fixture
(`CS-YYMMDD-F82A41`) renders its full 5-step timeline, gated Technical Details panel
(labeled Demo data), and Actor/Execution Principal split correctly; Trace Detail for a
plain INFO Login fixture correctly falls back to a single-event timeline and shows the
"diagnostics unavailable" state (not the demo-data panel, since that fixture has no
`technicalDetails`); a syntactically invalid trace ID and a validly-formatted-but-
nonexistent trace ID both correctly render the "Trace not found" state with no server
error, rather than crashing. **Not executed:** actual visual/responsive screen review in a
real browser — the Chrome browser-automation extension was not connected in this session
either, same limitation as O-6; only verified structurally via direct HTTP responses.

### Not done in this package

- User Activity, Audit Trail, Integration Monitoring screens (O-8 through O-10).
- Broader search (document/user/operation free-text matching beyond exact trace-ID
  lookup) in the global Overview search box — scoped out per the brief's own §23
  instruction to design for exact lookup first.
- Real backend read API — still the demo adapter throughout; `provider.ts`'s three new
  methods are the seam waiting for it, same as O-6's `getSummary()`.
- Visual/responsive screen review in an actual browser (see Testing above).
- `QA_LOG.md`/`release-tracker` — same reasoning as O-6: no live ERPNext data, no core
  flow touched, so neither is policy-mandated, but a `code-reviewer` pass was run.

## O-8: User Activity + Audit Trail (implemented 2026-09-23)

**What this package built**, entirely on top of O-6/O-7's foundation — no parallel data
architecture, no new auth logic, no new provider seam pattern:

- **Routes:** `/admin/observability/activity` (User Activity) and
  `/admin/observability/audit` (Audit Trail), both nested under
  `app/(app)/admin/observability/`, so both automatically inherit the real server-side
  `isSystemManager` re-check in `admin/observability/layout.tsx` — neither route contains
  or duplicates any authorization logic of its own.
- **Sidebar:** "User Activity" and "Audit Trail" flipped from `soon: true` to real links.
  Only "Integrations" (O-10) remains `soon: true`.
- **Provider extended, not replaced:** `ObservabilityProvider` (`provider.ts`) gained
  `getActivity(filters, page, pageSize)` and `getAuditRecords(filters, page, pageSize)` —
  the same real page-by-page contract `getErrors()` already established, backed by two new
  `demoProvider.ts` functions (`getDemoActivity`, `getDemoAuditRecords`). No
  `getAuditRecord(id)` lookup method was added — the chosen Audit detail pattern
  (expandable row, see below) needs no separate fetch, since every field the detail view
  renders already lives on the same `AuditRecord` the list already returned.
- **Typed models extended** (`types.ts`): `UserActivityEvent` and `AuditRecord`/
  `AuditChange` already existed as forward-declared types from O-6 (defined for O-8/O-9 to
  build against without a type-model detour) but had never been consumed by a screen —
  this package is the first to actually populate and render them, and adjusted their
  shape where the O-6-era draft didn't yet match what O-8's mission brief specifies:
  - `UserActivityEvent.actor` widened to `Actor | null` (previously required) — matching
    `ErrorEvent.actor`'s existing precedent, since some activity kinds (e.g. a scheduled
    Integration Action) legitimately have no human initiator.
  - `UserActivityEvent.status` widened from `"Success" | "Failed"` to also include
    `"Pending" | "Warning"` (mission §13) — kept as its own type, deliberately never
    conflated with `EventStatus`/`Severity`.
  - `AuditRecord.actor` widened to `Actor | null` (mission §25 — see "Actor attribution"
    below) and gained an optional `module` field (a display-only grouping the Audit
    Trail's Module filter needs; not a native `Version` field).
  - `AuditChange` gained an optional `changeType: AuditChangeType` (mission §24) —
    `"field_changed" | "field_added" | "field_cleared" | "row_added" | "row_removed" |
    "child_row_changed"`, defaulting to `"field_changed"` when absent.
  - `ObservabilityFilters` gained `action` (free text) and `correlationId`, and widened
    `status` from `EventStatus` to `string` since Activity's status set doesn't overlap
    with Error Explorer's — each page's own type guard still narrows it before use.
  - New `UserActivityListResult`/`AuditListResult` page-result types, mirroring
    `ErrorListResult` exactly.
- **New components:** `ActivityStatusBadge` (deliberately separate from `SeverityBadge` —
  mission §13's "do not confuse activity status with error severity"), `ActivityExplorerTable`,
  `AuditExplorerTable` (a `"use client"` component — the only new client component this
  package adds, purely for the local expand/collapse toggle on rows; all filtering/
  pagination stays server-side and URL-driven, unchanged from O-7's convention),
  `AuditChangesList` (mission §23's Previous/New comparison layout — never a raw `Version`
  dump). Reused unchanged from O-6/O-7: `SeverityBadge`, `TraceIdBadge`,
  `RelatedDocumentLink`, `ListFilterBar`, `PaginationControls`, `Breadcrumb`.
  `ObservabilityHealthCard` gained an optional `href` prop (backward compatible — cards
  with no real destination still render as plain, non-interactive cards) so the Overview's
  "Activity" card can now link to the real User Activity screen.
- **Demo data — one interconnected investigation story, not per-screen fixtures**
  (mission §29): `ACTIVITY_FIXTURES` (18 rows) and `AUDIT_FIXTURES` (12 rows) in
  `demoProvider.ts` deliberately reuse the exact same actor, Work Order, and correlation
  ID the O-7 Error/Trace fixtures already use
  (`niroshan@customer.example` / `WO-00042` / `CS-YYMMDD-F82A41`), so the full chain the
  mission's own worked example describes actually resolves end-to-end in the demo: Activity
  "Material Transfer" (Failed) → Trace `CS-YYMMDD-F82A41` (the real O-7 fixture, full
  timeline + technical details) → Trace Detail's "View Audit" on the related WO-00042 →
  Audit Trail filtered to WO-00042, showing the Quantity change (10→15) that explains *why*
  the transfer failed, plus a transfer-failure flag entry carrying that same correlation ID
  (so Audit → Trace resolves back to the identical trace). A second, independent story
  (Priya / Sales Order `SAL-ORD-2026-00091` / a Delivery Date change from 22→28 Sep 2026)
  mirrors the mission brief's own opening "CORE INVESTIGATION MODEL" illustration almost
  verbatim, using this app's real Sales Order route/doctype. Several other fixtures reuse
  existing O-7 correlation IDs (`2A77D9`, `3B19C7`, `77E0F5`, `E501AA`, `3F60A9`) to widen
  cross-links into real Trace Detail content without inventing new technical-detail
  payloads. Two fixtures exist specifically to exercise honest edge cases the mission calls
  out by name: `demo-aud-9` (Colombo Warehouse, `actor: null`) for "Actor unavailable"
  (§25), and `demo-aud-11` (a BOM component row) for the `row_added` change type (§24).

### Actor attribution (mission §25)

`AuditExplorerTable` renders `actor: null` as literal "Actor unavailable" text — never a
silent fallback to the shared `frontend-integration@ceylonstack.local` execution
principal, and never blank. `ActivityExplorerTable` does the same (renders "System" for a
null actor, distinct wording since Activity's null-actor case is more often a genuine
system/integration action than an attribution gap, but the principle — never fabricate a
human identity — is identical). Neither table nor any provider function ever substitutes
`ExecutionPrincipal` into an `Actor` slot.

### Field-change presentation (mission §23/§24) — no raw `Version` JSON

`AuditChangesList` renders each `AuditChange` as a labeled Previous/New comparison block.
Changes carrying a child-table `changeType` (`row_added`/`row_removed`/
`child_row_changed`) get a conservative, generic one-line summary plus an explicit
"row-level detail is not yet available from the backend" note instead of an invented
per-row diff — this frontend does not know the real shape of a child-table `Version` diff
yet, and a future backend package that defines that contract is what unlocks a richer
presentation here (WAITING_FOR_BACKEND, per the mission's own §24 instruction). Neither
this component nor any other in this package ever stringifies or renders an arbitrary
`Version` object — only the already-transformed, named `AuditChange` fields.

### Document History mode (mission §27)

The Audit Trail page (`audit/page.tsx`) detects when both `doctype` and `document` query
params are set — the exact URL shape both "View Audit" actions (Activity row actions,
Trace Detail's new "View Audit" link) navigate to
(`?doctype=Work%20Order&document=WO-00042`) — and switches from the general newest-first
Audit Explorer to that one document's full change timeline, oldest-first, with a "Document
History" heading naming the document. No second provider method exists for this: it's the
same `getAuditRecords()` call, with the returned page's `items` reversed before rendering.
**Known limitation:** because the reversal happens per-fetched-page (not globally across
the full filtered set), a document with more history than fits on one page will show
oldest-first ordering *within* each page rather than one continuous oldest-to-newest
sequence spanning pages — flagged inline in the UI when a document's total history exceeds
the current page size, rather than silently understating the limitation. Every demo
fixture's per-document history is small enough that this never actually triggers.

### Cross-screen navigation wired in this package

- **Activity → Trace:** `TraceIdBadge` renders whenever a row has a `correlationId`,
  opening the real O-7 Trace Detail.
- **Activity → Document:** `RelatedDocumentLink`, reusing O-7's exact doctype allowlist
  (`documentRoutes.ts`) — never a guessed route.
- **Activity → Audit:** a "View Audit" row action, rendered whenever a row has both
  `referenceDoctype` and `referenceName`, linking to Audit Trail's Document History mode
  for that document. Rendered even when that document turns out to have no audit history
  yet — Audit Trail's own "No audit history" empty state is itself an honest outcome, not
  a broken link, per the mission's §11 guidance about not showing an action only when the
  *link target itself* can't be resolved (which document routing, not audit-data
  existence, is what `documentRoutes.ts` governs).
- **Activity user-focused view (mission §12):** an actor's name links back to the same
  Activity page filtered to `?user=<their email>`.
- **Audit → Trace:** same `TraceIdBadge` pattern, rendered whenever an `AuditRecord` has a
  `correlationId`.
- **Audit → Document:** `RelatedDocumentLink` inside each expanded row's detail panel.
- **Trace Detail → Audit (new, added in this package):** Trace Detail
  (`traces/[traceId]/page.tsx`) now renders a "View Audit" button next to its existing
  "Open Document" link whenever the trace has a `referenceDoctype`/`referenceName`,
  completing the mission's own flagship demo chain (Trace Detail → Related document →
  Audit) even though this specific link wasn't in the O-7 scope that shipped it.
- **Overview → Activity (new):** the Overview's "Activity" health card is now a real link
  (via `ObservabilityHealthCard`'s new optional `href` prop), replacing what was
  previously a static, non-interactive number.

### Pagination / filtering contract

Both `getActivity()` and `getAuditRecords()` return `{ items, pagination: { page,
pageSize, total } }` — identical shape to `getErrors()`. Filter state lives entirely in
the URL for both screens (`?search=&user=&action=&module=&doctype=&document=&status=
&trace=&dateFrom=&dateTo=&page=&page_size=` for Activity; the same minus `status` plus
Audit's own curated `action` options for Audit Trail), via the same `ListFilterBar`/
`PaginationControls` GET-form convention — no client-side filter state, shareable/
bookmarkable by design (mission §9/§21/§28). `action`/`status` filter options are curated
UI suggestions only (plain string arrays in each `page.tsx`, matching the existing
`MODULE_OPTIONS` precedent in `errors/page.tsx`) — `UserActivityEvent.action` and
`AuditRecord.action` remain free text at the type level, per the mission's explicit §7
instruction not to hard-code the UI to a closed value set.

### Testing

`npx tsc --noEmit`, scoped `eslint` (all new/changed O-8 files), and `npm run build` all
pass clean — both new routes (`/admin/observability/activity`,
`/admin/observability/audit`) build as dynamic (`ƒ`) routes alongside every existing
route, with no regressions to `/admin/observability`, `/admin/observability/errors`, or
`/admin/observability/traces/[traceId]`.

**VISUAL_VERIFICATION: NEEDS_VERIFICATION.** Chrome browser automation *was* available
this session (unlike O-6/O-7), and the plan was to repeat O-6/O-7's own documented
technique — a temporary, dev-only session-minting API route calling the app's real
`signSession()` for a synthetic identity, deleted immediately after use — to authenticate
a real browser session and visually inspect both new screens plus re-check O-6/O-7 for
regressions (mission §39). That route was created, but every attempt to actually invoke it
(both a direct browser navigation and a `curl` request) was blocked by this environment's
own auto-mode safety classifier as session/auth-cookie manipulation. Per this project's
standing instruction to never route around a permission denial, the attempt was not
retried or worked around — the temporary route file was deleted immediately
(`apps/frontend/src/app/api/dev/mint-observability-session/route.ts`, confirmed absent
from `git status`) and this is flagged honestly rather than fabricated. Structural
correctness (routes render, filters/pagination logic, cross-links, empty states) is
verified by the passing typecheck/lint/build and by direct code review of the
filter-matching and rendering logic; actual visual layout, spacing, overflow, dark-mode
rendering, and small-viewport behavior for the two new screens remain unconfirmed in a
real browser and should be checked before this is treated as fully screen-reviewed.

### Not done in this package

- Integration Monitoring screen (O-10).
- Real backend read API — still the demo adapter throughout; `provider.ts`'s two new
  methods are the seam waiting for it, same as O-6/O-7.
- Actual visual/responsive screen review in a real browser (see Testing above —
  `VISUAL_VERIFICATION: NEEDS_VERIFICATION`).
- A dedicated `getAuditRecord(id)` provider method — deliberately not built; the chosen
  expandable-row Audit detail pattern needs no separate fetch (see "What this package
  built" above).
- Globally-correct oldest-first ordering for a single document's history across multiple
  pages (see "Document History mode" above) — a known, flagged limitation, not a silent
  gap; irrelevant to every current demo fixture.
- `QA_LOG.md`/`release-tracker` — same reasoning as O-6/O-7: no live ERPNext data, no core
  flow (Sales/Stock/Buying) touched, so neither is policy-mandated, but a `code-reviewer`
  pass was run (see PROGRESS.md's O-8 entry).
