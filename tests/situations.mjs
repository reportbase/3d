// Smoke test for situations.html, the five ways to observe (0 to 4). In headless Chromium it
// steps through every frame, by the buttons, the arrow keys and the number keys, and checks that
// each shows its own caption and its own picture: 0 is one even grey, 1 and 2 are flat
// mathematics (an equation, an array), the apple in the hand turns when dragged, and in 4 the
// arrivals grow and start again on each visit. Fails on any uncaught error.
//
//   node tests/situations.mjs
//   LIBS_DIR=path/node_modules node tests/situations.mjs    three.js from a local three@0.128.0
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const server = process.env.BASE_URL ? null : await new Promise(ok => {
  const s = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    try { const body = await readFile(join(ROOT, path)); res.writeHead(200, { 'Content-Type': extname(path) === '.html' ? 'text/html' : 'application/octet-stream' }); res.end(body); }
    catch { res.writeHead(404); res.end(); }
  });
  s.listen(0, '127.0.0.1', () => ok(s));
});
const base = process.env.BASE_URL || `http://127.0.0.1:${server.address().port}/`;
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
if (process.env.LIBS_DIR) await page.route(/three\.js\/r128\/three\.min\.js/, async r => r.fulfill({ contentType: 'text/javascript', body: await readFile(join(process.env.LIBS_DIR, 'three', 'build/three.min.js')) }));
const errors = []; page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text()); });

let failures = 0;
const step = async (name, fn) => { try { await fn(); console.log('ok   ' + name); } catch (e) { failures++; console.log('FAIL ' + name + '\n     ' + e.message); } };
const ev = (f, a) => page.evaluate(f, a);
// the picture itself, from the WebGL canvas; the inside frames are heavy for a software renderer, so wait for a frame to land
const pix = () => ev(() => document.getElementById('view').toDataURL());
const settle = async () => { await ev(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); };

await page.goto(base + 'situations.html');
await page.waitForFunction(() => window.__situations);

const ORDER = [0, 1, 2, 3, 4];
const num = () => ev(() => document.getElementById('num').textContent);
await step('the frames, in order, one per situation', async () => {
  const sits = await ev(() => __situations.FRAMES.map(f => f.sit).join(','));
  if (sits !== ORDER.join(',')) throw new Error('order: ' + sits);
  const dots = await ev(() => [...document.querySelectorAll('#dots button')].map(b => b.textContent).join(','));
  if (dots !== ORDER.join(',')) throw new Error('dots: ' + dots);
});

const seen = new Map();
await step('each frame its own caption and its own picture (the next button)', async () => {
  for (const [i, sit] of ORDER.entries()){
    if (i) await page.click('#next');
    await settle();
    const c = await ev(() => ({ num: document.getElementById('num').textContent, name: document.getElementById('name').textContent, line: document.getElementById('line').textContent, hash: location.hash, on: document.querySelector('#dots button.on').textContent }));
    if (c.num !== String(sit) || c.on !== String(sit) || c.hash !== '#s' + sit || !c.name || c.line.length < 40) throw new Error(`situation ${sit}: ` + JSON.stringify(c));
    seen.set(sit, await pix());
  }
  const pics = new Set(seen.values()); if (pics.size !== ORDER.length) throw new Error(pics.size + ' different pictures for ' + ORDER.length + ' frames');
  await page.click('#next'); if (await num() !== '0') throw new Error('next from the last did not wrap to the first');
});

await step('the arrow and number keys', async () => {
  await page.keyboard.press('ArrowLeft'); if (await num() !== '4') throw new Error('← from the first is not the last');
  await page.keyboard.press('2'); if (await num() !== '2') throw new Error('the 2 key did not open 2');
  await page.keyboard.press('ArrowRight'); if (await num() !== '3') throw new Error('→ from 2 is not 3');
  await page.keyboard.press('0'); if (await num() !== '0') throw new Error('the 0 key did not open 0');
});

await step('1 and 2 are mathematics: flat on the page, still, the array shaded by its values', async () => {
  for (const k of ['1', '2']){
    await page.keyboard.press(k); await settle(); const a = await pix(); await page.waitForTimeout(300); await settle();
    if (await pix() !== a) throw new Error(k + ' moves; an equation or an array is read all at once');
    const flat = await ev(() => !!__situations.FRAMES[__situations.at()].camera.userData.flat); if (!flat) throw new Error(k + ' is not drawn flat');
  }
  // the array's cells are tinted by value: the dimpled top row differs from the waist
  const r = await ev(() => { const c = document.getElementById('view'), g = document.createElement('canvas'); g.width = c.width; g.height = c.height; const x = g.getContext('2d'); x.drawImage(c, 0, 0);
    const d = x.getImageData(0, 0, g.width, g.height).data; let warm = 0; for (let i = 0; i < d.length; i += 4) if (d[i] - d[i + 2] > 25) warm++; return warm; });
  if (r < 500) throw new Error('the array has no shading by value: ' + r + ' warm pixels');
});

await step('3, the apple in the hand: dragging turns it', async () => {
  await page.keyboard.press('3'); await settle();
  const before = await ev(() => __situations.FRAMES[__situations.at()].scene.children.find(c => c.type === 'Group').rotation.y);
  await page.mouse.move(480, 260); await page.mouse.down(); await page.mouse.move(600, 270, { steps: 6 }); await page.mouse.up();
  const after = await ev(() => __situations.FRAMES[__situations.at()].scene.children.find(c => c.type === 'Group').rotation.y);
  if (!(after - before > 0.5)) throw new Error(`turned by ${after - before}`);
});

await step('4, one point at a time: nothing at first, then arrivals, nearest first; it starts again on each visit', async () => {
  await page.keyboard.press('4');
  const c0 = await ev(() => __situations.FRAMES[__situations.at()].count());
  if (c0 > 2) throw new Error('already ' + c0 + ' arrived on entering');
  await page.waitForFunction(() => __situations.FRAMES[__situations.at()].count() > 20, null, { timeout: 60000 }).catch(() => {});
  const c1 = await ev(() => __situations.FRAMES[__situations.at()].count());
  if (!(c1 > 20)) throw new Error('only ' + c1 + ' arrived');
  const sorted = await ev(() => { const f = __situations.FRAMES[__situations.at()], p = f.scene.children.find(c => c.isPoints).geometry.attributes.position.array, n = f.count();
    let last = -1; for (let i = 0; i < n; i++){ const d = Math.hypot(p[3 * i] - 0.5, p[3 * i + 1] - 0.5, p[3 * i + 2]); if (d < last - 1e-6) return false; last = d; } return true; });
  if (!sorted) throw new Error('the arrivals are not nearest first');
  await page.keyboard.press('3'); await page.keyboard.press('4');
  const c2 = await ev(() => __situations.FRAMES[__situations.at()].count());
  if (c2 > 2) throw new Error('coming back did not start again: ' + c2);
});

await step('0, nothing: one even grey, nothing in it', async () => {
  await page.keyboard.press('0'); await settle();
  const r = await ev(() => { const c = document.getElementById('view'), g = document.createElement('canvas'); g.width = 64; g.height = 64; const x = g.getContext('2d'); x.drawImage(c, 0, 0, 64, 64);
    const d = x.getImageData(0, 0, 64, 64).data; let lo = 255, hi = 0; for (let i = 0; i < d.length; i += 4){ lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); } return { lo, hi, n: __situations.FRAMES[__situations.at()].scene.children.length }; });
  if (r.n !== 0 || r.hi - r.lo > 2) throw new Error('not empty: ' + JSON.stringify(r));
});

await step('a link opens on its situation (#s3), and the hash switches it', async () => {
  await page.keyboard.press('1'); await ev(() => { location.hash = '#s4'; }); await page.waitForTimeout(200);
  if (await num() !== '4') throw new Error('changing the hash to #s4 did not show 4');
  await page.goto('about:blank'); await page.goto(base + 'situations.html#s3'); await page.waitForFunction(() => window.__situations);
  if (await num() !== '3') throw new Error('#s3 did not open on 3');
});

if (errors.length){ failures++; console.log('FAIL uncaught errors:\n     ' + errors.join('\n     ')); }
await browser.close(); if (server) server.close();
console.log(failures ? `\n${failures} failure(s)` : '\nno uncaught errors');
process.exit(failures ? 1 : 0);
