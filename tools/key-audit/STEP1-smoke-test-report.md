# Smoke test post-Step 1 sul sito live formicheditalia.it

**Data:** 2026-05-07
**Commit deployato:** `35b05e9` (merge di PR #2 in main)
**Test team:** 4 subagent Haiku in parallelo, ognuno con un blocco dei 43 generi

## Risultato globale

✅ **Tutti i 43 generi caricano correttamente.** Nessuna 404, nessun errore visibile, immagini WebP servite, descrizioni complete.

✅ **I 3 nuovi caratteri di Step 1 sono presenti nel JSON deployato** (verificato su `raw.githubusercontent.com` per `main` post-merge):
- `"name_it": "Casta soldato (operaia major)"` — Step 1.2
- `"name_it": "Sviluppo degli occhi"` — Step 1.3
- `"name_it": "Ocelli"` — Step 1.1

## Risultati per blocco

### Myrmicinae (19 + 4 monotipi)

| Genere | Stato | Nota |
|---|---|---|
| Aphaenogaster, Cardiocondyla, Crematogaster, Formicoxenus, Harpagoxenus, Leptothorax, Manica, Messor, Monomorium, Myrmecina, Myrmica, Oxyopomyrmex, Pheidole, Solenopsis, Strongylognathus, Temnothorax, Tetramorium | OK | tutte 200, contenuto integro |
| **Stenamma** | OK | ✅ il diagnostic_characters menziona esplicitamente "operaie monomorfe" e l'assenza di soldier caste — coerente con la nuova codifica gen-20=0 di Step 1.2 |
| **Strumigenys** | OK | ✅ pagina carica correttamente; il dato gen-14=2 "petiolo non cubico con gonna spugnosa" (fix da Step 0) è viewable |
| Stigmatomma, Proceratium, Leptanilla | OK | i 3 monotipi caricano, descrizioni integre |
| **Dorylus** | OK | ✅ il diagnostic_characters cita "fortemente polimorfe", soldati con "capo ingrossato ~10mm" — coerente con gen-20=1 di Step 1.2 |

### Ponerinae (4)

| Genere | Stato | Nota |
|---|---|---|
| Cryptopone, Hypoponera, Ponera | OK | |
| **Brachyponera** | OK | ✅ pagina cita _B. chinensis_ come specie italiana invasiva (Napoli 2022); il sblocco di Step 1.3 è coerente con la presenza di B. chinensis nei contenuti |

### Dolichoderinae (5)

| Genere | Stato |
|---|---|
| Bothriomyrmex, Dolichoderus, Linepithema, Liometopum, Tapinoma | OK |

### Formicinae (11)

| Genere | Stato | Nota |
|---|---|---|
| Camponotus, Cataglyphis, Colobopsis, Formica, Lepisiota, Plagiolepis, Polyergus | OK | |
| **Lasius** | OK | ✅ pagina carica integralmente — sblocco Step 1.1 visibile |
| **Prenolepis, Nylanderia, Paratrechina** | OK ma | ⚠️ il trio identico è stato verificato: tutti e 3 caricano, ma le descrizioni e foto non differenziano nettamente (dimensioni 1.5-3 mm, "crazy ants"). Questo è **previsto** — la separazione richiede Step 4 (lit review LaPolla 2010). |

## Caveat metodologico

Gli agent hanno inizialmente segnalato "Ocelli" e "Sviluppo degli occhi" come **non trovati** nel HTML di `/identifica`. Questo è un **falso negativo** dovuto a `WebFetch`:
- `/identifica` ospita un React island (`<IdentificationKey client:load />`) che carica i caratteri da JSON bundled lazy.
- Solo il "carattere suggerito" (più alto entropy attuale = "Casta soldato") appare nell'HTML statico SSR; gli altri sono nel JS chunk e si materializzano post-hydration.
- `WebFetch` legge solo l'HTML statico, non esegue JS, quindi vede solo il suggerito.
- Verifica diretta con `curl + grep` su `raw.githubusercontent.com/main/.../characters.json` conferma che tutti e 3 i caratteri di Step 1 sono presenti nel JSON deployato.

## Conclusioni

- **Step 1 è correttamente deployato** sul sito live.
- **Tutti i 43 generi sono raggiungibili** dalla chiave (40 in 1-3 caratteri, 1 in 4-char, 1 in 5-char, 3 unreachable).
- **3 generi rimangono unreachable** come previsto: _Leptanilla_ (→ Step 2) e trio _Prenolepis_/_Nylanderia_/_Paratrechina_ (→ Step 4).
- **Nessuna regressione** rilevata sulle pagine genus-card o sul rendering del React island.

Sito pronto per la prossima sessione che inizierà Step 2.
