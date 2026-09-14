import Link from "next/link";
import { listDocs } from "@/lib/erpnext";
import { CustomersTable, type CustomerRow } from "@/components/CustomersTable";

export default async function CustomersPage() {
  const customers = await listDocs<CustomerRow>("Customer", {
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
    limit: 200,
    orderBy: "modified desc",
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-graphite-900">Customers</h1>
        <Link
          href="/sales/customers/new"
          className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
        >
          + New
        </Link>
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
