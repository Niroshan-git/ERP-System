import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LineChart } from "@/components/LineChart";
import { DocTabs } from "@/components/DocTabs";
import { SalesFlowMap } from "@/components/SalesFlowMap";
import { runReport } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { getSellingNumberCards } from "@/lib/sellingDashboard";
import { SELLING_WORKSPACE_CARDS } from "@/lib/sellingWorkspace";

/**
 * Landing page for the app — replicates ERPNext's real "Selling" Workspace (the page
 * that opens after login in the live Desk instance this project is modeled on), read
 * from the live server's `selling.json` workspace definition rather than guessed.
 * See lib/sellingDashboard.ts and lib/sellingWorkspace.ts for how each piece maps to a
 * real ERPNext Dashboard Chart / Number Card / workspace link.
 */

function formatCurrencyCard(amount: number): string {
  if (Math.abs(amount) >= 1000) return `Rs ${(amount / 1000).toFixed(2)} K`;
  return `Rs ${amount.toFixed(2)}`;
}

export default async function HomePage() {
  const [companies, fiscalYears, cards] = await Promise.all([
    fetchLinkOptions("Company"),
    fetchLinkOptions("Fiscal Year"),
    getSellingNumberCards(),
  ]);

  let chartLabels: string[] = [];
  let chartValues: number[] = [];
  if (companies?.[0] && fiscalYears?.[0]) {
    try {
      const { chart } = await runReport("Sales Order Trends", {
        period: "Monthly",
        based_on: "Item",
        company: companies[0],
        fiscal_year: fiscalYears[0],
      });
      chartLabels = chart?.data.labels ?? [];
      chartValues = chart?.data.datasets[0]?.values ?? [];
    } catch {
      // Chart is a nice-to-have on the landing page — a report hiccup shouldn't 500 the home page.
    }
  }

  const overviewTab = (
    <div>
      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-4 text-sm font-semibold text-graphite-900">Sales Order Trends</h2>
        {chartValues.length > 0 ? (
          <LineChart labels={chartLabels} values={chartValues} />
        ) : (
          <p className="py-8 text-center text-sm text-graphite-500">No chart data yet.</p>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-graphite-500">Sales Orders</p>
          <p className="mt-1 text-2xl font-medium text-graphite-900">{cards.salesOrdersCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-graphite-500">Total Sales Amount</p>
          <p className="mt-1 text-2xl font-medium text-graphite-900">{formatCurrencyCard(cards.totalSalesAmount)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-graphite-500">Average Order Value</p>
          <p className="mt-1 text-2xl font-medium text-graphite-900">{formatCurrencyCard(cards.averageOrderValue)}</p>
        </div>
      </div>

      <h2 className="mb-3 text-base font-semibold text-graphite-900">Reports &amp; Masters</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SELLING_WORKSPACE_CARDS.map((card) => (
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

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Selling" }]} />

      <DocTabs
        tabs={[
          { id: "overview", label: "Overview", content: overviewTab },
          { id: "sales-flow", label: "Sales Flow", content: <SalesFlowMap /> },
        ]}
      />
    </div>
  );
}
