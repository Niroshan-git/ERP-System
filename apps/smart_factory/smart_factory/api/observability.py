"""Ceylon Stack observability API surface — smart_factory's first whitelisted-method module.

Establishes the pattern future Ceylon Stack backend extensions should follow: a dedicated
`api/<module>.py` file, one caller-identity check shared by every entry point, explicit
input validation, and no arbitrary data accepted from the caller beyond a fixed, documented
set of fields.

Trust model (see docs/observability-architecture.md for the full design): every call to
ERPNext from apps/frontend runs under one shared service account
(frontend-integration@ceylonstack.local, see apps/frontend/README.md's "Auth model"), whose
API key/secret never reaches the browser. That account authenticating to Frappe at all is
therefore the real trust boundary — these methods additionally check `frappe.session.user`
so that no other authenticated ERPNext user (Desk login, a different API key, etc.) can call
them, since they intentionally bypass normal per-doctype permission checks internally.
"""

import datetime
import json
import re
import secrets

import frappe
from frappe import _
from frappe.utils import now_datetime

# The dedicated service account apps/frontend uses for every ERPNext call (see
# apps/frontend/README.md "Auth model"). Not a secret — only its API key/secret are —
# but centralized here as the single allowlisted caller for this module.
ALLOWED_CALLER = "frontend-integration@ceylonstack.local"

CORRELATION_ID_RE = re.compile(r"^CS-\d{6}-[0-9A-F]{6}$")
VALID_SEVERITIES = {"INFO", "WARNING", "ERROR", "CRITICAL"}
MAX_ERROR_LENGTH = 100000
MAX_TEXT_FIELD_LENGTH = 10000
MAX_ACTOR_FIELD_LENGTH = 255

# O-10B read surface: bounds every paginated query so no caller can accidentally (or
# deliberately) pull an entire native log table in one request (mission §33).
DEFAULT_PAGE_SIZE = 25
MAX_PAGE_SIZE = 100
MAX_LIKE_VALUE_LENGTH = 200

# Read-time defense-in-depth (mission §20) — a superset of the write-path patterns in
# apps/frontend/src/lib/redact.ts (kept in sync manually; both independently scrub the same
# secret shapes since this backend module is the other place raw diagnostic text passes
# through before reaching the trusted Next.js server layer). Native Error Log/Activity Log
# rows were never written through redact.ts in the first place (framework-generated
# exceptions, not our own log_operation calls), so this is not purely redundant with the
# write-side scrub — it is the *only* redaction framework-generated rows ever receive.
_REDACT_PATTERNS = [
	re.compile(r"Authorization:\s*\S+(?:\s+\S+)?", re.IGNORECASE),
	re.compile(r"\btoken\s+[A-Za-z0-9:_-]{8,}", re.IGNORECASE),
	re.compile(r"\bBearer\s+[A-Za-z0-9._-]{8,}", re.IGNORECASE),
	re.compile(r"\bceylon_session=[^;\s]+", re.IGNORECASE),
	# Cookie/Set-Cookie header values — live-caught gap (O-10C, 2026-09-24, both here and in the
	# TypeScript mirror in lib/redact.ts): neither header was covered by any prior pattern.
	re.compile(r"\b(?:Set-)?Cookie:\s*\S+", re.IGNORECASE),
	re.compile(r"\b(?:access|refresh)[-_]?token\s+[A-Za-z0-9._-]{8,}", re.IGNORECASE),
	re.compile(
		r'\b(password|secret|api[-_]?key|api[-_]?secret|access[-_]?token|refresh[-_]?token)'
		r'["\']?\s*[:=]\s*["\']?\S+',
		re.IGNORECASE,
	),
]


def _check_caller():
	if frappe.session.user != ALLOWED_CALLER:
		frappe.throw(_("Not permitted"), frappe.PermissionError)


def _generate_correlation_id():
	stamp = now_datetime().strftime("%y%m%d")
	suffix = secrets.token_hex(3).upper()
	return f"CS-{stamp}-{suffix}"


def _truncate(value, limit):
	if value is None:
		return None
	value = str(value)
	return value if len(value) <= limit else value[:limit]


def _redact_text(value):
	"""Defense-in-depth scrub applied to every diagnostic string before it leaves this module —
	see `_REDACT_PATTERNS` above. Mirrors `lib/redact.ts`'s replacement shape (keep the matched
	credential's own leading word, replace only the secret) so redacted text reads the same way
	on both the write and read paths.
	"""
	if not value:
		return value
	text = str(value)
	for pattern in _REDACT_PATTERNS:
		text = pattern.sub(lambda m: f"{re.split(r'[\\s:=]', m.group(0))[0]} [REDACTED]", text)
	return text


def _escape_like(value):
	"""Escapes SQL LIKE wildcards (`%`, `_`) in a value that will be interpolated into a
	`like`-filter's *value* (not the query structure itself — `frappe.get_all`'s filter tuples
	are always parameterized, so this is not an injection defense, only a correctness one: an
	unescaped `%`/`_` in caller-supplied search/filter text would otherwise act as a SQL
	wildcard and silently widen the match beyond what the caller typed).
	"""
	return str(value).replace("\\", "\\\\").replace("%", r"\%").replace("_", r"\_")


def _clamp_page(value):
	try:
		page = int(value)
	except (TypeError, ValueError):
		return 1
	return page if page >= 1 else 1


def _clamp_page_size(value):
	try:
		size = int(value)
	except (TypeError, ValueError):
		return DEFAULT_PAGE_SIZE
	if size < 1:
		return DEFAULT_PAGE_SIZE
	return min(size, MAX_PAGE_SIZE)


def _validate_correlation_id(correlation_id):
	"""Exact-shape validation for a caller-supplied trace ID — mission §22: malformed input is
	rejected safely (never silently coerced or treated as "not found yet"). Returns the
	normalized (uppercased) ID."""
	if not correlation_id or not isinstance(correlation_id, str):
		frappe.throw(_("A correlation ID is required"), frappe.ValidationError)
	normalized = correlation_id.strip().upper()
	if not CORRELATION_ID_RE.match(normalized):
		frappe.throw(_("Malformed correlation ID"), frappe.ValidationError)
	return normalized


def _validate_date(value, label):
	if value is None:
		return None
	if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(value)):
		frappe.throw(_("Malformed {0} — expected YYYY-MM-DD").format(label), frappe.ValidationError)
	return value


def _validate_reference_doctype(reference_doctype):
	if reference_doctype is None:
		return None
	if not frappe.db.exists("DocType", reference_doctype):
		frappe.throw(_("Unknown reference DocType"), frappe.ValidationError)
	return reference_doctype


def _count(doctype, filters=None, or_filters=None):
	"""One consistent count path for every list method below.

	Live-verified against this Frappe version (2026-09-24): the raw-SQL-string field shape
	(`fields=["count(name) as total"]`) this was originally written against is rejected
	outright (`"SQL functions are not allowed as strings in SELECT"` — a framework hardening
	this module's own author didn't know about until testing it live). `frappe.db.count()` is
	the correct real aggregate-count path, but it has no `or_filters` parameter at all — so the
	one caller that needs `or_filters` (`list_activity`'s free-text `search`, matched against
	`subject` OR `content`) falls back to plucking just the `name` column for every matching row
	and counting it in Python. That reintroduces a bounded version of the "fetch everything"
	shape mission §33/§34 otherwise forbids, but only that one narrow column, only when `search`
	is combined with `or_filters`, never full rows — an accepted, documented tradeoff against a
	real API limitation, not a shortcut taken to avoid writing the real query.
	"""
	if or_filters:
		return len(
			frappe.get_all(doctype, filters=filters, or_filters=or_filters, pluck="name", limit_page_length=0)
		)
	return frappe.db.count(doctype, filters=filters)


def _parse_metadata(raw):
	if not raw:
		return {}
	try:
		data = json.loads(raw)
	except (TypeError, ValueError):
		return {}
	if not isinstance(data, dict):
		return {}
	return {k: (_redact_text(v) if isinstance(v, str) else v) for k, v in data.items()}


_ACTOR_LINE_RE = re.compile(r"^Actor:\s*(.*?)\s*<([^<>\s]+)>\s*$", re.MULTILINE)
_CORRELATION_LINE_RE = re.compile(r"^Correlation:\s*(CS-\d{6}-[0-9A-F]{6})\s*$", re.MULTILINE)
_EXECUTION_PRINCIPAL_LINE_RE = re.compile(r"^Execution principal:\s*(\S+)\s*$", re.MULTILINE)


def _extract_actor_from_activity_content(content):
	"""Recovers the real human actor `log_operation` embedded in `Activity Log.content` as a
	plain text line (`"Actor: {full_name} <{email}>"` — see that method's `content_lines`
	construction). Never falls back to the execution principal shown on the very next line —
	that would be exactly the misattribution mission §30 forbids."""
	if not content:
		return None
	match = _ACTOR_LINE_RE.search(content)
	if not match:
		return None
	full_name, email = match.group(1).strip(), match.group(2).strip()
	return {"email": email, "full_name": full_name or email}


def _extract_correlation_from_activity_content(content):
	if not content:
		return None
	match = _CORRELATION_LINE_RE.search(content)
	return match.group(1) if match else None


def _extract_execution_principal_from_activity_content(content, fallback):
	"""Independent-review finding (2026-09-24), fixed same day: `Activity Log.user` is NOT a
	reliable source for the execution principal — `log_operation` sets it to `resolved_user`,
	which is the *actor's own* email whenever `actor_email` resolves to a real ERPNext User
	(the common case), falling back to the execution principal only when it doesn't. Using
	`row.user` as "execution_principal" therefore silently duplicates the Actor field for most
	real business operations — exactly the actor/execution-principal conflation mission §26
	forbids. The real execution principal is only reliably recoverable from the
	`"Execution principal: {execution_principal}"` line `log_operation` always writes into
	`content` (unconditional, unlike the `Actor:` line) — read that instead, matching the
	`_extract_actor_from_activity_content`/`_extract_correlation_from_activity_content`
	pattern. `fallback` (the native `user` field) is used only for rows this regex can't parse
	at all (e.g. a native Login/Logout entry, which has no Ceylon Stack content structure and
	genuinely has no separate execution-principal concept — `user` *is* the whole identity
	there), not as a silent substitute for a row this module itself wrote.
	"""
	if content:
		match = _EXECUTION_PRINCIPAL_LINE_RE.search(content)
		if match:
			return match.group(1)
	return fallback


def _resolve_reference(reference_doctype, reference_name):
	"""Only attach a reference if it names a real DocType *and* a document that still exists.

	Live-verified 2026-09-23: Activity Log.reference_name is a Dynamic Link, and beyond the
	generic link validation that `ignore_links=True` skips, Activity Log's own `validate()`
	hook (`frappe/core/doctype/activity_log/activity_log.py::set_timeline_doc`) unconditionally
	calls `frappe.get_doc(reference_doctype, reference_name)` to build its timeline — there is
	no insert flag that suppresses this. A reference to a document that no longer exists (e.g.
	reporting a `delete` operation, called *after* the delete already succeeded) would otherwise
	raise DoesNotExistError and silently drop the whole Activity Log write in the caller's
	except-and-swallow. Checking existence ourselves avoids ever hitting that path.
	"""
	if (
		reference_doctype
		and reference_name
		and frappe.db.exists("DocType", reference_doctype)
		and frappe.db.exists(reference_doctype, reference_name)
	):
		return reference_doctype, reference_name
	return None, None


@frappe.whitelist()
def log_operation(
	correlation_id=None,
	actor_email=None,
	actor_full_name=None,
	severity="INFO",
	operation=None,
	reference_doctype=None,
	reference_name=None,
	message=None,
	detail=None,
):
	"""Record one observability event under a correlation ID, reusing native Frappe stores.

	ERROR/CRITICAL severities write to Error Log (trace_id = correlation_id) — Frappe's own
	native error store, already schema-equipped for this. Any call that names a business
	`operation` also writes an Activity Log entry attributed to the real actor (when their
	email resolves to a real ERPNext User) rather than the calling service account, so
	"who did this" survives the shared-service-account boundary. Never raises for expected
	failure modes — a broken write here must not break the caller's business transaction.
	"""
	_check_caller()

	severity = (severity or "INFO").upper()
	if severity not in VALID_SEVERITIES:
		severity = "INFO"

	if not correlation_id or not CORRELATION_ID_RE.match(correlation_id):
		correlation_id = _generate_correlation_id()

	# O2-06/O2-07 follow-up (flagged in the O-2 independent review, carried forward through
	# O-10A): actor_full_name/actor_email were the only two fields in this method's input not
	# length-truncated before persisting, inconsistent with message/detail/operation below.
	# Could previously only fail safely (the whole write silently dropped via the try/except
	# around it), never crash the caller — but "safely" still meant losing the record, so fixed
	# here while this file is open for O-10B's read-surface work anyway.
	actor_email = _truncate(actor_email, MAX_ACTOR_FIELD_LENGTH)
	actor_full_name = _truncate(actor_full_name, MAX_ACTOR_FIELD_LENGTH)

	execution_principal = frappe.session.user
	result = {"correlation_id": correlation_id, "recorded": {"error_log": False, "activity_log": False}}

	if severity in ("ERROR", "CRITICAL"):
		try:
			ref_doctype, ref_name = _resolve_reference(reference_doctype, reference_name)
			metadata = {
				"actor_email": actor_email,
				"actor_full_name": actor_full_name,
				"execution_principal": execution_principal,
				"severity": severity,
				"operation": operation,
			}
			log = frappe.new_doc("Error Log")
			log.method = _truncate(operation or "ceylon_stack.observability", 140)
			log.error = _truncate(detail or message or "", MAX_ERROR_LENGTH)
			log.trace_id = correlation_id
			log.metadata = json.dumps(metadata)
			if ref_doctype:
				log.reference_doctype = ref_doctype
				log.reference_name = ref_name
			log.insert(ignore_permissions=True)
			result["recorded"]["error_log"] = True
		except Exception:
			# Telemetry failure must never surface to the caller as the original error's
			# replacement — record the meta-failure and move on.
			frappe.log_error(title="Ceylon Stack observability: Error Log write failed")

	if operation:
		try:
			ref_doctype, ref_name = _resolve_reference(reference_doctype, reference_name)
			resolved_user = (
				actor_email if actor_email and frappe.db.exists("User", actor_email) else execution_principal
			)
			content_lines = [f"Correlation: {correlation_id}"]
			if actor_email:
				content_lines.append(f"Actor: {actor_full_name or actor_email} <{actor_email}>")
			content_lines.append(f"Execution principal: {execution_principal}")
			if message:
				content_lines.append(_truncate(message, MAX_TEXT_FIELD_LENGTH))

			activity = frappe.new_doc("Activity Log")
			activity.subject = _truncate(operation, 140)
			activity.content = "\n".join(content_lines)
			activity.status = "Failed" if severity in ("ERROR", "CRITICAL") else "Success"
			activity.user = resolved_user
			activity.full_name = actor_full_name or resolved_user
			if ref_doctype:
				activity.reference_doctype = ref_doctype
				activity.reference_name = ref_name
			# Activity Log.reference_name is a Dynamic Link — Frappe validates the target
			# document actually exists unless ignore_links is set. Observability writes must
			# degrade gracefully (e.g. the referenced document was deleted between the
			# business write and this report landing) rather than silently vanish into the
			# except-and-swallow below for what would otherwise be a routine race.
			activity.insert(ignore_permissions=True, ignore_links=True)
			result["recorded"]["activity_log"] = True
		except Exception:
			frappe.log_error(title="Ceylon Stack observability: Activity Log write failed")

	return result


@frappe.whitelist()
def resolve_actor_roles(email=None):
	"""Return the real ERPNext roles for a human who just authenticated via /api/method/login.

	Used once at Ceylon Stack login time so the app-level session can derive a role tier
	from a trusted source (real Frappe role assignments) instead of trusting anything the
	browser could supply. Returns the full role list for backend/debugging use; the frontend
	is expected to store only a minimal derived flag in the session cookie, not this list.
	"""
	_check_caller()

	if not email or not frappe.db.exists("User", email):
		return {"roles": [], "is_system_manager": False}

	roles = frappe.get_roles(email)
	return {"roles": roles, "is_system_manager": "System Manager" in roles}


# ---------------------------------------------------------------------------------------
# O-10B — real Observability read surface.
#
# Everything below reads native Frappe stores (Error Log / Activity Log / Version) that
# `log_operation` above writes into, plus whatever Frappe's own exception handling wrote
# there independently of Ceylon Stack. Same trust model as the write methods above: every
# method calls `_check_caller()` first, so only the one trusted service account this app
# uses can reach these — never exposed to arbitrary authenticated ERPNext users, and never
# reachable directly from a browser (the browser never holds this account's credentials).
#
# These methods intentionally return native-ish field names (not yet the frontend's
# `ErrorEvent`/`Trace`/etc. DTO shape) — the caller is trusted Next.js server code
# (`lib/observabilityCenter/serverProvider.ts`), not the browser, and *that* layer is where
# normalization into safe, browser-visible DTOs happens (mission §17/§18/§19). Returning
# native field names here keeps this module a thin, honest read surface rather than a
# second place that also has to know the frontend's type contract.
# ---------------------------------------------------------------------------------------


@frappe.whitelist()
def list_errors(
	page=1,
	page_size=DEFAULT_PAGE_SIZE,
	severity=None,
	trace_id=None,
	reference_doctype=None,
	reference_name=None,
	actor_email=None,
	search=None,
	date_from=None,
	date_to=None,
):
	"""Paginated, filtered read of native `Error Log` — Error Explorer's real backing query.

	Live-verified 2026-09-24: `Error Log` in this instance is a mix of genuine Ceylon Stack
	telemetry (`trace_id` set by `log_operation`) and unrelated native Frappe/framework
	exceptions with no `trace_id` at all (e.g. a `wkhtmltopdf` PDF-rendering failure, a
	malformed internal `run_doc_method` call) — proving the O-1 discovery doc's open question
	("is `trace_id` populated automatically, or only when code explicitly passes it?") the
	second way: explicitly only. Error Explorer is scoped to `trace_id is set` rows only —
	the frontend's `ErrorEvent.correlationId` is a required (non-nullable) field, and Ceylon
	Stack's own Observability Center is about *this app's* correlated operations, not a
	duplicate of ERPNext Desk's own generic Error Log list (which already exists natively for
	framework-level exceptions). This filter is applied unconditionally, not exposed as a
	toggle, since it defines what "Error Explorer" *means* here, not an optional narrowing.

	Filters pushed to the database, not faked: `trace_id`/`reference_doctype`/`reference_name`/
	`date_from`/`date_to`/`search` (on `method`) are native-column filters. `severity` and
	`actor_email` are not native columns (they live inside the JSON `metadata` blob
	`log_operation` writes) — implemented as a `LIKE` match on the serialized JSON text, which
	works because `metadata` is always produced by this same module's `json.dumps()` with a
	fixed key order, but is documented here as DERIVED_SAFELY, not a real indexed filter: a
	metadata blob written any other way (there is none today) would not match.
	"""
	_check_caller()

	page = _clamp_page(page)
	page_size = _clamp_page_size(page_size)
	reference_doctype = _validate_reference_doctype(reference_doctype)
	date_from = _validate_date(date_from, "date_from")
	date_to = _validate_date(date_to, "date_to")

	if trace_id:
		trace_id = _validate_correlation_id(trace_id)
	if severity:
		severity = severity.upper()
		if severity not in VALID_SEVERITIES:
			frappe.throw(_("Invalid severity"), frappe.ValidationError)

	filters = [["trace_id", "is", "set"]]
	if trace_id:
		filters.append(["trace_id", "=", trace_id])
	if reference_doctype:
		filters.append(["reference_doctype", "=", reference_doctype])
	if reference_name:
		filters.append(["reference_name", "=", reference_name])
	if date_from:
		filters.append(["creation", ">=", f"{date_from} 00:00:00"])
	if date_to:
		filters.append(["creation", "<=", f"{date_to} 23:59:59"])
	if search:
		filters.append(["method", "like", f"%{_escape_like(search[:MAX_LIKE_VALUE_LENGTH])}%"])
	if severity:
		filters.append(["metadata", "like", f'%"severity": "{severity}"%'])
	if actor_email:
		safe_actor = _escape_like(str(actor_email)[:MAX_LIKE_VALUE_LENGTH])
		filters.append(["metadata", "like", f'%"actor_email": "{safe_actor}"%'])

	total = _count("Error Log", filters=filters)
	rows = frappe.get_all(
		"Error Log",
		filters=filters,
		fields=["name", "creation", "method", "trace_id", "reference_doctype", "reference_name", "owner", "metadata", "error"],
		order_by="creation desc, name desc",
		limit_page_length=page_size,
		limit_start=(page - 1) * page_size,
	)

	items = []
	for row in rows:
		error_text = row.error or ""
		items.append(
			{
				"name": row.name,
				"creation": row.creation,
				"method": _redact_text(row.method),
				"trace_id": row.trace_id,
				"reference_doctype": row.reference_doctype,
				"reference_name": row.reference_name,
				"execution_principal": row.owner,
				"metadata": _parse_metadata(row.metadata),
				"has_error_detail": bool(error_text),
				"error_excerpt": _redact_text(_truncate(error_text, 500)),
			}
		)

	return {"items": items, "pagination": {"page": page, "page_size": page_size, "total": total}}


@frappe.whitelist()
def get_trace(correlation_id=None):
	"""Exact correlation-ID lookup (mission §22/§23) — the real backing query for Trace Detail.

	Combines whichever of `Error Log` (by `trace_id`) and `Activity Log` (by the `"Correlation:
	<id>"` line `log_operation` writes into `content`) actually exist for this ID — both were
	written from the *same* `log_operation` call when both exist, so returning both is real
	recorded evidence, not a fabricated multi-step timeline (mission §23's "do not manufacture
	missing timeline events"). Returns `None` for a syntactically valid ID with no matching
	record in either store (§22's "valid but nonexistent" case) — malformed IDs are rejected by
	`_validate_correlation_id()` before any query runs.
	"""
	_check_caller()
	normalized = _validate_correlation_id(correlation_id)

	error_rows = frappe.get_all(
		"Error Log",
		filters=[["trace_id", "=", normalized]],
		fields=["name", "creation", "method", "trace_id", "reference_doctype", "reference_name", "owner", "metadata", "error"],
		order_by="creation desc",
		limit_page_length=1,
	)
	activity_rows = frappe.get_all(
		"Activity Log",
		filters=[["content", "like", f"%Correlation: {normalized}%"]],
		fields=["name", "creation", "subject", "content", "status", "user", "full_name", "reference_doctype", "reference_name"],
		order_by="creation asc",
		limit_page_length=20,
	)

	if not error_rows and not activity_rows:
		return None

	error_log = None
	if error_rows:
		row = error_rows[0]
		error_text = row.error or ""
		error_log = {
			"name": row.name,
			"creation": row.creation,
			"method": _redact_text(row.method),
			"trace_id": row.trace_id,
			"reference_doctype": row.reference_doctype,
			"reference_name": row.reference_name,
			"execution_principal": row.owner,
			"metadata": _parse_metadata(row.metadata),
			"has_error_detail": bool(error_text),
			"error_excerpt": _redact_text(_truncate(error_text, 2000)),
		}

	activity_logs = []
	for row in activity_rows:
		content = _redact_text(row.content)
		activity_logs.append(
			{
				"name": row.name,
				"creation": row.creation,
				"subject": _redact_text(row.subject),
				"status": row.status,
				"reference_doctype": row.reference_doctype,
				"reference_name": row.reference_name,
				"execution_principal": _extract_execution_principal_from_activity_content(content, row.user),
				"actor": _extract_actor_from_activity_content(content),
			}
		)

	return {"error_log": error_log, "activity_logs": activity_logs}


@frappe.whitelist()
def get_technical_details(correlation_id=None):
	"""Gated technical-diagnostics fetch (mission §19/§20/§27's Trace/TechnicalDetails split) —
	kept separate from `get_trace()` so a future stricter authorization check can gate *this*
	call specifically without touching the general trace summary. Returns the full (redacted,
	length-bounded) `Error Log.error` text for one correlation ID — never truncated to a list-
	row excerpt like `list_errors()`/`get_trace()` return, since this is the one call meant to
	answer "show me everything recorded," for exactly one trace at a time.
	"""
	_check_caller()
	normalized = _validate_correlation_id(correlation_id)

	rows = frappe.get_all(
		"Error Log",
		filters=[["trace_id", "=", normalized]],
		fields=["name", "method", "error", "metadata", "creation"],
		order_by="creation desc",
		limit_page_length=1,
	)
	if not rows:
		return {"available": False}

	row = rows[0]
	return {
		"available": True,
		"method": _redact_text(row.method),
		"error": _redact_text(_truncate(row.error or "", MAX_ERROR_LENGTH)),
		"metadata": _parse_metadata(row.metadata),
	}


@frappe.whitelist()
def list_activity(
	page=1,
	page_size=DEFAULT_PAGE_SIZE,
	user=None,
	action=None,
	reference_doctype=None,
	reference_name=None,
	correlation_id=None,
	search=None,
	date_from=None,
	date_to=None,
):
	"""Paginated, filtered read of native `Activity Log` — User Activity's real backing query.

	`action` matches against `subject` (a `like` filter, not `operation` — native `operation`
	is a closed Login/Logout/Impersonate Select that `log_operation` never sets for business
	activity; the business-activity label lives in `subject`, exactly where this filters).
	`correlation_id` matches the `"Correlation: <id>"` line in `content`, the same mechanism
	`get_trace()` uses. `search` matches `subject` OR `content` via `or_filters` (a real
	database-level OR, not two separate queries merged in Python).
	"""
	_check_caller()

	page = _clamp_page(page)
	page_size = _clamp_page_size(page_size)
	reference_doctype = _validate_reference_doctype(reference_doctype)
	date_from = _validate_date(date_from, "date_from")
	date_to = _validate_date(date_to, "date_to")
	if correlation_id:
		correlation_id = _validate_correlation_id(correlation_id)
	if user and not frappe.db.exists("User", user):
		frappe.throw(_("Unknown user"), frappe.ValidationError)

	filters = []
	or_filters = None
	if user:
		filters.append(["user", "=", user])
	if reference_doctype:
		filters.append(["reference_doctype", "=", reference_doctype])
	if reference_name:
		filters.append(["reference_name", "=", reference_name])
	if action:
		filters.append(["subject", "like", f"%{_escape_like(action[:MAX_LIKE_VALUE_LENGTH])}%"])
	if correlation_id:
		filters.append(["content", "like", f"%Correlation: {correlation_id}%"])
	if date_from:
		filters.append(["creation", ">=", f"{date_from} 00:00:00"])
	if date_to:
		filters.append(["creation", "<=", f"{date_to} 23:59:59"])
	if search:
		needle = _escape_like(search[:MAX_LIKE_VALUE_LENGTH])
		or_filters = [["subject", "like", f"%{needle}%"], ["content", "like", f"%{needle}%"]]

	total = _count("Activity Log", filters=filters, or_filters=or_filters)
	rows = frappe.get_all(
		"Activity Log",
		filters=filters,
		or_filters=or_filters,
		fields=["name", "creation", "subject", "content", "operation", "status", "user", "full_name", "reference_doctype", "reference_name"],
		order_by="creation desc, name desc",
		limit_page_length=page_size,
		limit_start=(page - 1) * page_size,
	)

	items = []
	for row in rows:
		content = _redact_text(row.content)
		items.append(
			{
				"name": row.name,
				"creation": row.creation,
				"subject": _redact_text(row.subject),
				"operation": row.operation,
				"status": row.status,
				"execution_principal": _extract_execution_principal_from_activity_content(content, row.user),
				"full_name": row.full_name,
				"reference_doctype": row.reference_doctype,
				"reference_name": row.reference_name,
				"actor": _extract_actor_from_activity_content(content),
				"correlation_id": _extract_correlation_from_activity_content(content),
			}
		)

	return {"items": items, "pagination": {"page": page, "page_size": page_size, "total": total}}


def _join_actors_for_document(reference_doctype, reference_name, versions):
	"""Best-effort actor recovery for one document's Version rows (mission §27/§30) — a single
	extra `Activity Log` query for the whole page (never one query per `Version` row, per
	mission §37's N+1 warning), matched in Python by nearest timestamp within a 3-second
	window. `Version.owner` is deliberately never used as the actor (almost always the shared
	execution principal, not the real human — see §30); when no Activity Log row is close
	enough in time, the actor stays `None` ("Actor unavailable"), never guessed.
	"""
	if not versions:
		return {}

	timestamps = [v.creation for v in versions]
	window_start = min(timestamps) - datetime.timedelta(seconds=3)
	window_end = max(timestamps) + datetime.timedelta(seconds=3)

	activity_rows = frappe.get_all(
		"Activity Log",
		filters=[
			["reference_doctype", "=", reference_doctype],
			["reference_name", "=", reference_name],
			["creation", ">=", window_start],
			["creation", "<=", window_end],
		],
		fields=["creation", "content"],
		order_by="creation asc",
		limit_page_length=200,
	)
	candidates = [
		(row.creation, _extract_actor_from_activity_content(row.content))
		for row in activity_rows
		if _extract_actor_from_activity_content(row.content)
	]

	actors_by_version = {}
	for version in versions:
		best = None
		best_delta = None
		for creation, actor in candidates:
			delta = abs((creation - version.creation).total_seconds())
			if delta <= 3 and (best_delta is None or delta < best_delta):
				best, best_delta = actor, delta
		actors_by_version[version.name] = best
	return actors_by_version


@frappe.whitelist()
def list_audit(
	reference_doctype=None,
	reference_name=None,
	page=1,
	page_size=DEFAULT_PAGE_SIZE,
	date_from=None,
	date_to=None,
	order="desc",
):
	"""Paginated read of native `Version` — Audit Trail's real backing query.

	`order` (`"asc"`/`"desc"`) is sorted at the database level, not reversed client-side after
	fetching one page — mission §35's "must support true requested chronology" and §27's
	Document History mode both need a real, deterministic full-set ordering, which a per-page
	JS reversal cannot honestly provide once a document's history spans more than one page
	(the exact limitation `docs/observability-frontend-architecture.md`'s O-8 section flags in
	the current demo). Actor join (`_join_actors_for_document`) only runs when both
	`reference_doctype` and `reference_name` narrow this to one document — mission §37: running
	the same join across an unbounded multi-document Audit Explorer page would mean querying
	Activity Log once per distinct document on that page, an N+1 shape this method avoids by
	simply not attempting actor recovery outside the single-document case (actor stays `None`,
	an honest "unavailable" rather than a fabricated guess).
	"""
	_check_caller()

	page = _clamp_page(page)
	page_size = _clamp_page_size(page_size)
	reference_doctype = _validate_reference_doctype(reference_doctype)
	date_from = _validate_date(date_from, "date_from")
	date_to = _validate_date(date_to, "date_to")
	order_dir = "asc" if str(order).lower() == "asc" else "desc"

	filters = []
	if reference_doctype:
		filters.append(["ref_doctype", "=", reference_doctype])
	if reference_name:
		filters.append(["docname", "=", reference_name])
	if date_from:
		filters.append(["creation", ">=", f"{date_from} 00:00:00"])
	if date_to:
		filters.append(["creation", "<=", f"{date_to} 23:59:59"])

	total = _count("Version", filters=filters)
	rows = frappe.get_all(
		"Version",
		filters=filters,
		fields=["name", "creation", "owner", "ref_doctype", "docname", "data"],
		order_by=f"creation {order_dir}, name {order_dir}",
		limit_page_length=page_size,
		limit_start=(page - 1) * page_size,
	)

	actors_by_version = (
		_join_actors_for_document(reference_doctype, reference_name, rows)
		if reference_doctype and reference_name
		else {}
	)

	items = []
	for row in rows:
		items.append(
			{
				"name": row.name,
				"creation": row.creation,
				"execution_principal": row.owner,
				"reference_doctype": row.ref_doctype,
				"reference_name": row.docname,
				"data": row.data,
				"actor": actors_by_version.get(row.name),
			}
		)

	return {"items": items, "pagination": {"page": page, "page_size": page_size, "total": total}}
