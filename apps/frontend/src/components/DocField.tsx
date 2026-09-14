/** Plain label/value pair for read-only Submitted/Cancelled document views. */
export function DocField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-graphite-500">{label}</dt>
      <dd className={`text-graphite-900 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
