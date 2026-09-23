import "server-only";
import type {
  AuditListResult,
  AuditRecord,
  ErrorEvent,
  ErrorListResult,
  ErrorTrendPoint,
  IntegrationEvent,
  IntegrationHealthSummary,
  IntegrationListResult,
  ModuleErrorBreakdown,
  ObservabilityFilters,
  ObservabilitySummary,
  TechnicalDetails,
  Trace,
  TraceEvent,
  TrendRange,
  UserActivityEvent,
  UserActivityListResult,
} from "./types";

/**
 * DEMO data adapter — not connected to ERPNext, Frappe Error Log, or any live Ceylon
 * Stack instance. Exists solely so the Observability Center's UI can be built, reviewed
 * and refined (this package's stated mission) while the real backend read-side APIs
 * (O-7 onward) don't exist yet. See `provider.ts` for the swap point and
 * `docs/observability-frontend-architecture.md` for the LIVE/DEMO/WAITING_FOR_BACKEND
 * breakdown — every value this file returns is DEMO.
 *
 * Fixtures use this app's own real domain vocabulary (Work Order, Material Transfer,
 * BOM, Sales Order, Purchase Order, Pick List, Stock Entry — all real doctypes this
 * project already implements) so the UI reads as Ceylon Stack's own data, not generic
 * placeholder text, without claiming any of it actually happened.
 *
 * Correlation IDs use the real `CS-YYMMDD-XXXXXX` format (`lib/correlationId.ts`) built
 * from each fixture's own offset date, not hardcoded, so they always look
 * internally-consistent with their timestamp no matter which day this is viewed.
 */

function correlationIdFor(date: Date, seed: string): string {
  const yy = String(date.getUTCFullYear() % 100).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `CS-${yy}${mm}${dd}-${seed}`;
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

type Fixture = Omit<ErrorEvent, "correlationId"> & {
  correlationIdSeed: string;
  /** Explicit multi-step timeline for the handful of fixtures built to showcase Trace
   * Detail's timeline (mission §16/§25) — absent on the rest, which fall back to a
   * single-event timeline derived from the ErrorEvent itself in `buildDefaultTimeline()`
   * below. Matches the real O-2-verified model: "one write call = one correlation ID"
   * today, so most traces genuinely have exactly one event — only a few fixtures need
   * (demo) multi-event richness to prove the UI can render more once a future backend
   * groups events under one trace (see `types.ts`'s Trace/TraceEvent doc comments). */
  timeline?: TraceEvent[];
  technicalDetails?: TechnicalDetails;
};

const FIXTURES: Fixture[] = [
  {
    id: "demo-err-1",
    correlationIdSeed: "F82A41",
    severity: "CRITICAL",
    occurredAt: hoursAgo(0.4).toISOString(),
    module: "Manufacturing",
    operation: "Material Transfer Failed",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Open",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    userSafeMessage: "Material Transfer could not be completed because the requested quantity is unavailable.",
    hasTechnicalDetails: true,
    httpStatus: 417,
    route: "/manufacturing/work-orders/WO-00042",
    timeline: [
      { id: "t1", occurredAt: hoursAgo(0.4).toISOString(), label: "User Action", kind: "USER_ACTION", detail: "Material Transfer" },
      { id: "t2", occurredAt: hoursAgo(0.3999).toISOString(), label: "Server Action", kind: "SERVER_ACTION", detail: "Transfer request accepted" },
      { id: "t3", occurredAt: hoursAgo(0.3998).toISOString(), label: "ERPNext API", kind: "ERPNEXT_API", detail: "make_stock_entry" },
      { id: "t4", occurredAt: hoursAgo(0.3997).toISOString(), label: "ERPNext Validation", kind: "ERPNEXT_VALIDATION", detail: "Stock availability validation" },
      { id: "t5", occurredAt: hoursAgo(0.3996).toISOString(), label: "Error", kind: "ERROR", detail: "Insufficient stock" },
    ],
    technicalDetails: {
      available: true,
      errorType: "ValidationError",
      erpnextMessage: "Row #2: Qty must be less than or equal to Available Qty 12.0 in Warehouse Raw Materials - CS",
      requestContext: "POST /api/method/erpnext.stock.doctype.stock_entry.stock_entry.make_stock_entry",
      responseContext: "417 Expectation Failed",
      metadata: { doctype: "Stock Entry", purpose: "Material Transfer for Manufacture", work_order: "WO-00042" },
    },
  },
  {
    id: "demo-err-2",
    correlationIdSeed: "3B19C7",
    severity: "ERROR",
    occurredAt: hoursAgo(3).toISOString(),
    module: "Sales",
    operation: "Sales Order Submit Failed",
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Open",
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00041",
    userSafeMessage: "Sales Order could not be submitted because a linked Item is missing a Price List rate.",
    hasTechnicalDetails: true,
    httpStatus: 417,
    route: "/sales/orders/SAL-ORD-2026-00041",
    technicalDetails: {
      available: true,
      errorType: "ValidationError",
      erpnextMessage: "Row #3: Rate is mandatory for FG-STEEL-BRACKET-ASSY under Price List Standard Selling.",
      requestContext: "PUT /api/resource/Sales Order/SAL-ORD-2026-00041",
      responseContext: "417 Expectation Failed",
      metadata: { doctype: "Sales Order", price_list: "Standard Selling" },
    },
  },
  {
    id: "demo-err-3",
    correlationIdSeed: "A410D2",
    severity: "WARNING",
    occurredAt: hoursAgo(6).toISOString(),
    module: "Stock",
    operation: "Stock Entry Validation Warning",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Resolved",
    referenceDoctype: "Stock Entry",
    referenceName: "STE-2026-00118",
    userSafeMessage: "Stock Entry was saved, but the target warehouse is near its configured reorder threshold.",
    hasTechnicalDetails: false,
    httpStatus: 200,
    route: "/stock/stock-entries/STE-2026-00118",
  },
  {
    id: "demo-err-4",
    correlationIdSeed: "77E0F5",
    severity: "ERROR",
    occurredAt: hoursAgo(9).toISOString(),
    module: "Buying",
    operation: "Purchase Receipt Failed",
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Investigating",
    referenceDoctype: "Purchase Receipt",
    referenceName: "MAT-PRE-2026-00027",
    userSafeMessage: "Purchase Receipt could not be created because the linked Purchase Order is fully received.",
    hasTechnicalDetails: true,
    technicalDetails: {
      available: true,
      errorType: "ValidationError",
      erpnextMessage: "Purchase Order MAT-PO-2026-00031 is already fully received against all items.",
      requestContext: "POST /api/resource/Purchase Receipt",
      responseContext: "417 Expectation Failed",
      metadata: { doctype: "Purchase Receipt", purchase_order: "MAT-PO-2026-00031" },
    },
    httpStatus: 417,
    route: "/buying/purchase-receipts/MAT-PRE-2026-00027",
  },
  {
    id: "demo-err-5",
    correlationIdSeed: "1CDA88",
    severity: "CRITICAL",
    occurredAt: hoursAgo(14).toISOString(),
    module: "Manufacturing",
    operation: "BOM Submit Failed",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Open",
    referenceDoctype: "BOM",
    referenceName: "BOM-FG-STEEL-BRACKET-ASSY-001",
    userSafeMessage: "BOM could not be submitted because one component Item has no default Warehouse set.",
    hasTechnicalDetails: true,
    httpStatus: 417,
    route: "/master-data/boms/BOM-FG-STEEL-BRACKET-ASSY-001",
    timeline: [
      { id: "t1", occurredAt: hoursAgo(14).toISOString(), label: "User Action", kind: "USER_ACTION", detail: "Submit BOM" },
      { id: "t2", occurredAt: hoursAgo(13.999).toISOString(), label: "Server Action", kind: "SERVER_ACTION", detail: "Submit request accepted" },
      { id: "t3", occurredAt: hoursAgo(13.998).toISOString(), label: "ERPNext Validation", kind: "ERPNEXT_VALIDATION", detail: "Component Item warehouse validation" },
      { id: "t4", occurredAt: hoursAgo(13.997).toISOString(), label: "Error", kind: "ERROR", detail: "Missing default warehouse" },
    ],
    technicalDetails: {
      available: true,
      errorType: "ValidationError",
      erpnextMessage: "Item RM-STEEL-ROD-10MM: Default Warehouse is mandatory for stock Item before this BOM can be submitted.",
      requestContext: "PUT /api/resource/BOM/BOM-FG-STEEL-BRACKET-ASSY-001",
      responseContext: "417 Expectation Failed",
      metadata: { doctype: "BOM", item: "RM-STEEL-ROD-10MM" },
    },
  },
  {
    id: "demo-err-6",
    correlationIdSeed: "9F4402",
    severity: "INFO",
    occurredAt: hoursAgo(20).toISOString(),
    module: "System",
    operation: "Login",
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "SERVER",
    status: "Resolved",
    userSafeMessage: "Signed in successfully.",
    hasTechnicalDetails: false,
    httpStatus: 200,
  },
  {
    id: "demo-err-7",
    correlationIdSeed: "6612BE",
    severity: "ERROR",
    occurredAt: hoursAgo(30).toISOString(),
    module: "Manufacturing",
    operation: "Work Order Submit Failed",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Resolved",
    referenceDoctype: "Work Order",
    referenceName: "MFG-WO-2026-00014",
    userSafeMessage: "Work Order could not be submitted because the source warehouse does not have enough stock.",
    hasTechnicalDetails: true,
    httpStatus: 417,
    route: "/manufacturing/work-orders/MFG-WO-2026-00014",
    timeline: [
      { id: "t1", occurredAt: hoursAgo(30).toISOString(), label: "User Action", kind: "USER_ACTION", detail: "Submit Work Order" },
      { id: "t2", occurredAt: hoursAgo(29.999).toISOString(), label: "ERPNext Validation", kind: "ERPNEXT_VALIDATION", detail: "validate_warehouse() stock check" },
      { id: "t3", occurredAt: hoursAgo(29.998).toISOString(), label: "Error", kind: "ERROR", detail: "Insufficient stock in source warehouse" },
    ],
    technicalDetails: {
      available: true,
      errorType: "ValidationError",
      erpnextMessage: "Work Order cannot be submitted: insufficient stock for RM-STEEL-ROD-10MM in Raw Materials - CS.",
      requestContext: "PUT /api/resource/Work Order/MFG-WO-2026-00014",
      responseContext: "417 Expectation Failed",
      metadata: { doctype: "Work Order", warehouse: "Raw Materials - CS" },
    },
  },
  {
    id: "demo-err-8",
    correlationIdSeed: "2A77D9",
    severity: "WARNING",
    occurredAt: hoursAgo(48).toISOString(),
    module: "Master Data",
    operation: "Item Update Warning",
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Resolved",
    referenceDoctype: "Item",
    referenceName: "FG-STEEL-BRACKET-ASSY",
    userSafeMessage: "Item was updated, but its reorder level is set below its safety stock.",
    hasTechnicalDetails: false,
    httpStatus: 200,
    route: "/master-data/items/FG-STEEL-BRACKET-ASSY",
  },
  {
    id: "demo-err-9",
    correlationIdSeed: "E501AA",
    severity: "CRITICAL",
    occurredAt: hoursAgo(75).toISOString(),
    module: "Buying",
    operation: "Purchase Invoice Failed",
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Resolved",
    referenceDoctype: "Purchase Invoice",
    referenceName: "MAT-PINV-2026-00019",
    userSafeMessage: "Purchase Invoice could not be submitted because the linked Supplier account is on hold.",
    hasTechnicalDetails: true,
    technicalDetails: {
      available: true,
      errorType: "ValidationError",
      erpnextMessage: "Supplier Coastal Steel Supplies is on hold — release the hold before submitting this invoice.",
      requestContext: "PUT /api/resource/Purchase Invoice/MAT-PINV-2026-00019",
      responseContext: "417 Expectation Failed",
      metadata: { doctype: "Purchase Invoice", supplier: "Coastal Steel Supplies" },
    },
    httpStatus: 417,
    route: "/buying/purchase-invoices/MAT-PINV-2026-00019",
  },
  {
    id: "demo-err-10",
    correlationIdSeed: "0D93F1",
    severity: "ERROR",
    occurredAt: hoursAgo(140).toISOString(),
    module: "Sales",
    operation: "Delivery Note Failed",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Resolved",
    referenceDoctype: "Delivery Note",
    referenceName: "SAL-DN-2026-00033",
    userSafeMessage: "Delivery Note could not be submitted because the Pick List it was created from is not submitted.",
    hasTechnicalDetails: true,
    technicalDetails: {
      available: true,
      errorType: "ValidationError",
      erpnextMessage: "Pick List SAL-PL-2026-00028 must be submitted before this Delivery Note can be submitted.",
      requestContext: "PUT /api/resource/Delivery Note/SAL-DN-2026-00033",
      responseContext: "417 Expectation Failed",
      metadata: { doctype: "Delivery Note", pick_list: "SAL-PL-2026-00028" },
    },
    httpStatus: 417,
    route: "/sales/delivery-notes/SAL-DN-2026-00033",
  },
  {
    id: "demo-err-11",
    correlationIdSeed: "5B8C20",
    severity: "WARNING",
    occurredAt: hoursAgo(260).toISOString(),
    module: "Stock",
    operation: "Stock Balance Discrepancy",
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Resolved",
    referenceDoctype: "Warehouse",
    referenceName: "Colombo Warehouse",
    userSafeMessage: "Stock Balance for this warehouse could not be refreshed on schedule.",
    hasTechnicalDetails: false,
    httpStatus: 200,
    route: "/stock/stock-balance",
  },
  {
    id: "demo-err-12",
    correlationIdSeed: "8817E6",
    severity: "INFO",
    occurredAt: hoursAgo(400).toISOString(),
    module: "System",
    operation: "Login",
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "SERVER",
    status: "Resolved",
    userSafeMessage: "Signed in successfully.",
    hasTechnicalDetails: false,
    httpStatus: 200,
  },
  {
    id: "demo-err-13",
    correlationIdSeed: "C204B7",
    severity: "ERROR",
    occurredAt: hoursAgo(560).toISOString(),
    module: "Manufacturing",
    operation: "Production Plan Failed",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "ERPNEXT",
    status: "Resolved",
    referenceDoctype: "Production Plan",
    referenceName: "MFG-PP-2026-00016",
    userSafeMessage: "Production Plan could not raise Work Orders because a linked BOM is inactive.",
    hasTechnicalDetails: true,
    technicalDetails: {
      available: true,
      errorType: "ValidationError",
      erpnextMessage: "BOM BOM-FG-STEEL-BRACKET-ASSY-002 is not active and cannot be used to raise a Work Order.",
      requestContext: "POST /api/method/run_doc_method",
      responseContext: "417 Expectation Failed",
      metadata: { doctype: "Production Plan", bom: "BOM-FG-STEEL-BRACKET-ASSY-002" },
    },
    httpStatus: 417,
    route: "/manufacturing/production-plans/MFG-PP-2026-00016",
  },
  {
    id: "demo-err-14",
    correlationIdSeed: "3F60A9",
    severity: "CRITICAL",
    occurredAt: hoursAgo(690).toISOString(),
    module: "Buying",
    operation: "Integration Sync Failed",
    actor: null,
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "INTEGRATION",
    status: "Resolved",
    userSafeMessage: "A scheduled Supplier data sync did not complete within its expected window.",
    hasTechnicalDetails: true,
    httpStatus: 504,
    timeline: [
      { id: "t1", occurredAt: hoursAgo(690).toISOString(), label: "Integration", kind: "SERVER_ACTION", detail: "Scheduled Supplier sync started" },
      { id: "t2", occurredAt: hoursAgo(689.98).toISOString(), label: "Error", kind: "ERROR", detail: "Sync did not complete before timeout" },
    ],
    technicalDetails: {
      available: true,
      errorType: "TimeoutError",
      requestContext: "Scheduled job: supplier_data_sync",
      responseContext: "504 Gateway Timeout after 30s",
      metadata: { integration: "Supplier Data Sync" },
    },
  },
  {
    id: "demo-err-15",
    correlationIdSeed: "7A2E60",
    severity: "CRITICAL",
    occurredAt: hoursAgo(120).toISOString(),
    module: "System",
    operation: "ERPNext Connectivity Failure",
    actor: null,
    executionPrincipal: { email: "frontend-integration@ceylonstack.local" },
    source: "SYSTEM",
    status: "Resolved",
    userSafeMessage: "The application could not reach ERPNext for a short period — requests during this window failed.",
    hasTechnicalDetails: true,
    httpStatus: 0,
    timeline: [
      { id: "t1", occurredAt: hoursAgo(120).toISOString(), label: "Server", kind: "SERVER_ACTION", detail: "Outbound request to ERPNext initiated" },
      { id: "t2", occurredAt: hoursAgo(119.995).toISOString(), label: "Error", kind: "ERROR", detail: "Connection refused" },
    ],
    technicalDetails: {
      available: true,
      errorType: "NetworkError",
      requestContext: "POST /api/resource/Stock Entry",
      responseContext: "Network error — no response received",
      metadata: { host: "erpnext (internal)" },
    },
  },
];

function toErrorEvent(fixture: Fixture): ErrorEvent {
  const { correlationIdSeed, ...rest } = fixture;
  return { ...rest, correlationId: correlationIdFor(new Date(fixture.occurredAt), correlationIdSeed) };
}

const ALL_EVENTS: ErrorEvent[] = FIXTURES.map(toErrorEvent);

/** correlationId -> the fixture's explicit timeline/technicalDetails (when defined), keyed
 * off the same computed IDs `ALL_EVENTS` uses, so `getDemoTrace()` can look up a fixture's
 * richer detail by the ID a user actually searches/clicks, not by its internal `id`. */
const TRACE_EXTRAS = new Map<string, Pick<Fixture, "timeline" | "technicalDetails">>(
  FIXTURES.map((f) => [correlationIdFor(new Date(f.occurredAt), f.correlationIdSeed), { timeline: f.timeline, technicalDetails: f.technicalDetails }]),
);

/** Fallback timeline for the (majority of) fixtures with no explicit `timeline` — a single
 * event derived from the ErrorEvent itself, matching the real O-2-verified "one write call
 * = one correlation ID" model rather than inventing steps that didn't happen. */
function buildDefaultTimeline(event: ErrorEvent): TraceEvent[] {
  return [
    {
      id: `${event.id}-default`,
      occurredAt: event.occurredAt,
      label: event.severity === "INFO" ? "Server" : "Error",
      kind: event.severity === "INFO" ? "SERVER_ACTION" : "ERROR",
      detail: event.operation,
    },
  ];
}

const RANGE_HOURS: Record<TrendRange, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };
const RANGE_BUCKETS: Record<TrendRange, { count: number; hoursPerBucket: number; labelFormat: (d: Date) => string }> = {
  "24h": {
    count: 8,
    hoursPerBucket: 3,
    labelFormat: (d) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  },
  "7d": {
    count: 7,
    hoursPerBucket: 24,
    labelFormat: (d) => d.toLocaleDateString(undefined, { weekday: "short" }),
  },
  "30d": {
    count: 10,
    hoursPerBucket: 72,
    labelFormat: (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  },
};

function withinRange(event: ErrorEvent, range: TrendRange): boolean {
  const ageHours = (Date.now() - new Date(event.occurredAt).getTime()) / (60 * 60 * 1000);
  return ageHours <= RANGE_HOURS[range];
}

function buildTrend(range: TrendRange, events: ErrorEvent[]): ErrorTrendPoint[] {
  const { count, hoursPerBucket, labelFormat } = RANGE_BUCKETS[range];
  const now = Date.now();
  const buckets: ErrorTrendPoint[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const bucketEnd = now - i * hoursPerBucket * 60 * 60 * 1000;
    const bucketStart = bucketEnd - hoursPerBucket * 60 * 60 * 1000;
    const label = labelFormat(new Date(bucketEnd));
    const bucketCount = events.filter((e) => {
      const t = new Date(e.occurredAt).getTime();
      return t > bucketStart && t <= bucketEnd;
    }).length;
    buckets.push({ label, count: bucketCount });
  }
  return buckets;
}

function buildModuleBreakdown(events: ErrorEvent[]): ModuleErrorBreakdown[] {
  const byModule = new Map<string, ModuleErrorBreakdown>();
  for (const event of events) {
    const existing = byModule.get(event.module) ?? { module: event.module, count: 0, criticalCount: 0 };
    existing.count += 1;
    if (event.severity === "CRITICAL") existing.criticalCount += 1;
    byModule.set(event.module, existing);
  }
  return Array.from(byModule.values()).sort((a, b) => b.count - a.count);
}

export async function getDemoObservabilitySummary(range: TrendRange): Promise<ObservabilitySummary> {
  const inRange = ALL_EVENTS.filter((e) => withinRange(e, range));
  const errorsToday = ALL_EVENTS.filter((e) => withinRange(e, "24h")).length;
  const errorsYesterday = ALL_EVENTS.filter((e) => {
    const ageHours = (Date.now() - new Date(e.occurredAt).getTime()) / (60 * 60 * 1000);
    return ageHours > 24 && ageHours <= 48;
  }).length;
  const criticalErrors = ALL_EVENTS.filter((e) => e.severity === "CRITICAL" && e.status !== "Resolved").length;
  // Sourced from Integration Monitoring's own fixtures (O-9), not from `ALL_EVENTS`'
  // `source === "INTEGRATION"` error rows — those are Error Explorer entries that happen
  // to originate from an integration, a different count than "how many integration
  // operations failed to complete." TIMEOUT counts as failed-to-complete for this stat,
  // same as FAILED, since neither represents a successful operation.
  const failedIntegrations = INTEGRATION_FIXTURES.filter((e) => e.status === "FAILED" || e.status === "TIMEOUT").length;
  const recentActivityCount = inRange.length * 9; // demo scaling factor — activity volume exceeds error volume in any real system

  return {
    range,
    errorsToday,
    errorsYesterday,
    criticalErrors,
    failedIntegrations,
    recentActivityCount,
    errorTrend: buildTrend(range, inRange),
    errorsByModule: buildModuleBreakdown(inRange),
    recentCriticalEvents: [...inRange]
      .filter((e) => e.severity === "CRITICAL" || e.severity === "ERROR")
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 5),
  };
}

function matchesFilters(event: ErrorEvent, filters: ObservabilityFilters): boolean {
  if (filters.severity && event.severity !== filters.severity) return false;
  if (filters.module && event.module !== filters.module) return false;
  if (filters.source && event.source !== filters.source) return false;
  if (filters.status && event.status !== filters.status) return false;
  if (filters.actorEmail && event.actor?.email !== filters.actorEmail) return false;
  if (filters.doctype && event.referenceDoctype !== filters.doctype) return false;
  if (filters.docname && event.referenceName !== filters.docname) return false;
  if (filters.dateFrom && new Date(event.occurredAt) < new Date(filters.dateFrom)) return false;
  if (filters.dateTo && new Date(event.occurredAt) > new Date(`${filters.dateTo}T23:59:59`)) return false;
  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    if (needle) {
      const haystack = [
        event.operation,
        event.module,
        event.correlationId,
        event.referenceDoctype,
        event.referenceName,
        event.actor?.email,
        event.actor?.fullName,
        event.userSafeMessage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
  }
  return true;
}

/** Error Explorer's list query — filters, sorts newest-first, then returns exactly one
 * page. Demo-only: filters/sorts an in-memory array, but the *shape* of the contract
 * (accept filters + page/pageSize, return items + the real filtered total) is what a
 * future real adapter must also honor, per `provider.ts`'s interface doc comment. */
export async function getDemoErrors(
  filters: ObservabilityFilters,
  page: number,
  pageSize: number,
): Promise<ErrorListResult> {
  const filtered = ALL_EVENTS.filter((e) => matchesFilters(e, filters)).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { items, pagination: { page, pageSize, total } };
}

/** Resolves one trace by exact correlation ID. Normalizes case the same way
 * `correlationIdFormat.ts`'s client-safe validator does, since a human might paste a
 * lowercase ID — never treats near-matches or partial IDs as a hit (mission §7: exact
 * lookup only). Returns `null` on no match, letting the caller render an honest
 * not-found state rather than guessing. */
export async function getDemoTrace(correlationId: string): Promise<Trace | null> {
  const normalized = correlationId.trim().toUpperCase();
  const event = ALL_EVENTS.find((e) => e.correlationId === normalized);
  if (!event) return null;

  const extras = TRACE_EXTRAS.get(event.correlationId);
  const events = extras?.timeline ?? buildDefaultTimeline(event);
  const durationMs =
    events.length > 1
      ? new Date(events[events.length - 1].occurredAt).getTime() - new Date(events[0].occurredAt).getTime()
      : undefined;

  return {
    correlationId: event.correlationId,
    status: event.status,
    severity: event.severity,
    title: event.operation,
    occurredAt: event.occurredAt,
    actor: event.actor,
    executionPrincipal: event.executionPrincipal,
    module: event.module,
    operation: event.operation,
    source: event.source,
    referenceDoctype: event.referenceDoctype,
    referenceName: event.referenceName,
    route: event.route,
    httpStatus: event.httpStatus,
    durationMs,
    events,
    userSafeMessage: event.userSafeMessage,
    hasTechnicalDetails: event.hasTechnicalDetails,
  };
}

/** Returns the same fixture's `TechnicalDetails` `getDemoTrace()` would use internally —
 * kept as its own export so Trace Detail can render the gated panel independently of the
 * rest of the trace (mirroring how a real adapter would likely need a separate,
 * more-restricted call for this than for the trace summary itself). */
export async function getDemoTechnicalDetails(correlationId: string): Promise<TechnicalDetails> {
  const normalized = correlationId.trim().toUpperCase();
  const extras = TRACE_EXTRAS.get(normalized);
  return extras?.technicalDetails ?? { available: false };
}

/**
 * DEMO User Activity (O-8) + Audit Trail (O-8) fixtures.
 *
 * Built as ONE interconnected investigation story (mission §29), not independent fixtures
 * per screen — reusing the exact same actor, Work Order, and correlation ID
 * (`niroshan@customer.example`, `WO-00042`, `CS-YYMMDD-F82A41`) the O-7 Error/Trace
 * fixtures above already use, so the full chain actually resolves end-to-end:
 *
 *   Activity "Material Transfer" (Failed, demo-act-5)
 *     -> Trace CS-YYMMDD-F82A41 (the real O-7 `demo-err-1` fixture, full timeline +
 *        technical details)
 *     -> Trace Detail's related document WO-00042 -> "View Audit"
 *     -> Audit Trail filtered to WO-00042, showing the Quantity change (10 -> 15,
 *        demo-aud-2) that explains *why* the transfer failed, plus the transfer-failure
 *        flag itself (demo-aud-4, also carrying the same F82A41 correlation ID so Audit ->
 *        Trace resolves back to the identical trace).
 *
 * A second, independent story (Priya / Sales Order SAL-ORD-2026-00091 / a Delivery Date
 * change) mirrors this package's own worked example in the mission brief's opening
 * "CORE INVESTIGATION MODEL" section, using this app's real Sales Order route/doctype.
 * A handful of other fixtures reuse existing O-7 correlation IDs (2A77D9, 3B19C7, 77E0F5,
 * E501AA, 3F60A9) purely to widen cross-links into Trace Detail without inventing new
 * technical-detail content, plus standalone fixtures for module/actor/status variety and
 * the two honest edge cases the mission explicitly calls out: a null `actor` (mission
 * §25, "Actor unavailable" — never fabricated from the execution principal) and a
 * `row_added` child-table change (mission §24, WAITING_FOR_BACKEND presentation).
 */

const ACTIVITY_FIXTURES: UserActivityEvent[] = [
  {
    id: "demo-act-1",
    occurredAt: hoursAgo(0.95).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "System",
    action: "Login",
    description: "Signed in successfully.",
    source: "SERVER",
    status: "Success",
  },
  {
    id: "demo-act-2",
    occurredAt: hoursAgo(0.83).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    action: "Created",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-3",
    occurredAt: hoursAgo(0.75).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    action: "Updated",
    description: "Quantity changed from 10 to 15.",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-4",
    occurredAt: hoursAgo(0.68).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    action: "Submitted",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-5",
    occurredAt: hoursAgo(0.4).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    action: "Material Transfer",
    description: "Material Transfer could not be completed because the requested quantity is unavailable.",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    correlationId: correlationIdFor(hoursAgo(0.4), "F82A41"),
    source: "ERPNEXT",
    status: "Failed",
  },
  {
    id: "demo-act-6",
    occurredAt: hoursAgo(0.35).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    action: "Material Transfer",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-7",
    occurredAt: hoursAgo(0.3).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    action: "Updated",
    description: "Material Transferred quantity recorded.",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-8",
    occurredAt: hoursAgo(0.1).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "System",
    action: "Logout",
    source: "SERVER",
    status: "Success",
  },
  {
    id: "demo-act-9",
    occurredAt: hoursAgo(2.5).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "System",
    action: "Login",
    description: "Signed in successfully.",
    source: "SERVER",
    status: "Success",
  },
  {
    id: "demo-act-10",
    occurredAt: hoursAgo(20).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "Sales",
    action: "Created",
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00091",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-11",
    occurredAt: hoursAgo(18).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "Sales",
    action: "Submitted",
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00091",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-12",
    occurredAt: hoursAgo(15).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "Sales",
    action: "Updated",
    description: "Delivery Date changed from 22 Sep 2026 to 28 Sep 2026.",
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00091",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-13",
    occurredAt: hoursAgo(3).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "Sales",
    action: "Submitted",
    description: "Sales Order could not be submitted because a linked Item is missing a Price List rate.",
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00041",
    correlationId: correlationIdFor(hoursAgo(3), "3B19C7"),
    source: "ERPNEXT",
    status: "Failed",
  },
  {
    id: "demo-act-14",
    occurredAt: hoursAgo(48.2).toISOString(),
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    module: "Master Data",
    action: "Created",
    referenceDoctype: "Item",
    referenceName: "FG-STEEL-BRACKET-ASSY",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-15",
    occurredAt: hoursAgo(48).toISOString(),
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    module: "Master Data",
    action: "Updated",
    description: "Item was updated, but its reorder level is set below its safety stock.",
    referenceDoctype: "Item",
    referenceName: "FG-STEEL-BRACKET-ASSY",
    correlationId: correlationIdFor(hoursAgo(48), "2A77D9"),
    source: "ERPNEXT",
    status: "Warning",
  },
  {
    id: "demo-act-16",
    occurredAt: hoursAgo(76).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "Buying",
    action: "Approved",
    referenceDoctype: "Purchase Order",
    referenceName: "MAT-PO-2026-00031",
    source: "ERPNEXT",
    status: "Success",
  },
  {
    id: "demo-act-17",
    occurredAt: hoursAgo(9.2).toISOString(),
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    module: "Buying",
    action: "Created",
    description: "Purchase Receipt could not be created because the linked Purchase Order is fully received.",
    referenceDoctype: "Purchase Receipt",
    referenceName: "MAT-PRE-2026-00027",
    correlationId: correlationIdFor(hoursAgo(9.2), "77E0F5"),
    source: "ERPNEXT",
    status: "Failed",
  },
  {
    id: "demo-act-18",
    occurredAt: hoursAgo(690).toISOString(),
    actor: null,
    module: "Buying",
    action: "Integration Action",
    description: "A scheduled Supplier data sync did not complete within its expected window.",
    correlationId: correlationIdFor(hoursAgo(690), "3F60A9"),
    source: "INTEGRATION",
    status: "Failed",
  },
];

const AUDIT_FIXTURES: AuditRecord[] = [
  {
    id: "demo-aud-1",
    occurredAt: hoursAgo(0.83).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    action: "Created",
    changes: [{ field: "qty", fieldLabel: "Quantity", previousValue: "—", newValue: "10", changeType: "field_added" }],
    versionId: "WO-VER-1001",
  },
  {
    id: "demo-aud-2",
    occurredAt: hoursAgo(0.75).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    action: "Updated",
    changes: [{ field: "qty", fieldLabel: "Quantity", previousValue: "10", newValue: "15", changeType: "field_changed" }],
    versionId: "WO-VER-1002",
  },
  {
    id: "demo-aud-3",
    occurredAt: hoursAgo(0.68).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    action: "Submitted",
    changes: [{ field: "docstatus", fieldLabel: "Status", previousValue: "Draft", newValue: "Submitted", changeType: "field_changed" }],
    versionId: "WO-VER-1003",
  },
  {
    id: "demo-aud-4",
    occurredAt: hoursAgo(0.4).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    action: "Material Transfer Failed",
    changes: [
      {
        field: "material_transfer_status",
        fieldLabel: "Material Transfer Status",
        previousValue: "Not Started",
        newValue: "Attempted — Failed",
        changeType: "field_changed",
      },
    ],
    correlationId: correlationIdFor(hoursAgo(0.4), "F82A41"),
    versionId: "WO-VER-1004",
  },
  {
    id: "demo-aud-5",
    occurredAt: hoursAgo(0.3).toISOString(),
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    module: "Manufacturing",
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    action: "Updated",
    changes: [
      {
        field: "material_transferred_for_manufacturing",
        fieldLabel: "Material Transferred",
        previousValue: "0",
        newValue: "15",
        changeType: "field_changed",
      },
    ],
    versionId: "WO-VER-1005",
  },
  {
    id: "demo-aud-6",
    occurredAt: hoursAgo(20).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "Sales",
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00091",
    action: "Created",
    changes: [
      { field: "delivery_date", fieldLabel: "Delivery Date", previousValue: "—", newValue: "22 Sep 2026", changeType: "field_added" },
    ],
    versionId: "SO-VER-2001",
  },
  {
    id: "demo-aud-7",
    occurredAt: hoursAgo(18).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "Sales",
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00091",
    action: "Submitted",
    changes: [{ field: "docstatus", fieldLabel: "Status", previousValue: "Draft", newValue: "Submitted", changeType: "field_changed" }],
    versionId: "SO-VER-2002",
  },
  {
    id: "demo-aud-8",
    occurredAt: hoursAgo(15).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "Sales",
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00091",
    action: "Updated",
    changes: [
      {
        field: "delivery_date",
        fieldLabel: "Delivery Date",
        previousValue: "22 Sep 2026",
        newValue: "28 Sep 2026",
        changeType: "field_changed",
      },
    ],
    versionId: "SO-VER-2003",
  },
  {
    id: "demo-aud-9",
    occurredAt: hoursAgo(260).toISOString(),
    actor: null,
    module: "Stock",
    referenceDoctype: "Warehouse",
    referenceName: "Colombo Warehouse",
    action: "Updated",
    changes: [{ field: "disabled", fieldLabel: "Disabled", previousValue: "No", newValue: "Yes", changeType: "field_changed" }],
    versionId: "WH-VER-6001",
  },
  {
    id: "demo-aud-10",
    occurredAt: hoursAgo(75).toISOString(),
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    module: "Buying",
    referenceDoctype: "Purchase Invoice",
    referenceName: "MAT-PINV-2026-00019",
    action: "Cancelled",
    changes: [{ field: "docstatus", fieldLabel: "Status", previousValue: "Submitted", newValue: "Cancelled", changeType: "field_changed" }],
    correlationId: correlationIdFor(hoursAgo(75), "E501AA"),
    versionId: "PINV-VER-4001",
  },
  {
    id: "demo-aud-11",
    occurredAt: hoursAgo(48.5).toISOString(),
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    module: "Manufacturing",
    referenceDoctype: "BOM",
    referenceName: "BOM-FG-STEEL-BRACKET-ASSY-002",
    action: "Updated",
    changes: [{ field: "items", fieldLabel: "Components", previousValue: "—", newValue: "RM-STEEL-ROD-12MM", changeType: "row_added" }],
    versionId: "BOM-VER-5001",
  },
  {
    id: "demo-aud-12",
    occurredAt: hoursAgo(48).toISOString(),
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    module: "Master Data",
    referenceDoctype: "Item",
    referenceName: "FG-STEEL-BRACKET-ASSY",
    action: "Updated",
    changes: [
      { field: "reorder_level", fieldLabel: "Reorder Level", previousValue: "20", newValue: "15", changeType: "field_changed" },
    ],
    correlationId: correlationIdFor(hoursAgo(48), "2A77D9"),
    versionId: "ITEM-VER-3001",
  },
];

function matchesActivityFilters(event: UserActivityEvent, filters: ObservabilityFilters): boolean {
  if (filters.module && event.module !== filters.module) return false;
  if (filters.status && event.status !== filters.status) return false;
  if (filters.action && event.action !== filters.action) return false;
  if (filters.actorEmail && event.actor?.email !== filters.actorEmail) return false;
  if (filters.doctype && event.referenceDoctype !== filters.doctype) return false;
  if (filters.docname && event.referenceName !== filters.docname) return false;
  if (filters.correlationId && event.correlationId !== filters.correlationId.toUpperCase()) return false;
  if (filters.dateFrom && new Date(event.occurredAt) < new Date(filters.dateFrom)) return false;
  if (filters.dateTo && new Date(event.occurredAt) > new Date(`${filters.dateTo}T23:59:59`)) return false;
  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    if (needle) {
      const haystack = [
        event.action,
        event.module,
        event.description,
        event.correlationId,
        event.referenceDoctype,
        event.referenceName,
        event.actor?.email,
        event.actor?.fullName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
  }
  return true;
}

/** User Activity's list query — same filter/sort/page contract as `getDemoErrors()`. */
export async function getDemoActivity(
  filters: ObservabilityFilters,
  page: number,
  pageSize: number,
): Promise<UserActivityListResult> {
  const filtered = ACTIVITY_FIXTURES.filter((e) => matchesActivityFilters(e, filters)).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { items, pagination: { page, pageSize, total } };
}

function matchesAuditFilters(record: AuditRecord, filters: ObservabilityFilters): boolean {
  if (filters.module && record.module !== filters.module) return false;
  if (filters.action && record.action !== filters.action) return false;
  if (filters.actorEmail && record.actor?.email !== filters.actorEmail) return false;
  if (filters.doctype && record.referenceDoctype !== filters.doctype) return false;
  if (filters.docname && record.referenceName !== filters.docname) return false;
  if (filters.correlationId && record.correlationId !== filters.correlationId.toUpperCase()) return false;
  if (filters.dateFrom && new Date(record.occurredAt) < new Date(filters.dateFrom)) return false;
  if (filters.dateTo && new Date(record.occurredAt) > new Date(`${filters.dateTo}T23:59:59`)) return false;
  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    if (needle) {
      const haystack = [
        record.action,
        record.module,
        record.referenceDoctype,
        record.referenceName,
        record.correlationId,
        record.actor?.email,
        record.actor?.fullName,
        ...record.changes.map((c) => c.fieldLabel),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
  }
  return true;
}

/** Audit Trail's list query — same filter/sort/page contract as `getDemoErrors()`.
 * Returns newest-first; the "document history" presentation (mission §27, one document's
 * full timeline oldest-first) is a page-level re-order of this same result, not a
 * separate provider method — every field needed for either ordering is already present
 * on each `AuditRecord`. */
export async function getDemoAuditRecords(
  filters: ObservabilityFilters,
  page: number,
  pageSize: number,
): Promise<AuditListResult> {
  const filtered = AUDIT_FIXTURES.filter((r) => matchesAuditFilters(r, filters)).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { items, pagination: { page, pageSize, total } };
}

/**
 * DEMO Integration Monitoring (O-9) fixtures — extends the same interconnected
 * investigation story rather than inventing a disconnected screen (mission §21):
 *
 *   demo-int-1 reuses O-7's `demo-err-1` correlation ID (`CS-YYMMDD-F82A41`) and is, field
 *   for field, this package's own worked example ("ERPNext / make_stock_entry / FAILED /
 *   287 ms / WO-00042 / Niroshan / CS-260923-F82A41") — clicking its Trace badge resolves
 *   to the real O-7 trace, whose "View Audit" link resolves to the real O-8 Quantity
 *   change that explains the failure. Four more rows (`demo-int-4/5/6/7`) reuse other
 *   existing O-7 correlation IDs (`3B19C7`/`77E0F5`/`2A77D9`/`3F60A9`) purely to widen
 *   cross-links into real traces without inventing new technical-detail content, matching
 *   O-8's own precedent for doing this.
 *
 *   `demo-int-2` is this mission's second worked example verbatim (Email confirmation on
 *   the existing `SAL-ORD-2026-00091` Sales Order — the same document O-8's second
 *   investigation story already uses). `demo-int-3` is the dedicated TIMEOUT example
 *   (mission §23) — kept intentionally distinct from a same-integration FAILED row so the
 *   UI's visual difference between the two statuses is actually exercised.
 *
 *   `demo-int-7` (Automation), `demo-int-10` (External API), and `demo-int-11` (ERPNext)
 *   are the mission §27 null-actor set: `demo-int-7`/`demo-int-10` both set
 *   `systemGenerated: true` because their source is a genuinely scheduled job, so the UI
 *   may honestly render "System"; `demo-int-11`'s attribution is simply unresolved (a
 *   webhook delivery, not a scheduled job), so it must render "Actor unavailable" — never
 *   inferred from the null actor alone. See `IntegrationExplorerTable` and
 *   `docs/observability-frontend-architecture.md`'s "Null actor semantics" section.
 *
 *   `demo-int-8/9` (AI Service) and `demo-int-10` (External API) round out the five
 *   integration categories this mission names (mission §1/§7) without hard-coding any UI
 *   branch to those specific names — `integration`/`integrationType` are plain strings.
 */
function plusMs(date: Date, ms: number): string {
  return new Date(date.getTime() + ms).toISOString();
}

const INTEGRATION_FIXTURES: IntegrationEvent[] = [
  {
    id: "demo-int-1",
    occurredAt: hoursAgo(0.4).toISOString(),
    completedAt: plusMs(hoursAgo(0.4), 287),
    durationMs: 287,
    integration: "ERPNext",
    integrationType: "ERPNext",
    operation: "make_stock_entry",
    status: "FAILED",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    correlationId: correlationIdFor(hoursAgo(0.4), "F82A41"),
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    source: "INTEGRATION",
    safeMessage: "Material Transfer could not be completed because the requested quantity is unavailable.",
    errorClassification: "ValidationError",
  },
  {
    id: "demo-int-2",
    occurredAt: hoursAgo(18).toISOString(),
    completedAt: plusMs(hoursAgo(18), 420),
    durationMs: 420,
    integration: "Email",
    integrationType: "Email",
    operation: "Send Sales Order Confirmation",
    status: "SUCCESS",
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00091",
    source: "INTEGRATION",
    safeMessage: "Sales Order confirmation email sent successfully.",
  },
  {
    id: "demo-int-3",
    occurredAt: hoursAgo(1.2).toISOString(),
    completedAt: plusMs(hoursAgo(1.2), 30000),
    durationMs: 30000,
    integration: "ERPNext API",
    integrationType: "ERPNext",
    operation: "submit Work Order",
    status: "TIMEOUT",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    referenceDoctype: "Work Order",
    referenceName: "WO-00042",
    source: "INTEGRATION",
    safeMessage: "ERPNext did not respond within the configured request timeout.",
    errorClassification: "TimeoutError",
  },
  {
    id: "demo-int-4",
    occurredAt: hoursAgo(3).toISOString(),
    completedAt: plusMs(hoursAgo(3), 610),
    durationMs: 610,
    integration: "ERPNext",
    integrationType: "ERPNext",
    operation: "submit_sales_order",
    status: "FAILED",
    actor: { email: "priya@customer.example", fullName: "Priya Fernando" },
    correlationId: correlationIdFor(hoursAgo(3), "3B19C7"),
    referenceDoctype: "Sales Order",
    referenceName: "SAL-ORD-2026-00041",
    source: "INTEGRATION",
    safeMessage: "Sales Order could not be submitted because a linked Item is missing a Price List rate.",
    errorClassification: "ValidationError",
  },
  {
    id: "demo-int-5",
    occurredAt: hoursAgo(9).toISOString(),
    completedAt: plusMs(hoursAgo(9), 340),
    durationMs: 340,
    integration: "ERPNext",
    integrationType: "ERPNext",
    operation: "create_purchase_receipt",
    status: "FAILED",
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    correlationId: correlationIdFor(hoursAgo(9), "77E0F5"),
    referenceDoctype: "Purchase Receipt",
    referenceName: "MAT-PRE-2026-00027",
    source: "INTEGRATION",
    safeMessage: "Purchase Receipt could not be created because the linked Purchase Order is fully received.",
    errorClassification: "ValidationError",
  },
  {
    id: "demo-int-6",
    occurredAt: hoursAgo(48).toISOString(),
    completedAt: plusMs(hoursAgo(48), 150),
    durationMs: 150,
    integration: "ERPNext",
    integrationType: "ERPNext",
    operation: "update_item",
    status: "WARNING",
    actor: { email: "kasun@customer.example", fullName: "Kasun Perera" },
    correlationId: correlationIdFor(hoursAgo(48), "2A77D9"),
    referenceDoctype: "Item",
    referenceName: "FG-STEEL-BRACKET-ASSY",
    source: "INTEGRATION",
    safeMessage: "Item was updated, but its reorder level is set below its safety stock.",
  },
  {
    id: "demo-int-7",
    occurredAt: hoursAgo(690).toISOString(),
    completedAt: plusMs(hoursAgo(690), 30000),
    durationMs: 30000,
    integration: "Automation",
    integrationType: "Automation",
    operation: "Supplier Data Sync",
    status: "TIMEOUT",
    actor: null,
    systemGenerated: true,
    correlationId: correlationIdFor(hoursAgo(690), "3F60A9"),
    source: "INTEGRATION",
    safeMessage: "A scheduled Supplier data sync did not complete within its expected window.",
    errorClassification: "TimeoutError",
  },
  {
    id: "demo-int-8",
    occurredAt: hoursAgo(6).toISOString(),
    completedAt: plusMs(hoursAgo(6), 1800),
    durationMs: 1800,
    integration: "AI Service",
    integrationType: "AI Service",
    operation: "Generate Demand Forecast",
    status: "SUCCESS",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    source: "INTEGRATION",
    safeMessage: "Demand forecast generated successfully.",
  },
  {
    id: "demo-int-9",
    occurredAt: hoursAgo(30).toISOString(),
    completedAt: plusMs(hoursAgo(30), 2400),
    durationMs: 2400,
    integration: "AI Service",
    integrationType: "AI Service",
    operation: "Generate Demand Forecast",
    status: "FAILED",
    actor: { email: "niroshan@customer.example", fullName: "Niroshan" },
    source: "INTEGRATION",
    safeMessage: "Demand forecast could not be generated because insufficient historical sales data exists.",
    errorClassification: "ValidationError",
  },
  {
    id: "demo-int-10",
    occurredAt: hoursAgo(0.05).toISOString(),
    integration: "External API",
    integrationType: "External API",
    operation: "Currency Exchange Rate Refresh",
    status: "PENDING",
    actor: null,
    systemGenerated: true,
    source: "INTEGRATION",
    safeMessage: "Exchange rate refresh is in progress.",
  },
  {
    id: "demo-int-11",
    occurredAt: hoursAgo(5.5).toISOString(),
    completedAt: plusMs(hoursAgo(5.5), 210),
    durationMs: 210,
    integration: "ERPNext",
    integrationType: "ERPNext",
    operation: "Webhook Delivery",
    status: "FAILED",
    actor: null,
    source: "INTEGRATION",
    safeMessage: "Webhook delivery to a configured endpoint could not be confirmed.",
    errorClassification: "NetworkError",
  },
];

function matchesIntegrationFilters(event: IntegrationEvent, filters: ObservabilityFilters): boolean {
  if (filters.status && event.status !== filters.status) return false;
  if (filters.integration && event.integration !== filters.integration) return false;
  if (filters.integrationType && event.integrationType !== filters.integrationType) return false;
  if (filters.operation && event.operation !== filters.operation) return false;
  if (filters.actorEmail && event.actor?.email !== filters.actorEmail) return false;
  if (filters.doctype && event.referenceDoctype !== filters.doctype) return false;
  if (filters.docname && event.referenceName !== filters.docname) return false;
  if (filters.correlationId && event.correlationId !== filters.correlationId.toUpperCase()) return false;
  if (filters.dateFrom && new Date(event.occurredAt) < new Date(filters.dateFrom)) return false;
  if (filters.dateTo && new Date(event.occurredAt) > new Date(`${filters.dateTo}T23:59:59`)) return false;
  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    if (needle) {
      const haystack = [
        event.integration,
        event.integrationType,
        event.operation,
        event.safeMessage,
        event.correlationId,
        event.referenceDoctype,
        event.referenceName,
        event.actor?.email,
        event.actor?.fullName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
  }
  return true;
}

/** Integration Explorer's list query (O-9) — same filter/sort/page contract as
 * `getDemoErrors()`/`getDemoActivity()`/`getDemoAuditRecords()`. */
export async function getDemoIntegrationEvents(
  filters: ObservabilityFilters,
  page: number,
  pageSize: number,
): Promise<IntegrationListResult> {
  const filtered = INTEGRATION_FIXTURES.filter((e) => matchesIntegrationFilters(e, filters)).sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { items, pagination: { page, pageSize, total } };
}

/** Integration Monitoring's health-summary row (O-9, mission §6) — computed from the same
 * fixture set `getDemoIntegrationEvents()` filters, across the full set (no date-range
 * scoping; no screen needs one yet). `failed` counts TIMEOUT alongside FAILED, same
 * reasoning as `getDemoObservabilitySummary`'s `failedIntegrations` above — neither
 * represents a completed, successful operation. */
export async function getDemoIntegrationSummary(): Promise<IntegrationHealthSummary> {
  const totalOperations = INTEGRATION_FIXTURES.length;
  const successful = INTEGRATION_FIXTURES.filter((e) => e.status === "SUCCESS").length;
  const failed = INTEGRATION_FIXTURES.filter((e) => e.status === "FAILED" || e.status === "TIMEOUT").length;
  const withDuration = INTEGRATION_FIXTURES.filter((e): e is IntegrationEvent & { durationMs: number } => e.durationMs !== undefined);
  const averageDurationMs =
    withDuration.length > 0 ? withDuration.reduce((sum, e) => sum + e.durationMs, 0) / withDuration.length : 0;

  return { totalOperations, successful, failed, averageDurationMs };
}
