import { Circle, MousePointerClick, Server, ShieldCheck, XCircle } from "lucide-react";
import type { TraceEvent } from "@/lib/observabilityCenter/types";

/**
 * Vertical operation timeline for Trace Detail (mission §16/§17). Each step gets an icon
 * by `kind` (never color alone, per §29/§31), a title, a short user-safe detail line, and
 * a millisecond-precision timestamp. Kept deliberately plain-text — no JSON dump, per
 * §17's "keep it understandable to ERP consultants/support staff."
 */
const KIND_ICON: Record<TraceEvent["kind"], typeof Circle> = {
  USER_ACTION: MousePointerClick,
  SERVER_ACTION: Server,
  ERPNEXT_API: Server,
  ERPNEXT_VALIDATION: ShieldCheck,
  ERROR: XCircle,
};

function formatMs(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}.${String(
    d.getMilliseconds(),
  ).padStart(3, "0")}`;
}

export function TraceTimeline({ events }: { events: TraceEvent[] }) {
  return (
    <ol>
      {events.map((event, i) => {
        const Icon = KIND_ICON[event.kind];
        const isLast = i === events.length - 1;
        const isError = event.kind === "ERROR";
        return (
          <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && <span className="absolute left-[11px] top-6 h-full w-px bg-border" aria-hidden />}
            <span
              className={`z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                isError ? "bg-alert text-white" : "bg-graphite-500/10 text-graphite-500"
              }`}
            >
              <Icon size={13} />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className={`text-sm font-medium ${isError ? "text-alert" : "text-graphite-900"}`}>{event.label}</span>
                <span className="font-mono text-xs text-graphite-500">{formatMs(event.occurredAt)}</span>
              </div>
              <p className="mt-0.5 text-sm text-graphite-500">{event.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
