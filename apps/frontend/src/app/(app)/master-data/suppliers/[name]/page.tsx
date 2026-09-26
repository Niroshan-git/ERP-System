import { notFound } from "next/navigation";
import { SupplierForm } from "@/components/SupplierForm";
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
import { updateSupplierAction, updateSupplierAccountingDefaultsAction } from "../actions";

type SupplierDoc = {
  name: string;
  supplier_name: string;
  supplier_type: string;
  supplier_group?: string;
  country?: string;
  disabled: 0 | 1;
  accounts?: PartyAccountRow[];
};

export default async function EditSupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ tab?: string; company?: string; saved?: string }>;
}) {
  const { name } = await params;
  const { tab, company: requestedCompany, saved } = await searchParams;

  let supplier: SupplierDoc;
  try {
    supplier = await getDoc<SupplierDoc>("Supplier", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [groups, countries, { companies, company }] = await Promise.all([
    fetchLinkOptions("Supplier Group"),
    fetchLinkOptions("Country"),
    getCompanyOptions(requestedCompany),
  ]);

  const accountOptions = await getScopedAccountOptions(company);
  const accountingRow = findCompanyRow(supplier.accounts, company) ?? { company };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{supplier.supplier_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{supplier.name}</p>
      <DocTabs
        initialTabId={tab === "accounting" ? "accounting" : undefined}
        tabs={[
          {
            id: "details",
            label: "Details",
            content: (
              <SupplierForm
                action={updateSupplierAction.bind(null, supplier.name)}
                groups={groups}
                countries={countries}
                initial={supplier}
              />
            ),
          },
          {
            id: "accounting",
            label: "Accounting",
            content: (
              <AccountingDefaultsPanel
                basePath={`/master-data/suppliers/${encodeURIComponent(supplier.name)}`}
                company={company}
                companies={companies}
                saved={saved === "1"}
                fields={partyAccountFieldSpecs({ accountOptions, receivableLabel: "Payable Account" })}
                initial={accountingRow}
                action={updateSupplierAccountingDefaultsAction.bind(null, supplier.name, company)}
                note="Per-company Payable/Advance account for this Supplier — used before falling back to the Supplier Group's row (not yet editable here — no Supplier Group page exists), then the Company default (FIN-1G-D)."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
