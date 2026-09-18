import { SupplierForm } from "@/components/SupplierForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createSupplierAction } from "../actions";

export default async function NewSupplierPage() {
  const [groups, countries] = await Promise.all([
    fetchLinkOptions("Supplier Group"),
    fetchLinkOptions("Country"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New supplier</h1>
      <SupplierForm action={createSupplierAction} groups={groups} countries={countries} />
    </div>
  );
}
