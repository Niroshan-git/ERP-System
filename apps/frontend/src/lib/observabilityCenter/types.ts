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

/** One row in User Activity (O-8) — a business event, not a page-view. `actor` is
 * nullable for the same reason `ErrorEvent.actor` is (see above): a small number of
 * legitimate activity kinds (scheduled/integration actions) have no human initiator, and
 * the UI must say so honestly rather than fabricate one — never fall back to
 * `executionPrincipal` in this slot. */
export type UserActivityEvent = {
  id: string;
  occurredAt: string;
  actor: Actor | null;
  module: string;
  /** Short verb/phrase, e.g. "Login", "Created", "Submitted", "Material Transfer" — kept
   * as free text (not a closed literal union) per the O-8 brief's §7 instruction not to
   * hard-code the UI to a fixed value set; filter UIs offer a curated option list without
   * the type enforcing it, matching this file's existing `Severity`/`EventSource` vs.
   * `ErrorEvent.operation` precedent. */
  action: string;
  /** Optional longer human-readable sentence for events with no natural document context
   * (e.g. a Login) or that benefit from more detail than `action` + document identity
   * alone convey. */
  description?: string;
  referenceDoctype?: string;
  referenceName?: string;
  correlationId?: CorrelationId;
  source: EventSource;
  /** Deliberately distinct from `EventStatus` (mission §13: "Do not confuse activity
   * status with error severity — these are separate concepts"). "Pending"/"Warning" exist
   * for activity kinds that are genuinely in-flight or partially successful; most fixtures
   * use Success/Failed. */
  status: "Success" | "Failed" | "Pending" | "Warning";
};

/** How one `AuditChange` should be presented (mission §24). `field_changed` is the
 * default/common case (old value -> new value on a simple field). The child-table kinds
 * (`row_added`/`row_removed`/`child_row_changed`) exist because O-8's brief explicitly
 * anticipates them, but this frontend does not yet know the real shape of a child-table
 * `Version` diff — until a backend package defines that contract, any change carrying one
 * of these kinds is rendered with a conservative, generic description rather than an
 * invented row-level diff. See `AuditChangesList`'s WAITING_FOR_BACKEND note. */
export type AuditChangeType = "field_changed" | "field_added" | "field_cleared" | "row_added" | "row_removed" | "child_row_changed";

/** One field-level change within an AuditRecord — modeled around native `Version`
 * diffs (old value → new value), not a re-invented audit schema, per the brief's §19/§20. */
export type AuditChange = {
  field: string;
  fieldLabel: string;
  previousValue: string;
  newValue: string;
  /** Defaults to `"field_changed"` when absent — every change built before this field
   * existed (and any future adapter that doesn't yet classify changes) is still valid. */
  changeType?: AuditChangeType;
};

/** One document-level audit entry — a `Version` row joined with the O-2 `Activity Log`
 * attribution record that shares its `reference_doctype`/`reference_name` and a close
 * timestamp (see docs/observability-architecture.md §8, "Future Audit Trail join").
 * `actor` is nullable per mission §25: never display the shared `frontend-
 * integration@ceylonstack.local` execution principal as if it were the human who made a
 * business change — when attribution can't be resolved, the UI must say "Actor
 * unavailable" instead of guessing. */
export type AuditRecord = {
  id: string;
  occurredAt: string;
  actor: Actor | null;
  /** Inferred display grouping (e.g. "Manufacturing") for the Audit Trail's Module
   * filter/column — not a native `Version` field, since `Version` itself carries no module
   * concept; derived the same way the demo provider derives it (from the doctype). */
  module?: string;
  referenceDoctype: string;
  referenceName: string;
  action: string; // e.g. "Updated", "Submitted", "Cancelled"
  changes: AuditChange[];
  correlationId?: CorrelationId;
  versionId?: string;
};

/** Distinct from both `Severity` (Error Explorer) and `UserActivityEvent["status"]`
 * (Activity) — mission §9: "Do not confuse integration status with error severity." A
 * `FAILED` operation and an `ERROR`-severity log entry can describe the same event but
 * answer different questions ("did it succeed?" vs. "how bad was it?"). `TIMEOUT` is kept
 * distinct from `FAILED` (not folded into it) specifically so the UI can visually tell
 * apart "the call completed and failed" from "the call never completed" (mission §23). */
export type IntegrationStatus = "SUCCESS" | "FAILED" | "PENDING" | "TIMEOUT" | "WARNING";

/** One row in Integration Monitoring (O-9). Models a general integration-operation shape
 * per mission §7 ("integration name / integration type / operation", not per-name UI
 * branching) — `integration`/`integrationType`/`operation` are free text, the same
 * "curated select suggestions, not an enforced closed set" precedent
 * `UserActivityEvent.action` already established, not a literal union the type enforces.
 *
 * `actor` follows the same nullable convention as `ErrorEvent`/`UserActivityEvent` —
 * absent for legitimate scheduled/system-initiated operations. `systemGenerated` is the
 * explicit, verified signal mission §27 requires before the UI may ever render "System"
 * for a null actor; without it, a null actor must render "Actor unavailable" (see
 * `IntegrationExplorerTable`). This same distinction is documented as an open O-10
 * hardening item for `UserActivityEvent`, which has no such flag yet and today always
 * falls back to "System" — see `docs/observability-frontend-architecture.md`. */
export type IntegrationEvent = {
  id: string;
  occurredAt: string; // ISO 8601 — when the operation started
  completedAt?: string;
  durationMs?: number;
  integration: string; // e.g. "ERPNext", "Email", "AI Service", "Automation", "External API"
  integrationType: string; // category/grouping for the integration above — may equal `integration` for a demo fixture with only one operation in its category
  operation: string;
  status: IntegrationStatus;
  actor: Actor | null;
  /** See doc comment above — only `true` when the event's own source explicitly marks it
   * as a scheduled/system-initiated operation, never inferred merely from `actor` being
   * null. */
  systemGenerated?: boolean;
  correlationId?: CorrelationId;
  referenceDoctype?: string;
  referenceName?: string;
  source: EventSource;
  /** Short, human-safe summary — always safe to render, same convention as
   * `ErrorEvent.userSafeMessage`. */
  safeMessage: string;
  /** Only present for FAILED/TIMEOUT/WARNING outcomes — e.g. "ValidationError",
   * "TimeoutError", "NetworkError". Deliberately separate from `status`: a status answers
   * "did it succeed?", this answers "what kind of failure was it?" (mission §9). */
  errorClassification?: string;
  /** Safe, allowlisted-field summaries only — never a raw request/response dump,
   * mirroring O-2's own `log_operation` field-allowlist design and the same rule
   * `TechnicalDetailsPanel` already enforces for Error Explorer. */
  safeRequestSummary?: string;
  safeResponseSummary?: string;
};

/** Integration Monitoring's compact health-summary row (mission §6) — always DEMO today,
 * computed from the same fixtures `getDemoIntegrationEvents()` filters/paginates, not a
 * separate hand-authored number. */
export type IntegrationHealthSummary = {
  totalOperations: number;
  successful: number;
  failed: number;
  averageDurationMs: number;
};

/** Integration Explorer's page result — same page-by-page contract as `ErrorListResult`. */
export type IntegrationListResult = {
  items: IntegrationEvent[];
  pagination: Pagination;
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
 * each screen reads only the fields it uses. Not all filters apply to every list.
 * `status` is widened to `string` (rather than `EventStatus`) because Activity's status
 * set (`UserActivityEvent["status"]`) is a different, non-overlapping union — each page's
 * own type guard (e.g. `errors/page.tsx`'s `isStatus()`) still narrows it before use. */
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
  status?: string;
  /** Free-text action filter (Activity/Audit only) — matched against `UserActivityEvent
   * .action` / `AuditRecord.action`, not enforced against any closed value set. */
  action?: string;
  correlationId?: CorrelationId;
  /** Integration Monitoring only (O-9) — matched against `IntegrationEvent.integration`
   * / `.integrationType` / `.operation`, same "curated suggestions, not a closed set"
   * precedent as `action` above. */
  integration?: string;
  integrationType?: string;
  operation?: string;
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

/** User Activity's page result — same page-by-page contract as `ErrorListResult`. */
export type UserActivityListResult = {
  items: UserActivityEvent[];
  pagination: Pagination;
};

/** Audit Trail's page result — same page-by-page contract as `ErrorListResult`. */
export type AuditListResult = {
  items: AuditRecord[];
  pagination: Pagination;
};
