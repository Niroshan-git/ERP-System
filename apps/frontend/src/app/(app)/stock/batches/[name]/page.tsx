import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateBatchAction } from "../actions";

type BatchDoc = {
  name: string;
  item: string;
  batch_id?: string;
  expiry_date?: string;
  disabled?: 0 | 1;
};

export default async function EditBatchPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: BatchDoc;
  try {
    doc = await getDoc<BatchDoc>("Batch", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const items = await fetchLinkOptions("Item");

  // batch_id isn't editable here — it's the Batch doctype's own name/primary key, immutable
  // after creation (see actions.ts's updateBatchAction, which drops it from the payload).
  const fields: FieldSpec[] = [
    { kind: "link", id: "item", label: "Item", options: items, required: true },
    { kind: "date", id: "expiry_date", label: "Expiry date" },
    { kind: "checkbox", id: "disabled", label: "Disabled" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.name}</h1>
      <p className="mb-4 text-xs text-graphite-500">{doc.item}</p>
      <MasterForm action={updateBatchAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
