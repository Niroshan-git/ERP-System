app_name = "ceylon_services"
app_title = "Ceylon Services"
app_publisher = "Ceylon Stack"
app_description = "Ceylon Stack customizations for ERPNext: Desk theming/branding for service and retail clients (gym, salon, hardware store, supermarket), and a lightweight allow-listed set of visible workspaces for them"
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

# Installation
# ------------------
# `bench install-app` does NOT run after_migrate hooks (verified directly:
# installing on a real test site left workspace visibility unchanged until
# a separate `bench migrate` was run) — so after_install covers the real
# onboarding path (install this app, done), and after_migrate below covers
# self-healing on every later migrate in case ERPNext's own workspace sync
# ever re-asserts standard Workspace defaults. Both point at the same
# idempotent, cache-clearing function. See ceylon_services/install.py.
after_install = "ceylon_services.install.apply_lightweight_workspace_set"
after_migrate = "ceylon_services.install.apply_lightweight_workspace_set"
