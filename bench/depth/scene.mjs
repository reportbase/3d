// DEP-S: depth read from a real scene (the harbour village), held by one sweep (A), §3's
// nesting (B) and the flattened nesting (F). The plan, with its predictions and kills, is
// S-PLAN.md, committed before this file. One counted run:
//   node bench/depth/scene.mjs          (LIBS_DIR=path/node_modules when the CDNs are blocked)
// Definitions down to MF are DEP-P's (p.mjs), copied unchanged.

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
const lookup = async (x0, z0, H, phi) => { const all = [...new Set([...sitesA, ...sitesN(M3), ...sitesN(MF), ...PTS])], v = await read(x0, z0, H, phi, all), m = new Map(all.map((a, i) => [a, v[i]]));
  return a => { const r = m.get(a); if (r === undefined) throw new Error('address not read: ' + a); return r; }; };

/* ── checks of the code ── */
let codeOK = true; const check = (ok, s) => { codeOK &&= ok; say(`  ${s} ${ok ? 'ok' : '!! FAILS'}`); };
say('## Checks of the code');
{ const fn = a => Math.sin(2 * PI * 4 * log2(a)), rel = P => mean(OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => P(x) - fn(x))) / rms(xs.map(fn)); }));
  const eF = rel(holdN(MF, fn)), eB = rel(holdN(M3, fn));
  check(eF < 2e-14 && Math.abs(eB / 0.010 - 1) < 0.01, `1. holders as DEP-F's on m = 4: F ${fmt(eF)}, B ${eB.toFixed(5)}`); }
{ await page.evaluate(() => __describe.applyScene({ name: 'check', seed: 1, ground: { color: '#6b8a4e', size: 400 }, areas: [],
    types: [{ name: 'block', parts: [{ name: 'b', shape: 'box', size: [2, 4, 2], pos: [0, 0, 0], color: '#888888' }] }], place: [{ type: 'block', at: [10, 0] }] }, 'scene'));
  const H = 1.7, xs = Array.from({ length: 400 }, (_, i) => 2 ** (-8 + 16 * (i + 0.5) / 400)), v = await read(0, 0, H, 0, xs);
  let flat = 0, face = 0, nFace = 0;
  xs.forEach((a, i) => { const D = a * H; if (D < 9) flat = Math.max(flat, Math.abs(v[i]));
    else { const y = H * (1 - 9 / D); if (y >= 0.3) { face = Math.max(face, Math.abs(v[i] - (1 - 9 / D))); nFace++; } } });
  check(flat <= 1e-6, `2a. flat ground reads 0: worst ${fmt(flat)}`);
  check(nFace > 50 && face <= 0.02, `2b. the box's front face reads 1 − 9/(aH): worst ${fmt(face)} over ${nFace} addresses`);
  const off = await read(0, 0, H, PI, xs.filter(a => a * H > 200));
  check(off.length > 0 && off.every(x => x === -1), `2c. off the island reads −1: ${off.length} addresses, ${off.filter(x => x !== -1).length} not −1`); }
if (!codeOK) say('!! a check of the code failed: numbers follow, no verdict stands');

/* ── the run: the harbour village, 2 heights × 8 directions ── */
const HB = JSON.parse(await readFile(new URL('../../tests/harbour.json', import.meta.url), 'utf8'));
await page.evaluate(h => __describe.applyScene(h, 'scene'), HB);
const road = HB.areas.find(a => a.name === 'high street').path, mid = road[Math.floor(road.length / 2)];
const [X0, Z0] = mid; say(`\n## The harbour village, viewer on the high street at (${X0}, ${Z0}), ground ${fmt(await page.evaluate(([x, z]) => __scene.heightAt(x, z), mid))} m`);
const rows = [];
for (const H of [1.7, 30]) for (let q = 0; q < 8; q++){ const phi = q * PI / 4, fn = await lookup(X0, Z0, H, phi);
  const A = measure(fn, holdA(fn)), B = measure(fn, holdN(M3, fn)), PF = holdN(MF, fn), F = measure(fn, PF);
  const vals = PTS.map(fn), jumps = []; for (let i = 1; i < vals.length; i++) if (Math.abs(vals[i] - vals[i - 1]) > 0.05) jumps.push(i);
  const near = new Uint8Array(vals.length); for (const j of jumps) for (let i = Math.max(0, j - 9); i <= Math.min(vals.length - 1, j + 8); i++) near[i] = 1;   // within 8 points of either side of the jump
  const sq = PTS.map((x, i) => (PF(x) - vals[i]) ** 2), tot = sq.reduce((s, v) => s + v, 0), nearFrac = tot ? sq.reduce((s, v, i) => s + (near[i] ? v : 0), 0) / tot : 0;
  const content = OCTS.filter(k => { const xs = ptsIn(k).map(fn), m = mean(xs); return rms(xs.map(v => v - m)) > 0.01; });
  rows.push({ H, q, A: A.view, B: B.view, F: F.view, jumps: jumps.length, nearFrac });
  say(`\nH = ${H} m, direction ${q * 45}°: view error A ${fmt(A.view)}  B ${fmt(B.view)}  F ${fmt(F.view)}; jumps ${jumps.length}; F's squared error near a jump ${(100 * nearFrac).toFixed(1)}%; octaves with content ${content.join(',') || 'none'}`);
  say(`  per octave (A / B / F): ${OCTS.map((k, i) => `${k}: ${fmt(A.per[i])}/${fmt(B.per[i])}/${fmt(F.per[i])}`).join('  ')}`); }

/* ── verdicts ── */
say('\n## Verdicts');
const n = f => rows.filter(f).length, withJ = rows.filter(r => r.jumps > 0), med = xs => { const s = [...xs].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const s1 = n(r => r.F < r.A), s2a = n(r => r.F < r.B), s2b = med(rows.map(r => r.F / r.B)), s3 = withJ.filter(r => r.F <= 1e-4), s4 = n(r => r.jumps > 0 && r.nearFrac >= 0.5);
say(`  S1: F below A in ${s1} of 16 views (at least 12 predicted): ${s1 >= 12 ? 'holds' : 'KS1 FIRES'}`);
say(`  S2: F below B in ${s2a} of 16 views, median F/B ${fmt(s2b)} (at least 12, at most 0.7 predicted): ${s2a >= 12 && s2b <= 0.7 ? 'holds' : 'KS2 FIRES'}`);
say(`  S3: ${withJ.length} views with a jump; F at or below 1e-4 in ${s3.length} of them (none predicted): ${s3.length === 0 ? 'holds' : 'KS3 FIRES'}`);
say(`  S4: half or more of F's squared error near a jump in ${s4} views (at least 12 predicted): ${s4 >= 12 ? 'holds' : 'KS4 FIRES'}`);
say(`  (reported) A below B in ${n(r => r.A < r.B)} of 16 views; median view error A ${fmt(med(rows.map(r => r.A)))}, B ${fmt(med(rows.map(r => r.B)))}, F ${fmt(med(rows.map(r => r.F)))}`);
if (!codeOK) say('  (a check of the code failed: these verdicts do not stand)');
await writeFile(new URL('./scene-run.txt', import.meta.url), out.join('\n') + '\n');
await browser.close(); server.close();
