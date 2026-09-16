import { BUYING_REPORT_CATALOG } from "@/lib/buyingReports";
import { ReportsList } from "@/components/ReportsList";

export default function BuyingReportsPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-graphite-900">Reports</h1>
        <p className="text-sm text-graphite-500">Matches ERPNext&apos;s own Buying reports.</p>
      </div>

      <ReportsList reports={BUYING_REPORT_CATALOG} />
    </div>
  );
}
