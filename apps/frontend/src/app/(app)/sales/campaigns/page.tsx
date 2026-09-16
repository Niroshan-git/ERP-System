import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type CampaignRow = {
  name: string;
  description: string | null;
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<CampaignRow>("Campaign", {
      fields: ["name", "description"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "name asc",
    }),
    getCount("Campaign"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
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
        startIndex={startIndex}
      />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={rows.length}
        totalCount={totalCount}
      />
    </>
  );
}
