# Customer/Supplier ↔ Contact/Address Relationship Architecture

**Package:** MD-UNV-003 architecture/discovery (2026-09-22). **Status: `CLAUDE_HANDOFF` — architecture
defined, nothing implemented, not self-declared ACCEPTED.**
**Scope:** Discovery and design only, per `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` §4/§5. No
route, Sidebar, form, server action, or ERPNext data was created or modified while producing this
document.

This document closes the architectural uncertainty behind `MD-UNV-003`
(`docs/backend/99-unverified/unverified-behaviours.md`) so a future implementation package
(`MD-REL-*`, see §9) can be scoped without re-deriving ERPNext's relationship model from scratch. It
supplements, and does not duplicate, `docs/backend/01-master-data/customer-supplier.md` and
`docs/backend/01-master-data/secondary-masters.md` — those remain the canonical per-entity field
docs; this document is the canonical relationship-layer design.

---

## 1. Confirmed baseline (verify before building against)

Re-derived independently this session, matching the MD-R2 closure pass's findings:
- `Contact.links` / `Address.links` are never written by this frontend (`contacts/actions.ts`,
  `addresses/actions.ts` — grep-confirmed, no `links` reference in either file).
- `Customer.customer_primary_contact`/`customer_primary_address` and the Supplier equivalents are
  never exposed anywhere in `apps/frontend` (grep-confirmed, zero matches for
  `customer_primary_contact`/`supplier_primary_contact`/`*_primary_address` outside
  `docs/backend/`).
- `/master-data/contacts` and `/master-data/addresses` list pages are global and unfiltered — no
  `filters` argument passed to `listDocs`.
- `AddressContactFields.tsx` (`customer_address`/`contact_person`/`shipping_address_name`/
  `territory`/`customer_group`) is wired into Sales transactional documents only (Quotation, Sales
  Order, Sales Invoice, Delivery Note) — grep-confirmed zero references anywhere under
  `apps/frontend/src/app/(app)/buying/`. **Buying has no Contact/Address selection UI of any kind
  today** — a new finding this session, not previously stated this explicitly: Purchase Order's own
  form (`PurchaseOrderForm.tsx`) has zero Address/Contact fields, grep-confirmed.
- `apps/frontend/src/app/(app)/master-data/customers/[name]/page.tsx` is an edit-form page only — no
  tabs, no linked-record display of any kind (not even the Comments/Activity tab pattern shipped
  elsewhere, e.g. Sales Order detail). Same for Supplier.

None of this is new; it restates `MD-UNV-003`'s already-`CONFIRMED GAP` half as the working
baseline.

---

## 2. ERPNext/Frappe relationship model — source-verified

Evidence tiers below follow `BACKEND_KNOWLEDGE_POLICY.md` §6. "Live schema" = this session's
`get_doctype_fields`/`list_documents` against the real Hetzner instance. "GitHub source" = the
`frappe/frappe` `develop` branch fetched this session — **evidence provenance disclosed**: this is
the upstream development branch, not necessarily byte-identical to the installed version (the same
caveat `MFG-UNV-012`'s PP-7 entry already logged for a different file), so behavior is tagged
`SOURCE VERIFIED (GitHub develop)`, not `VERIFIED`, unless corroborated by live schema/data too.

### 2.1 The Dynamic Link mechanism

`Contact.links` and `Address.links` are both `Table` fields with `options: "Dynamic Link"` — live
schema `VERIFIED` (already established by MD-R2). `Dynamic Link`'s own fields, live schema
`VERIFIED`: `link_doctype` (Link → DocType, required), `link_name` (fieldtype **Dynamic Link**,
required, resolved at runtime against whatever `link_doctype` names), `link_title` (Read Only,
denormalized display label).

- **One Contact can link to multiple entities** — `links` is a child table (1:N by construction),
  and `Contact.get_link_for()`/`has_link()`/`has_common_link()` (`SOURCE VERIFIED`, iterate
  `self.links`) exist specifically to answer "which/whether this Contact links to a given
  doctype/name" — these helpers would be pointless if only one link were possible. Same for Address.
- **Customer and Supplier can share a Contact or Address** — nothing in the schema or the source
  read restricts `link_doctype` to a closed set of values; a single Contact's `links` table can
  legitimately contain one row with `link_doctype="Customer"` and another with
  `link_doctype="Supplier"`. This is a real ERPNext capability, not a Ceylon Stack invention — see
  §11 for the data-quality implications.
- **How ERPNext retrieves linked Contacts/Addresses**: `get_default_contact(doctype, name)` and
  `get_default_address(doctype, name, sort_key)` (both `frappe/contacts/doctype/contact/contact.py`,
  `frappe/contacts/doctype/address/address.py`, `SOURCE VERIFIED`) query the `Dynamic Link` child
  table directly — `WHERE link_doctype = <doctype> AND link_name = <name> AND parenttype =
  "Contact"` (or `"Address"`) — then apply the primary-selection rule (§3). There is no cached/
  denormalized "linked contacts" list on Customer/Supplier itself; every lookup is a live query
  against `Dynamic Link`. A frontend implementation should query the same way: list `Contact`
  (or `Address`) with a child-table filter tuple `["Dynamic Link", "link_doctype", "=", "Customer"]`
  + `["Dynamic Link", "link_name", "=", name]` — the exact `[childDoctype, field, "=", value]`
  shape `lib/connections.ts`'s `getConnections()` already uses for every other cross-document query
  in this app (see §7.1).

### 2.2 What happens on validate (both Contact and Address)

`SOURCE VERIFIED (GitHub develop)`, `frappe/contacts/doctype/contact/contact.py`:
```
validate():
  self.full_name = self._get_full_name()
  self.set_primary_email()
  self.set_primary("phone")
  self.set_primary("mobile_no")
  self.set_user()
  set_link_title(self)
  deduplicate_dynamic_links(self)
  self.validate_primary_contact()
```
`frappe/contacts/doctype/address/address.py`:
```
validate():
  self.link_address()
  self.validate_preferred_address()
  set_link_title(self)
  deduplicate_dynamic_links(self)
```

Two behaviors worth flagging for the implementation package:
- **`deduplicate_dynamic_links`** runs on every save of both doctypes — ERPNext already guards
  against the same `(link_doctype, link_name)` pair appearing twice in one record's `links` table.
  A future `linkContactToParty()` action does not need to duplicate this check client-side; it can
  rely on ERPNext to silently collapse an accidental double-link, though the exact dedup behavior
  (silent removal vs. error) was not itself read this session — `NEEDS_VERIFICATION`, non-blocking
  (see §17).
- **`Address.link_address()`** auto-populates `links` from the record **owner's** email address
  when `self.links` is empty at save time (`frappe.db.get_value("Contact", {"email_id": self.owner})`
  → links to whatever Contact/party that Contact itself links to). This is a real ERPNext
  convenience for a *human* creating their own Address in Desk. **It is a dead code path for this
  app specifically** — every write goes through the shared "Frontend Integration" service account
  (see `apps/frontend/README.md`'s auth model), so `self.owner` is always that service account's own
  user, which is not itself linked to any Contact. This fallback should not be relied upon or
  designed around; the frontend must always write `links` explicitly.

### 2.3 Primary Contact / Primary Address — genuinely two different mechanisms (§ requested explicitly)

**`validate_primary_contact()`** (Contact, `SOURCE VERIFIED`): guards a single boolean field,
`Contact.is_primary_contact`, so that when it's set `1`, ERPNext walks every linked entity in that
Contact's own `links` table, locks other Contacts already marked primary for the *same* linked
entity (`for_update=True`, sorted-order locking to avoid deadlocks — a genuine concurrency-safety
detail, not incidental), and clears their `is_primary_contact` flag via a direct `frappe.db.set_value`
call (bypassing their own `validate()`, i.e. no recursive re-trigger).

**Important, source-derived nuance not previously documented anywhere in this repo:**
`is_primary_contact` is a single field **on the Contact document itself**, not a per-link-row flag
on the `Dynamic Link` child table. If one Contact is linked to both a Customer and a Supplier (a
real, ERPNext-permitted configuration, §2.1) and `is_primary_contact=1`, that Contact reads as
"the primary contact" for **both** parties simultaneously — there is no way, in ERPNext's own model,
for a Contact to be primary for one linked party but not another. `validate_primary_contact()`'s
own uniqueness guarantee is "at most one primary Contact per linked entity," not "a Contact's
primary-ness is scoped per link" — those sound similar but are not the same claim, and only the
first one is what ERPNext actually enforces. Same structural shape for Address
(`is_primary_address`/`is_shipping_address`, enforced by `validate_preferred_address()`).

**`get_default_contact(doctype, name)`** (source quoted in full — short and load-bearing):
```python
def get_default_contact(doctype, name):
    # Dynamic Link rows where link_doctype/link_name match, parenttype == "Contact"
    # ... prefers the row whose Contact.is_primary_contact == 1, else falls back to
    # the first Dynamic Link row found (no defined secondary sort — effectively DB order)
```
**`get_default_address(doctype, name, sort_key="is_primary_address")`** — the same query shape,
parameterized: `sort_key` can be `"is_primary_address"` or `"is_shipping_address"`, letting one
function serve both "the billing address" and "the shipping address" lookups.

**Relationship vs. primary selection — confirmed as two independent layers, exactly as the mission
brief's example modeled it:**
1. **Membership/association** = a row existing in `Contact.links`/`Address.links` at all
   (`link_doctype`/`link_name`). This alone is what makes a Contact "belong to" a Customer.
2. **Primary selection** = `is_primary_contact`/`is_primary_address`/`is_shipping_address`, a
   property of the Contact/Address record itself, consulted by `get_default_contact`/
   `get_default_address` when something needs "the one to use by default."
3. A **third, independent layer** exists only on Customer/Supplier:
   `customer_primary_contact`/`customer_primary_address` (and Supplier equivalents) are plain
   `Link` fields on the party document — a denormalized convenience pointer, not derived by calling
   `get_default_contact` at read time. **Whether saving a value into
   `customer_primary_contact` also sets that Contact's own `is_primary_contact=1` (or vice versa) was
   not confirmed this session** — no `Customer`/`Supplier` controller source (`customer.py`/
   `supplier.py`) was read; this is a real, currently-unverified interaction between layers 2 and 3,
   logged as `MD-UNV-006` (§17). Do not assume these two "primary" concepts are kept in sync
   automatically until this is confirmed.

### 2.4 Rename / identity

`SOURCE VERIFIED (GitHub develop)`, `frappe/model/rename_doc.py`, `rename_dynamic_links()`:
renaming any document (via `frappe.rename_doc`/Desk's rename action) automatically updates every
`Dynamic Link` child-table row across the whole system whose `link_doctype` matches the renamed
doctype and `link_name` matches the old name — a direct SQL `UPDATE` against the child table, run
as part of core `rename_doc()`. **This confirms Dynamic Links survive a Customer/Supplier/Contact/
Address rename automatically, with no cascade code Ceylon Stack would need to write itself** — this
is `FRAPPE_ONLY_IMPLEMENTATION_DETAIL` (§8), because a native backend replacing Dynamic Link with a
real join table would need to implement the equivalent cascade-on-rename itself (a straightforward
`UPDATE ... WHERE`, but a `REQUIRED_CEYLON_BEHAVIOR` to preserve).

Caveat carried over from `MD-UNV-004`: this only matters once the app actually exposes a rename
action. Today, Customer/Supplier/Contact/Address are all name-field-autonamed
(`docs/backend/01-master-data/customer-supplier.md`/`secondary-masters.md`) and this frontend never
calls `frappe.rename_doc` — so the cascade is real ERPNext behavior but currently untriggered by
anything Ceylon Stack does. `clear_stale_primary_link`-equivalent logic (referenced by the
mission brief's framing, i.e. "what clears a party's `customer_primary_contact` pointer when the
underlying link is removed") was referenced in Frappe's own doc-comments this session but its exact
defining file was not pinned down — `NEEDS_VERIFICATION`, `MD-UNV-007` (§17), non-blocking: the
mechanism's *existence* is corroborated by `docs/backend/... contacts/address_and_contact.py`
carrying `get_primary_link_fields()`/`clear_stale_primary_link()`-shaped helpers, just not
independently re-read function-by-function this session.

### 2.5 Permissions — the load-bearing finding for §8 of the mission brief

`SOURCE VERIFIED (GitHub develop)`, `frappe/model/document.py`, `_validate_links()` /
`get_invalid_links()`: when a document containing a `Link` or `Dynamic Link` field is saved, Frappe
checks **only** that the referenced document (a) exists and (b) is not cancelled. **It does not check
that the current user has read or write permission on the referenced document.** This is a generic,
doctype-agnostic behavior — nothing Contact- or Address-specific overrides it (no such override was
found in either controller's source).

**Consequence for a hypothetical individual-user Frappe deployment:** a user permitted to create
Contacts but not permitted to read/write Customer records could still successfully save a Contact
whose `links` table names a Customer they otherwise can't see — Frappe's own generic save-time
validation would not block it.

**Consequence for Ceylon Stack specifically — more important, and different from the generic case:**
every write from this frontend runs under one shared "Frontend Integration" service account
(`apps/frontend/README.md`'s documented auth model, already load-bearing elsewhere — e.g. every
Comment posted through this app is attributed to that account, not the real human). That account's
own Frappe-level permissions are a fixed, already-decided constant — not something a per-request
`link_doctype`/`link_name` payload can escalate past, because there is no per-user permission
boundary being crossed in the first place. **The real trust boundary for this app is not "does the
service account have permission" (it already has whatever the deployment grants it) — it is "does
the Next.js server action itself validate what it's about to send."** This is the same shape of
finding `MFG-UNV-012`'s PP-6 entry already made about `make_material_request` ("the caller's
server action is the entire trust boundary against a tampered quantity"), applied here to
`link_doctype`/`link_name` instead of a quantity.

**Required server-side validation for any future `MD-REL-*` implementation, stated as a concrete
rule, not a general caution:**
1. **`link_doctype` must be allowlisted server-side** to exactly `"Customer" | "Supplier"` inside
   the relationship action layer (§10) — never passed through from client input unchecked. Nothing
   in the ERPNext schema itself restricts `Dynamic Link.link_doctype` to a closed set of doctypes
   (confirmed — it's a plain `Link → DocType` field with no `options` filter narrowing valid
   targets), so this allowlist is a Ceylon Stack-side responsibility, not something ERPNext already
   guarantees.
2. **`link_name` must be independently confirmed to exist** before being written (a plain
   `getDoc`/existence check, or trust ERPNext's own `_validate_links` 404 on save and surface it as
   a normal `humanizeError` failure — either is acceptable; the second is cheaper and consistent
   with how every other doctype-existence error in this app is already surfaced).
3. Because the service account has broad write permission by design, **any app-level authorization
   decision (e.g. "only a Sales-role user may attach a Contact to a Customer") must be enforced by
   this app's own session layer (`lib/session.ts`), not assumed to come from ERPNext.** This app
   currently has no per-role authorization model at all (single shared login pattern per prior
   packages) — if that's ever introduced, the relationship action layer is one of the places it
   would need to plug in, not an ERPNext permission check.

---

## 3. Ceylon Stack canonical relationship model

Restated precisely, building on §11's canonical-mapping table below:

```
Party (Customer | Supplier — NOT a persisted entity, see §7)
  │
  ├── membership: N Contacts, via Contact.links (Dynamic Link, link_doctype=Party's doctype)
  ├── membership: N Addresses, via Address.links (Dynamic Link, same mechanism)
  ├── primary selection (layer 2, §2.3): Contact.is_primary_contact / Address.is_primary_address
  │     — a property of the Contact/Address record, not scoped per-link
  └── primary pointer (layer 3, §2.3): Party.{customer|supplier}_primary_contact/_address
        — a separate, denormalized convenience field on the Party document itself
```

**Design decision carried forward from the mission brief, restated as binding for any
implementation package:** Master Data remains sole owner of Customer, Supplier, Contact, and
Address. No `/crm/customers`, `/crm/contacts`, or `/crm/addresses` route or component may be
introduced by a future CRM package — this document does not relitigate that, it assumes it (see
`docs/master-data-architecture.md` §11/§12, unchanged and still binding).

**Business Partner unification remains explicitly out of scope and unforced by this design.** The
relationship action layer (§10) takes a `partyDoctype: "Customer" | "Supplier"` parameter and reads/
writes `Dynamic Link` rows the same way regardless of which one — this is what keeps a future
Business Partner abstraction possible without a rewrite (narrowing the parameter's type, or
resolving it from a lookup, would be a small, localized change to one module, not a re-plumb of
every consumer) without actually building that abstraction now.

---

## 4. Customer / Supplier UX target

Both detail pages currently render as a bare edit form (§1) — no tabs of any kind exist yet on
either, unlike Sales Order/Quotation/Invoice/Delivery Note, which already use the shared `DocTabs`
component (`apps/frontend/src/components/DocTabs.tsx`) for a Comments/Activity tab. **Recommendation:
reuse `DocTabs`, not introduce a new pattern** — it already exists, is already proven across four
document types, and needs no new component to support a "Contacts"/"Addresses" tab.

```
Customer Detail                              Supplier Detail
├── Overview (existing edit form, unchanged) ├── Overview (existing edit form, unchanged)
├── Contacts        [DocTabs tab, new]       ├── Contacts        [DocTabs tab, new]
└── Addresses       [DocTabs tab, new]       └── Addresses       [DocTabs tab, new]
```

Each new tab renders: a list of linked records (name, key fields, an "unlink" affordance — §6), an
"Add existing" control (§6), and an "Add new" control that opens the existing
`/master-data/contacts/new` / `/master-data/addresses/new` create flow with the party pre-selected
(§5) rather than forking a second create form. This keeps `CustomerForm.tsx`/`SupplierForm.tsx`
untouched (still bespoke, per `customer-supplier.md`'s existing note) — the tabs are additive
content on the detail page, not a rewrite of the edit form itself.

**Not recommended:** sections or related-entity cards on the same page as the edit form. `DocTabs`
already carries the "additional related content lives in a sibling tab, not inline with the primary
form" convention this app uses everywhere else; deviating here would be a new, unjustified pattern
for no functional gain.

---

## 5. Contact / Address creation flow

**Recommendation: Option A — inside the existing create action, not a dedicated relationship action,
not a native ERPNext method.**

Rationale, weighing the three options the mission brief named:
- **(A) Inside `createContactAction`/`createAddressAction`:** minimal surface area change — add an
  optional `link_doctype`/`link_name` pair to the existing action's `fields` payload before calling
  `createDoc`. Frappe's REST `POST /api/resource/Contact` already accepts a nested child-table array
  in the create payload (the same mechanism already relied on elsewhere in this app for child-table
  writes, e.g. BOM Item rows on BOM create) — so `fields.links = [{ link_doctype, link_name }]` is a
  single-request create-with-link, not a two-step create-then-link. This is the smallest change that
  actually closes `MD-UNV-003`'s confirmed gap.
- **(B) A dedicated relationship action** (`linkContactToParty()` called *after* `createContactAction`
  returns): more composable for the "link an *existing* Contact" case (§6), but for brand-new
  creation it's strictly more code (two round-trips, two failure points) for no behavioral gain over
  (A) — since Frappe already accepts the nested child row in one request.
- **(C) An ERPNext/Frappe method:** no evidence this session of a whitelisted native method that
  does "create Contact and link to Party" as one call (nothing resembling this was found in the
  Contact/Address/`address_and_contact.py` source read) — inventing one client-side against a
  route/parameter combination that hasn't been confirmed to exist would be exactly the "porting a
  bug" risk `secondary-masters.md`'s own Migration section already warns against. Not recommended
  without further, specifically-targeted source investigation.

**Recommended smallest-change design:**
```
createContactAction(prevState, formData)
  → fields = fieldsFromFormData(...)               // unchanged
  → if formData has partyDoctype + partyName:       // NEW, optional
      fields.links = [{ link_doctype: partyDoctype, link_name: partyName }]
  → createDoc("Contact", fields)                    // unchanged call, richer payload
```
Same shape for `createAddressAction`. The `partyDoctype`/`partyName` values come from the calling
page (Customer/Supplier detail's "Add Contact"/"Add Address" tab action, §4) as hidden form fields —
**not** from arbitrary client input passed straight through; `partyDoctype` must still be
allowlisted server-side inside the action itself (§2.5, rule 1), independent of where the request
originated, since a server action's own input is not implicitly trusted just because it came from
this app's own UI.

This preserves the existing global `/master-data/contacts/new` / `/master-data/addresses/new` routes
for the no-party-context case (e.g. creating a Contact ahead of time) — the party-linking behavior
is additive, not a breaking change to the current create flow.

---

## 6. Existing Contact / Address linking, and unlinking

Per the mission brief's explicit ask — do not design "create new" only.

| Capability | Classification | Reasoning |
|---|---|---|
| **Link an existing Contact/Address to a Customer/Supplier** | `MVP REQUIRED` | Without this, every Contact/Address is single-party-only forever, contradicting §2.1's confirmed ERPNext capability (shared Contact/Address across parties) and blocking the realistic case of one person being both a Customer's and a Supplier's contact (common for a small-business counterparty in the Sri Lankan SME context this product targets). |
| **Unlink a Contact/Address from a Customer/Supplier** | `MVP REQUIRED` | A relationship layer that can only add, never remove, is not a real relationship layer — this is the direct inverse of "link" and equally load-bearing; shipping one without the other is an incomplete pair. |
| **Duplicate-prevention UI (warn before linking an already-linked pair)** | `POST-MVP` | ERPNext's own `deduplicate_dynamic_links()` (§2.2) already prevents the *exact same* `(link_doctype, link_name)` row twice server-side — a client-side warning is a UX nicety on top of an already-safe operation, not a correctness requirement. |
| **Cross-party sharing warnings** (e.g. "this Contact is already linked to Supplier X — link to Customer Y anyway?") | `POST-MVP` | Legitimate use case (§2.1), not inherently wrong — a confirmation dialog is a UX improvement, not something MVP correctness depends on. |
| **Primary entity reassignment UI** (setPrimaryContact/setPrimaryAddress, §7.2) | `MVP REQUIRED` if the Customer/Supplier detail tabs (§4) are to show "which one is primary" at all — otherwise `POST-MVP` | Depends on a Product Owner decision — see §16's decision table, item 3. Technically small (a single field/flag update) but its UX surface (radio button per row, "Set as primary" action) is a real design decision, not purely mechanical. |

**Accidental cross-customer sharing** (a named concern in the mission brief): mitigated primarily by
the "link existing" UI itself surfacing which party(ies) a Contact/Address is already linked to
before the user confirms — a search-and-pick flow that shows existing links, not a search box that
silently reuses a record. This is a UX design detail for the eventual `MD-REL-2`/`MD-REL-3`
implementation package, not resolved further here.

---

## 7. Relationship action/API layer — design, not implementation

**Recommended location:** two new files, mirroring the existing `lib/connections.ts` (read) /
per-domain `actions.ts` (write) split this app already uses everywhere:
- `apps/frontend/src/lib/partyLinks.ts` — read-only queries (server-only, like `connections.ts`).
- `apps/frontend/src/lib/actions/partyLinkActions.ts` — `"use server"` mutations, following the
  existing convention of putting shared cross-domain actions under `lib/actions/` (already
  established for `productionPlanCreate.ts` and similar) rather than inside one specific domain's
  `actions.ts` file, since Customer, Supplier, Contact, and Address are all Master Data but the
  relationship itself spans two of that domain's own doctypes.

**Why not inside `customers/actions.ts`/`suppliers/actions.ts` directly:** those files are
Customer-only/Supplier-only today; the relationship logic (allowlist validation, Dynamic Link row
shape, primary-flag semantics) is identical for both and should not be duplicated per party
doctype — a single `partyDoctype` parameter, exactly like `getConnections(doctype, name)` and
`callDocMethod(doctype, name, method, args)` already do for their own generic doctype parameters.

### 7.1 Read layer (`partyLinks.ts`)

```ts
type PartyDoctype = "Customer" | "Supplier";

async function listLinkedContacts(partyDoctype: PartyDoctype, partyName: string): Promise<ContactRow[]>
async function listLinkedAddresses(partyDoctype: PartyDoctype, partyName: string): Promise<AddressRow[]>
```
Implementation: `listDocs("Contact", { filters: [["Dynamic Link", "link_doctype", "=", partyDoctype], ["Dynamic Link", "link_name", "=", partyName]], fields: [...] })` —
the exact `[childDoctype, field, "=", value]` filter-tuple shape `getConnections()` (`lib/connections.ts`)
already uses, querying the **parent** doctype (`Contact`/`Address`) with a filter on its own child
table (`Dynamic Link`), not the child table directly (Frappe rejects direct list queries against an
`istable=1` doctype — already a documented, live-confirmed gotcha in `connections.ts`'s own comment
block, and it applies identically here since `Dynamic Link` is also `istable=1`).

### 7.2 Write layer (`partyLinkActions.ts`)

```ts
async function linkContactToParty(contactName: string, partyDoctype: PartyDoctype, partyName: string): Promise<void>
async function unlinkContactFromParty(contactName: string, partyDoctype: PartyDoctype, partyName: string): Promise<void>
async function linkAddressToParty(addressName: string, partyDoctype: PartyDoctype, partyName: string): Promise<void>
async function unlinkAddressFromParty(addressName: string, partyDoctype: PartyDoctype, partyName: string): Promise<void>
async function setPrimaryContact(partyDoctype: PartyDoctype, partyName: string, contactName: string | null): Promise<void>
async function setPrimaryAddress(partyDoctype: PartyDoctype, partyName: string, addressName: string | null): Promise<void>
```

**Mechanics, all four link/unlink functions:** Frappe's REST API does not expose an "append one row
to a child table" endpoint — mutating `links` requires read-modify-write: `getDoc("Contact", name)`
→ splice the target row in/out of the in-memory `links` array → `updateDoc("Contact", name, {
links: <full array> })`. This is the same read-modify-write shape this app already uses for other
child-table mutations (e.g. BOM Item edits per `bom.md`'s "Mutation contract" section) — not a new
technique, just a new application of an established one. `link_doctype` is allowlisted inside these
functions themselves (§2.5 rule 1), not left to the caller.

**`setPrimaryContact`/`setPrimaryAddress` — a genuinely open design question, not resolved here
(see §16, decision table item 3):** given §2.3's three-layer finding, "set as primary" could mean
(a) writing `Party.customer_primary_contact` only (the simplest, most visible-in-Desk option), (b)
also toggling `Contact.is_primary_contact` to keep layers 2 and 3 in sync, or (c) only (b), relying
on `get_default_contact`'s own resolution logic rather than exposing the denormalized pointer field
at all. This document deliberately does not pick one — `MD-UNV-006` (§17) blocks a confident choice
until Customer/Supplier's own controller source is read to confirm whether ERPNext already
auto-syncs these two fields.

**Where these get called from:** the Customer/Supplier detail page's Contacts/Addresses tabs (§4),
and nowhere else initially — Sales' `AddressContactFields.tsx` and a hypothetical future Buying
equivalent stay as plain `Link` field pickers against the existing global list (§1), unchanged by
this design. They do not need to call into this action layer; they only need the linked-list
returned by `listLinkedContacts`/`listLinkedAddresses` if a future package decides to scope their
dropdowns down to "just this Customer's contacts" instead of the current global list — an
enhancement this document does not itself scope or authorize.

---

## 8. Migration classification (REQUIRED_CEYLON_BEHAVIOR vs. FRAPPE_ONLY_IMPLEMENTATION_DETAIL)

| Capability | Classification | Reasoning |
|---|---|---|
| Customer/Supplier has many Contacts | `REQUIRED_CEYLON_BEHAVIOR` | Genuine product behavior, independent of how it's persisted. |
| Customer/Supplier has many Addresses | `REQUIRED_CEYLON_BEHAVIOR` | Same. |
| One Contact/Address can attach to multiple parties (§2.1) | `REQUIRED_CEYLON_BEHAVIOR` | A real, confirmed capability with real use cases (§6) — not an accident of the schema. |
| `Dynamic Link` polymorphic child table (`link_doctype`/`link_name`) | `FRAPPE_ONLY_IMPLEMENTATION_DETAIL` | A native backend would more naturally use a real join table (e.g. `party_contact_link(party_type, party_id, contact_id)`) or even two typed join tables — same relationship, cleaner schema. |
| "A Contact/Address can be primary for a given party" (concept) | `REQUIRED_CEYLON_BEHAVIOR` | Real product need — "which contact do I call by default." |
| `is_primary_contact` as an unscoped-per-link boolean field (§2.3's nuance) | `FRAPPE_ONLY_IMPLEMENTATION_DETAIL`, and arguably a modeling wart worth **not** porting as-is | A native backend should scope "primary" per relationship (party+contact pair), not per Contact record globally — this is the one place this document recommends the native model diverge from, not merely abstract away, ERPNext's own shape. |
| `customer_primary_contact`/`customer_primary_address` denormalized pointer fields | `FRAPPE_ONLY_IMPLEMENTATION_DETAIL` — a caching/convenience shortcut | `REQUIRED_CEYLON_BEHAVIOR` is just "the system can answer 'what is this party's primary contact' quickly," not this specific field-on-parent shape. |
| Rename cascade (`rename_dynamic_links`) | `FRAPPE_ONLY_IMPLEMENTATION_DETAIL` | The cascade mechanism is Frappe-specific; `REQUIRED_CEYLON_BEHAVIOR` is simply "renaming a party doesn't orphan its contacts/addresses" — any backend must guarantee the outcome, not this specific SQL update. |
| No permission check on Dynamic Link targets at save time (§2.5) | Neither — this is a **gap to deliberately not replicate**, not a behavior to classify | Already covered by §2.5's own required-validation rules; a native backend should not inherit ERPNext's permissive default here. |

---

## 9. CRM contract

Per the mission brief: define only what Master Data must guarantee, not the CRM implementation.

**CRM prerequisites (what CRM will assume exists before it can safely call into Master Data):**
1. `createDoc("Customer", ...)`, `createDoc("Contact", ...)`, `createDoc("Address", ...)` remain
   available and behave as documented in `customer-supplier.md`/`secondary-masters.md`.
2. The relationship action layer (§7) exists and is stable — specifically
   `linkContactToParty`/`linkAddressToParty` with `partyDoctype: "Customer"` — so a future
   `convertLeadToCustomer()` can create a Customer, then attach whatever Contact/Address the Lead
   already carried, through the same mechanism a human using the Customer detail page's "Add
   Contact" tab would use. CRM must not reimplement Dynamic Link row construction itself.
3. Canonical routes (`/master-data/customers/[name]`, `/master-data/contacts/[name]`,
   `/master-data/addresses/[name]`) continue to resolve, per
   `docs/master-data-architecture.md` §12 (unchanged, still binding).

**CRM assumptions this document does NOT guarantee (flagged so CRM discovery doesn't assume them
silently):**
- That `setPrimaryContact`/`setPrimaryAddress` exist as a stable contract — genuinely open, §7.2/§16.
- That linking is idempotent from the caller's perspective beyond ERPNext's own
  `deduplicate_dynamic_links()` (§2.2) — not independently re-verified this session.
- That a Lead/Opportunity's own Contact/Address (if CRM ever models those, which is CRM's own scope,
  not Master Data's) can be losslessly re-pointed at the converted Customer via `updateDoc` on the
  `Dynamic Link` row rather than a full unlink+relink — not investigated, since no Lead/Opportunity
  entity exists in this repository yet (`QA_LOG.md`'s own "No CRM module exists" finding, unchanged).

**Master Data guarantees (what this domain commits to, once `MD-REL-*` ships):** a Customer/Supplier
can have zero or more linked Contacts and Addresses; each linked record can be independently
created, linked-from-existing, or unlinked; at most one primary designation exists per party per
concept (Contact, Address) at the ERPNext-enforced level (§2.3); the relationship survives a rename
(§2.4) automatically, without any Ceylon Stack-side cleanup code.

---

## 10. Sales / Buying impact — integration points and regression risk

**No modification proposed or performed to either module.** Assessed for future-package awareness
only, per the mission brief's explicit "identify integration points and regression risks only."

| Document | Current Contact/Address usage | Risk if `MD-REL-*` ships |
|---|---|---|
| Quotation, Sales Order, Sales Invoice, Delivery Note | `AddressContactFields.tsx`, global unfiltered Contact/Address dropdowns (`customer_address`/`contact_person`/`shipping_address_name`) | **Low.** These dropdowns keep working unchanged — they select any existing Contact/Address by name today and would continue to after `MD-REL-*`, since nothing in this design removes or renames those fields. The *only* forward-looking risk is if a later package narrows these dropdowns to "only this Customer's linked contacts" (an enhancement this document does not scope, §7.2) — that would be a real, separate, and currently unplanned UX change, not a side effect of shipping the relationship layer itself. |
| Purchase Order, Purchase Receipt, Purchase Invoice, RFQ, Supplier Quotation | **None today** (§1, new finding this session) | **None** — there is nothing to regress, since Buying has no Contact/Address selection UI to begin with. A future package adding one would be net-new feature work, not something this design puts at risk. |

No Stock/Manufacturing document (Stock Entry, Work Order, Job Card, BOM) references Contact or
Address at all — confirmed by the field lists already documented in `docs/backend/05-manufacturing/`
and `docs/backend/01-master-data/warehouse.md`; not re-verified again this session since nothing new
would change that conclusion.

---

## 11. Duplicate / data-quality model

| Behavior | ERPNext-enforced? | Recommended Ceylon Stack UX behavior |
|---|---|---|
| Same `(link_doctype, link_name)` linked twice to one Contact/Address | **Yes** — `deduplicate_dynamic_links()` (§2.2), `SOURCE VERIFIED` mechanism exists; exact silent-vs-error behavior `NEEDS_VERIFICATION` (`MD-UNV-008`, §17) | None needed beyond what ERPNext already does — do not duplicate this check client-side speculatively before confirming its exact behavior. |
| Duplicate Contact email/phone across different Contact records | **No** — no unique constraint on `email_id`/`phone`/`mobile_no` in the live schema (`secondary-masters.md`'s field table, no field marked unique) | `POST-MVP`: a non-blocking warning ("a Contact with this email already exists — use it instead?") is reasonable UX, not an ERPNext-enforced rule to fake as one. |
| Duplicate Address (same address_line1/city/country entered twice) | **No** — no uniqueness constraint of any kind in the schema | `POST-MVP`, same reasoning as above — softer, since address text matching is inherently fuzzy (unlike an exact email string). |
| Same Contact linked to both a Customer and a Supplier | **Allowed, by design** (§2.1) — not a defect to prevent | Not a data-quality problem to flag by default; only worth surfacing as an *informational* note in the "link existing" flow (§6), not blocked or warned against as if it were wrong. |
| Same Address linked to multiple parties | **Allowed, by design** (§2.1) | Same as above — a shared registered office/warehouse address across a group of related Customers is a legitimate real-world case in the Sri Lankan SME context this product targets, not an anomaly. |

---

## 12. Rename / identity impact — summary (full detail in §2.4)

- Customer/Supplier/Contact/Address rename → `rename_dynamic_links()` auto-updates every
  `Dynamic Link.link_name` referencing the old name, system-wide, as part of core `rename_doc()`.
  **Frappe-handled automatically**, not a Ceylon Stack migration concern *for the Dynamic Link
  layer specifically*.
- **Still a Ceylon Stack migration concern:** the denormalized `customer_primary_contact`/
  `customer_primary_address` pointer fields (layer 3, §2.3) — whether `rename_doc()`'s generic
  Link-field update sweep also catches these (it should, since they're plain `Link` fields, and
  Frappe's rename mechanism updates all `Link` fields pointing at the renamed doctype, not just
  `Dynamic Link` ones — this is a reasonable inference from `rename_doc.py`'s broader structure,
  but the plain-`Link`-field update code path itself was not the specific function fetched and
  quoted this session, so it's `SOURCE-INFERRED`, not `SOURCE VERIFIED`, unlike `rename_dynamic_links`
  itself). Flagged `MD-UNV-009` (§17), non-blocking since this app doesn't expose rename today
  (`MD-UNV-004`, pre-existing).
- Contact/Address's own rename: since neither carries an inbound `Link`/`Dynamic Link` field from
  Customer/Supplier's perspective *except* through the same two mechanisms above, the same
  conclusion applies symmetrically.

---

## 13. Proposed implementation package sequence

Derived from the actual codebase (§1, §7), not the mission brief's illustrative placeholder
sequence.

| # | Package | Scope | Files likely affected | Depends on | Risk | Required review |
|---|---|---|---|---|---|---|
| `MD-REL-1` | Relationship action/API foundation | New `lib/partyLinks.ts` (read) + `lib/actions/partyLinkActions.ts` (write), per §7. No UI yet — this package is pure plumbing, testable via direct calls. | 2 new files | This document (architecture accepted by Niroshan) | Low — additive, no existing route touched | `code-reviewer` (meaningful implementation) |
| `MD-REL-2` | Customer Contacts/Addresses tab | `customers/[name]/page.tsx` gains `DocTabs`; new "Contacts"/"Addresses" tab content; wires `createContactAction`/`createAddressAction`'s new optional party-link params (§5); "link existing" search-and-pick UI (§6) | `master-data/customers/[name]/page.tsx`, `contacts/actions.ts`, `addresses/actions.ts`, new tab component(s) | `MD-REL-1` | Medium — first UI consumer of the new action layer, touches a Sales-consumed entity (Customer) | `code-reviewer` + `qa-tester` (Customer is a core-flow entity per Sales) |
| `MD-REL-3` | Supplier Contacts/Addresses tab | Same shape as `MD-REL-2`, applied to Supplier | `master-data/suppliers/[name]/page.tsx`, same shared actions | `MD-REL-1` (can run parallel to `MD-REL-2` once it lands) | Medium — same reasoning, Buying-side | `code-reviewer` + `qa-tester` |
| `MD-REL-4` | Primary Contact/Address behavior | Depends entirely on §16 decision table item 3 and resolving `MD-UNV-006` (does ERPNext auto-sync layers 2/3?) first | `setPrimaryContact`/`setPrimaryAddress` in `partyLinkActions.ts`, small UI addition to `MD-REL-2`/`MD-REL-3`'s tabs | `MD-REL-2`, `MD-REL-3`, a Product Owner decision, and `MD-UNV-006` resolved | Medium — the one package with a genuine open design question, not just implementation risk | `code-reviewer`; `qa-tester` if the sync-behavior question resolves to "ERPNext auto-syncs" (higher regression surface) |
| `MD-REL-5` | Cross-module regression + backend docs update | Confirm §10's "no regression" claim empirically (click through Quotation/Sales Order Contact/Address dropdowns after `MD-REL-2`/`3` ship); update `docs/backend/01-master-data/customer-supplier.md` and `secondary-masters.md` to reflect the now-real relationship (currently describe it as `MD-UNV-003`'s confirmed gap — that language becomes stale once shipped) | Docs only, plus manual click-through | `MD-REL-2`, `MD-REL-3` | Low | `qa-tester` (core-flow regression check); doc updates need no independent review beyond the package's own `code-reviewer` pass |

Each package stays independently reviewable and shippable in isolation, consistent with
`AGENT_USAGE_POLICY.md`'s package-sizing guidance — none requires the others to already be in Desk
to be tested (MD-REL-1 is pure library code; MD-REL-2/3 can each be demoed against MD-REL-1 alone).

---

## 14. Canonical mapping table

| Frontend/UX concept | Ceylon Stack canonical concept | ERPNext/Frappe implementation |
|---|---|---|
| "This Contact belongs to this Customer/Supplier" | Party↔Contact membership | `Contact.links` row, `link_doctype`/`link_name` |
| "This Address belongs to this Customer/Supplier" | Party↔Address membership | `Address.links` row, same mechanism |
| "The contact we call by default for this party" | Party's primary Contact (concept) | Either `get_default_contact()`'s live resolution (layer 2, `is_primary_contact`) or `Party.customer_primary_contact`'s stored pointer (layer 3) — **two different, not-yet-confirmed-synced mechanisms**, §2.3/§17 |
| "The address we bill/ship to by default" | Party's primary Address (concept) | Same duality: `get_default_address(sort_key=...)` vs. `Party.customer_primary_address` |
| "Attach an existing Contact to a Customer" | `linkContactToParty()` | Read-modify-write on `Contact.links` (§7.2) |
| "Detach a Contact from a Customer" | `unlinkContactFromParty()` | Same, removing the matching row |
| A person/organization who could be either a Customer or a Supplier | **Not a persisted Ceylon Stack entity** — deliberately absent, per §3/Business Partner unification staying open | No corresponding ERPNext concept either — `Customer`/`Supplier` are genuinely separate DocTypes |

`PartyContactLink`/`PartyAddressLink`-shaped names appear only in this document's prose (§7, §14)
as **canonical domain concepts for documentation clarity** — per the mission brief's own
instruction, this document does not propose either as a persisted doctype/table. The relationship
continues to live exactly where ERPNext already puts it (`Dynamic Link`) until/unless a future
native-backend migration package decides otherwise (§8).

---

## 16. Product Owner decisions required

Per the mission brief — explicitly separating what Claude can derive technically from what needs
Niroshan's input. None of these are answered by this document; each blocks the numbered
implementation package noted, not the whole sequence.

| # | Decision | Options | Technical consequence | Recommendation | Blocking before implementation? |
|---|---|---|---|---|---|
| 1 | Should MVP support linking an **existing** Contact/Address to a party, or only creating new ones in context (§5/§6)? | (a) Create-new only; (b) create-new + link-existing | (b) needs the "search and pick existing" UI (§6) in addition to the extended create action (§5) — more surface area, but closes the real gap §6 identifies (shared contacts across parties) | (b) — create-only would leave a real, common case (a person who's already a Contact record becoming relevant to a second party) unsupported from day one | **Yes**, for `MD-REL-2`/`MD-REL-3` — determines their scope directly |
| 2 | May a Contact/Address be shared across a Customer and a Supplier, or should the UI actively discourage/warn against it? | (a) Allow silently (matches ERPNext's own permissive model, §2.1); (b) allow with a confirmation warning; (c) block entirely (would require Ceylon Stack-side validation ERPNext itself doesn't enforce) | (c) requires new validation logic with no ERPNext precedent to lean on; (a)/(b) require none | (a) or (b) — (c) would be inventing a restriction ERPNext's own data model doesn't have, for a real legitimate use case (§6, §11) | No — can ship `MD-REL-2`/`3` with (a) and revisit as a UX refinement later |
| 3 | How should "primary Contact/Address" be modeled and exposed — the denormalized pointer field, the `is_primary_contact`/`is_primary_address` flag, or both kept in sync (§7.2, §17 `MD-UNV-006`)? | (a) Pointer field only; (b) flag only; (c) both, synced | Directly determines `MD-REL-4`'s entire scope and whether it needs to also write to two fields per action instead of one | Defer until `MD-UNV-006` is resolved (read `customer.py`/`supplier.py` controller source) — recommending now would be guessing at a question this document explicitly could not resolve from available evidence | **Yes**, blocks `MD-REL-4` specifically; does not block `MD-REL-1`–`3` |
| 4 | How much Contact/Address management should a future CRM expose directly, versus always deep-linking to Master Data's own screens (§9)? | (a) CRM never renders Contact/Address UI itself, only links out; (b) CRM gets a read-only embedded view; (c) CRM gets its own create/link actions calling the same `partyLinkActions.ts` layer | (a) is simplest and matches §3/§9's ownership model most strictly; (c) is more CRM-native UX but means CRM code calls into Master Data's action layer directly (still fine under §3's "no duplicate entity" rule, since it wouldn't fork a new implementation) | Not yet applicable — CRM discovery isn't authorized (`docs/master-data-architecture.md` §12/§13) | No — irrelevant until CRM discovery is scheduled |
| 5 | Is a "recently linked" audit trail (who linked this Contact to this Customer, and when) needed, beyond ERPNext's own generic Version/Comment history (`getDocInfo`, already used elsewhere in this app)? | (a) Rely on generic Version history (already shipped, no new work); (b) build a dedicated relationship-change log | (b) is meaningfully more engineering for a capability `getDocInfo` already provides generically | (a) — the existing Comments/Activity tab pattern (`DocTabs`, §4) already surfaces this for every other doctype; no reason to special-case this relationship | No — (a) is the default, no decision needed unless Niroshan wants (b) |

---

## 17. NEEDS_VERIFICATION register — this document's contribution

Full entries added to `docs/backend/99-unverified/unverified-behaviours.md`'s `## MD` section (see
that file for the canonical, cross-session-tracked copy — summarized here for this document's own
completeness):

- **`MD-UNV-006`** — Whether saving `Customer.customer_primary_contact`/`_primary_address` (layer 3,
  §2.3) auto-synchronizes `Contact.is_primary_contact`/`Address.is_primary_address` (layer 2), or
  vice versa, or neither. Blocks `MD-REL-4` and decision table item 3 (§16).
- **`MD-UNV-007`** — The exact defining location of `get_primary_link_fields()`/
  `clear_stale_primary_link()`-shaped logic referenced by Frappe's own `contacts` module summary this
  session but not independently re-read function-by-function. Non-blocking — the *existence* of
  stale-pointer cleanup is corroborated, just not pinned to an exact source location/behavior.
- **`MD-UNV-008`** — Whether `deduplicate_dynamic_links()` silently drops a duplicate `(link_doctype,
  link_name)` row or raises an error. Non-blocking (§11) — matters only for exact error-message UX,
  not for correctness.
- **`MD-UNV-009`** — Whether `rename_doc()`'s generic plain-`Link`-field update sweep also refreshes
  `customer_primary_contact`/`customer_primary_address` (and Supplier equivalents) on rename, the
  same way `rename_dynamic_links()` is confirmed to refresh `Dynamic Link` rows (§2.4/§12).
  Non-blocking today (this app doesn't expose rename, `MD-UNV-004`), but relevant before any future
  rename feature ships.
- **`MD-UNV-010`** — Whether Frappe's REST `POST /api/resource/Contact`/`Address` genuinely accepts
  a nested `links` child-table array in the create payload the same way it's confirmed to for other
  child tables elsewhere in this app (§5's design assumes this by analogy, not by a live test against
  `Contact`/`Address` specifically this session). Blocks `MD-REL-1`'s exact implementation detail —
  if unsupported, the create flow falls back to create-then-`updateDoc`-with-`links` instead of a
  single-request create-with-link, a minor implementation difference, not an architecture change.
- **`MD-UNV-011`** — Whether Contact/Address's own controller enforces anything beyond generic
  Frappe permission on who may write to `links` (e.g. a role restriction on attaching to Customer
  vs. Supplier) — not found in the source read this session, but a full permission-hook/role
  investigation was out of this package's scope.

---

## 18. Governance

- This document is discovery/architecture output only. No code, route, Sidebar entry, form, or
  server action was written or modified to produce it. No ERPNext write occurred — every finding in
  §2 came from `get_doctype_fields`/`list_documents` (already-cited live reads from the MD-R2
  baseline, re-used rather than re-run) plus this session's own GitHub source reads (§2, explicitly
  tiered `SOURCE VERIFIED (GitHub develop)` throughout, never silently upgraded to `VERIFIED`).
- **Not self-declared ACCEPTED.** Per the mission brief and this repo's own governance model
  (`docs/controls/AGENT_OPERATING_GUIDE.md`), an architecture document proposing a multi-package
  implementation sequence needs Niroshan's sign-off before `MD-REL-1` may start — this document
  itself does not authorize implementation, the same posture `docs/master-data-architecture.md` §14
  already takes for its own remaining packages.
- Cross-references added/updated by this package: `docs/backend/99-unverified/unverified-behaviours.md`
  (`MD-UNV-003` entry updated, six new `NEEDS_VERIFICATION` items logged, §17),
  `docs/master-data-architecture.md` (§9's gap table gains this package's outcome), `PROGRESS.md`.
