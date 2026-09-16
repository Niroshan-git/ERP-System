import Link from "next/link";
import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { SuppliersTable, type SupplierRow } from "@/components/SuppliersTable";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [suppliersPlusOne, totalCount] = await Promise.all([
    listDocs<SupplierRow>("Supplier", {
      fields: [
        "name",
        "supplier_name",
        "supplier_type",
        "supplier_group",
        "country",
        "disabled",
        "mobile_no",
        "email_id",
        "default_currency",
      ],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "modified desc",
    }),
    getCount("Supplier"),
  ]);
  const { rows: suppliers, hasNextPage } = paginate(suppliersPlusOne, pageSize);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Suppliers</h1>
        <Link
          href="/buying/suppliers/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <SuppliersTable suppliers={suppliers} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={suppliers.length}
        totalCount={totalCount}
      />
    </div>
  );
}
