import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createPriceListAction } from "../actions";

export default async function NewPriceListPage() {
  const currencies = await fetchLinkOptions("Currency");

  const fields: FieldSpec[] = [
    { kind: "text", id: "price_list_name", label: "Price list name", required: true },
    { kind: "link", id: "currency", label: "Currency", options: currencies, required: true },
    { kind: "checkbox", id: "selling", label: "Selling", defaultChecked: true },
    { kind: "checkbox", id: "buying", label: "Buying" },
    { kind: "checkbox", id: "enabled", label: "Enabled", defaultChecked: true },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New price list</h1>
      <MasterForm action={createPriceListAction} fields={fields} />
    </div>
  );
}
