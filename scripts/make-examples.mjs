// Rifà la pagina esempi/index.html e la galleria del README con tutti gli esercizi animati.
// Uso: node scripts/make-examples.mjs (dopo render-animations.mjs). Codice MIT.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const { guides } = JSON.parse(read('dist/guides.it.json'));
const anim = (id, ext) => new URL(`dist/animations/${id}.${ext}`, root);
const kb = (id, ext) => Math.round(statSync(anim(id, ext)).size / 1024);
const KINDS = ['macchina', 'cavi', 'pesi liberi', 'corpo libero'];
const TITLES = { macchina: 'Macchine', cavi: 'Cavi', 'pesi liberi': 'Pesi liberi', 'corpo libero': 'Corpo libero' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ol = (xs) => `<ol>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;

const items = guides.filter((g) => existsSync(anim(g.id, 'webm')));
const groups = KINDS.map((k) => [k, items.filter((g) => g.kind === k)]).filter(([, xs]) => xs.length);

// ---------- pagina ----------
const page = read('esempi/index.html');
const head = page.slice(0, page.indexOf('<main>'));
const extraCss = '.toc{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:14px}.toc a{color:var(--chalk)}.group{font-family:var(--display);font-size:28px;margin:12px 0 0;color:var(--plate)}\n';
const headOut = head.includes('.toc{') ? head : head.replace('</style>', extraCss + '</style>');

const article = (g) => `<article class="ex" id="${g.id}">
<header><h2>${esc(g.name)}</h2>${g.cue ? `<p class="cue">«${esc(g.cue.replace(/^«|»$/g, ''))}»</p>` : ''}</header>
<div class="media">
<figure><video autoplay loop muted playsinline preload="metadata" poster="../dist/animations/${g.id}.poster.webp"><source type="video/webm" src="../dist/animations/${g.id}.webm"><source type="video/mp4" src="../dist/animations/${g.id}.mp4"></video><figcaption>Mini video, una ripetizione in loop · ${kb(g.id, 'webm')} KB</figcaption></figure>
<figure><img loading="lazy" alt="Posizione di partenza con i numeri delle regolazioni" src="../dist/animations/${g.id}.setup.webp"><figcaption>Disegno della posizione · ${kb(g.id, 'setup.webp')} KB</figcaption></figure>
</div>
<div class="text">
<div><h3>Prima di iniziare</h3>${ol(g.setup)}</div>
<div><h3>Esecuzione</h3>${ol(g.steps)}</div>
</div></article>`;

const total = items.reduce((s, g) => s + kb(g.id, 'webm') + kb(g.id, 'setup.webp'), 0);
const body = `<main>
<section class="intro"><span class="tag">${items.length} esercizi</span><h1>Esercizi animati per Ferro</h1>
<p>Manichino neutro, macchine generiche senza marchi, il muscolo che lavora si colora di giallo Ferro mentre spinge o tira. I numeri gialli nel disegno corrispondono ai passi di «Prima di iniziare».</p>
<nav class="toc">${groups.map(([, xs]) => xs.map((g) => `<a href="#${g.id}">${esc(g.name.replace(/ \(.*\)$/, ''))}</a>`).join('')).join('')}</nav></section>
${groups.map(([k, xs]) => `<h2 class="group">${TITLES[k]}</h2>\n${xs.map(article).join('\n')}`).join('\n')}
<section class="notes"><h2>Come sono fatti</h2><ul>
<li>Tutto disegnato in codice con three.js, nessun modello o foto presi da altri: licenza compatibile con la libreria (CC BY-SA 4.0 per i video, MIT per il codice).</li>
<li>Un comando rifà tutti i video: Chromium disegna i fotogrammi, ffmpeg li comprime in WebM e MP4 (per iPhone).</li>
<li>Video WebM e disegni di tutti gli esercizi: circa ${Math.round(total / 102.4) / 10} MB, quindi stanno dentro l'app e funzionano offline.</li>
<li>Il ritmo segue la scheda: salita in circa 1 secondo, pausa dove serve, discesa in 2–3 secondi.</li>
</ul></section>
</main>
<p class="notes">Rifare i video: <code>node scripts/render-animations.mjs</code>, poi questa pagina: <code>node scripts/make-examples.mjs</code>. Video e disegni CC BY-SA 4.0, codice MIT.</p>
</body>
</html>
`;
writeFileSync(new URL('esempi/index.html', root), headOut + body);

// ---------- README ----------
const readme = read('README.md');
const start = readme.indexOf('## Animazioni');
const end = readme.indexOf('## Come si usa');
const short = (g) => g.name.replace(/ \(.*\)$/, '');
const rows = [];
for (const [k, xs] of groups) {
  rows.push(`### ${TITLES[k]}\n`);
  for (let i = 0; i < xs.length; i += 4) {
    const c = xs.slice(i, i + 4);
    rows.push(`| ${c.map(short).join(' | ')} |`, `|${c.map(() => ':-:').join('|')}|`,
      `| ${c.map((g) => `[![${short(g)}](dist/animations/${g.id}.gif)](dist/animations/${g.id}.mp4)`).join(' | ')} |`, '');
  }
}
const section = `## Animazioni

Mini video 3D e disegni della posizione di partenza per tutti i **${items.length} esercizi**, fatti in codice con three.js:
manichino neutro, macchine generiche, il muscolo che lavora in giallo. La pagina con video, disegni e testi è
[esempi/index.html](esempi/index.html).

${rows.join('\n')}
I numeri gialli nei disegni (\`<id>.setup.webp\`) corrispondono ai passi di \`setup\` della scheda. Per ogni esercizio in
\`dist/animations/\` ci sono \`<id>.webm\` e \`<id>.mp4\` (circa 20–35 KB, per le app), \`<id>.poster.webp\`,
\`<id>.setup.webp\` e \`<id>.gif\` (per questa pagina). Come si rifanno: [animations/README.md](animations/README.md).

`;
writeFileSync(new URL('README.md', root), readme.slice(0, start) + section + readme.slice(end));
console.log(`${items.length} esercizi, ${total} KB`);
