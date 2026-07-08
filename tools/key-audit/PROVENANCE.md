# Coding provenance (item 2.3)

`coding-provenance.csv` documents the **source of every non-thesis matrix coding** —
the states added or resolved during the multi-access-key unblock workstream (Steps
1–4 and the 2026-07-07/08 sourcing passes). It makes the key auditable and citable:
each row ties a `(genus, character, state)` to a reputable source, a URL, a
confidence level, and the **verbatim quote** that supports it.

## Columns

| column | meaning |
|---|---|
| `genus_id`, `scientific_name` | the genus the coding applies to |
| `character_id`, `character` | the character (see `characters.json`) |
| `state` | the coded state value(s); `a\|b` = polymorphic |
| `confidence` | `high` / `medium` / `low` — the curator's confidence in the assignment |
| `in_matrix` | `yes` = exactly this value is in the live `matrix.json`; `partial` = a subset (e.g. one state of a polymorphic pair); `no` = proposed but not merged |
| `source`, `source_url` | the reputable source (primary revision, AntWiki, Bolton, Seifert, …) |
| `evidence` | the exact verbatim quote from the source |

## Notes

- The original thesis matrix (Mensa 2017, Rigato-validated) is the baseline and is
  not re-documented here — this file covers only the **added/resolved** codings.
- Cells that remain `'?'` (unknown) or `'-'` (structurally inapplicable) are *not*
  in this file; the still-open unknowns are tracked in `remaining_unknowns.csv`
  (working copy under `~/Downloads/`).
- Regenerate from the curation CSV when new codings are sourced (the generator lives
  in the commit that introduced this file; input: `resolved_codings_full.csv`).
- Mandatory rule (see project `CLAUDE.md`): a coding without a sourced verbatim quote
  is not merged. This file is the audit trail for that rule.
