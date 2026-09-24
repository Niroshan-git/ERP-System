"use client";

import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { StatusPill } from "@/components/StatusPill";
import { opportunityStatus } from "@/lib/erpStatus";
import { formatAmount } from "@/lib/format";
import type { ColumnDef } from "@/lib/tableColumns";

export type OpportunityRow = {
  name: string;
  title: string | null;
  opportunity_from: string;
  party_name: string;
  customer_name: string | null;
  status: string;
  sales_stage: string | null;
  opportunity_amount: number | null;
  probability: number | null;
  currency: string | null;
  expected_closing: string | null;
  opportunity_owner: string | null;
  modified: string;
};

function weightedValue(row: OpportunityRow): number {
  return ((row.opportunity_amount ?? 0) * (row.probability ?? 0)) / 100;
}

const columns: ColumnDef<OpportunityRow>[] = [
  {
    key: "name",
    label: "Opportunity",
    core: true,
    render: (o) => (
      <Link href={`/crm/opportunities/${encodeURIComponent(o.name)}`} className="font-mono text-signal hover:underline">
        {o.title || o.name}
      </Link>
    ),
    exportValue: (o) => o.title || o.name,
  },
  {
    key: "party_name",
    label: "Party",
    core: true,
    render: (o) => (
      <span className="text-graphite-900">
        {o.customer_name || o.party_name} <span className="text-graphite-500">({o.opportunity_from})</span>
      </span>
    ),
    exportValue: (o) => `${o.customer_name || o.party_name} (${o.opportunity_from})`,
  },
  {
    key: "sales_stage",
    label: "Stage",
    core: true,
    render: (o) => <span className="text-graphite-900">{o.sales_stage || "—"}</span>,
  },
  {
    key: "status",
    label: "Status",
    core: true,
    render: (o) => {
      const s = opportunityStatus(o);
      return <StatusPill label={s.label} tone={s.tone} />;
    },
    exportValue: (o) => o.status,
  },
  {
    key: "opportunity_amount",
    label: "Expected Value",
    align: "right",
    render: (o) => (
      <span className="text-graphite-900">
        {formatAmount(o.opportunity_amount ?? 0)} {o.currency}
      </span>
    ),
    exportValue: (o) => o.opportunity_amount ?? 0,
  },
  {
    key: "probability",
    label: "Probability",
    align: "right",
    render: (o) => <span className="text-graphite-900">{o.probability ?? 0}%</span>,
    exportValue: (o) => o.probability ?? 0,
  },
  {
    key: "weighted_value",
    label: "Weighted Value",
    align: "right",
    defaultVisible: false,
    render: (o) => (
      <span className="text-graphite-500">
        {formatAmount(weightedValue(o))} {o.currency}
      </span>
    ),
    exportValue: (o) => weightedValue(o),
  },
  {
    key: "expected_closing",
    label: "Expected Close",
    render: (o) => <span className="text-graphite-500">{o.expected_closing || "—"}</span>,
  },
  {
    key: "opportunity_owner",
    label: "Owner",
    defaultVisible: false,
    render: (o) => <span className="text-graphite-500">{o.opportunity_owner || "—"}</span>,
  },
  {
    key: "modified",
    label: "Modified",
    defaultVisible: false,
    render: (o) => <span className="text-graphite-500">{o.modified}</span>,
  },
];

export function OpportunitiesTable({ opportunities, startIndex }: { opportunities: OpportunityRow[]; startIndex?: number }) {
  return (
    <DataTable
      tableId="opportunities"
      columns={columns}
      rows={opportunities}
      emptyLabel="No opportunities yet."
      startIndex={startIndex}
    />
  );
}
