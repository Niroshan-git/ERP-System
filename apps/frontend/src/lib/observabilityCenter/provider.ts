import "server-only";
import { getDemoObservabilitySummary } from "./demoProvider";
import type { ObservabilitySummary, TrendRange } from "./types";

/**
 * The data-provider boundary the Observability Center UI reads through — pages never call
 * `demoProvider.ts` (or, eventually, a real ERPNext-backed adapter) directly. This is the
 * one seam a future backend package (O-7 onward) replaces: swap what
 * `getObservabilityProvider()` returns, and every screen built against this interface picks
 * up real data with no UI change, matching the mission's §30 data-architecture requirement.
 *
 * Server-only: even the eventual real adapter must never let ERPNext service credentials or
 * raw diagnostic payloads reach the browser (see `docs/observability-architecture.md`'s trust
 * model and the O-2 independent review's redaction finding) — this boundary is where that
 * gets enforced, the same way `lib/erpnext.ts` is the one chokepoint for ERPNext calls.
 */
export type ObservabilityProvider = {
  getSummary(range: TrendRange): Promise<ObservabilitySummary>;
};

/**
 * Always the demo adapter today — no real backend observability *read* API exists yet
 * (O-2 only built the *write* side: `log_operation`/`resolve_actor_roles`). When a future
 * package adds a real read-side `smart_factory` whitelisted method, this function is the
 * only place that needs to change: return that adapter instead, gated on real
 * environment/config rather than always-demo. Every current caller already goes through
 * this function, never `demoProvider.ts` directly, so that swap requires no other edits.
 */
export function getObservabilityProvider(): ObservabilityProvider {
  return {
    async getSummary(range) {
      return getDemoObservabilitySummary(range);
    },
  };
}
