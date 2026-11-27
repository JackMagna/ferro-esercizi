# Animazioni degli esercizi (prototipo)

Mini video 3D e disegni della posizione di partenza, fatti in codice con three.js:
manichino neutro e macchine generiche, senza modelli, foto o marchi di altri.

- `lib/engine.js`: manichino, cinematica inversa, forme per le macchine, luci.
- `scenes/<id>.js`: una scena per scheda (stesso id di `guides/it/<id>.json`), con il ritmo della ripetizione e i numeri dei passi di «setup».
- `node scripts/render-animations.mjs [id ...]` crea in `dist/animations/`: `<id>.webm`, `<id>.mp4` (iPhone), `<id>.poster.webp`, `<id>.setup.webp`. Servono Playwright con Chromium e ffmpeg; `--sheet` aggiunge un provino.

Licenze: codice MIT (`LICENSE-CODE`), video e disegni CC BY-SA 4.0 come le schede.
