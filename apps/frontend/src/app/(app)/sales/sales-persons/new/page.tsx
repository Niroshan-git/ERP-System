import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createSalesPersonAction } from "../actions";

export default async function NewSalesPersonPage() {
  const [salesPersons, employees] = await Promise.all([
    fetchLinkOptions("Sales Person"),
    fetchLinkOptions("Employee"),
  ]);

  const fields: FieldSpec[] = [
    { kind: "text", id: "sales_person_name", label: "Sales person name", required: true },
    { kind: "link", id: "parent_sales_person", label: "Parent sales person", options: salesPersons },
    { kind: "checkbox", id: "is_group", label: "Is group" },
    { kind: "checkbox", id: "enabled", label: "Enabled", defaultChecked: true },
    { kind: "text", id: "commission_rate", label: "Commission rate" },
    { kind: "link", id: "employee", label: "Employee", options: employees },
  ];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New sales person</h1>
      <MasterForm action={createSalesPersonAction} fields={fields} />
    </div>
  );
}
