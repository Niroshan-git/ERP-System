"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { supplierQuotationStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";
import type { DocStatus } from "@/lib/docStatus";

export type SupplierQuotationRow = {
  name: string;
  supplier: string;
  supplier_name?: string;
  status: string;
  docstatus: DocStatus;
  transaction_date: string;
  valid_till?: string;
  company?: string;
  currency?: string;
};

const columns: ColumnDef<SupplierQuotationRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (sq) => (
      <Link href={`/buying/supplier-quotations/${encodeURIComponent(sq.name)}`} className="font-mono text-signal hover:underline">
        {sq.name}
      </Link>
    ),
  },
  {
    key: "supplier",
    label: "Supplier",
    core: true,
    render: (sq) => <span className="text-graphite-900">{sq.supplier_name || sq.supplier}</span>,
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (sq) => {
      const status = supplierQuotationStatus(sq);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
    exportValue: (sq) => supplierQuotationStatus(sq).label,
  },
  {
    key: "transaction_date",
    label: "Date",
    render: (sq) => <span className="font-mono text-graphite-500">{sq.transaction_date}</span>,
  },
  {
    key: "valid_till",
    label: "Valid till",
    render: (sq) => <span className="font-mono text-graphite-500">{sq.valid_till || "—"}</span>,
  },
  { key: "currency", label: "Currency", defaultVisible: false, render: (sq) => sq.currency || "—" },
  { key: "company", label: "Company", defaultVisible: false, render: (sq) => sq.company || "—" },
];

export function SupplierQuotationsTable({ quotations, startIndex }: { quotations: SupplierQuotationRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="supplier-quotations"
      columns={columns}
      rows={quotations}
      emptyLabel="No supplier quotations match these filters."
      startIndex={startIndex}
    />
  );
}
