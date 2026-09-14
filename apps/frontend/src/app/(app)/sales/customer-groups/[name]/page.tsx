import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateCustomerGroupAction } from "../actions";

type CustomerGroupDoc = {
  name: string;
  customer_group_name: string;
  parent_customer_group?: string;
  is_group?: 0 | 1;
  default_price_list?: string;
};

export default async function EditCustomerGroupPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: CustomerGroupDoc;
  try {
    doc = await getDoc<CustomerGroupDoc>("Customer Group", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

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
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.customer_group_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updateCustomerGroupAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
