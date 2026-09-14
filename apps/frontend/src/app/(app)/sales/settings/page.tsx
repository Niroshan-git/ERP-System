import { cookies } from "next/headers";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { SavedBanner } from "@/components/SavedBanner";
import { SettingsFieldGroup, type SettingsFieldSpec } from "@/components/SettingsFieldGroup";
import { SellingSettingsFormShell } from "@/components/SellingSettingsFormShell";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { buildTimeline } from "@/lib/timeline";
import { postCommentAction } from "@/lib/actions/comments";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { updateSellingSettingsAction } from "./actions";

type SellingSettingsDoc = {
  creation: string;
  owner: string;
  modified: string;
  modified_by: string;
  [key: string]: unknown;
};

/**
 * ERPNext's real Selling Settings (`erpnext/selling/doctype/selling_settings`), a
 * Single doctype — read directly from the live DocType JSON, not guessed. Tabs match
 * Desk exactly (Customer Defaults / Pricing / Transaction / Advanced Features /
 * Subcontracting Inward), with one exception: Desk's "Document Naming" tab has no real
 * fields of its own — just a hidden "Configure Series" button and a read-only virtual
 * field Desk's own JS populates client-side — so there's nothing to build there; omitted
 * rather than shipped as an empty tab, same call made for "Sales Funnel" in Reports.
 *
 * Comments/Activity timeline from the screenshot is now built too, as its own tab —
 * see components/ActivityTimeline.tsx and lib/timeline.ts.
 */
const FORM_ID = "selling-settings-form";

export default async function SellingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  let doc: SellingSettingsDoc;
  let customerGroups: string[] | null;
  let territories: string[] | null;
  let priceLists: string[] | null;
  let roles: string[] | null;
  let timeline: Awaited<ReturnType<typeof buildTimeline>>;
  let session: Awaited<ReturnType<typeof verifySession>>;
  try {
    doc = await getDoc<SellingSettingsDoc>("Selling Settings", "Selling Settings");
    [customerGroups, territories, priceLists, roles, timeline, session] = await Promise.all([
      fetchLinkOptions("Customer Group"),
      fetchLinkOptions("Territory"),
      fetchLinkOptions("Price List"),
      fetchLinkOptions("Role"),
      buildTimeline("Selling Settings", "Selling Settings", doc),
      verifySession((await cookies()).get(SESSION_COOKIE)?.value),
    ]);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">Selling Settings</h1>
          <AccessDeniedNotice what="Selling Settings" />
        </div>
      );
    }
    throw e;
  }

  const customerDefaultsFields: SettingsFieldSpec[] = [
    {
      kind: "select",
      name: "cust_master_name",
      label: "Customer Naming By",
      options: ["Customer Name", "Naming Series", "Auto Name"],
    },
    { kind: "link", name: "customer_group", label: "Default Customer Group", options: customerGroups },
    { kind: "link", name: "territory", label: "Default Territory", options: territories },
  ];

  const pricingFields: SettingsFieldSpec[] = [
    { kind: "link", name: "selling_price_list", label: "Default Price List", options: priceLists },
    {
      kind: "select",
      name: "maintain_same_rate_action",
      label: "Action if same rate is not maintained throughout sales cycle",
      options: ["Stop", "Warn"],
    },
    { kind: "link", name: "role_to_override_stop_action", label: "Role allowed to override stop action", options: roles },
    {
      kind: "checkbox",
      name: "maintain_same_sales_rate",
      label: "Maintain same rate throughout sales cycle",
      bold: true,
      description: "Warn or stop if Item rate is changed in Delivery Notes and Sales Invoices generated from a Sales Order.",
    },
    { kind: "checkbox", name: "editable_price_list_rate", label: "Allow editing Price List rate in transactions", bold: true },
    { kind: "checkbox", name: "fallback_to_default_price_list", label: "Use prices from Default Price List as fallback" },
    {
      kind: "checkbox",
      name: "validate_selling_price",
      label: "Validate selling price for Item against purchase or valuation rate",
      description: "Blocks transactions where the selling price is less than the purchase or valuation rate.",
    },
    { kind: "checkbox", name: "editable_bundle_item_rates", label: "Calculate Product Bundle price based on child Item's rates" },
    { kind: "checkbox", name: "allow_negative_rates_for_items", label: "Allow negative rates for Items" },
  ];

  const transactionFields: SettingsFieldSpec[] = [
    { kind: "select", name: "so_required", label: "Is Sales Order required to create Sales Invoice/Delivery Note?", options: ["No", "Yes"] },
    { kind: "select", name: "dn_required", label: "Is Delivery Note required to create Sales Invoice?", options: ["No", "Yes"] },
    {
      kind: "select",
      name: "sales_update_frequency",
      label: "How often should sales data be updated in Company/Project?",
      options: ["Monthly", "Each Transaction", "Daily"],
    },
    { kind: "number", name: "blanket_order_allowance", label: "Blanket Order Allowance (%)" },
    { kind: "checkbox", name: "allow_multiple_items", label: "Allow same Item to be added multiple times in a transaction" },
    { kind: "checkbox", name: "allow_against_multiple_purchase_orders", label: "Allow multiple Sales Orders against a customer's Purchase Order" },
    { kind: "checkbox", name: "hide_tax_id", label: "Hide Customer's Tax ID from sales transactions" },
    { kind: "checkbox", name: "allow_sales_order_creation_for_expired_quotation", label: "Allow Sales Order creation for expired Quotation" },
    { kind: "checkbox", name: "dont_reserve_sales_order_qty_on_sales_return", label: "Don't reserve Sales Order qty on sales return" },
    { kind: "checkbox", name: "enable_cutoff_date_on_bulk_delivery_note_creation", label: "Enable cut-off date on creating bulk Delivery Notes" },
    { kind: "checkbox", name: "set_zero_rate_for_expired_batch", label: "Set incoming rate as zero for expired Batch" },
    { kind: "checkbox", name: "allow_zero_qty_in_quotation", label: "Allow Quotation with zero quantity" },
    { kind: "checkbox", name: "allow_zero_qty_in_sales_order", label: "Allow Sales Order with zero quantity" },
  ];

  const advancedFeaturesFields: SettingsFieldSpec[] = [
    { kind: "checkbox", name: "enable_tracking_sales_commissions", label: "Enable tracking sales commissions" },
    { kind: "checkbox", name: "enable_discount_accounting", label: "Enable discount accounting for selling" },
    { kind: "checkbox", name: "enable_utm", label: "Enable UTM" },
    { kind: "checkbox", name: "use_legacy_js_reactivity", label: "Use Legacy (Client side) Reactivity" },
  ];

  const subcontractingFields: SettingsFieldSpec[] = [
    { kind: "checkbox", name: "allow_delivery_of_overproduced_qty", label: "Allow delivery of overproduced quantity" },
    { kind: "checkbox", name: "deliver_secondary_items", label: "Deliver secondary Items" },
  ];

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-medium text-graphite-900">Selling Settings</h1>
        <p className="text-sm text-graphite-500">Defaults and behavior for Quotations, Sales Orders and Sales Invoices.</p>
      </div>

      <SavedBanner show={saved === "1"} />

      <SellingSettingsFormShell
        action={updateSellingSettingsAction}
        tabs={[
          {
            id: "customer-defaults",
            label: "Customer Defaults",
            content: <SettingsFieldGroup formId={FORM_ID} fields={customerDefaultsFields} initial={doc} />,
          },
          {
            id: "pricing",
            label: "Pricing",
            content: <SettingsFieldGroup formId={FORM_ID} fields={pricingFields} initial={doc} />,
          },
          {
            id: "transaction",
            label: "Transaction",
            content: <SettingsFieldGroup formId={FORM_ID} fields={transactionFields} initial={doc} />,
          },
          {
            id: "advanced-features",
            label: "Advanced Features",
            content: <SettingsFieldGroup formId={FORM_ID} fields={advancedFeaturesFields} initial={doc} />,
          },
          {
            id: "subcontracting-inward",
            label: "Subcontracting Inward",
            content: <SettingsFieldGroup formId={FORM_ID} fields={subcontractingFields} initial={doc} />,
          },
          {
            id: "comments",
            label: "Comments",
            content: (
              <ActivityTimeline
                currentUserFullName={session?.fullName ?? ""}
                entries={timeline}
                postComment={postCommentAction.bind(null, "Selling Settings", "Selling Settings", "/sales/settings")}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
