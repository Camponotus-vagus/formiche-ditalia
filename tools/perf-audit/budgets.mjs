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
 * Pages allowed to emit react-dom float image preloads, with the reason.
 *
 * This is a record of a known issue, not an endorsement. /anatomia preloads
 * 305 KB of illustrations (profile 127 KB, head-view 109 KB, profile_2 61 KB)
 * from the client:load AnatomyExplorer island, and at 375px none of them are
 * above the fold. Fixing it is a separate change on a separate page; listing it
 * here keeps the guard active everywhere else instead of deleting the test.
 */
export const PRELOAD_ALLOWLIST = new Set([
  'anatomia/index.html',
]);
