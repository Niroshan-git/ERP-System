import "server-only";
import {
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
  /** LIVE as of O-10D (User Activity). Same real page-by-page contract as `getErrors()` —
   * see `serverProvider.ts`'s `getActivity()`. */
  getActivity(filters: ObservabilityFilters, page: number, pageSize: number): Promise<UserActivityListResult>;
  /** LIVE as of O-10D (Audit Trail / Document History). Backed by native `Version` — see
   * `serverProvider.ts`'s `getAuditRecords()`. Document History mode (both `doctype` and
   * `docname` set) returns a real database-level oldest-first order, not a per-page
   * client reversal. */
  getAuditRecords(filters: ObservabilityFilters, page: number, pageSize: number): Promise<AuditListResult>;
  /** DEMO/WAITING_FOR_BACKEND as of O-10C — no real integration-event source exists yet
   * (confirmed live in O-10B: `Integration Request` has zero rows); still
   * `demoProvider.ts`. */
  getIntegrationSummary(): Promise<IntegrationHealthSummary>;
  /** DEMO/WAITING_FOR_BACKEND as of O-10C — see `getIntegrationSummary()` above. */
  getIntegrationEvents(filters: ObservabilityFilters, page: number, pageSize: number): Promise<IntegrationListResult>;
};

/**
 * O-10D: extends O-10C's HYBRID one step further. Error Explorer, Trace Detail, User
 * Activity, and Audit Trail are now all LIVE (`getErrors`/`getTrace`/`getTechnicalDetails`/
 * `getActivity`/`getAuditRecords`). `getSummary` (Overview) and `getIntegrationSummary`/
 * `getIntegrationEvents` (Integration Monitoring) stay on `demoProvider.ts` — Overview is
 * explicitly out of this package's scope (mission §39/§48), and no real integration-event
 * source exists yet.
 *
 * No silent fallback: every LIVE method below calls `getServerObservabilityProvider()`
 * directly and lets a real failure throw (`ObservabilityReadError`) all the way up to the
 * calling page — this file does not catch it and substitute demo data. A provider failure
 * must render as "data unavailable," never as fabricated zero-result or demo content
 * (mission §27/§38/§41's "no-demo-fallback" requirement). See each page under
 * `admin/observability/*` for where that catch actually lives (an honest "could not be
 * loaded" state, not a silent swallow).
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
      return live.getActivity(filters, page, pageSize);
    },
    async getAuditRecords(filters, page, pageSize) {
      return live.getAuditRecords(filters, page, pageSize);
    },
    async getIntegrationSummary() {
      return getDemoIntegrationSummary();
    },
    async getIntegrationEvents(filters, page, pageSize) {
      return getDemoIntegrationEvents(filters, page, pageSize);
    },
  };
}
