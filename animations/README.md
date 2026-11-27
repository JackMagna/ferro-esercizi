# Animazioni degli esercizi

Mini video 3D e disegni della posizione di partenza per tutte le schede, fatti in codice con three.js:
manichino neutro e macchine generiche, senza modelli, foto o marchi di altri.

- `lib/engine.js`: manichino, cinematica inversa, forme per le macchine, luci.
- `lib/kit.js`: pezzi comuni (bilanciere, manubri, panca, seduta, torre con cavi, leve) e `scene()` per definire una scena in poche righe.
- `scenes/*.js`: le scene (stesso id di `guides/it/<id>.json`), con il ritmo della ripetizione e i numeri dei passi di «setup»; `scenes/index.js` le raccoglie tutte.
- `node scripts/render-animations.mjs [id ...]` crea in `dist/animations/`: `<id>.webm`, `<id>.mp4` (iPhone), `<id>.poster.webp`, `<id>.setup.webp`, `<id>.gif`. Servono Playwright con Chromium e ffmpeg; `--sheet` aggiunge un provino (non salvato nel repo).
- `node scripts/make-examples.mjs` rifà `esempi/index.html` (pagina con gli esempi, si apre nel browser) e la galleria del README.

Licenze: codice MIT (`LICENSE-CODE`), video e disegni CC BY-SA 4.0 come le schede.
