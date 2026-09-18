"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError, updateDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this warehouse.";
    if (e.status === 409) return "A warehouse with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this warehouse — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Warehouse has no docstatus field at all (confirmed via the live DocType JSON — no
 * `amended_from`) — create/update only, no submit/cancel, unlike every other doctype this
 * module builds. Flat list, no tree/indent UI (per the plan's "simplified" instruction).
 */
function buildWarehouseFields(formData: FormData) {
  const warehouse_name = String(formData.get("warehouse_name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const parent_warehouse = String(formData.get("parent_warehouse") ?? "").trim() || undefined;
  const is_group = formData.get("is_group") ? 1 : 0;
  const disabled = formData.get("disabled") ? 1 : 0;

  if (!warehouse_name) throw new Error("Warehouse name is required.");
  if (!company) throw new Error("Company is required.");

  return { warehouse_name, company, parent_warehouse, is_group, disabled };
}

export async function createWarehouseAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: ReturnType<typeof buildWarehouseFields>;
  try {
    fields = buildWarehouseFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Warehouse", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/warehouses");
  redirect(`/master-data/warehouses/${encodeURIComponent(name)}`);
}

export async function updateWarehouseAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: ReturnType<typeof buildWarehouseFields>;
  try {
    fields = buildWarehouseFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("Warehouse", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/warehouses");
  revalidatePath(`/master-data/warehouses/${encodeURIComponent(name)}`);
  redirect(`/master-data/warehouses/${encodeURIComponent(name)}?saved=1`);
}
