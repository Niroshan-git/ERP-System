import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";
import { StatusPill } from "@/components/StatusPill";

type PriceListRow = {
  name: string;
  currency: string | null;
  selling: 0 | 1;
  buying: 0 | 1;
  enabled: 0 | 1;
};

export default async function PriceListsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<PriceListRow>("Price List", {
      fields: ["name", "currency", "selling", "buying", "enabled"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "name asc",
    }),
    getCount("Price List"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Price Lists"
        rows={rows}
        newHref="/master-data/price-lists/new"
        rowLink={(row) => `/master-data/price-lists/${encodeURIComponent(row.name)}`}
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
