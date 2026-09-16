import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type BatchRow = {
  name: string;
  item: string;
  expiry_date: string | null;
  disabled: 0 | 1;
};

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<BatchRow>("Batch", {
      fields: ["name", "item", "expiry_date", "disabled"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "creation desc",
    }),
    getCount("Batch"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Batches"
        rows={rows}
        newHref="/stock/batches/new"
        rowLink={(row) => `/stock/batches/${encodeURIComponent(row.name)}`}
        emptyLabel="No batches yet."
        columns={[
          { key: "name", label: "Batch ID", mono: true },
          { key: "item", label: "Item" },
          { key: "expiry_date", label: "Expiry Date", mono: true },
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
