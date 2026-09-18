import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MASTER_DATA_WORKSPACE_CARDS } from "@/lib/masterDataWorkspace";

/**
 * Master Data module home page. Started as a navigation-only shell (MD-1) where every
 * link routed to an existing Sales/Buying/Stock-owned page. The Master Data
 * Canonicalization package (2026-09-18) moved Items/Item Groups/Price Lists to their own
 * canonical /master-data/* routes; the Business Partner domain package (2026-09-19) did
 * the same for Customers/Customer Groups/Suppliers/Contacts/Addresses/Territories; the
 * Inventory Structure domain package (also 2026-09-19) did the same for Warehouses — see
 * docs/master-data-architecture.md and each package's entry in PROGRESS.md/
 * docs/operations/AI_WORK_LOG.md for the full ownership map. Batches and Serial Nos stay
 * link-outs to Stock — they're operational entities, not structural masters.
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
