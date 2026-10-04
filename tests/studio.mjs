// Smoke test for studio.html, the interface mockup: every example, every tool,
// every section type and starting shape, dragging an outline point, sculpting a
// part in place, the move/turn/size modes, duplicate/delete and undo/redo.
// Fails if the page throws an uncaught error or an action has no effect.
//
//   node tests/studio.mjs            (npm test runs it after smoke.mjs)

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

const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 1360, height: 820 } });

let current = 'page load';
const failures = [];
page.on('pageerror', e => failures.push(`[${current}] ${e.message}`));
page.on('console', m => { if (m.type() === 'error') console.log(`  console (${current}): ${m.text().slice(0, 200)}`); });

async function step(name, fn){
  current = name; const before = failures.length;
  try { await fn(); } catch (e){ failures.push(`[${name}] ${e.message.split('\n')[0]}`); }
  await page.waitForTimeout(120);
  console.log(`${failures.length === before ? 'ok  ' : 'FAIL'} ${name}`);
}
const ev = (fn, arg) => page.evaluate(fn, arg);
const parts = () => ev(() => __studio.S.parts.length);
const viewCentre = async () => { const b = await (await page.$('#view')).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };

try {
  await page.goto(new URL('studio.html', base).href, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__studio && __studio.S.parts.length > 0, null, { timeout: 60000 });
  console.log('page loaded');

  for (const name of ['table', 'snowman', 'lighthouse']){
    await step(`example ${name}`, async () => {
      await ev(n => __studio.loadExample(n), name);
      if (await parts() < 4) throw new Error(`${name} made ${await parts()} parts`);
    });
  }
  await step('select a part from the list', () => page.click('.pitem:nth-child(2)'));
  for (const t of ['round', 'polygon', 'star', 'petal']){
    await step(`section ${t}`, async () => {
      await page.click(`#stypes [data-t="${t}"]`);
      if (await ev(() => __studio.S.parts.find(p => p.id === __studio.S.sel).section.type) !== t) throw new Error('section type did not change');
    });
  }
  await step('drag an outline point', async () => {
    const before = await ev(() => JSON.stringify(__studio.S.parts.find(p => p.id === __studio.S.sel).outline));
    const b = await (await page.$('#outline .pt[data-i="1"]')).boundingBox();
    await page.mouse.move(b.x + 5, b.y + 5); await page.mouse.down(); await page.mouse.move(b.x + 40, b.y - 8, { steps: 5 }); await page.mouse.up();
    const after = await ev(() => JSON.stringify(__studio.S.parts.find(p => p.id === __studio.S.sel).outline));
    if (before === after) throw new Error('the outline did not change');
  });
  await step('edit a part in place', async () => {
    await ev(() => __studio.setEditing(__studio.S.parts[1].id));
    if (!await ev(() => __studio.S.editing)) throw new Error('not editing');
  });
  for (const t of ['shape', 'sculpt', 'bend', 'paint', 'hollow', 'detail']) await step(`tool ${t}`, () => page.click(`.tool[data-tool="${t}"]`));
  await step('sculpt on the part', async () => {
    await page.click('.tool[data-tool="sculpt"]');
    const [x, y] = await viewCentre();
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 30, y + 10, { steps: 6 }); await page.mouse.up();
    if (!await ev(() => !!__studio.S.parts.find(p => p.id === __studio.S.editing).sculpt)) throw new Error('nothing was sculpted');
  });
  await step('every tool slider', async () => {
    for (const t of ['sculpt', 'bend', 'paint', 'hollow', 'detail']){
      await page.click(`.tool[data-tool="${t}"]`);
      const ids = await ev(() => [...document.querySelectorAll('#toolPanel input[type=range]')].map(r => r.id));
      for (const id of ids) await ev(id => { const e = document.getElementById(id);
        for (const v of [e.min, e.max, e.value]){ e.value = v; e.dispatchEvent(new Event('input')); } e.dispatchEvent(new Event('change')); }, id);
    }
  });
  await step('step out with Escape', async () => {
    await page.keyboard.press('Escape');
    if (await ev(() => __studio.S.editing)) throw new Error('still editing');
  });
  await step('every starting shape as a new part', async () => {
    await ev(() => { __studio.S.sel = null; });
    await page.click('.tool[data-tool="shape"]');
    const n = await parts(), kinds = await ev(() => Object.keys(__studio.KINDS));
    for (const k of kinds){ await ev(() => { __studio.S.sel = null; }); await page.click('.tool[data-tool="shape"]'); await page.click(`#gallery button[title="${k}"]`); }
    if (await parts() !== n + kinds.length) throw new Error(`expected ${n + kinds.length} parts, have ${await parts()}`);
  });
  for (const m of ['mTurn', 'mSize', 'mMove', 'snap', 'snap', 'frameAll']) await step(`view button ${m}`, () => page.click('#' + m));
  await step('duplicate and delete', async () => {
    await ev(() => __studio.select_(__studio.S.parts[0].id));
    const n = await parts(); await page.click('#dupPart');
    if (await parts() !== n + 1) throw new Error('duplicate did not add a part');
    await page.click('#delPart');
    if (await parts() !== n) throw new Error('delete did not remove a part');
  });
  await step('undo and redo', async () => {
    const n = await parts(); await page.click('#undo');
    if (await parts() === n) throw new Error('undo changed nothing');
    await page.click('#redo');
    if (await parts() !== n) throw new Error('redo did not come back');
  });
  await step('advanced switch and describe box', async () => { await page.click('#advanced'); await page.click('#describeGo'); });
} catch (e){
  failures.push(`[${current}] ${e.message.split('\n')[0]}`);
}

if (failures.length) console.error(`\n${failures.length} failure(s):\n` + failures.map(f => '  ' + f).join('\n'));
else console.log('\nno uncaught errors');
await browser.close();
server?.close();
process.exit(failures.length ? 1 : 0);
