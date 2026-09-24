import Link from "next/link";
import type { DrawerSummary } from "@/lib/accountHierarchy";

/**
 * FIN-1F drawer navigation — SAP B1-inspired "cabinet drawer" cards for each root Account
 * (Asset/Liability/Equity/Income/Expense on the live tenant). Counts come from the same
 * Account fetch `page.tsx` already makes for the tree below; no extra API call.
 *
 * Purely a display/filter concern: clicking a drawer sets `?drawer=<name>` and the page
 * filters the same in-memory account list before handing it to `ChartOfAccountsTree` — it
 * does not change accounting data or fetch balances (no GL/report calls, per the FIN-1F brief's
 * "do not add balance logic yet").
 */
export function AccountDrawerNav({
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
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      <DrawerCard
        label="All Drawers"
        href={buildHref(null)}
        active={activeDrawer === null}
        detail={`${summaries.reduce((sum, s) => sum + s.total, 0)} accounts`}
      />
      {summaries.map((summary) => (
        <DrawerCard
          key={summary.drawer}
          label={summary.drawerLabel}
          href={buildHref(summary.drawer)}
          active={activeDrawer === summary.drawer}
          detail={`${summary.total} accounts · ${summary.titles} title${summary.titles === 1 ? "" : "s"} · ${summary.actives} active`}
        />
      ))}
    </div>
  );
}

function DrawerCard({
  label,
  href,
  active,
  detail,
}: {
  label: string;
  href: string;
  active: boolean;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className={`min-w-[9.5rem] shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
        active
          ? "border-signal bg-signal/10 text-signal"
          : "border-border bg-surface text-graphite-900 hover:border-signal/50 hover:bg-canvas/60"
      }`}
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="mt-0.5 text-xs text-graphite-500">{detail}</div>
    </Link>
  );
}
