/**
 * Typed frontend models for the Observability Center (Admin → Observability).
 *
 * Deliberately separate from `lib/observability.ts` (O-2's server-side telemetry
 * *emitter* — `reportOperation()`/`log_operation`). This file models the *read* side:
 * what the Observability Center UI displays, sourced today from
 * `observabilityCenter/demoProvider.ts` and eventually from a real adapter reading
 * `Error Log`/`Activity Log`/`Version` via future `smart_factory` whitelisted methods
 * (O-7 onward). See `docs/observability-frontend-architecture.md`.
 *
 * Modeled only against what O-2 actually verified exists (`docs/observability-architecture.md`)
 * plus what the Overview screen and the data-provider interface need — not speculative
 * fields for screens this package doesn't build yet.
 */

export type Severity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

/** Where an event originated — mirrors the categories this mission's brief named;
 * only values a real backend could actually attach (never invented per-event). */
export type EventSource = "FRONTEND" | "SERVER" | "ERPNEXT" | "INTEGRATION" | "WORKFLOW" | "SYSTEM";

export type EventStatus = "Open" | "Investigating" | "Resolved";

/** The real Ceylon Stack human who initiated an operation — distinct from the
 * `ExecutionPrincipal` below. See O-2's `actorContext.ts` / `docs/observability-architecture.md`
 * §"Actor vs execution principal". Nullable because O-2 itself documents that attribution
 * can be absent (e.g. context resolution failure) without blocking the underlying record. */
export type Actor = {
  email: string;
  fullName: string;
};

/** The shared ERPNext account every write actually executes as
 * (`frontend-integration@ceylonstack.local`) — always present once a record exists,
 * since it's `frappe.session.user` at write time, not a derived/optional value. */
export type ExecutionPrincipal = {
  email: string;
};

/** Ceylon Stack's request-correlation ID, `CS-YYMMDD-XXXXXX` — see `lib/correlationId.ts`
 * (server-only generator/validator) for the authoritative format. This module only needs
 * to *display* and *format-check* IDs, so it carries no logic of its own beyond the type. */
export type CorrelationId = string;

/** One row in the Error Explorer (O-7) / one entry in Overview's "Recent critical events".
 * Mirrors native `Error Log` fields O-1 confirmed exist, plus the actor/correlation
 * fields O-2's `log_operation` writes into `Error Log.metadata`/`Activity Log.content` —
 * modeled as first-class fields here since the eventual real adapter will parse them out,
 * not because Ceylon Stack invents a parallel doctype. */
export type ErrorEvent = {
  id: string;
  correlationId: CorrelationId;
  severity: Severity;
  occurredAt: string; // ISO 8601
  module: string; // e.g. "Manufacturing", "Sales", "System"
  operation: string; // e.g. "Material Transfer Failed"
  actor: Actor | null;
  executionPrincipal: ExecutionPrincipal;
  source: EventSource;
  status: EventStatus;
  referenceDoctype?: string;
  referenceName?: string;
  /** Short, human-safe summary — always safe to render. Never raw ERPNext/Frappe body
   * text (see O-2 review finding on unredacted user-facing error paths). */
  userSafeMessage: string;
  /** Whether technical diagnostics exist for this event at all — the UI must still gate
   * *showing* them behind secure backend authorization (see TechnicalDetails below),
   * this only says whether there's something to gate. */
  hasTechnicalDetails: boolean;
  httpStatus?: number;
  route?: string;
};

/** One step in a Trace Detail timeline. The current O-2 correlation model is "one write
 * call = one ID" (see docs/observability-architecture.md §5) — a single ErrorEvent may
 * legitimately have only one TraceEvent today. This type exists so a future backend that
 * groups several technical/API events under one correlation ID (O-3+) can populate more
 * than one without any UI/type change. */
export type TraceEvent = {
  id: string;
  occurredAt: string; // ISO 8601, millisecond-resolution where available
  label: string; // e.g. "Server Action", "ERPNext API", "ERPNext Validation"
  kind: "USER_ACTION" | "SERVER_ACTION" | "ERPNEXT_API" | "ERPNEXT_VALIDATION" | "ERROR";
  detail: string; // short, user-safe — see TechnicalDetails for anything raw
};

/** One logical trace — the unit Trace Detail (package O-7) renders. */
export type Trace = {
  correlationId: CorrelationId;
  status: EventStatus;
  severity: Severity;
  title: string;
  occurredAt: string;
  actor: Actor | null;
  executionPrincipal: ExecutionPrincipal;
  module: string;
  operation: string;
  source: EventSource;
  referenceDoctype?: string;
  referenceName?: string;
  route?: string;
  httpStatus?: number;
  durationMs?: number;
  events: TraceEvent[];
  userSafeMessage: string;
  hasTechnicalDetails: boolean;
};

/** Gated technical-diagnostics container (§15 of the brief). Until a backend
 * redaction/authorization package explicitly clears these fields for UI consumption,
 * every field here stays `undefined` and the UI renders the "unavailable" state —
 * never a raw payload. See O-2 independent review's HIGH redaction finding
 * (access_token/refresh_token bypass) for why this package does not render raw
 * diagnostic text yet. */
export type TechnicalDetails = {
  available: boolean;
  errorType?: string;
  erpnextMessage?: string;
  requestContext?: string;
  responseContext?: string;
  stackTrace?: string;
  metadata?: Record<string, string>;
};

/** One row in User Activity (O-8) — a business event, not a page-view. */
export type UserActivityEvent = {
  id: string;
  occurredAt: string;
  actor: Actor;
  module: string;
  action: string; // e.g. "Created Work Order", "Submitted Work Order"
  referenceDoctype?: string;
  referenceName?: string;
  correlationId?: CorrelationId;
  status: "Success" | "Failed";
};

/** One field-level change within an AuditRecord (O-9) — modeled around native `Version`
 * diffs (old value → new value), not a re-invented audit schema, per the brief's §19/§20. */
export type AuditChange = {
  field: string;
  fieldLabel: string;
  previousValue: string;
  newValue: string;
};

/** One document-level audit entry — a `Version` row joined with the O-2 `Activity Log`
 * attribution record that shares its `reference_doctype`/`reference_name` and a close
 * timestamp (see docs/observability-architecture.md §8, "Future Audit Trail join"). */
export type AuditRecord = {
  id: string;
  occurredAt: string;
  actor: Actor;
  referenceDoctype: string;
  referenceName: string;
  action: string; // e.g. "Updated", "Submitted", "Cancelled"
  changes: AuditChange[];
  correlationId?: CorrelationId;
  versionId?: string;
};

/** One row in Integration Monitoring (O-10). */
export type IntegrationEvent = {
  id: string;
  integration: string; // e.g. "ERPNext", "Email", "AI Service"
  operation: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  status: "Success" | "Failed" | "In Progress";
  correlationId?: CorrelationId;
  referenceDoctype?: string;
  referenceName?: string;
  /** Safe, allowlisted-field summaries only — never a raw request/response dump,
   * mirroring O-2's own `log_operation` field-allowlist design. */
  safeRequestSummary?: string;
  safeResponseSummary?: string;
};

export type TrendRange = "24h" | "7d" | "30d";

export type ErrorTrendPoint = {
  label: string;
  count: number;
};

export type ModuleErrorBreakdown = {
  module: string;
  count: number;
  criticalCount: number;
};

/** Everything the Overview screen needs, for one selected TrendRange. */
export type ObservabilitySummary = {
  range: TrendRange;
  errorsToday: number;
  errorsYesterday: number;
  criticalErrors: number;
  failedIntegrations: number;
  recentActivityCount: number;
  errorTrend: ErrorTrendPoint[];
  errorsByModule: ModuleErrorBreakdown[];
  recentCriticalEvents: ErrorEvent[];
};

/** Shared filter shape across Error Explorer / User Activity / Audit Trail — a superset,
 * each screen reads only the fields it uses. Not all filters apply to every list. */
export type ObservabilityFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  severity?: Severity;
  module?: string;
  source?: EventSource;
  actorEmail?: string;
  doctype?: string;
  docname?: string;
  status?: EventStatus;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};

/** Error Explorer's page result — provider returns exactly one page's worth of rows plus
 * the pagination state needed to render Prev/Next and a result count, never the full set. */
export type ErrorListResult = {
  items: ErrorEvent[];
  pagination: Pagination;
};
