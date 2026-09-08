// Responsive-image helpers over the variant map that
// `tools/image-variants/gen-variants.mjs` writes from what it actually produced.
//
// The map is generated, never hand-edited: if a variant is missing from disk it is
// missing from here too, so a template can't reference a file that doesn't exist.
// `tools/perf-audit` asserts the reverse direction (every URL in dist/ resolves).

import variantMap from '../data/image-variants.json';

const MAP = variantMap as Record<string, number[]>;

/** `/a/b/head.webp` + 384 -> `/a/b/head-384.webp` */
function withWidth(src: string, width: number): string {
  const dot = src.lastIndexOf('.');
  return `${src.slice(0, dot)}-${width}${src.slice(dot)}`;
}

/** The generated variant at `width`, or the original if that width wasn't produced. */
export function variantUrl(src: string, width: number): string {
  return MAP[src]?.includes(width) ? withWidth(src, width) : src;
}

/**
 * Width-descriptor srcset, or undefined when the source has no variants — callers
 * then fall back to the original and the markup stays valid either way.
 */
export function srcSet(src: string): string | undefined {
  const widths = MAP[src];
  if (!widths?.length) return undefined;
  return widths.map((w) => `${withWidth(src, w)} ${w}w`).join(', ');
}

/**
 * `sizes` for the two homepage genus grids. Both grids show the SAME six files,
 * so they must declare the SAME sizes: a narrower value on the small hero strip
 * would make the browser resolve a different candidate and download every genus
 * twice. The slight quality overkill on the strip is the deliberate trade.
 */
export const GENUS_GRID_SIZES = '(min-width: 768px) 33vw, 50vw';
