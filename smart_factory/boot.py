import frappe

CEYLON_STACK_TITLE = "CeylonStack"
CEYLON_STACK_LOGO = "/files/ceylon-stack-mark-original-1024b0d7f0.png"

# frappe/boot.py's load_desktop_data() builds bootinfo.app_data from each
# installed app's add_to_apps_screen/app_title hooks. That list feeds both
# the Apps-switcher screen and, per frappe/public/js/frappe/ui/sidebar/sidebar.js
# (this.header_subtitle = app.app_title), the workspace sidebar subtitle.
# Rewriting it here is the only non-core way to relabel that text.


def set_ceylon_stack_branding(bootinfo):
	for app in bootinfo.get("app_data") or []:
		if app.get("app_name") in ("frappe", "erpnext", "smart_factory", "hrms"):
			app["app_title"] = CEYLON_STACK_TITLE
			app["app_logo_url"] = CEYLON_STACK_LOGO
