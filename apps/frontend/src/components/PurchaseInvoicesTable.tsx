"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { purchaseInvoiceStatus } from "@/lib/erpStatus";
import { formatAmount } from "@/lib/format";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type PurchaseInvoiceRow = {
  name: string;
  supplier: string;
  supplier_name?: string;
  status: string;
  docstatus: DocStatus;
  posting_date: string;
  due_date?: string;
  grand_total: number;
  outstanding_amount: number;
  on_hold?: 0 | 1;
  release_date?: string;
  company?: string;
  currency?: string;
};

const columns: ColumnDef<PurchaseInvoiceRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (pi) => (
      <Link href={`/buying/purchase-invoices/${encodeURIComponent(pi.name)}`} className="font-mono text-signal hover:underline">
        {pi.name}
      </Link>
    ),
  },
  {
    key: "supplier",
    label: "Supplier",
    core: true,
    render: (pi) => <span className="text-graphite-900">{pi.supplier_name || pi.supplier}</span>,
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (pi) => {
      const status = purchaseInvoiceStatus(pi);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (pi) => purchaseInvoiceStatus(pi).label,
  },
  {
    key: "posting_date",
    label: "Posting date",
    render: (pi) => <span className="font-mono text-graphite-500">{pi.posting_date}</span>,
  },
  {
    key: "grand_total",
    label: "Grand total",
    align: "right",
    render: (pi) => (
      <span className="font-mono tabular-nums text-graphite-900">
        {formatAmount(pi.grand_total)} {pi.currency}
      </span>
    ),
    exportValue: (pi) => formatAmount(pi.grand_total),
  },
  {
    key: "outstanding_amount",
    label: "Outstanding",
    align: "right",
    render: (pi) => (
      <span className="font-mono tabular-nums text-graphite-500">
        {formatAmount(pi.outstanding_amount)} {pi.currency}
      </span>
    ),
    exportValue: (pi) => formatAmount(pi.outstanding_amount),
  },
  { key: "company", label: "Company", defaultVisible: false, render: (pi) => pi.company || "—" },
];

export function PurchaseInvoicesTable({ invoices, startIndex }: { invoices: PurchaseInvoiceRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="purchase-invoices"
      columns={columns}
      rows={invoices}
      emptyLabel="No purchase invoices match these filters."
      startIndex={startIndex}
    />
  );
}
