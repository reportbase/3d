// DEP-D, Part 1: the ratio between rungs. X (DEP-X, as run in DEP-Y) on both scenes with the ratio
// r in place of 2 for its octaves and ρ-octaves, r = √2, φ, 2, 3, 4, at equal leaves; and X₁, X at
// r = 2 held to whole octaves. The plan, with its predictions and kills, is D-PLAN.md, committed
// before this file. One counted run:
//   node bench/depth/ratio.mjs          (LIBS_DIR=path/node_modules when the CDNs are blocked)
// Everything down to the edge finder is DEP-Y's (pieces.mjs), copied unchanged; X is rebuilt below
// as a function of r, and at r = 2 it is DEP-Y's X (check 1).

const PI = Math.PI, log2 = Math.log2;

/* ── leaves: generated from the corner, not looked up ── */
// The odd lattice on the quarter turn, n = 2^m leaves at (2j+1)π/(4n), as slopes.
// Seed at the corner (slope 1), halve m times for the half step, step by tangent addition.
const halve = t => t / (1 + Math.sqrt(1 + t * t));
function leaves(n){
  let d = 1; for (let s = n; s > 1; s >>= 1) d = halve(d);       // tan(π/(4n))... after log2 n halvings of tan(π/4)
  const half = halve(1); let step = 1; for (let s = n / 2; s > 1; s >>= 1) step = halve(step);   // tan(π/(2n))
  const s2 = n === 1 ? 0 : step, up = [], dn = [];
  let t = (1 + d) / (1 - d); for (let i = 0; i < n / 2; i++){ up.push(t); t = (t + s2) / (1 - t * s2); }
  t = (1 - d) / (1 + d); for (let i = 0; i < n / 2; i++){ dn.push(t); t = (t - s2) / (1 + t * s2); }
  void half; return dn.reverse().concat(up);                       // home to horizon
}

/* ── presentation: the open-axis (chord) form on a quarter turn ── */
// Leaves θ_j = (2j+1)π/(4n) are the Chebyshev nodes in u = 2θ; the presentation is the
// cosine interpolant through them, exact at the leaves.
function sweep(n){
  const t = leaves(n), u = t.map(s => 2 * Math.atan(s));
  // cardinal function of leaf j at u: (1/n)[1 + D(u−u_j) + D(u+u_j)], D(x) = Σ_{m=1}^{n−1} cos mx
  const D = x => { const s = Math.sin(x / 2); return Math.abs(s) < 1e-15 ? n - 1 : Math.sin((n - 0.5) * x) / (2 * s) - 0.5; };
  const card = (uq) => u.map(uj => (1 + D(uq - uj) + D(uq + uj)) / n);
  const coef = vals => { const a = new Float64Array(n); for (let m = 0; m < n; m++){ let s = 0; for (let j = 0; j < n; j++) s += vals[j] * Math.cos(m * u[j]); a[m] = (m ? 2 : 1) * s / n; } return a; };
  const evalU = (a, uq) => { let s = 0; for (let m = 0; m < n; m++) s += a[m] * Math.cos(m * uq); return s; };
  return { n, t, u, card, coef, evalU };
}

/* ── nesting: an address's octave, its place, the place read as a sweep again ── */
const octOf = a => Math.ceil(log2(a));                       // 2^(k-1) < a <= 2^k
function placeIn(a, k){ const lo = 2 ** (k - 1), hi = 2 ** k;
  return hi <= 1 ? (a - lo) / (hi - lo) : (1 / lo - 1 / a) / (1 / lo - 1 / hi); }       // v/h below the corner, h/v above
function addrOf(f, k){ const lo = 2 ** (k - 1), hi = 2 ** k;
  return hi <= 1 ? lo + f * (hi - lo) : 1 / (1 / lo - f * (1 / lo - 1 / hi)); }
const rhoOf = f => f <= 0.5 ? 2 * f : 1 / (2 * (1 - f));
const fOf = r => r <= 1 ? r / 2 : 1 - 1 / (2 * r);

/* ── the readings ── */
const C = {
  selfSimilar: a => Math.sin(2 * PI * 4 * log2(a)),
  smooth: a => Math.sin(2 * PI * log2(a) / 16),
  rocks: a => { let s = 0; for (let i = -6; i <= 6; i++) s += Math.exp(-(((a - 2 ** i) / 0.05) ** 2)); return s; },
};
C.burst = a => { const k = octOf(a); return C.smooth(a) + ((k === 3 || k === -5) ? Math.sin(2 * PI * 8 * log2(a)) : 0); };

const OCTS = []; for (let k = -7; k <= 8; k++) OCTS.push(k);
const ptsIn = k => Array.from({ length: 256 }, (_, i) => 2 ** (k - 1 + (i + 0.5) / 256));
const rms = xs => Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / xs.length);

/* ── holder A: one sweep of 1,024 ── */
const SA = sweep(1024);
function holderA(fn){ const a = SA.coef(SA.t.map(fn)); return x => SA.evalU(a, 2 * Math.atan(x)); }

/* ── holder B: 16 octaves of 64 ── */
const S64 = sweep(64);
const out = []; const say = s => { out.push(s); console.log(s); };
const fmt = x => x === 0 ? '0' : Math.abs(x) >= 0.01 && Math.abs(x) < 1000 ? x.toFixed(3) : x.toExponential(1);
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;

/* ── the two place maps: §3's and the flattened one (DEP-F) ── */
const M3 = { name: '§3', rho: rhoOf, f: fOf };
const MF = { name: 'flat', rho: f => f >= 1 ? Infinity : Math.sqrt(f / (1 - f)), f: r => r === Infinity ? 1 : r * r / (1 + r * r) };

const leafAddrs = (M, k) => S64.t.map(r => addrOf(M.f(r), k));

/* ── holders on a reading given as a lookup (each address read once, in the page) ── */
const sitesA = SA.t.slice();                                         // one sweep: address = slope
const sitesN = M => OCTS.flatMap(k => leafAddrs(M, k));               // 16 octaves × 64
function holdA(fn){ const co = SA.coef(sitesA.map(fn)); return x => SA.evalU(co, 2 * Math.atan(x)); }
function holdN(M, fn){ const co = new Map(OCTS.map(k => [k, S64.coef(leafAddrs(M, k).map(fn))]));
  return x => { const k = octOf(x); return S64.evalU(co.get(k), 2 * Math.atan(M.rho(placeIn(x, k)))); }; }
const PTS = OCTS.flatMap(ptsIn);                                      // 4,096 measurement points, in order
function measure(fn, P){ const per = OCTS.map(k => rms(ptsIn(k).map(x => P(x) - fn(x)))), whole = rms(PTS.map(fn)) || 1;
  return { per, view: mean(per) / whole }; }

/* ── the page: the studio, serving three.js locally when asked (as tests/editor.mjs) ── */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const server = await new Promise(ok => { const s = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  try { const body = await readFile(join(ROOT, path)); res.writeHead(200, { 'Content-Type': extname(path) === '.html' ? 'text/html' : 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end(); } }); s.listen(0, '127.0.0.1', () => ok(s)); });
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launch), page = await browser.newPage();
if (process.env.LIBS_DIR){ const lib = f => readFile(join(process.env.LIBS_DIR, 'three', f));
  await page.route(/three\.js\/r128\/three\.min\.js/, async r => r.fulfill({ contentType: 'text/javascript', body: await lib('build/three.min.js') }));
  for (const c of ['OrbitControls', 'TransformControls']) await page.route(new RegExp(c + '\\.js'), async r => r.fulfill({ contentType: 'text/javascript', body: await lib('examples/js/controls/' + c + '.js') })); }
await page.route(/login\.tangent\.workers\.dev/, r => r.fulfill({ status: 401, body: '{}' }));
await page.goto(`http://127.0.0.1:${server.address().port}/3d.html`);
await page.waitForFunction(() => window.__scene && window.__describe && window.THREE);

/* The reader, in the page. For each address a (in eye heights) along direction phi: the ray
   from the eye towards the flat point at distance aH; what it meets first, copies (finest
   level, both faces) or the ground surface max(ground, water); f = (y_hit − g0)/H in [−1, 1],
   −1 for a miss. The ground is marched with a step of (height above it)/(sin δ + 2 cos δ),
   at most 0.5 m and at least 1e-9 H, stopping within 1e-7 H. */
await page.evaluate(() => { window.__depthRead = (x0, z0, H, phi, addrs) => {
  const b = __scene.built(), TR = b.TR, half = b.size / 2;
  const onIsland = (x, z) => TR.any ? Math.abs(x) <= half && Math.abs(z) <= half : Math.hypot(x, z) <= half;
  const surf = (x, z) => { const g = TR.ground(x, z), w = TR.waterAt(x, z); return w == null ? g : Math.max(g, w); };
  const g0 = TR.ground(x0, z0), ex = x0, ey = g0 + H, ez = z0, cx = Math.cos(phi), cz = Math.sin(phi);
  const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), cands = [];
  for (const o of b.inst){ const T = b.types[o.t]; if (!T.lod || !T.lod.length) continue; const geo = T.lod[T.lod.length - 1].geo;
    if (!geo.boundingSphere) geo.computeBoundingSphere(); const s = geo.boundingSphere.clone().applyMatrix4(o.m), dx = s.center.x - ex, dz = s.center.z - ez;
    if (Math.abs(-dx * cz + dz * cx) <= s.radius && dx * cx + dz * cz >= -s.radius){ const m = new THREE.Mesh(geo, mat); m.matrixAutoUpdate = false; m.matrix.copy(o.m); m.matrixWorld.copy(o.m); cands.push(m); } }
  const rc = new THREE.Raycaster(), eye = new THREE.Vector3(ex, ey, ez);
  return addrs.map(a => {
    const d = new THREE.Vector3(a * H * cx, -H, a * H * cz), L0 = d.length(); d.normalize();
    const sinD = -d.y, cosD = Math.sqrt(Math.max(0, 1 - sinD * sinD)), tMax = 2 * L0;   // at 2 L0 the ray is one eye height below g0
    let t = 0, tg = Infinity;
    for (let i = 0; i < 1e6; i++){ const x = ex + d.x * t, y = ey + d.y * t, z = ez + d.z * t;
      if (t > tMax || !onIsland(x, z)) break;
      const h = y - surf(x, z); if (h < 1e-7 * H){ tg = t; break; }
      t += Math.min(0.5, Math.max(h / (sinD + 2 * cosD), 1e-9 * H)); }
    rc.set(eye, d); rc.near = 0; rc.far = Number.isFinite(tg) ? tg : tMax;
    const hit = cands.length ? rc.intersectObjects(cands, false)[0] : null, th = hit ? Math.min(hit.distance, tg) : tg;
    if (!Number.isFinite(th)) return -1;
    return Math.max(-1, Math.min(1, (ey + d.y * th - g0) / H)); }); }; });
const read = (x0, z0, H, phi, addrs) => page.evaluate(([x0, z0, H, phi, addrs]) => __depthRead(x0, z0, H, phi, addrs), [x0, z0, H, phi, addrs]);
// a reading as a growing lookup: addresses are read in the page when first needed
async function viewReader(x0, z0, H, phi){ const m = new Map();
  const more = async addrs => { const need = [...new Set(addrs)].filter(a => !m.has(a)); if (!need.length) return; const v = await read(x0, z0, H, phi, need); need.forEach((a, i) => m.set(a, v[i])); };
  const fn = a => { const r = m.get(a); if (r === undefined) throw new Error('address not read: ' + a); return r; };
  return { fn, more }; }


/* ── edges: candidates on the scoring grid, located by bisection in log a to a bracket 1e-13 wide ── */
async function findEdges(fn, more, pts){
  const br = []; for (let i = 1; i < pts.length; i++) if (Math.abs(fn(pts[i]) - fn(pts[i - 1])) > 0.05) br.push([pts[i - 1], pts[i]]);
  for (let it = 0; it < 200; it++){ const act = br.filter(([a, b]) => (b - a) / a > 1e-13); if (!act.length) break;
    const mids = act.map(([a, b]) => Math.sqrt(a * b)); await more(mids);
    act.forEach((p, i) => { const m = mids[i]; if (Math.abs(fn(m) - fn(p[0])) >= Math.abs(fn(p[1]) - fn(m))) p[1] = m; else p[0] = m; }); }   // keep the half with the larger change
  const edges = [], steep = [];
  for (const [a, b] of br){ const d = Math.abs(fn(b) - fn(a)); (d > 0.01 ? edges : steep).push({ e: Math.sqrt(a * b), d }); }
  return { edges, steep }; }


/* ── X_r: X with the ratio between rungs r (D-PLAN Part 1) ── */
// Octave k is r^(k−1) < a ≤ r^k, anchored at the corner a = 1; the place within it is in
// proportion in v/h below the corner and h/v above (as placeIn); the place is read as ρ by
// DEP-F's flattened map (MF, unchanged); ρ-octave j is r^(j−1) < ρ ≤ r^j. At r = 2 every power
// is the exact 2 ** k of DEP-Y's code, so X_2 is X to the last bit.
function makeR(r, name){
  const pw = k => r === 2 ? 2 ** k : Math.pow(r, k), L = Math.log(r);
  const oct = a => { if (r === 2) return Math.ceil(log2(a)); let k = Math.ceil(Math.log(a) / L);
    while (pw(k - 1) >= a) k--; while (pw(k) < a) k++; return k; };
  const place = (a, k) => { const lo = pw(k - 1), hi = pw(k); return hi <= 1 ? (a - lo) / (hi - lo) : (1 / lo - 1 / a) / (1 / lo - 1 / hi); };
  const addr = (f, k) => { const lo = pw(k - 1), hi = pw(k); return hi <= 1 ? lo + f * (hi - lo) : 1 / (1 / lo - f * (1 / lo - 1 / hi)); };
  const OCT = []; for (let k = oct(2 ** -8) + (pw(oct(2 ** -8)) <= 2 ** -8 ? 1 : 0); pw(k - 1) < 2 ** 8; k++) OCT.push(k);   // every octave meeting (2^-8, 2^8], as DEP-Y's k = −7…8
  let jLo = 0; while (pw(jLo - 1) > 2 ** -7) jLo--;                                // the largest j with r^(j−1) ≤ 2^-7
  let jHi = 0; while (pw(jHi) < 2 ** 7) jHi++;                                     // the smallest j with r^j ≥ 2^7
  const chainRho = (x, ch) => { if (oct(x) !== ch[0]) return null; let v = MF.rho(place(x, ch[0]));
    for (let i = 1; i < ch.length; i++){ if (!(v > 0) || v === Infinity || oct(v) !== ch[i]) return null; v = MF.rho(place(v, ch[i])); }
    return v; };
  const chainU = (x, ch) => { const v = chainRho(x, ch); return v === null ? null : 2 * Math.atan(v); };
  const chainAddr = (v0, ch) => { let v = v0; for (let i = ch.length - 1; i >= 1; i--) v = addr(MF.f(v), ch[i]); return addr(MF.f(v), ch[0]); };
  const coords = x => { const c = [oct(x)]; let v = MF.rho(place(x, c[0]));
    for (let d = 1; d < 3; d++){ if (!(v > 0) || v === Infinity) break; const j = oct(v); if (j < jLo || j > jHi) break; c.push(j); v = MF.rho(place(v, j)); } return c; };
  const SC = SCORE.map(coords);
  const lastV = (x, ch) => ch.length === 1 ? x : chainRho(x, ch.slice(0, -1));
  const toX = (v, ch) => ch.length === 1 ? v : chainAddr(v, ch.slice(0, -1));
  function makeUnit(ch, n, edges){ const j = ch[ch.length - 1], below = pw(j) <= 1, lo = pw(j - 1), hi = pw(j);
    const cuts = edges.filter(e => chainU(e.e, ch) !== null).map(e => lastV(e.e, ch)).filter(v => v > lo && v < hi).sort((a, b) => a - b);
    const bounds = [lo, ...cuts, hi], p = bounds.length - 1, m = Math.max(2, n / 2 ** Math.ceil(Math.log2(p))), S = sweep(m);
    return { ch, below, pieces: bounds.slice(0, -1).map((a, i) => ({ lo: a, hi: bounds[i + 1], S, co: null })) }; }
  const pieceSites = (u, pc) => pc.S.t.map(t => toX(pInv(MF.f(t), pc.lo, pc.hi, u.below), u.ch));
  function termU(u, x){ if (chainU(x, u.ch) === null) return 0; const v = lastV(x, u.ch);
    for (const pc of u.pieces) if (v > pc.lo && v <= pc.hi) return pc.co ? pc.S.evalU(pc.co, 2 * Math.atan(MF.rho(pPlace(v, pc.lo, pc.hi, u.below)))) : 0;
    return 0; }
  const presentU = units => x => { let s = 0; for (const u of units) s += termU(u, x); return s; };
  async function fitUnit(u, units, fn, more){ for (const pc of u.pieces){ const sites = pieceSites(u, pc); await more(sites); const P = presentU(units); pc.co = pc.S.coef(sites.map(x => fn(x) - P(x))); } units.push(u); }
  // maxDepth 3 is X; maxDepth 1 is X₁ (whole octaves only, each entered once)
  async function hold(fn, more, edges, maxDepth = 3, base = 8){
    const units = [], key = ch => ch.join(','), budget = 1024 - OCT.length * base;
    for (const k of OCT) await fitUnit(makeUnit([k], base, edges), units, fn, more);
    await more(SCORE);
    const entered = new Set(), order = [];
    for (let left = budget; left >= 64; left -= 64){
      const P = presentU(units), score = new Map();
      SCORE.forEach((x, i) => { const e = (fn(x) - P(x)) ** 2, c = SC[i];
        for (let d = 1; d <= Math.min(c.length, maxDepth); d++){ const ch = c.slice(0, d); if (d === 3 && !entered.has(key(ch.slice(0, 2)))) break; const kk = key(ch); score.set(kk, (score.get(kk) || 0) + e); } });
      let best = null; for (const [kk, e] of score) if (!entered.has(kk) && (!best || e > best[1])) best = [kk, e];
      if (!best) break; const ch = best[0].split(',').map(Number); entered.add(best[0]); order.push({ ch, e: best[1] });
      await fitUnit(makeUnit(ch, 64, edges), units, fn, more); }
    const allotted = OCT.length * base + 64 * order.length, used = units.reduce((s, u) => s + u.pieces.reduce((t, pc) => t + pc.S.n, 0), 0);
    return { units, order, P: presentU(units), allotted, used }; }
  return { r, name, pw, oct, place, addr, OCT, jLo, jHi, chainU, chainAddr, hold, nodes: Math.floor((1024 - 8 * OCT.length) / 64) };
}
const pPlace = (v, lo, hi, below) => below ? (v - lo) / (hi - lo) : (1 / lo - 1 / v) / (1 / lo - 1 / hi);
const pInv = (f, lo, hi, below) => below ? lo + f * (hi - lo) : 1 / (1 / lo - f * (1 / lo - 1 / hi));
const SCORE = OCTS.flatMap(k => Array.from({ length: 256 }, (_, i) => 2 ** (k - 1 + (i + 0.25) / 256)));   // DEP-K's scoring grid, unchanged
const RATIOS = [makeR(Math.SQRT2, '√2'), makeR((1 + Math.sqrt(5)) / 2, 'φ'), makeR(2, '2'), makeR(3, '3'), makeR(4, '4')];
const R2 = RATIOS[2];

/* ── checks of the code ── */
let codeOK = true; const check = (ok, s) => { codeOK &&= ok; say(`  ${s} ${ok ? 'ok' : '!! FAILS'}`); };
say('## Checks of the code');
{ // 2. the maps at every r
  let worst = 0, cover = true, sites = true;
  for (const R of RATIOS){
    for (const k of R.OCT) for (let i = 1; i < 20; i++){ const f = i / 20; worst = Math.max(worst, Math.abs(R.place(R.addr(f, k), k) - f)); }
    for (let j = R.jLo; j <= R.jHi; j++) for (let i = 1; i < 20; i++){ const f = i / 20; worst = Math.max(worst, Math.abs(R.place(R.addr(f, j), j) - f)); }
    for (const x of SCORE){ const k = R.oct(x); if (!R.OCT.includes(k) || !(R.pw(k - 1) < x && x <= R.pw(k))) cover = false; }
    const S = sweep(64), mid = R.OCT[R.OCT.length >> 1];
    for (const ch of [[mid], [mid, 1], [mid, 1, -1], [R.OCT[0], R.jLo + 1], [R.OCT[R.OCT.length - 1], R.jHi - 1, 0]])
      for (const t of S.t){ const x = R.chainAddr(t, ch); if (x > 2 ** -8 && x < 2 ** 8 && R.chainU(x, ch) === null) sites = false; } }
  check(worst <= 1e-12 && cover && sites, `2. the octave maps at every r: round trip worst ${fmt(worst)}; every scoring point in one base octave ${cover}; node sites in their regions ${sites}`);
  // 3. leaves allotted, from the table
  const want = { '√2': [32, 12], 'φ': [24, 13], '2': [16, 14], '3': [12, 14], '4': [8, 15] };
  check(RATIOS.every(R => R.OCT.length === want[R.name][0] && R.nodes === want[R.name][1] && 8 * R.OCT.length + 64 * R.nodes <= 1024),
    `3. octaves and nodes: ${RATIOS.map(R => `${R.name}: ${R.OCT.length} octaves (k ${R.OCT[0]}…${R.OCT[R.OCT.length - 1]}), ρ-octaves j ${R.jLo}…${R.jHi}, ${R.nodes} nodes, ${8 * R.OCT.length + 64 * R.nodes} leaves`).join('; ')}`); }

// CHECKS_ONLY=1 stops here: the checks above, before any scene is read
if (process.env.CHECKS_ONLY){ await browser.close(); server.close(); process.exit(codeOK ? 0 : 1); }

/* ── DEP-Y's printed X, for check 1 ── */
const yRun = (await readFile(new URL('./pieces-run.txt', import.meta.url), 'utf8')).split('\n').filter(l => / view error /.test(l)).map(l => l.match(/ X (\S+) /)[1]);

/* ── the run: both scenes ── */
const rows = []; let vi = 0;
async function scene(name, json, X0, Z0){
  await page.evaluate(v => __describe.applyScene(v, 'scene'), json); say(`\n## The ${name}, viewer at (${X0}, ${Z0})`);
  for (const H of [1.7, 30]) for (let q = 0; q < 8; q++){ const { fn, more } = await viewReader(X0, Z0, H, q * PI / 4);
    await more([...PTS, ...SCORE]);
    const { edges } = await findEdges(fn, more, SCORE);
    const res = []; for (const R of RATIOS){ const g = await R.hold(fn, more, edges), m = measure(fn, g.P); res.push({ R, g, view: m.view }); }
    const g1 = await R2.hold(fn, more, edges, 1), X1 = measure(fn, g1.P).view;
    const x2 = res[2].view, want = yRun[vi++], same = fmt(x2) === want;
    codeOK &&= same; if (!same) say(`  !! check 1 FAILS here: X_2 ${fmt(x2)}, DEP-Y's X ${want}`);
    const views = res.map(o => o.view), best = Math.min(...views), worst = Math.max(...views), bestR = res[views.indexOf(best)].R.name;
    rows.push({ scene: name, H, q, views, best, worst, bestR, x2, X1, nE: edges.length });
    say(`\nH = ${H} m, direction ${q * 45}°: edges ${edges.length}; view error ${res.map(o => `r ${o.R.name} ${fmt(o.view)}`).join('  ')}; X₁ ${fmt(X1)}`);
    say(`  best r ${bestR}; worst/best ${fmt(worst / best)}; X_2/X₁ ${fmt(x2 / X1)}; X_2 against DEP-Y's X: ${fmt(x2)} / ${want}`);
    for (const o of res) say(`  r ${o.R.name}: leaves allotted ${o.g.allotted}, used ${o.g.used}; nodes ${o.g.order.map(n => `[${n.ch.join(',')}]`).join(' ')} (depth 2: ${o.g.order.filter(n => n.ch.length === 2).length}, depth 3: ${o.g.order.filter(n => n.ch.length === 3).length})`);
    say(`  X₁: nodes ${g1.order.map(n => `[${n.ch.join(',')}]`).join(' ')}`); } }
{ const HB = JSON.parse(await readFile(new URL('../../tests/harbour.json', import.meta.url), 'utf8')), road = HB.areas.find(a => a.name === 'high street').path; await scene('harbour', HB, ...road[Math.floor(road.length / 2)]); }
await scene('valley', JSON.parse(await readFile(new URL('./valley.json', import.meta.url), 'utf8')), 0, 0);
check(rows.every(r => fmt(r.x2) === yRun[rows.indexOf(r)]), `1. X_2 is DEP-Y's X on all ${rows.length} views, as printed`);
if (!codeOK) say('!! a check of the code failed: no verdict stands');

/* ── verdicts ── */
say('\n## Verdicts');
const d1 = rows.filter(r => r.bestR === '2').length, d2 = rows.filter(r => r.worst >= 1.5 * r.best).length, d3 = rows.filter(r => r.x2 < r.X1).length;
say(`  D1: X_2 the lowest of the five ratios in ${d1} of ${rows.length} views (at least 16 predicted): ${d1 >= 16 ? 'holds' : 'KD1 FIRES'}`);
say(`  D2: worst ratio at least 1.5 × the best in ${d2} of ${rows.length} views (at least 16 predicted): ${d2 >= 16 ? 'holds' : 'KD2 FIRES'}`);
say(`  D3: X_2 below X₁ in ${d3} of ${rows.length} views (at least 24 predicted): ${d3 >= 24 ? 'holds' : 'KD3 FIRES'}`);
const med = xs => { const s = [...xs].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
say(`  (reported) best ratio per view: ${RATIOS.map(R => `${R.name} ${rows.filter(r => r.bestR === R.name).length}`).join(', ')}`);
for (const s of ['harbour', 'valley']){ const S = rows.filter(r => r.scene === s);
  say(`  (reported, ${s}) median view error ${RATIOS.map((R, i) => `r ${R.name} ${fmt(med(S.map(r => r.views[i])))}`).join(', ')}; X₁ ${fmt(med(S.map(r => r.X1)))}; median X_2/X₁ ${fmt(med(S.map(r => r.x2 / r.X1)))}`); }
if (!codeOK) say('  (a check of the code failed: these verdicts do not stand)');
await writeFile(new URL('./ratio-run.txt', import.meta.url), out.join('\n') + '\n');
await browser.close(); server.close();
