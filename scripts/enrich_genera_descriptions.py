#!/usr/bin/env python3
"""
enrich_genera_descriptions.py
Adds description_it and description_en to genera in genera.json
that currently have empty or null descriptions.

Run from the project root:
    python3 scripts/enrich_genera_descriptions.py
"""

import json
import os

GENERA_JSON = os.path.join(
    os.path.dirname(__file__),
    "../formiche-ditalia/src/data/genera.json"
)

# Descriptions keyed by genus id.
# Only genera with currently empty/null descriptions are listed here.
DESCRIPTIONS = {

    # ── MYRMICINAE ────────────────────────────────────────────────────────────

    "formicoxenus": {
        "it": (
            "Formicoxenus è un piccolo genere mirmicino di formiche inquiline "
            "obbligate, che vivono stabilmente all'interno dei nidi di formiche "
            "del genere Formica, in particolare del gruppo rufa, senza parassitarne "
            "la colonia ospite. Le operaie sono minuscole (1,5–2 mm), con un piano "
            "corporeo compatto e antenne a undici segmenti; le colonie sono piccole "
            "e prive di caste guerriere. In Italia il genere è rappresentato da "
            "Formicoxenus nitidulus, legato alle foreste montane di conifere "
            "dell'arco alpino."
        ),
        "en": (
            "Formicoxenus is a small myrmicine genus of obligate inquiline ants "
            "that live permanently within the nests of Formica ants, particularly "
            "of the rufa group, without parasitizing the host colony. Workers are "
            "minute (1.5–2 mm), compact in build, and have 11-segmented antennae; "
            "colonies are small and lack soldier castes. In Italy the genus is "
            "represented by Formicoxenus nitidulus, associated with montane "
            "coniferous forests of the Alpine arc."
        ),
    },

    "harpagoxenus": {
        "it": (
            "Harpagoxenus è un genere mirmicino di formiche dulotiche (schiaviste) "
            "della regione olartica, noto per compiere razzie nei nidi di Leptothorax "
            "e Temnothorax per catturarne le pupe da allevare come operaie schiave. "
            "Le operaie sono robuste, con mandibole falcate adattate al combattimento; "
            "le colonie, di dimensioni ridotte, dipendono totalmente dalla manodopera "
            "schiava per le attività di foraggiamento e cura della nidiata. "
            "In Italia il genere è presente con H. sublaevis nelle zone alpine."
        ),
        "en": (
            "Harpagoxenus is a Holarctic myrmicine genus of dulotic (slavemaking) ants "
            "known for raiding nests of Leptothorax and Temnothorax to capture pupae "
            "and rear them as slave workers. Workers are robust with sickle-shaped "
            "mandibles adapted for combat; the small colonies depend entirely on slave "
            "labour for foraging and brood care. In Italy the genus is represented "
            "by H. sublaevis in Alpine habitats."
        ),
    },

    "leptothorax": {
        "it": (
            "Leptothorax è un genere mirmicino di piccole formiche (2–4 mm) "
            "presenti nelle regioni temperate dell'Olartide, con nidi in cavità "
            "naturali quali ghiande svuotate, ramoscelli secchi, carie del legno "
            "e spazi sotto la corteccia degli alberi. Le colonie sono di dimensioni "
            "ridotte (solitamente alcune decine di operaie) e monoginiche. Le operaie "
            "sono onnivore e raccolgono piccoli artropodi e sostanze zuccherine. "
            "In Italia il genere comprende specie legate ad ambienti boschivi montani "
            "dell'arco alpino e dell'Appennino."
        ),
        "en": (
            "Leptothorax is a myrmicine genus of small ants (2–4 mm) found in "
            "temperate regions of the Holarctic, nesting in natural cavities such "
            "as hollowed acorns, dry twigs, wood rot, and spaces under tree bark. "
            "Colonies are small (usually a few dozen workers) and monogyne. Workers "
            "are omnivorous, collecting small arthropods and sugary substances. "
            "In Italy the genus includes species associated with montane woodland "
            "habitats of the Alps and Apennines."
        ),
    },

    "manica": {
        "it": (
            "Manica è un genere mirmicino di medie dimensioni (5–8 mm) diffuso "
            "nelle regioni alpine e subalpine d'Europa e dell'Asia centrale, con "
            "operaie robuste dotate di pungiglione efficace. Nidifica nel suolo "
            "di prati e pascoli montani, spesso ad alta quota, costruendo gallerie "
            "profonde per resistere alle basse temperature invernali. Le colonie "
            "sono relativamente piccole e monoginiche; le operaie sono predatrici "
            "attive e raccolgono anche insetti e altri invertebrati. In Italia "
            "M. rubida è la specie tipica delle Alpi e dell'Appennino settentrionale."
        ),
        "en": (
            "Manica is a myrmicine genus of medium-sized ants (5–8 mm) distributed "
            "in Alpine and subalpine regions of Europe and central Asia, with robust "
            "workers bearing a potent sting. It nests in the soil of montane meadows "
            "and pastures, often at high elevation, excavating deep galleries to "
            "survive winter cold. Colonies are relatively small and monogyne; workers "
            "are active predators and also collect insects and other invertebrates. "
            "In Italy M. rubida is the characteristic species of the Alps and "
            "northern Apennines."
        ),
    },

    "messor": {
        "it": (
            "Messor è un genere mirmicino di formiche granivore di medie e grandi "
            "dimensioni (3–12 mm), caratterizzato da un marcato polimorfismo delle "
            "operaie, con minori, medie e maggiori (o soldati) dotate di capo "
            "ipertrofico per la macinazione dei semi. Le colonie, spesso polidome, "
            "possono contare migliaia di individui e sviluppano granai sotterranei "
            "dove i semi vengono immagazzinati e sgusciati. In Italia il genere è "
            "ben rappresentato nelle aree mediterranee e termo-xerofile, con cinque "
            "specie tra cui la comune M. structor, ed è considerato un importante "
            "agente di dispersione dei semi (mirmecoria)."
        ),
        "en": (
            "Messor is a myrmicine genus of medium to large harvester ants (3–12 mm), "
            "characterized by pronounced worker polymorphism, with minor, media, and "
            "major (soldier) workers bearing a hypertrophied head for seed-milling. "
            "Colonies, often polydomous, may number thousands of individuals and "
            "develop underground granaries where seeds are stored and husked. "
            "In Italy the genus is well represented in Mediterranean and thermo-xeric "
            "environments with five species, including the common M. structor, and "
            "is considered an important seed-dispersal agent (myrmecochory)."
        ),
    },

    "monomorium": {
        "it": (
            "Monomorium è un genere mirmicino cosmopolita di formiche molto piccole "
            "(1–3 mm), monomorfe, con antenne a dodici segmenti e clava trimerosa. "
            "Le colonie sono di dimensioni variabili, frequentemente poliginiche, "
            "e nidificano nel suolo, sotto pietre o in materiale vegetale marcescente. "
            "Alcune specie, come M. pharaonis (formica del faraone), sono diventate "
            "invasive in tutto il mondo sfruttando ambienti antropizzati. In Italia "
            "il genere è rappresentato da due specie, presenti soprattutto nelle "
            "zone mediterranee e negli abitati urbani."
        ),
        "en": (
            "Monomorium is a cosmopolitan myrmicine genus of very small ants (1–3 mm), "
            "monomorphic, with 12-segmented antennae and a three-segmented club. "
            "Colonies are variable in size, frequently polygyne, and nest in soil, "
            "under stones, or in decaying plant material. Some species, such as "
            "M. pharaonis (pharaoh ant), have become globally invasive by exploiting "
            "anthropized environments. In Italy the genus is represented by two "
            "species, found mainly in Mediterranean zones and urban settings."
        ),
    },

    "myrmecina": {
        "it": (
            "Myrmecina è un genere mirmicino di piccole formiche (2–3,5 mm) con "
            "operaie monomorfe dal profilo dorsale molto curvato e propodeo con "
            "una caratteristica cresta lamellare posteriore. Nidificano nel suolo "
            "e sotto pietre in ambienti forestali umidi e ombreggiati, con colonie "
            "di dimensioni ridotte. Le operaie si nutrono di piccoli artropodi e "
            "secreti zuccherini di omotteri. In Italia è presente M. graminicola, "
            "diffusa soprattutto nelle zone boscose dell'Italia peninsulare e alpina."
        ),
        "en": (
            "Myrmecina is a myrmicine genus of small ants (2–3.5 mm) with monomorphic "
            "workers, a strongly arched dorsal profile, and a propodeum bearing a "
            "distinctive posterior laminar crest. They nest in soil and under stones "
            "in moist, shaded forest habitats, forming small colonies. Workers feed "
            "on small arthropods and sugary secretions from Hemiptera. In Italy "
            "M. graminicola is present, distributed mainly in wooded areas of "
            "peninsular and Alpine Italy."
        ),
    },

    "myrmica": {
        "it": (
            "Myrmica è un genere mirmicino di piccole e medie formiche (3–7 mm) "
            "olartico, caratterizzato da un evidente lobo frontale che copre "
            "parzialmente l'inserzione dell'antenna e da un propodeo spesso "
            "spinoso. Le colonie, di dimensioni moderate (alcune centinaia fino "
            "a qualche migliaio di operaie), sono frequentemente poliginiche. "
            "Nidificano nel suolo o sotto pietre in ambienti aperti umidi, prati "
            "e bordi forestali; le operaie sono onnivore e praticano la trotoforassi "
            "con omotteri. In Italia il genere conta tre specie, alcune con "
            "importanza ecologica come ospiti delle larve di farfalle licenidi."
        ),
        "en": (
            "Myrmica is a Holarctic myrmicine genus of small to medium ants (3–7 mm), "
            "characterized by a prominent frontal lobe partially covering the antennal "
            "insertion and often spinose propodeum. Colonies of moderate size (a few "
            "hundred to several thousand workers) are frequently polygyne. They nest "
            "in soil or under stones in moist open habitats, meadows, and forest edges; "
            "workers are omnivorous and tend Hemiptera for honeydew. In Italy the genus "
            "comprises three species, some of which are ecologically significant as "
            "hosts for lycaenid butterfly larvae."
        ),
    },

    "oxyopomyrmex": {
        "it": (
            "Oxyopomyrmex è un piccolo genere mirmicino del bacino del Mediterraneo, "
            "con operaie snelle di 2–4 mm, propodeo armato di spine e antenne a "
            "dodici segmenti. Le specie sono legate ad ambienti sabbiosi e aridi, "
            "dove nidificano nel suolo in colonie di dimensioni ridotte; si "
            "comportano come raccoglitrici opportuniste di semi e piccoli artropodi. "
            "In Italia il genere è presente con O. santschii nelle aree costiere e "
            "interne più xerotermofile della Penisola."
        ),
        "en": (
            "Oxyopomyrmex is a small myrmicine genus of the Mediterranean basin, "
            "with slender workers of 2–4 mm, a spinose propodeum, and 12-segmented "
            "antennae. Species are associated with sandy and arid environments where "
            "they nest in the soil in small colonies; they behave as opportunistic "
            "collectors of seeds and small arthropods. In Italy the genus is "
            "represented by O. santschii in the more xero-thermophilous coastal "
            "and inland areas of the Peninsula."
        ),
    },

    "pheidole": {
        "it": (
            "Pheidole è il genere di formiche più ricco di specie al mondo "
            "(oltre 1.000 specie) ed è caratterizzato da un forte dimorfismo "
            "delle operaie: minori gracili e maggiori ('soldati') con capo "
            "disproportionatamente grande per la difesa della colonia e "
            "la macinazione di semi e insetti duri. Le colonie possono "
            "raggiungere decine di migliaia di individui e nidificano nel "
            "suolo o sotto pietre in una grande varietà di habitat. In Italia "
            "il genere è rappresentato principalmente da P. pallidula, specie "
            "termomediterranea frequente in aree agricole e urbane."
        ),
        "en": (
            "Pheidole is the most species-rich ant genus in the world (over 1,000 "
            "species) and is characterized by strong worker dimorphism: slender "
            "minors and major workers ('soldiers') with a disproportionately large "
            "head for colony defence and the processing of seeds and tough insects. "
            "Colonies can reach tens of thousands of individuals and nest in soil or "
            "under stones in a wide variety of habitats. In Italy the genus is "
            "represented mainly by P. pallidula, a thermo-Mediterranean species "
            "common in agricultural and urban areas."
        ),
    },

    "solenopsis": {
        "it": (
            "Solenopsis è un genere mirmicino cosmopolita di formiche piccole "
            "(1–6 mm), monomorfe o debolmente dimorfe, note per le colonie "
            "numerose e aggressive che difendono con un pungiglione urente "
            "(da cui il nome inglese 'fire ants' per alcune specie). Nidificano "
            "nel suolo con cumuli caratteristici e si nutrono di insetti, piccoli "
            "vertebrati e materiale vegetale. In Italia il genere è rappresentato "
            "principalmente da S. fugax, la 'formica ladra', minuscola formica "
            "kleptobiotica che nidifica a ridosso dei nidi di altre specie e "
            "predane le larve."
        ),
        "en": (
            "Solenopsis is a cosmopolitan myrmicine genus of small ants (1–6 mm), "
            "monomorphic or weakly dimorphic, known for large, aggressive colonies "
            "defended with a burning sting (hence 'fire ants' for some species). "
            "They nest in the soil forming characteristic mounds and feed on insects, "
            "small vertebrates, and plant material. In Italy the genus is represented "
            "mainly by S. fugax, the 'thief ant', a minute kleptobiotic species that "
            "nests adjacent to the nests of other ant species and preys on their "
            "larvae."
        ),
    },

    "stenamma": {
        "it": (
            "Stenamma è un genere mirmicino di piccole formiche (2–4 mm) a "
            "distribuzione olartica, con operaie monomorfe, antenne a dodici "
            "segmenti e clava bimerosa, e clipeo provvisto di una fossetta "
            "mediana caratteristica. Nidificano nel suolo o nel legno marcescente "
            "di foreste mature, con colonie di dimensioni molto ridotte "
            "(alcune decine di operaie) e andamento criptico. Le operaie sono "
            "predatrici generaliste e raccoglitrici di collemboli e altri "
            "microartropodi. In Italia il genere conta due specie legate ad "
            "ambienti boschivi dell'arco alpino e appenninico."
        ),
        "en": (
            "Stenamma is a Holarctic myrmicine genus of small ants (2–4 mm) with "
            "monomorphic workers, 12-segmented antennae with a two-segmented club, "
            "and a clypeus bearing a characteristic median pit. They nest in soil or "
            "rotting wood in mature forests, with very small colonies (a few dozen "
            "workers) and cryptic habits. Workers are generalist predators collecting "
            "Collembola and other microarthropods. In Italy the genus comprises two "
            "species associated with woodland habitats of the Alps and Apennines."
        ),
    },

    "strongylognathus": {
        "it": (
            "Strongylognathus è un genere mirmicino di formiche dulotiche "
            "paleartico-mediterranee, strettamente associate al genere Tetramorium "
            "di cui parassitano i nidi come inquiline obbligate o razziatori. "
            "Le operaie presentano mandibole sottili e curvate, adatte al combattimento "
            "piuttosto che al lavoro, e dipendono dalle operaie ospiti per tutte le "
            "attività di sostentamento. Le colonie miste sono di dimensioni contenute. "
            "In Italia il genere è presente con due specie in ambienti aperti e "
            "mediterranei, dove coesiste con le popolazioni di Tetramorium ospiti."
        ),
        "en": (
            "Strongylognathus is a Palaearctic-Mediterranean myrmicine genus of dulotic "
            "ants, closely associated with Tetramorium, whose nests they parasitize as "
            "obligate inquilines or raiders. Workers have slender, curved mandibles "
            "adapted for fighting rather than work, and depend on host workers for all "
            "maintenance activities. Mixed colonies are small. In Italy the genus is "
            "present with two species in open and Mediterranean habitats, where it "
            "co-occurs with host Tetramorium populations."
        ),
    },

    "strumigenys": {
        "it": (
            "Strumigenys è un genere mirmicino cosmopolita di formiche molto piccole "
            "(1–3 mm) con mandibole lineari allungate a trappola, capaci di chiudersi "
            "a scatto sulla preda (principalmente Collemboli e altri microartropodi) "
            "con grande velocità. Le operaie monomorfe sono strettamente criptiche, "
            "con nidi nel suolo, nel legno marcescente o nella lettiera; le colonie "
            "sono piccole. In Italia il genere conta quattro specie, presenti in "
            "ambienti boschivi umidi e nelle aree costiere, alcune delle quali "
            "di origine tropicale e introdotte come 'tramp species'."
        ),
        "en": (
            "Strumigenys is a cosmopolitan myrmicine genus of very small ants (1–3 mm) "
            "with elongate, linear trap-jaw mandibles capable of snapping shut on prey "
            "(mainly Collembola and other microarthropods) at high speed. Monomorphic "
            "workers are strictly cryptic, nesting in soil, rotting wood, or leaf "
            "litter; colonies are small. In Italy the genus comprises four species "
            "found in moist woodland habitats and coastal areas, some of tropical "
            "origin introduced as tramp species."
        ),
    },

    "temnothorax": {
        "it": (
            "Temnothorax è il genere mirmicino più ricco di specie in Italia (9 specie), "
            "con operaie piccole (2–4 mm), monomorfe o debolmente dimorfe, e peziolo "
            "nodiforme seguito da un postpeziolo ben sviluppato. Nidificano in cavità "
            "preesistenti come ghiande vuote, fessure nella corteccia, sotto pietre "
            "o in piccoli rametti; le colonie sono di dimensioni ridotte e frequentemente "
            "polidomiche. Le operaie sono onnivore e alcune specie sono ospiti di "
            "formiche dulotiche. Il genere è ben rappresentato sia negli ambienti "
            "mediterranei sia in quelli montani dell'arco alpino e appenninico."
        ),
        "en": (
            "Temnothorax is the most species-rich myrmicine genus in Italy (9 species), "
            "with small workers (2–4 mm), monomorphic or weakly dimorphic, and a "
            "nodiform petiole followed by a well-developed postpetiole. They nest in "
            "pre-existing cavities such as empty acorns, bark crevices, under stones, "
            "or in small twigs; colonies are small and frequently polydomous. Workers "
            "are omnivorous and some species serve as hosts for dulotic ants. The genus "
            "is well represented in both Mediterranean and montane habitats of the "
            "Alpine arc and Apennines."
        ),
    },

    "tetramorium": {
        "it": (
            "Tetramorium è un genere mirmicino cosmopolita di formiche di medie "
            "dimensioni (2–5 mm), con operaie monomorfe, propodeo spesso armato "
            "di spine e capo con solchi frontali paralleli profondi. Le colonie "
            "sono numerose (da alcune centinaia a oltre diecimila operaie), "
            "monoginiche o poliginiche, e nidificano nel suolo, tra i sassi o "
            "in anfrattuosità di roccia. Le operaie sono onnivore e territorialmente "
            "aggressive. In Italia è presente con quattro specie, distribuite "
            "prevalentemente nelle zone mediterranee e collinari-montane."
        ),
        "en": (
            "Tetramorium is a cosmopolitan myrmicine genus of medium-sized ants "
            "(2–5 mm), with monomorphic workers, a propodeum often armed with spines, "
            "and a head bearing deep parallel frontal grooves. Colonies are large "
            "(from a few hundred to over ten thousand workers), monogyne or polygyne, "
            "and nest in soil, among stones, or in rock crevices. Workers are "
            "omnivorous and territorially aggressive. In Italy the genus is "
            "represented by four species distributed mainly in Mediterranean and "
            "hilly-montane zones."
        ),
    },

    # ── PONERINAE ─────────────────────────────────────────────────────────────

    "cryptopone": {
        "it": (
            "Cryptopone è un genere ponerine di piccole e medie formiche (3–5 mm) "
            "a distribuzione subtropicale e mediterranea, con operaie monomorfe e "
            "aculeo funzionale. Sono strettamente ipogee e predatrici specializzate "
            "in larve e pupe di altri insetti del suolo, in particolare di altri "
            "imenotteri. Le colonie sono piccole (alcune decine di operaie). "
            "In Italia è presente C. ochracea, specie localizzata nelle aree "
            "più calde e termomediterranee della Penisola."
        ),
        "en": (
            "Cryptopone is a ponerinae genus of small to medium ants (3–5 mm) with "
            "a subtropical and Mediterranean distribution, monomorphic workers, and a "
            "functional sting. They are strictly hypogaeic and specialized predators "
            "of larvae and pupae of other soil insects, in particular other "
            "Hymenoptera. Colonies are small (a few dozen workers). In Italy "
            "C. ochracea is present, a species localized in the warmest thermo-"
            "Mediterranean areas of the Peninsula."
        ),
    },

    "hypoponera": {
        "it": (
            "Hypoponera è un genere ponerine cosmopolita di formiche ipogee molto "
            "piccole (1,5–3,5 mm), con operaie monomorfe, occhi ridotti o assenti "
            "e aculeo funzionale. Nidificano nel suolo umido, nel legno marcescente "
            "o nella lettiera e si nutrono di piccoli artropodi del suolo, in "
            "particolare Collemboli e larve di ditteri. Le colonie sono di modeste "
            "dimensioni. In Italia il genere conta tre specie presenti in ambienti "
            "boschivi e prativi sia costieri sia montani, alcune delle quali legate "
            "ad ambienti antropizzati."
        ),
        "en": (
            "Hypoponera is a cosmopolitan ponerinae genus of very small hypogaeic ants "
            "(1.5–3.5 mm), with monomorphic workers, reduced or absent eyes, and a "
            "functional sting. They nest in moist soil, rotting wood, or leaf litter "
            "and feed on small soil arthropods, particularly Collembola and dipteran "
            "larvae. Colonies are small to moderate in size. In Italy the genus "
            "comprises three species found in woodland and grassland habitats, both "
            "coastal and montane, with some associated with anthropized environments."
        ),
    },

    "ponera": {
        "it": (
            "Ponera è un genere ponerine olartico di formiche di piccole dimensioni "
            "(2–4 mm), con operaie monomorfe, occhi piccoli, corpo di colore bruno "
            "scuro e aculeo funzionale. Conducono vita ipogea o crittobiotica "
            "in suoli forestali umidi, nel legno marcescente e nella lettiera, "
            "con colonie di dimensioni ridotte (alcune decine di operaie al massimo). "
            "Sono predatrici generaliste di piccoli artropodi. In Italia è presente "
            "P. coarctata, distribuita nei boschi umidi dell'Italia peninsulare "
            "e dell'arco alpino."
        ),
        "en": (
            "Ponera is a Holarctic ponerinae genus of small ants (2–4 mm) with "
            "monomorphic workers, small eyes, dark brown body, and a functional sting. "
            "They lead a hypogaeic or cryptobiotic life in moist forest soils, rotting "
            "wood, and leaf litter, with small colonies (at most a few dozen workers). "
            "They are generalist predators of small arthropods. In Italy P. coarctata "
            "is present, distributed in moist woodlands of peninsular Italy and the "
            "Alpine arc."
        ),
    },

    # ── DOLICHODERINAE ────────────────────────────────────────────────────────

    "bothriomyrmex": {
        "it": (
            "Bothriomyrmex è un genere dolicoderineo del Vecchio Mondo di piccole "
            "formiche (2–3 mm) con operaie monomorfe, peziolo appiattito e privo "
            "di pungiglione. Alcune specie sono parassite sociali temporanee che "
            "penetrano nelle colonie di Tapinoma o Dolichoderus e uccidono la regina "
            "ospite. I nidi sono nel suolo o sotto pietre in ambienti mediterranei "
            "aperti e xerofili. In Italia è presente con B. meridionalis, diffusa "
            "nelle zone calde e aride del centro-sud."
        ),
        "en": (
            "Bothriomyrmex is an Old World dolichoderinae genus of small ants (2–3 mm) "
            "with monomorphic workers, a flattened petiole, and no sting. Some species "
            "are temporary social parasites that penetrate colonies of Tapinoma or "
            "Dolichoderus and kill the host queen. Nests are in soil or under stones "
            "in open, xerophilous Mediterranean environments. In Italy it is "
            "represented by B. meridionalis, widespread in the warm, arid zones "
            "of central and southern Italy."
        ),
    },

    "dolichoderus": {
        "it": (
            "Dolichoderus è un genere dolicoderineo ad ampia distribuzione mondiale, "
            "con operaie di medie dimensioni (3–5 mm) caratterizzate da un nodo "
            "peziolare basso e schiacciato e dall'assenza di pungiglione; producono "
            "secrezioni ghiandolari difensive dalla ghiandola pigidiale. Nidificano "
            "prevalentemente sugli alberi (sotto la corteccia, in cavità) o nel suolo "
            "di ambienti boschivi; alcune specie praticano attivamente la trotoforassi "
            "con omotteri. In Italia è presente D. quadripunctatus, specie arboricola "
            "legata ai boschi di latifoglie dell'Italia centro-settentrionale."
        ),
        "en": (
            "Dolichoderus is a dolichoderinae genus with a broad global distribution, "
            "medium-sized workers (3–5 mm) characterized by a low, flattened petiolar "
            "node and the absence of a sting; they produce defensive glandular "
            "secretions from the pygidial gland. They nest mainly in trees (under "
            "bark, in cavities) or in the soil of wooded habitats; some species "
            "actively tend Hemiptera for honeydew. In Italy D. quadripunctatus is "
            "present, an arboreal species linked to broadleaf woodlands of "
            "central-northern Italy."
        ),
    },

    "linepithema": {
        "it": (
            "Linepithema è un genere dolicoderineo neotropicale di piccole formiche "
            "(2–3 mm), monomorfe, prive di pungiglione, con peziolo molto ridotto. "
            "È noto principalmente per L. humile, la formica argentina, una delle "
            "specie invasive più problematiche al mondo, capace di formare super-colonie "
            "poliginiche e polidome che soppiantano la mirmecofauna autoctona. "
            "In Italia L. humile è ampiamente diffusa nelle regioni costiere "
            "mediterranee, dove costituisce una seria minaccia alla biodiversità "
            "e alla fauna di invertebrati nativi."
        ),
        "en": (
            "Linepithema is a Neotropical dolichoderinae genus of small ants (2–3 mm), "
            "monomorphic, stingless, with a greatly reduced petiole. It is best known "
            "for L. humile, the Argentine ant, one of the world's most problematic "
            "invasive species, capable of forming polygyne, polydomous supercolonies "
            "that displace native myrmecofaunas. In Italy L. humile is widespread "
            "along Mediterranean coastal regions, where it poses a serious threat to "
            "biodiversity and native invertebrate fauna."
        ),
    },

    "liometopum": {
        "it": (
            "Liometopum è un genere dolicoderineo del Vecchio e Nuovo Mondo di "
            "formiche di medie dimensioni (3–5 mm), con operaie monomorfe, corpo "
            "snello, peziolo schiacciato e assenza di pungiglione. Sono formiche "
            "arboricole che nidificano sotto la corteccia degli alberi e sviluppano "
            "intense reti di foraggiamento lungo i tronchi, praticando trotoforassi "
            "con omotteri e predando piccoli artropodi. In Italia è presente "
            "L. microcephalum, specie legata a boschi maturi e ripariali dell'Italia "
            "centro-meridionale."
        ),
        "en": (
            "Liometopum is an Old and New World dolichoderinae genus of medium-sized "
            "ants (3–5 mm) with monomorphic workers, a slender body, flattened petiole, "
            "and no sting. They are arboreal, nesting under tree bark and developing "
            "dense foraging networks along trunks, tending Hemiptera for honeydew and "
            "preying on small arthropods. In Italy L. microcephalum is present, a "
            "species associated with mature and riparian woodlands of central and "
            "southern Italy."
        ),
    },

    "tapinoma": {
        "it": (
            "Tapinoma è un genere dolicoderineo cosmopolita di piccole formiche "
            "(1,5–3,5 mm), con operaie monomorfe, peziolo estremamente ridotto "
            "e nascosto sotto il gastro, e ghiandole pigidiali che producono "
            "secrezioni dall'odore caratteristico (acido iridodiale). Nidificano "
            "nel suolo, sotto pietre o nella lettiera in ambienti aperti, caldi e "
            "aridi; le colonie sono frequentemente poliginiche e numerose. "
            "In Italia il genere conta tre specie, tra cui il comune T. nigerrimum "
            "e il sinonimizzato T. magnum, diffuse nelle zone mediterranee e nei "
            "contesti urbani."
        ),
        "en": (
            "Tapinoma is a cosmopolitan dolichoderinae genus of small ants (1.5–3.5 mm), "
            "with monomorphic workers, a petiole extremely reduced and concealed beneath "
            "the gaster, and pygidial glands producing characteristic-smelling secretions "
            "(iridodial compounds). They nest in soil, under stones, or in leaf litter "
            "in open, warm, and arid habitats; colonies are frequently polygyne and "
            "large. In Italy the genus comprises three species, including the common "
            "T. nigerrimum, widespread in Mediterranean zones and urban contexts."
        ),
    },

    # ── FORMICINAE ────────────────────────────────────────────────────────────

    "camponotus": {
        "it": (
            "Camponotus è il genere di formicine più ricco in Italia (6 specie) e "
            "comprende alcune delle formiche più grandi della fauna italiana "
            "(5–15 mm). Le operaie sono fortemente dimorfe con minori, medie e "
            "maggiori (soldati con capo voluminoso); sono prive di pungiglione "
            "ma spruzzano acido formico dall'acidoporo. Nidificano nel legno vivo "
            "o morto, in talpe erbose o nel suolo secondo la specie; le colonie "
            "mature possono contare migliaia di individui. Sono onnivore, con "
            "forte propensione alla trotoforassi e alla raccolta di nettare florale "
            "ed extraflorale."
        ),
        "en": (
            "Camponotus is the most species-rich formicine genus in Italy (6 species) "
            "and includes some of the largest ants in the Italian fauna (5–15 mm). "
            "Workers are strongly dimorphic with minor, media, and major (soldier) "
            "castes; they lack a sting but spray formic acid from the acidopore. "
            "Nesting occurs in living or dead wood, grass tufts, or soil depending "
            "on the species; mature colonies can number thousands of individuals. "
            "They are omnivorous, with a strong tendency for honeydew-tending and "
            "collection of floral and extrafloral nectar."
        ),
    },

    "cataglyphis": {
        "it": (
            "Cataglyphis è un genere formicino xerofile del Paleartico e della "
            "regione afro-tropicale, noto per le sue operaie ad alta velocità di "
            "locomozione e la straordinaria capacità di orientamento mediante "
            "integrazione di percorso (dead reckoning) e polarizzazione della luce. "
            "Le formiche sono termofili e necroforaggiatori attivi nelle ore più "
            "calde della giornata, raccogliendo carcasse di artropodi e nettare. "
            "Nidificano nel suolo sabbioso di ambienti aridi e aperti. In Italia "
            "il genere è presente con due specie nelle zone più xerotermofile "
            "della Penisola e delle isole."
        ),
        "en": (
            "Cataglyphis is a Palaearctic and Afrotropical formicine genus renowned "
            "for its high-speed workers and extraordinary navigational ability using "
            "path integration (dead reckoning) and polarized-light detection. The ants "
            "are thermophilous and active necrophagous foragers during the hottest "
            "part of the day, collecting arthropod carcasses and nectar. They nest "
            "in sandy soil of arid, open environments. In Italy the genus is "
            "represented by two species in the most xero-thermophilous zones of the "
            "Peninsula and islands."
        ),
    },

    "colobopsis": {
        "it": (
            "Colobopsis (in passato incluso in Camponotus) è un genere formicino "
            "di formiche arboricole con casta di soldati specializzata nel bloccare "
            "l'ingresso del nido con il capo appiattito e troncato (phragmosis). "
            "Le operaie sono di medie dimensioni (4–8 mm), prive di pungiglione "
            "e dotate di acidoporo. Nidificano in cavità lignee di alberi e arbusti. "
            "In Italia è presente C. truncata, specie legata a boschi di latifoglie "
            "dell'Italia meridionale e delle isole, dove nidifica prevalentemente "
            "nella quercia da sughero e nelle querce sempreverdi."
        ),
        "en": (
            "Colobopsis (formerly included in Camponotus) is a formicine genus of "
            "arboreal ants with a specialized soldier caste that blocks the nest "
            "entrance with its flat, truncated head (phragmosis). Workers are "
            "medium-sized (4–8 mm), stingless, and equipped with an acidopore. "
            "They nest in wooden cavities of trees and shrubs. In Italy C. truncata "
            "is present, a species linked to broadleaf woodlands of southern Italy "
            "and the islands, where it nests mainly in cork oak and evergreen oaks."
        ),
    },

    "formica": {
        "it": (
            "Formica è il genere nominale delle Formicinae, con quattro specie in "
            "Italia, alcune delle quali tra le più grandi e ben note formiche della "
            "fauna italiana (5–10 mm). Include specie costruttici di grandi nidi a "
            "cupola con aghi di pino (gruppo rufa), specie schiaviste (gruppo sanguinea) "
            "e specie che parassitano temporaneamente altri Formica per fondare nuove "
            "colonie. Prive di pungiglione, le operaie difendono il nido spruzzando "
            "acido formico. Le colonie possono contare centinaia di migliaia di "
            "individui e svolgono un ruolo ecologico rilevante come predatrici "
            "di insetti e trofoforici con omotteri."
        ),
        "en": (
            "Formica is the nominal genus of Formicinae, with four species in Italy, "
            "some of which are among the largest and best-known ants in the Italian "
            "fauna (5–10 mm). It includes species that build large pine-needle dome "
            "nests (rufa group), slavemaking species (sanguinea group), and species "
            "that temporarily parasitize other Formica colonies to found new ones. "
            "Stingless, workers defend the nest by spraying formic acid. Colonies can "
            "number hundreds of thousands of individuals and play a significant "
            "ecological role as insect predators and Hemiptera-tenders."
        ),
    },

    "lasius": {
        "it": (
            "Lasius è il genere formicino più ricco di specie in Italia (10 specie) "
            "e include alcune delle formiche più comuni e abbondanti degli ecosistemi "
            "italiani, quali L. niger e L. emarginatus. Le operaie sono di piccole e "
            "medie dimensioni (2–5 mm), monomorfe, prive di pungiglione e dotate di "
            "acidoporo. Nidificano nel suolo, tra le radici degli alberi o sotto "
            "pietre in una varietà di habitat, dalle coste alle zone alpine. Le "
            "colonie, monoginiche o poliginiche, sono spesso molto numerose; alcune "
            "specie parassitano temporaneamente altri Lasius per fondare la colonia "
            "(gruppo umbratus). La trotoforassi con omotteri radicali è particolarmente "
            "sviluppata nel sottogenere Chtonolasius."
        ),
        "en": (
            "Lasius is the most species-rich formicine genus in Italy (10 species) "
            "and includes some of the most common and abundant ants in Italian "
            "ecosystems, such as L. niger and L. emarginatus. Workers are small to "
            "medium (2–5 mm), monomorphic, stingless, and equipped with an acidopore. "
            "They nest in soil, among tree roots, or under stones in a variety of "
            "habitats from the coast to alpine zones. Colonies, monogyne or polygyne, "
            "are often very large; some species temporarily parasitize other Lasius "
            "to found colonies (umbratus group). Tending of root-feeding Hemiptera "
            "is particularly developed in the subgenus Chtonolasius."
        ),
    },

    "lepisiota": {
        "it": (
            "Lepisiota è un genere formicino afro-tropicale e paleartico di piccole "
            "formiche (2–3 mm), monomorfe, con una caratteristica spina metapleurale "
            "bene sviluppata e peziolo a nodo. Alcune specie sono diventate invasive "
            "in seguito a introduzioni accidentali; tra queste, L. canescens è "
            "segnalata in Italia come potenziale tramp species nelle zone portuali "
            "e più calde del territorio. Nidificano nel suolo o sotto pietre in "
            "ambienti aperti e aridi. Le colonie sono poliginiche e possono "
            "raggiungere grandi dimensioni."
        ),
        "en": (
            "Lepisiota is an Afrotropical and Palaearctic formicine genus of small "
            "ants (2–3 mm), monomorphic, with a well-developed metapleural spine and "
            "a nodiform petiole. Some species have become invasive following accidental "
            "introductions; among these, L. canescens is recorded in Italy as a "
            "potential tramp species in port areas and the warmer parts of the "
            "country. They nest in soil or under stones in open and arid habitats. "
            "Colonies are polygyne and can reach large sizes."
        ),
    },

    "plagiolepis": {
        "it": (
            "Plagiolepis è un genere formicino paleartico e afro-tropicale di "
            "formiche minuscole (1–2 mm), con operaie monomorfe, antenne a "
            "undici segmenti e peziolo a squama verticale. Nidificano nel suolo, "
            "sotto pietre o in legno marcescente in ambienti mediterranei e aperti; "
            "le colonie sono poliginiche e numerose. In Italia il genere conta "
            "due specie, tra cui P. pygmaea, comune nelle zone termomediterranee "
            "e urbane dove pratica intensamente la trotoforassi con omotteri. "
            "Alcune specie sono parassite sociali di altri Plagiolepis."
        ),
        "en": (
            "Plagiolepis is a Palaearctic and Afrotropical formicine genus of minute "
            "ants (1–2 mm), with monomorphic workers, 11-segmented antennae, and a "
            "vertically flattened petiolar scale. They nest in soil, under stones, "
            "or in rotting wood in Mediterranean and open habitats; colonies are "
            "polygyne and numerous. In Italy the genus comprises two species, "
            "including P. pygmaea, common in thermo-Mediterranean and urban zones "
            "where it extensively tends Hemiptera for honeydew. Some species are "
            "social parasites of other Plagiolepis."
        ),
    },

    "polyergus": {
        "it": (
            "Polyergus è un genere formicino di formiche dulotiche ('formiche "
            "amazzoniche') note per le razzie di massa contro nidi di Formica, "
            "di cui catturano le pupe per allevarle come operaie schiave. Le "
            "operaie di Polyergus hanno mandibole falcate specializzate per il "
            "combattimento e la perforazione della cuticola degli avversari, "
            "rendendole incapaci di qualsiasi altro compito. Le colonie dipendono "
            "totalmente dalle schiave di Formica per il foraggiamento e la cura "
            "della nidiata. In Italia è presente P. rufescens, specie diffusa "
            "in ambienti aperti e boschivi dell'Italia centro-settentrionale."
        ),
        "en": (
            "Polyergus is a formicine genus of dulotic ('Amazon') ants renowned for "
            "mass raiding of Formica nests to capture pupae and rear them as slave "
            "workers. Polyergus workers bear sickle-shaped mandibles specialized for "
            "combat and piercing the cuticle of opponents, rendering them incapable "
            "of any other task. Colonies depend entirely on Formica slaves for "
            "foraging and brood care. In Italy P. rufescens is present, a species "
            "distributed in open and wooded habitats of central and northern Italy."
        ),
    },

    "prenolepis": {
        "it": (
            "Prenolepis è un genere formicino olartico di piccole formiche (2–4 mm) "
            "con operaie monomorfe dal corpo snello, antenne lunghe e una notevole "
            "capacità di foraggiare a basse temperature (specie criofile). Nidificano "
            "nel suolo di boschi misti e di latifoglie; le colonie sono di dimensioni "
            "moderate e monoginiche. Le operaie si nutrono prevalentemente di nettare "
            "e melata e accumulano riserve lipidiche nel proprio addome. In Italia "
            "è presente P. nitens, specie discreta e localmente distribuita nei boschi "
            "freschi e umidi dell'arco alpino e appenninico."
        ),
        "en": (
            "Prenolepis is a Holarctic formicine genus of small ants (2–4 mm) with "
            "monomorphic workers, a slender body, long antennae, and a remarkable "
            "ability to forage at low temperatures (cryophilic species). They nest "
            "in soil of mixed and deciduous woodlands; colonies are moderate in size "
            "and monogyne. Workers feed mainly on nectar and honeydew and accumulate "
            "lipid reserves in the gaster. In Italy P. nitens is present, a discreet "
            "and locally distributed species in cool, moist woodlands of the "
            "Alpine arc and Apennines."
        ),
    },

    # ── AMBLYOPONINAE ─────────────────────────────────────────────────────────

    "stigmatomma": {
        "it": (
            "Stigmatomma è un genere ambliponinino di formiche primitive a distribuzione "
            "pantropicale e paleartica, con operaie monomorfe, occhi ridotti o assenti, "
            "mandibole lineari con denti intercalari e aculeo funzionale. Conducono "
            "vita strettamente ipogea, cacciando geofili e altri chilopodi come prede "
            "principali; le larve succhiano l'emolinfa delle prede tramite una zona "
            "permeabile dell'integumento (haemolymph feeding). Le colonie sono "
            "molto piccole. In Italia il genere è rappresentato da due specie "
            "presenti nei suoli forestali umidi della Penisola e delle isole."
        ),
        "en": (
            "Stigmatomma is an Amblyoponinae genus of primitive ants with a pantropical "
            "and Palaearctic distribution, monomorphic workers, reduced or absent eyes, "
            "linear mandibles with intercalary teeth, and a functional sting. They "
            "lead a strictly hypogaeic life, hunting geophilid and other centipedes as "
            "their main prey; larvae feed on prey haemolymph through a permeable zone "
            "of the integument (haemolymph feeding). Colonies are very small. In Italy "
            "the genus is represented by two species found in moist forest soils of "
            "the Peninsula and islands."
        ),
    },

    # ── PROCERATIINAE ─────────────────────────────────────────────────────────

    "proceratium": {
        "it": (
            "Proceratium è un genere proceratino raro a distribuzione pressoché "
            "cosmopolita, con formiche ipogee di piccole dimensioni (2–4 mm), "
            "operaie monomorfe, occhi molto ridotti, peziolo nodiforme e gastro "
            "curvato ventralmente. Sono specializzate nella predazione di uova "
            "di ragno, che trasportano al nido come risorsa trofica principale. "
            "Le colonie sono molto piccole (alcune decine di operaie al massimo). "
            "In Italia il genere conta due specie presenti nei suoli forestali "
            "umidi, considerate rare e di difficile osservazione per le loro "
            "abitudini strettamente criptiche."
        ),
        "en": (
            "Proceratium is a rare Proceratiinae genus with a nearly cosmopolitan "
            "distribution, comprising small hypogaeic ants (2–4 mm) with monomorphic "
            "workers, greatly reduced eyes, a nodiform petiole, and a ventrally "
            "curved gaster. They are specialized predators of spider eggs, which "
            "they transport to the nest as their primary trophic resource. Colonies "
            "are very small (at most a few dozen workers). In Italy the genus "
            "comprises two species found in moist forest soils, considered rare and "
            "difficult to observe owing to their strictly cryptic habits."
        ),
    },

    # ── LEPTANILLINAE ─────────────────────────────────────────────────────────

    "leptanilla": {
        "it": (
            "Leptanilla è il genere eponimo delle Leptanillinae, sottofamiglia "
            "basale e rarissima di formiche minuscole (1–2 mm), ipogee, con operaie "
            "quasi cieche, mandibole triangolari e aculeo funzionale. Conducono "
            "vita completamente sotterranea, predando geofili e altri chilopodi "
            "del suolo; le larve si nutrono direttamente di emolinfa della preda "
            "tramite organi specifici. Le colonie sono molto piccole e nomadiche. "
            "In Italia il genere conta tre specie, tra le più rare e sfuggenti "
            "della mirmecofauna italiana, note da pochi ritrovamenti isolati."
        ),
        "en": (
            "Leptanilla is the eponymous genus of Leptanillinae, a basal and "
            "exceedingly rare subfamily of minute ants (1–2 mm) that are hypogaeic, "
            "nearly blind, with triangular mandibles and a functional sting. They "
            "lead a fully subterranean life, preying on geophilid centipedes and "
            "other soil arthropods; larvae feed directly on prey haemolymph via "
            "specialized larval organs. Colonies are very small and nomadic. "
            "In Italy the genus comprises three species, among the rarest and most "
            "elusive in the Italian myrmecofauna, known from only a handful of "
            "isolated records."
        ),
    },
}


def main():
    with open(GENERA_JSON, "r", encoding="utf-8") as f:
        genera = json.load(f)

    updated = 0
    for genus in genera:
        gid = genus.get("id")
        if gid not in DESCRIPTIONS:
            continue

        desc_it = genus.get("description_it")
        desc_en = genus.get("description_en")

        # Only fill in if currently null/empty
        if not desc_it or not desc_en:
            genus["description_it"] = DESCRIPTIONS[gid]["it"]
            genus["description_en"] = DESCRIPTIONS[gid]["en"]
            updated += 1
            print(f"  updated: {gid}")

    with open(GENERA_JSON, "w", encoding="utf-8") as f:
        json.dump(genera, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\nDone. {updated} genera updated.")


if __name__ == "__main__":
    main()
