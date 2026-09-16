import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SetQuotationLostForm } from "@/components/SetQuotationLostForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { setQuotationAsLostAction } from "../../actions";

type QuotationForLost = { docstatus: number; status: string; party_name: string };

/**
 * "Set as Lost" step, linked from the Quotation detail page. Gated the same way ERPNext's
 * own Desk button is (`quotation.js::refresh`, confirmed live):
 * `docstatus === 1 && status not in ("Lost", "Ordered")` — notably this still lets a
 * "Partially Ordered" quotation reach this page, same as real ERPNext does, even though
 * `declare_enquiry_lost` itself then rejects it server-side ("Cannot set as Lost as Sales
 * Order is made.") — that's ERPNext's own real behavior, not a gap in this gate.
 */
export default async function SetQuotationAsLostPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const quotationName = decodeURIComponent(name);

  let doc: QuotationForLost;
  try {
    doc = await getDoc<QuotationForLost>("Quotation", quotationName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.docstatus !== 1 || doc.status === "Lost" || doc.status === "Ordered") {
    redirect(`/sales/quotations/${encodeURIComponent(quotationName)}`);
  }

  const lostReasons = await fetchLinkOptions("Quotation Lost Reason");

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Selling", href: "/sales/quotations" },
          { label: "Quotation", href: "/sales/quotations" },
          { label: quotationName, href: `/sales/quotations/${encodeURIComponent(quotationName)}` },
          { label: "Set as Lost" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Set as Lost</h1>
      <p className="mb-4 text-sm text-graphite-500">
        Quotation <span className="font-mono">{quotationName}</span> for {doc.party_name}. This calls ERPNext&apos;s
        own <code className="font-mono">declare_enquiry_lost</code> — the quotation can no longer be converted to a
        Sales Order afterward.
      </p>
      <SetQuotationLostForm action={setQuotationAsLostAction.bind(null, quotationName)} lostReasons={lostReasons} />
    </div>
  );
}
