import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";
import { StatusPill } from "@/components/StatusPill";

type AddressRow = {
  name: string;
  address_type: string | null;
  city: string | null;
  country: string | null;
  disabled: 0 | 1;
};

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<AddressRow>("Address", {
      fields: ["name", "address_type", "city", "country", "disabled"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "modified desc",
    }),
    getCount("Address"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Addresses"
        rows={rows}
        newHref="/master-data/addresses/new"
        rowLink={(row) => `/master-data/addresses/${encodeURIComponent(row.name)}`}
        emptyLabel="No addresses yet."
        columns={[
          { key: "name", label: "ID", mono: true },
          { key: "address_type", label: "Type" },
          { key: "city", label: "City" },
          { key: "country", label: "Country" },
          {
            key: "disabled",
            label: "Status",
            render: (row) =>
              row.disabled ? <StatusPill label="Disabled" tone="neutral" /> : <StatusPill label="Active" tone="success" />,
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
