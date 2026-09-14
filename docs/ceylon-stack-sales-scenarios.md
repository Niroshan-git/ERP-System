# Ceylon Stack — Sales Module: Full Scenario Capture

Backend is ERPNext, so final behavior is bounded by what Frappe's Sales doctypes actually support — flagged below wherever a scenario needs a custom Server Script/app extension rather than being native.

---

## 1. Document Flow (all four systems, same skeleton)

```
Lead/Opportunity → Quotation → Sales Order → Delivery/Shipment → Sales Invoice → Payment
```

| System | Flow name |
|---|---|
| ERPNext | Lead → Opportunity → Quotation → Sales Order → Delivery Note → Sales Invoice → Payment Entry |
| SAP B1 | Sales Opportunity → Sales Quotation → Sales Order → Delivery → A/R Invoice → Incoming Payment |
| Acumatica | Opportunity → Quote → Sales Order → Shipment → Invoice → Payment |
| Dynamics 365 | Lead → Opportunity → Quote → Sales Order → Packing Slip → Sales Invoice → Payment |

Each document "pulls forward" data from the one before it (Copy From / Make From) — this pull-forward pattern is universal and is what your generic renderer's "Create" button needs to replicate for every doctype pair.

---

## 2. Quotation Scenarios

| Scenario | ERPNext | SAP B1 | Acumatica | Dynamics 365 |
|---|---|---|---|---|
| Multiple quotations to same customer/lead | Supported — each is independent, no forced link between them | Same — independent quotations, can compare manually | Same | Same |
| Compare quotations before deciding | **Not native on the sales side** — ERPNext's comparison tool exists for *purchase*-side (Supplier Quotation Comparison, v15.59+) but not for sales quotations. Would need a custom report/screen. | No built-in side-by-side sales quotation comparator either — manual review | No built-in comparator | No built-in comparator |
| Quotation revision (price/terms change) | Cancel + amend, or duplicate as new revision — no formal "revision number" field by default | Quotation can be edited pre-close; SAP tracks via document status, not versioning | Similar — edit while status is open | Similar |
| Quotation expiry | `Valid Till` field; expired quotations flagged, not auto-closed | `Valid Until` field | Expiration date field | Quote expiration date |
| Multiple SOs from one Quotation (partial acceptance) | Supported — Sales Order can be made against selected line items only | Supported — SO can draw partial line items from Quotation | Supported | Supported |
| One SO from multiple Quotations | **Not native** — an ERPNext Sales Order links to a single source Quotation by default | SAP: "a sales order can be based on **one or more** sales quotations" — natively supported | Not a standard single-click flow — manual consolidation | Not standard |
| Lost quotation tracking | "Set as Lost" with Lost Reason | Closed manually, no dedicated lost-reason taxonomy by default | Lost reason codes on Opportunity, less so on Quote | Lost reason on Opportunity |

**Design implication**: multi-quotation comparison and multi-quotation-to-one-SO are the two gaps ERPNext doesn't cover natively but SAP B1 does. If your client scenario (comparison, consolidation) is a real requirement, this becomes a custom Frappe DocType/report — not just a frontend screen, since the backend logic doesn't exist yet either.

---

## 3. Sales Order Scenarios

| Scenario | ERPNext | SAP B1 | Acumatica | Dynamics 365 |
|---|---|---|---|---|
| Partial delivery | Supported — Delivery Note can be made for selected items/qty | Supported | Supported, tracks partial ship balance explicitly | Supported |
| Backorder management | Manual — no formal "backorder" doctype, tracked via remaining qty on SO | Manual tracking | **Native backorder tracking** — explicit remaining-balance and backorder flow | Supported via inventory reservation |
| Blanket/framework orders | **Not native** — would need custom doctype or repeat SOs | Not a distinct formal doctype either — recurring orders workaround | **Native Blanket Order type** with expiration date, release-to-child-order function | Supported via Sales agreements |
| Multi-warehouse fulfillment / split shipment | Supported via multiple Delivery Notes per warehouse | Supported | **Native** — auto-splits by warehouse availability/cost | Supported via warehouse allocation |
| Drop-ship (vendor ships direct to customer) | Supported via Purchase Order linked to Sales Order | Supported — PO can be created directly from SO | **Native drop-ship + intercompany drop-ship** | Supported |
| Credit limit check before order confirmation | Basic credit limit field on Customer, warning only | Configurable — can block or warn | Native credit limit verification before release | **Most mature** — full Credit Management module: blocking rules, hold list, override workflow, checkout/check-in for review |
| Order hold (non-credit reasons: customer service, data issue) | Not native — would need custom workflow state | Not native as a distinct hold type | Order can be held via order type/status | **Native "Order Holds"** with hold codes, checkout system so only one reviewer edits at a time |
| Sales Persons / commission split | Multiple Sales Persons + % contribution supported | Sales Employee (single) + commission | Sales rep + commission | Similar |

**Design implication**: credit holds and blanket orders are Dynamics/Acumatica strengths ERPNext lacks natively. If your client base needs formal credit-hold workflows, that's a meaningful custom build on the Frappe side, not just UI.

---

## 4. Discount Logic

| Scenario | ERPNext | SAP B1 | Acumatica | Dynamics 365 |
|---|---|---|---|---|
| Line-item discount (%) | Supported per row | Supported per row | Supported per row | Supported per row |
| Document-level discount | Supported (additional discount %, or amount) | Supported (Discount % field on document header) | Supported | Supported |
| Customer-specific pricing | Pricing Rule doctype — per customer, per item, or customer group | Special Prices per Business Partner | Customer-specific price classes | Trade agreements per customer |
| Quantity/volume-based discount | Pricing Rule with qty slabs | Volume discount via Special Prices/Period Discounts | **Native quantity-based discount tiers** | Trade agreements with qty breaks |
| Promotional/campaign pricing | Pricing Rule with date range | Period and Volume Discounts by date | Promotional pricing, can exclude from stacking with volume discounts | Trade agreements with date validity |
| Discount recalculation on partial shipment/invoice | Not a distinct toggle — recalculates based on line qty naturally | N/A (SAP ties discount to order qty, delivery doesn't reprice) | **Explicit toggle**: "Recalculate Discount on Partial Shipments" at Order Type level — because otherwise discount tied to original qty can misapply on partial invoice | Handled via trade agreement re-evaluation |
| Discount stacking rules (can multiple discounts combine?) | Pricing Rule priority + "apply only if no other rule" flags | Priority-based, generally one discount type applies | Explicit "Skip Document Discounts" flag per discount code to control stacking | Configurable via trade agreement priority |

**Design implication**: Acumatica's explicit handling of discount recalculation on partial shipment is the most mature of the four — worth replicating as an explicit setting rather than assuming ERPNext's default behavior is always correct for partial scenarios.

---

## 5. Cancellation & Amendment Logic

This is the part most ERP consultants underestimate — "can I cancel this?" always depends on whether a target document already exists.

| Scenario | ERPNext | SAP B1 | Acumatica | Dynamics 365 |
|---|---|---|---|---|
| Cancel document with no target/child docs yet | Fully cancellable — status → Cancelled | Fully cancellable while "Open" | Cancellable while not yet processed | Cancellable |
| Cancel a Sales Order that already has a Delivery Note/Invoice | **Blocked** — must cancel child (Delivery Note/Invoice) first, then the parent | **Blocked** — same rule: "if you didn't copy your sales order to a higher-level document, SAP allows cancelling it"; otherwise cancel child docs first | Blocked until dependent shipments/invoices are reversed | Blocked/requires reversing dependent transactions |
| What happens to the base document on cancellation | ERPNext keeps the base doc (e.g., Quotation) untouched/still valid for re-use | **"Base documents are re-opened after cancellation"** — explicit SAP behavior: cancelling a child re-opens the parent for reprocessing | Base document balance is restored/reopened | Similar re-open behavior |
| Closed vs Cancelled (distinct states) | ERPNext has both: "Closed" (voluntarily stopped, no more processing) and "Cancelled" (voided) | SAP has both: "Closed" (manual, no other doc linked) and "Cancelled" | Similar closed/voided distinction | Similar |
| Amend a cancelled document | ERPNext: "Amend" creates a new linked version of a cancelled doc, preserving history/numbering | Not amend-in-place; SAP re-opens base doc instead so you redo forward | Not amend-in-place | Not amend-in-place |
| Full document audit trail across the chain | Frappe's "Connections" / linked documents view | **SAP's Relationship Map** — visual drill-down across the entire document chain, including journal entries | Document relationship inquiry screens | Document history/trace |

**Design implication**: this is the single most important rule to enforce correctly in your frontend — **a document can only be cancelled if nothing downstream references it**, and cancelling should always ask "is there a linked Delivery/Invoice?" before allowing the action, matching the base-document-reopens behavior SAP makes explicit. Your generic renderer's cancel action needs this dependency check baked in as a rule, not left to chance.

---

## 6. Returns / Credit Notes

| Scenario | ERPNext | SAP B1 | Acumatica | Dynamics 365 |
|---|---|---|---|---|
| Customer return against a delivered/invoiced order | Sales Invoice → Credit Note (return) | A/R Credit Memo, drawn from Delivery/Invoice | **RMA with reason codes**, processed as credit or replacement | Return order, credit or replacement |
| Reason code tracking on return | Not native — free-text remarks only | Not a dedicated reason-code field by default | **Native reason codes per return line** | Return reason codes supported |

---

## 7. What This Means for Ceylon Stack's Sales Screens (Phase 1 build)

Given ERPNext is your actual backend, prioritize replicating what's **native today**, and treat these as explicit backlog items requiring backend (Frappe) work, not just frontend:

**Native — build directly against existing ERPNext data model:**
- Quotation (multi, independent), expiry, lost tracking
- Quotation → partial-item Sales Order
- Sales Order → partial Delivery/Invoice
- Line and document-level discounts via Pricing Rule
- Cancel-blocked-by-child-document logic (Frappe already enforces this — your frontend just needs to surface *why* a cancel is blocked, listing the linked document)
- Amend-after-cancel flow

**Gaps — decide now whether these matter for your target clients, since they need custom Frappe doctypes/logic before any frontend screen can support them:**
- Side-by-side sales quotation comparison (not just purchase-side)
- One Sales Order sourced from multiple Quotations
- Formal Blanket/framework Sales Orders with release-to-child-order
- Formal credit-hold workflow (hold list, checkout/review, override) — ERPNext only has a basic credit limit warning today
- RMA-style returns with structured reason codes

I'd suggest scoping Phase 1 to the "Native" list only, and flagging the "Gaps" list as a Phase 2 decision once you see whether real client demos actually ask for them — building custom backend logic for scenarios no one's requested yet is exactly the scope-creep risk we flagged earlier in the architecture plan.
