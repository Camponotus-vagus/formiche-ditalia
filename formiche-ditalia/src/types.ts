export interface Subfamily {
  id: string;
  name: string;
  description_it: string;
  description_en: string;
}

export interface Genus {
  id: string;
  scientific_name: string;
  subfamily_id: string;
  common_name_it: string | null;
  description_it: string;
  description_en: string;
  habitat: string | null;
  nesting: string | null;
  diet: string | null;
  species_count_italy: number;
  endemic_species_count: number;
  distribution_notes: string | null;
  distribution_regions: string[];
  diagnostic_characters: string | null;
  diagnostic_characters_it: string | null;
  diagnostic_characters_en: string | null;
  body_length: string | null;
  photo_urls: string[];
  similar_genera: string[];
  references: string[];
  species_key_status?: 'monospecific' | 'polyspecific_pending' | 'polyspecific_available';
}

export interface Species {
  id: string;
  genus_id: string;
  scientific_name: string;
  author_year: string | null;
  status: 'native' | 'exotic' | 'endemic';
  subspecies: string[];
  distribution_regions: string[];
  altitude_range: string | null;
  habitat_notes_it: string | null;
  habitat_notes_en: string | null;
  photo_urls: string[];
  synonyms: string[];
  description_it: string | null;
  description_en: string | null;
  body_length: string | null;
  antweb_url: string | null;
  antcat_url: string | null;
  gbif_id: string | null;
}

export interface CharacterState {
  value: string;
  label_it: string;
  label_en: string;
  illustration_url: string | null;
}

export interface Character {
  id: string;
  name_it: string;
  name_en: string;
  description_it: string;
  body_region: 'head' | 'thorax' | 'petiole' | 'gaster' | 'legs' | 'antennae';
  difficulty: 'easy' | 'medium' | 'hard';
  display_order: number;
  illustration_url: string | null;
  states: CharacterState[];
  level: 'subfamily' | 'genus';
  subfamily_scope: string;
}

export interface MatrixEntry {
  genus_id: string;
  character_id: string;
  state_values: string[];
}

export interface Expert {
  id: string;
  name: string;
  affiliation: string | null;
  role: string | null;
  email: string | null;
  website: string | null;
  orcid: string | null;
  region: string | null;
  specializations: string[];
  genera_of_interest: string[];
  key_publications: (string | {
    title: string;
    authors?: string | null;
    year?: number | null;
    doi?: string | null;
    url?: string | null;
  })[];
  bio_it: string | null;
  bio_en: string | null;
  profile_photo_url: string | null;
  h_index: number | null;
  claimed: boolean;
  has_phd?: boolean;
}

// The three plates the anatomy page is drawn on. 'profile2' is a second
// lateral view (a myrmicine, carrying the waist and sting), not a dorsal one.
export type AnatomyPlateId = 'profile' | 'head' | 'profile2';

export interface AnatomyPlate {
  // Basename under /images/anatomy/, without the .webp extension.
  file: string;
  alt_it: string;
  alt_en: string;
}

// --- Blog "L'Occhio Digitale dell'Entomologo" (satellite section under /diario/) ---

export type TerraSlug =
  | 'messor'
  | 'polyergus'
  | 'pheidole'
  | 'camponotus'
  | 'atta'
  | 'strumigenys'
  | 'tetramorium'
  | 'stigmatomma';

export interface Terra {
  slug: TerraSlug;
  ordinal: number; // 1..8, position along the explorer's journey
  name_it: string;
  name_en: string;
  genus: string; // ant genus name, italicized in the UI
  pipeline_phase_it: string;
  pipeline_phase_en: string;
  blurb_it: string;
  blurb_en: string;
}

export type SpedizioneNumero =
  | '0'
  | 'I'
  | 'II'
  | 'III'
  | 'IV'
  | 'V'
  | 'VI'
  | 'VII'
  | 'VIII';

export type SpedizioneStatus = 'concluso' | 'in-corso' | 'futuro';

// A single training run within an expedition. Failed runs are first-class: the
// blog narrates them, so they carry the same fields as the successful ones.
export type TappaOutcome = 'successo' | 'fallimento' | 'superata';

export interface Tappa {
  id: string;
  label_it: string;
  label_en: string;
  outcome: TappaOutcome;
  // Headline figure exactly as reported in the postmortem. Bilingual because the
  // gloss after the number ("goes to production") is prose, not just a number.
  metric_it: string;
  metric_en: string;
}

export interface Spedizione {
  numero: SpedizioneNumero;
  slug: string;
  title_it: string;
  title_en: string;
  project_id: string;
  status: SpedizioneStatus;
  hardware: string | null;
  postmortem: string | null; // postmortem filename, for traceability
  blurb_it: string;
  blurb_en: string;
  tappe: Tappa[];
}
