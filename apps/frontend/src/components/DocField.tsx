/**
 * Plain label/value pair for read-only Submitted/Cancelled document views. `value` accepts
 * a ReactNode (not just string) so a field can render as an internal document link (e.g. a
 * linked Item/Warehouse/Sales Order) using the same `<dt>/<dd>` layout as every plain field —
 * existing string-value callers are unaffected.
 */
export function DocField({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-graphite-500">{label}</dt>
      <dd className={`text-graphite-900 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
