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
