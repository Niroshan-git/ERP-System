"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to create this work order.";
    if (e.status === 409) return "A work order with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this work order — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Converts a `<input type="datetime-local">` value ("YYYY-MM-DDTHH:MM") into the
 * "YYYY-MM-DD HH:MM:SS" shape ERPNext's Datetime fields expect over REST.
 */
function toErpDatetime(value: string): string {
  return `${value.replace("T", " ")}:00`;
}

function buildWorkOrderFields(formData: FormData) {
  const production_item = String(formData.get("production_item") ?? "").trim();
  const bom_no = String(formData.get("bom_no") ?? "").trim();
  const qty = Number(String(formData.get("qty") ?? "").trim());
  const company = String(formData.get("company") ?? "").trim();
  const plannedStartRaw = String(formData.get("planned_start_date") ?? "").trim();
  const plannedEndRaw = String(formData.get("planned_end_date") ?? "").trim();
  const project = String(formData.get("project") ?? "").trim() || undefined;
  const sales_order = String(formData.get("sales_order") ?? "").trim() || undefined;
  const source_warehouse = String(formData.get("source_warehouse") ?? "").trim() || undefined;
  const wip_warehouse = String(formData.get("wip_warehouse") ?? "").trim() || undefined;
  const fg_warehouse = String(formData.get("fg_warehouse") ?? "").trim() || undefined;
  const use_multi_level_bom = formData.get("use_multi_level_bom") ? 1 : 0;

  if (!production_item) throw new Error("Production item is required.");
  if (!bom_no) throw new Error("BOM is required.");
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantity must be greater than zero.");
  if (!company) throw new Error("Company is required.");
  if (!plannedStartRaw) throw new Error("Planned start date is required.");

  return {
    naming_series: "MFG-WO-.YYYY.-",
    company,
    production_item,
    bom_no,
    qty,
    planned_start_date: toErpDatetime(plannedStartRaw),
    planned_end_date: plannedEndRaw ? toErpDatetime(plannedEndRaw) : undefined,
    project,
    sales_order,
    source_warehouse,
    wip_warehouse,
    fg_warehouse,
    use_multi_level_bom,
  };
}

/**
 * Create-only — leaves the Work Order at docstatus 0 (Draft). No submit/cancel here, that's
 * a future scoped package (see FRONTEND_GUIDE.md §11). This app never sends `required_items`/
 * `operations` itself. Live-confirmed (2026-09-17 QA): ERPNext's own `validate()` populates
 * `required_items` from `bom_no`+`qty` server-side on a plain REST insert, but NOT
 * `operations` — that table stays empty even when the BOM has operations (pulling BOM
 * operations into a Work Order is normally driven by Desk's own client-side form script, not
 * `validate()`). The Operations preview in WorkOrderForm.tsx reads straight from the BOM doc
 * for display, not from the created Work Order, so this doesn't affect this package — but a
 * future Job Card / operation-tracking package must not assume Work Orders created here carry
 * populated `operations` rows.
 */
export async function createWorkOrderAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: ReturnType<typeof buildWorkOrderFields>;
  try {
    fields = buildWorkOrderFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Work Order", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/manufacturing/work-orders");
  redirect(`/manufacturing/work-orders/${encodeURIComponent(name)}`);
}
