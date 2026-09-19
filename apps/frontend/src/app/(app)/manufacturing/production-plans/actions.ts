"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError } from "@/lib/erpnext";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import {
  parseProductionPlanItemRows,
  parseProductionPlanMaterialRequestRows,
  parseProductionPlanReferenceRows,
  parseProductionPlanSalesOrderRows,
} from "@/lib/productionPlanRows";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to create this production plan.";
    if (e.status === 409) return "A production plan with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this production plan — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

function checked(formData: FormData, name: string): 0 | 1 {
  return formData.get(name) === "on" ? 1 : 0;
}

function buildProductionPlanFields(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const posting_date = String(formData.get("posting_date") ?? "").trim();
  const get_items_from = String(formData.get("get_items_from") ?? "").trim();

  if (!company) throw new Error("Company is required.");
  if (!posting_date) throw new Error("Posting date is required.");
  if (get_items_from !== "Sales Order" && get_items_from !== "Material Request") {
    throw new Error('Get Items From must be "Sales Order" or "Material Request".');
  }

  const po_items = parseProductionPlanItemRows(formData);
  if (po_items.length === 0) {
    throw new Error('Add at least one finished-goods row — use "Get Finished Goods" first.');
  }

  return {
    company,
    posting_date,
    get_items_from,
    combine_items: checked(formData, "combine_items"),
    sales_orders: parseProductionPlanSalesOrderRows(formData),
    material_requests: parseProductionPlanMaterialRequestRows(formData),
    po_items,
    prod_plan_references: parseProductionPlanReferenceRows(formData),
  };
}

/**
 * Create-only — leaves the Production Plan at docstatus 0 (Draft), matching this app's
 * standing Work Order/BOM create precedent (`FRONTEND_GUIDE.md` §11). No submit/cancel, no
 * "Get Sub Assembly Items"/raw-material calc, no "Make Work Order"/"Make Material Request" —
 * all deferred to a future package, per PP-2's own scope split (see PROGRESS.md). `sales_orders`
 * /`material_requests`/`po_items`/`prod_plan_references` were built up client-side via
 * ERPNext's own native `get_open_sales_orders`/`get_pending_material_requests`/
 * `combine_so_items` (see `lib/actions/productionPlanCreate.ts`) — this action only persists
 * whatever that flow already produced, matching `createWorkOrderAction`'s "trust the preview,
 * don't recompute it" precedent. Session-checked because, unlike the read-only preview calls,
 * this one actually creates a document (same pattern as `comments.ts`'s `postCommentAction`).
 */
export async function createProductionPlanAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return { error: "Your session expired — reload the page." };

  let fields: ReturnType<typeof buildProductionPlanFields>;
  try {
    fields = buildProductionPlanFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Production Plan", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/manufacturing/production-plans");
  redirect(`/manufacturing/production-plans/${encodeURIComponent(name)}`);
}
