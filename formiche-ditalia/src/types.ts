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
  photo_urls: string[];
  similar_genera: string[];
  references: string[];
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
}
