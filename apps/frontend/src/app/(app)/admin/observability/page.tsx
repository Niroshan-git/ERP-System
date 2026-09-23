import { AlertOctagon, Cable, ClipboardList, Siren } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineChart } from "@/components/LineChart";
import { ObservabilityHealthCard } from "@/components/ObservabilityHealthCard";
import { ObservabilityRangeTabs } from "@/components/ObservabilityRangeTabs";
import { ObservabilityTraceSearch } from "@/components/ObservabilityTraceSearch";
import { SeverityBadge } from "@/components/SeverityBadge";
import { TraceIdBadge } from "@/components/TraceIdBadge";
import { formatRelativeTime } from "@/lib/observabilityCenter/format";
import { getObservabilityProvider } from "@/lib/observabilityCenter/provider";
import type { TrendRange } from "@/lib/observabilityCenter/types";

const VALID_RANGES: TrendRange[] = ["24h", "7d", "30d"];

function parseRange(value: string | string[] | undefined): TrendRange {
  const candidate = Array.isArray(value) ? value[0] : value;
  return VALID_RANGES.includes(candidate as TrendRange) ? (candidate as TrendRange) : "24h";
}

/**
 * Observability Overview — Admin -> Observability's landing page (package O-6). Reads
 * exclusively through `getObservabilityProvider()`, currently always the DEMO adapter
 * (`lib/observabilityCenter/demoProvider.ts`) — no live ERPNext/Error Log/Activity Log
 * call happens on this page. See `docs/observability-frontend-architecture.md` for the
 * LIVE/DEMO/WAITING_FOR_BACKEND breakdown and the O-7+ swap plan.
 *
 * Access to this whole route is re-checked server-side in
 * `app/(app)/admin/observability/layout.tsx` — this page itself doesn't need its own
 * authorization check.
 */
export default async function ObservabilityOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const range = parseRange(params.range);

  const provider = getObservabilityProvider();
  const summary = await provider.getSummary(range);

  const errorsDelta = summary.errorsToday - summary.errorsYesterday;
  const errorsDeltaLabel =
    errorsDelta === 0 ? "Same as yesterday" : `${errorsDelta > 0 ? "+" : ""}${errorsDelta} since yesterday`;

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Admin" }, { label: "Observability" }]} />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-graphite-900">Observability</h1>
            <span className="rounded-full bg-graphite-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-graphite-500">
              Demo data
            </span>
          </div>
          <p className="mt-1 text-sm text-graphite-500">
            Monitor application health, investigate failures and trace user operations.
          </p>
        </div>
        <ObservabilityTraceSearch />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ObservabilityHealthCard
          label="Errors Today"
          value={summary.errorsToday}
          subLabel={errorsDeltaLabel}
          icon={AlertOctagon}
          tone={summary.errorsToday > 0 ? "alert" : "neutral"}
        />
        <ObservabilityHealthCard
          label="Critical"
          value={summary.criticalErrors}
          subLabel={summary.criticalErrors > 0 ? "Requires attention" : "Nothing open"}
          icon={Siren}
          tone={summary.criticalErrors > 0 ? "alert" : "neutral"}
        />
        <ObservabilityHealthCard
          label="Failed Integrations"
          value={summary.failedIntegrations}
          subLabel="Last 30 days"
          icon={Cable}
          tone={summary.failedIntegrations > 0 ? "alert" : "neutral"}
        />
        <ObservabilityHealthCard
          label="Activity"
          value={`${summary.recentActivityCount} operations`}
          subLabel={`In the last ${range === "24h" ? "24 hours" : range === "7d" ? "7 days" : "30 days"}`}
          icon={ClipboardList}
          tone="signal"
        />
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-graphite-900">Error Trend</h2>
          <ObservabilityRangeTabs active={range} />
        </div>
        {summary.errorTrend.some((p) => p.count > 0) ? (
          <LineChart labels={summary.errorTrend.map((p) => p.label)} values={summary.errorTrend.map((p) => p.count)} />
        ) : (
          <p className="py-8 text-center text-sm text-graphite-500">No errors found for this period.</p>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-graphite-900">Errors by Module</h2>
          {summary.errorsByModule.length === 0 ? (
            <p className="py-6 text-center text-sm text-graphite-500">No errors found for this period.</p>
          ) : (
            <ul className="space-y-2">
              {summary.errorsByModule.map((row) => (
                <li key={row.module} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm">
                  <span className="text-graphite-900">{row.module}</span>
                  <span className="flex items-center gap-2">
                    {row.criticalCount > 0 && (
                      <span className="text-xs font-medium text-alert">{row.criticalCount} critical</span>
                    )}
                    <span className="text-graphite-500">{row.count} errors</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-graphite-500/70">Opens a filtered Error Explorer once that package ships.</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-graphite-900">Recent Critical Events</h2>
          {summary.recentCriticalEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-graphite-500">No errors found for this period.</p>
          ) : (
            <ul className="space-y-3">
              {summary.recentCriticalEvents.map((event) => (
                <li key={event.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={event.severity} />
                      <span className="text-sm font-medium text-graphite-900">{event.operation}</span>
                    </div>
                    <span className="text-xs text-graphite-500">{formatRelativeTime(event.occurredAt)}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-graphite-500">
                    <span>{event.module}</span>
                    {event.referenceName && (
                      <>
                        <span className="text-graphite-500/40">•</span>
                        <span className="font-mono">{event.referenceName}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2">
                    <TraceIdBadge correlationId={event.correlationId} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
