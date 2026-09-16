"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelDoc, createDoc, ErpNextError, getDoc, submitDoc, updateDoc } from "@/lib/erpnext";
import { parseLineRows, type BatchSerialEntryInput } from "@/lib/lineRows";
import { addSerialBatchLedgers } from "@/lib/actions/batchSerialLookup";

export type FormState = { error?: string } | undefined;

const PURPOSES = ["Material Issue", "Material Receipt", "Material Transfer"] as const;
type Purpose = (typeof PURPOSES)[number];

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to save this stock entry.";
    if (e.status === 409) return "A stock entry with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this stock entry — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Purpose is restricted to Material Issue/Material Receipt/Material Transfer (see the
 * plan's scope note — Manufacture/Repack/Send to Subcontractor/etc. are Manufacturing-scope,
 * out of bounds here). `stock_entry_type` is set to the exact same string as `purpose` — the
 * live Stock Entry Type records are literally named to match (confirmed live).
 *
 * Rate handling (resolved, not guessed — see PROGRESS.md for the full reasoning): Material
 * Issue and the outbound leg of Material Transfer let ERPNext compute `basic_rate` itself
 * from existing stock valuation (LineItemsEditor's `showRate` is false for those, so no rate
 * is ever sent). Material Receipt shows the Rate column and sends `basic_rate` explicitly,
 * since new/received stock has no prior valuation for ERPNext to derive a rate from.
 *
 * Warehouse wiring per purpose (see the plan's per-purpose table):
 * - Material Issue: every line's `s_warehouse` only, defaulted from the header's
 *   `from_warehouse` via LineItemsEditor's own `defaultWarehouse` prop (editable per-line
 *   the same way every other LineItemsEditor caller's warehouse default already works —
 *   i.e. not actually editable per-line today, a pre-existing limitation of that shared
 *   component, not something this doctype introduces).
 * - Material Receipt: every line's `t_warehouse` only, applied uniformly from the header's
 *   `to_warehouse` — no `defaultWarehouse` is passed to LineItemsEditor for Receipt, so no
 *   batch/serial picker or stock badge renders (new stock has no existing batches/serials to
 *   allocate against — see StockEntryForm.tsx's own doc comment).
 * - Material Transfer: `s_warehouse` from the header's `from_warehouse` (via
 *   LineItemsEditor's `defaultWarehouse`, same as Issue), `t_warehouse` applied uniformly
 *   from the header's `to_warehouse` on every line. LineItemsEditor has no UI for a second,
 *   per-line target-warehouse column (it wasn't built for a dual-warehouse case) — rather
 *   than forking it, the target warehouse is applied uniformly across every line, the same
 *   "single header-level default reused everywhere" shape every other stock-moving doctype in
 *   this app already uses for its one warehouse field. Documented here rather than silently
 *   assumed.
 */
async function buildStockEntryFields(formData: FormData) {
  const company = String(formData.get("company") ?? "").trim();
  const posting_date = String(formData.get("posting_date") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim() as Purpose;
  const from_warehouse = String(formData.get("from_warehouse") ?? "").trim() || undefined;
  const to_warehouse = String(formData.get("to_warehouse") ?? "").trim() || undefined;

  if (!company) throw new Error("Company is required.");
  if (!posting_date) throw new Error("Posting date is required.");
  if (!PURPOSES.includes(purpose)) {
    throw new Error("Purpose must be Material Issue, Material Receipt, or Material Transfer.");
  }
  if ((purpose === "Material Issue" || purpose === "Material Transfer") && !from_warehouse) {
    throw new Error(`Source warehouse is required for ${purpose}.`);
  }
  if ((purpose === "Material Receipt" || purpose === "Material Transfer") && !to_warehouse) {
    throw new Error(`Target warehouse is required for ${purpose}.`);
  }

  const rows = parseLineRows(formData, "items");
  if (rows.length === 0) throw new Error("Add at least one item with a quantity and UOM.");

  const items = rows.map((r) => ({
    item_code: r.item_code,
    item_name: r.item_name,
    qty: r.qty,
    uom: r.uom,
    stock_uom: r.uom,
    conversion_factor: 1,
    ...(purpose === "Material Issue" ? { s_warehouse: r.warehouse || from_warehouse } : {}),
    ...(purpose === "Material Receipt" ? { t_warehouse: to_warehouse, basic_rate: r.rate } : {}),
    ...(purpose === "Material Transfer"
      ? { s_warehouse: r.warehouse || from_warehouse, t_warehouse: to_warehouse }
      : {}),
  }));

  const fields = {
    naming_series: "MAT-STE-.YYYY.-",
    company,
    posting_date,
    purpose,
    stock_entry_type: purpose,
    from_warehouse,
    to_warehouse,
    items,
  };

  return { fields, rows, purpose, from_warehouse, to_warehouse };
}

/**
 * Step 2 of the two-step create flow, same shape as delivery-notes/actions.ts's
 * attachBatchSerialBundles — kept as its own copy here rather than a shared import since the
 * child doctype ("Stock Entry Detail" vs "Delivery Note Item") and parent shape differ, and
 * per FRONTEND_GUIDE.md every doctype folder is self-contained.
 *
 * Only meaningful for Material Issue/Material Transfer lines (the outbound leg, allocating
 * *existing* stock out of `s_warehouse`) — Material Receipt lines never carry
 * `batchSerialEntries` in the first place, since LineItemsEditor never shows the picker for
 * them (no `defaultWarehouse` passed — see StockEntryForm.tsx).
 */
async function attachBatchSerialBundles(
  stockEntryName: string,
  lines: { item_code: string; warehouse?: string; batchSerialEntries?: BatchSerialEntryInput[] }[],
): Promise<void> {
  const withEntries = lines
    .map((line, idx) => ({ line, idx }))
    .filter((r) => r.line.batchSerialEntries && r.line.batchSerialEntries.length > 0);
  if (withEntries.length === 0) return;

  const doc = await getDoc<{
    name: string;
    posting_date: string;
    company: string;
    items: { name: string; item_code: string; s_warehouse?: string }[];
  }>("Stock Entry", stockEntryName);

  for (const { line, idx } of withEntries) {
    const childRow = doc.items[idx];
    if (!childRow || childRow.item_code !== line.item_code) {
      throw new Error(
        `Could not match the batch/serial selection for ${line.item_code} back to a real line on ${stockEntryName} ` +
          `— the line order didn't match what was just created. The stock entry was saved as a Draft; reopen it to attach batches/serials manually.`,
      );
    }
    const warehouse = childRow.s_warehouse || line.warehouse || "";
    try {
      await addSerialBatchLedgers({
        entries: line.batchSerialEntries!.map((e) => ({ qty: e.qty, batch_no: e.batch_no, serial_no: e.serial_no })),
        child_row: {
          doctype: "Stock Entry Detail",
          name: childRow.name,
          item_code: childRow.item_code,
          warehouse,
          parenttype: "Stock Entry",
          // Only Issue/Transfer lines reach this function (see this function's doc
          // comment) and always carry s_warehouse — required for ERPNext to infer
          // "Outward" instead of defaulting to "Inward" (see batchSerialLookup.ts).
          s_warehouse: childRow.s_warehouse,
        },
        doc: { doctype: "Stock Entry", name: doc.name, posting_date: doc.posting_date, company: doc.company },
        warehouse,
      });
    } catch (e) {
      const detail = e instanceof ErpNextError ? (e.erpnextMessage ?? e.message) : "an unknown error";
      throw new Error(
        `${stockEntryName} was saved as a Draft, but attaching the batch/serial selection for ${line.item_code} failed: ${detail}. ` +
          `Reopen the stock entry to retry.`,
      );
    }
  }
}

export async function createStockEntryAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let built: Awaited<ReturnType<typeof buildStockEntryFields>>;
  try {
    built = await buildStockEntryFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Stock Entry", built.fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  try {
    await attachBatchSerialBundles(name, built.rows);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to attach the batch/serial selection." };
  }

  revalidatePath("/stock/stock-entries");
  redirect(`/stock/stock-entries/${encodeURIComponent(name)}`);
}

export async function updateStockEntryAction(
  name: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  let built: Awaited<ReturnType<typeof buildStockEntryFields>>;
  try {
    built = await buildStockEntryFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  try {
    await updateDoc("Stock Entry", name, built.fields);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  try {
    await attachBatchSerialBundles(name, built.rows);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to attach the batch/serial selection." };
  }

  revalidatePath("/stock/stock-entries");
  revalidatePath(`/stock/stock-entries/${encodeURIComponent(name)}`);
  redirect(`/stock/stock-entries/${encodeURIComponent(name)}?saved=1`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function submitStockEntryAction(name: string): Promise<FormState> {
  try {
    await submitDoc("Stock Entry", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/stock/stock-entries");
  revalidatePath(`/stock/stock-entries/${encodeURIComponent(name)}`);
  redirect(`/stock/stock-entries/${encodeURIComponent(name)}`);
}

/** Bound to `(name)`; useActionState calls the bound function with (state, formData) which are unused here. */
export async function cancelStockEntryAction(name: string): Promise<FormState> {
  try {
    await cancelDoc("Stock Entry", name);
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/stock/stock-entries");
  revalidatePath(`/stock/stock-entries/${encodeURIComponent(name)}`);
  redirect(`/stock/stock-entries/${encodeURIComponent(name)}`);
}
