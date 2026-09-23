"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AuditChangesList } from "@/components/AuditChangesList";
import { RelatedDocumentLink } from "@/components/RelatedDocumentLink";
import { TraceIdBadge } from "@/components/TraceIdBadge";
import { formatClockTime, formatRelativeTime } from "@/lib/observabilityCenter/format";
import type { AuditRecord } from "@/lib/observabilityCenter/types";

/**
 * Audit Trail's primary table (O-8). Chosen detail pattern (mission §22) is an
 * expandable row — every field a detail view needs already lives on `AuditRecord` itself
 * (no separate fetch/route needed, unlike Trace Detail which has its own gated technical-
 * diagnostics call), so an inline expand is simpler than a second navigation for what's
 * fundamentally the same investigation step. Client component only for the local
 * expand/collapse toggle — no data fetching happens here, filters/pagination stay
 * server-side and URL-driven exactly like every other list page.
 */
export function AuditExplorerTable({ rows }: { rows: AuditRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-sm font-medium text-graphite-900">No audit history</p>
        <p className="mt-1 text-sm text-graphite-500">No changes match these filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-graphite-500">
            <th className="w-8 px-2 py-2.5" />
            <th className="px-4 py-2.5 font-semibold">Time</th>
            <th className="px-4 py-2.5 font-semibold">Actor</th>
            <th className="px-4 py-2.5 font-semibold">Document</th>
            <th className="px-4 py-2.5 font-semibold">Action</th>
            <th className="px-4 py-2.5 font-semibold">Changes</th>
            <th className="px-4 py-2.5 font-semibold">Trace</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpanded = expandedId === row.id;
            return (
              <Fragment key={row.id}>
                <tr
                  onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-canvas/60"
                >
                  <td className="px-2 py-2.5 text-graphite-500">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-graphite-500">
                    <span title={new Date(row.occurredAt).toLocaleString()}>{formatRelativeTime(row.occurredAt)}</span>
                    <span className="block text-xs text-graphite-500/70">{formatClockTime(row.occurredAt)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-graphite-900">
                    {row.actor ? (
                      <>
                        <span>{row.actor.fullName}</span>
                        <span className="block text-xs text-graphite-500">{row.actor.email}</span>
                      </>
                    ) : (
                      <span className="text-graphite-500/50">Actor unavailable</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="block font-mono text-xs text-graphite-900">{row.referenceName}</span>
                    <span className="block text-xs text-graphite-500">{row.referenceDoctype}</span>
                  </td>
                  <td className="px-4 py-2.5 text-graphite-900">{row.action}</td>
                  <td className="px-4 py-2.5 text-graphite-500">
                    {row.changes.length} {row.changes.length === 1 ? "field" : "fields"}
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
                </tr>
                {isExpanded && (
                  <tr className="border-b border-border last:border-0 bg-canvas/40">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,220px)_1fr]">
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">Who</dt>
                            <dd className="text-graphite-900">
                              {row.actor ? `${row.actor.fullName} (${row.actor.email})` : "Actor unavailable"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">What</dt>
                            <dd className="text-graphite-900">{row.action}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">When</dt>
                            <dd className="text-graphite-900">{new Date(row.occurredAt).toLocaleString()}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">Document</dt>
                            <dd>
                              <RelatedDocumentLink doctype={row.referenceDoctype} name={row.referenceName} />
                            </dd>
                          </div>
                        </dl>
                        <div>
                          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-graphite-500">
                            Field Changes
                          </p>
                          <AuditChangesList changes={row.changes} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
