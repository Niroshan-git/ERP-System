"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import type { ColumnDef } from "@/lib/tableColumns";

export type SupplierRow = {
  name: string;
  supplier_name: string;
  supplier_type: string;
  supplier_group: string | null;
  country: string | null;
  disabled: 0 | 1;
  mobile_no?: string;
  email_id?: string;
  default_currency?: string;
};

const columns: ColumnDef<SupplierRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (s) => (
      <Link href={`/buying/suppliers/${encodeURIComponent(s.name)}`} className="font-mono text-signal hover:underline">
        {s.name}
      </Link>
    ),
  },
  { key: "supplier_name", label: "Name", core: true, render: (s) => <span className="text-graphite-900">{s.supplier_name}</span> },
  { key: "supplier_type", label: "Type", render: (s) => <span className="text-graphite-500">{s.supplier_type}</span> },
  { key: "supplier_group", label: "Group", render: (s) => <span className="text-graphite-500">{s.supplier_group ?? "—"}</span> },
  { key: "country", label: "Country", render: (s) => <span className="text-graphite-500">{s.country ?? "—"}</span> },
  {
    key: "disabled",
    label: "Status",
    render: (s) => (s.disabled ? <StatusPill label="Disabled" tone="neutral" /> : <StatusPill label="Active" tone="success" />),
    exportValue: (s) => (s.disabled ? "Disabled" : "Active"),
  },
  { key: "mobile_no", label: "Mobile", defaultVisible: false, render: (s) => s.mobile_no || "—" },
  { key: "email_id", label: "Email", defaultVisible: false, render: (s) => s.email_id || "—" },
  { key: "default_currency", label: "Billing currency", defaultVisible: false, render: (s) => s.default_currency || "—" },
];

export function SuppliersTable({ suppliers, startIndex }: { suppliers: SupplierRow[]; startIndex?: number }) {
  return (
    <DataTable tableId="suppliers" columns={columns} rows={suppliers} emptyLabel="No suppliers yet." startIndex={startIndex} />
  );
}
