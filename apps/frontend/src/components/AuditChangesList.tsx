import type { AuditChange } from "@/lib/observabilityCenter/types";

/**
 * Renders one `AuditRecord.changes[]` array as a clean Previous -> New comparison
 * (mission §23) — never a raw `Version` JSON dump. The common case (`field_changed`/
 * `field_added`/`field_cleared`) gets the full comparison layout. The child-table kinds
 * (`row_added`/`row_removed`/`child_row_changed`, mission §24) get a conservative, generic
 * one-line description instead of an invented per-row diff — this frontend does not yet
 * know the real shape of a child-table `Version` diff, and inventing one would misrepresent
 * data that doesn't exist yet. `changeType` defaults to `"field_changed"` when absent, for
 * older/incomplete data.
 */
const ROW_LEVEL_LABEL: Record<string, string> = {
  row_added: "Row added",
  row_removed: "Row removed",
  child_row_changed: "Row changed",
};

export function AuditChangesList({ changes }: { changes: AuditChange[] }) {
  if (changes.length === 0) {
    return <p className="text-sm text-graphite-500">No field-level changes recorded for this entry.</p>;
  }

  return (
    <dl className="divide-y divide-border">
      {changes.map((change, i) => {
        const changeType = change.changeType ?? "field_changed";
        const isRowLevel = changeType === "row_added" || changeType === "row_removed" || changeType === "child_row_changed";
        return (
          <div key={`${change.field}-${i}`} className="py-3 first:pt-0 last:pb-0">
            <dt className="text-sm font-semibold text-graphite-900">{change.fieldLabel}</dt>
            {isRowLevel ? (
              <dd className="mt-1">
                <p className="text-sm text-graphite-900">
                  {ROW_LEVEL_LABEL[changeType]}: <span className="font-mono text-xs">{change.newValue || change.previousValue}</span>
                </p>
                <p className="mt-0.5 text-xs text-graphite-500">
                  Row-level detail is not yet available from the backend — showing a summary only.
                </p>
              </dd>
            ) : (
              <dd className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-canvas px-2.5 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-graphite-500">Previous</p>
                  <p className="mt-0.5 break-words text-sm text-graphite-900">{change.previousValue || "—"}</p>
                </div>
                <div className="rounded-md border border-signal/30 bg-signal/5 px-2.5 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-signal">New</p>
                  <p className="mt-0.5 break-words text-sm text-graphite-900">{change.newValue || "—"}</p>
                </div>
              </dd>
            )}
          </div>
        );
      })}
    </dl>
  );
}
