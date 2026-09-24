import "server-only";
import { BASE_URL, serviceAuthHeader } from "../erpnextAuth";
import { redactString } from "../redact";
import type { ObservabilityProvider } from "./provider";
import type {
  Actor,
  AuditChange,
  AuditChangeType,
  AuditListResult,
  AuditRecord,
  ErrorEvent,
  ErrorListResult,
  ErrorTrendPoint,
  EventSource,
  IntegrationHealthSummary,
  IntegrationListResult,
  ModuleErrorBreakdown,
  ObservabilityFilters,
  ObservabilitySummary,
  Severity,
  TechnicalDetails,
  Trace,
  TraceEvent,
  TrendRange,
  UserActivityEvent,
  UserActivityListResult,
} from "./types";

/**
 * The real Observability read adapter — O-10B's "trusted read API" client. Implements the
 * exact same `ObservabilityProvider` contract `demoProvider.ts` does, so it is a drop-in
 * replacement once a future package (O-10C onward) decides to wire it into
 * `provider.ts`'s `getObservabilityProvider()`. **Deliberately not wired in by this
 * package** — every screen under `/admin/observability/*` keeps reading `demoProvider.ts`
 * exactly as before (see O-10B's package boundary: "real read foundation", not "screens go
 * live"). This file exists so O-10C can do that swap as a one-line change, already tested
 * against the live backend independently of any UI change.
 *
 * Calls `smart_factory.api.observability.*` directly (not through `lib/erpnext.ts`) for two
 * reasons: (1) `erpnext.ts` has unrelated, uncommitted foreign changes in this working tree
 * (a Login/Forgot-Password redesign) that this package must not touch or depend on: mixing
 * this package's commit with that file would stage code neither is responsible for; (2) this
 * module's own failure path must never call back into `lib/observability.ts`'s
 * `reportOperation()` (an observability *read* failure reporting itself as an observability
 * *write* risks exactly the recursive-logging loop mission §40 asks to guard against) — a
 * dedicated, minimal fetch helper keeps that boundary structurally obvious rather than
 * relying on `erpnextFetch()`'s shared error-reporting path to not apply here.
 */

export class ObservabilityReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObservabilityReadError";
  }
}

/**
 * Site timezone, live-verified 2026-09-24 via `System Settings.time_zone` on the real
 * instance (`Asia/Colombo`, UTC+05:30, no DST). Frappe stores/returns `creation`/`modified`
 * as naive local-time strings, not UTC — treating them as UTC (the common `+ "Z"` mistake)
 * would silently misreport every timestamp by 5.5 hours. Hardcoded rather than fetched live
 * per request (matching this module's existing `ALLOWED_CALLER`-style precedent for stable,
 * documented constants) — if the site's timezone is ever reconfigured, this must be updated
 * alongside it; flagged here so that dependency is not silently invisible.
 */
const SITE_UTC_OFFSET = "+05:30";

function toIso(frappeDatetime: string | null | undefined): string | undefined {
  if (!frappeDatetime) return undefined;
  const match = frappeDatetime.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?$/);
  if (!match) return undefined;
  const [, date, time, frac] = match;
  const millis = frac ? `.${frac.slice(1, 4).padEnd(3, "0")}` : "";
  const parsed = new Date(`${date}T${time}${millis}${SITE_UTC_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

async function callObservabilityRead<T>(method: string, params: Record<string, unknown>): Promise<T> {
  if (!BASE_URL) {
    throw new ObservabilityReadError("ERPNEXT_URL is not set — see apps/frontend/.env.local.example");
  }

  const body: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") body[key] = value;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/method/smart_factory.api.observability.${method}`, {
      method: "POST",
      headers: { Authorization: serviceAuthHeader(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    throw new ObservabilityReadError(
      `network error calling ${method}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ObservabilityReadError(`ERPNext ${res.status} on ${method}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { message?: T };
  return data.message as T;
}

// ---------------------------------------------------------------------------------------
// Native row shapes — mirror exactly what apps/smart_factory/smart_factory/api/
// observability.py's list_errors/get_trace/get_technical_details/list_activity/list_audit
// return. Kept private to this module: nothing outside this file ever sees these native-ish
// shapes, only the normalized ObservabilityProvider DTOs below.
// ---------------------------------------------------------------------------------------

type NativeActor = { email: string; full_name: string } | null;

type NativeErrorRow = {
  name: string;
  creation: string;
  method: string;
  trace_id: string | null;
  reference_doctype: string | null;
  reference_name: string | null;
  execution_principal: string;
  metadata: Record<string, unknown>;
  has_error_detail: boolean;
  error_excerpt: string;
};

type NativeActivityRow = {
  name: string;
  creation: string;
  subject: string;
  operation: string | null;
  status: string | null;
  execution_principal: string;
  full_name: string | null;
  reference_doctype: string | null;
  reference_name: string | null;
  actor: NativeActor;
  correlation_id: string | null;
};

type NativeTraceActivityRow = {
  name: string;
  creation: string;
  subject: string;
  status: string | null;
  reference_doctype: string | null;
  reference_name: string | null;
  execution_principal: string;
  actor: NativeActor;
};

type NativeTraceResult = {
  error_log: NativeErrorRow | null;
  activity_logs: NativeTraceActivityRow[];
} | null;

type NativeTechnicalDetails =
  | { available: false }
  | { available: true; method: string; error: string; metadata: Record<string, unknown> };

type NativeVersionRow = {
  name: string;
  creation: string;
  execution_principal: string;
  reference_doctype: string;
  reference_name: string;
  data: string;
  actor: NativeActor;
};

type NativePagination = { page: number; page_size: number; total: number };
type NativeListResult<T> = { items: T[]; pagination: NativePagination };

// ---------------------------------------------------------------------------------------
// Shared derivation helpers — every one documented with what it's grounded in, per the
// mission's provenance rule: DERIVED_SAFELY (grounded in a real, known signal) vs simply
// NOT_AVAILABLE (left undefined/null, never guessed).
// ---------------------------------------------------------------------------------------

function toActor(native: NativeActor): Actor | null {
  if (!native || !native.email) return null;
  return { email: native.email, fullName: native.full_name || native.email };
}

/** DocType -> display module grouping. Not a native field on any of Error Log/Activity Log/
 * Version — grounded in `reference_doctype`, the one real signal available, the same way
 * `demoProvider.ts`'s fixtures derive `module` from their own doctype. Doctypes absent here
 * fall back to "System" (honest default for module-less/system-level events like Login). */
const MODULE_BY_DOCTYPE: Record<string, string> = {
  "Work Order": "Manufacturing",
  "Production Plan": "Manufacturing",
  BOM: "Manufacturing",
  "Job Card": "Manufacturing",
  Quotation: "Sales",
  "Sales Order": "Sales",
  "Pick List": "Sales",
  "Delivery Note": "Sales",
  "Sales Invoice": "Sales",
  "Material Request": "Buying",
  "Request for Quotation": "Buying",
  "Supplier Quotation": "Buying",
  "Purchase Order": "Buying",
  "Purchase Receipt": "Buying",
  "Purchase Invoice": "Buying",
  "Stock Entry": "Stock",
  Warehouse: "Stock",
  Batch: "Stock",
  "Serial No": "Stock",
  Item: "Master Data",
  "Item Group": "Master Data",
  "Price List": "Master Data",
  Customer: "Master Data",
  Supplier: "Master Data",
};

/** Recovers a doctype name from a `/api/resource/<DocType>...` path — grounded in
 * `erpnext.ts`'s own REST URL convention (`listDocs`/`getDoc`/`createDoc` all build exactly
 * this shape), not a guess. Used as `deriveModule()`'s fallback for the common case
 * `scheduleFailureReport()` never attaches a `reference_doctype` at all (a plain
 * `erpnextFetch()` network/HTTP failure has no document context to attach) — without this,
 * every such error would land in the "System" bucket even when its own URL plainly names
 * the real doctype involved (e.g. a failed `Stock Entry` list call). */
function doctypeFromRoute(route: string | undefined): string | undefined {
  if (!route) return undefined;
  const match = route.match(/^\/api\/resource\/([^/?]+)/);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
}

function deriveModule(referenceDoctype: string | null | undefined, route?: string): string {
  const doctype = referenceDoctype ?? doctypeFromRoute(route);
  if (!doctype) return "System";
  return MODULE_BY_DOCTYPE[doctype] ?? doctype;
}

/** Grounded in `erpnextFetch()`'s own literal string shape (`lib/erpnext.ts`: `` `ERPNext
 * ${res.status} on ${path}` ``) — this is not a guess at what the text *might* mean, it's
 * the exact format the one real writer of this data produces. Rows that don't match (e.g.
 * framework-native Error Log entries, or a Ceylon Stack row logged with a different
 * `operation` label) simply yield no route/httpStatus, never a fabricated one. */
function extractHttpContext(method: string | undefined): { httpStatus?: number; route?: string } {
  if (!method) return {};
  const match = method.match(/^ERPNext (\d{3}) on (\S+)/);
  if (!match) return {};
  return { httpStatus: Number(match[1]), route: match[2] };
}

/** Error Log rows this method ever sees always have `trace_id` set (list_errors/get_trace
 * both scope to Ceylon Stack's own correlated writes) — `metadata.severity` is the value
 * `log_operation` itself wrote from a validated `{INFO,WARNING,ERROR,CRITICAL}` set, but
 * since Error Log only ever receives ERROR/CRITICAL severities (see that method's own
 * conditional), an unrecognized/missing value defaults to "ERROR" — the row's mere presence
 * in Error Log already proves *at least* that much, never invented beyond it. */
function deriveSeverity(metadata: Record<string, unknown>): Severity {
  const raw = metadata.severity;
  if (raw === "ERROR" || raw === "CRITICAL" || raw === "WARNING" || raw === "INFO") return raw;
  return "ERROR";
}

function deriveSource(referenceDoctype: string | null | undefined, text: string | null | undefined): EventSource {
  if (referenceDoctype) return "ERPNEXT";
  if (text && /ERPNext/i.test(text)) return "ERPNEXT";
  return "SERVER";
}

function metadataActor(metadata: Record<string, unknown>): Actor | null {
  const email = metadata.actor_email;
  if (typeof email !== "string" || !email) return null;
  const fullName = metadata.actor_full_name;
  return { email, fullName: typeof fullName === "string" && fullName ? fullName : email };
}

// ---------------------------------------------------------------------------------------
// Normalization — native row -> frontend DTO. No function here ever returns a raw native
// field the DTO type doesn't declare; every value either has a named, commented provenance
// (a native field, a derivation grounded in a known signal) or is left undefined/null.
// ---------------------------------------------------------------------------------------

function normalizeErrorEvent(row: NativeErrorRow): ErrorEvent {
  const severity = deriveSeverity(row.metadata);
  const { httpStatus, route } = extractHttpContext(row.method);
  const safeMethod = redactString(row.method);
  return {
    id: row.name,
    // Non-null by construction: list_errors/get_trace both scope to `trace_id is set` rows.
    correlationId: row.trace_id as string,
    severity,
    occurredAt: toIso(row.creation) ?? row.creation,
    module: deriveModule(row.reference_doctype, route),
    operation: safeMethod,
    actor: metadataActor(row.metadata),
    executionPrincipal: { email: row.execution_principal },
    source: deriveSource(row.reference_doctype, row.method),
    // No native investigation-workflow field exists on Error Log (confirmed live 2026-09-24
    // — `seen` is a Desk read/unread flag, not a triage state). "Open" is the honest default
    // for a freshly-read row until a Ceylon Stack extension adds real state tracking.
    status: "Open",
    referenceDoctype: row.reference_doctype ?? undefined,
    referenceName: row.reference_name ?? undefined,
    // No dedicated safe-message field exists separately from `method` on Error Log — mirrors
    // `operation` until a backend package defines a real safe-message contract distinct from
    // the raw error/traceback (see `error_excerpt`/TechnicalDetails for that raw content).
    userSafeMessage: safeMethod,
    hasTechnicalDetails: row.has_error_detail,
    httpStatus,
    route,
  };
}

function normalizeActivityEvent(row: NativeActivityRow): UserActivityEvent {
  const status = row.status === "Success" || row.status === "Failed" ? row.status : "Warning";
  const { route } = extractHttpContext(row.subject);
  return {
    id: row.name,
    occurredAt: toIso(row.creation) ?? row.creation,
    actor: toActor(row.actor),
    module: deriveModule(row.reference_doctype, route),
    action: redactString(row.subject),
    referenceDoctype: row.reference_doctype ?? undefined,
    referenceName: row.reference_name ?? undefined,
    correlationId: row.correlation_id ?? undefined,
    source: deriveSource(row.reference_doctype, row.subject),
    status,
  };
}

function deriveAuditAction(changes: AuditChange[]): string {
  const docstatus = changes.find((c) => c.field === "docstatus");
  if (docstatus) {
    if (docstatus.previousValue === "0" && docstatus.newValue === "1") return "Submitted";
    if (docstatus.previousValue === "1" && docstatus.newValue === "2") return "Cancelled";
  }
  const addedCount = changes.filter((c) => c.changeType === "field_added").length;
  if (changes.length > 0 && addedCount === changes.length) return "Created";
  return "Updated";
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/** Native `Version.data` shape, live-verified 2026-09-24 against real Work Order versions:
 * `{added, changed, removed, row_changed, data_import, updater_reference}` where `changed`
 * is `[[field, previousValue, newValue], ...]` and `row_changed` is `[[tableField, rowIdx,
 * rowName, [[childField, prev, next], ...]], ...]`. Never renders raw JSON — every branch
 * here produces a typed, safe `AuditChange`; anything this parser doesn't recognize is
 * dropped rather than guessed at (mission §29: "if not reliably normalizable, return a
 * conservative summary," never an invented per-row/per-field diff). */
function normalizeVersionData(raw: string): AuditChange[] {
  let parsed: {
    added?: unknown[];
    changed?: [string, unknown, unknown][];
    removed?: unknown[];
    row_changed?: [string, number, string, [string, unknown, unknown][]][];
  };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const changes: AuditChange[] = [];

  for (const entry of parsed.changed ?? []) {
    if (!Array.isArray(entry) || entry.length < 3) continue;
    const [field, previous, next] = entry;
    let changeType: AuditChangeType = "field_changed";
    if (previous === null || previous === undefined) changeType = "field_added";
    else if (next === null || next === undefined) changeType = "field_cleared";
    changes.push({
      field: String(field),
      fieldLabel: String(field),
      previousValue: stringifyValue(previous),
      newValue: stringifyValue(next),
      changeType,
    });
  }

  for (const entry of parsed.row_changed ?? []) {
    if (!Array.isArray(entry) || entry.length < 4) continue;
    const [tableField, , rowName, childChanges] = entry;
    const count = Array.isArray(childChanges) ? childChanges.length : 0;
    changes.push({
      field: String(tableField),
      fieldLabel: String(tableField),
      previousValue: "—",
      newValue: `${count} field(s) changed in row ${rowName} — row-level detail is not yet available from the backend`,
      changeType: "child_row_changed",
    });
  }

  if (Array.isArray(parsed.added) && parsed.added.length > 0) {
    changes.push({
      field: "rows",
      fieldLabel: "Rows",
      previousValue: "—",
      newValue: `${parsed.added.length} row(s) added`,
      changeType: "row_added",
    });
  }
  if (Array.isArray(parsed.removed) && parsed.removed.length > 0) {
    changes.push({
      field: "rows",
      fieldLabel: "Rows",
      previousValue: `${parsed.removed.length} row(s)`,
      newValue: "—",
      changeType: "row_removed",
    });
  }

  return changes;
}

function normalizeAuditRecord(row: NativeVersionRow): AuditRecord {
  const changes = normalizeVersionData(row.data);
  return {
    id: row.name,
    occurredAt: toIso(row.creation) ?? row.creation,
    // Version.owner is deliberately never used here — see observability.py's
    // `_join_actors_for_document()` doc comment (mission §30's "Version owner warning").
    actor: toActor(row.actor),
    module: deriveModule(row.reference_doctype),
    referenceDoctype: row.reference_doctype,
    referenceName: row.reference_name,
    action: deriveAuditAction(changes),
    changes,
    // No join to a correlation ID is implemented yet for Version rows (only actor is
    // joined) — left undefined rather than guessed; a future enhancement could extend
    // `_join_actors_for_document()` to also recover `correlation_id` from the matched
    // Activity Log row the same way actor is recovered.
    correlationId: undefined,
    versionId: row.name,
  };
}

function normalizeTechnicalDetails(native: NativeTechnicalDetails): TechnicalDetails {
  if (!native.available) return { available: false };
  const { route } = extractHttpContext(native.method);
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(native.metadata)) {
    if (value !== null && value !== undefined) metadata[key] = String(value);
  }
  return {
    available: true,
    requestContext: route,
    stackTrace: redactString(native.error),
    metadata,
  };
}

function traceActivityToEvent(row: NativeTraceActivityRow): TraceEvent {
  return {
    id: row.name,
    occurredAt: toIso(row.creation) ?? row.creation,
    label: "Activity Log",
    kind: row.status === "Failed" ? "ERROR" : "SERVER_ACTION",
    detail: redactString(row.subject),
  };
}

function normalizeTrace(correlationId: string, native: NativeTraceResult): Trace | null {
  if (!native || (!native.error_log && native.activity_logs.length === 0)) return null;

  const { error_log: errorLog, activity_logs: activityLogs } = native;
  const events: TraceEvent[] = [];
  if (errorLog) {
    events.push({
      id: errorLog.name,
      occurredAt: toIso(errorLog.creation) ?? errorLog.creation,
      label: "Error Log",
      kind: "ERROR",
      detail: redactString(errorLog.method),
    });
  }
  for (const activity of activityLogs) events.push(traceActivityToEvent(activity));
  events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));

  const referenceDoctype = errorLog?.reference_doctype ?? activityLogs[0]?.reference_doctype ?? undefined;
  const referenceName = errorLog?.reference_name ?? activityLogs[0]?.reference_name ?? undefined;
  const title = errorLog ? redactString(errorLog.method) : redactString(activityLogs[0].subject);
  const actor = errorLog ? metadataActor(errorLog.metadata) : toActor(activityLogs[0]?.actor ?? null);
  const executionPrincipal = { email: errorLog?.execution_principal ?? activityLogs[0]?.execution_principal ?? "" };
  const { httpStatus, route } = extractHttpContext(errorLog?.method);
  const durationMs =
    events.length > 1
      ? new Date(events[events.length - 1].occurredAt).getTime() - new Date(events[0].occurredAt).getTime()
      : undefined;

  return {
    correlationId,
    // No error_log means this correlation ID never reached ERROR/CRITICAL severity (Error
    // Log only receives those) — an Activity-only trace represents a completed operation,
    // not one still needing investigation. See ErrorEvent's `status` comment for the same
    // "no native workflow-state field" limitation this simplification shares.
    status: errorLog ? "Open" : "Resolved",
    severity: errorLog ? deriveSeverity(errorLog.metadata) : "INFO",
    title,
    occurredAt: events[0]?.occurredAt ?? toIso(errorLog?.creation) ?? new Date().toISOString(),
    actor,
    executionPrincipal,
    module: deriveModule(referenceDoctype, route),
    operation: title,
    source: deriveSource(referenceDoctype, title),
    referenceDoctype,
    referenceName,
    route,
    httpStatus,
    durationMs,
    events,
    userSafeMessage: title,
    hasTechnicalDetails: errorLog?.has_error_detail ?? false,
  };
}

// ---------------------------------------------------------------------------------------
// Pagination — defense-in-depth clamp on top of the backend's own (mission §33). Never
// trusts filters.page/pageSize as-is even though observability.py already clamps identically.
// ---------------------------------------------------------------------------------------

function clampPage(page: number): number {
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

function clampPageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize) || pageSize < 1) return 25;
  return Math.min(Math.floor(pageSize), 100);
}

function toPagination(native: NativePagination) {
  return { page: native.page, pageSize: native.page_size, total: native.total };
}

// ---------------------------------------------------------------------------------------
// Overview aggregate — a real (not demo) implementation, bounded per mission §32/§33: every
// number is either a real filtered `pagination.total` (a cheap COUNT, no row download) or
// computed from one bounded row fetch (capped at 500 rows) for the trend/module breakdown.
// Integration figures are honestly zero — see the class-level doc comment on
// `getIntegrationSummary` for why.
// ---------------------------------------------------------------------------------------

const RANGE_DAYS: Record<TrendRange, number> = { "24h": 1, "7d": 7, "30d": 30 };

/** Live-verified bug (2026-09-24) caught during O-10B's own end-to-end test: a plain
 * `date.toISOString().slice(0, 10)` gives the UTC calendar date, but `list_errors`/
 * `list_activity`'s `date_from`/`date_to` filters compare against `creation` strings stored
 * in the site's *local* timezone (`Asia/Colombo`, UTC+05:30 — see `SITE_UTC_OFFSET` above),
 * not UTC. Sending a UTC calendar date as a naive local-time boundary silently shifts the
 * "today"/"yesterday" window by up to 5.5 hours — every date-range filter this module sends
 * to the backend must go through this, not a bare `toISOString()`. */
function siteLocalDate(date: Date): string {
  const shifted = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function buildErrorTrend(range: TrendRange, occurredAtIso: string[]): ErrorTrendPoint[] {
  const buckets = range === "24h" ? 8 : range === "7d" ? 7 : 10;
  const hoursPerBucket = range === "24h" ? 3 : range === "7d" ? 24 : 72;
  const now = Date.now();
  const points: ErrorTrendPoint[] = [];
  for (let i = buckets - 1; i >= 0; i--) {
    const bucketEnd = now - i * hoursPerBucket * 60 * 60 * 1000;
    const bucketStart = bucketEnd - hoursPerBucket * 60 * 60 * 1000;
    const count = occurredAtIso.filter((iso) => {
      const t = new Date(iso).getTime();
      return t > bucketStart && t <= bucketEnd;
    }).length;
    points.push({ label: new Date(bucketEnd).toISOString(), count });
  }
  return points;
}

// ---------------------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------------------

export function getServerObservabilityProvider(): ObservabilityProvider {
  return {
    async getSummary(range: TrendRange): Promise<ObservabilitySummary> {
      const since = new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const [errorsToday, errorsYesterday, criticalTotal, recentActivity, recentRows] = await Promise.all([
        callObservabilityRead<NativeListResult<NativeErrorRow>>("list_errors", {
          page: 1,
          page_size: 1,
          date_from: siteLocalDate(today),
        }),
        callObservabilityRead<NativeListResult<NativeErrorRow>>("list_errors", {
          page: 1,
          page_size: 1,
          date_from: siteLocalDate(yesterday),
          date_to: siteLocalDate(yesterday),
        }),
        callObservabilityRead<NativeListResult<NativeErrorRow>>("list_errors", {
          page: 1,
          page_size: 1,
          severity: "CRITICAL",
          date_from: siteLocalDate(since),
        }),
        callObservabilityRead<NativeListResult<NativeActivityRow>>("list_activity", {
          page: 1,
          page_size: 1,
          date_from: siteLocalDate(since),
        }),
        // Bounded row fetch (mission §33) purely to compute trend/module buckets — never
        // the full table, capped well below any real-world Error Log size today.
        callObservabilityRead<NativeListResult<NativeErrorRow>>("list_errors", {
          page: 1,
          page_size: 500,
          date_from: siteLocalDate(since),
        }),
      ]);

      const events = recentRows.items.map(normalizeErrorEvent);
      const errorsByModule = new Map<string, ModuleErrorBreakdown>();
      for (const event of events) {
        const existing = errorsByModule.get(event.module) ?? { module: event.module, count: 0, criticalCount: 0 };
        existing.count += 1;
        if (event.severity === "CRITICAL") existing.criticalCount += 1;
        errorsByModule.set(event.module, existing);
      }

      return {
        range,
        errorsToday: errorsToday.pagination.total,
        errorsYesterday: errorsYesterday.pagination.total,
        criticalErrors: criticalTotal.pagination.total,
        // No real integration-event source exists yet — see getIntegrationSummary().
        failedIntegrations: 0,
        recentActivityCount: recentActivity.pagination.total,
        errorTrend: buildErrorTrend(
          range,
          events.map((e) => e.occurredAt),
        ),
        errorsByModule: Array.from(errorsByModule.values()).sort((a, b) => b.count - a.count),
        recentCriticalEvents: events
          .filter((e) => e.severity === "CRITICAL" || e.severity === "ERROR")
          .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
          .slice(0, 5),
      };
    },

    /**
     * O-10C wiring note — `module`/`source`/`status` are NOT sent to the backend, on
     * purpose, not by oversight:
     * - `module`/`source` have no native backend filter (both are DERIVED_SAFELY at
     *   normalization time from `reference_doctype`/the URL path — see `deriveModule()`/
     *   `deriveSource()` above). Silently accepting these params without filtering by them
     *   would return every row regardless of the caller's selection — exactly the
     *   misleading "filter is a no-op" behavior the O-10C mission (§6) forbids. The
     *   corresponding filter fields were removed from Error Explorer's UI
     *   (`errors/page.tsx`) for the same reason, rather than left in place doing nothing.
     * - `status` IS handled, but truthfully: every real `ErrorEvent.status` is currently
     *   hardcoded `"Open"` (`normalizeErrorEvent()` — Error Log has no native workflow-
     *   state field at all). A request for any other status can be answered correctly
     *   without even querying the backend: no real row will ever match. Requesting
     *   `"Open"` (or no status filter) is answered normally.
     */
    async getErrors(filters: ObservabilityFilters, page: number, pageSize: number): Promise<ErrorListResult> {
      if (filters.status && filters.status !== "Open") {
        return { items: [], pagination: { page: clampPage(page), pageSize: clampPageSize(pageSize), total: 0 } };
      }
      const native = await callObservabilityRead<NativeListResult<NativeErrorRow>>("list_errors", {
        page: clampPage(page),
        page_size: clampPageSize(pageSize),
        severity: filters.severity,
        trace_id: filters.correlationId,
        reference_doctype: filters.doctype,
        reference_name: filters.docname,
        actor_email: filters.actorEmail,
        search: filters.search,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
      });
      return { items: native.items.map(normalizeErrorEvent), pagination: toPagination(native.pagination) };
    },

    /**
     * Malformed IDs are deliberately NOT pre-validated/short-circuited here — that would
     * silently collapse "malformed input" and "well-formed but nonexistent" into the same
     * `null` result, exactly the ambiguity mission §22 forbids ("never assume a malformed ID
     * means not found yet, try again"). `get_trace`'s own backend validation
     * (`_validate_correlation_id()`) throws a distinct `ValidationError` for a malformed ID,
     * which `callObservabilityRead()` surfaces as a thrown `ObservabilityReadError` — a
     * caller can therefore tell "your input was invalid" (catch) apart from "that trace
     * doesn't exist" (`null`). Independent-review finding (2026-09-24), fixed same day: an
     * earlier version of this method pre-validated client-side and returned `null` for both
     * cases alike.
     */
    async getTrace(correlationId: string): Promise<Trace | null> {
      const native = await callObservabilityRead<NativeTraceResult>("get_trace", { correlation_id: correlationId });
      return normalizeTrace(correlationId.trim().toUpperCase(), native);
    },

    /** Same malformed-vs-nonexistent distinction as `getTrace()` above — no client-side
     * pre-validation short-circuit. */
    async getTechnicalDetails(correlationId: string): Promise<TechnicalDetails> {
      const native = await callObservabilityRead<NativeTechnicalDetails>("get_technical_details", {
        correlation_id: correlationId,
      });
      return normalizeTechnicalDetails(native);
    },

    async getActivity(
      filters: ObservabilityFilters,
      page: number,
      pageSize: number,
    ): Promise<UserActivityListResult> {
      const native = await callObservabilityRead<NativeListResult<NativeActivityRow>>("list_activity", {
        page: clampPage(page),
        page_size: clampPageSize(pageSize),
        user: filters.actorEmail,
        action: filters.action,
        reference_doctype: filters.doctype,
        reference_name: filters.docname,
        correlation_id: filters.correlationId,
        search: filters.search,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
      });
      return { items: native.items.map(normalizeActivityEvent), pagination: toPagination(native.pagination) };
    },

    async getAuditRecords(filters: ObservabilityFilters, page: number, pageSize: number): Promise<AuditListResult> {
      // Document History mode (both doctype+document set) needs true oldest-first order —
      // the same detection `audit/page.tsx` already uses for the demo provider, applied
      // here as a real DB-level sort instead of a per-page JS reversal (mission §35).
      const order = filters.doctype && filters.docname ? "asc" : "desc";
      const native = await callObservabilityRead<NativeListResult<NativeVersionRow>>("list_audit", {
        page: clampPage(page),
        page_size: clampPageSize(pageSize),
        reference_doctype: filters.doctype,
        reference_name: filters.docname,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        order,
      });
      return { items: native.items.map(normalizeAuditRecord), pagination: toPagination(native.pagination) };
    },

    /**
     * Live-verified 2026-09-24: `Integration Request` (the native doctype shaped for exactly
     * this) has zero rows on the real instance, and no other backend surface records this
     * app's own outbound ERPNext calls as integration events — classified
     * `NOT_CURRENTLY_AVAILABLE` per mission §11. Returns an honest zero/empty result rather
     * than fabricating figures — this is a genuine "no data source exists yet" answer, not a
     * failure, so it does not throw.
     */
    async getIntegrationSummary(): Promise<IntegrationHealthSummary> {
      return { totalOperations: 0, successful: 0, failed: 0, averageDurationMs: 0 };
    },

    async getIntegrationEvents(
      filters: ObservabilityFilters,
      page: number,
      pageSize: number,
    ): Promise<IntegrationListResult> {
      void filters;
      return { items: [], pagination: { page: clampPage(page), pageSize: clampPageSize(pageSize), total: 0 } };
    },
  };
}
