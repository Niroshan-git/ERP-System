"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError, updateDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this batch.";
    if (e.status === 409) return "A batch with that ID already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this batch — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * No docstatus on Batch either (confirmed via the live DocType JSON) — create/update only.
 * Kept minimal per the plan: item, batch_id, expiry_date, disabled — manufacturing_date is
 * skipped for v1.
 */
function buildBatchFields(formData: FormData) {
  const item = String(formData.get("item") ?? "").trim();
  const batch_id = String(formData.get("batch_id") ?? "").trim() || undefined;
  const expiry_date = String(formData.get("expiry_date") ?? "").trim() || undefined;
  const disabled = formData.get("disabled") ? 1 : 0;

  if (!item) throw new Error("Item is required.");

  return { item, batch_id, expiry_date, disabled };
}

export async function createBatchAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: ReturnType<typeof buildBatchFields>;
  try {
    fields = buildBatchFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Batch", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/stock/batches");
  redirect(`/stock/batches/${encodeURIComponent(name)}`);
}

export async function updateBatchAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let fields: ReturnType<typeof buildBatchFields>;
  try {
    fields = buildBatchFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    // batch_id can't be changed after creation (it's the Batch doctype's own name/primary
    // key) — dropped from the update payload rather than letting ERPNext reject the whole
    // save over one immutable field.
    const { batch_id: _batch_id, ...updateable } = fields;
    void _batch_id;
    await updateDoc("Batch", name, updateable);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/stock/batches");
  revalidatePath(`/stock/batches/${encodeURIComponent(name)}`);
  redirect(`/stock/batches/${encodeURIComponent(name)}?saved=1`);
}
