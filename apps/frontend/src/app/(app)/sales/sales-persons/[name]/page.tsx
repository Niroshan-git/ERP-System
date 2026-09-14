import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateSalesPersonAction } from "../actions";

type SalesPersonDoc = {
  name: string;
  sales_person_name: string;
  parent_sales_person?: string;
  is_group?: 0 | 1;
  enabled?: 0 | 1;
  commission_rate?: string;
  employee?: string;
};

export default async function EditSalesPersonPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: SalesPersonDoc;
  try {
    doc = await getDoc<SalesPersonDoc>("Sales Person", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

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
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.sales_person_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <MasterForm action={updateSalesPersonAction.bind(null, doc.name)} fields={fields} initial={doc} />
    </div>
  );
}
