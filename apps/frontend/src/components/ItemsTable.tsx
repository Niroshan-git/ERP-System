"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { formatAmount } from "@/lib/format";
import type { ColumnDef } from "@/lib/tableColumns";

export type ItemRow = {
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  disabled: 0 | 1;
  is_stock_item?: 0 | 1;
  has_batch_no?: 0 | 1;
  has_serial_no?: 0 | 1;
};

const columns: ColumnDef<ItemRow>[] = [
  {
    key: "name",
    label: "Item code",
    core: true,
    render: (item) => (
      <Link href={`/sales/items/${encodeURIComponent(item.name)}`} className="font-mono text-signal hover:underline">
        {item.name}
      </Link>
    ),
  },
  { key: "item_name", label: "Name", core: true, render: (item) => <span className="text-graphite-900">{item.item_name}</span> },
  { key: "item_group", label: "Group", render: (item) => <span className="text-graphite-500">{item.item_group}</span> },
  { key: "stock_uom", label: "UOM", render: (item) => <span className="text-graphite-500">{item.stock_uom}</span> },
  {
    key: "standard_rate",
    label: "Rate",
    align: "right",
    render: (item) => (
      <span className="font-mono tabular-nums text-graphite-500">{item.standard_rate ? formatAmount(item.standard_rate) : "—"}</span>
    ),
  },
  {
    key: "disabled",
    label: "Status",
    render: (item) => (item.disabled ? <StatusPill label="Disabled" tone="neutral" /> : <StatusPill label="Active" tone="success" />),
    exportValue: (item) => (item.disabled ? "Disabled" : "Active"),
  },
  {
    key: "is_stock_item",
    label: "Maintains stock",
    defaultVisible: false,
    render: (item) => (item.is_stock_item ? "Yes" : "No"),
    exportValue: (item) => (item.is_stock_item ? "Yes" : "No"),
  },
  {
    key: "has_batch_no",
    label: "Has batch no.",
    defaultVisible: false,
    render: (item) => (item.has_batch_no ? "Yes" : "No"),
    exportValue: (item) => (item.has_batch_no ? "Yes" : "No"),
  },
  {
    key: "has_serial_no",
    label: "Has serial no.",
    defaultVisible: false,
    render: (item) => (item.has_serial_no ? "Yes" : "No"),
    exportValue: (item) => (item.has_serial_no ? "Yes" : "No"),
  },
];

export function ItemsTable({ items, startIndex }: { items: ItemRow[]; startIndex?: number }) {
  return <DataTable tableId="items" columns={columns} rows={items} emptyLabel="No items yet." startIndex={startIndex} />;
}
