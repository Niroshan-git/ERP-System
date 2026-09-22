import type { WorkspaceCard } from "@/lib/sellingWorkspace";

/**
 * Master Data module home page cards. Items/Item Groups/Price Lists (2026-09-18),
 * Customers/Customer Groups/Suppliers/Contacts/Addresses/Territories (Business Partner
 * domain, 2026-09-19), and now Warehouses (Inventory Structure domain, 2026-09-19) are
 * canonically owned under /master-data/* itself — moved from /sales/*, /buying/*, and
 * /stock/warehouses respectively, with compatibility redirects left at the old paths (see
 * next.config.ts). Supplier Group has no dedicated screen anywhere in this frontend yet
 * (verified live: the doctype exists in ERPNext and Supplier references it, but no route
 * was ever built) — building its first screen is new feature work, not a relocation, so
 * it's deliberately left out of this card rather than added as a new dead/soon link; see
 * PROGRESS.md. Batches and Serial Nos remain link-outs to their current Stock-owned
 * routes — they're transaction-generated/operational entities, not structural masters
 * (see `docs/master-data-architecture.md` §2/§7), so they were deliberately NOT moved
 * alongside Warehouse.
 * The Manufacturing Masters — BOM package (2026-09-19, Package 4A) added BOM as a net-new
 * (not moved) entity screen. Package 4B (same day) added create and Draft-only edit; a
 * same-day remediation added submitted-BOM Activate/Deactivate/Set-as-Default availability
 * actions — see `docs/backend/05-manufacturing/bom.md`. Entities
 * with no existing route at all (UOM, Operation, Workstation, Company, Cost Center, Project,
 * Currency, Tax, Payment Terms) are deliberately left out rather than shown as dead links or
 * "Coming soon" — each is its own future MD package.
 */
export const MASTER_DATA_WORKSPACE_CARDS: WorkspaceCard[] = [
  {
    title: "Products & Pricing",
    links: [
      { label: "Items", href: "/master-data/items" },
      { label: "Item Groups", href: "/master-data/item-groups" },
      { label: "Price Lists", href: "/master-data/price-lists" },
    ],
  },
  {
    title: "Business Partners",
    links: [
      { label: "Customers", href: "/master-data/customers" },
      { label: "Customer Groups", href: "/master-data/customer-groups" },
      { label: "Suppliers", href: "/master-data/suppliers" },
      { label: "Contacts", href: "/master-data/contacts" },
      { label: "Addresses", href: "/master-data/addresses" },
      { label: "Territories", href: "/master-data/territories" },
    ],
  },
  {
    title: "Inventory Structure",
    links: [
      { label: "Warehouses", href: "/master-data/warehouses" },
      { label: "Batches", href: "/stock/batches" },
      { label: "Serial Nos", href: "/stock/serial-nos" },
    ],
  },
  {
    title: "Manufacturing Masters",
    links: [{ label: "Bills of Materials", href: "/master-data/boms" }],
  },
];
