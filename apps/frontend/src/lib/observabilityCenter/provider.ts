import "server-only";
import {
  getDemoActivity,
  getDemoAuditRecords,
  getDemoIntegrationEvents,
  getDemoIntegrationSummary,
  getDemoObservabilitySummary,
} from "./demoProvider";
import { getServerObservabilityProvider } from "./serverProvider";
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
 * `demoProvider.ts`/`serverProvider.ts` directly. This is the one seam that decides, per
 * method, whether a screen is LIVE or DEMO (see `getObservabilityProvider()`'s own doc
 * comment below for the current LIVE/DEMO split as of O-10C).
 *
 * Server-only: the real adapter must never let ERPNext service credentials or raw
 * diagnostic payloads reach the browser (see `docs/observability-architecture.md`'s trust
 * model and the O-2 independent review's redaction finding) — this boundary is where that
 * gets enforced, the same way `lib/erpnext.ts` is the one chokepoint for ERPNext calls.
 */
export type ObservabilityProvider = {
  /** DEMO as of O-10C — Overview stays on `demoProvider.ts`; not part of this package's
   * scope (a future O-10D+ package). */
  getSummary(range: TrendRange): Promise<ObservabilitySummary>;
  /** LIVE as of O-10C (Error Explorer). One page of rows. `pagination.page`/`pageSize` are
   * inputs (what page to fetch); the returned `pagination.total` is the real filtered
   * count — a real page-by-page contract (mission §27/§12), never "fetch everything and
   * paginate in the browser." */
  getErrors(filters: ObservabilityFilters, page: number, pageSize: number): Promise<ErrorListResult>;
  /** LIVE as of O-10C (Trace Detail). Resolves one trace by its exact correlation ID, or
   * `null` if no trace exists (or the caller isn't permitted to see it) — callers must
   * render an honest not-found state on `null`, never assume a malformed ID means "not
   * found yet, try again" (a malformed ID instead rejects via a thrown error — see
   * `serverProvider.ts`'s `getTrace()`). */
  getTrace(correlationId: string): Promise<Trace | null>;
  /** LIVE as of O-10C (Trace Detail's gated panel). Kept separate from `getTrace()` — see
   * §19/§20 of the O-7 mission brief and the O-2 independent review's redaction finding.
   * The real adapter enforces read-time redaction here, not `getTrace()`'s general summary
   * data. */
  getTechnicalDetails(correlationId: string): Promise<TechnicalDetails>;
  /** DEMO as of O-10C — User Activity is not in this package's scope (a future O-10D+
   * package); still `demoProvider.ts`. */
  getActivity(filters: ObservabilityFilters, page: number, pageSize: number): Promise<UserActivityListResult>;
  /** DEMO as of O-10C — Audit Trail is not in this package's scope; still
   * `demoProvider.ts`. Trace Detail's "View Audit" cross-link is suppressed while this
   * remains demo (mission §21) so a real trace never routes into demo audit history. */
  getAuditRecords(filters: ObservabilityFilters, page: number, pageSize: number): Promise<AuditListResult>;
  /** DEMO/WAITING_FOR_BACKEND as of O-10C — no real integration-event source exists yet
   * (confirmed live in O-10B: `Integration Request` has zero rows); still
   * `demoProvider.ts`. */
  getIntegrationSummary(): Promise<IntegrationHealthSummary>;
  /** DEMO/WAITING_FOR_BACKEND as of O-10C — see `getIntegrationSummary()` above. */
  getIntegrationEvents(filters: ObservabilityFilters, page: number, pageSize: number): Promise<IntegrationListResult>;
};

/**
 * O-10C: a deliberate HYBRID of the real adapter (`serverProvider.ts`) and the demo one
 * (`demoProvider.ts`) — not an all-or-nothing swap. Per the O-10C mission brief, exactly
 * two surfaces go LIVE this package: Error Explorer (`getErrors`) and Trace Detail
 * (`getTrace`/`getTechnicalDetails`). `getSummary` (Overview), `getActivity` (User
 * Activity), `getAuditRecords` (Audit Trail), and `getIntegrationSummary`/
 * `getIntegrationEvents` (Integration Monitoring) stay on `demoProvider.ts` — those are
 * each their own future package (O-10D onward), not swapped early just because the real
 * adapter happens to already implement all eight methods.
 *
 * No silent fallback: `getErrors`/`getTrace`/`getTechnicalDetails` below call
 * `getServerObservabilityProvider()` directly and let a real failure throw
 * (`ObservabilityReadError`) all the way up to the calling page — this file does not catch
 * it and substitute demo data. A provider failure must render as "data unavailable," never
 * as fabricated zero-result or demo content (mission §27/§38's "no-demo-fallback"
 * requirement). See `errors/page.tsx`/`traces/[traceId]/page.tsx` for where that catch
 * actually lives (an honest "could not be loaded" / "Trace not found" state, not a silent
 * swallow).
 */
export function getObservabilityProvider(): ObservabilityProvider {
  const live = getServerObservabilityProvider();
  return {
    async getSummary(range) {
      return getDemoObservabilitySummary(range);
    },
    async getErrors(filters, page, pageSize) {
      return live.getErrors(filters, page, pageSize);
    },
    async getTrace(correlationId) {
      return live.getTrace(correlationId);
    },
    async getTechnicalDetails(correlationId) {
      return live.getTechnicalDetails(correlationId);
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
