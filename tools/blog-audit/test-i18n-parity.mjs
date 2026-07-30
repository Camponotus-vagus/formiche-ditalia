// The two UI translation files must carry the same key set.
//
// t() silently falls back to Italian for a key missing from en.json, so an
// untranslated string shows up as Italian text on an English page rather than as
// an error. The blog leans on this mechanism for all its chrome, so the parity
// is asserted rather than assumed.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const i18nDir = join(here, '..', '..', 'formiche-ditalia', 'src', 'i18n');

const it = JSON.parse(readFileSync(join(i18nDir, 'it.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(i18nDir, 'en.json'), 'utf8'));

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

console.log('Test: i18n key parity');

const missingEn = Object.keys(it).filter((k) => !(k in en));
check('every it.json key exists in en.json', missingEn.length === 0, missingEn.join(', '));

const missingIt = Object.keys(en).filter((k) => !(k in it));
check('every en.json key exists in it.json', missingIt.length === 0, missingIt.join(', '));

const empty = Object.keys(it).filter((k) => !it[k] || !en[k]);
check('no key has an empty value in either file', empty.length === 0, empty.join(', '));

// An English value identical to the Italian one is usually an untranslated
// placeholder. Proper nouns and shared technical terms legitimately match, so
// this only covers the blog's own keys, which are all prose.
const untranslated = Object.keys(it).filter(
  (k) => k.startsWith('blog_') && it[k] === en[k] && /\s/.test(it[k]),
);
check(
  'no blog_ key is left untranslated',
  untranslated.length === 0,
  untranslated.join(', '),
);

if (failures === 0) {
  console.log(`\nPASS — ${Object.keys(it).length} keys in both files`);
  process.exit(0);
} else {
  console.error(`\nFAIL — ${failures} parity problem(s)`);
  process.exit(1);
}
