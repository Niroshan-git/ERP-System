import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/CustomerForm";
import { DocTabs } from "@/components/DocTabs";
import { AccountingDefaultsPanel } from "@/components/AccountingDefaultsPanel";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import {
  findCompanyRow,
  getCompanyOptions,
  getScopedAccountOptions,
  partyAccountFieldSpecs,
  type PartyAccountRow,
} from "@/lib/financeDefaults";
import { updateCustomerAction, updateCustomerAccountingDefaultsAction } from "../actions";

type CustomerDoc = {
  name: string;
  customer_name: string;
  customer_type: string;
  customer_group?: string;
  territory?: string;
  disabled: 0 | 1;
  accounts?: PartyAccountRow[];
};

export default async function EditCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ tab?: string; company?: string; saved?: string }>;
}) {
  const { name } = await params;
  const { tab, company: requestedCompany, saved } = await searchParams;

  let customer: CustomerDoc;
  try {
    customer = await getDoc<CustomerDoc>("Customer", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [groups, territories, { companies, company }] = await Promise.all([
    fetchLinkOptions("Customer Group"),
    fetchLinkOptions("Territory"),
    getCompanyOptions(requestedCompany),
  ]);

  const accountOptions = await getScopedAccountOptions(company);
  const accountingRow = findCompanyRow(customer.accounts, company) ?? { company };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{customer.customer_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{customer.name}</p>
      <DocTabs
        initialTabId={tab === "accounting" ? "accounting" : undefined}
        tabs={[
          {
            id: "details",
            label: "Details",
            content: (
              <CustomerForm
                action={updateCustomerAction.bind(null, customer.name)}
                groups={groups}
                territories={territories}
                initial={customer}
              />
            ),
          },
          {
            id: "accounting",
            label: "Accounting",
            content: (
              <AccountingDefaultsPanel
                basePath={`/master-data/customers/${encodeURIComponent(customer.name)}`}
                company={company}
                companies={companies}
                saved={saved === "1"}
                fields={partyAccountFieldSpecs({ accountOptions, receivableLabel: "Receivable Account" })}
                initial={accountingRow}
                action={updateCustomerAccountingDefaultsAction.bind(null, customer.name, company)}
                note="Per-company Receivable/Advance account for this Customer — used before falling back to the Customer Group's row, then the Company default (FIN-1G-D)."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
