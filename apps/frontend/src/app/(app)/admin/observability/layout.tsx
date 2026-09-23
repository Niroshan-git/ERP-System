import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { resolveActorRoles } from "@/lib/erpnext";
import { SystemManagerOnlyNotice } from "@/components/SystemManagerOnlyNotice";
import { ObservabilityCheckFailedNotice } from "@/components/ObservabilityCheckFailedNotice";

/**
 * Real server-side authorization for every route under /admin/observability — not just
 * the Sidebar's nav-visibility filter (`Sidebar.tsx`'s `requiresSystemManager`), which is
 * a UX affordance only. Re-verifies the session cookie itself (same trusted source O-2's
 * `getActorContext()` uses) rather than trusting anything passed down from a parent
 * layout, so a direct request to this route is independently checked here.
 *
 * O-10 hardening: this route now serves (or leads to) real diagnostic data, so the O-2
 * independent review's own recommendation applies — the session's cached `isSystemManager`
 * flag (up to 12h stale, see `lib/session.ts`) is no longer sufficient on its own. Every
 * request re-resolves the role fresh via `resolveActorRoles()` (backed by
 * `smart_factory.api.observability.resolve_actor_roles`, i.e. a live `frappe.get_roles()`
 * call), so a demoted System Manager loses access immediately rather than at next login.
 * `cache()` from `react` scopes that resolution to once per request (not once per
 * component) without reintroducing any cross-request staleness — the safest reasonable
 * middle ground between "hit ERPNext on every render" and "trust a multi-hour-old cookie."
 * If the fresh check itself fails (e.g. ERPNext unreachable), access is denied — this is a
 * privileged boundary, so an unverifiable request must never fall back to trusting the
 * stale cached flag.
 */
const resolveFreshAuthorization = cache(async (email: string) => {
  try {
    const { isSystemManager } = await resolveActorRoles(email);
    return { checked: true as const, isSystemManager };
  } catch {
    return { checked: false as const, isSystemManager: false };
  }
});

export default async function ObservabilityLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl">
        <SystemManagerOnlyNotice />
      </div>
    );
  }

  const authorization = await resolveFreshAuthorization(session.email);

  if (!authorization.checked) {
    return (
      <div className="mx-auto max-w-2xl">
        <ObservabilityCheckFailedNotice />
      </div>
    );
  }

  if (!authorization.isSystemManager) {
    return (
      <div className="mx-auto max-w-2xl">
        <SystemManagerOnlyNotice />
      </div>
    );
  }

  return <>{children}</>;
}
