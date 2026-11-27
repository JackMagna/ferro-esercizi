#!/usr/bin/env node
/**
 * Controlla le schede e crea i file unici in dist/ (formato ferro-guides-v1, quello che legge Ferro).
 *
 *   node scripts/build.mjs            controlla e scrive dist/
 *   node scripts/build.mjs --check    controlla e fallisce se dist/ non è aggiornato
 *   --library                         controlla anche che gli esercizi esistano in free-exercise-db (serve la rete,
 *                                     oppure FREE_EXERCISE_DB=percorso/exercises.json)
 *
 * Nessuna dipendenza: solo Node 20 o più recente.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const LIBRARY_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const KINDS = ['macchina', 'cavi', 'pesi liberi', 'corpo libero'];
const LICENSE = 'CC BY-SA 4.0';

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const text = (v) => typeof v === 'string' && v.trim() !== '';

const sources = readJson(join(ROOT, 'sources.json'));
for (const [k, s] of Object.entries(sources)) {
  if (!text(s.title)) fail(`sources.${k}`, 'manca il titolo');
  if (!/^https?:\/\//.test(s.url ?? '')) fail(`sources.${k}`, 'url non valido');
}

const langs = readdirSync(join(ROOT, 'guides'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const books = {};
const usedSources = new Set();

for (const lang of langs) {
  const dir = join(ROOT, 'guides', lang);
  const safety = readJson(join(dir, '_safety.json'));
  const guides = [];
  const seenLibrary = new Map();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_')).sort()) {
    const where = `guides/${lang}/${file}`;
    const g = readJson(join(dir, file));
    if (`${g.id}.json` !== file) fail(where, `il nome del file deve essere ${g.id}.json`);
    if (!/^[a-z0-9-]+$/.test(g.id ?? '')) fail(where, 'id: solo minuscole, numeri e trattini');
    if (!KINDS.includes(g.kind)) fail(where, `kind deve essere uno di: ${KINDS.join(', ')}`);
    for (const f of ['name', 'muscles', 'cue', 'feel', 'stop']) if (!text(g[f])) fail(where, `manca ${f}`);
    if (!Array.isArray(g.aliases)) fail(where, 'aliases deve essere una lista');
    if (!(g.setup?.length >= 2) || !g.setup.every(text)) fail(where, 'setup: almeno 2 frasi');
    if (!(g.steps?.length >= 3) || !g.steps.every(text)) fail(where, 'steps: almeno 3 passi');
    if (!(g.mistakes?.length >= 3) || !g.mistakes.every((m) => text(m.error) && text(m.fix))) fail(where, 'mistakes: almeno 3, ognuno con error e fix');
    if (!(g.libraryIds?.length >= 1)) fail(where, 'libraryIds: almeno un esercizio');
    for (const id of g.libraryIds ?? []) {
      if (seenLibrary.has(id)) fail(where, `${id} è già in ${seenLibrary.get(id)}`);
      seenLibrary.set(id, file);
    }
    if (!(g.sources?.length >= 1)) fail(where, 'sources: almeno una fonte');
    for (const k of g.sources ?? []) {
      if (!sources[k]) fail(where, `fonte sconosciuta: ${k}`);
      usedSources.add(k);
    }
    if (g.reviewedBy !== null && !text(g.reviewedBy)) fail(where, 'reviewedBy: nome di chi ha controllato oppure null');
    const { reviewedBy, ...rest } = g; // non serve all'app
    guides.push(rest);
  }
  const used = Object.fromEntries(Object.entries(sources).filter(([k]) => guides.some((g) => g.sources.includes(k))));
  books[lang] = {
    format: 'ferro-guides-v1',
    lang,
    license: LICENSE,
    updated: new Date().toISOString().slice(0, 10),
    notes: 'Testi di ferro-esercizi (https://github.com/JackMagna/ferro-esercizi), licenza CC BY-SA 4.0.',
    sources: used,
    safety,
    guides
  };
}

for (const k of Object.keys(sources)) if (!usedSources.has(k)) fail(`sources.${k}`, 'fonte non usata da nessuna scheda');

if (args.has('--library')) {
  // FREE_EXERCISE_DB=percorso/exercises.json per usare una copia locale
  const local = process.env.FREE_EXERCISE_DB;
  const list = local ? readJson(local) : await fetch(LIBRARY_URL).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!list) fail('free-exercise-db', `non raggiungibile: ${LIBRARY_URL}`);
  else {
    const ids = new Set(list.map((e) => e.id));
    for (const [lang, b] of Object.entries(books)) for (const g of b.guides) for (const id of g.libraryIds) if (!ids.has(id)) fail(`guides/${lang}/${g.id}.json`, `${id} non esiste in free-exercise-db`);
  }
}

if (errors.length) {
  console.error(`${errors.length} problemi:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

mkdirSync(join(ROOT, 'dist'), { recursive: true });
let stale = false;
for (const [lang, b] of Object.entries(books)) {
  const out = join(ROOT, 'dist', `guides.${lang}.json`);
  if (args.has('--check')) {
    // la data cambia ogni giorno: si confronta tutto il resto
    const old = existsSync(out) ? readJson(out) : null;
    if (!old || JSON.stringify({ ...old, updated: '' }) !== JSON.stringify({ ...b, updated: '' })) {
      console.error(`dist/guides.${lang}.json non è aggiornato: esegui node scripts/build.mjs`);
      stale = true;
    }
  } else {
    writeFileSync(out, JSON.stringify(b, null, 2) + '\n');
  }
  console.log(`${lang}: ${b.guides.length} schede, ${b.guides.reduce((n, g) => n + g.libraryIds.length, 0)} esercizi della libreria`);
}
if (stale) process.exit(1);
