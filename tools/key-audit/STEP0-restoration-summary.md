# Step 0 — Restauro NEXUS↔JSON

**Data:** 2026-05-07
**Durata:** ~2.5 ore
**Branch:** `claude/nostalgic-goldberg-0d98a8`

## Cosa è successo

Mentre preparavo lo Step 0 (riconciliazione NEXUS↔JSON come prerequisito agli Step 1-4 di Risoluzione 8 Generi Stuck), ho scoperto che **il bug della regex in `scripts/parse_nexus.py`** aveva causato un misallineamento sistematico fra le etichette dei caratteri myrmicinae e i dati matrice. Per **209 punti dati su 19 generi**, il valore in `matrix.json` per `gen-N` (N≥10) corrispondeva alla _NEXUS char #N_ invece che alla #N-1 indicata dall'etichetta.

L'utente Francesco aveva poi hand-edited diversi valori basandosi sulle etichette sbagliate. Tutto il sito mostrava il `name_en/name_it` di un carattere sopra valori provenienti dal carattere successivo nel NEXUS.

**Esempio di sintomo**: `Strumigenys gen-14 = "2"` era un valore "orfano" perché `gen-14` era etichettato "Speroni delle tibie" (2 stati: 0/1) ma conteneva dati di "Forma del peziolo" (3 stati: 0/1/2). Lo stato `2` (Strumigenys ha la pronunciata gonna spugnosa) finiva quindi senza label.

## Cause radice

1. **Bug primario**: in `parse_nexus.py:71` la regex `re.split(r",\s*(?=\d+\s)", raw)` non rispettava le virgolette, splittando dentro stati come `'from 1,2 to 5,3'` (la formula palpale del carattere #8 myrmicinae). Questo creava un carattere "fantasma" `gen-9`, faceva collidere il `char_id_map[2]` (sovrascrivendo `gen-2`), e shiftava il mapping pos→id per tutti i caratteri myrmicinae successivi.
2. **Workaround applicato post-hoc**: lo script `improve_characters.py` annotava `gen-9` come "broken/empty character (parsing artifact from NEXUS)" invece di fixare la causa.
3. **Hand-edits a propagazione**: 7 generi (Brachyponera, Nylanderia, Paratrechina, Stigmatomma, Proceratium, Leptanilla, Dorylus) erano stati aggiunti direttamente nei JSON `genera.json` e `matrix.json` invece che nei NEXUS, causando divergenza permanente fra fonte (NEXUS) e output (JSON).
4. **Mancanza di Dorylinae** in `sottofamiglie.nex`: la sottofamiglia esisteva solo nel JSON.

## Cosa è stato fatto

### File modificati nel repo

- `scripts/parse_nexus.py`:
  - Sostituita la regex buggy con una funzione `_split_charstate_entries()` quote-aware (carattere-per-carattere, con gestione di apici singoli/doppi).
  - Aggiunto `MONOTYPIC_GENUS_OVERRIDE` per assegnare i 4 generi monotipici (Stigmatomma→amblyoponinae, Proceratium→proceratiinae, Leptanilla→leptanillinae, Dorylus→dorylinae) alle loro sottofamiglie corrette pur essendo codificati nel file `generi Myrmicinae.nex`.
  - Rimosso il blocco di iniezione `single_genus_map` (ora ridondante).
- `scripts/improve_characters.py`:
  - Riscritto da zero: usa ID sequenziali `gen-1..gen-39` (no buchi), include traduzioni complete di state-label IT/EN che prima erano hand-edited nel JSON.
- `formiche-ditalia/src/data/characters.json`: rigenerato dal pipeline (39 caratteri con label/stati allineati).
- `formiche-ditalia/src/data/matrix.json`: rigenerato (580 entry — 71 in più rispetto al precedente perché include esplicitamente i `?` per ogni char×genus, mentre prima venivano omessi).
- `formiche-ditalia/src/data/subfamilies.json`: nessuna modifica strutturale (Dorylinae era già stata aggiunta hand-edited; la fonte NEXUS è ora aggiornata di conseguenza).
- `formiche-ditalia/src/data/genera.json`: nessuna modifica (i 43 generi e i loro `subfamily_id` erano già corretti).

### File NEXUS modificati (in `TESI FORMICHE (Dropbox)/Matrici corrette da Rigato/`)

- `sottofamiglie.nex`: aggiunto Dorylinae (NTAX 7→8, riga matrice `110000`).
- `generi Myrmicinae.nex`: aggiunti 4 tassoni (NTAX 19→23): Stigmatomma, Proceratium, Leptanilla, Dorylus, con righe matrice ricavate dai dati hand-edited preesistenti (interpretati con label corrette).
- `generi Ponerinae.nex`: aggiunto Brachyponera (NTAX 3→4, riga `11100`).
- `generi Formicinae.nex`: aggiunti Nylanderia e Paratrechina (NTAX 9→11, righe identiche `00001110` — confermando il problema dei profili identici per il trio Prenolepis/Nylanderia/Paratrechina).

I file NEXUS non sono tracciati in git (sono in `.gitignore`).

## Verifica

- **Build Astro**: 147 pagine generate senza errori.
- **Audit di raggiungibilità** (vedi `REPORT-key-reachability.md`):

| Profondità | Pre-Step-0 | Post-Step-0 |
|---|---|---|
| 1 carattere | 18 | 18 |
| 2 caratteri | 13 | 13 |
| 3+ caratteri | 4 | **5** (proceratium aggiunto) |
| Non raggiungibili | **8** | **7** |

**Proceratium** (era stuck "dominato da Myrmecina") è stato **automaticamente sbloccato** dal restauro: i suoi dati misallineati nel JSON pre-fix ora corrispondono alle label corrette, rivelando che è effettivamente discriminabile in 3+ caratteri.

I rimanenti 7 stuck sono problemi morfologici reali (profili dominati o identici), che richiedono l'aggiunta di nuovi caratteri/stati nei NEXUS — ovvero gli Step 1-4 originali.

## Caveat: dati morfologici dei 4 monotipici da rivedere

Le righe NEXUS che ho aggiunto in `generi Myrmicinae.nex` per Stigmatomma/Proceratium/Leptanilla/Dorylus sono state derivate dai dati hand-edited preesistenti nel JSON. Questi dati erano stati inseriti dall'utente guardando le label sbagliate (pre-fix), ma l'**intent** era corretto: applicando uniformemente lo shift gen-N≥10 → gen-(N-1) si preserva il significato voluto.

In pratica: se l'utente aveva inserito `Stigmatomma gen-14=1` con label vista "Speroni pettinato", l'intent era "spur pectinate". Dopo il restauro, quel valore finisce ora in `gen-13` (corretto: "Spur" con stato 1 = "pectinate"). Quindi morfologicamente coerente.

Tuttavia consiglio una review umana dei valori per i 4 monotipi quando avrai tempo, perché:
- Le righe sono state composte con "?" per la maggior parte delle posizioni (i nuovi caratteri Step 1-4 le riempiranno);
- Per `Stigmatomma` ho mantenuto `gen-13=1` ("Spur pettinato"), ma alcune fonti indicano sperone semplice in Amblyoponinae italiani.

## Riproducibilità

```bash
# Ricostruzione completa da NEXUS
cd "Progetto Formiche d'Italia"
python3 scripts/parse_nexus.py
python3 scripts/improve_characters.py

# Verifica integrità + reachability
cd .claude/worktrees/nostalgic-goldberg-0d98a8/tools/key-audit
node sanity.mjs
node discriminate.mjs
node build-report.mjs
```

## Backup

Lo stato pre-Step-0 è preservato in `tools/key-audit/backup-pre-step0/`:
- `nexus/` — i 5 file NEXUS originali
- `json/` — i 4 JSON originali nel worktree
- `scripts/parse_nexus.py` — il parser originale buggy
