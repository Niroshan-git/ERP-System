# Backend Architecture — Canonical Model & Migration Strategy

Reference doc for `docs/backend/` as a whole. See `docs/controls/BACKEND_KNOWLEDGE_POLICY.md` for
the binding policy this implements; see root `docs/architecture.md` for the *deployment/runtime*
layered architecture (shop floor → MES → ERPNext core → analytics) — a different, complementary
diagram from the one below, which is about data/behavior modeling, not process topology.

## The layer stack this folder documents

```
Frontend (apps/frontend Next.js screens/components)
    ↓
Ceylon Stack Canonical Model      (docs/backend/<domain>/ — entity.field, our own vocabulary)
    ↓
Current Frappe / ERPNext Mapping  (DocType.field, current implementation detail)
    ↓
Business Behaviour                (validations, calculations, defaults)
    ↓
Relationships                     (docs/backend/11-relationships/master-erd.md)
    ↓
Workflow                          (Create/Save/Submit/Cancel/Amend lifecycle)
    ↓
Stock Impact                      (quantity movement, warehouse, valuation)
    ↓
Accounting Impact                 (GL entries, debit/credit account roles)
    ↓
Tax Impact
    ↓
API Behaviour                     (canonical contract vs. current Frappe REST payload)
    ↓
Permissions / Errors
    ↓
ERPNext Source Reference          (DocType, controller, hook, method)
    ↓
Behavioral Tests                  (docs/backend/13-tests/)
    ↓
Future Native Backend
```

## Two backends, one product

- **ERPNext/Frappe is currently our reference backend and operational ERP engine.** It runs the
  real business logic today (validation, GL posting, stock ledger, workflow) and every domain
  document in this folder is a behavioral spec *of* Frappe's current behavior, not of a system
  we've built ourselves.
- **Ceylon Stack canonical models and business contracts are our long-term product architecture.**
  The canonical entity/field names used throughout `docs/backend/` are Ceylon Stack's own
  vocabulary — Frappe is one current implementation of that vocabulary, not its definition.
- **We are documenting the behavior necessary to eventually replace Frappe progressively with the
  Ceylon Stack native backend**, module by module, without redesigning the frontend or the
  canonical API contract it talks to.

## Canonical mapping standard (policy §3)

Every backend-connected frontend field is eventually traceable as:

```
Frontend Field  →  Canonical Entity.Field  →  Current Frappe DocType.Field
```

Frappe's own field names are frequently reused as the canonical name too (ERPNext's naming is
already close to domain-standard ERP vocabulary) — reuse is fine and expected; the point is that
the canonical layer is declared explicitly and independently, not that it must differ cosmetically
from Frappe. Distinguish, per field or rule:

- `REQUIRED_CEYLON_BEHAVIOR` — what the product actually needs
- `FRAPPE_CURRENT_BEHAVIOR` — how ERPNext currently does it
- `FRAPPE_ONLY_IMPLEMENTATION_DETAIL` — Frappe-specific plumbing (e.g. `naming_series`,
  `doctype` literal fields) that should not be reproduced natively

## Migration status

All domains currently sit at `FRAPPE_REFERENCE` or early `DOCUMENTED`. See
`docs/backend/15-migration/migration-status.md` for the live per-domain table. **No native backend
development has started.** Nothing in this folder implies otherwise.

## Architecture Decision Records

Significant, durable architecture decisions (not day-to-day implementation choices) are logged in
`docs/architecture/decisions/README.md` — a new location established alongside this system, since
no ADR convention existed in the repo before now.
