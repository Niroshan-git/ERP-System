# Runtime Resilience, Error Boundaries & Loading Architecture

**Package:** `V1-HARDEN-1` (2026-09-25) — production-hardening, not a new feature or a
redesign. See `CLAUDE.md`'s Current Mission section for the authorization note.

**Goal:** ERPNext/API failures and slow requests produce controlled Ceylon Stack UI states —
never a raw Next.js error page, never a blank/frozen screen, never a leaked backend internal.

## 1. Why this existed as a gap

Before this package, `apps/frontend` had **zero** `error.tsx`/`global-error.tsx` files anywhere
(confirmed by a full repo glob) and `loading.tsx` files existed only under
`(app)/admin/observability/*` (O-7/O-9 era, five hand-rolled skeletons, no shared component).
Every other route — all of Sales, Buying, Inventory, Manufacturing, CRM, Master Data, Finance,
Reports — had no boundary at all: an unhandled `ErpNextError` (e.g. ERPNext unreachable, a 5xx,
a genuine bug) crashed straight through to Next's own generic/dev error overlay, and every
navigation blocked with no loading feedback. `PROGRESS.md`'s Observability package `O-2`
(2026-09-23) had already disclosed this exact gap ("no UI surfaces the correlation ID yet — no
`error.tsx`/`global-error.tsx`"). This package closes it.

## 2. Error taxonomy

`src/lib/appError.ts` defines one shared `AppErrorCode` union and `AppError` shape:

```ts
type AppErrorCode =
  | "AUTH_REQUIRED" | "FORBIDDEN" | "VALIDATION_ERROR" | "NOT_FOUND" | "CONFLICT"
  | "ERP_UNAVAILABLE" | "TIMEOUT" | "NETWORK_ERROR" | "RATE_LIMITED"
  | "INTERNAL_ERROR" | "UNKNOWN";

interface AppError {
  code: AppErrorCode;
  message: string;       // internal/diagnostic only — NEVER rendered
  userMessage: string;   // the only thing UI may show
  status?: number;
  correlationId?: string;
  retryable: boolean;
}
```

Curated `SAFE_MESSAGES`/`RETRYABLE` tables live next to the taxonomy — UI never invents its own
copy per call site, and never shows a raw backend string except for one narrow, deliberate case
(next section).

## 3. Two normalization entry points — and why there are two, not one

This is the one non-obvious architectural decision in this package, driven by how Next.js 16's
App Router actually behaves (verified against `node_modules/next/dist/docs/` and
`node_modules/next/dist/server/app-render/create-error-handler.js`, not assumed from prior
Next.js versions — see `apps/frontend/AGENTS.md`'s "not the Next.js you know" warning):

- **`toAppError(error)`** — server-side, called against a real caught error (almost always
  `ErpNextError` from `lib/erpnext.ts`, which carries `.status`/`.correlationId`/
  `.erpnextMessage`). This is the *only* place classification has real information, because:
- **A thrown Server Component error does not survive to the client with its original shape.**
  Next.js 16 deliberately replaces a Server Component's thrown error with a **generic message +
  `.digest`** before it reaches `error.tsx`/`global-error.tsx` in production ("Errors forwarded
  from Server Components show a generic message with an identifier... to prevent leaking
  sensitive details" — Next's own `error.js` doc). A custom `ErpNextError` instance's
  `.status`/`.erpnextMessage` fields do not cross that boundary at all; `instanceof ErpNextError`
  would silently be `false` even if you tried. This is Next enforcing this package's own §7
  security requirement one layer below the app — a gift, not an obstacle, but it means:
- **`classifyBoundaryError(error)`** — client-side, called inside `error.tsx`/`global-error.tsx`,
  trusts only `.message` (rich in dev, Next's generic placeholder in prod) and `.digest` (always
  present, always safe). It pattern-matches `.message` for a nicer *development* experience and
  falls back honestly to `UNKNOWN`'s non-alarming copy in production when nothing is
  recognizable — it does **not** guess a specific code it can't actually verify.

**Practical rule:** classify with `toAppError()` as early as possible (in the page/action, while
the real error object is still in hand) for anything you want *differentiated* messaging for in
production. Anything that reaches a boundary via an uncaught rethrow only gets
`classifyBoundaryError()`'s best-effort treatment — good enough for the dominant real case in
this app (ERPNext connectivity failure) but not fine-grained by design.

### Correlation ID propagation into `error.digest`

`lib/erpnext.ts`'s `ErpNextError` now sets `this.digest = correlationId` in its constructor.
Next.js's RSC error handler respects a pre-set `.digest` instead of regenerating one
(`create-error-handler.js`: *"If the error already has a digest, respect the original digest"*).
So a failure that originated in `erpnextFetch()` — already logged to Error Log/Activity Log via
`scheduleFailureReport()`/`reportOperation()` with that same correlation ID — surfaces that exact
ID as `error.digest` at the boundary, cross-referenceable in the Trace Explorer
(`/admin/observability/traces/[traceId]`). A genuine render bug with no `ErpNextError` behind it
instead surfaces Next's own auto-generated digest — still a safe, stable reference, just not one
that resolves in the Trace Explorer (disclosed, not hidden, in the UI copy/behavior itself).

## 4. Boundary hierarchy

```
global-error.tsx                     — root, catastrophic failures only (own <html>/<body>)
(app)/error.tsx                      — app-shell fallback (dashboard home + anything uncovered)
(app)/<module>/error.tsx             — one per module route group (see table below)
  page.tsx's own try/catch           — for a few representative, genuinely EXPECTED conditions
                                        (403 today — see §6), handled inline, never thrown
```

Errors bubble to the *nearest* boundary (React error boundary semantics) — a module boundary
catches everything in its subtree before `(app)/error.tsx` or `global-error.tsx` ever see it.

| Module | `error.tsx` | `loading.tsx` | Home link |
|---|---|---|---|
| Sales | ✅ | ✅ (table) | `/sales` |
| Buying | ✅ | ✅ (table) | `/buying` |
| Inventory (`stock`) | ✅ | ✅ (table) | `/stock` |
| Manufacturing | ✅ | ✅ (table) | `/manufacturing` |
| CRM | ✅ | ✅ (dashboard) | `/crm` |
| Master Data | ✅ | ✅ (table) | `/master-data` |
| Finance (`accounting`) | ✅ | ✅ (table) | `/accounting` |
| Reports | ✅ | ✅ (table) | `/reports` |
| Admin/Observability | ✅ | *(already had 5 route-specific ones)* | `/admin/observability` |

Every route-level `error.tsx` is a ~15-line wrapper around one shared component,
`ModuleErrorBoundary` (`src/components/ErrorState.tsx`) — no duplicated 100-line files (mission
§8's explicit instruction).

## 5. Loading architecture

`src/components/LoadingSkeleton.tsx` exports the reusable primitives: `TableSkeleton`,
`DetailSkeleton`, `FormSkeleton`, `DashboardSkeleton`, `InlineLoadingState`, and a `PageSkeleton`
dispatcher. Visual language matches the one pre-existing skeleton in this codebase
(`admin/observability/errors/loading.tsx`'s `animate-pulse` + `bg-graphite-500/10`/
`border-border`/`bg-surface`/`bg-canvas` blocks) rather than inventing a new look.

Each module's `loading.tsx` is a 4-line wrapper picking the closest-matching variant (`table` for
list-heavy modules, `dashboard` for CRM's KPI-first `/crm` home). This is intentionally coarse —
Next's own nested-Suspense rule means a more specific `loading.tsx` added later at a deeper route
(e.g. a genuinely detail-shaped route wanting `DetailSkeleton`) automatically takes precedence
for its own subtree without touching the module-level file.

## 6. Retry model

- **error.tsx uses Next 16.3's stable `retry()` prop**, not `reset()` — `retry()` re-fetches and
  re-renders the failed segment; `reset()` only clears local boundary state. `retry` became
  stable in Next `v16.3.0` (this repo is on `16.3.5`) per
  `node_modules/next/dist/docs/.../error.md`'s version history — this is a version-specific
  choice, not a copy-pasted older-Next pattern. `ModuleErrorBoundary` accepts both (`retry ??
  reset`) defensively, since Next's `ErrorBoundary` component always passes both.
- **Retry is only offered when `appError.retryable` is true** — `AUTH_REQUIRED`, `FORBIDDEN`,
  `VALIDATION_ERROR`, `NOT_FOUND`, and `CONFLICT` never show a Retry button, since re-running the
  same request can't change those outcomes and, for a write, could risk a duplicate transaction.
  `ERP_UNAVAILABLE`, `TIMEOUT`, `NETWORK_ERROR`, `RATE_LIMITED`, `INTERNAL_ERROR`, and `UNKNOWN`
  are retryable.
- **This package does not add automatic/blind retries anywhere**, and does not touch any
  Submit/Cancel/Create/Update/Payment/Journal/Stock-posting action. Every existing mutation's
  error handling (each server action's own `humanizeError()`-shaped catch, returning a
  `FormState`) is untouched — mission §10/§24.

## 7. Security — what can and can't leak

- `ErrorState`/`ModuleErrorBoundary` render **only `appError.userMessage`** — the curated safe
  string — never `appError.message` (internal/diagnostic) and never a raw thrown-error message.
- `toAppError()` only ever echoes ERPNext's own text for `VALIDATION_ERROR`/`CONFLICT` (Frappe's
  `frappe.throw()` developer-authored, user-facing validation copy — already HTML-stripped by
  `extractErpNextMessage` in `lib/erpnext.ts`, and the same text every existing per-action
  `humanizeError()` in this codebase already surfaces directly). Every other code always uses the
  safe copy, regardless of what the underlying error actually said.
- In production, Next.js itself already strips Server Component error messages before
  `classifyBoundaryError()` ever runs — this package's own defense (never rendering `.message`)
  is a second, independent layer on top of that, not a replacement for it.
- `reportClientRenderError` (`src/lib/actions/clientErrorReport.ts`) redacts its `message`
  argument through the existing `redactString()` (`lib/redact.ts`) before it leaves the process —
  same pipeline every other Observability write already uses.

## 8. Observability integration

No new logging/telemetry system was introduced (mission §24). This package integrates with the
existing O-series architecture at two points:

1. **Failures already reach Error Log/Activity Log unchanged** — `lib/erpnext.ts`'s
   `scheduleFailureReport()`/`reportOperation()` path is untouched; this package only mirrors the
   correlation ID it already generates onto `.digest` (§3 above) so the UI can show the *same* ID.
2. **New: client-side render errors** (`ModuleErrorBoundary`, via `reportClientRenderError`) —
   the one class of failure that previously had **no** Error Log entry at all, because it never
   touches `erpnextFetch()`. Reuses `reportOperation()` directly; explicitly skips reporting a
   second time when `error.digest` is already a Ceylon Stack correlation ID (meaning
   `erpnextFetch()` already logged it once).

`ErrorState` reuses the existing `TraceIdBadge` component (`components/TraceIdBadge.tsx`,
O-series) with `openHref="/admin/observability/traces/<id>"` — the Trace Detail route that
shipped after `TraceIdBadge` was first built, so this is the first place that link is live.

## 9. Adoption pattern for the rest of the app

This package does **not** rewrite all ~153 pages or all 39 server-action files (mission §24). It
establishes the pattern and demonstrates it once, live, in
`app/(app)/sales/orders/[name]/page.tsx` — the existing `catch (e) { if (e instanceof
ErpNextError && e.status === 404) notFound(); throw e; }` shape (present verbatim in ~90 other
files across every module) is extended with one more classifiable branch:

```ts
} catch (e) {
  if (e instanceof ErpNextError && e.status === 404) notFound();
  if (e instanceof ErpNextError && e.status === 403) {
    return <InlineErrorState appError={toAppError(e)} homeHref="/sales" />;
  }
  throw e;
}
```

Any future page wanting differentiated inline handling for a genuinely expected condition (403
today; 409/validation on a create flow would be a natural next candidate) should extend its own
existing `if (... 404) notFound()` branch the same way, not invent a new pattern. Every other
failure keeps rethrowing to its module's `error.tsx` boundary, which now exists everywhere.

Existing server actions' own `humanizeError()`-shaped functions are intentionally **not**
migrated to `toAppError()` in this package — they already return safe, reasonably classified
`FormState.error` strings today, and touching 39 files across Sales/Buying/Inventory/
Manufacturing/Finance business logic is explicitly out of scope (mission §15/§24). A future
package may consolidate them onto `toAppError()` for consistency; this package only makes that
consolidation possible, not mandatory.

## 10. Known, disclosed limitations (not fabricated as resolved)

- **`classifyBoundaryError()` cannot distinguish error codes from `.message` in production** for
  any error that reaches a boundary via an uncaught rethrow (see §3) — it correctly falls back to
  `UNKNOWN`'s honest copy rather than guessing. Only errors classified *before* being thrown
  (via `toAppError()`, §9) get differentiated production messaging.
- **No live/browser ERP-downtime test was performed against the real Hetzner instance** — see
  the `V1-HARDEN-1` handoff report's §7 for exactly what was and wasn't verified, and why (this
  project's own disclosed forged-session-cookie incident history, referenced in `LP-2`'s
  `PROGRESS.md` entry, ruled out minting a session cookie to test past the login gate).
- **No component-rendering tests** — this repo's only test framework (`vitest`) has no React
  Testing Library equivalent installed, and adding one solely for this package would be
  disproportionate (mission §21's "do not introduce a giant new test framework"). Tests cover
  `lib/appError.ts`'s pure classification/sanitization logic only.
- **Only one module (`Sales`) has a live inline-classification demonstration** (§9) — the other
  seven modules rely on their `error.tsx` boundary alone until a future package adopts the same
  pattern for their own representative routes.
