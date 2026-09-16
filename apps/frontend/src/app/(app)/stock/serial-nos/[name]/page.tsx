import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateSerialNoAction } from "../actions";

type SerialNoDoc = {
  name: string;
  item_code: string;
  warehouse?: string;
  status?: string;
  company: string;
};

const STATUS_OPTIONS = ["Active", "Inactive", "Consumed", "Delivered", "Expired"];

export default async function EditSerialNoPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: SerialNoDoc;
  try {
    doc = await getDoc<SerialNoDoc>("Serial No", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [items, warehouses, companies] = await Promise.all([
    fetchLinkOptions("Item"),
    fetchLinkOptions("Warehouse"),
    fetchLinkOptions("Company"),
  ]);

  // serial_no isn't editable here — it's the doctype's own name/primary key.
  const fields: FieldSpec[] = [
    { kind: "link", id: "item_code", label: "Item", options: items, required: true },
    { kind: "link", id: "company", label: "Company", options: companies, required: true },
    { kind: "link", id: "warehouse", label: "Warehouse", options: warehouses },
    { kind: "select", id: "status", label: "Status", options: STATUS_OPTIONS },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.name}</h1>
      <p className="mb-4 text-xs text-graphite-500">{doc.item_code}</p>
      <MasterForm action={updateSerialNoAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
