import type { ReportCatalogEntry, SimpleReportConfig } from "@/lib/reports";

/** Native ERPNext finance reports. Calculations and any total rows come from ERPNext. */
export const FINANCE_REPORT_CATALOG: ReportCatalogEntry[] = [
  { name: "General Ledger", description: "Posted debit and credit entries by account.", href: "/accounting/reports/general-ledger" },
  { name: "Trial Balance", description: "Opening, movement and closing balances by account.", href: "/accounting/reports/trial-balance" },
  { name: "Profit and Loss Statement", description: "Income and expense for the selected period.", href: "/accounting/reports/profit-and-loss" },
  { name: "Balance Sheet", description: "Assets, liabilities and equity as of the selected period.", href: "/accounting/reports/balance-sheet" },
  { name: "Accounts Receivable", description: "Outstanding customer receivables and ageing.", href: "/accounting/reports/accounts-receivable" },
  { name: "Accounts Payable", description: "Outstanding supplier payables and ageing.", href: "/accounting/reports/accounts-payable" },
];

const DATE_RANGE = [
  { kind: "link", name: "company", label: "Company", doctype: "Company" },
  { kind: "date", name: "from_date", label: "From Date", default: "year-start" },
  { kind: "date", name: "to_date", label: "To Date", default: "today" },
] as const;

export const FINANCE_SIMPLE_REPORTS: SimpleReportConfig[] = [
  { slug: "general-ledger", reportName: "General Ledger", title: "General Ledger", description: "Native ERPNext posted ledger entries.", fields: [...DATE_RANGE, { kind: "link", name: "account", label: "Account", doctype: "Account", optional: true }, { kind: "link", name: "cost_center", label: "Cost Center", doctype: "Cost Center", optional: true }, { kind: "link", name: "project", label: "Project", doctype: "Project", optional: true }] },
  { slug: "trial-balance", reportName: "Trial Balance", title: "Trial Balance", description: "Native ERPNext account balances.", fields: [...DATE_RANGE] },
  { slug: "profit-and-loss", reportName: "Profit and Loss Statement", title: "Profit and Loss Statement", description: "Native ERPNext income and expense statement.", fields: [...DATE_RANGE] },
  { slug: "balance-sheet", reportName: "Balance Sheet", title: "Balance Sheet", description: "Native ERPNext balance sheet.", fields: [...DATE_RANGE] },
  { slug: "accounts-receivable", reportName: "Accounts Receivable", title: "Accounts Receivable", description: "Native ERPNext receivables ageing.", fields: [...DATE_RANGE, { kind: "link", name: "customer", label: "Customer", doctype: "Customer", optional: true }] },
  { slug: "accounts-payable", reportName: "Accounts Payable", title: "Accounts Payable", description: "Native ERPNext payables ageing.", fields: [...DATE_RANGE, { kind: "link", name: "supplier", label: "Supplier", doctype: "Supplier", optional: true }] },
];
