import { listDocs } from "@/lib/erpnext";
import { MasterTable } from "@/components/MasterTable";
import { StatusPill } from "@/components/StatusPill";

type AddressRow = {
  name: string;
  address_type: string | null;
  city: string | null;
  country: string | null;
  disabled: 0 | 1;
};

export default async function AddressesPage() {
  const rows = await listDocs<AddressRow>("Address", {
    fields: ["name", "address_type", "city", "country", "disabled"],
    limit: 200,
    orderBy: "modified desc",
  });

  return (
    <MasterTable
      title="Addresses"
      rows={rows}
      newHref="/sales/addresses/new"
      rowLink={(row) => `/sales/addresses/${encodeURIComponent(row.name)}`}
      emptyLabel="No addresses yet."
      columns={[
        { key: "name", label: "ID", mono: true },
        { key: "address_type", label: "Type" },
        { key: "city", label: "City" },
        { key: "country", label: "Country" },
        {
          key: "disabled",
          label: "Status",
          render: (row) =>
            row.disabled ? <StatusPill label="Disabled" tone="neutral" /> : <StatusPill label="Active" tone="success" />,
        },
      ]}
    />
  );
}
