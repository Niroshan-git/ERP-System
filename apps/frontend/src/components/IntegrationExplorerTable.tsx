"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Activity, ChevronDown, ChevronRight, History } from "lucide-react";
import { IntegrationStatusBadge } from "@/components/IntegrationStatusBadge";
import { RelatedDocumentLink } from "@/components/RelatedDocumentLink";
import { TraceIdBadge } from "@/components/TraceIdBadge";
import { formatClockTime, formatDuration, formatRelativeTime } from "@/lib/observabilityCenter/format";
import type { IntegrationEvent } from "@/lib/observabilityCenter/types";

/**
 * Integration Monitoring's primary table (O-9). Expandable-row detail, same pattern and
 * rationale as O-8's `AuditExplorerTable` — every field a detail view needs (mission
 * §13/§14) already lives on `IntegrationEvent` itself, so an inline expand needs no
 * separate fetch/route, unlike Trace Detail's own gated technical-diagnostics call.
 *
 * Null-actor rendering (mission §27): a null `actor` renders "Actor unavailable" unless
 * the event explicitly sets `systemGenerated: true`, in which case it renders "System" —
 * never inferred from the null actor alone. Deliberately not shared with `ActivityExplorerTable`'s
 * unconditional "System" fallback (out of scope for this package — see
 * `docs/observability-frontend-architecture.md`'s "Null actor semantics" section).
 */
function ActorCell({ actor, systemGenerated }: { actor: IntegrationEvent["actor"]; systemGenerated?: boolean }) {
  if (actor) return <span className="text-graphite-900">{actor.fullName}</span>;
  return <span className="text-graphite-500/50">{systemGenerated ? "System" : "Actor unavailable"}</span>;
}

export function IntegrationExplorerTable({ rows }: { rows: IntegrationEvent[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-sm font-medium text-graphite-900">No integration events found</p>
        <p className="mt-1 text-sm text-graphite-500">No integration operations match these filters.</p>
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
            <th className="px-4 py-2.5 font-semibold">Integration</th>
            <th className="px-4 py-2.5 font-semibold">Operation</th>
            <th className="px-4 py-2.5 font-semibold">Status</th>
            <th className="px-4 py-2.5 font-semibold">Duration</th>
            <th className="px-4 py-2.5 font-semibold">Document</th>
            <th className="px-4 py-2.5 font-semibold">Actor</th>
            <th className="px-4 py-2.5 font-semibold">Trace</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpanded = expandedId === row.id;
            const hasDocument = Boolean(row.referenceDoctype && row.referenceName);
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
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-graphite-900">{row.integration}</span>
                    <span className="block text-xs text-graphite-500">{row.integrationType}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-graphite-900">{row.operation}</td>
                  <td className="px-4 py-2.5">
                    <IntegrationStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-2.5 text-graphite-500">
                    {row.durationMs !== undefined ? formatDuration(row.durationMs) : <span className="text-graphite-500/50">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-graphite-500">
                    {hasDocument ? (
                      <RelatedDocumentLink doctype={row.referenceDoctype!} name={row.referenceName!} />
                    ) : (
                      <span className="text-graphite-500/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <ActorCell actor={row.actor} systemGenerated={row.systemGenerated} />
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
                    <td colSpan={9} className="px-4 py-4">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,260px)_1fr]">
                        <dl className="space-y-2 text-sm">
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">Integration</dt>
                            <dd className="text-graphite-900">
                              {row.integration} <span className="text-graphite-500">({row.integrationType})</span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">Operation</dt>
                            <dd className="font-mono text-xs text-graphite-900">{row.operation}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">Status</dt>
                            <dd>
                              <IntegrationStatusBadge status={row.status} />
                              {row.errorClassification && (
                                <span className="ml-2 text-xs text-graphite-500">{row.errorClassification}</span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">Started</dt>
                            <dd className="text-graphite-900">{new Date(row.occurredAt).toLocaleString()}</dd>
                          </div>
                          {row.completedAt && (
                            <div>
                              <dt className="text-xs font-medium text-graphite-500">Completed</dt>
                              <dd className="text-graphite-900">{new Date(row.completedAt).toLocaleString()}</dd>
                            </div>
                          )}
                          {row.durationMs !== undefined && (
                            <div>
                              <dt className="text-xs font-medium text-graphite-500">Duration</dt>
                              <dd className="text-graphite-900">{formatDuration(row.durationMs)}</dd>
                            </div>
                          )}
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">Actor</dt>
                            <dd className="text-graphite-900">
                              {row.actor ? (
                                `${row.actor.fullName} (${row.actor.email})`
                              ) : (
                                <ActorCell actor={null} systemGenerated={row.systemGenerated} />
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-graphite-500">Source</dt>
                            <dd className="text-graphite-900">{row.source}</dd>
                          </div>
                        </dl>

                        <div className="space-y-4">
                          <div>
                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-graphite-500">Result</p>
                            <p className="text-sm text-graphite-900">{row.safeMessage}</p>
                          </div>

                          {(row.safeRequestSummary || row.safeResponseSummary) && (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {row.safeRequestSummary && (
                                <div>
                                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-graphite-500">
                                    Safe Request Summary
                                  </p>
                                  <p className="rounded-md bg-canvas p-2 font-mono text-xs text-graphite-900">
                                    {row.safeRequestSummary}
                                  </p>
                                </div>
                              )}
                              {row.safeResponseSummary && (
                                <div>
                                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-graphite-500">
                                    Safe Response Summary
                                  </p>
                                  <p className="rounded-md bg-canvas p-2 font-mono text-xs text-graphite-900">
                                    {row.safeResponseSummary}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs">
                            {hasDocument && (
                              <RelatedDocumentLink doctype={row.referenceDoctype!} name={row.referenceName!} />
                            )}
                            {row.correlationId && (
                              <Link
                                href={`/admin/observability/traces/${encodeURIComponent(row.correlationId)}`}
                                className="inline-flex items-center gap-1 font-medium text-signal hover:underline"
                              >
                                Open Trace
                              </Link>
                            )}
                            {row.actor && (
                              <Link
                                href={`/admin/observability/activity?user=${encodeURIComponent(row.actor.email)}`}
                                className="inline-flex items-center gap-1 font-medium text-signal hover:underline"
                              >
                                <Activity size={12} />
                                View Actor Activity
                              </Link>
                            )}
                            {hasDocument && (
                              <Link
                                href={`/admin/observability/audit?doctype=${encodeURIComponent(row.referenceDoctype!)}&document=${encodeURIComponent(row.referenceName!)}`}
                                className="inline-flex items-center gap-1 font-medium text-signal hover:underline"
                              >
                                <History size={12} />
                                View Audit History
                              </Link>
                            )}
                          </div>
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
