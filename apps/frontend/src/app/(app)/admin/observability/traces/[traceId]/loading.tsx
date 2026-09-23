export default function TraceDetailLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 h-3 w-64 rounded bg-graphite-500/10" />
      <div className="mb-4">
        <div className="h-5 w-20 rounded-full bg-graphite-500/10" />
        <div className="mt-2 h-6 w-72 max-w-full rounded bg-graphite-500/10" />
        <div className="mt-2 h-6 w-48 rounded bg-graphite-500/10" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-48 rounded-xl border border-border bg-surface" />
        <div className="h-48 rounded-xl border border-border bg-surface" />
      </div>
      <div className="mb-6 h-24 rounded-xl border border-border bg-surface" />
      <div className="h-56 rounded-xl border border-border bg-surface" />
    </div>
  );
}
