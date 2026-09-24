import Link from "next/link";
import { History } from "lucide-react";
import { ActivityStatusBadge } from "@/components/ActivityStatusBadge";
import { RelatedDocumentLink } from "@/components/RelatedDocumentLink";
import { TraceIdBadge } from "@/components/TraceIdBadge";
import { formatClockTime, formatRelativeTime } from "@/lib/observabilityCenter/format";
import type { UserActivityEvent } from "@/lib/observabilityCenter/types";

/**
 * User Activity's primary table (O-8). Purpose-built like O-7's `ErrorExplorerTable`
 * (same rationale — a fixed, support-investigation-oriented layout with stacked
 * secondary lines, not `DataTable.tsx`'s generic column-picker model), reusing its
 * visual conventions exactly.
 *
 * Row actions (mission §11): "Open Trace" (via `TraceIdBadge`) and "Open Document" (via
 * `RelatedDocumentLink`, the same O-7 allowlist — never a guessed route) render only when
 * their target can actually be resolved. "View Audit" (mission §16) renders whenever a
 * row references a document, since Audit Trail's own filtered-empty state ("No audit
 * history") is itself an honest outcome, not a broken link. The actor name links back to
 * this same page filtered to that actor (mission §12, user-focused investigation) — never
 * to a page that doesn't exist.
 */
export function ActivityExplorerTable({ rows }: { rows: UserActivityEvent[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-sm font-medium text-graphite-900">No activity found</p>
        <p className="mt-1 text-sm text-graphite-500">No activity matches these filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-graphite-500">
            <th className="px-4 py-2.5 font-semibold">Time</th>
            <th className="px-4 py-2.5 font-semibold">User</th>
            <th className="px-4 py-2.5 font-semibold">Action</th>
            <th className="px-4 py-2.5 font-semibold">Module</th>
            <th className="px-4 py-2.5 font-semibold">Document</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
            <th className="px-4 py-2.5 font-semibold">Trace</th>
            <th className="px-4 py-2.5 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0 hover:bg-canvas/60">
              <td className="whitespace-nowrap px-4 py-2.5 text-graphite-500">
                <span title={new Date(row.occurredAt).toLocaleString()}>{formatRelativeTime(row.occurredAt)}</span>
                <span className="block text-xs text-graphite-500/70">{formatClockTime(row.occurredAt)}</span>
              </td>
              <td className="px-4 py-2.5">
                {row.actor ? (
                  <Link
                    href={`/admin/observability/activity?user=${encodeURIComponent(row.actor.email)}`}
                    className="text-graphite-900 hover:text-signal hover:underline"
                  >
                    {row.actor.fullName}
                  </Link>
                ) : (
                  <span className="text-graphite-500/50">Actor unavailable</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <span className="font-medium text-graphite-900">{row.action}</span>
                {row.description && <span className="block text-xs text-graphite-500">{row.description}</span>}
              </td>
              <td className="px-4 py-2.5 text-graphite-500">{row.module}</td>
              <td className="px-4 py-2.5 text-graphite-500">
                {row.referenceDoctype && row.referenceName ? (
                  <RelatedDocumentLink doctype={row.referenceDoctype} name={row.referenceName} />
                ) : (
                  <span className="text-graphite-500/50">—</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <ActivityStatusBadge status={row.status} />
              </td>
              <td className="px-4 py-2.5">
                {row.correlationId ? (
                  <TraceIdBadge
                    correlationId={row.correlationId}
                    openHref={`/admin/observability/traces/${encodeURIComponent(row.correlationId)}`}
                  />
                ) : (
                  <span className="text-graphite-500/50">—</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                {row.referenceDoctype && row.referenceName ? (
                  <Link
                    href={`/admin/observability/audit?doctype=${encodeURIComponent(row.referenceDoctype)}&document=${encodeURIComponent(row.referenceName)}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-signal hover:underline"
                  >
                    <History size={12} />
                    View Audit
                  </Link>
                ) : (
                  <span className="text-graphite-500/50">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
