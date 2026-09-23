/**
 * No `loading.tsx` convention existed anywhere else in this app before this route (the
 * rest of this codebase's list pages block synchronously with no Suspense boundary) — this
 * is a new, minimal pattern introduced because the O-7 mission brief explicitly requires a
 * loading state for the table (§12/§25), not a retrofit of something pre-existing. Kept to
 * this route rather than applied app-wide, since that's a broader change than this package.
 */
export default function ErrorExplorerLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-3 w-40 rounded bg-graphite-500/10" />
      <div className="mb-4">
        <div className="h-6 w-40 rounded bg-graphite-500/10" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-graphite-500/10" />
      </div>
      <div className="mb-4 h-16 rounded-xl border border-border bg-surface" />
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-10 border-b border-border bg-canvas" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 border-b border-border last:border-0" />
        ))}
      </div>
    </div>
  );
}
