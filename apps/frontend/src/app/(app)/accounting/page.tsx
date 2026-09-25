import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";

/**
 * Finance module home page — first Finance package (FIN-1, 2026-09-24). Same precedent as
 * `manufacturing/page.tsx`/`buying/page.tsx` before their own core flows shipped: a plain
 * overview linking to what's actually live, honest about what isn't yet. No flow-map tab —
 * unlike Sales/Manufacturing, Finance V1 doesn't have a `lib/*FlowMap.ts` dataset yet and
 * building one is out of this package's narrow scope (Chart of Accounts read + Bank Account
 * CRUD only) per `docs/backend/06-accounting/finance-architecture.md`'s FIN-1..FIN-6 sequence.
 */
export default function FinanceHomePage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finance" }]} />

      <div className="rounded-xl border border-border bg-surface p-6">
        <h1 className="mb-2 text-base font-semibold text-graphite-900">Finance module</h1>
        <p className="mb-4 text-sm text-graphite-500">
          Ceylon Stack orchestrates and displays ERPNext&apos;s own accounting records — ERPNext
          remains the accounting authority for every posting, balance, and report shown here.
        </p>
        <ul className="space-y-3 text-sm">
          <li>
            <Link href="/accounting/chart-of-accounts" className="font-medium text-signal hover:underline">
              Chart of Accounts
            </Link>
            <p className="text-graphite-500">
              Read-only tree view of ERPNext&apos;s own Account records, by company.
            </p>
          </li>
          <li>
            <Link href="/accounting/account-determination" className="font-medium text-signal hover:underline">
              Account Determination
            </Link>
            <p className="text-graphite-500">
              Company-level G/L account and warehouse defaults — where Sales, Buying, Inventory,
              and Manufacturing transactions post when nothing more specific overrides them.
            </p>
          </li>
          <li>
            <Link href="/accounting/bank-accounts" className="font-medium text-signal hover:underline">
              Bank Accounts
            </Link>
            <p className="text-graphite-500">
              Create and manage Bank Account records — a prerequisite for bank-mode Payment
              Entry, which ships in a later Finance package.
            </p>
          </li>
        </ul>
        <p className="mt-4 text-xs text-graphite-500">
          Payment Entry, Journal Entries, Accounts Receivable/Payable visibility, and native
          General Ledger/Trial Balance/Profit &amp; Loss/Balance Sheet reports are planned for
          later Finance V1 packages (FIN-2 through FIN-6) — not yet built.
        </p>
      </div>
    </div>
  );
}
