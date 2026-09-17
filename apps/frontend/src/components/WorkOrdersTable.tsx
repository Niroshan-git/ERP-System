"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { workOrderStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";

export type WorkOrderRow = {
  name: string;
  status: string;
  company?: string;
  production_item: string;
  item_name?: string;
  qty: number;
  produced_qty?: number;
  bom_no?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  creation?: string;
};

const columns: ColumnDef<WorkOrderRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (wo) => (
      <Link href={`/manufacturing/work-orders/${encodeURIComponent(wo.name)}`} className="font-mono text-signal hover:underline">
        {wo.name}
      </Link>
    ),
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (wo) => {
      const status = workOrderStatus(wo);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (wo) => workOrderStatus(wo).label,
  },
  {
    key: "production_item",
    label: "Item",
    core: true,
    render: (wo) => (
      <div>
        <div className="text-graphite-900">{wo.item_name || wo.production_item}</div>
        {wo.item_name && wo.item_name !== wo.production_item && (
          <div className="font-mono text-xs text-graphite-500">{wo.production_item}</div>
        )}
      </div>
    ),
    exportValue: (wo) => wo.item_name || wo.production_item,
  },
  {
    key: "qty",
    label: "Qty",
    align: "right",
    core: true,
    render: (wo) => <span className="font-mono tabular-nums text-graphite-900">{wo.qty}</span>,
  },
  {
    key: "produced_qty",
    label: "Produced",
    align: "right",
    render: (wo) => <span className="font-mono tabular-nums text-graphite-500">{wo.produced_qty ?? 0}</span>,
  },
  {
    key: "planned_start_date",
    label: "Planned start",
    render: (wo) => <span className="font-mono text-graphite-500">{wo.planned_start_date || "—"}</span>,
  },
  {
    key: "planned_end_date",
    label: "Planned end",
    defaultVisible: false,
    render: (wo) => <span className="font-mono text-graphite-500">{wo.planned_end_date || "—"}</span>,
  },
  { key: "company", label: "Company", defaultVisible: false, render: (wo) => wo.company || "—" },
  {
    key: "bom_no",
    label: "BOM",
    defaultVisible: false,
    render: (wo) => <span className="font-mono text-xs text-graphite-500">{wo.bom_no || "—"}</span>,
  },
  {
    key: "creation",
    label: "Created",
    defaultVisible: false,
    render: (wo) => <span className="font-mono text-graphite-500">{wo.creation?.slice(0, 10) || "—"}</span>,
  },
];

export function WorkOrdersTable({ workOrders, startIndex }: { workOrders: WorkOrderRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="work-orders"
      columns={columns}
      rows={workOrders}
      emptyLabel="No work orders match these filters."
      startIndex={startIndex}
    />
  );
}
