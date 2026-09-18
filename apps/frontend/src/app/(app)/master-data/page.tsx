import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MASTER_DATA_WORKSPACE_CARDS } from "@/lib/masterDataWorkspace";

/**
 * Master Data module home page (MD-1, navigation-foundation package — see
 * docs/master-data-architecture.md). Every link here routes to an existing canonical
 * record already owned by Sales/Buying/Stock — this page is a shared entry point onto
 * that same data, not a duplicate master or a new data model. No route was moved: a
 * user landing here via Manufacturing's "Master Data" module and a user landing on
 * `/sales/items` directly reach the exact same page.
 */
export default function MasterDataHomePage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Master Data" }]} />

      <div className="mb-6 rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-2 text-base font-semibold text-graphite-900">Master Data</h1>
        <p className="text-sm text-graphite-500">
          One canonical place to reach the records shared across Sales, Buying, Inventory, and
          Manufacturing. Each link below opens the same record every other module already uses —
          nothing here is a separate copy. Manufacturing masters (BOM, Operations, Workstations)
          and financial/organizational masters (Company, Cost Center, Project, UOM) don&apos;t
          have a screen yet and aren&apos;t listed here — each is its own future package.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MASTER_DATA_WORKSPACE_CARDS.map((card) => (
          <div key={card.title} className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold text-graphite-900">{card.title}</h3>
            <ul className="space-y-1.5">
              {card.links.map((link) => (
                <li key={link.label} className="text-sm">
                  {link.href ? (
                    <Link href={link.href} className="text-signal hover:underline">
                      {link.label}
                    </Link>
                  ) : (
                    <span className="text-graphite-500">{link.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
