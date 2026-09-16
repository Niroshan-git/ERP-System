"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { stockEntryStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type StockEntryRow = {
  name: string;
  posting_date: string;
  purpose: string;
  docstatus: DocStatus;
  from_warehouse?: string;
  to_warehouse?: string;
  company?: string;
};

const columns: ColumnDef<StockEntryRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (se) => (
      <Link href={`/stock/stock-entries/${encodeURIComponent(se.name)}`} className="font-mono text-signal hover:underline">
        {se.name}
      </Link>
    ),
  },
  {
    key: "purpose",
    label: "Purpose",
    core: true,
    render: (se) => <span className="text-graphite-900">{se.purpose}</span>,
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (se) => {
      const status = stockEntryStatus(se);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (se) => stockEntryStatus(se).label,
  },
  {
    key: "posting_date",
    label: "Date",
    render: (se) => <span className="font-mono text-graphite-500">{se.posting_date}</span>,
  },
  {
    key: "from_warehouse",
    label: "From Warehouse",
    render: (se) => se.from_warehouse || "—",
  },
  {
    key: "to_warehouse",
    label: "To Warehouse",
    render: (se) => se.to_warehouse || "—",
  },
  { key: "company", label: "Company", defaultVisible: false, render: (se) => se.company || "—" },
];

export function StockEntriesTable({ entries, startIndex }: { entries: StockEntryRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="stock-entries"
      columns={columns}
      rows={entries}
      emptyLabel="No stock entries match these filters."
      startIndex={startIndex}
    />
  );
}
