// Bilingual parity for blog posts (spec §7.1).
//
// The Italian and English versions of a post are two files sharing one filename,
// in sibling collections. Astro's build only ever validates the Italian side —
// the route falls back to it when a translation is absent — so an untranslated
// or orphaned post would ship silently. This is the check that catches it.
//
// Drafts are checked too: a draft is a post being written, and finding the
// mismatch before publication is the whole point.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const contentDir = join(here, '..', '..', 'formiche-ditalia', 'src', 'content');

// [italian collection, english collection].
const PAIRS = [
  ['diario', 'diary'],
  ['note-di-metodo', 'method-notes'],
  ['intro', 'intro-en'],
];

// Frontmatter fields that must agree between the two languages: they drive
// routing and grouping, so a divergence would file the two versions of one post
// under different Lands or Expeditions.
const SHARED_FIELDS = ['spedizione', 'terra', 'date', 'publish_date', 'draft'];

let failures = 0;
const check = (label, ok, detail) => {
  if (ok) {
    console.log(`  PASS — ${label}`);
  } else {
    console.error(`  FAIL — ${label}`);
    if (detail) console.error(`    ${detail}`);
    failures++;
  }
};

const posts = (dir) => {
  const full = join(contentDir, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full).filter((f) => f.endsWith('.md'));
};

// Deliberately minimal: enough to read scalar fields out of the frontmatter
// block. Astro's Zod schema is what actually validates types and shapes.
const frontmatter = (dir, file) => {
  const raw = readFileSync(join(contentDir, dir, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([a-z_]+):\s*(.+?)\s*$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return out;
};

let totalPairs = 0;

for (const [itDir, enDir] of PAIRS) {
  console.log(`\nTest: ${itDir} ↔ ${enDir}`);

  const itFiles = posts(itDir);
  const enFiles = posts(enDir);

  const missingEn = itFiles.filter((f) => !enFiles.includes(f));
  check(
    `every ${itDir} post has its ${enDir} translation`,
    missingEn.length === 0,
    `no ${enDir}/ counterpart for: ${missingEn.join(', ')}`,
  );

  const orphanEn = enFiles.filter((f) => !itFiles.includes(f));
  check(
    `every ${enDir} post has its ${itDir} original`,
    orphanEn.length === 0,
    `no ${itDir}/ counterpart for: ${orphanEn.join(', ')}`,
  );

  for (const file of itFiles.filter((f) => enFiles.includes(f))) {
    totalPairs++;
    const it = frontmatter(itDir, file);
    const en = frontmatter(enDir, file);

    const diverging = SHARED_FIELDS.filter(
      (f) => f in it && f in en && it[f] !== en[f],
    ).map((f) => `${f}: "${it[f]}" vs "${en[f]}"`);
    check(
      `${file}: routing fields agree across languages`,
      diverging.length === 0,
      diverging.join('; '),
    );

    // Same title in both files almost always means the translation was copied
    // and not yet written.
    const sameTitle = it.title && en.title && it.title === en.title;
    check(`${file}: title is actually translated`, !sameTitle, `both read "${it.title}"`);
  }
}

if (failures === 0) {
  console.log(`\nPASS — ${totalPairs} bilingual pair(s) consistent`);
  process.exit(0);
} else {
  console.error(`\nFAIL — ${failures} parity problem(s)`);
  process.exit(1);
}
