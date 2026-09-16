"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError, updateDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this serial number.";
    if (e.status === 409) return "A serial number with that ID already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this serial number — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * No docstatus on Serial No (confirmed via the live DocType JSON) — create/update only.
 * batch_no is skipped for v1 per the plan. Most Serial Nos in practice get auto-created by
 * Stock Entry/Purchase Receipt submission (ERPNext creates them itself from the line's
 * serial_and_batch_bundle) — this create page is a secondary/manual path, e.g. registering
 * pre-existing serialized stock that predates this app, not the primary flow.
 */
function buildSerialNoFields(formData: FormData) {
  const serial_no = String(formData.get("serial_no") ?? "").trim() || undefined;
  const item_code = String(formData.get("item_code") ?? "").trim();
  const warehouse = String(formData.get("warehouse") ?? "").trim() || undefined;
  const status = String(formData.get("status") ?? "").trim() || undefined;
  const company = String(formData.get("company") ?? "").trim();

  if (!item_code) throw new Error("Item is required.");
  if (!company) throw new Error("Company is required.");

  return { serial_no, item_code, warehouse, status, company };
}

export async function createSerialNoAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: ReturnType<typeof buildSerialNoFields>;
  try {
    fields = buildSerialNoFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }
  if (!fields.serial_no) return { error: "Serial No is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Serial No", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/stock/serial-nos");
  redirect(`/stock/serial-nos/${encodeURIComponent(name)}`);
}

export async function updateSerialNoAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: ReturnType<typeof buildSerialNoFields>;
  try {
    fields = buildSerialNoFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    // serial_no can't be changed after creation (it's the doctype's own name/primary key).
    const { serial_no: _serial_no, ...updateable } = fields;
    void _serial_no;
    await updateDoc("Serial No", name, updateable);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/stock/serial-nos");
  revalidatePath(`/stock/serial-nos/${encodeURIComponent(name)}`);
  redirect(`/stock/serial-nos/${encodeURIComponent(name)}?saved=1`);
}
