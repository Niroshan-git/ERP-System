import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createCustomerGroupAction } from "../actions";

export default async function NewCustomerGroupPage() {
  const [groups, priceLists] = await Promise.all([
    fetchLinkOptions("Customer Group"),
    fetchLinkOptions("Price List"),
  ]);

  const fields: FieldSpec[] = [
    { kind: "text", id: "customer_group_name", label: "Customer group name", required: true },
    { kind: "link", id: "parent_customer_group", label: "Parent customer group", options: groups },
    { kind: "checkbox", id: "is_group", label: "Is group" },
    { kind: "link", id: "default_price_list", label: "Default price list", options: priceLists },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New customer group</h1>
      <MasterForm action={createCustomerGroupAction} fields={fields} />
    </div>
  );
}
