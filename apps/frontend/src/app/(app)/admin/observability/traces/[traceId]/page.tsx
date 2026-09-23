import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SeverityBadge } from "@/components/SeverityBadge";
import { TraceIdBadge } from "@/components/TraceIdBadge";
import { TraceTimeline } from "@/components/TraceTimeline";
import { TechnicalDetailsPanel } from "@/components/TechnicalDetailsPanel";
import { RelatedDocumentLink } from "@/components/RelatedDocumentLink";
import { CopyTextButton } from "@/components/CopyTextButton";
import { buildSupportSummary } from "@/lib/observabilityCenter/format";
import { getObservabilityProvider } from "@/lib/observabilityCenter/provider";

/**
 * Trace Detail (package O-7) — the core support-investigation screen. Reads exclusively
 * through `getObservabilityProvider()` (still DEMO; see
 * `docs/observability-frontend-architecture.md`). Authorization is inherited from
 * `app/(app)/admin/observability/layout.tsx`.
 *
 * Deliberately does NOT use `notFound()`/Next's generic not-found boundary — mission §24
 * specifies exact "Trace not found" copy and a "Back to Error Explorer" action, which
 * needs to be this page's own content, not the framework's default 404 page.
 */
export default async function TraceDetailPage({ params }: { params: Promise<{ traceId: string }> }) {
  const { traceId } = await params;

  const provider = getObservabilityProvider();
  const trace = await provider.getTrace(traceId).catch(() => null);

  if (!trace) {
    return (
      <div>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Admin", href: "/admin/observability" },
            { label: "Observability", href: "/admin/observability" },
            { label: "Errors", href: "/admin/observability/errors" },
            { label: "Not found" },
          ]}
        />
        <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface p-8 text-center">
          <h1 className="text-base font-semibold text-graphite-900">Trace not found</h1>
          <p className="mt-2 text-sm text-graphite-500">
            No trace was found for <span className="font-mono">{traceId}</span>, or you may not have permission
            to view it.
          </p>
          <Link
            href="/admin/observability/errors"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-signal hover:underline"
          >
            <ArrowLeft size={14} />
            Back to Error Explorer
          </Link>
        </div>
      </div>
    );
  }

  const technicalDetails = await provider.getTechnicalDetails(trace.correlationId).catch(() => ({ available: false as const }));
  const supportSummary = buildSupportSummary(trace);

  type SummaryRow = { label: string; value: React.ReactNode };
  const summaryRowCandidates: (SummaryRow | null)[] = [
    { label: "Occurred", value: new Date(trace.occurredAt).toLocaleString() },
    { label: "Severity", value: <SeverityBadge severity={trace.severity} /> },
    { label: "Status", value: trace.status },
    { label: "Source", value: trace.source },
    { label: "Module", value: trace.module },
    { label: "Operation", value: trace.operation },
    trace.route ? { label: "Route", value: <span className="font-mono text-xs">{trace.route}</span> } : null,
    trace.referenceDoctype ? { label: "DocType", value: trace.referenceDoctype } : null,
    trace.referenceName
      ? { label: "Document", value: <RelatedDocumentLink doctype={trace.referenceDoctype!} name={trace.referenceName} /> }
      : null,
    trace.httpStatus !== undefined ? { label: "HTTP Status", value: String(trace.httpStatus) } : null,
    trace.durationMs !== undefined ? { label: "Duration", value: `${trace.durationMs.toFixed(0)} ms` } : null,
  ];
  const summaryRows: SummaryRow[] = summaryRowCandidates.filter((r): r is SummaryRow => r !== null);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Admin", href: "/admin/observability" },
          { label: "Observability", href: "/admin/observability" },
          { label: "Errors", href: "/admin/observability/errors" },
          { label: trace.correlationId },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <SeverityBadge severity={trace.severity} />
          <h1 className="mt-2 text-xl font-semibold text-graphite-900">{trace.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-graphite-500">Trace</span>
            <TraceIdBadge correlationId={trace.correlationId} size="md" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/observability/errors"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-graphite-900 hover:bg-canvas"
          >
            <ArrowLeft size={14} />
            Back to Errors
          </Link>
          <CopyTextButton text={supportSummary} label="Copy Support Summary" />
          {trace.referenceDoctype && trace.referenceName && (
            <>
              <RelatedDocumentLink doctype={trace.referenceDoctype} name={trace.referenceName} />
              <Link
                href={`/admin/observability/audit?doctype=${encodeURIComponent(trace.referenceDoctype)}&document=${encodeURIComponent(trace.referenceName)}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm font-medium text-graphite-900 hover:bg-canvas"
              >
                <History size={14} />
                View Audit
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-graphite-900">Trace Summary</h2>
          <dl className="space-y-2.5">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
                <dt className="text-graphite-500">{row.label}</dt>
                <dd className="text-right text-graphite-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-graphite-900">Actor vs Execution Principal</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-graphite-500">Actor</p>
              {trace.actor ? (
                <>
                  <p className="mt-1 text-sm font-medium text-graphite-900">{trace.actor.fullName}</p>
                  <p className="text-xs text-graphite-500">{trace.actor.email}</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-graphite-500">Unknown — no Ceylon Stack session was resolved for this event.</p>
              )}
              <p className="mt-1 text-xs text-graphite-500/70">Authenticated Ceylon Stack user who initiated the operation.</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-graphite-500">Execution Principal</p>
              <p className="mt-1 font-mono text-sm text-graphite-900">{trace.executionPrincipal.email}</p>
              <p className="mt-1 text-xs text-graphite-500/70">ERPNext account used to execute the operation.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Error</h2>
        <p className="text-sm text-graphite-900">{trace.userSafeMessage}</p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-sm font-semibold text-graphite-900">Operation Timeline</h2>
        <TraceTimeline events={trace.events} />
      </div>

      <TechnicalDetailsPanel details={technicalDetails} />
    </div>
  );
}
