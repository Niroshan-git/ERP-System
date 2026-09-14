import { listDocs } from "@/lib/erpnext";
import { MasterTable } from "@/components/MasterTable";

type CampaignRow = {
  name: string;
  description: string | null;
};

export default async function CampaignsPage() {
  const rows = await listDocs<CampaignRow>("Campaign", {
    fields: ["name", "description"],
    limit: 200,
    orderBy: "name asc",
  });

  return (
    <MasterTable
      title="Campaigns"
      rows={rows}
      newHref="/sales/campaigns/new"
      rowLink={(row) => `/sales/campaigns/${encodeURIComponent(row.name)}`}
      emptyLabel="No campaigns yet."
      columns={[
        { key: "name", label: "ID", mono: true },
        {
          key: "description",
          label: "Description",
          render: (row) => {
            const text = row.description ?? "";
            return text.length > 80 ? `${text.slice(0, 80)}…` : text || "—";
          },
        },
      ]}
    />
  );
}
