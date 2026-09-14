import "server-only";

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
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: serviceAuthHeader(),
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ErpNextError(
      `ERPNext ${res.status} on ${path}: ${body.slice(0, 300)}`,
      res.status,
      extractErpNextMessage(body),
    );
  }
  if (res.status === 204) return null;
  return res.json();
}

type ListOpts = {
  fields?: string[];
  filters?: unknown[];
  limit?: number;
  orderBy?: string;
};

export async function listDocs<T = Record<string, unknown>>(
  doctype: string,
  { fields = ["name"], filters, limit = 100, orderBy }: ListOpts = {},
): Promise<T[]> {
  const params = new URLSearchParams();
  params.set("fields", JSON.stringify(fields));
  params.set("limit_page_length", String(limit));
  if (filters) params.set("filters", JSON.stringify(filters));
  if (orderBy) params.set("order_by", orderBy);

  const data = await erpnextFetch(`/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`);
  return data.data as T[];
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
