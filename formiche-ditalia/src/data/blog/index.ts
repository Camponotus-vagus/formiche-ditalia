// Lookup helpers over the blog's two static tables: the eight Lands of the
// Exploration and the registered Expeditions. Data lives in the sibling JSON
// files so tools/blog-audit/ can validate it without a TypeScript runtime.

import terreData from './terre.json';
import spedizioniData from './spedizioni.json';
import type { Spedizione, SpedizioneNumero, Terra, TerraSlug } from '../../types';

export const TERRE = terreData as readonly Terra[];
export const SPEDIZIONI = spedizioniData as readonly Spedizione[];

export const TERRA_SLUGS: readonly TerraSlug[] = TERRE.map((t) => t.slug);
export const SPEDIZIONE_NUMERI: readonly SpedizioneNumero[] = SPEDIZIONI.map((s) => s.numero);

export function getTerra(slug: TerraSlug | string): Terra | undefined {
  return TERRE.find((t) => t.slug === slug);
}

export function getSpedizione(numero: SpedizioneNumero | string): Spedizione | undefined {
  return SPEDIZIONI.find((s) => s.numero === numero);
}

export function getSpedizioneBySlug(slug: string): Spedizione | undefined {
  return SPEDIZIONI.find((s) => s.slug === slug);
}
