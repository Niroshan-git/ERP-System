#!/usr/bin/env node
/**
 * Ceylon Stack documentation generator (DOCS-HELP-1).
 *
 * Reads:
 *   - docs/tools/templates/shell.html          (static page chrome)
 *   - docs/tools/templates/release-log-nav.html (static sidebar fragment, release-tracker owned)
 *   - docs/tools/templates/release-log-content.html (static section content, release-tracker owned)
 *   - docs/tools/templates/last-updated.txt    (single date line, release-tracker owned)
 *   - docs/product/**\/*.md                     (Product Guide / Implementation Guide source of truth)
 *   - docs/backend/**\/*.md                     (Technical Architecture source of truth, read-only index)
 *
 * Writes:
 *   - docs/ceylon-stack-documentation.html
 *
 * No npm dependencies. Run: node docs/tools/generate-docs.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const TPL = path.join(DOCS, 'tools', 'templates');
const PRODUCT_DIR = path.join(DOCS, 'product');
const BACKEND_DIR = path.join(DOCS, 'backend');
const OUT_FILE = path.join(DOCS, 'ceylon-stack-documentation.html');

// ---------------------------------------------------------------------------
// Module nav order — fixed per the DOCS-HELP-1 target IA. Folder name under
// docs/product/ -> { label, eyebrowGroup }. Order in this array is nav order.
// ---------------------------------------------------------------------------
const MODULE_ORDER = [
  { folder: 'getting-started', label: 'Getting Started' },
  { folder: 'master-data', label: 'Master Data' },
  { folder: 'crm', label: 'CRM' },
  { folder: 'sales', label: 'Sales' },
  { folder: 'purchasing', label: 'Purchasing' },
  { folder: 'inventory', label: 'Inventory' },
  { folder: 'manufacturing', label: 'Manufacturing' },
  { folder: 'finance', label: 'Finance' },
];

// Section name -> which mode tab(s) it belongs to. Unlisted section names
// default to all three (fail open, never silently hide authored content).
const SECTION_MODES = {
  'Overview': ['product'],
  'Purpose': ['product'],
  'Business Purpose': ['product'],
  'Process Flow': ['product'],
  'Main Functions': ['product'],
  'How to Create / Use': ['product'],
  'How to Create': ['product'],
  'Important Fields': ['product'],
  'Document Lifecycle': ['product'],
  'Available Actions': ['product'],
  'Common Scenarios': ['product'],
  'Troubleshooting': ['product'],
  'Integration With Other Modules': ['product'],
  'Where to Find It': ['implementation'],
  'Prerequisites': ['implementation'],
  'Required Configuration': ['implementation'],
  'Required Master Data': ['implementation'],
  'Approval / Workflow Behaviour': ['implementation'],
  'Roles & Permissions': ['implementation'],
  'Print / Layout Behaviour': ['implementation'],
  'Technical Reference': ['technical'],
  'Related Documents': ['product', 'implementation', 'technical'],
  'Stock Impact': ['product', 'implementation', 'technical'],
  'Accounting Impact': ['product', 'implementation', 'technical'],
  'Limitations': ['product', 'implementation', 'technical'],
};

const STATUS_CLASS = {
  LIVE: 'live',
  PARTIAL: 'building',
  BUILDING: 'building',
  PLANNED: 'planned',
  NEEDS_VERIFICATION: 'verify',
};

// ---------------------------------------------------------------------------
// tiny helpers
// ---------------------------------------------------------------------------
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// Safe to embed inside an inline <script> tag: JSON.stringify does not escape
// '<', so a title/section containing the literal text "</script>" could break
// out of the tag. Escaping '<' as a unicode sequence neutralizes that with no
// change to the parsed JS value.
function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003C');
}
function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function walk(dir, ext) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, ext));
    else if (entry.isFile() && full.endsWith(ext)) out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------------------
// frontmatter + section parsing
// ---------------------------------------------------------------------------
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) meta[kv[1].trim()] = kv[2].trim();
  }
  return { meta, body: m[2] };
}

function parseSections(body) {
  const lines = body.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const line of lines) {
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) {
      current = { name: h[1].trim(), lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    }
    // lines before the first ## (e.g. stray text) are ignored — schema requires ## sections
  }
  return sections.map((s) => ({ name: s.name, raw: s.lines.join('\n').trim() }));
}

// ---------------------------------------------------------------------------
// minimal markdown -> HTML (subset: paragraphs, lists, bold, code, links,
// callout fences ```callout:info|warn|good|verify```, flow fences ```flow```,
// config fences ```config```)
// ---------------------------------------------------------------------------
function inline(md) {
  let s = esc(md);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function renderFlow(fenceBody) {
  const lines = fenceBody.split(/\r?\n/).filter((l) => l.trim().length);
  const steps = [];
  const branches = [];
  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) branches.push({ after: steps.length - 1, text: line.replace(/^\s*-\s+/, '') });
    else steps.push(line.trim());
  }
  let html = '<div class="flow">';
  steps.forEach((step, i) => {
    if (i > 0) html += '<span class="flow-arrow">→</span>';
    html += `<span class="flow-step">${inline(step)}</span>`;
    const here = branches.filter((b) => b.after === i);
    here.forEach((b) => { html += `<div class="flow-branch">↳ ${inline(b.text)}</div>`; });
  });
  html += '</div>';
  return html;
}

function renderConfig(fenceBody) {
  const groups = { required: [], conditional: [], optional: [], unknown: [] };
  for (const line of fenceBody.split(/\r?\n/)) {
    const m = line.match(/^\s*(required|conditional|optional|unknown)\s*:\s*(.+)$/i);
    if (m) groups[m[1].toLowerCase()] = m[2].split(',').map((x) => x.trim()).filter(Boolean);
  }
  const labels = { required: 'Required', conditional: 'Conditional', optional: 'Optional', unknown: 'Needs Verification' };
  let html = '<div class="cfg-badges">';
  for (const key of ['required', 'conditional', 'optional', 'unknown']) {
    if (!groups[key].length) continue;
    html += `<div class="cfg-badge ${key}"><span class="cfg-label">${labels[key]}</span><span class="cfg-items">${groups[key].map(esc).join(', ')}</span></div>`;
  }
  html += '</div>';
  return html;
}

// Groups lines into list items: a line matching itemRe starts a new item;
// any following line that doesn't match is a soft-wrapped continuation of
// the previous item (joined with a space), matching how the markdown in
// docs/product/ is actually authored (wrapped prose, not one line per item).
// Returns null if the block isn't a list at all (first line doesn't match).
function splitListItems(lines, itemRe) {
  const items = [];
  for (const line of lines) {
    if (itemRe.test(line)) {
      items.push(line.replace(itemRe, ''));
    } else if (items.length) {
      items[items.length - 1] += ' ' + line.trim();
    } else {
      return null;
    }
  }
  return items;
}

function mdToHtml(md) {
  const blocks = md.split(/\r?\n\r?\n+/).map((b) => b.trim()).filter(Boolean);
  let html = '';
  for (const block of blocks) {
    const fence = block.match(/^```(\w[\w:-]*)\r?\n([\s\S]*?)```$/);
    if (fence) {
      const kind = fence[1];
      const body = fence[2];
      if (kind === 'flow') { html += renderFlow(body); continue; }
      if (kind === 'config') { html += renderConfig(body); continue; }
      const calloutMatch = kind.match(/^callout:(info|warn|good|verify)$/);
      if (calloutMatch) {
        html += `<div class="callout ${calloutMatch[1]}"><p>${inline(body.trim()).replace(/\n\n/g, '</p><p>')}</p></div>`;
        continue;
      }
      html += `<div class="codeblock">${esc(body)}</div>`;
      continue;
    }
    const lines = block.split(/\r?\n/);
    if (lines.every((l) => /^>\s?/.test(l))) {
      const stripped = lines.map((l) => l.replace(/^>\s?/, ''));
      const typeMatch = stripped[0].match(/^\[!(INFO|WARN|GOOD|VERIFY)\]\s*(.*)$/i);
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'info';
      if (typeMatch) stripped[0] = typeMatch[2];
      const text = stripped.filter((l) => l.trim().length).join(' ').trim();
      html += `<div class="callout ${type}"><p>${inline(text)}</p></div>`;
      continue;
    }
    const bulletItems = splitListItems(lines, /^\s*-\s+/);
    if (bulletItems) {
      html += '<ul>' + bulletItems.map((i) => `<li>${inline(i)}</li>`).join('') + '</ul>';
      continue;
    }
    const numberedItems = splitListItems(lines, /^\s*\d+\.\s+/);
    if (numberedItems) {
      html += '<ol>' + numberedItems.map((i) => `<li>${inline(i)}</li>`).join('') + '</ol>';
      continue;
    }
    html += `<p>${inline(block).replace(/\r?\n/g, '<br>')}</p>`;
  }
  return html;
}

// ---------------------------------------------------------------------------
// render one docs/product/*.md file into a <section>
// ---------------------------------------------------------------------------
function renderDoc(filePath, folderLabel, searchIndex) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const sections = parseSections(body);
  const relFromProduct = path.relative(PRODUCT_DIR, filePath).replace(/\\/g, '/');
  const folder = relFromProduct.split('/')[0];
  const file = path.basename(filePath, '.md');
  const docId = meta.slug ? slugify(meta.slug) : `${folder}-${file}`;
  const title = meta.title || file;
  const statusKey = (meta.status || '').toUpperCase();
  const statusClass = STATUS_CLASS[statusKey] || 'planned';
  const statusLabel = statusKey ? (statusKey === 'NEEDS_VERIFICATION' ? 'Needs Verification' : statusKey.charAt(0) + statusKey.slice(1).toLowerCase()) : 'Planned';

  let html = `    <section id="${esc(docId)}" class="doc-section-page">\n`;
  html += `      <span class="eyebrow">${esc(folderLabel)}</span>\n`;
  html += `      <h2>${esc(title)} <span class="status ${statusClass}"><span class="dot"></span>${esc(statusLabel)}</span></h2>\n`;

  const metaPills = [];
  if (meta.frontend_route) metaPills.push(`<span class="pill sapphire mono">${esc(meta.frontend_route)}</span>`);
  if (meta.canonical_entity) metaPills.push(`<span class="pill cinnamon mono">entity: ${esc(meta.canonical_entity)}</span>`);
  if (meta.backend_doc) {
    const exists = fs.existsSync(path.join(ROOT, meta.backend_doc));
    metaPills.push(`<span class="pill tea mono">${exists ? esc(meta.backend_doc) : 'backend doc missing: ' + esc(meta.backend_doc)}</span>`);
  }
  if (meta.last_verified) metaPills.push(`<span class="pill turmeric mono">verified ${esc(meta.last_verified)}</span>`);
  if (metaPills.length) html += `      <div class="doc-meta">${metaPills.join('')}</div>\n`;

  for (const section of sections) {
    const modes = SECTION_MODES[section.name] || ['product', 'implementation', 'technical'];
    const sectionSlug = slugify(section.name);
    const sectionId = `${docId}-${sectionSlug}`;
    const bodyHtml = mdToHtml(section.raw);
    const wrapOpen = section.name === 'Technical Reference'
      ? `<details class="tech-ref" id="${sectionId}"><summary>${esc(section.name)}</summary><div class="tech-ref-body">`
      : `<div class="doc-section" id="${sectionId}" data-modes="${modes.join(' ')}"><h3>${esc(section.name)}</h3>`;
    const wrapClose = section.name === 'Technical Reference' ? '</div></details>' : '</div>';
    html += `      ${wrapOpen}${bodyHtml}${wrapClose}\n`;

    searchIndex.push({
      title,
      module: folderLabel,
      section: section.name === 'Overview' ? '' : section.name,
      href: `#${section.name === 'Overview' ? docId : sectionId}`,
      text: `${title} ${folderLabel} ${section.name} ${stripTags(bodyHtml)}`.toLowerCase(),
    });
  }

  html += `    </section>\n`;
  return { html, docId, title, statusClass, statusLabel };
}

// ---------------------------------------------------------------------------
// Technical Architecture index (generated from docs/backend/, read-only)
// ---------------------------------------------------------------------------
function renderTechnicalArchitectureIndex() {
  const domainDirs = fs.existsSync(BACKEND_DIR)
    ? fs.readdirSync(BACKEND_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
    : [];
  let html = '    <section id="technical-architecture" class="doc-section-page">\n';
  html += '      <span class="eyebrow">Technical Architecture</span>\n';
  html += '      <h2>Backend Knowledge Base Index</h2>\n';
  html += '      <p class="lede">The canonical Frappe/ERPNext-mapping knowledge base lives in <code>docs/backend/</code> (governed by <code>docs/controls/BACKEND_KNOWLEDGE_POLICY.md</code>), not duplicated here. This index links each documented domain — read the files directly in the repo for field mappings, relationships, business rules, and stock/accounting impact.</p>\n';
  html += '      <div class="grid-2">\n';
  for (const domain of domainDirs) {
    const domainPath = path.join(BACKEND_DIR, domain);
    const files = fs.readdirSync(domainPath).filter((f) => f.endsWith('.md'));
    const hasReadme = files.includes('README.md');
    const rel = `docs/backend/${domain}/${hasReadme ? 'README.md' : ''}`.replace(/\/$/, '');
    const note = hasReadme ? rel : `${files.length} doc${files.length === 1 ? '' : 's'} (no README): ${files.join(', ')}`;
    html += `        <div class="card"><h4>${esc(domain)}</h4><p style="margin-bottom:0;"><code>${esc(hasReadme ? rel : `docs/backend/${domain}/`)}</code>${hasReadme ? '' : `<br>${esc(note)}`}</p></div>\n`;
  }
  html += '      </div>\n';
  const migrationStatus = path.join(BACKEND_DIR, '15-migration', 'migration-status.md');
  if (fs.existsSync(migrationStatus)) {
    html += `      <p>Domain-by-domain native-migration status: <code>docs/backend/15-migration/migration-status.md</code>.</p>\n`;
  }
  html += '    </section>\n';
  return html;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  const shell = fs.readFileSync(path.join(TPL, 'shell.html'), 'utf8');
  const releaseLogNav = fs.readFileSync(path.join(TPL, 'release-log-nav.html'), 'utf8');
  const releaseLogContent = fs.readFileSync(path.join(TPL, 'release-log-content.html'), 'utf8');
  const lastUpdated = fs.readFileSync(path.join(TPL, 'last-updated.txt'), 'utf8').trim();

  const searchIndex = [];
  let sidebarHtml = '';
  let mainHtml = '';

  for (const mod of MODULE_ORDER) {
    const dir = path.join(PRODUCT_DIR, mod.folder);
    const files = walk(dir, '.md').filter((f) => path.basename(f) !== 'README.md');
    if (!files.length) continue;

    files.sort((a, b) => {
      const an = path.basename(a, '.md');
      const bn = path.basename(b, '.md');
      if (an === 'overview') return -1;
      if (bn === 'overview') return 1;
      return an.localeCompare(bn);
    });

    const navLinks = [];
    for (const file of files) {
      const rendered = renderDoc(file, mod.label, searchIndex);
      mainHtml += rendered.html + '\n';
      navLinks.push(`      <a href="#${rendered.docId}" class="sub">${esc(rendered.title)}</a>`);
    }
    sidebarHtml += `    <div class="grp">\n      <div class="grp-title">${esc(mod.label)}</div>\n${navLinks.join('\n')}\n    </div>\n`;
  }

  // legacy release log content — verbatim, unmodified by this generator
  mainHtml += releaseLogContent + '\n';
  sidebarHtml += releaseLogNav;

  // technical architecture index
  mainHtml += renderTechnicalArchitectureIndex() + '\n';
  sidebarHtml += `    <div class="grp">\n      <div class="grp-title">Technical Architecture</div>\n      <a href="#technical-architecture" class="sub">Backend Knowledge Base Index</a>\n    </div>\n`;

  let out = shell
    .replace('<!--SIDEBAR-->', sidebarHtml)
    .replace('<!--MAIN-->', mainHtml)
    .replace('<!--LAST_UPDATED-->', esc(lastUpdated))
    .replace('<!--SEARCH_INDEX_JSON-->', jsonForScript(searchIndex));

  fs.writeFileSync(OUT_FILE, out, 'utf8');
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)} — ${searchIndex.length} search entries, ${MODULE_ORDER.length} module groups scanned.`);
}

main();
