import Link from "next/link";
import { listDocs } from "@/lib/erpnext";
import { StatusPill } from "@/components/StatusPill";

type CustomerRow = {
  name: string;
  customer_name: string;
  customer_type: string;
  customer_group: string | null;
  territory: string | null;
  disabled: 0 | 1;
};

export default async function CustomersPage() {
  const customers = await listDocs<CustomerRow>("Customer", {
    fields: ["name", "customer_name", "customer_type", "customer_group", "territory", "disabled"],
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

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-graphite-500">
              <th className="px-4 py-2.5 font-semibold">ID</th>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Group</th>
              <th className="px-4 py-2.5 font-semibold">Territory</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.name} className="border-b border-border last:border-0 hover:bg-canvas/60">
                <td className="px-4 py-2.5">
                  <Link href={`/sales/customers/${encodeURIComponent(c.name)}`} className="font-mono text-signal hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-graphite-900">{c.customer_name}</td>
                <td className="px-4 py-2.5 text-graphite-500">{c.customer_type}</td>
                <td className="px-4 py-2.5 text-graphite-500">{c.customer_group ?? "—"}</td>
                <td className="px-4 py-2.5 text-graphite-500">{c.territory ?? "—"}</td>
                <td className="px-4 py-2.5">
                  {c.disabled ? (
                    <StatusPill label="Disabled" tone="neutral" />
                  ) : (
                    <StatusPill label="Active" tone="success" />
                  )}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-graphite-500">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
