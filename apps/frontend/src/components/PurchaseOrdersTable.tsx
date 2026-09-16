"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { purchaseOrderStatus } from "@/lib/erpStatus";
import { formatAmount } from "@/lib/format";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type PurchaseOrderRow = {
  name: string;
  supplier: string;
  supplier_name?: string;
  status: string;
  docstatus: DocStatus;
  transaction_date: string;
  schedule_date?: string;
  per_billed: number;
  per_received: number;
  grand_total?: number;
  company?: string;
  currency?: string;
};

/**
 * Plain (non-bulk) list table — deliberately no row-selection/close/reopen bulk actions,
 * unlike SalesOrderBulkTable. The real whitelisted method for Purchase Order's own bulk
 * close/reopen hasn't been verified against the live server this session (no network
 * access — see purchase-orders/page.tsx's own note), so it's skipped rather than guessed.
 */
const columns: ColumnDef<PurchaseOrderRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (po) => (
      <Link href={`/buying/purchase-orders/${encodeURIComponent(po.name)}`} className="font-mono text-signal hover:underline">
        {po.name}
      </Link>
    ),
  },
  {
    key: "supplier",
    label: "Supplier",
    core: true,
    render: (po) => <span className="text-graphite-900">{po.supplier_name || po.supplier}</span>,
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (po) => {
      const status = purchaseOrderStatus(po);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (po) => purchaseOrderStatus(po).label,
  },
  {
    key: "transaction_date",
    label: "Date",
    render: (po) => <span className="font-mono text-graphite-500">{po.transaction_date}</span>,
  },
  {
    key: "grand_total",
    label: "Grand total",
    align: "right",
    render: (po) => (
      <span className="font-mono tabular-nums text-graphite-900">
        {formatAmount(po.grand_total ?? 0)} {po.currency}
      </span>
    ),
    exportValue: (po) => formatAmount(po.grand_total ?? 0),
  },
  {
    key: "schedule_date",
    label: "Required by",
    defaultVisible: false,
    render: (po) => <span className="font-mono text-graphite-500">{po.schedule_date || "—"}</span>,
  },
  { key: "company", label: "Company", defaultVisible: false, render: (po) => po.company || "—" },
];

export function PurchaseOrdersTable({ orders, startIndex }: { orders: PurchaseOrderRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="purchase-orders"
      columns={columns}
      rows={orders}
      emptyLabel="No purchase orders match these filters."
      startIndex={startIndex}
    />
  );
}
