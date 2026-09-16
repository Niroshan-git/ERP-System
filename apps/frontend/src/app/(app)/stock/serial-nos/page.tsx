import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type SerialNoRow = {
  name: string;
  item_code: string;
  warehouse: string | null;
  status: string | null;
  company: string | null;
};

/**
 * Most Serial Nos in practice get auto-created by Stock Entry/Purchase Receipt submission
 * (see actions.ts's doc comment) — this list shows every Serial No regardless of source,
 * not just the ones manually registered here.
 */
export default async function SerialNosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<SerialNoRow>("Serial No", {
      fields: ["name", "item_code", "warehouse", "status", "company"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "creation desc",
    }),
    getCount("Serial No"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Serial Nos"
        rows={rows}
        newHref="/stock/serial-nos/new"
        rowLink={(row) => `/stock/serial-nos/${encodeURIComponent(row.name)}`}
        emptyLabel="No serial numbers yet."
        columns={[
          { key: "name", label: "Serial No", mono: true },
          { key: "item_code", label: "Item" },
          { key: "warehouse", label: "Warehouse" },
          { key: "status", label: "Status" },
          { key: "company", label: "Company" },
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
