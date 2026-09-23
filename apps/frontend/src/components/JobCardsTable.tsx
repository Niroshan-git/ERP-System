"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { jobCardStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type JobCardRow = {
  name: string;
  docstatus: DocStatus;
  status?: string;
  work_order: string;
  operation?: string;
  workstation?: string;
  for_quantity?: number;
  total_completed_qty?: number;
  expected_start_date?: string;
  expected_end_date?: string;
};

const columns: ColumnDef<JobCardRow>[] = [
  {
    key: "name",
    label: "Job Card",
    core: true,
    render: (jc) => (
      <Link href={`/manufacturing/job-cards/${encodeURIComponent(jc.name)}`} className="font-mono text-signal hover:underline">
        {jc.name}
      </Link>
    ),
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (jc) => {
      const status = jobCardStatus(jc);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (jc) => jobCardStatus(jc).label,
  },
  {
    key: "work_order",
    label: "Work Order",
    core: true,
    render: (jc) => (
      <Link href={`/manufacturing/work-orders/${encodeURIComponent(jc.work_order)}`} className="font-mono text-signal hover:underline">
        {jc.work_order}
      </Link>
    ),
  },
  {
    key: "operation",
    label: "Operation",
    core: true,
    render: (jc) => jc.operation || "—",
  },
  {
    key: "workstation",
    label: "Workstation",
    render: (jc) => jc.workstation || "—",
  },
  {
    key: "for_quantity",
    label: "For Qty",
    align: "right",
    render: (jc) => <span className="font-mono tabular-nums text-graphite-900">{jc.for_quantity ?? "—"}</span>,
  },
  {
    key: "total_completed_qty",
    label: "Completed",
    align: "right",
    render: (jc) => <span className="font-mono tabular-nums text-graphite-500">{jc.total_completed_qty ?? 0}</span>,
  },
  {
    key: "expected_start_date",
    label: "Expected start",
    defaultVisible: false,
    render: (jc) => <span className="font-mono text-graphite-500">{jc.expected_start_date || "—"}</span>,
  },
  {
    key: "expected_end_date",
    label: "Expected end",
    defaultVisible: false,
    render: (jc) => <span className="font-mono text-graphite-500">{jc.expected_end_date || "—"}</span>,
  },
];

export function JobCardsTable({ jobCards, startIndex }: { jobCards: JobCardRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="job-cards"
      columns={columns}
      rows={jobCards}
      emptyLabel="No Job Cards match these filters."
      startIndex={startIndex}
    />
  );
}
