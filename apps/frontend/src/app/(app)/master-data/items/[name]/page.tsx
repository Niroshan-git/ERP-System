import { notFound } from "next/navigation";
import { ItemForm } from "@/components/ItemForm";
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
import { updateItemAction, updateItemAccountingDefaultsAction } from "../actions";

type ItemDoc = {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: 0 | 1;
  disabled: 0 | 1;
  standard_rate: number;
  description?: string;
  has_batch_no?: 0 | 1;
  has_serial_no?: 0 | 1;
  has_expiry_date?: 0 | 1;
  batch_number_series?: string;
  serial_no_series?: string;
  item_defaults?: ItemDefaultRow[];
};

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ tab?: string; company?: string; saved?: string }>;
}) {
  const { name } = await params;
  const { tab, company: requestedCompany, saved } = await searchParams;

  let item: ItemDoc;
  try {
    item = await getDoc<ItemDoc>("Item", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [groups, uoms, { companies, company }] = await Promise.all([
    fetchLinkOptions("Item Group"),
    fetchLinkOptions("UOM"),
    getCompanyOptions(requestedCompany),
  ]);

  const [accountOptions, costCenterOptions, warehouseOptions, priceListOptions, supplierOptions] = await Promise.all([
    getScopedAccountOptions(company),
    getScopedCostCenterOptions(company),
    getScopedWarehouseOptions(company),
    fetchLinkOptions("Price List"),
    fetchLinkOptions("Supplier"),
  ]);

  const accountingRow = findCompanyRow(item.item_defaults, company) ?? { company };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{item.item_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{item.name}</p>
      <DocTabs
        initialTabId={tab === "accounting" ? "accounting" : undefined}
        tabs={[
          {
            id: "details",
            label: "Details",
            content: <ItemForm action={updateItemAction.bind(null, item.name)} groups={groups} uoms={uoms} initial={item} />,
          },
          {
            id: "accounting",
            label: "Accounting",
            content: (
              <AccountingDefaultsPanel
                basePath={`/master-data/items/${encodeURIComponent(item.name)}`}
                company={company}
                companies={companies}
                saved={saved === "1"}
                fields={itemDefaultFieldSpecs({ accountOptions, costCenterOptions, warehouseOptions, priceListOptions, supplierOptions })}
                initial={accountingRow}
                action={updateItemAccountingDefaultsAction.bind(null, item.name, company)}
                note="Per-company G/L account and warehouse defaults for this Item — override Item Group/Brand/Company defaults for Sales, Buying, and Inventory transactions (FIN-1G-D)."
              />
            ),
          },
        ]}
      />
    </div>
  );
}
