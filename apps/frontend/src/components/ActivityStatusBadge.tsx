import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { UserActivityEvent } from "@/lib/observabilityCenter/types";

/**
 * Renders a User Activity row's status — deliberately a separate component from
 * `SeverityBadge` (mission §13: "Do not confuse activity status with error severity —
 * these are separate concepts"). Same visual language (label always visible, icon +
 * intensity of the existing `success`/`alert`/`signal` tokens, no new palette) as
 * `SeverityBadge` for consistency, but its own value set.
 */
const CONFIG: Record<UserActivityEvent["status"], { icon: typeof CheckCircle2; className: string }> = {
  Success: { icon: CheckCircle2, className: "bg-success/10 text-success" },
  Failed: { icon: XCircle, className: "bg-alert text-white" },
  Pending: { icon: Clock, className: "bg-signal/10 text-signal" },
  Warning: { icon: AlertTriangle, className: "bg-alert/10 text-alert" },
};

export function ActivityStatusBadge({ status, className = "" }: { status: UserActivityEvent["status"]; className?: string }) {
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
