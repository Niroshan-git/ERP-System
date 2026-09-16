import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type CustomerGroupRow = {
  name: string;
  parent_customer_group: string | null;
  is_group: 0 | 1;
  default_price_list: string | null;
};

export default async function CustomerGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<CustomerGroupRow>("Customer Group", {
      fields: ["name", "parent_customer_group", "is_group", "default_price_list"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "name asc",
    }),
    getCount("Customer Group"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Customer Groups"
        rows={rows}
        newHref="/sales/customer-groups/new"
        rowLink={(row) => `/sales/customer-groups/${encodeURIComponent(row.name)}`}
        emptyLabel="No customer groups yet."
        columns={[
          { key: "name", label: "ID", mono: true },
          { key: "parent_customer_group", label: "Parent Group" },
          { key: "is_group", label: "Is Group", render: (row) => (row.is_group ? "Yes" : "No") },
          { key: "default_price_list", label: "Default Price List" },
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
