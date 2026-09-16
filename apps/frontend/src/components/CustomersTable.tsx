"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import type { ColumnDef } from "@/lib/tableColumns";

export type CustomerRow = {
  name: string;
  customer_name: string;
  customer_type: string;
  customer_group: string | null;
  territory: string | null;
  disabled: 0 | 1;
  mobile_no?: string;
  email_id?: string;
  default_currency?: string;
};

const columns: ColumnDef<CustomerRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (c) => (
      <Link href={`/sales/customers/${encodeURIComponent(c.name)}`} className="font-mono text-signal hover:underline">
        {c.name}
      </Link>
    ),
  },
  { key: "customer_name", label: "Name", core: true, render: (c) => <span className="text-graphite-900">{c.customer_name}</span> },
  { key: "customer_type", label: "Type", render: (c) => <span className="text-graphite-500">{c.customer_type}</span> },
  { key: "customer_group", label: "Group", render: (c) => <span className="text-graphite-500">{c.customer_group ?? "—"}</span> },
  { key: "territory", label: "Territory", render: (c) => <span className="text-graphite-500">{c.territory ?? "—"}</span> },
  {
    key: "disabled",
    label: "Status",
    render: (c) => (c.disabled ? <StatusPill label="Disabled" tone="neutral" /> : <StatusPill label="Active" tone="success" />),
    exportValue: (c) => (c.disabled ? "Disabled" : "Active"),
  },
  { key: "mobile_no", label: "Mobile", defaultVisible: false, render: (c) => c.mobile_no || "—" },
  { key: "email_id", label: "Email", defaultVisible: false, render: (c) => c.email_id || "—" },
  { key: "default_currency", label: "Billing currency", defaultVisible: false, render: (c) => c.default_currency || "—" },
];

export function CustomersTable({ customers, startIndex }: { customers: CustomerRow[]; startIndex?: number }) {
  return (
    <DataTable tableId="customers" columns={columns} rows={customers} emptyLabel="No customers yet." startIndex={startIndex} />
  );
}
