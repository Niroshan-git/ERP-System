import { runReport } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { ReportFilterBar, type ReportFilterFieldConfig } from "@/components/ReportFilterBar";
import { ReportTable } from "@/components/ReportTable";

/**
 * Runs ERPNext's real "Item-wise Sales Register" report
 * (erpnext/accounts/report/item_wise_sales_register) via frappe.desk.query_report.run —
 * Sales Invoice line items with rate/amount and per-tax-account columns sourced from
 * "Item Wise Tax Detail", same as Desk. ERPNext's own version also supports a `group_by`
 * mode (Item / Item Group / Customer / Territory / Invoice, with subtotal rows) and
 * warehouse/brand filters — left out here to keep the first pass to the flat, most
 * commonly used view; the underlying report call already takes a `group_by` filter, so
 * it can be added later without touching the report logic itself.
 */

type SearchParams = {
  company?: string;
  customer?: string;
  item_group?: string;
  item_code?: string;
  from_date?: string;
  to_date?: string;
};

export default async function ItemWiseSalesRegisterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const [companies, customers, itemGroups, items] = await Promise.all([
    fetchLinkOptions("Company"),
    fetchLinkOptions("Customer"),
    fetchLinkOptions("Item Group"),
    fetchLinkOptions("Item"),
  ]);

  const today = new Date();
  const company = params.company || companies?.[0] || "";
  const from_date = params.from_date || `${today.getFullYear()}-01-01`;
  const to_date = params.to_date || today.toISOString().slice(0, 10);

  const filterFields: ReportFilterFieldConfig[] = [
    { type: "select", name: "company", label: "Company", options: companies ?? [], allowAny: false },
    { type: "select", name: "customer", label: "Customer", options: customers ?? [] },
    { type: "select", name: "item_group", label: "Item Group", options: itemGroups ?? [] },
    { type: "select", name: "item_code", label: "Item", options: items ?? [] },
    { type: "date", name: "from_date", label: "From Date" },
    { type: "date", name: "to_date", label: "To Date" },
  ];

  let columns: Awaited<ReturnType<typeof runReport>>["columns"] = [];
  let result: Awaited<ReturnType<typeof runReport>>["result"] = [];
  let error: string | null = null;

  if (company) {
    try {
      ({ columns, result } = await runReport("Item-wise Sales Register", {
        company,
        customer: params.customer || undefined,
        item_group: params.item_group || undefined,
        item_code: params.item_code || undefined,
        from_date,
        to_date,
      }));
    } catch {
      error = "Could not run this report — check the filters and try again.";
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-graphite-900">Item-wise Sales Register</h1>
        <p className="text-sm text-graphite-500">Sales Invoice line items with per-tax breakdown.</p>
      </div>

      <ReportFilterBar
        fields={filterFields}
        values={{
          company,
          customer: params.customer,
          item_group: params.item_group,
          item_code: params.item_code,
          from_date,
          to_date,
        }}
      />

      {error ? (
        <p className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">{error}</p>
      ) : !company ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-graphite-500">
          No company configured in ERPNext yet.
        </p>
      ) : (
        <ReportTable columns={columns} result={result} reportName="Item-wise Sales Register" />
      )}
    </div>
  );
}
