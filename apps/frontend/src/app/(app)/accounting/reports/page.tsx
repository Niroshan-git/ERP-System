import { ReportsList } from "@/components/ReportsList";
import { FINANCE_REPORT_CATALOG } from "@/lib/financeReports";

export default function FinanceReportsPage() {
  return <div><div className="mb-4"><h1 className="text-2xl font-medium text-graphite-900">Financial Reports</h1><p className="text-sm text-graphite-500">ERPNext remains the authoritative accounting and ageing engine.</p></div><ReportsList reports={FINANCE_REPORT_CATALOG} /></div>;
}
