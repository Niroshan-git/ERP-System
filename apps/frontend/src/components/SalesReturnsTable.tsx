"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { deliveryNoteStatus } from "@/lib/erpStatus";
import { formatAmount } from "@/lib/format";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type SalesReturnRow = {
  name: string;
  customer: string;
  posting_date: string;
  status: string;
  docstatus: DocStatus;
  per_billed: number;
  is_return?: 0 | 1;
  return_against?: string;
  grand_total: number;
  company?: string;
  territory?: string;
  owner?: string;
};

const columns: ColumnDef<SalesReturnRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (dn) => (
      <Link href={`/sales/returns/${encodeURIComponent(dn.name)}`} className="font-mono text-signal hover:underline">
        {dn.name}
      </Link>
    ),
  },
  {
    key: "return_against",
    label: "Original Delivery Note",
    render: (dn) => (
      dn.return_against ? (
        <Link href={`/sales/delivery-notes/${encodeURIComponent(dn.return_against)}`} className="font-mono text-signal hover:underline">
          {dn.return_against}
        </Link>
      ) : <span className="text-graphite-500">—</span>
    ),
  },
  { key: "customer", label: "Customer", core: true, render: (dn) => <span className="text-graphite-900">{dn.customer}</span> },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (dn) => {
      const status = deliveryNoteStatus(dn);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (dn) => deliveryNoteStatus(dn).label,
  },
  {
    key: "posting_date",
    label: "Date",
    render: (dn) => <span className="font-mono text-graphite-500">{dn.posting_date}</span>,
  },
  {
    key: "grand_total",
    label: "Return amount",
    align: "right",
    render: (dn) => <span className="font-mono tabular-nums text-graphite-900">{formatAmount(Math.abs(dn.grand_total))}</span>,
  },
  { key: "per_billed", label: "% Billed", defaultVisible: false, align: "right", render: (dn) => <span className="font-mono tabular-nums text-graphite-500">{dn.per_billed?.toFixed(0) ?? 0}%</span> },
  { key: "company", label: "Company", defaultVisible: false, render: (dn) => dn.company || "—" },
  { key: "territory", label: "Territory", defaultVisible: false, render: (dn) => dn.territory || "—" },
  { key: "owner", label: "Owner", defaultVisible: false, render: (dn) => dn.owner || "—" },
];

export function SalesReturnsTable({
  salesReturns,
  startIndex,
}: {
  salesReturns: SalesReturnRow[];
  startIndex?: number;
}) {
  return (
    <DataTable
      tableId="sales-returns"
      columns={columns}
      rows={salesReturns}
      emptyLabel="No sales returns match these filters."
      startIndex={startIndex}
    />
  );
}
