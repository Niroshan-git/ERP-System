"use server";

import { getDoc, listDocs } from "@/lib/erpnext";

export type ItemLineDefaults = { item_name: string; uom: string; rate: number } | null;

/**
 * Called from LineItemsEditor.tsx when a row's item changes. Uses the Item's
 * own standard_rate as the line rate — a deliberate simplification, not a
 * Price List / Pricing Rule lookup (see apps/frontend/README.md's Quotation
 * placeholder note this superseded). Good enough for a first quote; editable
 * per line either way.
 */
export async function getItemLineDefaults(itemCode: string): Promise<ItemLineDefaults> {
  if (!itemCode) return null;
  try {
    const item = await getDoc<{ item_name: string; stock_uom: string; standard_rate: number }>("Item", itemCode);
    return { item_name: item.item_name, uom: item.stock_uom, rate: item.standard_rate ?? 0 };
  } catch {
    return null;
  }
}

export type ItemOption = { code: string; name: string };

export async function listItemOptions(): Promise<ItemOption[]> {
  const rows = await listDocs<{ name: string; item_name: string }>("Item", {
    fields: ["name", "item_name"],
    filters: [["disabled", "=", 0]],
    limit: 500,
    orderBy: "name asc",
  });
  return rows.map((r) => ({ code: r.name, name: r.item_name }));
}
