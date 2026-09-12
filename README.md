### Smart Factory

Ceylon Stack customizations for ERPNext: Desk theming/branding overrides now, Manufacturing/OEE business logic later

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch main
bench install-app smart_factory
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/smart_factory
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### License

Proprietary

---

## Local dev notes (pre-pull placeholder history)

The section below is the original placeholder content that lived in this
folder before the real app (created via `bench new-app` on the Hetzner
server, 2026-09-12) was pulled into the monorepo on 2026-09-13. Kept here
for history/context only — steps 1-4 below are done; see `PROGRESS.md` for
the actual log.

# smart_factory (Frappe custom app)

**Not yet created.** This folder is a placeholder for where the real app
lands once you run:

```
bench new-app smart_factory
```

This must be run inside a Frappe bench environment (the `frappe_docker`
backend container, or a local bench if you set one up), because `bench`
generates a specific directory structure and hooks Frappe needs — it can't
be hand-built here.

### Plan (per PLAN.md, Week 3–4)

1. Set up VS Code Remote-SSH + Dev Containers, attach to `frappe_docker-backend-1`
2. `bench new-app smart_factory` inside the container
3. Copy/sync the generated app folder into this location (or symlink /
   mount it, depending on your dev workflow) so it's version-controlled
   here alongside the rest of the monorepo
4. `bench --site <site> install-app smart_factory`
5. Add custom DocTypes here (e.g. Machine, Sensor Reading, OEE fields on Job Card)

### Ground rules

- Never edit ERPNext/Frappe core files — everything custom lives here.
- No real secrets, passwords, or API keys in this folder — use environment
  variables / a password manager reference instead.
