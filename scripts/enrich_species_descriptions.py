#!/usr/bin/env python3
"""Generate brief IT/EN descriptions and habitat notes for species lacking them.

Uses known myrmecological facts for common Italian ant species.
Run from project root: python3 scripts/enrich_species_descriptions.py
"""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SPECIES_FILE = PROJECT_ROOT / "formiche-ditalia" / "src" / "data" / "species.json"

# Species data: (description_it, description_en, habitat_notes_it, habitat_notes_en)
SPECIES_INFO = {
    "bothriomyrmex-sp": (
        "Genere di piccole formiche della sottofamiglia Dolichoderinae. Specie parassite sociali temporanee: le regine fondano le colonie infiltrandosi nei nidi di Tapinoma.",
        "Small ants of the subfamily Dolichoderinae. Temporary social parasites: queens found colonies by infiltrating Tapinoma nests.",
        "Ambienti aperti e disturbati, spesso in prossimità di nidi di Tapinoma.",
        "Open and disturbed habitats, often near Tapinoma nests."
    ),
    "camponotus-aethiops": (
        "Grande formica nera lucida, una delle specie più comuni del genere Camponotus in Italia. Operaie monomorfe di colore nero intenso. Colonie monoginiche relativamente grandi, attive principalmente di notte.",
        "Large glossy black ant, one of the most common Camponotus species in Italy. Monomorphic workers of deep black colour. Relatively large monogynous colonies, mainly active at night.",
        "Nidifica nel terreno, predilige suoli argillosi e ambienti aperti mediterranei. Comune in aree urbane e periurbane.",
        "Nests in the ground, prefers clay soils and open Mediterranean habitats. Common in urban and peri-urban areas."
    ),
    "camponotus-fallax": (
        "Formica di medie dimensioni dal colore giallo-bruno con gastro più scuro. Specie arboricola che nidifica nel legno morto e nelle cavità degli alberi. Colonie relativamente piccole.",
        "Medium-sized ant with yellow-brown colouring and darker gaster. Arboreal species nesting in dead wood and tree cavities. Relatively small colonies.",
        "Boschi e parchi, nidifica nelle cavità degli alberi e nel legno morto. Si trova anche in travi di vecchi edifici.",
        "Woodlands and parks, nests in tree cavities and dead wood. Also found in beams of old buildings."
    ),
    "camponotus-gestroi": (
        "Formica di medie dimensioni con colorazione bicolore: capo e torace bruno-rossastro, gastro scuro. Simile a C. lateralis ma di dimensioni leggermente maggiori.",
        "Medium-sized ant with bicoloured pattern: reddish-brown head and thorax, dark gaster. Similar to C. lateralis but slightly larger.",
        "Ambienti mediterranei, boschi di leccio e macchia. Nidifica nel terreno e sotto le pietre.",
        "Mediterranean habitats, holm oak woodlands and scrubland. Nests in soil and under stones."
    ),
    "camponotus-lateralis": (
        "Formica bicolore inconfondibile: capo e torace rosso-arancio, gastro nero. Specie arboricola molto comune nell'area mediterranea. Operaie agili e veloci.",
        "Unmistakable bicoloured ant: red-orange head and thorax, black gaster. Very common arboreal species in the Mediterranean area. Agile and fast workers.",
        "Boschi, parchi e giardini. Nidifica nelle cavità degli alberi, nel legno morto e talvolta nelle fessure dei muri.",
        "Woodlands, parks and gardens. Nests in tree cavities, dead wood and sometimes in wall crevices."
    ),
    "camponotus-piceus": (
        "Piccola formica del genere Camponotus, di colore bruno-nero uniforme. Una delle specie più piccole del genere in Italia. Colonie di dimensioni moderate.",
        "Small Camponotus ant, uniformly dark brown-black. One of the smallest species of the genus in Italy. Moderately sized colonies.",
        "Prati, ambienti aperti e margini boschivi. Nidifica nel terreno, spesso sotto le pietre.",
        "Meadows, open habitats and woodland edges. Nests in the ground, often under stones."
    ),
    "camponotus-vagus": (
        "La più grande formica italiana, interamente nera con riflessi argentei. Operaie maggiori con capo molto sviluppato. Colonie numerose che nidificano nel legno. Specie prevalentemente notturna.",
        "The largest Italian ant, entirely black with silvery reflections. Major workers with very developed head. Large colonies nesting in wood. Predominantly nocturnal species.",
        "Boschi di conifere e latifoglie, parchi urbani. Nidifica in ceppi, tronchi morti e travature in legno.",
        "Coniferous and deciduous woodlands, urban parks. Nests in stumps, dead logs and wooden beams."
    ),
    "cardiocondyla-elegans": (
        "Formica molto piccola con capo e torace bruno-giallastro e gastro più scuro. Specie termofila tipica degli ambienti mediterranei aridi.",
        "Very small ant with yellowish-brown head and thorax and darker gaster. Thermophilic species typical of arid Mediterranean environments.",
        "Ambienti sabbiosi e aridi, dune costiere, terreni calcarei. Nidifica nel terreno in zone molto esposte al sole.",
        "Sandy and arid habitats, coastal dunes, calcareous soils. Nests in the ground in sun-exposed areas."
    ),
    "cardiocondyla-nuda": (
        "Formica molto piccola di colore bruno uniforme. Specie esotica originaria dell'area mediterranea orientale, ormai diffusa in molte regioni calde. Colonie poliginiche con riproduzione per gemmazione.",
        "Very small ant of uniform brown colour. Exotic species originally from the eastern Mediterranean, now widespread in many warm regions. Polygynous colonies reproducing by budding.",
        "Ambienti urbani, giardini, serre. Specie sinantropica che predilige aree riscaldate.",
        "Urban environments, gardens, greenhouses. Synanthropic species preferring heated areas."
    ),
    "colobopsis-truncata": (
        "Formica arboricola con capo troncato: le operaie maggiori usano la testa piatta come 'porta vivente' per chiudere l'ingresso del nido. Colorazione giallo-bruna con gastro più scuro.",
        "Arboreal ant with truncated head: major workers use their flat head as a 'living door' to close the nest entrance. Yellow-brown colouring with darker gaster.",
        "Boschi e parchi. Nidifica esclusivamente nelle cavità di rametti e rami secchi degli alberi.",
        "Woodlands and parks. Nests exclusively in cavities of twigs and dead branches of trees."
    ),
    "crematogaster-scutellaris": (
        "Formica facilmente riconoscibile per il capo rosso e il corpo nero. Il gastro a forma di cuore, tipico del genere, viene sollevato sopra il torace in caso di disturbo. Molto comune in Italia.",
        "Easily recognizable ant with red head and black body. The heart-shaped gaster, typical of the genus, is raised above the thorax when disturbed. Very common in Italy.",
        "Boschi, parchi, giardini, ambienti urbani. Nidifica sotto la corteccia degli alberi, nelle cavità del legno e nei muri.",
        "Woodlands, parks, gardens, urban environments. Nests under tree bark, in wood cavities and in walls."
    ),
    "crematogaster-sordidula": (
        "Piccola formica bruna con gastro cordiforme tipico del genere. Più piccola e meno appariscente di C. scutellaris, con colorazione uniformemente bruna.",
        "Small brown ant with the heart-shaped gaster typical of the genus. Smaller and less conspicuous than C. scutellaris, with uniformly brown colouring.",
        "Ambienti aperti mediterranei, garighe, prati aridi. Nidifica nel terreno e sotto le pietre.",
        "Open Mediterranean habitats, garrigues, dry grasslands. Nests in the ground and under stones."
    ),
    "cryptopone-ochraceum": (
        "Piccola formica ponerina di colore giallo-ocra, con abitudini ipogee. Vive nel suolo dove caccia piccoli artropodi. Specie criptica raramente osservata in superficie.",
        "Small ponerine ant of ochre-yellow colour with subterranean habits. Lives in the soil where it hunts small arthropods. Cryptic species rarely observed on the surface.",
        "Terreni umidi e ricchi di humus, boschi e giardini. Nidifica in profondità nel suolo.",
        "Moist and humus-rich soils, woodlands and gardens. Nests deep in the soil."
    ),
    "dolichoderus-quadripunctatus": (
        "Formica arboricola di colore nero con quattro macchie chiare sul gastro (da cui il nome). Specie tipicamente associata agli alberi dove alleva afidi per la melata.",
        "Arboreal ant, black with four light spots on the gaster (hence the name). Species typically associated with trees where it tends aphids for honeydew.",
        "Boschi di latifoglie, parchi e giardini alberati. Nidifica nelle cavità degli alberi e sotto la corteccia.",
        "Deciduous woodlands, parks and tree-lined gardens. Nests in tree cavities and under bark."
    ),
    "formica-cunicularia": (
        "Formica di medie dimensioni dal colore bruno-rossastro. Costruisce nidi nel terreno con tumuli di terra poco evidenti. Specie molto comune nei prati e nelle aree aperte dell'Italia centrale.",
        "Medium-sized ant with reddish-brown colouring. Builds ground nests with inconspicuous earth mounds. Very common species in meadows and open areas of central Italy.",
        "Prati, pascoli, margini di sentieri e ambienti aperti. Nidifica nel terreno, spesso in aree ben esposte al sole.",
        "Meadows, pastures, path edges and open habitats. Nests in the ground, often in sun-exposed areas."
    ),
    "formica-gagates": (
        "Formica di colore nero lucido, di medie dimensioni. Specie tipica dei boschi ombrosi, dove forma colonie di dimensioni moderate nel legno marcescente.",
        "Glossy black ant of medium size. Typical species of shady woodlands, forming moderately sized colonies in decaying wood.",
        "Boschi umidi e ombrosi, soprattutto di latifoglie. Nidifica nel legno in decomposizione e nel terreno.",
        "Humid and shady woodlands, especially deciduous. Nests in decaying wood and in the ground."
    ),
    "formica-rufifabris": (
        "Formica bicolore con torace rossastro e capo e gastro più scuri. Specie che costruisce nidi nel terreno, talvolta con piccoli tumuli. Presente in vari ambienti aperti e semi-aperti.",
        "Bicoloured ant with reddish thorax and darker head and gaster. Builds ground nests, sometimes with small mounds. Found in various open and semi-open habitats.",
        "Prati, radure boschive, margini di sentieri. Nidifica nel terreno in aree soleggiate.",
        "Meadows, woodland clearings, path edges. Nests in the ground in sunny areas."
    ),
    "formica-sanguinea": (
        "Grande formica rossastra nota per il comportamento schiavista: le operaie razzia nidi di altre specie di Formica per rubare pupe da allevare come lavoratrici. Specie aggressiva e di grandi dimensioni.",
        "Large reddish ant known for its slave-making behaviour: workers raid nests of other Formica species to steal pupae raised as workers. Aggressive and large species.",
        "Boschi, radure e ambienti aperti. Nidifica nel terreno, spesso in prossimità di nidi di altre Formica.",
        "Woodlands, clearings and open habitats. Nests in the ground, often near nests of other Formica species."
    ),
    "hypoponera-abeillei": (
        "Formica ponerina molto piccola, di colore bruno-giallastro. Vive nel suolo e nella lettiera dove caccia piccoli artropodi. Specie criptica difficile da osservare.",
        "Very small ponerine ant, yellowish-brown. Lives in the soil and leaf litter hunting small arthropods. Cryptic species difficult to observe.",
        "Suoli umidi, lettiera di boschi, giardini. Nidifica nel terreno e sotto pietre e tronchi.",
        "Moist soils, woodland litter, gardens. Nests in the ground and under stones and logs."
    ),
    "hypoponera-eduardi": (
        "Piccola formica ponerina bruna con abitudini sotterranee. Predatrice di piccoli invertebrati del suolo. Simile ad H. punctatissima ma con caratteri morfologici distinti.",
        "Small brown ponerine ant with subterranean habits. Predator of small soil invertebrates. Similar to H. punctatissima but with distinct morphological characters.",
        "Terreni umidi, lettiera forestale, giardini. Nidifica nel suolo.",
        "Moist soils, forest litter, gardens. Nests in the soil."
    ),
    "hypoponera-punctatissima": (
        "Formica ponerina molto piccola di colore bruno, con superficie del corpo finemente punteggiata (da cui il nome). Specie cosmopolita spesso associata ad ambienti antropici riscaldati.",
        "Very small brown ponerine ant with finely punctuated body surface (hence the name). Cosmopolitan species often associated with heated anthropic environments.",
        "Serre, edifici riscaldati, giardini. Anche in lettiera e suoli umidi all'aperto in aree mediterranee.",
        "Greenhouses, heated buildings, gardens. Also in litter and moist soils outdoors in Mediterranean areas."
    ),
    "lasius-alienus": (
        "Formica comune di colore bruno chiaro, molto simile a L. niger ma più pallida. Una delle specie più abbondanti in Europa. Colonie monoginiche che possono essere molto popolose.",
        "Common light brown ant, very similar to L. niger but paler. One of the most abundant species in Europe. Monogynous colonies that can be very populous.",
        "Ambienti aperti, prati, giardini, aree urbane. Nidifica nel terreno, spesso sotto pietre e marciapiedi.",
        "Open habitats, meadows, gardens, urban areas. Nests in the ground, often under stones and pavements."
    ),
    "lasius-brunneus": (
        "Formica arboricola di colore bruno uniforme. Nidifica principalmente nelle cavità degli alberi vivi, dove può causare danni strutturali. Colonie di medie dimensioni.",
        "Arboreal ant of uniform brown colour. Nests mainly in cavities of living trees, where it can cause structural damage. Medium-sized colonies.",
        "Boschi di latifoglie, parchi, giardini con alberi maturi. Nidifica nelle cavità degli alberi.",
        "Deciduous woodlands, parks, gardens with mature trees. Nests in tree cavities."
    ),
    "lasius-distinguendus": (
        "Formica sotterranea di colore giallo pallido, con occhi ridotti. Specie parassita sociale temporanea che fonda le colonie nei nidi di altre Lasius. Alleva afidi radicali.",
        "Subterranean ant of pale yellow colour with reduced eyes. Temporary social parasite that founds colonies in nests of other Lasius. Tends root aphids.",
        "Prati, giardini, ambienti aperti. Nidifica in profondità nel terreno, raramente visibile in superficie.",
        "Meadows, gardens, open habitats. Nests deep in the ground, rarely visible on the surface."
    ),
    "lasius-emarginatus": (
        "Formica bicolore con capo e gastro bruni e torace rossastro. Molto comune in ambienti urbani dove nidifica nei muri e nelle fessure degli edifici. Specie sinantropica.",
        "Bicoloured ant with brown head and gaster and reddish thorax. Very common in urban environments where it nests in walls and building crevices. Synanthropic species.",
        "Muri, edifici, aree urbane, rupi calcaree. Nidifica nelle fessure di muri e rocce.",
        "Walls, buildings, urban areas, calcareous cliffs. Nests in crevices of walls and rocks."
    ),
    "lasius-fuliginosus": (
        "Grande formica nera lucida con caratteristico odore di limone quando disturbata. Costruisce nidi di cartone masticato nelle cavità degli alberi, in simbiosi con il fungo Cladosporium myrmecophilum.",
        "Large glossy black ant with characteristic lemon scent when disturbed. Builds nests of chewed cardboard in tree cavities, in symbiosis with the fungus Cladosporium myrmecophilum.",
        "Boschi di latifoglie con alberi maturi. Nidifica esclusivamente nelle cavità degli alberi.",
        "Deciduous woodlands with mature trees. Nests exclusively in tree cavities."
    ),
    "lasius-lasioides": (
        "Piccola formica bruna del gruppo L. niger. Specie tipicamente mediterranea, leggermente più piccola di L. niger. Colonie monoginiche.",
        "Small brown ant of the L. niger group. Typically Mediterranean species, slightly smaller than L. niger. Monogynous colonies.",
        "Ambienti mediterranei aperti, garighe, macchia bassa. Nidifica nel terreno.",
        "Open Mediterranean habitats, garrigues, low scrubland. Nests in the ground."
    ),
    "lasius-myops": (
        "Formica sotterranea di colore giallo con occhi molto piccoli (da cui il nome). Vive interamente nel suolo dove alleva afidi radicali per la melata.",
        "Subterranean ant of yellow colour with very small eyes (hence the name). Lives entirely in the soil tending root aphids for honeydew.",
        "Prati, pascoli, ambienti aperti con suolo profondo. Nidifica nel terreno.",
        "Meadows, pastures, open habitats with deep soil. Nests in the ground."
    ),
    "lasius-niger": (
        "La formica nera dei giardini, probabilmente la specie più comune e conosciuta in Europa. Colonie monoginiche che possono contare decine di migliaia di operaie. Importante allevatrice di afidi.",
        "The black garden ant, probably the most common and well-known species in Europe. Monogynous colonies that can number tens of thousands of workers. Important aphid tender.",
        "Giardini, parchi, marciapiedi, campi coltivati, praticamente ogni ambiente. Nidifica nel terreno, spesso sotto pietre e pavimentazioni.",
        "Gardens, parks, pavements, cultivated fields, virtually every habitat. Nests in the ground, often under stones and paving."
    ),
    "lasius-nitidigaster": (
        "Formica sotterranea del sottogenere Chthonolasius, di colore bruno-giallastro. Parassita sociale temporanea: la regina fonda la colonia usurpando un nido di Lasius.",
        "Subterranean ant of the subgenus Chthonolasius, yellowish-brown. Temporary social parasite: the queen founds the colony by usurping a Lasius nest.",
        "Prati e ambienti aperti. Nidifica nel terreno.",
        "Meadows and open habitats. Nests in the ground."
    ),
    "lasius-paralienus": (
        "Formica molto simile a L. alienus, di colore bruno chiaro. Predilige ambienti più aridi e aperti rispetto alla specie sorella. Colonie monoginiche.",
        "Ant very similar to L. alienus, light brown. Prefers drier and more open habitats than its sibling species. Monogynous colonies.",
        "Prati aridi, garighe, ambienti aperti mediterranei. Nidifica nel terreno.",
        "Dry grasslands, garrigues, open Mediterranean habitats. Nests in the ground."
    ),
    "linepithema-humile": (
        "La formica argentina, una delle specie invasive più dannose al mondo. Piccola, di colore bruno uniforme. Forma supercolonie con milioni di operaie e migliaia di regine. Compete aggressivamente con le specie native.",
        "The Argentine ant, one of the most damaging invasive species worldwide. Small, uniformly brown. Forms supercolonies with millions of workers and thousands of queens. Aggressively competes with native species.",
        "Ambienti costieri, giardini, aree urbane. Predilige climi mediterranei. Nidifica nel terreno e in ogni tipo di cavità.",
        "Coastal environments, gardens, urban areas. Prefers Mediterranean climates. Nests in the ground and in any type of cavity."
    ),
    "messor-capitatus": (
        "La più grande formica mietitrice italiana, con operaie maggiori dal capo enorme e mandibole potenti per frantumare i semi. Colonie di grandi dimensioni con evidente polimorfismo delle operaie.",
        "The largest Italian harvester ant, with major workers having a huge head and powerful mandibles for crushing seeds. Large colonies with conspicuous worker polymorphism.",
        "Ambienti mediterranei aperti, prati, campi. Nidifica nel terreno con ingressi circondati da accumuli di bucce di semi.",
        "Open Mediterranean habitats, meadows, fields. Nests in the ground with entrances surrounded by seed husk piles."
    ),
    "messor-meridionalis": (
        "Formica mietitrice di medie dimensioni, endemica del Mediterraneo. Raccoglie e immagazzina semi nei granai sotterranei. Polimorfismo delle operaie meno accentuato rispetto a M. capitatus.",
        "Medium-sized harvester ant, endemic to the Mediterranean. Collects and stores seeds in underground granaries. Worker polymorphism less pronounced than in M. capitatus.",
        "Prati e ambienti aperti mediterranei. Nidifica nel terreno.",
        "Meadows and open Mediterranean habitats. Nests in the ground."
    ),
    "messor-minor": (
        "Formica mietitrice di medie dimensioni con operaie polimorfiche. Raccoglie attivamente semi che vengono immagazzinati in camere sotterranee. Forma lunghe colonne di foraggiamento.",
        "Medium-sized harvester ant with polymorphic workers. Actively collects seeds stored in underground chambers. Forms long foraging columns.",
        "Prati, campi coltivati, ambienti aperti. Nidifica nel terreno con ingressi caratteristici circondati da detriti.",
        "Meadows, cultivated fields, open habitats. Nests in the ground with characteristic entrances surrounded by debris."
    ),
    "messor-structor": (
        "Formica mietitrice comune con operaie di dimensioni molto variabili. Le maggiori hanno capo sproporzionatamente grande. Forma granai sotterranei per conservare i semi raccolti.",
        "Common harvester ant with highly variable worker sizes. Majors have disproportionately large heads. Forms underground granaries to store collected seeds.",
        "Ambienti aperti, prati, margini stradali, campi. Nidifica nel terreno in aree ben esposte.",
        "Open habitats, meadows, roadsides, fields. Nests in the ground in well-exposed areas."
    ),
    "messor-wasmanni": (
        "Formica mietitrice di dimensioni medio-grandi, con colorazione bruno-nerastra. Come le altre Messor, raccoglie semi che costituiscono la base della dieta della colonia.",
        "Medium-large harvester ant with dark brown-blackish colouring. Like other Messor, collects seeds that form the colony's dietary staple.",
        "Ambienti aperti e aridi, garighe, prati mediterranei. Nidifica nel terreno.",
        "Open and arid habitats, garrigues, Mediterranean meadows. Nests in the ground."
    ),
    "monomorium-monomorium": (
        "Formica molto piccola di colore bruno-nero. Specie comune negli ambienti mediterranei, dove forma colonie di dimensioni moderate nel terreno.",
        "Very small dark brown-black ant. Common species in Mediterranean environments, forming moderately sized ground colonies.",
        "Ambienti aperti, giardini, aree urbane. Nidifica nel terreno e sotto le pietre.",
        "Open habitats, gardens, urban areas. Nests in the ground and under stones."
    ),
    "monomorium-pharaonis": (
        "La formica faraone, piccola formica esotica di colore giallo-arancio. Specie cosmopolita infestante, vive esclusivamente in ambienti riscaldati nelle regioni temperate. Colonie molto poliginiche.",
        "The pharaoh ant, small exotic ant of yellow-orange colour. Cosmopolitan pest species, living exclusively in heated environments in temperate regions. Highly polygynous colonies.",
        "Edifici riscaldati, ospedali, ristoranti, serre. Non sopravvive all'aperto in Italia.",
        "Heated buildings, hospitals, restaurants, greenhouses. Cannot survive outdoors in Italy."
    ),
    "myrmecina-graminicola": (
        "Piccola formica tozza di colore bruno scuro, con corpo robusto e superficie rugosa. Specie criptica che vive nella lettiera e nello strato superficiale del suolo. Colonie molto piccole.",
        "Small stocky ant of dark brown colour with robust body and rugose surface. Cryptic species living in leaf litter and the topsoil layer. Very small colonies.",
        "Boschi, lettiera, suoli umidi. Nidifica nel terreno, nella lettiera e sotto pietre e tronchi.",
        "Woodlands, leaf litter, moist soils. Nests in the ground, in litter and under stones and logs."
    ),
    "myrmica-sabuleti": (
        "Formica rossastra di medie dimensioni con pungiglione funzionale. Presenta spine propodeali e scultura del corpo caratteristiche. Specie tipica di prati e ambienti aperti.",
        "Medium-sized reddish ant with functional sting. Shows characteristic propodeal spines and body sculpture. Typical species of meadows and open habitats.",
        "Prati, pascoli, radure. Predilige suoli ben drenati e soleggiati. Nidifica nel terreno e sotto le pietre.",
        "Meadows, pastures, clearings. Prefers well-drained and sunny soils. Nests in the ground and under stones."
    ),
    "myrmica-scabrinodis": (
        "Formica rossastra con superficie del corpo rugosa e spine propodeali evidenti. Specie molto comune in tutta Europa. Ospita spesso le larve della farfalla Maculinea (parassitismo sociale).",
        "Reddish ant with rugose body surface and conspicuous propodeal spines. Very common species throughout Europe. Often hosts Maculinea butterfly larvae (social parasitism).",
        "Prati umidi, margini di zone umide, boschi radi. Nidifica nel terreno e sotto le pietre.",
        "Wet meadows, wetland margins, open woodlands. Nests in the ground and under stones."
    ),
    "myrmica-specioides": (
        "Formica rossastra simile a M. sabuleti, distinguibile per caratteri morfologici sottili. Specie termofila che predilige ambienti più caldi e secchi rispetto alle congeneri.",
        "Reddish ant similar to M. sabuleti, distinguishable by subtle morphological characters. Thermophilic species preferring warmer and drier habitats than its congeners.",
        "Prati aridi, ambienti aperti calcarei, aree termofile. Nidifica nel terreno.",
        "Dry grasslands, open calcareous habitats, thermophilic areas. Nests in the ground."
    ),
    "pheidole-pallidula": (
        "Formica con marcato dimorfismo delle operaie: le soldato hanno un capo enorme sproporzionato. Colore giallo-bruno pallido. Una delle specie più abbondanti dell'area mediterranea.",
        "Ant with marked worker dimorphism: soldiers have an enormously disproportionate head. Pale yellow-brown colour. One of the most abundant species in the Mediterranean area.",
        "Ambienti mediterranei aperti, giardini, aree urbane, muri. Nidifica nel terreno e nelle fessure.",
        "Open Mediterranean habitats, gardens, urban areas, walls. Nests in the ground and in crevices."
    ),
    "plagiolepis-pygmaea": (
        "Una delle formiche più piccole d'Europa, di colore bruno-giallastro. Operaie minuscole ma colonie molto popolose. Specie termofila molto comune nel Mediterraneo.",
        "One of the smallest ants in Europe, yellowish-brown. Tiny workers but very populous colonies. Thermophilic species very common in the Mediterranean.",
        "Ambienti aperti soleggiati, muri, rocce, giardini. Nidifica nelle fessure e sotto le pietre.",
        "Sunny open habitats, walls, rocks, gardens. Nests in crevices and under stones."
    ),
    "plagiolepis-xene": (
        "Formica minuscola, parassita sociale obbligata di P. pygmaea. Le operaie sono assenti; la specie dipende interamente dalla colonia ospite per il nutrimento e la cura della prole.",
        "Tiny ant, obligate social parasite of P. pygmaea. Workers are absent; the species depends entirely on the host colony for food and brood care.",
        "Ovunque si trovi P. pygmaea, all'interno dei suoi nidi.",
        "Wherever P. pygmaea is found, inside its nests."
    ),
    "polyergus-rufescens": (
        "Formica schiavista obbligata di colore rosso-arancio brillante. Le operaie hanno mandibole a falce specializzate per il combattimento. Razzia nidi di Formica per rubare pupe.",
        "Obligate slave-making ant of bright red-orange colour. Workers have sickle-shaped mandibles specialized for combat. Raids Formica nests to steal pupae.",
        "Boschi radi, radure, prati. Nidifica nel terreno, sempre in prossimità di colonie di Formica (ospiti).",
        "Open woodlands, clearings, meadows. Nests in the ground, always near Formica (host) colonies."
    ),
    "ponera-coarctata": (
        "Piccola formica ponerina di colore bruno scuro con pungiglione funzionale. Predatrice specializzata di piccoli artropodi del suolo. Colonie molto piccole (decine di operaie).",
        "Small dark brown ponerine ant with functional sting. Specialized predator of small soil arthropods. Very small colonies (tens of workers).",
        "Suoli umidi, lettiera, boschi, giardini. Nidifica nel terreno, sotto pietre e tronchi.",
        "Moist soils, leaf litter, woodlands, gardens. Nests in the ground, under stones and logs."
    ),
    "solenopsis-fugax": (
        "Formica ladra: minuscola e di colore giallo, vive come cleptoparassita nei pressi dei nidi di altre formiche, rubando cibo e covata attraverso gallerie troppo piccole per le ospiti.",
        "The thief ant: tiny and yellow, lives as a cleptoparasite near nests of other ants, stealing food and brood through tunnels too small for the hosts.",
        "Ambienti vari, ovunque ci siano nidi di formiche più grandi. Nidifica nel terreno.",
        "Various habitats, wherever there are nests of larger ants. Nests in the ground."
    ),
    "stenamma-debile": (
        "Piccola formica bruna criptica che vive nella lettiera forestale. Colonie molto piccole e discrete. Predatrice di piccoli invertebrati.",
        "Small cryptic brown ant living in forest litter. Very small and discrete colonies. Predator of small invertebrates.",
        "Boschi umidi, lettiera profonda. Nidifica nel terreno e nella lettiera.",
        "Humid woodlands, deep litter. Nests in the ground and in leaf litter."
    ),
    "stenamma-striatulum": (
        "Formica criptica simile a S. debile, con superficie del corpo più nettamente striata. Vive nella lettiera e negli strati superficiali del suolo forestale.",
        "Cryptic ant similar to S. debile, with more distinctly striated body surface. Lives in leaf litter and superficial layers of forest soil.",
        "Boschi, lettiera, suoli umidi. Nidifica nel terreno.",
        "Woodlands, leaf litter, moist soils. Nests in the ground."
    ),
    "stigmatomma-denticulatum": (
        "Formica primitiva della sottofamiglia Amblyoponinae, di colore bruno-giallastro con mandibole allungate e dentellate. Predatrice specializzata di geofili (centopiedi). Specie molto rara.",
        "Primitive ant of the subfamily Amblyoponinae, yellowish-brown with elongated and denticulate mandibles. Specialized predator of geophilomorph centipedes. Very rare species.",
        "Suoli umidi e profondi, boschi maturi. Nidifica in profondità nel terreno.",
        "Deep moist soils, mature woodlands. Nests deep in the ground."
    ),
    "stigmatomma-impressifrons": (
        "Formica primitiva simile a S. denticulatum, con fronte impressa caratteristica. Predatrice ipogea di centopiedi e altri artropodi del suolo. Estremamente rara e difficile da osservare.",
        "Primitive ant similar to S. denticulatum, with characteristic impressed frons. Subterranean predator of centipedes and other soil arthropods. Extremely rare and difficult to observe.",
        "Suoli umidi, boschi, ambienti ipogei. Nidifica nel terreno.",
        "Moist soils, woodlands, subterranean habitats. Nests in the ground."
    ),
    "strumigenys-argiola": (
        "Formica minuscola con mandibole a trappola specializzate per catturare collemboli. Corpo ricoperto di setole spatolate caratteristiche. Specie endemica della Sardegna e di alcune aree tirreniche.",
        "Tiny ant with specialized trap-jaw mandibles for catching springtails. Body covered with characteristic spatulate setae. Species endemic to Sardinia and some Tyrrhenian areas.",
        "Lettiera di boschi, suoli umidi. Nidifica nella lettiera e sotto pietre.",
        "Woodland litter, moist soils. Nests in litter and under stones."
    ),
    "strumigenys-baudueri": (
        "Formica minuscola con mandibole a trappola e corpo ricoperto di setole particolari. Predatrice specializzata di collemboli che cattura con un rapido scatto delle mandibole.",
        "Tiny ant with trap-jaw mandibles and body covered with peculiar setae. Specialized predator of springtails caught with a rapid mandible snap.",
        "Lettiera di boschi mediterranei, giardini. Nidifica nella lettiera e nel suolo superficiale.",
        "Mediterranean woodland litter, gardens. Nests in leaf litter and topsoil."
    ),
    "strumigenys-membranifera": (
        "Formica minuscola cosmopolita con mandibole a trappola. Originaria dell'area paleotropicale, diffusa in tutto il mondo tramite il commercio. Predatrice di collemboli.",
        "Tiny cosmopolitan ant with trap-jaw mandibles. Originally from the Palaeotropical region, spread worldwide through commerce. Predator of springtails.",
        "Serre, giardini, lettiera in ambienti caldi. Specie sinantropica in Europa.",
        "Greenhouses, gardens, litter in warm environments. Synanthropic species in Europe."
    ),
    "strumigenys-tenuipilis": (
        "Formica minuscola con mandibole a trappola e setole molto sottili (da cui il nome). Predatrice criptica di collemboli nella lettiera forestale.",
        "Tiny ant with trap-jaw mandibles and very thin setae (hence the name). Cryptic predator of springtails in forest litter.",
        "Lettiera di boschi, suoli umidi. Nidifica nella lettiera.",
        "Woodland litter, moist soils. Nests in leaf litter."
    ),
    "tapinoma-erraticum": (
        "Piccola formica nera molto attiva e veloce. Quando disturbata emette un odore caratteristico di burro rancido. Colonie poliginiche che possono essere molto popolose.",
        "Small very active and fast black ant. When disturbed emits a characteristic rancid butter odour. Polygynous colonies that can be very populous.",
        "Prati, ambienti aperti, margini stradali. Nidifica nel terreno, spesso sotto pietre piatte.",
        "Meadows, open habitats, roadsides. Nests in the ground, often under flat stones."
    ),
    "tapinoma-madeirense": (
        "Piccola formica bruna del gruppo T. nigerrimum, di origine macaronesica. Molto simile a T. nigerrimum ma di dimensioni leggermente inferiori. Comune nell'area mediterranea.",
        "Small brown ant of the T. nigerrimum group, of Macaronesian origin. Very similar to T. nigerrimum but slightly smaller. Common in the Mediterranean area.",
        "Ambienti costieri, giardini, aree urbane mediterranee. Nidifica nel terreno.",
        "Coastal environments, gardens, Mediterranean urban areas. Nests in the ground."
    ),
    "tapinoma-nigerrimum": (
        "Formica nera di piccole-medie dimensioni, molto comune nel Mediterraneo. Forma colonie poliginiche estremamente popolose. Spesso confusa con T. madeirense.",
        "Small-medium black ant, very common in the Mediterranean. Forms extremely populous polygynous colonies. Often confused with T. madeirense.",
        "Ambienti aperti, giardini, oliveti, aree urbane. Nidifica nel terreno e sotto le pietre.",
        "Open habitats, gardens, olive groves, urban areas. Nests in the ground and under stones."
    ),
    "temnothorax-italicus": (
        "Piccola formica bruna tipica della fauna italiana. Nidifica in cavità preformate come gusci di chiocciole vuoti, ghiande e fessure nelle rocce.",
        "Small brown ant typical of the Italian fauna. Nests in preformed cavities such as empty snail shells, acorns and rock crevices.",
        "Boschi, macchia mediterranea, ambienti rocciosi. Nidifica in microcavità.",
        "Woodlands, Mediterranean scrubland, rocky habitats. Nests in micro-cavities."
    ),
    "temnothorax-lichtensteini": (
        "Piccola formica di colore giallo-bruno chiaro. Specie arboricola che nidifica sotto la corteccia e nei rami secchi. Colonie molto piccole.",
        "Small light yellow-brown ant. Arboreal species nesting under bark and in dry branches. Very small colonies.",
        "Boschi, parchi con alberi maturi. Nidifica sotto la corteccia e nei rametti.",
        "Woodlands, parks with mature trees. Nests under bark and in twigs."
    ),
    "temnothorax-mullerianus": (
        "Piccola formica bruna del gruppo T. nylanderi. Nidifica in cavità preformate come ghiande, gusci di chiocciole e fessure nella roccia.",
        "Small brown ant of the T. nylanderi group. Nests in preformed cavities such as acorns, snail shells and rock crevices.",
        "Boschi, ambienti rocciosi. Nidifica in microcavità naturali.",
        "Woodlands, rocky habitats. Nests in natural micro-cavities."
    ),
    "temnothorax-nylanderi": (
        "Piccola formica bruna molto comune in Europa. Nidifica in ghiande cadute, gusci di chiocciole vuoti e fessure. Specie modello in mirmecologia per lo studio del comportamento collettivo.",
        "Small brown ant very common in Europe. Nests in fallen acorns, empty snail shells and crevices. Model species in myrmecology for the study of collective behaviour.",
        "Boschi di latifoglie, parchi, giardini. Nidifica nella lettiera e in microcavità al suolo.",
        "Deciduous woodlands, parks, gardens. Nests in leaf litter and in ground-level micro-cavities."
    ),
    "temnothorax-parvulus": (
        "Piccola formica bruna, tra le più piccole del genere. Specie arboricola che nidifica nelle cavità dei rami e sotto la corteccia.",
        "Small brown ant, among the smallest of the genus. Arboreal species nesting in branch cavities and under bark.",
        "Boschi, macchia, ambienti con vegetazione arborea. Nidifica nei rami.",
        "Woodlands, scrubland, habitats with arboreal vegetation. Nests in branches."
    ),
    "temnothorax-recedens": (
        "Piccola formica bruna mediterranea. Nidifica in cavità di rocce, muri e sotto la corteccia. Colonie di piccole dimensioni tipiche del genere.",
        "Small Mediterranean brown ant. Nests in rock cavities, walls and under bark. Small-sized colonies typical of the genus.",
        "Ambienti rocciosi, muri, macchia mediterranea. Nidifica nelle fessure.",
        "Rocky habitats, walls, Mediterranean scrubland. Nests in crevices."
    ),
    "temnothorax-rottenbergii": (
        "Formica di piccole dimensioni con colorazione variabile dal giallo al bruno. Specie mediterranea relativamente grande per il genere. Nidifica in cavità di pietre e rocce.",
        "Small ant with variable colouring from yellow to brown. Mediterranean species relatively large for the genus. Nests in cavities of stones and rocks.",
        "Ambienti rocciosi mediterranei, muri a secco, garighe. Nidifica nelle fessure delle pietre.",
        "Mediterranean rocky habitats, dry stone walls, garrigues. Nests in stone crevices."
    ),
    "temnothorax-tuberum": (
        "Piccola formica dal colore bruno-giallastro con capo più scuro. Specie diffusa in Europa, nidifica in cavità preformate in ambienti aperti e rocciosi.",
        "Small yellowish-brown ant with darker head. Widespread European species, nesting in preformed cavities in open and rocky habitats.",
        "Prati, ambienti rocciosi, margini boschivi. Nidifica sotto pietre e in fessure.",
        "Meadows, rocky habitats, woodland margins. Nests under stones and in crevices."
    ),
    "temnothorax-unifasciatus": (
        "Piccola formica con caratteristica banda scura sul gastro (da cui il nome). Specie molto comune che nidifica nei muri, nelle fessure delle rocce e sotto la corteccia.",
        "Small ant with characteristic dark band on the gaster (hence the name). Very common species nesting in walls, rock crevices and under bark.",
        "Muri, rocce, ambienti urbani, boschi. Nidifica nelle fessure di muri e rocce.",
        "Walls, rocks, urban environments, woodlands. Nests in crevices of walls and rocks."
    ),
    "tetramorium-caespitum": (
        "La formica dei marciapiedi, piccola e robusta di colore bruno. Una delle formiche più comuni negli ambienti urbani europei. Colonie monoginiche nel terreno, spesso sotto lastre di pietra.",
        "The pavement ant, small and sturdy, brown coloured. One of the most common ants in European urban environments. Monogynous ground colonies, often under stone slabs.",
        "Marciapiedi, giardini, prati, aree urbane. Nidifica nel terreno, tipicamente sotto pietre e pavimentazioni.",
        "Pavements, gardens, lawns, urban areas. Nests in the ground, typically under stones and paving."
    ),
    "tetramorium-meridionale": (
        "Piccola formica bruna del gruppo T. caespitum, tipica del bacino mediterraneo. Leggermente più piccola di T. caespitum e di colorazione più chiara.",
        "Small brown ant of the T. caespitum group, typical of the Mediterranean basin. Slightly smaller than T. caespitum and lighter in colour.",
        "Ambienti aperti mediterranei, garighe, prati aridi. Nidifica nel terreno.",
        "Open Mediterranean habitats, garrigues, dry meadows. Nests in the ground."
    ),
    "tetramorium-moravicum": (
        "Piccola formica del complesso T. caespitum, di colore bruno con scultura del corpo caratteristica. Specie termofila diffusa in Europa meridionale e centrale.",
        "Small ant of the T. caespitum complex, brown with characteristic body sculpture. Thermophilic species widespread in southern and central Europe.",
        "Prati asciutti, ambienti aperti soleggiati. Nidifica nel terreno.",
        "Dry meadows, sunny open habitats. Nests in the ground."
    ),
    "tetramorium-semilaeve": (
        "Piccola formica bruna del gruppo T. caespitum, con corpo relativamente liscio (meno rugoso delle congeneri, da cui il nome). Comune nell'area mediterranea.",
        "Small brown ant of the T. caespitum group, with relatively smooth body (less rugose than congeners, hence the name). Common in the Mediterranean area.",
        "Ambienti aperti, giardini, muri. Nidifica nel terreno e nelle fessure dei muri.",
        "Open habitats, gardens, walls. Nests in the ground and in wall crevices."
    ),
}


def main():
    with open(SPECIES_FILE) as f:
        species = json.load(f)

    updated = 0
    for sp in species:
        sid = sp["id"]
        if sid in SPECIES_INFO and not sp.get("description_it"):
            desc_it, desc_en, hab_it, hab_en = SPECIES_INFO[sid]
            sp["description_it"] = desc_it
            sp["description_en"] = desc_en
            if not sp.get("habitat_notes_it"):
                sp["habitat_notes_it"] = hab_it
            if not sp.get("habitat_notes_en"):
                sp["habitat_notes_en"] = hab_en
            updated += 1

    with open(SPECIES_FILE, "w") as f:
        json.dump(species, f, indent=2, ensure_ascii=False)

    print(f"Updated {updated} species with descriptions and habitat notes")


if __name__ == "__main__":
    main()
