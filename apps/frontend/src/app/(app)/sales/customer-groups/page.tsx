import { listDocs } from "@/lib/erpnext";
import { MasterTable } from "@/components/MasterTable";

type CustomerGroupRow = {
  name: string;
  parent_customer_group: string | null;
  is_group: 0 | 1;
  default_price_list: string | null;
};

export default async function CustomerGroupsPage() {
  const rows = await listDocs<CustomerGroupRow>("Customer Group", {
    fields: ["name", "parent_customer_group", "is_group", "default_price_list"],
    limit: 200,
    orderBy: "name asc",
  });

  return (
    <MasterTable
      title="Customer Groups"
      rows={rows}
      newHref="/sales/customer-groups/new"
      rowLink={(row) => `/sales/customer-groups/${encodeURIComponent(row.name)}`}
      emptyLabel="No customer groups yet."
      columns={[
        { key: "name", label: "ID", mono: true },
        { key: "parent_customer_group", label: "Parent Group" },
        { key: "is_group", label: "Is Group", render: (row) => (row.is_group ? "Yes" : "No") },
        { key: "default_price_list", label: "Default Price List" },
      ]}
    />
  );
}
