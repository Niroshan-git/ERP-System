import { formatAmount } from "@/lib/format";
import type { DocumentPrintModel } from "../types";
import type { ResolvedTemplate } from "../templateResolver";

/**
 * The reusable rendering shell (LP-2 §7). Consumes `DocumentPrintModel` + `ResolvedTemplate` only
 * — never a raw ERPNext doc — so any adapter's output renders through the same component. This is
 * the "engine LP-3 will render through," not LP-3's own polished Standard Ceylon Stack Template:
 * plain, legible, structurally complete (header/parties/lines/totals/terms/footer, A4, page-break
 * rules via print.css), deliberately unpolished visually.
 *
 * No `dangerouslySetInnerHTML` anywhere in this component — every string field on the canonical
 * model is either already plain text or was reduced to plain text by the adapter
 * (`lib/print/shared.ts`'s `htmlBlockToPlainText`), so React's default escaping is sufficient.
 * `ResolvedTemplate` is accepted (not just read) so a future LP-9 template registry can swap in a
 * different presentation without changing this component's call sites — V1 has exactly one, so it
 * only affects `data-template-id` today.
 */
export function DocumentRenderer({ model, template }: { model: DocumentPrintModel; template: ResolvedTemplate }) {
  const { company, document, businessPartner, lines, taxes, totals, bankInformation, terms, notes } = model;

  return (
    <div className="print-doc" data-template-id={template.id} data-doctype={model.metadata.doctype}>
      <header className="print-doc__header">
        <div>
          {company.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- server-verified ERPNext file URL, not user input; next/image's remote-pattern config isn't set up for the ERPNext host.
            <img className="print-doc__logo" src={company.logoUrl} alt={company.legalName} />
          )}
          <p className="print-doc__company-name">{company.legalName}</p>
          <div className="print-doc__company-meta">
            {[company.taxId && `Tax ID: ${company.taxId}`, company.phone, company.email, company.website]
              .filter(Boolean)
              .join("\n")}
          </div>
        </div>
        <div>
          <p className="print-doc__title">{document.type}</p>
          <table className="print-doc__meta-table">
            <tbody>
              <tr>
                <td>No.</td>
                <td>{document.number}</td>
              </tr>
              <tr>
                <td>Date</td>
                <td>{document.postingDate ?? document.date}</td>
              </tr>
              {document.dueDate && (
                <tr>
                  <td>Due</td>
                  <td>{document.dueDate}</td>
                </tr>
              )}
              {document.status && (
                <tr>
                  <td>Status</td>
                  <td>{document.status}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </header>

      <div className="print-doc__parties">
        <div>
          <p className="print-doc__party-title">Bill To</p>
          <p className="print-doc__party-block">
            {businessPartner.name}
            {businessPartner.billingAddress ? `\n${businessPartner.billingAddress}` : ""}
            {businessPartner.taxId ? `\nTax ID: ${businessPartner.taxId}` : ""}
          </p>
        </div>
        {businessPartner.shippingAddress && (
          <div>
            <p className="print-doc__party-title">Ship To</p>
            <p className="print-doc__party-block">{businessPartner.shippingAddress}</p>
          </div>
        )}
      </div>

      <table className="print-doc__lines">
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th className="num">Qty</th>
            <th>UOM</th>
            <th className="num">Rate</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={`${line.itemCode}-${index}`}>
              <td>{line.itemCode}</td>
              <td>{line.description}</td>
              <td className="num">{line.quantity}</td>
              <td>{line.uom}</td>
              <td className="num">{formatAmount(line.rate)}</td>
              <td className="num">{formatAmount(line.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-doc__totals">
        <table>
          <tbody>
            <tr>
              <td>Net Total</td>
              <td className="num">
                {formatAmount(totals.netTotal)} {totals.currency}
              </td>
            </tr>
            {taxes.map((tax, index) => (
              <tr key={`${tax.description}-${index}`}>
                <td>{tax.description}</td>
                <td className="num">
                  {formatAmount(tax.amount)} {totals.currency}
                </td>
              </tr>
            ))}
            {(totals.discountAmount ?? 0) !== 0 && (
              <tr>
                <td>Discount</td>
                <td className="num">
                  {formatAmount(totals.discountAmount)} {totals.currency}
                </td>
              </tr>
            )}
            {(totals.roundingAdjustment ?? 0) !== 0 && (
              <tr>
                <td>Rounding</td>
                <td className="num">
                  {formatAmount(totals.roundingAdjustment)} {totals.currency}
                </td>
              </tr>
            )}
            <tr className="grand-total">
              <td>Grand Total</td>
              <td className="num">
                {formatAmount(totals.roundedTotal ?? totals.grandTotal)} {totals.currency}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {totals.inWords && <p className="print-doc__totals-words">Amount in words: {totals.inWords}</p>}

      {bankInformation && (
        <div className="print-doc__section">
          <p className="print-doc__section-title">Bank Information</p>
          <p className="print-doc__section-body">
            {[
              bankInformation.bankName,
              bankInformation.accountName,
              bankInformation.accountNumber && `A/C No: ${bankInformation.accountNumber}`,
              bankInformation.iban && `IBAN: ${bankInformation.iban}`,
              bankInformation.branchCode && `Branch: ${bankInformation.branchCode}`,
            ]
              .filter(Boolean)
              .join("\n")}
          </p>
        </div>
      )}

      {terms && (
        <div className="print-doc__section">
          <p className="print-doc__section-title">Terms &amp; Conditions</p>
          <p className="print-doc__section-body">{terms}</p>
        </div>
      )}

      {notes && (
        <div className="print-doc__section">
          <p className="print-doc__section-title">Notes</p>
          <p className="print-doc__section-body">{notes}</p>
        </div>
      )}

      <footer className="print-doc__footer">
        <span>{company.legalName}</span>
        <span>{document.number}</span>
      </footer>
    </div>
  );
}
