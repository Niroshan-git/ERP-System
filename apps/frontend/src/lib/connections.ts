import "server-only";
import { listDocs } from "@/lib/erpnext";

export type Connection = {
  label: string;
  href: string;
  docs: string[];
  /**
   * The subset of `docs` that are actually Submitted (docstatus 1). ERPNext only refuses
   * to cancel a document over a link to a *submitted* referencing document — confirmed by
   * reading `check_if_doc_is_linked`/`get_linked_docs` in `frappe/model/delete_doc.py` on
   * the live server (`method == "Cancel"` only counts links where
   * `DocStatus(item.docstatus).is_submitted()`). A Draft Sales Invoice linked to a Sales
   * Order does NOT block cancelling that order; only a Submitted one does. Optional
   * because the manually-built upstream `Connection` entries (source Quotation/Sales
   * Order shown on a detail page) don't populate this — only downstream, ERPNext-style
   * cancel-blocking needs it.
   */
  submittedDocs?: string[];
};

type ConnectionConfig = {
  label: string;
  /** The doctype we actually list — permission is checked against this, not the child table. */
  parentDoctype: string;
  /** The child-table doctype carrying the back-reference field, used only inside the filter tuple. Omit if the back-reference is on the parent. */
  childDoctype?: string;
  filterField: string;
  hrefBase: string;
  /**
   * Optional additional static filter tuples, ANDed with the name-based filter above (e.g.
   * narrowing a `Stock Entry` back-reference to one `purpose`). Added for Work Order Cancel
   * (`MFG-WO-LC-1`) to split the single generic "Stock Entry" back-link into separately labeled
   * Material Transfer / Manufacture entries for a clearer blocking message — every entry that
   * doesn't need this simply omits it, unaffected.
   */
  extraFilters?: [string, string, string, string | number][];
};

/**
 * ERPNext's own "Connections" tab reads a static dashboard config per doctype
 * (frappe.get_meta / *_dashboard.js). We don't have that metadata over REST,
 * so this is a hand-built equivalent for just the doctypes this app has —
 * one connection per document generation ahead (Quotation -> Sales Order,
 * Sales Order -> Sales Invoice). Add a row here whenever a new doctype gains
 * a "create from" action.
 *
 * IMPORTANT: query the *parent* doctype with a child-table filter tuple
 * (`[childDoctype, field, "=", value]`), not the child doctype directly.
 * Frappe rejects a direct list query against an `istable=1` doctype even
 * when the caller can read the parent fine — confirmed live: the service
 * account 403s on `GET /api/resource/Sales Order Item` but the parent-table
 * query below works and returns the right result.
 */
const CONNECTION_CONFIG: Record<string, ConnectionConfig[]> = {
  Quotation: [
    {
      label: "Sales Order",
      parentDoctype: "Sales Order",
      childDoctype: "Sales Order Item",
      filterField: "prevdoc_docname",
      hrefBase: "/sales/orders",
    },
  ],
  "Sales Order": [
    {
      label: "Sales Invoice",
      parentDoctype: "Sales Invoice",
      childDoctype: "Sales Invoice Item",
      filterField: "sales_order",
      hrefBase: "/sales/invoices",
    },
    {
      label: "Delivery Note",
      parentDoctype: "Delivery Note",
      childDoctype: "Delivery Note Item",
      filterField: "against_sales_order",
      hrefBase: "/sales/delivery-notes",
    },
    {
      label: "Pick List",
      parentDoctype: "Pick List",
      childDoctype: "Pick List Item",
      filterField: "sales_order",
      hrefBase: "/sales/pick-lists",
    },
    {
      label: "Material Request",
      parentDoctype: "Material Request",
      childDoctype: "Material Request Item",
      filterField: "sales_order",
      hrefBase: "/buying/material-requests",
    },
    {
      label: "Purchase Order",
      parentDoctype: "Purchase Order",
      childDoctype: "Purchase Order Item",
      filterField: "sales_order",
      hrefBase: "/buying/purchase-orders",
    },
  ],
  "Sales Invoice": [
    {
      label: "Payment Entry",
      parentDoctype: "Payment Entry",
      childDoctype: "Payment Entry Reference",
      filterField: "reference_name",
      hrefBase: "/accounting/payment-entries",
    },
  ],
  // No downstream entry here for Delivery Note: Delivery Note Item carries no stored
  // back-reference to the Pick List it was picked through (confirmed via the live DocType
  // JSON — only `against_sales_order`/`so_detail`, the same fields set whether or not a
  // Pick List was involved), so a reliable "which Delivery Notes came from this Pick List"
  // query isn't possible over REST. The Pick List detail page instead gates its own
  // "Create Delivery Note" action on each line's own picked_qty vs delivered_qty.
  "Pick List": [],
  "Delivery Note": [
    {
      label: "Sales Invoice",
      parentDoctype: "Sales Invoice",
      childDoctype: "Sales Invoice Item",
      // Live-verified 2026-09-14: `dn_detail` on Sales Invoice Item is the specific
      // Delivery Note Item ROW's own name (e.g. "6v43m4ifmm"), not the parent Delivery
      // Note's name — filtering on it here always returned zero results even for real
      // Submitted invoices. `delivery_note` is the field that actually holds the parent
      // Delivery Note's name (matches getInvoicedQtyByDnDetail in lib/fulfillment.ts,
      // which already used the correct field).
      filterField: "delivery_note",
      hrefBase: "/sales/invoices",
    },
    {
      label: "Sales Return",
      parentDoctype: "Delivery Note",
      filterField: "return_against",
      extraFilters: [["Delivery Note", "is_return", "=", 1]],
      hrefBase: "/sales/delivery-notes",
    },
    {
      label: "Stock Entry",
      parentDoctype: "Stock Entry",
      childDoctype: "Stock Entry Detail",
      filterField: "delivery_note",
      extraFilters: [["Stock Entry", "purpose", "=", "Sales Return"]],
      hrefBase: "/stock/stock-entries",
    },
  ],
  // Buying cycle, Phase 4 (Material Request -> Request for Quotation -> Supplier
  // Quotation -> Purchase Order) — same "query the parent with a child-table filter tuple"
  // shape as Sales above.
  "Material Request": [
    {
      label: "Request for Quotation",
      parentDoctype: "Request for Quotation",
      childDoctype: "Request for Quotation Item",
      filterField: "material_request",
      hrefBase: "/buying/request-for-quotations",
    },
  ],
  "Request for Quotation": [
    {
      label: "Supplier Quotation",
      parentDoctype: "Supplier Quotation",
      childDoctype: "Supplier Quotation Item",
      filterField: "request_for_quotation",
      hrefBase: "/buying/supplier-quotations",
    },
  ],
  "Supplier Quotation": [
    {
      label: "Purchase Order",
      parentDoctype: "Purchase Order",
      childDoctype: "Purchase Order Item",
      filterField: "supplier_quotation",
      hrefBase: "/buying/purchase-orders",
    },
  ],
  // Purchase Order / Purchase Receipt / Purchase Invoice — same "query the parent with a
  // child-table filter tuple" shape as every entry above. `filterField` values here follow
  // the live-verified field-name gotcha: Purchase Receipt Item's own back-reference to its
  // source Purchase Order Item is `purchase_order_item`, but Purchase Invoice Item's
  // back-references are `po_detail`/`pr_detail` (NOT `purchase_order_item`/
  // `purchase_receipt_item`) — these three doctypes name the same concept inconsistently.
  // The filter tuples below only need the *parent* Link field (`purchase_order`/
  // `purchase_receipt`), not the child-row-id field, so that inconsistency doesn't actually
  // surface here — it matters for the create-from-source actions instead (see
  // purchase-receipts/actions.ts and purchase-invoices/actions.ts).
  "Purchase Order": [
    {
      label: "Purchase Receipt",
      parentDoctype: "Purchase Receipt",
      childDoctype: "Purchase Receipt Item",
      filterField: "purchase_order",
      hrefBase: "/buying/purchase-receipts",
    },
    {
      label: "Purchase Invoice",
      parentDoctype: "Purchase Invoice",
      childDoctype: "Purchase Invoice Item",
      filterField: "purchase_order",
      hrefBase: "/buying/purchase-invoices",
    },
  ],
  "Purchase Receipt": [
    {
      label: "Purchase Invoice",
      parentDoctype: "Purchase Invoice",
      childDoctype: "Purchase Invoice Item",
      filterField: "purchase_receipt",
      hrefBase: "/buying/purchase-invoices",
    },
  ],
  "Purchase Invoice": [],
  // Production Plan (PP-8, Cancel): the three doctypes `make_work_order`/`make_material_request`
  // can generate, per docs/backend/05-manufacturing/production-plan.md. Work Order carries
  // `production_plan` as a direct field on itself (not a child table) — Frappe's own filter
  // syntax treats a 4-tuple `[doctype, field, op, value]` identically to a plain 3-tuple filter
  // when `doctype` equals the doctype being listed (the standard example in Frappe's own
  // `get_list` docs is exactly this shape), so `childDoctype: "Work Order"` here queries Work
  // Order's own field directly, not a join — same `getConnections()` code path as every
  // child-table entry above, no new query logic needed. Material Request and (subcontract)
  // Purchase Order both carry the back-reference on their child row instead
  // (`Material Request Item.production_plan`, `Purchase Order Item.production_plan`), matching
  // the already-accepted PP-5/PP-6/PP-5R dedup precedent this same `getConnections()` function
  // already implements.
  "Production Plan": [
    {
      label: "Work Order",
      parentDoctype: "Work Order",
      childDoctype: "Work Order",
      filterField: "production_plan",
      hrefBase: "/manufacturing/work-orders",
    },
    {
      label: "Material Request",
      parentDoctype: "Material Request",
      childDoctype: "Material Request Item",
      filterField: "production_plan",
      hrefBase: "/buying/material-requests",
    },
    {
      label: "Purchase Order",
      parentDoctype: "Purchase Order",
      childDoctype: "Purchase Order Item",
      filterField: "production_plan",
      hrefBase: "/buying/purchase-orders",
    },
  ],
  // BOM Cancel guard (MFG-CLOSE-2): Frappe's generic back-link check (`check_if_doc_is_linked`,
  // source-confirmed in `bom.py`'s `on_cancel` -> `check_no_back_links_exist` chain) blocks
  // cancelling a BOM referenced by ANY submitted document across many doctypes (Work Order, Job
  // Card, Production Plan Item/Sub Assembly Item, another BOM's sub-assembly `bom_no`, Stock
  // Entry, Quality Inspection, Subcontracting, PO/PR/PI/Material Request item rows — full list in
  // `docs/backend/05-manufacturing/bom.md`'s Cancel/Amend contract). Only the one relationship
  // this frontend can actually create — Work Order via its own direct `bom_no` field, same
  // 4-tuple-as-3-tuple shape as the Production Plan entry above — is checked proactively here;
  // everything else is left to ERPNext's own real enforcement (this proactive check is a UI
  // nicety, not the source of truth, same as every other entry in this file). The sub-assembly
  // "linked with other BOMs" case is BOM's own domain-specific `validate_bom_links()` check, not
  // a generic back-link — its message passes through `cancelBomAction`'s `humanizeCancelError`
  // untouched rather than being duplicated here.
  BOM: [
    {
      label: "Work Order",
      parentDoctype: "Work Order",
      childDoctype: "Work Order",
      filterField: "bom_no",
      hrefBase: "/manufacturing/work-orders",
    },
  ],
  // Work Order Cancel guard (MFG-WO-LC-1): unlike BOM, Work Order's own `on_cancel() ->
  // validate_cancel()` (source-confirmed on the live v16.34.2 install) carries its OWN
  // bespoke check — a raw-SQL scan for any submitted Stock Entry with `work_order = <name>`,
  // regardless of purpose — entirely separate from BOM's generic-backlink-only approach. Split
  // into labeled entries here purely for a clearer blocking message (ERPNext's own check
  // doesn't distinguish purpose; this frontend does, since it already tracks these categories
  // elsewhere on the Work Order detail page). Job Card is a further, independent blocker — but
  // caught by the *generic* Frappe back-link mechanism instead (`LinkExistsError`, a different
  // exception shape from the Stock Entry `ValidationError`), since Work Order's own
  // `validate_cancel()` never looks at Job Card at all. Every entry's `hrefBase` points at a real
  // canonical detail route (Job Card -> `MFG-JOBCARD-1`, Stock Entry -> the pre-existing
  // `/stock/stock-entries/[name]` page, purpose-agnostic) — the Work Order detail page's blocker
  // preview renders every `submittedDocs` entry as a real per-document link (`${hrefBase}/${name}`),
  // closing `MFG-FOLLOWUP-WO-LINK-1` (`MFG-STOCK-LC-VERIFY-1`, 2026-09-24): Material Transfer/
  // Manufacture/Material Consumption previously rendered as plain text; only Job Card did.
  //
  // Two further real link fields to Work Order exist on this instance (`Pick List.work_order`,
  // `Serial No.work_order`) but are not included here — this app has no create/cancel workflow
  // that would ever generate a submitted Pick List or Serial No referencing a Work Order
  // specifically (Pick List here is Sales-Order-scoped only), so a proactive check would query
  // for a case that can't occur through this app; left to ERPNext's own real enforcement if
  // ever wrong, same "proactive check is a UI nicety, not the source of truth" precedent as
  // every other entry in this file. See `docs/backend/05-manufacturing/work-order.md`'s
  // "Cancel contract" section for the full dependency matrix and evidence.
  "Work Order": [
    {
      label: "Material Transfer",
      parentDoctype: "Stock Entry",
      childDoctype: "Stock Entry",
      filterField: "work_order",
      extraFilters: [["Stock Entry", "purpose", "=", "Material Transfer for Manufacture"]],
      hrefBase: "/stock/stock-entries",
    },
    {
      label: "Manufacture",
      parentDoctype: "Stock Entry",
      childDoctype: "Stock Entry",
      filterField: "work_order",
      extraFilters: [["Stock Entry", "purpose", "=", "Manufacture"]],
      hrefBase: "/stock/stock-entries",
    },
    {
      // `validate_cancel()`'s raw-SQL check is unfiltered by purpose (source-confirmed,
      // see work-order.md's "Cancel contract"), so a submitted Material Consumption for
      // Manufacture entry blocks Work Order cancel the same way Material Transfer/Manufacture
      // do, even though this app has no create flow that produces one today (Desk-created
      // entries against this Work Order would still count). Same shape as the two entries
      // above purely for a clearer, labeled blocking message.
      label: "Material Consumption",
      parentDoctype: "Stock Entry",
      childDoctype: "Stock Entry",
      filterField: "work_order",
      extraFilters: [["Stock Entry", "purpose", "=", "Material Consumption for Manufacture"]],
      hrefBase: "/stock/stock-entries",
    },
    {
      label: "Job Card",
      parentDoctype: "Job Card",
      childDoctype: "Job Card",
      filterField: "work_order",
      hrefBase: "/manufacturing/job-cards",
    },
  ],
};

export async function getConnections(doctype: string, name: string): Promise<Connection[]> {
  const configs = CONNECTION_CONFIG[doctype] ?? [];

  const results = await Promise.all(
    configs.map(async (config): Promise<Connection | null> => {
      try {
        const filterClause = config.childDoctype
          ? [config.childDoctype, config.filterField, "=", name]
          : [config.parentDoctype, config.filterField, "=", name];
        const rows = await listDocs<{ name: string; docstatus: number }>(config.parentDoctype, {
          fields: ["name", "docstatus"],
          filters: [filterClause, ...(config.extraFilters ?? [])],
          limit: 500,
        });
        const docs = Array.from(new Set(rows.map((r) => r.name))).sort();
        const submittedDocs = Array.from(new Set(rows.filter((r) => r.docstatus === 1).map((r) => r.name))).sort();
        return { label: config.label, href: config.hrefBase, docs, submittedDocs };
      } catch {
        // A 403 here means "can't tell", not "there are none" — omit rather than lie.
        return null;
      }
    }),
  );

  return results.filter((r): r is Connection => r !== null);
}
