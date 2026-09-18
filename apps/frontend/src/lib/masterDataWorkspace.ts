import type { WorkspaceCard } from "@/lib/sellingWorkspace";

/**
 * Master Data module home page cards. Items/Item Groups/Price Lists are now canonically
 * owned under /master-data/* itself (Master Data Canonicalization package, 2026-09-18) —
 * moved from /sales/*, with a compatibility redirect left at the old paths (see
 * next.config.ts). Business Partners and Inventory Structure links still point at their
 * current Sales/Buying/Stock-owned routes — their own canonical-move packages haven't run
 * yet, see `docs/master-data-architecture.md` §9. Entities with no existing route at all
 * (UOM, BOM, Operation, Workstation, Company, Cost Center, Project, Currency, Tax, Payment
 * Terms) are deliberately left out rather than shown as dead links or "Coming soon" — each
 * is its own future MD package, not this one's scope.
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
      { label: "Customers", href: "/sales/customers" },
      { label: "Customer Groups", href: "/sales/customer-groups" },
      { label: "Suppliers", href: "/buying/suppliers" },
      { label: "Contacts", href: "/sales/contacts" },
      { label: "Addresses", href: "/sales/addresses" },
      { label: "Territories", href: "/sales/territories" },
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
