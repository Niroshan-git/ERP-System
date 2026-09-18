import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createItemGroupAction } from "../actions";

export default async function NewItemGroupPage() {
  const groups = await fetchLinkOptions("Item Group");

  const fields: FieldSpec[] = [
    { kind: "text", id: "item_group_name", label: "Item group name", required: true },
    { kind: "link", id: "parent_item_group", label: "Parent item group", options: groups },
    { kind: "checkbox", id: "is_group", label: "Is group" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New item group</h1>
      <MasterForm action={createItemGroupAction} fields={fields} />
    </div>
  );
}
