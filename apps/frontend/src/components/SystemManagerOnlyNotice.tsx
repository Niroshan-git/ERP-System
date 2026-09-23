import { ShieldAlert } from "lucide-react";

/**
 * Shown when a non-System-Manager reaches an Observability route directly by URL (the
 * Sidebar already hides the entry point — see `Sidebar.tsx`'s `isSystemManager` gating —
 * but hiding navigation is a UX affordance, not a security boundary, per this mission's
 * §33; a direct request still needs a real server-side check, done in
 * `app/(app)/admin/observability/layout.tsx`).
 *
 * Distinct from `AccessDeniedNotice.tsx`, which is specifically about the shared ERPNext
 * service account lacking a Frappe permission grant — a different failure mode with
 * different remediation (ask an ERPNext admin for a Role) than this one (you personally
 * are not a System Manager in Ceylon Stack).
 */
export function SystemManagerOnlyNotice() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-start gap-3">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-alert" />
        <div>
          <p className="text-sm font-medium text-graphite-900">Restricted to System Managers</p>
          <p className="mt-1 text-sm text-graphite-500">
            The Observability Center shows operational and diagnostic information intended for
            administrators. Your account does not currently have the System Manager role in ERPNext.
            Ask an administrator to grant it if you believe you should have access.
          </p>
        </div>
      </div>
    </div>
  );
}
