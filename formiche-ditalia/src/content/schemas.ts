// Zod schemas for the blog's content collections. See the design spec §5.3.
//
// There is no `slug` field: Astro 5 derives the entry id from the filename, and
// bilingual parity is expressed as "the same filename exists in diario/ and
// diary/". A hand-written slug would be a second source of truth that can drift
// away from the file it names.

import { z } from 'astro:content';
import { SPEDIZIONE_NUMERI, TERRA_SLUGS } from '../data/blog';

// Astro's z.enum needs a literal tuple; the tables are the authority for the values.
const terraEnum = z.enum(TERRA_SLUGS as unknown as [string, ...string[]]);
const spedizioneEnum = z.enum(SPEDIZIONE_NUMERI as unknown as [string, ...string[]]);

// Pipeline phases a Method Note applies to: 0 = prologue, 1..8 = the Otto Terre.
const PHASE_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8'] as const;

// A published post is never silently edited: substantive corrections are appended
// here and rendered at the foot of the page (spec §7.2).
const noteCorrezione = z.object({
  date: z.coerce.date(),
  description: z.string().min(1),
});

const imagesSchema = z.object({
  hero: z.string(),
  alt_hero: z.string().min(1),
});

// Every diary page must point back to the postmortem it narrates, so a reader
// can check the story against the primary record.
const postmortemSourceSchema = z.object({
  file: z.string().min(1),
  section: z.string().min(1),
});

const common = {
  title: z.string().min(1),
  date: z.coerce.date(), // when the events happened
  publish_date: z.coerce.date(), // when the post goes live
  duration_minutes: z.number().int().positive(),
  images: imagesSchema,
  draft: z.boolean().default(false),
  note_correzioni: z.array(noteCorrezione).optional(),
};

const crossLinks = {
  related_method_notes: z.array(z.string()).default([]),
  related_diaries: z.array(z.string()).default([]),
  citations: z.array(z.string()).default([]),
};

// --- Pagine di Diario / Diary Pages ---

export const diaryPostSchema = z.object({
  ...common,
  ...crossLinks,
  spedizione: spedizioneEnum,
  terra: terraEnum,
  postmortem_source: postmortemSourceSchema,
});

// --- Note di Metodo / Method Notes ---

const reproducibilitySchema = z.object({
  hyperparameters_table: z.string().optional(),
  commit_hash: z.string().optional(),
  dataset_version: z.string().optional(),
});

export const methodNoteSchema = z.object({
  ...common,
  ...crossLinks,
  terra: terraEnum, // cross-expedition, but still filed under a single Terra (spec §4.4)
  abstract: z.string().min(1),
  key_concepts: z.array(z.string()).default([]),
  applies_to_phases: z.array(z.enum(PHASE_VALUES)).default([]),
  reproducibility: reproducibilitySchema.optional(),
  superseded_by: z.string().optional(),
});

// --- Intro post (special, post #0 only) ---

export const introSchema = z.object({
  ...common,
});

export type DiaryPost = z.infer<typeof diaryPostSchema>;
export type MethodNote = z.infer<typeof methodNoteSchema>;
export type IntroPost = z.infer<typeof introSchema>;
