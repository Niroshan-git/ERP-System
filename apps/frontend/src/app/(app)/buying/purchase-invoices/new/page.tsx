import { PurchaseInvoiceForm } from "@/components/PurchaseInvoiceForm";
import { getBuyingDefaults } from "@/lib/buyingDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createPurchaseInvoiceAction } from "../actions";

/**
 * Purchase Invoice is creatable standalone here — same as Sales Invoice has both this
 * standalone `new/` AND create-from-source routes (from Purchase Order and from Purchase
 * Receipt, see those doctypes' own create-invoice sub-routes).
 */
export default async function NewPurchaseInvoicePage() {
  const [defaults, itemOptions, suppliers] = await Promise.all([
    getBuyingDefaults(),
    listItemOptions(),
    fetchLinkOptions("Supplier"),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New purchase invoice</h1>
      <PurchaseInvoiceForm
        action={createPurchaseInvoiceAction}
        itemOptions={itemOptions}
        suppliers={suppliers}
        companies={defaults.companies}
        currency={defaults.currency}
        payableAccount={defaults.defaultPayableAccount}
      />
    </div>
  );
}
