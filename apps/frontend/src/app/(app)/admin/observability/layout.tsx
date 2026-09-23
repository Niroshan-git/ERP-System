import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { SystemManagerOnlyNotice } from "@/components/SystemManagerOnlyNotice";

/**
 * Real server-side authorization for every route under /admin/observability — not just
 * the Sidebar's nav-visibility filter (`Sidebar.tsx`'s `requiresSystemManager`), which is
 * a UX affordance only. Re-verifies the session cookie itself (same trusted source O-2's
 * `getActorContext()` uses) rather than trusting anything passed down from a parent
 * layout, so a direct request to this route is independently checked here.
 *
 * Per this mission's §33/§11 guidance: `isSystemManager` is a role snapshot cached for
 * the session's 12h lifetime (see `lib/session.ts`), which is an accepted, already-
 * documented limitation for general navigation — acceptable for gating this demo-data
 * Overview screen. It is explicitly *not* sufficient on its own once a future package
 * wires this route to real diagnostic data; that will need a fresh server-side role
 * check at request time (re-calling `resolveActorRoles()`), per the O-2 independent
 * review's recommendation — see `docs/observability-frontend-architecture.md`'s
 * "Permission boundary" section.
 */
export default async function ObservabilityLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);

  if (!session?.isSystemManager) {
    return (
      <div className="mx-auto max-w-2xl">
        <SystemManagerOnlyNotice />
      </div>
    );
  }

  return <>{children}</>;
}
