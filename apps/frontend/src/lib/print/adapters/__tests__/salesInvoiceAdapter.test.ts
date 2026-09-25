import { describe, expect, it } from "vitest";
import { salesInvoiceAdapter, type SalesInvoiceBundle } from "../salesInvoiceAdapter";
import type { PrintCompany } from "../../types";

/**
 * Engine-level fixture tests (LP-2 §13) against `salesInvoiceAdapter.normalize` — pure, no
 * network calls, so every fixture below is a plain in-memory bundle. Covers the edge-case matrix
 * the mission brief lists that's actually a *data transformation* concern (missing optional
 * fields, long strings, many lines, multiple taxes, decimals, logo/no logo, currency). Visual
 * concerns from the same list (multi-page layout, page-break behavior, print CSS) are rendering
 * concerns, not normalization ones — those need a real browser/PDF check (LP-3/LP-4A/QA), not a
 * unit test, and are disclosed as such rather than faked here.
 */

const baseCompany: PrintCompany = {
  name: "Ceylon Manufacturing Pvt Ltd",
  legalName: "Ceylon Manufacturing Pvt Ltd",
  taxId: "TAX-001",
};

function bundle(overrides: Partial<SalesInvoiceBundle["doc"]> = {}, company: PrintCompany = baseCompany): SalesInvoiceBundle {
  return {
    company,
    doc: {
      name: "SINV-0001",
      company: "Ceylon Manufacturing Pvt Ltd",
      customer: "CUST-0001",
      customer_name: "Acme Trading Co",
      posting_date: "2026-09-25",
      docstatus: 1,
      currency: "LKR",
      items: [{ item_code: "ITEM-1", item_name: "Widget", qty: 2, uom: "Nos", rate: 100, amount: 200 }],
      net_total: 200,
      grand_total: 200,
      ...overrides,
    },
  };
}

describe("salesInvoiceAdapter.normalize", () => {
  it("normalizes a minimal document with no optional fields", () => {
    const model = salesInvoiceAdapter.normalize(bundle());
    expect(model.document.number).toBe("SINV-0001");
    expect(model.businessPartner.name).toBe("Acme Trading Co");
    expect(model.lines).toHaveLength(1);
    expect(model.taxes).toEqual([]);
    expect(model.bankInformation).toBeUndefined();
    expect(model.terms).toBeUndefined();
  });

  it("falls back to the customer code when customer_name is absent", () => {
    const model = salesInvoiceAdapter.normalize(bundle({ customer_name: undefined }));
    expect(model.businessPartner.name).toBe("CUST-0001");
  });

  it("falls back to item_name when a line has no description", () => {
    const model = salesInvoiceAdapter.normalize(
      bundle({ items: [{ item_code: "ITEM-1", item_name: "Widget", qty: 1, uom: "Nos", rate: 50, amount: 50 }] }),
    );
    expect(model.lines[0].description).toBe("Widget");
  });

  it("never recomputes totals — reads grand_total/rounded_total/in_words verbatim", () => {
    const model = salesInvoiceAdapter.normalize(
      bundle({
        net_total: 999.99,
        total_taxes_and_charges: 100.01,
        grand_total: 1100,
        rounded_total: 1100,
        in_words: "LKR One Thousand One Hundred Only",
      }),
    );
    expect(model.totals.netTotal).toBe(999.99);
    expect(model.totals.grandTotal).toBe(1100);
    expect(model.totals.inWords).toBe("LKR One Thousand One Hundred Only");
  });

  it("handles multiple tax rows, preserving each row's own running total", () => {
    const model = salesInvoiceAdapter.normalize(
      bundle({
        taxes: [
          { description: "VAT 15%", rate: 15, tax_amount: 30, total: 230 },
          { description: "NBT 2%", rate: 2, tax_amount: 4.6, total: 234.6 },
        ],
      }),
    );
    expect(model.taxes).toHaveLength(2);
    expect(model.taxes[1].total).toBe(234.6);
  });

  it("handles many line items with decimal quantities", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      item_code: `ITEM-${i}`,
      item_name: `Item ${i}`,
      qty: 1.5,
      uom: "Kg",
      rate: 10.333,
      amount: 15.5,
    }));
    const model = salesInvoiceAdapter.normalize(bundle({ items }));
    expect(model.lines).toHaveLength(50);
    expect(model.lines[49].quantity).toBe(1.5);
  });

  it("preserves long company/customer names and long addresses without truncation", () => {
    const longName = "A".repeat(200);
    const longAddress = "<div>" + "123 Very Long Street Name, ".repeat(20) + "Colombo</div>";
    const model = salesInvoiceAdapter.normalize(
      bundle(
        { customer_name: longName, address_display: longAddress },
        { ...baseCompany, legalName: "B".repeat(200) },
      ),
    );
    expect(model.businessPartner.name).toBe(longName);
    expect(model.company.legalName).toHaveLength(200);
    expect(model.businessPartner.billingAddress).not.toContain("<div>");
    expect(model.businessPartner.billingAddress?.length).toBeGreaterThan(100);
  });

  it("omits shipping address from the model when the document has none", () => {
    const model = salesInvoiceAdapter.normalize(bundle({ shipping_address: undefined }));
    expect(model.businessPartner.shippingAddress).toBeUndefined();
  });

  it("carries bank information through when the bundle resolved one", () => {
    const model = salesInvoiceAdapter.normalize({
      ...bundle(),
      bankInformation: { bankName: "Bank of Ceylon", accountName: "Ceylon Manufacturing", accountNumber: "12345" },
    });
    expect(model.bankInformation?.bankName).toBe("Bank of Ceylon");
  });

  it("renders no logo gracefully when the company has none", () => {
    const model = salesInvoiceAdapter.normalize(bundle({}, { ...baseCompany, logoUrl: undefined }));
    expect(model.company.logoUrl).toBeUndefined();
  });

  it("carries a logo URL through when the company has one", () => {
    const model = salesInvoiceAdapter.normalize(bundle({}, { ...baseCompany, logoUrl: "http://example.test/files/logo.png" }));
    expect(model.company.logoUrl).toBe("http://example.test/files/logo.png");
  });
});
