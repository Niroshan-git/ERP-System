import { MaterialRequestForm } from "@/components/MaterialRequestForm";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createMaterialRequestAction } from "../actions";

export default async function NewMaterialRequestPage() {
  const [itemOptions, companies] = await Promise.all([listItemOptions(), fetchLinkOptions("Company")]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New material request</h1>
      <MaterialRequestForm action={createMaterialRequestAction} itemOptions={itemOptions} companies={companies ?? []} />
    </div>
  );
}
