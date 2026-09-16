import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { StockEntryForm } from "@/components/StockEntryForm";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { DocActionBar } from "@/components/DocActionBar";
import { DocField } from "@/components/DocField";
import { StatusPill } from "@/components/StatusPill";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocTabs } from "@/components/DocTabs";
import { SavedBanner } from "@/components/SavedBanner";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { getSerialBatchBundleEntries, type SerialBatchBundleEntry } from "@/lib/actions/batchSerialLookup";
import { getStockDefaults } from "@/lib/stockDefaults";
import type { DocStatus } from "@/lib/docStatus";
import { stockEntryStatus } from "@/lib/erpStatus";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { cancelStockEntryAction, submitStockEntryAction, updateStockEntryAction } from "../actions";

type StockEntryDoc = {
  name: string;
  company: string;
  posting_date: string;
  purpose: string;
  docstatus: DocStatus;
  from_warehouse?: string;
  to_warehouse?: string;
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  items: {
    name: string;
    item_code: string;
    item_name: string;
    qty: number;
    uom: string;
    s_warehouse?: string;
    t_warehouse?: string;
    basic_rate?: number;
    serial_and_batch_bundle?: string;
  }[];
};

/** "BATCH-001 ×5, BATCH-002 ×3" or "SN-001, SN-002, SN-003" — whichever the entries carry. */
function summarizeBatchSerialEntries(entries: SerialBatchBundleEntry[]): string {
  if (entries.length === 0) return "—";
  if (entries[0].batch_no) return entries.map((e) => `${e.batch_no} ×${e.qty}`).join(", ");
  return entries.map((e) => e.serial_no).join(", ");
}

export default async function StockEntryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: StockEntryDoc;
  try {
    doc = await getDoc<StockEntryDoc>("Stock Entry", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const breadcrumb = (
    <Breadcrumb
      items={[
        { label: "Home", href: "/" },
        { label: "Inventory", href: "/stock" },
        { label: "Stock Entries", href: "/stock/stock-entries" },
        { label: doc.name },
      ]}
    />
  );

  const [timeline, session] = await Promise.all([
    buildTimeline("Stock Entry", doc.name, doc),
    verifySession((await cookies()).get(SESSION_COOKIE)?.value),
  ]);

  const status = stockEntryStatus(doc);

  const header = (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1">
          <StatusPill label={status.label} tone={status.tone} />
        </div>
      </div>
      {doc.docstatus === 0 && (
        <DocActionBar action={submitStockEntryAction.bind(null, doc.name)} label="Submit" pendingLabel="Submitting…" />
      )}
      {doc.docstatus === 1 && (
        <DocActionBar
          action={cancelStockEntryAction.bind(null, doc.name)}
          label="Cancel"
          pendingLabel="Cancelling…"
          variant="danger"
        />
      )}
    </div>
  );

  const commentsTab = (
    <ActivityTimeline
      currentUserFullName={session?.fullName ?? ""}
      entries={timeline}
      postComment={postCommentAction.bind(null, "Stock Entry", doc.name, `/stock/stock-entries/${encodeURIComponent(doc.name)}`)}
    />
  );

  let detailsTab: React.ReactNode;

  if (doc.docstatus === 0) {
    const [itemOptions, defaults] = await Promise.all([listItemOptions(), getStockDefaults(doc.company)]);

    detailsTab = (
      <StockEntryForm
        action={updateStockEntryAction.bind(null, doc.name)}
        itemOptions={itemOptions}
        companies={defaults.companies}
        warehouses={defaults.warehouses}
        initial={{
          company: doc.company,
          posting_date: doc.posting_date,
          purpose: doc.purpose,
          from_warehouse: doc.from_warehouse,
          to_warehouse: doc.to_warehouse,
          items: doc.items.map((i) => ({
            item_code: i.item_code,
            item_name: i.item_name,
            qty: i.qty,
            uom: i.uom,
            rate: i.basic_rate ?? 0,
            warehouse: i.s_warehouse || i.t_warehouse,
          })),
        }}
      />
    );
  } else {
    // Submitted/Cancelled: read back which real batches/serials each line resolved to (only
    // Issue/Transfer lines carry a bundle — Receipt lines never get one, see StockEntryForm's
    // doc comment), so the doc's own history is visible here rather than only in the separate
    // Batches/Serial Nos lists.
    const bundlesByLine = await Promise.all(doc.items.map((item) => getSerialBatchBundleEntries(item.serial_and_batch_bundle)));
    const anyBatchSerial = bundlesByLine.some((entries) => entries.length > 0);

    detailsTab = (
      <div>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Company" value={doc.company} />
          <DocField label="Date" value={doc.posting_date} mono />
          <DocField label="Purpose" value={doc.purpose} />
          <DocField label="From Warehouse" value={doc.from_warehouse || "—"} mono />
          <DocField label="To Warehouse" value={doc.to_warehouse || "—"} mono />
        </dl>

        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-canvas text-graphite-500">
                <th className="px-3 py-2 font-semibold">Item</th>
                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                <th className="px-3 py-2 font-semibold">UOM</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Target</th>
                {doc.purpose === "Material Receipt" && <th className="px-3 py-2 text-right font-semibold">Rate</th>}
                {anyBatchSerial && <th className="px-3 py-2 font-semibold">Batch / Serial</th>}
              </tr>
            </thead>
            <tbody>
              {doc.items.map((item, idx) => (
                <tr key={item.name} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-graphite-900">
                    {item.item_code} — {item.item_name}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{item.qty}</td>
                  <td className="px-3 py-2 font-mono text-graphite-500">{item.uom}</td>
                  <td className="px-3 py-2 font-mono text-graphite-500">{item.s_warehouse || "—"}</td>
                  <td className="px-3 py-2 font-mono text-graphite-500">{item.t_warehouse || "—"}</td>
                  {doc.purpose === "Material Receipt" && (
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{(item.basic_rate ?? 0).toFixed(2)}</td>
                  )}
                  {anyBatchSerial && (
                    <td className="px-3 py-2 font-mono text-xs text-graphite-500">{summarizeBatchSerialEntries(bundlesByLine[idx])}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      {breadcrumb}
      <SavedBanner show={saved === "1"} />
      {header}
      <DocTabs
        tabs={[
          { id: "details", label: "Details", content: detailsTab },
          { id: "comments", label: "Comments", content: commentsTab },
        ]}
      />
    </div>
  );
}
