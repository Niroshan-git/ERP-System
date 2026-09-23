import Link from "next/link";
import { SeverityBadge } from "@/components/SeverityBadge";
import { TraceIdBadge } from "@/components/TraceIdBadge";
import { formatClockTime, formatRelativeTime } from "@/lib/observabilityCenter/format";
import type { ErrorEvent } from "@/lib/observabilityCenter/types";

/**
 * Error Explorer's primary table — purpose-built rather than reusing `DataTable.tsx`
 * (this app's generic column-picker/export-driven list table). That component is right
 * for flat ERPNext-doctype masters with user-customizable columns; this table is a fixed,
 * support-investigation-oriented layout with a stacked secondary line (Module/Operation)
 * per this mission's own §9 guidance ("keep the table readable... use secondary lines
 * where useful... rather than consuming separate large columns"), which `DataTable`'s
 * one-column-per-field model doesn't fit. Still matches this app's visual conventions
 * (`rounded-xl border-border bg-surface`, `bg-canvas` header row) for consistency.
 */
export function ErrorExplorerTable({ rows }: { rows: ErrorEvent[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-sm font-medium text-graphite-900">No errors found</p>
        <p className="mt-1 text-sm text-graphite-500">No errors match these filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-graphite-500">
            <th className="px-4 py-2.5 font-semibold">Severity</th>
            <th className="px-4 py-2.5 font-semibold">Time</th>
            <th className="px-4 py-2.5 font-semibold">Trace</th>
            <th className="px-4 py-2.5 font-semibold">Module / Operation</th>
            <th className="px-4 py-2.5 font-semibold">User</th>
            <th className="px-4 py-2.5 font-semibold">Document</th>
            <th className="px-4 py-2.5 font-semibold">Source</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="group border-b border-border last:border-0 hover:bg-canvas/60">
              <td className="px-4 py-2.5">
                <SeverityBadge severity={row.severity} />
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-graphite-500">
                <Link href={`/admin/observability/traces/${encodeURIComponent(row.correlationId)}`} className="block">
                  <span title={new Date(row.occurredAt).toLocaleString()}>{formatRelativeTime(row.occurredAt)}</span>
                  <span className="block text-xs text-graphite-500/70">{formatClockTime(row.occurredAt)}</span>
                </Link>
              </td>
              <td className="px-4 py-2.5">
                <TraceIdBadge
                  correlationId={row.correlationId}
                  openHref={`/admin/observability/traces/${encodeURIComponent(row.correlationId)}`}
                />
              </td>
              <td className="px-4 py-2.5">
                <Link href={`/admin/observability/traces/${encodeURIComponent(row.correlationId)}`} className="block">
                  <span className="text-graphite-900 group-hover:text-signal group-hover:underline">
                    {row.operation}
                  </span>
                  <span className="block text-xs text-graphite-500">{row.module}</span>
                </Link>
              </td>
              <td className="px-4 py-2.5 text-graphite-500">
                {row.actor ? row.actor.fullName : <span className="text-graphite-500/50">—</span>}
              </td>
              <td className="px-4 py-2.5 text-graphite-500">
                {row.referenceName ? (
                  <>
                    <span className="block font-mono text-xs">{row.referenceName}</span>
                    {row.referenceDoctype && <span className="block text-xs text-graphite-500/70">{row.referenceDoctype}</span>}
                  </>
                ) : (
                  <span className="text-graphite-500/50">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-graphite-500">{row.source}</td>
              <td className="px-4 py-2.5 text-xs text-graphite-500">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
