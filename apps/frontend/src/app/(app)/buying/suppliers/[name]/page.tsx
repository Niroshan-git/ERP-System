import { notFound } from "next/navigation";
import { SupplierForm } from "@/components/SupplierForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateSupplierAction } from "../actions";

type SupplierDoc = {
  name: string;
  supplier_name: string;
  supplier_type: string;
  supplier_group?: string;
  country?: string;
  disabled: 0 | 1;
};

export default async function EditSupplierPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let supplier: SupplierDoc;
  try {
    supplier = await getDoc<SupplierDoc>("Supplier", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [groups, countries] = await Promise.all([
    fetchLinkOptions("Supplier Group"),
    fetchLinkOptions("Country"),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{supplier.supplier_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{supplier.name}</p>
      <SupplierForm
        action={updateSupplierAction.bind(null, supplier.name)}
        groups={groups}
        countries={countries}
        initial={supplier}
      />
    </div>
  );
}
