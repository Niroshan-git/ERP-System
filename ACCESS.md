# ACCESS.md — Server, Repo & Command Reference

Safe to keep in this repo / project folder — contains no actual passwords, keys, or secret values. Anywhere a real credential is needed, it's noted as "→ password manager" instead.

## Server

- **Provider:** Hetzner Cloud
- **Server name:** `ubuntu-4gb-hel1-4`
- **Location:** Helsinki (`eu-central`)
- **Specs:** CX23 — 2 vCPU / 4GB RAM / 40GB SSD
- **OS:** Ubuntu 26.04
- **Public IP:** `62.238.22.161`
- **SSH user:** `root`
- **SSH key:** `id_ed25519` — private key lives ONLY on your local machine at `~/.ssh/id_ed25519` (Windows: `$env:USERPROFILE\.ssh\id_ed25519`). Never copy this file anywhere else.

### Connect via SSH
```
ssh -i $env:USERPROFILE\.ssh\id_ed25519 root@62.238.22.161
```
(Run from PowerShell. Once connected, you're in a bash shell on the server itself.)

## ERPNext

- **URL:** http://62.238.22.161:8080
- **Login:** Administrator
- **Password:** → password manager (was the `pwd.yml` default `admin` — **change this if you haven't yet**, then update your password manager entry)
- **Deployed via:** `frappe_docker` quick-start (`pwd.yml`), cloned to `~/frappe_docker` on the server

### Container names (for `docker exec` / VS Code Dev Containers "Attach to Running Container")
- `frappe_docker-backend-1` — this is the one you attach to for development (has the bench + apps)
- `frappe_docker-frontend-1`
- `frappe_docker-db-1` (MariaDB)
- `frappe_docker-redis-cache-1`
- `frappe_docker-redis-queue-1`
- `frappe_docker-create-site-1` (one-off, already exited after setup)

### Useful docker compose commands (run from `~/frappe_docker` on the server)
```
docker compose -f pwd.yml ps                          # check container status
docker compose -f pwd.yml logs -f backend              # tail backend logs
docker compose -f pwd.yml restart backend frontend     # restart after changes
docker compose -f pwd.yml down                         # stop everything (data persists in volumes)
docker compose -f pwd.yml up -d                        # start everything back up
```

## GitHub

- **Repo:** https://github.com/Niroshan-git/ERP-System.git
- **Contains:** the `smart_factory` custom Frappe app code only — never ERPNext/Frappe core itself
- **Auth:** → password manager (Personal Access Token, or SSH key if you set up the SSH remote instead)

### Git workflow (run inside the container, via VS Code's attached terminal)
```
cd apps/smart_factory
git add .
git status                          # ALWAYS check before committing — confirm .env isn't listed
git commit -m "describe the change"
git push
```

## VS Code Workflow

1. Command Palette → **Remote-SSH: Connect to Host** → `root@62.238.22.161`
2. Once connected, Command Palette → **Dev Containers: Attach to Running Container** → `frappe_docker-backend-1`
3. You're now editing live inside the container at `/home/frappe/frappe-bench/apps/smart_factory`
4. Integrated terminal here is bash — all commands above work directly, no PowerShell syntax needed

## Secrets — Where They Actually Live

None of the following are in this repo or any `.md` file. All in a password manager (Bitwarden/1Password):
- Hetzner account login + 2FA recovery codes
- ERPNext Administrator password (once changed from default)
- GitHub Personal Access Token / SSH key passphrase (if set)
- Future: Postgres (Supabase/Neon) credentials, MQTT broker credentials, ERPNext API key/secret

The `.env` file (excluded via `.gitignore`) holds the *working copy* of service credentials for local/container use — but the password manager is always the source of truth if it ever needs to be recreated.
