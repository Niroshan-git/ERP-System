import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function NewSalesReturnPage() {
  async function handleSubmit(formData: FormData) {
    "use server";
    const name = formData.get("dnName") as string;
    if (!name) return;
    redirect(`/sales/delivery-notes/${encodeURIComponent(name)}/create-return`);
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Selling", href: "/sales/returns" },
          { label: "Sales Returns", href: "/sales/returns" },
          { label: "New" },
        ]}
      />
      <div className="mx-auto mt-8 max-w-xl">
        <h1 className="mb-6 text-2xl font-medium text-graphite-900">Create Sales Return</h1>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <p className="mb-4 text-sm text-graphite-700">
            A Sales Return must be created against an existing Delivery Note. 
            Enter the Delivery Note ID below to proceed.
          </p>
          <form action={handleSubmit} className="flex gap-2">
            <input
              type="text"
              name="dnName"
              placeholder="e.g. MAT-DN-2026-00001"
              required
              className="flex-1 rounded-md border border-border bg-canvas px-3 py-2 text-sm text-graphite-900 focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
            <button
              type="submit"
              className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
