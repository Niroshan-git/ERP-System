/**
 * Catalog for the Stock module's Reports hub (`/stock/reports`) — the Stock analog of
 * `lib/buyingReports.ts`. Report names below were confirmed against the live `Report`
 * doctype (module="Stock") on the real server, not guessed — one real correction along the
 * way: the plan's working name "Warehouse-wise Item Balance Age and Value" doesn't exist on
 * the live server; the real record is "Warehouse wise Item Balance Age and Value" (no
 * hyphen, lowercase "wise") — used as-written here.
 *
 * **Stock Balance is a special case, resolved live, not guessed**: unlike every other report
 * here, its `Report` doctype record has `prepared_report=1` on the live server — confirmed
 * by fetching `/api/resource/Report/Stock Balance` directly. That flag means
 * `frappe.desk.query_report.run` (this app's `runReport()`, see lib/erpnext.ts) never
 * executes it synchronously at all — it just returns `{prepared_report: true, doc: null}`,
 * the same shell Desk's own report view uses to know it must enqueue a background job and
 * poll for it. This app's generic report runner has no such polling machinery, so Stock
 * Balance's `href` below points at `/stock/stock-balance` (the Bin-backed live snapshot
 * page, see stock-balance/page.tsx) instead of the generic `/stock/reports/[slug]` runner —
 * it's a different data source (live Bin rows vs. a historical/date-ranged Stock Ledger
 * Entry pivot) but serves the same "what's on hand" need without needing a prepared-report
 * job queue this app doesn't have.
 *
 * Every other report below is a normal synchronous Script/Query/Report-Builder report
 * (confirmed `prepared_report=0` live) but is left without an `href` for v1 per the plan's
 * own scope — only Stock Balance needs to work end-to-end this pass; the rest show as
 * "Coming soon" until a later pass builds their filter configs.
 */
import type { ReportCatalogEntry, SimpleReportConfig } from "@/lib/reports";

export const STOCK_REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    name: "Stock Balance",
    description: "Live per-item, per-warehouse stock levels (actual/reserved/projected qty, valuation).",
    href: "/stock/stock-balance",
  },
  {
    name: "Stock Ledger",
    description: "Every stock ledger entry (in/out, qty, valuation) across items and warehouses.",
  },
  {
    name: "Stock Ageing",
    description: "Average age of stock on hand per item/warehouse.",
  },
  {
    name: "Batch-Wise Balance History",
    description: "Batch quantity balance trended over time.",
  },
  {
    name: "Serial No Status",
    description: "Every Serial No with its current status and warehouse.",
  },
  {
    name: "Warehouse wise Item Balance Age and Value",
    description: "Stock age and value per item, broken out by warehouse.",
  },
  {
    name: "Stock Analytics",
    description: "Stock qty/value pivoted by period, across items or item groups.",
  },
  {
    name: "Item Shortage Report",
    description: "Items below their re-order level per warehouse.",
  },
  {
    name: "Stock and Account Value Comparison",
    description: "Reconciles Stock Ledger value against the Stock In Hand GL balance.",
  },
];

/**
 * No entries yet — every report above that could use the generic `/stock/reports/[slug]`
 * runner is intentionally left "Coming soon" in v1 (see the catalog's own doc comment), and
 * Stock Balance (the one report that IS wired up) can't use this generic runner at all since
 * it's a background Prepared Report, not a synchronous one. Kept as a real, typed empty
 * array — not deleted — so the `/stock/reports/[slug]` page has a real config source to read
 * from the moment a future pass adds an entry, the same shape buyingReports.ts established.
 */
export const STOCK_SIMPLE_REPORTS: SimpleReportConfig[] = [];
