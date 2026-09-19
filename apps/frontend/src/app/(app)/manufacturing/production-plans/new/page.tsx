import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductionPlanCreateForm } from "@/components/ProductionPlanCreateForm";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { getStockDefaults } from "@/lib/stockDefaults";
import { createProductionPlanAction } from "../actions";

export default async function NewProductionPlanPage() {
  const [defaults, customerOptions, projectOptions] = await Promise.all([
    getStockDefaults(),
    fetchLinkOptions("Customer"),
    fetchLinkOptions("Project"),
  ]);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Manufacturing", href: "/manufacturing" },
          { label: "Production Plans", href: "/manufacturing/production-plans" },
          { label: "New" },
        ]}
      />
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New Production Plan</h1>
      <ProductionPlanCreateForm
        action={createProductionPlanAction}
        companies={defaults.companies}
        defaultCompany={defaults.company}
        customerOptions={customerOptions}
        warehouses={defaults.warehouses}
        projectOptions={projectOptions}
      />
    </div>
  );
}
