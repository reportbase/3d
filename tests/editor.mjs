// Smoke test for 3d.html, the shape studio. In headless Chromium it works through:
//   · every example; selecting; every section kind; dragging an outline point
//   · shaping a part in place; every tool panel and its sliders
//   · every sculpt brush and stamp on the part (asserting the surface moved), the
//     drawn ridge, painting with the brush (asserting the colour changed)
//   · a drawn section: draw's primitives, dragging a leaf, smooth / symmetry / mirror
//   · drawings in: an SVG as a section and as an outline, a .tvf in draw's format
//   · every starting shape; move / turn / size; duplicate, delete, undo, redo
//   · files: .3da save → open, .tvf3d export → import (asserting the shape survives),
//     the whole object as a chess piece (rebuilt from its parts, as games does),
//   · describe it: build, change, look & fix (pictures sent), a chess set and its six-file
//     export (relative heights kept), and error replies, from a stand-in gateway
//   · scenes: a village from the stand-in gateway (rule counts, rows, rings, spacing, exclusions,
//     a lake and a lane as areas: boats only on water, nothing scattered into either),
//     detail by distance, shuffle and undo, editing a type, save and open, change and look & fix,
//     terrain (heights, copies on the ground, a raised lake, elevation), a harbour village (tests/harbour.json:
//     a stream on the slope, shores and banks without cliffs, the ground grown to fit, blended area edges,
//     houses along both sides of a street facing it), walking and flying,
//     prefabs (laid out whole per copy, turned, nested, yards kept clear), span, rows along a
//     path, stretch; the prefab library (placed by clicking, turned, renamed on a clash, every one built);
//     detail by octaves (a sculpted rock's levels as prefixes of its rungs, one rung per octave of distance, faded in);
//     surface detail (patterns laid rung by rung, exact at the finest leaves, saved as a few numbers, plain far and jointed near);
//     parts given by size, the roof shape, doors and windows set flush into a face;
//     building from a picture (shrunk, sent first, sent again with look & fix, three at most, a scene)
//     .stl export, an old assemble-mode .3da
// Fails on any uncaught error, or when an action has no effect.
//
//   node tests/editor.mjs            (npm test runs it)
//   LIBS_DIR=path/node_modules ...    three.js from a local three@0.128.0 (CDNs blocked)

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
// LIBS_DIR=path/node_modules: serve three.js r128 and its controls from a local
// three@0.128.0, for a sandbox where the CDNs are blocked.
if (process.env.LIBS_DIR){
  const lib = f => readFile(join(process.env.LIBS_DIR, 'three', f));
  await page.route(/three\.js\/r128\/three\.min\.js/, async r => r.fulfill({ contentType: 'text/javascript', body: await lib('build/three.min.js') }));
  for (const c of ['OrbitControls', 'TransformControls'])
    await page.route(new RegExp(c + '\\.js'), async r => r.fulfill({ contentType: 'text/javascript', body: await lib('examples/js/controls/' + c + '.js') }));
}

// The describe panel's gateway, stood in for: a test session, an account, and whatever
// reply the step sets in aiReply. Every request body is kept in aiSent to check.
let aiReply = { status: 200, body: {} }; const aiSent = [];
await page.addInitScript(() => { try { localStorage.setItem('tangent.login.v1', 'test-session'); } catch {} });
await page.route(/login\.tangent\.workers\.dev\/auth\/me/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ user: { email: 'tester@example.com' }, quota: { remaining: 9, limit: 10 } }) }));
// A successful reply goes back as a stream, the way the gateway relays Claude's, cut into
// small pieces so the page has to put them together; errors go back as plain JSON (or, for
// aiReply.raw, exactly as given, like Cloudflare's 524 page).
const sse = body => { const text = ((body.content || []).find(b => b.type === 'text') || {}).text || '', ev = (t, d) => 'event: ' + t + '\ndata: ' + JSON.stringify(d) + '\n\n';
  let out = ev('message_start', { type: 'message_start', message: { id: 'm', content: [] } }) + ev('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
  for (let i = 0; i < text.length; i += 97) out += ev('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: text.slice(i, i + 97) } });
  return out + ev('content_block_stop', { type: 'content_block_stop', index: 0 }) + ev('message_delta', { type: 'message_delta', delta: { stop_reason: body.stop_reason || 'end_turn' } }) + ev('message_stop', { type: 'message_stop' }); };
// aiReply may be a list: one reply per request, in turn (a place asked for as an object goes twice).
await page.route(/login\.tangent\.workers\.dev\/v1\/messages/, r => { const req = JSON.parse(r.request().postData() || '{}'); aiSent.push(req);
  const headers = { 'access-control-allow-origin': '*', 'x-gateway-quota-remaining': '8', 'x-gateway-quota-limit': '10' };
  const rep = Array.isArray(aiReply) ? aiReply.shift() : aiReply;
  if (rep.raw) return r.fulfill({ status: rep.status, contentType: 'text/html', headers, body: rep.raw });
  if (rep.status === 200 && req.stream) return r.fulfill({ status: 200, contentType: 'text/event-stream', headers, body: sse(rep.body) });
  r.fulfill({ status: rep.status, contentType: 'application/json', headers, body: JSON.stringify(rep.body) }); });
// A TVF3D-PARTS file rebuilt the way games does it (each field evaluated, moved by its PART
// matrix), reduced to the piece's extent: [min x,y,z] and [max x,y,z].
function partsBounds(text){
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (const bl of text.split(/^PART /m).slice(1)){
    const lines = bl.split('\n'), M = lines[0].trim().split(/\s+/).slice(1).map(Number);
    const hdr = lines.find(l => l.startsWith('TVF3D ')).split(/\s+/), NH = +hdr[1], MT = +hdr[2];
    const row = tag => lines.filter(l => l.startsWith(tag + ' ')).map(l => l.slice(tag.length + 1).trim().split(/\s+/).map(Number));
    const Aa = row('Aa'), Ab = row('Ab');
    for (let i = 0; i <= 12; i++) for (let j = 0; j < 24; j++){
      const h = i / 12, th = j / 24 * Math.PI * 2; let r = 0;
      for (let n = 0; n < NH; n++){ const hb = Math.cos(n * Math.PI * h); for (let m = 0; m < MT; m++) r += hb * (Aa[n][m] * Math.cos(m * th) + Ab[n][m] * Math.sin(m * th)); }
      const v = [r * Math.cos(th), h, r * Math.sin(th)];
      for (let k = 0; k < 3; k++){ const w = M[k * 4] * v[0] + M[k * 4 + 1] * v[1] + M[k * 4 + 2] * v[2] + M[k * 4 + 3]; lo[k] = Math.min(lo[k], w); hi[k] = Math.max(hi[k], w); }
    }
  }
  return { lo, hi };
}
const claudeSays = text => ({ status: 200, body: { stop_reason: 'end_turn', content: [{ type: 'text', text }] } });

let current = 'page load';
const failures = [];
page.on('pageerror', e => failures.push(`[${current}] ${e.message}`));
const shaderErrors = [];   // a scene material whose shader did not compile shows nothing, and only says so here
page.on('console', m => { if (m.type() === 'error'){ console.log(`  console (${current}): ${m.text().slice(0, 200)}`); if (/Shader Error|ERROR: 0:/.test(m.text())) shaderErrors.push(m.text().slice(0, 300)); } });

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
  await step('export as a chess piece', async () => {
    // The snowman: a dozen parts, some turned (the nose, the arms). Rebuild the piece the
    // way games will, by evaluating every field and moving it by its PART matrix, and check
    // it stands on the board, is centred, fills its height or footprint, and keeps the
    // studio object's proportions (x and z widened by 1.1, as a single part is).
    const keep = await ev(() => __studio.sceneData());
    await ev(() => __studio.loadExample('snowman'));
    const n = await parts();
    const d = await download(() => ev(() => __studio.fileAction('piece')));
    if (!d.text.startsWith('TVF3D-PARTS ' + n + '\n')) throw new Error('header is ' + d.text.split('\n')[0]);
    const got = await ev(t => {
      const blocks = t.split(/^PART /m).slice(1);
      let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
      for (const bl of blocks){
        const nl = bl.indexOf('\n'), M = bl.slice(0, nl).trim().split(/\s+/).slice(1).map(Number), C = __studio.parseTVF3D(bl.slice(nl + 1));
        for (let i = 0; i <= 12; i++) for (let j = 0; j < 24; j++){ const h = i / 12, th = j / 24 * Math.PI * 2; let r = 0;
          for (let n = 0; n < C.NH; n++){ const hb = Math.cos(n * Math.PI * h); for (let m = 0; m < C.MT; m++) r += hb * (C.Aa[n][m] * Math.cos(m * th) + C.Ab[n][m] * Math.sin(m * th)); }
          const v = [r * Math.cos(th), h, r * Math.sin(th)];
          for (let k = 0; k < 3; k++){ const w = M[k * 4] * v[0] + M[k * 4 + 1] * v[1] + M[k * 4 + 2] * v[2] + M[k * 4 + 3]; lo[k] = Math.min(lo[k], w); hi[k] = Math.max(hi[k], w); } }
      }
      const b = new THREE.Box3(); for (const p of __studio.S.parts){ p.mesh.updateMatrixWorld(true); b.expandByObject(p.mesh); }
      const sz = b.getSize(new THREE.Vector3());
      return { parts: blocks.length, lo, hi, studio: [sz.x, sz.y, sz.z] };
    }, d.text);
    const [W, H, D] = [0, 1, 2].map(k => got.hi[k] - got.lo[k]), [sw, sh, sd] = got.studio;
    await ev(k => __studio.loadScene(k), keep);   // the steps below expect the table back
    if (got.parts !== n) throw new Error(got.parts + ' PART blocks for ' + n + ' parts');
    if (Math.abs(got.lo[1]) > 0.02) throw new Error('the piece starts at y=' + got.lo[1].toFixed(3) + ', not on the board');
    if (Math.abs(got.lo[0] + got.hi[0]) > 0.03 || Math.abs(got.lo[2] + got.hi[2]) > 0.03) throw new Error('the piece is not centred');
    const fill = Math.max(H, Math.max(W, D) / 2 / 0.4);
    if (Math.abs(fill - 1) > 0.03) throw new Error('the piece neither fills its height nor its footprint (' + fill.toFixed(3) + ')');
    const ratio = (W / H) / (sw / sh * 1.1);
    if (Math.abs(ratio - 1) > 0.04) throw new Error('the proportions changed by ' + ((ratio - 1) * 100).toFixed(1) + '%');
  });
  await step('describe it: build a new object', async () => {
    const keep = await ev(() => __studio.sceneData());
    aiReply = claudeSays('Here it is:\n' + JSON.stringify({ name: 'boat', parts: [
      { name: 'hull', shape: 'bowl', outline: [[0, 0.2], [1, 0.5]], section: { type: 'super', n: 4, k: 0.3, squash: 0.45 }, hollow: { wall: 0.03, floor: 0.1 }, pos: [0, 0, 0], scale: [1.4, 0.35, 1.4], color: '#8a5a33' },
      { name: 'mast', shape: 'cylinder', outline: [[0, 0.02], [1, 0.02]], pos: [0, 0.2, 0], scale: [1, 1.1, 1], color: '#6b4423' },
      { name: 'sail', shape: 'cone', section: { type: 'polygon', n: 3, k: 1, squash: 0.08 }, pos: [0.15, 0.4, 0], scale: [0.6, 0.8, 0.6], color: '#c8402e', stripes: 3, stripeColor: '#ffffff' },
      { name: 'flag', shape: 'nonsense', pos: [0, 1.3, 0], scale: [0.1, 0.1, 99], color: 'red' } ] }) + '\nEnjoy!');
    await page.click('#aiBtn');
    if (await ev(() => document.getElementById('aiPop').hidden)) throw new Error('the panel did not open');
    if (!/tester/.test(await page.textContent('#aiSignIn'))) throw new Error('the account did not show: ' + await page.textContent('#aiSignIn'));
    await ev(() => { document.getElementById('aiMode').value = 'new'; });
    await page.fill('#aiPrompt', 'a little wooden boat with a red sail');
    await page.click('#aiGo');
    await page.waitForFunction(() => /built/.test(document.getElementById('aiStatus').textContent), null, { timeout: 5000 });
    const got = await ev(() => __studio.S.parts.map(p => ({ name: p.name, kind: p.core.kind, color: p.paint.color, bands: p.paint.bands, hollow: p.hollow.on, sec: p.section.type, scale: p.scale, pos: p.pos })));
    if (got.length !== 4) throw new Error(got.length + ' parts, expected 4');
    const [hull, mast, sail, flag] = got;
    if (hull.name !== 'hull' || !hull.hollow || hull.sec !== 'super' || hull.color !== '#8a5a33') throw new Error('the hull came out wrong: ' + JSON.stringify(hull));
    if (sail.bands !== 3 || sail.sec !== 'polygon') throw new Error('the sail lost its stripes or section');
    if (flag.color !== '#d9d4c7' || flag.scale[2] !== 20) throw new Error('bad values were not cleaned up: ' + JSON.stringify(flag));
    const sent = aiSent[aiSent.length - 1];
    if (!sent.model || !/PARTS/.test(sent.system) || !/wooden boat/.test(sent.messages[0].content)) throw new Error('the request was not what the panel should send');
    if (sent.stream !== true) throw new Error('the request was not streamed');
    if (await ev(() => document.getElementById('aiMode').value) !== 'edit') throw new Error('did not move on to "change it"');
    await ev(k => __studio.loadScene(k), keep);
  });
  await step('describe it: change the object', async () => {
    const keep = await ev(() => __studio.sceneData());
    await ev(() => __studio.loadExample('snowman'));
    const ids = await ev(() => __studio.S.parts.map(p => p.id));
    const sculpted = await ev(() => { const p = __studio.S.parts[0]; p.sculpted = true; return p.id; });   // stands in for a hand-sculpted part
    // keep the bottom (recoloured) and the head (moved), drop everything else, add a scarf
    aiReply = claudeSays(JSON.stringify({ name: 'snowman', parts: [
      { id: ids[0], color: '#eef2f7', pos: [0, 0, 0], rot: [0, 0, 0], scale: [0.7, 0.7, 0.7] },
      { id: ids[2], pos: [0.1, 1.1, 0], rot: [0, 0, 0], scale: [0.36, 0.36, 0.36] },
      { name: 'scarf', shape: 'ring', pos: [0, 0.95, 0], scale: [0.4, 0.08, 0.4], color: '#c8402e' } ] }));
    await page.fill('#aiPrompt', 'give him a red scarf and nothing else');
    await page.click('#aiGo');
    await page.waitForFunction(() => /changed/.test(document.getElementById('aiStatus').textContent), null, { timeout: 5000 });
    const sent = aiSent[aiSent.length - 1].messages[0].content;
    if (!sent.includes('"id":' + ids[0]) || !sent.includes('current object')) throw new Error('the current object was not sent');
    const got = await ev(() => __studio.S.parts.map(p => ({ id: p.id, name: p.name, color: p.paint.color, pos: p.pos, sculpted: p.sculpted })));
    if (got.length !== 3) throw new Error(got.length + ' parts, expected 3: ' + got.map(p => p.name).join(','));
    if (got[0].id !== ids[0] || got[0].color !== '#eef2f7' || !got[0].sculpted) throw new Error('the bottom was not recoloured in place, keeping its sculpting');
    if (got[1].id !== ids[2] || got[1].pos[0] !== 0.1) throw new Error('the head did not move');
    if (got[2].name !== 'scarf') throw new Error('no scarf');
    await page.click('#undo');
    if (await parts() !== ids.length) throw new Error('undo did not bring the snowman back');
    await ev(k => __studio.loadScene(k), keep);
  });
  await step('describe it: look & fix sends pictures and applies the fix', async () => {
    const keep = await ev(() => __studio.sceneData());
    await ev(() => __studio.loadExample('snowman'));
    if (await ev(() => document.getElementById('aiPop').hidden)) await page.click('#aiBtn');
    const head = await ev(() => __studio.S.parts.find(p => p.name === 'head').id);
    aiReply = claudeSays(JSON.stringify({ name: 'snowman', notes: 'The head was sunk into the body; raised it.',
      parts: (await ev(() => __studio.S.parts.map(p => ({ id: p.id, pos: p.pos, rot: p.rot, scale: p.scale })))).map(q => q.id === head ? { ...q, pos: [q.pos[0], q.pos[1] + 0.05, q.pos[2]] } : q) }));
    const y0 = await ev(id => __studio.S.parts.find(p => p.id === id).pos[1], head);
    await page.fill('#aiPrompt', '');
    await page.click('#aiFix');
    await page.waitForFunction(() => /fixed/.test(document.getElementById('aiStatus').textContent), null, { timeout: 15000 });
    const sent = aiSent[aiSent.length - 1].messages[0].content;
    if (!Array.isArray(sent) || sent[1].type !== 'image' || sent[1].source.media_type !== 'image/png') throw new Error('no picture was sent');
    if (sent[1].source.data.length < 20000) throw new Error('the picture is suspiciously small: ' + sent[1].source.data.length + ' bytes of base64');
    if (!/What was asked for: .*scarf/.test(sent[0].text) || !sent[0].text.includes('"id":' + head)) throw new Error('the request or the current object was not sent');
    const y1 = await ev(id => __studio.S.parts.find(p => p.id === id).pos[1], head);
    if (!(Math.abs(y1 - y0 - 0.05) < 1e-6)) throw new Error('the fix was not applied: head y ' + y0 + ' → ' + y1);
    if (!/sunk/.test(await page.textContent('#aiStatus'))) throw new Error('the notes were not shown');
    if (await ev(() => document.getElementById('aiCopy').disabled)) throw new Error('copy reply stayed disabled');
    // the picture really shows the object: decode it and check it is not one flat colour
    const varied = await ev(b64 => new Promise(ok => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; const seen = new Set();
      for (let i = 0; i < d.length; i += 4 * 97) seen.add((d[i] >> 4) + ',' + (d[i + 1] >> 4) + ',' + (d[i + 2] >> 4)); ok({ w: im.width, h: im.height, colours: seen.size }); }; im.src = 'data:image/png;base64,' + b64; }), sent[1].source.data);
    if (varied.w !== 1152 || varied.h !== 384 || varied.colours < 20) throw new Error('the picture does not look like three views of the object: ' + JSON.stringify(varied));
    await ev(k => __studio.loadScene(k), keep);
  });
  await step('describe it: a chess set, and its six-file export', async () => {
    const keep = await ev(() => __studio.sceneData());
    if (await ev(() => document.getElementById('aiPop').hidden)) await page.click('#aiBtn');
    // Six plain pieces, each a base and a body, all built at the origin as the prompt asks.
    // The parts are named three ways: a piece field and a name, a name only, a piece only.
    const H = { pawn: 0.6, rook: 0.75, knight: 0.85, bishop: 0.95, queen: 1.1, king: 1.2 };
    const parts = [];
    for (const [w, h] of Object.entries(H)){
      parts.push({ piece: w, name: w + ' base', shape: 'cylinder', outline: [[0, 0.5], [1, 0.5]], pos: [0, 0, 0], scale: [0.5, 0.1, 0.5], color: '#2e5a46' });
      if (w === 'queen') parts.push({ piece: 'queen', name: 'body', shape: 'cylinder', outline: [[0, 0.3], [1, 0.2]], pos: [0, 0.1, 0], scale: [0.5, h - 0.1, 0.5], color: '#2e5a46' });
      else parts.push({ name: w + ' body', shape: 'cylinder', outline: [[0, 0.3], [1, 0.2]], pos: [0, 0.1, 0], scale: [0.5, h - 0.1, 0.5], color: '#2e5a46' });
    }
    aiReply = claudeSays(JSON.stringify({ name: 'plain set', parts }));
    await ev(() => { document.getElementById('aiMode').value = 'set'; });
    await page.fill('#aiPrompt', 'a plain green set');
    await page.click('#aiGo');
    await page.waitForFunction(() => /6 pieces/.test(document.getElementById('aiStatus').textContent), null, { timeout: 5000 });
    if (!/CHESS SET/.test(aiSent[aiSent.length - 1].messages[0].content)) throw new Error('the request did not ask for a set');
    const laid = await ev(() => __studio.S.parts.map(p => ({ name: p.name, piece: __studio.pieceOf(p), x: p.pos[0] })));
    if (laid.length !== 12 || laid.some(p => !p.piece)) throw new Error('parts not all assigned to a piece: ' + laid.map(p => p.name).join(', '));
    if (!laid.some(p => p.name === 'queen body')) throw new Error('a part given only a piece field was not named after it');
    const xs = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'].map(w => laid.find(p => p.piece === w).x);
    if (!xs.every((x, i) => i === 0 || x - xs[i - 1] > 0.8)) throw new Error('the pieces were not laid out in a row: ' + xs.join(', '));

    // Export: six downloads, named for games, sharing one scale.
    const got = [];
    const done = new Promise(ok => { const on = async d => { got.push({ name: d.suggestedFilename(), text: await readFile(await d.path(), 'utf8') }); if (got.length === 6){ page.off('download', on); ok(); } }; page.on('download', on); });
    await ev(() => __studio.fileAction('chessSet'));
    await Promise.race([done, new Promise((_, no) => setTimeout(() => no(new Error('only ' + got.length + ' of 6 files came down')), 15000))]);
    const names = got.map(f => f.name).sort().join(',');
    if (names !== 'bishop.tvf3d,king.tvf3d,knight.tvf3d,pawn.tvf3d,queen.tvf3d,rook.tvf3d') throw new Error('files: ' + names);
    const b = Object.fromEntries(got.map(f => [f.name.replace('.tvf3d', ''), partsBounds(f.text)]));
    for (const [w, x] of Object.entries(b)){
      if (!got.find(f => f.name === w + '.tvf3d').text.startsWith('TVF3D-PARTS 2\n')) throw new Error(w + ' is not a two-part piece');
      if (Math.abs(x.lo[1]) > 0.02) throw new Error(w + ' does not stand on the board');
      if (Math.abs(x.lo[0] + x.hi[0]) > 0.03 || Math.abs(x.lo[2] + x.hi[2]) > 0.03) throw new Error(w + ' is not centred');
    }
    if (Math.abs(b.king.hi[1] - 1) > 0.03) throw new Error('the king should be one unit tall, is ' + b.king.hi[1].toFixed(3));
    for (const [w, h] of Object.entries(H)){
      const want = h / H.king, have = b[w].hi[1] / b.king.hi[1];
      if (Math.abs(have - want) > 0.03) throw new Error(w + ' is ' + (have * 100).toFixed(0) + '% of the king, should be ' + (want * 100).toFixed(0) + '%');
    }
    const wide = w => b[w].hi[0] - b[w].lo[0];
    if (Math.abs(wide('pawn') - wide('king')) > 0.02) throw new Error('the bases came out different sizes: the set was not scaled together');
    if (await ev(() => document.getElementById('aiMode').value) !== 'edit') throw new Error('did not move on to "change it"');
    await ev(k => __studio.loadScene(k), keep);
  });
  // ── scenes ──
  const VILLAGE = { name: 'test village', seed: 7, ground: { color: '#6b8a4e', size: 220 },
    areas: [
      { name: 'lake', water: true, color: '#3b6e94', center: [60, -80], radius: 15 },
      { name: 'lane', blocks: true, color: '#9b8b70', path: [[-30, -100], [-30, 100]], width: 6 }],
    types: [
      { name: 'boat', parts: [{ name: 'hull', shape: 'bowl', pos: [0, -0.3, 0], scale: [1.5, 0.6, 1.5], color: '#2d5fa8' }] },
      { name: 'road', parts: [{ name: 'road', shape: 'box', pos: [0, 0, 0], scale: [4, 0.02, 4], color: '#9b8b70' }] },
      { name: 'house', parts: [
        { name: 'walls', shape: 'box', pos: [0, 0, 0], scale: [6, 3.2, 5], color: '#e8dcc4' },
        { name: 'roof', shape: 'cone', section: { type: 'polygon', n: 4, k: 1, squash: 0.8 }, pos: [0, 3.2, 0], scale: [8.6, 2.6, 8.6], rot: [0, 45, 0], color: '#8c3b2e' },
        { name: 'door', shape: 'box', pos: [0, 0, 2.45], scale: [1.1, 2.1, 0.12], color: '#5a3a22' }] },
      { name: 'pine', parts: [
        { name: 'trunk', shape: 'cylinder', outline: [[0, 0.5], [1, 0.4]], pos: [0, 0, 0], scale: [0.5, 2, 0.5], color: '#5b3d26' },
        { name: 'crown', shape: 'cone', pos: [0, 1.5, 0], scale: [4.5, 8, 4.5], color: '#2f5d3a' }] },
      { name: 'oak', parts: [{ name: 'crown', shape: 'ball', pos: [0, 0, 0], scale: [6, 6, 6], color: '#4f7d39' }] },
      { name: 'rock', parts: [{ name: 'rock', shape: 'ball', pos: [0, -0.3, 0], scale: [1.6, 1.1, 1.3], color: '#8a8580' }] },
      { name: 'fence post', parts: [{ name: 'post', shape: 'box', pos: [0, 0, 0], scale: [0.15, 1.2, 0.15], color: '#7a5a3a' }] },
      { name: 'wheat', parts: [{ name: 'tuft', shape: 'cone', pos: [0, 0, 0], scale: [0.6, 1, 0.6], color: '#d8b85a' }] }],
    place: [
      { type: 'road', row: { from: [0, -90], to: [0, 90] }, every: 4 },                                   // 0: 46 tiles
      { type: 'house', row: { from: [-9, -60], to: [-9, 60] }, count: 10, rot: 'along', turn: 90 },       // 1
      { type: 'rock', ring: { center: [0, 0], radius: 5 }, count: 12, scale: [0.4, 0.6] },                // 2
      { type: 'fence post', row: { from: [25, -40], to: [25, 40] }, every: 2 },                           // 3: 41
      { type: 'wheat', grid: { rect: [30, -40, 70, 40] }, every: [1.6, 1.6], scale: [0.8, 1.2] },         // 4: 25 × 50
      { type: 'pine', scatter: { rect: [-105, -105, -20, 105] }, count: 300, scale: [0.7, 1.4] },         // 5
      { type: 'oak', scatter: { center: [60, 70], radius: 30 }, count: 30 },                              // 6
      { type: 'rock', scatter: { center: [0, 0], radius: 100 }, count: 80, exclude: [{ rect: [-4, -95, 4, 95] }, { rect: [28, -42, 72, 42] }] }, // 7
      { type: 'unicorn', at: [0, 0] },                                                                    // 8: no such type, skipped
      { type: 'boat', scatter: 'lake', count: 6 }] };                                                     // 9: on the water, by name
  const inst = () => ev(() => __scene.built().inst.map(o => ({ t: __scene.built().types[o.t].name, x: o.x, y: o.y, z: o.z, s: o.s, rule: o.rule, lv: o.lv, r: __scene.built().types[o.t].r * o.s })));
  let keepObject;
  await step('scene: build one from a description', async () => {
    keepObject = await ev(() => __studio.sceneData());
    await page.click('#vScene');
    if (!await ev(() => document.body.classList.contains('scene-mode'))) throw new Error('the scene view did not open');
    if (await ev(() => getComputedStyle(document.getElementById('xformSec')).display) !== 'none') throw new Error('the part panels still show in the scene view');
    if (await ev(() => document.getElementById('aiPop').hidden)) await page.click('#aiBtn');
    const modes = await ev(() => [...document.getElementById('aiMode').options].map(o => o.value).join(','));
    if (modes !== 'scene,scene-edit') throw new Error('describe offers ' + modes + ' in the scene view');
    aiReply = claudeSays(JSON.stringify(VILLAGE));
    await page.fill('#aiPrompt', 'a small farming village beside a forest');
    await page.click('#aiGo');
    await page.waitForFunction(() => /objects of/.test(document.getElementById('aiStatus').textContent), null, { timeout: 15000 });
    const sent = aiSent[aiSent.length - 1];
    if (!/Build a SCENE/.test(sent.messages[0].content) || !/SCENES\./.test(sent.system)) throw new Error('the request was not a scene request');
    const all = await inst(), by = r => all.filter(o => o.rule === r);
    if (by(0).length !== 46 || by(1).length !== 10 || by(2).length !== 12 || by(3).length !== 41 || by(4).length !== 1250) throw new Error('rule counts: ' + [0, 1, 2, 3, 4].map(r => by(r).length).join(','));
    if (by(5).length < 285 || by(6).length < 25) throw new Error('scatters came up short: ' + by(5).length + ' pines, ' + by(6).length + ' oaks');
    if (by(8).length) throw new Error('a rule naming a missing type placed something');
    // rows are straight and even, rings round
    const hs = by(1).map(o => o.z); if (!by(1).every(o => Math.abs(o.x + 9) < 1e-9) || hs.some((z, i) => i && Math.abs(z - hs[i - 1] - 120 / 9) > 1e-6)) throw new Error('the houses are not an even row');
    if (!by(2).every(o => Math.abs(Math.hypot(o.x, o.z) - 5) < 1e-6)) throw new Error('the ring is not round');
    // scattered copies keep apart, and keep out of excluded areas
    const sc = all.filter(o => o.rule >= 5);
    for (let i = 0; i < sc.length; i++) for (let j = i + 1; j < sc.length; j++){ const a = sc[i], b = sc[j];
      if (Math.hypot(a.x - b.x, a.z - b.z) < 0.9 * (a.r + b.r) - 1e-6) throw new Error(a.t + ' and ' + b.t + ' overlap at ' + a.x.toFixed(1) + ',' + a.z.toFixed(1)); }
    if (by(7).some(o => (Math.abs(o.x) <= 4 && Math.abs(o.z) <= 95) || (o.x >= 28 && o.x <= 72 && Math.abs(o.z) <= 42))) throw new Error('a scattered rock landed in an excluded area');
    // areas: boats only on the lake; nothing scattered on land lands in the lake or on the lane
    if (by(9).length !== 6 || by(9).some(o => Math.hypot(o.x - 60, o.z + 80) > 15)) throw new Error('boats: ' + by(9).length + ', not all on the lake');
    const wet = all.filter(o => o.rule >= 5 && o.rule <= 7 && Math.hypot(o.x - 60, o.z + 80) <= 15), onLane = all.filter(o => o.rule >= 5 && o.rule <= 7 && Math.abs(o.x + 30) <= 3 && Math.abs(o.z) <= 100);
    if (wet.length || onLane.length) throw new Error(wet.length + ' land things in the lake, ' + onLane.length + ' on the lane');
    if (await ev(() => __scene.built().ground.children.length) < 4) throw new Error('the areas were not drawn');
    if (!/1,[67]\d\d objects of 8 types/.test(await page.textContent('#scStats'))) throw new Error('stats: ' + await page.textContent('#scStats'));
    if ((await ev(() => document.getElementById('scTypes').children.length)) !== 8 || (await ev(() => document.getElementById('scRules').children.length)) !== 12) throw new Error('the scene panels were not filled');
  });
  await step('scene: copies are drawn finer near the camera', async () => {
    const all = await inst(), pine = all.find(o => o.t === 'pine');
    await ev(([x, z]) => __scene.cameraTo([x + 6, 5, z + 6], [x, 3, z]), [pine.x, pine.z]);
    const near = await inst(), me = near.find(o => o.x === pine.x && o.z === pine.z);
    if (me.lv !== 4) throw new Error('the pine beside the camera is at level ' + me.lv);
    // every copy at the level its distance, in its own sizes, calls for; some at the coarsest
    const wrong = await ev(([x, z]) => { const b = __scene.built(), N = __scene.NEAR; let bad = 0, coarse = 0;
      for (const o of b.inst){ const d = Math.hypot(x + 6 - o.x, 5 - o.y, z + 6 - o.z) / (b.types[o.t].size * o.s); let lv = 0; while (lv < N.length && d < N[lv]) lv++;
        if (lv !== o.lv) bad++; if (o.lv === 0) coarse++; } return { bad, coarse }; }, [pine.x, pine.z]);
    if (wrong.bad || wrong.coarse < 50) throw new Error(wrong.bad + ' copies at the wrong level, ' + wrong.coarse + ' at the coarsest');
    const drawn = await ev(() => __scene.built().types.reduce((n, T) => n + T.lod.reduce((m, L) => m + (L.mesh ? L.mesh.count : 0), 0), 0));
    if (drawn !== all.length) throw new Error(drawn + ' copies drawn of ' + all.length);
    await ev(() => __scene.frame());
  });
  await step('scene: shuffle rearranges, the rules stay', async () => {
    const a = await inst(); await page.click('#scShuffle'); const b = await inst();
    const same = r => JSON.stringify(a.filter(o => o.rule === r).map(o => [o.x, o.z])) === JSON.stringify(b.filter(o => o.rule === r).map(o => [o.x, o.z]));
    if (!same(1) || !same(2)) throw new Error('the rows and rings moved');
    if (same(5)) throw new Error('the forest did not move');
    await page.click('#undo'); const c = await inst();
    if (JSON.stringify(c.map(o => [o.x, o.z])) !== JSON.stringify(a.map(o => [o.x, o.z]))) throw new Error('undo did not bring the arrangement back');
  });
  await step('scene: edit a type and every copy changes', async () => {
    const before = await ev(() => __studio.S.parts.length);
    await ev(() => { const i = __scene.data().types.findIndex(t => t.name === 'house'); document.querySelector('#scTypes button[data-i="' + i + '"]').click(); });
    if (await ev(() => document.body.classList.contains('scene-mode'))) throw new Error('editing a type did not open the studio');
    const names = await ev(() => __studio.S.parts.map(p => p.name).join(','));
    if (names !== 'walls,roof,door') throw new Error('the type opened as ' + names);
    if (!/10 house copies/.test(await page.textContent('#typeBack'))) throw new Error('banner: ' + await page.textContent('#typeBack'));
    await ev(() => { __studio.S.parts[0].paint.color = '#2040ff'; __studio.S.parts[0].painted = false; });
    await page.click('#typeBack');
    if (!await ev(() => document.body.classList.contains('scene-mode'))) throw new Error('done did not return to the scene');
    if (await ev(() => __studio.S.parts.length) !== before) throw new Error('the object in the studio was not put back');
    const blue = await ev(() => { const T = __scene.built().types.find(t => t.name === 'house'), c = T.lod[4].geo.attributes.color.array; for (let i = 0; i < c.length; i += 3) if (c[i + 2] > 0.6 && c[i] < 0.3) return true; return false; });
    if (!blue) throw new Error('the house copies did not take the new colour');
    if ((await inst()).filter(o => o.t === 'house').length !== 10) throw new Error('the houses moved or were lost');
    await page.click('#undo');
    if (await ev(() => __scene.data().types.find(t => t.name === 'house').parts[0].paint.color) === '#2040ff') throw new Error('undo did not take the edit back');
  });
  await step('scene: saved and opened with the object', async () => {
    const n = (await inst()).length;
    const d = await download(() => ev(() => __studio.fileAction('save')));
    const j = JSON.parse(d.text); if (!j.scene || j.scene.types.length !== 8 || j.scene.areas.length !== 2 || j.view !== 'scene') throw new Error('the .3da has no scene');
    await page.click('#vObject'); await ev(() => __scene.set(null));
    await page.setInputFiles('#fileOpen', d.path);
    await page.waitForFunction(n => window.__scene.built() && __scene.built().inst.length === n && document.body.classList.contains('scene-mode'), n, { timeout: 10000 });
  });
  await step('scene: change it through describe', async () => {
    if (await ev(() => document.getElementById('aiPop').hidden)) await page.click('#aiBtn');
    await ev(() => window.__describeModes());
    if (await ev(() => document.getElementById('aiMode').value) !== 'scene-edit') throw new Error('describe did not offer to change the scene');
    const place = VILLAGE.place.filter(r => r.type !== 'oak').concat([{ type: 'cart', at: [3, 10], rot: 0 }]);
    aiReply = claudeSays(JSON.stringify({ name: 'test village', notes: 'Removed the oaks, added a cart.', types: [{ name: 'cart', parts: [{ name: 'bed', shape: 'box', pos: [0, 0.6, 0], scale: [1.4, 0.5, 2.6], color: '#7a5a3a' }] }], place }));
    await page.fill('#aiPrompt', 'no oaks, and a cart by the road');
    await page.click('#aiGo');
    await page.waitForFunction(() => /oaks/.test(document.getElementById('aiStatus').textContent), null, { timeout: 15000 });
    const sent = aiSent[aiSent.length - 1].messages[0].content;
    if (!/current scene/.test(sent) || !/"copies":/.test(sent) || !/"place":/.test(sent) || !/"areas":\[\{"name":"lake"/.test(sent)) throw new Error('the current scene was not sent');
    if (await ev(() => (__scene.data().areas || []).length) !== 2) throw new Error('a change that did not mention areas lost them');
    const types = await ev(() => __scene.data().types.map(t => t.name).sort().join(','));
    if (types !== 'boat,cart,fence post,house,pine,road,rock,wheat') throw new Error('types after the change: ' + types);
    if ((await inst()).some(o => o.t === 'oak')) throw new Error('the oaks are still there');
  });
  await step('scene: look & fix sends pictures of the scene', async () => {
    aiReply = claudeSays(JSON.stringify({ notes: 'The forest edge was bare; added bushes.', types: [{ name: 'bush', parts: [{ name: 'bush', shape: 'ball', pos: [0, 0, 0], scale: [1.2, 1, 1.2], color: '#3e6b35' }] }],
      place: (await ev(() => __scene.data().place)).concat([{ type: 'bush', scatter: { rect: [-25, -100, -15, 100] }, count: 40 }]) }));
    await page.fill('#aiPrompt', '');
    await page.click('#aiFix');
    await page.waitForFunction(() => /bushes/.test(document.getElementById('aiStatus').textContent), null, { timeout: 15000 });
    const sent = aiSent[aiSent.length - 1].messages[0].content;
    if (!Array.isArray(sent) || sent[1].type !== 'image' || sent[1].source.data.length < 20000 || !/The scene now/.test(sent[0].text)) throw new Error('the scene pictures were not sent');
    if (!(await inst()).some(o => o.t === 'bush')) throw new Error('the fix was not applied');
  });
  await step('scene: terrain, and copies standing on it', async () => {
    const HILLS = { name: 'hills', seed: 5, ground: { color: '#6b8a4e', size: 200 },
      terrain: [{ hill: [-40, 0], radius: 35, height: 20 }, { ridge: [[30, -80], [30, 80]], width: 30, height: 8 }],
      areas: [{ name: 'tarn', water: true, level: 2, center: [40, 60], radius: 12 }],
      types: [{ name: 'pine', parts: [{ name: 'crown', shape: 'cone', pos: [0, 0, 0], scale: [3, 7, 3], color: '#2f5d3a' }] },
              { name: 'boat', parts: [{ name: 'hull', shape: 'bowl', pos: [0, -0.3, 0], scale: [1.4, 0.6, 1.4], color: '#2d5fa8' }] },
              { name: 'hut', parts: [{ name: 'walls', shape: 'box', pos: [0, 0, 0], scale: [5, 3, 4], color: '#e8dcc4' }] }],
      place: [{ type: 'hut', at: [-40, 0] }, { type: 'pine', scatter: { center: [0, 0], radius: 95 }, count: 250, elevation: [8, 100] },
              { type: 'boat', scatter: 'tarn', count: 4 }, { type: 'hut', row: { from: [30, -60], to: [30, 0] }, count: 5 }] };
    await ev(h => __describe.applyScene(h, 'scene'), HILLS);
    const top = await ev(() => __scene.heightAt(-40, 0)), side = await ev(() => __scene.heightAt(-40, 30)), flat = await ev(() => __scene.heightAt(-90, 80)), under = await ev(() => __scene.heightAt(40, 60));
    if (Math.abs(top - 20) > 0.01 || !(side > 0 && side < 10) || Math.abs(flat) > 0.01) throw new Error('heights: top ' + top + ', side ' + side + ', flat ' + flat);
    if (!(under <= 0.5)) throw new Error('the land under the tarn is not below its surface: ' + under);
    const all = await inst(), hgt = await ev(pts => pts.map(([x, z]) => __scene.heightAt(x, z)), all.map(o => [o.x, o.z]));
    all.forEach((o, i) => o.g = hgt[i]);
    const hut = all.find(o => o.rule === 0); if (Math.abs(hut.y - 20) > 0.6) throw new Error('the hut on the hilltop stands at ' + hut.y);
    const pines = all.filter(o => o.t === 'pine'); if (pines.length < 50 || pines.some(o => o.g < 8)) throw new Error(pines.length + ' pines, some below 8 m');
    if (pines.some(o => o.y > o.g + 1e-6 || o.y < o.g - 3)) throw new Error('pines are not standing on the ground');
    const boats = all.filter(o => o.t === 'boat'); if (boats.length !== 4 || boats.some(o => Math.abs(o.y - 2) > 1e-6)) throw new Error('boats do not float at the tarn level: ' + boats.map(o => o.y).join(','));
    if (all.filter(o => o.rule === 3).some(o => Math.abs(o.y - o.g) > 3)) throw new Error('the row of huts on the ridge floats');
    const mesh = await ev(() => { const g = __scene.built().ground.children[0].geometry, P = g.attributes.position.array; let lo = 1e9, hi = -1e9; for (let i = 1; i < P.length; i += 3){ lo = Math.min(lo, P[i]); hi = Math.max(hi, P[i]); } return { n: P.length / 3, lo, hi }; });
    if (mesh.n < 10000 || mesh.hi < 19 || mesh.lo > 0.6) throw new Error('the terrain mesh: ' + JSON.stringify(mesh));
    if (!/terrain: 1 hill, 1 ridge/.test(await page.textContent('#scRules'))) throw new Error('the rules panel does not show the terrain');
  });
  await step('scene: walk and fly', async () => {
    await page.click('#navWalk');
    let c = await ev(() => ({ x: __studio.cam().position.x, y: __studio.cam().position.y, z: __studio.cam().position.z, nav: __scene.nav && __scene.nav.mode }));
    const g0 = await ev(([x, z]) => __scene.heightAt(x, z), [c.x, c.z]);
    if (c.nav !== 'walk' || Math.abs(c.y - g0 - 1.7) > 0.05) throw new Error('walk did not start at eye height on land: ' + JSON.stringify(c) + ' ground ' + g0);
    if (!await ev(() => !document.getElementById('navHint').hidden)) throw new Error('no walking hint');
    await page.keyboard.down('w'); await page.waitForTimeout(700); await page.keyboard.up('w');
    const c2 = await ev(() => ({ x: __studio.cam().position.x, y: __studio.cam().position.y, z: __studio.cam().position.z }));
    const g2 = await ev(([x, z]) => __scene.heightAt(x, z), [c2.x, c2.z]);
    if (Math.hypot(c2.x - c.x, c2.z - c.z) < 0.5) throw new Error('W did not move');
    if (Math.abs(c2.y - g2 - 1.7) > 0.05) throw new Error('walking left eye height');
    await page.click('#navFly');
    await page.keyboard.down(' '); await page.waitForTimeout(600); await page.keyboard.up(' ');
    const c3 = await ev(() => __studio.cam().position.y);
    if (!(c3 > c2.y + 2)) throw new Error('Space did not rise when flying: ' + c2.y + ' → ' + c3);
    await page.keyboard.press('Escape');
    if (await ev(() => !!__scene.nav || !__studio.orbit().enabled)) throw new Error('Esc did not return to orbiting');
  });
  await step('scene: streams follow the land, shores slope, streets face their road', async () => {
    const H = JSON.parse(await (await import('node:fs/promises')).readFile(new URL('./harbour.json', import.meta.url), 'utf8'));
    await ev(h => __describe.applyScene(h, 'scene'), H);
    // the stream runs downhill on the land, in a shallow bed, never in a canyon
    const up = await ev(() => [__scene.waterAt(88, -80), __scene.heightAt(88, -80)]), down = await ev(() => __scene.waterAt(86, 20));
    if (!(up[0] > 8) || !(up[0] > down + 5) || !(up[1] < up[0] && up[1] > up[0] - 1.5)) throw new Error('the stream does not follow the land: surface ' + up[0] + ' over ground ' + up[1] + ', downstream ' + down);
    const across = (x0, x1, z) => ev(([x0, x1, z]) => { const h = []; for (let x = x0; x <= x1; x += 0.5) h.push(__scene.heightAt(x, z)); return h; }, [x0, x1, z]);
    const steepest = h => Math.max(...h.slice(1).map((v, i) => Math.abs(v - h[i])));
    const bank = await across(70, 100, -50); if (steepest(bank) > 0.9) throw new Error('the stream bank drops ' + steepest(bank).toFixed(2) + ' m in half a metre');
    const shore = await ev(() => { const h = []; for (let z = 20; z <= 50; z += 0.5) h.push(__scene.heightAt(-30, z)); return h; });
    if (steepest(shore) > 0.9) throw new Error('the shore drops ' + steepest(shore).toFixed(2) + ' m in half a metre');
    // the ground holds every area, the fields beyond the stream included
    const size = await ev(() => __scene.built().size);
    if (!(size >= 2 * Math.hypot(160, 160))) throw new Error('the ground is ' + size + ' m across, too small for the areas');
    // the areas' edges are blended on the terrain, not stepped
    const mixed = await ev(() => { const c = __scene.built().ground.children[0].geometry.attributes.color.array, a = new THREE.Color('#6f9a4e'), b = new THREE.Color('#cfc4a8'); let n = 0;
      for (let i = 0; i < c.length; i += 3){ const t = (c[i] - a.r) / (b.r - a.r), u = (c[i + 1] - a.g) / (b.g - a.g); if (t > 0.15 && t < 0.85 && Math.abs(t - u) < 0.05) n++; } return n; });
    if (mixed < 50) throw new Error('only ' + mixed + ' blended vertices along the roads');
    // houses along the street: both sides, just off its edge, fronts to the road, none overlapping
    const homes = (await inst()).filter(o => o.rule === 0), mats = await ev(() => __scene.built().inst.filter(o => o.rule === 0).map(o => [o.m.elements[8], o.m.elements[10]]));
    const road = H.areas.find(a => a.name === 'high street').path;
    const near = (x, z) => { let best = [1e9]; for (let i = 0; i < road.length - 1; i++){ const [ax, az] = road[i], [bx, bz] = road[i + 1], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz; let t = ((x - ax) * dx + (z - az) * dz) / L; t = Math.max(0, Math.min(1, t));
      const px = ax + t * dx, pz = az + t * dz, d = Math.hypot(x - px, z - pz); if (d < best[0]) best = [d, px, pz, (x - ax) * dz - (z - az) * dx]; } return best; };
    let left = 0, right = 0;
    homes.forEach((o, i) => { const [d, px, pz, side] = near(o.x, o.z), [fx, fz] = mats[i], facing = (fx * (px - o.x) + fz * (pz - o.z)) / Math.hypot(fx, fz) / Math.max(1e-6, d);
      if (d < 4 || d > 9) throw new Error('a house stands ' + d.toFixed(1) + ' m from the street');
      if (facing < 0.7) throw new Error('a house does not face the street (' + facing.toFixed(2) + ')');
      if (side < 0) left++; else right++; });
    if (homes.length < 14 || left < 5 || right < 5) throw new Error(homes.length + ' houses, ' + left + ' on one side and ' + right + ' on the other');
    for (let i = 0; i < homes.length; i++) for (let j = i + 1; j < homes.length; j++) if (Math.hypot(homes[i].x - homes[j].x, homes[i].z - homes[j].z) < 3) throw new Error('two houses overlap on a bend');
    if (!/on both sides of <b>high street<\/b>|on both sides of high street/.test(await page.textContent('#scRules'))) throw new Error('rules panel: ' + await page.textContent('#scRules'));
  });
  await step('scene: prefabs, span, rows along a path, stretch', async () => {
    const box = (name, size, color, pos = [0, 0, 0]) => ({ name, shape: 'box', size, pos, color });
    const TOWN = { name: 'prefab town', seed: 11, ground: { color: '#6b8a4e', size: 220 },
      types: [
        { name: 'cottage', parts: [box('walls', [6, 3, 4], '#e8dcc4'), { name: 'roof', shape: 'roof', size: [6.6, 2, 4.8], pos: [0, 3, 0], color: '#8c3b2e' }] },
        { name: 'wall', parts: [box('stones', [1, 1, 0.4], '#9a948a')] },
        { name: 'flower', parts: [{ name: 'f', shape: 'ball', size: [0.4, 0.4, 0.4], pos: [0, 0, 0], color: '#d04a7a' }] },
        { name: 'post', parts: [box('post', [0.2, 1, 0.2], '#7a5a3a')] },
        { name: 'lamp', parts: [box('pole', [0.15, 3, 0.15], '#333333')] },
        { name: 'pine', parts: [{ name: 'crown', shape: 'cone', size: [3, 7, 3], pos: [0, 0, 0], color: '#2f5d3a' }] },
        { name: 'homestead', group: [
          { type: 'cottage', at: [0, 0] },
          { type: 'wall', span: { path: [[-5, 3], [-5, -8], [5, -8]] } },
          { type: 'flower', scatter: { rect: [-4, -7, 4, -4] }, count: 4 }] },
        { name: 'hamlet', group: [{ type: 'homestead', at: [-12, 0] }, { type: 'homestead', at: [12, 0] }] },
        { name: 'loop', group: [{ type: 'loop', at: [0, 0] }, { type: 'post', at: [1, 0] }] }],
      place: [
        { type: 'homestead', scatter: { rect: [-90, -90, -20, -20] }, count: 6 },               // 0
        { type: 'homestead', row: { path: [[60, -20], [60, 40], [90, 40]] }, count: 3 },          // 1: headings 0, 0, 90°
        { type: 'hamlet', at: [0, 70], rot: 30 },                                                 // 2: a prefab of prefabs
        { type: 'wall', span: { from: [-50, 0], to: [-20, 0] } },                                 // 3: one wall 30 m long
        { type: 'wall', span: { path: [[0, -40], [20, -40], [20, -20]] } },                       // 4: two walls, a corner
        { type: 'lamp', row: { path: [[0, -60], [30, -60], [30, -30]] }, every: 10 },             // 5: 7 lamps, round the corner
        { type: 'post', at: [-95, 40], stretch: [1, 3, 1] },                                      // 6: three times as tall
        { type: 'loop', at: [-60, 60] },                                                          // 7: a group holding itself stops
        { type: 'pine', scatter: { center: [0, 0], radius: 100 }, count: 300 }] };                // 8
    await page.click('#vScene');
    await ev(h => __describe.applyScene(h, 'scene'), TOWN);
    const all = await ev(() => { const b = __scene.built(); return b.inst.map(o => { const e = o.m.elements;
      return { t: b.types[o.t].name, len: b.types[o.t].len, x: o.x, z: o.z, rule: o.rule, yaw: Math.atan2(-e[2], e[0]), sx: Math.hypot(e[0], e[1], e[2]), sy: Math.hypot(e[4], e[5], e[6]) }; }); });
    const by = r => all.filter(o => o.rule === r), near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;
    const ang = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    const count = n => ev(n => __scene.built().types.find(t => t.name === n).count, n);
    // every copy of a prefab is laid out whole, in its own frame
    const homes = all.filter(o => o.t === 'cottage');
    if (homes.length !== 11 || await count('homestead') !== 11 || await count('hamlet') !== 1) throw new Error(homes.length + ' cottages, ' + await count('homestead') + ' homesteads counted');
    if (by(0).filter(o => o.t === 'cottage').length !== 6) throw new Error('the scattered prefabs came up short');
    const local = (h, o) => { const dx = o.x - h.x, dz = o.z - h.z, c = Math.cos(h.yaw), s = Math.sin(h.yaw); return [dx * c - dz * s, dx * s + dz * c]; };
    const gardens = [];
    for (const r of [0, 1, 2]){ const list = by(r); let h = null;
      for (const o of list){ if (o.t === 'cottage'){ h = o; gardens.push({ h, walls: [], flowers: [] }); continue; } const g = gardens[gardens.length - 1];
        if (o.t === 'wall') g.walls.push(o); if (o.t === 'flower') g.flowers.push(local(h, o)); } }
    for (const { h, walls } of gardens){
      if (walls.length !== 2) throw new Error('a homestead has ' + walls.length + ' walls');
      const [a, b] = walls.map(w => local(h, w));
      if (!near(a[0], -5, 1e-6) || !near(a[1], -2.5, 1e-6) || !near(b[0], 0, 1e-6) || !near(b[1], -8, 1e-6)) throw new Error('the garden walls are not where the prefab puts them: ' + JSON.stringify([a, b]));
      if (!near(walls[0].sx * walls[0].len, 11, 1e-3) || !near(walls[1].sx * walls[1].len, 10, 1e-3)) throw new Error('the garden walls do not reach corner to corner');
      if (ang(walls[1].yaw, h.yaw) > 1e-6 || ang(walls[0].yaw, h.yaw + Math.PI / 2) > 1e-6) throw new Error('the garden walls do not turn with the homestead'); }
    if (gardens.some(g => g.flowers.length !== 4 || g.flowers.some(([x, z]) => x < -4 || x > 4 || z < -7 || z > -4))) throw new Error('flowers outside their bed');
    if (JSON.stringify(gardens[0].flowers) === JSON.stringify(gardens[1].flowers)) throw new Error('two homesteads came out identical');
    // rows along a path: positions and headings, also for prefabs
    const row = by(1).filter(o => o.t === 'cottage');
    const want = [[60, -20, 0], [60, 25, 0], [90, 40, Math.PI / 2]];
    if (row.some((o, i) => !near(o.x, want[i][0]) || !near(o.z, want[i][1]) || ang(o.yaw, want[i][2]) > 1e-6)) throw new Error('the row along a path: ' + JSON.stringify(row.map(o => [o.x, o.z, o.yaw])));
    const lamps = by(5);
    if (lamps.length !== 7 || !lamps.every(o => (near(o.z, -60) && o.x >= -1e-9 && o.x <= 30 + 1e-9) || (near(o.x, 30) && o.z >= -60 && o.z <= -30)) || !lamps.some(o => near(o.x, 30) && near(o.z, -60))) throw new Error('lamps: ' + JSON.stringify(lamps.map(o => [o.x, o.z])));
    // a prefab of prefabs: two homesteads, 12 m either side, turned with it
    const hm = by(2).filter(o => o.t === 'cottage'), t30 = 30 * Math.PI / 180;
    if (hm.length !== 2 || !near(hm[0].x, -12 * Math.cos(t30)) || !near(hm[0].z, 70 + 12 * Math.sin(t30)) || ang(hm[0].yaw, t30) > 1e-6) throw new Error('the hamlet: ' + JSON.stringify(hm.map(o => [o.x, o.z, o.yaw])));
    if (by(7).length < 1 || by(7).length > 3) throw new Error('a group holding itself placed ' + by(7).length);
    // span: stretched end to end, laid along the line
    const w = by(3); if (w.length !== 1 || !near(w[0].x, -35) || !near(w[0].z, 0) || !near(w[0].sx * w[0].len, 30, 1e-3) || ang(w[0].yaw, 0) > 1e-6) throw new Error('span: ' + JSON.stringify(w));
    const c = by(4); if (c.length !== 2 || !near(c[1].x, 20) || !near(c[1].z, -30) || ang(c[1].yaw, -Math.PI / 2) > 1e-6 || !near(c[1].sx * c[1].len, 20, 1e-3)) throw new Error('span along a path: ' + JSON.stringify(c));
    // stretch: the rule makes one copy taller without touching the type
    const p = by(6)[0], q = by(7).find(o => o.t === 'post'); if (!near(p.sy, 3 * p.sx, 1e-6) || !near(q.sy, q.sx, 1e-6)) throw new Error('stretch: ' + p.sx + ' × ' + p.sy);
    // the yards stay clear: nothing scattered after lands inside a homestead
    const pines = by(8); if (pines.length < 200) throw new Error('only ' + pines.length + ' pines');
    for (const pn of pines) for (const g of gardens){ const [lx, lz] = local(g.h, pn); if (lx > -5 && lx < 5 && lz > -8 && lz < 2) throw new Error('a pine grew in a yard'); }
    // the panel, and what Claude is shown of the scene
    if (!/× 11 · prefab of 3 rules/.test(await page.textContent('#scTypes'))) throw new Error('panel: ' + await page.textContent('#scTypes'));
    const told = JSON.parse(await ev(() => __describe.describeSceneAI()));
    const ht = told.types.find(t => t.name === 'homestead'), wt = told.types.find(t => t.name === 'wall');
    if (!ht || ht.group.length !== 3 || ht.copies !== 11 || !wt || !near(wt.length, 1, 0.03) || !near(wt.height, 1, 0.03)) throw new Error('describeSceneAI: ' + JSON.stringify([ht, wt]));
    // a change that keeps only the rule placing homesteads keeps the types inside them
    await ev(() => __describe.applyScene({ types: [], place: [{ type: 'homestead', at: [0, 0] }] }, 'scene-edit'));
    const kept = await ev(() => __scene.data().types.map(t => t.name).sort().join(','));
    if (kept !== 'cottage,flower,homestead,wall') throw new Error('a change kept ' + kept);
    if ((await ev(() => __scene.built().inst.length)) !== 7) throw new Error('one homestead should be 7 copies');
  });
  await step('scene: the prefab library, placed by hand', async () => {
    await ev(() => __scene.set(null));
    if (!/place a prefab/.test(await page.textContent('#scStats'))) throw new Error('the empty scene does not point to the prefabs');
    const names = await ev(() => [...document.querySelectorAll('#scLib button')].map(b => b.dataset.lib).join(','));
    if (names !== 'homestead,terrace,farmstead,churchyard,market,windmill,well,grove,campsite,cathedral close,octave rows') throw new Error('library: ' + names);
    await page.click('#scLib button[data-lib="homestead"]');
    if (!await ev(() => __scene.data() && __scene.data().place.length === 0)) throw new Error('picking a prefab with no scene did not start one');
    if (!/place a homestead/.test(await page.textContent('#placeHint')) || await ev(() => document.getElementById('placeHint').hidden)) throw new Error('no placing hint');
    await ev(() => __scene.cameraTo([0, 60, 80], [0, 0, 0]));
    const [cx, cy] = await viewCentre();
    await page.mouse.click(cx, cy);
    let d = await ev(() => __scene.data());
    if (d.place.length !== 1 || d.place[0].type !== 'homestead') throw new Error('a click did not place a homestead: ' + JSON.stringify(d.place));
    const r0 = d.place[0]; if (Math.hypot(r0.at[0], r0.at[1]) > 1 || r0.rot !== 0) throw new Error('placed at ' + r0.at + ' turned ' + r0.rot + ', not at the middle facing the camera');
    if (d.types.map(t => t.name).sort().join(',') !== 'bush,cottage,garden wall,homestead,vegetables') throw new Error('types: ' + d.types.map(t => t.name));
    const cot = await ev(() => __scene.built().inst.filter(o => __scene.built().types[o.t].name === 'cottage').map(o => [o.x, o.z]));
    if (cot.length !== 1 || Math.hypot(cot[0][0] - r0.at[0], cot[0][1] - r0.at[1]) > 1e-6) throw new Error('no cottage where it was placed');
    // R turns the next one; a drag (orbiting) places nothing; a second one reuses the types
    await page.keyboard.press('r');
    await page.mouse.click(cx + 200, cy);
    await page.mouse.move(cx - 200, cy + 100); await page.mouse.down(); await page.mouse.move(cx - 150, cy + 60, { steps: 4 }); await page.mouse.up();
    d = await ev(() => __scene.data());
    if (d.place.length !== 2 || d.types.length !== 5) throw new Error(d.place.length + ' rules, ' + d.types.length + ' types after a second click and a drag');
    const face = Math.round(Math.atan2(0 - d.place[1].at[0], 80 - d.place[1].at[1]) * 180 / Math.PI / 15) * 15;
    if (d.place[1].rot !== face + 45) throw new Error('R did not turn it: ' + d.place[1].rot + ', facing ' + face);
    // Esc stops; undo takes the last one away
    await page.keyboard.press('Escape');
    if (await ev(() => __library.placing()) || !await ev(() => document.getElementById('placeHint').hidden)) throw new Error('Esc did not stop placing');
    await page.mouse.click(cx - 200, cy); if (await ev(() => __scene.data().place.length) !== 2) throw new Error('a click placed something after Esc');
    await page.click('#undo'); if (await ev(() => __scene.data().place.length) !== 1) throw new Error('undo did not remove the last one');
    // a different type of the same name is kept; the library's comes in renamed
    await ev(() => __describe.applyScene({ name: 'mine', seed: 1, ground: { color: '#6b8a4e', size: 300 }, types: [{ name: 'oak', parts: [{ name: 'blob', shape: 'ball', pos: [0, 0, 0], scale: [3, 3, 3], color: '#ff0000' }] }], place: [{ type: 'oak', at: [100, 100] }] }, 'scene'));
    // every prefab in the library builds, side by side
    const all = await ev(() => __library.names), spots = all.map((n, i) => [-100 + (i % 3) * 60, -60 + Math.floor(i / 3) * 60]);
    for (const [i, n] of all.entries()) await ev(([n, at]) => __library.add(n, at, 0), [n, spots[i]]);
    d = await ev(() => __scene.data());
    const tn = d.types.map(t => t.name);
    if (!tn.includes('oak') || !tn.includes('oak 2') || d.types.find(t => t.name === 'oak').parts.length !== 1) throw new Error('the scene\'s own oak was not kept apart: ' + tn);
    const farm = d.types.find(t => t.name === 'farmstead'); if (!farm.group.some(r => r.type === 'oak 2')) throw new Error('the farmstead does not use the library oak');
    const counts = await ev(() => { const b = __scene.built(); return Object.fromEntries(b.types.map(T => [T.name, T.count])); });
    for (const n of all) if (!(counts[n] >= 1)) throw new Error(n + ' was not built: ' + JSON.stringify(counts));
    if (counts.stall !== 6 || counts['town house'] !== 5 || counts.tent !== 5 || counts.church !== 1 || counts['oak 2'] < 6 || counts.oak !== 1) throw new Error('counts: ' + JSON.stringify(counts));
    if (await ev(() => __scene.built().short) > 2) throw new Error(await ev(() => __scene.built().short) + ' scattered copies did not fit');
    // the cathedral: its masses at full height (the crossing spire's tip 69 m up: parts were once held within 20 m),
    // and twelve bays standing against the aisles, six a side, facing out
    if (counts.cathedral !== 1 || counts['cathedral bay'] !== 12) throw new Error('cathedral: ' + JSON.stringify(counts));
    const cath = await ev(() => { const b = __scene.built(), T = b.types.find(T => T.name === 'cathedral'), c = b.inst.find(o => b.types[o.t] === T), bi = b.types.findIndex(T => T.name === 'cathedral bay');
      return { h: T.h, parts: __scene.data().types.find(t => t.name === 'cathedral').parts.length,
        bays: b.inst.filter(o => o.t === bi).map(o => { const e = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().extractRotation(o.m)); return [o.x - c.x, Math.round(new THREE.Vector3(0, 0, 1).applyEuler(e).x)]; }) }; });
    if (!(cath.h > 66 && cath.h < 72)) throw new Error('the cathedral stands ' + cath.h + ' m, not 69');
    if (cath.parts !== 24) throw new Error('the cathedral kept ' + cath.parts + ' of its 24 parts');
    if (cath.bays.some(([dx, out]) => Math.abs(Math.abs(dx) - 13) > 0.01 || Math.sign(dx) !== out) || cath.bays.filter(b => b[0] > 0).length !== 6) throw new Error('bays: ' + JSON.stringify(cath.bays));
    // one house in each octave of a walking reader's distance (h = 1.7 m), octaves 2 to 9: the left row all one size,
    // the right row scaled with distance, each house at the same bearing and so reading the same in its own octave
    await ev(() => __scene.set(null)); await ev(() => __library.add('octave rows', [0, 0], 0));
    const oc = await ev(() => __scene.built().inst.map(o => [o.x, -o.z, o.s])), L = oc.filter(o => o[0] < 0).sort((a, b) => a[1] - b[1]), Rr = oc.filter(o => o[0] > 0).sort((a, b) => a[1] - b[1]);
    const okRow = (row, scaled) => row.length === 8 && row.every((o, k) => Math.abs(o[1] - Math.SQRT2 * 2 ** (k + 2) * 1.7) < 0.01 && Math.abs(o[2] - (scaled ? 2 ** (k - 2) : 1)) < 1e-9 && (!scaled || Math.abs(o[0] / o[1] - Rr[0][0] / Rr[0][1]) < 1e-3));
    if (!okRow(L, false) || !okRow(Rr, true)) throw new Error('octave rows: ' + JSON.stringify(oc));
  });
  await step('scene: detail by octaves, from prefixes of the rungs', async () => {
    // a rock: a ball with a sculpted cascade, each rung's detail half the last's (a 1/f surface)
    const made = await ev(() => { const p = __studio.partFrom('ball', { name: 'rock', pos: [0, 0, 0], scale: [1, 1, 1] }); ensureCascade(p); usePart(p);
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
      p.cascade.forEach((rg, r) => { for (let k = 0; k < rg.v.length; k++) rg.v[k] = 0.12 * Math.pow(0.5, r) * rnd(); });
      p.sculpted = true;
      const ring = []; for (let i = 0; i < 25; i++){ const a = i / 25 * Math.PI * 2; ring.push([Math.sin(a) * 2, Math.cos(a) * 2]); }
      __scene.set({ name: 'rocks', seed: 3, ground: { color: '#6b8a4e', size: 400 }, types: [{ name: 'rock', parts: [partData(p)] }, { name: 'post', parts: [partData(__studio.partFrom('cylinder', { name: 'post' }))] }],
        place: [{ type: 'rock', row: { from: [0, 0], to: [0, 0] }, count: 1 }, { type: 'rock', row: { from: [1.5, -1], to: [1.5, -150] }, count: 300 }, { type: 'rock', scatter: { center: [0, 0], radius: 190 }, count: 700 }, { type: 'post', row: { from: [-3, -2], to: [-3, -60] }, count: 30 }] }, 'rocks');
      const b = __scene.built(), T = b.types[0];
      return { oct: T.oct, plain: b.types[1].oct, near: __scene.NEAR_OCT, n: b.inst.length }; });
    if (!made.oct || made.plain || JSON.stringify(made.near) !== '[20,10,5,2.5]') throw new Error('thresholds: ' + JSON.stringify(made));
    // level 0 is the base alone, level l the base and rungs 0..l-1: what each adds over the shorter prefix halves level on level,
    // and what it lacks of the whole surface shrinks to nothing at the top
    const lv = await ev(() => __scene.built().types[0].lod.map(L => { const P = L.geo.attributes.position.array, P0 = L.geo.attributes.posPrev.array, n = P.length / 3;
      let add = 0; for (let i = 0; i < P.length; i++) add += (P[i] - P0[i]) ** 2; return { verts: n, add: Math.sqrt(add / n) }; }));
    const res = await ev(() => { const T = __scene.built().types[0], p = partFromData(__scene.data().types[0].parts[0]), out = [];
      for (let l = 0; l < T.lod.length; l++){ const P = T.lod[l].geo.attributes.position.array, n = P.length / 3;
        const NT = [8, 16, 24, 40, 72][l], NH = [3, 6, 12, 24, 48][l];
        const g = buildGeometry(p, [NT, NH], Infinity), F = g.attributes.position.array; let e = 0;
        if (F.length !== P.length){ g.dispose(); return 'level ' + l + ' is ' + n + ' vertices, not ' + F.length / 3; }
        for (let i = 0; i < P.length; i++) e += (P[i] - F[i]) ** 2; g.dispose(); out.push(Math.sqrt(e / n)); }
      return out; });
    if (typeof res === 'string') throw new Error(res);
    const adds = lv.map(x => x.add);
    if (lv.map(x => x.verts).some((v, i, a) => i && i < 4 && v <= a[i - 1])) throw new Error('levels do not grow: ' + lv.map(x => x.verts));
    if (adds[0] !== 0 || !(adds[1] > 0)) throw new Error('level 0 should be the bare base, level 1 add rung 0: ' + adds.map(a => a.toExponential(2)));
    for (let l = 2; l < 5; l++){ const k = adds[l] / adds[l - 1]; if (!(k > 0.3 && k < 0.75)) throw new Error('rung ' + (l - 1) + ' adds ' + k.toFixed(2) + ' of rung ' + (l - 2) + "'s detail: " + adds.map(a => a.toExponential(2))); }
    if (!(res[0] > res[1] && res[1] > res[2] && res[2] > res[3] && res[3] > res[4]) || res[4] > 1e-9) throw new Error('what each level lacks of the whole surface: ' + res.map(a => a.toExponential(2)));
    // copies: one rung per octave of distance, fading in across it
    await ev(() => __scene.cameraTo([0, 0.9, 1.6], [0, 0.5, -50]));
    const cp = await ev(() => { const b = __scene.built(), T = b.types[0], c = __studio.cam().position;
      return b.inst.filter(o => o.t === 0).map(o => ({ d: Math.hypot(c.x - o.x, c.y - o.y, c.z - o.z) / (T.size * o.s), k: 156 * T.leaf / T.size, lv: o.lv, fade: o.fade })); });
    const bad = cp.filter(o => { const x = Math.log2(o.k / o.d); let plain = 0; while (plain < 4 && o.d < [40, 12, 5, 2][plain]) plain++; const want = Math.max(plain, Math.max(0, Math.min(4, Math.floor(x)))); return o.lv !== want || Math.abs(o.fade - Math.max(0, Math.min(1, x - want))) > 1e-9; });
    if (bad.length) throw new Error(bad.length + ' copies off the octave rule, e.g. ' + JSON.stringify(bad[0]));
    const levels = [0, 1, 2, 3, 4].map(l => cp.filter(o => o.lv === l).length);
    if (levels.some(n => n === 0)) throw new Error('copies per level: ' + levels);
    const arriving = cp.filter(o => o.lv > 0 && o.lv < 4 && Math.abs(o.d - o.k / 2 ** o.lv) < 0.02 * o.d);
    if (arriving.some(o => o.fade > 0.05)) throw new Error('a rung appears at full strength as it arrives');
    const early = cp.filter(o => o.lv > 0 && o.d >= o.k / 2 ** o.lv);   // a finer mesh for the outline before the rung is due
    if (early.some(o => o.fade !== 0)) throw new Error('a rung shows before its octave');
    // the blend reached the GPU: the fade went with every copy, and the shader compiled
    const fades = await ev(() => __scene.built().types[0].lod.map(L => L.mesh && L.geo.getAttribute('fade') === L.fade && L.fade.array.length >= L.mesh.count));
    if (fades.some(f => !f)) throw new Error('a level has no fade per copy');
    await page.waitForTimeout(300);
    if (shaderErrors.length) throw new Error('shader: ' + shaderErrors[0]);
    const tri = await ev(() => __scene.stats().tris); console.log('  1,000 rocks and 30 posts, copies per level ' + levels.join('/') + ', ' + Math.round(tri).toLocaleString() + ' triangles drawn');
  });
  await step('scene: back to the object view', async () => {
    await page.click('#vObject');
    if (await ev(() => document.body.classList.contains('scene-mode'))) throw new Error('still in the scene view');
    if (!await ev(() => __studio.S.parts.every(p => p.mesh.visible))) throw new Error('the parts stayed hidden');
    if (await ev(() => [...document.getElementById('aiMode').options].map(o => o.value).includes('scene'))) throw new Error('describe still offers scenes');
    await ev(k => __studio.loadScene(k), keepObject);
  });
  await step('describe it: parts given by size, and the roof shape', async () => {
    const keep = await ev(() => __studio.sceneData());
    await ev(() => __describe.apply({ name: 'shed', parts: [
      { name: 'walls', shape: 'box', size: [6, 3, 4], pos: [0, 0, 0], color: '#e8dcc4' },
      { name: 'barrel', shape: 'cylinder', size: [1, 1.4, 1], pos: [5, 0, 0], color: '#7a5a3a' },
      { name: 'roof', shape: 'roof', size: [6.6, 2, 4.8], pos: [0, 3, 0], color: '#8c3b2e' },
      { name: 'porch roof', shape: 'roof', size: [3, 1, 2], pos: [-5, 2, 0], rot: [0, 90, 0], color: '#8c3b2e' }] }, 'new'));
    const got = await ev(() => Object.fromEntries(__studio.S.parts.map(p => { p.mesh.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(p.mesh);
      // the ridge: where the highest vertices are, across the roof
      const P = p.mesh.geometry.attributes.position, v = new THREE.Vector3(); let top = -1e9, at = [];
      for (let i = 0; i < P.count; i++){ v.fromBufferAttribute(P, i).applyMatrix4(p.mesh.matrixWorld); if (v.y > top + 1e-4){ top = v.y; at = [v.clone()]; } else if (v.y > top - 1e-4) at.push(v.clone()); }
      return [p.name, { lo: b.min.toArray(), hi: b.max.toArray(), ridge: at.map(q => [q.x, q.z]) }]; })));
    const is = (n, lo, hi, e = 0.06) => { const b = got[n]; if (!b) throw new Error('no ' + n);
      for (let k = 0; k < 3; k++) if (Math.abs(b.lo[k] - lo[k]) > e || Math.abs(b.hi[k] - hi[k]) > e) throw new Error(n + ' spans ' + JSON.stringify([b.lo, b.hi]) + ', not ' + JSON.stringify([lo, hi])); };
    is('walls', [-3, 0, -2], [3, 3, 2]);
    is('barrel', [4.5, 0, -0.5], [5.5, 1.4, 0.5]);
    is('roof', [-3.3, 3, -2.4], [3.3, 5, 2.4]);                     // eaves at pos, ridge 2 m up, overhanging the walls
    is('porch roof', [-6, 2, -1.5], [-4, 3, 1.5]);                 // turned 90°: the ridge runs along z
    if (got.roof.ridge.some(([x, z]) => Math.abs(z) > 0.05) || Math.max(...got.roof.ridge.map(q => q[0])) - Math.min(...got.roof.ridge.map(q => q[0])) < 6) throw new Error('the roof ridge does not run along its length');
    if (got['porch roof'].ridge.some(([x]) => Math.abs(x + 5) > 0.05)) throw new Error('the turned roof ridge is not along z');
    await ev(k => __studio.loadScene(k), keep);
  });
  await step('describe it: doors and windows set flush into a face', async () => {
    const keep = await ev(() => __studio.sceneData());
    const win = (name, face, at, size = [1, 1.2, 0.1]) => ({ name, shape: 'box', size, on: 'walls', face, at, color: '#3a4a5a' });
    await ev(ps => __describe.apply({ name: 'house', parts: ps }, 'new'), [
      { name: 'walls', shape: 'box', size: [6, 3, 4], pos: [2, 0, -1], rot: [0, 30, 0], color: '#e8dcc4' },
      { name: 'door', shape: 'box', size: [1, 2.1, 0.12], on: 'walls', face: 'front', at: [0, 0], color: '#5a3a22' },
      win('front window', 'front', [1.8, 1]), win('back window', 'back', [-1, 1]), win('left window', 'left', [1, 1.2]), win('right window', 'right', [0]),
      { name: 'chimney', shape: 'box', size: [0.6, 1.5, 0.6], on: 'walls', face: 'top', at: [2, 1], color: '#7a6a5a' }]);
    // every part's corners, in the walls' own frame (centred, unturned)
    const got = await ev(() => { const t = 30 * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
      return Object.fromEntries(__studio.S.parts.map(p => { p.mesh.updateMatrixWorld(true); const P = p.mesh.geometry.attributes.position, v = new THREE.Vector3(), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
        for (let i = 0; i < P.count; i++){ v.fromBufferAttribute(P, i).applyMatrix4(p.mesh.matrixWorld); const dx = v.x - 2, dz = v.z + 1, q = [dx * c - dz * s, v.y, dx * s + dz * c];
          for (let k = 0; k < 3; k++){ lo[k] = Math.min(lo[k], q[k]); hi[k] = Math.max(hi[k], q[k]); } }
        return [p.name, { lo, hi, rot: p.rot }]; })); });
    const is = (n, lo, hi, e = 0.03) => { const b = got[n]; if (!b) throw new Error('no ' + n);
      for (let k = 0; k < 3; k++) if (Math.abs(b.lo[k] - lo[k]) > e || Math.abs(b.hi[k] - hi[k]) > e) throw new Error(n + ' spans ' + JSON.stringify([b.lo, b.hi].map(a => a.map(x => +x.toFixed(3)))) + ', not ' + JSON.stringify([lo, hi])); };
    is('walls', [-3, 0, -2], [3, 3, 2]);
    is('door', [-0.5, 0, 2 - 0.036], [0.5, 2.1, 2 + 0.084]);              // on the front, its back 30% inside the wall
    is('front window', [1.3, 1, 1.97], [2.3, 2.2, 2.07]);                  // across = to the right seen from outside: +x on the front
    is('back window', [0.5, 1, -2.07], [1.5, 2.2, -1.97]);                 // on the back, seen from behind, the right is -x
    is('left window', [-3.07, 1.2, 0.5], [-2.97, 2.4, 1.5]);               // on the left, the right is +z
    is('right window', [2.97, 0.9, -0.5], [3.07, 2.1, 0.5]);               // no height given: centred on the face
    is('chimney', [1.7, 2.98, 0.7], [2.3, 4.48, 1.3]);                     // on top, at x 2, z 1
    if (Math.abs(got['left window'].rot[1] - (30 - 90)) > 1e-6) throw new Error('the left window was not turned to face out: ' + got['left window'].rot);
    // the same in a scene type: the part's pos is worked out before the type is built
    await ev(() => __describe.applyScene({ name: 't', seed: 1, ground: { color: '#6b8a4e', size: 60 }, types: [{ name: 'hut', parts: [
      { name: 'walls', shape: 'box', size: [4, 2.5, 3], pos: [0, 0, 0], color: '#e8dcc4' },
      { name: 'door', shape: 'box', size: [0.9, 2, 0.1], on: 'walls', face: 'right', at: [0, 0], color: '#5a3a22' }] }], place: [{ type: 'hut', at: [0, 0] }] }, 'scene'));
    const door = await ev(() => __scene.data().types[0].parts[1]);
    if (Math.abs(door.pos[0] - 2.02) > 0.005 || Math.abs(door.pos[2]) > 1e-6 || Math.abs(door.rot[1] - 90) > 1e-6) throw new Error('the hut door: ' + JSON.stringify([door.pos, door.rot]));
    await page.click('#vObject'); await ev(() => __scene.set(null));
    await ev(k => __studio.loadScene(k), keep);
  });
  await step('describe it: surface detail, laid rung by rung', async () => {
    const keep = await ev(() => __studio.sceneData());
    await ev(() => __describe.apply({ name: 'walls', parts: [
      { name: 'wall', shape: 'box', size: [6, 3, 4.5], pos: [0, 0, 0], color: '#b9b2a4', detail: { pattern: 'stones', size: 0.35, depth: 0.06, color: '#5d5850' } },
      { name: 'roof', shape: 'roof', size: [6.8, 2.4, 5.4], pos: [0, 3, 0], color: '#7d4a36', detail: { pattern: 'shingles', size: 0.3, depth: 0.05 } },
      { name: 'coarse', shape: 'box', size: [6, 3, 4.5], pos: [12, 0, 0], color: '#b9b2a4', detail: { pattern: 'stones', size: 1.2, depth: 0.06 } },
      { name: 'odd', shape: 'box', size: [1, 1, 1], pos: [20, 0, 0], detail: { pattern: 'polka dots', size: 0.2 } },
      { name: 'big', shape: 'box', size: [1, 1, 1], pos: [24, 0, 0], detail: { pattern: 'bark', size: 99, depth: 7 } }] }, 'new'));
    const r = await ev(() => { const P = n => __studio.S.parts.find(p => p.name === n), w = P('wall'), c = P('coarse');
      // energy per rung: a fine pattern sits in the fine rungs, a coarse one lower down
      const share = p => { const e = p.cascade.map(rg => { let s = 0; for (const x of rg.v) s += x * x; return s / rg.v.length; }), t = e.reduce((a, b) => a + b, 0); return e.map(x => x / t); };
      // the rungs summed at the finest leaves give back the pattern averaged over each leaf's cell
      usePart(w); const q = w.detail, rg = w.cascade[3], [Pm, Hm] = girth(w), sr = (Math.abs(w.scale[0]) + Math.abs(w.scale[2])) / 2, vals = []; let worst = 0;
      for (let n = 0; n < 40; n++){ const j = (n * 37) % rg.Nt, i = (n * 11) % rg.Nh, th = (j + 0.5) * 2 * Math.PI / rg.Nt, h = (i + 0.5) / rg.Nh; let dd = 0;
        for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) dd += patternAt('stones', (th + ((a + 0.5) / 4 - 0.5) * 2 * Math.PI / rg.Nt) / (2 * Math.PI) * Pm, (h + ((b + 0.5) / 4 - 0.5) / rg.Nh) * Hm, q.size, 0).d;
        vals.push([evalFull(th, h), dd / 16 * q.depth / sr]); }
      for (const [e, t] of vals) worst = Math.max(worst, Math.abs((e - vals[0][0]) - (t - vals[0][1])));   // the mean taken out cancels in the differences
      // the mesh, read on the grid, is what radiusAt and colorAt give point by point
      const g = buildGeometry(w, [48, 24], 2), Pos = g.attributes.position.array, Col = g.attributes.color.array; let gridErr = 0;
      usePart(w); rungCap = 2;
      for (let n = 0; n < 30; n++){ const a = (n * 7) % 24, j = (n * 13) % 48, k = a * 48 + j, th = j / 48 * 2 * Math.PI, h = a / 23, rad = radiusAt(w, th, h), col = colorAt(w, th, h, [0, 0, 0]);
        gridErr = Math.max(gridErr, Math.abs(Pos[k * 3] - rad * Math.cos(th)), Math.abs(Pos[k * 3 + 2] - rad * Math.sin(th)), Math.abs(Col[k * 3] - Math.max(0, Math.min(1, col[0])))); }
      rungCap = Infinity; g.dispose();
      const d = partData(w), back = partFromData(d), g1 = buildGeometry(w, [32, 12]), g2 = buildGeometry(back, [32, 12]); let same = 0;
      for (let i = 0; i < g1.attributes.position.array.length; i++) same = Math.max(same, Math.abs(g1.attributes.position.array[i] - g2.attributes.position.array[i]));
      g1.dispose(); g2.dispose();
      return { fine: share(w), coarse: share(c), worst, gridErr, eng: w.eng, saved: JSON.stringify(d).length, hasCascade: !!d.cascade, detail: d.detail, same,
        roof: P('roof').detail, odd: !!P('odd').detail, big: P('big').detail, oddCascade: !!P('odd').cascade }; });
    if (!(r.fine[3] > r.fine[0] && r.coarse[0] + r.coarse[1] > r.fine[0] + r.fine[1])) throw new Error('rung shares, fine ' + r.fine.map(x => x.toFixed(2)) + ', coarse ' + r.coarse.map(x => x.toFixed(2)));
    if (r.worst > 1e-9) throw new Error('the rungs do not sum to the pattern at the finest leaves: ' + r.worst);
    if (r.gridErr > 1e-6) throw new Error('the mesh read on the grid differs from radiusAt / colorAt by ' + r.gridErr);   // the mesh holds 32-bit floats
    if (!(r.eng.baseT > 8)) throw new Error('a wide wall kept 8 leaves round: ' + JSON.stringify(r.eng));
    if (r.hasCascade || r.saved > 1500 || r.detail.pattern !== 'stones' || r.same > 1e-12) throw new Error('saved ' + r.saved + ' bytes, cascade ' + r.hasCascade + ', reopened differs by ' + r.same);
    if (!r.roof.across) throw new Error('the roof pattern does not run across its slope');
    if (r.odd || r.oddCascade || r.big.size !== 5 || r.big.depth !== 0.5) throw new Error('clamping: ' + JSON.stringify([r.odd, r.big]));
    // in a scene: far copies plain, near ones patterned
    await ev(() => __describe.applyScene({ name: 'd', seed: 1, ground: { color: '#6b8a4e', size: 200 }, types: [{ name: 'wall', parts: [{ name: 'w', shape: 'box', size: [1, 1.1, 0.5], pos: [0, 0, 0], color: '#a8a298', detail: { pattern: 'stones', size: 0.2, depth: 0.04, color: '#4a463f' } }] }],
      place: [{ type: 'wall', row: { from: [0, 0], to: [0, -90] }, count: 40 }] }, 'scene'));
    const sc = await ev(() => { const T = __scene.built().types[0], d = __scene.data().types[0].parts[0];
      const spread = L => { const C = L.geo.attributes.color.array; let lo = 9, hi = -9; for (let i = 0; i < C.length; i += 3){ lo = Math.min(lo, C[i]); hi = Math.max(hi, C[i]); } return hi - lo; };
      return { oct: T.oct, cascade: !!d.cascade, spread: T.lod.map(spread) }; });
    if (!sc.oct || sc.cascade) throw new Error('the scene type: ' + JSON.stringify(sc));
    if (!(sc.spread[0] < 0.02 && sc.spread[4] > 0.15)) throw new Error('colour spread by level (far plain, near jointed): ' + sc.spread.map(x => x.toFixed(3)));
    if (!/"detail"\?: \{"pattern"/.test(await ev(() => __describe.SYS))) throw new Error('the prompt does not offer detail');
    await page.click('#vObject'); await ev(() => __scene.set(null));
    await ev(k => __studio.loadScene(k), keep);
  });
  await step('the height axis: new parts flattened, patterned parts even', async () => {
    const keep = await ev(() => __studio.sceneData());
    await ev(() => __describe.apply({ name: 'axes', parts: [
      { name: 'post', shape: 'box', size: [1, 2, 1], pos: [0, 0, 0], color: '#b9b2a4' },
      { name: 'wall', shape: 'box', size: [6, 3, 4.5], pos: [4, 0, 0], color: '#b9b2a4', detail: { pattern: 'bricks', size: 0.3, depth: 0.05 } }] }, 'new'));
    const r = await ev(() => { const P = n => __studio.S.parts.find(p => p.name === n), post = P('post'), wall = P('wall');
      // a smooth sculpt (slope at the top and bottom) on rung 1, held both ways; read near the ends
      const g = h => 0.02 * (Math.sin(2.3 * h + 0.4) + 0.5 * h * h), endErr = {};
      for (const k of ['dct', 'flat']){ post.cascade = null; post.eng.hkernel = k; ensureCascade(post); usePart(post); const rg = post.cascade[1];
        for (let i = 0; i < rg.Nh; i++) for (let j = 0; j < rg.Nt; j++) rg.v[i * rg.Nt + j] = g(leafH(i, rg.Nh));
        endErr[k] = Math.max(...[0.005, 0.02, 0.98, 0.995].map(h => Math.abs(rungEval(rg, 0.3, h) - g(h)))); }
      post.cascade = null; post.eng.hkernel = 'flat';
      // the advanced panel's choice switches the part's kernel
      __studio.select_(post.id); drawAdvanced(); const sel = document.getElementById('advKern'), shown = sel && sel.value;
      sel.value = 'dct'; sel.dispatchEvent(new Event('change')); const switched = post.eng.hkernel;
      return { post: 'flat', wall: wall.eng.hkernel, endErr, shown, switched, newKern: post.eng.hkernel }; });
    if (r.wall !== 'dct') throw new Error('a patterned part should keep the even axis, has ' + r.wall);
    if (r.shown !== 'flat') throw new Error('the advanced panel shows ' + r.shown + ' for a new part');
    if (r.switched !== 'dct') throw new Error('choosing the even axis left the part at ' + r.switched);
    if (!(r.endErr.flat <= r.endErr.dct / 3)) throw new Error('flattened ends no better at the top and bottom: dct ' + r.endErr.dct + ', flat ' + r.endErr.flat);
    console.log(`  smooth sculpt near the ends, rung 1: dct ${r.endErr.dct.toExponential(1)}, flat ${r.endErr.flat.toExponential(1)}`);
    await ev(k => __studio.loadScene(k), keep);
  });
  await step('scene: copies varied, swaying and bobbing', async () => {
    const keep = await ev(() => __studio.sceneData());
    const box = (name, size, color, pos = [0, 0, 0]) => ({ name, shape: 'box', size, pos, color });
    const types = [
      { name: 'rock', parts: [{ name: 'rock', shape: 'ball', size: [1.2, 0.7, 1], pos: [0, 0, 0], color: '#8a8580' }] },
      { name: 'pine', parts: [box('trunk', [0.3, 2, 0.3], '#5a4030'), { name: 'crown', shape: 'cone', size: [3, 7, 3], pos: [0, 1.5, 0], color: '#2f5d3a' }] },
      { name: 'buoy', parts: [{ name: 'buoy', shape: 'ball', size: [1, 1, 1], pos: [0, 0, 0], color: '#d04a2a' }] },
      { name: 'grove', group: [{ type: 'pine', scatter: { center: [0, 0], radius: 6 }, count: 3 }] }];
    const scene = (move) => ({ name: 'moving', seed: 3, ground: { color: '#6b8a4e', size: 120 }, types, place: [
      { type: 'rock', scatter: { rect: [-30, -30, 30, -10] }, count: 60, vary: 0.1 },
      { type: 'pine', scatter: { rect: [-20, 0, 20, 20] }, count: 25, ...(move ? { sway: 0.3 } : {}) },
      { type: 'buoy', at: [25, 25], ...(move ? { bob: 0.2 } : {}) },
      { type: 'grove', at: [-25, 25], ...(move ? { sway: 0.2 } : {}) },
      { type: 'rock', at: [0, -40] }] });
    try {
    await page.click('#vScene');   // start from the scene view, whatever the steps before left
    await ev(h => __describe.applyScene(h, 'scene'), scene(true));
    const r = await ev(() => { const b = __scene.built(), by = i => b.inst.filter(o => o.rule === i);
      const rocks = by(0), seeds = new Set(rocks.map(o => o.anim[0].toFixed(6)));
      return { rocks: rocks.length, seeds: seeds.size, varied: rocks.every(o => o.anim[1] > 0), sway: by(1).every(o => o.anim[2] === 0.3 && o.anim[1] === 0),
        bob: by(2).every(o => o.anim[3] === 0.2), grove: by(3).length > 0 && by(3).every(o => o.anim[2] === 0.2), still: by(4).every(o => o.anim[1] === 0 && o.anim[2] === 0 && o.anim[3] === 0),
        text: document.getElementById('scRules') ? document.getElementById('scRules').textContent : '' }; });
    if (r.seeds < 0.95 * r.rocks || !r.varied) throw new Error('varied rocks: ' + r.seeds + ' seeds for ' + r.rocks + ' copies, varied ' + r.varied);
    if (!r.sway || !r.bob) throw new Error('sway or bob not carried to the copies: ' + JSON.stringify(r));
    if (!r.grove) throw new Error("a prefab's rules did not take the sway of the rule that placed it");
    if (!r.still) throw new Error('a rule without vary, sway or bob moved its copies');
    if (!/varied/.test(r.text) || !/swaying/.test(r.text) || !/bobbing/.test(r.text)) throw new Error('rules panel: ' + r.text);
    // the motion shows: two frames apart differ with sway and bob, and match without
    // A scene changes for a moment after it is laid out (the levels settle), then holds still: so wait
    // for the still scene to hold, and give the moving one the same time, before comparing two frames.
    const canvas = page.locator('canvas').first(), shots = async () => { const a = await canvas.screenshot(); await page.waitForTimeout(700); const b = await canvas.screenshot(); return a.equals(b); };
    const settle = async () => { await page.waitForTimeout(1500); for (let i = 0; i < 6 && !(await shots()); i++); };
      await ev(h => __describe.applyScene(h, 'scene'), scene(false)); await settle();
      if (!(await shots())) throw new Error('the same scene without sway or bob changed between frames');
      await ev(h => __describe.applyScene(h, 'scene'), scene(true)); await page.waitForTimeout(1500); await shots();
      const t0 = await ev(() => __scene.uTime.value); await page.waitForTimeout(300);
      if (!((await ev(() => __scene.uTime.value)) > t0)) throw new Error('the scene clock did not run');
      if (await shots()) throw new Error('the swaying scene did not move between frames');
      if (!/"vary": 0 to 0.2/.test(await ev(() => __describe.SCENE_SYS)) || !/"sway"/.test(await ev(() => __describe.SCENE_SYS))) throw new Error('the scene prompt does not offer vary and sway');
    } finally {   // back to the object view whatever happened, so a failure here does not fail the steps after it
      await page.click('#vObject'); await ev(() => __scene.set(null));
      await ev(k => __studio.loadScene(k), keep);
    }
  });
  await step('scene: the wander view, octave shells and arrivals', async () => {
    const keep = await ev(() => __studio.sceneData());
    const pine = { name: 'pine', parts: [{ name: 'crown', shape: 'cone', size: [3, 7, 3], pos: [0, 0, 0], color: '#2f5d3a' }] };
    const scene = sway => ({ name: 'wander', seed: 5, ground: { color: '#6b8a4e', size: 160 }, types: [pine], place: [{ type: 'pine', scatter: { rect: [-50, -50, 50, 50] }, count: 80, ...(sway ? { sway: 0.3 } : {}) }] });
    // the picture itself, read from the WebGL canvas (not a screenshot, which would also hold the toolbar over it, and the button's hover)
    const pix = () => ev(() => renderer.domElement.toDataURL()), still = async () => { await page.waitForTimeout(1500); let a = await pix();
      for (let i = 0; i < 6; i++){ await page.waitForTimeout(700); const b = await pix(); if (a === b) return a; a = b; } return a; };
    try {
      await page.click('#vScene'); await ev(h => __describe.applyScene(h, 'scene'), scene(false));
      if (await ev(() => getComputedStyle(document.getElementById('wanderC')).display) !== 'none') throw new Error('the signals slider shows with the wander view off');
      const off = await still();
      await page.click('#wanderBtn');
      const st = await ev(() => ({ on: __scene.WV.on.value, H: __scene.WV.H.value, eye: __scene.WV.eye.value.distanceTo(__studio.cam().position), shown: getComputedStyle(document.getElementById('wanderC')).display !== 'none', btn: document.getElementById('wanderBtn').classList.contains('on') }));
      if (!st.on || !st.btn || !st.shown) throw new Error('the wander view did not turn on: ' + JSON.stringify(st));
      // the reader's h is the eye's height above the flat ground, and its eye is the camera
      const camY = await ev(() => __studio.cam().position.y);
      if (Math.abs(st.H - camY) > 0.05 || st.eye > 1e-6) throw new Error(`the reader: h ${st.H} for an eye ${camY} above flat ground, eye ${st.eye} from the camera`);
      const on = await still();
      if (on === off) throw new Error('the octave shells did not change the picture');
      // the signals' speed, 2 to 400 m/s on the slider
      await page.locator('#wanderCIn').fill('0'); if (await ev(() => [__scene.WV.C.value, document.getElementById('wanderCVal').textContent].join()) !== '2,2 m/s') throw new Error('the slider at 0 is not 2 m/s');
      await page.locator('#wanderCIn').fill('1000'); if (Math.abs(await ev(() => __scene.WV.C.value) - 400) > 1e-9) throw new Error('the slider at the top is not 400 m/s');
      await ev(() => __scene.setC(40));
      // arrivals: the copies' program reads its sway late by its distance from the eye, at that speed
      const prog = await ev(() => { const p = renderer.info.programs.find(p => /USE_INSTANCING/.test(p.cacheKey) && p.getUniforms().map.uEye); return p ? { eye: !!p.getUniforms().map.uEye, c: !!p.getUniforms().map.uC } : null; });
      if (!prog || !prog.eye || !prog.c) throw new Error('the copies are not read by their arrival: ' + JSON.stringify(prog));
      await ev(h => __describe.applyScene(h, 'scene'), scene(true)); await page.waitForTimeout(1500);
      const a = await pix(); await page.waitForTimeout(700);
      if (a === await pix()) throw new Error('the gust does not move in the wander view');
      // off again, the still scene is drawn exactly as before
      await page.click('#wanderBtn'); await ev(h => __describe.applyScene(h, 'scene'), scene(false));
      if ((await still()) !== off) throw new Error('the scene is not drawn as before with the wander view off again');
    } finally {
      await ev(() => { __scene.setWander(false); __scene.setC(40); }); await page.click('#vObject'); await ev(() => __scene.set(null));
      await ev(k => __studio.loadScene(k), keep);
    }
  });
  await step('file → new starts over: the object and the scene, from either view', async () => {
    const keep = await ev(() => __studio.sceneData()), n0 = await parts();
    try {
      if (!(n0 > 0)) throw new Error('no parts to start from');
      await page.click('#vScene'); await ev(() => { __scene.set(null); __library.add('well', [0, 0], 0); });
      await ev(() => __studio.fileAction('new'));
      if (await ev(() => __scene.data()) !== null || await parts() !== 0) throw new Error('"new" in the scene view did not clear both: ' + (await parts()) + ' parts, scene ' + !!(await ev(() => __scene.data())));
      await page.click('#undo');
      if (!(await ev(() => __scene.data() && __scene.data().place.length === 1)) || await parts() !== n0) throw new Error('one undo did not bring both back');
      await page.click('#vObject'); await ev(() => __studio.fileAction('new'));
      if (await ev(() => __scene.data()) !== null || await parts() !== 0) throw new Error('"new" in the object view did not clear both');
    } finally { await page.click('#vObject'); await ev(() => __scene.set(null)); await ev(k => __studio.loadScene(k), keep); }
  });
  await step('describe it: built from a picture', async () => {
    const keep = await ev(() => __studio.sceneData());
    const png = (w, h, col) => ev(([w, h, col]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = '#204080'; g.fillRect(w / 4, h / 4, w / 2, h / 2); return c.toDataURL('image/png').split(',')[1]; }, [w, h, col]);
    const file = async (name, w, h, col) => ({ name, mimeType: 'image/png', buffer: Buffer.from(await png(w, h, col), 'base64') });
    if (await ev(() => document.getElementById('aiPop').hidden)) await page.click('#aiBtn');
    await ev(() => { document.getElementById('aiMode').value = 'new'; });
    await page.setInputFiles('#aiPicFile', [await file('chair.png', 2400, 1200, '#c08040')]);
    await page.waitForFunction(() => document.querySelectorAll('#aiPics img').length === 1, null, { timeout: 5000 });
    aiReply = claudeSays(JSON.stringify({ name: 'chair', notes: 'Took the seat and legs from the photo.', parts: [{ name: 'seat', shape: 'box', size: [0.5, 0.06, 0.5], pos: [0, 0.45, 0], color: '#c08040' }] }));
    await page.fill('#aiPrompt', '');
    await page.click('#aiGo');
    await page.waitForFunction(() => /seat and legs/.test(document.getElementById('aiStatus').textContent), null, { timeout: 15000 });
    let c = aiSent[aiSent.length - 1].messages[0].content;
    if (!Array.isArray(c) || c[0].type !== 'image' || c[0].source.media_type !== 'image/jpeg' || c[c.length - 1].type !== 'text') throw new Error('the picture was not sent first');
    const dims = await ev(d => new Promise(ok => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.src = 'data:image/jpeg;base64,' + d; }), c[0].source.data);
    if (dims[0] !== 1568 || dims[1] !== 784) throw new Error('the picture was sent at ' + dims.join(' × ') + ', not shrunk to 1568 across');
    if (!/Build: the object in the picture/.test(c[1].text) || !/Build the object it shows/.test(c[1].text)) throw new Error('the request text: ' + c[1].text);
    if (await ev(() => __studio.S.parts.map(p => p.name).join(',')) !== 'seat') throw new Error('the reply was not built');
    // look & fix compares with the picture as well as the renders
    aiReply = claudeSays(JSON.stringify({ notes: 'Closer to the photo now.', parts: [{ id: await ev(() => __studio.S.parts[0].id), name: 'seat', color: '#a06030' }] }));
    await page.click('#aiFix');
    await page.waitForFunction(() => /Closer to the photo/.test(document.getElementById('aiStatus').textContent), null, { timeout: 15000 });
    c = aiSent[aiSent.length - 1].messages[0].content;
    const imgs = c.filter(b => b.type === 'image').map(b => b.source.media_type).join(',');
    if (imgs !== 'image/jpeg,image/png' || !c.some(b => b.type === 'text' && /reference/.test(b.text))) throw new Error('look & fix sent ' + imgs);
    // three at most; × takes one off
    await page.setInputFiles('#aiPicFile', [await file('a.png', 300, 200, '#808080'), await file('b.png', 200, 300, '#808080'), await file('c.png', 100, 100, '#808080')]);
    await page.waitForFunction(() => /three pictures at most/.test(document.getElementById('aiStatus').textContent), null, { timeout: 5000 });
    if (await ev(() => document.querySelectorAll('#aiPics img').length) !== 3) throw new Error('more than three pictures were taken');
    await page.click('#aiPics button[data-i="0"]');
    if (await ev(() => document.querySelectorAll('#aiPics img').length) !== 2 || await ev(() => document.getElementById('aiPop').hidden)) throw new Error('× did not take one off, or closed the panel');
    // a place asked for as an object: Claude says so, and it is built as a scene instead
    await ev(() => { document.getElementById('aiMode').value = 'new'; });
    const n0 = await parts(), sent0 = aiSent.length;
    aiReply = [claudeSays('{"place": true}'), claudeSays(JSON.stringify({ name: 'harbour', notes: 'Built from the map.', ground: { color: '#6b8a4e', size: 100 },
      types: [{ name: 'hut', parts: [{ name: 'walls', shape: 'box', size: [4, 3, 3], pos: [0, 0, 0], color: '#e8dcc4' }] }], place: [{ type: 'hut', row: { from: [-20, 0], to: [20, 0] }, count: 5 }] }))];
    await page.fill('#aiPrompt', 'this village');
    await page.click('#aiGo');
    await page.waitForFunction(() => /Built from the map/.test(document.getElementById('aiStatus').textContent), null, { timeout: 15000 });
    if (!/reply exactly \{"place": true\}/.test(aiSent[sent0].system) || aiSent.length !== sent0 + 2) throw new Error('the place was not sent twice: ' + (aiSent.length - sent0) + ' requests');
    if (!/place, not one object/.test(await page.textContent('#aiStatus')) && !/Built from the map/.test(await page.textContent('#aiStatus'))) throw new Error('status: ' + await page.textContent('#aiStatus'));
    const again = aiSent[sent0 + 1].messages[0].content;
    if (!/Build a SCENE: this village/.test(again[again.length - 1].text) || again.filter(b => b.type === 'image').length !== 2) throw new Error('the scene request did not carry the words and pictures');
    if (!await ev(() => document.body.classList.contains('scene-mode')) || await ev(() => __scene.built().inst.length) !== 5) throw new Error('the place was not built as a scene');
    if (await parts() !== n0) throw new Error('the object was changed by a place');
    await page.click('#vObject'); await ev(() => __scene.set(null));
    // a scene from the pictures: the guidance on reading maps and photos goes with it
    await page.click('#vScene'); if (await ev(() => document.getElementById('aiPop').hidden)) await page.click('#aiBtn');
    await ev(() => { window.__describeModes(); document.getElementById('aiMode').value = 'scene'; });
    aiReply = claudeSays(JSON.stringify({ name: 'from a map', notes: 'A lake in the middle, as on the map.', ground: { color: '#6b8a4e', size: 120 }, areas: [{ name: 'lake', water: true, center: [0, 0], radius: 20 }],
      types: [{ name: 'hut', parts: [{ name: 'walls', shape: 'box', size: [4, 3, 3], pos: [0, 0, 0], color: '#e8dcc4' }] }], place: [{ type: 'hut', ring: { center: [0, 0], radius: 30 }, count: 6 }] }));
    await page.fill('#aiPrompt', 'a village round the lake');
    await page.click('#aiGo');
    await page.waitForFunction(() => /as on the map/.test(document.getElementById('aiStatus').textContent), null, { timeout: 15000 });
    c = aiSent[aiSent.length - 1].messages[0].content;
    if (c.filter(b => b.type === 'image').length !== 2 || !/Build a SCENE: a village round the lake/.test(c[2].text) || !/MAP, PLAN/.test(c[2].text)) throw new Error('the scene request: ' + JSON.stringify(c.map(b => b.type === 'text' ? b.text.slice(0, 80) : b.type)));
    await ev(() => { document.querySelectorAll('#aiPics button').forEach(() => document.querySelector('#aiPics button').click()); });
    if (await ev(() => document.querySelectorAll('#aiPics img').length)) throw new Error('pictures left attached');
    await page.click('#vObject'); await ev(() => __scene.set(null));
    await ev(k => __studio.loadScene(k), keep);
  });
  await step('describe it: errors are reported, nothing changes', async () => {
    const n = await parts();
    if (await ev(() => document.getElementById('aiPop').hidden)) await page.click('#aiBtn');   // undo, a click outside, closed it
    await page.fill('#aiPrompt', 'a teapot');
    // a reply cut off at the limit: room was asked for, and the message says what to do
    aiReply = { status: 200, body: { stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"name":"teapot","parts":[{"name":"body","shape":"ball","pos":[0,0' }] } };
    await page.click('#aiGo');
    await page.waitForFunction(() => /ran out of room before it was finished/.test(document.getElementById('aiStatus').textContent), null, { timeout: 5000 });
    if (aiSent[aiSent.length - 1].max_tokens !== 64000) throw new Error('asked for ' + aiSent[aiSent.length - 1].max_tokens + ' tokens, not 64000');
    if (!/COMPACT/.test(aiSent[aiSent.length - 1].system)) throw new Error('the prompt does not ask for compact JSON');
    if (await parts() !== n) throw new Error('a cut-off reply changed the object');
    aiReply = claudeSays('Sorry, I can only describe it in words.');
    await page.click('#aiGo');
    await page.waitForFunction(() => /no object came back/.test(document.getElementById('aiStatus').textContent), null, { timeout: 5000 });
    aiReply = { status: 524, raw: '<html><body>A timeout occurred</body></html>' };
    await page.click('#aiGo');
    await page.waitForFunction(() => /timed out/.test(document.getElementById('aiStatus').textContent), null, { timeout: 5000 });
    aiReply = { status: 401, body: { error: { type: 'authentication_error', message: 'bad session' } } };
    await page.click('#aiGo');
    await page.waitForFunction(() => /signed out/.test(document.getElementById('aiStatus').textContent), null, { timeout: 5000 });
    if (await parts() !== n) throw new Error('a failed request changed the object');
    if (!/^sign in$/.test((await page.textContent('#aiSignIn')).trim())) throw new Error('a 401 did not sign out');
    await page.keyboard.press('Escape'); await page.mouse.click(700, 400);
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
