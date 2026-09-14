"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, updateDoc } from "@/lib/erpnext";
import { fieldsFromFormData, humanizeError } from "@/lib/masterActions";

export type FormState = { error?: string } | undefined;

const TEXT_KEYS = ["campaign_name", "description"];

export async function createCampaignAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS);
  if (!fields.campaign_name) return { error: "Campaign name is required." };

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Campaign", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e, "campaign") };
  }

  revalidatePath("/sales/campaigns");
  redirect(`/sales/campaigns/${encodeURIComponent(name)}`);
}

export async function updateCampaignAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fields = fieldsFromFormData(formData, TEXT_KEYS);
  if (!fields.campaign_name) return { error: "Campaign name is required." };

  try {
    await updateDoc("Campaign", name, fields);
  } catch (e) {
    return { error: humanizeError(e, "campaign") };
  }

  revalidatePath("/sales/campaigns");
  revalidatePath(`/sales/campaigns/${encodeURIComponent(name)}`);
  redirect(`/sales/campaigns/${encodeURIComponent(name)}`);
}
