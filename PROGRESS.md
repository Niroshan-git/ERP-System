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

## 2026-09-16 — MCP Phase 1: third business-specific tool, `list_work_orders`

Added `list_work_orders(status=None, production_item=None, limit=20)` to
`apps/mcp-server/src/server.py`, per `docs/mcp-agents-plan.md` Phase 1 and this
session's explicit one-tool mission. Complements `get_manufacturing_overview()`
and `get_work_order_detail()` by giving an agent a way to discover the Work
Order `name` to inspect, rather than only seeing 5 recent ones or needing an
exact name already in hand. Read-only, GET-only, dev-tier — same conventions
as the two prior Phase 1 tools: reuses `ERPNextClient.get_list()`, clamps
`limit` to `[1, 100]`, builds equality filters from `status`/`production_item`
when provided, sorts `order_by="creation desc"`, and returns
`applied_filters` / `total_returned` / `work_orders` / `gaps` / `source`.

**Verified live against the Hetzner instance**: called the tool function
directly (same bypass-the-running-session approach as the first two tools,
with HTTP-method interception to positively confirm GET-only). Unfiltered
call returned all 6 real Work Orders (`MFG-WO-2026-00001..006`), newest-first
by creation; `status="Completed"` returned exactly `-00004`;
`production_item="FG-STEEL-BRACKET-ASSY"` returned all 6 (the instance's only
manufactured item, per `docs/erp-inventory.md`); combined `status="Not
Started"` + that production item returned exactly `-00003` and `-00006`;
`limit=0` clamped to 1, `limit=9999` clamped to 100. 6 HTTP requests total
across the run, all `GET`, zero non-GET.

`apps/mcp-server/README.md` updated with the new tool's description and
verification note. No `QA_LOG.md` entry — internal dev tooling, not a
Sales/Stock/Buying core flow, same rationale as the first two Phase 1 tools.
`docs/ceylon-stack-documentation.html` and Notion not touched — no
product-facing status changed and the implementation plan (MCP Phase 1)
didn't change beyond what was already planned.

**`code-reviewer` pass**: no blocking findings. Reviewer confirmed: limit
clamping and filter construction match existing patterns exactly; filters
pass through Frappe's own parameterized `frappe.client.get_list` RPC (no
injection risk, and narrower than `list_documents`'s already-arbitrary
filter/field acceptance); only `GET` is reachable from this tool; headless
boundary and dev-tier scope both respected; return shape and docstring
boilerplate consistent with `get_manufacturing_overview` /
`get_work_order_detail`. One non-blocking observation (not acted on):
`applied_filters.limit` returns the clamped value, not the raw input — a
deliberate transparency choice, not a defect.

Not committed — commit was not requested this session.

## 2026-09-17 — MCP Phase 1: fourth business-specific tool, `list_job_cards`

Added `list_job_cards(status=None, work_order=None, workstation=None, limit=20)`
to `apps/mcp-server/src/server.py`, per `docs/mcp-agents-plan.md` Phase 1 and
this session's explicit one-tool mission. Lets Manufacturing Floor / MCP
workflows inspect execution-level work (Job Cards) without already knowing a
Job Card name or its parent Work Order, complementing `list_work_orders`,
`get_work_order_detail`, and `get_manufacturing_overview`. Read-only,
GET-only, dev-tier — same conventions as the three prior Phase 1 tools:
reuses `ERPNextClient.get_list()`, clamps `limit` to `[1, 100]`, builds
equality filters from `status`/`work_order`/`workstation` when provided,
sorts `order_by="creation desc"`, and returns `applied_filters` /
`total_returned` / `job_cards` / `gaps` / `source`.

Before implementing, confirmed live via `get_doctype_fields("Job Card")` that
Job Card genuinely has a `production_item` field (label "Final Product",
Link to Item) — not present in the pre-existing `JOB_CARD_DETAIL_FIELDS`
constant used by `get_work_order_detail`'s Job Card sub-list, so this was
checked rather than assumed. Included it in the new `JOB_CARD_LIST_FIELDS`
constant as a deliberate, documented choice.

**Verified live against the Hetzner instance**: called the tool function
directly (same bypass-the-running-session approach as the prior three tools,
with HTTP-method interception to positively confirm GET-only). Unfiltered
call returned all 6 real Job Cards (`PO-JOB00001..00006`), newest-first by
creation; `status="Completed"` returned exactly `PO-JOB00001`;
`work_order="MFG-WO-2026-00002"` returned its 2 real Job Cards
(`PO-JOB00001`, `PO-JOB00002`); `workstation="Coating Station"` returned
exactly the 3 Job Cards on that workstation; combined `work_order` +
`workstation` filter returned exactly 1 matching card; `limit=0` clamped to
1, `limit=9999` clamped to 100. 7 HTTP requests total across the run, all
`GET`, zero non-GET.

`apps/mcp-server/README.md` updated with the new tool's description and
verification note. No `QA_LOG.md` entry — internal dev tooling, not a
Sales/Stock/Buying core flow, same rationale as the prior three Phase 1
tools. `docs/ceylon-stack-documentation.html` and Notion not touched — no
product-facing status changed and the implementation plan (MCP Phase 1)
didn't change beyond what was already planned.

**`code-reviewer` pass**: no blocking findings. Reviewer confirmed: limit
clamping, filter construction, and gap-detection all match `list_work_orders`
(the closest analog) exactly; filters pass through Frappe's own
parameterized `frappe.client.get_list` RPC (no new injection surface); only
`GET` is reachable from this tool; scope matches the request (one tool, two
constants, no unrelated changes); no secrets in the diff. Two non-blocking
observations: (1) README needed the corresponding entry added — done as part
of this same package's documentation step, not a separate follow-up; (2) the
`production_item` asymmetry between `JOB_CARD_LIST_FIELDS` and
`JOB_CARD_DETAIL_FIELDS` was flagged for confirmation it's intentional — it
is, per the inline code comment and this entry above, not a defect.

Not committed — commit was not requested this session.

## 2026-09-17 (later) — MCP Phase 1: fifth business-specific tool, `get_job_card_detail`

Added `get_job_card_detail(job_card_name)` to `apps/mcp-server/src/server.py`,
per `docs/mcp-agents-plan.md` Phase 1 and this session's explicit one-tool
mission. Completes the minimum MCP read-only inspection set (overview → list
→ detail, for both Work Order and Job Card) before Manufacturing frontend
work starts. Read-only, GET-only, dev-tier — same conventions as
`get_work_order_detail` (its closest analog): validates/strips
`job_card_name`, returns a clean `{"error": ...}` dict for empty input or a
not-found Job Card (no unhandled exception), builds a header dict +
`missing_fields` gap detection, looks up a related-record summary, and
returns `{job_card, work_order, quality_readiness, gaps, source}`.

Before implementing, confirmed live via `get_doctype_fields` that Job Card
genuinely has `company`, `process_loss_qty`, and `total_time_in_mins` fields
(none previously exposed by any tool), and — more importantly — that Quality
Inspection has a genuine **direct** link to Job Card:
`reference_type` (Select, includes `"Job Card"`) + `reference_name` (Dynamic
Link keyed by `reference_type`). This is a real link, not the item-level
fallback `get_work_order_detail` uses (Work Order has no such direct link) —
so `get_job_card_detail`'s Quality readiness is more precise than the Work
Order tool's, filtering directly on
`reference_type="Job Card"` + `reference_name=<job_card_name>` instead of by
`item_code`.

**Verified live against the Hetzner instance**: called the tool function
directly (same bypass-the-running-session approach as the prior tools, with
HTTP-method interception to positively confirm GET-only). Tested
`PO-JOB00001` (Completed — all header fields including
`process_loss_qty`/`total_time_in_mins` returned correctly, related Work
Order `MFG-WO-2026-00002` summary correct, item template
`Steel Bracket Assembly - Final QC` resolved, 0 linked Quality Inspections
found and correctly flagged as a gap since none exist on the instance yet —
consistent with `docs/erp-inventory.md`'s recorded `Quality Inspection` count
of 0) and `PO-JOB00006` (Open, no actuals yet — `actual_start_date`/
`actual_end_date` entirely absent from ERPNext's REST response rather than
null, same omission-not-null behavior already documented for Work Order's
`planned_end_date`, correctly flagged in `gaps`). Also tested a nonexistent
Job Card name (clean error dict, no crash), an empty string, and a
whitespace-only string (both cleanly rejected before any request was
issued). 9 HTTP requests total across the run, all `GET`, zero non-GET.

`apps/mcp-server/README.md` updated with the new tool's description and
verification note. No `QA_LOG.md` entry — internal dev tooling, not a
Sales/Stock/Buying core flow, same rationale as the prior four Phase 1
tools. `docs/ceylon-stack-documentation.html` and Notion not touched — no
product-facing status changed and the implementation plan (MCP Phase 1)
didn't change beyond what was already planned.

**`code-reviewer` pass**: no blocking findings. Reviewer confirmed:
empty-input/not-found handling exactly mirrors `get_work_order_detail`; the
`reference_type`/`reference_name` Quality Inspection filter is Frappe's
standard polymorphic-link pattern and is a real precision improvement over
the Work Order tool's item-level fallback; `work_order` being `None` when
unset or on lookup failure is handled safely (explicit `null` + a
corresponding `gaps` entry, nothing downstream dereferences it unsafely);
all calls are GET-only; response stays small and bounded. One non-blocking
observation carried over from `get_work_order_detail` (not new to this
tool): the final `quality_inspections_found` list call isn't wrapped in
try/except, so a non-2xx there would propagate as an uncaught error instead
of a clean dict — flagged as a pre-existing pattern across both detail tools
worth a future hardening pass together, not blocking for this package.

**Process note from reviewer, carried forward**: the working tree currently
bundles three uncommitted tool packages (`list_work_orders`, `list_job_cards`,
`get_job_card_detail`), each independently reviewed and verified. Per
`docs/controls/AGENT_USAGE_POLICY.md` §8 and this file's own Package Closure
Rules, these should land as three separate commits (one per package) rather
than one combined commit, to keep history and review responsibility
per-package — same guidance a prior session's review already gave for the
first two Phase 1 tools and that wasn't acted on before this package was
added on top. Not committed — commit was not requested this session; noted
here so whoever commits next splits them accordingly.

## 2026-09-17 — Manufacturing frontend package 1: module shell + Work Orders list

Unlocked the Manufacturing module in `apps/frontend` — the first Manufacturing frontend
work, now that the Current Mission priority lock's condition is met (Inventory MVP shipped
+ QA'd 2026-09-16, Buying core cycle shipped + live-verified 2026-09-16). Scoped strictly to
module shell + one read-only list page, per this task's package boundary:

- **Sidebar** (`components/Sidebar.tsx`) and the `/` module picker
  (`app/(app)/page.tsx`): Manufacturing switched from `soon: true`/greyed to a real,
  clickable module. Added `MANUFACTURING_NAV_GROUPS` with exactly one group/one item
  (Work Orders) — deliberately no "Soon" placeholders for Job Cards/BOM/Workstations,
  to avoid implying more than this package built.
- **`/manufacturing`** (`app/(app)/manufacturing/page.tsx`): module home placeholder,
  same shape as the existing `buying/page.tsx`/`stock/page.tsx` placeholders.
- **`/manufacturing/work-orders`** (`app/(app)/manufacturing/work-orders/page.tsx` +
  `components/WorkOrdersTable.tsx`): read-only list of the `Work Order` doctype —
  filters (ID, Item, Company, Status), sort, pagination, and 403 → `AccessDeniedNotice`
  handling, mirroring `sales/delivery-notes/page.tsx`'s pattern (the stricter of the two
  candidate references — `buying/purchase-orders/page.tsx` lacks the 403 handling).
  No row links and no "+ New" — there is no Work Order detail/create page yet, so
  nothing in the UI implies one exists.
- **`lib/erpStatus.ts`**: added `workOrderStatus()`. Work Order's `status` field enum
  (Draft/Submitted/Not Started/In Process/Stock Reserved/Stock Partially Reserved/
  Completed/Stopped/Closed/Cancelled) was live-verified via
  `mcp__ceylon-stack__get_doctype_fields` this session, not guessed — but the tone
  mapping itself is this app's own reasonable choice, not a mirrored Desk
  `get_indicator` (no SSH access to read `work_order_list.js` this session, unlike the
  Buying status functions which had that access).
- **`lib/tableColumns.ts`**: added `"work-orders"` to the `TableId` union.

**Verification**: `npm run lint`, `npx tsc --noEmit`, and `npm run build` all clean.
Full browser/UI verification wasn't done (no login attempted this session — see
`QA_LOG.md`); instead, the exact `listDocs`/`getCount` calls the page makes were
confirmed live against the real ERPNext instance via direct REST calls, returning all
6 real Work Orders (`MFG-WO-2026-00001..006`) with the correct field shape, a working
status filter, and a matching `get_count`. Confirmed no raw `fetch` outside
`lib/erpnext.ts` and no ERPNext/Frappe core files touched.

**`code-reviewer` pass**: no blocking findings. Confirmed pattern compliance against
both Sales/Buying reference pages, correct scope boundary (no accidental link/button
implying an unbuilt detail page), and correct field/status handling. One non-blocking
suggestion — `bom_no` was fetched but not rendered — fixed by adding it as a hidden
(`defaultVisible: false`) column, matching the existing convention for secondary
columns (e.g. `schedule_date`/`company` on `PurchaseOrdersTable`).

No `qa-tester` run — this package has no submit/cancel/write path to validate (see
`AGENT_OPERATING_GUIDE.md` §8: QA is for core-flow validation; a read-only list has no
flow to exercise beyond the live-data verification already logged in `QA_LOG.md`).
`docs/ceylon-stack-documentation.html` and Notion not yet updated — deferred to a
`release-tracker` pass. Not committed — commit wasn't requested this session.

**Next Manufacturing package** (not started): Work Order detail page, then Job Cards,
BOM, Workstations, and eventually live status/OEE — each its own scoped package per
`docs/controls/FRONTEND_GUIDE.md` §11.

## 2026-09-17 (later) — Manufacturing frontend package 2: Work Order detail page + list link

**Superseded same day, corrected below**: an earlier pass of this entry described a much
thinner header+Comments-only detail page and a 3-file diff. The page was substantially
expanded later the same session (full Production Progress/Materials/Operations/Job
Cards/Quality Readiness/More Info) before being committed anywhere — the log below
describes the actual page as it now stands, not that earlier draft. Flagged by
`code-reviewer` as a real doc-accuracy gap (the review that approved the thinner version
could not have been reviewing this diff) — fixed here rather than left inconsistent.

Closed the navigation gap package 1 deliberately left open, and built the full read-only
Work Order document view. `app/(app)/manufacturing/work-orders/[name]/page.tsx` — no
`DocActionBar`, no Edit form, no create/submit/cancel anywhere (Work Order write actions
aren't built in this frontend; nothing here implies otherwise). Six `DocTabs`:
- **Details**: Production Progress (produced/qty/process loss/remaining, safe against
  `qty=0` and `produced_qty > qty`, via the existing `ProgressBar`) + Production Information
  (Production Item — linked to `/sales/items/[name]`; BOM No — plain text, no BOM detail
  route yet; Quantity/Stock UOM; Company; Project when set; Sales Order — linked to
  `/sales/orders/[name]` when set; Source/WIP/Target Warehouse — each linked to
  `/stock/warehouses/[name]` when set; Planned/Actual Start/End dates).
- **Materials**: `required_items` child table (embedded free in the single `getDoc` response
  — Frappe returns child tables on a single-document GET with no extra request), rendered
  via the existing `PlainLineItemsTable` (Item/Qty/UOM + its `extra` freeform fields for
  Transferred/Consumed/Source Warehouse) — reused as-is, not forked.
- **Operations**: `operations` child table (same free embed) in a hand-rolled read-only
  table (Seq/Operation/Workstation/Status/Time/Completed Qty/Batch Size/Planned+Actual
  Start+End) — no existing shared component fit this column shape, styled to match
  `PlainLineItemsTable`'s classes rather than forking a new generic table component for a
  single use.
- **Job Cards**: one additional bounded `listDocs("Job Card", { filters: [["work_order","=",
  doc.name]], limit: 50 })` call (not per-row, not unbounded) showing Job Card/Status/
  Operation/Workstation/For Qty/Completed Qty/Expected+Actual Start+End. Job Card names stay
  plain text — no Job Card detail route exists yet (separate future package) — deliberately
  not linked.
- **Quality Readiness** (inside the Job Cards tab): reads each already-fetched Job Card's own
  `quality_inspection_template`/`quality_inspection` fields — confirmed live via
  `mcp__ceylon-stack__get_doctype_fields("Job Card")` this session as genuine direct fields on
  Job Card (`quality_inspection_section` → `quality_inspection_template` Link to "Quality
  Inspection Template", `quality_inspection` Link to "Quality Inspection"), and independently
  confirmed queryable via `mcp__ceylon-stack__list_documents("Job Card", filters={"work_order":
  "MFG-WO-2026-00002"}, fields=["name","quality_inspection_template","quality_inspection"])`
  returning real rows (both null on this instance's real Job Cards — no data has been entered,
  not a query failure). **Deliberately does not** read the production Item's own
  `quality_inspection_template` config field or query Quality Inspection records directly —
  that would be inferring Work Order-level quality from an unrelated Item-level default, which
  the task explicitly ruled out. (Note: `apps/mcp-server`'s own `get_work_order_detail`/
  `get_job_card_detail` tools take the Item-level approach instead, for their own different,
  narrower purpose — the two aren't inconsistent, they answer different questions.)
- **More Info**: Created/Last modified/Company. Created By/Modified By deliberately omitted —
  every write in this app runs under the one shared `frontend-integration` service account,
  so those fields would show that account's email on every document, not the real person; the
  Comments tab is where a real attributed name actually appears (see
  [[project_frontend_build]]'s "Auth model" section).
- **Comments**: unchanged generic `ActivityTimeline`/`buildTimeline`/`postCommentAction`.

`components/WorkOrdersTable.tsx`'s ID column wraps the name in the exact same
`<Link href=... className="font-mono text-signal hover:underline">` pattern
`PurchaseOrdersTable.tsx` uses — no new link abstraction. `components/DocField.tsx`'s `value`
prop widened from `string` to `React.ReactNode` (one-line, backward-compatible — confirmed
against all ~15 existing call sites) so linked fields (Production Item/Sales Order/Warehouses)
render through the same `<dt>/<dd>` layout as every plain field.

**Verification**: `npm run lint`, `npx tsc --noEmit`, and `npm run build` all clean (re-run
after two post-review fixes below). `.next/server/.../manufacturing/work-orders/[name]/page`
confirmed compiled. Field names for Work Order/Work Order Item/Work Order Operation/Job Card
verified live via `get_doctype_fields` against all 4 required statuses (Not Started
`MFG-WO-2026-00006`, Cancelled `-00005`, Completed `-00004`, In Process `-00002`) plus direct
child-row existence checks via `list_documents`. No raw `fetch` outside `lib/erpnext.ts`, no
ERPNext/Frappe core touched, no write/mutating call anywhere in the diff.

**`code-reviewer` pass** (against the actual 6-tab diff): one blocking finding — this
PROGRESS.md entry (and `docs/ceylon-stack-documentation.html`'s matching changelog row)
described the earlier, thinner page instead of what actually shipped; fixed by rewriting both
to match reality, as this entry now does. Also caught two declared-but-unrendered fields
(`process_loss_qty`, `operations[].batch_size`) — real oversights, now wired into Production
Progress and the Operations table respectively (fixed, re-verified: lint/tsc clean). Everything
else passed clean: read-only constraint held, query bounding correct (exactly 1 `getDoc` + 1
bounded `listDocs`), field names correct, all 3 document-link targets confirmed to exist
(`/sales/items`, `/sales/orders`, `/stock/warehouses`), BOM/Job Card correctly left unlinked,
null/undefined handled everywhere (including ERPNext's confirmed-live behavior of omitting a
field entirely rather than returning null, e.g. `planned_end_date` on some real records),
`PlainLineItemsTable` reuse vs. the two hand-rolled tables judged a reasonable
avoid-premature-abstraction call (each shape used exactly once), `DocField` widening backward
compatible, tables responsive (`overflow-x-auto`), control-doc wording edits confirmed surgical.

No `qa-tester` run — same rationale as package 1: read-only, no submit/cancel/write path to
validate. `AGENT_OPERATING_GUIDE.md` §8 doesn't list Manufacturing as a core flow requiring a
full QA cycle yet; browser verification wasn't done (no login attempted this session), but
every field/query this page relies on was confirmed live via the MCP tools above.

`docs/ceylon-stack-documentation.html` changelog row corrected to match this entry. **Committed
2026-09-17 in `25b882e`** (bundled with packages 3 and 5) — the HTML status/changelog update
above landed in that same commit. Notion sync for this package remained outstanding until the
governance-closure pass on 2026-09-17 (see `docs/operations/AI_WORK_LOG.md`).

**Next Manufacturing package** (not started): Work Order create/submit/cancel, Job Card
list/detail, BOM, Workstations, and eventually live status/OEE — each its own scoped package
per `docs/controls/FRONTEND_GUIDE.md` §11.

## Manufacturing — Work Order Create (package 3, 2026-09-17)

Built `apps/frontend/src/app/(app)/manufacturing/work-orders/new/page.tsx` +
`manufacturing/work-orders/actions.ts` (`createWorkOrderAction`, create-only — no submit) +
`components/WorkOrderForm.tsx`, following `sales/orders/new`'s pattern. New small lookup file
`lib/actions/bomLookup.ts` (`listBomsForItem`, `getBomDetails`) and a `listManufacturableItemOptions`
export added to the existing `lib/actions/itemLookup.ts` (not forked). No changes to
`lib/erpnext.ts` or `lib/stockDefaults.ts` — both reused as-is.

- **Production Item** restricted to items with `default_bom` set (live-verified ERPNext field,
  the reliable native way to mean "manufacturable" — no custom inventory engine). Only one such
  item exists on this instance today: `FG-STEEL-BRACKET-ASSY` → `BOM-FG-STEEL-BRACKET-ASSY-001`.
- **BOM** select auto-fills/auto-selects when one active+default BOM exists for the item
  (`listBomsForItem`: `item=X, docstatus=1, is_active=1`), editable otherwise.
- **BOM materials/operations preview** is read-only and client-scaled from the BOM's own
  top-level `items`/`operations` tables (`getBomDetails` → single `getDoc("BOM", ...)`) —
  `required_qty = bomItem.qty * (workOrderQty / bom.quantity)`, recomputed on qty change. No
  multi-level explosion in the frontend; `use_multi_level_bom` is passed straight through to
  ERPNext, which explodes server-side. Live-verified twice (qty=7 and qty=13 against the one
  live BOM) — exact match to ERPNext's own computed `required_items` both times.
- **Warehouses** (Source/WIP/Target) are optional selects from `getStockDefaults`, soft-defaulted
  by matching warehouse name substrings ("Stores"/"Work In Progress"/"Finished Goods") — fully
  editable, no ERPNext-native default exists for these (checked `Manufacturing Settings` live,
  confirmed it carries no default warehouse fields).
- **Material Readiness** (optional, only shown once a source warehouse is picked) reuses the
  existing `getBinQty`/`StockBadge` — same soft-warning pattern already used on Delivery Note
  lines, not a new inventory engine.
- **Create behavior**: `createDoc` only, never `submitDoc` — every created Work Order stays at
  docstatus 0 (Draft), matching the mission's draft-first rule. Required fields enforced before
  the call: `production_item`, `bom_no`, `qty>0`, `company`, `planned_start_date`.
- **Live-confirmed gap worth remembering for the future Job Card package**: ERPNext populates a
  newly-inserted Work Order's `required_items` from `bom_no`+`qty` automatically, but its
  `operations` table stays **empty** on a plain REST insert even when the BOM has operations —
  pulling BOM operations into a Work Order is normally a Desk-side client script action, not
  something `validate()` does alone. Doesn't affect this package (the Operations preview reads
  from the BOM doc, not the created WO) but a future package must populate `operations`
  explicitly rather than assume it's already there.
- Added the "+ New Work Order" button to the list page and corrected its now-stale doc comment
  (previously said create wasn't built).

**Code review**: `code-reviewer` found no blocking issues — payload field names, datetime-local→
ERPNext conversion, division-by-zero guards on the scaling math, error handling, reuse
discipline, and bounded queries all confirmed correct against the live schema, not just
plausible-looking.

**QA**: live-tested via direct REST (same method as prior Manufacturing/Sales/Buying/Stock QA
passes — Next.js server actions aren't curl-drivable) — created `MFG-WO-2026-00007` (qty=7) and
`MFG-WO-2026-00008` (qty=13), confirmed Draft status, correct `required_items` scaling at both
quantities, list/detail visibility, and two error-path cases (invalid `bom_no` → clean
`LinkValidationError` message; a fractional qty ERPNext's own UOM rule rejects → clean
`ValidationError` message, no orphan doc created either time). Both test Work Orders deleted
after verification; live Work Order count back to the pre-QA baseline of 6. One non-blocking
finding (the `operations` gap above) fed back into this package's own code comment rather than
left as a surprise for later. **Result: PASS.** Fixed the one inaccurate doc comment QA flagged
(`actions.ts` previously implied ERPNext auto-populates `operations` too — corrected).

**Committed 2026-09-17 in `25b882e`** (bundled with packages 2 and 5) — the
`docs/ceylon-stack-documentation.html` status/changelog update for this package landed in that
same commit. Notion sync for this package remained outstanding until the governance-closure pass
on 2026-09-17 (see `docs/operations/AI_WORK_LOG.md`).

## Manufacturing frontend Package 4 — Work Order Material Change investigation (2026-09-17): STOPPED before write UI, no code changed

Mission was "Work Order Material Change / Production Variance workflow" — letting production
substitute/add/remove/re-quantify materials on a specific Work Order without touching the master
BOM. Per the mission's own explicit stop condition, investigation came first and its outcome
requires stopping before any write UI is built — no frontend code was written this session.

**Method**: read ERPNext/Frappe core source directly on the live Hetzner instance via SSH
(`erpnext/manufacturing/doctype/work_order/work_order.py`, `work_order.json`,
`work_order_item.json`, `frappe/model/document.py` + `base_document.py`'s update-after-submit
machinery, `erpnext/stock/doctype/item_alternative/`, `stock_entry.py`/`stock_entry_detail.json`)
— read-only, no core files modified. Findings were then live-verified against the real instance
with a temporary Draft/Submitted Work Order (`MFG-WO-2026-00009`, built from the existing
`FG-STEEL-BRACKET-ASSY` + `BOM-FG-STEEL-BRACKET-ASSY-001`), not just inferred from source.

**Core finding — Work Order.required_items cannot be edited via a normal document update once
submitted.** Neither the parent `required_items` table field nor any `Work Order Item` child
field carries `allow_on_submit: 1` (confirmed in both DocType JSONs), so Frappe's own
`_validate_update_after_submit()` blocks any change to item_code/required_qty/row count once
`docstatus = 1`. Live-confirmed: editing `required_qty` on a submitted test Work Order raised
`UpdateAfterSubmitError: "Row #1: Not allowed to change Required Qty after submission from 4.0
to 5.0"` exactly as the source predicted. This is not a permissions gap or something a frontend
workaround should route around — it's the same core safety mechanism that already protects every
other submitted document in this system (Sales Order, Purchase Order, etc.).

**While still Draft**, `required_items` edits behave asymmetrically, live-confirmed on the same
test WO: a plain `required_qty` edit (4.0 → 7.0, saved, reloaded) **silently reverted to 4.0**
— because `Manufacturing Settings.allow_editing_of_items_and_quantities_in_work_order` is `0`
(disabled) on this instance, so `validate()` unconditionally calls
`set_required_items(reset_only_qty=True)` on every save, which resets the qty of any row whose
`item_code` still matches the BOM. An `item_code` **substitution** on a row (BOM item → a
different item entirely), by contrast, **did persist** across save+reload — that code path only
touches `required_qty` for BOM-matching rows, never resets `item_code`. (Caveat found in the same
test: nothing merges duplicate `item_code` rows, so a careless substitution can produce two rows
for the same item — a real edge case any future Draft-stage editor UI would need to guard
against.)

**The real, ERPNext-native mechanism for a Work-Order-specific material deviation during
production is entirely Stock-Entry-driven, not a Work Order edit**, confirmed by source
(`work_order.py`'s `add_additional_items()`/`remove_additional_items()`, called from Stock
Entry's own submit/cancel flow, not from Work Order's controller):
- **Add a non-BOM material**: submit a **Material Transfer for Manufacture** Stock Entry against
  the Work Order with an extra item line. ERPNext appends it to `required_items` itself via a
  direct child-row insert (`is_additional_item=1`, `voucher_detail_reference` linking back to the
  Stock Entry Detail row) — this bypasses the update-after-submit block because it's a targeted
  server-side insert, not a `doc.save()`. Gated by
  `Manufacturing Settings.validate_components_quantities_per_bom` (must be off; it is, on this
  instance).
- **Remove such an added material**: cancel the Stock Entry that added it —
  `remove_additional_items()` deletes the matching row. Original BOM-derived rows can never be
  removed this way, or any other way, once submitted.
- **Transfer/consume more of an existing material**: allowed in aggregate up to
  `qty × (1 + Manufacturing Settings.transfer_extra_materials_percentage / 100)` — a
  site-wide percentage headroom, not a per-line revised-qty field. Currently **0% on this
  instance**, so no over-transfer is possible today without the founder raising that setting.
- **Substitute one item for another** (Scenario A's headline example): native ERPNext support
  exists as **`Item Alternative`** (approved `item_code` ↔ `alternative_item_code` pairs, plus
  `Item.allow_alternative_item` and `Work Order.allow_alternative_item` checkboxes) and a
  whitelisted `get_alternative_items` search method — but it's exercised on the **Stock Entry**
  line (`Stock Entry Detail.original_item` + `allow_alternative_item`), not on the Work Order.
  Work Order's `required_items` row for the original item keeps accruing the correct
  transferred/consumed qty via `original_item` matching, while its own `item_code` never
  changes — a clean design, but **currently unusable on this instance**: none of the 3 raw
  materials or the 1 BOM have `allow_alternative_item` set, and 0 `Item Alternative` records
  exist (confirmed live). Standing up this feature needs master-data setup first, not frontend
  code.

**Master BOM confirmed unchanged throughout** — `BOM-FG-STEEL-BRACKET-ASSY-001`'s item list was
read before and after every test-WO mutation and was byte-identical both times.

**Audit trail**: Frappe's native `Version` doctype auto-logs field-level diffs (including child
tables) on every save, covering "changed by/at" for Draft-stage edits — but neither `Work Order
Item` nor `Stock Entry`/`Stock Entry Detail` has a `reason`/`notes` field, so a business reason
("material shortage", "wastage allowance") has no structured home today. `Stock Entry.remarks`
(header-level free text) is the closest existing field and can carry a reason now without any
schema change; a real structured reason field would be a `smart_factory` custom-field addition,
not something to build inside this package.

**Decision**: per the mission's own stop condition, this rules out a generic "Work Order material
edit" UI for the submitted case — the scenario the mission actually cares about ("during actual
production the factory may need to change a material"). Building one would mean fighting core
Frappe's submit-safety model instead of using it. The correct next package, if picked up, is a
**Material Transfer for Manufacture Stock Entry creation flow** — which doesn't exist in the
frontend yet (`FRONTEND_GUIDE.md` §10a explicitly scoped that Stock Entry purpose out of Stock
module v1 as "Manufacturing-scope, not Stock-scope") — plus the master-data work to make
`Item Alternative` substitution actually usable. Both are bigger/different than a required_items
editor and belong to their own future scoped package(s), not built here.

No frontend code, `lib/erpnext.ts`, or `smart_factory` files were changed this session. No
`code-reviewer`/`release-tracker` run — nothing shipped to review or announce. Test Work Order
`MFG-WO-2026-00009` was cancelled and deleted after verification; live Work Order count is back
at its pre-investigation baseline.

## Manufacturing frontend Package 5 — Material Transfer for Manufacture (2026-09-17)

Built the Stock-Entry-driven material transfer workflow Package 4's investigation identified as
the correct (and only ERPNext-supported) path — not a Work Order editor. Scope per the mission:
Material Transfer for Manufacture only, nothing beyond it (no Manufacture/finished-goods entry,
no Job Cards, no BOM editing).

**Native ERPNext mechanism used, not reimplemented**: `erpnext.manufacturing.doctype.work_order
.work_order.make_stock_entry` — the exact whitelisted method Desk's own "Start" button calls
(`work_order.js`, live-read on the Hetzner instance). Called via `callMethodWithResult` with only
`work_order_id` + `purpose: "Material Transfer for Manufacture"` (no `qty` override), which
defaults to the Work Order's full remaining production qty — mirroring Desk's own default rather
than reinventing outstanding-qty math. The response already carries, per pending material line:
`transfer_qty` (ERPNext's own proposed remaining-to-transfer amount, `transfer_extra_materials_
percentage` headroom included), the item's cumulative `transferred_qty` so far, real Bin-backed
`actual_qty` at the source warehouse, and `s_warehouse`/`t_warehouse` defaults — all read straight
through, none recomputed client-side.

**New route**: `/manufacturing/work-orders/[name]/transfer-materials` (`page.tsx` + `actions.ts`),
new component `components/MaterialTransferForm.tsx`, new helper
`lib/actions/workOrderTransfer.ts`. "Transfer Materials" button added to Work Order Detail,
gated by a new `canTransferMaterials()` in `lib/erpStatus.ts` that mirrors ERPNext Desk's own
"Start" button visibility rule verbatim (read from `work_order.js`): `docstatus === 1`, status
not Closed/Completed/Stopped, `!skip_transfer`, `transfer_material_against !== "Job Card"`,
`!track_semi_finished_goods`, and at least one required item still pending — not a guessed rule.

**Partial transfer**: the "Transfer Now" qty per row defaults to ERPNext's own proposed amount
and is user-editable down to 0 (skip that item this round) or up to that same proposed maximum
(hard client-side cap — ERPNext's own submit-time validation is still the real authority).
Live-confirmed: transferring half of one item, then transferring "the rest" on a second visit
(re-calling `make_stock_entry`, which recomputes remaining from the now-updated `transferred_qty`)
correctly showed Required 8 / Transferred 4 / Remaining 4 after the first transfer, then
Transferred 8 / Remaining 0 after the second.

**Additional material** — real bug found and fixed via live QA, not by inspection alone: the
Stock Entry payload this app builds must include `fg_completed_qty` (same value
`make_stock_entry` itself sets — the Work Order's remaining qty to produce). Omitting it — the
initial implementation's actual state — meant ERPNext's `Stock Entry.update_work_order` never
called `add_additional_items`/`update_work_order_qty` at all (that whole block is gated behind
`if self.fg_completed_qty:` in `stock_entry.py`), so an item added beyond the BOM was accepted
and stock-moved but silently **never attached to the Work Order's `required_items`** — a real
functional gap that would have shipped invisibly. Fixed by threading `fg_completed_qty` from the
`make_stock_entry` response through `page.tsx` → `MaterialTransferForm.tsx` (hidden field) →
`actions.ts` (now required, throws if missing/zero). Re-verified live after the fix: an added
item correctly appears on the Work Order as `is_additional_item: 1` with a real
`voucher_detail_reference` back to the originating Stock Entry Detail row, and disappears again
when that Stock Entry is cancelled (`remove_additional_items` firing correctly). Additional rows
are visually tagged `ADDITIONAL` in both the transfer screen and the Work Order Detail materials
table, never merged into the BOM-standard rows.

**Alternative Item**: left unbuilt, exactly as scoped — `Item Alternative` records and
`allow_alternative_item` remain unconfigured on this instance (confirmed again this session), so
no substitution UI would have real data to back it. Noted as a future master-data prerequisite,
not built here.

**Quantity headroom**: `Manufacturing Settings.transfer_extra_materials_percentage` is still 0%
on this instance (live-confirmed) — an excess-quantity attempt was live-tested and correctly
rejected by ERPNext itself (`"Cannot transfer 200.0 Nos of Item RM-BOLT-M6X20. Maximum
transferable quantity is 0.0 Nos."`), surfaced verbatim via the existing `ErpNextError.
erpnextMessage` pattern rather than a generic failure message.

**Warehouses**: source/target warehouse selects reuse `getStockDefaults()` (already filters to
`is_group=0, disabled=0`). Live-tested a submit against a real group warehouse — correctly
rejected (`"Group node warehouse is not allowed to select for transactions"`).

**Draft vs Submit**: `saveTransferDraftAction` (create-only, redirects to the existing
`/stock/stock-entries/[name]` detail page) vs `submitTransferAction` (create+submit, redirects
back to Work Order Detail with a `?transferred=` success banner). Live-confirmed a Draft Stock
Entry does not move stock or touch the Work Order's `transferred_qty` — only submission does.

**Batch/serial**: none of the 3 real raw materials require batch/serial (re-confirmed live).
Built the guard anyway per the mission's instruction — `page.tsx` fetches each preview row's
`has_batch_no`/`has_serial_no` via the existing `getItemLineDefaults` (bounded to the Work
Order's own handful of BOM lines, not a list-scale query) and the form blocks/disables that row
with a truthful message rather than silently building an invalid Stock Entry if one ever does.

**Work Order Detail enhancements**: Materials tab rebuilt from the old generic
`PlainLineItemsTable` into a dedicated table with Required/Transferred/Remaining/Consumed/
Source/Readiness columns (Readiness reuses `StockBadge`, not a new stock calculation) plus an
`ADDITIONAL` tag read from Work Order Item's own real `is_additional_item` field. Added a
"Material Transfers" section listing related Stock Entries (bounded `listDocs` filtered to
`work_order` + this purpose, linked to the existing Stock Entry detail route).

**Live QA** (dev instance only, confirmed no client/production stock — same instance every prior
QA pass has used): ran via `bench console` against the real ERPNext instance (same method as
every prior QA pass — Next.js server actions aren't curl-drivable), building the exact payload
shape `actions.ts` produces. Covered: full transfer, partial transfer, additional material
(twice — the pre-fix failure and the post-fix success), excess-quantity rejection, invalid
(group) warehouse rejection, Draft-doesn't-move-stock, and BOM-integrity checks before/after
every mutation (byte-identical every time). One unrelated discovery along the way: a prior
session's Package 3 QA pass had claimed `MFG-WO-2026-00007`/`00008` were both deleted after
verification, but `MFG-WO-2026-00008` (Draft) and a Stock QA pass's `MAT-STE-2026-00010` (Draft)
were still live on the instance — cleaned up both this session; Work Order count is back to the
documented baseline of 6.

**Code review**: `code-reviewer` found no blocking code defects — headless boundary, secrets
hygiene, `fg_completed_qty` wiring end-to-end, native-method reuse, batch/serial safety (rows
are actually excluded from the submitted payload, not just visually disabled), BOM-mutation
risk (zero), Draft-vs-Submitted semantics, and component/pattern reuse all confirmed correct.
One "blocking" finding (PROGRESS.md/QA_LOG.md missing their Package 5 entries) was a read-timing
race — the review agent was spawned before this session finished writing those entries in the
same turn, not a real gap; both entries were already present once written. Two non-blocking
items applied anyway as good practice: (1) `getMaterialTransferPreview` no longer collapses a
real ERPNext error (permission denial, ineligible Work Order) into the same `null` result as
"nothing left to transfer" — now returns a discriminated `{ preview } | { error }` so the page
can show the real cause instead of a guess; (2) confirmed (not changed) that `submitTransferAction`
never calls `submitDoc`/`cancelDoc` on **Work Order** itself — only on the Stock Entry it
creates — consistent with every prior Manufacturing package's "each its own scoped package"
precedent and with this package's own mission brief, which explicitly asked for a Submit
Transfer action on the Stock Entry. One item left as-is per the reviewer's own "not blocking"
assessment: `MaterialTransferForm`'s "+ Add Material" doesn't check the Work Order's *fully-
transferred* required items before tagging a re-added item `ADDITIONAL` — cosmetic only, since
ERPNext's own server-side item_code matching decides the real outcome (and would reject an
already-satisfied line as excess under the current 0% headroom setting either way).

**Committed 2026-09-17 in `25b882e`** (bundled with packages 2 and 3) — the
`docs/ceylon-stack-documentation.html` status/changelog update for this package landed in that
same commit. Notion sync for this package remained outstanding until the governance-closure pass
on 2026-09-17 (see `docs/operations/AI_WORK_LOG.md`).

## Manufacturing frontend Packages 2/3/5 — governance-closure corrections (2026-09-17, later)

Codex's independent review of commit `25b882e` (per `docs/controls/AI_AGENT_HANDOFF_POLICY.md`)
returned `CHANGES REQUIRED` with six findings (`CX-MFG-001` through `CX-MFG-006`, see
`docs/operations/AI_WORK_LOG.md`). This session addressed them — still uncommitted as of this
entry, pending Codex's re-review of the same package boundary.

- **`CX-MFG-001` (HIGH) — Material-transfer server actions trusted client-submitted hidden
  fields**: `transfer-materials/actions.ts` built the Stock Entry from `company`/`bom_no`/
  `use_multi_level_bom`/`to_warehouse`/`fg_completed_qty` hidden `<input>`s — a tamperable
  client copy — using the trustworthy bound `workOrderName` route argument only for
  revalidation/redirect, never to constrain the actual document being created. Fixed by
  re-deriving all of those fields from a fresh `getMaterialTransferPreview(workOrderName)` call
  (re-invoking ERPNext's own `make_stock_entry`) keyed off the bound argument — the same
  re-fetch-the-parent-server-side pattern already established by
  `createDeliveryNoteFromSalesOrderAction`. Per-row `item_code`/`qty`/`s_warehouse` remain the
  only real client input; master-data fields for each row now come from the fresh preview (for a
  pending/required item) or a fresh `getItemLineDefaults` lookup (for an additional item), never
  from the client. Hidden fields for the header trimmed out of `MaterialTransferForm.tsx`
  entirely — dead code removed, not just unused.
- **`CX-MFG-002` (HIGH) — Work Order Create previewed BOM operations it never persisted**:
  `WorkOrderForm.tsx` shows an Operations preview read from the BOM, but
  `createWorkOrderAction` never sent `operations` on create — ERPNext's own `validate()` leaves
  that table empty on a plain REST insert (live-confirmed, Package 3's own QA), so the created
  Work Order was not behaviorally equivalent to what the user was shown. Fixed by building an
  `operations` array server-side from a fresh `getBomDetails(bom_no)` call, `time_in_mins` scaled
  by `qty / bom.quantity` (mirroring `required_items`' own scaling). Flagged
  `MFG-UNV-007` in `docs/backend/99-unverified/unverified-behaviours.md` — the scaling
  convention is reasoned, not live-verified (no SSH/`bench console` access this session).
- **`CX-MFG-003` (MEDIUM) — Quality Readiness ratio miscounted**: the numerator counted every
  Job Card with a recorded `quality_inspection`, not scoped to the same
  `quality_inspection_template`-carrying population as the denominator — a Job Card with an
  inspection but no template could push the ratio above the real population (e.g. "3 of 2").
  Fixed: numerator now filters within `jobCardsWithTemplate`.
- **`CX-MFG-004` (DOCUMENTATION) — stale release/README text**: `apps/frontend/README.md`'s "App
  shell" bullet still described Manufacturing as greyed "coming soon";
  `docs/ceylon-stack-documentation.html`'s Work Orders list status line still claimed no "+ New"
  action existed even though Work Order Create shipped in the same commit. Both corrected. Three
  stale "not committed"/"pending release-tracker" notes in this file (this package's own Package
  2/3/5 entries) also corrected to name commit `25b882e` — see those entries above.
- **`CX-MFG-006` (NEEDS_VERIFICATION) — duplicate `item_code` rows indexed unsafely**: Package
  4's investigation had already live-confirmed a Draft-stage item substitution can leave two
  `Work Order Item` rows sharing an `item_code` (nothing merges them), but the Work Order Detail
  Materials tab and `MaterialTransferForm.tsx` both used `item_code` as the React `key`, and the
  transfer form's per-row qty/warehouse state was keyed by `item_code` too — a real duplicate
  would have silently collapsed two rows' state into one, losing one row's qty/warehouse on edit.
  Hardened (not resolved): both now key by row index instead. Whether ERPNext's own
  `make_stock_entry` can itself return duplicate `item_code` rows in its response remains
  unconfirmed — logged as `MFG-UNV-008`, left `NEEDS_VERIFICATION`.
- **Not a code change**: `CX-MFG-005` (no formal `CLAUDE PACKAGE HANDOFF` or `AI_WORK_LOG.md`
  entry existed for this package) — closed by this session's `AI_WORK_LOG.md` additions and the
  `CLAUDE PACKAGE HANDOFF` produced at the end of this session.

**Verification**: `npm run lint`, `npx tsc --noEmit`, and `npm run build` all clean after every
fix. No live ERPNext re-verification this session — no SSH/`bench console` access available (a
credential-exploration action was correctly denied when attempted). See `QA_LOG.md`'s matching
entry. `code-reviewer` was not re-run as a separate pass this session — these are direct
corrections against Codex's own named findings, not new undiscovered surface area; Codex's
re-review is the next required check per `AI_AGENT_HANDOFF_POLICY.md`, not a second Claude-side
review of its own fix.

**Committed 2026-09-17 in `517f2ea`** (on top of `25b882e`). See the two follow-on entries below —
Codex's re-review of this commit found `CX-MFG-002` still incomplete, requiring two further
correction passes before final acceptance.

## Manufacturing Packages 2/3/5 — Codex re-review + second remediation pass (2026-09-18)

Codex's independent re-review of `517f2ea` (per `docs/operations/AI_WORK_LOG.md`) closed
`CX-MFG-001` outright but returned `CHANGES REQUIRED` on `CX-MFG-002`: `work-orders/actions.ts`'s
BOM→Work Order `operations` copy sent only `operation`/`workstation`/scaled `time_in_mins`,
scaling every operation's time unconditionally (including `fixed_time` operations, which
shouldn't scale). Fixed by copying the full set of `BOM Operation` fields that also exist on
`Work Order Operation` and aren't ERPNext-lifecycle-computed (`workstation_type`, `sequence_id`,
`batch_size`, `hour_rate`, `quality_inspection_required`, `is_subcontracted`,
`skip_material_transfer`, `backflush_from_wip_warehouse`, per-operation warehouse overrides,
`description`), field existence confirmed live via the `ceylon-stack` MCP server's
`get_doctype_fields`, and gating `time_in_mins` scaling on the source operation's `fixed_time`
flag. Also hardened `CX-MFG-001`'s material-transfer actions with an in-action session
re-check, a fresh Work Order eligibility re-check, and a running per-item quantity ledger against
duplicate submitted rows (Codex's specific required outcomes from its `CX-MFG-001` re-review).
`npm run lint`/`npx tsc --noEmit`/`npm run build` clean. **Committed in `3a04733`.**

## Manufacturing Package 3 — final `CX-MFG-002` correction (2026-09-18, third pass)

Codex's second re-review of `3a04733` closed `CX-MFG-001` for good but found the expanded
`CX-MFG-002` operations mapping still wrong on two specific points, both confirmed against live
schema evidence: it copied `BOM Operation.hour_rate` (transaction currency) instead of
`base_hour_rate` (company currency) onto `Work Order Operation.hour_rate`, and it omitted the
operation-level BOM reference (native `BOM Operation.parent → Work Order Operation.bom`). Fixed:
`hour_rate` now sources from `base_hour_rate`; every copied operation now sets `bom: bom_no`
(structurally equal to `parent` under this app's non-exploded, single-top-level-BOM scope,
live-confirmed against the one real BOM on this instance). Before applying a manual fix, two
candidate native BOM→Work-Order population methods were probed directly against the live instance
as module-level dotted-path calls and both confirmed unavailable there (`AttributeError`) —
narrower evidence than "no native path exists at all," since a Frappe Document-bound method
(Desk's own `frm.call()` boundary) was not tested; manual mapping was retained on that basis, with
the document-method boundary left open for future investigation. `npm run lint`/`npx tsc
--noEmit`/`npm run build` clean; no live Work Order create performed this session (no
foreign-currency or `fixed_time` BOM exists on this instance to exercise it). **Committed in
`a2b5cb8`.**

**Codex's final re-review of `a2b5cb8`: `PASS WITH NON-BLOCKING FINDINGS`. `CX-MFG-001` and
`CX-MFG-002` are both `CLOSED`** — no blocking findings remain against Manufacturing Packages
2/3/5's reviewed package boundary. Remaining items are non-blocking `NEEDS_VERIFICATION`:
`MFG-UNV-005` (material-transfer GL/accounting impact), `MFG-UNV-007` (native
Desk/Document-method persistence comparison and the foreign-currency runtime scenario — no
suitable BOM exists on this instance to exercise either), and `MFG-UNV-008` (whether ERPNext's own
`make_stock_entry` can itself emit duplicate `item_code` rows). See
`docs/operations/AI_WORK_LOG.md`'s Package 3 row and detailed record, and
`docs/backend/99-unverified/unverified-behaviours.md`'s `MFG-UNV-007`, for the full breakdown.
This closure concerns the reviewed package boundary — it is not a claim that all Manufacturing
functionality or QA is complete; Job Cards, BOM management, Workstations, OEE, and Work Order
Submit/Cancel remain unbuilt, each its own future scoped package per the Current Mission priority
lock.

**Documentation closure pass (2026-09-18):** corrected two backend-doc/code-comment locations
(`docs/backend/05-manufacturing/work-order.md`, `docs/backend/99-unverified/unverified-behaviours.md`,
and the `buildWorkOrderFields` doc comment in `work-orders/actions.ts`) that overstated the
native-method probe's scope — narrowed to "rules out these two module-level dotted-path
invocations specifically, not a Document-bound method" per Codex's own non-blocking documentation
caution. Comment-only change; `npm run lint`/`npx tsc --noEmit`/`npm run build` re-confirmed clean
afterward. No application logic touched.

## Master Data navigation foundation — MD-1 (2026-09-18)

New "Master Data" module added to the Sidebar alongside Selling/Buying/Inventory/Manufacturing —
a canonical entry point onto shared master records, per `docs/master-data-architecture.md`'s
lowest-risk recommended first package. It's a pure addition: every link in the new module's three
groups (Products & Pricing — Items/Item Groups/Price Lists; Business Partners — Customers/
Customer Groups/Suppliers/Contacts/Addresses/Territories; Inventory Structure — Warehouses/
Batches/Serial Nos) points at a route that already exists and is already owned by Sales/Buying/
Stock — nothing was moved, forked, or redirected. New home page (`/master-data`) renders these as
a card grid, same visual pattern as the Selling module's "Reports & Masters" section. Entities
with no existing screen (UOM, BOM, Operation, Workstation, Company, Cost Center, Project,
Currency, Tax, Payment Terms) are deliberately left out rather than shown as dead links — each is
its own future package (`docs/master-data-architecture.md` §9, MD-2 through MD-10).

This package was carved out of a larger combined request ("Master Data Navigation Foundation +
Work Order Action UX") that also asked for a new Manufacturing Work Order lifecycle package
(action bar, Submit, Manufacture Stock Entry, Job Card actions) — bundling the two violated
`AGENT_USAGE_POLICY.md`'s one-mission-per-session rule and risked stepping into Job Cards, which
`CLAUDE.md`'s Current Mission lock names as its own future scoped package. An investigation
summary was returned first and the requester chose to proceed with MD-1 only; the Work Order
Action UX half was not started and needs its own separate authorization.

`code-reviewer` initially blocked on a legitimate catch — `docs/operations/AI_WORK_LOG.md`'s own
prior entries said Master Data work hadn't been authorized yet — resolved by recording the
authorization actually received this session in the ledger, not by overriding the finding.
Code-level review found no defects: no dead links (all 12 hrefs verified against real routes), no
existing route/component altered, pattern consistent with `STOCK_NAV_GROUPS`/`BUYING_NAV_GROUPS`
and `sales/page.tsx`. `npm run lint`/`npx tsc --noEmit`/`npm run build` all clean; dev server
confirmed `/master-data` returns the same `/login` auth-gate redirect every other protected route
does. No `qa-tester` run — pure navigation addition, no core-flow (Sales/Stock/Buying) change, no
data mutation. See `docs/operations/AI_WORK_LOG.md`'s matching 2026-09-18 entry for full detail.

## Master Data canonical routing — Items, Item Groups, Price Lists (2026-09-18)

Items, Item Groups, and Price Lists moved from `/sales/*` to their own canonical
`/master-data/*` routes — the first "Products & Pricing" slice of the Master Data
Canonicalization package (Item domain chosen first: highest reference count across the app,
and the flagship example in the authorizing request). No ERPNext-side behavior changed —
`createDoc`/`updateDoc`/`getDoc` calls, field payloads, and validation are byte-for-byte
identical to before; only the owning route/URL moved.

**Exhaustive cross-module link audit performed first** (12 files across `ItemsTable.tsx`,
`ReportTable.tsx`'s `INTERNAL_ROUTES` map — used by 7 report pages, the Work Order detail
page's Production Item field, `Sidebar.tsx` — 3 separate nav-group mentions, and both
workspace-card files) before moving anything, so every inbound reference to these three
entities was known and updated in the same pass — none discovered after the fact.

**Compatibility redirects** added to `next.config.ts` (`/sales/items(/...)`,
`/sales/item-groups(/...)`, `/sales/price-lists(/...)` → their `/master-data/*` equivalents,
`permanent: false`/307 since this app has no live traffic yet to have earned a permanent
redirect) — live-verified via curl against the dev server: list, detail (`RM-STEEL-001`
example), and `new` sub-routes all redirect correctly, and the new canonical routes correctly
hit the same auth gate every other protected route does.

**Batch and Serial No deliberately NOT moved.** Investigated rather than assumed: both
doctypes carry Frappe's `reference_doctype`/`reference_name` (Dynamic Link) fields — live-
confirmed via `get_doctype_fields` — meaning a Batch/Serial No's very existence is normally a
side effect of a transaction (a Stock Entry, Purchase Receipt, etc.), not a user filling out a
master form from scratch. Serial No additionally carries a transactional lifecycle `status`
enum (`Active/Inactive/Consumed/Delivered/Expired`) that Item/Customer/Warehouse have no
equivalent of. This confirms (not just reasons) the "hybrid master" classification
`docs/master-data-architecture.md` had already proposed — they stay under Inventory
(`/stock/batches`, `/stock/serial-nos`), not moved to Master Data.

**Customer/Customer Group/Supplier/Contact/Address/Territory/Warehouse deliberately not
moved either** — each is its own separate future package (matching
`docs/master-data-architecture.md`'s own MD-3 through MD-6 sequencing), not bundled into this
one. `Sidebar.tsx`'s Master Data "Business partners"/"Inventory structure" groups still link
out to their current Sales/Buying/Stock routes.

**`docs/controls/FRONTEND_GUIDE.md` corrected** (§3 tree diagram, §9 Sales masters list) to
stop claiming Items/Item Groups/Price Lists live under `sales/` — the specific, narrow
correction `docs/master-data-architecture.md` §9 flagged as needing to happen "once any
implementation package lands." A separate, unrelated stale claim found in the same section
(Manufacturing "not started") was left alone and flagged as a documentation follow-up, not
fixed here, per this package's own scope limit.

Checks: `npm run lint` — PASSED. `npx tsc --noEmit` — PASSED (after clearing a stale `.next`
type-cache that still referenced the deleted `sales/items` files — expected, not a real error).
`npm run build` — PASSED, exit 0, all 9 new `/master-data/*` routes present, zero `/sales/items`
`/sales/item-groups`/`/sales/price-lists` routes remain, no new diagnostics. Live curl
verification of redirects and auth-gating (above) — PASS. No `qa-tester` run: the ERPNext-side
create/update payloads are unchanged from before the move (verified by diff, not by inspection
alone), so the only real risk surface was the Next.js routing itself, which was directly
verified live; a full authenticated browser click-path (actually submitting the Item form
through a real login session) was not performed — no session credentials available in this
environment, consistent with every prior package in this repository's history. See
`docs/operations/AI_WORK_LOG.md`'s matching entry for the full file-by-file change list and
Codex handoff.

## Master Data canonical routing — Business Partner domain (Customers, Customer Groups, Suppliers, Contacts, Addresses, Territories) (2026-09-19)

Customers, Customer Groups, Contacts, Addresses, and Territories moved from `/sales/*`, and
Suppliers from `/buying/suppliers`, to their own canonical `/master-data/*` routes — the
second Master Data Canonicalization package, following the accepted Item-domain pattern
(`ddfeed4`/`5f20afa`/`4036c81`). No ERPNext-side behavior changed — `createDoc`/`updateDoc`/
`getDoc` calls and field payloads inside each moved `actions.ts` are byte-identical to before;
only the owning route moved.

**Investigation performed first, per the authorizing package brief.** Every current
Customer/Customer Group/Supplier/Contact/Address/Territory route, action, and inbound
reference was mapped before any file moved (see the matching `docs/operations/AI_WORK_LOG.md`
entry for the full inventory). Two relationship questions the brief specifically called out
were investigated live rather than assumed:

- **Contact/Address ↔ Customer/Supplier is Frappe's Dynamic Link model, not a foreign key.**
  Live `get_doctype_fields` calls confirm both `Contact` and `Address` carry a `links` child
  table (`fieldtype: "Table"`, `options: "Dynamic Link"`), and `Dynamic Link` itself carries
  `link_doctype` (any DocType) + `link_name` — i.e. one Contact or Address can reference any
  number of Customers, Suppliers, or other party doctypes; it is not owned by exactly one of
  either. `Contact` additionally carries its own single `address` Link field (a contact's own
  primary address) and `is_primary_contact`; `Address` carries `is_primary_address`/
  `is_shipping_address`. This frontend's Contact/Address screens are already generic
  (`MasterTable`/`masterActions`, no Customer-only or Supplier-only fields), so canonicalizing
  their route to `/master-data/contacts` and `/master-data/addresses` reflects this shared
  model rather than corrupting it — no schema or form-field change was made.
- **Customer Group and Territory are Frappe tree doctypes** (`is_group`/`parent_customer_group`/
  `lft`/`rgt` and `is_group`/`parent_territory`/`lft`/`rgt` respectively) — unchanged by this
  move; both already used the shared `MasterTable` component before and after.

**Supplier Group investigated and deliberately NOT built.** Live `get_doctype_fields` confirms
`Supplier Group` is a real ERPNext doctype (same tree shape as Customer Group:
`supplier_group_name`/`parent_supplier_group`/`is_group`/`lft`/`rgt`, plus a `Party Account`
child table for default payable accounts) and is referenced by `Supplier.supplier_group` today
via a plain text-or-dropdown field (`SupplierForm.tsx`'s `LinkOrTextField`). But this frontend
has never built a screen for it — no `/buying/supplier-groups` or equivalent ever existed. Per
the authorizing brief's own instruction not to blindly create routes with no existing
implementation, and `docs/master-data-architecture.md` §9 gap #3's same conclusion ("building
\[Supplier Group's\] first screen is new feature work, not a reorganization"), Supplier Group
was left out of this package. It would be a small, low-risk future package (identical shape to
the existing Customer Group/Territory screens — reuse `MasterTable`/`masterActions` as-is) but
is out of scope here.

**No CRM module exists in this frontend** — confirmed by directory listing, not assumed — so
the mission brief's CRM → Customer navigation example has no code to update; recorded here as
the current state, not implemented.

**Exhaustive cross-module link audit performed first**, before moving anything: 21 inbound
references across `CustomerForm.tsx`/`SupplierForm.tsx` (action-import type paths),
`CustomersTable.tsx`/`SuppliersTable.tsx` (row links), `ReportTable.tsx`'s `INTERNAL_ROUTES`
map (`Customer` entry), `lib/salesFlowMap.ts` (Sales Flow scene's Customer master-data step),
`lib/sellingWorkspace.ts` (5 entries: Customer, Customer Group, Contact, Address, Territory),
`lib/masterDataWorkspace.ts` (Business Partners card, now direct canonical links not link-outs),
`components/Sidebar.tsx` (Selling's "Customers & contacts" group, Selling's "setup" group's
Territories entry, Buying's "Suppliers & contacts" group, Master Data's own "Business partners"
group, plus 2 stale explanatory comments), and `app/login/page.tsx`'s post-login default
redirect. No Breadcrumb components exist inside any of the six moved route folders (verified —
none of these list/new/detail pages use `Breadcrumb`, unlike `master-data/page.tsx` itself), so
none needed updating. All twelve `new`/`[name]` sub-pages already imported their `actions.ts`
via relative `"../actions"` paths, so the file move alone didn't break them.

**Compatibility redirects** added to `next.config.ts` for all six entities' list/detail/new
paths (`/sales/customers(/...)`, `/sales/customer-groups(/...)`, `/sales/contacts(/...)`,
`/sales/addresses(/...)`, `/sales/territories(/...)`, `/buying/suppliers(/...)` → their
`/master-data/*` equivalents, `permanent: false`/307, same reasoning as the Item domain's
redirects) — live-verified via curl against a production server build: list, a dynamic-segment
detail example (`CUST-0001`/`SUP-0001`), `new`, and a query-string example (`?foo=bar`) all
redirect correctly with the segment/query string preserved, and the new canonical routes
correctly hit the same `/login?next=...` auth gate every other protected route does (not a
404, not an unauthenticated bypass).

**`docs/controls/FRONTEND_GUIDE.md` corrected** (§9 Sales "Masters" list — now only
`sales-persons`/`sales-partners`/`campaigns`/`settings`, since those are internal-team/
marketing constructs that stay Sales-owned per `docs/master-data-architecture.md`'s own
exclusion list; §10 Buying's Suppliers bullet — now points at `master-data/suppliers/`) to
stop claiming these six entities live under `sales/`/`buying/`.

**Backend documentation:** following the same precedent the Item-domain package set (see its
own entry above — `docs/backend/01-master-data/` was deliberately not created there either,
since that domain doc is `docs/master-data-architecture.md`'s own separate, not-yet-authorized
§8 deliverable), no `docs/backend/` files were created or edited by this package. The Dynamic
Link relationship evidence, the Customer Group/Territory tree-doctype confirmation, and the
Supplier Group gap above are recorded here as source material for whenever that domain doc is
authorized.

Checks: `npm run lint` — PASSED. `npx tsc --noEmit` — PASSED (after clearing a stale `.next`
type cache that still referenced the six deleted route paths — expected artifact staleness,
confirmed clean, not a real error). `npm run build` — PASSED, exit 0; all 18 new
`/master-data/{customers,customer-groups,contacts,addresses,territories,suppliers}` list/
detail/new routes present in the route output; zero `/sales/customers`, `/sales/customer-
groups`, `/sales/contacts`, `/sales/addresses`, `/sales/territories`, or `/buying/suppliers`
routes remain; only the same pre-existing `erpnextFetch network error` static-generation
diagnostics as every prior round. Live curl verification of redirects and auth-gating (above)
— PASS. No `qa-tester` run, matching the Item-domain package's own reasoning: the ERPNext-side
create/update payloads are unchanged from before the move (verified by diff against the
pre-move file content), so the only real risk surface was the Next.js routing itself, which was
directly verified live; a full authenticated browser click-path was not performed — no session
credentials available in this environment, consistent with every prior package in this
repository's history.

**Repository-wide stale-route search**: two non-runtime references found and deliberately left
alone — `docs/architecture/decisions/README.md` (a pre-existing modified file outside this
package's boundary at session start, per this package's own isolation instruction — inspected,
not touched) and `docs/brand/package/CeylonStack-Grouped-Sidebar.html` (a static design mockup,
same category the Item-domain package's own stale-route search already classified and left
alone for the same file). `docs/master-data-architecture.md` (untracked, pre-existing) still
proposes a nested `/master-data/business-partners/customers` route shape in its own §5 — this
package implemented the flat `/master-data/customers` shape instead, matching both the
authorizing brief's explicit target routes and the flat precedent the accepted Item domain
already set (`/master-data/items`, not `/master-data/products/items`); the architecture doc
itself was read for design authority but not modified, per the same preservation instruction
the Item-domain package followed for the same file.

Files: `apps/frontend/next.config.ts`; 24 files (4 each × 6 entities) moved from
`apps/frontend/src/app/(app)/{sales/{customers,customer-groups,contacts,addresses,
territories},buying/suppliers}/` to `apps/frontend/src/app/(app)/master-data/{customers,
customer-groups,contacts,addresses,territories,suppliers}/`; `apps/frontend/src/components/
{CustomerForm,SupplierForm,CustomersTable,SuppliersTable,ReportTable,Sidebar}.tsx`;
`apps/frontend/src/lib/{salesFlowMap,sellingWorkspace,masterDataWorkspace}.ts`;
`apps/frontend/src/app/login/page.tsx`; `docs/controls/FRONTEND_GUIDE.md`; `PROGRESS.md`;
`docs/operations/AI_WORK_LOG.md`. See `docs/operations/AI_WORK_LOG.md`'s matching entry for the
full Claude/Codex handoff record.

## Master Data canonical routing — Inventory Structure domain (Warehouse) (2026-09-19)

Warehouse moved from `/stock/warehouses` to its own canonical `/master-data/warehouses` route
— the third Master Data Canonicalization package, following the accepted Item-domain
(`ddfeed4`/`5f20afa`/`4036c81`) and Business Partner domain (`a99656d`/`4984963`) packages. No
ERPNext-side behavior changed — `createDoc`/`updateDoc`/`getDoc` calls and field payloads in
`actions.ts` are byte-identical to before; only the owning route moved.

**Investigation performed first, per the authorizing package brief.** Live `get_doctype_fields`
confirms `Warehouse` carries: `company` (required Link), `account` (optional Link to `Account`
— not currently exposed in this frontend's form, a pre-existing gap, not introduced or
widened here), `parent_warehouse` (optional self-referential Link) plus `is_group`, `lft`/`rgt`
(genuine Frappe nested-set tree fields), `warehouse_type` (Link to `Warehouse Type` — also not
currently in the form), `customer` (optional Link, for consignment-style warehouses — also not
in the form), and no `docstatus`/submit workflow at all (create/update only), matching the
existing action file's own comment. This package changed none of that — the current form's
field set (`warehouse_name`, `company`, `parent_warehouse`, `is_group`, `disabled`) is unchanged;
`account`/`warehouse_type`/`customer` remain out of scope as their own possible future package,
not something this routing move should silently add.

**Warehouse is structural master data, not a stock transaction — the classification this
package sets does not change what Inventory owns.** Stock Entry, Stock Ledger Entry, Batch, and
Serial No remain Inventory-owned per the accepted Item-domain package's own boundary; this
package did not touch any of their routes, forms, or actions. Batch and Serial No were
re-verified as still transaction-generated/operational (Frappe's `reference_doctype`/
`reference_name` fields, Serial No's own lifecycle status) and were deliberately NOT moved
alongside Warehouse, matching `docs/master-data-architecture.md`'s own §2/§7 classification.

**Hierarchy semantics preserved, not redesigned.** `parent_warehouse` and `is_group` remain
exposed as form fields exactly as before the move (both `new`/`[name]` pages' `FieldSpec`
arrays are unchanged content, only relocated). The list view remains the pre-existing flat
table (no tree/indent UI) — that was already an established, documented simplification before
this package ran (`FRONTEND_GUIDE.md`'s own note: "the list stays a flat table … matching
'simplified'"), not something this routing-only package introduced or was asked to relitigate.

**Exhaustive cross-module link audit performed first.** A repository-wide literal search for
`stock/warehouses` found exactly 5 non-route-implementation hits before any file moved:
`lib/masterDataWorkspace.ts` (the "Inventory Structure" card's Warehouses link — already
anticipating this exact move per its own prior comment), `components/Sidebar.tsx` (two nav
groups: Stock's own "Warehouses & tracking" group, and Master Data's "Inventory structure"
group — both already anticipating this move per prior comments referencing
`docs/master-data-architecture.md` §9), and `app/(app)/manufacturing/work-orders/[name]/page.tsx`
(4 `DocLink` entity-navigation occurrences: Source/WIP/Target Warehouse header fields plus the
Materials tab's per-line Source Warehouse link). All 4 files updated. No other file in the
40 that reference the `Warehouse` field/selector needed changing — confirmed by inspection that
`MaterialTransferForm`, `StockEntryForm`, `DeliveryNoteForm`, `StockBalanceTable`, and every
Stock/Buying/Sales `actions.ts` use Warehouse only as a transaction field or `fetchLinkOptions`
selector, never as entity navigation, per the brief's explicit "selectors remain selectors"
instruction. `ReportTable.tsx`'s `INTERNAL_ROUTES` map does not currently include a `Warehouse`
entry at all (only `Sales Order`/`Sales Invoice`/`Quotation`/`Customer`/`Item`) — this is an
absence, not a stale reference, so nothing there needed correcting; adding one would be new
navigation the brief explicitly said not to invent, left as a possible small future enhancement.

**Compatibility redirect** added to `next.config.ts` for `/stock/warehouses(/...)` →
`/master-data/warehouses(/...)`, `permanent: false`/307, same reasoning as the two prior
packages' redirects — live-verified via curl against a production build: list, `new`, a dynamic
segment (`WH-RM-001`), an encoded name containing a space and hyphen
(`Raw Material Warehouse - CS`), and a query string (`?saved=1&foo=bar`) all redirect correctly
with the segment/query preserved, no redirect loop, and the canonical route correctly hits the
same `/login?next=...` auth gate every other protected route does. The pre-existing, out-of-scope
`next` param query-string-drop behavior (Codex's earlier finding) was independently reproduced
here too (`?saved=1` on a canonical detail URL is dropped from the login `next` param) —
confirmed unchanged, not worsened, and not fixed, per the brief's explicit instruction.

**`docs/controls/FRONTEND_GUIDE.md` corrected** (the `master-data/` file-tree comment block,
which was already stale about the Business Partner domain's move and is now further corrected
for Warehouse) and `apps/frontend/src/app/(app)/master-data/page.tsx`'s own top-of-file comment
(same staleness, same fix) — both previously said Business Partners/Warehouses "remain
link-outs" or were "still pending," which was already inaccurate before this package started.

**Backend documentation:** following the same precedent both prior packages set, no
`docs/backend/` files were created or edited — no ERPNext-side field, relationship, or
business-rule behavior changed; this is a Next.js routing move only. The DocType findings above
(the confirmed `account`/`warehouse_type`/`customer`/tree fields) are recorded here as source
material for whenever a Warehouse backend-domain doc is authorized.

Checks: `npm run lint` — PASSED. `npx tsc --noEmit` — PASSED (after clearing `.next`, matching
the same expected artifact-staleness precedent as both prior packages). `npm run build` —
PASSED, exit 0; 3 new `/master-data/warehouses{,/new,/[name]}` routes present, zero
`/stock/warehouses` routes remain. Live curl verification of redirects, encoded-name/query
preservation, and auth-gating (above) — PASS, run against a local production server
(`next start`) since this environment has no route to the live Hetzner instance either way. No
`qa-tester` run, matching both prior packages' reasoning: the ERPNext-side create/update
payloads are unchanged from before the move, so the only real risk surface was the Next.js
routing itself, which was directly verified live; a full authenticated browser click-path was
not performed — no session credentials available in this environment, consistent with every
prior package in this repository's history.

**Repository-wide stale-route search**: besides the 4 files fixed above, the only remaining
`stock/warehouses` matches are: `next.config.ts` (the redirect source itself, intentional),
`masterDataWorkspace.ts`'s own explanatory comment (historical, intentional), this file's and
the prior two packages' own historical PROGRESS.md entries (left alone, not rewritten, per the
"do not rewrite legitimate historical records" instruction), `docs/controls/AGENT_USAGE_POLICY.md`
line ~161 (an illustrative "valid package size" example, not a real route claim — left alone as
a low-priority documentation follow-up, not a functional stale reference), and
`docs/master-data-architecture.md` (untracked, pre-existing, preserved unmodified per this
package's own isolation instruction — it independently proposed a nested
`/master-data/inventory-structure/warehouses` route shape in its own §5, which this package did
NOT follow, instead matching the flat precedent both prior accepted packages already set and the
authorizing brief's own explicit target route, `/master-data/warehouses`).

Files: `apps/frontend/next.config.ts`; 4 files moved from
`apps/frontend/src/app/(app)/stock/warehouses/` to
`apps/frontend/src/app/(app)/master-data/warehouses/` (`page.tsx`, `actions.ts`, `new/page.tsx`,
`[name]/page.tsx`) with internal `/stock/warehouses` references updated to
`/master-data/warehouses`; `apps/frontend/src/components/Sidebar.tsx`;
`apps/frontend/src/lib/masterDataWorkspace.ts`;
`apps/frontend/src/app/(app)/manufacturing/work-orders/[name]/page.tsx`;
`apps/frontend/src/app/(app)/master-data/page.tsx`; `docs/controls/FRONTEND_GUIDE.md`;
`PROGRESS.md`; `docs/operations/AI_WORK_LOG.md`. See `docs/operations/AI_WORK_LOG.md`'s matching
entry for the full Claude/Codex handoff record. Not yet independently reviewed by Codex —
shipped and internally verified (see `QA_LOG.md`), not self-declared accepted.

## Master Data canonicalization — Manufacturing Masters (BOM) investigation (2026-09-19)

**Gate B reached — investigation only, no implementation.** Authorized to investigate whether
BOM could be canonicalized under `Master Data / Manufacturing Masters`, same pattern as
Warehouse under `Inventory Structure`. Verified the accepted parent boundary
(`2a7076c87b4e74fb7ab2ba9e61e40355b5015468`) was exactly `HEAD` before starting, then searched
`apps/frontend/src` end to end: there is no `/manufacturing/boms`, no `/master-data/boms`, and no
BOM list/detail/create/edit page anywhere in the frontend. The only existing BOM surface area is
`apps/frontend/src/lib/actions/bomLookup.ts` (`listBomsForItem`/`getBomDetails`), a read-only
lookup used exclusively inside Work Order Create's BOM selector/preview, plus `bom_no` rendered
as unlinked plain text (not a `DocLink`) on the Work Order list, Work Order detail page, and
`MaterialTransferForm.tsx`. This matches what `docs/backend/05-manufacturing/README.md` already
said before this package started. There was nothing to relocate — a BOM route move requires a
BOM route to already exist, and none does. No frontend code was written or moved.

Instead, live-verified the actual BOM domain model against the real ERPNext instance
(`mcp__ceylon-stack__get_doctype_fields`/`list_documents`/`list_doctypes`, 2026-09-19): BOM is a
submittable doctype with `amended_from`; `BOM Item`/`BOM Operation` are genuine child entities
(matching this app's existing narrow `BomItemRow`/`BomOperationRow` reads); `BOM Item.bom_no` is
the nested/sub-assembly BOM pointer (schema-confirmed, but the one real BOM on this instance —
`BOM-FG-STEEL-BRACKET-ASSY-001` — has zero sub-assembly components, so multi-level explosion
behavior itself is `NEEDS_VERIFICATION`, not observable); costing fields (`raw_material_cost`,
`total_cost`, etc.) are real, backend-computed, and not currently read by the frontend at all;
`Operation`/`Routing`/`Workstation` are confirmed independent Manufacturing masters classified
`BACKEND-SUPPORTED, FRONTEND-MISSING`; `Production Plan` is a real independent doctype with zero
frontend footprint anywhere in the repo. Captured in a new
`docs/backend/05-manufacturing/bom.md` baseline, cross-referenced from `master-erd.md`,
`unverified-behaviours.md` (new `MFG-UNV-009`, split from the former BOM-and-Job-Card
`MFG-UNV-004`), and `migration-status.md`.

Checks: not applicable — no frontend file changed, so there is no lint/type-check/build/route
delta to verify. `docs/ceylon-stack-documentation.html` was checked and already accurately shows
"BOM Management" as `Planned`/"not started"; nothing changed there, so `release-tracker` was not
invoked (no Live/Building/Planned status actually moved).

**Recommended next step, if a BOM package is separately authorized**: smallest useful increment
is a BOM detail/view page (header + Components/Operations tables, optionally the costing fields
`bom.md` now documents), which alone would let the three existing unlinked `bom_no` displays
become real entity links. Full BOM list/create/edit is a larger, separately-scoped decision given
how complex ERPNext's own BOM authoring screen is.

Files: `docs/backend/05-manufacturing/bom.md` (new); `docs/backend/05-manufacturing/README.md`;
`docs/backend/11-relationships/master-erd.md`; `docs/backend/99-unverified/unverified-behaviours.md`;
`docs/backend/15-migration/migration-status.md`; `PROGRESS.md`; `QA_LOG.md`;
`docs/operations/AI_WORK_LOG.md`. Zero files under `apps/frontend/` touched — confirmed by
`git status`/`git diff` before closing this package. See `docs/operations/AI_WORK_LOG.md`'s
matching entry for the full Claude/Codex handoff record. Not yet independently reviewed by
Codex — there is no code diff to review, only documentation-accuracy claims to verify.

## Manufacturing Masters — BOM Package 4A: read-only BOM entity frontend (2026-09-19)

**First BOM frontend implementation.** Authorized immediately after Codex's final closure review
of the investigation above accepted `GATE B = CONFIRMED` and named this exact package as the
recommended next step. Verified the accepted parent boundary
(`5698d392f070885bfd3ea2830620f25317d3c47f`) was exactly `HEAD` before starting.

Implemented, strictly read-only (no create/edit/submit/cancel/amend/cost-recompute action added
anywhere):
- `/master-data/boms` — minimal list (`BomsTable.tsx` on the existing `DataTable` shell, not
  `MasterTable`, specifically because `MasterTable` always renders a "+ New" link and this package
  is read-only by design). Search/Item/Company/Status filters, same `ListFilterBar`/
  `PaginationControls` pattern as every other list page.
- `/master-data/boms/[name]` — canonical detail page, same `getDoc`+`ErpNextError`+`notFound()`+
  `DocTabs` pattern as the Work Order detail page. Tabs: Overview (header fields, Finished Item
  link, Amended From link, default warehouse links), Components (BOM Item table — Item/Warehouse/
  nested-BOM entity links), Operations (BOM Operation table), Costing (backend-recorded
  raw-material/operating/total cost, explicitly labelled as not recalculated by this app), More
  Info (Created/Modified only, matching the Work Order detail page's own documented reason for
  omitting Created By/Modified By — shared service-account auth).
- Entity links added to existing plain-text `bom_no` displays: Work Order list
  (`WorkOrdersTable.tsx`), Work Order detail page, `MaterialTransferForm.tsx`. A "View BOM →"
  link (`target="_blank"`, so it can't interrupt an in-progress create form) added next to
  `WorkOrderForm.tsx`'s existing read-only BOM materials preview. The Work Order create BOM
  `<select>` itself is unchanged — still a selector, not replaced with navigation.
- Added `bomStatus` to `erpStatus.ts` (generic docstatus-only fallback, BOM has no separate
  `status` field — live-confirmed), `"boms"` to `tableColumns.ts`'s `TableId` union, a
  "Manufacturing masters" nav group to `Sidebar.tsx`'s Master Data module, and a matching card to
  `masterDataWorkspace.ts`/`master-data/page.tsx`'s copy.

Deliberately not built (per this package's own explicit boundary): BOM create/edit/delete/submit/
cancel/amend, cost recompute, an Item-detail-page BOM relationship section, Operation/Routing/
Workstation entity screens, Production Plan, and any Batch/Serial No change.

Live-reverified against the real ERPNext instance immediately before implementation (same-day
re-check of the investigation's own findings, `get_doctype_fields`/`list_documents`,
2026-09-19): `BOM`/`BOM Item`/`BOM Operation` field names used in the new page's types
(`company`, `item`, `item_name`, `quantity`, `uom`, `currency`, `conversion_rate`, `docstatus`,
`is_active`, `is_default`, `with_operations`, `amended_from`, `is_phantom_bom`,
`allow_alternative_item`, `track_semi_finished_goods`, `transfer_material_against`, `routing`,
`inspection_required`, `default_source_warehouse`, `default_target_warehouse`,
`raw_material_cost`, `base_raw_material_cost`, `operating_cost`, `base_operating_cost`,
`total_cost`, `base_total_cost`, `rm_cost_as_per`; `item_code`, `qty`, `rate`, `amount`,
`source_warehouse`, `operation`, `bom_no`, `include_item_in_manufacturing`; `hour_rate`,
`base_hour_rate`, `time_in_mins`, `batch_size`, `workstation`, `description`) all matched exactly
— no drift since the 2026-09-19 investigation baseline.

Checks: `npm run lint` — PASSED (clean). `npx tsc --noEmit` — PASSED (no errors). `npm run build`
— PASSED, `✓ Compiled successfully`; route manifest confirms `ƒ /master-data/boms` and
`ƒ /master-data/boms/[name]` alongside every existing route, no new static/legacy route. Started
the local dev server and curled both new routes plus a nonexistent-BOM path unauthenticated: all
three correctly 307-redirect to `/login?next=...` with the target path preserved/URL-encoded —
same auth gate as every other page, confirming the route exists and is protected before any
notFound()/data-fetch logic runs. No test login credentials were available in this session, so the
authenticated render (real data in the Overview/Components/Operations/Costing tabs, nested-BOM
link, 404 page for a genuinely missing BOM) was not click-path-verified — recorded as
`MFG-UNV-010`, same non-blocking precedent as the Item/Business Partner/Warehouse Master Data
packages' own "full authenticated browser click-path not run" gap. Read-only guarantee: grepped
every new/changed file for `createDoc`/`updateDoc`/`deleteDoc`/`POST`/`formAction` — zero matches.

Files: `apps/frontend/src/app/(app)/master-data/boms/page.tsx` (new),
`apps/frontend/src/app/(app)/master-data/boms/[name]/page.tsx` (new),
`apps/frontend/src/components/BomsTable.tsx` (new),
`apps/frontend/src/lib/erpStatus.ts`, `apps/frontend/src/lib/tableColumns.ts`,
`apps/frontend/src/lib/masterDataWorkspace.ts`, `apps/frontend/src/components/Sidebar.tsx`,
`apps/frontend/src/app/(app)/master-data/page.tsx`,
`apps/frontend/src/app/(app)/manufacturing/work-orders/[name]/page.tsx`,
`apps/frontend/src/components/WorkOrdersTable.tsx`,
`apps/frontend/src/components/MaterialTransferForm.tsx`,
`apps/frontend/src/components/WorkOrderForm.tsx`;
`docs/backend/05-manufacturing/bom.md`, `docs/backend/15-migration/migration-status.md`,
`docs/backend/99-unverified/unverified-behaviours.md` (new `MFG-UNV-010`); `PROGRESS.md`;
`QA_LOG.md`; `docs/operations/AI_WORK_LOG.md`. `bomLookup.ts`'s existing `getBomDetails`/
`listBomsForItem` (Work Order create's own lookup) deliberately left untouched — the new detail
page fetches independently via `getDoc`, per this package's own "preserve established behavior"
boundary. Package state: `CLAUDE_HANDOFF`. Not yet independently reviewed by Codex.
