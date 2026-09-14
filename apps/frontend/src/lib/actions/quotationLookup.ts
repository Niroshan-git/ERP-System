"use server";

import { getDoc, listDocs } from "@/lib/erpnext";

export type CopyableQuotation = {
  name: string;
  transaction_date: string;
  status: string;
  grand_total: number;
};

/**
 * Quotations belonging to `customer` *and* `company` that still have something worth
 * copying into a new Sales Order — Submitted (docstatus=1), and not
 * Lost/Expired/Cancelled/fully "Ordered". "Ordered" is excluded because every line's
 * remaining qty is 0 by definition once a Quotation reaches that status (see quotation.py's
 * get_ordered_status, the same real ERPNext status this app's own status pills already read
 * via lib/erpStatus.ts) — nothing left to select there. "Open"/"Replied"/"Partially Ordered"
 * are exactly the copyable ones.
 *
 * The `company` filter exists because ERPNext itself enforces same-company on save: a Sales
 * Order with `prevdoc_docname` set validates `Quotation.company == Sales Order.company` via
 * `validate_with_previous_doc` (confirmed live on the Hetzner server — that's the real source
 * of the raw "Incorrect value: Company must be equal to '...'" error a cross-company copy
 * used to hit at Save). Filtering here means a Quotation under a different Company than
 * what's currently selected on the New Sales Order form never appears in the picker in the
 * first place, rather than surfacing that error after the fact.
 */
export async function listCopyableQuotations(customer: string, company: string): Promise<CopyableQuotation[]> {
  if (!customer || !company) return [];
  try {
    const rows = await listDocs<CopyableQuotation>("Quotation", {
      fields: ["name", "transaction_date", "status", "grand_total"],
      filters: [
        ["party_name", "=", customer],
        ["company", "=", company],
        ["docstatus", "=", 1],
        ["status", "not in", ["Lost", "Expired", "Ordered", "Cancelled"]],
      ],
      limit: 50,
      orderBy: "transaction_date desc",
    });
    return rows;
  } catch {
    return [];
  }
}

export type QuotationItemForCopy = {
  reference: string;
  item_code: string;
  item_name: string;
  uom: string;
  rate: number;
  originalQty: number;
  remainingQty: number;
};

export type QuotationForCopy = {
  name: string;
  rows: QuotationItemForCopy[];
  customer_address?: string;
  contact_person?: string;
  shipping_address_name?: string;
  territory?: string;
  customer_group?: string;
  tc_name?: string;
  terms?: string;
  title?: string;
};

type QuotationItemDoc = {
  name: string;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  /** Real, live ERPNext field — see the doc comment on createSalesOrderFromQuotationAction
   * in sales/orders/actions.ts for how it's kept in sync. */
  ordered_qty?: number;
};

type QuotationDocForCopy = {
  name: string;
  docstatus: number;
  company: string;
  items: QuotationItemDoc[];
  customer_address?: string;
  contact_person?: string;
  shipping_address_name?: string;
  territory?: string;
  customer_group?: string;
  tc_name?: string;
  terms?: string;
  title?: string;
};

/**
 * Full per-line detail for one Quotation, shaped directly for LineSelectionEditor's `rows`
 * prop — same remaining-qty computation as /sales/quotations/[name]/create-order (real,
 * live `Quotation Item.ordered_qty`, not a guess). Used by the "Copy From Quotation" panel
 * on the New Sales Order page.
 *
 * `expectedCompany`, when given, is a defense-in-depth re-check (not just the picker's own
 * `listCopyableQuotations` filter) — returns null rather than a Quotation whose `company`
 * doesn't match, so there's no path (e.g. a stale checked box surviving some future UI
 * change) that can still hand a cross-company Quotation's rows to LineSelectionEditor.
 */
export async function getQuotationForCopy(
  quotationName: string,
  expectedCompany?: string,
): Promise<QuotationForCopy | null> {
  if (!quotationName) return null;
  let doc: QuotationDocForCopy;
  try {
    doc = await getDoc<QuotationDocForCopy>("Quotation", quotationName);
  } catch {
    return null;
  }
  if (doc.docstatus !== 1) return null;
  if (expectedCompany && doc.company !== expectedCompany) return null;

  return {
    name: doc.name,
    rows: doc.items.map((item) => ({
      reference: item.name,
      item_code: item.item_code,
      item_name: item.item_name,
      uom: item.uom,
      rate: item.rate,
      originalQty: item.qty,
      remainingQty: item.qty - (item.ordered_qty ?? 0),
    })),
    customer_address: doc.customer_address,
    contact_person: doc.contact_person,
    shipping_address_name: doc.shipping_address_name,
    territory: doc.territory,
    customer_group: doc.customer_group,
    tc_name: doc.tc_name,
    terms: doc.terms,
    title: doc.title,
  };
}
