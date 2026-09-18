import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateItemGroupAction } from "../actions";

type ItemGroupDoc = {
  name: string;
  item_group_name: string;
  parent_item_group?: string;
  is_group?: 0 | 1;
};

export default async function EditItemGroupPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: ItemGroupDoc;
  try {
    doc = await getDoc<ItemGroupDoc>("Item Group", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const groups = await fetchLinkOptions("Item Group");

  const fields: FieldSpec[] = [
    { kind: "text", id: "item_group_name", label: "Item group name", required: true },
    { kind: "link", id: "parent_item_group", label: "Parent item group", options: groups },
    { kind: "checkbox", id: "is_group", label: "Is group" },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.item_group_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updateItemGroupAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
