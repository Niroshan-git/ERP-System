"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { rfqStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type RequestForQuotationRow = {
  name: string;
  transaction_date: string;
  schedule_date?: string;
  docstatus: DocStatus;
  company?: string;
};

const columns: ColumnDef<RequestForQuotationRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (rfq) => (
      <Link href={`/buying/request-for-quotations/${encodeURIComponent(rfq.name)}`} className="font-mono text-signal hover:underline">
        {rfq.name}
      </Link>
    ),
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (rfq) => {
      const status = rfqStatus(rfq);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (rfq) => rfqStatus(rfq).label,
  },
  {
    key: "transaction_date",
    label: "Date",
    render: (rfq) => <span className="font-mono text-graphite-500">{rfq.transaction_date}</span>,
  },
  {
    key: "schedule_date",
    label: "Required date",
    render: (rfq) => <span className="font-mono text-graphite-500">{rfq.schedule_date || "—"}</span>,
  },
  { key: "company", label: "Company", defaultVisible: false, render: (rfq) => rfq.company || "—" },
];

export function RequestForQuotationsTable({ rfqs, startIndex }: { rfqs: RequestForQuotationRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="request-for-quotations"
      columns={columns}
      rows={rfqs}
      emptyLabel="No RFQs match these filters."
      startIndex={startIndex}
    />
  );
}
