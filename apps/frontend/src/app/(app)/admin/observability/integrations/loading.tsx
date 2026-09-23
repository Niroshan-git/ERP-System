/** Same minimal skeleton pattern O-7's `errors/loading.tsx` introduced, extended with a
 * health-summary row skeleton (mission §29: "follow O-7/O-8 patterns... do not create a
 * visually different loading system"). */
export default function IntegrationMonitoringLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-3 w-40 rounded bg-graphite-500/10" />
      <div className="mb-4">
        <div className="h-6 w-56 rounded bg-graphite-500/10" />
        <div className="mt-2 h-4 w-96 max-w-full rounded bg-graphite-500/10" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl border border-border bg-surface" />
        ))}
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
