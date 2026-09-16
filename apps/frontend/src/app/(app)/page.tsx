import Link from "next/link";
import { ShoppingCart, ShoppingBag, Factory } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * Root landing page — a neutral module picker, not any one module's dashboard.
 *
 * Until Phase 2 of the Buying + multi-module nav plan, "/" *was* the Selling
 * workspace home page (moved verbatim to app/(app)/sales/page.tsx). Now it's a
 * lightweight, server-rendered switcher: each card links to a module's own home
 * page. No ERPNext data is fetched here — that lives in each module's own page.
 */

type ModuleCard = {
  id: string;
  label: string;
  description: string;
  href?: string;
  icon: typeof ShoppingCart;
  soon?: true;
};

const MODULE_CARDS: ModuleCard[] = [
  {
    id: "sales",
    label: "Selling",
    description: "Quotations, Sales Orders, Delivery Notes, Invoices, Customers.",
    href: "/sales",
    icon: ShoppingCart,
  },
  {
    id: "buying",
    label: "Buying",
    description: "Material Requests, RFQs, Purchase Orders, Receipts, Invoices, Suppliers.",
    href: "/buying",
    icon: ShoppingBag,
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    description: "Work Orders, Job Cards, BOM, downtime, live OEE.",
    icon: Factory,
    soon: true,
  },
];

export default function HomePage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home" }]} />

      <h1 className="mb-1 text-lg font-semibold text-graphite-900">Ceylon Stack</h1>
      <p className="mb-6 text-sm text-graphite-500">Choose a module to get started.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULE_CARDS.map((mod) => {
          const Icon = mod.icon;
          if (mod.soon || !mod.href) {
            return (
              <div
                key={mod.id}
                className="rounded-xl border border-border bg-surface p-5 opacity-50"
                aria-disabled="true"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Icon size={20} className="text-graphite-500" />
                  <h2 className="text-sm font-semibold text-graphite-900">{mod.label}</h2>
                  <span className="ml-auto rounded bg-graphite-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-graphite-500">
                    Coming soon
                  </span>
                </div>
                <p className="text-sm text-graphite-500">{mod.description}</p>
              </div>
            );
          }

          return (
            <Link
              key={mod.id}
              href={mod.href}
              className="rounded-xl border border-border bg-surface p-5 transition hover:border-signal hover:shadow-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <Icon size={20} className="text-signal" />
                <h2 className="text-sm font-semibold text-graphite-900">{mod.label}</h2>
              </div>
              <p className="text-sm text-graphite-500">{mod.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
