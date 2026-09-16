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
  /** The child-table doctype carrying the back-reference field, used only inside the filter tuple. */
  childDoctype: string;
  filterField: string;
  hrefBase: string;
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
  ],
  "Sales Invoice": [],
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
};

export async function getConnections(doctype: string, name: string): Promise<Connection[]> {
  const configs = CONNECTION_CONFIG[doctype] ?? [];

  const results = await Promise.all(
    configs.map(async (config): Promise<Connection | null> => {
      try {
        const rows = await listDocs<{ name: string; docstatus: number }>(config.parentDoctype, {
          fields: ["name", "docstatus"],
          filters: [[config.childDoctype, config.filterField, "=", name]],
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
