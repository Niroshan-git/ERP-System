import "server-only";
import { listDocs } from "@/lib/erpnext";

/**
 * Real ERPNext Number Card definitions behind the Selling workspace's 3 cards
 * (`erpnext/selling/number_card/{sales_orders_count,total_sales_amount,
 * average_sales_order_value}`, read on the live server, not guessed):
 * - "Sales Orders Count": Count of Sales Order where transaction_date is in the current
 *   quarter and docstatus=1. No company filter.
 * - "Total Sales Amount": Sum(base_rounded_total) over the same filter set.
 * - "Average Sales Order Value": genuinely queries **Purchase Order**, not Sales Order —
 *   confirmed in the live JSON (`"document_type": "Purchase Order"`), which is why the
 *   real card in the screenshot shows "Rs 0.00" even with real sales data: it's an
 *   ERPNext bug (almost certainly copy-pasted from a Buying-side card and never fixed),
 *   not a placeholder. This app has no Purchase Order feature at all, so rather than add
 *   one just to reproduce a bug, the value is hardcoded to 0 here — same real-world
 *   result, without the pointless extra scope.
 */
function getThisQuarterRange(): [string, string] {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const start = new Date(now.getFullYear(), quarterStartMonth, 1);
  const end = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

export async function getSellingNumberCards(): Promise<{
  salesOrdersCount: number;
  totalSalesAmount: number;
  averageOrderValue: number;
}> {
  const [from, to] = getThisQuarterRange();
  const orders = await listDocs<{ base_rounded_total: number }>("Sales Order", {
    fields: ["base_rounded_total"],
    filters: [
      ["transaction_date", "between", [from, to]],
      ["docstatus", "=", 1],
    ],
    limit: 5000,
  });

  return {
    salesOrdersCount: orders.length,
    totalSalesAmount: orders.reduce((sum, o) => sum + (o.base_rounded_total || 0), 0),
    averageOrderValue: 0,
  };
}
