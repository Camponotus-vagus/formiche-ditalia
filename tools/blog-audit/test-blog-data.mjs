// Invariants over the blog's two static tables (spec §4.3 and §4.4).
//
// These tables are the backbone of the whole blog: every post declares one
// `terra` and one `spedizione` in its frontmatter, and the routes generate one
// page per entry. A duplicate slug or a missing translation silently produces a
// broken or half-English page, so the shape is asserted here rather than trusted.

import { loadData } from './blog-data.mjs';

const { terre, spedizioni } = loadData();

const EXPECTED_TERRE = 8;
const VALID_STATUS = ['concluso', 'in-corso', 'futuro'];
const VALID_OUTCOME = ['successo', 'fallimento', 'superata'];
const BILINGUAL_TERRA = ['name', 'pipeline_phase', 'blurb'];
const BILINGUAL_SPEDIZIONE = ['title', 'blurb'];

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

const duplicates = (values) => {
  const seen = new Set();
  const dupes = new Set();
  for (const v of values) {
    if (seen.has(v)) dupes.add(v);
    seen.add(v);
  }
  return [...dupes];
};

console.log('Test: Otto Terre');

check(
  `exactly ${EXPECTED_TERRE} terre`,
  terre.length === EXPECTED_TERRE,
  `found ${terre.length}`,
);

const dupSlugs = duplicates(terre.map((t) => t.slug));
check('terra slugs are unique', dupSlugs.length === 0, `duplicates: ${dupSlugs.join(', ')}`);

const ordinals = terre.map((t) => t.ordinal);
const expectedOrdinals = Array.from({ length: terre.length }, (_, i) => i + 1);
check(
  'ordinals are 1..N in file order',
  ordinals.every((o, i) => o === expectedOrdinals[i]),
  `got ${ordinals.join(', ')}`,
);

for (const field of BILINGUAL_TERRA) {
  const missing = terre.filter((t) => !t[`${field}_it`] || !t[`${field}_en`]).map((t) => t.slug);
  check(
    `every terra has ${field}_it and ${field}_en`,
    missing.length === 0,
    `missing on: ${missing.join(', ')}`,
  );
}

const noGenus = terre.filter((t) => !t.genus).map((t) => t.slug);
check('every terra names a genus', noGenus.length === 0, `missing on: ${noGenus.join(', ')}`);

console.log('\nTest: Spedizioni');

const dupNumeri = duplicates(spedizioni.map((s) => s.numero));
check('spedizione numeri are unique', dupNumeri.length === 0, `duplicates: ${dupNumeri.join(', ')}`);

const dupSpedSlugs = duplicates(spedizioni.map((s) => s.slug));
check(
  'spedizione slugs are unique',
  dupSpedSlugs.length === 0,
  `duplicates: ${dupSpedSlugs.join(', ')}`,
);

const badStatus = spedizioni.filter((s) => !VALID_STATUS.includes(s.status));
check(
  `every spedizione status is one of ${VALID_STATUS.join('/')}`,
  badStatus.length === 0,
  badStatus.map((s) => `${s.numero}: ${s.status}`).join('; '),
);

for (const field of BILINGUAL_SPEDIZIONE) {
  const missing = spedizioni
    .filter((s) => !s[`${field}_it`] || !s[`${field}_en`])
    .map((s) => s.numero);
  check(
    `every spedizione has ${field}_it and ${field}_en`,
    missing.length === 0,
    `missing on: ${missing.join(', ')}`,
  );
}

// A concluded expedition must be traceable back to the postmortem it narrates —
// that link is what keeps the blog honest about where its numbers come from.
const untraceable = spedizioni
  .filter((s) => s.status === 'concluso' && !s.postmortem)
  .map((s) => s.numero);
check(
  'every concluded spedizione cites a postmortem',
  untraceable.length === 0,
  `missing on: ${untraceable.join(', ')}`,
);

const allTappe = spedizioni.flatMap((s) => s.tappe.map((t) => ({ ...t, spedizione: s.numero })));
const badOutcome = allTappe.filter((t) => !VALID_OUTCOME.includes(t.outcome));
check(
  `every tappa outcome is one of ${VALID_OUTCOME.join('/')}`,
  badOutcome.length === 0,
  badOutcome.map((t) => `${t.spedizione}/${t.id}: ${t.outcome}`).join('; '),
);

const tappaNoMetric = allTappe.filter((t) => !t.metric).map((t) => `${t.spedizione}/${t.id}`);
check(
  'every tappa reports a metric',
  tappaNoMetric.length === 0,
  `missing on: ${tappaNoMetric.join(', ')}`,
);

for (const s of spedizioni) {
  const dupTappe = duplicates(s.tappe.map((t) => t.id));
  if (dupTappe.length > 0) {
    check(`spedizione ${s.numero} tappa ids are unique`, false, `duplicates: ${dupTappe.join(', ')}`);
  }
}

if (failures === 0) {
  console.log(
    `\nPASS — ${terre.length} terre, ${spedizioni.length} spedizioni, ${allTappe.length} tappe`,
  );
  process.exit(0);
} else {
  console.error(`\nFAIL — ${failures} invariant(s) violated`);
  process.exit(1);
}
