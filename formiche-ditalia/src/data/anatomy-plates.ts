import type { AnatomyPlateId, AnatomyPlate } from '../types';
import { srcSet, variantUrl } from '../utils/images';

// The anatomy page is built on three original plates from the 2017 thesis, and
// each plate ships with one pre-rendered variant per anatomical term: the same
// drawing with that structure filled in red and its caption underlined.
//
// So highlighting a term is an image swap, not a vector overlay — the artwork
// already carries the highlight, and every one of the 31 terms below has a file
// waiting for it. (An earlier attempt drew SVG paths on top of unlabelled
// plates instead; it defined 1 term out of 31 and pointed at filenames that
// were never committed, which left the page showing three broken images.)
//
// Files live in public/images/anatomy/ as <slug>.webp.

export const PLATES: Record<AnatomyPlateId, AnatomyPlate> = {
  profile: {
    file: 'profile',
    width: 1509,
    height: 958,
    alt_it: 'Formicinae in vista laterale, con le regioni del corpo etichettate',
    alt_en: 'Formicinae in lateral view, with the body regions labelled',
  },
  head: {
    file: 'head-view',
    width: 1491,
    height: 940,
    alt_it: 'Capo in vista frontale, e capo con scrobo antennale',
    alt_en: 'Head in frontal view, and head with antennal scrobe',
  },
  profile2: {
    file: 'profile_2',
    width: 1494,
    height: 672,
    alt_it: 'Myrmicinae in vista laterale: peziolo, postpeziolo e pungiglione',
    alt_en: 'Myrmicinae in lateral view: petiole, postpetiole and sting',
  },
};

// Which plate carries each term's highlight. Every term lives on exactly one
// plate: the Formicinae profile has no sting, the Myrmicinae profile no
// metanotum, and the head is drawn only frontally. Note this is independent of
// the body region a term is filed under in the UI — the antenna belongs to the
// head region but is highlighted on the profile plate.
export const TERM_PLATE: Record<string, AnatomyPlateId> = {
  // head-view.webp
  'antennal-socket': 'head',
  'clypeal-socket': 'head',
  clypeus: 'head',
  'compound-eye': 'head',
  'frontal-carina': 'head',
  'frontal-lobe': 'head',
  'frontal-triangle': 'head',
  funiculus: 'head',
  mandible: 'head',
  ocelli: 'head',
  scape: 'head',
  scrobe: 'head',

  // profile.webp — Formicinae
  antenna: 'profile',
  'apical-spur': 'profile',
  'cloacal-orifice': 'profile',
  gaster: 'profile',
  'labial-palp': 'profile',
  'maxillary-palp': 'profile',
  mesonotum: 'profile',
  mesosoma: 'profile',
  metanotum: 'profile',
  pronotum: 'profile',
  propodeum: 'profile',

  // profile_2.webp — Myrmicinae
  'antennal-club': 'profile2',
  'metanotal-impression': 'profile2',
  'metapleural-gland': 'profile2',
  petiole: 'profile2',
  postpetiole: 'profile2',
  'propodeal-lobe': 'profile2',
  'propodeal-spine': 'profile2',
  sting: 'profile2',
};

// Two variants are filed under their full anatomical name rather than under the
// short term id the UI uses.
const IMAGE_SLUG: Record<string, string> = {
  'apical-spur': 'apical-spur-of-tibia',
  'metapleural-gland': 'orifice-of-metapleural-gland',
};

export function plateSrc(plate: AnatomyPlateId): string {
  return `/images/anatomy/${PLATES[plate].file}.webp`;
}

/**
 * Responsive candidates for a base plate, from the generated variant map.
 *
 * Only the three base plates have variants: they are the only anatomy images
 * fetched on page load. The 31 highlighted overlays are click-time, and since
 * every image here is sized by its box (`w-full`), an overlay at full
 * resolution over a downscaled base still lines up exactly.
 */
export function plateSrcSet(plate: AnatomyPlateId): string | undefined {
  return srcSet(plateSrc(plate));
}

/** Fallback for a browser that ignores srcset: the mid rung, not the 127 KB master. */
export function plateFallbackSrc(plate: AnatomyPlateId): string {
  return variantUrl(plateSrc(plate), plate === 'profile' ? 640 : 384);
}

/**
 * The profile plate spans the plates column; head and profile_2 share a
 * two-column grid inside it, so they render at about half the width. The column
 * is full-bleed below `lg` and 60% of a max-w-6xl container above it.
 */
export const PLATE_SIZES: Record<AnatomyPlateId, string> = {
  profile: '(min-width: 1024px) 40vw, 92vw',
  head: '(min-width: 1024px) 20vw, 46vw',
  profile2: '(min-width: 1024px) 20vw, 46vw',
};

// The highlighted variant to lay over `plate`, or null when the active term is
// drawn on a different plate (or nothing is selected).
export function highlightSrc(plate: AnatomyPlateId, term: string | null): string | null {
  if (!term || TERM_PLATE[term] !== plate) return null;
  return `/images/anatomy/${IMAGE_SLUG[term] ?? term}.webp`;
}
