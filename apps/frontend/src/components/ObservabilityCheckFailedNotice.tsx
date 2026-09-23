import { ShieldAlert } from "lucide-react";

/**
 * Shown when the fresh, request-time System Manager role check
 * (app/(app)/admin/observability/layout.tsx, via resolveActorRoles()) itself fails — e.g.
 * ERPNext is unreachable — as distinct from SystemManagerOnlyNotice, which means the check
 * succeeded and the answer was "no." A failed check must never fall back to the session's
 * stale cached isSystemManager flag: this is a privileged boundary, so an unverifiable
 * request is denied (fail-closed), not silently trusted.
 */
export function ObservabilityCheckFailedNotice() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-alert" />
        <div>
          <p className="text-sm font-medium text-graphite-900">Observability access check unavailable</p>
          <p className="mt-1 text-sm text-graphite-500">
            Ceylon Stack couldn&apos;t freshly verify your System Manager role against ERPNext just now, so
            access to the Observability Center is denied until it can. This usually means ERPNext is
            temporarily unreachable — try again shortly.
          </p>
        </div>
      </div>
    </div>
  );
}
