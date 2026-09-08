// Shared helpers for the perf-audit suite.
//
// Unlike key-audit and blog-audit, these tests read the BUILD OUTPUT, so they need
// `npm run build` to have run first. Every test imports `dist()` and gets a clear
// failure instead of a false green when dist/ is missing.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const APP = resolve(here, '..', '..', 'formiche-ditalia');
export const DIST = join(APP, 'dist');
export const PUBLIC = join(APP, 'public');

export function requireDist() {
  if (!existsSync(DIST)) {
    console.error('dist/ not found — run `npm run build` in formiche-ditalia/ first.');
    process.exit(1);
  }
  return DIST;
}

/** Every .html file under dist/, as { rel, html }. */
export function htmlPages() {
  const out = [];
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push({ rel: p.slice(DIST.length + 1), html: readFileSync(p, 'utf8') });
    }
  })(DIST);
  return out;
}

/** Every file under public/images/, as { rel, bytes }. */
export function publicImages() {
  const root = join(PUBLIC, 'images');
  const out = [];
  (function walk(dir) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else out.push({ rel: p.slice(PUBLIC.length + 1).split('\\').join('/'), bytes: statSync(p).size });
    }
  })(root);
  return out;
}

/** Byte size of a site-absolute asset URL like `/images/x.webp`, or null if absent. */
export function assetBytes(url) {
  const clean = url.split('?')[0].split('#')[0];
  const p = join(PUBLIC, clean.replace(/^\//, ''));
  return existsSync(p) ? statSync(p).size : null;
}

/** All <img ...> tags in a chunk of HTML, as attribute maps. */
export function imgTags(html) {
  return [...html.matchAll(/<img\b([^>]*)>/gi)].map(([, attrs]) => {
    const map = {};
    for (const [, k, v] of attrs.matchAll(/([a-zA-Z-]+)\s*=\s*"([^"]*)"/g)) map[k.toLowerCase()] = v;
    return map;
  });
}

/** URLs listed in a srcset attribute. */
export function srcsetUrls(srcset) {
  if (!srcset) return [];
  return srcset.split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);
}

export const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

/** Tiny assertion helper: collects failures, prints them, sets the exit code. */
export function runChecks(name, fn) {
  const failures = [];
  const check = (ok, message) => { if (!ok) failures.push(message); };
  fn(check);
  if (failures.length) {
    console.error(`${name}: ${failures.length} failure(s)`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`${name}: ok`);
}
