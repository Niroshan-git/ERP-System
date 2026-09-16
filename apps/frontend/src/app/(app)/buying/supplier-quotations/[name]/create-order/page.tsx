import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PurchaseOrderForm } from "@/components/PurchaseOrderForm";
import type { LineRow } from "@/components/LineItemsEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { getBuyingDefaults } from "@/lib/buyingDefaults";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { createPurchaseOrderFromSupplierQuotationAction } from "../../../purchase-orders/actions";

type SupplierQuotationItemForPO = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
};

type SupplierQuotationForPO = {
  name: string;
  supplier: string;
  supplier_name?: string;
  company: string;
  docstatus: number;
  items: SupplierQuotationItemForPO[];
};

/**
 * Supplier Quotation, like Material Request/RFQ, has no native "partially converted"
 * concept in this app — every line is copied at its full quantity into a pre-filled, still-
 * editable PurchaseOrderForm (rate/qty/schedule_date can all be adjusted before saving),
 * reusing the real form component the same way purchase-orders/[name]/page.tsx's own edit
 * form already does, rather than a dedicated LineSelectionEditor-style partial picker
 * (Sales' Quotation -> Sales Order flow needs one for partial acceptance; this doesn't).
 *
 * Each row is tagged with `supplier_quotation_item`/`source_supplier_quotation` (see
 * LineItemsEditor's LineRow type) so createPurchaseOrderFromSupplierQuotationAction can
 * carry the real `supplier_quotation`/`supplier_quotation_item` back-reference fields
 * through to the created Purchase Order Item — required for lib/connections.ts's own
 * Supplier Quotation -> Purchase Order connection and lib/buyingRelationshipMap.ts's own
 * upstream walk to work.
 *
 * The supplier picker is restricted to just this quotation's own supplier (not the full
 * Supplier list) — a Purchase Order created from this flow should stay tied to the supplier
 * that actually quoted, mirroring how CreateSupplierQuotationForm restricts its own supplier
 * picker to just the source RFQ's suppliers rather than every Supplier in the system.
 *
 * Supplier Quotation Item has no per-line schedule_date of its own (unlike Material Request
 * Item/Purchase Order Item) — same "no natural source field" gap
 * createSalesOrderFromQuotationAction hit for delivery_date on the Sales side, resolved the
 * same way: defaults every row (and the header "Required by" field) to one week out, still
 * fully editable before saving.
 */
export default async function CreatePurchaseOrderFromSupplierQuotationPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const supplierQuotationName = decodeURIComponent(name);

  let doc: SupplierQuotationForPO;
  try {
    doc = await getDoc<SupplierQuotationForPO>("Supplier Quotation", supplierQuotationName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.docstatus !== 1) {
    redirect(`/buying/supplier-quotations/${encodeURIComponent(supplierQuotationName)}`);
  }

  const [defaults, itemOptions] = await Promise.all([getBuyingDefaults(doc.company), listItemOptions()]);

  const today = new Date();
  const requiredBy = new Date(today);
  requiredBy.setDate(requiredBy.getDate() + 7);
  const defaultScheduleDate = requiredBy.toISOString().slice(0, 10);

  const initialItems: LineRow[] = doc.items.map((i) => ({
    item_code: i.item_code,
    item_name: i.item_name,
    qty: i.qty,
    uom: i.uom,
    rate: i.rate,
    schedule_date: defaultScheduleDate,
    supplier_quotation_item: i.name,
    source_supplier_quotation: doc.name,
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Buying", href: "/buying/supplier-quotations" },
          { label: "Supplier Quotation", href: "/buying/supplier-quotations" },
          {
            label: supplierQuotationName,
            href: `/buying/supplier-quotations/${encodeURIComponent(supplierQuotationName)}`,
          },
          { label: "Create Purchase Order" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Purchase Order</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Supplier Quotation <span className="font-mono">{supplierQuotationName}</span> — every item line is
        copied at its full quantity and rate; adjust anything before saving.
      </p>

      <PurchaseOrderForm
        action={createPurchaseOrderFromSupplierQuotationAction.bind(null, supplierQuotationName)}
        itemOptions={itemOptions}
        suppliers={[doc.supplier]}
        companies={defaults.companies}
        currency={defaults.currency}
        initial={{
          supplier: doc.supplier,
          transaction_date: today.toISOString().slice(0, 10),
          schedule_date: defaultScheduleDate,
          company: doc.company,
          items: initialItems,
        }}
      />
    </div>
  );
}
