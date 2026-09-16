import { PurchaseOrderForm } from "@/components/PurchaseOrderForm";
import { getBuyingDefaults } from "@/lib/buyingDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createPurchaseOrderAction } from "../actions";

/**
 * Purchase Order is creatable standalone here — unlike Request for Quotation/Supplier
 * Quotation (only reachable from a submitted Material Request/RFQ), a real ERPNext
 * Purchase Order can be raised directly against a Supplier with no upstream document at
 * all, same as Sales Order has both this standalone `new/` AND a create-from-Quotation
 * route (see /sales/orders/new and /sales/quotations/[name]/create-order).
 */
export default async function NewPurchaseOrderPage() {
  const [defaults, itemOptions, suppliers] = await Promise.all([
    getBuyingDefaults(),
    listItemOptions(),
    fetchLinkOptions("Supplier"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New purchase order</h1>
      <PurchaseOrderForm
        action={createPurchaseOrderAction}
        itemOptions={itemOptions}
        suppliers={suppliers}
        companies={defaults.companies}
        currency={defaults.currency}
      />
    </div>
  );
}
