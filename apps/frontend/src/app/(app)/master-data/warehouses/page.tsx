import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type WarehouseRow = {
  name: string;
  warehouse_name: string;
  parent_warehouse: string | null;
  is_group: 0 | 1;
  disabled: 0 | 1;
};

/** Flat list, no tree/indent UI — per the plan's "simplified" instruction, matching the
 * CustomerGroup/ItemGroup master pattern rather than building a real hierarchy view. */
export default async function WarehousesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<WarehouseRow>("Warehouse", {
      fields: ["name", "warehouse_name", "parent_warehouse", "is_group", "disabled"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "name asc",
    }),
    getCount("Warehouse"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Warehouses"
        rows={rows}
        newHref="/master-data/warehouses/new"
        rowLink={(row) => `/master-data/warehouses/${encodeURIComponent(row.name)}`}
        emptyLabel="No warehouses yet."
        columns={[
          { key: "name", label: "ID", mono: true },
          { key: "warehouse_name", label: "Warehouse Name" },
          { key: "parent_warehouse", label: "Parent Warehouse" },
          { key: "is_group", label: "Is Group", render: (row) => (row.is_group ? "Yes" : "No") },
          { key: "disabled", label: "Disabled", render: (row) => (row.disabled ? "Yes" : "No") },
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
