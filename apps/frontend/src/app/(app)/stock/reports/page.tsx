import { STOCK_REPORT_CATALOG } from "@/lib/stockReports";
import { ReportsList } from "@/components/ReportsList";

export default function StockReportsPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-graphite-900">Reports</h1>
        <p className="text-sm text-graphite-500">Matches ERPNext&apos;s own Stock reports.</p>
      </div>

      <ReportsList reports={STOCK_REPORT_CATALOG} />
    </div>
  );
}
