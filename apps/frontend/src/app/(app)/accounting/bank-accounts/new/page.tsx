import { Breadcrumb } from "@/components/Breadcrumb";
import { BankAccountForm } from "@/components/BankAccountForm";
import { listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createBankAccountAction } from "../actions";

export default async function NewBankAccountPage() {
  const [companies, accounts, banks] = await Promise.all([
    fetchLinkOptions("Company"),
    // Every non-group Account across both companies — same "don't attempt cross-company
    // filtering a Link dropdown doesn't otherwise support" precedent `parent_warehouse` set
    // on the Warehouse form.
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
          { label: "New" },
        ]}
      />
      <h1 className="mb-4 text-2xl font-medium text-graphite-900">New bank account</h1>
      <BankAccountForm
        action={createBankAccountAction}
        companies={companies ?? []}
        accountOptions={accounts.map((a) => a.name)}
        bankOptions={banks ?? []}
      />
    </div>
  );
}
