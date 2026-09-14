import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createTerritoryAction } from "../actions";

export default async function NewTerritoryPage() {
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
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New territory</h1>
      <MasterForm action={createTerritoryAction} fields={fields} />
    </div>
  );
}
