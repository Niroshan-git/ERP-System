"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { ProgressBar } from "@/components/ProgressBar";
import { pickListStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type PickListRow = {
  name: string;
  customer?: string;
  purpose: string;
  status: string;
  docstatus: DocStatus;
  per_delivered: number;
  company?: string;
  owner?: string;
};

const columns: ColumnDef<PickListRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (pl) => (
      <Link href={`/sales/pick-lists/${encodeURIComponent(pl.name)}`} className="font-mono text-signal hover:underline">
        {pl.name}
      </Link>
    ),
  },
  { key: "customer", label: "Customer", core: true, render: (pl) => <span className="text-graphite-900">{pl.customer || "—"}</span> },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (pl) => {
      const status = pickListStatus(pl);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (pl) => pickListStatus(pl).label,
  },
  {
    key: "per_delivered",
    label: "% Delivered",
    render: (pl) => <ProgressBar value={pl.per_delivered ?? 0} />,
  },
  { key: "purpose", label: "Purpose", defaultVisible: false, render: (pl) => pl.purpose },
  { key: "company", label: "Company", defaultVisible: false, render: (pl) => pl.company || "—" },
  { key: "owner", label: "Owner", defaultVisible: false, render: (pl) => pl.owner || "—" },
];

export function PickListsTable({ pickLists, startIndex }: { pickLists: PickListRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="pick-lists"
      columns={columns}
      rows={pickLists}
      emptyLabel="No pick lists match these filters."
      startIndex={startIndex}
    />
  );
}
