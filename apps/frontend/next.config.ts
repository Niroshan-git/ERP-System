import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Compatibility redirects for the Master Data Canonicalization package. Items, Item
   * Groups, and Price Lists moved from /sales/* on 2026-09-18; Customers, Customer Groups,
   * Contacts, Addresses, and Territories moved from /sales/*, and Suppliers from
   * /buying/suppliers, on 2026-09-19 (Business Partner domain) — see
   * docs/master-data-architecture.md. `permanent: false` (307) is used deliberately rather
   * than `true` (308) — this app has no automated test coverage and no production traffic
   * yet to have created real bookmarks/backlinks to redirect, so a permanent redirect isn't
   * earned yet; it can be promoted to `permanent: true` once this has been live long enough
   * that regressing it would matter. Every internal link in this app now points directly at
   * the canonical route (see PROGRESS.md) — these redirects exist only to catch anything
   * external: old bookmarks, docs, or links this audit didn't find.
   */
  async redirects() {
    return [
      { source: "/sales/items", destination: "/master-data/items", permanent: false },
      { source: "/sales/items/:path*", destination: "/master-data/items/:path*", permanent: false },
      { source: "/sales/item-groups", destination: "/master-data/item-groups", permanent: false },
      {
        source: "/sales/item-groups/:path*",
        destination: "/master-data/item-groups/:path*",
        permanent: false,
      },
      { source: "/sales/price-lists", destination: "/master-data/price-lists", permanent: false },
      {
        source: "/sales/price-lists/:path*",
        destination: "/master-data/price-lists/:path*",
        permanent: false,
      },
      { source: "/sales/customers", destination: "/master-data/customers", permanent: false },
      {
        source: "/sales/customers/:path*",
        destination: "/master-data/customers/:path*",
        permanent: false,
      },
      {
        source: "/sales/customer-groups",
        destination: "/master-data/customer-groups",
        permanent: false,
      },
      {
        source: "/sales/customer-groups/:path*",
        destination: "/master-data/customer-groups/:path*",
        permanent: false,
      },
      { source: "/sales/contacts", destination: "/master-data/contacts", permanent: false },
      {
        source: "/sales/contacts/:path*",
        destination: "/master-data/contacts/:path*",
        permanent: false,
      },
      { source: "/sales/addresses", destination: "/master-data/addresses", permanent: false },
      {
        source: "/sales/addresses/:path*",
        destination: "/master-data/addresses/:path*",
        permanent: false,
      },
      { source: "/sales/territories", destination: "/master-data/territories", permanent: false },
      {
        source: "/sales/territories/:path*",
        destination: "/master-data/territories/:path*",
        permanent: false,
      },
      { source: "/buying/suppliers", destination: "/master-data/suppliers", permanent: false },
      {
        source: "/buying/suppliers/:path*",
        destination: "/master-data/suppliers/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
