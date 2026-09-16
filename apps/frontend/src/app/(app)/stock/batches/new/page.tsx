import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createBatchAction } from "../actions";

export default async function NewBatchPage() {
  const items = await fetchLinkOptions("Item");

  const fields: FieldSpec[] = [
    { kind: "link", id: "item", label: "Item", options: items, required: true },
    {
      kind: "text",
      id: "batch_id",
      label: "Batch ID",
      placeholder: "Leave blank if the item has an automatic batch naming series",
    },
    { kind: "date", id: "expiry_date", label: "Expiry date" },
    { kind: "checkbox", id: "disabled", label: "Disabled" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New batch</h1>
      <MasterForm action={createBatchAction} fields={fields} />
    </div>
  );
}
