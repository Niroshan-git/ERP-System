"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { bomStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";

export type BomRow = {
  name: string;
  item: string;
  item_name?: string;
  quantity: number;
  uom?: string;
  company?: string;
  is_active: 0 | 1;
  is_default: 0 | 1;
  docstatus: 0 | 1 | 2;
  modified?: string;
};

const columns: ColumnDef<BomRow>[] = [
  {
    key: "name",
    label: "BOM",
    core: true,
    render: (bom) => (
      <Link href={`/master-data/boms/${encodeURIComponent(bom.name)}`} className="font-mono text-signal hover:underline">
        {bom.name}
      </Link>
    ),
  },
  {
    key: "item",
    label: "Item",
    core: true,
    render: (bom) => (
      <div>
        <div className="text-graphite-900">{bom.item_name || bom.item}</div>
        {bom.item_name && bom.item_name !== bom.item && (
          <div className="font-mono text-xs text-graphite-500">{bom.item}</div>
        )}
      </div>
    ),
    exportValue: (bom) => bom.item_name || bom.item,
  },
  {
    key: "quantity",
    label: "Qty",
    align: "right",
    core: true,
    render: (bom) => (
      <span className="font-mono tabular-nums text-graphite-900">
        {bom.quantity} {bom.uom || ""}
      </span>
    ),
  },
  {
    key: "docstatus",
    label: "Status",
    core: true,
    render: (bom) => {
      const status = bomStatus(bom);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (bom) => bomStatus(bom).label,
  },
  {
    key: "is_default",
    label: "Default",
    render: (bom) => (bom.is_default ? "Yes" : "No"),
  },
  {
    key: "is_active",
    label: "Active",
    render: (bom) => (bom.is_active ? "Yes" : "No"),
  },
  { key: "company", label: "Company", defaultVisible: false, render: (bom) => bom.company || "—" },
  {
    key: "modified",
    label: "Modified",
    defaultVisible: false,
    render: (bom) => <span className="font-mono text-graphite-500">{bom.modified?.slice(0, 10) || "—"}</span>,
  },
];

export function BomsTable({ boms, startIndex }: { boms: BomRow[]; startIndex?: number }) {
  return (
    <DataTable tableId="boms" columns={columns} rows={boms} emptyLabel="No BOMs match these filters." startIndex={startIndex} />
  );
}
