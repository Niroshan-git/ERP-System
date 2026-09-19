"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { productionPlanStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";

export type ProductionPlanRow = {
  name: string;
  company?: string;
  posting_date?: string;
  status: string;
  docstatus: 0 | 1 | 2;
  get_items_from?: string;
  combine_items?: 0 | 1;
  combine_sub_items?: 0 | 1;
  total_planned_qty?: number;
  creation?: string;
  modified?: string;
};

const columns: ColumnDef<ProductionPlanRow>[] = [
  {
    key: "name",
    label: "Production Plan",
    core: true,
    render: (pp) => (
      <Link
        href={`/manufacturing/production-plans/${encodeURIComponent(pp.name)}`}
        className="font-mono text-signal hover:underline"
      >
        {pp.name}
      </Link>
    ),
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (pp) => {
      const status = productionPlanStatus(pp);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (pp) => productionPlanStatus(pp).label,
  },
  {
    key: "posting_date",
    label: "Posting Date",
    core: true,
    render: (pp) => <span className="font-mono text-graphite-500">{pp.posting_date || "—"}</span>,
  },
  { key: "company", label: "Company", core: true, render: (pp) => pp.company || "—" },
  {
    key: "total_planned_qty",
    label: "Planned Qty",
    align: "right",
    render: (pp) => (
      <span className="font-mono tabular-nums text-graphite-900">{pp.total_planned_qty ?? 0}</span>
    ),
  },
  {
    key: "get_items_from",
    label: "Get Items From",
    defaultVisible: false,
    render: (pp) => pp.get_items_from || "—",
  },
  {
    key: "combine_items",
    label: "Combine Items",
    defaultVisible: false,
    render: (pp) => (pp.combine_items ? "Yes" : "No"),
  },
  {
    key: "combine_sub_items",
    label: "Combine Sub Items",
    defaultVisible: false,
    render: (pp) => (pp.combine_sub_items ? "Yes" : "No"),
  },
  {
    key: "modified",
    label: "Modified",
    defaultVisible: false,
    render: (pp) => <span className="font-mono text-graphite-500">{pp.modified?.slice(0, 10) || "—"}</span>,
  },
];

export function ProductionPlansTable({ productionPlans, startIndex }: { productionPlans: ProductionPlanRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="production-plans"
      columns={columns}
      rows={productionPlans}
      emptyLabel="No Production Plans found."
      startIndex={startIndex}
    />
  );
}
