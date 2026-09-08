// A ratchet, not a sweep: the four files already over the cap are allowlisted with
// a reason, so the guard takes effect today without first re-encoding 400 images.
// What it stops is a NEW oversized file — which is exactly how a 4096x4096 logo
// ended up being served at 36x36 on every page.

import { publicImages, kb, runChecks } from './lib.mjs';
import { IMAGE_FILE_CAP, OVERSIZED_ALLOWLIST } from './budgets.mjs';

runChecks('image-file-cap', (check) => {
  const over = publicImages().filter((f) => f.bytes > IMAGE_FILE_CAP);
  for (const f of over) {
    check(
      OVERSIZED_ALLOWLIST.has(f.rel),
      `${f.rel} is ${kb(f.bytes)}, over the ${kb(IMAGE_FILE_CAP)} cap. ` +
        `Resize it, or add it to OVERSIZED_ALLOWLIST in budgets.mjs with a reason.`,
    );
  }
  // Keep the allowlist honest: an entry that no longer applies should go.
  const present = new Set(over.map((f) => f.rel));
  for (const rel of OVERSIZED_ALLOWLIST) {
    check(present.has(rel), `OVERSIZED_ALLOWLIST has a stale entry (no longer over cap or gone): ${rel}`);
  }
  console.log(`  ${over.length} file(s) over ${kb(IMAGE_FILE_CAP)}, all allowlisted`);
});
