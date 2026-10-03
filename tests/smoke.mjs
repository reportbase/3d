// Smoke test: load 3d.html in headless Chromium and work every control that
// does not open a file dialog or start a download: each preset, each brush and
// symmetry, every checkbox and slider, the boolean and profile buttons, the
// rung and sheet buttons, and a sculpting drag on the view. Fails if the page
// throws an uncaught error.
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
   or write to the clipboard. */
const SKIP = new Set(['bExport', 'bSTL', 'bLoad', 'bCopy', 'bLoadImg']);

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
  await page.goto(new URL('3d.html', base).href, { waitUntil: 'load' });
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

  const buttons = await page.evaluate(skip => [...document.querySelectorAll('button[id]')]
    .filter(b => !skip.includes(b.id) && b.id !== 'gearBtn' && b.id !== 'menuClose')
    .map(b => b.id), [...SKIP]);
  for (const id of buttons){
    await step(`button ${id}`, () => page.evaluate(id => document.getElementById(id).click(), id));
  }
  await step('open and close settings', async () => {
    await page.evaluate(() => document.getElementById('gearBtn').click());
    await page.waitForTimeout(SETTLE_MS);
    await page.evaluate(() => document.getElementById('menuClose').click());
  });
  await step('drag on the view again', sculpt);
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
