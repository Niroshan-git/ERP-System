import { notFound } from "next/navigation";
import { runReport } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { STOCK_SIMPLE_REPORTS } from "@/lib/stockReports";
import { ReportFilterBar, type ReportFilterFieldConfig } from "@/components/ReportFilterBar";
import { ReportTable } from "@/components/ReportTable";

/**
 * One generic page for every "simple" Stock report in STOCK_SIMPLE_REPORTS — the Stock
 * analog of `/buying/reports/[slug]/page.tsx`. Currently unreachable from the Reports hub
 * (STOCK_SIMPLE_REPORTS is empty for v1 — see lib/stockReports.ts's doc comment for why),
 * kept as a real page rather than deleted so a future pass can add an entry without also
 * having to re-build this runner.
 */

type SearchParams = Record<string, string | undefined>;

export default async function StockSimpleReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const config = STOCK_SIMPLE_REPORTS.find((r) => r.slug === slug);
  if (!config) notFound();

  const sp = await searchParams;
  const today = new Date();
  const yearStart = `${today.getFullYear()}-01-01`;
  const todayStr = today.toISOString().slice(0, 10);

  const linkOptions = new Map<string, string[]>();
  await Promise.all(
    config.fields
      .filter((f) => f.kind === "link")
      .map(async (f) => {
        linkOptions.set(f.name, (await fetchLinkOptions(f.doctype)) ?? []);
      }),
  );

  const values: Record<string, string> = {};
  const filters: Record<string, unknown> = {};
  const filterFields: ReportFilterFieldConfig[] = [];
  let missingRequiredLink = false;

  for (const f of config.fields) {
    const raw = sp[f.name];

    if (f.kind === "date") {
      const resolved = raw || (f.default === "today" ? todayStr : yearStart);
      values[f.name] = resolved;
      filters[f.name] = resolved;
      filterFields.push({ type: "date", name: f.name, label: f.label });
    } else if (f.kind === "select") {
      const resolved = raw || f.default;
      values[f.name] = resolved;
      filters[f.name] = resolved;
      filterFields.push({ type: "select", name: f.name, label: f.label, options: f.options, allowAny: false });
    } else if (f.kind === "number") {
      const resolved = raw ?? String(f.default);
      values[f.name] = resolved;
      const n = Number(resolved);
      filters[f.name] = Number.isFinite(n) ? n : f.default;
      filterFields.push({ type: "number", name: f.name, label: f.label });
    } else if (f.kind === "text") {
      const resolved = raw ?? "";
      values[f.name] = resolved;
      if (resolved) filters[f.name] = resolved;
      filterFields.push({ type: "text", name: f.name, label: f.label });
    } else {
      const options = linkOptions.get(f.name) ?? [];
      const resolved = raw || (f.optional ? "" : (options[0] ?? ""));
      values[f.name] = resolved;
      if (resolved) filters[f.name] = resolved;
      else if (!f.optional) missingRequiredLink = true;
      filterFields.push({ type: "select", name: f.name, label: f.label, options, allowAny: !!f.optional });
    }
  }

  let columns: Awaited<ReturnType<typeof runReport>>["columns"] = [];
  let result: Awaited<ReturnType<typeof runReport>>["result"] = [];
  let error: string | null = null;

  if (!missingRequiredLink) {
    try {
      ({ columns, result } = await runReport(config.reportName, filters));
    } catch {
      error = "Could not run this report — check the filters and try again.";
    }
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-graphite-900">{config.title}</h1>
        <p className="text-sm text-graphite-500">{config.description}</p>
      </div>

      {filterFields.length > 0 && <ReportFilterBar fields={filterFields} values={values} />}

      {error ? (
        <p className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">{error}</p>
      ) : missingRequiredLink ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-graphite-500">
          No {config.fields.find((f) => f.kind === "link" && !f.optional)?.label.toLowerCase()} configured in
          ERPNext yet.
        </p>
      ) : (
        <ReportTable columns={columns} result={result} reportName={config.title} />
      )}
    </div>
  );
}
