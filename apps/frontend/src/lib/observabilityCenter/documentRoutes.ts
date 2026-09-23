/**
 * DocType -> canonical detail-route resolver, for Trace Detail's "Open related document"
 * action (mission §21: "Use existing routing/mapping infrastructure. Do not construct
 * guessed routes... If no safe canonical route exists: display the document identity
 * without a fake link").
 *
 * No generic doctype-to-route mapping utility exists anywhere else in this codebase —
 * every existing page that links to a related document hardcodes that one specific route
 * inline (e.g. `DeliveryNoteForm.tsx` hardcoding `/sales/orders/${name}` because it knows
 * its source is always a Sales Order). This is the first place a doctype needs to resolve
 * generically, since a trace can reference *any* doctype. Built as an explicit allowlist,
 * not a naming-convention guess — every entry here is copied from an existing, real
 * `[name]/page.tsx` route already confirmed live elsewhere in this app (`Sidebar.tsx`'s
 * `*_NAV_GROUPS`), so this never invents a route that doesn't exist. A doctype missing
 * from this map has no real detail page yet — `RelatedDocumentLink` falls back to plain
 * text rather than a broken link.
 */
const DOCTYPE_ROUTES: Record<string, string> = {
  "Work Order": "/manufacturing/work-orders",
  "Production Plan": "/manufacturing/production-plans",
  Quotation: "/sales/quotations",
  "Sales Order": "/sales/orders",
  "Pick List": "/sales/pick-lists",
  "Delivery Note": "/sales/delivery-notes",
  "Sales Invoice": "/sales/invoices",
  "Sales Partner": "/sales/sales-partners",
  "Sales Person": "/sales/sales-persons",
  Campaign: "/sales/campaigns",
  "Material Request": "/buying/material-requests",
  "Request for Quotation": "/buying/request-for-quotations",
  "Supplier Quotation": "/buying/supplier-quotations",
  "Purchase Order": "/buying/purchase-orders",
  "Purchase Receipt": "/buying/purchase-receipts",
  "Purchase Invoice": "/buying/purchase-invoices",
  "Stock Entry": "/stock/stock-entries",
  Batch: "/stock/batches",
  "Serial No": "/stock/serial-nos",
  Item: "/master-data/items",
  "Item Group": "/master-data/item-groups",
  "Price List": "/master-data/price-lists",
  Customer: "/master-data/customers",
  "Customer Group": "/master-data/customer-groups",
  Supplier: "/master-data/suppliers",
  Contact: "/master-data/contacts",
  Address: "/master-data/addresses",
  Territory: "/master-data/territories",
  Warehouse: "/master-data/warehouses",
  BOM: "/master-data/boms",
};

/** Returns the canonical detail-page href for a doctype/name pair, or `null` if this app
 * has no real route for that doctype — callers must render plain text, never a guessed link. */
export function resolveDocumentHref(doctype: string, name: string): string | null {
  const base = DOCTYPE_ROUTES[doctype];
  if (!base) return null;
  return `${base}/${encodeURIComponent(name)}`;
}
