// Builds the final markdown report from report-data.json + extra deep analysis.
// Output: tools/key-audit/REPORT-key-reachability.md
import { loadData, score, compatibleSelections, selectionToString } from './simulator.mjs';
import fs from 'node:fs';

const TOLERANCE = 1;
const { characters, matrix, genera, subfamilies, matrixLookup, charById } = loadData();

const compat = {};
for (const g of genera) compat[g.id] = compatibleSelections(g.id, matrixLookup);

function rank(selections) {
  return score(selections, genera, matrixLookup, charById, TOLERANCE);
}

const reportData = JSON.parse(fs.readFileSync(new URL('./report-data.json', import.meta.url)));
const reportById = Object.fromEntries(reportData.map(r => [r.genus, r]));

// Subfamily groups
const subById = Object.fromEntries(subfamilies.map(s => [s.id, s]));
const generaBySub = {};
for (const g of genera) {
  if (!generaBySub[g.subfamily_id]) generaBySub[g.subfamily_id] = [];
  generaBySub[g.subfamily_id].push(g);
}

// Helper: compute who dominates a genus (any genus G' where G's profile ⊆ G' profile pointwise)
// "Profile entry": for each character C, the set of accepted state values.
// G' dominates G iff: for every char C where G has a real entry, G' also has a real entry AND G[C] ⊆ G'[C].
function profileMap(gid) {
  const m = matrixLookup[gid] || {};
  const out = {};
  for (const [c, v] of Object.entries(m)) if (!v.includes('?')) out[c] = new Set(v);
  return out;
}
function dominates(byProf, ofProf) {
  // Returns true if `byProf` dominates `ofProf`
  for (const [c, vs] of Object.entries(ofProf)) {
    const dom = byProf[c];
    if (!dom) return false;
    for (const v of vs) if (!dom.has(v)) return false;
  }
  return true;
}
const profMap = Object.fromEntries(genera.map(g => [g.id, profileMap(g.id)]));
const dominators = {}; // genusId -> [dominators]
for (const g of genera) {
  dominators[g.id] = [];
  for (const g2 of genera) {
    if (g.id === g2.id) continue;
    if (dominates(profMap[g2.id], profMap[g.id])) {
      // Also G' must have at least one real entry that G doesn't, OR same set (twin).
      dominators[g.id].push(g2.id);
    }
  }
}

// Format helpers
function escMd(s) { return s.replace(/\|/g, '\\|'); }
function fmtSel(sel) {
  const c = charById[sel.characterId] || charById[sel.char];
  const cid = sel.characterId || sel.char;
  const val = sel.value ?? sel.val;
  const st = c?.states.find(s => s.value === val);
  return `**${c?.name_it || cid}** = _${st?.label_it || val}_`;
}

let md = '';

md += `# Audit di raggiungibilità della chiave multi-access\n\n`;
md += `**Data:** ${new Date().toISOString().split('T')[0]}  \n`;
md += `**Algoritmo replicato da:** \`formiche-ditalia/src/components/IdentificationKey.tsx\`  \n`;
md += `**Strumenti:** \`tools/key-audit/\` (simulator.mjs, discriminate.mjs, deep-search.mjs)  \n`;
md += `**Tolleranza usata:** \`maxMismatches = 1\` (default UI)  \n`;
md += `**Genere considerato "raggiungibile":** posto al primo posto della classifica (con score strettamente maggiore del secondo) per almeno una combinazione di caratteri/stati con cardinalità ≤ 5.\n\n`;
md += `---\n\n`;

md += `## Sommario esecutivo\n\n`;
const depthCounts = { 1: 0, 2: 0, 3: 0, unreachable: 0 };
for (const r of reportData) {
  if (r.discriminationDepth === 1) depthCounts[1]++;
  else if (r.discriminationDepth === 2) depthCounts[2]++;
  else if (r.discriminationDepth === 3) depthCounts[3]++;
  else depthCounts.unreachable++;
}
md += `| Profondità minima per identificazione univoca | Numero di generi |\n`;
md += `|---|---|\n`;
md += `| 1 carattere ⇒ univoco | ${depthCounts[1]} |\n`;
md += `| 2 caratteri ⇒ univoco (1 non basta) | ${depthCounts[2]} |\n`;
md += `| 3 caratteri ⇒ univoco (1–2 non bastano) | ${depthCounts[3]} |\n`;
md += `| **NON raggiungibili univocamente** (anche con 5 caratteri) | **${depthCounts.unreachable}** |\n`;
md += `| **Totale** | **${reportData.length}** |\n\n`;

md += `### Generi non raggiungibili univocamente\n\n`;
md += `Questi generi **non possono mai essere posti come unico vincitore** della chiave: ogni combinazione di caratteri/stati che li rende compatibili rende compatibile *anche* almeno un altro genere con score identico.\n\n`;
md += `| Genere | Sottofamiglia | "Bloccato da" | Motivo strutturale |\n`;
md += `|---|---|---|---|\n`;

const stuckMap = {
  'leptanilla': { dominator: 'aphaenogaster', reason: 'Profilo ridotto e dominato: Leptanilla ha dati per soli 5 caratteri myrmicinae; per ognuno i suoi stati sono sottoinsieme di quelli di Aphaenogaster. Manca un carattere diagnostico univoco (assenza di occhi composti, lobi frontali ridotti — non codificati nella chiave attuale; pianificato per Step 2: introduzione di caratteri scope=leptanillinae).' },
  'nylanderia': { dominator: 'paratrechina', reason: 'Profili **identici**: Nylanderia e Paratrechina hanno la stessa identica matrice di stati per tutti i 9 caratteri formicinae attuali (incluso il nuovo "Ocelli" da Step 1.1). Sono **indistinguibili** dalla chiave attuale. Lo Step 4 affronterà questo trio con literature review (LaPolla 2010, Williams & LaPolla).' },
  'paratrechina': { dominator: 'nylanderia', reason: 'Profili identici (vedi Nylanderia).' },
};

const stuckOrder = ['nylanderia', 'paratrechina', 'leptanilla'];
for (const id of stuckOrder) {
  const g = genera.find(x => x.id === id);
  const info = stuckMap[id];
  md += `| _${g.scientific_name}_ | ${g.subfamily_id} | ${info.dominator} | ${info.reason} |\n`;
}
md += `\n`;

md += `### Anomalie strutturali rilevate\n\n`;
md += `1. **Le 4 sottofamiglie monotipiche** (Amblyoponinae, Proceratiinae, Leptanillinae, Dorylinae) **non hanno caratteri propri**: i loro generi (_Stigmatomma, Proceratium, Leptanilla, Dorylus_) usano caratteri della scope myrmicinae. Conseguenza: la "subfamily-aware penalization" funziona solo per le 4 sottofamiglie con caratteri scoped, mentre i generi monotipici concorrono come "out-of-scope" rispetto alla penalizzazione anche quando l'utente sta selezionando i loro caratteri.\n`;
md += `2. **Coppie/triple di profili identici o dominati**: vedi sezione "Generi non raggiungibili univocamente". Ogni coppia dominata richiede l'aggiunta di almeno un nuovo carattere (o stato) per essere risolvibile.\n`;
md += `3. **Caratteri inter-sottofamiglia mancanti**: nessun carattere della matrice è "globale". Quindi la chiave **non può mai distinguere genericamente** tra (es.) un Myrmicinae e un Ponerinae sulla base di caratteri base come "numero di segmenti del peziolo": questo è gestito implicitamente dalla subfamily-scope.\n\n`;
md += `### Sblocchi dallo Step 1 (3 nuovi caratteri)\n\n`;
md += `Step 1 ha aggiunto 3 nuovi caratteri sourced (con citazione esatta da letteratura) per sbloccare 3 dei 6 generi rimasti unreachable post-Step-0:\n\n`;
md += `1. **Step 1.1 — \`gen-41 Ocelli\`** (scope formicinae): _Lasius_ ha "ocelli vestigiali" (Excel R52 fonte Mei) vs _Formica_ "ocelli ben sviluppati" (Excel R30 fonte Mei). _Lasius_ era unreachable, ora 3-char.\n`;
md += `2. **Step 1.2 — \`gen-20 Casta soldato (operaia major)\`** (scope myrmicinae): _Pheidole_ "specie molto polimorfe; nelle operaie medie e massime il capo è massiccio e quadrato" (Excel R297 fonte Mei) vs _Stenamma_ "specie monomorfe" (Excel R35 fonte Mei). _Stenamma_ era unreachable, ora 4-char. Bonus: _Pheidole_ passa da 3-char a 2-char.\n`;
md += `3. **Step 1.3 — \`gen-26 Sviluppo degli occhi\`** (scope ponerinae, 3 stati): _Brachyponera_ "Eye medium in size" (Chen et al. 2025) vs _Hypoponera_ "Eyes absent or present; when present always small (generally of 1 to about 20 ommatidia)" (Bolton & Fisher 2011). _Brachyponera_ era unreachable, ora **1-char**. Bonus: _Cryptopone_ ("vestigial to absent" per Schmidt & Shattuck 2014) e _Ponera_ (5-7 ommatidi) ora distinti tra loro.\n\n`;
md += `### Anomalie risolte dallo Step 0 di restauro\n\n`;
md += `1. **Bug del parser NEXUS** (\`re.split\` non rispettava i quote): produceva un carattere fantasma \`gen-9\` e shiftava tutti i dati matrice myrmicinae da \`gen-10\` in poi rispetto alle loro etichette. **209 punti dati su 19 generi avevano label sbagliata.** Risolto: la regex è ora quote-aware, gli ID sono sequenziali \`gen-1..gen-39\`.\n`;
md += `2. **Carattere \`gen-2\` ("Forma del capo") senza dati**: era un effetto collaterale del bug del parser (i dati venivano "rubati" dal carattere fantasma). Risolto: ora ha 19 entry per i Myrmicines.\n`;
md += `3. **Strumigenys/gen-14 = "2"**: era un valore orfano perché \`gen-14\` era etichettato "Speroni" (2 stati) ma conteneva dati di "Forma del peziolo" (3 stati). Risolto: \`gen-14\` ora è correttamente "Forma del peziolo e postpeziolo" e lo stato \`2\` è "non cubico, con una pronunciata gonna spugnosa alla base" — la classica caratteristica di Strumigenys.\n`;
md += `4. **Sottofamilia Dorylinae mancante** in \`subfamilies.json\` derivato da NEXUS: aggiunta in \`sottofamiglie.nex\`.\n`;
md += `5. **7 generi mancanti dal pipeline** (Brachyponera, Nylanderia, Paratrechina, Stigmatomma, Proceratium, Leptanilla, Dorylus erano hand-edited nel JSON): tutti aggiunti ai NEXUS Rigato; \`parse_nexus.py\` esteso con \`MONOTYPIC_GENUS_OVERRIDE\` per assegnare le 4 monotipi alle loro sottofamiglie corrette pur essendo nel file Myrmicinae.\n`;
md += `6. **\`Proceratium\`** che era classificato come "non raggiungibile" nell'audit pre-restauro è **automaticamente sbloccato** dal restauro (i suoi dati misallineati ora corrispondono alle label corrette).\n\n`;
md += `---\n\n`;

md += `## Metodologia\n\n`;
md += `Per ogni genere _G_:\n\n`;
md += `1. **Profilo compatibile** _S(G)_ — l'insieme delle coppie (carattere, stato) per cui la matrice marca _G_ come compatibile (esclusi i \`?\`).\n`;
md += `2. **Ricerca esaustiva** di tutti i sottoinsiemi di _S(G)_ di cardinalità 1 (e poi 2, 3, 4, 5 se necessario), con il vincolo "una sola selezione per carattere", e per ognuno si verifica se _G_ risulta unico vincitore della classifica (ovvero score strettamente maggiore del secondo classificato e nessuna parità in vetta).\n`;
md += `3. **"Profondità di discriminazione"** = la cardinalità minima per cui esiste almeno un sottoinsieme che identifica univocamente _G_.\n`;
md += `4. **Generi "non raggiungibili"** sono quelli per cui nessun sottoinsieme di cardinalità ≤ 5 funziona. Per questi è stato analizzato il profilo dominante (un altro genere il cui profilo include quello del genere considerato).\n\n`;
md += `Il punteggio è calcolato esattamente come in \`IdentificationKey.tsx\`: pesi entropy-based (qui semplificati a peso uniforme = 1, dato che la traiettoria di selezione non altera l'esito di compatibilità — solo l'ordinamento relativo dei punteggi pari, che qui contiamo come "non univoci"), penalizzazione "missing" 0.3 (in-scope) o 0.8 (out-of-scope), tolleranza 1 mismatch.\n\n`;

md += `---\n\n`;

md += `## Dettaglio per genere\n\n`;

const subOrder = ['myrmicinae', 'formicinae', 'dolichoderinae', 'ponerinae', 'amblyoponinae', 'proceratiinae', 'leptanillinae', 'dorylinae'];
for (const subId of subOrder) {
  if (!generaBySub[subId]) continue;
  const sub = subById[subId];
  md += `### Sottofamiglia ${sub.name}\n\n`;
  // Sort: reachable depth 1, 2, 3, then unreachable
  const sorted = [...generaBySub[subId]].sort((a, b) => {
    const da = reportById[a.id].discriminationDepth ?? 99;
    const db = reportById[b.id].discriminationDepth ?? 99;
    return da - db || a.scientific_name.localeCompare(b.scientific_name);
  });
  for (const g of sorted) {
    const r = reportById[g.id];
    md += `#### _${g.scientific_name}_\n\n`;
    md += `- **ID:** \`${g.id}\`\n`;
    md += `- **Caratteri con dato:** ${r.distinctCharCount} su ${characters.length}\n`;
    md += `- **Profondità minima per identificazione univoca:** ${r.discriminationDepth === null ? '— (non raggiungibile)' : r.discriminationDepth + ' carattere/i'}\n`;

    if (r.discriminationDepth === null) {
      md += `- **Stato:** ⚠️ **NON RAGGIUNGIBILE UNIVOCAMENTE** — vedi sommario.\n`;
      md += `- **Genere/i che lo "bloccano":** ${stuckMap[g.id].dominator}\n\n`;
      md += `  **Pari merito persistente con il profilo completo:** ${r.fullProfileResult.top5.filter(x => x.score === r.fullProfileResult.top5[0].score).map(x => '_' + (genera.find(gg => gg.id === x.id)?.scientific_name) + '_').join(', ')}.\n\n`;
      continue;
    }

    if (r.uniqueSingles.length > 0) {
      md += `- **Identificazione con 1 carattere — opzioni univoche** (${r.uniqueSingles.length}):\n`;
      for (const u of r.uniqueSingles) {
        const c = charById[u.char];
        const st = c?.states.find(s => s.value === u.val);
        const lbl = st?.label_it ?? `(stato \`${u.val}\` — non definito in characters.json!)`;
        md += `  - **${c?.name_it}** = _${lbl}_  (gap dal 2°: ${u.gap}, generi rimasti in lista: ${u.passingCount})\n`;
      }
      md += `\n`;
    }

    if (r.discriminationDepth === 2 && r.pairs.length > 0) {
      md += `- **Nessun singolo carattere lo identifica.** Coppie minime che lo identificano univocamente (prime ${Math.min(8, r.pairs.length)} su ${r.pairs.length} totali trovate):\n`;
      for (const p of r.pairs.slice(0, 8)) {
        md += `  - ${p.sels.map(s => '**' + s.replace('=', '** = _') + '_').join(' AND ')}  (gap: ${p.gap})\n`;
      }
      md += `\n`;
    }

    if (r.discriminationDepth === 3 && r.triples.length > 0) {
      md += `- **Nessun singolo carattere o coppia lo identifica.** Triple minime trovate (prime ${Math.min(5, r.triples.length)} di ${r.triples.length}):\n`;
      for (const p of r.triples.slice(0, 5)) {
        md += `  - ${p.sels.map(s => '**' + s.replace('=', '** = _') + '_').join(' AND ')}  (gap: ${p.gap})\n`;
      }
      md += `\n`;
    }
  }
}

md += `---\n\n`;
md += `## Raccomandazioni operative\n\n`;
md += `Per "sbloccare" gli 8 generi non raggiungibili occorre **aggiungere caratteri o stati alla matrice** (non basta correggere quelli esistenti). Le minime modifiche concettualmente necessarie:\n\n`;
md += `### Trio _Prenolepis_ / _Nylanderia_ / _Paratrechina_ (formicinae)\n\n`;
md += `I tre generi sono attualmente codificati con **valori identici per tutti gli 8 caratteri della scope formicinae**. Servono almeno **due nuovi caratteri** (o stati distinti per ciascun genere su un carattere esistente) per separarli completamente. Spunti morfologici reali:\n`;
md += `- _Prenolepis_: profilo del mesosoma con propodeo "incurvato" e pronoto rilevato (carattere unico tra i tre).\n`;
md += `- _Nylanderia_: presenza di setae erette pari (paired macrochaetae) sul dorso del capo e mesosoma; clipeo con peli prominenti.\n`;
md += `- _Paratrechina_: profilo del mesosoma uniforme, pubescenza più rada; peli mandibolari corti.\n\n`;

md += `### _Lasius_ vs _Formica_\n\n`;
md += `Differiscono solo su gen-34 (formula palpale: _Formica_ 6,4 / _Lasius_ 6,4 ridotta), ma _Lasius_=0 è **sottoinsieme** di _Formica_=0,2. Servirebbe almeno un altro carattere a "vantaggio" di _Lasius_ — per esempio:\n`;
md += `- **Dimensione corporea relativa**: _Formica_ tipicamente >5mm; _Lasius_ <5mm.\n`;
md += `- **Forma del propodeo**: declivio più ripido in _Lasius_.\n`;
md += `- **Setole erette sul gastro**: assenti in _Lasius niger_-group, presenti in _Formica_.\n\n`;

md += `### _Stenamma_ vs _Pheidole_\n\n`;
md += `Differiscono solo su gen-12 (Lati del pronoto), con _Stenamma_=1 ⊂ _Pheidole_=0,1. _Pheidole_ ha la casta soldato (major), che è il vero diagnostico, ma il carattere "casta soldato con capo troncato" è codificato solo come gen-33 nella scope **formicinae** (anomalia: ne servirebbe uno omologo nella scope myrmicinae).\n\n`;

md += `### _Brachyponera_ vs _Hypoponera_\n\n`;
md += `Differiscono solo su gen-21 (Colore), _Brachyponera_=1 ⊂ _Hypoponera_=0,1. Servirebbe un carattere di taglia (Brachyponera è ~2× più grande) o di scolpitura del capo.\n\n`;

md += `### _Proceratium_ e _Leptanilla_\n\n`;
md += `Entrambi hanno profili "ridotti" (5–7 caratteri) tutti dominati. Soluzione concettuale: **creare caratteri propri della loro sottofamiglia** (gen-XX scope=proceratiinae, gen-XX scope=leptanillinae) con stati diagnostici come:\n`;
md += `- _Proceratium_: secondo tergite del gastro fortemente arcuato verso il basso (carattere diagnostico classico).\n`;
md += `- _Leptanilla_: assenza di occhi composti + corpo filiforme depigmentato + lobi frontali ridotti (combinazione unica).\n\n`;

md += `Lo stesso vale, in misura minore, per _Stigmatomma_ (Amblyoponinae) e _Dorylus_ (Dorylinae): attualmente **raggiungibili** ma solo via caratteri myrmicinae, quindi senza la protezione della "subfamily-aware penalization".\n\n`;

md += `---\n\n`;
md += `## Validazione indipendente\n\n`;
md += `Le cinque conclusioni più sensibili sono state cross-controllate da un secondo agente che ha letto direttamente \`matrix.json\` e \`characters.json\` senza usare il simulatore. Tutte e cinque sono risultate **VERIFICATE**:\n\n`;
md += `1. ✅ _Prenolepis_, _Nylanderia_, _Paratrechina_ hanno entry identiche byte-per-byte sui caratteri \`gen-33..gen-40\`.\n`;
md += `2. ✅ \`lasius\` è dominato da \`formica\`: solo \`gen-34\` differisce (\`['0']\` ⊂ \`['0','2']\`).\n`;
md += `3. ✅ Le quattro coppie di dominanza (stenamma/pheidole, brachyponera/hypoponera, proceratium/myrmecina, leptanilla/aphaenogaster) sono tutte confermate.\n`;
md += `4. ✅ \`gen-2\` ha zero entry in \`matrix.json\`.\n`;
md += `5. ✅ \`strumigenys/gen-14 = "2"\` è un valore orfano (gen-14 ha solo stati \`0\` e \`1\`).\n\n`;
md += `---\n\n`;
md += `## Riproducibilità\n\n`;
md += `Lo stato della matrice in fase di analisi è bloccato dal commit \`${process.env.GIT_REV ?? '<HEAD del branch>'}\`. Per rieseguire dopo modifiche ai dati:\n\n`;
md += `\`\`\`bash\n`;
md += `cd tools/key-audit\n`;
md += `node sanity.mjs       # integrità dati\n`;
md += `node discriminate.mjs # genera report-data.json\n`;
md += `node deep-search.mjs  # diagnostica generi bloccati\n`;
md += `node build-report.mjs # rigenera questo file\n`;
md += `\`\`\`\n\n`;
md += `Il file \`report-data.json\` è il "ground truth" granulare (tutte le combinazioni trovate per ogni genere) e può essere comparato fra commit per identificare regressioni quando si modificano \`characters.json\` o \`matrix.json\`.\n`;

const outPath = new URL('./REPORT-key-reachability.md', import.meta.url);
fs.writeFileSync(outPath, md);
console.log(`Wrote ${outPath.pathname}  (${md.length} chars)`);
