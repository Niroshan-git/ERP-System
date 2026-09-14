import { listDocs } from "@/lib/erpnext";
import { MasterTable } from "@/components/MasterTable";

type ItemGroupRow = {
  name: string;
  parent_item_group: string | null;
  is_group: 0 | 1;
};

export default async function ItemGroupsPage() {
  const rows = await listDocs<ItemGroupRow>("Item Group", {
    fields: ["name", "parent_item_group", "is_group"],
    limit: 200,
    orderBy: "name asc",
  });

  return (
    <MasterTable
      title="Item Groups"
      rows={rows}
      newHref="/sales/item-groups/new"
      rowLink={(row) => `/sales/item-groups/${encodeURIComponent(row.name)}`}
      emptyLabel="No item groups yet."
      columns={[
        { key: "name", label: "ID", mono: true },
        { key: "parent_item_group", label: "Parent Item Group" },
        { key: "is_group", label: "Is Group", render: (row) => (row.is_group ? "Yes" : "No") },
      ]}
    />
  );
}
