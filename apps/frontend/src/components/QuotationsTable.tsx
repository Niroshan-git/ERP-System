"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { quotationStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type QuotationRow = {
  name: string;
  party_name: string;
  transaction_date: string;
  status: string;
  docstatus: DocStatus;
  grand_total: number;
  valid_till?: string;
  order_type?: string;
  company?: string;
  currency?: string;
  territory?: string;
  customer_group?: string;
  owner?: string;
  modified?: string;
};

const columns: ColumnDef<QuotationRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (q) => (
      <Link href={`/sales/quotations/${encodeURIComponent(q.name)}`} className="font-mono text-signal hover:underline">
        {q.name}
      </Link>
    ),
  },
  { key: "party_name", label: "Customer", core: true, render: (q) => <span className="text-graphite-900">{q.party_name}</span> },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (q) => {
      const status = quotationStatus(q);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (q) => quotationStatus(q).label,
  },
  {
    key: "transaction_date",
    label: "Date",
    render: (q) => <span className="font-mono text-graphite-500">{q.transaction_date}</span>,
  },
  {
    key: "grand_total",
    label: "Grand total",
    render: (q) => <span className="font-mono tabular-nums text-graphite-900">{q.grand_total.toFixed(2)}</span>,
  },
  { key: "valid_till", label: "Valid till", defaultVisible: false, render: (q) => <span className="font-mono text-graphite-500">{q.valid_till || "—"}</span> },
  { key: "order_type", label: "Order type", defaultVisible: false, render: (q) => q.order_type || "—" },
  { key: "company", label: "Company", defaultVisible: false, render: (q) => q.company || "—" },
  { key: "currency", label: "Currency", defaultVisible: false, render: (q) => q.currency || "—" },
  { key: "territory", label: "Territory", defaultVisible: false, render: (q) => q.territory || "—" },
  { key: "customer_group", label: "Customer group", defaultVisible: false, render: (q) => q.customer_group || "—" },
  { key: "owner", label: "Owner", defaultVisible: false, render: (q) => q.owner || "—" },
  { key: "modified", label: "Last updated", defaultVisible: false, render: (q) => <span className="font-mono text-graphite-500">{q.modified || "—"}</span> },
];

export function QuotationsTable({ quotations, startIndex }: { quotations: QuotationRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="quotations"
      columns={columns}
      rows={quotations}
      emptyLabel="No quotations match these filters."
      startIndex={startIndex}
    />
  );
}
