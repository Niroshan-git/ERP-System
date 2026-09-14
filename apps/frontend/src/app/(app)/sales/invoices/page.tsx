import Link from "next/link";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { ErpNextError, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { StatusPill } from "@/components/StatusPill";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { salesInvoiceStatus } from "@/lib/erpStatus";
import type { DocStatus } from "@/lib/docStatus";

type SalesInvoiceRow = {
  name: string;
  customer: string;
  posting_date: string;
  status: string;
  docstatus: DocStatus;
  grand_total: number;
  outstanding_amount: number;
};

// Sales Invoice's `status` DocType enum (checked against the live DocType JSON).
const STATUS_OPTIONS = [
  "Draft",
  "Return",
  "Credit Note Issued",
  "Submitted",
  "Paid",
  "Partly Paid",
  "Unpaid",
  "Unpaid and Discounted",
  "Partly Paid and Discounted",
  "Overdue and Discounted",
  "Overdue",
  "Cancelled",
  "Internal Transfer",
];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "grand_total desc", label: "Grand total (high-low)" },
  { value: "outstanding_amount desc", label: "Outstanding (high-low)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  customer?: string;
  date?: string;
  status?: string;
  sort?: string;
};

export default async function SalesInvoicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.customer) filters.push(["customer", "=", params.customer]);
  if (params.date) filters.push(["posting_date", "=", params.date]);
  if (params.status) filters.push(["status", "=", params.status]);

  let invoices: SalesInvoiceRow[];
  let companies: string[] | null;
  let customers: string[] | null;
  try {
    [invoices, companies, customers] = await Promise.all([
      listDocs<SalesInvoiceRow>("Sales Invoice", {
        fields: ["name", "customer", "posting_date", "status", "docstatus", "grand_total", "outstanding_amount"],
        filters: filters.length > 0 ? filters : undefined,
        limit: 200,
        orderBy: params.sort || SORT_OPTIONS[0].value,
      }),
      fetchLinkOptions("Company"),
      fetchLinkOptions("Customer"),
    ]);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">Sales Invoices</h1>
          <AccessDeniedNotice what="Sales Invoices" />
        </div>
      );
    }
    throw e;
  }

  const filterFields: FilterFieldConfig[] = [
    { type: "text", name: "id", label: "ID" },
    { type: "select", name: "company", label: "Company", options: companies ?? [] },
    { type: "select", name: "customer", label: "Customer", options: customers ?? [] },
    { type: "date", name: "date", label: "Date" },
    { type: "select", name: "status", label: "Status", options: STATUS_OPTIONS },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Sales Invoices</h1>
        <Link
          href="/sales/invoices/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ListFilterBar fields={filterFields} sortOptions={SORT_OPTIONS} values={params} />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              <th className="px-4 py-2.5 font-semibold">ID</th>
              <th className="px-4 py-2.5 font-semibold">Customer</th>
              <th className="px-4 py-2.5 font-semibold">Date</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Grand total</th>
              <th className="px-4 py-2.5 font-semibold">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const status = salesInvoiceStatus(inv);
              return (
                <tr key={inv.name} className="border-b border-border last:border-0 hover:bg-canvas/60">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/sales/invoices/${encodeURIComponent(inv.name)}`}
                      className="font-mono text-signal hover:underline"
                    >
                      {inv.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-graphite-900">{inv.customer}</td>
                  <td className="px-4 py-2.5 font-mono text-graphite-500">{inv.posting_date}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-graphite-900">
                    {inv.grand_total.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-graphite-500">
                    {inv.outstanding_amount.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-graphite-500">
                  No sales invoices match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
