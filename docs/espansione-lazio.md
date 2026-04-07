# Espansione a specie del Lazio — Piano e ricerca

Ricerca effettuata il 2026-04-05.

## Stima specie Lazio

- **Italia totale**: 267 specie (Schifani 2022)
- **Roma (attuale DB)**: 75 specie
- **Stima Lazio**: 100-130 specie
- **Specie da aggiungere**: circa 25-55 rispetto alle 75 di Roma

Roma probabilmente copre il 55-75% della diversita laziale. Il Lazio aggiunge habitat non presenti in citta: montani (Rieti, Simbruini), costieri (Pontino), foreste di faggio.

## Fonte dati principale

**Schifani 2022** — supplementary dataset con presenza/assenza per regione:
- Scaricabile da: https://dataportal.lifewatchitaly.eu/data (filtro: Region = Lazio, Family = Formicidae)
- Oppure: PDF supplementare al paper https://escholarship.org/uc/item/48m6k64c
- Regione codificata come "LAZ" nel dataset

## Altre fonti

| Fonte | URL |
|-------|-----|
| FaunaItalia Checklist | https://www.faunaitalia.it/checklist/ |
| AntWiki Italy | https://antwiki.org/wiki/Italy |
| Antmaps.org | https://antmaps.org/ |
| iNaturalist Lazio | https://www.inaturalist.org/places/lazio |

## Fattibilita: MODERATA

**Cosa si puo fare subito:**
1. Estrarre la lista specie Lazio dal dataset Schifani 2022
2. La chiave a livello di genere copre gia tutti i 39 generi italiani
3. Le foto AntWeb esistono probabilmente per la maggior parte delle specie aggiuntive

**Sfide:**
- Aggiungere 25-55 specie alla matrice NEXUS (definire stati caratteri per ciascuna)
- Alcune specie montane/alpine possono richiedere caratteri nuovi
- Validazione idealmente da un esperto
- Copertura fotografica da verificare

## Approccio consigliato

1. **Fase 1**: Scaricare lista Lazio da Schifani 2022, identificare le specie aggiuntive
2. **Fase 2**: Per ogni specie aggiuntiva, cercare foto AntWeb e compilare scheda base
3. **Fase 3**: Aggiungere le specie al JSON (senza matrice specie-level inizialmente)
4. **Fase 4**: Gradualmente costruire la matrice di caratteri per le nuove specie
