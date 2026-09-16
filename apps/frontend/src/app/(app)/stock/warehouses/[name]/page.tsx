import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateWarehouseAction } from "../actions";

type WarehouseDoc = {
  name: string;
  warehouse_name: string;
  company: string;
  parent_warehouse?: string;
  is_group?: 0 | 1;
  disabled?: 0 | 1;
};

export default async function EditWarehousePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: WarehouseDoc;
  try {
    doc = await getDoc<WarehouseDoc>("Warehouse", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

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
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.warehouse_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updateWarehouseAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
