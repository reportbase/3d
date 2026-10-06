// Smoke test for situations.html, the six ways to observe. In headless Chromium it steps
// through every frame, by the buttons, the arrow keys and the number keys, and checks that each
// shows its own caption and its own picture: the holder's apple turns when dragged, the endless
// apple drifts, the impossible frame is one even grey. Fails on any uncaught error.
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

const ORDER = [1, 2, 6, 5, 3, 4];
await step('the frames, in story order, one per situation', async () => {
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
  await page.click('#next'); if (await ev(() => document.getElementById('num').textContent) !== '1') throw new Error('next from the last did not wrap to the first');
});

await step('the arrow and number keys', async () => {
  await page.keyboard.press('ArrowLeft'); if (await ev(() => document.getElementById('num').textContent) !== '4') throw new Error('← from the first is not the last');
  await page.keyboard.press('6'); if (await ev(() => document.getElementById('num').textContent) !== '6') throw new Error('the 6 key did not open the holder');
  await page.keyboard.press('ArrowRight'); if (await ev(() => document.getElementById('num').textContent) !== '5') throw new Error('→ from the holder is not 5');
});

await step('6, the holder: dragging turns the apple', async () => {
  await page.keyboard.press('6'); await settle();
  const before = await ev(() => __situations.FRAMES[__situations.at()].scene.children.find(c => c.type === 'Group').rotation.y);
  await page.mouse.move(480, 260); await page.mouse.down(); await page.mouse.move(600, 270, { steps: 6 }); await page.mouse.up();
  const after = await ev(() => __situations.FRAMES[__situations.at()].scene.children.find(c => c.type === 'Group').rotation.y);
  if (!(after - before > 0.5)) throw new Error(`turned by ${after - before}`);
});

await step('3, the endless apple: it drifts, and wraps without a seam', async () => {
  await page.keyboard.press('3');
  // a frame of this one takes seconds in a software renderer: wait for the drift itself
  const z0 = await ev(() => __situations.FRAMES[__situations.at()].scene.children.find(c => c.type === 'Group').position.z);
  await page.waitForFunction(z0 => __situations.FRAMES[__situations.at()].scene.children.find(c => c.type === 'Group').position.z !== z0, z0, { timeout: 90000 }).catch(() => {});
  const z1 = await ev(() => __situations.FRAMES[__situations.at()].scene.children.find(c => c.type === 'Group').position.z);
  if (z1 === z0) throw new Error('it did not drift');
  if (!(z1 >= 0 && z1 < 8)) throw new Error('the drift did not wrap within the repeat: ' + z1);
  const lights = await ev(() => __situations.FRAMES[__situations.at()].scene.children.filter(c => c.isLight).length);
  if (lights < 2) throw new Error('the endless apple has ' + lights + ' lights');
});

await step('5 and 3 differ in what lies beyond: light outside, or only more apple', async () => {
  const bg = await ev(() => __situations.FRAMES.filter(f => f.sit === 5 || f.sit === 3).map(f => [f.sit, f.scene.background.getHexString(), f.scene.fog ? f.scene.fog.color.getHexString() : null]));
  const five = bg.find(b => b[0] === 5), three = bg.find(b => b[0] === 3);
  if (five[1] === five[2]) throw new Error('5: the outside is the same colour as the fog, so no light comes through the gaps');
  if (three[1] !== three[2]) throw new Error('3: the wall and the fog differ, so the packing\'s edge would show');
});

await step('4, impossible: one even grey, nothing in it', async () => {
  await page.keyboard.press('4'); await settle();
  const r = await ev(() => { const c = document.getElementById('view'), g = document.createElement('canvas'); g.width = 64; g.height = 64; const x = g.getContext('2d'); x.drawImage(c, 0, 0, 64, 64);
    const d = x.getImageData(0, 0, 64, 64).data; let lo = 255, hi = 0; for (let i = 0; i < d.length; i += 4){ lo = Math.min(lo, d[i]); hi = Math.max(hi, d[i]); } return { lo, hi, n: __situations.FRAMES[__situations.at()].scene.children.length }; });
  if (r.n !== 0 || r.hi - r.lo > 2) throw new Error('not empty: ' + JSON.stringify(r));
});

await step('a link opens on its situation (#s3), and the hash switches it', async () => {
  await page.keyboard.press('1'); await ev(() => { location.hash = '#s5'; }); await page.waitForTimeout(200);
  if (await ev(() => document.getElementById('num').textContent) !== '5') throw new Error('changing the hash to #s5 did not show 5');
  await page.goto('about:blank'); await page.goto(base + 'situations.html#s3'); await page.waitForFunction(() => window.__situations);
  if (await ev(() => document.getElementById('num').textContent) !== '3') throw new Error('#s3 did not open on 3');
});

if (errors.length){ failures++; console.log('FAIL uncaught errors:\n     ' + errors.join('\n     ')); }
await browser.close(); if (server) server.close();
console.log(failures ? `\n${failures} failure(s)` : '\nno uncaught errors');
process.exit(failures ? 1 : 0);
