// Smoke test for classic.html, the previous editor: load it in headless Chromium
// and work every control that does not open a file dialog or start a download:
// each preset, each brush and symmetry, every checkbox and slider, the boolean
// and profile buttons, the rung and sheet buttons, and a sculpting drag on the
// view. Then its assemble mode: both examples, every part slider, dragging a
// part, adding, duplicating, deleting, editing a part in sculpt and bringing it
// back. Fails if the page throws an uncaught error.
//
//   npm test                       serves the repo itself on a free port
//   BASE_URL=http://host/ npm test test an already-running server instead
//
// Console errors (a CDN hiccup) are printed but do not fail the run; uncaught
// exceptions do.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SETTLE_MS = Number(process.env.SETTLE_MS || 250);    // time each action gets to run
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };

/* Buttons the walk does not press: they open a file dialog, start a download
   or write to the clipboard. The assembly's controls (asm…, mode…) are left
   out of the general walk and exercised in order in their own section. */
const SKIP = new Set(['bExport', 'bSTL', 'bLoad', 'bCopy', 'bLoadImg']);
const ownSection = id => id.startsWith('asm') || id.startsWith('mode');

function serve(){
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    try {
      const body = await readFile(join(ROOT, path || 'index.html'));
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

const server = process.env.BASE_URL ? null : await serve();
const base = process.env.BASE_URL || `http://127.0.0.1:${server.address().port}/`;

const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

let current = 'page load';
const failures = [];
page.on('pageerror', e => failures.push(`[${current}] ${e.message}`));
page.on('console', m => { if (m.type() === 'error') console.log(`  console (${current}): ${m.text().slice(0, 200)}`); });
page.on('dialog', d => d.dismiss().catch(() => {}));

/* One named step: run it, give the page a moment, report. */
async function step(name, fn){
  current = name;
  const before = failures.length;
  try { await fn(); } catch (e){ failures.push(`[${name}] ${e.message.split('\n')[0]}`); }
  await page.waitForTimeout(SETTLE_MS);
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${name}`);
}

/* Set a control's value the way a person would, firing input then change. */
const setValue = (id, value) => page.evaluate(([id, value]) => {
  const el = document.getElementById(id);
  if (el.type === 'checkbox') el.checked = value; else el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}, [id, value]);

const options = id => page.evaluate(id => [...document.getElementById(id).options].map(o => o.value), id);

async function sculpt(){
  const box = await page.evaluate(() => {
    const cv = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const r = cv.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(box.x - 60, box.y);
  await page.mouse.down();
  for (let i = 0; i <= 12; i++) await page.mouse.move(box.x - 60 + i * 10, box.y + Math.round(Math.sin(i / 2) * 20), { steps: 2 });
  await page.mouse.up();
}

let code = 0;
try {
  await page.goto(new URL('classic.html', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof THREE !== 'undefined' && document.querySelector('canvas'), null, { timeout: 60000 });
  await page.waitForTimeout(1000);
  console.log('page loaded');

  await step('drag on the view', sculpt);

  for (const v of await options('selPreset')) await step(`preset ${v}`, () => setValue('selPreset', v));
  await step('preset back to knight', () => setValue('selPreset', 'knight'));

  for (const v of await options('selBrush')){
    await step(`brush ${v}`, async () => { await setValue('selBrush', v); await sculpt(); });
  }
  for (const v of await options('selSym')) await step(`symmetry ${v}`, () => setValue('selSym', v));
  for (const v of await options('selOp')) await step(`operand ${v}`, () => setValue('selOp', v));
  for (const v of await options('selCurveTarget')) await step(`curve target ${v}`, () => setValue('selCurveTarget', v));

  const checkboxes = await page.evaluate(() => [...document.querySelectorAll('input[type=checkbox][id]')].map(c => c.id));
  for (const id of checkboxes){
    await step(`toggle ${id}`, async () => {
      const was = await page.evaluate(id => document.getElementById(id).checked, id);
      await setValue(id, !was);
      await page.waitForTimeout(SETTLE_MS);
      await setValue(id, was);
    });
  }

  const ranges = await page.evaluate(() => [...document.querySelectorAll('input[type=range][id]')]
    .map(r => ({ id: r.id, min: r.min || '0', max: r.max || '100', value: r.value })));
  for (const r of ranges){
    await step(`slider ${r.id}`, async () => {
      for (const v of [r.min, r.max, r.value]){ await setValue(r.id, v); await page.waitForTimeout(80); }
    });
  }

  const buttons = (await page.evaluate(skip => [...document.querySelectorAll('button[id]')]
    .filter(b => !skip.includes(b.id) && b.id !== 'gearBtn' && b.id !== 'menuClose')
    .map(b => b.id), [...SKIP])).filter(id => !ownSection(id));
  for (const id of buttons){
    await step(`button ${id}`, () => page.evaluate(id => document.getElementById(id).click(), id));
  }
  await step('open and close settings', async () => {
    await page.evaluate(() => document.getElementById('gearBtn').click());
    await page.waitForTimeout(SETTLE_MS);
    await page.evaluate(() => document.getElementById('menuClose').click());
  });
  await step('drag on the view again', sculpt);

  // ── the assembly ──
  const click = id => page.evaluate(id => document.getElementById(id).click(), id);
  const parts = () => page.evaluate(() => asm.parts.length);
  await step('switch to assemble', () => click('modeAssemble'));
  await step('example: snowman', async () => {
    await click('asmExSnowman');
    if (await parts() < 5) throw new Error('the snowman example made ' + await parts() + ' parts');
  });
  await step('example: table', async () => {
    await click('asmExTable');
    if (await parts() < 5) throw new Error('the table example made ' + await parts() + ' parts');
  });
  for (const id of ['asmPX', 'asmPY', 'asmPZ', 'asmRX', 'asmRY', 'asmRZ', 'asmSize', 'asmSX', 'asmSY', 'asmSZ']){
    await step(`part slider ${id}`, async () => {
      const r = await page.evaluate(id => { const e = document.getElementById(id); return { min: e.min, max: e.max, value: e.value }; }, id);
      for (const v of [r.min, r.max, r.value]){ await setValue(id, v); await page.waitForTimeout(40); }
    });
  }
  await step('drag a part', async () => {
    const before = await page.evaluate(() => asm.parts.map(p => p.pos.join()).join('|'));
    await page.mouse.move(640, 400); await page.mouse.down();
    await page.mouse.move(720, 430, { steps: 6 }); await page.mouse.up();
    const after = await page.evaluate(() => asm.parts.map(p => p.pos.join()).join('|'));
    if (before === after) throw new Error('dragging on the table moved no part');
  });
  await step('rename and recolour a part', async () => {
    await page.fill('#asmName', 'renamed'); await setValue('asmColor', '#33aa55');
  });
  await step('part to floor, duplicate, delete', async () => {
    const n = await parts();
    await click('asmFloor'); await click('asmDup');
    if (await parts() !== n + 1) throw new Error('duplicate did not add a part');
    await click('asmDel');
    if (await parts() !== n) throw new Error('delete did not remove a part');
  });
  for (const v of await options('asmPreset')){
    await step(`add preset part ${v}`, async () => { await setValue('asmPreset', v); await click('asmAddPreset'); });
  }
  await step('edit a part in sculpt and bring it back', async () => {
    await page.evaluate(() => asmSelect(1));
    await click('asmEdit');
    if (await page.evaluate(() => asm.on)) throw new Error('edit in sculpt did not switch to sculpt');
    await sculpt();
    await click('asmBack');
    if (!await page.evaluate(() => asm.on)) throw new Error('update part did not return to the assembly');
  });
  await step('add the sculpted shape', async () => {
    const n = await parts(); await click('asmAdd');
    if (await parts() !== n + 1) throw new Error('adding the sculpted shape did not add a part');
  });
  await step('save and reopen in memory', async () => {
    const same = await page.evaluate(() => { const a = asmSerialize(); asmDeserialize(a); return asmSerialize() === a; });
    if (!same) throw new Error('an assembly saved and reopened does not save the same again');
  });
  await step('clear all', () => click('asmClear'));
  await step('back to sculpt', async () => { await click('modeSculpt'); await sculpt(); });
} catch (e){
  failures.push(`[${current}] ${e.message.split('\n')[0]}`);
}

if (failures.length){
  console.error(`\n${failures.length} failure(s):\n` + failures.map(f => '  ' + f).join('\n'));
  code = 1;
} else {
  console.log('\nno uncaught errors');
}
await browser.close();
server?.close();
process.exit(code);
