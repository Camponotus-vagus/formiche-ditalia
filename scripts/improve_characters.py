#!/usr/bin/env python3
"""
Improve characters.json with Italian translations, correct body regions,
and difficulty levels for each character in the identification key.
"""

import json
from pathlib import Path

CHARACTERS_PATH = Path(__file__).parent.parent / "formiche-ditalia" / "src" / "data" / "characters.json"

# Mapping: character id -> (name_it, body_region, difficulty)
# Body regions: 'head', 'thorax', 'petiole', 'gaster', 'legs', 'antennae'
# Difficulty: 'easy', 'medium', 'hard'

CHARACTER_IMPROVEMENTS = {
    # === MYRMICINAE (gen-1 to gen-20) ===
    "gen-1": {
        "name_it": "Setole erette sul mesosoma",
        "name_en": "Erect setae on the mesosoma",
        "body_region": "thorax",
        "difficulty": "hard",
    },
    "gen-2": {
        "name_it": "Forma del capo",
        "name_en": "Head shape",
        "body_region": "head",
        "difficulty": "easy",
    },
    "gen-3": {
        "name_it": "Numero di segmenti antennali",
        "name_en": "Antennal segments",
        "body_region": "antennae",
        "difficulty": "medium",
    },
    "gen-4": {
        "name_it": "Segmenti della clava antennale",
        "name_en": "Segments of the antennal club",
        "body_region": "antennae",
        "difficulty": "medium",
    },
    "gen-5": {
        "name_it": "Occhi composti",
        "name_en": "Compound eyes",
        "body_region": "head",
        "difficulty": "medium",
    },
    "gen-6": {
        "name_it": "Forma delle mandibole",
        "name_en": "Mandibular shape",
        "body_region": "head",
        "difficulty": "medium",
    },
    "gen-7": {
        "name_it": "Dentatura mandibolare",
        "name_en": "Mandibular dentition",
        "body_region": "head",
        "difficulty": "medium",
    },
    "gen-8": {
        "name_it": "Formula palpale",
        "name_en": "Palp formula",
        "body_region": "head",
        "difficulty": "hard",
    },
    "gen-9": {
        # This is a broken/empty character (parsing artifact from NEXUS).
        # Keep it but mark it; it has no states and won't display.
        "name_it": "Formula palpale (continua)",
        "name_en": "Palp formula (continued)",
        "body_region": "head",
        "difficulty": "hard",
    },
    "gen-10": {
        "name_it": "Porzioni laterali del clipeo",
        "name_en": "Lateral portions of the clypeus",
        "body_region": "head",
        "difficulty": "hard",
    },
    "gen-11": {
        "name_it": "Profilo del mesosoma",
        "name_en": "Mesosoma profile",
        "body_region": "thorax",
        "difficulty": "medium",
    },
    "gen-12": {
        "name_it": "Lati del pronoto",
        "name_en": "Lateral sides of the pronotum",
        "body_region": "thorax",
        "difficulty": "medium",
    },
    "gen-13": {
        "name_it": "Propodeo",
        "name_en": "Propodeum",
        "body_region": "thorax",
        "difficulty": "medium",
    },
    "gen-14": {
        "name_it": "Speroni delle tibie medie e posteriori",
        "name_en": "Spur of middle and hind tibiae",
        "body_region": "legs",
        "difficulty": "hard",
    },
    "gen-15": {
        "name_it": "Forma del peziolo e postpeziolo",
        "name_en": "Petiole and postpetiole shape",
        "body_region": "petiole",
        "difficulty": "medium",
    },
    "gen-16": {
        "name_it": "Superficie ventrale del peziolo e postpeziolo",
        "name_en": "Ventral surface of petiole and postpetiole",
        "body_region": "petiole",
        "difficulty": "hard",
    },
    "gen-17": {
        "name_it": "Postpeziolo, vista dorsale",
        "name_en": "Postpetiole, dorsal view",
        "body_region": "petiole",
        "difficulty": "medium",
    },
    "gen-18": {
        "name_it": "Articolazione del postpeziolo",
        "name_en": "Postpetiole",
        "body_region": "petiole",
        "difficulty": "hard",
    },
    "gen-19": {
        "name_it": "Forma del gastro",
        "name_en": "Gaster shape",
        "body_region": "gaster",
        "difficulty": "easy",
    },
    "gen-20": {
        "name_it": "Pungiglione",
        "name_en": "Sting",
        "body_region": "gaster",
        "difficulty": "hard",
    },

    # === PONERINAE (gen-21 to gen-25) ===
    "gen-21": {
        "name_it": "Colore",
        "name_en": "Colour",
        "body_region": "gaster",  # whole body, but gaster is most visible
        "difficulty": "easy",
    },
    "gen-22": {
        "name_it": "Margine masticatorio della mandibola",
        "name_en": "Mandibular masticatory margin",
        "body_region": "head",
        "difficulty": "hard",
    },
    "gen-23": {
        "name_it": "Speroni della tibia posteriore",
        "name_en": "Hind tibia spur(s)",
        "body_region": "legs",
        "difficulty": "hard",
    },
    "gen-24": {
        "name_it": "Tibia media",
        "name_en": "Mid tibia",
        "body_region": "legs",
        "difficulty": "hard",
    },
    "gen-25": {
        "name_it": "Processo subpeziale",
        "name_en": "Subpetiolar process",
        "body_region": "petiole",
        "difficulty": "hard",
    },

    # === DOLICHODERINAE (gen-26 to gen-32) ===
    "gen-26": {
        "name_it": "Colore",
        "name_en": "Colour",
        "body_region": "gaster",  # whole body color, gaster most visible
        "difficulty": "easy",
    },
    "gen-27": {
        "name_it": "Formula palpale",
        "name_en": "Palpal formula",
        "body_region": "head",
        "difficulty": "hard",
    },
    "gen-28": {
        "name_it": "Margine anteriore del clipeo",
        "name_en": "Anterior margin of the clypeus",
        "body_region": "head",
        "difficulty": "medium",
    },
    "gen-29": {
        "name_it": "Tegumento del capo e del mesosoma",
        "name_en": "Head and mesosoma integument",
        "body_region": "head",
        "difficulty": "hard",
    },
    "gen-30": {
        "name_it": "Peli eretti sul pronoto",
        "name_en": "Erect hairs on the pronotum",
        "body_region": "thorax",
        "difficulty": "hard",
    },
    "gen-31": {
        "name_it": "Squama peziolare",
        "name_en": "Petiolar scale",
        "body_region": "petiole",
        "difficulty": "medium",
    },
    "gen-32": {
        "name_it": "Macchie gialle sul gastro",
        "name_en": "Yellow dots on the gaster",
        "body_region": "gaster",
        "difficulty": "easy",
    },

    # === FORMICINAE (gen-33 to gen-40) ===
    "gen-33": {
        "name_it": "Casta soldato con capo troncato",
        "name_en": "Soldier caste with truncated head",
        "body_region": "head",
        "difficulty": "easy",
    },
    "gen-34": {
        "name_it": "Formula palpale",
        "name_en": "Palpal formula",
        "body_region": "head",
        "difficulty": "hard",
    },
    "gen-35": {
        "name_it": "4\u00b0 articolo del palpo mascellare",
        "name_en": "4th article of the maxillary palp",
        "body_region": "head",
        "difficulty": "hard",
    },
    "gen-36": {
        "name_it": "Forma delle mandibole",
        "name_en": "Mandibular shape",
        "body_region": "head",
        "difficulty": "medium",
    },
    "gen-37": {
        "name_it": "Denti mandibolari",
        "name_en": "Mandibular teeth",
        "body_region": "head",
        "difficulty": "medium",
    },
    "gen-38": {
        "name_it": "Inserzione delle antenne",
        "name_en": "Antennal insertion",
        "body_region": "head",
        "difficulty": "medium",
    },
    "gen-39": {
        "name_it": "Numero di segmenti antennali",
        "name_en": "Antennal segments",
        "body_region": "antennae",
        "difficulty": "medium",
    },
    "gen-40": {
        "name_it": "Propodeo",
        "name_en": "Propodeum",
        "body_region": "thorax",
        "difficulty": "medium",
    },
}


def main():
    # Read current characters
    with open(CHARACTERS_PATH, "r", encoding="utf-8") as f:
        characters = json.load(f)

    print(f"Loaded {len(characters)} characters from {CHARACTERS_PATH}\n")

    updated = 0
    skipped = 0

    for char in characters:
        char_id = char["id"]
        if char_id in CHARACTER_IMPROVEMENTS:
            improvements = CHARACTER_IMPROVEMENTS[char_id]
            old_name_it = char.get("name_it", "")
            old_body_region = char.get("body_region", "")
            old_difficulty = char.get("difficulty", "")

            char["name_it"] = improvements["name_it"]
            char["name_en"] = improvements["name_en"]
            char["body_region"] = improvements["body_region"]
            char["difficulty"] = improvements["difficulty"]

            print(f"  {char_id}: '{old_name_it}' -> '{improvements['name_it']}'")
            print(f"          body_region: {old_body_region} -> {improvements['body_region']}")
            print(f"          difficulty:  {old_difficulty} -> {improvements['difficulty']}")
            updated += 1
        else:
            print(f"  {char_id}: NO MAPPING FOUND - skipped")
            skipped += 1

    # Write updated characters
    with open(CHARACTERS_PATH, "w", encoding="utf-8") as f:
        json.dump(characters, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Updated {updated} characters, skipped {skipped}.")
    print(f"Written to {CHARACTERS_PATH}")


if __name__ == "__main__":
    main()
