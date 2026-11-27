# Come contribuire

Grazie! Ogni scheda la legge qualcuno che è in palestra, spesso alle prime armi: meglio una frase
chiara in meno che un dettaglio sbagliato in più.

## Correggere una scheda

1. Apri il file in `guides/it/<id>.json` e modificalo.
2. Se la correzione viene da una fonte nuova, aggiungila in `sources.json` e citane la chiave in `sources`.
3. Esegui `node scripts/build.mjs` e includi anche `dist/` nella modifica.
4. Apri una pull request spiegando cosa cambia e perché.

Se non usi GitHub, apri una issue con il nome dell'esercizio e la correzione.

## Aggiungere una scheda

- Una scheda per esercizio, file `guides/it/<id>.json`, con `id` uguale al nome del file
  (solo minuscole, numeri e trattini, per esempio `leg-press`).
- `libraryIds`: gli id di [free-exercise-db](https://github.com/yuhonas/free-exercise-db) che la scheda descrive.
  Ogni id può stare in una sola scheda.
- Almeno 2 frasi in `setup`, 3 passi in `steps`, 3 errori in `mistakes`, 1 fonte in `sources`.
- `reviewedBy`: `null`, finché un coach o un fisioterapista non l'ha controllata.

## Come scrivere

- Italiano semplice, frasi brevi, seconda persona («Regola il sedile…»).
- Prima le regolazioni, poi il movimento.
- Ogni errore ha la sua correzione, possibilmente con il perché in poche parole.
- `cue`: una frase sola, da ricordare durante la serie.
- Niente promesse mediche o di risultati, niente marchi o nomi di modelli nel testo
  (i produttori si citano solo tra le fonti).

## Cosa non si può accettare

- Testi, immagini o video copiati da app, siti o libri, anche se riscritti da vicino.
- Materiale senza una licenza compatibile con CC BY-SA 4.0.
- Foto o video di persone senza il loro consenso scritto.

Contribuendo accetti che il tuo contributo sia pubblicato con licenza CC BY-SA 4.0 (testi) o MIT (codice).
