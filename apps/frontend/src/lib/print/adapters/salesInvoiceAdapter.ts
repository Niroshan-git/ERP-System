import "server-only";
import { getDoc } from "@/lib/erpnext";
import { htmlBlockToPlainText, resolveBankInformation, resolveCompanyPrintInfo } from "../shared";
import type { DocumentPrintAdapter, DocumentPrintModel, PrintBankInformation, PrintCompany } from "../types";

/** Only the fields this adapter actually reads — not a full Sales Invoice type (see
 * `apps/frontend/src/app/(app)/sales/invoices/[name]/page.tsx`'s own, separately-maintained
 * `SalesInvoiceDoc` type for the UI's needs; duplicating field *names* against the same live
 * schema is fine, duplicating the whole type is not this adapter's job to avoid). */
type RawSalesInvoiceItem = {
  item_code: string;
  item_name: string;
  description?: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  discount_percentage?: number;
  discount_amount?: number;
};

type RawSalesTaxRow = {
  description: string;
  rate?: number;
  tax_amount: number;
  total: number;
};

type RawSalesInvoice = {
  name: string;
  company: string;
  customer: string;
  customer_name?: string;
  tax_id?: string;
  posting_date: string;
  due_date?: string;
  status?: string;
  docstatus: 0 | 1 | 2;
  currency: string;
  address_display?: string;
  shipping_address?: string;
  contact_display?: string;
  items: RawSalesInvoiceItem[];
  taxes?: RawSalesTaxRow[];
  net_total: number;
  total_taxes_and_charges?: number;
  discount_amount?: number;
  rounding_adjustment?: number;
  grand_total: number;
  rounded_total?: number;
  in_words?: string;
  terms?: string;
  letter_head?: string;
};

export type SalesInvoiceBundle = {
  doc: RawSalesInvoice;
  company: PrintCompany;
  bankInformation?: PrintBankInformation;
};

async function fetchSalesInvoice(name: string): Promise<SalesInvoiceBundle> {
  const doc = await getDoc<RawSalesInvoice>("Sales Invoice", name);
  const { company, defaultBankAccountName } = await resolveCompanyPrintInfo(doc.company, doc.letter_head);
  const bankInformation = await resolveBankInformation(defaultBankAccountName);
  return { doc, company, bankInformation };
}

/**
 * Pure normalization — no network calls, so it's directly unit-testable with fixture bundles
 * (see `__tests__/salesInvoiceAdapter.test.ts`). Totals/tax rows/amount-in-words are read
 * verbatim from `doc` (mission §12: never recompute ERP accounting in the output engine).
 */
function normalize(bundle: SalesInvoiceBundle): Omit<DocumentPrintModel, "metadata"> {
  const { doc, company, bankInformation } = bundle;

  return {
    company,
    document: {
      type: "Sales Invoice",
      number: doc.name,
      date: doc.posting_date,
      postingDate: doc.posting_date,
      dueDate: doc.due_date,
      status: doc.status,
      currency: doc.currency,
    },
    businessPartner: {
      code: doc.customer,
      name: doc.customer_name || doc.customer,
      taxId: doc.tax_id,
      billingAddress: htmlBlockToPlainText(doc.address_display),
      shippingAddress: htmlBlockToPlainText(doc.shipping_address),
      contactDisplay: doc.contact_display,
    },
    lines: doc.items.map((item) => ({
      itemCode: item.item_code,
      description: item.description || item.item_name,
      quantity: item.qty,
      uom: item.uom,
      rate: item.rate,
      discountPercentage: item.discount_percentage,
      discountAmount: item.discount_amount,
      amount: item.amount,
    })),
    taxes: (doc.taxes ?? []).map((tax) => ({
      description: tax.description,
      rate: tax.rate,
      amount: tax.tax_amount,
      total: tax.total,
    })),
    totals: {
      currency: doc.currency,
      netTotal: doc.net_total,
      totalTaxesAndCharges: doc.total_taxes_and_charges ?? 0,
      discountAmount: doc.discount_amount,
      roundingAdjustment: doc.rounding_adjustment,
      grandTotal: doc.grand_total,
      roundedTotal: doc.rounded_total,
      inWords: doc.in_words,
    },
    bankInformation,
    terms: htmlBlockToPlainText(doc.terms),
  };
}

export const salesInvoiceAdapter: DocumentPrintAdapter<SalesInvoiceBundle> = {
  doctype: "Sales Invoice",
  label: "Sales Invoice",
  fetch: fetchSalesInvoice,
  normalize,
};
