#!/usr/bin/env python3
"""Provision one client site end to end, replacing the manual SSH sequence
this project used for every site so far (frontend, gym-demo, every
throwaway test site): bench new-site -> install-app per bundle -> Setup
Wizard + first admin user -> public hostname -> frontend static assets.

Run ON THE HETZNER SERVER, as root (same trust level as every other
infra/scripts/*.sh so far — it shells out to `docker exec` against the
live containers).

Example:
    python3 provision_client.py \\
        --client acme-gym --bundle core+hr \\
        --company-name "Acme Gym" --country "Sri Lanka" --currency LKR \\
        --timezone Asia/Colombo --fy-start 2026-01-01 --fy-end 2026-12-31 \\
        --admin-email owner@acme-gym.test --admin-name "Acme Owner" \\
        --admin-password <generated>

`--db-root-password` defaults to reading the DB_ROOT_PASSWORD env var
(never pass real secrets as a bare CLI arg on a shared server if you can
help it — prefer the env var). Nothing here is a secret itself; this file
is safe to keep in the repo.
"""

import argparse
import json
import subprocess
import sys
from os import environ

# Which apps a bundle installs. Every app listed here must already have
# been `bench get-app`'d onto this bench at least once (a separate,
# deliberate, rare "add a new product to the platform" action — this
# script won't do that automatically, since it also requires a worker
# restart, discovered the hard way rolling HR onto gym-demo).
BUNDLE_APPS = {
	"core": ["erpnext", "ceylon_services"],
	"core+hr": ["erpnext", "ceylon_services", "hrms"],
}

DEFAULT_SERVER_IP = "62.238.22.161"
DEFAULT_BACKEND_CONTAINER = "frappe_docker-backend-1"
DEFAULT_FRONTEND_CONTAINER = "frappe_docker-frontend-1"
BENCH_DIR = "/home/frappe/frappe-bench"


def run(cmd: list[str], **kwargs) -> subprocess.CompletedProcess:
	print(f"$ {' '.join(cmd)}")
	result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
	if result.stdout.strip():
		print(result.stdout.strip())
	if result.returncode != 0:
		print(result.stderr.strip(), file=sys.stderr)
	return result


def docker_exec(container: str, *args: str) -> subprocess.CompletedProcess:
	return run(["docker", "exec", container, *args])


def bench(container: str, *args: str) -> subprocess.CompletedProcess:
	return docker_exec(container, "bash", "-c", f"cd {BENCH_DIR} && bench {' '.join(args)}")


def preflight_check_apps_on_backend(backend: str, apps: list[str]) -> None:
	"""Fail fast, before creating anything, if this bench has never had
	`bench get-app` run for one of these apps. Getting a new product onto
	the bench (pip install + a worker restart) is a deliberate one-time
	ops action, not something this script does silently."""
	missing = []
	for app in apps:
		result = docker_exec(backend, "test", "-d", f"{BENCH_DIR}/apps/{app}")
		if result.returncode != 0:
			missing.append(app)
	if missing:
		print(
			f"\nERROR: this bench has never had these apps installed: {missing}.\n"
			f"Run once, then restart backend/frontend/queue/scheduler/websocket "
			f"containers (a newly pip-installed app isn't importable by already-"
			f"running workers — hit this exact bug rolling HR onto gym-demo):\n"
			f"  docker exec {backend} bash -c 'cd {BENCH_DIR} && bench get-app <app> "
			f"--branch <matching-branch>'\n",
			file=sys.stderr,
		)
		sys.exit(1)


def ensure_frontend_has_app(backend: str, frontend: str, app: str) -> None:
	"""Idempotently (re)copy an app's code + assets symlink into the
	frontend (nginx) container. Cheap, safe to always redo: this project
	saw the `sites/` volume's cross-container visibility behave
	inconsistently for app code more than once, so re-asserting this every
	run is deliberately more robust than trusting it's already there."""
	docker_exec(frontend, "test", "-d", f"{BENCH_DIR}/apps/{app}")
	run(["docker", "cp", f"{backend}:{BENCH_DIR}/apps/{app}", "/tmp/_provision_app_copy"])
	run(["docker", "cp", "/tmp/_provision_app_copy", f"{frontend}:{BENCH_DIR}/apps/{app}"])
	run(["rm", "-rf", "/tmp/_provision_app_copy"])

	# public/ folder name varies (some apps nest an extra dir matching the
	# app name, e.g. ceylon_services/ceylon_services/public); resolve it
	# the same way every prior app in this project needed.
	nested = docker_exec(frontend, "test", "-d", f"{BENCH_DIR}/apps/{app}/{app}/public")
	public_path = f"{BENCH_DIR}/apps/{app}/{app}/public" if nested.returncode == 0 else f"{BENCH_DIR}/apps/{app}/public"
	docker_exec(frontend, "ln", "-sfn", public_path, f"{BENCH_DIR}/sites/assets/{app}")


def ensure_hostname_alias(backend: str, frontend: str, client: str, hostname: str) -> None:
	for container in (backend, frontend):
		docker_exec(container, "ln", "-sfn", f"{BENCH_DIR}/sites/{client}", f"{BENCH_DIR}/sites/{hostname}")


def main() -> None:
	parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
	parser.add_argument("--client", required=True, help="Site name, e.g. acme-gym")
	parser.add_argument("--bundle", required=True, choices=sorted(BUNDLE_APPS))
	parser.add_argument("--company-name", required=True)
	parser.add_argument("--country", required=True)
	parser.add_argument("--currency", required=True)
	parser.add_argument("--timezone", required=True)
	parser.add_argument("--fy-start", required=True)
	parser.add_argument("--fy-end", required=True)
	parser.add_argument("--admin-email", required=True)
	parser.add_argument("--admin-name", required=True)
	parser.add_argument("--admin-password", required=True)
	parser.add_argument("--hostname", help="Defaults to <client>.<server-ip-dashed>.nip.io")
	parser.add_argument("--server-ip", default=DEFAULT_SERVER_IP)
	parser.add_argument("--backend-container", default=DEFAULT_BACKEND_CONTAINER)
	parser.add_argument("--frontend-container", default=DEFAULT_FRONTEND_CONTAINER)
	parser.add_argument("--db-root-password", default=environ.get("DB_ROOT_PASSWORD", "admin"))
	args = parser.parse_args()

	apps = BUNDLE_APPS[args.bundle]
	hostname = args.hostname or f"{args.client}.{args.server_ip.replace('.', '-')}.nip.io"

	print(f"== Pre-flight: checking {apps} exist on {args.backend_container} ==")
	preflight_check_apps_on_backend(args.backend_container, apps)

	print(f"\n== Creating site {args.client} ==")
	result = bench(
		args.backend_container,
		"new-site", args.client,
		"--mariadb-user-host-login-scope='%'",
		f"--admin-password={args.admin_password}",
		"--db-root-username=root",
		f"--db-root-password={args.db_root_password}",
		"--install-app erpnext",
	)
	if result.returncode != 0:
		sys.exit(1)

	non_core_apps = [app for app in apps if app != "erpnext"]
	for app in non_core_apps:
		print(f"\n== Installing {app} ==")
		result = bench(args.backend_container, "--site", args.client, "install-app", app)
		if result.returncode != 0:
			sys.exit(1)

	if non_core_apps:
		# ceylon_services' after_install only fires for ceylon_services'
		# own install — a later install-app for another bundle app (e.g.
		# hrms) does not re-trigger it, so its workspace allow-list never
		# picks up the new app's workspaces without an explicit migrate.
		# Confirmed live: skipping this step left Recruitment/Tenure/
		# Performance visible on a freshly provisioned core+hr site.
		print("\n== Migrating (so ceylon_services re-curates workspaces for the newly installed apps) ==")
		result = bench(args.backend_container, "--site", args.client, "migrate")
		if result.returncode != 0:
			sys.exit(1)

	print("\n== Bootstrapping Company + admin user (ceylon_services.provisioning.bootstrap_client) ==")
	kwargs = json.dumps({
		"company_name": args.company_name,
		"country": args.country,
		"currency": args.currency,
		"timezone": args.timezone,
		"fy_start": args.fy_start,
		"fy_end": args.fy_end,
		"admin_email": args.admin_email,
		"admin_full_name": args.admin_name,
		"admin_password": args.admin_password,
		"bundle": args.bundle,
	})
	result = bench(
		args.backend_container, "--site", args.client, "execute",
		"ceylon_services.provisioning.bootstrap_client",
		"--kwargs", f"'{kwargs}'",
	)
	if result.returncode != 0:
		sys.exit(1)

	print(f"\n== Ensuring frontend ({args.frontend_container}) can serve {apps} ==")
	for app in apps:
		ensure_frontend_has_app(args.backend_container, args.frontend_container, app)

	print(f"\n== Aliasing hostname {hostname} ==")
	ensure_hostname_alias(args.backend_container, args.frontend_container, args.client, hostname)

	print(
		f"\n== Done ==\n"
		f"URL:   http://{hostname}:8080\n"
		f"Login: {args.admin_email} / <the password you passed>\n"
	)


if __name__ == "__main__":
	main()
