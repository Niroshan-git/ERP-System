import Link from "next/link";
import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { ItemsTable, type ItemRow } from "@/components/ItemsTable";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [itemsPlusOne, totalCount] = await Promise.all([
    listDocs<ItemRow>("Item", {
      fields: [
        "name",
        "item_name",
        "item_group",
        "stock_uom",
        "standard_rate",
        "disabled",
        "is_stock_item",
        "has_batch_no",
        "has_serial_no",
      ],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "modified desc",
    }),
    getCount("Item"),
  ]);
  const { rows: items, hasNextPage } = paginate(itemsPlusOne, pageSize);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Items</h1>
        <Link
          href="/master-data/items/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <ItemsTable items={items} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={items.length}
        totalCount={totalCount}
      />
    </div>
  );
}
