// Blog content collections. Four parallel collections, one pair per post type:
// the IT one is the default the routes fall back to, the EN one is its
// translation under the same filename (i18n Option C, see the design spec §5.1.1).

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { diaryPostSchema, introSchema, methodNoteSchema } from './content/schemas';

const md = (dir: string) => glob({ pattern: '**/*.md', base: `./src/content/${dir}` });

export const collections = {
  diario: defineCollection({ loader: md('diario'), schema: diaryPostSchema }),
  diary: defineCollection({ loader: md('diary'), schema: diaryPostSchema }),
  'note-di-metodo': defineCollection({ loader: md('note-di-metodo'), schema: methodNoteSchema }),
  'method-notes': defineCollection({ loader: md('method-notes'), schema: methodNoteSchema }),
  intro: defineCollection({ loader: md('intro'), schema: introSchema }),
};
