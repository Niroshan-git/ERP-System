import { listDocs } from "@/lib/erpnext";
import { MasterTable } from "@/components/MasterTable";

type TerritoryRow = {
  name: string;
  parent_territory: string | null;
  is_group: 0 | 1;
  territory_manager: string | null;
};

export default async function TerritoriesPage() {
  const rows = await listDocs<TerritoryRow>("Territory", {
    fields: ["name", "parent_territory", "is_group", "territory_manager"],
    limit: 200,
    orderBy: "name asc",
  });

  return (
    <MasterTable
      title="Territories"
      rows={rows}
      newHref="/sales/territories/new"
      rowLink={(row) => `/sales/territories/${encodeURIComponent(row.name)}`}
      emptyLabel="No territories yet."
      columns={[
        { key: "name", label: "ID", mono: true },
        { key: "parent_territory", label: "Parent Territory" },
        { key: "is_group", label: "Is Group", render: (row) => (row.is_group ? "Yes" : "No") },
        { key: "territory_manager", label: "Territory Manager" },
      ]}
    />
  );
}
