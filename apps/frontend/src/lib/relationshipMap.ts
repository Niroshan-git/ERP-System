import "server-only";
import { getDoc } from "@/lib/erpnext";
import { getConnections, type Connection } from "@/lib/connections";
import { quotationStatus, salesOrderStatus, salesInvoiceStatus, deliveryNoteStatus, type StatusDisplay } from "@/lib/erpStatus";
import type { DocStatus } from "@/lib/docStatus";

/**
 * Full document-flow chain for the Sales cycle (Quotation -> Sales Order -> Delivery Note
 * -> Sales Invoice, plus the Sales-Order-direct-to-Sales-Invoice shortcut that bypasses
 * Delivery Note) — a SAP B1-style "Relationship Map", not just the one-hop Connections
 * list every detail page already shows. Given any document in the chain, this walks all
 * the way up to the originating root (usually the Quotation, or the document itself if it
 * was created standalone) and then back down through every branch, regardless of how many
 * hops away from the starting document a given node is.
 */

export type RelationshipNode = {
  doctype: string;
  name: string;
  href: string;
  status: StatusDisplay;
  isCurrent: boolean;
  children: RelationshipNode[];
};

const HREF_BASE: Record<string, string> = {
  Quotation: "/sales/quotations",
  "Sales Order": "/sales/orders",
  "Delivery Note": "/sales/delivery-notes",
  "Sales Invoice": "/sales/invoices",
};

type DocRef = { doctype: string; name: string };

function keyOf(ref: DocRef): string {
  return `${ref.doctype}::${ref.name}`;
}

/**
 * Perf fix (2026-09-26, disclosed slow-page-load report): the tree walk below revisits the
 * same document from multiple directions — `findRoots` climbs up through a node on its way
 * to the root, then `buildNode` walks back down through that same node on its way to the
 * leaves, and the Sales-Order branch of `getChildren` computes a Delivery Note's own
 * `getConnections()` once to dedupe invoices and then `buildNode` recomputes the identical
 * call again when it recurses into that same Delivery Note. None of that was cached, so a
 * single page load could fire the same `getDoc`/`getConnections` call 2-3x. This cache is
 * created fresh per `getRelationshipMap()` invocation (passed down as a plain argument, not
 * module-level state) so it never leaks data across concurrent requests for different
 * documents/users — it only dedupes repeat calls within one tree build.
 */
type RelMapCache = {
  nodeData: Map<string, Promise<{ status: StatusDisplay; parents: DocRef[] }>>;
  connections: Map<string, Promise<Connection[]>>;
};

function newCache(): RelMapCache {
  return { nodeData: new Map(), connections: new Map() };
}

function cachedLoadNodeData(ref: DocRef, cache: RelMapCache) {
  const key = keyOf(ref);
  let p = cache.nodeData.get(key);
  if (!p) {
    p = loadNodeData(ref);
    cache.nodeData.set(key, p);
  }
  return p;
}

function cachedGetConnections(doctype: string, name: string, cache: RelMapCache) {
  const key = `${doctype}::${name}`;
  let p = cache.connections.get(key);
  if (!p) {
    p = getConnections(doctype, name);
    cache.connections.set(key, p);
  }
  return p;
}

function dedupeRefs(refs: DocRef[]): DocRef[] {
  const byKey = new Map<string, DocRef>();
  for (const r of refs) byKey.set(keyOf(r), r);
  return Array.from(byKey.values());
}

/**
 * Fetches exactly the fields each doctype's real erpStatus function needs, plus its own
 * upstream reference field(s) (read straight off its items, same technique every detail
 * page already uses for its own single-hop upstream Connections entry).
 *
 * Sales Invoice special case: a line billed via a Delivery Note already reaches that
 * Delivery Note's own upstream Sales Order through the Delivery Note itself, so only a
 * line with NO delivery_note contributes its sales_order as a *direct* parent here — this
 * avoids drawing a redundant duplicate edge straight from the Sales Order to the invoice
 * for the common case. (An invoice mixing DN-sourced and direct-from-SO lines is a real
 * but rare edge case where the invoice can legitimately appear twice in the rendered tree
 * — acceptable for a visualization aid; the Connections tab's list view remains the
 * authoritative source.)
 */
async function loadNodeData(ref: DocRef): Promise<{ status: StatusDisplay; parents: DocRef[] }> {
  switch (ref.doctype) {
    case "Quotation": {
      const doc = await getDoc<{ status: string; docstatus: DocStatus }>("Quotation", ref.name);
      return { status: quotationStatus(doc), parents: [] };
    }
    case "Sales Order": {
      const doc = await getDoc<{
        status: string;
        docstatus: DocStatus;
        per_delivered: number;
        per_billed: number;
        delivery_date?: string;
        items: { prevdoc_docname?: string }[];
      }>("Sales Order", ref.name);
      const parents = dedupeRefs(
        doc.items
          .map((i) => i.prevdoc_docname)
          .filter((v): v is string => Boolean(v))
          .map((name) => ({ doctype: "Quotation", name })),
      );
      return { status: salesOrderStatus(doc), parents };
    }
    case "Delivery Note": {
      const doc = await getDoc<{
        status: string;
        docstatus: DocStatus;
        per_billed: number;
        is_return?: 0 | 1;
        items: { against_sales_order?: string }[];
      }>("Delivery Note", ref.name);
      const parents = dedupeRefs(
        doc.items
          .map((i) => i.against_sales_order)
          .filter((v): v is string => Boolean(v))
          .map((name) => ({ doctype: "Sales Order", name })),
      );
      return { status: deliveryNoteStatus(doc), parents };
    }
    case "Sales Invoice": {
      const doc = await getDoc<{
        status: string;
        items: { sales_order?: string; delivery_note?: string }[];
      }>("Sales Invoice", ref.name);
      const viaDeliveryNote = new Set(doc.items.map((i) => i.delivery_note).filter((v): v is string => Boolean(v)));
      const directSalesOrders = new Set(
        doc.items.filter((i) => !i.delivery_note && i.sales_order).map((i) => i.sales_order as string),
      );
      const parents = dedupeRefs([
        ...Array.from(viaDeliveryNote).map((name) => ({ doctype: "Delivery Note", name })),
        ...Array.from(directSalesOrders).map((name) => ({ doctype: "Sales Order", name })),
      ]);
      return { status: salesInvoiceStatus(doc), parents };
    }
    default:
      return { status: { label: "Unknown", tone: "neutral" }, parents: [] };
  }
}

/** Climbs upstream from `ref` until it finds every root ancestor (a document with no
 * parent of its own — usually the originating Quotation). `seen` guards against re-walking
 * the same node twice when multiple lines converge on a shared ancestor. */
async function findRoots(ref: DocRef, seen: Set<string>, cache: RelMapCache): Promise<DocRef[]> {
  if (seen.has(keyOf(ref))) return [];
  seen.add(keyOf(ref));
  const { parents } = await cachedLoadNodeData(ref, cache);
  if (parents.length === 0) return [ref];
  const rootsPerParent = await Promise.all(parents.map((p) => findRoots(p, seen, cache)));
  return dedupeRefs(rootsPerParent.flat());
}

/** Downstream children of `ref`, reusing the existing Connections config/query — every
 * configured entry's `label` is already identical to the real doctype name it points at
 * (Quotation/Sales Order/Delivery Note/Sales Invoice), so it doubles as the child
 * doctype name directly without a separate lookup table.
 *
 * Sales Order needs one extra step: createDeliveryNoteFromSalesOrderAction always carries
 * `sales_order`/`so_detail` through onto a Delivery-Note-sourced invoice line too (see
 * buildInvoiceItemFromDeliveryNote's doc comment in sales/invoices/actions.ts), so an
 * invoice billed off one of this Sales Order's own Delivery Notes legitimately matches
 * *both* this Sales Order's direct "Sales Invoice" Connections query and its Delivery
 * Note's — without deduping, it would render twice (once as a direct sibling of the
 * Delivery Note, once nested correctly under it). This is the common case, not a rare
 * edge case, since every Sales-Order-to-Delivery-Note-to-Invoice chain hits it.
 */
async function getChildren(ref: DocRef, cache: RelMapCache): Promise<DocRef[]> {
  const connections = await cachedGetConnections(ref.doctype, ref.name, cache);
  if (ref.doctype !== "Sales Order") {
    return connections.flatMap((c) => c.docs.map((name) => ({ doctype: c.label, name })));
  }

  const deliveryNotes = connections.find((c) => c.label === "Delivery Note")?.docs ?? [];
  const directInvoices = connections.find((c) => c.label === "Sales Invoice")?.docs ?? [];
  const viaDeliveryNoteConnections = await Promise.all(
    deliveryNotes.map((dn) => cachedGetConnections("Delivery Note", dn, cache)),
  );
  const viaDeliveryNote = new Set(
    viaDeliveryNoteConnections
      .flat()
      .filter((c) => c.label === "Sales Invoice")
      .flatMap((c) => c.docs),
  );
  const dedupedInvoices = directInvoices.filter((name) => !viaDeliveryNote.has(name));

  return [
    ...deliveryNotes.map((name) => ({ doctype: "Delivery Note", name })),
    ...dedupedInvoices.map((name) => ({ doctype: "Sales Invoice", name })),
  ];
}

async function buildNode(
  ref: DocRef,
  current: DocRef,
  ancestryPath: Set<string>,
  cache: RelMapCache,
): Promise<RelationshipNode> {
  const [{ status }, children] = await Promise.all([cachedLoadNodeData(ref, cache), getChildren(ref, cache)]);
  // A node already on the path from the root down to here would be a genuine cycle
  // (impossible with real ERPNext data, but guarded rather than trusted) — rendered as a
  // childless leaf instead of recursing forever.
  const nextPath = new Set(ancestryPath);
  nextPath.add(keyOf(ref));
  const childNodes = await Promise.all(
    children.filter((c) => !ancestryPath.has(keyOf(c))).map((c) => buildNode(c, current, nextPath, cache)),
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

/** Builds the full multi-hop relationship tree for the given document — every root
 * ancestor (usually just one Quotation, or the document itself if created standalone),
 * each expanded all the way down through every downstream branch. */
export async function getRelationshipMap(doctype: string, name: string): Promise<RelationshipNode[]> {
  const current: DocRef = { doctype, name };
  const cache = newCache();
  const roots = await findRoots(current, new Set(), cache);
  return Promise.all(roots.map((r) => buildNode(r, current, new Set(), cache)));
}
