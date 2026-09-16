"use client";

import { DataTable } from "@/components/DataTable";
import { formatAmount } from "@/lib/format";
import type { ColumnDef } from "@/lib/tableColumns";

export type StockBalanceRow = {
  name: string;
  item_code: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  projected_qty: number;
  valuation_rate: number;
  stock_uom?: string;
};

const columns: ColumnDef<StockBalanceRow>[] = [
  { key: "item_code", label: "Item", core: true, render: (row) => <span className="font-mono">{row.item_code}</span> },
  { key: "warehouse", label: "Warehouse", core: true, render: (row) => row.warehouse },
  {
    key: "actual_qty",
    label: "Actual Qty",
    core: true,
    align: "right",
    render: (row) => (
      <span className="font-mono tabular-nums">
        {row.actual_qty} {row.stock_uom ?? ""}
      </span>
    ),
    exportValue: (row) => row.actual_qty,
  },
  {
    key: "reserved_qty",
    label: "Reserved Qty",
    align: "right",
    render: (row) => <span className="font-mono tabular-nums">{row.reserved_qty}</span>,
  },
  {
    key: "projected_qty",
    label: "Projected Qty",
    align: "right",
    render: (row) => <span className="font-mono tabular-nums">{row.projected_qty}</span>,
  },
  {
    key: "valuation_rate",
    label: "Valuation Rate",
    align: "right",
    render: (row) => <span className="font-mono tabular-nums">{formatAmount(row.valuation_rate)}</span>,
    exportValue: (row) => formatAmount(row.valuation_rate),
  },
];

/**
 * Bin is a system-maintained snapshot doctype (no docstatus, never created/edited from this
 * UI) — this table is read-only, backed directly by Bin rows (see stock-balance/page.tsx).
 * It's a live "current stock" view, not the same thing as ERPNext's own "Stock Balance"
 * Script Report (which is date-ranged/historical and, per PROGRESS.md, runs as a background
 * Prepared Report this app's generic report runner can't drive synchronously) — see the
 * Reports hub's own note on that distinction.
 */
export function StockBalanceTable({ rows, startIndex }: { rows: StockBalanceRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="stock-balance"
      columns={columns}
      rows={rows}
      getRowKey={(row) => `${row.item_code}::${row.warehouse}`}
      emptyLabel="No stock balance rows match these filters."
      startIndex={startIndex}
    />
  );
}
