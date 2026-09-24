import Link from "next/link";
import type { DrawerSummary } from "@/lib/accountHierarchy";

/**
 * FIN-1F-2 drawer rail — a vertical stack of "cabinet drawer" tabs, one per root Account, per
 * Niroshan's reference screenshot of SAP Business One's own Chart of Accounts window (drawer
 * tabs run down the right edge of the window). Supersedes FIN-1F-1's horizontal drawer cards —
 * this package wasn't reviewed/accepted yet, so replacing rather than layering is safe.
 *
 * Purely a display/filter concern, same as the cards it replaces: clicking a drawer sets
 * `?drawer=<name>` and the page filters the same in-memory account list — no extra API call, no
 * accounting data touched.
 */
export function AccountDrawerRail({
  summaries,
  activeDrawer,
  buildHref,
}: {
  summaries: DrawerSummary[];
  activeDrawer: string | null;
  buildHref: (drawer: string | null) => string;
}) {
  if (summaries.length === 0) return null;

  return (
    <nav
      aria-label="Chart of Accounts drawers"
      className="flex gap-1.5 overflow-x-auto pb-1 lg:w-40 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      <DrawerTab label="All Drawers" href={buildHref(null)} active={activeDrawer === null} count={summaries.reduce((n, s) => n + s.total, 0)} />
      {summaries.map((summary) => (
        <DrawerTab
          key={summary.drawer}
          label={summary.drawerLabel}
          href={buildHref(summary.drawer)}
          active={activeDrawer === summary.drawer}
          count={summary.total}
        />
      ))}
    </nav>
  );
}

function DrawerTab({ label, href, active, count }: { label: string; href: string; active: boolean; count: number }) {
  return (
    <Link
      href={href}
      className={`min-w-[7rem] shrink-0 rounded-md border px-3 py-2.5 text-left text-sm transition-colors lg:min-w-0 lg:rounded-r-none lg:border-r-0 ${
        active
          ? "border-signal bg-signal/10 font-medium text-signal lg:border-r-4 lg:border-r-signal"
          : "border-border bg-surface text-graphite-900 hover:bg-canvas/60"
      }`}
    >
      <div className="truncate">{label}</div>
      <div className="text-[11px] text-graphite-500">{count} account{count === 1 ? "" : "s"}</div>
    </Link>
  );
}
