"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc, updateDoc } from "@/lib/erpnext";
import { getBuyingDefaults } from "@/lib/buyingDefaults";
import { getConnections } from "@/lib/connections";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this purchase order.";
    if (e.status === 409) return "A purchase order with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this purchase order — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

type PurchaseOrderItemInput = {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  rate: number;
  warehouse?: string;
  schedule_date: string;
  /** Set only when this row was copied from a specific Supplier Quotation Item row (via
   * "Create Purchase Order" on the Supplier Quotation detail page) — see LineItemsEditor's
   * LineRow type for the client-side tag fields these are read from
   * (supplier_quotation_item/source_supplier_quotation). Both real, stored Purchase Order
   * Item fields (confirmed via the live DocType JSON) — required for
   * lib/connections.ts's own Supplier Quotation -> Purchase Order connection and
   * lib/buyingRelationshipMap.ts's upstream walk to work. */
  supplier_quotation?: string;
  supplier_quotation_item?: string;
};

/**
 * Deliberately not lib/lineRows.ts's parseLineRows — Purchase Order Item needs a required
 * per-line `schedule_date` ("Required By", confirmed via the live DocType JSON) that
 * parseLineRows' shared shape doesn't carry, same reasoning as
 * buying/material-requests/actions.ts's own bespoke parser. Unlike Material Request Item,
 * Purchase Order Item DOES have `rate` — kept here (LineItemsEditor's default
 * `showRate=true`). `stock_uom` mirrors `uom` (this app's single-UOM simplification — see
 * getBuyingDefaults' own doc comment on why there's no separate purchase-UOM concept here)
 * rather than a second, separately-resolved value; `conversion_factor` is always 1 for the
 * same reason.
 */
function parsePurchaseOrderItems(formData: FormData): PurchaseOrderItemInput[] {
  const raw = String(formData.get("items") ?? "[]");
  let rows: unknown;
  try {
    rows = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object" && r.item_code))
    .map((r) => ({
      item_code: String(r.item_code),
      item_name: String(r.item_name || r.item_code),
      qty: Number(r.qty) || 0,
      uom: String(r.uom || ""),
      stock_uom: String(r.uom || ""),
      conversion_factor: 1,
      rate: Number(r.rate) || 0,
      schedule_date: String(r.schedule_date || ""),
      // Both-or-neither, same shape buildSalesOrderFields uses for quotation_item/
      // prevdoc_docname — source_supplier_quotation becomes the real ERPNext field name
      // `supplier_quotation` here; supplier_quotation_item's own field name already
      // matches ERPNext's.
      ...(r.supplier_quotation_item && r.source_supplier_quotation
        ? { supplier_quotation_item: String(r.supplier_quotation_item), supplier_quotation: String(r.source_supplier_quotation) }
        : {}),
    }))
    .filter((r) => r.qty > 0 && r.uom && r.schedule_date);
}

async function buildPurchaseOrderFields(formData: FormData) {
  const supplier = String(formData.get("supplier") ?? "").trim();
  const transaction_date = String(formData.get("transaction_date") ?? "").trim();
  const schedule_date = String(formData.get("schedule_date") ?? "").trim() || undefined;
  const companyName = String(formData.get("company") ?? "").trim() || undefined;

  if (!supplier) throw new Error("Supplier is required.");
  if (!transaction_date) throw new Error("Date is required.");

  const items = parsePurchaseOrderItems(formData);
  if (items.length === 0) {
    throw new Error("Add at least one item with a quantity, UOM, rate, and required-by date.");
  }

  const defaults = await getBuyingDefaults(companyName);

  // Same WarehouseRequired reasoning as buildSalesOrderFields — applied uniformly, not
  // exposed as a per-line field in this form.
  const itemsWithWarehouse = items.map((r) => ({ ...r, warehouse: defaults.defaultWarehouse }));

  return {
    supplier,
    transaction_date,
    schedule_date,
    company: defaults.company,
    currency: defaults.currency,
    conversion_rate: 1,
    items: itemsWithWarehouse,
  };
}

export async function createPurchaseOrderAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildPurchaseOrderFields>>;
  try {
    fields = await buildPurchaseOrderFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Purchase Order", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-orders");
  redirect(`/buying/purchase-orders/${encodeURIComponent(name)}`);
}

export async function updatePurchaseOrderAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildPurchaseOrderFields>>;
  try {
    fields = await buildPurchaseOrderFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("Purchase Order", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-orders");
  revalidatePath(`/buying/purchase-orders/${encodeURIComponent(name)}`);
  redirect(`/buying/purchase-orders/${encodeURIComponent(name)}?saved=1`);
}

type SourceSupplierQuotationForPO = { name: string; docstatus: number };

/**
 * "Create Purchase Order" from a Submitted Supplier Quotation — the target of the
 * /buying/supplier-quotations/[name]/create-order pre-filled-form page. Unlike Sales'
 * Quotation -> Sales Order flow (LineSelectionEditor, partial qty), Supplier Quotation has
 * no native "partially converted to Purchase Order" concept in this app — the real,
 * standalone PurchaseOrderForm is reused instead, pre-filled with the source quotation's
 * supplier/items (see create-order/page.tsx), each item already tagged with
 * `supplier_quotation_item`/`source_supplier_quotation` by LineItemsEditor the same way
 * Sales Order's own "Copy From Quotation" flow tags `quotation_item`/`source_quotation`.
 * parsePurchaseOrderItems (above) already carries those two fields through to the created
 * Purchase Order Item as `supplier_quotation_item`/`supplier_quotation` (the real ERPNext
 * field names) whenever a row still has them set, so this reuses the exact same
 * field-building path createPurchaseOrderAction/updatePurchaseOrderAction already use — the
 * only things unique to this action are the defensive source-quotation-submitted check
 * (mirrors createSupplierQuotationFromRfqAction/createRfqFromMaterialRequestAction's own
 * re-check of their source doc, rather than trusting the page-level redirect gate alone)
 * and the extra revalidatePath for the source quotation's own page.
 */
export async function createPurchaseOrderFromSupplierQuotationAction(
  supplierQuotationName: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let source: SourceSupplierQuotationForPO;
  try {
    source = await getDoc<SourceSupplierQuotationForPO>("Supplier Quotation", supplierQuotationName);
  } catch {
    return { error: "Could not load the source supplier quotation." };
  }
  if (source.docstatus !== 1) {
    return { error: "The source supplier quotation must be submitted first." };
  }

  let fields: Awaited<ReturnType<typeof buildPurchaseOrderFields>>;
  try {
    fields = await buildPurchaseOrderFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Purchase Order", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-orders");
  revalidatePath(`/buying/supplier-quotations/${encodeURIComponent(supplierQuotationName)}`);
  redirect(`/buying/purchase-orders/${encodeURIComponent(name)}`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitPurchaseOrderAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Purchase Order", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-orders");
  revalidatePath(`/buying/purchase-orders/${encodeURIComponent(name)}`);
  redirect(`/buying/purchase-orders/${encodeURIComponent(name)}`);
}

/**
 * Bound to `(name)`; useActionState calls the bound function with (state, formData) which
 * are unused here.
 *
 * Same proactive-guard pattern as cancelSalesOrderAction — checked here first so the error
 * names the actual blocking document(s) instead of a generic rejection. Purchase Order has
 * two possible downstream doctypes (Purchase Receipt and Purchase Invoice, unlike Sales
 * Order's one), so both connections are checked.
 */
export async function cancelPurchaseOrderAction(name: string): Promise<FormState> {
  const connections = await getConnections("Purchase Order", name);
  const blockingReceipts = connections.find((c) => c.label === "Purchase Receipt")?.submittedDocs ?? [];
  const blockingInvoices = connections.find((c) => c.label === "Purchase Invoice")?.submittedDocs ?? [];
  const blocking = [...blockingReceipts, ...blockingInvoices];
  if (blocking.length > 0) {
    return {
      error: `Cannot cancel — linked with ${blocking.join(", ")}. Cancel those first.`,
    };
  }

  try {
    await cancelDoc("Purchase Order", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/buying/purchase-orders");
  revalidatePath(`/buying/purchase-orders/${encodeURIComponent(name)}`);
  redirect(`/buying/purchase-orders/${encodeURIComponent(name)}`);
}
