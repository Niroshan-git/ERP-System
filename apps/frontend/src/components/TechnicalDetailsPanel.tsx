import { Lock } from "lucide-react";
import type { TechnicalDetails } from "@/lib/observabilityCenter/types";

/**
 * Gated technical-diagnostics container (mission §19/§20). The O-2 independent review
 * found a real redaction gap (access_token/refresh_token bypassing `lib/redact.ts`) —
 * until a backend package explicitly marks diagnostic fields safe for UI consumption,
 * this never renders anything from a live source. What it renders today is DEMO data
 * only, for the handful of fixtures that opted in (`demoProvider.ts`'s `technicalDetails`)
 * — labeled as such, never presented as if it came from a live ERPNext instance.
 * Fields with no value are simply omitted (§14: "do not display meaningless empty
 * fields") rather than shown as an empty row. Never stringifies an arbitrary object —
 * only the fixed, named fields `TechnicalDetails` declares.
 */
export function TechnicalDetailsPanel({ details }: { details: TechnicalDetails }) {
  if (!details.available) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <Lock size={15} className="text-graphite-500" />
          <h2 className="text-sm font-semibold text-graphite-900">Technical Details</h2>
        </div>
        <p className="mt-2 text-sm text-graphite-500">
          Technical diagnostics will become available when secure diagnostic access is enabled.
        </p>
      </div>
    );
  }

  const rows: { label: string; value: string }[] = [
    details.errorType ? { label: "Error Type", value: details.errorType } : null,
    details.erpnextMessage ? { label: "ERPNext Message", value: details.erpnextMessage } : null,
    details.requestContext ? { label: "Request Context", value: details.requestContext } : null,
    details.responseContext ? { label: "Response Context", value: details.responseContext } : null,
    details.stackTrace ? { label: "Stack Trace", value: details.stackTrace } : null,
  ].filter((r): r is { label: string; value: string } => r !== null);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-graphite-900">Technical Details</h2>
        <span className="rounded-full bg-graphite-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-graphite-500">
          Demo data
        </span>
      </div>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-medium text-graphite-500">{row.label}</dt>
            <dd className="mt-0.5 whitespace-pre-wrap font-mono text-xs text-graphite-900">{row.value}</dd>
          </div>
        ))}
        {details.metadata && Object.keys(details.metadata).length > 0 && (
          <div>
            <dt className="text-xs font-medium text-graphite-500">Metadata</dt>
            <dd className="mt-1 space-y-0.5">
              {Object.entries(details.metadata).map(([key, value]) => (
                <div key={key} className="font-mono text-xs text-graphite-900">
                  <span className="text-graphite-500">{key}:</span> {value}
                </div>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
