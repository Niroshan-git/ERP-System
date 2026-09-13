# infra/docker

Docker Compose configuration for this project's deployment on the Hetzner
server — currently based on `frappe_docker`'s `pwd.yml` quick-start
(see CLAUDE.md for server details). Put any project-specific compose
overrides or environment files (as `.env.example`, never real secrets) here
as the setup evolves past the quick-start defaults.

## `pwd.yml`

A checked-in copy of the live server's actual compose file
(`/root/frappe_docker/pwd.yml` on the Hetzner box), pulled in specifically
so one critical, easy-to-lose fix survives a server rebuild:

- **`frontend.environment.FRAPPE_SITE_NAME_HEADER` is `$host`, not the
  stock quick-start's hardcoded `frontend`.** Without this, Frappe's site
  resolution (`frappe/app.py`: `X-Frappe-Site-Name` header takes priority
  over the actual `Host` header) always resolves every request to one
  site regardless of hostname — multi-site hosting silently does not work
  at all otherwise (every browser request quietly serves the default
  site's content, even for a different site's URL). Confirmed live: this
  bit us once already (a full multi-tenant test looked like it worked via
  `curl`/HTTP-200 checks, but was actually silently serving the wrong
  site the whole time until this was found and fixed).
- If the server is ever rebuilt from scratch, restore this exact `pwd.yml`
  (or at minimum reapply this one env var change) before assuming
  multi-site hosting works — the quick-start's own default breaks it.
- `MYSQL_ROOT_PASSWORD`/`MARIADB_ROOT_PASSWORD: admin` here are
  `frappe_docker`'s own well-known public quick-start defaults, not a
  secret generated for this project — still needs changing before any
  real client traffic touches this server, same standing flag as the
  Administrator password (see PROGRESS.md).
- Known separate, still-open gap visible in this file: `deploy.
  restart_policy` is a Docker **Swarm**-mode setting and does nothing
  under plain `docker compose up` — this is why containers didn't
  auto-restart after the earlier server reboot incident. The real fix is
  a top-level `restart: unless-stopped` per service, not yet applied.
