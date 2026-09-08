// icon-192x192.png is fetched at High priority on every page load — the browser
// resolves it from the manifest — so its weight lands squarely on the LCP budget.
// It is easy to regress: exporting an icon from a design tool without palette
// compression put 47.7 KB there, and public/images/'s cap does not reach the
// public/ root.

import { PUBLIC, kb, runChecks } from './lib.mjs';
import { statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PWA_ICON_CAP, PWA_ICONS } from './budgets.mjs';

runChecks('pwa-icons', (check) => {
  for (const name of PWA_ICONS) {
    const p = join(PUBLIC, name);
    check(existsSync(p), `missing PWA icon: ${name}`);
    if (!existsSync(p)) continue;
    const bytes = statSync(p).size;
    check(
      bytes <= PWA_ICON_CAP,
      `${name} is ${kb(bytes)}, over the ${kb(PWA_ICON_CAP)} cap. ` +
        `Regenerate with tools/image-variants/gen-variants.mjs.`,
    );
    console.log(`  ${name.padEnd(22)} ${kb(bytes)}`);
  }
});
