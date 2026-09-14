import { listDocs } from "@/lib/erpnext";
import { MasterTable } from "@/components/MasterTable";
import { StatusPill } from "@/components/StatusPill";

type PriceListRow = {
  name: string;
  currency: string | null;
  selling: 0 | 1;
  buying: 0 | 1;
  enabled: 0 | 1;
};

export default async function PriceListsPage() {
  const rows = await listDocs<PriceListRow>("Price List", {
    fields: ["name", "currency", "selling", "buying", "enabled"],
    limit: 200,
    orderBy: "name asc",
  });

  return (
    <MasterTable
      title="Price Lists"
      rows={rows}
      newHref="/sales/price-lists/new"
      rowLink={(row) => `/sales/price-lists/${encodeURIComponent(row.name)}`}
      emptyLabel="No price lists yet."
      columns={[
        { key: "name", label: "ID", mono: true },
        { key: "currency", label: "Currency" },
        {
          key: "selling",
          label: "Selling / Buying",
          render: (row) => [row.selling ? "Selling" : null, row.buying ? "Buying" : null].filter(Boolean).join(", ") || "—",
        },
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
