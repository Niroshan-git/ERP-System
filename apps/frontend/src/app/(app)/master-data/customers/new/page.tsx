import { CustomerForm } from "@/components/CustomerForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createCustomerAction } from "../actions";

export default async function NewCustomerPage() {
  const [groups, territories] = await Promise.all([
    fetchLinkOptions("Customer Group"),
    fetchLinkOptions("Territory"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New customer</h1>
      <CustomerForm action={createCustomerAction} groups={groups} territories={territories} />
    </div>
  );
}
