import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DocField } from "@/components/DocField";
import { DocTabs } from "@/components/DocTabs";
import { StatusPill } from "@/components/StatusPill";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { formatAmount } from "@/lib/format";
import { bomStatus } from "@/lib/erpStatus";

/**
 * Read-only canonical BOM component/operation row shapes — deliberately separate from
 * `bomLookup.ts`'s `BomItemRow`/`BomOperationRow` (the narrow read used by Work Order
 * create's preview/payload-building), per this package's own investigation: that lookup is
 * scoped to exactly the fields Work Order creation needs and must not be widened for this
 * unrelated read-only entity page. Field names verified live against `BOM`/`BOM Item`/
 * `BOM Operation` via `get_doctype_fields` (2026-09-19 investigation) — see
 * `docs/backend/05-manufacturing/bom.md`.
 */
type BomComponentRow = {
  item_code: string;
  item_name?: string;
  qty: number;
  uom: string;
  stock_uom?: string;
  conversion_factor?: number;
  rate?: number;
  amount?: number;
  source_warehouse?: string;
  operation?: string;
  bom_no?: string;
  allow_alternative_item?: 0 | 1;
  include_item_in_manufacturing?: 0 | 1;
};

type BomOperationRow = {
  operation: string;
  workstation?: string;
  time_in_mins?: number;
  batch_size?: number;
  hour_rate?: number;
  base_hour_rate?: number;
  operating_cost?: number;
  base_operating_cost?: number;
  description?: string;
};

type BomDoc = {
  name: string;
  item: string;
  item_name?: string;
  company: string;
  quantity: number;
  uom?: string;
  currency?: string;
  conversion_rate?: number;
  docstatus: 0 | 1 | 2;
  is_active: 0 | 1;
  is_default: 0 | 1;
  with_operations: 0 | 1;
  amended_from?: string;
  is_phantom_bom?: 0 | 1;
  allow_alternative_item?: 0 | 1;
  track_semi_finished_goods?: 0 | 1;
  transfer_material_against?: string;
  routing?: string;
  inspection_required?: 0 | 1;
  default_source_warehouse?: string;
  default_target_warehouse?: string;
  raw_material_cost?: number;
  base_raw_material_cost?: number;
  operating_cost?: number;
  base_operating_cost?: number;
  total_cost?: number;
  base_total_cost?: number;
  rm_cost_as_per?: string;
  items?: BomComponentRow[];
  operations?: BomOperationRow[];
  creation: string;
  modified: string;
};

const cell = "px-3 py-2";
const plainTableWrap = "overflow-x-auto rounded-xl border border-border bg-surface";
const plainTableHead = "border-b border-border bg-canvas text-graphite-500";

/** Internal document link — same visual treatment as every other read-only entity page's
 * local `DocLink` helper (e.g. the Work Order detail page); not promoted to a shared
 * component here, matching that existing per-file convention rather than inventing one. */
function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-mono text-signal hover:underline">
      {children}
    </Link>
  );
}

function yesNo(value: 0 | 1 | undefined): string {
  return value ? "Yes" : "No";
}

export default async function BomDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let doc: BomDoc;
  try {
    doc = await getDoc<BomDoc>("BOM", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const status = bomStatus(doc);
  const items = doc.items ?? [];
  const operations = doc.operations ?? [];
  const currency = doc.currency || "";

  const itemLink = (
    <DocLink href={`/master-data/items/${encodeURIComponent(doc.item)}`}>
      {doc.item_name || doc.item}
      {doc.item_name && doc.item_name !== doc.item && (
        <span className="ml-1 text-graphite-500">({doc.item})</span>
      )}
    </DocLink>
  );

  const overviewTab = (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold text-graphite-900">Bill of Materials</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <DocField label="Finished Item" value={itemLink} />
          <DocField label="Company" value={doc.company} />
          <DocField label="Quantity" value={`${doc.quantity} ${doc.uom || ""}`.trim()} mono />
          {currency && <DocField label="Currency" value={currency} />}
          {doc.conversion_rate !== undefined && doc.conversion_rate !== 1 && (
            <DocField label="Conversion Rate" value={String(doc.conversion_rate)} mono />
          )}
          <DocField label="With Operations" value={yesNo(doc.with_operations)} />
          <DocField label="Is Active" value={yesNo(doc.is_active)} />
          <DocField label="Is Default" value={yesNo(doc.is_default)} />
          {doc.amended_from && (
            <DocField
              label="Amended From"
              value={<DocLink href={`/master-data/boms/${encodeURIComponent(doc.amended_from)}`}>{doc.amended_from}</DocLink>}
            />
          )}
          {doc.routing && <DocField label="Routing" value={doc.routing} />}
          {doc.transfer_material_against && (
            <DocField label="Transfer Material Against" value={doc.transfer_material_against} />
          )}
          {doc.default_source_warehouse && (
            <DocField
              label="Default Source Warehouse"
              value={
                <DocLink href={`/master-data/warehouses/${encodeURIComponent(doc.default_source_warehouse)}`}>
                  {doc.default_source_warehouse}
                </DocLink>
              }
            />
          )}
          {doc.default_target_warehouse && (
            <DocField
              label="Default Target Warehouse"
              value={
                <DocLink href={`/master-data/warehouses/${encodeURIComponent(doc.default_target_warehouse)}`}>
                  {doc.default_target_warehouse}
                </DocLink>
              }
            />
          )}
          <DocField label="Allow Alternative Item" value={yesNo(doc.allow_alternative_item)} />
          <DocField label="Is Phantom BOM" value={yesNo(doc.is_phantom_bom)} />
          <DocField label="Track Semi Finished Goods" value={yesNo(doc.track_semi_finished_goods)} />
          <DocField label="Quality Inspection Required" value={yesNo(doc.inspection_required)} />
        </dl>
      </div>
      <p className="text-xs text-graphite-500">
        Read-only view of ERPNext&apos;s own BOM record. Lifecycle transitions (submit, cancel, amend)
        and cost recompute are not performed by this app — see this record&apos;s status above for
        its current backend-recorded state.
      </p>
    </div>
  );

  const componentsTab = (
    <div className={plainTableWrap}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={plainTableHead}>
            <th className={`${cell} font-semibold`}>Item</th>
            <th className={`${cell} text-right font-semibold`}>Qty</th>
            <th className={`${cell} text-right font-semibold`}>Rate</th>
            <th className={`${cell} text-right font-semibold`}>Amount</th>
            <th className={`${cell} font-semibold`}>Source Warehouse</th>
            <th className={`${cell} font-semibold`}>Operation</th>
            <th className={`${cell} font-semibold`}>Nested BOM</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className={cell}>
                <DocLink href={`/master-data/items/${encodeURIComponent(row.item_code)}`}>
                  {row.item_name || row.item_code}
                </DocLink>
                {row.item_name && row.item_name !== row.item_code && (
                  <span className="ml-1 font-mono text-xs text-graphite-500">({row.item_code})</span>
                )}
                {row.allow_alternative_item ? (
                  <span className="ml-2 rounded bg-graphite-500/10 px-1.5 py-0.5 text-xs font-medium text-graphite-500">
                    Alt. allowed
                  </span>
                ) : null}
              </td>
              <td className={`${cell} text-right font-mono tabular-nums`}>
                {row.qty} {row.uom}
              </td>
              <td className={`${cell} text-right font-mono tabular-nums`}>
                {row.rate !== undefined ? formatAmount(row.rate) : "—"}
              </td>
              <td className={`${cell} text-right font-mono tabular-nums`}>
                {row.amount !== undefined ? formatAmount(row.amount) : "—"}
              </td>
              <td className={cell}>
                {row.source_warehouse ? (
                  <DocLink href={`/master-data/warehouses/${encodeURIComponent(row.source_warehouse)}`}>
                    {row.source_warehouse}
                  </DocLink>
                ) : (
                  "—"
                )}
              </td>
              <td className={`${cell} text-graphite-500`}>{row.operation || "—"}</td>
              <td className={cell}>
                {row.bom_no ? (
                  <DocLink href={`/master-data/boms/${encodeURIComponent(row.bom_no)}`}>{row.bom_no}</DocLink>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-graphite-500">
                No components on this BOM.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const operationsTab = (
    <div className={plainTableWrap}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={plainTableHead}>
            <th className={`${cell} text-right font-semibold`}>#</th>
            <th className={`${cell} font-semibold`}>Operation</th>
            <th className={`${cell} font-semibold`}>Workstation</th>
            <th className={`${cell} text-right font-semibold`}>Time (mins)</th>
            <th className={`${cell} text-right font-semibold`}>Batch Size</th>
            <th className={`${cell} text-right font-semibold`}>Hourly Rate</th>
            <th className={`${cell} text-right font-semibold`}>Operating Cost</th>
            <th className={`${cell} font-semibold`}>Description</th>
          </tr>
        </thead>
        <tbody>
          {operations.map((op, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className={`${cell} text-right text-graphite-400`}>{i + 1}</td>
              <td className={`${cell} text-graphite-900`}>{op.operation}</td>
              <td className={`${cell} text-graphite-500`}>{op.workstation || "—"}</td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{op.time_in_mins ?? "—"}</td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{op.batch_size ?? "—"}</td>
              <td className={`${cell} text-right font-mono tabular-nums`}>
                {op.base_hour_rate !== undefined ? formatAmount(op.base_hour_rate) : "—"}
              </td>
              <td className={`${cell} text-right font-mono tabular-nums`}>
                {op.base_operating_cost !== undefined ? formatAmount(op.base_operating_cost) : "—"}
              </td>
              <td className={`${cell} text-graphite-500`}>{op.description || "—"}</td>
            </tr>
          ))}
          {operations.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-graphite-500">
                {doc.with_operations
                  ? "No operations recorded on this BOM."
                  : "This BOM does not use operations (“With Operations” is off)."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const costingTab = (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <DocField
          label="Raw Material Cost"
          value={doc.raw_material_cost !== undefined ? `${formatAmount(doc.raw_material_cost)} ${currency}`.trim() : "—"}
          mono
        />
        <DocField
          label="Operating Cost"
          value={doc.operating_cost !== undefined ? `${formatAmount(doc.operating_cost)} ${currency}`.trim() : "—"}
          mono
        />
        <DocField
          label="Total Cost"
          value={doc.total_cost !== undefined ? `${formatAmount(doc.total_cost)} ${currency}`.trim() : "—"}
          mono
        />
        {doc.rm_cost_as_per && <DocField label="Rate Of Materials Based On" value={doc.rm_cost_as_per} />}
      </dl>
      <p className="text-xs text-graphite-500">
        Backend-recorded BOM costing values, as last computed by ERPNext — this app does not
        recalculate or refresh BOM cost. Whether these figures reflect current valuation rates is
        not independently verified (see <code>MFG-UNV-009</code>).
      </p>
    </div>
  );

  const moreInfoTab = (
    <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
      <DocField label="Company" value={doc.company} />
      <DocField label="Created" value={doc.creation?.slice(0, 10) || "—"} mono />
      <DocField label="Last modified" value={doc.modified?.slice(0, 10) || "—"} mono />
    </dl>
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Master Data", href: "/master-data" },
          { label: "Bills of Materials", href: "/master-data/boms" },
          { label: doc.name },
        ]}
      />
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-graphite-900">{doc.name}</h1>
        <div className="mt-1 flex items-center gap-2">
          <StatusPill label={status.label} tone={status.tone} />
          {doc.is_active ? <StatusPill label="Active" tone="success" /> : <StatusPill label="Inactive" tone="neutral" />}
          {doc.is_default ? <StatusPill label="Default" tone="signal" /> : null}
        </div>
      </div>
      <DocTabs
        tabs={[
          { id: "overview", label: "Overview", content: overviewTab },
          { id: "components", label: "Components", content: componentsTab },
          { id: "operations", label: "Operations", content: operationsTab },
          { id: "costing", label: "Costing", content: costingTab },
          { id: "more-info", label: "More Info", content: moreInfoTab },
        ]}
      />
    </div>
  );
}
