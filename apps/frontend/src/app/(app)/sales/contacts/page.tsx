import { listDocs } from "@/lib/erpnext";
import { MasterTable } from "@/components/MasterTable";

type ContactRow = {
  name: string;
  first_name: string | null;
  last_name: string | null;
  email_id: string | null;
  phone: string | null;
  mobile_no: string | null;
  company_name: string | null;
};

export default async function ContactsPage() {
  const rows = await listDocs<ContactRow>("Contact", {
    fields: ["name", "first_name", "last_name", "email_id", "phone", "mobile_no", "company_name"],
    limit: 200,
    orderBy: "modified desc",
  });

  return (
    <MasterTable
      title="Contacts"
      rows={rows}
      newHref="/sales/contacts/new"
      rowLink={(row) => `/sales/contacts/${encodeURIComponent(row.name)}`}
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
    />
  );
}
