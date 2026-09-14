import { listDocs } from "@/lib/erpnext";
import { MasterTable } from "@/components/MasterTable";

type SalesPartnerRow = {
  name: string;
  partner_type: string | null;
  territory: string | null;
  commission_rate: number | null;
};

export default async function SalesPartnersPage() {
  const rows = await listDocs<SalesPartnerRow>("Sales Partner", {
    fields: ["name", "partner_type", "territory", "commission_rate"],
    limit: 200,
    orderBy: "name asc",
  });

  return (
    <MasterTable
      title="Sales Partners"
      rows={rows}
      newHref="/sales/sales-partners/new"
      rowLink={(row) => `/sales/sales-partners/${encodeURIComponent(row.name)}`}
      emptyLabel="No sales partners yet."
      columns={[
        { key: "name", label: "ID", mono: true },
        { key: "partner_type", label: "Partner Type" },
        { key: "territory", label: "Territory" },
        { key: "commission_rate", label: "Commission Rate", mono: true },
      ]}
    />
  );
}
