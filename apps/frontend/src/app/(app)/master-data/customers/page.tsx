import Link from "next/link";
import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { CustomersTable, type CustomerRow } from "@/components/CustomersTable";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [customersPlusOne, totalCount] = await Promise.all([
    listDocs<CustomerRow>("Customer", {
      fields: [
        "name",
        "customer_name",
        "customer_type",
        "customer_group",
        "territory",
        "disabled",
        "mobile_no",
        "email_id",
        "default_currency",
      ],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "modified desc",
    }),
    getCount("Customer"),
  ]);
  const { rows: customers, hasNextPage } = paginate(customersPlusOne, pageSize);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Customers</h1>
        <Link
          href="/master-data/customers/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <CustomersTable customers={customers} startIndex={startIndex} />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={customers.length}
        totalCount={totalCount}
      />
    </div>
  );
}
