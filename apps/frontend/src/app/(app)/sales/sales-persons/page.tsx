import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";
import { StatusPill } from "@/components/StatusPill";

type SalesPersonRow = {
  name: string;
  parent_sales_person: string | null;
  employee: string | null;
  commission_rate: string | null;
  enabled: 0 | 1;
};

export default async function SalesPersonsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<SalesPersonRow>("Sales Person", {
      fields: ["name", "parent_sales_person", "employee", "commission_rate", "enabled"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "name asc",
    }),
    getCount("Sales Person"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Sales Persons"
        rows={rows}
        newHref="/sales/sales-persons/new"
        rowLink={(row) => `/sales/sales-persons/${encodeURIComponent(row.name)}`}
        emptyLabel="No sales persons yet."
        columns={[
          { key: "name", label: "ID", mono: true },
          { key: "parent_sales_person", label: "Parent" },
          { key: "employee", label: "Employee" },
          { key: "commission_rate", label: "Commission Rate", mono: true },
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
