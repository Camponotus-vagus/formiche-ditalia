#!/usr/bin/env python3
"""
Translate missing bilingual content in Formiche d'Italia data files.

For records where one language field has content but the other is empty,
this script fills in the missing translation. Translations are written
directly since we cannot call an external API.

Usage:
    python scripts/translate_missing_content.py
"""

import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'data')


def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(filename, data):
    path = os.path.join(DATA_DIR, filename)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Saved {path}")


# ─── GENERA TRANSLATIONS (EN → IT) ──────────────────────────────────────────

GENERA_TRANSLATIONS = {
    "Aphaenogaster": (
        "Aphaenogaster è un genere di formiche allungate e snelle, molto veloci e agili "
        "in natura. La maggior parte delle specie nidifica nel suolo sotto pietre o tronchi; "
        "alcune specie deserticole nidificano nel terreno con l'ingresso del nido circondato "
        "da piccoli sassi. Queste formiche sono onnivore: raccolgono insetti morti, curano "
        "omotteri per la melata o raccolgono nettare. Le colonie variano da moderatamente "
        "grandi a molto grandi. (Modificato da Mackay e Mackay, 2002)."
    ),
    "Cardiocondyla": (
        "Le Cardiocondyla sono formiche mirmicine di dimensioni molto ridotte, che vivono "
        "in colonie composte da alcune decine a poche centinaia di operaie. Il numero di "
        "regine varia a seconda della specie. I nidi si trovano comunemente nel suolo, meno "
        "frequentemente sotto pietre, e solo in poche specie sono noti nidi nella vegetazione. "
        "Molte Cardiocondyla prediligono habitat aperti e aridi. Diverse specie sono ben note "
        "come specie vagabonde (tramp species) (Seifert, 2003)."
    ),
    "Crematogaster": (
        "Blaimer (2010) — Le formiche del genere Crematogaster sono diffuse in tutto il mondo, "
        "ma raggiungono la massima diversità e abbondanza nelle regioni tropicali e subtropicali. "
        "Si trovano generalmente in foreste, boschi e ambienti arbustivi, dove costituiscono un "
        "elemento cospicuo e spesso dominante della fauna. La maggior parte delle specie tropicali "
        "nidifica sugli alberi, ma alcune specie tropicali e molte delle zone temperate nidificano "
        "nel suolo (es. Hosoishi et al., 2010). Le operaie di questo genere si riconoscono facilmente "
        "per alcune caratteristiche morfologiche uniche, tra cui l'inserzione dorsale del postpeziolo "
        "al quarto segmento addominale e l'assenza di un nodo peziolare dorsale, che conferiscono "
        "alle formiche la capacità di flettere il gastro in avanti sopra il mesosoma mentre il peziolo "
        "è premuto contro il propodeo (Buren, 1959). Si tratta di una risposta aggressiva a ogni "
        "intruso, che consente alle formiche di utilizzare il loro notevole pungiglione spatulato "
        "per l'applicazione topica del veleno, apparentemente efficace nel respingere, se non "
        "uccidere, le formiche avversarie (Marlier et al., 2004)."
    ),
}


# ─── SPECIES TRANSLATIONS (EN → IT) ─────────────────────────────────────────

SPECIES_TRANSLATIONS = {
    "Aphaenogaster spinosa": (
        "La densità dei nidi può essere elevata. I nidi sono monogini e molto popolosi. "
        "Non esiste un volo nuziale, ma l'accoppiamento avviene in prossimità del nido. "
        "Una volta fecondata, la nuova regina ritorna al nido. Lo lascia dopo qualche tempo "
        "con un gruppo di operaie e covata, per fondare una nuova colonia (moltiplicazione "
        "per scissione). La dieta è onnivora. Queste specie nutrono le larve anche con "
        "petali di fiori. Le operaie hanno solo un piccolo ingluvie, il che limita "
        "l'immagazzinamento di alimenti liquidi. Le larve si nutrono direttamente del cibo "
        "portato al nido, senza trofallassi."
    ),
    "Aphaenogaster subterranea": (
        "È una specie comune. La densità dei nidi è generalmente elevata. Le colonie sono "
        "monogine e molto popolose. La fondazione è indipendente. Aphaenogaster subterranea "
        "è una specie insettivora che può nutrire le larve anche con petali di fiori. "
        "Le operaie si muovono piuttosto lentamente."
    ),
}


# ─── SUBFAMILIES TRANSLATIONS (EN → IT) ─────────────────────────────────────

SUBFAMILY_TRANSLATIONS = {
    "Myrmicinae": (
        "La sottofamiglia più grande e diversificata delle Formicidae. Peziolo e postpeziolo "
        "presenti, pungiglione generalmente sviluppato e funzionale (ma assente in vari generi). "
        "Alcune specie italiane, in particolare del genere Myrmica, possono pungere l'uomo "
        "in modo più o meno doloroso. Alcuni generi e specie sono parassiti sociali o "
        "\"schiavisti\". Operaie di dimensioni variabili da meno di 2 mm a circa 1,2 cm "
        "(in Italia). Le varie specie italiane sono prevalentemente predatrici (talvolta "
        "molto specializzate) o onnivore. Tutte le specie di Messor sono granivore. "
        "La dimensione delle colonie può variare da poche decine a molte decine di migliaia "
        "di individui."
    ),
    "Ponerinae": (
        "Le Ponerinae italiane sono piccole formiche predatrici che vivono nella lettiera "
        "e nel suolo, talvolta nel legno marcescente, senza costruire formicai ben strutturati. "
        "Sono insetti di forma allungata e di colorazione uniforme, dal bruno scuro al testaceo, "
        "con movimenti piuttosto lenti. Il pungiglione è ben sviluppato e funzionale; le pupe "
        "sono racchiuse in un bozzolo. Le colonie non sono mai molto popolose e di solito "
        "sono composte da poche decine di adulti."
    ),
    "Dolichoderinae": (
        "Le specie italiane sono formiche di dimensioni da piccole a medie, che vivono in "
        "colonie generalmente molto popolose in formicai sugli alberi o nel suolo, "
        "alimentandosi principalmente di melata prodotta dagli omotteri. L'unica specie "
        "del genere Dolichoderus è arboricola e nidifica in piccole cavità del legno; anche "
        "l'unica specie italiana di Liometopum nidifica nei tronchi degli alberi. Linepithema "
        "humile, unico rappresentante del genere nella nostra fauna, è la famosa "
        "\"formica argentina\", introdotta dal Sudamerica all'inizio del secolo e attualmente "
        "infestante quasi tutte le nostre regioni mediterranee."
    ),
    "Formicinae": (
        "Le specie italiane costituiscono generalmente colonie piuttosto grandi. Sono formiche "
        "onnivore ma con una chiara preferenza per i liquidi zuccherini. Le dimensioni variano "
        "da meno di 2 mm in Plagiolepis a circa 2 cm nelle regine di Camponotus. Il pungiglione "
        "è assente; le ghiandole associate sono modificate per la produzione di sostanze repellenti "
        "(ad esempio acido formico). Le pupe sono racchiuse in un bozzolo. Al genere Formica "
        "appartengono anche le ben note formiche del \"gruppo rufa\" delle foreste alpine "
        "(una specie anche nell'Appennino), che essendo predatrici molto efficienti, sono state "
        "utilizzate in passato per il controllo biologico in ambiente forestale."
    ),
    "Amblyoponinae": (
        "La sottofamiglia Amblyoponinae comprende 11 generi distribuiti nella maggior parte "
        "del mondo, sebbene siano più comuni nelle regioni tropicali e forestali. I nidi si "
        "trovano nel suolo sotto pietre o tronchi o nel legno marcescente. Le colonie sono spesso "
        "composte da numerosi piccoli nidi sparsi su un'area ristretta. In alcuni casi mancano "
        "grandi camere centrali e la colonia è formata da molti piccoli nidi satellite contenenti "
        "poche operaie con una piccola quantità di covata (larve e pupe). Nella maggior parte dei "
        "generi, le operaie sono predatrici criptiche nel suolo e nella lettiera e raramente si "
        "vedono foraggiare in superficie. Alcune specie mostrano una forte preferenza per i "
        "centopiedi, mentre altre si nutrono di una varietà di artropodi dal corpo molle. "
        "È comune in alcuni gruppi che le operaie portino le larve verso le fonti di cibo piuttosto "
        "che tentare di trasportare prede particolarmente grandi fino al nido."
    ),
    "Leptanillinae": (
        "Le specie italiane sono formiche minuscole, filiformi, prive di occhi e depigmentate. "
        "Vivono e foraggiano nel suolo, talvolta a notevole profondità. Le regine sono attere, "
        "fisiogastriche e con il peziolo formato da un singolo articolo. Finora note solo in "
        "Sardegna e Sicilia."
    ),
    "Proceratiinae": (
        "I membri delle Proceratiinae si incontrano raramente a causa delle loro piccole "
        "dimensioni e delle abitudini criptiche. Le operaie foraggiano sotto la superficie "
        "del suolo o nella lettiera e i nidi sono piccoli, contenenti meno di 100 operaie. "
        "La maggior parte delle specie è ritenuta predatrice specializzata di uova di artropodi, "
        "sebbene le osservazioni dirette siano poche. Si incontrano più frequentemente nei "
        "campioni di lettiera."
    ),
}


def translate_genera():
    print("Translating genera...")
    genera = load_json('genera.json')
    count = 0
    for g in genera:
        name = g['scientific_name']
        if name in GENERA_TRANSLATIONS and not g.get('description_it', '').strip():
            g['description_it'] = GENERA_TRANSLATIONS[name]
            count += 1
            print(f"  Translated {name}")
    save_json('genera.json', genera)
    print(f"  {count} genera translated")


def translate_species():
    print("Translating species...")
    species = load_json('species.json')
    count = 0
    for s in species:
        name = s['scientific_name']
        if name in SPECIES_TRANSLATIONS and not s.get('description_it', '').strip():
            s['description_it'] = SPECIES_TRANSLATIONS[name]
            count += 1
            print(f"  Translated {name}")
    save_json('species.json', species)
    print(f"  {count} species translated")


def translate_subfamilies():
    print("Translating subfamilies...")
    subs = load_json('subfamilies.json')
    count = 0
    for s in subs:
        name = s['name']
        if name in SUBFAMILY_TRANSLATIONS and not s.get('description_it', '').strip():
            s['description_it'] = SUBFAMILY_TRANSLATIONS[name]
            count += 1
            print(f"  Translated {name}")
    save_json('subfamilies.json', subs)
    print(f"  {count} subfamilies translated")


if __name__ == '__main__':
    translate_genera()
    translate_species()
    translate_subfamilies()
    print("\nDone! All missing translations have been added.")
