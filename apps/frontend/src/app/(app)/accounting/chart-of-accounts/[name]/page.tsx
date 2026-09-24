import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AccountForm } from "@/components/AccountForm";
import { DocActionBar } from "@/components/DocActionBar";
import { SavedBanner } from "@/components/SavedBanner";
import { ErpNextError, getDoc, listDocs } from "@/lib/erpnext";
import { fetchLinkOptions } from "@/lib/linkOptions";
import { getAccountDependencies } from "@/lib/accountDependencies";
import { buildAccountOptions, type AccountHierarchyRow } from "@/lib/accountHierarchy";
import { deleteAccountAction, setAccountDisabledAction, updateAccountAction } from "../actions";

type AccountDoc = {
  name: string;
  account_name: string;
  account_number?: string;
  company: string;
  parent_account?: string | null;
  is_group: 0 | 1;
  root_type?: string | null;
  report_type?: string | null;
  account_type?: string | null;
  account_category?: string | null;
  account_currency?: string | null;
  balance_must_be?: string | null;
  freeze_account?: string | null;
  tax_rate?: number;
  disabled?: 0 | 1;
};

/**
 * FIN-1E — Account detail + edit (combined, same precedent `bank-accounts/[name]` and
 * `master-data/warehouses/[name]` both set for a doctype with no submit lifecycle to gate a
 * separate view/edit split on — live-verified, `Account` has no `amended_from`, `is_tree:
 * true`). Root accounts (`parent_account` unset — exactly 5 per company, live-verified) get a
 * read-only summary only: no edit form, no Disable/Delete actions, ever — ERPNext's own
 * `validate_root_details()` throws "Root cannot be edited." on any update to one, and while
 * its delete path has no equivalent server-side guard (a real gap this app closes itself),
 * this UI never offers the affordance regardless of what the live API would technically
 * accept, per the FIN-1E brief's explicit root-protection requirement.
 */
export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { name } = await params;
  const { saved } = await searchParams;
  const decodedName = decodeURIComponent(name);

  let doc: AccountDoc;
  try {
    doc = await getDoc<AccountDoc>("Account", decodedName);
  } catch (e) {
    if (e instanceof ErpNextError && e.status === 404) notFound();
    throw e;
  }

  const isRoot = !doc.parent_account;

  const [deps, accounts, categoryOptions, currencyOptions] = await Promise.all([
    getAccountDependencies(doc.name, doc.company, doc.parent_account),
    listDocs<AccountHierarchyRow>("Account", {
      fields: ["name", "account_name", "parent_account", "is_group", "root_type", "report_type"],
      filters: [["company", "=", doc.company]],
      limit: 200,
      orderBy: "lft asc",
    }),
    fetchLinkOptions("Account Category"),
    fetchLinkOptions("Currency"),
  ]);

  const accountOptions = buildAccountOptions(accounts);
  const children = accounts.filter((a) => a.parent_account === doc.name);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Finance", href: "/accounting" },
          { label: "Chart of Accounts", href: "/accounting/chart-of-accounts" },
          { label: doc.account_name },
        ]}
      />
      <SavedBanner show={saved === "1"} />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-graphite-900">{doc.account_name}</h1>
          <p className="font-mono text-xs text-graphite-500">{doc.name}</p>
          <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded bg-graphite-500/10 px-1.5 py-0.5 font-medium text-graphite-500">
              {doc.is_group ? "Group" : "Ledger"}
            </span>
            {doc.root_type && (
              <span className="rounded bg-graphite-500/10 px-1.5 py-0.5 font-medium text-graphite-500">{doc.root_type}</span>
            )}
            {doc.disabled ? (
              <span className="rounded bg-alert/10 px-1.5 py-0.5 font-medium text-alert">Disabled</span>
            ) : null}
            {isRoot && <span className="rounded bg-signal/10 px-1.5 py-0.5 font-medium text-signal">Root account</span>}
          </p>
        </div>

        {!isRoot && (
          <div className="flex items-center gap-2">
            <DocActionBar
              action={setAccountDisabledAction.bind(null, doc.name, !doc.disabled)}
              label={doc.disabled ? "Enable" : "Disable"}
              pendingLabel={doc.disabled ? "Enabling…" : "Disabling…"}
              variant={doc.disabled ? "primary" : "danger"}
            />
            {deps.canDelete && (
              <DocActionBar action={deleteAccountAction.bind(null, doc.name)} label="Delete" pendingLabel="Deleting…" variant="danger" />
            )}
          </div>
        )}
      </div>

      {isRoot && (
        <p className="mb-4 rounded-md border border-border bg-canvas/60 px-3 py-2 text-sm text-graphite-500">
          This is one of {doc.company}&apos;s 5 root accounts — ERPNext protects root accounts from editing, disabling, and
          deletion. Manage sub-accounts underneath it instead.
        </p>
      )}

      {!isRoot && !deps.canDelete && (
        <div className="mb-4 rounded-md border border-border bg-canvas/60 px-3 py-2 text-xs text-graphite-500">
          <p className="mb-1 font-medium text-graphite-900">Can&apos;t be deleted right now:</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {deps.blockReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {children.length > 0 && (
        <div className="mb-4 rounded-md border border-border bg-surface px-3 py-2 text-sm">
          <p className="mb-1 font-medium text-graphite-900">Sub-accounts ({children.length})</p>
          <ul className="space-y-0.5">
            {children.map((c) => (
              <li key={c.name}>
                <Link href={`/accounting/chart-of-accounts/${encodeURIComponent(c.name)}`} className="text-signal hover:underline">
                  {c.account_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isRoot && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-graphite-900">
              Add a child account under {doc.account_name}
            </h2>
            {doc.is_group && (
              <Link
                href={`/accounting/chart-of-accounts/new?company=${encodeURIComponent(doc.company)}&parent=${encodeURIComponent(doc.name)}`}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-canvas/60"
              >
                + Add child account
              </Link>
            )}
          </div>

          <AccountForm
            action={updateAccountAction.bind(null, doc.name)}
            mode="edit"
            company={doc.company}
            companyLocked
            accountOptions={accountOptions}
            parentLocked={false}
            categoryOptions={categoryOptions ?? []}
            currencyOptions={currencyOptions ?? []}
            currentName={doc.name}
            initial={{
              account_name: doc.account_name,
              account_number: doc.account_number,
              parent_account: doc.parent_account ?? undefined,
              is_group: doc.is_group,
              account_type: doc.account_type ?? undefined,
              account_category: doc.account_category ?? undefined,
              account_currency: doc.account_currency ?? undefined,
              balance_must_be: doc.balance_must_be ?? undefined,
              freeze_account: doc.freeze_account ?? undefined,
              tax_rate: doc.tax_rate,
            }}
          />
        </>
      )}
    </div>
  );
}
