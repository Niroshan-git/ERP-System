"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDoc, ErpNextError } from "@/lib/erpnext";
import { getBomDetails } from "@/lib/actions/bomLookup";

export type FormState = { error?: string } | undefined;

function humanizeError(e: unknown): string {
  if (e instanceof ErpNextError) {
    if (e.status === 403) return "Not allowed to create this work order.";
    if (e.status === 409) return "A work order with that name already exists.";
    return e.erpnextMessage ?? "ERPNext rejected this work order — check the required fields.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Converts a `<input type="datetime-local">` value ("YYYY-MM-DDTHH:MM") into the
 * "YYYY-MM-DD HH:MM:SS" shape ERPNext's Datetime fields expect over REST.
 */
function toErpDatetime(value: string): string {
  return `${value.replace("T", " ")}:00`;
}

/**
 * Live-confirmed (2026-09-17 QA): ERPNext's own `validate()` populates `required_items` from
 * `bom_no`+`qty` server-side on a plain REST insert, but NOT `operations` — that table stays
 * empty even when the BOM has operations (pulling BOM operations into a Work Order is normally
 * driven by Desk's own client-side form script, not `validate()`). WorkOrderForm.tsx previews
 * the BOM's operations to the user before create, which made the created Work Order behaviorally
 * inequivalent to what was shown (governance-closure code-review finding, CX-MFG-002) — fixed
 * here by re-fetching the same BOM server-side (via the already-existing `getBomDetails`, not a
 * client-submitted copy) and copying its `operations` onto the create payload.
 *
 * Codex's re-review of the first fix (2026-09-17) found it incomplete: only
 * `operation`/`workstation`/scaled `time_in_mins` were sent, and every operation's time was
 * scaled unconditionally — including operations flagged `fixed_time` on the BOM, whose whole
 * point (per the field's own label/semantics — `BOM Operation` has no scale-exempt runtime
 * equivalent field on `Work Order Operation`, live-confirmed via `get_doctype_fields`,
 * 2026-09-18) is that the time does NOT change with quantity. Fixed here field-by-field against
 * the two doctypes' real schemas rather than assumed: every `BOM Operation` field that (a) also
 * exists on `Work Order Operation` and (b) is a caller-supplied input rather than a
 * Work-Order-lifecycle field ERPNext computes itself (`status`, `completed_qty`, `pending_qty`,
 * `planned_start_time`/`planned_end_time`, `actual_*`) is now copied — `workstation_type`,
 * `sequence_id` (previously claimed by this comment as carried through but never actually
 * mapped), `batch_size`, `hour_rate`, `quality_inspection_required`, `is_subcontracted`,
 * `skip_material_transfer`, `backflush_from_wip_warehouse`, and the per-operation
 * `source_warehouse`/`wip_warehouse`/`fg_warehouse` overrides, plus `description`. `time_in_mins`
 * is scaled by qty/bom.quantity exactly as `required_items`' own quantities scale — unless
 * `fixed_time` is set on the BOM operation, in which case the BOM's own value is sent unscaled.
 * `finished_good`/`bom_no` (per-operation semi-finished-goods routing) are deliberately not
 * copied — this app doesn't build multi-level/semi-finished Work Orders (same no-BOM-explosion
 * boundary already accepted for `required_items`); see `bomLookup.ts`'s `BomOperationRow` doc
 * comment. `planned_operating_cost`/`status` are left unset for ERPNext's own controller to
 * derive during `validate()`, consistent with this package's standing rule of reusing ERPNext's
 * own math rather than reimplementing it.
 *
 * NEEDS_VERIFICATION (`MFG-UNV-007`, updated): whether ERPNext's own native BOM→Work Order copy
 * (Desk's client script) sends this exact field set, and whether `validate()` itself overwrites
 * any of `hour_rate`/`batch_size` from the Workstation/Operation masters regardless of what's
 * supplied — not live-QA'd this session (no bench console/source access; field *existence* was
 * confirmed live via MCP `get_doctype_fields`, but controller *behavior* was not). Preview-vs-
 * persisted note: `WorkOrderForm.tsx`'s read-only operations preview still renders the BOM's raw
 * `time_in_mins` unscaled (pre-existing, not part of CX-MFG-002) — a fixed-time operation is now
 * unaffected either way, but a non-fixed-time operation's persisted (scaled) time can still
 * differ from the previewed (unscaled) figure when Work Order qty ≠ BOM quantity; left as-is to
 * keep this remediation scoped to the two named blockers rather than reworking the preview UI.
 *
 * `CX-MFG-002` final correction (2026-09-18, second re-review pass). Two remaining mismatches
 * identified by Codex against the installed schema evidence already on file:
 *
 * 1. **Costing currency.** This code was mapping `BOM Operation.hour_rate` (transaction
 *    currency) onto `Work Order Operation.hour_rate`. `Work Order Operation.hour_rate`'s own
 *    field type is a plain `Float` with no `options: "currency"` link (unlike `BOM
 *    Operation.hour_rate`, a `Currency` field explicitly linked to the BOM's transaction
 *    currency) — i.e. Work Order Operation costing is company-currency, not transaction-currency.
 *    ERPNext's own `BOM Operation.base_hour_rate` ("Base Hour Rate (Company Currency)") is the
 *    field meant for that target. Fixed: now sends `op.base_hour_rate`, not `op.hour_rate`. When
 *    the BOM's currency equals the company currency the two are identical and this was invisible;
 *    it only mattered for a BOM priced in a foreign transaction currency — see the Currency
 *    validation note in `docs/backend/05-manufacturing/work-order.md`.
 * 2. **Missing operation-level BOM reference.** Native ERPNext copies `BOM Operation.parent`
 *    (the owning BOM's name — a Frappe child-table meta field, not a declared field on the
 *    doctype, so it never appeared in the `get_doctype_fields` schema dump) onto `Work Order
 *    Operation.bom`. This app doesn't explode multi-level BOMs (`MFG-CALC-001`'s standing
 *    boundary) — every operation returned by `getBomDetails(bom_no)` belongs to that exact
 *    top-level `bom_no`, so `parent` and `bom_no` are structurally the same value here. Fixed:
 *    every copied operation now sets `bom: bom_no` directly, without a separate fetch.
 *
 * **Native-invocation investigation (required before this manual fix per this package's
 * governance instructions):** looked for a supported ERPNext whitelisted method that performs
 * this BOM→Work-Order operation copy natively, to avoid re-deriving the mapping by hand. No
 * vendored ERPNext source and no SSH/bench console access exist in this session, so two
 * plausible native entry points were tested directly against the live installed instance as
 * **module-level dotted-path calls** (`/api/method/<dotted.path>` GET, read-only — both raise
 * before any write): `erpnext.manufacturing.doctype.work_order.work_order
 * .get_items_and_operations_from_bom` and `erpnext.manufacturing.doctype.bom.bom
 * .make_work_order`. Both returned `AttributeError: module '...' has no attribute '...'` —
 * i.e. the installed version's Python modules genuinely export no function at either dotted
 * path, not a permission or argument error. That rules out those two specific invocation paths,
 * not a guess — but it does NOT prove an identically named method is unavailable as a Frappe
 * **Document-bound method** (the separate `run_doc_method` boundary Desk's own `frm.call()`
 * uses for form-triggered calls); that boundary was not tested this session and remains a
 * legitimate avenue for future investigation. Per this package's explicit instruction not to
 * introduce "a fragile unsupported endpoint merely to avoid manual mapping," further blind
 * guessing at undocumented method names/boundaries against the production instance was judged
 * the wrong tradeoff for this package —
 * **Option B (manual parity mapping) was selected**, corrected field-by-field against verified
 * schema evidence rather than assumption.
 */
async function buildWorkOrderFields(formData: FormData) {
  const production_item = String(formData.get("production_item") ?? "").trim();
  const bom_no = String(formData.get("bom_no") ?? "").trim();
  const qty = Number(String(formData.get("qty") ?? "").trim());
  const company = String(formData.get("company") ?? "").trim();
  const plannedStartRaw = String(formData.get("planned_start_date") ?? "").trim();
  const plannedEndRaw = String(formData.get("planned_end_date") ?? "").trim();
  const project = String(formData.get("project") ?? "").trim() || undefined;
  const sales_order = String(formData.get("sales_order") ?? "").trim() || undefined;
  const source_warehouse = String(formData.get("source_warehouse") ?? "").trim() || undefined;
  const wip_warehouse = String(formData.get("wip_warehouse") ?? "").trim() || undefined;
  const fg_warehouse = String(formData.get("fg_warehouse") ?? "").trim() || undefined;
  const use_multi_level_bom = formData.get("use_multi_level_bom") ? 1 : 0;

  if (!production_item) throw new Error("Production item is required.");
  if (!bom_no) throw new Error("BOM is required.");
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantity must be greater than zero.");
  if (!company) throw new Error("Company is required.");
  if (!plannedStartRaw) throw new Error("Planned start date is required.");

  const bomDetail = await getBomDetails(bom_no);
  const scale = qty / (bomDetail?.quantity || 1);
  const operations = (bomDetail?.operations ?? []).map((op) => {
    const time_in_mins = op.fixed_time
      ? (op.time_in_mins ?? 0)
      : Math.round((op.time_in_mins ?? 0) * scale * 100) / 100;
    return {
      operation: op.operation,
      bom: bom_no,
      workstation: op.workstation || undefined,
      workstation_type: op.workstation_type || undefined,
      sequence_id: op.sequence_id ?? undefined,
      time_in_mins,
      batch_size: op.batch_size || undefined,
      hour_rate: op.base_hour_rate || undefined,
      quality_inspection_required: op.quality_inspection_required ? 1 : undefined,
      is_subcontracted: op.is_subcontracted ? 1 : undefined,
      skip_material_transfer: op.skip_material_transfer ? 1 : undefined,
      backflush_from_wip_warehouse: op.backflush_from_wip_warehouse ? 1 : undefined,
      source_warehouse: op.source_warehouse || undefined,
      wip_warehouse: op.wip_warehouse || undefined,
      fg_warehouse: op.fg_warehouse || undefined,
      description: op.description || undefined,
    };
  });

  return {
    naming_series: "MFG-WO-.YYYY.-",
    company,
    production_item,
    bom_no,
    qty,
    planned_start_date: toErpDatetime(plannedStartRaw),
    planned_end_date: plannedEndRaw ? toErpDatetime(plannedEndRaw) : undefined,
    project,
    sales_order,
    source_warehouse,
    wip_warehouse,
    fg_warehouse,
    use_multi_level_bom,
    ...(operations.length > 0 ? { operations } : {}),
  };
}

/** Create-only — leaves the Work Order at docstatus 0 (Draft). No submit/cancel here, that's
 * a future scoped package (see FRONTEND_GUIDE.md §11). This app never sends `required_items`
 * itself — ERPNext's own `validate()` populates it from `bom_no`+`qty` on insert. `operations`
 * is now sent explicitly (see buildWorkOrderFields's doc comment above). */
export async function createWorkOrderAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let fields: Awaited<ReturnType<typeof buildWorkOrderFields>>;
  try {
    fields = await buildWorkOrderFields(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid form input." };
  }

  let name: string;
  try {
    const doc = await createDoc<{ name: string }>("Work Order", fields);
    name = doc.name;
  } catch (e) {
    return { error: humanizeError(e) };
  }

  revalidatePath("/manufacturing/work-orders");
  redirect(`/manufacturing/work-orders/${encodeURIComponent(name)}`);
}
