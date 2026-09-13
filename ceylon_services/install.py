import frappe

# Workspaces to keep visible, per Ceylon Stack product app. This is an
# ALLOW-list, not a deny-list: every public Workspace not named here gets
# hidden, including any new ones a future ERPNext (or Frappe HR/CRM/...)
# version adds — safer than chasing an ever-growing deny-list by hand.
#
# Keyed by app_name so this one ceylon_services app stays the single place
# that curates workspaces for every Ceylon Stack product, not just the
# lightweight SME core — apply_lightweight_workspace_set() below only
# allow-lists the workspaces for apps actually installed on a given site.
ALLOWED_WORKSPACES_BY_APP = {
	"ceylon_services": {
		"Home",
		"Welcome Workspace",
		"Selling",
		"Invoicing",
		"CRM",
		"Users",
		"ERPNext Settings",
		"Stock",
		"Buying",
		"Financial Reports",
		"Projects",
		"Support",
		"Website",
	},
	# Confirmed live against a real HR install (verify-hr-test, Phase A of
	# the product portfolio plan): Frappe HR creates nine separate
	# sub-workspaces, not one "HR" workspace. Allow-listed the day-to-day
	# essentials for a small business (staff records, payroll, leave,
	# attendance, tax setup needed for payroll to compute correctly,
	# expense claims); hid the hiring/training/appraisal tier
	# (Recruitment, Tenure, Performance) as maturity-stage features a
	# 5-10 person gym/salon/hardware-store client won't use.
	"hrms": {
		"HR Setup",
		"Payroll",
		"Leaves",
		"Shift & Attendance",
		"Tax & Benefits",
		"Expenses",
	},
}


def apply_lightweight_workspace_set():
	"""Hooked to after_install and after_migrate (see hooks.py — both,
	since bench install-app does not trigger after_migrate, verified
	live). Hides every public Workspace not allow-listed for one of the
	Ceylon Stack apps actually installed on this site.

	Also clears the cache in the same call: verified live that
	Workspace.is_hidden alone is not enough — Frappe caches the rendered
	sidebar/workspace list, so a flipped is_hidden value silently doesn't
	reach the browser until the cache is cleared. Doing both together
	here means installing this app actually looks right immediately, not
	just in the database.

	Runs correctly even when a second product app (e.g. hrms) is
	installed onto a site *after* ceylon_services: after_migrate fires
	for every installed app on every `bench migrate`, not just the app
	being installed, so this function re-executes and picks up the new
	allow-list automatically.
	"""
	installed_apps = set(frappe.get_installed_apps())
	allowed = set()
	for app_name, workspaces in ALLOWED_WORKSPACES_BY_APP.items():
		if app_name in installed_apps:
			allowed |= workspaces

	all_workspaces = frappe.get_all("Workspace", filters={"public": 1}, pluck="name")
	for name in all_workspaces:
		frappe.db.set_value("Workspace", name, "is_hidden", 0 if name in allowed else 1)
	frappe.clear_cache()
	frappe.db.commit()
