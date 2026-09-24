# Sales cancellation preflight integration (2026-09-24)

Scope: the existing Quotation and Sales Order cancellation actions. This note records
integration of previously uncommitted work, not a new lifecycle or release acceptance.

- `cancelQuotationAction` checks every returned connection with nonempty `submittedDocs`.
  Its current connection configuration contains Sales Order.
- `cancelSalesOrderAction` applies the same check to Sales Invoice, Delivery Note, Pick List,
  Material Request and Purchase Order connections, instead of checking Sales Invoice only.
- The error names all returned submitted blockers. Draft or cancelled connections do not
  block through this preflight. No cascading cancellation occurs.
- With no returned blocker, both actions still call native `cancelDoc`. ERPNext remains
  authoritative for permissions, lifecycle, downstream links and reversal effects.
- `getConnections` omits failed queries and caps each query at 500 rows. This is an advisory
  preview, not proof that cancellation is permitted. Native rejection is still surfaced.

Canonical behavior `SALES-CANCEL-PREFLIGHT-001`: show known submitted downstream references
before invoking native cancellation; never treat the preview as authorization or implement
stock/accounting reversal in the frontend. No entity, field mapping or master data is added.

Evidence: code inspection and six offline mocked action scenarios (three per action):
draft-only connections reach native cancel, multiple submitted blockers prevent cancel and
appear in the error, and backend rejection returns an error. Targeted ESLint and isolated
TypeScript validation passed. Live permission/link/lifecycle and stock/accounting reversal
tests were NOT RUN in this integration session; no production data was mutated.

The separate pending Sales Invoice guard is excluded: its Payment Entry reference lookup
must also constrain `reference_doctype`, not only `reference_name`, before it is used as a
cancellation blocker. Sales Returns UI is also excluded from this change.
