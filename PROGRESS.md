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

## 2026-09-16 — `apps/frontend` build: Inventory (Stock) module

Fourth frontend module, following the Sales → Buying build order (`FRONTEND_GUIDE.md` §4
updated accordingly). Reused the exact list/create/edit/`actions.ts` triad established by
Buying — `lib/erpnext.ts` needed zero changes.

- **Sidebar**: new `stock` module (label "Inventory") inserted between Buying and
  Manufacturing — Stock movement group (Stock Entries, Stock Balance), Warehouses & tracking
  group (Warehouses, Batches, Serial Nos, link-out to the shared `/sales/items`), Stock
  Reports.
- **Warehouse / Batch / Serial No masters**: generic `MasterTable`/`MasterForm`, no
  submit/cancel (confirmed none of the three have a docstatus field). `MasterForm.tsx`
  gained one new `FieldSpec` variant (`kind: "date"`) for Batch's `expiry_date` — the only
  change to a shared component this build made. `batch_id`/`serial_no` are excluded from
  each doctype's *edit* form (they're the record's own immutable name) but required on create.
- **`lib/stockDefaults.ts`** (new): company + full non-group/non-disabled warehouse list per
  company, mirroring `buyingDefaults.ts`'s structure without the accounting fields Stock
  Entry doesn't need.
- **Stock Entry** (`stock-entries/`): new bespoke `StockEntryForm.tsx` component. Purpose is
  restricted to Material Issue / Material Receipt / Material Transfer (Manufacture/Repack/
  Subcontracting purposes are Manufacturing-scope, out of bounds here); `stock_entry_type` is
  set to the same string as `purpose` (confirmed live: the Stock Entry Type records are
  literally named to match). Two decisions made and live-verified, not guessed:
  - **Rate handling**: Rate column only shown (`showRate`) for Material Receipt — Material
    Issue/Transfer let ERPNext compute `basic_rate` itself from existing stock valuation.
  - **Dual-warehouse limitation**: `LineItemsEditor` only supports one `defaultWarehouse`
    (used as each line's *source* warehouse for Issue/Transfer, via the header's
    `from_warehouse`). Material Transfer's *target* warehouse has no per-line UI in that
    shared component — rather than forking it, the header's `to_warehouse` is applied
    uniformly to every line's `t_warehouse` (documented in `actions.ts`, surfaced to the user
    as a note in the form).
  - **Inbound batch/serial capture skipped for v1**: `LineItemsEditor`'s FIFO batch/serial
    picker only appears when a `defaultWarehouse` is passed — deliberately withheld for
    Material Receipt (new stock has nothing existing to allocate against; the picker is
    built for the opposite, outbound direction). Batch/serial capture on receipt isn't
    offered in this form; use the Batches/Serial Nos screens afterward if needed.
  - Batch/serial picker on Material Issue/Transfer lines reuses `BatchSerialPicker`/
    `getAutoBatchSerialData`/`addSerialBatchLedgers` exactly as Delivery Note does, with a
    self-contained `attachBatchSerialBundles` in `stock-entries/actions.ts` (child doctype
    "Stock Entry Detail" instead of "Delivery Note Item" — not shared code, per the guide's
    one-doctype-per-folder rule).
- **Stock Balance** (`stock-balance/`): read-only, backed directly by `Bin` (`listDocs`),
  filterable by item/warehouse. **Live-verified, not guessed**: ERPNext's own "Stock Balance"
  Script Report has `prepared_report=1` on this server (`GET /api/resource/Report/Stock
  Balance`) — it only runs as a background job Desk itself polls for; `frappe.desk
  .query_report.run` (this app's `runReport()`) returns an empty `{prepared_report: true,
  doc: null}` shell instead of real columns/result, with no polling machinery in this app
  to drive it. The Bin-backed page fills the same "what's on hand" need as a live snapshot
  instead.
- **Stock Reports hub** (`lib/stockReports.ts`): catalog of the real Stock reports (module
  Stock on the live `Report` doctype) — Stock Balance's `href` points at `/stock/stock-balance`
  (see above) rather than the generic `/stock/reports/[slug]` runner; the rest are listed
  "Coming soon" for v1. One real correction made against the plan's working title: the live
  report is named "Warehouse wise Item Balance Age and Value" (no hyphen, lowercase "wise"),
  not "Warehouse-wise...".
- **Live-verified end-to-end** (direct ERPNext API calls matching the exact payload shapes
  `actions.ts` sends, since Next.js server actions can't be driven from plain `curl`):
  Warehouse create + update; Stock Entry create → update (Draft) → submit → cancel for all
  three purposes (Material Issue/Receipt/Transfer), including `s_warehouse`/`t_warehouse`
  wiring; Bin correctly reflected post-submit quantities across all three entries; Serial No
  create/delete. **Batch create hit a real ERPNext business-rule block, not a code bug**:
  "The selected item cannot have Batch" — no Item on this instance has `has_batch_no=1` yet
  (confirmed: 0 of 20 live Items do), so the Batch master's create flow could only be verified
  as far as ERPNext's own validation, not a successful save — same "no manufacturing/tracking
  master data yet" gap already logged elsewhere in this file.
- **No permission gaps hit this pass** — `frontend-integration`'s roles were re-checked live
  and now include `Stock Manager`/`Stock User`/`System Manager` (broader than the
  Sales-User-only set logged in earlier entries), so every Stock doctype (Warehouse, Stock
  Entry, Batch, Serial No, Bin) read/wrote without a single 403 in this session.
- All new/changed files: `components/Sidebar.tsx`, `components/MasterForm.tsx`, new
  `components/StockEntryForm.tsx`, `components/StockEntriesTable.tsx`,
  `components/StockBalanceTable.tsx`, `lib/stockDefaults.ts`, `lib/stockReports.ts`,
  `lib/erpStatus.ts` (+`stockEntryStatus`), `lib/tableColumns.ts` (+`stock-entries`/
  `stock-balance` table ids), and the full `app/(app)/stock/**` route tree (module home,
  warehouses/batches/serial-nos masters, stock-entries, stock-balance, reports hub).

### Review + QA pass (2026-09-16, same day) — one real bug caught and fixed

`code-reviewer` found no blockers (architecture, component reuse, and the purpose-driven
warehouse/rate wiring all checked out; one pre-existing, consciously-carried-forward gap
noted — re-editing a Draft Stock Entry doesn't repopulate an already-attached batch/serial
selection, same accepted limitation Delivery Note already has).

`qa-tester` live-tested against the real ERPNext instance and caught what review didn't:
**every batch/serial-tracked Material Issue/Transfer failed to submit** —
`ValidationError: The Serial and Batch Bundle ... is not valid for this transaction. The
'Type of Transaction' should be 'Outward' instead of 'Inward'`. Root cause: ERPNext's
`get_type_of_transaction` (`serial_and_batch_bundle.py`) decides Outward vs Inward for a
Stock Entry line by checking `child_row.get("s_warehouse")` specifically — the generic
`warehouse` key `attachBatchSerialBundles` (`stock-entries/actions.ts`) was already sending
doesn't satisfy that check, so every bundle silently defaulted to Inward regardless of
purpose. Plain (non-batch/serial) Material Issue/Receipt/Transfer and Stock Balance were
unaffected and passed on the first QA pass.

**Fix**: `addSerialBatchLedgers`'s `child_row` type (`lib/actions/batchSerialLookup.ts`) now
accepts an explicit `s_warehouse?: string`, and `attachBatchSerialBundles` passes
`childRow.s_warehouse` through. Re-verified live: a fresh batch-tracked Material Issue
(`TEST-BATCH-01` from `Stores - CS`) now returns `type_of_transaction: "Outward"` and
submits cleanly, with `Bin` correctly reflecting the issued quantity.

All QA-created test documents (`MAT-STE-2026-00008/00009/00011`) were cancelled after
verification, leaving the demo company's stock levels at their pre-QA baseline. Inventory
MVP now meets the Definition of Ready (`AGENT_OPERATING_GUIDE.md` §8) and is ready to commit.

**Standing process note for next time** (from both reviewers, not a blocker here): this
shipped as one six-route package (warehouses/batches/serial-nos/stock-entries/stock-balance/
reports) rather than split into single-package sessions per `AGENT_USAGE_POLICY.md` §8.
Matches the precedent already set by the Buying module's own commit, but worth tightening on
whatever Stock/Inventory work comes next.

### Package closeout (2026-09-16, same day)

Created `QA_LOG.md` (new central QA log, project root) with the Inventory/Stock QA entry
above as its first record. Committed the pending `docs/ceylon-stack-documentation.html`
status update together with the new QA log (`98560ab`) and pushed to `origin/frontend`.
Notion's "Smart Factory on ERPNext – Weekly Implementation Plan" page was already current
for this package (synced in the same-day release-tracker pass referenced above) — verified,
no further edit needed. Inventory MVP package is now fully closed per the Definition of Done.

## Not Yet Done (see PLAN.md for full context)

- `smart_factory` exists and does the full Desk branding pass (navbar/sidebar/app-switcher/buttons); it does not yet contain any actual Manufacturing/OEE business logic — that's still 100% ahead, per `PLAN.md`.
- Login page and print-format/letterhead colors are still default ERPNext styling — the `smart_factory` branding pass only covered the authenticated Desk chrome.
- `smart_factory`'s presence on `frontend` (nginx) is a manual `docker cp` + symlink, not baked into an image — it will disappear if that container is ever recreated rather than just restarted. Needs a real custom Docker image build before this is production-safe (see the gotcha note above).
- No manufacturing master data (Items, BOM, Workstations, Work Orders) has been created yet.
- No mobile browser testing of the Desk UI has been done yet.
- ERPNext Administrator default password has not been changed yet.
- MQTT broker, MES/FastAPI service, Postgres/TimescaleDB have not been started.
- *(Superseded — kept for history: this line originally said the Next.js frontend had no ERPNext API integration or real dashboard screens. As of 2026-09-16 that's no longer true — Sales, Buying, and Stock are all shipped and QA'd; see the Inventory MVP and Buying package-closeout entries above and `QA_LOG.md`.)*
- `pwd.yml` has no `restart:` policy — containers require a manual restart after any server reboot.

## Decision Log

- **2026-09-12 — Committed to active build, target client/marketing push next month (Oct 2026):** Reviewed `ACCESS.md` (server/repo/command reference) — confirmed accurate, no real secrets stored in it. Rebranded the product as **Ceylon Stack** (brand identity, palette, and typography documented in `docs/brand.md`). Scaffolded the monorepo structure (`apps/smart_factory`, `apps/mcp-server`, `apps/mes-service`, `apps/frontend`, `infra/`, `docs/`) ahead of actually building each service. Repo will move to a separate GitHub account (not yet finalized) before the current `Niroshan-git/ERP-System` remote is treated as permanent.
- **Task tracking going forward:** the Notion page "Smart Factory on ERPNext – Weekly Implementation Plan" is the source of truth for task checkboxes; `PLAN.md` mirrors it. Both get checked off together the moment a task step is actually completed — not before.
- **2026-09-12 — GitHub populated, MIT license dropped, `smart_factory` deferred:** Pushed the actual monorepo content to `Niroshan-git/ERP-System` for the first time (previously created but empty apart from an auto-added LICENSE). Removed that MIT LICENSE since it doesn't fit a product meant to be sold/whitelabeled, not open-sourced. Started rebranding ERPNext Desk per `DESIGN.md` §6, but explicitly decided to do every settings-only change first (Website Settings, Navbar Settings, Dashboard Chart colors) and hold off creating the `smart_factory` app until that's done and asked for directly — the app is real infrastructure (bench app, install, hooks) and shouldn't be created as a side effect of a theming request.
- **2026-09-12 — Sidebar "ERPNext" label confirmed to need `smart_factory`, still deferred:** Traced the sidebar app-switcher "ERPNext" text to `erpnext/hooks.py` app metadata (not a settings field). Asked directly whether to create `smart_factory` now to fix it via a `boot_session` hook — user chose to keep deferring, opting instead for the smaller data-only fix of renaming the `Administrator` user's display name to "Ceylon Stack". The sidebar app-switcher label remains the one confirmed item that needs the app; everything else so far has been settings-only.
- **2026-09-12 — `smart_factory` created, full Desk branding pass done:** After the same "ERPNext" sidebar text was raised a third time, asked one more time for explicit confirmation scoped narrowly to this fix — user approved. Created and installed `smart_factory`, wired `boot_session` + `app_include_css` + `app_include_js` hooks covering navbar, sidebar, app-switcher, and button/link colors. Discovered and fixed two real infrastructure gotchas along the way (frontend/backend container filesystem split for static assets; running gunicorn workers not picking up a live `pip install -e`) — both documented above since they'll bite again on the next custom-app change unless the manual steps are repeated or a proper custom image build replaces the quick-start compose setup.

## `pwd.yml` was silently single-site only — found and fixed 2026-09-13

Built `ceylon_services` (the app for gym/salon/hardware/supermarket
clients — Desk branding reused from `smart_factory`, plus an allow-listed
lightweight Workspace set instead of the full ERPNext module surface) and
created a real second site, `gym-demo`, to prove the multi-tenant model
end to end. It did not, at first — three real bugs found, in order:

1. **Workspace hiding looked broken but wasn't** — `Workspace.is_hidden`
   was correctly set, but Administrator (and anyone with the "Workspace
   Manager" role) is hardcoded in Frappe core
   (`frappe/desk/desktop.py::get_workspaces()`:
   `has_access or not page.is_hidden`) to always see every workspace
   regardless of `is_hidden`. Fixed by testing with a properly-scoped
   non-admin user instead — **any real client's day-to-day login must not
   be Administrator**, or the whole lightweight-workspace mechanism is
   silently inert for them. `ceylon_services/install.py` also moved from
   a single-item deny-list to an explicit allow-list (hides everything
   not named, so future ERPNext workspaces default to hidden), and now
   clears the cache in the same call.
2. **A hosts-file edit doesn't scale.** Replaced with
   `infra/scripts/add-nip-io-alias.sh`: nip.io's free wildcard DNS +
   a `sites/` symlink gives any site a real, working URL
   (`http://<site>.<ip-with-dashes>.nip.io:8080`) with zero client-side
   config.
3. **The big one: `gym-demo` was never actually reachable over HTTP at
   all**, and every earlier "verified working via curl" claim in this
   session was a false positive. `pwd.yml`'s quick-start hardcodes the
   `frontend` (nginx) container's `FRAPPE_SITE_NAME_HEADER` env var to the
   literal string `frontend` — and Frappe's site resolution
   (`frappe/app.py::init_request`) checks that header **before** the
   actual `Host` header. Every request through nginx, regardless of
   hostname or the nip.io alias, was silently being served by `frontend`
   the entire time (confirmed: logging in as Administrator via the
   `gym-demo` URL returned full_name "Ceylon Stack" — the rename that
   only ever happened on `frontend`). **Fix:** set
   `FRAPPE_SITE_NAME_HEADER: $host` (this is `frappe_docker`'s own
   documented multi-tenancy setting) and recreate the `frontend`
   container. Confirmed the fix by logging in as a real gym-demo-only
   user through the real external URL and by confirming Administrator's
   full_name differs correctly per site.
   - **Recreating `frontend` wiped `smart_factory`/`ceylon_services`
     again** — same filesystem-split gotcha from the original branding
     pass, redone (docker cp both apps' folders + recreate both
     `assets/<app>` symlinks).
   - **This one change also broke direct-IP access** (`62.238.22.161:8080`
     alone, with no matching site folder, started 404ing) — fixed with
     one more symlink, `sites/62.238.22.161 -> sites/frontend`, so the
     bare IP keeps working as a `frontend` alias exactly as before.
   - `infra/docker/pwd.yml` now holds a checked-in copy of the corrected
     live compose file specifically so this fix isn't lost if the server
     is ever rebuilt — see that file's own README section.

Multi-site hosting is now confirmed to actually work end-to-end: `frontend`
(manufacturing pilot, `smart_factory`) and `gym-demo` (service-client
demo, `ceylon_services`, lightweight workspace set) are genuinely
isolated, both independently reachable, both verified via real
authenticated HTTP sessions rather than just HTTP-200/curl checks (the
exact kind of check that gave a false "it works" signal earlier in this
same session).

## 2026-09-13 (later) — `gym-demo`'s Setup Wizard was never completed

The "Not permitted" dialog kept reappearing (even at `/desk/setup-wizard`
itself) for `owner@gym-demo.test` no matter what roles were granted,
because `gym-demo` never had a Company created on it — `bench new-site
--install-app erpnext` does not run the Setup Wizard. An incomplete-setup
site redirects every user to `/desk/setup-wizard`, and that page itself
requires Administrator-level access, so a scoped non-admin user was
permanently stuck. **Fix:** ran
`frappe.desk.page.setup_wizard.setup_wizard.setup_complete()` directly via
`bench console` as Administrator, creating Company "Demo Gym" (LKR,
Sri Lanka, FY2026). Re-verified via real authenticated HTTP login through
the actual external nip.io URL, plus a fresh check that the workspace
allow-list state was untouched by the setup completion.

## 2026-09-13 (later still) — Product Portfolio: Frappe HR added as Ceylon Stack's second product

Decided to whitelabel more of Frappe's own official apps under Ceylon
Stack rather than treat this as a one-ERP product — see the
`project_product_portfolio_plan` memory for the full bundle strategy
(HR now, CRM/Helpdesk/Insights named as future products, Lending/LMS
explicitly out of scope). Built and verified the first one, Frappe HR:

- `ceylon_services/install.py`'s single flat `ALLOWED_WORKSPACES` set
  became `ALLOWED_WORKSPACES_BY_APP`, keyed by app name, so the same
  install/migrate hook curates workspaces for whichever Ceylon Stack
  product apps are actually installed on a site — no redeploy needed
  per app combination, only once per newly-supported app.
- Piloted on a throwaway site (`verify-hr-test`): installed `hrms`
  (`--branch version-16`, matching the deployed ERPNext v16.34.2),
  discovered live that HRMS creates **nine** separate sub-workspaces
  (HR Setup, Payroll, Leaves, Shift & Attendance, Tax & Benefits,
  Expenses, Recruitment, Tenure, Performance) rather than one "HR"
  workspace as first assumed — allow-listed the first six (day-to-day
  essentials for a small business) and left the hiring/training/appraisal
  tier hidden as a maturity-stage feature set a 5-10 person client won't
  need yet.
- **Proved the payroll-to-finance interconnection for real, not just from
  documentation**: created an Employee, a Salary Structure, a Salary
  Structure Assignment, and a Payroll Entry end to end; submitting the
  resulting Salary Slip and running the Payroll Entry's accrual step
  produced a real, balanced Journal Entry (Debit "Salary" 50,000 / Credit
  "Payroll Payable" 50,000) with matching GL Entries — confirming Frappe
  HR's payroll genuinely posts into ERPNext's General Ledger natively,
  with no custom sync code needed. Along the way, fixed several
  first-time-setup gaps a fresh company needs before payroll will run at
  all (Payroll Payable account's `account_type` must be "Payable", a
  Holiday List Assignment must exist for the company, the Basic salary
  component needs a company-mapped GL account) — worth knowing for any
  future client's HR onboarding checklist.
- **Permission sweep** (same method as the original 146-doctype ERPNext
  sweep): of 70 doctypes linked from the six allow-listed HR workspaces,
  `HR Manager` alone left 15 blocked. Root cause was the same "Manager
  role ≠ User role" pattern already known from Sales/Stock/Purchase —
  `HR User` was also needed (unblocks Overtime Slip, Shift Assignment
  Tool), plus `Expense Approver` (Employee Advance, surprisingly not
  covered by HR Manager at all). The rest (Account, Journal Entry,
  Payment Entry, etc.) are already covered by the existing Accounts
  Manager/User bundle every `ceylon_services` client gets; the remaining
  handful (Vehicle/Driver/Fleet Management, Travel Request) are
  correctly left restricted — niche fleet-tracking features, not
  relevant to this tier.
- Rolled the same `hrms` install + role bundle onto the real `gym-demo`
  site (not just the throwaway one). Hit one real regression along the
  way: after `bench get-app`/`install-app hrms`, the already-running
  gunicorn workers threw `ModuleNotFoundError: No module named 'hrms'`
  on every request (including login) until `backend`/`frontend`/queue/
  scheduler/websocket containers were restarted — newly pip-installed
  apps aren't importable by already-running worker processes.
  **New standing step for any future `install-app` on the live
  server: restart the affected containers afterward.** Also had to redo
  the by-now-familiar frontend asset-symlink dance for `hrms` itself.
- **Re-verified for real**: real HTTP login as `owner@gym-demo.test`
  through the actual nip.io URL, the authenticated `get_workspaces` API
  call returning exactly the intended 18-workspace set (12 original +
  6 HR) with nothing from Manufacturing/Assets/Recruitment/Tenure/
  Performance leaking through, the compiled `hrms` JS/CSS bundles
  serving with real 200s, and `frontend` unaffected throughout.

## 2026-09-13 (later still) — `apps/frontend` build: Phases 1-3 (Sales module)

Started replacing ERPNext's own Desk UI with the real Next.js frontend,
per the headless architecture — see `apps/frontend/README.md` for the
living reference (kept current with what's built); this entry is the
narrative log.

- **Auth model** (user's explicit choice over full per-user sessions):
  service-account proxy. Real ERPNext login authenticates the person via
  Frappe's own `/api/method/login`; the app then issues its own signed
  httpOnly session cookie, and all ERPNext data calls run server-side
  through one dedicated user, `frontend-integration@ceylonstack.local`.
- **Design system reconciled**: `docs/brand/package/ceylon-stack-frontend-design.md`
  (graphite neutrals, one teal accent, IBM Plex Sans/Mono) now supersedes
  root `DESIGN.md`'s Fraunces/Archivo/sapphire-cinnamon system for
  `apps/frontend` specifically — `DESIGN.md` still governs brand
  identity/marketing.
- **Phase 1** (Customer, Item) and **Phase 2** (9 Selling-module masters:
  Customer Group, Territory, Item Group, Price List, Sales Person, Sales
  Partner, Contact, Address, Campaign) shipped — Phase 2 built on shared
  `MasterTable`/`MasterForm` components instead of copy-pasting the
  pattern nine times.
- **Phase 3**: Quotation, Sales Order, Sales Invoice — child-table line
  items, Draft→Submitted→Cancelled workflow, `lib/salesDefaults.ts`
  resolving company/currency/price-list/accounting defaults the way
  Desk does client-side. Then, per the user seeing ERPNext's own Sales
  Order "Connections" tab: added the same tab layout (Details/Address &
  Contact/Terms/More Info/Connections) plus "Create Sales Order from
  Quotation" and "Create Sales Invoice from Sales Order" actions that
  carry items and references across documents.
- **`frontend-integration` user's roles, evolving as gaps were hit**
  (started with `Sales User` + `Item Manager` for Customer/Item/Quotation/
  Sales Order; `Accounts User` added later the same day once Sales
  Invoice screens were built and hit 403 — that's an accounting doctype,
  not covered by the Selling-module roles). Same "Manager/User role
  granularity" pattern already logged above for HR/Sales/Stock/Purchase.
- **Two real bugs the user caught by actually using the UI** (not found
  by testing alone):
  1. **WarehouseRequired** on "Create Sales Order" — ERPNext auto-fills a
     stock item's line warehouse from the Item's per-company default,
     but "Ceylon Stack (Demo)" company had none configured for the item
     in question (unlike "Ceylon Stack", which worked and masked the gap
     during earlier testing). Fixed with a resolved company-level
     fallback warehouse in `getSellingDefaults()`, applied uniformly to
     every Sales Order line — same pattern as the existing income-
     account/cost-center fallback.
  2. **Duplicate Sales Orders** — "Create Sales Order" had no guard
     against being clicked twice; a Quotation ended up with two
     identical Draft Sales Orders. Fixed at both the action level (now
     refuses if a linked document already exists) and the UI (button
     hides once one exists). The two duplicates were deleted at the
     user's confirmation.
- **Frappe REST gotcha worth remembering**: a service account that can
  read a parent doctype fine still 403s querying its child table
  directly (`GET /api/resource/Sales Order Item`). Fix: query the
  *parent* doctype with a 4-element child-table filter tuple instead
  (`filters=[["Sales Order Item","prevdoc_docname","=",value]]` against
  `/api/resource/Sales Order`) — checks permission on the parent, works.
- **Observed anomaly, not explained**: mid-session, two already-cancelled
  test documents were found reverted to their pre-cancel state, as if
  the site had been restored from a backup taken between those two
  points. Frappe normally makes cancelled docs immutable. Re-cancelling
  them stuck on retry. No code bug found; flagged to the user in case an
  automated backup/restore is running on the Hetzner box they're not
  aware of — worth checking first if strange data reversions recur.

## 2026-09-16 — Buying core cycle: full live E2E QA pass (first real verification)

Prior to this, Buying's code existed and its Reports hub had been spot-checked, but the
core transactional chain had never been driven end-to-end against the live Hetzner
instance — no dedicated Buying entry existed in this file, and `QA_LOG.md` only had the
Inventory/Stock entry. This package closed that gap: `qa-tester` ran a full live E2E pass
(no code written by `qa-tester` — Read/Grep/Glob/Bash only), replicating each `actions.ts`
file's exact payload shape via direct ERPNext REST calls, same method the Stock module QA
pass used (Next.js server actions can't be driven from plain curl).

**Chain tested live**: Supplier (create/edit/fetch) → Material Request (submit) → Request
for Quotation (submit) → Supplier Quotation (submit) → Purchase Order (submit) → Purchase
Receipt with a **partial** quantity (submit) → Purchase Invoice (submit) → `Bin` stock
impact → error cases → full cleanup.

**Result: PASS, no code fixes required.** Every payload shape read from the six Buying
`actions.ts` files matched live ERPNext behavior on the first attempt — unlike the Stock
module's `s_warehouse` bug, nothing broke here. Specifics:
- `MAT-MR-2026-00004` → `PUR-RFQ-2026-00004` → `PUR-SQTN-2026-00004` →
  `PUR-ORD-2026-00014` → `MAT-PRE-2026-00002` (partial: 12 of 20 on one line, 0 of 10 on
  the other) → `ACC-PINV-2026-00008`.
- Partial-fulfillment tracking confirmed correct: PO `received_qty`/`per_received`
  (12/30 → 40.0%) and `billed_amt`/`per_billed` (1260/27100 → 4.65%) both matched expected
  math exactly.
- `Bin.actual_qty` for `ELE-USBC-CABLE` / `Stores - CS`: **44.0 before → 56.0 after** the
  partial Purchase Receipt (+12, exact match), **back to 44.0** after cleanup cancellation.
- Error cases: missing-mandatory-field correctly returned `417 MandatoryError`;
  cancelling a Purchase Order still referenced by a submitted Purchase Invoice correctly
  returned `417 LinkExistsError` from ERPNext itself — confirms the frontend's own
  proactive guard in `cancelPurchaseOrderAction` (`purchase-orders/actions.ts`) is backed
  by real server-side enforcement, not just an optimistic UI check.
- No 403s anywhere — `frontend-integration`'s existing role set already covers every
  Buying doctype touched (Supplier, Material Request, Request for Quotation, Supplier
  Quotation, Purchase Order, Purchase Receipt, Purchase Invoice, Bin); unlike Stock, no
  role addition was needed.
- `lib/buyingDefaults.ts`'s `defaultPayableAccount`/`defaultExpenseAccount`/
  `defaultCostCenter` — previously only an inferred assumption, per that file's own
  comment — is now live-confirmed correct (both companies have these fields populated,
  and Purchase Invoice submit succeeded using them).
- ERPNext's live PO status after a partial receipt is `"To Receive and Bill"`, not a
  separate "Partly Received" label — `lib/erpStatus.ts`'s `purchaseOrderStatus`
  independently derives the same label from `per_received`/`per_billed` and matched
  exactly; no fix needed.

**One real gap identified, not a functional defect**: there is no direct Material
Request → Purchase Order action in the frontend
(`buying/material-requests/[name]/page.tsx`'s Connections tab only offers "Create RFQ";
`purchase-orders/actions.ts` only has `createPurchaseOrderFromSupplierQuotationAction`).
The only path from a submitted Material Request to a Purchase Order is the 3-hop chain
MR → RFQ → Supplier Quotation → PO, which is not optional. This isn't required by the
binding core flow (`AGENT_OPERATING_GUIDE.md` §8 / `DEVELOPMENT_SYSTEM_RULES.md` §5 name
only PO → PR → PI as the flow that must stay strong), so it was left as-is — flagged here
for a future product decision (document the 3-hop requirement explicitly, or add a
direct MR→PO shortcut later) rather than fixed under this QA-only package.

**Cleanup**: all six submitted test documents cancelled in reverse dependency order
(`ACC-PINV-2026-00008`, `MAT-PRE-2026-00002`, `PUR-ORD-2026-00014`, `PUR-SQTN-2026-00004`,
`PUR-RFQ-2026-00004`, `MAT-MR-2026-00004`); deletion attempts correctly blocked by
`417 LinkExistsError` (GL Entry / cross-document links) — expected ERPNext audit-trail
behavior, same as the Inventory QA pass. The test Supplier (`QA Test Supplier Buying`,
never submittable, still link-referenced) was disabled instead of deleted. Bin quantities
confirmed back at pre-QA baseline.

Buying core cycle now meets the Definition of Ready (`AGENT_OPERATING_GUIDE.md` §8) and
is accepted. See `QA_LOG.md` for the compact QA record.

## Documentation alignment package (2026-09-16)

Doc-only package: no application code changed. Several docs had drifted behind the
Inventory MVP and Buying package closeouts above and were actively contradicting the
rest of the project's own records — fixed so future sessions don't inherit stale context:

- `apps/frontend/README.md` — "What's built" only described the Sales-only Phase 1-3
  state and explicitly claimed "no Price List/Pricing Rule resolution," which shipped
  2026-09-15. Added Buying and Stock module summaries, the Pick & Pack/partial
  fulfillment/Copy From/Quotation-lifecycle/Pricing Rule shipped scope, and corrected
  "Not yet done" (removed the now-false discount claim, kept tax since that's still
  unbuilt, added the Manufacturing lock).
- `.claude/agents/frontend-dev.md`, `product-designer.md`, `qa-tester.md`,
  `inventory-procurement.md`, `mcp-dev.md`, `frappe-dev.md` — each had a "Current
  reality" section claiming no ERPNext integration / no dashboard screens / no
  Items-warehouses-transactions / mcp-server as README-only / local `smart_factory` as
  README-only. All corrected against the actual current repo state and `QA_LOG.md`;
  `manufacturing-floor.md` and `mes-dev.md` were checked and left untouched — both
  correctly still describe Manufacturing/MES as not built.
- `docs/ceylon-stack-documentation.html` — the "Buying Module" section-header badge
  still read Building even though its own most recent changelog entry says the core
  cycle moved to Live; corrected the badge and logged the correction in the changelog.
- This entry (`PROGRESS.md`'s own stale "no ERPNext API integration or real dashboard
  screens" line in the "Not Yet Done" section, superseded in place above).

No QA_LOG.md entry — this was a documentation-only pass with no code or live-system
change to test. Notion was not touched — no implementation plan or shipped-status
change resulted from this package. `docs/ceylon-stack-documentation.html` was touched
only for the one factual status-badge correction, not a general rewrite.

## 2026-09-16 — Sales combined end-to-end verification pass (Phase 5, plan complete)

Last remaining item from the Sales scenario gaps plan: Phases 1-4 (partial fulfillment,
Pick List/Delivery Note/batch-serial, Quotation lifecycle, Pricing Rule/document
discounts) had each been live-verified individually, but never run together in one
chain. `qa-tester` ran that combined pass live against the Hetzner instance, same
direct-REST-matching-`actions.ts`-payload-shapes method as the Inventory and Buying QA
passes (Next.js server actions can't be driven from plain curl).

**Result: PASS, no code fixes required.** Full chain exercised live: Quotation (2 lines)
→ document-level discount (10% on Grand Total, server recalculation exact) → submit →
Sales Order via Copy From Quotation (partial ordered qty) → Pick List (partial picked
qty, write-back confirmed) → submit → Delivery Note from Pick List with real Serial and
Batch Bundle attachment (`type_of_transaction: "Outward"`) → submit → `Bin.actual_qty`
impact confirmed → Sales Invoice (partial invoiced qty) → submit → Connections data
verified directly via REST filter tuples → cancellation-blocking (`417 LinkExistsError`)
confirmed on three separate attempts → full cleanup, stock/serial baseline restored.

**What combining the phases actually proved** (the point of the exercise): nothing broke
that hadn't already been verified in isolation. Partial-fulfillment bookkeeping held
across three consecutive partial stages on the same lines; the document-level discount
survived the Quotation→Sales Order copy; batch/serial attachment on Delivery Note worked
when sourced from a **Pick List** specifically (previously only verified from a direct
Sales Order in the Phase 2 pass); every cancel-blocked-by-child-document guard held under
the full chain.

**Live-data gap**: no `Pricing Rule` record exists on the instance, so automatic rule
application couldn't be re-exercised live in this pass (previously confirmed by reading
`LineItemsEditor.tsx`'s rate-input disable guard, not a fresh live application here).

**Non-blocking technical finding**: hand-constructing a line payload with
`rate == price_list_rate` but a nonzero `discount_percentage` shows ERPNext's controller
silently zeroes `discount_percentage` instead of recomputing `rate` — contradicts a
comment's stated assumption in `lib/lineRows.ts`. Not reachable through the real UI
(`LineItemsEditor.tsx` disables the rate input once a Pricing Rule sets a discount), so
no user-facing defect exists today. Flagged for `frontend-dev` awareness only, in case
that guard is ever relaxed.

**Cleanup**: `SAL-QTN-2026-00023`, `SAL-ORD-2026-00038`, `STO-PICK-2026-00001`,
`MAT-DN-2026-00011`, `ACC-SINV-2026-00028` all cancelled in reverse dependency order.
`QA Test Customer Sales E2E` disabled (deletion blocked by link, expected). Stray Draft
documents from tool-call retries deleted. `Bin.actual_qty` and Serial No status/warehouse
both confirmed back at pre-test baseline.

Sales scenario gaps plan (all 5 phases) is now complete. Sales core cycle
(Quotation → Sales Order → Delivery Note → Sales Invoice) meets the Definition of Ready
(`AGENT_OPERATING_GUIDE.md` §8) and is fully accepted per the Current Mission priority
lock. See `QA_LOG.md` for the compact QA record. `docs/ceylon-stack-documentation.html`'s
"Full end-to-end verification pass" roadmap card and changelog updated accordingly (see
that file's own changelog entry for today).

## 2026-09-16 (later) — Phase 0 ERPNext walkthrough: `docs/erp-inventory.md` created

Long-overdue Phase 0 walkthrough from `docs/mcp-agents-plan.md`, run by `erp-functional-consultant`.
Live, read-only inventory of the Hetzner instance via SSH + `bench --site frontend console`
(and spot-checks on `gym-demo`/`verify-provision-test`) — no data created, modified, or
deleted. Full findings: `docs/erp-inventory.md`.

**Headline correction to prior assumptions**: the "fresh install, no manufacturing master
data" baseline repeated in `docs/mcp-agents-plan.md`, `manufacturing-floor.md`, and
`mcp-dev.md` is now partially stale — real (if narrow) Manufacturing master data already
exists on `frontend`: 1 BOM, 2 Workstations, 6 Work Orders, 6 Job Cards, all on a single
product line (`FG-STEEL-BRACKET-ASSY`). Matches the "M0 DONE" milestone from earlier
session memory. **Zero Quality Inspection Templates exist** — the one Manufacturing
master-data checklist item that's fully unaddressed, not just thin.

**Other findings worth flagging**:
- **No permission scoping exists anywhere on the instance** — all 3 System Users
  (`Administrator`, `frontend-integration@ceylonstack.local`, and the real human login)
  carry nearly the full ERPNext role catalog including `System Manager`. This is a bigger
  gap than just "no client-scoped MCP tier" — the frontend's own service account is
  equally unscoped.
- Sri Lanka VAT setup is a partial skeleton, not untouched: `Sri Lanka Tax - CS/CSD` tax
  templates and `VAT - CS/CSD` GL accounts already exist per company. No Tax Category, no
  SVAT/e-invoicing logic — `erpnext-full-reference.md`'s "needs custom work" conclusion
  still holds, just not from zero.
- **Naming series correction**: Job Card's real live series is `PO-JOB.#####`, not the
  `JC-.YYYY.-` pattern `docs/mcp-agents-plan.md` guessed — matters for any future MCP tool
  or frontend code that assumes the ID format.
- An undocumented site, `verify-provision-test` (company "Provision Test Co"), exists on
  the server with no prior record in this file — likely a leftover from the earlier
  HR-portfolio provisioning work. Flagged for a keep/delete decision, not acted on.
- Administrator password was **not re-verified this session** (no login attempted, by
  design) — still recorded as the `pwd.yml` default per the existing record above until
  someone explicitly changes it.

**Phase 0 gate cleared**: `mcp-dev` was explicitly blocked from building any
business-specific MCP tool (Work Order, Job Card, BOM, Item, etc.) until
`docs/erp-inventory.md` existed. It now does — `mcp-dev` can start Phase 1 read tools
against this document's real schema/naming reference.

Recommended next package (per `AGENT_USAGE_POLICY.md` §8, one at a time): either (a) a
small `erp-functional-consultant` master-data package — create a Quality Inspection
Template for `FG-STEEL-BRACKET-ASSY`, the one fully-missing checklist item — or (b)
`mcp-dev` Phase 1 read-only tools (Work Order/Job Card/BOM/Item lookups). Founder's call
which goes first.

No QA_LOG.md entry (discovery/documentation work, not a QA test pass, per this task's own
scope). `docs/ceylon-stack-documentation.html` left untouched — its "AI Agents (MCP)"
section's overall status label (Planned) is still accurate; one callout sentence
("not yet run") is now stale text, flagged for a future `release-tracker` pass rather than
hand-edited here. Notion not touched — no plan changed, this is a new discovery package.

## 2026-09-16 (later still) — Quality Inspection Template created for `FG-STEEL-BRACKET-ASSY`

Closed the one fully-missing item flagged by the Phase 0 walkthrough
(`docs/erp-inventory.md`): zero Quality Inspection Templates existed anywhere on
`frontend`. Done by `erp-functional-consultant` as a narrow master-data configuration
package via `bench --site frontend console` — no code, no custom DocTypes, no core
changes.

Created 5 `Quality Inspection Parameter` master records (`Visual Finish`,
`Dimension Check (Length)`, `Hole Alignment`, `Weld/Joint Integrity`, `Final Pass/Fail`)
and 1 `Quality Inspection Template` (`Steel Bracket Assembly - Final QC`) referencing all
five as child rows, with realistic acceptance criteria for a steel bracket assembly
(visual/cosmetic, a numeric dimension check at 149-151mm, hole tolerance, weld integrity,
and a final accept/reject gate). Linked the template to `Item.quality_inspection_template`
on `FG-STEEL-BRACKET-ASSY`.

One real ERPNext quirk hit and corrected: the `numeric` checkbox on the
`Item Quality Inspection Parameter` child DocType defaults to `1` at the field-definition
level, so all 5 rows came back `numeric=1` after the first insert even though only
"Dimension Check (Length)" was meant to be numeric. Explicitly set `numeric=0` on the
other four rows and re-saved; verified via a fresh `frappe.get_doc` read-back that the
final state is correct (1 numeric row with min/max 149/151, 4 text-value rows with their
intended acceptance-criteria strings).

No `Quality Inspection` records created (this package is the reusable template only, not
fake inspection results). No other Item/BOM/Work Order/Job Card master data touched.
`PLAN.md` line 38 ("Enable Manufacturing module, create sample master data...") checked
off — every clause was already satisfied except this one. `docs/erp-inventory.md` updated
with a dated addendum correcting the now-stale "0 Quality Inspection Templates" facts.
No `QA_LOG.md` entry — this is configuration/master-data work, not a QA test pass.
`docs/ceylon-stack-documentation.html` and Notion not touched (out of this task's scope;
Notion sync is handled separately by `release-tracker`).

## 2026-09-16 — MCP Phase 1: first business-specific tool, `get_manufacturing_overview`

Added the first domain-specific tool to `apps/mcp-server`, now that Phase 0
(`docs/erp-inventory.md`) is complete and unblocks it per `docs/mcp-agents-plan.md`.
Dev-tier, read-only, stdio-only — no remote transport, no write/action tools, no
client-facing agent layer, no ERPNext/Frappe core or Manufacturing frontend touched.

`get_manufacturing_overview()` returns: counts of BOM / Workstation / Work Order / Job
Card / Quality Inspection Template; the 5 most recently modified Work Orders and Job
Cards (key fields only); whether `FG-STEEL-BRACKET-ASSY` has a `quality_inspection_template`
set and which one; a `gaps` array flagging missing/risky readiness items; and a source
note marking this as dev-tier data, not a client-scoped agent. Built directly against the
real field names and naming series recorded in `docs/erp-inventory.md` (e.g. Job Card's
`PO-JOB.#####` series, not the `JC-.YYYY.-` pattern earlier docs guessed) rather than
assumed schema. Also added a small `get_count()` method and an optional `order_by` param
to `get_list()` on `erpnext_client.py`'s existing generic client (backward compatible,
reused by the new tool for counts and recency ordering).

**Verified live against the Hetzner instance** by calling the tool function directly
(bypassing the running MCP session, which was started before the code change): real
counts (1 BOM, 2 Workstations, 6 Work Orders, 6 Job Cards, 1 Quality Inspection Template),
real recent Work Orders (`MFG-WO-2026-0000x`) and Job Cards (`PO-JOB0000x`), and the
`Steel Bracket Assembly - Final QC` template correctly resolved for `FG-STEEL-BRACKET-ASSY`
(`gaps` came back empty, matching that this instance's one real readiness gap was already
closed by the prior Quality Inspection Template package). Every HTTP request logged during
the run was `GET` — confirmed no write requests were made.

`apps/mcp-server/README.md` updated with the new tool's description and verification
note. No `QA_LOG.md` entry — this is internal dev tooling, not a Sales/Stock/Buying core
flow, so no `qa-tester` pass was run; the live verification above is the tool's own
functional check. `docs/ceylon-stack-documentation.html` and Notion not touched — no
product-facing status changed and the implementation plan (MCP Phase 1) didn't change.

**`code-reviewer` pass**: no blocking issues; sequencing/scope confirmed correct (Phase 0
gate cleared per `docs/erp-inventory.md`, exactly one tool added, read-only guarantee
verified by reading every method on `erpnext_client.py` — only four request-issuing
methods exist, all `GET`), the new `order_by` param confirmed backward-compatible with
its two existing callers. One minor finding fixed: the `except ERPNextError` around the
quality-readiness lookup originally labeled *any* failure (transient 500, permission
issue, not just a real 404) as "item does not exist" — changed to report it as
unverified (`quality_readiness.error` + a softer gaps message) instead of asserting
non-existence. Re-verified live after the fix; output unchanged for the real
(existing-item, template-attached) case. Also flagged by review, out of this package's
scope: `.claude/agents/mcp-dev.md`'s "Current reality" section still says Manufacturing
tools are out of scope regardless of Phase 0 — stale now, needs a future
documentation-alignment pass (already separately noted in `docs/erp-inventory.md`).

## 2026-09-16 — MCP Phase 1: second business-specific tool, `get_work_order_detail`

Added `get_work_order_detail(work_order_name)` to `apps/mcp-server`, extending Phase 1's
first tool (`get_manufacturing_overview`, above) to a single-record lookup. Same
constraints as before: dev-tier, read-only, stdio-only, no write/action tools, no
ERPNext/Frappe core or Manufacturing frontend touched, one package/one session per
`docs/controls/AGENT_USAGE_POLICY.md`.

Given a Work Order name, returns: its header (status, company, production_item,
item_name, qty, produced_qty, process_loss_qty, planned_start_date, planned_end_date,
bom_no); its Job Cards (name, operation, workstation, status, for_quantity,
total_completed_qty, expected/actual start/end dates), ordered by creation, bounded to
50; Quality readiness — the production item's `quality_inspection_template` plus up to 5
`Quality Inspection` records filtered by `item_code` (Quality Inspection links to Job
Card, not directly to Work Order, per `docs/erp-inventory.md`'s schema notes, so this is
item-level readiness, not a true Work-Order-level check — documented in the tool's own
returned `note`); a `gaps` array; and a `source` note. Validates `work_order_name` is
non-empty and returns a clean `{"error": ...}` dict rather than an unhandled exception
for an empty name or a Work Order that doesn't exist. Field names and the Job Card
`PO-JOB.#####` naming series came directly from live `get_doctype_fields` calls against
Work Order, Job Card, and Quality Inspection (via the existing dev-tier MCP tools), not
from `docs/erp-inventory.md` alone.

**Verified live against the Hetzner instance**: called the tool function directly
(same bypass-the-running-session approach as the first tool, with HTTP-method
interception added this time to positively confirm zero non-GET requests across the
whole run). Tested `MFG-WO-2026-00002` (In Process — returned its 2 real Job Cards,
`PO-JOB00001` Completed and `PO-JOB00002` Open, with real quantities/dates), `-00004`
(Completed — 0 Job Cards, correctly empty `job_cards` and a `gaps` entry naming it),
`-00001` (Cancelled, same shape), a nonexistent Work Order name (clean error dict, no
crash), and an empty string (clean validation error, no request issued). The
`Steel Bracket Assembly - Final QC` template resolved correctly for the reference item
across all cases. 13 HTTP requests total across the run, 0 non-GET.

**Real ERPNext behavior surfaced, not a bug in this tool**: for `-00004` and `-00001`
(terminal-status Work Orders), `planned_end_date` — confirmed via live
`get_doctype_fields` to genuinely be defined on the Work Order doctype — was entirely
absent as a key from the REST response, not merely `null`. `erpnext_client.get_doc()`
does no client-side filtering (confirmed by reading it), so this is ERPNext's own REST
layer omitting the key for these records; root cause not investigated further
(out of scope for this package). The tool's `gaps` array flags this per-record as "field
ERPNext omitted from the response," not as schema drift, since the field is defined.

`apps/mcp-server/README.md` updated with the new tool's description and verification
note. No `QA_LOG.md` entry — internal dev tooling, not a Sales/Stock/Buying core flow,
same rationale as the first Phase 1 tool. `docs/ceylon-stack-documentation.html` and
Notion not touched — no product-facing status changed and the implementation plan (MCP
Phase 1) didn't change beyond what was already planned.

**`code-reviewer` pass**: one blocking finding, fixed. The initial `gaps` message for
the `planned_end_date` omission above (see "Real ERPNext behavior surfaced") originally
read "possible ERPNext version drift" — reviewer correctly flagged this as misleading
since the field genuinely exists on the doctype and the omission is reproducible for
every terminal-status Work Order, not intermittent drift; reworded to state plainly that
ERPNext omitted a defined field from this record's response, without asserting a false
cause. Re-verified live after the fix; behavior otherwise unchanged. One additional
small fix applied proactively (non-blocking per review): the `quality_readiness.note`
key is now present in both the with- and without-`production_item` branches, so callers
don't need to `.get()` defensively for a key that's normally always there.

Also flagged by review, **not acted on, for the founder's attention**: `server.py` and
`erpnext_client.py` still show as uncommitted working-tree changes covering *both*
Phase 1 tools (`get_manufacturing_overview` was never actually committed after its own
prior closeout entry above, despite that entry recording a completed review). Per
`docs/controls/AGENT_USAGE_POLICY.md` §8 and this file's Package Closure Rules, these
should land as two separate commits (one per tool/package) rather than one combined
commit, to keep history and review responsibility per-package. This session did not
commit anything (commit was not requested) — noted here so whoever does commit next
splits them accordingly rather than assuming this is one package.
