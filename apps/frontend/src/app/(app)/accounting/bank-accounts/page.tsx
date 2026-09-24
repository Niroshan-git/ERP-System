import { Breadcrumb } from "@/components/Breadcrumb";
import { getCount, listDocs } from "@/lib/erpnext";
import { maskSensitive } from "@/lib/format";
import { paginate, parsePage, parsePageSize } from "@/lib/pagination";
import { MasterTable } from "@/components/MasterTable";
import { PaginationControls } from "@/components/PaginationControls";

type BankAccountRaw = {
  name: string;
  account_name: string;
  bank: string;
  company: string | null;
  is_default: 0 | 1;
  is_company_account: 0 | 1;
  disabled: 0 | 1;
  bank_account_no: string | null;
  iban: string | null;
};

type BankAccountRow = {
  name: string;
  account_name: string;
  bank: string;
  company: string | null;
  is_default: 0 | 1;
  is_company_account: 0 | 1;
  disabled: 0 | 1;
  masked_account_no: string;
};

/**
 * FIN-1 — Bank Account list. Live-verified 2026-09-24: zero Bank Account records exist on the
 * tenant today, so the empty state (`MasterTable`'s own built-in `emptyLabel` handling) is the
 * real first-run experience, not a hypothetical edge case — see
 * `docs/backend/06-accounting/chart-of-accounts-bank-account.md`.
 *
 * `bank_account_no`/`iban` are fetched here (server-side only) purely to derive
 * `masked_account_no` immediately below — the raw values are never attached to the row object
 * handed to `MasterTable`, so they never reach that component's render path or `ExportMenu`'s
 * CSV/PDF export, both of which only ever see the already-masked string. Full values are only
 * ever shown on the detail/edit page (`[name]/page.tsx`).
 */
export default async function BankAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; page_size?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const pageSize = parsePageSize(params.page_size);
  const startIndex = (page - 1) * pageSize;

  const [rawRowsPlusOne, totalCount] = await Promise.all([
    listDocs<BankAccountRaw>("Bank Account", {
      fields: [
        "name",
        "account_name",
        "bank",
        "company",
        "is_default",
        "is_company_account",
        "disabled",
        "bank_account_no",
        "iban",
      ],
      limit: pageSize + 1,
      start: startIndex,
      orderBy: "account_name asc",
    }),
    getCount("Bank Account"),
  ]);

  const rowsPlusOne: BankAccountRow[] = rawRowsPlusOne.map((r) => ({
    name: r.name,
    account_name: r.account_name,
    bank: r.bank,
    company: r.company,
    is_default: r.is_default,
    is_company_account: r.is_company_account,
    disabled: r.disabled,
    masked_account_no: maskSensitive(r.bank_account_no || r.iban),
  }));
  const { rows, hasNextPage } = paginate(rowsPlusOne, pageSize);

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finance", href: "/accounting" }, { label: "Bank Accounts" }]} />

      <MasterTable
        title="Bank Accounts"
        rows={rows}
        newHref="/accounting/bank-accounts/new"
        rowLink={(row) => `/accounting/bank-accounts/${encodeURIComponent(row.name)}`}
        emptyLabel="No bank accounts yet — add one to enable bank-mode payments."
        columns={[
          { key: "name", label: "ID", mono: true },
          { key: "account_name", label: "Account Name" },
          { key: "bank", label: "Bank" },
          { key: "company", label: "Company" },
          { key: "masked_account_no", label: "Account No. / IBAN", mono: true },
          {
            key: "is_default",
            label: "Default",
            render: (row) => (row.is_default ? "Yes" : "No"),
          },
          {
            key: "is_company_account",
            label: "Company Account",
            render: (row) => (row.is_company_account ? "Yes" : "No"),
          },
          { key: "disabled", label: "Disabled", render: (row) => (row.disabled ? "Yes" : "No") },
        ]}
        startIndex={startIndex}
      />
      <PaginationControls
        page={page}
        pageSize={pageSize}
        hasNextPage={hasNextPage}
        searchParams={params}
        rowCount={rows.length}
        totalCount={totalCount}
      />
    </div>
  );
}
