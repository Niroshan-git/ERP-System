import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BankAccountForm } from "@/components/BankAccountForm";
import { DocActionBar } from "@/components/DocActionBar";
import { SavedBanner } from "@/components/SavedBanner";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { deleteBankAccountAction, updateBankAccountAction } from "../actions";

type BankAccountDoc = {
  name: string;
  account_name: string;
  bank: string;
  company?: string;
  account?: string;
  branch_code?: string;
  bank_account_no?: string;
  iban?: string;
  is_default?: 0 | 1;
  is_company_account?: 0 | 1;
  is_credit_card?: 0 | 1;
  disabled?: 0 | 1;
};

/**
 * View/edit is one combined page, same as `master-data/warehouses/[name]` — `Bank Account`
 * carries no `docstatus`/submit lifecycle (live-verified: no `amended_from` field, `is_tree`
 * false), so there's no separate read-only vs. edit-mode split to make, unlike a submittable
 * document. Full sensitive-field values (account number, IBAN) are shown here — this is the
 * one screen in this app authorized to show them in full, per the FIN-1 brief's "mask in list
 * views, show in detail/edit" rule; the list page (`../page.tsx`) never receives these raw
 * values at all.
 */
export default async function BankAccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;

  let doc: BankAccountDoc;
  try {
    doc = await getDoc<BankAccountDoc>("Bank Account", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [companies, accounts, banks] = await Promise.all([
    fetchLinkOptions("Company"),
    listDocs<{ name: string }>("Account", {
      fields: ["name"],
      filters: [["is_group", "=", 0]],
      limit: 500,
      orderBy: "name asc",
    }),
    fetchLinkOptions("Bank"),
  ]);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Finance", href: "/accounting" },
          { label: "Bank Accounts", href: "/accounting/bank-accounts" },
          { label: doc.name },
        ]}
      />
      <SavedBanner show={saved === "1"} />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-graphite-900">{doc.account_name}</h1>
          <p className="font-mono text-xs text-graphite-500">{doc.name}</p>
        </div>
        <DocActionBar
          action={deleteBankAccountAction.bind(null, doc.name)}
          label="Delete"
          pendingLabel="Deleting…"
          variant="danger"
        />
      </div>

      <BankAccountForm
        action={updateBankAccountAction.bind(null, doc.name)}
        companies={companies ?? []}
        accountOptions={accounts.map((a) => a.name)}
        bankOptions={banks ?? []}
        initial={{
          account_name: doc.account_name,
          bank: doc.bank,
          company: doc.company,
          account: doc.account,
          branch_code: doc.branch_code,
          bank_account_no: doc.bank_account_no,
          iban: doc.iban,
          is_default: doc.is_default,
          is_company_account: doc.is_company_account,
          is_credit_card: doc.is_credit_card,
          disabled: doc.disabled,
        }}
      />
    </div>
  );
}
