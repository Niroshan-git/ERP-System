"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { salesInvoiceStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type SalesInvoiceRow = {
  name: string;
  customer: string;
  posting_date: string;
  status: string;
  docstatus: DocStatus;
  grand_total: number;
  outstanding_amount: number;
  due_date?: string;
  company?: string;
  territory?: string;
  owner?: string;
};

const columns: ColumnDef<SalesInvoiceRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (inv) => (
      <Link href={`/sales/invoices/${encodeURIComponent(inv.name)}`} className="font-mono text-signal hover:underline">
        {inv.name}
      </Link>
    ),
  },
  { key: "customer", label: "Customer", core: true, render: (inv) => <span className="text-graphite-900">{inv.customer}</span> },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (inv) => {
      const status = salesInvoiceStatus(inv);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (inv) => salesInvoiceStatus(inv).label,
  },
  {
    key: "posting_date",
    label: "Date",
    render: (inv) => <span className="font-mono text-graphite-500">{inv.posting_date}</span>,
  },
  {
    key: "grand_total",
    label: "Grand total",
    render: (inv) => <span className="font-mono tabular-nums text-graphite-900">{inv.grand_total.toFixed(2)}</span>,
  },
  {
    key: "outstanding_amount",
    label: "Outstanding",
    render: (inv) => <span className="font-mono tabular-nums text-graphite-500">{inv.outstanding_amount.toFixed(2)}</span>,
  },
  { key: "due_date", label: "Due date", defaultVisible: false, render: (inv) => <span className="font-mono text-graphite-500">{inv.due_date || "—"}</span> },
  { key: "company", label: "Company", defaultVisible: false, render: (inv) => inv.company || "—" },
  { key: "territory", label: "Territory", defaultVisible: false, render: (inv) => inv.territory || "—" },
  { key: "owner", label: "Owner", defaultVisible: false, render: (inv) => inv.owner || "—" },
];

export function SalesInvoicesTable({ invoices, startIndex }: { invoices: SalesInvoiceRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="invoices"
      columns={columns}
      rows={invoices}
      emptyLabel="No sales invoices match these filters."
      startIndex={startIndex}
    />
  );
}
