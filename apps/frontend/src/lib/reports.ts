/**
 * Catalog for the Reports hub (`/reports`), matching ERPNext's own Selling workspace
 * "Reports" sidebar (screenshot: Sales Register, Item-wise Sales Register, Sales
 * Analytics, Customer Addresses..., Inactive Customers, Sales Invoice Trends, Customer
 * Credit Balance, Customers Without Any..., Sales Partners Commission, Available Stock
 * for Packing, Territory/Sales Person/Sales Partner Target Variance, Pending SO Items
 * For Purchase, Sales Funnel, Sales Order Analysis, Customer Acquisition and Loyalty,
 * Quotation Trends). Confirmed against the live server by querying the real `Report`
 * doctype records (not guessed): all of these except "Sales Funnel" are real
 * Query/Script Reports — Sales Invoice Trends included, despite looking chart-like in
 * the sidebar, it's a genuine Script Report under Accounts. "Sales Funnel" is actually a
 * custom Desk Page with its own visualization (erpnext/selling/page/sales_funnel), not a
 * Report doctype record at all, so it can't be run the same way — left out here rather
 * than faked.
 *
 * `href` is set only for reports actually implemented (run live via ERPNext's own
 * `frappe.desk.query_report.run`, see runReport in lib/erpnext.ts); the rest show as
 * "Coming soon" on the hub until built.
 */
export type ReportCatalogEntry = {
  name: string;
  description: string;
  href?: string;
};

export const REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    name: "Sales Analytics",
    description: "Sales value or quantity, pivoted by period, across customers, items, item groups or territories.",
    href: "/reports/sales-analytics",
  },
  {
    name: "Sales Register",
    description: "Every submitted Sales Invoice with income accounts, taxes, and totals broken out.",
    href: "/reports/sales-register",
  },
  {
    name: "Item-wise Sales Register",
    description: "Sales Invoice line items with rate, amount and per-tax breakdown.",
    href: "/reports/item-wise-sales-register",
  },
  {
    name: "Customer Addresses and Contacts",
    description: "Address and contact details per customer, supplier, sales partner or lead.",
    href: "/reports/customer-addresses-and-contacts",
  },
  {
    name: "Inactive Customers",
    description: "Customers with no order/invoice in the last N days.",
    href: "/reports/inactive-customers",
  },
  {
    name: "Sales Invoice Trends",
    description: "Sales Invoice qty/value trended by period, by item, item group, customer, customer group or territory.",
    href: "/reports/sales-invoice-trends",
  },
  {
    name: "Customer Credit Balance",
    description: "Outstanding receivable balance per customer against their credit limit.",
    href: "/reports/customer-credit-balance",
  },
  {
    name: "Customers Without Any Sales Transactions",
    description: "Customers that have never had a submitted order or invoice.",
    href: "/reports/customers-without-any-sales-transactions",
  },
  {
    name: "Sales Partners Commission",
    description: "Commission earned per sales partner across Sales Invoices.",
    href: "/reports/sales-partners-commission",
  },
  {
    name: "Available Stock for Packing Items",
    description: "Per-warehouse stock available for items used inside a Product Bundle.",
    href: "/reports/available-stock-for-packing-items",
  },
  {
    name: "Territory Target Variance (Item Group)",
    description: "Actual vs. target sales by territory and item group.",
    href: "/reports/territory-target-variance",
  },
  {
    name: "Sales Person Target Variance (Item Group)",
    description: "Actual vs. target sales by sales person and item group.",
    href: "/reports/sales-person-target-variance",
  },
  {
    name: "Sales Partner Target Variance (Item Group)",
    description: "Actual vs. target sales by sales partner and item group.",
    href: "/reports/sales-partner-target-variance",
  },
  {
    name: "Pending SO Items For Purchase Request",
    description: "Sales Order items not yet covered by a Material Request.",
    href: "/reports/pending-so-items-for-purchase-request",
  },
  {
    name: "Sales Funnel",
    description: "Quotation-to-order conversion funnel. Not a runnable report in ERPNext — a custom Desk page, so it isn't offered here.",
  },
  {
    name: "Sales Order Analysis",
    description: "Delivery and billing status per Sales Order line, with delay days.",
    href: "/reports/sales-order-analysis",
  },
  {
    name: "Customer Acquisition and Loyalty",
    description: "New vs. repeat customers over time.",
    href: "/reports/customer-acquisition-and-loyalty",
  },
  {
    name: "Quotation Trends",
    description: "Quotation qty/value trended by period, by item, item group, customer, customer group or territory.",
    href: "/reports/quotation-trends",
  },
];

/**
 * Config for the generic `/reports/[slug]` page — covers every report above except the
 * first 3 (Sales Analytics/Sales Register/Item-wise Sales Register have custom pages:
 * their filter shapes and default-resolution are distinctive enough — e.g. Sales
 * Analytics' 4-way pivot control — that a generic renderer would fight them). These 14
 * are simpler: a handful of Link/Select/Date/Number filters, so one page shape covers
 * all of them, driven by this table instead of 14 near-duplicate files.
 *
 * Every `reportName` and filter fieldname below was read from the real report's own
 * `<name>.js` (Desk's filter definitions) and `<name>.py` (`filters.get(...)` calls) on
 * the live server, then live-tested via `frappe.desk.query_report.run` — not guessed.
 * A few of ERPNext's own filters are deliberately dropped where they're optional
 * refinements this app doesn't need to offer on a first pass (e.g. Sales Order
 * Analysis's status/warehouse/sales_order multi-selects, Sales Invoice Trends' `group_by`)
 * — omitting an optional filter just means "no restriction on that field", same as Desk's
 * own default. `doctype`/`based_on` options are trimmed to doctypes this frontend actually
 * has (no Delivery Note, POS Invoice, Purchase Order, Supplier, Project).
 */
export type SimpleReportField =
  | { kind: "date"; name: string; label: string; default: "today" | "year-start" }
  | { kind: "select"; name: string; label: string; options: string[]; default: string }
  | { kind: "number"; name: string; label: string; default: number }
  | { kind: "text"; name: string; label: string }
  | { kind: "link"; name: string; label: string; doctype: string; optional?: boolean };

export type SimpleReportConfig = {
  slug: string;
  reportName: string;
  title: string;
  description: string;
  fields: SimpleReportField[];
};

const PERIOD_OPTIONS = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];
const TREND_BASED_ON_OPTIONS = ["Item", "Item Group", "Customer", "Customer Group", "Territory"];

export const SIMPLE_REPORTS: SimpleReportConfig[] = [
  {
    slug: "customer-addresses-and-contacts",
    reportName: "Address And Contacts",
    title: "Customer Addresses and Contacts",
    description: "Address and contact details per party.",
    fields: [
      {
        kind: "select",
        name: "party_type",
        label: "Party Type",
        options: ["Customer", "Supplier", "Sales Partner", "Lead"],
        default: "Customer",
      },
      { kind: "text", name: "party_name", label: "Party ID (optional)" },
    ],
  },
  {
    slug: "inactive-customers",
    reportName: "Inactive Customers",
    title: "Inactive Customers",
    description: "Customers with no order/invoice in the last N days.",
    fields: [
      { kind: "number", name: "days_since_last_order", label: "Days Since Last Order", default: 60 },
      { kind: "select", name: "doctype", label: "Based On", options: ["Sales Order", "Sales Invoice"], default: "Sales Order" },
    ],
  },
  {
    slug: "sales-invoice-trends",
    reportName: "Sales Invoice Trends",
    title: "Sales Invoice Trends",
    description: "Sales Invoice qty/value trended over time.",
    fields: [
      { kind: "select", name: "period", label: "Period", options: PERIOD_OPTIONS, default: "Monthly" },
      { kind: "select", name: "based_on", label: "Based On", options: TREND_BASED_ON_OPTIONS, default: "Item" },
      { kind: "link", name: "fiscal_year", label: "Fiscal Year", doctype: "Fiscal Year" },
      { kind: "link", name: "company", label: "Company", doctype: "Company", optional: true },
    ],
  },
  {
    slug: "customer-credit-balance",
    reportName: "Customer Credit Balance",
    title: "Customer Credit Balance",
    description: "Outstanding receivable balance per customer against their credit limit.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "link", name: "customer", label: "Customer", doctype: "Customer", optional: true },
    ],
  },
  {
    slug: "customers-without-any-sales-transactions",
    reportName: "Customers Without Any Sales Transactions",
    title: "Customers Without Any Sales Transactions",
    description: "Customers that have never had a submitted order or invoice.",
    fields: [],
  },
  {
    slug: "sales-partners-commission",
    reportName: "Sales Partners Commission",
    title: "Sales Partners Commission",
    description: "Commission earned per sales partner across Sales Invoices.",
    fields: [],
  },
  {
    slug: "available-stock-for-packing-items",
    reportName: "Available Stock for Packing Items",
    title: "Available Stock for Packing Items",
    description: "Per-warehouse stock available for items used inside a Product Bundle.",
    fields: [],
  },
  {
    slug: "territory-target-variance",
    reportName: "Territory Target Variance Based On Item Group",
    title: "Territory Target Variance (Item Group)",
    description: "Actual vs. target sales by territory and item group.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "link", name: "fiscal_year", label: "Fiscal Year", doctype: "Fiscal Year" },
      { kind: "select", name: "doctype", label: "Based On", options: ["Sales Order", "Sales Invoice"], default: "Sales Order" },
      { kind: "select", name: "period", label: "Period", options: PERIOD_OPTIONS, default: "Monthly" },
      { kind: "select", name: "target_on", label: "Target On", options: ["Quantity", "Amount"], default: "Quantity" },
    ],
  },
  {
    slug: "sales-person-target-variance",
    reportName: "Sales Person Target Variance Based On Item Group",
    title: "Sales Person Target Variance (Item Group)",
    description: "Actual vs. target sales by sales person and item group.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "link", name: "fiscal_year", label: "Fiscal Year", doctype: "Fiscal Year" },
      { kind: "select", name: "doctype", label: "Based On", options: ["Sales Order", "Sales Invoice"], default: "Sales Order" },
      { kind: "select", name: "period", label: "Period", options: PERIOD_OPTIONS, default: "Monthly" },
      { kind: "select", name: "target_on", label: "Target On", options: ["Quantity", "Amount"], default: "Quantity" },
    ],
  },
  {
    slug: "sales-partner-target-variance",
    reportName: "Sales Partner Target Variance based on Item Group",
    title: "Sales Partner Target Variance (Item Group)",
    description: "Actual vs. target sales by sales partner and item group.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "link", name: "fiscal_year", label: "Fiscal Year", doctype: "Fiscal Year" },
      { kind: "select", name: "doctype", label: "Based On", options: ["Sales Order", "Sales Invoice"], default: "Sales Order" },
      { kind: "select", name: "period", label: "Period", options: PERIOD_OPTIONS, default: "Monthly" },
      { kind: "select", name: "target_on", label: "Target On", options: ["Quantity", "Amount"], default: "Quantity" },
    ],
  },
  {
    slug: "pending-so-items-for-purchase-request",
    reportName: "Pending SO Items For Purchase Request",
    title: "Pending SO Items For Purchase Request",
    description: "Sales Order items not yet covered by a Material Request.",
    fields: [],
  },
  {
    slug: "sales-order-analysis",
    reportName: "Sales Order Analysis",
    title: "Sales Order Analysis",
    description: "Delivery and billing status per Sales Order line, with delay days.",
    fields: [
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "date", name: "from_date", label: "From Date", default: "year-start" },
      { kind: "date", name: "to_date", label: "To Date", default: "today" },
    ],
  },
  {
    slug: "customer-acquisition-and-loyalty",
    reportName: "Customer Acquisition and Loyalty",
    title: "Customer Acquisition and Loyalty",
    description: "New vs. repeat customers over time.",
    fields: [
      { kind: "select", name: "view_type", label: "View Type", options: ["Monthly", "Territory Wise"], default: "Monthly" },
      { kind: "link", name: "company", label: "Company", doctype: "Company" },
      { kind: "date", name: "from_date", label: "From Date", default: "year-start" },
      { kind: "date", name: "to_date", label: "To Date", default: "today" },
    ],
  },
  {
    slug: "quotation-trends",
    reportName: "Quotation Trends",
    title: "Quotation Trends",
    description: "Quotation qty/value trended over time.",
    fields: [
      { kind: "select", name: "period", label: "Period", options: PERIOD_OPTIONS, default: "Monthly" },
      { kind: "select", name: "based_on", label: "Based On", options: TREND_BASED_ON_OPTIONS, default: "Item" },
      { kind: "link", name: "fiscal_year", label: "Fiscal Year", doctype: "Fiscal Year" },
      { kind: "link", name: "company", label: "Company", doctype: "Company", optional: true },
    ],
  },
];
