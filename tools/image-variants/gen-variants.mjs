// Generates the responsive WebP variants declared in manifest.mjs.
//
// Run locally (`node tools/image-variants/gen-variants.mjs`) and commit the output.
// It is deliberately NOT wired into `npm run build`: sharp is only a transitive
// dependency of Astro here, so relying on it during a Vercel build would be a bet
// on npm's hoisting. The variants are ~150 KB in total, so committing them is cheap.
//
// Safety rules, in order of importance:
//   1. never write to a path that is also a source (asserted, not assumed);
//   2. only ever write `<name>-<width>.<ext>` siblings — originals are read-only;
//   3. idempotent: skip when the variant is newer than its source.

import { statSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { MANIFEST, variantPath } from './manifest.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const APP = resolve(here, '..', '..', 'formiche-ditalia');
const PUBLIC = resolve(APP, 'public');

// sharp lives in formiche-ditalia/node_modules (transitively, via Astro), not at the
// repo root where this script sits — so resolve it from there rather than from here.
let sharp;
try {
  sharp = createRequire(join(APP, 'package.json'))('sharp');
} catch {
  console.error('sharp not found. Run `npm install` in formiche-ditalia/ first.');
  process.exit(1);
}

const force = process.argv.includes('--force');

// Rule 1: an output must never collide with an input, for any entry in the manifest.
const sources = new Set(MANIFEST.map((e) => resolve(PUBLIC, e.src)));
for (const entry of MANIFEST) {
  for (const w of entry.widths) {
    const out = resolve(PUBLIC, variantPath(entry.src, w));
    if (sources.has(out)) {
      console.error(`REFUSING TO RUN: variant would overwrite a source: ${out}`);
      process.exit(1);
    }
  }
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
let written = 0, skipped = 0, saved = 0;

// Which widths actually exist per source, keyed by public URL. Written to
// src/data/image-variants.json so the templates build srcset from generated
// reality rather than a hand-kept list that can drift from the files on disk.
/** @type {Record<string, number[]>} */
const emitted = {};

for (const entry of MANIFEST) {
  const srcPath = join(PUBLIC, entry.src);
  if (!existsSync(srcPath)) {
    console.error(`MISSING SOURCE: ${entry.src}`);
    process.exit(1);
  }
  const srcStat = statSync(srcPath);
  const meta = await sharp(srcPath).metadata();
  console.log(`\n${entry.src}  ${meta.width}x${meta.height}  ${kb(srcStat.size)}`);

  for (const w of entry.widths) {
    if (w > meta.width) {
      console.log(`  ${String(w).padStart(4)}w  skipped (source is only ${meta.width}px wide)`);
      continue;
    }
    (emitted[`/${entry.src}`] ??= []).push(w);
    const rel = variantPath(entry.src, w);
    const outPath = join(PUBLIC, rel);

    if (!force && existsSync(outPath) && statSync(outPath).mtimeMs >= srcStat.mtimeMs) {
      skipped++;
      console.log(`  ${String(w).padStart(4)}w  up to date  ${kb(statSync(outPath).size)}`);
      continue;
    }

    await sharp(srcPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: entry.quality, effort: 6 })
      .toFile(outPath);

    const outSize = statSync(outPath).size;
    written++;
    saved += srcStat.size - outSize;
    console.log(`  ${String(w).padStart(4)}w  written     ${kb(outSize)}`);
  }
}

const mapPath = join(APP, 'src', 'data', 'image-variants.json');
writeFileSync(mapPath, JSON.stringify(emitted, null, 2) + '\n');

console.log(`\n${written} written, ${skipped} up to date.`);
console.log(`Variant map: src/data/image-variants.json (${Object.keys(emitted).length} sources).`);
