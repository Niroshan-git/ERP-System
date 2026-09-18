/**
 * Mirrors the real "Selling" Workspace on the live ERPNext server
 * (`erpnext/selling/workspace/selling/selling.json`) — read directly rather than
 * guessed from the screenshot: 6 cards (Selling / Point of Sale / Items and Pricing /
 * Settings / Key Reports / Other Reports), same order, same links per card.
 *
 * `href` is only set where this frontend actually has a page for that doctype/report —
 * ERPNext's Selling workspace links to a lot of surface this headless app doesn't cover
 * yet (all of Point of Sale, Blanket Order, Item Price, Product Bundle, pricing/shipping
 * rules, a few reports with no Delivery Note data to report on). Those render as plain
 * non-clickable text, same "not built yet" treatment as the Reports hub's "Coming soon"
 * cards — not omitted, so the page stays a faithful map of the real workspace.
 */
export type WorkspaceLink = { label: string; href?: string };
export type WorkspaceCard = { title: string; links: WorkspaceLink[] };

export const SELLING_WORKSPACE_CARDS: WorkspaceCard[] = [
  {
    title: "Selling",
    links: [
      { label: "Customer", href: "/master-data/customers" },
      { label: "Quotation", href: "/sales/quotations" },
      { label: "Sales Order", href: "/sales/orders" },
      { label: "Sales Invoice", href: "/sales/invoices" },
      { label: "Blanket Order" },
      { label: "Sales Partner", href: "/sales/sales-partners" },
      { label: "Sales Person", href: "/sales/sales-persons" },
    ],
  },
  {
    title: "Point of Sale",
    links: [
      { label: "Point-of-Sale Profile" },
      { label: "POS Settings" },
      { label: "POS Opening Entry" },
      { label: "POS Closing Entry" },
      { label: "Loyalty Program" },
      { label: "Loyalty Point Entry" },
    ],
  },
  {
    title: "Items and Pricing",
    links: [
      { label: "Item", href: "/master-data/items" },
      { label: "Item Price" },
      { label: "Price List", href: "/master-data/price-lists" },
      { label: "Item Group", href: "/master-data/item-groups" },
      { label: "Product Bundle" },
      { label: "Promotional Scheme" },
      { label: "Pricing Rule" },
      { label: "Shipping Rule" },
      { label: "Coupon Code" },
    ],
  },
  {
    title: "Settings",
    links: [
      { label: "Selling Settings", href: "/sales/settings" },
      { label: "Terms and Conditions Template" },
      { label: "Sales Taxes and Charges Template" },
      { label: "UTM Source" },
      { label: "Customer Group", href: "/master-data/customer-groups" },
      { label: "Contact", href: "/master-data/contacts" },
      { label: "Address", href: "/master-data/addresses" },
      { label: "Territory", href: "/master-data/territories" },
      { label: "Campaign", href: "/sales/campaigns" },
    ],
  },
  {
    title: "Key Reports",
    links: [
      { label: "Sales Analytics", href: "/reports/sales-analytics" },
      { label: "Sales Order Analysis", href: "/reports/sales-order-analysis" },
      { label: "Sales Funnel" },
      { label: "Sales Order Trends" },
      { label: "Quotation Trends", href: "/reports/quotation-trends" },
      { label: "Customer Acquisition and Loyalty", href: "/reports/customer-acquisition-and-loyalty" },
      { label: "Inactive Customers", href: "/reports/inactive-customers" },
      { label: "Sales Person-wise Transaction Summary" },
      { label: "Item-wise Sales History" },
    ],
  },
  {
    title: "Other Reports",
    links: [
      { label: "Customer Addresses And Contacts", href: "/reports/customer-addresses-and-contacts" },
      { label: "Available Stock for Packing Items", href: "/reports/available-stock-for-packing-items" },
      { label: "Pending SO Items For Purchase Request", href: "/reports/pending-so-items-for-purchase-request" },
      { label: "Delivery Note Trends" },
      { label: "Sales Invoice Trends", href: "/reports/sales-invoice-trends" },
      { label: "Customer Credit Balance", href: "/reports/customer-credit-balance" },
      { label: "Customers Without Any Sales Transactions", href: "/reports/customers-without-any-sales-transactions" },
      { label: "Sales Partners Commission", href: "/reports/sales-partners-commission" },
      { label: "Territory Target Variance Based On Item Group", href: "/reports/territory-target-variance" },
      { label: "Sales Person Target Variance Based On Item Group", href: "/reports/sales-person-target-variance" },
      { label: "Sales Partner Target Variance Based On Item Group", href: "/reports/sales-partner-target-variance" },
    ],
  },
];
