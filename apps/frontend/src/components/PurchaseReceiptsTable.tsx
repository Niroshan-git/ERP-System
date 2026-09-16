"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { purchaseReceiptStatus } from "@/lib/erpStatus";
import { formatAmount } from "@/lib/format";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type PurchaseReceiptRow = {
  name: string;
  supplier: string;
  supplier_name?: string;
  status: string;
  docstatus: DocStatus;
  posting_date: string;
  per_billed: number;
  per_returned: number;
  grand_total: number;
  is_return?: 0 | 1;
  company?: string;
  currency?: string;
};

const columns: ColumnDef<PurchaseReceiptRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (pr) => (
      <Link href={`/buying/purchase-receipts/${encodeURIComponent(pr.name)}`} className="font-mono text-signal hover:underline">
        {pr.name}
      </Link>
    ),
  },
  {
    key: "supplier",
    label: "Supplier",
    core: true,
    render: (pr) => <span className="text-graphite-900">{pr.supplier_name || pr.supplier}</span>,
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (pr) => {
      const status = purchaseReceiptStatus(pr);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (pr) => purchaseReceiptStatus(pr).label,
  },
  {
    key: "posting_date",
    label: "Posting date",
    render: (pr) => <span className="font-mono text-graphite-500">{pr.posting_date}</span>,
  },
  {
    key: "grand_total",
    label: "Grand total",
    align: "right",
    render: (pr) => (
      <span className="font-mono tabular-nums text-graphite-900">
        {formatAmount(pr.grand_total)} {pr.currency}
      </span>
    ),
    exportValue: (pr) => formatAmount(pr.grand_total),
  },
  { key: "company", label: "Company", defaultVisible: false, render: (pr) => pr.company || "—" },
];

export function PurchaseReceiptsTable({ receipts, startIndex }: { receipts: PurchaseReceiptRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="purchase-receipts"
      columns={columns}
      rows={receipts}
      emptyLabel="No purchase receipts match these filters."
      startIndex={startIndex}
    />
  );
}
