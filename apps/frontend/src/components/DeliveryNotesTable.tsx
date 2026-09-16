"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { deliveryNoteStatus } from "@/lib/erpStatus";
import { formatAmount } from "@/lib/format";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type DeliveryNoteRow = {
  name: string;
  customer: string;
  posting_date: string;
  status: string;
  docstatus: DocStatus;
  per_billed: number;
  is_return?: 0 | 1;
  grand_total: number;
  company?: string;
  territory?: string;
  owner?: string;
};

const columns: ColumnDef<DeliveryNoteRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (dn) => (
      <Link href={`/sales/delivery-notes/${encodeURIComponent(dn.name)}`} className="font-mono text-signal hover:underline">
        {dn.name}
      </Link>
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
    label: "Grand total",
    align: "right",
    render: (dn) => <span className="font-mono tabular-nums text-graphite-900">{formatAmount(dn.grand_total)}</span>,
  },
  { key: "per_billed", label: "% Billed", defaultVisible: false, align: "right", render: (dn) => <span className="font-mono tabular-nums text-graphite-500">{dn.per_billed?.toFixed(0) ?? 0}%</span> },
  { key: "company", label: "Company", defaultVisible: false, render: (dn) => dn.company || "—" },
  { key: "territory", label: "Territory", defaultVisible: false, render: (dn) => dn.territory || "—" },
  { key: "owner", label: "Owner", defaultVisible: false, render: (dn) => dn.owner || "—" },
];

export function DeliveryNotesTable({
  deliveryNotes,
  startIndex,
}: {
  deliveryNotes: DeliveryNoteRow[];
  startIndex?: number;
}) {
  return (
    <DataTable
      tableId="delivery-notes"
      columns={columns}
      rows={deliveryNotes}
      emptyLabel="No delivery notes match these filters."
      startIndex={startIndex}
    />
  );
}
