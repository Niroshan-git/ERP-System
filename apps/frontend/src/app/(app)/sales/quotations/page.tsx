import Link from "next/link";
import { listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { StatusPill } from "@/components/StatusPill";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { quotationStatus } from "@/lib/erpStatus";
import type { DocStatus } from "@/lib/docStatus";

type QuotationRow = {
  name: string;
  party_name: string;
  transaction_date: string;
  status: string;
  docstatus: DocStatus;
  grand_total: number;
};

// Quotation's `status` DocType enum (checked against the live DocType JSON) — "Draft" and
// "Cancelled" come from docstatus instead (see lib/erpStatus.ts's quotationStatus), so
// they're left out of this filter's options the same way ERPNext's own Quotation list
// filter would only ever show the submitted-state values here.
const STATUS_OPTIONS = ["Open", "Replied", "Partially Ordered", "Ordered", "Lost", "Expired"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "grand_total desc", label: "Grand total (high-low)" },
  { value: "valid_till asc", label: "Valid till (soonest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  customer?: string;
  date?: string;
  status?: string;
  sort?: string;
};

export default async function QuotationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.customer) filters.push(["party_name", "=", params.customer]);
  if (params.date) filters.push(["transaction_date", "=", params.date]);
  if (params.status) filters.push(["status", "=", params.status]);

  const [quotations, companies, customers] = await Promise.all([
    listDocs<QuotationRow>("Quotation", {
      fields: ["name", "party_name", "transaction_date", "status", "docstatus", "grand_total"],
      filters: filters.length > 0 ? filters : undefined,
      limit: 200,
      orderBy: params.sort || SORT_OPTIONS[0].value,
    }),
    fetchLinkOptions("Company"),
    fetchLinkOptions("Customer"),
  ]);

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
        <h1 className="text-2xl font-medium text-graphite-900">Quotations</h1>
        <Link
          href="/sales/quotations/new"
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
            </tr>
          </thead>
          <tbody>
            {quotations.map((q) => {
              const status = quotationStatus(q);
              return (
                <tr key={q.name} className="border-b border-border last:border-0 hover:bg-canvas/60">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/sales/quotations/${encodeURIComponent(q.name)}`}
                      className="font-mono text-signal hover:underline"
                    >
                      {q.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-graphite-900">{q.party_name}</td>
                  <td className="px-4 py-2.5 font-mono text-graphite-500">{q.transaction_date}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-graphite-900">{q.grand_total.toFixed(2)}</td>
                </tr>
              );
            })}
            {quotations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-graphite-500">
                  No quotations match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
