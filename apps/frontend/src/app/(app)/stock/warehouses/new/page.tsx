import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createWarehouseAction } from "../actions";

export default async function NewWarehousePage() {
  const [companies, warehouses] = await Promise.all([
    fetchLinkOptions("Company"),
    fetchLinkOptions("Warehouse"),
  ]);

  const fields: FieldSpec[] = [
    { kind: "text", id: "warehouse_name", label: "Warehouse name", required: true },
    { kind: "link", id: "company", label: "Company", options: companies, required: true },
    { kind: "link", id: "parent_warehouse", label: "Parent warehouse", options: warehouses },
    { kind: "checkbox", id: "is_group", label: "Is group" },
    { kind: "checkbox", id: "disabled", label: "Disabled" },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New warehouse</h1>
      <MasterForm action={createWarehouseAction} fields={fields} />
    </div>
  );
}
