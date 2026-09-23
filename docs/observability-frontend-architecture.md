# Observability Center — Frontend Architecture

**Status:** Package O-6 implemented (2026-09-23) — navigation shell + Observability
Overview screen, DEMO data only. Not binding like `docs/controls/`; same tier as
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
UX being one investigation flow), User Activity (O-8), Audit Trail (O-9), and Integration
Monitoring (O-10) are each their own future package, building on the foundation below.

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
