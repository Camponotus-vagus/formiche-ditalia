// Every threshold this suite enforces, in one place, each with the measurement it
// was calibrated against. Raise one only with a reason — these exist because the
// homepage once shipped 1643 KiB of images and two identical Tailwind stylesheets.

/** Sum of the `src` fallbacks of the distinct <img> on the homepage. Measured: 158.6 KB. */
export const HOMEPAGE_IMAGE_BUDGET = 250 * 1024;

/** Largest single image the homepage may reference, via src or any srcset candidate.
 *  Measured max: 75.8 KB (the carousel's full-size source). The header logo used to
 *  be 763 KB here. */
export const HOMEPAGE_MAX_IMAGE = 120 * 1024;

/** Sum of the /_astro/*.js the homepage references. Measured: 192.5 KB, almost all of
 *  it react-dom. Re-adding the static i18n import (+75.9 KB) would breach this. */
export const HOMEPAGE_JS_BUDGET = 220 * 1024;

/** Hard cap for any file under public/images/. The 4096x4096 logo was 763 KB. */
export const IMAGE_FILE_CAP = 400 * 1024;

/**
 * Ratchet: files already over IMAGE_FILE_CAP when the cap was introduced, each one
 * checked and kept on purpose. New files over the cap fail. Shrinking this list is
 * welcome; growing it needs a reason in the commit message.
 */
export const OVERSIZED_ALLOWLIST = new Set([
  // Source of the header logo variants, and the `hero:` image of six blog drafts.
  'images/brand/logo.webp',
  // Rendered full-bleed on /anatomia.
  'images/ant-anatomy-en.svg',
  // Shown at max-h-[90vh] by ImageLightbox on their species pages.
  'images/specie/camponotus-piceus/dorsal.webp',
  'images/specie/nylanderia-jaegerskioeldi/head.webp',
]);

/**
 * Pages allowed to emit react-dom float image preloads.
 *
 * Empty, and it should stay that way. /anatomia was the one entry — 305 KB of
 * illustrations preloaded at high priority from the client:load AnatomyExplorer
 * island, none of them above the fold at 375px — fixed by giving the plates
 * fetchPriority="low" (not loading="lazy": clicking a term scrolls its plate
 * into view, and a lazy base that had not loaded would leave an empty box).
 */
export const PRELOAD_ALLOWLIST = new Set([]);

/**
 * Cap for the PWA / touch icons at the public/ root. They sit outside
 * public/images/, so IMAGE_FILE_CAP never saw them — and icon-192x192.png was
 * 47.7 KB, fetched at HIGH priority on every page load because the browser
 * resolves it from the manifest, competing directly with LCP. Regenerating them
 * from the logo master with a 128-colour palette took the three to 3.8 / 13.5 /
 * 3.8 KB with no visible difference.
 */
export const PWA_ICON_CAP = 32 * 1024;
export const PWA_ICONS = ['icon-192x192.png', 'icon-512x512.png', 'apple-touch-icon.png'];
