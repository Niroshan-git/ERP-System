import { AlertTriangle, CheckCircle2, Clock, TimerOff, XCircle } from "lucide-react";
import type { IntegrationStatus } from "@/lib/observabilityCenter/types";

/**
 * Renders an Integration Monitoring row's status — its own badge, distinct from
 * `SeverityBadge` (error severity) and `ActivityStatusBadge` (activity outcome), per
 * mission §9: "do not confuse integration status with error severity." `TIMEOUT` gets its
 * own icon/tone deliberately different from `FAILED` (mission §23) so the two are visually
 * distinguishable at a glance, not just by label text.
 */
const CONFIG: Record<IntegrationStatus, { icon: typeof CheckCircle2; className: string }> = {
  SUCCESS: { icon: CheckCircle2, className: "bg-success/10 text-success" },
  FAILED: { icon: XCircle, className: "bg-alert text-white" },
  PENDING: { icon: Clock, className: "bg-signal/10 text-signal" },
  TIMEOUT: { icon: TimerOff, className: "border border-alert/40 bg-alert/15 text-alert" },
  WARNING: { icon: AlertTriangle, className: "bg-alert/10 text-alert" },
};

export function IntegrationStatusBadge({ status, className = "" }: { status: IntegrationStatus; className?: string }) {
  const { icon: Icon, className: toneClassName } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${toneClassName} ${className}`}
    >
      <Icon size={12} className="shrink-0" />
      {status}
    </span>
  );
}
