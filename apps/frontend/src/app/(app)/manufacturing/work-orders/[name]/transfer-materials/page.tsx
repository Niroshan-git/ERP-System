import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MaterialTransferForm } from "@/components/MaterialTransferForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { canTransferMaterials } from "@/lib/erpStatus";
import { getMaterialTransferPreview } from "@/lib/actions/workOrderTransfer";
import { getItemLineDefaults, listItemOptions } from "@/lib/actions/itemLookup";
import { getStockDefaults } from "@/lib/stockDefaults";
import { saveTransferDraftAction, submitTransferAction } from "./actions";

type WorkOrderDoc = {
  name: string;
  status: string;
  docstatus: number;
  company: string;
  production_item: string;
  item_name?: string;
  qty: number;
  produced_qty?: number;
  bom_no?: string;
  use_multi_level_bom?: 0 | 1;
  wip_warehouse?: string;
  skip_transfer?: 0 | 1;
  transfer_material_against?: string;
  track_semi_finished_goods?: 0 | 1;
  required_items?: { item_code: string; required_qty: number; transferred_qty?: number }[];
};

export default async function TransferMaterialsPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const workOrderName = decodeURIComponent(name);

  let doc: WorkOrderDoc;
  try {
    doc = await getDoc<WorkOrderDoc>("Work Order", workOrderName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const eligibility = canTransferMaterials(doc);

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Manufacturing", href: "/manufacturing" },
        { label: "Work Orders", href: "/manufacturing/work-orders" },
        { label: doc.name, href: `/manufacturing/work-orders/${encodeURIComponent(doc.name)}` },
        { label: "Transfer Materials" },
      ]}
    />
  );

  if (!eligibility.allowed) {
    return (
      <div>
        {breadcrumb}
        <h1 className="mb-2 text-2xl font-medium text-graphite-900">Transfer Materials</h1>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-graphite-500">
          <p>{eligibility.reason}</p>
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

  const [previewResult, itemOptions, stockDefaults] = await Promise.all([
    getMaterialTransferPreview(doc.name),
    listItemOptions(),
    getStockDefaults(doc.company),
  ]);

  if (!previewResult.preview) {
    return (
      <div>
        {breadcrumb}
        <h1 className="mb-2 text-2xl font-medium text-graphite-900">Transfer Materials</h1>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-alert">
          <p>{previewResult.error}</p>
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

  const preview = previewResult.preview;

  if (preview.items.length === 0) {
    return (
      <div>
        {breadcrumb}
        <h1 className="mb-2 text-2xl font-medium text-graphite-900">Transfer Materials</h1>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-graphite-500">
          <p>Every required material for {doc.name} has already been transferred.</p>
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

  // preview.items only carries this call's proposed transfer amount + the item's own
  // cumulative transferred_qty (ERPNext's own pending-materials computation — see
  // getMaterialTransferPreview's doc comment). The true "Required" total per line comes from
  // the Work Order's own required_items (already fetched above), matched by item_code —
  // merged here rather than inferred, so a future non-zero
  // transfer_extra_materials_percentage can't silently make "Required" look wrong.
  const requiredByItem = new Map((doc.required_items ?? []).map((r) => [r.item_code, r.required_qty]));

  // Batch/serial requirement per row — bounded to this Work Order's own handful of BOM
  // materials (not a list-scale N+1), needed so a material that requires batch/serial
  // allocation is truthfully blocked here rather than silently posted as an invalid Stock
  // Entry (mission's batch/serial safety requirement — no picker UI exists in this package).
  const itemFlags = await Promise.all(
    preview.items.map((row) => getItemLineDefaults(row.item_code).then((d) => [row.item_code, d] as const)),
  );
  const flagsByItem = new Map(itemFlags);

  const rows = preview.items.map((row) => {
    const flags = flagsByItem.get(row.item_code);
    return {
      ...row,
      required_qty: requiredByItem.get(row.item_code) ?? row.transferred_qty + row.qty,
      requiresBatchOrSerial: Boolean(flags?.has_batch_no || flags?.has_serial_no),
    };
  });

  return (
    <div>
      {breadcrumb}
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Material Transfer for Manufacture</h1>
      <p className="mb-4 font-mono text-sm text-graphite-500">{doc.name}</p>

      <MaterialTransferForm
        workOrder={{
          name: doc.name,
          production_item: doc.production_item,
          item_name: doc.item_name,
          qty: doc.qty,
          bom_no: preview.bom_no,
          wip_warehouse: preview.to_warehouse ?? doc.wip_warehouse ?? "",
        }}
        rows={rows}
        itemOptions={itemOptions}
        warehouses={stockDefaults.warehouses}
        saveDraftAction={saveTransferDraftAction.bind(null, doc.name)}
        submitAction={submitTransferAction.bind(null, doc.name)}
      />
    </div>
  );
}
