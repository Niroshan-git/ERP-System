/** % Delivered / % Amount Billed style progress bar, matching ERPNext's own Sales Order list. */
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-graphite-500/15">
        <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-graphite-500">{pct.toFixed(0)}%</span>
    </div>
  );
}
