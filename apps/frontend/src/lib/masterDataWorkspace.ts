import type { WorkspaceCard } from "@/lib/sellingWorkspace";

/**
 * Master Data module home page cards (MD-1, navigation-foundation package). Every `href`
 * here points at a route that already exists under Sales/Buying/Stock — this module is a
 * new, canonical-feeling entry point onto those same shared masters, not a fork or a move.
 * See `docs/master-data-architecture.md` for the full inventory and rationale; entities
 * with no existing route at all (UOM, BOM, Operation, Workstation, Company, Cost Center,
 * Project, Currency, Tax, Payment Terms) are deliberately left out rather than shown as
 * dead links or "Coming soon" — each is its own future MD package, not this one's scope.
 */
export const MASTER_DATA_WORKSPACE_CARDS: WorkspaceCard[] = [
  {
    title: "Products & Pricing",
    links: [
      { label: "Items", href: "/sales/items" },
      { label: "Item Groups", href: "/sales/item-groups" },
      { label: "Price Lists", href: "/sales/price-lists" },
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
