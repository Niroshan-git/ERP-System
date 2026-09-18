"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError, updateDoc } from "@/lib/erpnext";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 409) return "A supplier with that name already exists.";
    if (e.status === 403) return "Not allowed to save this supplier.";
    return "ERPNext rejected this supplier — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

function fieldsFromForm(formData: FormData) {
  return {
    supplier_name: String(formData.get("supplier_name") ?? "").trim(),
    supplier_type: String(formData.get("supplier_type") ?? ""),
    supplier_group: String(formData.get("supplier_group") ?? "") || undefined,
    country: String(formData.get("country") ?? "") || undefined,
    disabled: formData.get("disabled") ? 1 : 0,
  };
}

export async function createSupplierAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromForm(formData);
  if (!fields.supplier_name) return { error: "Supplier name is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Supplier", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/suppliers");
  redirect(`/master-data/suppliers/${encodeURIComponent(name)}`);
}

export async function updateSupplierAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromForm(formData);
  if (!fields.supplier_name) return { error: "Supplier name is required." };

  try {
    await updateDoc("Supplier", name, fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/master-data/suppliers");
  revalidatePath(`/master-data/suppliers/${encodeURIComponent(name)}`);
  redirect(`/master-data/suppliers/${encodeURIComponent(name)}`);
}
