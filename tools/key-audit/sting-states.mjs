// Single source of truth for the sting-condition coding (character gen-52, issue #32 §4).
// The one-time migration that wrote characters.json + matrix.json + coding-provenance.csv
// generated its cells from this module, and test-sting-honest.mjs imports it to assert the
// matrix still matches — so the coding and the test that checks it cannot drift apart.
//
// State set (gen-52, global, easy, gaster):
//   '0' = presente e pungente (functional as a weapon)
//   '1' = assente, sostituito dall'acidoporo (Formicinae)
//   '2' = ridotto, modificato o vestigiale, non pungente (senza acidoporo)
//
// Sourcing (owner-approved 2026-08-12, spec docs/superpowers/specs/2026-08-12-sting-character-spec.md):
// internal corpus only — Bolton 1994 subfamily diagnoses (docs/references/Bolton_1994_Ant_genera_world.txt),
// the local AntWiki corpus (sources/antwiki/genera/), docs/worker-morphology-generi.md and the
// thesis matrix. A subfamily-level diagnosis covers all its genera; per-genus confirmations
// recorded where found. Crematogaster's sting is well developed but spatulate (non-piercing,
// venom applied topically) → state 2 under the "modificato, non pungente" wording. Monomorium
// is species-dependent ("strong to very feebly developed", Bolton 1987) → honest multi-state.
//
// This axis is categorical; the approved states are stored directly (no derivation function).

export const STATES = {
  // Myrmicinae (19)
  aphaenogaster:    ['0'],
  cardiocondyla:    ['0'],
  crematogaster:    ['2'],
  formicoxenus:     ['0'],
  harpagoxenus:     ['0'],
  leptothorax:      ['0'],
  manica:           ['0'],
  messor:           ['2'],
  monomorium:       ['0', '2'],
  myrmecina:        ['2'],
  myrmica:          ['0'],
  oxyopomyrmex:     ['0'],
  pheidole:         ['2'],
  solenopsis:       ['0'],
  stenamma:         ['0'],
  strongylognathus: ['0'],
  strumigenys:      ['0'],
  temnothorax:      ['0'],
  tetramorium:      ['0'],
  // Ponerinae (4)
  brachyponera:     ['0'],
  cryptopone:       ['0'],
  hypoponera:       ['0'],
  ponera:           ['0'],
  // Dolichoderinae (5)
  bothriomyrmex:    ['2'],
  dolichoderus:     ['2'],
  linepithema:      ['2'],
  liometopum:       ['2'],
  tapinoma:         ['2'],
  // Formicinae (11)
  camponotus:       ['1'],
  cataglyphis:      ['1'],
  colobopsis:       ['1'],
  formica:          ['1'],
  lasius:           ['1'],
  lepisiota:        ['1'],
  nylanderia:       ['1'],
  paratrechina:     ['1'],
  plagiolepis:      ['1'],
  polyergus:        ['1'],
  prenolepis:       ['1'],
  // Leptanillinae (1)
  leptanilla:       ['0'],
  // Proceratiinae (1)
  proceratium:      ['0'],
  // Amblyoponinae (1)
  stigmatomma:      ['0'],
};

// Provenance for coding-provenance.csv. One entry per genus; the migration writes one CSV row
// per state in STATES[genus], reusing this source/source_url/evidence/confidence.
export const PROVENANCE = {
  // Formicinae — subfamily diagnosis covers all 11; per-genus taxobox |sting=absent for each.
  camponotus:       { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Camponotus taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system of which the acidopore is the orifice"; taxobox |sting=absent' },
  cataglyphis:      { confidence: 'high', source: 'Bolton 1994 p.47 + Fig. 160 (acidopore); AntWiki Cataglyphis taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; "gastral apex to show acidopore in Cataglyphis" (fig. list p.57); taxobox |sting=absent' },
  colobopsis:       { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Colobopsis taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; taxobox |sting=absent' },
  formica:          { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Formica taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; taxobox |sting=absent' },
  lasius:           { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Lasius taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; taxobox |sting=absent' },
  lepisiota:        { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Lepisiota taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; taxobox |sting=absent' },
  nylanderia:       { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Nylanderia taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; taxobox |sting=absent' },
  paratrechina:     { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Paratrechina taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; taxobox |sting=absent' },
  plagiolepis:      { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Plagiolepis taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; taxobox |sting=absent' },
  polyergus:        { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Polyergus taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; taxobox |sting=absent' },
  prenolepis:       { confidence: 'high', source: 'Bolton 1994 p.47 (Formicinae diagnosis); AntWiki Prenolepis taxobox', source_url: '', evidence: '"Sting absent, replaced by formic-acid-projecting system…"; taxobox |sting=absent' },
  // Dolichoderinae — subfamily diagnosis covers all 5; per-genus taxobox |sting=absent for each.
  bothriomyrmex:    { confidence: 'high', source: 'Bolton 1994 p.15 & p.27 (Dolichoderinae); AntWiki Bothriomyrmex taxobox', source_url: '', evidence: '"Sting vestigial to absent, nonfunctional, and not detectable without dissection"; "Acidopore absent"; taxobox |sting=absent' },
  dolichoderus:     { confidence: 'high', source: 'Bolton 1994 p.15 & p.27 (Dolichoderinae); AntWiki Dolichoderus taxobox', source_url: '', evidence: '"Sting vestigial to absent, nonfunctional…"; taxobox |sting=absent' },
  linepithema:      { confidence: 'high', source: 'Bolton 1994 p.15 & p.27 (Dolichoderinae); AntWiki Linepithema taxobox', source_url: '', evidence: '"Sting vestigial to absent, nonfunctional…"; taxobox |sting=absent' },
  liometopum:       { confidence: 'high', source: 'Bolton 1994 p.15 & p.27 (Dolichoderinae); AntWiki Liometopum; Mackay & Mackay 2002', source_url: '', evidence: '"Sting vestigial to absent, nonfunctional…"; "although they do not sting, they can be very unpleasant"' },
  tapinoma:         { confidence: 'high', source: 'Bolton 1994 p.15 & p.27 (Dolichoderinae); AntWiki Tapinoma taxobox', source_url: '', evidence: '"Sting vestigial to absent, nonfunctional…"; taxobox |sting=absent' },
  // Ponerinae (Bolton 1994 classification also covers Stigmatomma and Proceratium) + Leptanillinae.
  brachyponera:     { confidence: 'high', source: 'Bolton 1994 p.158 (Ponerinae diagnosis); AntWiki Brachyponera', source_url: '', evidence: '"Sting present, usually large and strongly developed"; "B. chinensis and B. sennaarensis … have potentially dangerous stings"' },
  cryptopone:       { confidence: 'high', source: 'Bolton 1994 p.158 (Ponerinae diagnosis); AntWiki Cryptopone taxobox', source_url: '', evidence: '"Sting present, usually large and strongly developed"; taxobox |sting=present' },
  hypoponera:       { confidence: 'high', source: 'Bolton 1994 p.158 (Ponerinae diagnosis); AntWiki Hypoponera taxobox', source_url: '', evidence: '"Sting present, usually large and strongly developed"; taxobox |sting=present' },
  ponera:           { confidence: 'high', source: 'Bolton 1994 p.158 (Ponerinae diagnosis); AntWiki Ponera taxobox', source_url: '', evidence: '"Sting present, usually large and strongly developed"; taxobox |sting=present' },
  proceratium:      { confidence: 'high', source: 'Bolton 1994 p.158 (keys within Ponerinae in the 1994 classification); AntWiki Proceratium', source_url: '', evidence: '"Sting developed, curved downwards."; taxobox |sting=present' },
  stigmatomma:      { confidence: 'high', source: 'Bolton 1994 p.158 (as Amblyopone, within Ponerinae 1994); AntWiki Stigmatomma; Bharti & Rilta 2015', source_url: '', evidence: '"sting exserted"; taxobox |sting=present' },
  leptanilla:       { confidence: 'high', source: 'Bolton 1994 p.74 (Leptanillinae diagnosis); AntWiki Leptanilla taxobox; thesis matrix gen-19', source_url: '', evidence: '"Sting large, well developed, and functional."; taxobox |sting=present; thesis codes gen-19=0 (presupposes a sting)' },
  // Myrmicinae. Subfamily frame (Bolton 1994 p.80): "Sting present, usually large and strongly
  // developed, but reduced and nonfunctional as a weapon in some."
  aphaenogaster:    { confidence: 'medium', source: 'AntWiki Aphaenogaster taxobox; worker-morphology-generi.md', source_url: '', evidence: 'taxobox |sting=present; "Sting: present"' },
  cardiocondyla:    { confidence: 'high', source: 'Seifert 2003 (from Bolton 1982), quoted in AntWiki Cardiocondyla', source_url: '', evidence: '"Sting large, knife blade-like in profile, without lamelliform appendages"' },
  crematogaster:    { confidence: 'high', source: 'Buren 1959, Kugler 1978, quoted in AntWiki Crematogaster ("Use of the Sting")', source_url: '', evidence: '"The sting … is well developed, but with a blunt, spatulate tip that is unsuitable for pricking … and the venom is applied topically" — modified, non-piercing → state 2. AntWiki taxobox says |sting=absent, contradicted by its own sourced text; the text prevails' },
  formicoxenus:     { confidence: 'medium', source: 'AntWiki Formicoxenus taxobox', source_url: '', evidence: 'taxobox |sting=present' },
  harpagoxenus:     { confidence: 'medium', source: 'AntWiki Harpagoxenus taxobox', source_url: '', evidence: 'taxobox |sting=present' },
  leptothorax:      { confidence: 'medium', source: 'AntWiki Leptothorax taxobox', source_url: '', evidence: 'taxobox |sting=present' },
  manica:           { confidence: 'high', source: 'AntWiki Manica', source_url: '', evidence: '"when their nest is disturbed the workers sting promptly and effectively. The effect of the sting has been reported to be very painful"' },
  messor:           { confidence: 'medium', source: 'AntWiki Messor taxobox; worker-morphology-generi.md; Bolton 1994 p.80 frame', source_url: '', evidence: 'taxobox |sting=absent — read as reduced/nonfunctional per Bolton 1994 p.80 ("reduced and nonfunctional as a weapon in some")' },
  monomorium:       { confidence: 'high', source: 'Bolton 1987, quoted in AntWiki Monomorium', source_url: '', evidence: '"Sting strong to very feebly developed, in many linear-subspatulate apically but lacking lamelliform appendages" — species-dependent → honest multi-state 0,2' },
  myrmecina:        { confidence: 'medium', source: 'AntWiki Myrmecina taxobox; worker-morphology-generi.md; Bolton 1994 p.80 frame', source_url: '', evidence: 'taxobox |sting=absent — read as reduced/nonfunctional per Bolton 1994 p.80' },
  myrmica:          { confidence: 'medium', source: 'AntWiki Myrmica taxobox; worker-morphology-generi.md', source_url: '', evidence: 'taxobox |sting=present; "Sting: present"' },
  oxyopomyrmex:     { confidence: 'medium', source: 'AntWiki Oxyopomyrmex taxobox; Kugler 1979b cited in its bibliography', source_url: '', evidence: 'taxobox |sting=present; "Kugler, C. 1979b: 258 (sting structure)"' },
  pheidole:         { confidence: 'medium', source: 'AntWiki Pheidole taxobox; worker-morphology-generi.md; Bolton 1994 p.80 frame', source_url: '', evidence: 'taxobox |sting=absent — read as reduced/nonfunctional per Bolton 1994 p.80' },
  solenopsis:       { confidence: 'high', source: 'AntWiki Solenopsis', source_url: '', evidence: '"the intense, burning sensation caused by their stings"; "The painful sting wielded by the workers has earned such Solenopsis species the name fire ants"' },
  stenamma:         { confidence: 'medium', source: 'AntWiki Stenamma taxobox', source_url: '', evidence: 'taxobox |sting=present' },
  strongylognathus: { confidence: 'high', source: 'Bolton 1994 p.82 (Palaearctic Myrmicinae key, couplet 26-27)', source_url: '', evidence: '"Sting with an apicodorsal triangular to pennant-shaped lamellate appendage projecting from the shaft"' },
  strumigenys:      { confidence: 'medium', source: 'AntWiki Strumigenys taxobox', source_url: '', evidence: 'taxobox |sting=present' },
  temnothorax:      { confidence: 'medium', source: 'AntWiki Temnothorax taxobox', source_url: '', evidence: 'taxobox |sting=present (the "powerful stings" passage concerns Greater Antilles endemics, not Italian species)' },
  tetramorium:      { confidence: 'high', source: 'Bolton 1994 p.82 (Palaearctic Myrmicinae key)', source_url: '', evidence: '"Sting with an apicodorsal lamellate appendage projecting from the shaft (Fig. 417)"' },
};
