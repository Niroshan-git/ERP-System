import { notFound } from "next/navigation";
import { ItemForm } from "@/components/ItemForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { updateItemAction } from "../actions";

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
};

export default async function EditItemPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  let item: ItemDoc;
  try {
    item = await getDoc<ItemDoc>("Item", decodeURIComponent(name));
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const [groups, uoms] = await Promise.all([fetchLinkOptions("Item Group"), fetchLinkOptions("UOM")]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">{item.item_name}</h1>
      <p className="mb-4 font-mono text-xs text-graphite-500">{item.name}</p>
      <ItemForm action={updateItemAction.bind(null, item.name)} groups={groups} uoms={uoms} initial={item} />
    </div>
  );
}
