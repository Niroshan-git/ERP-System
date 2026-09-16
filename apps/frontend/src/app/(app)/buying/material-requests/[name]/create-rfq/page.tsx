import { notFound, redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CreateRfqForm } from "@/components/CreateRfqForm";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { createRfqFromMaterialRequestAction } from "../../../request-for-quotations/actions";

type MaterialRequestItemForRfq = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
};

type MaterialRequestForRfq = {
  name: string;
  docstatus: number;
  company: string;
  schedule_date?: string;
  items: MaterialRequestItemForRfq[];
};

/**
 * Material Requests are not typically partially converted line-by-line the way Sales
 * Orders/Quotations are — this always copies the source Material Request's full item set
 * (full qty each) into the new RFQ, so there's no LineSelectionEditor-style partial-qty
 * picker here, just header fields (company/dates) plus a multi-supplier picker.
 */
export default async function CreateRfqFromMaterialRequestPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const materialRequestName = decodeURIComponent(name);

  let doc: MaterialRequestForRfq;
  try {
    doc = await getDoc<MaterialRequestForRfq>("Material Request", materialRequestName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  if (doc.docstatus !== 1) {
    redirect(`/buying/material-requests/${encodeURIComponent(materialRequestName)}`);
  }

  const [suppliers, companies] = await Promise.all([fetchLinkOptions("Supplier"), fetchLinkOptions("Company")]);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Buying", href: "/buying/material-requests" },
          { label: "Material Request", href: "/buying/material-requests" },
          { label: materialRequestName, href: `/buying/material-requests/${encodeURIComponent(materialRequestName)}` },
          { label: "Create RFQ" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-medium text-graphite-900">Create Request for Quotation</h1>
      <p className="mb-4 text-sm text-graphite-500">
        From Material Request <span className="font-mono">{materialRequestName}</span> — every item line is copied at
        its full quantity. Select which suppliers to send this RFQ to.
      </p>

      <CreateRfqForm
        action={createRfqFromMaterialRequestAction.bind(null, materialRequestName)}
        materialRequestName={materialRequestName}
        items={doc.items}
        suppliers={suppliers}
        companies={companies ?? [doc.company]}
        defaultCompany={doc.company}
        defaultScheduleDate={doc.schedule_date}
      />
    </div>
  );
}
