import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type TerritoryRow = {
  name: string;
  parent_territory: string | null;
  is_group: 0 | 1;
  territory_manager: string | null;
};

export default async function TerritoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<TerritoryRow>("Territory", {
      fields: ["name", "parent_territory", "is_group", "territory_manager"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "name asc",
    }),
    getCount("Territory"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
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
