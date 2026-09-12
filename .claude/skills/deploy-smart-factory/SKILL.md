---
name: deploy-smart-factory
description: Deploy a code change in the smart_factory Frappe app (or any app change) to the live Hetzner instance — the docker cp + restart sequence, in the right order, with the gotchas that break it if skipped. Use whenever smart_factory code changed locally and needs to reach the live site, or when smart_factory's presence on the server needs verifying after a container recreation.
---

# Deploy smart_factory to the live server

This is a manual stopgap (see `PROGRESS.md` / `CLAUDE.md`) — `frontend` (nginx)
and `backend` are separate filesystems, so a code change has to be copied
into **both** containers, not just one. Before this goes near real client
traffic, replace this with a proper custom Docker image build; until then,
this is the correct sequence.

## When to run this

- Any time files under `apps/smart_factory/` change and need to reach the
  live site.
- After `frontend` or `backend` is recreated (not just restarted) — their
  filesystem layers don't persist `smart_factory`, so it silently
  disappears and needs re-copying.

## Steps

1. **Sync the code to `backend`.**
   ```
   ssh root@62.238.22.161 "docker cp <local_or_repo_path>/smart_factory frappe_docker-backend-1:/home/frappe/frappe-bench/apps/smart_factory"
   ```
   (Adjust the source path to wherever the current working copy of the app
   lives on the machine running this — repo checkout or a scratch copy.)

2. **Reinstall / migrate on `backend`** if DocTypes, hooks, or `pyproject`
   dependencies changed:
   ```
   docker exec -i frappe_docker-backend-1 bench --site frontend migrate
   ```
   Skip this step for a pure CSS/JS-only change.

3. **Restart backend processes.** Required after *any* change — editable
   installs are only re-read at interpreter startup, so skipping this
   breaks every web request site-wide (`ModuleNotFoundError`) until it's
   done:
   ```
   docker compose -f pwd.yml restart backend queue-short queue-long scheduler websocket
   ```

4. **Copy static assets to `frontend`** (only needed if `public/css` or
   `public/js` changed, or this is the app's first deploy ever):
   ```
   docker cp <local_or_repo_path>/smart_factory frappe_docker_frontend_1:/home/frappe/frappe-bench/apps/smart_factory
   ```
   On a **first-ever** deploy of a new app, also create the matching
   symlink inside `frontend` so `sites/assets` resolves it:
   ```
   docker exec -i frappe_docker_frontend_1 ln -s /home/frappe/frappe-bench/apps/smart_factory/smart_factory/public /home/frappe/frappe-bench/sites/assets/smart_factory
   ```

5. **Clear cache and verify.**
   ```
   docker exec -i frappe_docker-backend-1 bench --site frontend clear-cache
   curl -I http://62.238.22.161:8080
   ```
   A `200` confirms the site is serving. For a CSS/JS change, hard-refresh
   a browser tab against the live URL to confirm the new asset actually
   loaded (check Network tab for a fresh, non-404 response) rather than
   trusting cache-clear alone.

## If containers crash-loop after this

`frontend`/`websocket` can briefly crash-loop if they came up before
`backend`/`redis-queue` were ready (`host not found in upstream
"backend:8000"`, `getaddrinfo EAI_AGAIN redis-queue`). This is a boot-order
race, not a real failure — fix with:
```
docker compose -f pwd.yml restart frontend websocket
```
once the rest of the stack reports healthy, then re-verify with `curl -I`.

## Do not

- Do not treat this as safe against `frontend`/`backend` **recreation**
  (`docker compose up -d --force-recreate`, or a fresh `pwd.yml` pull) —
  both copies are lost and need re-running from step 1.
- Do not skip step 3 to save time — a skipped restart takes the whole site
  down for every user, not just smart_factory features.
- Do not modify any file under an ERPNext/Frappe core app during this
  process. If a fix seems to require that, stop and flag it instead.
