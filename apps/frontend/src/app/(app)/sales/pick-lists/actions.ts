"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc, updateDoc } from "@/lib/erpnext";
import { getSellingDefaults } from "@/lib/salesDefaults";
import { parseLineSelectionRows, type BatchSerialEntryInput } from "@/lib/lineRows";
import { attachBatchSerialBundles } from "../delivery-notes/actions";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this pick list.";
    if (e.status === 409) return "A pick list with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this pick list — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

type SalesOrderItemForPickList = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  /** Real, live stored Float field on Sales Order Item (confirmed via the live DocType
   * JSON, alongside delivered_qty) — "remaining to pick" is a simple subtraction, same
   * shape as createDeliveryNoteFromSalesOrderAction's delivered_qty handling. */
  picked_qty?: number;
};

type SalesOrderForPickList = {
  name: string;
  customer: string;
  customer_name?: string;
  company: string;
  status: string;
  items: SalesOrderItemForPickList[];
};

type PickListLocationInput = {
  item_code: string;
  item_name: string;
  qty: number;
  stock_qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  warehouse: string;
  picked_qty: number;
  sales_order: string;
  sales_order_item: string;
};

/**
 * "Create Pick List" from a Submitted Sales Order — the target of the
 * /sales/orders/[name]/create-pick-list line-selection step (LineSelectionEditor).
 *
 * Every line is re-derived from the *live* Sales Order (never trusted from the client),
 * capped at `Sales Order Item.qty - Sales Order Item.picked_qty` — mirrors
 * createDeliveryNoteFromSalesOrderAction's delivered_qty handling exactly, since
 * `picked_qty` is the same kind of real, ERPNext-maintained stored field.
 *
 * `picked_qty` starts equal to the requested qty (assume the full picked amount until
 * proven otherwise) — adjustable downward on the Pick List detail page
 * (PickListPickedQtyEditor) before it's submitted, for whatever couldn't actually be
 * pulled from stock. `sales_order_item` is set on each line so ERPNext's own
 * `Sales Order Item.picked_qty` bookkeeping fires on submit, the same way `so_detail`
 * drives `delivered_qty` for Delivery Note.
 */
export async function createPickListFromSalesOrderAction(
  salesOrderName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const selection = parseLineSelectionRows(formData, "items");
  if (selection.length === 0) {
    return { error: "Select at least one item and quantity to pick." };
  }

  let salesOrder: SalesOrderForPickList;
  try {
    salesOrder = await getDoc<SalesOrderForPickList>("Sales Order", salesOrderName);
  } catch {
    return { error: "Could not load the source sales order." };
  }

  if (salesOrder.status === "On Hold" || salesOrder.status === "Closed") {
    return { error: `${salesOrderName} is ${salesOrder.status} — cannot pick against it.` };
  }

  const defaults = await getSellingDefaults(salesOrder.company);

  const locations: PickListLocationInput[] = [];
  for (const sel of selection) {
    const item = salesOrder.items.find((i) => i.name === sel.reference);
    if (!item) {
      return { error: "One of the selected lines no longer exists on this sales order — reload and try again." };
    }
    const remaining = item.qty - (item.picked_qty ?? 0);
    if (sel.qty > remaining + 1e-6) {
      return { error: `${item.item_code}: requested ${sel.qty} but only ${remaining} remains to pick.` };
    }
    locations.push({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: sel.qty,
      stock_qty: sel.qty,
      uom: item.uom,
      stock_uom: item.uom,
      conversion_factor: 1,
      warehouse: defaults.defaultWarehouse ?? "",
      picked_qty: sel.qty,
      sales_order: salesOrderName,
      sales_order_item: item.name,
    });
  }

  if (locations.length === 0) {
    return { error: "Nothing to pick." };
  }

  const fields = {
    company: salesOrder.company,
    customer: salesOrder.customer,
    customer_name: salesOrder.customer_name || salesOrder.customer,
    purpose: "Delivery",
    locations,
  };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Pick List", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/pick-lists");
  revalidatePath(`/sales/orders/${encodeURIComponent(salesOrderName)}`);
  redirect(`/sales/pick-lists/${encodeURIComponent(name)}`);
}

type LocationUpdateInput = {
  name: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  qty: number;
  stock_qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  picked_qty: number;
  sales_order?: string;
  sales_order_item?: string;
};

/** Parses PickListPickedQtyEditor's hidden JSON field — every existing child-row field
 * round-tripped so ERPNext's PUT (which replaces the whole `locations` table) doesn't drop
 * anything the user didn't touch; only `picked_qty` is actually meant to change. */
function parseLocationRows(formData: FormData): LocationUpdateInput[] {
  const raw = String(formData.get("locations") ?? "[]");
  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object" && r.name && r.item_code))
    .map((r) => ({
      name: String(r.name),
      item_code: String(r.item_code),
      item_name: String(r.item_name || r.item_code),
      warehouse: String(r.warehouse || ""),
      qty: Number(r.qty) || 0,
      stock_qty: Number(r.stock_qty ?? r.qty) || 0,
      uom: String(r.uom || ""),
      stock_uom: String(r.stock_uom || r.uom || ""),
      conversion_factor: Number(r.conversion_factor) || 1,
      picked_qty: Number(r.picked_qty) || 0,
      sales_order: typeof r.sales_order === "string" && r.sales_order ? r.sales_order : undefined,
      sales_order_item: typeof r.sales_order_item === "string" && r.sales_order_item ? r.sales_order_item : undefined,
    }));
}

/** Draft-only — saves the picked quantities from PickListPickedQtyEditor. */
export async function updatePickListPickedQtyAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const locations = parseLocationRows(formData);
  if (locations.length === 0) {
    return { error: "No lines to save." };
  }

  try {
    await updateDoc("Pick List", name, { locations });
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath(`/sales/pick-lists/${encodeURIComponent(name)}`);
  redirect(`/sales/pick-lists/${encodeURIComponent(name)}?saved=1`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitPickListAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Pick List", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/pick-lists");
  revalidatePath(`/sales/pick-lists/${encodeURIComponent(name)}`);
  redirect(`/sales/pick-lists/${encodeURIComponent(name)}`);
}

/**
 * Bound to `(name)`; useActionState calls the bound function with (state, formData) which
 * are unused here.
 *
 * Unlike cancelSalesOrderAction/cancelDeliveryNoteAction, there's no proactive
 * blocking-document check here: Delivery Note Item carries no stored back-reference to the
 * Pick List it was picked through (see the doc comment on CONNECTION_CONFIG["Pick List"] in
 * lib/connections.ts), so which Delivery Notes descend from this exact Pick List can't be
 * queried over REST. ERPNext's own cancel validation still runs server-side; its real
 * rejection message (if any) is surfaced via humanizeError instead.
 */
export async function cancelPickListAction(name: string): Promise<FormState> {
  try {
    await cancelDoc("Pick List", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/sales/pick-lists");
  revalidatePath(`/sales/pick-lists/${encodeURIComponent(name)}`);
  redirect(`/sales/pick-lists/${encodeURIComponent(name)}`);
}

type PickListLocationForDelivery = {
  name: string;
  item_code: string;
  item_name: string;
  warehouse: string;
  qty: number;
  picked_qty: number;
  /** Real stored Float field on Pick List Item (confirmed via the live DocType JSON,
   * alongside transferred_qty) — "remaining to deliver from this pick list line" is a
   * simple subtraction, same shape as delivered_qty on Sales Order Item. */
  delivered_qty?: number;
  uom: string;
  sales_order?: string;
  sales_order_item?: string;
};

type PickListForDelivery = {
  name: string;
  docstatus: number;
  status: string;
  customer: string;
  company: string;
  locations: PickListLocationForDelivery[];
};

type SalesOrderRefForDelivery = {
  name: string;
  customer: string;
  company: string;
  currency: string;
  selling_price_list: string;
  price_list_currency: string;
  customer_address?: string;
  contact_person?: string;
  shipping_address_name?: string;
  territory?: string;
  customer_group?: string;
  tc_name?: string;
  terms?: string;
  title?: string;
  po_no?: string;
  po_date?: string;
  items: { name: string; rate: number }[];
};

/**
 * "Create Delivery Note" from a Submitted Pick List — the target of the
 * /sales/pick-lists/[name]/create-delivery line-selection step.
 *
 * Every line is re-derived from the *live* Pick List (never trusted from the client),
 * capped at `Pick List Item.picked_qty - Pick List Item.delivered_qty`. Rate/currency/
 * price-list/address fields aren't stored on Pick List at all (it's a stock document, not
 * a valued one) — pulled instead from the linked Sales Order, same fields
 * createDeliveryNoteFromSalesOrderAction already pulls when going straight from a Sales
 * Order. `so_detail`/`against_sales_order` are still set from the Pick List line's own
 * `sales_order_item`/`sales_order` (not re-derived from the Sales Order fetch) so ERPNext's
 * `delivered_qty` bookkeeping on Sales Order Item fires correctly either way.
 */
export async function createDeliveryNoteFromPickListAction(
  pickListName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const selection = parseLineSelectionRows(formData, "items");
  if (selection.length === 0) {
    return { error: "Select at least one item and quantity to deliver." };
  }

  let pickList: PickListForDelivery;
  try {
    pickList = await getDoc<PickListForDelivery>("Pick List", pickListName);
  } catch {
    return { error: "Could not load the source pick list." };
  }

  if (pickList.docstatus !== 1) {
    return { error: `${pickListName} must be submitted before a Delivery Note can be created from it.` };
  }

  const sourceSalesOrder = pickList.locations.find((l) => l.sales_order)?.sales_order;
  if (!sourceSalesOrder) {
    return { error: "This pick list has no linked sales order to pull delivery details from." };
  }

  let salesOrder: SalesOrderRefForDelivery;
  try {
    salesOrder = await getDoc<SalesOrderRefForDelivery>("Sales Order", sourceSalesOrder);
  } catch {
    return { error: "Could not load the source sales order." };
  }
  const rateBySoItem = Object.fromEntries(salesOrder.items.map((i) => [i.name, i.rate]));

  const deliveryItems: {
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    rate: number;
    conversion_factor: number;
    warehouse?: string;
    against_sales_order: string;
    so_detail: string;
  }[] = [];
  const batchSerialByIndex: (BatchSerialEntryInput[] | undefined)[] = [];

  for (const sel of selection) {
    const location = pickList.locations.find((l) => l.name === sel.reference);
    if (!location) {
      return { error: "One of the selected lines no longer exists on this pick list — reload and try again." };
    }
    if (!location.sales_order || !location.sales_order_item) {
      return { error: `${location.item_code}: this pick list line has no linked sales order item.` };
    }
    const remaining = location.picked_qty - (location.delivered_qty ?? 0);
    if (sel.qty > remaining + 1e-6) {
      return { error: `${location.item_code}: requested ${sel.qty} but only ${remaining} remains to deliver.` };
    }
    deliveryItems.push({
      item_code: location.item_code,
      item_name: location.item_name,
      qty: sel.qty,
      uom: location.uom,
      rate: rateBySoItem[location.sales_order_item] ?? 0,
      conversion_factor: 1,
      warehouse: location.warehouse,
      against_sales_order: location.sales_order,
      so_detail: location.sales_order_item,
    });
    batchSerialByIndex.push(sel.batchSerialEntries);
  }

  if (deliveryItems.length === 0) {
    return { error: "Nothing to deliver." };
  }

  const fields = {
    naming_series: "MAT-DN-.YYYY.-",
    customer: salesOrder.customer,
    posting_date: new Date().toISOString().slice(0, 10),
    company: salesOrder.company,
    currency: salesOrder.currency,
    conversion_rate: 1,
    selling_price_list: salesOrder.selling_price_list,
    price_list_currency: salesOrder.price_list_currency,
    plc_conversion_rate: 1,
    customer_address: salesOrder.customer_address,
    contact_person: salesOrder.contact_person,
    shipping_address_name: salesOrder.shipping_address_name,
    territory: salesOrder.territory,
    customer_group: salesOrder.customer_group,
    tc_name: salesOrder.tc_name,
    terms: salesOrder.terms,
    title: salesOrder.title,
    po_no: salesOrder.po_no,
    po_date: salesOrder.po_date,
    items: deliveryItems,
  };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Delivery Note", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  try {
    await attachBatchSerialBundles(
      name,
      deliveryItems.map((item, idx) => ({
        item_code: item.item_code,
        warehouse: item.warehouse,
        batchSerialEntries: batchSerialByIndex[idx],
      })),
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to attach the batch/serial selection." };
  }

  revalidatePath("/sales/delivery-notes");
  revalidatePath(`/sales/pick-lists/${encodeURIComponent(pickListName)}`);
  revalidatePath(`/sales/orders/${encodeURIComponent(sourceSalesOrder)}`);
  redirect(`/sales/delivery-notes/${encodeURIComponent(name)}`);
}
