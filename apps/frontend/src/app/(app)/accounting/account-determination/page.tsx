import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AccessDeniedNotice } from "@/components/AccessDeniedNotice";
import { SavedBanner } from "@/components/SavedBanner";
import { SettingsFieldGroup, type SettingsFieldSpec } from "@/components/SettingsFieldGroup";
import { SellingSettingsFormShell } from "@/components/SellingSettingsFormShell";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import {
  getCompanyOptions,
  getScopedAccountOptions,
  getScopedCostCenterOptions,
  getScopedWarehouseOptions,
} from "@/lib/financeDefaults";
import { updateAccountDeterminationAction } from "./actions";

type CompanyDoc = {
  name: string;
  [key: string]: unknown;
};

const FORM_ID = "account-determination-form";

/**
 * Account Determination & Predefined Accounts — Finance Setup workspace (`FIN-1G-C`). Read/edit
 * surface for the `Company` doctype's own account-default fields, the layer connecting Company/
 * Item/Customer/Supplier/Warehouse/Tax to the G/L accounts Sales/Buying/Inventory/Manufacturing
 * transactions post to — this package covers only the Company-level layer (§2 of
 * `docs/backend/06-accounting/account-determination.md`), not the Item/Item Group/Brand/
 * Customer/Supplier inheritance chains documented in the same file (`FIN-1G-D`, a separate,
 * not-yet-authorized package), and not the Effective Account/"Why This Account?" explainer
 * (`FIN-1G-E`) or configuration health engine (`FIN-1G-F`).
 *
 * `Company` is a real doctype (unlike `sales/settings`'s Selling Settings Single), so this page
 * follows the same `?company=` switcher pattern `chart-of-accounts/page.tsx` already
 * established, and binds the resolved company name into the update action before handing it to
 * the shared `SellingSettingsFormShell` (reused as-is — its `(state, formData)` action
 * signature is exactly what `updateAccountDeterminationAction.bind(null, company)` produces, so
 * no new form-shell wrapper was needed here).
 *
 * The field groups below (General/Sales & Receivables/Purchasing & Payables/Inventory/
 * Manufacturing) match `account-determination.md` §2's grouping and the `FIN-1G-C` mission
 * brief's field list exactly — fieldnames, labels, and Link `options` doctypes all
 * live-verified against the real Company doctype schema, 2026-09-25. No Tax tab (no such
 * Company field exists per §10) and no Fixed Asset fields (out of scope).
 */
export default async function AccountDeterminationPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; saved?: string }>;
}) {
  const { company: requestedCompany, saved } = await searchParams;
  const { companies, company } = await getCompanyOptions(requestedCompany);

  let doc: CompanyDoc;
  let accountOptions: string[];
  let warehouseOptions: string[];
  let costCenterOptions: string[];
  try {
    [doc, accountOptions, warehouseOptions, costCenterOptions] = await Promise.all([
      getDoc<CompanyDoc>("Company", company),
      getScopedAccountOptions(company),
      getScopedWarehouseOptions(company),
      getScopedCostCenterOptions(company),
    ]);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 403) {
      return (
        <div>
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finance", href: "/accounting" }, { label: "Account Determination" }]} />
          <h1 className="mb-4 text-2xl font-medium text-graphite-900">Account Determination</h1>
          <AccessDeniedNotice what="Account Determination settings" />
        </div>
      );
    }
    throw e;
  }

  const accountField = (name: string, label: string): SettingsFieldSpec => ({
    kind: "link",
    name,
    label,
    options: accountOptions,
  });
  const warehouseField = (name: string, label: string): SettingsFieldSpec => ({
    kind: "link",
    name,
    label,
    options: warehouseOptions,
  });
  const costCenterField = (name: string, label: string): SettingsFieldSpec => ({
    kind: "link",
    name,
    label,
    options: costCenterOptions,
  });

  const generalFields: SettingsFieldSpec[] = [
    accountField("default_bank_account", "Default Bank Account"),
    accountField("default_cash_account", "Default Cash Account"),
    accountField("write_off_account", "Write Off Account"),
    accountField("default_discount_account", "Default Discount Account"),
    accountField("round_off_account", "Round Off Account"),
    costCenterField("round_off_cost_center", "Round Off Cost Center"),
    accountField("exchange_gain_loss_account", "Exchange Gain / Loss Account"),
    accountField("unrealized_exchange_gain_loss_account", "Unrealized Exchange Gain/Loss Account"),
    costCenterField("cost_center", "Default Cost Center"),
  ];

  const salesFields: SettingsFieldSpec[] = [
    accountField("default_receivable_account", "Default Receivable Account"),
    accountField("default_income_account", "Default Income Account"),
    accountField("default_deferred_revenue_account", "Default Deferred Revenue Account"),
    accountField("default_advance_received_account", "Default Advance Received Account"),
  ];

  const purchasingFields: SettingsFieldSpec[] = [
    accountField("default_payable_account", "Default Payable Account"),
    // Fieldname/label mismatch confirmed live and in account-determination.md §2 — ERPNext's
    // own Desk labels this "Default Cost of Goods Sold Account", not "Default Expense Account".
    accountField("default_expense_account", "Default Cost of Goods Sold Account"),
    accountField("service_expense_account", "Service Expense Account"),
    accountField("stock_received_but_not_billed", "Stock Received But Not Billed"),
    accountField("default_deferred_expense_account", "Default Deferred Expense Account"),
    accountField("default_advance_paid_account", "Default Advance Paid Account"),
    accountField("default_provisional_account", "Default Provisional Account"),
  ];

  const inventoryFields: SettingsFieldSpec[] = [
    accountField("default_inventory_account", "Default Inventory Account"),
    accountField("stock_adjustment_account", "Stock Adjustment Account"),
    accountField("expenses_added_to_stock_account", "Expenses Added To Stock Account"),
    accountField("expenses_added_to_stock_contra_account", "Expenses Added To Stock Contra Account"),
  ];

  const manufacturingFields: SettingsFieldSpec[] = [
    warehouseField("default_wip_warehouse", "Default Work In Progress Warehouse"),
    warehouseField("default_fg_warehouse", "Default Finished Goods Warehouse"),
    warehouseField("default_scrap_warehouse", "Default Scrap Warehouse"),
    accountField("default_operating_cost_account", "Default Operating Cost Account"),
  ];

  // Plain "N of M configured" count, live from the fetched Company doc's own field values —
  // no CONFIGURED/INHERITED/WARNING status model, no health scoring (that's `FIN-1G-F`,
  // explicitly out of this package's scope).
  const configuredCount = (fields: SettingsFieldSpec[]) => {
    const total = fields.length;
    const configured = fields.filter((f) => Boolean(doc[f.name])).length;
    return `${configured} of ${total} configured`;
  };

  const tabContent = (fields: SettingsFieldSpec[]) => (
    <div>
      <p className="mb-3 text-sm text-graphite-500">{configuredCount(fields)}</p>
      <SettingsFieldGroup formId={FORM_ID} fields={fields} initial={doc} />
    </div>
  );

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Finance", href: "/accounting" }, { label: "Account Determination" }]} />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-graphite-900">Account Determination</h1>
          <p className="mt-1 text-sm text-graphite-500">
            Predefined G/L account and warehouse defaults for {company} — where Sales, Buying,
            Inventory, and Manufacturing transactions post when nothing more specific overrides
            them.
          </p>
        </div>

        {companies.length > 1 && (
          // Same plain GET-form company switcher pattern as chart-of-accounts/page.tsx —
          // a Server Component page can't attach a client-side onChange handler.
          <form className="flex items-center gap-2 text-sm" action="/accounting/account-determination" method="get">
            <label htmlFor="company" className="text-graphite-500">
              Company
            </label>
            <select
              id="company"
              name="company"
              defaultValue={company}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
            >
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-canvas/60">
              Go
            </button>
          </form>
        )}
      </div>

      <SavedBanner show={saved === "1"} />

      <SellingSettingsFormShell
        action={updateAccountDeterminationAction.bind(null, company)}
        formId={FORM_ID}
        tabs={[
          { id: "general", label: "General", content: tabContent(generalFields) },
          { id: "sales", label: "Sales & Receivables", content: tabContent(salesFields) },
          { id: "purchasing", label: "Purchasing & Payables", content: tabContent(purchasingFields) },
          { id: "inventory", label: "Inventory", content: tabContent(inventoryFields) },
          { id: "manufacturing", label: "Manufacturing", content: tabContent(manufacturingFields) },
        ]}
      />

      <p className="mt-3 text-xs text-graphite-500">
        Need Item/Customer/Supplier-level overrides, or an explanation of which account a
        specific transaction actually used?{" "}
        <Link href="/accounting" className="text-signal hover:underline">
          Back to Finance home
        </Link>{" "}
        — those ship in later Finance packages.
      </p>
    </div>
  );
}
