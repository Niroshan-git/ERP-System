/**
 * Catalog for the Buying module's Reports hub (`/buying/reports`) — the Buying analog of
 * `lib/reports.ts`. Matches ERPNext's own Buying workspace "Reports & Masters" section
 * (read directly off the live server: `erpnext/buying/workspace/buying/buying.json`'s
 * "Key Reports" and "Other Reports" cards — Purchase Analytics, Purchase Order Analysis,
 * Item Wise Consumption, Items to Order and Receive, Purchase Order Trends, Procurement
 * Tracker, Items To Be Requested, Item-wise Purchase History, Purchase Receipt Trends,
 * Purchase Invoice Trends, Subcontracted Raw Materials To Be Transferred, Subcontracted
 * Item To Be Received, Supplier Quotation Comparison, Material Requests for which Supplier
 * Quotations are not created, Supplier Addresses And Contacts).
 *
 * Every report name/module below was confirmed against the live `Report` doctype and the
 * real workspace JSON (not guessed) — some, despite sitting under the Buying workspace's
 * card, actually live in the Stock or Accounts module in ERPNext itself (Item Wise
 * Consumption, Items To Be Requested, Purchase Receipt Trends, Purchase Invoice Trends,
 * Material Requests for which Supplier Quotations are not created are Stock/Accounts
 * reports surfaced on the Buying workspace) — included here anyway since that's genuinely
 * where ERPNext itself shows them to a buying user.
 *
 * The two Subcontracting reports are listed (so this catalog is a complete, honest mirror
 * of ERPNext's own workspace) but left without an `href` — they run against Subcontracting
 * Order, a doctype this frontend hasn't built, so faking a working link would be wrong.
 *
 * `href` is set only for reports actually implemented (run live via ERPNext's own
 * `frappe.desk.query_report.run`, see runReport in lib/erpnext.ts); the rest show as
 * "Coming soon" on the hub until built.
 */
import type { ReportCatalogEntry, SimpleReportConfig } from "@/lib/reports";

export const BUYING_REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    name: "Purchase Analytics",
    description: "Purchase value or quantity, pivoted by period, across suppliers, supplier groups, items or item groups.",
    href: "/buying/reports/purchase-analytics",
  },
  {
    name: "Purchase Order Analysis",
    description: "Received and billed status per Purchase Order line, with project breakdown.",
    href: "/buying/reports/purchase-order-analysis",
  },
  {
    name: "Item Wise Consumption",
    description: "Item quantities consumed from stock over a date range, optionally by supplier.",
    href: "/buying/reports/item-wise-consumption",
  },
  {
    name: "Items to Order and Receive",
    description: "Material Request items not yet fully ordered or received.",
    href: "/buying/reports/items-to-order-and-receive",
  },
  {
    name: "Purchase Order Trends",
    description: "Purchase Order qty/value trended by period, by item, item group, supplier or supplier group.",
    href: "/buying/reports/purchase-order-trends",
  },
  {
    name: "Procurement Tracker",
    description: "Purchase Order lines with cost center and project breakdown over a date range.",
    href: "/buying/reports/procurement-tracker",
  },
  {
    name: "Items To Be Requested",
    description: "Items below their re-order level that have no open Material Request yet.",
    href: "/buying/reports/items-to-be-requested",
  },
  {
    name: "Item-wise Purchase History",
    description: "Purchase Order line items with rate, amount, received and billed quantities.",
    href: "/buying/reports/item-wise-purchase-history",
  },
  {
    name: "Purchase Receipt Trends",
    description: "Purchase Receipt qty/value trended by period, by item, item group, supplier or supplier group.",
    href: "/buying/reports/purchase-receipt-trends",
  },
  {
    name: "Purchase Invoice Trends",
    description: "Purchase Invoice qty/value trended by period, by item, item group, supplier or supplier group.",
    href: "/buying/reports/purchase-invoice-trends",
  },
  {
    name: "Subcontracted Raw Materials To Be Transferred",
    description: "Raw materials pending transfer against open Subcontracting Orders. Requires Subcontracting Order, not built in this app yet.",
  },
  {
    name: "Subcontracted Item To Be Received",
    description: "Finished items pending receipt against open Subcontracting Orders. Requires Subcontracting Order, not built in this app yet.",
  },
  {
    name: "Supplier Quotation Comparison",
    description: "Side-by-side rate comparison across Supplier Quotations, by supplier or by item.",
    href: "/buying/reports/supplier-quotation-comparison",
  },
  {
    name: "Material Requests for which Supplier Quotations are not created",
    description: "Purchase-type Material Requests with no Supplier Quotation raised against them yet.",
    href: "/buying/reports/material-requests-without-supplier-quotations",
  },
  {
    name: "Supplier Addresses and Contacts",
    description: "Address and contact details per supplier.",
    href: "/buying/reports/supplier-addresses-and-contacts",
  },
];

const BUYING_PERIOD_OPTIONS = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];
// Trimmed from the live filter's real options (Item, Item Group, Supplier, Supplier
// Group, Project) to doctypes this frontend actually has — same trimming precedent as
// lib/reports.ts's TREND_BASED_ON_OPTIONS dropping Project on the Sales side.
const BUYING_TREND_BASED_ON_OPTIONS = ["Item", "Item Group", "Supplier", "Supplier Group"];

/**
 * Config for the generic `/buying/reports/[slug]` page — the Buying analog of
 * SIMPLE_REPORTS in lib/reports.ts, same rationale (one generic renderer instead of a
 * near-duplicate file per report). Purchase Analytics is excluded — like Sales Analytics,
 * its filter shape (tree_type driving a dependent "based on" relabel) is distinctive
 * enough to warrant its own page.
 *
 * Every `reportName` and filter fieldname below was read from the real report's own
 * `<name>.js` (Desk's filter definitions, several sharing `erpnext.purchase_trends_filters`)
 * on the live server — not guessed. MultiSelectList and Check filters (e.g. Purchase Order
 * Analysis's status/name multiselects and group_by_po checkbox, Supplier Quotation
 * Comparison's supplier/supplier_quotation multiselects and include_expired checkbox) are
 * dropped as optional refinements this app doesn't offer on a first pass — same precedent
 * lib/reports.ts's Sales Order Analysis and Sales Invoice Trends entries already set.
 * Query Reports with no `.js` file (Items To Be Requested, Material Requests for which
 * Supplier Quotations are not created) have no filter UI in Desk either, so `fields: []`
 * here matches Desk's own behavior exactly, not a simplification.
 */
export const BUYING_SIMPLE_REPORTS: SimpleReportConfig[] = [
  {
    slug: "purchase-order-analysis",
    reportName: "Purchase Order Analysis",
    title: "Purchase Order Analysis",
    description: "Received and billed status per Purchase Order line.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "date", name: "from_date", label: "From Date", default: "year-start" },
      { kind: "date", name: "to_date", label: "To Date", default: "today" },
      { kind: "link", name: "project", label: "Project", doctype: "Project", optional: true },
    ],
  },
  {
    slug: "item-wise-consumption",
    reportName: "Item Wise Consumption",
    title: "Item Wise Consumption",
    description: "Item quantities consumed from stock over a date range.",
    fields: [
      { kind: "link", name: "supplier", label: "Supplier", doctype: "Supplier", optional: true },
      { kind: "date", name: "from_date", label: "From Date", default: "year-start" },
      { kind: "date", name: "to_date", label: "To Date", default: "today" },
    ],
  },
  {
    slug: "items-to-order-and-receive",
    reportName: "Requested Items to Order and Receive",
    title: "Items to Order and Receive",
    description: "Material Request items not yet fully ordered or received.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "date", name: "from_date", label: "From Date", default: "year-start" },
      { kind: "date", name: "to_date", label: "To Date", default: "today" },
      { kind: "link", name: "material_request", label: "Material Request", doctype: "Material Request", optional: true },
      { kind: "link", name: "item_code", label: "Item", doctype: "Item", optional: true },
    ],
  },
  {
    slug: "purchase-order-trends",
    reportName: "Purchase Order Trends",
    title: "Purchase Order Trends",
    description: "Purchase Order qty/value trended over time.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "select", name: "period", label: "Period", options: BUYING_PERIOD_OPTIONS, default: "Monthly" },
      { kind: "select", name: "based_on", label: "Based On", options: BUYING_TREND_BASED_ON_OPTIONS, default: "Item" },
      { kind: "link", name: "fiscal_year", label: "Fiscal Year", doctype: "Fiscal Year" },
    ],
  },
  {
    slug: "procurement-tracker",
    reportName: "Procurement Tracker",
    title: "Procurement Tracker",
    description: "Purchase Order lines with cost center and project breakdown.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company", optional: true },
      { kind: "link", name: "cost_center", label: "Cost Center", doctype: "Cost Center", optional: true },
      { kind: "link", name: "project", label: "Project", doctype: "Project", optional: true },
      { kind: "date", name: "from_date", label: "From Date", default: "year-start" },
      { kind: "date", name: "to_date", label: "To Date", default: "today" },
    ],
  },
  {
    slug: "items-to-be-requested",
    reportName: "Items To Be Requested",
    title: "Items To Be Requested",
    description: "Items below their re-order level with no open Material Request yet.",
    fields: [],
  },
  {
    slug: "item-wise-purchase-history",
    reportName: "Item-wise Purchase History",
    title: "Item-wise Purchase History",
    description: "Purchase Order line items with rate, amount, received and billed quantities.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "date", name: "from_date", label: "From Date", default: "year-start" },
      { kind: "date", name: "to_date", label: "To Date", default: "today" },
      { kind: "link", name: "item_group", label: "Item Group", doctype: "Item Group", optional: true },
      { kind: "link", name: "item_code", label: "Item", doctype: "Item", optional: true },
      { kind: "link", name: "supplier", label: "Supplier", doctype: "Supplier", optional: true },
    ],
  },
  {
    slug: "purchase-receipt-trends",
    reportName: "Purchase Receipt Trends",
    title: "Purchase Receipt Trends",
    description: "Purchase Receipt qty/value trended over time.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "select", name: "period", label: "Period", options: BUYING_PERIOD_OPTIONS, default: "Monthly" },
      { kind: "select", name: "based_on", label: "Based On", options: BUYING_TREND_BASED_ON_OPTIONS, default: "Item" },
      { kind: "link", name: "fiscal_year", label: "Fiscal Year", doctype: "Fiscal Year" },
    ],
  },
  {
    slug: "purchase-invoice-trends",
    reportName: "Purchase Invoice Trends",
    title: "Purchase Invoice Trends",
    description: "Purchase Invoice qty/value trended over time.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "select", name: "period", label: "Period", options: BUYING_PERIOD_OPTIONS, default: "Monthly" },
      { kind: "select", name: "based_on", label: "Based On", options: BUYING_TREND_BASED_ON_OPTIONS, default: "Item" },
      { kind: "link", name: "fiscal_year", label: "Fiscal Year", doctype: "Fiscal Year" },
    ],
  },
  {
    slug: "supplier-quotation-comparison",
    reportName: "Supplier Quotation Comparison",
    title: "Supplier Quotation Comparison",
    description: "Side-by-side rate comparison across Supplier Quotations.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "date", name: "from_date", label: "From Date", default: "year-start" },
      { kind: "date", name: "to_date", label: "To Date", default: "today" },
      { kind: "link", name: "item_code", label: "Item", doctype: "Item", optional: true },
      { kind: "link", name: "request_for_quotation", label: "Request for Quotation", doctype: "Request for Quotation", optional: true },
      {
        kind: "select",
        name: "categorize_by",
        label: "Categorize By",
        options: ["Categorize by Supplier", "Categorize by Item"],
        default: "Categorize by Supplier",
      },
      { kind: "select", name: "status", label: "Status", options: ["Draft", "Submitted"], default: "Submitted" },
    ],
  },
  {
    slug: "material-requests-without-supplier-quotations",
    reportName: "Material Requests for which Supplier Quotations are not created",
    title: "Material Requests for which Supplier Quotations are not created",
    description: "Purchase-type Material Requests with no Supplier Quotation raised against them yet.",
    fields: [],
  },
  {
    slug: "supplier-addresses-and-contacts",
    reportName: "Address And Contacts",
    title: "Supplier Addresses and Contacts",
    description: "Address and contact details per supplier.",
    fields: [
      {
        kind: "select",
        name: "party_type",
        label: "Party Type",
        options: ["Customer", "Supplier", "Sales Partner", "Lead"],
        default: "Supplier",
      },
      { kind: "text", name: "party_name", label: "Party ID (optional)" },
    ],
  },
];
