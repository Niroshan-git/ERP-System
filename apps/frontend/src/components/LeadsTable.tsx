"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { leadStatus } from "@/lib/erpStatus";
import type { ColumnDef } from "@/lib/tableColumns";

export type LeadRow = {
  name: string;
  lead_name: string;
  status: string;
  company_name: string | null;
  territory: string | null;
  industry: string | null;
  type: string | null;
  email_id: string | null;
  mobile_no: string | null;
  lead_owner: string | null;
  qualification_status: string | null;
  disabled: 0 | 1;
};

const columns: ColumnDef<LeadRow>[] = [
  {
    key: "name",
    label: "ID",
    core: true,
    render: (l) => (
      <Link href={`/crm/leads/${encodeURIComponent(l.name)}`} className="font-mono text-signal hover:underline">
        {l.name}
      </Link>
    ),
  },
  { key: "lead_name", label: "Name", core: true, render: (l) => <span className="text-graphite-900">{l.lead_name}</span> },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (l) => {
      const s = leadStatus(l);
      return <StatusPill label={s.label} tone={s.tone} />;
    },
    exportValue: (l) => l.status,
  },
  { key: "company_name", label: "Organization", render: (l) => <span className="text-graphite-500">{l.company_name ?? "—"}</span> },
  { key: "territory", label: "Territory", render: (l) => <span className="text-graphite-500">{l.territory ?? "—"}</span> },
  { key: "industry", label: "Industry", render: (l) => <span className="text-graphite-500">{l.industry ?? "—"}</span> },
  { key: "type", label: "Type", defaultVisible: false, render: (l) => l.type || "—" },
  { key: "qualification_status", label: "Qualification", defaultVisible: false, render: (l) => l.qualification_status || "—" },
  { key: "mobile_no", label: "Mobile", defaultVisible: false, render: (l) => l.mobile_no || "—" },
  { key: "email_id", label: "Email", defaultVisible: false, render: (l) => l.email_id || "—" },
  { key: "lead_owner", label: "Owner", defaultVisible: false, render: (l) => l.lead_owner || "—" },
  {
    key: "disabled",
    label: "Active",
    defaultVisible: false,
    render: (l) => (l.disabled ? <StatusPill label="Disabled" tone="neutral" /> : <StatusPill label="Active" tone="success" />),
    exportValue: (l) => (l.disabled ? "Disabled" : "Active"),
  },
];

export function LeadsTable({ leads, startIndex }: { leads: LeadRow[]; startIndex?: number }) {
  return <DataTable tableId="leads" columns={columns} rows={leads} emptyLabel="No leads yet." startIndex={startIndex} />;
}
