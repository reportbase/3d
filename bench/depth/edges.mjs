// DEP-X: walls at the scene's edges, on DEP-S's 16 views of the harbour village. The plan, with
// its predictions and kills, is X-PLAN.md, committed before this file. One counted run:
//   node bench/depth/edges.mjs          (LIBS_DIR=path/node_modules when the CDNs are blocked)
// Everything down to holdC (C′) is DEP-R's (seams.mjs), copied unchanged.

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

/* ── the content holder C ── */
// A node's region is a chain [k, j1, j2…]: octave k of the address, then ρ-octave j1 of that
// octave's flattened sweep, then ρ-octave j2 of that one's. Its sweep's angle is 2 atan of the
// last ρ. Outside its region a node presents nothing.
function chainRho(x, ch){ if (octOf(x) !== ch[0]) return null; let r = MF.rho(placeIn(x, ch[0]));
  for (let i = 1; i < ch.length; i++){ if (!(r > 0) || r === Infinity || octOf(r) !== ch[i]) return null; r = MF.rho(placeIn(r, ch[i])); }
  return r; }
const chainU = (x, ch) => { const r = chainRho(x, ch); return r === null ? null : 2 * Math.atan(r); };
const chainAddr = (r, ch) => { let v = r; for (let i = ch.length - 1; i >= 1; i--) v = addrOf(MF.f(v), ch[i]); return addrOf(MF.f(v), ch[0]); };
const chainSites = (S, ch) => S.t.map(r => chainAddr(r, ch));
const presentOf = nodes => x => { let s = 0; for (const nd of nodes){ const u = chainU(x, nd.ch); if (u !== null) s += nd.S.evalU(nd.co, u); } return s; };
const SCORE = OCTS.flatMap(k => Array.from({ length: 256 }, (_, i) => 2 ** (k - 1 + (i + 0.25) / 256)));   // a quarter step in: on no wall, and off PTS (DEP-K)
const coords = x => { const c = [octOf(x)]; let r = MF.rho(placeIn(x, c[0]));
  for (let d = 1; d < 3; d++){ if (!(r > 0) || r === Infinity) break; const j = octOf(r); if (j < -6 || j > 7) break; c.push(j); r = MF.rho(placeIn(r, j)); } return c; };
const SCORE_C = SCORE.map(coords);
async function holdC(fn, more, base){
  const SB = sweep(base), nodes = [], key = ch => ch.join(',');
  const enter = async (ch, S) => { const sites = chainSites(S, ch); await more(sites); const P = presentOf(nodes); nodes.push({ ch, S, co: S.coef(sites.map(x => fn(x) - P(x))) }); };
  for (const k of OCTS) await enter([k], SB);
  await more(SCORE);
  const entered = new Set(), order = [];
  for (let left = 1024 - 16 * base; left >= 64; left -= 64){
    const P = presentOf(nodes), score = new Map();
    SCORE.forEach((x, i) => { const r = fn(x) - P(x), e = r * r, c = SCORE_C[i];
      for (let d = 1; d <= c.length; d++){ const ch = c.slice(0, d); if (d === 3 && !entered.has(key(ch.slice(0, 2)))) break; const kk = key(ch); score.set(kk, (score.get(kk) || 0) + e); } });
    let best = null; for (const [kk, e] of score) if (!entered.has(kk) && (!best || e > best[1])) best = [kk, e];
    if (!best) break; const ch = best[0].split(',').map(Number); entered.add(best[0]); order.push({ ch, e: best[1] }); await enter(ch, S64); }
  return { nodes, order, P: presentOf(nodes) }; }




/* ── edges: candidates on the scoring grid, located by bisection in log a to a bracket 1e-13 wide ── */
async function findEdges(fn, more, pts){
  const br = []; for (let i = 1; i < pts.length; i++) if (Math.abs(fn(pts[i]) - fn(pts[i - 1])) > 0.05) br.push([pts[i - 1], pts[i]]);
  for (let it = 0; it < 200; it++){ const act = br.filter(([a, b]) => (b - a) / a > 1e-13); if (!act.length) break;
    const mids = act.map(([a, b]) => Math.sqrt(a * b)); await more(mids);
    act.forEach((p, i) => { const m = mids[i]; if (Math.abs(fn(m) - fn(p[0])) >= Math.abs(fn(p[1]) - fn(m))) p[1] = m; else p[0] = m; }); }   // keep the half with the larger change
  const edges = [], steep = [];
  for (const [a, b] of br){ const d = Math.abs(fn(b) - fn(a)); (d > 0.01 ? edges : steep).push({ e: Math.sqrt(a * b), d }); }
  return { edges, steep }; }

/* ── X: C′ with every sweep split at the edges inside its region ── */
const lastV = (x, ch) => ch.length === 1 ? x : chainRho(x, ch.slice(0, -1));
const toX = (v, ch) => ch.length === 1 ? v : chainAddr(v, ch.slice(0, -1));
// a piece [lo, hi] of a region's own variable, with the region's corner convention (v/h below, h/v above)
const pPlace = (v, lo, hi, below) => below ? (v - lo) / (hi - lo) : (1 / lo - 1 / v) / (1 / lo - 1 / hi);
const pInv = (f, lo, hi, below) => below ? lo + f * (hi - lo) : 1 / (1 / lo - f * (1 / lo - 1 / hi));
function makeUnit(ch, n, edges){ const j = ch[ch.length - 1], below = 2 ** j <= 1, lo = 2 ** (j - 1), hi = 2 ** j;
  const cuts = edges.filter(e => chainU(e.e, ch) !== null).map(e => lastV(e.e, ch)).filter(v => v > lo && v < hi).sort((a, b) => a - b);
  const bounds = [lo, ...cuts, hi], p = bounds.length - 1, m = Math.max(2, n / 2 ** Math.ceil(Math.log2(p))), S = sweep(m);
  return { ch, below, pieces: bounds.slice(0, -1).map((a, i) => ({ lo: a, hi: bounds[i + 1], S, co: null })) }; }
const pieceSites = (u, pc) => pc.S.t.map(r => toX(pInv(MF.f(r), pc.lo, pc.hi, u.below), u.ch));
function termU(u, x){ if (chainU(x, u.ch) === null) return 0; const v = lastV(x, u.ch);
  for (const pc of u.pieces) if (v > pc.lo && v <= pc.hi) return pc.co ? pc.S.evalU(pc.co, 2 * Math.atan(MF.rho(pPlace(v, pc.lo, pc.hi, u.below)))) : 0;
  return 0; }
const presentU = units => x => { let s = 0; for (const u of units) s += termU(u, x); return s; };
async function fitUnit(u, units, fn, more){ for (const pc of u.pieces){ const sites = pieceSites(u, pc); await more(sites); const P = presentU(units); pc.co = pc.S.coef(sites.map(x => fn(x) - P(x))); } units.push(u); }
async function holdX(fn, more, edges, base = 8){
  const units = [], key = ch => ch.join(',');
  for (const k of OCTS) await fitUnit(makeUnit([k], base, edges), units, fn, more);
  await more(SCORE);
  const entered = new Set(), order = [];
  for (let left = 1024 - 16 * base; left >= 64; left -= 64){
    const P = presentU(units), score = new Map();
    SCORE.forEach((x, i) => { const r = fn(x) - P(x), e = r * r, c = SCORE_C[i];
      for (let d = 1; d <= c.length; d++){ const ch = c.slice(0, d); if (d === 3 && !entered.has(key(ch.slice(0, 2)))) break; const kk = key(ch); score.set(kk, (score.get(kk) || 0) + e); } });
    let best = null; for (const [kk, e] of score) if (!entered.has(kk) && (!best || e > best[1])) best = [kk, e];
    if (!best) break; const ch = best[0].split(',').map(Number); entered.add(best[0]); order.push({ ch, e: best[1] });
    await fitUnit(makeUnit(ch, 64, edges), units, fn, more); }
  return { units, order, P: presentU(units) }; }

/* ── seams (walls where the reading is continuous) and edges kept ── */
const dStep = (P, fn, w) => Math.abs((P(w * (1 - 1e-9)) - P(w * (1 + 1e-9))) - (fn(w * (1 - 1e-9)) - fn(w * (1 + 1e-9))));
async function seamAndEdges(g, fn, more, edges){
  const ws = []; for (let W = -7; W <= 7; W++) ws.push(2 ** W); for (const o of g.order) ws.push(...wallsOfChain(o.ch));
  const walls = ws.filter(w => w > 2 ** -8 && w < 2 ** 8 && !edges.some(e => Math.abs(w / e.e - 1) < 1e-6));
  await more([...walls, ...edges.map(e => e.e)].flatMap(w => [w * (1 - 1e-9), w * (1 + 1e-9)]));
  const seam = Math.max(0, ...walls.map(w => dStep(g.P, fn, w))), kept = edges.map(e => dStep(g.P, fn, e.e) <= 0.01 * e.d);
  return { seam, kept: kept.filter(Boolean).length, n: edges.length }; }

/* ── checks of the code ── */
let codeOK = true; const check = (ok, s) => { codeOK &&= ok; say(`  ${s} ${ok ? 'ok' : '!! FAILS'}`); };
say('## Checks of the code');
{ const step = a => a < 3.7 ? 0 : 1, ramp = a => Math.tanh((a - 5) / 1e-3), none = async () => {};
  const s1 = await findEdges(step, none, SCORE), s2 = await findEdges(ramp, none, SCORE);
  check(s1.edges.length === 1 && Math.abs(s1.edges[0].e / 3.7 - 1) <= 1e-12 && s2.edges.length === 0 && s2.steep.length >= 1,
    `1. the edge finder: step → ${s1.edges.length} edge at ${s1.edges.map(e => e.e.toPrecision(15)).join(',')}; ramp → ${s2.edges.length} edges, ${s2.steep.length} steep`);
  const units = []; for (const k of OCTS) await fitUnit(makeUnit([k], 8, s1.edges), units, step, none); const P = presentU(units), worst = Math.max(...PTS.map(x => Math.abs(P(x) - step(x))));
  check(worst <= 1e-12, `2. a split sweep holds the step: worst ${fmt(worst)}`); }

/* ── the run: DEP-S's 16 views ── */
const HB = JSON.parse(await readFile(new URL('../../tests/harbour.json', import.meta.url), 'utf8'));
await page.evaluate(h => __describe.applyScene(h, 'scene'), HB);
const road = HB.areas.find(a => a.name === 'high street').path, [X0, Z0] = road[Math.floor(road.length / 2)];
say(`\n## The harbour village, viewer on the high street at (${X0}, ${Z0})`);
const rows = [];
for (const H of [1.7, 30]) for (let q = 0; q < 8; q++){ const phi = q * PI / 4, { fn, more } = await viewReader(X0, Z0, H, phi);
  await more([...sitesA, ...sitesN(M3), ...sitesN(MF), ...PTS, ...SCORE]);
  const A = measure(fn, holdA(fn)), B = measure(fn, holdN(M3, fn)), F = measure(fn, holdN(MF, fn));
  const { edges, steep } = await findEdges(fn, more, SCORE);
  const gC = await holdC(fn, more, 8), C = measure(fn, gC.P), gX = await holdX(fn, more, edges), X = measure(fn, gX.P);
  if (H === 1.7 && q === 0){ check(fmt(A.view) === '6.8e-6' && fmt(B.view) === '4.0e-5' && fmt(F.view) === '2.0e-5', `4. A, B, F on the first view as DEP-S: ${fmt(A.view)} ${fmt(B.view)} ${fmt(F.view)}`);
    check(edges.length === 0 && gX.order.map(o => o.ch.join(',')).join(' ') === gC.order.map(o => o.ch.join(',')).join(' ') && fmt(X.view) === fmt(C.view), `3. no edge, no change: ${edges.length} edges; X ${fmt(X.view)}, C′ ${fmt(C.view)}`); }
  const sC = await seamAndEdges(gC, fn, more, edges), sX = await seamAndEdges(gX, fn, more, edges), best3 = Math.min(A.view, B.view, F.view);
  rows.push({ H, q, A: A.view, B: B.view, F: F.view, C: C.view, X: X.view, best3, nE: edges.length, seamC: sC.seam, seamX: sX.seam, keptX: sX.kept, keptC: sC.kept });
  say(`\nH = ${H} m, direction ${q * 45}°: view error A ${fmt(A.view)}  B ${fmt(B.view)}  F ${fmt(F.view)}  C′ ${fmt(C.view)}  X ${fmt(X.view)}; X/C′ ${fmt(X.view / C.view)}`);
  say(`  edges ${edges.length}${edges.length ? ' (' + edges.map(e => `${fmt(e.e)}: ${fmt(e.d)}`).join(', ') + ')' : ''}; steep slopes ${steep.length}${steep.length ? ' (' + steep.map(e => fmt(e.e)).join(', ') + ')' : ''}`);
  say(`  largest seam: C′ ${fmt(sC.seam)}, X ${fmt(sX.seam)}; edges kept within 1%: C′ ${sC.kept} of ${sC.n}, X ${sX.kept} of ${sX.n}`);
  say(`  X's nodes: ${gX.order.map(o => `[${o.ch.join(',')}]`).join(' ')}`); }
if (!codeOK) say('!! a check of the code failed: no verdict stands');

/* ── verdicts ── */
say('\n## Verdicts');
const n = f => rows.filter(f).length, med = xs => { const s = [...xs].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const E = rows.filter(r => r.nE > 0), x1 = E.filter(r => r.seamX <= r.seamC / 10).length, kept = E.reduce((s, r) => s + r.keptX, 0), all = E.reduce((s, r) => s + r.nE, 0), x3 = E.filter(r => r.X < r.C).length, x4 = n(r => !(r.X < r.best3));
say(`  ${E.length} views with edges, ${all} edges`);
say(`  X1: X's largest seam at most 1/10 of C′'s in ${x1} of ${E.length} (at least 80% predicted): ${E.length && x1 >= 0.8 * E.length ? 'holds' : 'KX1 FIRES'}`);
say(`  X2: edges kept within 1% by X: ${kept} of ${all} (at least 90% predicted): ${all && kept >= 0.9 * all ? 'holds' : 'KX2 FIRES'}`);
say(`  X3: X below C′ in ${x3} of ${E.length} (at least 80% predicted): ${E.length && x3 >= 0.8 * E.length ? 'holds' : 'KX3 FIRES'}`);
say(`  X4: views where X is not below the best of A, B, F: ${x4} (none predicted): ${x4 === 0 ? 'holds' : 'KX4 FIRES'}`);
say(`  (reported) median view error C′ ${fmt(med(rows.map(r => r.C)))}, X ${fmt(med(rows.map(r => r.X)))}; on views with edges C′ ${fmt(med(E.map(r => r.C)))}, X ${fmt(med(E.map(r => r.X)))}; median largest seam there C′ ${fmt(med(E.map(r => r.seamC)))}, X ${fmt(med(E.map(r => r.seamX)))}; edges kept by C′ ${E.reduce((s, r) => s + r.keptC, 0)} of ${all}`);
if (!codeOK) say('  (a check of the code failed: these verdicts do not stand)');
await writeFile(new URL('./edges-run.txt', import.meta.url), out.join('\n') + '\n');
await browser.close(); server.close();
