import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/CustomerForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateCustomerAction } from "../actions";

type CustomerDoc = {
  name: string;
  customer_name: string;
  customer_type: string;
  customer_group?: string;
  territory?: string;
  disabled: 0 | 1;
};

export default async function EditCustomerPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let customer: CustomerDoc;
  try {
    customer = await getDoc<CustomerDoc>("Customer", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [groups, territories] = await Promise.all([
    fetchLinkOptions("Customer Group"),
    fetchLinkOptions("Territory"),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{customer.customer_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{customer.name}</p>
      <CustomerForm
        action={updateCustomerAction.bind(null, customer.name)}
        groups={groups}
        territories={territories}
        initial={customer}
      />
    </div>
  );
}
