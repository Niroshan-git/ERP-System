import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CompleteProductionForm } from "@/components/CompleteProductionForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { canCompleteProduction } from "@/lib/erpStatus";
import { getManufacturePreview } from "@/lib/actions/workOrderManufacture";
import { getItemLineDefaults } from "@/lib/actions/itemLookup";
import { saveProductionDraftAction, submitProductionAction } from "./actions";

type WorkOrderDoc = {
  name: string;
  status: string;
  docstatus: number;
  company: string;
  production_item: string;
  item_name?: string;
  stock_uom?: string;
  qty: number;
  produced_qty?: number;
  bom_no?: string;
  wip_warehouse?: string;
  fg_warehouse?: string;
  track_semi_finished_goods?: 0 | 1;
  transfer_material_against?: string;
};

export default async function CompleteProductionPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ qty?: string }>;
}) {
  const { name } = await params;
  const { qty: qtyParam } = await searchParams;
  const workOrderName = decodeURIComponent(name);

  let doc: WorkOrderDoc;
  try {
    doc = await getDoc<WorkOrderDoc>("Work Order", workOrderName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const eligibility = canCompleteProduction(doc);

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Manufacturing", href: "/manufacturing" },
        { label: "Work Orders", href: "/manufacturing/work-orders" },
        { label: doc.name, href: `/manufacturing/work-orders/${encodeURIComponent(doc.name)}` },
        { label: "Complete Production" },
      ]}
    />
  );

  function blocked(message: string) {
    return (
      <div>
        {breadcrumb}
        <h1 className="mb-2 text-2xl font-medium text-graphite-900">Complete Production</h1>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-graphite-500">
          <p>{message}</p>
          <Link
            href={`/manufacturing/work-orders/${encodeURIComponent(doc.name)}`}
            className="mt-3 inline-block text-signal hover:underline"
          >
            Back to {doc.name}
          </Link>
        </div>
      </div>
    );
  }

  if (!eligibility.allowed) {
    return blocked(eligibility.reason ?? "Production cannot be completed for this Work Order right now.");
  }

  const remaining = doc.qty - (doc.produced_qty ?? 0);

  // "Quantity to Complete Now" — a real ERPNext-scaled preview at this exact qty, not a linear
  // client-side scale-down of the full-remaining-qty preview (see workOrderManufacture.ts's doc
  // comment: BOM item quantities, UOM conversion, and process-loss math are ERPNext's own
  // computation, re-run server-side for whatever qty the user asks to preview).
  let requestedQty = remaining;
  if (qtyParam) {
    const parsed = Number(qtyParam);
    if (Number.isFinite(parsed) && parsed > 0) {
      requestedQty = Math.min(parsed, remaining);
    }
  }

  const previewResult = await getManufacturePreview(doc.name, requestedQty);
  if (!previewResult.preview) {
    return blocked(previewResult.error);
  }
  const preview = previewResult.preview;

  if (!preview.to_warehouse) {
    return blocked(
      "This Work Order has no Target (Finished Goods) Warehouse set — ERPNext requires one before production can be completed. Set it on the Work Order first.",
    );
  }
  if (preview.items.length === 0) {
    return blocked("ERPNext did not return any items to produce for this Work Order.");
  }

  // Same fail-closed batch/serial disclosure as Material Transfer (MaterialTransferForm.tsx) —
  // checked against every row ERPNext proposed, not just the finished item.
  const uniqueItemCodes = [...new Set(preview.items.map((r) => r.item_code))];
  const itemFlags = await Promise.all(uniqueItemCodes.map((code) => getItemLineDefaults(code)));
  const flagsByItem = new Map(uniqueItemCodes.map((code, i) => [code, itemFlags[i]]));
  // Fail closed on a lookup failure the same way actions.ts does (code-review finding) — a
  // `null` result (network blip, permission issue, deleted Item) is treated as requiring
  // verification, not silently as "no batch/serial", so this page's block matches what the
  // submit-time guard in actions.ts will actually do rather than showing a clean form that
  // then fails at submit for an unrelated reason.
  const unverifiableItems = uniqueItemCodes.filter((code) => !flagsByItem.get(code));
  const batchOrSerialItems = uniqueItemCodes.filter(
    (code) => flagsByItem.get(code)?.has_batch_no || flagsByItem.get(code)?.has_serial_no,
  );

  return (
    <div>
      {breadcrumb}
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Complete Production</h1>
      <p className="mb-4 font-mono text-sm text-graphite-500">{doc.name}</p>

      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <form className="flex flex-wrap items-end gap-3" method="GET">
          <div>
            <label className="mb-1 block text-xs font-medium text-graphite-500">Quantity to Complete Now</label>
            <input
              type="number"
              name="qty"
              min={0}
              max={remaining}
              step="any"
              defaultValue={requestedQty}
              className="w-40 rounded-md border border-border bg-surface px-2 py-1.5 text-sm font-mono focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>
          <p className="mb-2 text-xs text-graphite-500">of {remaining} {doc.stock_uom || ""} remaining</p>
          <button
            type="submit"
            className="mb-0.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-graphite-900 hover:bg-canvas"
          >
            Preview
          </button>
        </form>
      </div>

      {unverifiableItems.length > 0 ? (
        <div className="rounded-xl border border-alert/40 bg-surface p-4 text-sm text-alert">
          Could not verify {unverifiableItems.join(", ")} — reload the page and try again.
        </div>
      ) : batchOrSerialItems.length > 0 ? (
        <div className="rounded-xl border border-alert/40 bg-surface p-4 text-sm text-alert">
          {batchOrSerialItems.join(", ")} require{batchOrSerialItems.length === 1 ? "s" : ""} batch/serial allocation
          — not supported in this production screen yet. Complete this production via Stock Entry directly, or
          contact support.
        </div>
      ) : (
        <CompleteProductionForm
          workOrder={{
            name: doc.name,
            production_item: doc.production_item,
            item_name: doc.item_name,
            qty: doc.qty,
            producedQty: doc.produced_qty ?? 0,
            bom_no: preview.bom_no,
            fromWarehouse: preview.from_warehouse,
            toWarehouse: preview.to_warehouse,
          }}
          items={preview.items}
          fgCompletedQty={preview.fg_completed_qty}
          processLossQty={preview.process_loss_qty ?? 0}
          saveDraftAction={saveProductionDraftAction.bind(null, doc.name)}
          submitAction={submitProductionAction.bind(null, doc.name)}
        />
      )}
    </div>
  );
}
