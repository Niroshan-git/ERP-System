import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type SalesPartnerRow = {
  name: string;
  partner_type: string | null;
  territory: string | null;
  commission_rate: number | null;
};

export default async function SalesPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<SalesPartnerRow>("Sales Partner", {
      fields: ["name", "partner_type", "territory", "commission_rate"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "name asc",
    }),
    getCount("Sales Partner"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Sales Partners"
        rows={rows}
        newHref="/sales/sales-partners/new"
        rowLink={(row) => `/sales/sales-partners/${encodeURIComponent(row.name)}`}
        emptyLabel="No sales partners yet."
        columns={[
          { key: "name", label: "ID", mono: true },
          { key: "partner_type", label: "Partner Type" },
          { key: "territory", label: "Territory" },
          { key: "commission_rate", label: "Commission Rate", mono: true },
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
