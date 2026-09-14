import Link from "next/link";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { ErpNextError, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { StatusPill } from "@/components/StatusPill";
import { ListFilterBar, type FilterFieldConfig } from "@/components/ListFilterBar";
import { deliveryNoteStatus } from "@/lib/erpStatus";
import type { DocStatus } from "@/lib/docStatus";

type DeliveryNoteRow = {
  name: string;
  customer: string;
  posting_date: string;
  status: string;
  docstatus: DocStatus;
  per_billed: number;
  is_return?: 0 | 1;
  grand_total: number;
};

// Delivery Note's `status` DocType enum (checked against the live DocType JSON).
const STATUS_OPTIONS = ["Draft", "To Bill", "Partially Billed", "Completed", "Return", "Return Issued", "Cancelled", "Closed"];

const SORT_OPTIONS = [
  { value: "modified desc", label: "Last updated" },
  { value: "creation desc", label: "Created (newest)" },
  { value: "creation asc", label: "Created (oldest)" },
  { value: "grand_total desc", label: "Grand total (high-low)" },
  { value: "posting_date desc", label: "Posting date (newest)" },
];

type SearchParams = {
  id?: string;
  company?: string;
  customer?: string;
  date?: string;
  status?: string;
  sort?: string;
};

export default async function DeliveryNotesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const filters: unknown[] = [];
  if (params.id) filters.push(["name", "like", `%${params.id}%`]);
  if (params.company) filters.push(["company", "=", params.company]);
  if (params.customer) filters.push(["customer", "=", params.customer]);
  if (params.date) filters.push(["posting_date", "=", params.date]);
  if (params.status) filters.push(["status", "=", params.status]);

  let deliveryNotes: DeliveryNoteRow[];
  let companies: string[] | null;
  let customers: string[] | null;
  try {
    [deliveryNotes, companies, customers] = await Promise.all([
      listDocs<DeliveryNoteRow>("Delivery Note", {
        fields: ["name", "customer", "posting_date", "status", "docstatus", "per_billed", "is_return", "grand_total"],
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
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">Delivery Notes</h1>
          <AccessDeniedNotice what="Delivery Notes" />
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
        <h1 className="text-2xl font-medium text-graphite-900">Delivery Notes</h1>
        <Link
          href="/sales/delivery-notes/new"
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
            {deliveryNotes.map((dn) => {
              const status = deliveryNoteStatus(dn);
              return (
                <tr key={dn.name} className="border-b border-border last:border-0 hover:bg-canvas/60">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/sales/delivery-notes/${encodeURIComponent(dn.name)}`}
                      className="font-mono text-signal hover:underline"
                    >
                      {dn.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-graphite-900">{dn.customer}</td>
                  <td className="px-4 py-2.5 font-mono text-graphite-500">{dn.posting_date}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill label={status.label} tone={status.tone} />
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-graphite-900">{dn.grand_total.toFixed(2)}</td>
                </tr>
              );
            })}
            {deliveryNotes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-graphite-500">
                  No delivery notes match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
