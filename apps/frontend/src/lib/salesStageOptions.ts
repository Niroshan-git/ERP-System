/**
 * `Sales Stage` is a flat reference master (`stage_name` only, live-verified via
 * `get_doctype_fields`) — ERPNext's own schema encodes no order/sequence field
 * (`docs/backend/16-crm/crm-architecture.md` §12). This app needs a fixed client-side
 * ordering for the Opportunity form's stage dropdown and list filter, and `CRM-4`'s pipeline
 * board columns — hardcoded here rather than fetched via `fetchLinkOptions` (which sorts
 * alphabetically and would scramble a real pipeline sequence).
 *
 * Live-verified (`CRM-2` package, 2026-09-24, `list_documents("Sales Stage")` against the
 * real instance): exactly these 8 records exist, in this order — the standard ERPNext CRM
 * default seed data, a real sales-funnel progression (Prospecting through
 * Negotiation/Review). If a future session adds/removes/reorders `Sales Stage` records in
 * ERPNext itself, this list needs a matching manual update — there is no live source of
 * truth for order to read from instead.
 */
export const SALES_STAGE_OPTIONS = [
  "Prospecting",
  "Qualification",
  "Needs Analysis",
  "Value Proposition",
  "Identifying Decision Makers",
  "Perception Analysis",
  "Proposal/Price Quote",
  "Negotiation/Review",
];
