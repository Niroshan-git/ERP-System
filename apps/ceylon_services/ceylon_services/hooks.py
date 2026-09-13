app_name = "ceylon_services"
app_title = "Ceylon Services"
app_publisher = "Ceylon Stack"
app_description = "Ceylon Stack customizations for ERPNext: Desk theming/branding for service and retail clients (gym, salon, hardware store, supermarket), and hiding the Manufacturing workspace that's irrelevant to them"
app_email = "niroshan4220@gmail.com"
app_license = "Proprietary"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "/assets/ceylon_services/css/ceylon_services_desk.css"
app_include_js = "/assets/ceylon_services/js/ceylon_services_desk.js"

# Boot Session
# ------------------
# Reuses the exact same Ceylon Stack Desk branding as smart_factory (same
# hook mechanism, same visual identity) — see ceylon_services/boot.py.
boot_session = "ceylon_services.boot.set_ceylon_stack_branding"

# Migrate
# ------------------
# Runs on every `bench migrate`, not just install, so it self-heals if
# ERPNext's own workspace sync ever re-asserts standard Workspace defaults.
# See ceylon_services/install.py.
after_migrate = "ceylon_services.install.hide_manufacturing_workspace"
