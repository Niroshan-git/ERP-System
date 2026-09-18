import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updatePriceListAction } from "../actions";

type PriceListDoc = {
  name: string;
  price_list_name: string;
  currency?: string;
  selling?: 0 | 1;
  buying?: 0 | 1;
  enabled?: 0 | 1;
};

export default async function EditPriceListPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: PriceListDoc;
  try {
    doc = await getDoc<PriceListDoc>("Price List", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

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
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.price_list_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updatePriceListAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
