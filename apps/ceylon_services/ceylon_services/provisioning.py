import frappe
from frappe.desk.page.setup_wizard.setup_wizard import setup_complete

# Reusable "day-to-day business owner" role sets, confirmed live against
# real doctype/permission sweeps (see project_multivertical_pos_plan and
# project_product_portfolio_plan memories) rather than guessed. Deliberately
# never includes System Manager or Workspace Manager — either one silently
# defeats ceylon_services' whole lightweight-workspace mechanism for that
# user (see install.py).
CORE_ROLES = [
	"Sales Manager", "Sales User", "Sales Master Manager",
	"Stock Manager", "Stock User", "Item Manager",
	"Purchase Manager", "Purchase User", "Purchase Master Manager",
	"Accounts Manager", "Accounts User",
	"Projects Manager", "Projects User",
	"Support Team",
	"Maintenance Manager", "Maintenance User",
]

ROLE_BUNDLES = {
	"core": CORE_ROLES,
	"core+hr": CORE_ROLES + ["HR Manager", "HR User", "Expense Approver"],
}


def bootstrap_client(
	company_name: str,
	country: str,
	currency: str,
	timezone: str,
	fy_start: str,
	fy_end: str,
	admin_email: str,
	admin_full_name: str,
	admin_password: str,
	bundle: str,
	bank_account: str = "Cash",
	chart_of_accounts: str = "Standard",
):
	"""One-shot bootstrap for a freshly created, apps-already-installed
	client site: completes the Setup Wizard (creates the Company) and
	creates the client's first admin user with the role bundle for
	`bundle`. Consolidates everything learned getting gym-demo's Setup
	Wizard + role sweep right by hand into one tested, idempotent call.

	Intended to be called non-interactively via `bench execute`, not
	pasted into `bench console` — piping multi-line Python into console
	silently lost output on for-loops/try-except during this project's
	manual onboarding work; a real function avoids that entirely:

		bench --site <site> execute ceylon_services.provisioning.bootstrap_client \\
			--kwargs '{"company_name": "...", "country": "...", ...}'

	Safe to re-run: skips the Setup Wizard if already complete, and
	merges in any missing roles if the admin user already exists rather
	than failing or duplicating.
	"""
	if bundle not in ROLE_BUNDLES:
		frappe.throw(
			f"Unknown bundle '{bundle}'. Known bundles: {sorted(ROLE_BUNDLES)}. "
			"Add a new entry to ROLE_BUNDLES only once its role list has been "
			"confirmed live via a real permission sweep — do not guess one in."
		)

	if not frappe.get_system_settings("setup_complete"):
		setup_complete({
			"language": "English",
			"country": country,
			"timezone": timezone,
			"currency": currency,
			"full_name": admin_full_name,
			"company_name": company_name,
			"company_abbr": "".join(w[0] for w in company_name.split())[:5].upper(),
			"company_tagline": f"{company_name} (Ceylon Stack client)",
			"bank_account": bank_account,
			"chart_of_accounts": chart_of_accounts,
			"fy_start_date": fy_start,
			"fy_end_date": fy_end,
		})

	roles = ROLE_BUNDLES[bundle]
	if frappe.db.exists("User", admin_email):
		user = frappe.get_doc("User", admin_email)
		existing = {r.role for r in user.roles}
		for role in roles:
			if role not in existing:
				user.append("roles", {"role": role})
		user.save(ignore_permissions=True)
	else:
		user = frappe.get_doc({
			"doctype": "User",
			"email": admin_email,
			"first_name": admin_full_name,
			"send_welcome_email": 0,
			"roles": [{"role": role} for role in roles],
		})
		user.insert(ignore_permissions=True)
		user.new_password = admin_password
		user.save(ignore_permissions=True)

	frappe.db.commit()

	return {
		"company": frappe.get_all("Company", pluck="name"),
		"admin_email": admin_email,
		"roles": roles,
	}
