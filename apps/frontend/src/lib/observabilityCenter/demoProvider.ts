import "server-only";
import type {
  ErrorEvent,
  ErrorTrendPoint,
  ModuleErrorBreakdown,
  ObservabilitySummary,
  TrendRange,
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

type Fixture = Omit<ErrorEvent, "correlationId"> & { correlationIdSeed: string };

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
  },
];

function toErrorEvent(fixture: Fixture): ErrorEvent {
  const { correlationIdSeed, ...rest } = fixture;
  return { ...rest, correlationId: correlationIdFor(new Date(fixture.occurredAt), correlationIdSeed) };
}

const ALL_EVENTS: ErrorEvent[] = FIXTURES.map(toErrorEvent);

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
  const failedIntegrations = ALL_EVENTS.filter((e) => e.source === "INTEGRATION").length;
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
