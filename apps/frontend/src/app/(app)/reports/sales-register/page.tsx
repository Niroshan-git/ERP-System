import { runReport } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { ReportFilterBar, type ReportFilterFieldConfig } from "@/components/ReportFilterBar";
import { ReportTable } from "@/components/ReportTable";

/**
 * Runs ERPNext's real "Sales Register" report (erpnext/accounts/report/sales_register)
 * via frappe.desk.query_report.run — every submitted Sales Invoice with its income
 * account(s) and tax account(s) broken into their own columns (dynamic: only accounts
 * that actually appear in the filtered invoices get a column, exactly like Desk).
 * ERPNext's own version also supports an `include_payments` mode (adds a running debtors
 * ledger, requires a single customer) and a `mode_of_payment` filter — left out here as
 * a distinct, POS-adjacent use case this frontend doesn't otherwise support yet.
 */

type SearchParams = {
  company?: string;
  customer?: string;
  customer_group?: string;
  from_date?: string;
  to_date?: string;
};

export default async function SalesRegisterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const [companies, customers, customerGroups] = await Promise.all([
    fetchLinkOptions("Company"),
    fetchLinkOptions("Customer"),
    fetchLinkOptions("Customer Group"),
  ]);

  const today = new Date();
  const company = params.company || companies?.[0] || "";
  const from_date = params.from_date || `${today.getFullYear()}-01-01`;
  const to_date = params.to_date || today.toISOString().slice(0, 10);

  const filterFields: ReportFilterFieldConfig[] = [
    { type: "select", name: "company", label: "Company", options: companies ?? [], allowAny: false },
    { type: "select", name: "customer", label: "Customer", options: customers ?? [] },
    { type: "select", name: "customer_group", label: "Customer Group", options: customerGroups ?? [] },
    { type: "date", name: "from_date", label: "From Date" },
    { type: "date", name: "to_date", label: "To Date" },
  ];

  let columns: Awaited<ReturnType<typeof runReport>>["columns"] = [];
  let result: Awaited<ReturnType<typeof runReport>>["result"] = [];
  let error: string | null = null;

  if (company) {
    try {
      ({ columns, result } = await runReport("Sales Register", {
        company,
        customer: params.customer || undefined,
        customer_group: params.customer_group || undefined,
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
        <h1 className="text-2xl font-medium text-graphite-900">Sales Register</h1>
        <p className="text-sm text-graphite-500">Submitted Sales Invoices with income, tax and receivable breakdown.</p>
      </div>

      <ReportFilterBar
        fields={filterFields}
        values={{ company, customer: params.customer, customer_group: params.customer_group, from_date, to_date }}
      />

      {error ? (
        <p className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">{error}</p>
      ) : !company ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-graphite-500">
          No company configured in ERPNext yet.
        </p>
      ) : (
        <ReportTable columns={columns} result={result} reportName="Sales Register" />
      )}
    </div>
  );
}
