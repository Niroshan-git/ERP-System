import { runReport } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { ReportFilterBar, type ReportFilterFieldConfig } from "@/components/ReportFilterBar";
import { ReportTable } from "@/components/ReportTable";

/**
 * Runs ERPNext's real "Purchase Analytics" script report (erpnext/buying/report/purchase_analytics)
 * via frappe.desk.query_report.run — the Buying analog of the Sales Analytics page. The
 * real report also supports a "tree_type" of "Order Type" and a dependent multi-select
 * "entity" filter (drill into specific suppliers/items) plus "curves" and "show aggregate
 * value from subsidiary companies" — dropped here as optional refinements, same precedent
 * as the Sales Analytics page dropping "Project"/"Order Type" tree types it doesn't need.
 * Range trimmed to Weekly/Monthly/Quarterly/Yearly to match the report's own get_period()
 * branches, same as Sales Analytics.
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

const TREE_TYPES = ["Supplier", "Supplier Group", "Item", "Item Group"];
const DOC_TYPES = ["Purchase Order", "Purchase Receipt", "Purchase Invoice"];
const VALUE_QUANTITY = ["Value", "Quantity"];
const RANGES = ["Weekly", "Monthly", "Quarterly", "Yearly"];

export default async function PurchaseAnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const companies = (await fetchLinkOptions("Company")) ?? [];

  const today = new Date();
  const company = params.company || companies[0] || "";
  const from_date = params.from_date || `${today.getFullYear()}-01-01`;
  const to_date = params.to_date || today.toISOString().slice(0, 10);
  const tree_type = params.tree_type || "Supplier";
  const doc_type = params.doc_type || "Purchase Invoice";
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
      ({ columns, result } = await runReport("Purchase Analytics", {
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
        <h1 className="text-2xl font-medium text-graphite-900">Purchase Analytics</h1>
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
        <ReportTable columns={columns} result={result} reportName="Purchase Analytics" />
      )}
    </div>
  );
}
