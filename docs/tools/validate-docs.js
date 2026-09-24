#!/usr/bin/env node
/**
 * Lightweight validation for the DOCS-HELP-1 documentation pipeline.
 * No npm dependencies. Run: node docs/tools/validate-docs.js
 * Exits non-zero if any ERROR-level problem is found (warnings do not fail the build).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DOCS = path.join(ROOT, 'docs');
const PRODUCT_DIR = path.join(DOCS, 'product');
const OUT_FILE = path.join(DOCS, 'ceylon-stack-documentation.html');

const VALID_STATUS = ['LIVE', 'PARTIAL', 'BUILDING', 'PLANNED', 'NEEDS_VERIFICATION'];
const REQUIRED_FIELDS = ['title', 'module', 'status'];

let errors = 0;
let warnings = 0;
function err(msg) { errors++; console.error('ERROR:', msg); }
function warn(msg) { warnings++; console.warn('WARN: ', msg); }

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

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) meta[kv[1].trim()] = kv[2].trim();
  }
  return { meta, body: m[2] };
}

// ---- 1. frontmatter + docId uniqueness + backend_doc existence -----------
const seenIds = new Map();
const files = walk(PRODUCT_DIR, '.md').filter((f) => path.basename(f) !== 'README.md');
if (!files.length) warn('No docs/product/*.md files found — generator will emit an empty product guide.');

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = parseFrontmatter(raw);
  if (!parsed) { err(`${rel}: missing YAML frontmatter block (--- ... ---)`); continue; }
  const { meta, body } = parsed;

  for (const field of REQUIRED_FIELDS) {
    if (!meta[field]) err(`${rel}: missing required frontmatter field '${field}'`);
  }
  if (meta.status && !VALID_STATUS.includes(meta.status.toUpperCase())) {
    err(`${rel}: invalid status '${meta.status}' — must be one of ${VALID_STATUS.join(', ')}`);
  }
  if (meta.slug && !/^[a-z0-9-]+$/.test(meta.slug)) {
    err(`${rel}: slug '${meta.slug}' must match ^[a-z0-9-]+$ (used verbatim as an HTML id/anchor)`);
  }
  if (meta.backend_doc) {
    const backendPath = path.join(ROOT, meta.backend_doc);
    if (!fs.existsSync(backendPath)) err(`${rel}: backend_doc '${meta.backend_doc}' does not exist on disk`);
  }
  if (!/^##\s+/m.test(body)) warn(`${rel}: no '## Section' headers found — page will render with no content sections`);

  const folder = path.relative(PRODUCT_DIR, file).split(path.sep)[0];
  const fileBase = path.basename(file, '.md');
  const docId = meta.slug || `${folder}-${fileBase}`;
  if (seenIds.has(docId)) err(`${rel}: docId '${docId}' collides with ${seenIds.get(docId)}`);
  else seenIds.set(docId, rel);

  // internal relative links [text](other.md) must resolve
  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
  let lm;
  while ((lm = linkRe.exec(body))) {
    const target = lm[1];
    if (/^https?:\/\//.test(target) || target.startsWith('#')) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) err(`${rel}: internal link target '${target}' does not resolve`);
  }
}

// ---- 2. generated HTML: duplicate anchor ids ------------------------------
if (fs.existsSync(OUT_FILE)) {
  const html = fs.readFileSync(OUT_FILE, 'utf8');
  const idRe = /\sid="([^"]+)"/g;
  const seen = new Map();
  let m;
  while ((m = idRe.exec(html))) {
    const id = m[1];
    seen.set(id, (seen.get(id) || 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) err(`generated HTML: duplicate id="${id}" appears ${count} times`);
  }
} else {
  warn(`${path.relative(ROOT, OUT_FILE)} does not exist yet — run generate-docs.js first for the full check.`);
}

console.log(`\nValidation complete: ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors > 0 ? 1 : 0);
