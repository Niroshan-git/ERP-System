import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CreateSupplierQuotationForm } from "@/components/CreateSupplierQuotationForm";
import type { LineRow } from "@/components/LineItemsEditor";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { listItemOptions } from "@/lib/actions/itemLookup";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createSupplierQuotationFromRfqAction } from "../../../supplier-quotations/actions";

type RfqItemForSq = { name: string; item_code: string; item_name: string; qty: number; uom: string };
type RfqForSq = {
  name: string;
  docstatus: number;
  company: string;
  suppliers: { supplier: string }[];
  items: RfqItemForSq[];
};

type CompanyDoc = { default_currency: string };

/**
 * "Record Supplier Quotation" — there is no supplier self-service portal in scope, so this
 * represents manually recording a quote the supplier gave you over phone/email/paper: pick
 * which one of the RFQ's own suppliers actually quoted, copy the RFQ's item lines with an
 * empty rate for the user to fill in.
 */
export default async function CreateSupplierQuotationPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const rfqName = decodeURIComponent(name);

  let doc: RfqForSq;
  try {
    doc = await getDoc<RfqForSq>("Request for Quotation", rfqName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.docstatus !== 1) {
    redirect(`/buying/request-for-quotations/${encodeURIComponent(rfqName)}`);
  }

  const [itemOptions, currencies, companyDoc] = await Promise.all([
    listItemOptions(),
    fetchLinkOptions("Currency"),
    getDoc<CompanyDoc>("Company", doc.company).catch(() => null),
  ]);

  const initialItems: LineRow[] = doc.items.map((i) => ({
    item_code: i.item_code,
    item_name: i.item_name,
    qty: i.qty,
    uom: i.uom,
    rate: 0,
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Buying", href: "/buying/request-for-quotations" },
          { label: "Request for Quotation", href: "/buying/request-for-quotations" },
          { label: rfqName, href: `/buying/request-for-quotations/${encodeURIComponent(rfqName)}` },
          { label: "Record Supplier Quotation" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Record Supplier Quotation</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From RFQ <span className="font-mono">{rfqName}</span> — pick which supplier this quote is from and enter the
        rate they quoted for each item.
      </p>

      <CreateSupplierQuotationForm
        action={createSupplierQuotationFromRfqAction.bind(null, rfqName)}
        suppliers={doc.suppliers.map((s) => s.supplier)}
        itemOptions={itemOptions}
        initialItems={initialItems}
        currencies={currencies}
        defaultCurrency={companyDoc?.default_currency}
      />
    </div>
  );
}
