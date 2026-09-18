import type { WorkspaceCard } from "@/lib/sellingWorkspace";

/**
 * Master Data module home page cards. Items/Item Groups/Price Lists (2026-09-18) and now
 * Customers/Customer Groups/Suppliers/Contacts/Addresses/Territories (Business Partner
 * domain, 2026-09-19) are canonically owned under /master-data/* itself — moved from
 * /sales/* and /buying/*, with compatibility redirects left at the old paths (see
 * next.config.ts). Supplier Group has no dedicated screen anywhere in this frontend yet
 * (verified live: the doctype exists in ERPNext and Supplier references it, but no route
 * was ever built) — building its first screen is new feature work, not a relocation, so
 * it's deliberately left out of this card rather than added as a new dead/soon link; see
 * PROGRESS.md. Inventory Structure links still point at their current Stock-owned routes —
 * that canonical-move package hasn't run yet, see `docs/master-data-architecture.md` §9.
 * Entities with no existing route at all (UOM, BOM, Operation, Workstation, Company, Cost
 * Center, Project, Currency, Tax, Payment Terms) are deliberately left out rather than
 * shown as dead links or "Coming soon" — each is its own future MD package.
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
      { label: "Warehouses", href: "/stock/warehouses" },
      { label: "Batches", href: "/stock/batches" },
      { label: "Serial Nos", href: "/stock/serial-nos" },
    ],
  },
];
