import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateTerritoryAction } from "../actions";

type TerritoryDoc = {
  name: string;
  territory_name: string;
  parent_territory?: string;
  is_group?: 0 | 1;
  territory_manager?: string;
};

export default async function EditTerritoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: TerritoryDoc;
  try {
    doc = await getDoc<TerritoryDoc>("Territory", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [territories, salesPersons] = await Promise.all([
    fetchLinkOptions("Territory"),
    fetchLinkOptions("Sales Person"),
  ]);

  const fields: FieldSpec[] = [
    { kind: "text", id: "territory_name", label: "Territory name", required: true },
    { kind: "link", id: "parent_territory", label: "Parent territory", options: territories },
    { kind: "checkbox", id: "is_group", label: "Is group" },
    { kind: "link", id: "territory_manager", label: "Territory manager", options: salesPersons },
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.territory_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updateTerritoryAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
