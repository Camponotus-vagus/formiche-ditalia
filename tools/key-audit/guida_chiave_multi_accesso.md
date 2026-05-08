# Guida alla costruzione di chiavi multi-accesso
### Riferimento tecnico per lo sviluppo di formicheditalia.it

---

## Indice

1. [Cos'è una chiave multi-accesso](#1-cosè-una-chiave-multi-accesso)
2. [La matrice taxa × caratteri × stati](#2-la-matrice-taxa--caratteri--stati)
3. [Tipi di carattere](#3-tipi-di-carattere)
4. [Codifica degli stati](#4-codifica-degli-stati)
5. [Struttura dati consigliata (JSON)](#5-struttura-dati-consigliata-json)
6. [Algoritmi di filtraggio e scoring](#6-algoritmi-di-filtraggio-e-scoring)
7. [Selezione del carattere consigliato](#7-selezione-del-carattere-consigliato)
8. [Metriche di qualità della matrice](#8-metriche-di-qualità-della-matrice)
9. [Progettazione dei caratteri](#9-progettazione-dei-caratteri)
10. [Scope, caste e target audience](#10-scope-caste-e-target-audience)
11. [UX e accessibilità](#11-ux-e-accessibilità)
12. [Analisi della chiave attuale di formicheditalia.it](#12-analisi-della-chiave-attuale-di-formicheitaliait)
13. [Raccomandazioni prioritarie](#13-raccomandazioni-prioritarie)
14. [Workflow di costruzione e manutenzione](#14-workflow-di-costruzione-e-manutenzione)

---

## 1. Cos'è una chiave multi-accesso

Una **chiave multi-accesso** (detta anche *polyclave* o *chiave a matrice*) è uno strumento di identificazione in cui l'utente può selezionare i caratteri osservabili in qualsiasi ordine, senza seguire un percorso prestabilito.

### Confronto con la chiave dicotomica

| Aspetto | Chiave dicotomica | Chiave multi-accesso |
|---|---|---|
| Percorso | Fisso, passo-passo | Libero, qualsiasi ordine |
| Resistenza agli errori | Nulla: un errore devia l'intero percorso | Alta: un errore su N caratteri è recuperabile |
| Carattere mancante | Blocca l'identificazione | Si salta senza perdere il risultato |
| Manutenzione | Difficile: la struttura ad albero si rompe aggiungendo taxa | Facile: si aggiunge una riga alla matrice |
| Ideale per | Testi stampati, percorsi guidati | Applicazioni web, utenti non esperti |

### Limitazioni della chiave multi-accesso

- Richiede che la matrice sia completa (o quasi) per funzionare bene.
- L'identificazione a livello di specie richiede molti più caratteri di quella a livello di genere.
- Non guida l'utente nella sequenza ottimale di osservazione (a meno che non si implementi un sistema di carattere consigliato).

---

## 2. La matrice taxa × caratteri × stati

La struttura dati fondamentale è una matrice bidimensionale:

- **Righe = taxa** (le entità da identificare: specie, generi, morfospecie...)
- **Colonne = caratteri** (i tratti osservabili: forma del capo, numero di segmenti antennali...)
- **Celle = stati** (i valori del carattere per quel taxon: "triangolare", "ovale", "12 segmenti"...)

### La regola fondamentale

> Ogni taxon deve avere almeno uno stato per ogni carattere utilizzato dalla chiave.

Una cella vuota non è semplicemente un dato mancante: è un errore logico che rende il carattere inutilizzabile per quel taxon (vedi Sezione 4 per la distinzione tra cella vuota, N/A e sconosciuto).

### Polimorfismo: stati multipli per cella

Un taxon può avere **più stati per lo stesso carattere**. Questo è normale e atteso:

- Variabilità intraspecifica reale (es. *Camponotus* ha operaie nere, rossastre e bicolori a seconda della specie).
- Variabilità dovuta a polimorfismo di casta (operaia minore vs. maggiore).
- Variabilità geografica documentata.

Un taxon con k stati su un carattere contribuisce con k "opportunità di match" per l'utente. Non è un problema, ma abbassa il potere discriminante di quel carattere per quel taxon.

---

## 3. Tipi di carattere

### 3.1 Binario

Due soli stati mutuamente esclusivi.

```
Pungiglione funzionale: [presente | assente]
Occhi: [presenti | assenti]
```

Semplice da codificare e osservare, ma bassa risoluzione: divide sempre i taxa in due gruppi. Utile come carattere diagnostico per grandi clade (es. "pungiglione assente" → Formicinae).

### 3.2 Multinominale non ordinato

Più stati senza ordine intrinseco. Il tipo più comune in morfologia.

```
Forma del capo: [triangolare | ovale | rettangolare | cuoriforme]
Colore: [testaceo | rufo | bruno | nero | bicolore]
```

Non c'è relazione ordinale tra gli stati. Un taxon "triangolare" non è "più grande" di uno "ovale".

### 3.3 Ordinale

Stati con ordine intrinseco ma distanze non quantificate.

```
Numero di denti mandibolari: [1-3 | 4-6 | 7-9 | ≥10]
Dimensione occhi: [ridotti | medi | grandi]
```

> **Attenzione:** la discretizzazione degli intervalli è una scelta arbitraria del costruttore della chiave. Intervalli troppo ampi riducono il potere discriminante; intervalli troppo stretti aumentano il rischio di errori di codifica.

### 3.4 Quantitativo discretizzato

Misure continue trasformate in categorie. Tipico per rapporti morfometrici.

```
Rapporto CI (indice cefalico): [<75 | 75-85 | 86-95 | >95]
```

Per una chiave web, è meglio evitare caratteri quantitativi che richiedono micrometri: abbassano drasticamente l'accessibilità per l'utente non esperto.

### 3.5 Caratteri dipendenti (condizionali)

Un carattere è rilevante **solo se** un altro carattere ha un determinato valore.

```
"Numero di speroni sulla tibia posteriore" è rilevante solo se "speroni presenti = sì"
"Forma del dente apicale" è rilevante solo se "mandibola non edentata"
```

I caratteri condizionali devono essere esplicitamente collegati al loro carattere padre nel modello dati. Se non lo sono, rischiano di generare falsi negativi (un taxon aptergo viene escluso perché non ha "colore delle ali = nessuna").

---

## 4. Codifica degli stati

### I quattro casi possibili per una cella

| Tipo | Simbolo comune | Significato | Comportamento nel filtro |
|---|---|---|---|
| **Stato definito** | valore esplicito | Il taxon ha quel valore | Match / no match |
| **Non applicabile** | `NA` o `-` | Il carattere morfologicamente non esiste per quel taxon | Sempre escluso se si filtra su quel carattere |
| **Sconosciuto** | `?` o `U` | Il valore esiste biologicamente ma non è documentato | Sempre sopravvive a qualsiasi filtro (approccio conservativo) |
| **Errore** | cella vuota | Dato non inserito per dimenticanza | Indistinguibile da NA o U nel database grezzo |

### La trappola del database grezzo

In un foglio Excel o in un JSON non documentato, cella vuota, NA e U sono **visivamente identici**. La distinzione esiste solo se il modello dati la codifica esplicitamente:

```json
{ "state": null }              // ambiguo: errore? NA? U?
{ "state": "NA" }              // non applicabile (esplicito)
{ "state": "?" }               // sconosciuto (esplicito)
{ "state": ["rosso", "nero"] } // polimorfismo (esplicito)
```

> **Raccomandazione pratica:** non usare mai `null` o stringa vuota come valore di cella. Ogni cella deve avere uno stato esplicito tra: valore/i definiti, `"NA"`, o `"?"`.

---

## 5. Struttura dati consigliata (JSON)

### Schema della matrice

```json
{
  "characters": [
    {
      "id": "char_001",
      "name": "Forma del capo",
      "section": "Testa",
      "type": "multinomial",
      "difficulty": 1,
      "observation_tool": "lente 10x",
      "states": ["triangolare", "ovale", "rettangolare"],
      "image": "chars/forma_capo.webp",
      "help_text": "Osservare in vista frontale diretta."
    }
  ],
  "taxa": [
    {
      "id": "camponotus",
      "name": "Camponotus",
      "subfamily": "Formicinae",
      "characters": {
        "char_001": { "states": ["ovale"] },
        "char_002": { "states": ["NA"] },
        "char_003": { "states": ["giallo", "nero", "rosso"] },
        "char_004": { "states": ["?"] }
      }
    }
  ]
}
```

### Campi raccomandati per ogni carattere

| Campo | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|
| `id` | string | sì | Identificatore univoco stabile |
| `name` | string | sì | Nome univoco e non ambiguo |
| `section` | string | sì | Raggruppamento anatomico |
| `type` | enum | sì | `binary`, `multinomial`, `ordinal`, `quantitative` |
| `difficulty` | int 1-3 | raccomandato | 1=occhio nudo, 2=lente, 3=microscopio |
| `observation_tool` | string | raccomandato | Descrizione dello strumento richiesto |
| `states` | string[] | sì | Lista di tutti gli stati possibili |
| `image` | string | raccomandato | Immagine illustrativa degli stati |
| `help_text` | string | raccomandato | Istruzione su come osservare il carattere |
| `dependent_on` | object | se applicabile | `{ "char_id": "char_002", "state": "presente" }` |
| `caste` | string[] | raccomandato | `["worker"]`, `["queen"]`, `["worker", "queen"]` |

---

## 6. Algoritmi di filtraggio e scoring

### 6.1 Filtro Linneano (hard filtering, tolleranza = 0)

Un taxon è **eliminato** se, per almeno un carattere su cui l'utente ha selezionato uno stato, il taxon non possiede nessuno degli stati selezionati dall'utente.

```python
def is_compatible(taxon, selected_filters):
    for char_id, selected_states in selected_filters.items():
        taxon_states = taxon.characters[char_id].states
        
        if "?" in taxon_states:
            continue  # sconosciuto: sopravvive sempre
        if "NA" in taxon_states:
            return False  # NA: escluso se si filtra su quel carattere
        
        if not any(s in taxon_states for s in selected_states):
            return False  # nessun match: eliminato
    
    return True
```

### 6.2 Scoring con tolleranza (soft filtering)

Invece di eliminare un taxon al primo mismatch, si accumula un **punteggio di mismatch** (*score di errore*). Il taxon viene escluso solo se il suo punteggio supera la soglia di tolleranza impostata dall'utente.

```python
def mismatch_score(taxon, selected_filters):
    score = 0
    for char_id, selected_states in selected_filters.items():
        taxon_states = taxon.characters[char_id].states
        
        if "?" in taxon_states:
            continue  # sconosciuto: non penalizzato
        if "NA" in taxon_states:
            score += 1  # NA filtrato: penalizzato come mismatch
            continue
        
        if not any(s in taxon_states for s in selected_states):
            score += 1
    
    return score

def filter_with_tolerance(taxa, selected_filters, tolerance):
    return [t for t in taxa if mismatch_score(t, selected_filters) <= tolerance]
```

La tolleranza è una scelta di design con trade-off espliciti:

| Tolleranza | Comportamento | Rischio |
|---|---|---|
| 0 | Solo taxa perfettamente compatibili | Falsi negativi se l'utente sbaglia un carattere |
| 1-2 | Taxa con 1-2 mismatch rimangono | Lista più lunga, ma più sicura |
| ★ (ranking) | Tutti i taxa ordinati per numero di match | Nessuna eliminazione; utile per esemplari atipici |

### 6.3 Scoring pesato

Variante avanzata in cui caratteri diversi hanno pesi diversi. Caratteri con alta stabilità intraspecifica e alta discriminazione hanno peso maggiore.

```python
def weighted_mismatch_score(taxon, selected_filters, weights):
    score = 0.0
    for char_id, selected_states in selected_filters.items():
        taxon_states = taxon.characters[char_id].states
        w = weights.get(char_id, 1.0)
        
        if "?" in taxon_states:
            continue
        if not any(s in taxon_states for s in selected_states):
            score += w
    
    return score
```

---

## 7. Selezione del carattere consigliato

Il carattere consigliato è quello che, se selezionato nel prossimo passo, **massimizza la riduzione del set di candidati**.

### 7.1 Indice di separazione (Best Separator)

Per ogni carattere non ancora selezionato, calcola la distribuzione degli stati tra i taxa candidati. Il carattere migliore è quello che produce la distribuzione più equilibrata.

```python
def separation_score(char, candidate_taxa):
    """
    Restituisce un punteggio 0-1.
    1 = il carattere divide esattamente a metà i candidati.
    0 = tutti i candidati hanno lo stesso stato (nessun potere discriminante).
    """
    state_counts = defaultdict(int)
    applicable_taxa = 0
    
    for taxon in candidate_taxa:
        states = taxon.characters[char.id].states
        if "NA" in states or "?" in states:
            continue
        applicable_taxa += 1
        for state in states:
            state_counts[state] += 1
    
    if applicable_taxa == 0:
        return 0.0
    
    # Varianza della distribuzione degli stati
    # Un carattere binario 50/50 ha varianza massima
    total = sum(state_counts.values())
    proportions = [count / total for count in state_counts.values()]
    entropy = -sum(p * log2(p) for p in proportions if p > 0)
    max_entropy = log2(len(char.states))
    
    applicability = applicable_taxa / len(candidate_taxa)
    
    return (entropy / max_entropy) * applicability if max_entropy > 0 else 0.0
```

### 7.2 Applicabilità

Un carattere molto discriminante ma applicabile solo al 30% dei taxa non è un buon candidato come primo suggerimento. Il punteggio finale del carattere consigliato deve bilanciare:

```
score_finale = w_sep * separazione + w_app * applicabilità + w_diff * (1 - difficoltà)
```

Dove i pesi `w_*` riflettono le priorità del sito (es. dare più peso all'osservabilità per un pubblico non esperto).

### 7.3 Caratteri consigliati per livello di expertise

Un sistema più sofisticato differenzia i suggerimenti per livello utente:

- **Principiante:** suggerisce prima caratteri a occhio nudo (`difficulty = 1`) con alto impatto.
- **Esperto:** ottimizza puramente sulla separazione.

---

## 8. Metriche di qualità della matrice

Queste metriche devono essere calcolate **ogni volta che si modifica la matrice** e visualizzate in un pannello di diagnostica interno.

### 8.1 Completezza della matrice

```
completezza = celle_con_stato_definito / (n_taxa × n_caratteri)
```

Una chiave funzionale dovrebbe avere completezza ≥ 85%. Sotto questa soglia, molti taxa risultano non discriminabili su molti caratteri.

Per analisi più granulare:
- **Completezza per taxon:** quanti caratteri ha codificati quel taxon? Utile per identificare taxa "fragili".
- **Completezza per carattere:** su quanti taxa è applicabile quel carattere? Caratteri con applicabilità < 30% hanno scarso valore diagnostico globale.

### 8.2 Distanza minima tra taxa (pairwise analysis)

Per ogni coppia di taxa (i, j), la **distanza** è il numero di caratteri su cui differiscono.

```python
def pairwise_distance(taxon_a, taxon_b, characters):
    differences = 0
    for char in characters:
        states_a = set(taxon_a.characters[char.id].states) - {"NA", "?"}
        states_b = set(taxon_b.characters[char.id].states) - {"NA", "?"}
        
        if not states_a or not states_b:
            continue  # non comparabili su questo carattere
        
        if states_a.isdisjoint(states_b):
            differences += 1
    
    return differences
```

> **Soglia critica:** qualsiasi coppia con distanza = 0 è **indistinguibile** dalla chiave. Coppie con distanza = 1 sono a rischio con tolleranza ≥ 1.

Produrre la matrice di distanze e segnalare:
- Coppie con distanza 0 (da risolvere aggiungendo caratteri discriminanti).
- Coppie con distanza 1-2 (a rischio con tolleranza alta).

### 8.3 Ridondanza tra caratteri

Due caratteri sono **ridondanti** se mostrano la stessa distribuzione di stati tra i taxa (o molto simile). La ridondanza non è sempre negativa (aumenta la robustezza), ma un eccesso appesantisce la chiave senza aggiungere informazione.

```python
def character_redundancy(char_a, char_b, taxa):
    """Coefficiente di correlazione phi tra due caratteri binari.
    Per caratteri multinominali, usare Cramer's V."""
    ...
```

### 8.4 Potere discriminante medio per carattere (separazione globale)

Calcolato sull'intero set di taxa (non sui candidati residui). Permette di identificare caratteri inutili da rimuovere o caratteri cruciali da proteggere.

---

## 9. Progettazione dei caratteri

### 9.1 Principi di selezione

**Indipendenza morfologica:** caratteri diversi non devono misurare la stessa cosa in modo diverso. Se "numero di segmenti antennali" e "presenza di clava antennale" sono quasi perfettamente correlati, uno dei due è ridondante.

**Stabilità intraspecifica:** il carattere deve essere costante all'interno del taxon (o avere variabilità codificabile). Un carattere che varia casualmente tra individui della stessa specie introduce rumore.

**Osservabilità:** ogni carattere deve essere osservabile con strumenti chiaramente definiti. Se richiede SEM, non appartiene a una chiave per identificazione sul campo.

**Resistenza alla degradazione del campione:** caratteri basati su colori o setole sono vulnerabili con esemplari vecchi o mal conservati. I caratteri strutturali (forma, numero, rapporti) sono più robusti.

### 9.2 Nomi dei caratteri: regole

- Ogni carattere deve avere un **nome univoco** nell'intera chiave. Se lo stesso tratto morfologico viene misurato in modi diversi (es. "formula palpale 1" su un sottoinsieme di taxa e "formula palpale 2" su un altro), devono avere nomi distinti con contesto esplicito.
- Evitare nomi ambigui come "colore" o "forma": specificare sempre la struttura ("colore del gastro", "forma del capo in vista frontale").
- Includere la vista o la prospettiva quando rilevante ("vista dorsale", "vista laterale").

### 9.3 Caratteri condizionali: come modellarli

Un carattere condizionale dipende da un valore specifico di un carattere padre.

```json
{
  "id": "char_tibia_spur_shape",
  "name": "Forma dello sperone tibiale posteriore",
  "dependent_on": {
    "char_id": "char_tibia_spur_presence",
    "states": ["presente"]
  }
}
```

Nell'algoritmo di filtraggio, se il carattere padre non è stato selezionato dall'utente, il carattere figlio viene ignorato. Se il carattere padre ha stato "assente" per un taxon, tutti i caratteri figli hanno automaticamente stato NA per quel taxon.

---

## 10. Scope, caste e target audience

### 10.1 Definire lo scope geografico

Una chiave con scope "formiche italiane" deve includere tutte le specie/generi presenti nella checklist di riferimento (es. Schifani 2022 per l'Italia). Taxa non inclusi portano a false identificazioni: l'utente identifica un taxon non presente nella chiave come il taxon più simile presente.

> **Raccomandazione:** documentare esplicitamente lo scope nella UI ("questa chiave copre i 43 generi italiani secondo Schifani 2022") e aggiungere un avviso se l'esemplare potrebbe essere un taxon non ancora incluso (es. specie alloctone recenti).

### 10.2 Gestione delle caste

Operaie, regine e maschi di molte specie hanno morfologie radicalmente diverse. Una chiave costruita sulle operaie **non identifica correttamente regine o maschi**.

Opzioni implementative:
1. **Chiave separata per casta** (più semplice, più chiara).
2. **Filtro per casta** che riduce i caratteri visualizzati a quelli applicabili alla casta selezionata.
3. **Tag `caste` per ogni carattere** (vedi Sezione 5) con esclusione automatica dei caratteri non applicabili.

### 10.3 Target audience e difficoltà

Taggare ogni carattere con un livello di difficoltà (1-3) permette di:
- Filtrare i caratteri per utente (mostrare solo i caratteri a occhio nudo ai principianti).
- Ottimizzare il carattere consigliato per livello (suggerire prima i caratteri facili).
- Comunicare chiaramente all'utente cosa gli serve per usare quel carattere.

```
difficulty: 1 → osservabile a occhio nudo o con foto
difficulty: 2 → richiede lente 10x o stereomicroscopio
difficulty: 3 → richiede microscopio ottico o SEM
```

---

## 11. UX e accessibilità

### 11.1 Immagini di supporto per gli stati

Per ogni stato di ogni carattere, una piccola immagine esplicativa riduce drasticamente gli errori di codifica da parte dell'utente. Priorità:

1. Caratteri con stati nominali non intuitivi (es. "squama peziolare vs. nodo").
2. Caratteri con alta variabilità visiva tra taxa (es. "profilo del mesosoma").
3. Caratteri che l'utente tende a sbagliare (identificabile dai log di sessione).

### 11.2 Glossario integrato inline

Il tooltip o il link a glossario deve essere disponibile **inline sul nome del carattere**, non in una pagina separata. L'interruzione del flusso di identificazione abbassa il tasso di completamento.

### 11.3 Skip esplicito del carattere

L'utente deve poter dichiarare esplicitamente "non riesco a osservare questo carattere" (già presente su formicheditalia.it come "Non riesco a vederlo →"). Questo deve essere trattato come skip (il carattere non contribuisce al filtro), non come match di tutti gli stati.

### 11.4 Feedback progressivo

L'utente deve vedere in tempo reale:
- **Quanti taxa rimangono** dopo ogni selezione.
- **Quanti caratteri ha già usato** e quanti ne restano.
- **Il carattere che ridurrebbe di più i candidati** (carattere consigliato).
- **I taxa che stanno per essere eliminati** da una selezione (preview prima di confermare).

### 11.5 Gestione dell'impasse

Se l'utente ha selezionato molti caratteri e i candidati rimasti non convergono su un'unica soluzione, la chiave deve:
1. Evidenziare il carattere che discrimina esattamente tra i candidati rimasti.
2. Mostrare una tabella comparativa dei candidati rimasti sui caratteri discriminanti.
3. Se nessun carattere discrimina (taxa troppo simili per la chiave), segnalarlo esplicitamente e indirizzare a risorse di approfondimento.

---

## 12. Analisi della chiave attuale di formicheditalia.it

### Punti di forza

- **43 generi** organizzati in 8 sottofamiglie: copertura solida della fauna italiana.
- **Tolleranza agli errori** (slider 0-3 + ★): feature avanzata che migliora l'usabilità per principianti.
- **Carattere consigliato** con hint "Consiglio per principianti: inizia da Colore": buona UX.
- **"Non riesco a vederlo"** come opzione di skip: gestione corretta dell'incertezza dell'utente.
- **Progressi %** visualizzato: feedback immediato sul completamento.
- **Organizzazione per sezione anatomica** (Testa, Torace, Peziolo, Gastro, Zampe, Antenne): riduce il carico cognitivo.

### Problemi identificati

#### P1 — Nomi duplicati dei caratteri (alta priorità)

Nella chiave sono presenti più caratteri con lo stesso nome. Questo rende impossibile per l'utente distinguerli e complica la manutenzione del codice:

| Nome duplicato | Occorrenze osservate |
|---|---|
| `Formula palpale` | 3 istanze con stati diversi |
| `Propodeo` | 2 istanze |
| `Colore` | 2 istanze |
| `Numero di segmenti antennali` | 2 istanze |
| `Forma delle mandibole` | 2 istanze |

**Soluzione:** rinominare ogni carattere in modo da includere il contesto di applicazione. Esempi:
- "Formula palpale (sottofamiglie comuni)" → "Formula palpale: 6,4 vs. altri (Formicinae/Myrmicinae)"
- "Formula palpale (Myrmicinae avanzate)" → "Formula palpale: 4,3 vs. 4,2 vs. 5,4"

#### P2 — Assenza di immagini sugli stati dei caratteri (alta priorità)

Nessun carattere nella pagina identificata mostra immagini illustrative degli stati. Per caratteri come "Forma del capo", "Squama peziolare", "Profilo del mesosoma" questo è una barriera significativa per l'utente non esperto.

#### P3 — Nessuna distinzione esplicita tra NA e sconosciuto

La chiave gestisce gli skip dell'utente ("non riesco a vederlo"), ma non è chiaro se la matrice dati distingue esplicitamente tra NA, sconosciuto e stato definito per ogni cella. Se non lo fa, lo scoring potrebbe produrre falsi negativi per taxa con molti NA.

#### P4 — Assenza di tag difficoltà sui caratteri

Caratteri come "4° articolo del palpo mascellare...circa il doppio del 5°" richiedono microscopio e misure comparative molto fini. Non è indicato all'utente quale strumento serve, né questi caratteri vengono posizionati in fondo alla lista dei suggerimenti per i principianti.

#### P5 — Nessun filtro per casta (media priorità)

I caratteri sembrano riferirsi principalmente alle operaie, ma non è esplicitato. Un utente con una regina o un maschio non sa che la chiave non è applicabile.

#### P6 — Nessuna analisi di coppia critica visibile (media priorità)

Non è chiaro se esista una verifica interna che ogni coppia di generi sia discriminabile dalla chiave. Taxa morfologicamente vicini (es. *Lasius* / *Nylanderia* / *Paratrechina*, o *Ponera* / *Hypoponera*) potrebbero avere distanza ridotta nella matrice attuale.

#### P7 — Caratteri condizionali non modellati esplicitamente

"Speroni della tibia posteriore: due speroni, uno semplice uno pettinato" è un carattere che presuppone la presenza di speroni. Se il modello dati non lo collega esplicitamente al carattere padre, il comportamento con taxa aperoi o con speroni assenti può essere imprevedibile.

---

## 13. Raccomandazioni prioritarie

### Sprint 1 — Qualità del dato (senza cambiare l'UI)

1. **Disambiguare tutti i nomi duplicati** nella matrice dati. Ogni `id` e `name` deve essere univoco.
2. **Aggiungere campo `difficulty` (1-3)** a ogni carattere esistente.
3. **Aggiungere campo `caste`** a ogni carattere (almeno distinguere `worker` da `all`).
4. **Verificare la codifica NA/sconosciuto** in tutta la matrice. Documentare la convenzione usata nel codice.
5. **Calcolare la matrice di distanze pairwise** tra tutti i 43 generi. Segnalare coppie con distanza ≤ 2.

### Sprint 2 — Miglioramenti algoritmo

6. **Aggiornare il carattere consigliato** per tenere conto della difficoltà (`difficulty`) come fattore di penalità nel ranking per gli utenti principianti.
7. **Implementare il filtro per casta** nella UI (semplice toggle: operaia / regina / maschio / non so).
8. **Garantire che NA e sconosciuto** siano trattati diversamente nell'algoritmo di scoring (NA = penalità, sconosciuto = nessuna penalità).

### Sprint 3 — UX e contenuto

9. **Aggiungere immagini illustrative** per almeno i 10 caratteri più usati (identificabili dai log di sessione o per frequenza di selezione).
10. **Rinominare i caratteri duplicati** nella UI con nomi contestualizzati.
11. **Aggiungere tooltip con indicazione dello strumento** per ogni carattere con `difficulty ≥ 2`.
12. **Implementare la tabella comparativa** per i candidati finali (quando rimangono ≤ 5 taxa).

---

## 14. Workflow di costruzione e manutenzione

### Costruzione da zero

```
1. Definire scope (taxa, area geografica, caste, livello tassonomico)
2. Raccogliere i taxa dalla checklist di riferimento
3. Selezionare i caratteri dalla letteratura (chiavi dicotomiche esistenti sono un'ottima fonte)
4. Costruire la matrice in un foglio di calcolo (Google Sheets / Excel)
   - Una riga per taxon
   - Una colonna per carattere
   - Convenzione esplicita per NA, ?, stati multipli (es. "rosso|nero")
5. Verificare completezza (% celle con stato definito ≥ 85%)
6. Calcolare distanze pairwise → identificare coppie indistinguibili
7. Aggiungere caratteri per discriminare le coppie problematiche
8. Esportare in JSON secondo lo schema della Sezione 5
9. Validare con esemplari noti (test su ≥ 10 taxa con identificazione certa)
10. Iterare (manutenzione è continua, non un evento one-shot)
```

### Manutenzione continua

- **Aggiungere un taxon:** aggiungere la riga, codificare tutti i caratteri, ricalcolare distanze pairwise.
- **Aggiungere un carattere:** aggiungere la colonna, codificare per tutti i taxa, verificare che non introduca NA in eccesso.
- **Aggiornamento tassonomico:** sinonimie, split, merge richiedono aggiornamenti sia dei taxa che potenzialmente della matrice.
- **Feedback degli utenti:** i falsi negativi segnalati dagli utenti sono dati preziosi per identificare errori nella matrice.

### Versionamento della matrice

La matrice dei caratteri è la fonte di verità della chiave. Va trattata come codice:
- Versioning in Git (CSV o JSON, non formati binari).
- Changelog esplicito per ogni modifica alla matrice.
- Tag di versione coerente con la versione del sito.

---

*Documento prodotto per lo sviluppo di formicheditalia.it — Francesco Simone Mensa, 2026*
*Basato sull'analisi della chiave interattiva attuale (43 generi, checklist Schifani 2022)*
