"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { materialRequestStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type MaterialRequestRow = {
  name: string;
  title?: string;
  transaction_date: string;
  schedule_date?: string;
  status: string;
  docstatus: DocStatus;
  per_ordered: number;
  per_received: number;
  company?: string;
};

const columns: ColumnDef<MaterialRequestRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (mr) => (
      <Link href={`/buying/material-requests/${encodeURIComponent(mr.name)}`} className="font-mono text-signal hover:underline">
        {mr.name}
      </Link>
    ),
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (mr) => {
      const status = materialRequestStatus(mr);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (mr) => materialRequestStatus(mr).label,
  },
  {
    key: "transaction_date",
    label: "Date",
    render: (mr) => <span className="font-mono text-graphite-500">{mr.transaction_date}</span>,
  },
  {
    key: "schedule_date",
    label: "Required by",
    render: (mr) => <span className="font-mono text-graphite-500">{mr.schedule_date || "—"}</span>,
  },
  {
    key: "per_ordered",
    label: "% Ordered",
    align: "right",
    render: (mr) => <span className="font-mono tabular-nums">{(mr.per_ordered ?? 0).toFixed(0)}%</span>,
  },
  {
    key: "per_received",
    label: "% Received",
    align: "right",
    render: (mr) => <span className="font-mono tabular-nums">{(mr.per_received ?? 0).toFixed(0)}%</span>,
  },
  { key: "company", label: "Company", defaultVisible: false, render: (mr) => mr.company || "—" },
];

export function MaterialRequestsTable({ requests, startIndex }: { requests: MaterialRequestRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="material-requests"
      columns={columns}
      rows={requests}
      emptyLabel="No material requests match these filters."
      startIndex={startIndex}
    />
  );
}
