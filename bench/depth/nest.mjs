// DEP-D, Part 2: a part's height axis held as deep as it has detail. DEP-H's content (the seven
// patterns read with patternAt, 32 columns, and the five smooth profiles) held at 48 leaves by the
// even axis (dct), one flattened sweep (the studio's 'flat'), D (a flattened sweep of 16, then 4
// nodes of 8 on the region's children, crowding toward its walls) and Z (the same, its children
// the two halves). The plan, with its predictions and kills, is D-PLAN.md, committed before this
// file. One counted run:
//   node bench/depth/nest.mjs           (LIBS_DIR=path/node_modules when the CDNs are blocked)
// The axes, the error and the page are DEP-H's (height.mjs), copied unchanged.
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
const DENSE = Array.from({ length: 1024 }, (_, k) => (k + 0.5) / 1024);
const rms = xs => Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / Math.max(1, xs.length));

/* ── nodes: a flattened sweep over a region (a, b], zero outside it ── */
// Leaves at a + (b − a)·sin²(π(i + ½)/(2n)); presented as the cosine series in the region's own
// x = (2/π) asin √((h − a)/(b − a)), exact at the leaves. The root region is [0, 1], closed.
const inR = (h, R) => R.root ? h >= 0 && h <= 1 : h > R.a && h <= R.b;
const leafH = (R, n) => Array.from({ length: n }, (_, i) => R.a + (R.b - R.a) * Math.sin(PI * (i + 0.5) / (2 * n)) ** 2);
function nodeOf(R, n, vals){ const P = hold('flat', n, vals); return { R, n, P: h => inR(h, R) ? P((h - R.a) / (R.b - R.a)) : 0 }; }
const present = nodes => h => { let s = 0; for (const nd of nodes) s += nd.P(h); return s; };

// The children of a region, its corner at the middle, half-width L: its doublings at ratio r,
// crowding toward both walls (D), or its two halves (Z). None narrower than 1/1024.
function childrenD(R, r){ const L = (R.b - R.a) / 2, out = [];
  for (let j = 0; ; j++){ const w = L * (r ** -j - r ** -(j + 1)); if (w < 1 / 1024) break;
    out.push({ a: R.a + L * r ** -(j + 1), b: R.a + L * r ** -j }, { a: R.b - L * r ** -j, b: R.b - L * r ** -(j + 1) }); }
  return out; }
const childrenZ = R => { const m = (R.a + R.b) / 2; return [{ a: R.a, b: m }, { a: m, b: R.b }]; };
const SCORE = Array.from({ length: 1024 }, (_, i) => (i + 0.25) / 1024);   // the rule never sees DENSE
// base sweep of 16 over [0, 1], then 4 nodes of 8, each fit to the residual of everything before it,
// entered one at a time by the largest sum of squared residual on SCORE inside the candidate
async function holdNest(fn, more, kids, base = 16, nodeN = 8, count = 4){
  const root = { a: 0, b: 1, root: true }, rh = leafH(root, base); await more(rh);
  const nodes = [nodeOf(root, base, rh.map(fn))], cands = kids(root), order = [];
  await more(SCORE);
  for (let c = 0; c < count; c++){
    const P = present(nodes), res = SCORE.map(h => (fn(h) - P(h)) ** 2);
    let best = null, bi = -1;
    cands.forEach((R, i) => { let e = 0; SCORE.forEach((h, k) => { if (inR(h, R)) e += res[k]; }); if (!best || e > best) { best = e; bi = i; } });
    if (bi < 0) break; const R = cands.splice(bi, 1)[0], hs = leafH(R, nodeN); await more(hs);
    nodes.push(nodeOf(R, nodeN, hs.map(h => fn(h) - P(h)))); order.push(R); cands.push(...kids(R)); }
  return { P: present(nodes), order, leaves: base + nodeN * order.length }; }
const errOf = (fn, P) => rms(DENSE.map(h => P(h) - fn(h)));

/* ── the page, for patternAt (as DEP-H) ── */
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
await page.waitForFunction(() => typeof patternAt === 'function' && typeof PATTERNS !== 'undefined');
const P_ = 20, Hm = 3, S_ = 0.3, COLS = 32, PATS = await page.evaluate(() => [...PATTERNS]);
// a column of a pattern as a growing lookup: heights are read in the page when first needed
function column(k, c){ const m = new Map(), u = (c + 0.5) / COLS * P_;
  const more = async hs => { const need = [...new Set(hs)].filter(h => !m.has(h)); if (!need.length) return;
    const v = await page.evaluate(([k, u, need, Hm, S]) => need.map(h => patternAt(k, u, h * Hm, S, 0).d), [k, u, need, Hm, S_]); need.forEach((h, i) => m.set(h, v[i])); };
  const fn = h => { const r = m.get(h); if (r === undefined) throw new Error('height not read: ' + h); return r; };
  return { fn, more }; }
const free = async () => {};

/* ── checks of the code ── */
let codeOK = true; const check = (ok, s) => { codeOK &&= ok; say(`  ${s} ${ok ? 'ok' : '!! FAILS'}`); };
say('## Checks of the code');
{ // 4. no nodes: one flattened sweep of 16; a node holds cos(5u) in its own variable
  const f = h => Math.sin(5 * h) + h * h, flat16 = hold('flat', 16, Array.from({ length: 16 }, (_, i) => f(AX.flat.leaf(i, 16))));
  const gD = await holdNest(f, free, R => childrenD(R, 2), 16, 8, 0), gZ = await holdNest(f, free, childrenZ, 16, 8, 0);
  const w0 = Math.max(...DENSE.map(h => Math.max(Math.abs(gD.P(h) - flat16(h)), Math.abs(gZ.P(h) - flat16(h)))));
  const R = { a: 0.25, b: 0.5 }, g = h => Math.cos(5 * 2 * Math.asin(Math.sqrt((h - R.a) / (R.b - R.a)))), nd = nodeOf(R, 8, leafH(R, 8).map(g));
  const inside = DENSE.filter(h => inR(h, R)), w1 = Math.max(...inside.map(h => Math.abs(nd.P(h) - g(h))));
  const kids = childrenD({ a: 0, b: 1, root: true }, 2).slice(0, 4).map(R => `(${R.a}, ${R.b}]`).join(' ');
  check(w0 <= 1e-12 && w1 <= 1e-10 && kids === '(0.25, 0.5] (0.5, 0.75] (0.125, 0.25] (0.75, 0.875]',
    `4. D and Z with no nodes are one sweep of 16: worst ${fmt(w0)}; a node holds cos(5u) in (0.25, 0.5]: worst ${fmt(w1)} over ${inside.length} heights; the root's first children ${kids}`); }

// CHECKS_ONLY=1 stops here: the checks above, before any content is held
if (process.env.CHECKS_ONLY){ await browser.close(); server.close(); process.exit(codeOK ? 0 : 1); }

/* ── the run ── */
const SMOOTH = { 'sin(2.3h + 0.4) + 0.5h²': h => Math.sin(2.3 * h + 0.4) + 0.5 * h * h, 'h³ − h': h => h ** 3 - h, 'cos(5h)': h => Math.cos(5 * h), 'exp(−3h)': h => Math.exp(-3 * h), 'tanh(4(h − 0.3))': h => Math.tanh(4 * (h - 0.3)) };
const HOLD = {
  even: async (fn, more) => { const hs = Array.from({ length: 48 }, (_, i) => AX.dct.leaf(i, 48)); await more(hs); return { P: hold('dct', 48, hs.map(fn)) }; },
  'one sweep': async (fn, more) => { const hs = Array.from({ length: 48 }, (_, i) => AX.flat.leaf(i, 48)); await more(hs); return { P: hold('flat', 48, hs.map(fn)) }; },
  D: (fn, more) => holdNest(fn, more, R => childrenD(R, 2)),
  Z: (fn, more) => holdNest(fn, more, childrenZ),
  'D √2': (fn, more) => holdNest(fn, more, R => childrenD(R, Math.SQRT2)),
  'D φ': (fn, more) => holdNest(fn, more, R => childrenD(R, (1 + Math.sqrt(5)) / 2)),
  'D 3': (fn, more) => holdNest(fn, more, R => childrenD(R, 3)),
  'D 4': (fn, more) => holdNest(fn, more, R => childrenD(R, 4)),
};
const NAMES = Object.keys(HOLD), res = {}, nm = R => `(${+R.a.toFixed(4)}, ${+R.b.toFixed(4)}]`;
say('\n## Smooth profiles: RMS error over 1,024 heights');
for (const [name, f] of Object.entries(SMOOTH)){ const e = {}, ord = {}; for (const h of NAMES){ const g = await HOLD[h](f, free); e[h] = errOf(f, g.P); if (g.order) ord[h] = g.order; }
  res['s|' + name] = e; say(`  ${name}: ${NAMES.map(h => `${h} ${fmt(e[h])}`).join('  ')}`); say(`    D entered ${ord.D.map(nm).join(' ')}; Z entered ${ord.Z.map(nm).join(' ')}`); }
say('\n## Patterns: RMS error over 1,024 heights, RMS over 32 columns');
for (const k of PATS){ const acc = Object.fromEntries(NAMES.map(h => [h, 0])), firstD = new Map();
  for (let c = 0; c < COLS; c++){ const { fn, more } = column(k, c); await more(DENSE);
    for (const h of NAMES){ const g = await HOLD[h](fn, more); acc[h] += errOf(fn, g.P) ** 2 / COLS; if (h === 'D') for (const R of g.order){ const s = nm(R); firstD.set(s, (firstD.get(s) || 0) + 1); } } }
  for (const h of NAMES) acc[h] = Math.sqrt(acc[h]); res['p|' + k] = acc;
  say(`  ${k}: ${NAMES.map(h => `${h} ${fmt(acc[h])}`).join('  ')}`);
  say(`    D's nodes over the columns: ${[...firstD].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s, n]) => `${s} ×${n}`).join(' ')}`); }

// 5. the harness is DEP-H's: even and one sweep at 48 as printed in height-run.txt
{ const lines = (await readFile(new URL('./height-run.txt', import.meta.url), 'utf8')).split('\n'), at = lines.findIndex(l => /^## N_h = 48/.test(l)), bad = [];
  for (const l of lines.slice(at + 1, at + 13)){ const m = l.match(/^\s+(smooth|pattern) (.+?): whole (\S+) \/ (\S+);/); if (!m) continue;
    const r = res[(m[1] === 'smooth' ? 's|' : 'p|') + m[2]]; if (!r || fmt(r.even) !== m[3] || fmt(r['one sweep']) !== m[4]) bad.push(`${m[2]}: ${r ? fmt(r.even) + ' / ' + fmt(r['one sweep']) : 'missing'} against ${m[3]} / ${m[4]}`); }
  check(bad.length === 0, `5. even and one sweep at 48 are DEP-H's on all twelve${bad.length ? ': ' + bad.join('; ') : ''}`); }
if (!codeOK) say('!! a check of the code failed: no verdict stands');

/* ── verdicts ── */
say('\n## Verdicts (48 leaves)');
const pt = PATS.map(k => [k, res['p|' + k]]), sm = Object.keys(SMOOTH).map(n => [n, res['s|' + n]]);
const d4 = pt.filter(([, r]) => r.D < r['one sweep']).length, d5 = pt.filter(([, r]) => r.D < r.Z).length, d6 = sm.filter(([, r]) => !(r.D <= 10 * r['one sweep'] + 1e-12)).length;
say(`  D4: D below one sweep on ${d4} of ${pt.length} patterns (at least 5 predicted): ${d4 >= 5 ? 'holds' : 'KD4 FIRES'}  (${pt.map(([k, r]) => `${k} ${fmt(r.D / r['one sweep'])}×`).join(', ')})`);
say(`  D5: D below Z on ${d5} of ${pt.length} patterns (at least 5 predicted): ${d5 >= 5 ? 'holds' : 'KD5 FIRES'}  (${pt.map(([k, r]) => `${k} ${fmt(r.D / r.Z)}×`).join(', ')})`);
say(`  D6: smooth profiles where D is above 10 × one sweep + 1e-12: ${d6} of ${sm.length} (none predicted): ${d6 === 0 ? 'holds' : 'KD6 FIRES'}`);
say(`  (reported) D against even on the patterns: ${pt.map(([k, r]) => `${k} ${fmt(r.D / r.even)}×`).join(', ')}; Z against even: ${pt.map(([k, r]) => `${k} ${fmt(r.Z / r.even)}×`).join(', ')}`);
say(`  (reported) the best D ratio per pattern: ${pt.map(([k, r]) => { const c = ['D √2', 'D φ', 'D', 'D 3', 'D 4'], b = c.reduce((x, y) => r[y] < r[x] ? y : x); return `${k} ${b === 'D' ? 'D 2' : b}`; }).join(', ')}`);
if (!codeOK) say('  (a check of the code failed: these verdicts do not stand)');
await writeFile(new URL('./nest-run.txt', import.meta.url), out.join('\n') + '\n');
await browser.close(); server.close();
