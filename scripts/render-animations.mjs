#!/usr/bin/env node
// Rende le animazioni di animations/scenes/*.js in mini video (WebM e MP4) e disegni (WebP).
// Uso: node scripts/render-animations.mjs [id ...] [--size 540] [--fps 24] [--sheet]
// Servono Playwright con Chromium e ffmpeg. Codice MIT.
import { createServer } from 'node:http';
import { readFile, mkdir, rm, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const SIZE = Number(opt('--size', 540));
const FPS = Number(opt('--fps', 24));
const SHEET = args.includes('--sheet');
const skip = new Set();
args.forEach((a, i) => { if (a.startsWith('--')) { skip.add(i); if (!['--sheet'].includes(a)) skip.add(i + 1); } });
let ids = args.filter((_, i) => !skip.has(i));
if (!ids.length) ids = (await readdir(join(root, 'animations/scenes'))).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const path = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!path.startsWith(root) || !existsSync(path)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
  res.end(await readFile(path));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const port = server.address().port;

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(require.resolve('playwright', { paths: ['/usr/lib/node_modules', '/usr/local/lib/node_modules'] })); }
const browser = await playwright.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const out = join(root, 'dist/animations');
await mkdir(out, { recursive: true });
const ff = (...a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a]);
const toBuf = (url) => Buffer.from(url.split(',')[1], 'base64');

for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
  page.on('pageerror', (e) => console.error(id, e));
  page.on('console', (m) => m.type() === 'error' && console.error(id, m.text()));
  await page.goto(`http://127.0.0.1:${port}/animations/render.html?scene=${id}&w=${SIZE}&h=${SIZE}`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  const { duration } = await page.evaluate(() => window.SCENE);
  const frames = Math.round(duration * FPS);
  const dir = join(tmpdir(), `ferro-anim-${id}`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (let f = 0; f < frames; f++) {
    const url = await page.evaluate((t) => window.frameAt(t), f / FPS);
    await writeFile(join(dir, `f${String(f).padStart(4, '0')}.png`), toBuf(url));
  }
  const still = await page.evaluate(() => window.still());
  await writeFile(join(dir, 'still.png'), toBuf(still));
  await page.close();

  const input = ['-framerate', String(FPS), '-i', join(dir, 'f%04d.png')];
  ff(...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '42', '-row-mt', '1', '-deadline', 'good', '-pix_fmt', 'yuv420p', '-an', join(out, `${id}.webm`));
  ff(...input, '-c:v', 'libx264', '-crf', '30', '-preset', 'slow', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(out, `${id}.mp4`));
  ff('-i', join(dir, 'f0000.png'), '-c:v', 'libwebp', '-quality', '80', join(out, `${id}.poster.webp`));
  ff('-i', join(dir, 'still.png'), '-c:v', 'libwebp', '-quality', '85', join(out, `${id}.setup.webp`));
  if (SHEET) {
    ff('-framerate', String(FPS), '-i', join(dir, 'f%04d.png'), '-vf', `select='not(mod(n\\,${Math.max(1, Math.floor(frames / 8))}))',scale=270:270,tile=4x2`, '-frames:v', '1', join(out, `${id}.sheet.png`));
  }
  const kb = (f) => Math.round((execFileSync('stat', ['-c', '%s', join(out, f)]).toString() | 0) / 1024);
  console.log(`${id}: ${frames} fotogrammi, webm ${kb(id + '.webm')} KB, mp4 ${kb(id + '.mp4')} KB, disegno ${kb(id + '.setup.webp')} KB`);
  await rm(dir, { recursive: true, force: true });
}
await browser.close();
server.close();
