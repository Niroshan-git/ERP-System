import frappe

CEYLON_STACK_TITLE = "CeylonStack"
CEYLON_STACK_LOGO = "/files/ceylon-stack-mark-original-1024b0d7f0.png"

# Same mechanism as smart_factory.boot.set_ceylon_stack_branding — see that
# file for the full explanation. Kept in sync manually since both apps
# reuse the identical Ceylon Stack visual identity; if the logo file or
# title ever changes, update both apps' boot.py together.


def set_ceylon_stack_branding(bootinfo):
	for app in bootinfo.get("app_data") or []:
		if app.get("app_name") in ("frappe", "erpnext", "ceylon_services", "hrms"):
			app["app_title"] = CEYLON_STACK_TITLE
			app["app_logo_url"] = CEYLON_STACK_LOGO
