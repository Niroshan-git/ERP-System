import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type ItemGroupRow = {
  name: string;
  parent_item_group: string | null;
  is_group: 0 | 1;
};

export default async function ItemGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<ItemGroupRow>("Item Group", {
      fields: ["name", "parent_item_group", "is_group"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "name asc",
    }),
    getCount("Item Group"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Item Groups"
        rows={rows}
        newHref="/master-data/item-groups/new"
        rowLink={(row) => `/master-data/item-groups/${encodeURIComponent(row.name)}`}
        emptyLabel="No item groups yet."
        columns={[
          { key: "name", label: "ID", mono: true },
          { key: "parent_item_group", label: "Parent Item Group" },
          { key: "is_group", label: "Is Group", render: (row) => (row.is_group ? "Yes" : "No") },
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
