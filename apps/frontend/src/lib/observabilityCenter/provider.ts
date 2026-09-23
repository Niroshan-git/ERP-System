import "server-only";
import {
  getDemoActivity,
  getDemoAuditRecords,
  getDemoErrors,
  getDemoIntegrationEvents,
  getDemoIntegrationSummary,
  getDemoObservabilitySummary,
  getDemoTechnicalDetails,
  getDemoTrace,
} from "./demoProvider";
import type {
  AuditListResult,
  ErrorListResult,
  IntegrationHealthSummary,
  IntegrationListResult,
  ObservabilityFilters,
  ObservabilitySummary,
  TechnicalDetails,
  Trace,
  TrendRange,
  UserActivityListResult,
} from "./types";

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
  /** One page of Error Explorer rows. `pagination.page`/`pageSize` are inputs (what page
   * to fetch); the returned `pagination.total` is the real filtered count — this is a
   * real page-by-page contract (mission §27/§12), not "fetch everything and paginate in
   * the browser." A future real adapter must honor the same contract: filter and page
   * server-side, never return the whole Error Log to this function's caller. */
  getErrors(filters: ObservabilityFilters, page: number, pageSize: number): Promise<ErrorListResult>;
  /** Resolves one trace by its exact correlation ID, or `null` if no trace exists (or the
   * caller isn't permitted to see it) — callers must render an honest not-found state on
   * `null`, never assume a malformed ID means "not found yet, try again." */
  getTrace(correlationId: string): Promise<Trace | null>;
  /** Gated technical-diagnostics fetch, kept separate from `getTrace()` — see §19/§20 of
   * the O-7 mission brief and the O-2 independent review's redaction finding. A real
   * adapter should treat this as the point where secure-diagnostic authorization is
   * actually enforced, not `getTrace()`'s general summary data. Today this always returns
   * `{ available: false }` unless the demo fixture explicitly opted in. */
  getTechnicalDetails(correlationId: string): Promise<TechnicalDetails>;
  /** One page of User Activity rows (O-8) — same real page-by-page contract as
   * `getErrors()`: filter and page server-side, never return the whole activity log to
   * the caller. */
  getActivity(filters: ObservabilityFilters, page: number, pageSize: number): Promise<UserActivityListResult>;
  /** One page of Audit Trail rows (O-8) — same contract as `getErrors()`/`getActivity()`.
   * Modeled around native `Version` diffs (mission §19); never returns raw `Version`
   * JSON, only the already-transformed `AuditChange[]` shape `types.ts` defines. */
  getAuditRecords(filters: ObservabilityFilters, page: number, pageSize: number): Promise<AuditListResult>;
  /** Integration Monitoring's compact health row (O-9, mission §6) — always computed from
   * the full current fixture set, not scoped to a `TrendRange` like `getSummary()`; no
   * screen needs a range-scoped version of this yet. */
  getIntegrationSummary(): Promise<IntegrationHealthSummary>;
  /** One page of Integration Explorer rows (O-9) — same real page-by-page contract as
   * `getErrors()`/`getActivity()`/`getAuditRecords()`. */
  getIntegrationEvents(filters: ObservabilityFilters, page: number, pageSize: number): Promise<IntegrationListResult>;
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
    async getErrors(filters, page, pageSize) {
      return getDemoErrors(filters, page, pageSize);
    },
    async getTrace(correlationId) {
      return getDemoTrace(correlationId);
    },
    async getTechnicalDetails(correlationId) {
      return getDemoTechnicalDetails(correlationId);
    },
    async getActivity(filters, page, pageSize) {
      return getDemoActivity(filters, page, pageSize);
    },
    async getAuditRecords(filters, page, pageSize) {
      return getDemoAuditRecords(filters, page, pageSize);
    },
    async getIntegrationSummary() {
      return getDemoIntegrationSummary();
    },
    async getIntegrationEvents(filters, page, pageSize) {
      return getDemoIntegrationEvents(filters, page, pageSize);
    },
  };
}
