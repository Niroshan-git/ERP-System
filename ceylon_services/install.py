import frappe

# Workspaces that are manufacturing-only and irrelevant to service/retail
# clients (gym, salon, hardware store, supermarket). ERPNext's native
# "Domain" framework (Domain Settings / restrict_to_domain) exists but is
# completely unused on this ERPNext version — verified directly via bench
# console that zero Workspaces/Module Defs/DocTypes anywhere have
# restrict_to_domain set, so activating a domain would hide nothing.
# Hiding directly via Workspace.is_hidden is the mechanism that actually
# works here.
MANUFACTURING_ONLY_WORKSPACES = ["Manufacturing"]


def hide_manufacturing_workspace():
	"""Hooked to after_migrate (see hooks.py), not just after_install, so
	this self-heals if ERPNext's own workspace sync ever re-asserts
	standard Workspace defaults on a future bench migrate — a one-time
	install-only edit could silently get reverted otherwise.
	"""
	for workspace in MANUFACTURING_ONLY_WORKSPACES:
		if frappe.db.exists("Workspace", workspace):
			frappe.db.set_value("Workspace", workspace, "is_hidden", 1)
	frappe.db.commit()
