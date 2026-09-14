"use client";

import { useEffect, useState, useTransition } from "react";
import { getBinQty } from "@/lib/actions/stockLookup";

/**
 * Small "Available: N" hint next to a Delivery Note line, backed by the real `Bin`
 * doctype (Phase 2D). Re-fetches whenever item/warehouse change. Soft-warning only — if
 * `requestedQty` exceeds what's on hand it turns red, but never blocks anything; ERPNext's
 * own submit-time validation is the real authority (see lib/actions/stockLookup.ts).
 * Shared by LineItemsEditor (manual Delivery Note lines) and LineSelectionEditor
 * (Sales-Order-sourced create-delivery flow) — both are Delivery-Note-only call sites,
 * since this app only shows stock where stock actually moves.
 *
 * Uses useTransition for the loading flag (same pattern LineItemsEditor already uses for
 * its own item-lookup loading state) rather than a manually-managed `loading` useState set
 * synchronously inside the effect body.
 */
export function StockBadge({
  itemCode,
  warehouse,
  requestedQty,
}: {
  itemCode?: string;
  warehouse?: string;
  requestedQty: number;
}) {
  const [qty, setQty] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!itemCode || !warehouse) return;
    let cancelled = false;
    startTransition(async () => {
      const bin = await getBinQty(itemCode, warehouse);
      if (!cancelled) setQty(bin?.actual_qty ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [itemCode, warehouse]);

  if (!itemCode || !warehouse) return null;
  if (isPending) return <p className="text-xs text-graphite-500">Checking stock…</p>;
  if (qty === null) return null; // lookup failed (403/network) — "can't tell", stay silent rather than lie.

  const short = requestedQty > qty + 1e-6;
  return (
    <p className={`text-xs ${short ? "text-alert" : "text-graphite-500"}`}>
      Available: <span className="font-mono">{qty}</span>
      {short && " — exceeds available stock"}
    </p>
  );
}
