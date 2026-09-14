import { REPORT_CATALOG } from "@/lib/reports";
import { ReportsList } from "@/components/ReportsList";

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-graphite-900">Reports</h1>
        <p className="text-sm text-graphite-500">Matches ERPNext&apos;s own Selling reports.</p>
      </div>

      <ReportsList reports={REPORT_CATALOG} />
    </div>
  );
}
