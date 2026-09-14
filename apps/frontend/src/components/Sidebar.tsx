"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const salesLinks = [
  { href: "/sales/customers", label: "Customers" },
  { href: "/sales/items", label: "Items" },
  { href: "/sales/quotations", label: "Quotations" },
  { href: "/sales/orders", label: "Sales Orders" },
  { href: "/sales/delivery-notes", label: "Delivery Notes" },
  { href: "/sales/invoices", label: "Sales Invoices" },
];

const itemsPricingLinks = [
  { href: "/sales/item-groups", label: "Item Groups" },
  { href: "/sales/price-lists", label: "Price Lists" },
];

const reportsLinks = [{ href: "/reports", label: "Reports" }];

const setupLinks = [
  { href: "/sales/customer-groups", label: "Customer Groups" },
  { href: "/sales/territories", label: "Territories" },
  { href: "/sales/sales-persons", label: "Sales Persons" },
  { href: "/sales/sales-partners", label: "Sales Partners" },
  { href: "/sales/contacts", label: "Contacts" },
  { href: "/sales/addresses", label: "Addresses" },
  { href: "/sales/campaigns", label: "Campaigns" },
  { href: "/sales/settings", label: "Selling Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-graphite-900 text-white">
      <Link href="/" className="flex items-center gap-2 px-4 py-4">
        <Image src="/brand/logo-mark-reverse.svg" alt="" width={22} height={22} />
        <span className="text-sm font-semibold tracking-tight">Ceylon Stack</span>
      </Link>

      <nav className="flex-1 px-2 py-2">
        <NavGroup label="Sales" links={salesLinks} pathname={pathname} />
        <NavGroup label="Items & Pricing" links={itemsPricingLinks} pathname={pathname} className="mt-4" />
        <NavGroup label="Reports" links={reportsLinks} pathname={pathname} className="mt-4" />
        <NavGroup label="Setup" links={setupLinks} pathname={pathname} className="mt-4" />

        <p className="mt-4 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/30">
          Manufacturing
        </p>
        <p className="px-2 py-1.5 text-sm text-white/30">Coming soon</p>
      </nav>
    </aside>
  );
}

function NavGroup({
  label,
  links,
  pathname,
  className,
}: {
  label: string;
  links: { href: string; label: string }[];
  pathname: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">{label}</p>
      <ul>
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded px-2 py-1.5 text-sm ${
                  active ? "bg-white/10 font-medium text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
