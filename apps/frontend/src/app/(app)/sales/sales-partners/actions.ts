"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["partner_name", "partner_type", "territory", "commission_rate", "introduction"];

function toFields(formData: FormData): Record<string, unknown> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS);
  const rate = fields.commission_rate as string | undefined;
  return { ...fields, commission_rate: rate ? Number(rate) : undefined };
}

export async function createSalesPartnerAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = toFields(formData);
  if (!fields.partner_name) return { error: "Partner name is required." };
  if (!fields.territory) return { error: "Territory is required." };
  if (fields.commission_rate === undefined) return { error: "Commission rate is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Sales Partner", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "sales partner") };
  }

  revalidatePath("/sales/sales-partners");
  redirect(`/sales/sales-partners/${encodeURIComponent(name)}`);
}

export async function updateSalesPartnerAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = toFields(formData);
  if (!fields.partner_name) return { error: "Partner name is required." };
  if (!fields.territory) return { error: "Territory is required." };
  if (fields.commission_rate === undefined) return { error: "Commission rate is required." };

  try {
    await updateDoc("Sales Partner", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "sales partner") };
  }

  revalidatePath("/sales/sales-partners");
  revalidatePath(`/sales/sales-partners/${encodeURIComponent(name)}`);
  redirect(`/sales/sales-partners/${encodeURIComponent(name)}`);
}
