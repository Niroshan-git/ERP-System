import { listDocs } from "@/lib/erpnext";
import { MasterTable } from "@/components/MasterTable";
import { StatusPill } from "@/components/StatusPill";

type SalesPersonRow = {
  name: string;
  parent_sales_person: string | null;
  employee: string | null;
  commission_rate: string | null;
  enabled: 0 | 1;
};

export default async function SalesPersonsPage() {
  const rows = await listDocs<SalesPersonRow>("Sales Person", {
    fields: ["name", "parent_sales_person", "employee", "commission_rate", "enabled"],
    limit: 200,
    orderBy: "name asc",
  });

  return (
    <MasterTable
      title="Sales Persons"
      rows={rows}
      newHref="/sales/sales-persons/new"
      rowLink={(row) => `/sales/sales-persons/${encodeURIComponent(row.name)}`}
      emptyLabel="No sales persons yet."
      columns={[
        { key: "name", label: "ID", mono: true },
        { key: "parent_sales_person", label: "Parent" },
        { key: "employee", label: "Employee" },
        { key: "commission_rate", label: "Commission Rate", mono: true },
        {
          key: "enabled",
          label: "Status",
          render: (row) =>
            row.enabled ? <StatusPill label="Enabled" tone="success" /> : <StatusPill label="Disabled" tone="neutral" />,
        },
      ]}
    />
  );
}
