/**
 * Canonical Ceylon Stack print document contract (LP-1 §4, refined during LP-2 against the real
 * Sales Invoice pilot). Every document adapter normalizes its own ERPNext doctype into this shape
 * — layout/template/renderer code only ever sees this, never raw ERPNext JSON. Trimmed against
 * what LP-0/LP-1 actually verified: no `signatures` (nothing in `docs/backend/17-layout-print/`
 * backs one yet); `letterHead`'s HTML header/footer are captured here for a future template to use
 * but LP-2's own renderer does not inject them as raw HTML (see renderer/DocumentRenderer.tsx).
 */

export type PrintLetterHead = {
  name: string;
  imageUrl?: string;
  /** Raw ERPNext Letter Head HTML — author-controlled (Letter Head edit permission), not
   * end-user input. Captured for a future template; LP-2's renderer does not render it. */
  headerHtml?: string;
  footerHtml?: string;
};

export type PrintCompany = {
  name: string;
  legalName: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  registrationDetails?: string;
  letterHead?: PrintLetterHead;
};

export type PrintBusinessPartner = {
  code: string;
  name: string;
  taxId?: string;
  /** Plain text, line-broken — derived from ERPNext's own `address_display`/`shipping_address`
   * Text Editor fields (see lib/print/shared.ts's `htmlBlockToPlainText`), never recomputed from
   * raw Address fields. */
  billingAddress?: string;
  shippingAddress?: string;
  contactDisplay?: string;
};

export type PrintLine = {
  itemCode: string;
  description: string;
  quantity: number;
  uom: string;
  rate: number;
  discountPercentage?: number;
  discountAmount?: number;
  amount: number;
};

export type PrintTaxRow = {
  description: string;
  rate?: number;
  amount: number;
  /** Running total after this row — ERPNext-authoritative, never recomputed. */
  total: number;
};

export type PrintTotals = {
  currency: string;
  netTotal: number;
  totalTaxesAndCharges: number;
  discountAmount?: number;
  roundingAdjustment?: number;
  grandTotal: number;
  roundedTotal?: number;
  /** ERPNext's own `in_words`/`base_in_words` — never generated client-side. */
  inWords?: string;
};

export type PrintBankInformation = {
  bankName: string;
  accountName: string;
  accountNumber?: string;
  iban?: string;
  branchCode?: string;
};

export type PrintDocumentMeta = {
  type: string;
  number: string;
  date: string;
  postingDate?: string;
  dueDate?: string;
  status?: string;
  reference?: string;
  currency: string;
};

export type DocumentPrintModel = {
  company: PrintCompany;
  document: PrintDocumentMeta;
  businessPartner: PrintBusinessPartner;
  lines: PrintLine[];
  taxes: PrintTaxRow[];
  totals: PrintTotals;
  bankInformation?: PrintBankInformation;
  terms?: string;
  notes?: string;
  metadata: {
    doctype: string;
    templateId: string;
  };
};

/**
 * The reusable Document Adapter contract (LP-2 §4 mission brief). `fetch` is the only network-
 * touching step (ERPNext reads); `normalize` is a pure function so it's testable with plain fixture
 * objects, no network/mocking required — see adapters/__tests__/salesInvoiceAdapter.test.ts.
 * `TRaw` is intentionally adapter-specific (each doctype's own fetched-bundle shape), never a
 * shared "raw ERPNext JSON" type — that's exactly the coupling this boundary exists to prevent.
 * Lives in types.ts (not adapter.ts) so adapters/*.ts never need to import adapter.ts's registry
 * module just to implement this interface — avoids a circular import between the registry and
 * every adapter it registers.
 */
export interface DocumentPrintAdapter<TRaw = unknown> {
  doctype: string;
  label: string;
  fetch(name: string): Promise<TRaw>;
  normalize(raw: TRaw): Omit<DocumentPrintModel, "metadata">;
}
