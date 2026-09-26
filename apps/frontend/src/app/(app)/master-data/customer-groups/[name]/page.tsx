import { notFound } from "next/navigation";
import { MasterForm, type FieldSpec } from "@/components/MasterForm";
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
import { updateCustomerGroupAction, updateCustomerGroupAccountingDefaultsAction } from "../actions";

type CustomerGroupDoc = {
  name: string;
  customer_group_name: string;
  parent_customer_group?: string;
  is_group?: 0 | 1;
  default_price_list?: string;
  accounts?: PartyAccountRow[];
};

export default async function EditCustomerGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ tab?: string; company?: string; saved?: string }>;
}) {
  const { name } = await params;
  const { tab, company: requestedCompany, saved } = await searchParams;

  let doc: CustomerGroupDoc;
  try {
    doc = await getDoc<CustomerGroupDoc>("Customer Group", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [groups, priceLists, { companies, company }] = await Promise.all([
    fetchLinkOptions("Customer Group"),
    fetchLinkOptions("Price List"),
    getCompanyOptions(requestedCompany),
  ]);

  const fields: FieldSpec[] = [
    { kind: "text", id: "customer_group_name", label: "Customer group name", required: true },
    { kind: "link", id: "parent_customer_group", label: "Parent customer group", options: groups },
    { kind: "checkbox", id: "is_group", label: "Is group" },
    { kind: "link", id: "default_price_list", label: "Default price list", options: priceLists },
  ];

  const accountOptions = await getScopedAccountOptions(company);
  const accountingRow = findCompanyRow(doc.accounts, company) ?? { company };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.customer_group_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <DocTabs
        initialTabId={tab === "accounting" ? "accounting" : undefined}
        tabs={[
          {
            id: "details",
            label: "Details",
            content: <MasterForm action={updateCustomerGroupAction.bind(null, doc.name)} fields={fields} initial={doc} />,
          },
          {
            id: "accounting",
            label: "Accounting",
            content: (
              <AccountingDefaultsPanel
                basePath={`/master-data/customer-groups/${encodeURIComponent(doc.name)}`}
                company={company}
                companies={companies}
                saved={saved === "1"}
                fields={partyAccountFieldSpecs({ accountOptions, receivableLabel: "Receivable Account" })}
                initial={accountingRow}
                action={updateCustomerGroupAccountingDefaultsAction.bind(null, doc.name, company)}
                note="Per-company Receivable/Advance account for this Customer Group — used when a Customer in this group has no override of its own, falling back to the Company default after (FIN-1G-D)."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
