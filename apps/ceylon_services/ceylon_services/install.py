import frappe

# Workspaces to keep visible for the lightweight SME tier (gym, salon,
# hardware store, supermarket). This is an ALLOW-list, not a deny-list:
# every public Workspace not named here gets hidden, including any new
# ones a future ERPNext version adds — safer than chasing an ever-growing
# deny-list by hand.
ALLOWED_WORKSPACES = {
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
}


def apply_lightweight_workspace_set():
	"""Hooked to after_install and after_migrate (see hooks.py — both,
	since bench install-app does not trigger after_migrate, verified
	live). Hides every public Workspace not in ALLOWED_WORKSPACES.

	Also clears the cache in the same call: verified live that
	Workspace.is_hidden alone is not enough — Frappe caches the rendered
	sidebar/workspace list, so a flipped is_hidden value silently doesn't
	reach the browser until the cache is cleared. Doing both together
	here means installing this app actually looks right immediately, not
	just in the database.
	"""
	all_workspaces = frappe.get_all("Workspace", filters={"public": 1}, pluck="name")
	for name in all_workspaces:
		frappe.db.set_value("Workspace", name, "is_hidden", 0 if name in ALLOWED_WORKSPACES else 1)
	frappe.clear_cache()
	frappe.db.commit()
