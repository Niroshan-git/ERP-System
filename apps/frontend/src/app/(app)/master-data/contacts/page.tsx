import { getCount, listDocs } from "@/lib/erpnext";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type ContactRow = {
  name: string;
  first_name: string | null;
  last_name: string | null;
  email_id: string | null;
  phone: string | null;
  mobile_no: string | null;
  company_name: string | null;
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rowsPlusOne, totalCount] = await Promise.all([
    listDocs<ContactRow>("Contact", {
      fields: ["name", "first_name", "last_name", "email_id", "phone", "mobile_no", "company_name"],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "modified desc",
    }),
    getCount("Contact"),
  ]);
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <>
      <MasterTable
        title="Contacts"
        rows={rows}
        newHref="/master-data/contacts/new"
        rowLink={(row) => `/master-data/contacts/${encodeURIComponent(row.name)}`}
        emptyLabel="No contacts yet."
        columns={[
          { key: "name", label: "ID", mono: true },
          {
            key: "first_name",
            label: "Name",
            render: (row) => [row.first_name, row.last_name].filter(Boolean).join(" ") || "—",
          },
          { key: "email_id", label: "Email" },
          {
            key: "phone",
            label: "Phone",
            render: (row) => row.phone || row.mobile_no || "—",
          },
          { key: "company_name", label: "Company" },
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
