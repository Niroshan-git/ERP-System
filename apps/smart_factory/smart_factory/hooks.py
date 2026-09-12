app_name = "smart_factory"
app_title = "Smart Factory"
app_publisher = "Ceylon Stack"
app_description = "Ceylon Stack customizations for ERPNext: Desk theming/branding overrides now, Manufacturing/OEE business logic later"
app_email = "niroshan4220@gmail.com"
app_license = "Proprietary"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/smart_factory/css/ceylon_stack_desk.css"
app_include_js = "/assets/smart_factory/js/ceylon_stack_desk.js"

# Boot Session
# ------------------
# rewrite the installed-app metadata (title/logo) sent to the client on every
# session boot, so the sidebar/app-switcher shows Ceylon Stack instead of the
# underlying frappe/erpnext app titles. This is the only non-core mechanism
# that reaches that text (see PROGRESS.md).
boot_session = "smart_factory.boot.set_ceylon_stack_branding"
