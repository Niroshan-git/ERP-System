import { ItemForm } from "@/components/ItemForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createItemAction } from "../actions";

export default async function NewItemPage() {
  const [groups, uoms] = await Promise.all([fetchLinkOptions("Item Group"), fetchLinkOptions("UOM")]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New item</h1>
      <ItemForm action={createItemAction} groups={groups} uoms={uoms} />
    </div>
  );
}
