import "server-only";
import { logError } from "./errorLog";

const BASE_URL = process.env.ERPNEXT_URL;

export class ErpNextError extends Error {
  status: number;
  /**
   * ERPNext's own human-readable validation message, when the response body carries one
   * (Frappe's `frappe.throw()` puts it in `_server_messages`, HTML links and all — e.g.
   * "Cannot delete or cancel because Sales Order X is linked with Sales Invoice Y").
   * HTML tags stripped so it's safe to render as plain text. Undefined when the body
   * isn't a recognizable Frappe error shape.
   */
  erpnextMessage?: string;
  constructor(message: string, status: number, erpnextMessage?: string) {
    super(message);
    this.status = status;
    this.erpnextMessage = erpnextMessage;
  }
}

function extractErpNextMessage(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as { _server_messages?: string; exception?: string };
    const candidates: string[] = [];

    if (typeof parsed._server_messages === "string") {
      const messages = JSON.parse(parsed._server_messages) as string[];
      for (const raw of messages) {
        try {
          const inner = JSON.parse(raw) as { message?: string };
          if (inner.message) candidates.push(inner.message);
        } catch {
          candidates.push(raw);
        }
      }
    }

    if (candidates.length === 0 && typeof parsed.exception === "string") {
      candidates.push(parsed.exception.replace(/^frappe\.exceptions\.\w+:\s*/, ""));
    }

    if (candidates.length === 0) return undefined;
    // Frappe embeds live <a href="...">DocName</a> links in these messages — strip the markup.
    return candidates[0].replace(/<[^>]+>/g, "").trim();
  } catch {
    return undefined;
  }
}

function serviceAuthHeader() {
  const key = process.env.ERPNEXT_API_KEY;
  const secret = process.env.ERPNEXT_API_SECRET;
  if (!BASE_URL || !key || !secret) {
    throw new Error(
      "ERPNext connection is not configured — set ERPNEXT_URL, ERPNEXT_API_KEY and ERPNEXT_API_SECRET in apps/frontend/.env.local",
    );
  }
  return `token ${key}:${secret}`;
}

/** All data calls run as the "Frontend Integration" service account — see apps/frontend/README.md. */
async function erpnextFetch(path: string, init: RequestInit = {}) {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: serviceAuthHeader(),
        "Content-Type": "application/json",
        ...init.headers,
      },
      cache: "no-store",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError({ source: "erpnextFetch", message: `network error calling ${path}`, path, detail: message });
    throw err;
  }

  if (!res.ok) {
    const body = await res.text();
    const erpnextMessage = extractErpNextMessage(body);
    logError({
      source: "erpnextFetch",
      message: `ERPNext ${res.status} on ${path}`,
      status: res.status,
      path,
      detail: erpnextMessage ?? body.slice(0, 500),
    });
    throw new ErpNextError(`ERPNext ${res.status} on ${path}: ${body.slice(0, 300)}`, res.status, erpnextMessage);
  }
  if (res.status === 204) return null;
  return res.json();
}

type ListOpts = {
  fields?: string[];
  filters?: unknown[];
  limit?: number;
  /** Row offset (Frappe's `limit_start`) — paired with `limit` for page-by-page fetches. */
  start?: number;
  orderBy?: string;
};

export async function listDocs<T = Record<string, unknown>>(
  doctype: string,
  { fields = ["name"], filters, limit = 100, start, orderBy }: ListOpts = {},
): Promise<T[]> {
  const params = new URLSearchParams();
  params.set("fields", JSON.stringify(fields));
  params.set("limit_page_length", String(limit));
  if (start) params.set("limit_start", String(start));
  if (filters) params.set("filters", JSON.stringify(filters));
  if (orderBy) params.set("order_by", orderBy);

  const data = await erpnextFetch(`/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`);
  return data.data as T[];
}

/**
 * Total row count for a filtered list, via Frappe's own `frappe.client.get_count`
 * whitelisted method (`frappe.db.count` under the hood) rather than paginating through
 * everything to count it client-side. Used only for the "Showing X-Y of N" label — Prev/Next
 * itself doesn't need it (see lib/pagination.ts's N+1-row trick), so this stays one extra
 * request per list page load, not per page turn.
 */
export async function getCount(doctype: string, filters?: unknown[]): Promise<number> {
  const data = await erpnextFetch("/api/method/frappe.client.get_count", {
    method: "POST",
    body: JSON.stringify({ doctype, filters }),
  });
  return data.message as number;
}

export async function getDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  const data = await erpnextFetch(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
  return data.data as T;
}

export async function createDoc<T = Record<string, unknown>>(
  doctype: string,
  fields: Record<string, unknown>,
): Promise<T> {
  const data = await erpnextFetch(`/api/resource/${encodeURIComponent(doctype)}`, {
    method: "POST",
    body: JSON.stringify(fields),
  });
  return data.data as T;
}

export async function deleteDoc(doctype: string, name: string): Promise<void> {
  await erpnextFetch(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

/** docstatus 0→1. ERPNext runs the doctype's full submit validation server-side. */
export async function submitDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  return updateDoc<T>(doctype, name, { docstatus: 1 });
}

/** docstatus 1→2. Reversible in the sense that ERPNext keeps cancelled docs for audit trail. */
export async function cancelDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  return updateDoc<T>(doctype, name, { docstatus: 2 });
}

/**
 * Calls one of ERPNext's own `@frappe.whitelist()` server methods directly (Frappe's
 * generic `/api/method/<dotted.path>` endpoint), instead of reimplementing its logic here.
 * Used for actions with real internal state machines it'd be risky to guess at — e.g.
 * `close_or_unclose_sales_orders` — where trusting ERPNext's own code is safer and more
 * faithful than re-deriving the same rules client-side.
 */
export async function callMethod(method: string, args: Record<string, unknown>): Promise<void> {
  await erpnextFetch(`/api/method/${method}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
}

/**
 * Calls a whitelisted *document* method (defined with `@frappe.whitelist()` directly on a
 * DocType class, e.g. `Quotation.declare_enquiry_lost` — not a free-standing module-level
 * function like the ones callMethod() above targets). Frappe exposes these over REST via
 * `/api/resource/<doctype>/<name>` with a `run_method` argument identifying which method to
 * call (confirmed by reading `frappe/api/v1.py::execute_doc_method` on the live server: it
 * loads the doc, calls `check_permission("write")` for POST, then
 * `doc.run_method(method, **frappe.form_dict)`) — not the generic `/api/method/<dotted.path>`
 * shape callMethod() uses.
 *
 * `run_method` is sent inside the JSON body, not as a `?run_method=...` query string param
 * — live-verified this actually matters: `frappe/app.py::make_form_dict` only parses
 * `request.args`/`request.form` into `frappe.form_dict` when the request body is *not*
 * JSON; a JSON POST body (`Content-Type: application/json`, what erpnextFetch always sends)
 * replaces form_dict with the parsed body entirely, silently dropping anything sent as a
 * query string instead. Confirmed live: a `?run_method=` query param 500'd with
 * `KeyError: 'run_method'` on `frappe.form_dict.pop("run_method")`; moving it into the body
 * fixed it.
 *
 * The rest of `args` also travel as real JSON types (not `JSON.stringify`-then-`json.loads`
 * strings like `close_or_unclose_sales_orders` needs for its untyped `names` param) — a
 * `list`-typed parameter (per the target method's own type hints, which
 * `frappe.whitelist()` validates) arrives as an actual list here.
 */
export async function callDocMethod(
  doctype: string,
  name: string,
  method: string,
  args: Record<string, unknown> = {},
): Promise<void> {
  await erpnextFetch(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
    method: "POST",
    body: JSON.stringify({ run_method: method, ...args }),
  });
}

/**
 * Sibling to callMethod() above, for whitelisted methods whose return value we actually
 * need (e.g. `get_auto_data`'s available-batches/serials list, `add_serial_batch_ledgers`'s
 * created bundle doc) — same request shape as runReport() below, just generic over the
 * response's `message` payload instead of runReport's fixed report-result shape. Additive:
 * callMethod's own signature/behavior is untouched, since existing call sites depend on it.
 */
export async function callMethodWithResult<T>(method: string, args: Record<string, unknown>): Promise<T> {
  const data = await erpnextFetch(`/api/method/${method}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
  return data.message as T;
}

/**
 * Calls a whitelisted *document* method against a document that does not exist in the
 * database yet (`frappe.handler.run_doc_method`, `/api/method/run_doc_method` — source-read
 * 2026-09-20: `frappe/handler.py`). Sibling to `callDocMethod` above, which requires an
 * already-saved `name`; this one instead sends the full in-progress document as `docs`, the
 * same mechanism Desk's own `frm.call({ doc: cur_frm.doc, method })` uses for a new, unsaved
 * form — e.g. Production Plan's "Get Sales Orders"/"Get Finished Goods" buttons, which run
 * server-side query/eligibility logic and mutate child tables on the in-memory doc *before*
 * the document is ever created.
 *
 * `frappe.get_doc(docs)` builds an in-memory `Document` from the plain object, then
 * `doc.run_method(method)` is called. **`doc` must include `name`, `__islocal: 1`, and
 * `__unsaved: 1`** — live-verified 2026-09-20 against the installed instance: omitting `name`
 * does *not* get treated as new/local here, it gets resolved as a fetch-by-name with `name`
 * defaulting to `None`, and 404s with `DoesNotExistError` ("<Doctype> None not found"). Use any
 * locally-unique placeholder for `name` (e.g. `"new-<doctype-slug>-1"`) — see
 * `lib/actions/productionPlanCreate.ts`'s `trimmedDraft()` for the reference pattern this was
 * worked out against. Per `run_doc_method`'s own source, the method's *return value* is not
 * always reliable to read (several ERPNext service methods return `None` and mutate `self` in
 * place, e.g. `get_open_sales_orders`) — `frappe.response.docs.append(doc)` always runs
 * regardless, so this returns the resulting **whole document** (`docs[0]`), not `message`.
 * Read-only against ERPNext in the sense that nothing is persisted to the database — the
 * mutation is entirely in-memory and discarded once the HTTP response is sent; only an explicit
 * later `createDoc` persists anything.
 */
export async function callRunDocMethod<T>(doc: Record<string, unknown>, method: string): Promise<T> {
  const data = await erpnextFetch("/api/method/run_doc_method", {
    method: "POST",
    body: JSON.stringify({ docs: doc, method }),
  });
  return data.docs[0] as T;
}

export type ReportColumn = {
  label: string;
  fieldname: string;
  fieldtype?: string;
  options?: string;
  width?: number;
};

export type ReportRow = Record<string, unknown> | unknown[];

export type ReportChart = {
  data: { labels: string[]; datasets: { name?: string; values: number[] }[] };
  type?: string;
};

/**
 * Runs one of ERPNext's own built-in Query/Script Reports server-side, via Frappe's
 * generic `frappe.desk.query_report.run` whitelisted method — exactly what Desk's report
 * view itself calls. Chosen over reimplementing report logic in this app: reports like
 * Sales Analytics (period pivoting across 6 possible source doctypes) or Sales Register
 * (dynamic per-income-account/per-tax-account columns) have real, non-trivial Python
 * logic that would be easy to get subtly wrong; this guarantees the same numbers ERPNext
 * itself would show, including dynamic columns that vary by what data actually exists.
 *
 * `chart` is the same ready-made {labels, datasets} shape a report-backed Dashboard
 * Chart uses directly (`use_report_chart: 1` — confirmed on the real "Sales Order
 * Trends" chart backing the Selling workspace) instead of deriving a chart from
 * `result` itself.
 */
export async function runReport(
  reportName: string,
  filters: Record<string, unknown>,
): Promise<{ columns: ReportColumn[]; result: ReportRow[]; chart?: ReportChart }> {
  const data = await erpnextFetch("/api/method/frappe.desk.query_report.run", {
    method: "POST",
    body: JSON.stringify({ report_name: reportName, filters }),
  });
  const message = data.message as { columns?: ReportColumn[]; result?: ReportRow[]; chart?: ReportChart };
  return { columns: message.columns ?? [], result: message.result ?? [], chart: message.chart };
}

export type DocInfoComment = { name: string; creation: string; content: string; owner: string };
export type DocInfoVersion = { name: string; creation: string; owner: string; data: string };
export type DocInfoLabel = { name: string; creation: string; content: string; owner: string };

/**
 * Calls ERPNext's real `frappe.desk.form.load.get_docinfo` — the same whitelisted
 * method Desk's own form sidebar/timeline calls to fetch a document's comments,
 * version history (field-change diffs) and system-generated "info" comments (e.g. the
 * bare status-label lines ERPNext posts on status changes). Chosen over querying the
 * `Comment`/`Version` doctypes directly via `/api/resource/...` — tried that first and
 * it 403s for this service account even though `get_docinfo` works fine, so this is
 * also the only viable path, not just the faithful one.
 */
export async function getDocInfo(
  doctype: string,
  name: string,
): Promise<{
  comments: DocInfoComment[];
  versions: DocInfoVersion[];
  infoLogs: DocInfoLabel[];
  userInfo: Record<string, { fullname: string }>;
}> {
  const data = await erpnextFetch("/api/method/frappe.desk.form.load.get_docinfo", {
    method: "POST",
    body: JSON.stringify({ doctype, name }),
  });
  const info = data.docinfo as {
    comments?: DocInfoComment[];
    versions?: DocInfoVersion[];
    info_logs?: DocInfoLabel[];
    user_info?: Record<string, { fullname: string }>;
  };
  return {
    comments: info.comments ?? [],
    versions: info.versions ?? [],
    infoLogs: info.info_logs ?? [],
    userInfo: info.user_info ?? {},
  };
}

/**
 * Posts a Comment via ERPNext's real `add_comment` whitelisted method. Every write in
 * this app runs under the one shared service account (see the "Auth model" note in
 * apps/frontend/README.md), so `owner` on the resulting Comment is always
 * "frontend-integration@..." — `get_docinfo` doesn't return `comment_by`/`comment_email`
 * for display even though this call sets them correctly on the record, so the real
 * human's name is embedded directly in `content` instead (done by the caller) — that's
 * what actually reaches the timeline UI.
 */
export async function addComment(
  doctype: string,
  name: string,
  content: string,
  commentEmail: string,
  commentBy: string,
): Promise<void> {
  await erpnextFetch("/api/method/frappe.desk.form.utils.add_comment", {
    method: "POST",
    body: JSON.stringify({
      reference_doctype: doctype,
      reference_name: name,
      content,
      comment_email: commentEmail,
      comment_by: commentBy,
    }),
  });
}

export async function updateDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string,
  fields: Record<string, unknown>,
): Promise<T> {
  const data = await erpnextFetch(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
  return data.data as T;
}

/**
 * Verifies a human's own ERPNext credentials against Frappe's own login endpoint.
 * This only authenticates the person for our app-level session (see lib/session.ts) —
 * it does not use their Frappe session for data calls (see the service-account model
 * in apps/frontend/README.md).
 */
export async function verifyErpNextLogin(
  email: string,
  password: string,
): Promise<{ fullName: string } | null> {
  if (!BASE_URL) {
    throw new Error("ERPNEXT_URL is not set — see apps/frontend/.env.local.example");
  }

  const res = await fetch(`${BASE_URL}/api/method/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ usr: email, pwd: password }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { full_name?: string };
  return { fullName: data.full_name ?? email };
}
