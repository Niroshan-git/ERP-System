import { notFound } from "next/navigation";
import { runReport } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { FINANCE_SIMPLE_REPORTS } from "@/lib/financeReports";
import { ReportFilterBar, type ReportFilterFieldConfig } from "@/components/ReportFilterBar";
import { ReportTable } from "@/components/ReportTable";

export default async function FinanceReportPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const config = FINANCE_SIMPLE_REPORTS.find((r) => r.slug === slug);
  if (!config) notFound();
  const sp = await searchParams, today = new Date(), values: Record<string, string> = {}, filters: Record<string, unknown> = {}, fields: ReportFilterFieldConfig[] = [];
  const links = new Map<string, string[]>();
  await Promise.all(config.fields.filter((f) => f.kind === "link").map(async (f) => links.set(f.name, (await fetchLinkOptions(f.doctype)) ?? [])));
  let missing = false;
  for (const f of config.fields) {
    const raw = sp[f.name];
    if (f.kind === "date") { const v = raw || (f.default === "today" ? today.toISOString().slice(0, 10) : `${today.getFullYear()}-01-01`); values[f.name] = v; filters[f.name] = v; fields.push({ type: "date", name: f.name, label: f.label }); }
    else if (f.kind === "link") { const v = raw || (f.optional ? "" : (links.get(f.name)?.[0] ?? "")); values[f.name] = v; if (v) filters[f.name] = v; else if (!f.optional) missing = true; fields.push({ type: "select", name: f.name, label: f.label, options: links.get(f.name) ?? [], allowAny: !!f.optional }); }
  }
  let result: Awaited<ReturnType<typeof runReport>>["result"] = [], columns: Awaited<ReturnType<typeof runReport>>["columns"] = [], error: string | null = null;
  if (!missing) try { ({ result, columns } = await runReport(config.reportName, filters)); } catch { error = "Could not run this financial report. Check the filters and report permission."; }
  return <div><div className="mb-4"><h1 className="text-2xl font-medium text-graphite-900">{config.title}</h1><p className="text-sm text-graphite-500">{config.description}</p></div><ReportFilterBar fields={fields} values={values} />{error ? <p className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">{error}</p> : missing ? <p className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-graphite-500">No company is configured in ERPNext yet.</p> : <ReportTable columns={columns} result={result} reportName={config.title} />}</div>;
}
