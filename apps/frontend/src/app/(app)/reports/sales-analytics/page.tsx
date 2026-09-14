import { runReport } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { ReportFilterBar, type ReportFilterFieldConfig } from "@/components/ReportFilterBar";
import { ReportTable } from "@/components/ReportTable";

/**
 * Runs ERPNext's real "Sales Analytics" script report (erpnext/selling/report/sales_analytics)
 * via frappe.desk.query_report.run. That report actually supports 6 source doctypes (adding
 * Delivery Note, Payment Entry, Purchase Order) and more tree types (Supplier, Supplier Group,
 * Order Type, Project) than offered here — trimmed to the doctypes/tree types this frontend
 * itself has: Quotation, Sales Order, Sales Invoice as sources; Customer, Item, Item Group,
 * Territory, Customer Group as pivot dimensions. Range trimmed to Weekly/Monthly/Quarterly/
 * Yearly — the report's own get_period() only branches on those four; a "Half-Yearly" filter
 * value silently falls through to fiscal-year grouping in ERPNext itself, so it isn't offered
 * as a distinct option here either.
 */

type SearchParams = {
  company?: string;
  from_date?: string;
  to_date?: string;
  tree_type?: string;
  doc_type?: string;
  value_quantity?: string;
  range?: string;
};

const TREE_TYPES = ["Customer", "Item", "Item Group", "Territory", "Customer Group"];
const DOC_TYPES = ["Sales Order", "Sales Invoice", "Quotation"];
const VALUE_QUANTITY = ["Value", "Quantity"];
const RANGES = ["Weekly", "Monthly", "Quarterly", "Yearly"];

export default async function SalesAnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const companies = (await fetchLinkOptions("Company")) ?? [];

  const today = new Date();
  const company = params.company || companies[0] || "";
  const from_date = params.from_date || `${today.getFullYear()}-01-01`;
  const to_date = params.to_date || today.toISOString().slice(0, 10);
  const tree_type = params.tree_type || "Customer";
  const doc_type = params.doc_type || "Sales Order";
  const value_quantity = params.value_quantity || "Value";
  const range = params.range || "Monthly";

  const filterFields: ReportFilterFieldConfig[] = [
    { type: "select", name: "company", label: "Company", options: companies, allowAny: false },
    { type: "date", name: "from_date", label: "From Date" },
    { type: "date", name: "to_date", label: "To Date" },
    { type: "select", name: "tree_type", label: "Group By", options: TREE_TYPES, allowAny: false },
    { type: "select", name: "doc_type", label: "Based On", options: DOC_TYPES, allowAny: false },
    { type: "select", name: "value_quantity", label: "Value / Quantity", options: VALUE_QUANTITY, allowAny: false },
    { type: "select", name: "range", label: "Range", options: RANGES, allowAny: false },
  ];

  let columns: Awaited<ReturnType<typeof runReport>>["columns"] = [];
  let result: Awaited<ReturnType<typeof runReport>>["result"] = [];
  let error: string | null = null;

  if (company) {
    try {
      ({ columns, result } = await runReport("Sales Analytics", {
        company,
        from_date,
        to_date,
        tree_type,
        doc_type,
        value_quantity,
        range,
      }));
    } catch {
      error = "Could not run this report — check the filters and try again.";
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-graphite-900">Sales Analytics</h1>
        <p className="text-sm text-graphite-500">
          {value_quantity} of {doc_type} by {tree_type.toLowerCase()}, {range.toLowerCase()}.
        </p>
      </div>

      <ReportFilterBar
        fields={filterFields}
        values={{ company, from_date, to_date, tree_type, doc_type, value_quantity, range }}
      />

      {error ? (
        <p className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">{error}</p>
      ) : !company ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-graphite-500">
          No company configured in ERPNext yet.
        </p>
      ) : (
        <ReportTable columns={columns} result={result} />
      )}
    </div>
  );
}
