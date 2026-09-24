/**
 * `Account.account_type` — fixed ERPNext 16.34.2 Select enum, live-verified via
 * `frappe.get_meta("Account")` on the live Hetzner tenant, 2026-09-24 (`FIN-1E`). Hardcoded
 * here rather than fetched, same precedent every other fixed-enum Select field in this app
 * already follows (e.g. Sales/Purchase document `status`/`voucher_type` constant lists) —
 * this is ERPNext's own DocType schema, not tenant data, so it doesn't need a live fetch on
 * every page load. If a future ERPNext upgrade changes this list, update it here.
 */
export const ACCOUNT_TYPE_OPTIONS = [
  "Accumulated Depreciation",
  "Asset Received But Not Billed",
  "Bank",
  "Cash",
  "Chargeable",
  "Capital Work in Progress",
  "Cost of Goods Sold",
  "Current Asset",
  "Current Liability",
  "Depreciation",
  "Direct Expense",
  "Direct Income",
  "Equity",
  "Expense Account",
  "Expenses Included In Asset Valuation",
  "Expenses Included In Valuation",
  "Fixed Asset",
  "Income Account",
  "Indirect Expense",
  "Indirect Income",
  "Liability",
  "Payable",
  "Receivable",
  "Round Off",
  "Round Off for Opening",
  "Stock",
  "Stock Adjustment",
  "Stock Received But Not Billed",
  "Service Received But Not Billed",
  "Tax",
  "Temporary",
] as const;

/** `Account.balance_must_be` — fixed Select enum, live-verified same session. */
export const BALANCE_MUST_BE_OPTIONS = ["Debit", "Credit"] as const;
