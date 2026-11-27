# ferro-esercizi

Schede di esecuzione degli esercizi in palestra, **in italiano**, scritte come le spiegherebbe un coach:
come regolare la macchina, come si esegue, gli errori comuni con la correzione, dove si deve sentire
e quando fermarsi. Le usa l'app [Ferro](https://github.com/JackMagna/ferro); chiunque può riusarle.

Oggi: **45 schede**, collegate a **56 esercizi** di [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
(macchine, cavi, pesi liberi, corpo libero).

## Come si usa

Il file pronto è `dist/guides.it.json` (formato `ferro-guides-v1`). Si può leggere direttamente da jsDelivr,
gratis e senza chiavi:

```
https://cdn.jsdelivr.net/gh/JackMagna/ferro-esercizi@main/dist/guides.it.json
```

Per un'app conviene fissare un commit o un tag (`@v0.1.0`) al posto di `@main`, così i testi non cambiano
senza che tu lo sappia.

Ogni scheda indica in `libraryIds` gli esercizi di free-exercise-db che descrive: chi usa già quella libreria
(foto e muscoli) trova la scheda con lo stesso id.

## Com'è fatta

```
guides/it/<id>.json     una scheda per file (schema in schema/guide.schema.json)
guides/it/_safety.json  avvertenze comuni per macchine, pesi liberi e per tutti
sources.json            fonti consultate, per chiave
dist/guides.it.json     tutte le schede in un file, creato da scripts/build.mjs
```

Campi di una scheda: `id`, `name`, `aliases` (altri nomi usati dai coach), `libraryIds`, `kind`
(`macchina`, `cavi`, `pesi liberi`, `corpo libero`), `muscles`, `setup`, `steps`, `mistakes` (`error`, `fix`),
`cue` (la frase da ricordare durante la serie), `feel`, `stop`, `sources`, `reviewedBy`.

```bash
node scripts/build.mjs            # controlla le schede e rifà dist/
node scripts/build.mjs --check    # solo controllo (lo fa GitHub a ogni modifica)
```

Serve solo Node 20 o più recente, nessuna dipendenza.

## Da dove vengono i testi

I testi sono originali. Sono scritti confrontando le istruzioni pubbliche dei produttori
(manuali e cartelli di Life Fitness, Matrix, Precor, articoli di Technogym) e di associazioni
(ACE, NSCA, NASM, ACSM), elencate in `sources.json` e citate in ogni scheda.
Nessun testo, immagine o video è stato copiato. I nomi dei produttori servono solo a citare le fonti.

`reviewedBy` dice chi ha controllato la scheda (un coach o un fisioterapista). Le schede con `null`
non sono ancora state controllate da un professionista.

**Non sono consigli medici.** Sono indicazioni generali e non sostituiscono un istruttore o un medico.

## Licenza

- Testi e dati (`guides/`, `sources.json`, `dist/`): [CC BY-SA 4.0](LICENSE). Puoi copiarli, tradurli e usarli
  anche in progetti commerciali, citando **«ferro-esercizi»** con un link a questo repository.
  Se modifichi o traduci i testi, devi pubblicare la tua versione con la stessa licenza.
  Mostrarli in un'app non obbliga a cambiare la licenza dell'app.
- Script e schema (`scripts/`, `schema/`): [MIT](LICENSE-CODE).

## Contribuire

Correzioni, nuove schede e traduzioni sono benvenute: vedi [CONTRIBUTING.md](CONTRIBUTING.md).
