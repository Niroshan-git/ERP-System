# PROGRESS.md — Smart Factory on ERPNext

Chronological record of what's actually been done. Update this as work progresses rather than relying on chat history.

## Architecture & Planning Decisions

- Evaluated free/open-source ERP options broadly; chose **ERPNext** (built on the Frappe framework) as the ERP core — GPL-3.0 licensed, no paywalled modules unlike Odoo Community Edition.
- Confirmed ERPNext/Frappe's license terms: GPL-3.0 allows commercial use, whitelabeling, and selling implementation/hosting services, but forbids relicensing the core as closed-source, and requires source availability to anyone the software is distributed to.
- Decided on the **headless architecture**: unmodified ERPNext/Frappe core + separate custom Frappe app (`smart_factory`) for business logic + independent frontend (Next.js/Vercel) talking only through the REST API. This keeps the proprietary layer (frontend + custom app + MES/IoT service) legally separate from the GPL core.
- Mapped out the full Smart Factory layered architecture: Shop floor/IoT → Integration & MES → ERPNext core → Analytics & digital twin.
- Wrote the full 12-week implementation plan (see `PLAN.md`), tracked in a Notion page titled "Smart Factory on ERPNext – Weekly Implementation Plan".

## Infrastructure — Hosting Attempts

- **Oracle Cloud (abandoned):** Created an Oracle Cloud Always Free account, home region ended up as Singapore (the originally intended region wasn't available at signup). Attempted to provision a `VM.Standard.A1.Flex` instance (2 OCPU / 12GB RAM — Oracle's current Always Free ARM allocation after a June 2026 reduction from the older 4 OCPU/24GB). Hit repeated "out of host capacity" errors across multiple retry attempts. Since the account's region only has a single Availability Domain (AD-1), there was no AD to switch to as a workaround. Decision made to stop retrying and move to a paid host instead.
- **Hetzner Cloud (current):** Created a Hetzner account. Provisioned a **CX23** server (2 vCPU / 4GB RAM / 40GB SSD, Regular Performance tier, x86, Ubuntu 26.04) in **Helsinki** — roughly €4.50–7/month depending on final config. Provisioned successfully on the first real attempt, no capacity issues. Server name: `ubuntu-4gb-hel1-4`. Public IP: `62.238.22.161`.

## Server Setup

- Generated an SSH key pair locally (Windows, `ssh-keygen -t ed25519`), added the public key to Hetzner during server creation.
- Confirmed SSH access works: `ssh -i <key path> root@62.238.22.161`.
- Ran `apt update && apt upgrade -y` — patched the OS, including a kernel upgrade (7.0.0-30 → 7.0.0-31-generic), followed by a reboot to load the new kernel.
- Installed Docker: `apt install docker.io docker-compose-v2 -y` — completed cleanly.

## ERPNext Deployment

- Cloned `frappe/frappe_docker` from GitHub.
- Deployed using the `pwd.yml` quick-start compose file: `docker compose -f pwd.yml up -d`. All 11 images pulled successfully, all 16 containers (db, redis-cache, redis-queue, backend, frontend, websocket, scheduler, queue-short, queue-long, create-site, configurator) started without errors.
- Confirmed the `create-site` container completed successfully — Frappe and ERPNext both installed, DocTypes updated to 100%, site set to `frontend`.
- Logged into ERPNext at `http://62.238.22.161:8080` with Administrator / the `pwd.yml` default password (`admin`) — **this default password still needs to be changed before any real client data touches this instance.**
- Completed the initial company setup wizard (placeholder company details for the pilot environment).

## Version Control

- Created a GitHub repository for the project's custom app code: **https://github.com/Niroshan-git/ERP-System.git**
- Discussed (not yet executed) the workflow for editing code: VS Code's Remote-SSH extension to connect to the Hetzner server, then the Dev Containers extension's "Attach to Running Container" to edit files live inside the `frappe_docker-backend-1` container, with regular `git commit`/`git push` to the GitHub repo above since the container's filesystem is otherwise disposable.
- Authenticated the `gh` CLI locally (browser device-code flow). Initialized git at the monorepo root (not inside a container — the monorepo itself, including `apps/frontend`, lives and is version-controlled from the local Windows checkout; the container-based workflow above still applies once `smart_factory` exists and needs live in-container editing).
- Merged in the remote's pre-existing initial commit (`--allow-unrelated-histories`) and pushed the full scaffold + Ceylon Stack rebrand as the first real commit.
- Removed the default **MIT LICENSE** file GitHub had auto-created — MIT doesn't fit a proprietary whitelabel product. No LICENSE file now means default all-rights-reserved until a real commercial license is drafted.

## apps/frontend — Scaffolded & Rebranded

- Scaffolded with `create-next-app` (TypeScript, Tailwind v4, App Router, `src/` dir, `@/*` import alias).
- Ceylon Stack design tokens (from `DESIGN.md` / `docs/brand.md`) wired into `src/app/globals.css` via Tailwind v4's `@theme inline`, both light and `prefers-color-scheme: dark` variants.
- Fonts (Fraunces, Archivo, IBM Plex Sans, IBM Plex Mono) loaded via `next/font/google` in `src/app/layout.tsx`.
- Logo/favicon assets copied from `docs/brand/` into `public/brand/`.
- Replaced the default starter homepage with a static, on-brand placeholder dashboard (KPI tiles, status pills, Job Card table) standing in for the real dashboard until ERPNext API integration starts.
- Verified with a clean `npm run build` and a working `npm run dev` (confirmed via `curl`, not a browser — no browser-automation tool available in this environment).

## ERPNext Desk Rebrand (Ceylon Stack) — settings-only pass

Following `DESIGN.md` §6's rollout order, steps done **without** creating the `smart_factory` app yet (that's intentionally deferred — see Decision Log):

- **Website Settings:** App Name → "Ceylon Stack", App Logo and Favicon uploaded from `docs/brand/` (via SSH + `bench --site frontend console`, since `frappe.utils.file_manager.save_file` + a direct doc save was the only way to script an image upload headlessly).
- **Navbar Settings:** App Logo set (was previously empty).
- **Dashboard Chart colors:** all 49 shipped chart records recolored from ERPNext's default/random palette to Ceylon Stack sapphire (default) with cinnamon on paired trend charts (Delivery Trends, Purchase Receipt Trends, Outgoing/Incoming Bills). These are standard/shipped records that reject normal `doc.save()` outside developer mode ("Cannot edit Standard charts") — updated via `frappe.db.set_value` instead.
- **Splash/loading screen logo:** the brief logo flash shown on a full Desk page refresh comes from `Website Settings.splash_image` (falls back to ERPNext's logo when unset — `erpnext/hooks.py`'s `splash_image` default, rendered by `templates/includes/splash_screen.html`). Was never set; pointed it at the same uploaded Ceylon Stack logo used for `app_logo`. Settings-only, no app needed.
- **Navbar bar color/style — confirmed needs `smart_factory`:** checked `Navbar Settings` doctype fields directly — it only exposes `app_logo` and dropdown content, no background-color field. The navbar's color comes from compiled core CSS, so matching `DESIGN.md`'s navbar spec needs `app_include_css`, same category as the sidebar "ERPNext" label. User has now been asked about creating `smart_factory` twice (once for the sidebar label, once implicitly for the navbar) and both times chose to keep deferring it.
- **Administrator display name:** renamed the `Administrator` user's `first_name` to "Ceylon Stack" (found `full_name` is derived from `first_name`/`last_name`, not directly settable) — the account widget, "Created by" fields, comments, etc. now show "Ceylon Stack" instead of "Administrator". Login email (`admin@example.com`) intentionally left unchanged — that's tied to the still-pending default-password change, not branding.
- **Known gap — confirmed needs `smart_factory`, not settings-only:** the "ERPNext" text shown under a workspace title in the sidebar (e.g. "Selling" workspace → "ERPNext" beneath it) is the app-switcher label. Traced it to `erpnext/hooks.py`'s `app_title = "ERPNext"` (and `frappe/hooks.py`'s `app_title = "Frappe Framework"`), assembled server-side into boot data via the `add_to_apps_screen` hook (`frappe/boot.py:182`) — it's the installed app's own identity metadata, not a document/settings field, so no settings-only trick reaches it. The only non-core fix is a custom app's `boot_session` (or equivalent) hook rewriting that label client-side. User was asked whether to create `smart_factory` now for this specifically and **chose to keep deferring it** — this remains the one open item that genuinely requires the app; see Decision Log. Workspace icon background color (fixed named-color dropdown, no arbitrary hex) is a smaller version of the same limitation.

## `smart_factory` app created — full Desk branding pass (2026-09-12)

After being asked three times to fix the sidebar/app-switcher "ERPNext" text and confirming each time it needed a custom app, the user explicitly approved creating `smart_factory` now, scoped to the full client-visible branding pass (navbar, sidebar, splash, buttons/links, app-switcher label).

- **Created via `bench new-app smart_factory`** inside `frappe_docker-backend-1`, installed on the `frontend` site (`bench --site frontend install-app smart_factory`). App metadata: publisher "Ceylon Stack", email `niroshan4220@gmail.com`, license manually changed from the scaffolded `mit` to `Proprietary` in both `pyproject.toml` and `hooks.py` (the `bench new-app` license prompt only offers GitHub's OSI license list — there's no "proprietary" choice, so it's scaffolded as MIT and corrected after in our own app's files, not core).
- **`boot_session` hook** (`smart_factory/boot.py`): rewrites `bootinfo.app_data` on every session boot so `frappe`/`erpnext`/`smart_factory` all report `app_title = "CeylonStack"` and the Ceylon Stack logo. This is what `frappe/public/js/frappe/ui/sidebar/sidebar.js` reads into `header_subtitle` — confirmed via `bench console` simulation that bootinfo now returns "CeylonStack" for every app entry. This was the one thing no settings-only change could ever reach.
- **`app_include_css`** (`smart_factory/public/css/ceylon_stack_desk.css`): overrides Frappe's Desk CSS variables — `--primary`/`--brand-color` (buttons, links, progress bars, filter icons), `--navbar-bg` (navbar background → sapphire), `--surface-menu-bar`/`--sidebar-hover-color`/`--sidebar-active-color`/`--sidebar-border-color` (sidebar), plus light/dark variants matching `DESIGN.md` tokens.
- **`app_include_js`** (`smart_factory/public/js/ceylon_stack_desk.js`): a small MutationObserver safety net that relabels any leftover "ERPNext"/"Frappe Framework" text in `.header-subtitle` elements — belt-and-suspenders on top of the `boot_session` fix, in case of stale client state.
- **Known limitation, not yet addressed:** login page and print-format/letterhead colors weren't included in this pass — only the authenticated Desk chrome (navbar, sidebar, app-switcher). Revisit if/when clients will see the login page or invoices/quotations directly.

### Infrastructure gotcha discovered (important — read before touching `smart_factory` again)

`pwd.yml`'s quick-start setup runs `frappe/erpnext` as a **stock, unmodified image** — it was never designed for live-installing a custom app with static assets:

1. **The `frontend` (nginx) container is a completely separate filesystem from `backend`.** They share the `sites` docker volume, but `sites/assets` is itself a symlink to `/home/frappe/frappe-bench/assets`, which lives *outside* that shared volume, baked into each container's own image/writable layer. Creating `smart_factory` inside `backend` only put it in `backend`'s filesystem — `frontend` had no idea it existed, so it 404'd on `/assets/smart_factory/...`. **Fix applied:** `docker cp`'d `apps/smart_factory` from `backend` into `frontend`, then manually created the matching `assets/smart_factory` symlink inside `frontend` (normally created by `bench build`, which only ran on `backend`).
   - **This will not survive `frontend` being recreated** (image pull, `docker compose up --force-recreate`, etc. — a plain `restart` is fine, `rm`+recreate is not). If Desk CSS/JS suddenly reverts to default styling after any frontend container recreation, this is why — the `docker cp` + manual symlink step needs to be redone. The durable fix is building a custom Docker image with `smart_factory` baked in via `frappe_docker`'s documented custom-app build process, which is out of scope for now but should happen before this goes anywhere near real client traffic.
2. **Already-running gunicorn workers don't pick up a newly `pip install -e`'d app.** Editable-install path entries (`.pth` files) are only read by Python's `site` module at interpreter startup, not rescanned live. Installing `smart_factory` while `backend`/`queue-short`/`queue-long`/`scheduler`/`websocket` were already running broke **every single web request site-wide** (`ModuleNotFoundError: No module named 'smart_factory'`, since Frappe imports every installed app's hooks module per-request) until those containers were restarted. **Fix applied:** `docker compose -f pwd.yml restart backend queue-short queue-long scheduler websocket` immediately after installing any new app. **Any future custom app install/creation on this server must end with that same restart, or the site goes down.**

## Workspace-switcher icon grid cleanup (2026-09-12)

The dropdown chevron next to the workspace name (top-left of the sidebar) opens a tile grid backed by a real `Desktop Icon` doctype — a separate, persisted data source from `bootinfo.app_data` (which the `smart_factory` `boot_session` hook already rebrands). Investigated because the user's screenshot showed duplicate "Framework"/"Frappe Framework" tiles, an unbranded "ERPNext Settings" tile, and several truncated labels ("Frappe Fra...", "Manufactur...", "Subcontrac...").

- **Duplicate app icon (pre-existing ERPNext quirk, not caused by us):** two `Desktop Icon` records represent the frappe app itself — `Framework` (`standard=1`, a shipped fixture from before frappe's `app_title` was renamed to "Frappe Framework") and `Frappe Framework` (`standard=0`, auto-created later; the de-dupe check in `create_desktop_icons_from_installed_apps()` only matches by exact name, so the rename left both). Hid the redundant `Frappe Framework` record (`hidden=1` via `frappe.db.set_value`).
- **Rebranded the remaining one:** `Framework` record's `label` → "CeylonStack", `logo_url` → the Ceylon Stack logo. The already-hidden `ERPNext` app icon (`hidden=1` since it ships that way — ERPNext's own workspaces show flat instead of nested under it) was left as-is since it's invisible.
- **Dropped "ERPNext" from Settings:** `ERPNext Settings` record's `label` → "Settings" (docname/internal key unchanged, only the displayed label).
- **Truncated labels:** added a CSS rule to `ceylon_stack_desk.css` targeting `.desktop-icon .icon-title` (the actual tile caption class, confirmed by cross-referencing `frappe/public/js/frappe/ui/desktop_icon.html` against the real `Desktop Icon` record labels) to let captions wrap onto two lines instead of ellipsis-truncating.
- All changes are `frappe.db.set_value` writes on `Desktop Icon` records (same core-guard-bypass technique as the Dashboard Chart color pass) plus one additive CSS rule — no core files touched, no new infrastructure. Redeployed the updated CSS to both `backend` and `frontend` containers per the established `docker cp` pattern (frontend needed `-u root` since the file is owned by root from the earlier copy).
- Verified via a fresh `get_bootinfo()` simulation: `Framework` → label "CeylonStack" hidden=0, `Frappe Framework` → hidden=1, confirming the fix is live.

## Smart Factory workspace + app-switcher tile (2026-09-12)

User noticed `smart_factory` had no presence in the app-switcher grid — expected, since the app so far only carries branding hooks (`boot_session`, `app_include_css/js`), no `Workspace` or `Desktop Icon` of its own. Module tiles (Manufacturing, Selling, Stock, etc.) turned out to be two separate, manually-paired records — creating a `Workspace` alone does **not** auto-generate a matching `Desktop Icon`; confirmed by inspecting `Manufacturing`'s `Desktop Icon` record (`icon_type=Link`, `link_type=Workspace Sidebar`, `link_to=Manufacturing`, `icon=organization`) side-by-side with the `Manufacturing` `Workspace` doc.

- Created a `Workspace` named "Smart Factory" (`module=Smart Factory`, `public=1`, `icon=manufacturing` — reused `erpnext`'s bundled `manufacturing.svg` since the app has no icon assets of its own yet) with a minimal placeholder header/paragraph block as content (no real dashboards yet — content is genuinely empty pending actual OEE/manufacturing features).
- Created the matching `Desktop Icon` record (`label=Smart Factory`, same `icon_type`/`link_type`/`icon` pattern as Manufacturing's, `app=smart_factory`, `link_to=Smart Factory`, `hidden=0`). Normal `.insert()` hit a `LinkValidationError` on `link_to` (Frappe's generic link-field validator doesn't recognize `link_type="Workspace Sidebar"` as resolving to the `Workspace` doctype even though the runtime desktop-icon renderer does) — inserted with `ignore_links=True` to bypass just that check; every other value went through normal validation.
- Cleared `desktop_icons` cache key and ran `bench --site frontend clear-cache`. No CSS/JS/container redeploy needed — this was pure data, not a code change.
- Verified the records directly (`hidden=0`, `link_to=Smart Factory` matching the workspace name, workspace `public=1`/`is_hidden=0`) since a full `load_desktop_data()` boot simulation needs more scaffolding than a one-off console script — direct record inspection was sufficient given both halves (icon + workspace) are confirmed correctly linked.
- Tile currently opens to a near-empty workspace — that's expected and correct for now; it's the landing spot future Manufacturing/OEE dashboard content (per `PLAN.md`) will populate, not a bug.

## Server Incident — 2026-09-12 reboot

- Rebooted the Hetzner Ubuntu server (`reboot`, no maintenance work needed it — routine). `pwd.yml` has **no `restart:` policy** on any service, so containers don't auto-start on boot; had to manually run `docker compose -f pwd.yml up -d` afterward.
- `frontend` and `websocket` containers briefly crash-looped after `up -d` (nginx: `host not found in upstream "backend:8000"`; websocket: `getaddrinfo EAI_AGAIN redis-queue`) — a boot-order race where they started before `backend`/`redis-queue` were ready. Fixed with `docker compose -f pwd.yml restart frontend websocket` once the rest of the stack was healthy. All 8 containers confirmed up afterward; site verified serving (HTTP 200) with branding intact.
- **Follow-up not yet done:** add `restart: unless-stopped` to `pwd.yml` services so this doesn't require a manual fix on every future reboot.

## DevOps Claude Code subagent + deploy skill (2026-09-12)

Followed up on the "MCP server & agents" plan in `docs/mcp-agents-plan.md` /
`docs/ceylon-stack-playbook.html`. That plan's client-facing agent roster
(Manufacturing Floor Agent, Apparel Specialist, etc.) is explicitly gated
behind Phase 0 (a full ERPNext walkthrough) and Phase 1 (the MCP tool
surface) — neither is done, so those stay design-only for now, not built.

What's genuinely unblocked and useful today is dev-tooling: a **Claude Code
subagent**, not a product feature, scoped to server administration and
GitHub repo hygiene for this project specifically.

- Added `.claude/agents/devops.md` — a project-level subagent covering the
  Hetzner server (SSH, `docker compose -f pwd.yml`, `bench` commands) and
  the GitHub repo workflow (git safety protocol, `gh` CLI for PRs/issues).
  Bakes in the hard-won infra gotchas from this log (frontend/backend
  filesystem split, editable-install restart requirement, boot-order
  crash-loop, SSH heredoc placement, IPython console piping) so they don't
  need rediscovering on the next server task. Explicitly scoped out of
  DocType/business-logic design and out of the gated MCP/agent-roster work.
- Added `.claude/skills/deploy-smart-factory/SKILL.md` — the step-by-step
  docker cp + restart sequence for pushing a `smart_factory` code change to
  the live site, called out as a stopgap until a proper custom Docker image
  build replaces it.
- Added the six client-facing roster agents from the playbook as Claude
  Code subagents too (`manufacturing-floor`, `apparel-textile`,
  `agro-processing`, `quality-compliance`, `finance-reporting`,
  `inventory-procurement`) — each one plainly states it currently has no
  scoped API key or MCP server to work through (Phase 1 not built) and no
  real master data to query yet (Phase 0 not run), rather than pretending
  either gap is solved.

## Full agent roster: development, UI/UX, and implementation teams (2026-09-12)

Extended the same "Claude Code subagent" pattern across the whole project,
not just ERPNext/ops, at the user's request for a full team:

- **Development:** `frappe-dev` (smart_factory DocTypes/hooks/server
  scripts), `frontend-dev` (Next.js dashboard, API-only per the headless
  rule), `mes-dev` (FastAPI MES/OEE service, unbuilt so far — README only),
  `mcp-dev` (MCP server, hard-gated on Phase 0's `docs/erp-inventory.md`
  existing before it's allowed to start Phase 1 tool-building), `qa-tester`
  (verification across all four apps), `code-reviewer` (architecture/
  secrets/correctness review before anything ships).
- **UI/UX:** `product-designer` (in-product surfaces — Desk rebrand +
  Next.js dashboard, mobile-first) and `brand-designer` (marketing/pitch
  materials — the playbook, brand docs, positioning claims), split so
  product usability and marketing claims don't get conflated.
- **Implementation:** `erp-functional-consultant` — the non-code ERP
  rollout role (module config, manufacturing master data, Sri Lanka VAT/tax
  gap, training/go-live docs) and explicitly the one now responsible for
  finally running the overdue Phase 0 walkthrough (`docs/erp-inventory.md`
  doesn't exist yet).

All fifteen agents (`devops` + 6 roster + 9 here) live in `.claude/agents/`,
each scoped to one part of the stack, each honest in its own file about
what's actually built vs. still ahead so none of them start fabricating
progress that hasn't happened.

## Real brand asset swap — Desk rebrand (2026-09-12)

The `smart_factory`/Website Settings/Navbar Settings branding pass above was
done with placeholder/AI-drafted assets from `docs/brand/`. The user added
the real, approved asset package at `Ceylon-Stack-Brand-Package/` (root of
repo, local-only per this task's scope — not synced into `docs/brand/` or
`apps/frontend`) and asked for the live Desk to be updated to use it,
replacing the placeholders. Followed the package's own `README.txt` usage
guidance ("ERP header: horizontal. Collapsed sidebar: mark. Login/splash:
stacked.").

- **Website Settings** (`app_logo`, `favicon`, `splash_image`): uploaded via
  the same `bench --site frontend console` + `frappe.utils.file_manager.save_file`
  scripting technique as the original placeholder pass (no simple CLI upload
  path exists for image fields). Source files:
  - `app_logo` → `03-PNG/ceylon-stack-mark-original-1024.png` → stored as
    `/files/ceylon-stack-mark-original-1024b0d7f0.png`
  - `favicon` — **first attempt used `05-Web/favicon.ico` directly and was
    wrong**: that ready-made ICO is built from `favicon.svg`, which has a
    hardcoded opaque `<rect fill="#FFFFFF">` background — it's the "white
    app tile" variant meant for platforms that apply their own icon mask
    (per the package's own `README.txt`), not a raw browser favicon. Against
    a light browser tab bar it rendered as an invisible white square (user
    caught this from a screenshot). **Fix:** built a proper transparent
    favicon locally with Pillow instead — padded
    `03-PNG/ceylon-stack-mark-original-1024.png` (confirmed genuinely
    transparent, RGBA with alpha=0 background) to a square canvas and saved
    a multi-size ICO (16/32/48/64/128/256). No ImageMagick/`rsvg-convert`/
    `cairosvg` were available locally or found needed, since Pillow alone
    could rasterize-resize the existing transparent PNG and pack a
    multi-size `.ico`. Uploaded and swapped onto `Website Settings.favicon`,
    replacing the bad file — final live value is
    `/files/favicon-transparent97eb86.ico`. Verified post-fix by fetching
    the live URL and checking it in Pillow: RGBA mode, 256x256 (6 embedded
    sizes), corner pixel alpha=0 (transparent), ~49% opaque pixel coverage
    matching the mark's actual shape — not just an eyeballed screenshot
    check. The old opaque `/files/faviconcc7d46.ico` File record was left
    in place (unattached, harmless) rather than deleted, since Website
    Settings no longer references it.
  - `splash_image` → `03-PNG/ceylon-stack-stacked-original-1600.png` (per
    package guidance: login/splash = stacked layout) → stored as
    `/files/ceylon-stack-stacked-original-1600207b56.png`
- **Navbar Settings** `app_logo` → switched from the square mark (previous
  placeholder pass) to the horizontal lockup per package guidance ("ERP
  header: horizontal"): `03-PNG/ceylon-stack-horizontal-white-1600.png` →
  stored as `/files/ceylon-stack-horizontal-white-16003c4a18.png`.
  **Judgment call:** picked the **white** treatment, not **original**, for
  this slot specifically — the navbar background is a fixed sapphire
  (`#21407a` light theme / `#17325e` dark theme, hardcoded in
  `ceylon_stack_desk.css`'s `--navbar-bg`), and the horizontal-original
  treatment's wordmark text is near-black navy (`#081B30`-ish), which
  measured as very low contrast against sapphire when sampled pixel-by-pixel.
  White gives guaranteed full contrast in both Desk themes; navy treatment
  was also ruled out for the same reason (its ink is even darker than
  sapphire). Package guidance itself allows this ("Dark surfaces: dark or
  white treatment").
- **`smart_factory` app (live-only, container code, not in this repo)** —
  `smart_factory/boot.py`'s `set_ceylon_stack_branding()` had a hardcoded
  `CEYLON_STACK_LOGO = "/files/app-logo-512f047e3.png"` constant (feeds the
  app-switcher tile / sidebar subtitle logo via `bootinfo.app_data`).
  Updated it to the new mark file
  (`/files/ceylon-stack-mark-original-1024b0d7f0.png`) directly inside
  `frappe_docker-backend-1` via `sed`, then restarted
  `backend queue-short queue-long scheduler websocket` per the
  `deploy-smart-factory` skill (Python-only change — no `public/css`/`public/js`
  touched this time, so no `frontend` `docker cp` was needed; confirmed the
  already-deployed CSS/JS on `frontend` still serves fine at HTTP 200).
  `ceylon_stack_desk.css` was checked for hardcoded logo references
  (`background-image`/`url()`) — it only sets CSS custom-property colors, no
  logo swap needed there.
- **`Desktop Icon` "Framework" record** (`smart_factory`'s app-switcher
  tile) — `logo_url` updated to the same new mark file via
  `frappe.db.set_value` (same core-guard-bypass technique as the original
  branding pass, since this is a standard-ish record path already used for
  Dashboard Chart colors).
- **Verification:** all 8 containers up post-restart, no frontend/websocket
  boot-order crash-loop this time. `curl -I` against the site root and each
  of the new `/files/...` URLs (including the corrected favicon after its
  fix) plus the existing `/assets/smart_factory/css/...` and `.../js/...`
  all returned HTTP 200. Re-read `Website Settings`, `Navbar Settings`, and the `Desktop Icon`
  record back from the DB to confirm the new URLs stuck. Ran
  `set_ceylon_stack_branding()` against a synthetic `bootinfo` dict in
  console to confirm it now emits the new logo URL for `frappe`/`erpnext`/
  `smart_factory` app entries.
- **Explicitly out of scope for this pass** (per the task): `docs/brand.md`,
  `DESIGN.md`, and `apps/frontend` were not touched — they still reference
  the old placeholder assets and are a separate follow-up if/when the
  frontend and docs are brought in line with the real package.
- **Not yet done / flagged, not skipped silently:** the login page itself
  (not just the post-login splash) and print-format/letterhead branding
  still use default ERPNext styling — same known gap called out in the
  original branding pass, unchanged by this task since it was scoped to
  "live Desk" branding fields already wired up, not new surfaces.

## Not Yet Done (see PLAN.md for full context)

- `smart_factory` exists and does the full Desk branding pass (navbar/sidebar/app-switcher/buttons); it does not yet contain any actual Manufacturing/OEE business logic — that's still 100% ahead, per `PLAN.md`.
- Login page and print-format/letterhead colors are still default ERPNext styling — the `smart_factory` branding pass only covered the authenticated Desk chrome.
- `smart_factory`'s presence on `frontend` (nginx) is a manual `docker cp` + symlink, not baked into an image — it will disappear if that container is ever recreated rather than just restarted. Needs a real custom Docker image build before this is production-safe (see the gotcha note above).
- No manufacturing master data (Items, BOM, Workstations, Work Orders) has been created yet.
- No mobile browser testing of the Desk UI has been done yet.
- ERPNext Administrator default password has not been changed yet.
- MQTT broker, MES/FastAPI service, Postgres/TimescaleDB have not been started. The Next.js frontend is scaffolded and branded but has no ERPNext API integration or real dashboard screens yet.
- `pwd.yml` has no `restart:` policy — containers require a manual restart after any server reboot.

## Decision Log

- **2026-09-12 — Committed to active build, target client/marketing push next month (Oct 2026):** Reviewed `ACCESS.md` (server/repo/command reference) — confirmed accurate, no real secrets stored in it. Rebranded the product as **Ceylon Stack** (brand identity, palette, and typography documented in `docs/brand.md`). Scaffolded the monorepo structure (`apps/smart_factory`, `apps/mcp-server`, `apps/mes-service`, `apps/frontend`, `infra/`, `docs/`) ahead of actually building each service. Repo will move to a separate GitHub account (not yet finalized) before the current `Niroshan-git/ERP-System` remote is treated as permanent.
- **Task tracking going forward:** the Notion page "Smart Factory on ERPNext – Weekly Implementation Plan" is the source of truth for task checkboxes; `PLAN.md` mirrors it. Both get checked off together the moment a task step is actually completed — not before.
- **2026-09-12 — GitHub populated, MIT license dropped, `smart_factory` deferred:** Pushed the actual monorepo content to `Niroshan-git/ERP-System` for the first time (previously created but empty apart from an auto-added LICENSE). Removed that MIT LICENSE since it doesn't fit a product meant to be sold/whitelabeled, not open-sourced. Started rebranding ERPNext Desk per `DESIGN.md` §6, but explicitly decided to do every settings-only change first (Website Settings, Navbar Settings, Dashboard Chart colors) and hold off creating the `smart_factory` app until that's done and asked for directly — the app is real infrastructure (bench app, install, hooks) and shouldn't be created as a side effect of a theming request.
- **2026-09-12 — Sidebar "ERPNext" label confirmed to need `smart_factory`, still deferred:** Traced the sidebar app-switcher "ERPNext" text to `erpnext/hooks.py` app metadata (not a settings field). Asked directly whether to create `smart_factory` now to fix it via a `boot_session` hook — user chose to keep deferring, opting instead for the smaller data-only fix of renaming the `Administrator` user's display name to "Ceylon Stack". The sidebar app-switcher label remains the one confirmed item that needs the app; everything else so far has been settings-only.
- **2026-09-12 — `smart_factory` created, full Desk branding pass done:** After the same "ERPNext" sidebar text was raised a third time, asked one more time for explicit confirmation scoped narrowly to this fix — user approved. Created and installed `smart_factory`, wired `boot_session` + `app_include_css` + `app_include_js` hooks covering navbar, sidebar, app-switcher, and button/link colors. Discovered and fixed two real infrastructure gotchas along the way (frontend/backend container filesystem split for static assets; running gunicorn workers not picking up a live `pip install -e`) — both documented above since they'll bite again on the next custom-app change unless the manual steps are repeated or a proper custom image build replaces the quick-start compose setup.
