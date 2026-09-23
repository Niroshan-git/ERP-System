import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";

/**
 * The real authenticated Ceylon Stack human, as distinct from the shared ERPNext execution
 * principal (the "Frontend Integration" service account every erpnextFetch() call actually
 * authenticates to Frappe as — see erpnext.ts's serviceAuthHeader()). See
 * docs/observability-architecture.md's "actor vs execution principal" note for why both
 * identities need to stay distinguishable rather than collapsed into one.
 */
export type ActorContext = {
  email: string;
  fullName: string;
  isSystemManager: boolean;
};

/**
 * Resolves the actor from the already-verified, httpOnly, HMAC-signed session cookie
 * (middleware.ts has already rejected any request without a valid one for every route this
 * runs from). Never accepts identity from request headers/body — the browser cannot forge
 * this without SESSION_SECRET. Returns null rather than throwing on any resolution failure
 * (e.g. called outside a request scope) so a context-resolution hiccup never blocks the
 * actual ERPNext call it's describing.
 */
export async function getActorContext(): Promise<ActorContext | null> {
  try {
    const jar = await cookies();
    const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
    if (!session) return null;
    return {
      email: session.email,
      fullName: session.fullName,
      isSystemManager: session.isSystemManager ?? false,
    };
  } catch {
    return null;
  }
}
