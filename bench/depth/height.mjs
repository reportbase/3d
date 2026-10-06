// DEP-H: a flattened height axis for the studio's parts, measured on real studio content before
// any change to the studio. The plan, with its predictions and kills, is H-PLAN.md, committed before
// this file. One counted run:
//   node bench/depth/height.mjs         (LIBS_DIR=path/node_modules when the CDNs are blocked)
const PI = Math.PI, out = [], say = s => { out.push(s); console.log(s); };
const fmt = x => x === 0 ? '0' : Math.abs(x) >= 0.01 && Math.abs(x) < 1000 ? x.toFixed(3) : x.toExponential(1);

/* ── the two height axes: a cosine series in x, with x = h (dct, as the studio) or x = (2/π) asin √h (flat) ── */
const AX = {
  dct:  { leaf: (i, N) => (i + 0.5) / N, x: h => h },
  flat: { leaf: (i, N) => Math.sin(PI * (i + 0.5) / (2 * N)) ** 2, x: h => (2 / PI) * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h)))) },
};
function hold(ax, N, vals){ const xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N), a = new Float64Array(N);
  for (let n = 0; n < N; n++){ let s = 0; for (let i = 0; i < N; i++) s += vals[i] * Math.cos(n * PI * xs[i]); a[n] = (n ? 2 : 1) * s / N; }
  return h => { const x = AX[ax].x(h); let s = 0; for (let n = 0; n < N; n++) s += a[n] * Math.cos(n * PI * x); return s; }; }
const DENSE = Array.from({ length: 1024 }, (_, k) => (k + 0.5) / 1024), END = h => h < 0.1 || h > 0.9;
const rms = xs => Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / Math.max(1, xs.length));
function errors(fn, ax, N){ const P = hold(ax, N, Array.from({ length: N }, (_, i) => fn(AX[ax].leaf(i, N)))), e = DENSE.map(h => P(h) - fn(h));
  return { whole: rms(e), ends: rms(e.filter((_, k) => END(DENSE[k]))), mid: rms(e.filter((_, k) => !END(DENSE[k]))) }; }

/* ── the page, for patternAt (as tests/editor.mjs serves it) ── */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const server = await new Promise(ok => { const s = createServer(async (req, res) => { const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  try { res.end(await readFile(join(ROOT, path))); } catch { res.writeHead(404); res.end(); } }); s.listen(0, '127.0.0.1', () => ok(s)); });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }), page = await browser.newPage();
if (process.env.LIBS_DIR){ const lib = f => readFile(join(process.env.LIBS_DIR, 'three', f));
  await page.route(/three\.js\/r128\/three\.min\.js/, async r => r.fulfill({ contentType: 'text/javascript', body: await lib('build/three.min.js') }));
  for (const c of ['OrbitControls', 'TransformControls']) await page.route(new RegExp(c + '\\.js'), async r => r.fulfill({ contentType: 'text/javascript', body: await lib('examples/js/controls/' + c + '.js') })); }
await page.route(/login\.tangent\.workers\.dev/, r => r.fulfill({ status: 401, body: '{}' }));
await page.goto(`http://127.0.0.1:${server.address().port}/3d.html`);
await page.waitForFunction(() => typeof patternAt === 'function' && typeof PATTERNS !== 'undefined');   // PATTERNS is a top-level const: reachable by name, not on window

/* every height any holder needs, read once per pattern and column: the leaves of both axes at each N, and the dense grid */
const NS = [24, 48, 96], HS = [...new Set([...DENSE, ...NS.flatMap(N => Object.keys(AX).flatMap(ax => Array.from({ length: N }, (_, i) => AX[ax].leaf(i, N))))])];
const P = 20, Hm = 3, S = 0.3, COLS = 32;
const pat = await page.evaluate(([HS, P, Hm, S, COLS]) => { const out = {};
  for (const k of PATTERNS){ out[k] = []; for (let c = 0; c < COLS; c++){ const u = (c + 0.5) / COLS * P; out[k].push(HS.map(h => patternAt(k, u, h * Hm, S, 0).d)); } } return out; }, [HS, P, Hm, S, COLS]);
const idx = new Map(HS.map((h, i) => [h, i]));
const patFn = (k, c) => h => { const i = idx.get(h); if (i === undefined) throw new Error('height not read: ' + h); return pat[k][c][i]; };

/* ── checks of the code ── */
let codeOK = true; const check = (ok, s) => { codeOK &&= ok; say(`  ${s} ${ok ? 'ok' : '!! FAILS'}`); };
say('## Checks of the code');
{ let worst = 0; for (const ax of Object.keys(AX)) for (const N of NS){ const f = h => Math.sin(5 * h) + h, v = Array.from({ length: N }, (_, i) => f(AX[ax].leaf(i, N))), Pf = hold(ax, N, v);
    for (let i = 0; i < N; i++) worst = Math.max(worst, Math.abs(Pf(AX[ax].leaf(i, N)) - v[i])); }
  check(worst <= 1e-12, `1. both axes reproduce their own leaves: worst ${fmt(worst)}`); }
{ const g = { dct: h => Math.cos(7 * PI * h), flat: h => Math.cos(7 * 2 * Math.asin(Math.sqrt(h))) }; let worst = 0;
  for (const ax of Object.keys(AX)){ const e = errors(g[ax], ax, 48); worst = Math.max(worst, e.whole); }
  check(worst <= 1e-12, `2. each axis reproduces cos(7u) in its own basis: worst ${fmt(worst)}`); }
check(Object.values(pat).every(cols => cols.every(col => col.every(Number.isFinite))), '3. patternAt is finite for every pattern on the grid');

/* ── the run ── */
const SMOOTH = { 'sin(2.3h + 0.4) + 0.5h²': h => Math.sin(2.3 * h + 0.4) + 0.5 * h * h, 'h³ − h': h => h ** 3 - h, 'cos(5h)': h => Math.cos(5 * h), 'exp(−3h)': h => Math.exp(-3 * h), 'tanh(4(h − 0.3))': h => Math.tanh(4 * (h - 0.3)) };
const res = {};
for (const N of NS){ say(`\n## N_h = ${N}: RMS error, dct / flat (whole; end bands; middle)`);
  for (const [name, f] of Object.entries(SMOOTH)){ const d = errors(f, 'dct', N), fl = errors(f, 'flat', N); res[`${N}|s|${name}`] = { d, fl };
    say(`  smooth ${name}: whole ${fmt(d.whole)} / ${fmt(fl.whole)}; ends ${fmt(d.ends)} / ${fmt(fl.ends)}; middle ${fmt(d.mid)} / ${fmt(fl.mid)}`); }
  for (const k of Object.keys(pat)){ const acc = { d: { whole: 0, ends: 0, mid: 0 }, fl: { whole: 0, ends: 0, mid: 0 } };
    for (let c = 0; c < COLS; c++){ const f = patFn(k, c), d = errors(f, 'dct', N), fl = errors(f, 'flat', N); for (const m of ['whole', 'ends', 'mid']){ acc.d[m] += d[m] ** 2 / COLS; acc.fl[m] += fl[m] ** 2 / COLS; } }
    for (const s of ['d', 'fl']) for (const m of ['whole', 'ends', 'mid']) acc[s][m] = Math.sqrt(acc[s][m]);
    res[`${N}|p|${k}`] = acc;
    say(`  pattern ${k}: whole ${fmt(acc.d.whole)} / ${fmt(acc.fl.whole)}; ends ${fmt(acc.d.ends)} / ${fmt(acc.fl.ends)}; middle ${fmt(acc.d.mid)} / ${fmt(acc.fl.mid)}`); } }
if (!codeOK) say('!! a check of the code failed: no verdict stands');

/* ── verdicts, at N_h = 48 ── */
say('\n## Verdicts (N_h = 48)');
const sm = Object.keys(SMOOTH).map(n => res[`48|s|${n}`]), pt = Object.keys(pat).map(k => [k, res[`48|p|${k}`]]);
const h1 = sm.filter(r => !(r.fl.ends <= r.d.ends / 10)).length, h2 = sm.filter(r => !(r.fl.whole < r.d.whole)).length, h3 = pt.filter(([, r]) => r.fl.whole > r.d.whole).length;
say(`  H1: smooth profiles where flat's end-band error is above a tenth of dct's: ${h1} of ${sm.length} (none predicted): ${h1 === 0 ? 'holds' : 'KH1 FIRES'}`);
say(`  H2: smooth profiles where flat's whole error is not below dct's: ${h2} of ${sm.length} (none predicted): ${h2 === 0 ? 'holds' : 'KH2 FIRES'}`);
say(`  H3: patterns where flat's whole error is above dct's: ${h3} of ${pt.length} (at least 5 predicted): ${h3 >= 5 ? 'holds' : 'KH3 FIRES'}  (${pt.map(([k, r]) => `${k} ${fmt(r.fl.whole / r.d.whole)}×`).join(', ')})`);
if (!codeOK) say('  (a check of the code failed: these verdicts do not stand)');
await writeFile(new URL('./height-run.txt', import.meta.url), out.join('\n') + '\n');
await browser.close(); server.close();
