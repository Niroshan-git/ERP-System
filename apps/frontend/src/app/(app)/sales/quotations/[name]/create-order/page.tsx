import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { createSalesOrderFromQuotationAction } from "../../../orders/actions";

type QuotationItemForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /** Real, live ERPNext field — see the doc comment on createSalesOrderFromQuotationAction. */
  ordered_qty?: number;
};

type QuotationForSelection = {
  name: string;
  party_name: string;
  docstatus: number;
  status: string;
  currency: string;
  items: QuotationItemForSelection[];
};

/**
 * Line-selection step in front of "Create Sales Order" — partial acceptance of a
 * Quotation. Linked from the Quotation detail page's Connections tab
 * (ConnectionsPanel's href-based createAction) whenever at least one line still has
 * qty left to order.
 */
export default async function CreateSalesOrderFromQuotationPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const quotationName = decodeURIComponent(name);

  let doc: QuotationForSelection;
  try {
    doc = await getDoc<QuotationForSelection>("Quotation", quotationName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  // `status !== "Lost"` mirrors Desk's own real gate (`quotation.js::refresh`) — ERPNext's
  // `make_sales_order` itself has no server-side guard against mapping a Lost quotation
  // (confirmed live), so this page and createSalesOrderFromQuotationAction's own re-check
  // are the only real enforcement this app provides.
  if (doc.docstatus !== 1 || doc.status === "Lost") {
    redirect(`/sales/quotations/${encodeURIComponent(quotationName)}`);
  }

  const rows: SelectableLineRow[] = doc.items.map((item) => ({
    reference: item.name,
    item_code: item.item_code,
    item_name: item.item_name,
    uom: item.uom,
    rate: item.rate,
    originalQty: item.qty,
    remainingQty: item.qty - (item.ordered_qty ?? 0),
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Selling", href: "/sales/quotations" },
          { label: "Quotation", href: "/sales/quotations" },
          { label: quotationName, href: `/sales/quotations/${encodeURIComponent(quotationName)}` },
          { label: "Create Sales Order" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Sales Order</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Quotation <span className="font-mono">{quotationName}</span> — select which lines and how much of each
        to order now. Lines already fully ordered are shown disabled; you can create another Sales Order later for
        whatever&apos;s left.
      </p>
      <LineSelectionEditor
        action={createSalesOrderFromQuotationAction.bind(null, quotationName)}
        rows={rows}
        currency={doc.currency}
        submitLabel="Create Sales Order"
        pendingLabel="Creating…"
      />
    </div>
  );
}
