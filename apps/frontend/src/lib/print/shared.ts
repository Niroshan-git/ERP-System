import "server-only";
import { ErpNextError, getDoc } from "@/lib/erpnext";
import { BASE_URL } from "@/lib/erpnextAuth";
import type { PrintBankInformation, PrintCompany } from "./types";

/**
 * Resolves an ERPNext-relative file path (Attach Image fields return `/files/...` or
 * `/private/files/...`) to an absolute URL the browser can load directly. Only ever fed
 * server-verified doc data (Company/Letter Head), never client input — no injection surface.
 */
export function resolveFileUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (!BASE_URL) return undefined;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Converts one of ERPNext's own precomputed address/terms Text Editor fields (`address_display`,
 * `shipping_address`, `company_address_display`) into safe plain text with line breaks preserved.
 * Deliberately not rendered as raw HTML in LP-2: these fields are built from user-editable Address
 * free-text fields (address_line1, city, ...) and this package did not verify whether ERPNext
 * escapes them before interpolating — stripping tags closes that question by construction rather
 * than assuming it's safe. Pair with `white-space: pre-line` in the renderer to keep line breaks.
 */
export function htmlBlockToPlainText(html?: string | null): string | undefined {
  if (!html) return undefined;
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  const trimmed = withBreaks.replace(/\n{3,}/g, "\n\n").trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

type CompanyDoc = {
  name: string;
  company_name: string;
  company_logo?: string;
  tax_id?: string;
  phone_no?: string;
  email?: string;
  website?: string;
  registration_details?: string;
  default_letter_head?: string;
  default_bank_account?: string;
};

type LetterHeadDoc = {
  name: string;
  image?: string;
  content?: string;
  footer?: string;
  disabled?: 0 | 1;
};

type BankAccountDoc = {
  name: string;
  account_name: string;
  bank: string;
  iban?: string;
  bank_account_no?: string;
  branch_code?: string;
};

/**
 * Resolves Company + (explicit or default) Letter Head into the canonical `PrintCompany` shape.
 * `explicitLetterHead` lets a per-document override win (e.g. Sales Invoice's own `letter_head`
 * field) over `Company.default_letter_head` — matches ERPNext's own resolution order.
 *
 * Fails safe (mission §6): a missing/unreadable Letter Head does not throw — it just means no
 * letterhead image/branding on the printed document, never "this document can't be printed."
 * A missing/unreadable Company is a hard failure (there is no fallback company).
 */
export async function resolveCompanyPrintInfo(
  companyName: string,
  explicitLetterHead?: string,
): Promise<{ company: PrintCompany; defaultBankAccountName?: string }> {
  const company = await getDoc<CompanyDoc>("Company", companyName);
  const letterHeadName = explicitLetterHead || company.default_letter_head;

  let letterHead: PrintCompany["letterHead"];
  if (letterHeadName) {
    try {
      const lh = await getDoc<LetterHeadDoc>("Letter Head", letterHeadName);
      letterHead = {
        name: lh.name,
        imageUrl: resolveFileUrl(lh.image),
        headerHtml: lh.content,
        footerHtml: lh.footer,
      };
    } catch (e) {
      if (!(e instanceof ErpNextError && (e.status === 404 || e.status === 403))) throw e;
    }
  }

  return {
    company: {
      name: company.name,
      legalName: company.company_name,
      logoUrl: resolveFileUrl(company.company_logo),
      phone: company.phone_no,
      email: company.email,
      website: company.website,
      taxId: company.tax_id,
      registrationDetails: company.registration_details,
      letterHead,
    },
    defaultBankAccountName: company.default_bank_account,
  };
}

/**
 * Resolves a `Bank Account` name (Finance-owned, `Company.default_bank_account`) into the
 * canonical `PrintBankInformation` shape. Fails safe: no bank account configured, or the service
 * account can't read it, just means no bank details on the printed document — never a hard error.
 */
export async function resolveBankInformation(
  bankAccountName?: string,
): Promise<PrintBankInformation | undefined> {
  if (!bankAccountName) return undefined;
  try {
    const acct = await getDoc<BankAccountDoc>("Bank Account", bankAccountName);
    return {
      bankName: acct.bank,
      accountName: acct.account_name,
      accountNumber: acct.bank_account_no,
      iban: acct.iban,
      branchCode: acct.branch_code,
    };
  } catch (e) {
    if (e instanceof ErpNextError && (e.status === 404 || e.status === 403)) return undefined;
    throw e;
  }
}
