### Ceylon Services

Ceylon Stack customizations for ERPNext: Desk theming/branding (reusing the
same visual identity as `smart_factory`) for service and retail clients —
gym, salon, hardware store, supermarket — plus hiding the Manufacturing
workspace, which is irrelevant to them. See `hooks.py` and `boot.py` for
the branding mechanism (identical to `smart_factory`'s), and `install.py`
for the workspace-hiding logic.

### Installation

This app is exported to its own branch of the main `ERP-System` repo (not
a separate repo) via `infra/scripts/sync-app-branch.sh ceylon_services` —
see that repo's `README.md` "App branches" section for why. On any bench:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app https://github.com/Niroshan-git/ERP-System.git --branch ceylon_services
bench --site <site> install-app ceylon_services
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/ceylon_services
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### License

Proprietary
