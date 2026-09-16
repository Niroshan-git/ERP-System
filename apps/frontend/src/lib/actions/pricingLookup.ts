"use server";

import { callMethodWithResult } from "@/lib/erpnext";

export type PricingContext = {
  parentDoctype: "Quotation" | "Sales Order" | "Sales Invoice";
  childDoctype: "Quotation Item" | "Sales Order Item" | "Sales Invoice Item";
  customer?: string;
  company?: string;
  currency?: string;
  priceList?: string;
  transactionDate?: string;
};

export type PricingResolution = {
  /** Base rate a Pricing Rule of type "Rate" overrides to — otherwise just echoes the
   * Item.standard_rate base already resolved by getItemLineDefaults. */
  price_list_rate: number;
  discount_percentage: number;
  discount_amount: number;
  /** JSON array string of applied Pricing Rule names — ERPNext's own stored shape for the
   * child table's `pricing_rules` field (Small Text). Empty string when nothing applied. */
  pricing_rules: string;
  /** Effective rate after discount, computed the same way ERPNext's own
   * `calculate_item_rate` (erpnext/controllers/taxes_and_totals.py) does — shown to the user
   * as a preview; ERPNext itself recomputes the authoritative value from the fields above
   * when the document is actually saved. */
  rate: number;
} | null;

type PricingRuleApiItem = {
  price_list_rate?: number;
  discount_percentage?: number;
  discount_amount?: number;
  pricing_rules?: string;
  has_pricing_rule?: number;
};

/**
 * Calls ERPNext's own real pricing-rule-resolution endpoint —
 * `erpnext.accounts.doctype.pricing_rule.pricing_rule.apply_pricing_rule` — the exact
 * whitelisted method this app's job is to trust rather than reimplement (confirmed by
 * reading `pricing_rule.py` and Desk's own `erpnext/public/js/controllers/transaction.js`
 * `_get_args()`/`_get_item_list()` on the live server for the real payload shape). Called
 * from LineItemsEditor whenever a line's item/qty or the document's customer changes.
 *
 * Deliberately narrower than Desk's own full context:
 * - No `doc` param (the whole in-progress transaction document) — only needed for
 *   condition-based Pricing Rules (a raw Python `condition` expression evaluated against
 *   the full doc); flat Rate/Discount %/Discount Amount rules scoped by Item Code/Item
 *   Group/Brand + Customer/Customer Group/Territory + qty range (this app's supported
 *   scope) resolve correctly without it — confirmed by reading
 *   `get_pricing_rule_for_item`/`filter_pricing_rule_based_on_condition`.
 * - No `coupon_code`, no free-item/BOGO or multi-tier "Product Discount" handling
 *   (`price_or_product_discount == "Product"` rules) — out of scope, see PLAN.md Phase 4
 *   notes; only "Price" discount rules (Rate / Discount Percentage / Discount Amount) are
 *   applied here.
 * - `item_group`/`brand`/`customer_group`/`territory` are omitted on purpose —
 *   `update_args_for_pricing_rule` in pricing_rule.py resolves all four itself from the
 *   Item/Customer masters when missing, so this app doesn't need to look them up first.
 *
 * Returns null when no Pricing Rule applies (the common case — most items/customers won't
 * have one) or the call fails for any reason; callers fall back to the plain
 * Item.standard_rate the line already had.
 */
export async function resolvePricingForLine(
  itemCode: string,
  qty: number,
  priceListRate: number,
  context: PricingContext,
): Promise<PricingResolution> {
  if (!itemCode || qty <= 0) return null;

  try {
    const args = {
      items: [
        {
          doctype: context.childDoctype,
          item_code: itemCode,
          qty,
          stock_qty: qty,
          conversion_factor: 1,
          price_list_rate: priceListRate,
          discount_percentage: 0,
          discount_amount: 0,
          parenttype: context.parentDoctype,
        },
      ],
      customer: context.customer || undefined,
      currency: context.currency,
      conversion_rate: 1,
      price_list: context.priceList,
      price_list_currency: context.currency,
      plc_conversion_rate: 1,
      company: context.company,
      transaction_date: context.transactionDate,
      doctype: context.parentDoctype,
      ignore_pricing_rule: 0,
    };

    const result = await callMethodWithResult<PricingRuleApiItem[]>(
      "erpnext.accounts.doctype.pricing_rule.pricing_rule.apply_pricing_rule",
      { args },
    );
    const item = result?.[0];
    if (!item || !item.has_pricing_rule) return null;

    const resolvedPriceListRate = item.price_list_rate ?? priceListRate;
    const discountPercentage = item.discount_percentage ?? 0;
    // Mirrors erpnext/controllers/taxes_and_totals.py::calculate_item_rate exactly: a
    // Discount Percentage rule wins over a Discount Amount rule when both would somehow be
    // set (they never both come from the same rule in practice, but this stays faithful).
    const discountAmount =
      discountPercentage > 0 ? (resolvedPriceListRate * discountPercentage) / 100 : (item.discount_amount ?? 0);
    const rate = Math.max(0, resolvedPriceListRate - discountAmount);

    return {
      price_list_rate: resolvedPriceListRate,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      pricing_rules: item.pricing_rules ?? "",
      rate,
    };
  } catch {
    return null;
  }
}
