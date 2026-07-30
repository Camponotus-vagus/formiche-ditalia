// Pairing helpers for the blog's parallel collections.
//
// Each post exists twice under the same filename — once in the Italian
// collection, once in the English one. The Italian entry is authoritative: it
// decides whether the post exists at all and what its URL is. The English entry
// is looked up by id and may legitimately be missing while a translation is
// still being written (the audit suite is what complains about that, not the
// build, so a missing translation never blocks an unrelated deploy).

import { getCollection, type CollectionEntry } from 'astro:content';

type ItCollection = 'diario' | 'note-di-metodo' | 'intro';
type EnCollection = 'diary' | 'method-notes' | 'intro-en';

export interface PostPair<T extends ItCollection, U extends EnCollection> {
  id: string;
  it: CollectionEntry<T>;
  en: CollectionEntry<U> | undefined;
}

export async function getPairs<T extends ItCollection, U extends EnCollection>(
  itCollection: T,
  enCollection: U,
): Promise<PostPair<T, U>[]> {
  const [itEntries, enEntries] = await Promise.all([
    getCollection(itCollection),
    getCollection(enCollection),
  ]);

  const enById = new Map(enEntries.map((e) => [e.id, e]));

  return itEntries
    .filter((e) => !e.data.draft)
    .map((e) => ({ id: e.id, it: e, en: enById.get(e.id) }));
}

// Every published post, newest first — the diary index and the Land and
// Expedition pages all draw from this.
export async function getAllPosts() {
  const [diari, note, intro] = await Promise.all([
    getPairs('diario', 'diary'),
    getPairs('note-di-metodo', 'method-notes'),
    getPairs('intro', 'intro-en'),
  ]);

  const tagged = [
    ...diari.map((p) => ({ ...p, kind: 'diario' as const, href: `/diario/${p.id}/` })),
    ...note.map((p) => ({ ...p, kind: 'nota-di-metodo' as const, href: `/note-di-metodo/${p.id}/` })),
    ...intro.map((p) => ({ ...p, kind: 'intro' as const, href: `/diario/${p.id}/` })),
  ];

  return tagged.sort((a, b) => +b.it.data.publish_date - +a.it.data.publish_date);
}

export function countByTerra(posts: Awaited<ReturnType<typeof getAllPosts>>) {
  const counts: Record<string, number> = {};
  for (const p of posts) {
    const terra = 'terra' in p.it.data ? (p.it.data.terra as string) : undefined;
    if (terra) counts[terra] = (counts[terra] ?? 0) + 1;
  }
  return counts;
}
