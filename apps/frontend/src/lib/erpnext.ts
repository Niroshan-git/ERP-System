import "server-only";
import { after } from "next/server";
import { logError } from "./errorLog";
import { BASE_URL, serviceAuthHeader } from "./erpnextAuth";
import { generateCorrelationId } from "./correlationId";
import { getActorContext } from "./actorContext";
import { reportOperation } from "./observability";

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
  /** Ceylon Stack correlation ID for this failure (see lib/correlationId.ts) — safe to show
   * the user as a support reference; always server-generated, never client-supplied. */
  correlationId: string;
  constructor(message: string, status: number, correlationId: string, erpnextMessage?: string) {
    super(message);
    this.status = status;
    this.correlationId = correlationId;
    this.erpnextMessage = erpnextMessage;
  }
}

/**
 * Schedules the failure's observability report via next/server's after() so it runs once the
 * response has already been sent, instead of adding a second HTTP round-trip's worth of
 * latency to every ERPNext error path. Never reports on calls to the observability endpoint
 * itself — that would recurse.
 *
 * `actor` must be resolved by the caller *before* calling this, not inside the after()
 * callback: erpnextFetch() is called from both Server Actions and plain Server Component
 * page reads, and Next.js forbids calling cookies() (which getActorContext() does) inside an
 * after() callback from a Server Component — see node_modules/next/dist/docs's `after` page,
 * "In Server Components (pages and layouts)".
 *
 * Swallows any scheduling error (e.g. after() called outside a request scope) rather than
 * letting a telemetry-plumbing problem surface as the request's actual error.
 *
 * `recordActivity` (O-10D fix, mission §5/§6): live-confirmed on the real instance that
 * every erpnextFetch() failure — including routine read failures from a page's own list/get
 * calls — was writing an Activity Log entry, flooding User Activity with technical noise
 * ("ERPNext 417 on /api/resource/Stock Entry?...") rather than meaningful business actions.
 * Error Log still always gets this failure (via `severity: "ERROR"`, independent of this
 * flag) — only the User Activity write is conditional. Read-only call sites
 * (`listDocs`/`getCount`/`getDoc`/`runReport`/`getDocInfo`) pass `false`; every write path
 * (`createDoc`/`updateDoc`/`deleteDoc`/`callMethod*`/etc.) keeps the pre-existing behavior
 * (`true`) unchanged, since a failed business write is itself a meaningful activity per the
 * mission's own "meaningful failed business operation" category.
 */
function scheduleFailureReport(
  path: string,
  correlationId: string,
  actor: Awaited<ReturnType<typeof getActorContext>>,
  operation: string,
  detail: string,
  recordActivity: boolean,
) {
  if (path.includes("smart_factory.api.observability.")) return;
  try {
    after(async () => {
      await reportOperation({ correlationId, actor, severity: "ERROR", operation, detail, recordActivity });
    });
  } catch {
    // Telemetry scheduling must never break the request that triggered it.
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

/**
 * All data calls run as the "Frontend Integration" service account — see apps/frontend/README.md.
 *
 * `opts.correlationId` lets a caller that makes more than one erpnextFetch() call for a single
 * logical operation (or that wants its success report to share the ID with a possible failure)
 * supply one instead of getting a fresh one generated per call — see createDoc/updateDoc below
 * for the pattern.
 *
 * `opts.isRead` (O-10D, mission §5/§6): marks this call as a routine read with no associated
 * business action, so a failure reports to Error Log only, never Activity Log — see
 * `scheduleFailureReport()`'s doc comment above. Defaults to `false` (write/business-relevant
 * behavior, matching every call site before this flag existed) — only the handful of read-only
 * helpers below explicitly opt in.
 */
async function erpnextFetch(
  path: string,
  init: RequestInit = {},
  opts: { correlationId?: string; isRead?: boolean } = {},
) {
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
    const correlationId = opts.correlationId ?? generateCorrelationId();
    const actor = await getActorContext();
    logError({ source: "erpnextFetch", message: `network error calling ${path}`, path, detail: message, correlationId });
    scheduleFailureReport(path, correlationId, actor, `network error calling ${path}`, message, !opts.isRead);
    throw new ErpNextError(message, 0, correlationId);
  }

  if (!res.ok) {
    const body = await res.text();
    const erpnextMessage = extractErpNextMessage(body);
    const correlationId = opts.correlationId ?? generateCorrelationId();
    const actor = await getActorContext();
    logError({
      source: "erpnextFetch",
      message: `ERPNext ${res.status} on ${path}`,
      status: res.status,
      path,
      detail: erpnextMessage ?? body.slice(0, 500),
      correlationId,
    });
    scheduleFailureReport(
      path,
      correlationId,
      actor,
      `ERPNext ${res.status} on ${path}`,
      erpnextMessage ?? body.slice(0, 500),
      !opts.isRead,
    );
    throw new ErpNextError(
      `ERPNext ${res.status} on ${path}: ${body.slice(0, 300)}`,
      res.status,
      correlationId,
      erpnextMessage,
    );
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

  const data = await erpnextFetch(`/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`, {}, { isRead: true });
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
  const data = await erpnextFetch(
    "/api/method/frappe.client.get_count",
    { method: "POST", body: JSON.stringify({ doctype, filters }) },
    { isRead: true },
  );
  return data.message as number;
}

export async function getDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  const data = await erpnextFetch(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    {},
    { isRead: true },
  );
  return data.data as T;
}

export async function createDoc<T = Record<string, unknown>>(
  doctype: string,
  fields: Record<string, unknown>,
): Promise<T> {
  const correlationId = generateCorrelationId();
  const data = await erpnextFetch(
    `/api/resource/${encodeURIComponent(doctype)}`,
    { method: "POST", body: JSON.stringify(fields) },
    { correlationId },
  );
  const created = data.data as T;
  await reportBusinessActivity(correlationId, `create ${doctype}`, doctype, (created as { name?: string })?.name);
  return created;
}

export async function deleteDoc(doctype: string, name: string): Promise<void> {
  const correlationId = generateCorrelationId();
  await erpnextFetch(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { method: "DELETE" },
    { correlationId },
  );
  await reportBusinessActivity(correlationId, `delete ${doctype}`, doctype, name);
}

/** docstatus 0→1. ERPNext runs the doctype's full submit validation server-side. */
export async function submitDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  return updateDoc<T>(doctype, name, { docstatus: 1 }, `submit ${doctype}`);
}

/** docstatus 1→2. Reversible in the sense that ERPNext keeps cancelled docs for audit trail. */
export async function cancelDoc<T = Record<string, unknown>>(doctype: string, name: string): Promise<T> {
  return updateDoc<T>(doctype, name, { docstatus: 2 }, `cancel ${doctype}`);
}

/**
 * Reports a successful business write to smart_factory's observability endpoint, deferred via
 * next/server's after() so it never adds latency to the write it's describing. Resolves
 * `actor` before scheduling after() (small local cost: an HMAC verify, no network call) rather
 * than inside the callback — see scheduleFailureReport()'s docstring above for why that
 * matters. Fire-and-forget beyond that: a failure here must not surface as a failure of the
 * write, which has already succeeded by the time this runs.
 */
async function reportBusinessActivity(correlationId: string, operation: string, doctype: string, name?: string) {
  const actor = await getActorContext();
  try {
    after(async () => {
      await reportOperation({
        correlationId,
        actor,
        severity: "INFO",
        operation,
        referenceDoctype: doctype,
        referenceName: name,
      });
    });
  } catch {
    // Telemetry scheduling must never break the write that triggered it.
  }
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
  const data = await erpnextFetch(
    "/api/method/frappe.desk.query_report.run",
    { method: "POST", body: JSON.stringify({ report_name: reportName, filters }) },
    { isRead: true },
  );
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
  const data = await erpnextFetch(
    "/api/method/frappe.desk.form.load.get_docinfo",
    { method: "POST", body: JSON.stringify({ doctype, name }) },
    { isRead: true },
  );
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

/**
 * `operation` labels the resulting Activity Log entry (e.g. "submit Sales Order" via
 * submitDoc() above) — defaults to a generic "update {doctype}" for the many plain field-edit
 * call sites that don't pass one, so every call site keeps working unchanged.
 */
export async function updateDoc<T = Record<string, unknown>>(
  doctype: string,
  name: string,
  fields: Record<string, unknown>,
  operation?: string,
): Promise<T> {
  const correlationId = generateCorrelationId();
  const data = await erpnextFetch(
    `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`,
    { method: "PUT", body: JSON.stringify(fields) },
    { correlationId },
  );
  await reportBusinessActivity(correlationId, operation ?? `update ${doctype}`, doctype, name);
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

/**
 * Triggers ERPNext's own password-reset email flow (Frappe's allow_guest
 * `frappe.core.doctype.user.user.reset_password`, the same whitelisted method Desk's own
 * "Forgot Password" link calls). Deliberately does not report whether `email` matched a real
 * account: Frappe throws for an unknown user, and that failure is swallowed here (only
 * logged) rather than rejecting, so api/auth/forgot-password can return one generic message
 * either way — a password-reset endpoint that answers differently for a real vs. fake email
 * is a user-enumeration oracle. Only a genuine "couldn't even reach ERPNext" failure should
 * propagate to the caller as a rejected promise.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (!BASE_URL) {
    throw new Error("ERPNEXT_URL is not set — see apps/frontend/.env.local.example");
  }

  const res = await fetch(`${BASE_URL}/api/method/frappe.core.doctype.user.user.reset_password`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ user: email }),
    cache: "no-store",
  });

  if (!res.ok) {
    logError({
      source: "requestPasswordReset",
      message: `ERPNext responded ${res.status}`,
      status: res.status,
      path: "/api/method/frappe.core.doctype.user.user.reset_password",
    });
  }
}

/**
 * Downloads a rendered PDF via Frappe's own `frappe.utils.print_format.download_pdf` whitelisted
 * endpoint (LP-2, Layout & Print Document Output Engine) — the same real, native mechanism ERPNext
 * Desk's own "Print" → "PDF" action uses, per the LP-0/LP-1 architecture decision to reuse Frappe's
 * PDF generation rather than a second rendering engine (see `docs/architecture/decisions/README.md`
 * ADR-009). Bypasses erpnextFetch() like verifyErpNextLogin()/requestPasswordReset() above — the
 * response is a binary PDF, not JSON, so erpnextFetch()'s unconditional `res.json()` tail doesn't
 * apply here.
 *
 * `LP-UNV-001` (`docs/backend/17-layout-print/layout-print-architecture.md` §2.7): this endpoint's
 * exact behavior on this specific Frappe v16 build (query param names, default `pdf_generator`,
 * response content-type) was not hit live during LP-0/LP-1 discovery — only doctype/document
 * metadata was queried. This implementation follows Frappe's long-standing, well-documented public
 * contract for `download_pdf`, but should be exercised against a real document (by a browser/QA
 * pass) before being relied on as verified.
 */
export async function getPrintPdf(
  doctype: string,
  name: string,
  opts: { printFormat?: string; letterhead?: string } = {},
): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const params = new URLSearchParams({ doctype, name });
  if (opts.printFormat) params.set("format", opts.printFormat);
  if (opts.letterhead) {
    params.set("letterhead", opts.letterhead);
  } else {
    params.set("no_letterhead", "1");
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api/method/frappe.utils.print_format.download_pdf?${params.toString()}`, {
      headers: { Authorization: serviceAuthHeader() },
      cache: "no-store",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const correlationId = generateCorrelationId();
    logError({ source: "getPrintPdf", message: `network error downloading PDF for ${doctype} ${name}`, detail: message, correlationId });
    throw new ErpNextError(message, 0, correlationId);
  }

  if (!res.ok) {
    const body = await res.text();
    const correlationId = generateCorrelationId();
    logError({
      source: "getPrintPdf",
      message: `ERPNext ${res.status} generating PDF for ${doctype} ${name}`,
      status: res.status,
      detail: body.slice(0, 500),
      correlationId,
    });
    throw new ErpNextError(`ERPNext ${res.status} generating PDF for ${doctype} ${name}`, res.status, correlationId);
  }

  return { bytes: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? "application/pdf" };
}

/**
 * Resolves the real ERPNext roles for a human who just passed verifyErpNextLogin(), via
 * smart_factory's resolve_actor_roles whitelisted method — the trusted source lib/session.ts's
 * `isSystemManager` flag is derived from at login time. Deliberately not derived from
 * anything the browser supplies. See apps/smart_factory/smart_factory/api/observability.py.
 */
export async function resolveActorRoles(email: string): Promise<{ roles: string[]; isSystemManager: boolean }> {
  const data = await erpnextFetch("/api/method/smart_factory.api.observability.resolve_actor_roles", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const message = data.message as { roles?: string[]; is_system_manager?: boolean };
  return { roles: message.roles ?? [], isSystemManager: message.is_system_manager ?? false };
}
