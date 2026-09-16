import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineSelectionEditor, type SelectableLineRow } from "@/components/LineSelectionEditor";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { createDeliveryNoteFromPickListAction } from "../../actions";

type PickListLocationForSelection = {
  name: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  qty: number;
  picked_qty: number;
  /** Real, live stored Float field on Pick List Item — see the doc comment on
   * createDeliveryNoteFromPickListAction. */
  delivered_qty?: number;
  uom: string;
  sales_order?: string;
  sales_order_item?: string;
};

type PickListForSelection = {
  name: string;
  docstatus: number;
  currency?: string;
  locations: PickListLocationForSelection[];
};

type SalesOrderRateLookup = { name: string; currency: string; items: { name: string; rate: number }[] };

/**
 * Line-selection step in front of "Create Delivery Note" from a Submitted Pick List.
 * Sibling to sales/orders/[name]/create-delivery/page.tsx, but sourced from the Pick
 * List's own `locations` (already resolved to a specific warehouse) instead of the Sales
 * Order's items directly — remaining-to-deliver per line is `picked_qty - delivered_qty`.
 *
 * Pick List Item has no `rate` of its own (it's a stock document, not a valued one), so
 * rate is looked up from the linked Sales Order Item via `sales_order_item`, the same
 * reference createDeliveryNoteFromPickListAction uses server-side.
 */
export default async function CreateDeliveryNoteFromPickListPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const pickListName = decodeURIComponent(name);

  let doc: PickListForSelection;
  try {
    doc = await getDoc<PickListForSelection>("Pick List", pickListName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.docstatus !== 1) {
    redirect(`/sales/pick-lists/${encodeURIComponent(pickListName)}`);
  }

  const sourceSalesOrder = doc.locations.find((l) => l.sales_order)?.sales_order;
  const [salesOrder, itemFlags] = await Promise.all([
    sourceSalesOrder
      ? getDoc<SalesOrderRateLookup>("Sales Order", sourceSalesOrder).catch(() => null)
      : Promise.resolve(null),
    listDocs<{ name: string; has_batch_no?: 0 | 1; has_serial_no?: 0 | 1 }>("Item", {
      fields: ["name", "has_batch_no", "has_serial_no"],
      filters: [["name", "in", Array.from(new Set(doc.locations.map((l) => l.item_code)))]],
      limit: 500,
    }).catch(() => []),
  ]);
  const rateBySoItem = Object.fromEntries((salesOrder?.items ?? []).map((i) => [i.name, i.rate]));
  const flagsByItem = Object.fromEntries(itemFlags.map((i) => [i.name, i]));

  const rows: SelectableLineRow[] = doc.locations.map((location) => ({
    reference: location.name,
    item_code: location.item_code,
    item_name: location.item_name,
    uom: location.uom,
    rate: (location.sales_order_item && rateBySoItem[location.sales_order_item]) || 0,
    originalQty: location.picked_qty,
    remainingQty: location.picked_qty - (location.delivered_qty ?? 0),
    warehouse: location.warehouse,
    has_batch_no: Boolean(flagsByItem[location.item_code]?.has_batch_no),
    has_serial_no: Boolean(flagsByItem[location.item_code]?.has_serial_no),
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Selling", href: "/sales/pick-lists" },
          { label: "Pick List", href: "/sales/pick-lists" },
          { label: pickListName, href: `/sales/pick-lists/${encodeURIComponent(pickListName)}` },
          { label: "Create Delivery Note" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Delivery Note</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Pick List <span className="font-mono">{pickListName}</span> — select which picked lines and how much of
        each to deliver now, from the warehouse already picked against.
      </p>
      <LineSelectionEditor
        action={createDeliveryNoteFromPickListAction.bind(null, pickListName)}
        rows={rows}
        currency={salesOrder?.currency ?? doc.currency ?? ""}
        submitLabel="Create Delivery Note"
        pendingLabel="Creating…"
      />
    </div>
  );
}
