// Single source of truth for the responsive image variants the site ships.
//
// Only the images actually referenced by the homepage are listed: the header
// logo (on every page) and the six genus thumbnails. The full-resolution
// originals stay untouched — `/generi/[slug]` and `/specie/[slug]` hand them to
// ImageLightbox, which renders them at max-h-[90vh], so they are correctly
// sized for that use and must not be downscaled in place.

/** @typedef {{ src: string, widths: number[], quality: number }} Entry */

const GENERA = ['lasius', 'temnothorax', 'camponotus', 'messor', 'strumigenys', 'tetramorium'];

/** @type {Entry[]} */
export const MANIFEST = [
  // Rendered at 36x36 in the sticky header. 72 = 2x, 144 = 4x for dense displays.
  { src: 'images/brand/logo.webp', widths: [72, 144], quality: 82 },

  // Both homepage grids (hero mobile strip and "Generi in evidenza") use the same
  // six files with the same `sizes`, so the browser picks one candidate per genus
  // and fetches it once. Widths cover 122-389 CSS px across breakpoints at DPR 1-3.
  ...GENERA.map((g) => ({
    src: `images/genera/${g}/head.webp`,
    widths: [256, 384, 640, 960],
    quality: 72,
  })),
];

/** Variant path for a source: `a/b/head.webp` + 384 -> `a/b/head-384.webp`. */
export function variantPath(src, width) {
  const dot = src.lastIndexOf('.');
  return `${src.slice(0, dot)}-${width}${src.slice(dot)}`;
}

/**
 * PWA / touch icons, regenerated from the same 4096x4096 master as the header
 * logo — they are the same artwork. The committed PNGs were encoded without
 * palette compression: 48.8 KB for a 192px icon, 252.5 KB for a 512px one.
 * icon-192x192.png in particular is fetched at HIGH priority on every page load
 * (the browser resolves it from the manifest), so it competed directly with LCP.
 *
 * These write over existing files rather than adding siblings: unlike the photos,
 * the icons are generated deliverables and logo.webp is their master.
 */
export const ICON_SOURCE = 'images/brand/logo.webp';

/** @type {{ out: string, size: number, flatten: boolean }[]} */
export const ICONS = [
  { out: 'icon-192x192.png', size: 192, flatten: false },
  { out: 'icon-512x512.png', size: 512, flatten: false },
  // iOS composites this itself and the committed file has no alpha channel;
  // keep it opaque so the rounded corners iOS applies land on the right colour.
  { out: 'apple-touch-icon.png', size: 180, flatten: true },
];
