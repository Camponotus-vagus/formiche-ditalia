# Audit di raggiungibilità della chiave multi-access

**Data:** 2026-05-07  
**Algoritmo replicato da:** `formiche-ditalia/src/components/IdentificationKey.tsx`  
**Strumenti:** `tools/key-audit/` (simulator.mjs, discriminate.mjs, deep-search.mjs)  
**Tolleranza usata:** `maxMismatches = 1` (default UI)  
**Genere considerato "raggiungibile":** posto al primo posto della classifica (con score strettamente maggiore del secondo) per almeno una combinazione di caratteri/stati con cardinalità ≤ 5.

---

## Sommario esecutivo

| Profondità minima per identificazione univoca | Numero di generi |
|---|---|
| 1 carattere ⇒ univoco | 18 |
| 2 caratteri ⇒ univoco (1 non basta) | 13 |
| 3 caratteri ⇒ univoco (1–2 non bastano) | 5 |
| **NON raggiungibili univocamente** (anche con 5 caratteri) | **7** |
| **Totale** | **43** |

### Generi non raggiungibili univocamente

Questi generi **non possono mai essere posti come unico vincitore** della chiave: ogni combinazione di caratteri/stati che li rende compatibili rende compatibile *anche* almeno un altro genere con score identico.

| Genere | Sottofamiglia | "Bloccato da" | Motivo strutturale |
|---|---|---|---|
| _Prenolepis_ | formicinae | nylanderia, paratrechina | Profili **identici**: Prenolepis, Nylanderia e Paratrechina hanno la stessa identica matrice di stati per tutti gli 8 caratteri formicinae. Sono **completamente indistinguibili** dalla chiave attuale. |
| _Nylanderia_ | formicinae | prenolepis, paratrechina | Profili identici (vedi Prenolepis). |
| _Paratrechina_ | formicinae | prenolepis, nylanderia | Profili identici (vedi Prenolepis). |
| _Lasius_ | formicinae | formica | Profilo dominato: Lasius differisce da Formica solo per `gen-33` ("Formula palpale", scope formicinae) dove Lasius=`0` e Formica=`{0,2}`. Ogni stato compatibile con Lasius è compatibile anche con Formica. |
| _Stenamma_ | myrmicinae | pheidole | Profilo dominato: Stenamma differisce da Pheidole solo per `gen-11` ("Lati del pronoto") dove Stenamma=`1` e Pheidole=`{0,1}`. Ogni stato compatibile con Stenamma è compatibile anche con Pheidole. |
| _Brachyponera_ | ponerinae | hypoponera | Profilo dominato: Brachyponera differisce da Hypoponera solo per `gen-20` ("Colore", scope ponerinae) dove Brachyponera=`1` e Hypoponera=`{0,1}`. Ogni stato compatibile con Brachyponera è compatibile anche con Hypoponera. |
| _Leptanilla_ | leptanillinae | aphaenogaster | Profilo ridotto e dominato: Leptanilla ha dati per soli 5 caratteri myrmicinae; per ognuno i suoi stati sono sottoinsieme di quelli di Aphaenogaster. Manca un carattere diagnostico univoco (assenza di occhi composti, lobi frontali ridotti — non codificati nella chiave attuale). |

### Anomalie strutturali rilevate

1. **Le 4 sottofamiglie monotipiche** (Amblyoponinae, Proceratiinae, Leptanillinae, Dorylinae) **non hanno caratteri propri**: i loro generi (_Stigmatomma, Proceratium, Leptanilla, Dorylus_) usano caratteri della scope myrmicinae. Conseguenza: la "subfamily-aware penalization" funziona solo per le 4 sottofamiglie con caratteri scoped, mentre i generi monotipici concorrono come "out-of-scope" rispetto alla penalizzazione anche quando l'utente sta selezionando i loro caratteri.
2. **Coppie/triple di profili identici o dominati**: vedi sezione "Generi non raggiungibili univocamente". Ogni coppia dominata richiede l'aggiunta di almeno un nuovo carattere (o stato) per essere risolvibile.
3. **Caratteri inter-sottofamiglia mancanti**: nessun carattere della matrice è "globale". Quindi la chiave **non può mai distinguere genericamente** tra (es.) un Myrmicinae e un Ponerinae sulla base di caratteri base come "numero di segmenti del peziolo": questo è gestito implicitamente dalla subfamily-scope.

### Anomalie risolte dallo Step 0 di restauro

1. **Bug del parser NEXUS** (`re.split` non rispettava i quote): produceva un carattere fantasma `gen-9` e shiftava tutti i dati matrice myrmicinae da `gen-10` in poi rispetto alle loro etichette. **209 punti dati su 19 generi avevano label sbagliata.** Risolto: la regex è ora quote-aware, gli ID sono sequenziali `gen-1..gen-39`.
2. **Carattere `gen-2` ("Forma del capo") senza dati**: era un effetto collaterale del bug del parser (i dati venivano "rubati" dal carattere fantasma). Risolto: ora ha 19 entry per i Myrmicines.
3. **Strumigenys/gen-14 = "2"**: era un valore orfano perché `gen-14` era etichettato "Speroni" (2 stati) ma conteneva dati di "Forma del peziolo" (3 stati). Risolto: `gen-14` ora è correttamente "Forma del peziolo e postpeziolo" e lo stato `2` è "non cubico, con una pronunciata gonna spugnosa alla base" — la classica caratteristica di Strumigenys.
4. **Sottofamilia Dorylinae mancante** in `subfamilies.json` derivato da NEXUS: aggiunta in `sottofamiglie.nex`.
5. **7 generi mancanti dal pipeline** (Brachyponera, Nylanderia, Paratrechina, Stigmatomma, Proceratium, Leptanilla, Dorylus erano hand-edited nel JSON): tutti aggiunti ai NEXUS Rigato; `parse_nexus.py` esteso con `MONOTYPIC_GENUS_OVERRIDE` per assegnare le 4 monotipi alle loro sottofamiglie corrette pur essendo nel file Myrmicinae.
6. **`Proceratium`** che era classificato come "non raggiungibile" nell'audit pre-restauro è **automaticamente sbloccato** dal restauro (i suoi dati misallineati ora corrispondono alle label corrette).

---

## Metodologia

Per ogni genere _G_:

1. **Profilo compatibile** _S(G)_ — l'insieme delle coppie (carattere, stato) per cui la matrice marca _G_ come compatibile (esclusi i `?`).
2. **Ricerca esaustiva** di tutti i sottoinsiemi di _S(G)_ di cardinalità 1 (e poi 2, 3, 4, 5 se necessario), con il vincolo "una sola selezione per carattere", e per ognuno si verifica se _G_ risulta unico vincitore della classifica (ovvero score strettamente maggiore del secondo classificato e nessuna parità in vetta).
3. **"Profondità di discriminazione"** = la cardinalità minima per cui esiste almeno un sottoinsieme che identifica univocamente _G_.
4. **Generi "non raggiungibili"** sono quelli per cui nessun sottoinsieme di cardinalità ≤ 5 funziona. Per questi è stato analizzato il profilo dominante (un altro genere il cui profilo include quello del genere considerato).

Il punteggio è calcolato esattamente come in `IdentificationKey.tsx`: pesi entropy-based (qui semplificati a peso uniforme = 1, dato che la traiettoria di selezione non altera l'esito di compatibilità — solo l'ordinamento relativo dei punteggi pari, che qui contiamo come "non univoci"), penalizzazione "missing" 0.3 (in-scope) o 0.8 (out-of-scope), tolleranza 1 mismatch.

---

## Dettaglio per genere

### Sottofamiglia Myrmicinae

#### _Cardiocondyla_

- **ID:** `cardiocondyla`
- **Caratteri con dato:** 18 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Setole erette sul mesosoma** = _assente_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Crematogaster_

- **ID:** `crematogaster`
- **Caratteri con dato:** 18 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (2):
  - **Articolazione del postpeziolo** = _articolato con la faccia superiore del primo segmento gastrale_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Forma del gastro** = _cordiforme_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Harpagoxenus_

- **ID:** `harpagoxenus`
- **Caratteri con dato:** 17 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Dentatura mandibolare** = _assente o solo con dente apicale_  (gap dal 2°: 0.500, generi rimasti in lista: 43)

#### _Monomorium_

- **ID:** `monomorium`
- **Caratteri con dato:** 19 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Dentatura mandibolare** = _4_  (gap dal 2°: 0.500, generi rimasti in lista: 43)

#### _Oxyopomyrmex_

- **ID:** `oxyopomyrmex`
- **Caratteri con dato:** 17 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Occhi composti** = _allungato, rastremato verso il basso_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Solenopsis_

- **ID:** `solenopsis`
- **Caratteri con dato:** 18 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Numero di segmenti antennali** = _10_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Strumigenys_

- **ID:** `strumigenys`
- **Caratteri con dato:** 18 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (5):
  - **Forma del capo** = _triangolare_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Numero di segmenti antennali** = _4_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Numero di segmenti antennali** = _6_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Formula palpale** = _1,1_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Forma del peziolo e postpeziolo** = _non cubico, con una pronunciata "gonna" spugnosa alla base_  (gap dal 2°: 0.500, generi rimasti in lista: 43)

#### _Aphaenogaster_

- **ID:** `aphaenogaster`
- **Caratteri con dato:** 19 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 8 su 12 totali trovate):
  - **Segmenti della clava antennale** = _4_ AND **Dentatura mandibolare** = _tra 6 e 9_  (gap: 0.400)
  - **Segmenti della clava antennale** = _4_ AND **Dentatura mandibolare** = _10 o piu_  (gap: 0.400)
  - **Segmenti della clava antennale** = _4_ AND **Profilo del mesosoma** = _promesonoto a livello piu alto del propodeo_  (gap: 0.400)
  - **Segmenti della clava antennale** = _4_ AND **Forma del peziolo e postpeziolo** = _non cubico_  (gap: 0.150)
  - **Segmenti della clava antennale** = _4_ AND **Superficie ventrale del peziolo e postpeziolo** = _al massimo con un piccolo dente o lobo_  (gap: 0.400)
  - **Segmenti della clava antennale** = _4_ AND **Pungiglione** = _...senza appendice apico-dorsale_  (gap: 0.150)
  - **Segmenti della clava antennale** = _5_ AND **Dentatura mandibolare** = _tra 6 e 9_  (gap: 0.400)
  - **Segmenti della clava antennale** = _5_ AND **Formula palpale** = _da 1,2 a 5,3_  (gap: 0.500)

#### _Formicoxenus_

- **ID:** `formicoxenus`
- **Caratteri con dato:** 18 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 1 su 1 totali trovate):
  - **Dentatura mandibolare** = _tra 6 e 9_ AND **Superficie ventrale del peziolo e postpeziolo** = _con dente o lobo ben sviluppato_  (gap: 0.150)

#### _Manica_

- **ID:** `manica`
- **Caratteri con dato:** 18 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 4 su 4 totali trovate):
  - **Segmenti della clava antennale** = _5_ AND **Formula palpale** = _6,4_  (gap: 0.500)
  - **Segmenti della clava antennale** = _5_ AND **Profilo del mesosoma** = _Promesonoto circa allo stesso livello del propodeo_  (gap: 0.500)
  - **Segmenti della clava antennale** = _5_ AND **Speroni delle tibie medie e posteriori** = _pettinato_  (gap: 0.400)
  - **Formula palpale** = _6,4_ AND **Propodeo** = _senza denti o spine_  (gap: 0.400)

#### _Messor_

- **ID:** `messor`
- **Caratteri con dato:** 19 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 8 su 15 totali trovate):
  - **Setole erette sul mesosoma** = _presente_ AND **Segmenti della clava antennale** = _indistinta_  (gap: 0.400)
  - **Forma del capo** = _non triangolare_ AND **Segmenti della clava antennale** = _indistinta_  (gap: 0.400)
  - **Segmenti della clava antennale** = _indistinta_ AND **Occhi composti** = _ovale_  (gap: 0.400)
  - **Segmenti della clava antennale** = _indistinta_ AND **Dentatura mandibolare** = _10 o piu_  (gap: 0.500)
  - **Segmenti della clava antennale** = _indistinta_ AND **Formula palpale** = _da 1,2 a 5,3_  (gap: 0.400)
  - **Segmenti della clava antennale** = _indistinta_ AND **Porzioni laterali del clipeo** = _non rialzato a cresta davanti alle inserzioni antennali_  (gap: 0.400)
  - **Segmenti della clava antennale** = _indistinta_ AND **Profilo del mesosoma** = _promesonoto a livello piu alto del propodeo_  (gap: 0.400)
  - **Segmenti della clava antennale** = _indistinta_ AND **Lati del pronoto** = _arrotondato, vista dorsale_  (gap: 0.400)

#### _Myrmecina_

- **ID:** `myrmecina`
- **Caratteri con dato:** 19 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 5 su 5 totali trovate):
  - **Formula palpale** = _da 1,2 a 5,3_ AND **Forma del peziolo e postpeziolo** = _cubico_  (gap: 0.150)
  - **Porzioni laterali del clipeo** = _non rialzato a cresta davanti alle inserzioni antennali_ AND **Lati del pronoto** = _angolare, vista dorsale_  (gap: 0.500)
  - **Lati del pronoto** = _angolare, vista dorsale_ AND **Forma del peziolo e postpeziolo** = _cubico_  (gap: 0.500)
  - **Lati del pronoto** = _angolare, vista dorsale_ AND **Pungiglione** = _...senza appendice apico-dorsale_  (gap: 0.500)
  - **Speroni delle tibie medie e posteriori** = _semplice o assente_ AND **Forma del peziolo e postpeziolo** = _cubico_  (gap: 0.150)

#### _Myrmica_

- **ID:** `myrmica`
- **Caratteri con dato:** 19 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 8 su 10 totali trovate):
  - **Segmenti della clava antennale** = _3_ AND **Formula palpale** = _6,4_  (gap: 0.400)
  - **Dentatura mandibolare** = _tra 6 e 9_ AND **Formula palpale** = _6,4_  (gap: 0.400)
  - **Dentatura mandibolare** = _10 o piu_ AND **Forma del peziolo e postpeziolo** = _cubico_  (gap: 0.150)
  - **Formula palpale** = _6,4_ AND **Propodeo** = _con denti o spine_  (gap: 0.500)
  - **Formula palpale** = _6,4_ AND **Forma del peziolo e postpeziolo** = _non cubico_  (gap: 0.150)
  - **Formula palpale** = _6,4_ AND **Forma del peziolo e postpeziolo** = _cubico_  (gap: 0.150)
  - **Lati del pronoto** = _arrotondato, vista dorsale_ AND **Forma del peziolo e postpeziolo** = _cubico_  (gap: 0.150)
  - **Propodeo** = _con denti o spine_ AND **Speroni delle tibie medie e posteriori** = _pettinato_  (gap: 0.500)

#### _Strongylognathus_

- **ID:** `strongylognathus`
- **Caratteri con dato:** 18 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 8 su 11 totali trovate):
  - **Forma del capo** = _non triangolare_ AND **Forma delle mandibole** = _stretto e allungato, a sciabola_  (gap: 0.400)
  - **Segmenti della clava antennale** = _3_ AND **Forma delle mandibole** = _stretto e allungato, a sciabola_  (gap: 0.400)
  - **Forma delle mandibole** = _stretto e allungato, a sciabola_ AND **Formula palpale** = _da 1,2 a 5,3_  (gap: 0.400)
  - **Forma delle mandibole** = _stretto e allungato, a sciabola_ AND **Porzioni laterali del clipeo** = _rialzato a cresta davanti alle inserzioni antennali_  (gap: 0.400)
  - **Forma delle mandibole** = _stretto e allungato, a sciabola_ AND **Forma del peziolo e postpeziolo** = _non cubico_  (gap: 0.400)
  - **Forma delle mandibole** = _stretto e allungato, a sciabola_ AND **Superficie ventrale del peziolo e postpeziolo** = _al massimo con un piccolo dente o lobo_  (gap: 0.400)
  - **Forma delle mandibole** = _stretto e allungato, a sciabola_ AND **Postpeziolo, vista dorsale** = _largo quanto o poco piu del peziolo_  (gap: 0.400)
  - **Forma delle mandibole** = _stretto e allungato, a sciabola_ AND **Pungiglione** = _...con appendice apico-dorsale, triangolare_  (gap: 0.400)

#### _Temnothorax_

- **ID:** `temnothorax`
- **Caratteri con dato:** 19 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 2 su 2 totali trovate):
  - **Numero di segmenti antennali** = _12_ AND **Dentatura mandibolare** = _5_  (gap: 0.150)
  - **Numero di segmenti antennali** = _12_ AND **Superficie ventrale del peziolo e postpeziolo** = _con dente o lobo ben sviluppato_  (gap: 0.400)

#### _Tetramorium_

- **ID:** `tetramorium`
- **Caratteri con dato:** 19 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 8 su 10 totali trovate):
  - **Forma delle mandibole** = _triangolare_ AND **Porzioni laterali del clipeo** = _rialzato a cresta davanti alle inserzioni antennali_  (gap: 0.400)
  - **Dentatura mandibolare** = _tra 6 e 9_ AND **Porzioni laterali del clipeo** = _rialzato a cresta davanti alle inserzioni antennali_  (gap: 0.150)
  - **Dentatura mandibolare** = _tra 6 e 9_ AND **Pungiglione** = _...con appendice apico-dorsale, triangolare_  (gap: 0.150)
  - **Dentatura mandibolare** = _10 o piu_ AND **Porzioni laterali del clipeo** = _rialzato a cresta davanti alle inserzioni antennali_  (gap: 0.150)
  - **Dentatura mandibolare** = _10 o piu_ AND **Lati del pronoto** = _angolare, vista dorsale_  (gap: 0.500)
  - **Dentatura mandibolare** = _10 o piu_ AND **Pungiglione** = _...con appendice apico-dorsale, triangolare_  (gap: 0.150)
  - **Porzioni laterali del clipeo** = _rialzato a cresta davanti alle inserzioni antennali_ AND **Lati del pronoto** = _angolare, vista dorsale_  (gap: 0.500)
  - **Porzioni laterali del clipeo** = _rialzato a cresta davanti alle inserzioni antennali_ AND **Propodeo** = _con denti o spine_  (gap: 0.500)

#### _Leptothorax_

- **ID:** `leptothorax`
- **Caratteri con dato:** 18 su 39
- **Profondità minima per identificazione univoca:** 3 carattere/i
- **Nessun singolo carattere o coppia lo identifica.** Triple minime trovate (prime 2 di 2):
  - **Numero di segmenti antennali** = _11_ AND **Dentatura mandibolare** = _tra 6 e 9_ AND **Superficie ventrale del peziolo e postpeziolo** = _al massimo con un piccolo dente o lobo_  (gap: 0.100)
  - **Numero di segmenti antennali** = _11_ AND **Dentatura mandibolare** = _tra 6 e 9_ AND **Pungiglione** = _...senza appendice apico-dorsale_  (gap: 0.100)

#### _Pheidole_

- **ID:** `pheidole`
- **Caratteri con dato:** 19 su 39
- **Profondità minima per identificazione univoca:** 3 carattere/i
- **Nessun singolo carattere o coppia lo identifica.** Triple minime trovate (prime 1 di 1):
  - **Segmenti della clava antennale** = _3_ AND **Dentatura mandibolare** = _tra 6 e 9_ AND **Propodeo** = _senza denti o spine_  (gap: 0.100)

#### _Stenamma_

- **ID:** `stenamma`
- **Caratteri con dato:** 19 su 39
- **Profondità minima per identificazione univoca:** — (non raggiungibile)
- **Stato:** ⚠️ **NON RAGGIUNGIBILE UNIVOCAMENTE** — vedi sommario.
- **Genere/i che lo "bloccano":** pheidole

  **Pari merito persistente con il profilo completo:** _Pheidole_, _Stenamma_.

### Sottofamiglia Formicinae

#### _Cataglyphis_

- **ID:** `cataglyphis`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **4° articolo del palpo mascellare** = _...circa il doppio del 5o_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Colobopsis_

- **ID:** `colobopsis`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Casta soldato con capo troncato** = _presente_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Formica_

- **ID:** `formica`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Formula palpale** = _5,4_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Lepisiota_

- **ID:** `lepisiota`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Propodeo** = _armato con 2 denti_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Polyergus_

- **ID:** `polyergus`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (3):
  - **Formula palpale** = _4,2_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Forma delle mandibole** = _falciforme_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Denti mandibolari** = _solo dente apicale_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Camponotus_

- **ID:** `camponotus`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 2 su 2 totali trovate):
  - **Casta soldato con capo troncato** = _assente_ AND **Inserzione delle antenne** = _distante dal margine posteriore del clipeo_  (gap: 0.500)
  - **Denti mandibolari** = _>=7_ AND **Inserzione delle antenne** = _distante dal margine posteriore del clipeo_  (gap: 0.500)

#### _Plagiolepis_

- **ID:** `plagiolepis`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 1 su 1 totali trovate):
  - **Numero di segmenti antennali** = _11_ AND **Propodeo** = _arrotondato_  (gap: 0.500)

#### _Lasius_

- **ID:** `lasius`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** — (non raggiungibile)
- **Stato:** ⚠️ **NON RAGGIUNGIBILE UNIVOCAMENTE** — vedi sommario.
- **Genere/i che lo "bloccano":** formica

  **Pari merito persistente con il profilo completo:** _Formica_, _Lasius_.

#### _Nylanderia_

- **ID:** `nylanderia`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** — (non raggiungibile)
- **Stato:** ⚠️ **NON RAGGIUNGIBILE UNIVOCAMENTE** — vedi sommario.
- **Genere/i che lo "bloccano":** prenolepis, paratrechina

  **Pari merito persistente con il profilo completo:** _Nylanderia_, _Paratrechina_, _Prenolepis_.

#### _Paratrechina_

- **ID:** `paratrechina`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** — (non raggiungibile)
- **Stato:** ⚠️ **NON RAGGIUNGIBILE UNIVOCAMENTE** — vedi sommario.
- **Genere/i che lo "bloccano":** prenolepis, nylanderia

  **Pari merito persistente con il profilo completo:** _Nylanderia_, _Paratrechina_, _Prenolepis_.

#### _Prenolepis_

- **ID:** `prenolepis`
- **Caratteri con dato:** 8 su 39
- **Profondità minima per identificazione univoca:** — (non raggiungibile)
- **Stato:** ⚠️ **NON RAGGIUNGIBILE UNIVOCAMENTE** — vedi sommario.
- **Genere/i che lo "bloccano":** nylanderia, paratrechina

  **Pari merito persistente con il profilo completo:** _Nylanderia_, _Paratrechina_, _Prenolepis_.

### Sottofamiglia Dolichoderinae

#### _Bothriomyrmex_

- **ID:** `bothriomyrmex`
- **Caratteri con dato:** 7 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (2):
  - **Colore** = _bicolore senza parti rosse o rossastre_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Formula palpale** = _4,3_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Dolichoderus_

- **ID:** `dolichoderus`
- **Caratteri con dato:** 7 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (2):
  - **Tegumento del capo e del mesosoma** = _spesso e con scultura marcata_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Macchie gialle sul gastro** = _presente, sui primi 2 tergiti_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Liometopum_

- **ID:** `liometopum`
- **Caratteri con dato:** 7 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Peli eretti sul pronoto** = _presente_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Tapinoma_

- **ID:** `tapinoma`
- **Caratteri con dato:** 7 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (2):
  - **Margine anteriore del clipeo** = _distintamente inciso medialmente_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Squama peziolare** = _virtualmente assente_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Linepithema_

- **ID:** `linepithema`
- **Caratteri con dato:** 7 su 39
- **Profondità minima per identificazione univoca:** 3 carattere/i
- **Nessun singolo carattere o coppia lo identifica.** Triple minime trovate (prime 2 di 2):
  - **Colore** = _uniformemente da bruno a nero_ AND **Formula palpale** = _6,4_ AND **Margine anteriore del clipeo** = _intero_  (gap: 0.333)
  - **Colore** = _uniformemente da bruno a nero_ AND **Formula palpale** = _6,4_ AND **Squama peziolare** = _ben sviluppato_  (gap: 0.333)

### Sottofamiglia Ponerinae

#### _Cryptopone_

- **ID:** `cryptopone`
- **Caratteri con dato:** 5 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (3):
  - **Margine masticatorio della mandibola** = _con circa 7-9 denti separati_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Speroni della tibia posteriore** = _due speroni: uno semplice, uno pettinato_  (gap dal 2°: 0.800, generi rimasti in lista: 43)
  - **Tibia media** = _con setole spiniformi sulla superficie esterna_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Ponera_

- **ID:** `ponera`
- **Caratteri con dato:** 5 su 39
- **Profondità minima per identificazione univoca:** 1 carattere/i
- **Identificazione con 1 carattere — opzioni univoche** (1):
  - **Processo subpeziale** = _con una macchia circolare translucida sottile anteriormente e posteriormente a forma di dente_  (gap dal 2°: 0.800, generi rimasti in lista: 43)

#### _Hypoponera_

- **ID:** `hypoponera`
- **Caratteri con dato:** 5 su 39
- **Profondità minima per identificazione univoca:** 3 carattere/i
- **Nessun singolo carattere o coppia lo identifica.** Triple minime trovate (prime 3 di 3):
  - **Colore** = _testaceo_ AND **Margine masticatorio della mandibola** = _pochi denti ben definiti, il margine restante per lo piu finemente seghettato_ AND **Processo subpeziale** = _a lobo_  (gap: 0.333)
  - **Colore** = _testaceo_ AND **Speroni della tibia posteriore** = _un singolo sperone pettinato_ AND **Processo subpeziale** = _a lobo_  (gap: 0.333)
  - **Colore** = _testaceo_ AND **Tibia media** = _senza setole spiniformi sulla superficie esterna_ AND **Processo subpeziale** = _a lobo_  (gap: 0.333)

#### _Brachyponera_

- **ID:** `brachyponera`
- **Caratteri con dato:** 5 su 39
- **Profondità minima per identificazione univoca:** — (non raggiungibile)
- **Stato:** ⚠️ **NON RAGGIUNGIBILE UNIVOCAMENTE** — vedi sommario.
- **Genere/i che lo "bloccano":** hypoponera

  **Pari merito persistente con il profilo completo:** _Brachyponera_, _Hypoponera_.

### Sottofamiglia Amblyoponinae

#### _Stigmatomma_

- **ID:** `stigmatomma`
- **Caratteri con dato:** 6 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 2 su 2 totali trovate):
  - **Forma delle mandibole** = _stretto e allungato, a sciabola_ AND **Dentatura mandibolare** = _tra 6 e 9_  (gap: 0.150)
  - **Forma delle mandibole** = _stretto e allungato, a sciabola_ AND **Speroni delle tibie medie e posteriori** = _pettinato_  (gap: 0.500)

### Sottofamiglia Proceratiinae

#### _Proceratium_

- **ID:** `proceratium`
- **Caratteri con dato:** 7 su 39
- **Profondità minima per identificazione univoca:** 3 carattere/i
- **Nessun singolo carattere o coppia lo identifica.** Triple minime trovate (prime 1 di 1):
  - **Segmenti della clava antennale** = _3_ AND **Propodeo** = _senza denti o spine_ AND **Speroni delle tibie medie e posteriori** = _pettinato_  (gap: 0.267)

### Sottofamiglia Leptanillinae

#### _Leptanilla_

- **ID:** `leptanilla`
- **Caratteri con dato:** 5 su 39
- **Profondità minima per identificazione univoca:** — (non raggiungibile)
- **Stato:** ⚠️ **NON RAGGIUNGIBILE UNIVOCAMENTE** — vedi sommario.
- **Genere/i che lo "bloccano":** aphaenogaster

  **Pari merito persistente con il profilo completo:** _Aphaenogaster_, _Leptanilla_.

### Sottofamiglia Dorylinae

#### _Dorylus_

- **ID:** `dorylus`
- **Caratteri con dato:** 6 su 39
- **Profondità minima per identificazione univoca:** 2 carattere/i
- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime 2 su 2 totali trovate):
  - **Segmenti della clava antennale** = _indistinta_ AND **Dentatura mandibolare** = _tra 6 e 9_  (gap: 0.400)
  - **Segmenti della clava antennale** = _indistinta_ AND **Speroni delle tibie medie e posteriori** = _pettinato_  (gap: 0.400)

---

## Raccomandazioni operative

Per "sbloccare" gli 8 generi non raggiungibili occorre **aggiungere caratteri o stati alla matrice** (non basta correggere quelli esistenti). Le minime modifiche concettualmente necessarie:

### Trio _Prenolepis_ / _Nylanderia_ / _Paratrechina_ (formicinae)

I tre generi sono attualmente codificati con **valori identici per tutti gli 8 caratteri della scope formicinae**. Servono almeno **due nuovi caratteri** (o stati distinti per ciascun genere su un carattere esistente) per separarli completamente. Spunti morfologici reali:
- _Prenolepis_: profilo del mesosoma con propodeo "incurvato" e pronoto rilevato (carattere unico tra i tre).
- _Nylanderia_: presenza di setae erette pari (paired macrochaetae) sul dorso del capo e mesosoma; clipeo con peli prominenti.
- _Paratrechina_: profilo del mesosoma uniforme, pubescenza più rada; peli mandibolari corti.

### _Lasius_ vs _Formica_

Differiscono solo su gen-34 (formula palpale: _Formica_ 6,4 / _Lasius_ 6,4 ridotta), ma _Lasius_=0 è **sottoinsieme** di _Formica_=0,2. Servirebbe almeno un altro carattere a "vantaggio" di _Lasius_ — per esempio:
- **Dimensione corporea relativa**: _Formica_ tipicamente >5mm; _Lasius_ <5mm.
- **Forma del propodeo**: declivio più ripido in _Lasius_.
- **Setole erette sul gastro**: assenti in _Lasius niger_-group, presenti in _Formica_.

### _Stenamma_ vs _Pheidole_

Differiscono solo su gen-12 (Lati del pronoto), con _Stenamma_=1 ⊂ _Pheidole_=0,1. _Pheidole_ ha la casta soldato (major), che è il vero diagnostico, ma il carattere "casta soldato con capo troncato" è codificato solo come gen-33 nella scope **formicinae** (anomalia: ne servirebbe uno omologo nella scope myrmicinae).

### _Brachyponera_ vs _Hypoponera_

Differiscono solo su gen-21 (Colore), _Brachyponera_=1 ⊂ _Hypoponera_=0,1. Servirebbe un carattere di taglia (Brachyponera è ~2× più grande) o di scolpitura del capo.

### _Proceratium_ e _Leptanilla_

Entrambi hanno profili "ridotti" (5–7 caratteri) tutti dominati. Soluzione concettuale: **creare caratteri propri della loro sottofamiglia** (gen-XX scope=proceratiinae, gen-XX scope=leptanillinae) con stati diagnostici come:
- _Proceratium_: secondo tergite del gastro fortemente arcuato verso il basso (carattere diagnostico classico).
- _Leptanilla_: assenza di occhi composti + corpo filiforme depigmentato + lobi frontali ridotti (combinazione unica).

Lo stesso vale, in misura minore, per _Stigmatomma_ (Amblyoponinae) e _Dorylus_ (Dorylinae): attualmente **raggiungibili** ma solo via caratteri myrmicinae, quindi senza la protezione della "subfamily-aware penalization".

---

## Validazione indipendente

Le cinque conclusioni più sensibili sono state cross-controllate da un secondo agente che ha letto direttamente `matrix.json` e `characters.json` senza usare il simulatore. Tutte e cinque sono risultate **VERIFICATE**:

1. ✅ _Prenolepis_, _Nylanderia_, _Paratrechina_ hanno entry identiche byte-per-byte sui caratteri `gen-33..gen-40`.
2. ✅ `lasius` è dominato da `formica`: solo `gen-34` differisce (`['0']` ⊂ `['0','2']`).
3. ✅ Le quattro coppie di dominanza (stenamma/pheidole, brachyponera/hypoponera, proceratium/myrmecina, leptanilla/aphaenogaster) sono tutte confermate.
4. ✅ `gen-2` ha zero entry in `matrix.json`.
5. ✅ `strumigenys/gen-14 = "2"` è un valore orfano (gen-14 ha solo stati `0` e `1`).

---

## Riproducibilità

Lo stato della matrice in fase di analisi è bloccato dal commit `<HEAD del branch>`. Per rieseguire dopo modifiche ai dati:

```bash
cd tools/key-audit
node sanity.mjs       # integrità dati
node discriminate.mjs # genera report-data.json
node deep-search.mjs  # diagnostica generi bloccati
node build-report.mjs # rigenera questo file
```

Il file `report-data.json` è il "ground truth" granulare (tutte le combinazioni trovate per ogni genere) e può essere comparato fra commit per identificare regressioni quando si modificano `characters.json` o `matrix.json`.
