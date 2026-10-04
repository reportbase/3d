// Smoke test for 3d.html, the shape studio. In headless Chromium it works through:
//   · every example; selecting; every section kind; dragging an outline point
//   · shaping a part in place; every tool panel and its sliders
//   · every sculpt brush and stamp on the part (asserting the surface moved), the
//     drawn ridge, painting with the brush (asserting the colour changed)
//   · a drawn section: draw's primitives, dragging a leaf, smooth / symmetry / mirror
//   · drawings in: an SVG as a section and as an outline, a .tvf in draw's format
//   · every starting shape; move / turn / size; duplicate, delete, undo, redo
//   · files: .3da save → open, .tvf3d export → import (asserting the shape survives),
//     .stl export, an old assemble-mode .3da
// Fails on any uncaught error, or when an action has no effect.
//
//   node tests/editor.mjs            (npm test runs it)

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };
const server = process.env.BASE_URL ? null : await new Promise(ok => {
  const s = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    try { const body = await readFile(join(ROOT, path)); res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body); }
    catch { res.writeHead(404); res.end(); }
  });
  s.listen(0, '127.0.0.1', () => ok(s));
});
const base = process.env.BASE_URL || `http://127.0.0.1:${server.address().port}/`;
const PAGE = process.env.PAGE || '3d.html';

const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch);
const context = await browser.newContext({ viewport: { width: 1360, height: 820 }, acceptDownloads: true });
const page = await context.newPage();

let current = 'page load';
const failures = [];
page.on('pageerror', e => failures.push(`[${current}] ${e.message}`));
page.on('console', m => { if (m.type() === 'error') console.log(`  console (${current}): ${m.text().slice(0, 200)}`); });

async function step(name, fn){
  current = name; const before = failures.length;
  try { await fn(); } catch (e){ failures.push(`[${name}] ${e.message.split('\n')[0]}`); }
  await page.waitForTimeout(80);
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${name}`);
}
const ev = (fn, arg) => page.evaluate(fn, arg);
const parts = () => ev(() => __studio.S.parts.length);
const sel = () => ev(() => __studio.S.parts.find(p => p.id === __studio.S.sel));
const viewCentre = async () => { const b = await (await page.$('#view')).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
/* a fingerprint of the selected part's mesh: positions and colours summed */
const meshSum = () => ev(() => { const p = __studio.S.parts.find(q => q.id === __studio.S.sel); const g = p.mesh.geometry;
  let a = 0, c = 0; const P = g.attributes.position.array, C = g.attributes.color.array; for (let i = 0; i < P.length; i++) a += Math.abs(P[i]) * (i % 7 + 1); for (let i = 0; i < C.length; i++) c += C[i]; return [a, c]; });
async function drag(dx = 30, dy = 10){ const [x, y] = await viewCentre(); await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + dx, y + dy, { steps: 5 }); await page.mouse.up(); }
async function download(fn){ const [d] = await Promise.all([page.waitForEvent('download'), fn()]); return { name: d.suggestedFilename(), text: await readFile(await d.path(), 'utf8'), path: await d.path() }; }

const SVG_STAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 61,38 95,38 67,59 78,92 50,72 22,92 33,59 5,38 39,38"/></svg>`;
const SVG_VASE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><path d="M40 0 L60 0 L58 30 C90 70 90 140 70 200 L30 200 C10 140 10 70 42 30 Z"/></svg>`;

try {
  await page.goto(new URL(PAGE, base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__studio && __studio.S.parts.length > 0, null, { timeout: 60000 });
  console.log('page loaded');

  for (const name of ['table', 'snowman', 'chess', 'flowers', 'lighthouse']){
    await step(`example ${name}`, async () => {
      await ev(n => __studio.loadExample(n), name);
      if (await parts() < 4) throw new Error(`${name} made ${await parts()} parts`);
    });
  }
  await step('select a part from the list', () => page.click('.pitem:nth-child(2)'));
  for (const t of ['round', 'polygon', 'star', 'petal', 'super', 'custom']){
    await step(`section ${t}`, async () => {
      await page.click(`#stypes [data-t="${t}"]`);
      if ((await sel()).section.type !== t) throw new Error('section type did not change');
    });
  }
  await step('drag an outline point', async () => {
    const before = JSON.stringify((await sel()).outline);
    const b = await (await page.$('#outline .pt[data-i="1"]')).boundingBox();
    await page.mouse.move(b.x + 5, b.y + 5); await page.mouse.down(); await page.mouse.move(b.x + 40, b.y - 8, { steps: 5 }); await page.mouse.up();
    if (before === JSON.stringify((await sel()).outline)) throw new Error('the outline did not change');
  });

  // ── a drawn section, with draw's library ──
  await step('drawn section: draw primitives', async () => {
    await page.click('#stypes [data-t="custom"]');
    for (const prim of ['circle', 'superellipse', 'polygon', 'star', 'blob', 'rose']) await page.click(`[data-prim="${prim}"]`);
  });
  await step('drawn section: drag a leaf', async () => {
    const before = JSON.stringify((await sel()).section.shape.x);
    const b = await (await page.$('#section .leaf[data-k="3"]')).boundingBox();
    await page.mouse.move(b.x + 3, b.y + 3); await page.mouse.down(); await page.mouse.move(b.x + 25, b.y + 12, { steps: 5 }); await page.mouse.up();
    if (before === JSON.stringify((await sel()).section.shape.x)) throw new Error('the leaf did not move');
  });
  await step('drawn section: smooth, symmetry, mirror, points', async () => {
    for (const id of ['secSmooth', 'secSym', 'secMirror']) await page.click('#' + id);
    await ev(() => { const e = document.getElementById('secN'); e.value = 64; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); });
    if ((await sel()).section.shape.x.length !== 64) throw new Error('resample to 64 points did not take');
  });
  await step('drawing in: SVG star as a section', async () => {
    await ev(t => __studio.useCurveText(t, 'section', 'star.svg'), SVG_STAR);
    const s = await sel(); if (s.section.type !== 'custom' || !s.section.shape) throw new Error('no drawn section');
  });
  await step('drawing in: a .tvf from draw as a section', async () => {
    const tvf = await ev(() => { const sh = tvf.primitives.rose(40, { r: 100, petals: 4, depth: 0.3 }); return `TVF 40 1 2\n#meta name: rose\n0 ${Array.from(sh.x).join(' ')}\n0 ${Array.from(sh.y).join(' ')}\n`; });
    await ev(t => __studio.useCurveText(t, 'section', 'rose.tvf'), tvf);
    if ((await sel()).section.shape.x.length < 24) throw new Error('rose not read');
  });
  await step('drawing in: SVG vase as an outline', async () => {
    await ev(t => __studio.useCurveText(t, 'outline', 'vase.svg'), SVG_VASE);
    const o = (await sel()).outline; if (o.length < 10) throw new Error('outline has ' + o.length + ' points');
    if (!(o[7][1] > o[0][1] * 1.2)) throw new Error('the vase silhouette did not come through: ' + JSON.stringify(o.slice(0, 8)));
  });
  await step('section to draw (.tvf download)', async () => {
    const d = await download(() => page.click('#secSave'));
    if (!/^TVF \d+ 1 2/.test(d.text)) throw new Error('not a draw .tvf: ' + d.text.slice(0, 30));
  });

  // ── shaping in place ──
  await step('edit a part in place', async () => {
    await ev(() => __studio.loadExample('table'));
    await ev(() => __studio.setEditing(__studio.S.parts.find(p => p.name === 'vase').id));
    if (!await ev(() => __studio.S.editing)) throw new Error('not editing');
  });
  for (const t of ['shape', 'sculpt', 'bend', 'paint', 'hollow', 'detail']) await step(`tool ${t}`, () => page.click(`.tool[data-tool="${t}"]`));
  await page.click('.tool[data-tool="sculpt"]');
  const brushes = await ev(() => [...document.querySelectorAll('#toolPanel [data-b]')].map(b => b.dataset.b));
  for (const b of brushes){
    await step(`brush ${b}`, async () => {
      await page.click(`#toolPanel [data-b="${b}"]`);
      if (b === 'smooth' || b === 'erase' || b === 'sharpen' || b === 'twist' || b === 'pinch' || b === 'spread'){   // these act on what is there: sculpt something first
        await page.click('#toolPanel [data-b="pull"]'); await drag(20, 6); await page.click(`#toolPanel [data-b="${b}"]`); }
      const before = await meshSum(); await drag();
      const after = await meshSum();
      if (!['block', 'unblock'].includes(b) && before[0] === after[0]) throw new Error('the surface did not change');
    });
  }
  await step('every tool slider', async () => {
    for (const t of ['sculpt', 'bend', 'paint', 'hollow', 'detail']){
      await page.click(`.tool[data-tool="${t}"]`);
      const ids = await ev(() => [...document.querySelectorAll('#toolPanel input[type=range]')].map(r => r.id).filter(id => id !== 'det'));
      for (const id of ids) await ev(id => { const e = document.getElementById(id);
        for (const v of [e.min, e.max, e.value]){ e.value = v; e.dispatchEvent(new Event('input')); } e.dispatchEvent(new Event('change')); }, id);
    }
  });
  await step('paint with the brush', async () => {
    await page.click('.tool[data-tool="paint"]');
    await ev(() => { const e = document.getElementById('bpcol'); e.value = '#00ff00'; e.dispatchEvent(new Event('input')); });
    const before = await meshSum(); await drag(40, 0); await drag(-20, 10);
    if (before[1] === (await meshSum())[1]) throw new Error('no colour changed');
    if (!(await sel()).painted) throw new Error('part not marked painted');
  });
  await step('detail: drawn levels and a finer rung', async () => {
    await page.click('.tool[data-tool="detail"]');
    const r = (await sel()).eng.rungs; await page.click('#addRung');
    if ((await sel()).eng.rungs !== r + 1) throw new Error('no rung added');
    await ev(() => { const e = document.getElementById('det'); e.value = 1; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); });
  });
  await step('advanced panel', async () => {
    await page.click('#advanced');
    await ev(() => { const e = document.getElementById('advRung'); e.value = '0'; e.dispatchEvent(new Event('change')); });
    for (const id of ['advAp', 'advRun']) await ev(id => { const e = document.getElementById(id); e.value = e.max; e.dispatchEvent(new Event('input')); e.value = e.defaultValue; e.dispatchEvent(new Event('input')); }, id);
    await ev(() => { const e = document.getElementById('advRung'); e.value = 'auto'; e.dispatchEvent(new Event('change')); });
    await page.click('#advanced');
  });
  await step('step out with Escape', async () => { await page.keyboard.press('Escape'); if (await ev(() => __studio.S.editing)) throw new Error('still editing'); });

  // ── files ──
  await step('.tvf3d export and back', async () => {
    await ev(() => __studio.select_(__studio.S.parts.find(p => p.name === 'vase').id));
    const d = await download(() => ev(() => __studio.fileAction('tvf3d')));
    if (!d.text.startsWith('TVF3D')) throw new Error('not a .tvf3d');
    const err = await ev(t => { const p = __studio.S.parts.find(q => q.id === __studio.S.sel); const q = __studio.partFrom('cylinder'); q.core = __studio.parseTVF3D(t);
      q.outline = [[0, 1], [1, 1]]; q._origOutline = q.outline; q._coreFn = null; // compare the raw field against the part
      const core = __studio.parseTVF3D(t); let e = 0, mx = 0; if (p.cascade) __studio.usePart(p);
      for (let i = 1; i < 20; i++) for (let j = 0; j < 24; j++){ const h = i / 20, th = j / 24 * Math.PI * 2; let r = 0;
        for (let n = 0; n < core.NH; n++){ const hb = Math.cos(n * Math.PI * h); for (let m = 0; m < core.MT; m++) r += hb * (core.Aa[n][m] * Math.cos(m * th) + core.Ab[n][m] * Math.sin(m * th)); }
        const want = __studio.radiusAt(p, th, h) / (1 / 1.1); e = Math.max(e, Math.abs(r - want)); mx = Math.max(mx, want); }
      return e / mx; }, d.text);
    if (!(err < 0.05)) throw new Error('the .tvf3d is ' + (err * 100).toFixed(1) + '% off the part');
    const n = await parts(); await page.setInputFiles('#fileTvf3d', d.path);
    await page.waitForFunction(n => __studio.S.parts.length === n + 1, n, { timeout: 5000 });
  });
  await step('.stl export', async () => {
    const d = await download(() => ev(() => __studio.fileAction('stl')));
    const facets = (d.text.match(/facet normal/g) || []).length; if (facets < 1000) throw new Error('only ' + facets + ' facets');
  });
  await step('.3da save and open', async () => {
    const before = await ev(() => __studio.S.parts.map(p => p.name + p.pos.map(x => x.toFixed(3))).join('|'));
    const d = await download(() => ev(() => __studio.fileAction('save')));
    await ev(() => __studio.fileAction('new'));
    if (await parts() !== 0) throw new Error('new did not clear');
    await page.setInputFiles('#fileOpen', d.path);
    await page.waitForFunction(() => __studio.S.parts.length > 0, null, { timeout: 5000 });
    const after = await ev(() => __studio.S.parts.map(p => p.name + p.pos.map(x => x.toFixed(3))).join('|'));
    if (before !== after) throw new Error('the reopened object differs');
    if (!await ev(() => __studio.S.parts.some(p => p.painted && p.cascade))) throw new Error('the painted vase lost its paint');
  });
  await step('an old assemble-mode .3da', async () => {
    const v1 = { format: '3d-assembly', version: 1, parts: [
      { name: 'leg', color: '#7a5230', pos: [0.5, 0, 0], rot: [0, 0, 0], size: 1, stretch: [0.2, 0.7, 0.2], src: { preset: 'cylinder' } },
      { name: 'knight', color: null, pos: [0, 0, 0], rot: [0, 90, 0], size: 0.5, stretch: [1, 1, 1], src: { preset: 'knight' } } ] };
    await ev(d => __studio.loadScene(d), v1);
    if (await parts() !== 2) throw new Error('expected 2 parts');
  });

  await step('every starting shape as a new part', async () => {
    await ev(() => { __studio.S.sel = null; });
    await page.click('.tool[data-tool="shape"]');
    const n = await parts(), kinds = await ev(() => [...document.querySelectorAll('#toolPanel [data-kind]')].map(b => b.dataset.kind));
    for (const k of kinds){ await ev(() => { __studio.S.sel = null; }); await page.click('.tool[data-tool="shape"]'); await page.click(`#toolPanel [data-kind="${k}"]`); }
    if (await parts() !== n + kinds.length) throw new Error(`expected ${n + kinds.length} parts, have ${await parts()}`);
  });
  for (const m of ['mTurn', 'mSize', 'mMove', 'snap', 'snap', 'wire', 'wire', 'frameAll']) await step(`view button ${m}`, () => page.click('#' + m));
  await step('duplicate and delete', async () => {
    await ev(() => __studio.select_(__studio.S.parts[0].id));
    const n = await parts(); await page.click('#dupPart'); if (await parts() !== n + 1) throw new Error('duplicate did not add a part');
    await page.click('#delPart'); if (await parts() !== n) throw new Error('delete did not remove a part');
  });
  await step('undo and redo', async () => {
    const n = await parts(); await page.click('#undo'); if (await parts() === n) throw new Error('undo changed nothing');
    await page.click('#redo'); if (await parts() !== n) throw new Error('redo did not come back');
  });
} catch (e){
  failures.push(`[${current}] ${e.message.split('\n')[0]}`);
}

if (failures.length) console.error(`\n${failures.length} failure(s):\n` + failures.map(f => '  ' + f).join('\n'));
else console.log('\nno uncaught errors');
await browser.close();
server?.close();
process.exit(failures.length ? 1 : 0);
