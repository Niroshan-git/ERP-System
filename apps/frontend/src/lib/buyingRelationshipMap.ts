import "server-only";
import { getDoc } from "@/lib/erpnext";
import { getConnections } from "@/lib/connections";
import {
  materialRequestStatus,
  rfqStatus,
  supplierQuotationStatus,
  purchaseOrderStatus,
  purchaseReceiptStatus,
  purchaseInvoiceStatus,
  type StatusDisplay,
} from "@/lib/erpStatus";
import type { DocStatus } from "@/lib/docStatus";
import type { RelationshipNode } from "@/lib/relationshipMap";

/**
 * Buying-cycle analog of lib/relationshipMap.ts — same SAP B1-style "Relationship Map"
 * algorithm (climb to every root ancestor, then walk every downstream branch), applied to
 * the 6-stage Buying chain: Material Request -> Request for Quotation -> Supplier
 * Quotation -> Purchase Order -> Purchase Receipt -> Purchase Invoice. A direct structural
 * mirror of relationshipMap.ts — see that file's own top-of-module doc comment for the full
 * algorithm explanation, not repeated here. Deliberately a separate file (not a shared
 * generic one) — Sales' own relationshipMap.ts stays untouched per this build's own scope.
 */

const HREF_BASE: Record<string, string> = {
  "Material Request": "/buying/material-requests",
  "Request for Quotation": "/buying/request-for-quotations",
  "Supplier Quotation": "/buying/supplier-quotations",
  "Purchase Order": "/buying/purchase-orders",
  "Purchase Receipt": "/buying/purchase-receipts",
  "Purchase Invoice": "/buying/purchase-invoices",
};

type DocRef = { doctype: string; name: string };

function keyOf(ref: DocRef): string {
  return `${ref.doctype}::${ref.name}`;
}

function dedupeRefs(refs: DocRef[]): DocRef[] {
  const byKey = new Map<string, DocRef>();
  for (const r of refs) byKey.set(keyOf(r), r);
  return Array.from(byKey.values());
}

/**
 * Fetches exactly the fields each doctype's real erpStatus function needs, plus its own
 * upstream reference field(s) (read straight off its items, same technique every Buying
 * detail page already uses for its own single-hop upstream Connections entry / DocField).
 *
 * Purchase Invoice special case: a line billed via a Purchase Receipt already reaches that
 * Purchase Receipt's own upstream Purchase Order through the receipt itself, so only a line
 * with NO purchase_receipt contributes its purchase_order as a *direct* parent here — this
 * avoids drawing a redundant duplicate edge straight from the Purchase Order to the invoice
 * for the common case. Exact mirror of relationshipMap.ts's own Sales Invoice case (see its
 * doc comment for the full reasoning) — a receipt-sourced invoice carries both
 * purchase_order and purchase_receipt on the same line (confirmed via
 * buildInvoiceItemFromPurchaseReceipt's carryover, referenced in
 * purchase-invoices/[name]/page.tsx's own doc comment), so the same dedup applies here too.
 */
async function loadNodeData(ref: DocRef): Promise<{ status: StatusDisplay; parents: DocRef[] }> {
  switch (ref.doctype) {
    case "Material Request": {
      const doc = await getDoc<{
        status: string;
        docstatus: DocStatus;
        per_ordered: number;
        per_received: number;
      }>("Material Request", ref.name);
      return { status: materialRequestStatus(doc), parents: [] };
    }
    case "Request for Quotation": {
      const doc = await getDoc<{
        docstatus: DocStatus;
        items: { material_request?: string }[];
      }>("Request for Quotation", ref.name);
      const parents = dedupeRefs(
        doc.items
          .map((i) => i.material_request)
          .filter((v): v is string => Boolean(v))
          .map((name) => ({ doctype: "Material Request", name })),
      );
      return { status: rfqStatus(doc), parents };
    }
    case "Supplier Quotation": {
      const doc = await getDoc<{
        status: string;
        docstatus: DocStatus;
        items: { request_for_quotation?: string }[];
      }>("Supplier Quotation", ref.name);
      const parents = dedupeRefs(
        doc.items
          .map((i) => i.request_for_quotation)
          .filter((v): v is string => Boolean(v))
          .map((name) => ({ doctype: "Request for Quotation", name })),
      );
      return { status: supplierQuotationStatus(doc), parents };
    }
    case "Purchase Order": {
      const doc = await getDoc<{
        status: string;
        docstatus: DocStatus;
        per_billed: number;
        per_received: number;
        items: { supplier_quotation?: string }[];
      }>("Purchase Order", ref.name);
      const parents = dedupeRefs(
        doc.items
          .map((i) => i.supplier_quotation)
          .filter((v): v is string => Boolean(v))
          .map((name) => ({ doctype: "Supplier Quotation", name })),
      );
      return { status: purchaseOrderStatus(doc), parents };
    }
    case "Purchase Receipt": {
      const doc = await getDoc<{
        status: string;
        docstatus: DocStatus;
        per_billed: number;
        per_returned: number;
        grand_total: number;
        is_return?: 0 | 1;
        items: { purchase_order?: string }[];
      }>("Purchase Receipt", ref.name);
      const parents = dedupeRefs(
        doc.items
          .map((i) => i.purchase_order)
          .filter((v): v is string => Boolean(v))
          .map((name) => ({ doctype: "Purchase Order", name })),
      );
      return { status: purchaseReceiptStatus(doc), parents };
    }
    case "Purchase Invoice": {
      const doc = await getDoc<{
        status: string;
        docstatus: DocStatus;
        outstanding_amount: number;
        on_hold?: 0 | 1;
        release_date?: string;
        items: { purchase_order?: string; purchase_receipt?: string }[];
      }>("Purchase Invoice", ref.name);
      const viaPurchaseReceipt = new Set(
        doc.items.map((i) => i.purchase_receipt).filter((v): v is string => Boolean(v)),
      );
      const directPurchaseOrders = new Set(
        doc.items.filter((i) => !i.purchase_receipt && i.purchase_order).map((i) => i.purchase_order as string),
      );
      const parents = dedupeRefs([
        ...Array.from(viaPurchaseReceipt).map((name) => ({ doctype: "Purchase Receipt", name })),
        ...Array.from(directPurchaseOrders).map((name) => ({ doctype: "Purchase Order", name })),
      ]);
      return { status: purchaseInvoiceStatus(doc), parents };
    }
    default:
      return { status: { label: "Unknown", tone: "neutral" }, parents: [] };
  }
}

/** Climbs upstream from `ref` until it finds every root ancestor (a document with no
 * parent of its own — usually the originating Material Request, or the document itself if
 * created standalone, e.g. a Purchase Order raised with no Supplier Quotation). `seen`
 * guards against re-walking the same node twice when multiple lines converge on a shared
 * ancestor. */
async function findRoots(ref: DocRef, seen: Set<string>): Promise<DocRef[]> {
  if (seen.has(keyOf(ref))) return [];
  seen.add(keyOf(ref));
  const { parents } = await loadNodeData(ref);
  if (parents.length === 0) return [ref];
  const rootsPerParent = await Promise.all(parents.map((p) => findRoots(p, seen)));
  return dedupeRefs(rootsPerParent.flat());
}

/** Downstream children of `ref`, reusing the existing Connections config/query — every
 * configured entry's `label` is already identical to the real doctype name it points at,
 * so it doubles as the child doctype name directly without a separate lookup table.
 *
 * Purchase Order needs one extra step, exact mirror of relationshipMap.ts's own Sales Order
 * case: a Purchase Invoice billed off one of this Purchase Order's own Purchase Receipts
 * legitimately matches *both* this Purchase Order's direct "Purchase Invoice" Connections
 * query and its Purchase Receipt's own — without deduping, it would render twice (once as a
 * direct sibling of the Purchase Receipt, once nested correctly under it).
 */
async function getChildren(ref: DocRef): Promise<DocRef[]> {
  const connections = await getConnections(ref.doctype, ref.name);
  if (ref.doctype !== "Purchase Order") {
    return connections.flatMap((c) => c.docs.map((name) => ({ doctype: c.label, name })));
  }

  const purchaseReceipts = connections.find((c) => c.label === "Purchase Receipt")?.docs ?? [];
  const directInvoices = connections.find((c) => c.label === "Purchase Invoice")?.docs ?? [];
  const viaPurchaseReceiptConnections = await Promise.all(
    purchaseReceipts.map((pr) => getConnections("Purchase Receipt", pr)),
  );
  const viaPurchaseReceipt = new Set(
    viaPurchaseReceiptConnections
      .flat()
      .filter((c) => c.label === "Purchase Invoice")
      .flatMap((c) => c.docs),
  );
  const dedupedInvoices = directInvoices.filter((name) => !viaPurchaseReceipt.has(name));

  return [
    ...purchaseReceipts.map((name) => ({ doctype: "Purchase Receipt", name })),
    ...dedupedInvoices.map((name) => ({ doctype: "Purchase Invoice", name })),
  ];
}

async function buildNode(ref: DocRef, current: DocRef, ancestryPath: Set<string>): Promise<RelationshipNode> {
  const [{ status }, children] = await Promise.all([loadNodeData(ref), getChildren(ref)]);
  // A node already on the path from the root down to here would be a genuine cycle
  // (impossible with real ERPNext data, but guarded rather than trusted) — rendered as a
  // childless leaf instead of recursing forever.
  const nextPath = new Set(ancestryPath);
  nextPath.add(keyOf(ref));
  const childNodes = await Promise.all(
    children.filter((c) => !ancestryPath.has(keyOf(c))).map((c) => buildNode(c, current, nextPath)),
  );
  return {
    doctype: ref.doctype,
    name: ref.name,
    href: `${HREF_BASE[ref.doctype]}/${encodeURIComponent(ref.name)}`,
    status,
    isCurrent: keyOf(ref) === keyOf(current),
    children: childNodes,
  };
}

/** Builds the full multi-hop relationship tree for the given Buying document — every root
 * ancestor (usually just one Material Request, or the document itself if created
 * standalone), each expanded all the way down through every downstream branch. */
export async function getBuyingRelationshipMap(doctype: string, name: string): Promise<RelationshipNode[]> {
  const current: DocRef = { doctype, name };
  const roots = await findRoots(current, new Set());
  return Promise.all(roots.map((r) => buildNode(r, current, new Set())));
}
