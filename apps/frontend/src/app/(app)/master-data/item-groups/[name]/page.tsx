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
  getScopedCostCenterOptions,
  getScopedWarehouseOptions,
  itemDefaultFieldSpecs,
  type ItemDefaultRow,
} from "@/lib/financeDefaults";
import { updateItemGroupAction, updateItemGroupAccountingDefaultsAction } from "../actions";

type ItemGroupDoc = {
  name: string;
  item_group_name: string;
  parent_item_group?: string;
  is_group?: 0 | 1;
  item_group_defaults?: ItemDefaultRow[];
};

export default async function EditItemGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ tab?: string; company?: string; saved?: string }>;
}) {
  const { name } = await params;
  const { tab, company: requestedCompany, saved } = await searchParams;

  let doc: ItemGroupDoc;
  try {
    doc = await getDoc<ItemGroupDoc>("Item Group", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [groups, { companies, company }] = await Promise.all([
    fetchLinkOptions("Item Group"),
    getCompanyOptions(requestedCompany),
  ]);

  const [accountOptions, costCenterOptions, warehouseOptions, priceListOptions, supplierOptions] = await Promise.all([
    getScopedAccountOptions(company),
    getScopedCostCenterOptions(company),
    getScopedWarehouseOptions(company),
    fetchLinkOptions("Price List"),
    fetchLinkOptions("Supplier"),
  ]);

  const fields: FieldSpec[] = [
    { kind: "text", id: "item_group_name", label: "Item group name", required: true },
    { kind: "link", id: "parent_item_group", label: "Parent item group", options: groups },
    { kind: "checkbox", id: "is_group", label: "Is group" },
  ];

  const accountingRow = findCompanyRow(doc.item_group_defaults, company) ?? { company };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{doc.item_group_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{doc.name}</p>
      <DocTabs
        initialTabId={tab === "accounting" ? "accounting" : undefined}
        tabs={[
          {
            id: "details",
            label: "Details",
            content: <MasterForm action={updateItemGroupAction.bind(null, doc.name)} fields={fields} initial={doc} />,
          },
          {
            id: "accounting",
            label: "Accounting",
            content: (
              <AccountingDefaultsPanel
                basePath={`/master-data/item-groups/${encodeURIComponent(doc.name)}`}
                company={company}
                companies={companies}
                saved={saved === "1"}
                fields={itemDefaultFieldSpecs({ accountOptions, costCenterOptions, warehouseOptions, priceListOptions, supplierOptions })}
                initial={accountingRow}
                action={updateItemGroupAccountingDefaultsAction.bind(null, doc.name, company)}
                note="Per-company G/L account and warehouse defaults for this Item Group — used when an Item in this group has no override of its own, and override Brand/Company defaults (FIN-1G-D)."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
