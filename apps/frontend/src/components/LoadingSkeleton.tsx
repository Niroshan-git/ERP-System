/**
 * Reusable route-loading primitives (V1-HARDEN-1, mission §11/§12). Matches the visual
 * language already established by the one hand-rolled skeleton in this codebase
 * (`app/(app)/admin/observability/errors/loading.tsx`'s `animate-pulse` +
 * `bg-graphite-500/10`/`border-border`/`bg-surface`/`bg-canvas` blocks) instead of inventing a
 * new look — this file generalizes that pattern into shared components so future `loading.tsx`
 * files (and this package's own module-level ones) don't hand-roll it again.
 *
 * Server Components by default (no interactivity needed) — safe to import directly into any
 * `loading.tsx`, which Next.js requires to be lightweight and does not pass any props to.
 */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-graphite-500/10 ${className}`} />;
}

/** A page header (breadcrumb + title + optional subtitle) skeleton — the part of almost every
 * page in this app that renders before any data arrives. */
function HeaderSkeleton() {
  return (
    <div className="mb-6">
      <Bar className="mb-2 h-3 w-40" />
      <Bar className="h-6 w-56" />
    </div>
  );
}

/** List/report page skeleton: header + filter bar + table. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading">
      <HeaderSkeleton />
      <Bar className="mb-4 h-14 rounded-xl border border-border bg-surface" />
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-10 border-b border-border bg-canvas" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 border-b border-border last:border-0" />
        ))}
      </div>
    </div>
  );
}

/** Document detail page skeleton: header + status/action bar + a two-column field grid + a
 * line-items-shaped block — the common shape of every Sales/Buying/Manufacturing/Finance
 * detail view in this app. */
export function DetailSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading">
      <HeaderSkeleton />
      <div className="mb-4 flex items-center gap-3">
        <Bar className="h-8 w-24 rounded-full" />
        <Bar className="h-9 w-28 rounded-md" />
        <Bar className="h-9 w-28 rounded-md" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Bar className="mb-2 h-3 w-24" />
            <Bar className="h-5 w-40" />
          </div>
        ))}
      </div>
      <Bar className="h-48 rounded-xl border border-border bg-surface" />
    </div>
  );
}

/** Create/edit form page skeleton: header + stacked field rows + action row. */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading">
      <HeaderSkeleton />
      <div className="max-w-2xl space-y-4 rounded-xl border border-border bg-surface p-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i}>
            <Bar className="mb-2 h-3 w-28" />
            <Bar className="h-9 w-full" />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Bar className="h-9 w-24 rounded-md" />
          <Bar className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/** Workspace/dashboard home skeleton: header + KPI cards + a chart-shaped block. Used by
 * module home pages (e.g. `/sales`, `/crm`) that show a KPI summary before any list. */
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Loading">
      <HeaderSkeleton />
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4">
            <Bar className="mb-2 h-3 w-20" />
            <Bar className="h-6 w-16" />
          </div>
        ))}
      </div>
      <Bar className="h-64 rounded-xl border border-border bg-surface" />
    </div>
  );
}

/** Small inline spinner-ish state for a component/panel that loads independently of the whole
 * route (e.g. inside a Suspense boundary narrower than a full `loading.tsx`) — not a full-page
 * skeleton. */
export function InlineLoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-6 text-sm text-graphite-500">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-graphite-500/30 border-t-graphite-500" aria-hidden="true" />
      {label}
    </div>
  );
}

/** Generic full-page fallback for a route with no more specific shape yet (workspace home
 * pages that aren't clearly "dashboard" or "table" shaped). Defaults to the table shape, the
 * most common page layout in this app. */
export function PageSkeleton({ variant = "table" }: { variant?: "table" | "detail" | "form" | "dashboard" }) {
  if (variant === "detail") return <DetailSkeleton />;
  if (variant === "form") return <FormSkeleton />;
  if (variant === "dashboard") return <DashboardSkeleton />;
  return <TableSkeleton />;
}
