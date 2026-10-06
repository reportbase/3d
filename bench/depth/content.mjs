// DEP-C: leaves by content inside the octave scaffold, on DEP-S's 16 views of the harbour
// village. The plan, with its predictions and kills, is C-PLAN.md, committed before this
// file. One counted run:
//   node bench/depth/content.mjs        (LIBS_DIR=path/node_modules when the CDNs are blocked)
// Everything down to the reader is DEP-S's (scene.mjs), copied unchanged.

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
const SCORE = OCTS.flatMap(k => Array.from({ length: 256 }, (_, i) => 2 ** (k - 1 + i / 256)));   // offset half a step from PTS
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

/* ── checks of the code ── */
let codeOK = true; const check = (ok, s) => { codeOK &&= ok; say(`  ${s} ${ok ? 'ok' : '!! FAILS'}`); };
say('## Checks of the code');
{ const fn = a => Math.sin(2 * PI * 4 * log2(a)), g = await holdC(fn, async () => {}, 8), base = presentOf(g.nodes.slice(0, 16));
  const e = mean(OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => base(x) - fn(x))) / rms(xs.map(fn)); }));
  check(Math.abs(e / 1.212 - 1) < 0.01, `1. base alone, 8 leaves an octave on m = 4: ${e.toFixed(4)} (DEP-F's 1.212)`); }
{ let worst = 0, out = 0; for (const ch of [[3], [3, 1], [3, 1, -2], [-4, -2, 2]]) chainSites(S64, ch).forEach((x, j) => { const u = chainU(x, ch); if (u === null) out++; else worst = Math.max(worst, Math.abs(u - S64.u[j])); });
  check(out === 0 && worst <= 1e-9, `2. node maps: ${out} sites outside their region, worst angle difference ${fmt(worst)}`); }
{ const ch = [3, 1], fn = x => { const u = chainU(x, ch); return u === null ? 0 : Math.cos(5 * u); }, sites = chainSites(S64, ch), nd = { ch, S: S64, co: S64.coef(sites.map(fn)) }, P = presentOf([nd]);
  const inside = PTS.filter(x => chainU(x, ch) !== null), worst = Math.max(...inside.map(x => Math.abs(P(x) - fn(x))));
  check(inside.length > 20 && worst <= 1e-10, `3. a node holds cos(5u) in its own angle: worst ${fmt(worst)} over ${inside.length} points`); }

/* ── the run: DEP-S's 16 views ── */
const HB = JSON.parse(await readFile(new URL('../../tests/harbour.json', import.meta.url), 'utf8'));
await page.evaluate(h => __describe.applyScene(h, 'scene'), HB);
const road = HB.areas.find(a => a.name === 'high street').path, [X0, Z0] = road[Math.floor(road.length / 2)];
say(`\n## The harbour village, viewer on the high street at (${X0}, ${Z0})`);
const rows = [];
for (const H of [1.7, 30]) for (let q = 0; q < 8; q++){ const phi = q * PI / 4, { fn, more } = await viewReader(X0, Z0, H, phi);
  await more([...sitesA, ...sitesN(M3), ...sitesN(MF), ...PTS]);
  const A = measure(fn, holdA(fn)), B = measure(fn, holdN(M3, fn)), PF = holdN(MF, fn), F = measure(fn, PF);
  if (H === 1.7 && q === 0) check(fmt(A.view) === '6.8e-6' && fmt(B.view) === '4.0e-5' && fmt(F.view) === '2.0e-5', `4. A, B, F on the first view as DEP-S: ${fmt(A.view)} ${fmt(B.view)} ${fmt(F.view)}`);
  const gC = await holdC(fn, more, 8), C = measure(fn, gC.P), g4 = await holdC(fn, more, 4), g16 = await holdC(fn, more, 16), C4 = measure(fn, g4.P), C16 = measure(fn, g16.P);
  const vals = PTS.map(fn), jumps = []; for (let i = 1; i < vals.length; i++) if (Math.abs(vals[i] - vals[i - 1]) > 0.05) jumps.push(i);
  const near = new Uint8Array(vals.length); for (const j of jumps) for (let i = Math.max(0, j - 9); i <= Math.min(vals.length - 1, j + 8); i++) near[i] = 1;
  const nearSq = P => PTS.reduce((s, x, i) => s + (near[i] ? (P(x) - vals[i]) ** 2 : 0), 0), nF = nearSq(PF), nC = nearSq(gC.P);
  const deepAtJump = gC.order.some(o => o.ch.length >= 2 && jumps.some(j => chainU(PTS[j], o.ch) !== null || chainU(PTS[j - 1], o.ch) !== null));
  // steps at the entered nodes' walls (reported): the presented step against the reading's own
  let wallP = 0, wallR = 0; for (const o of gC.order){ for (const w of [chainAddr(0, o.ch), chainAddr(Infinity, o.ch)]){ const a = w * (1 - 1e-9), b = w * (1 + 1e-9); await more([a, b]);
    wallP = Math.max(wallP, Math.abs(gC.P(a) - gC.P(b))); wallR = Math.max(wallR, Math.abs(fn(a) - fn(b))); } }
  const best3 = Math.min(A.view, B.view, F.view);
  rows.push({ H, q, A: A.view, B: B.view, F: F.view, C: C.view, jumps: jumps.length, nF, nC, deepAtJump, best3 });
  say(`\nH = ${H} m, direction ${q * 45}°: view error A ${fmt(A.view)}  B ${fmt(B.view)}  F ${fmt(F.view)}  C ${fmt(C.view)}  (C with a base of 4: ${fmt(C4.view)}, of 16: ${fmt(C16.view)}); jumps ${jumps.length}`);
  say(`  near the jumps, squared error F ${fmt(nF)}  C ${fmt(nC)}; a ρ-octave node at a jump: ${jumps.length ? (deepAtJump ? 'yes' : 'no') : '(no jump)'}; largest step at a node wall: presented ${fmt(wallP)}, the reading's ${fmt(wallR)}`);
  say(`  C's nodes in order: ${gC.order.map(o => `[${o.ch.join(',')}] (${fmt(o.e)})`).join(' ')}`);
  say(`  per octave (F / C): ${OCTS.map((k, i) => `${k}: ${fmt(F.per[i])}/${fmt(C.per[i])}`).join('  ')}`); }
if (!codeOK) say('!! a check of the code failed: no verdict stands');

/* ── verdicts ── */
say('\n## Verdicts');
const n = f => rows.filter(f).length, J = rows.filter(r => r.jumps > 0), med = xs => { const s = [...xs].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const c1 = n(r => r.C < r.F), c2 = n(r => r.C < r.best3), c3 = J.filter(r => !r.deepAtJump).length, c4 = J.filter(r => r.nC <= 0.5 * r.nF).length;
say(`  C1: C below F in ${c1} of 16 views (at least 12 predicted): ${c1 >= 12 ? 'holds' : 'KC1 FIRES'}`);
say(`  C2: C below the best of A, B, F in ${c2} of 16 views (at least 10 predicted): ${c2 >= 10 ? 'holds' : 'KC2 FIRES'}`);
say(`  C3: ${J.length} views with a jump; a ρ-octave node at a jump missing in ${c3} (none predicted): ${c3 === 0 ? 'holds' : 'KC3 FIRES'}`);
say(`  C4: C's near-jump error at most half of F's in ${c4} of ${J.length} jump views (at least 8 predicted): ${c4 >= 8 ? 'holds' : 'KC4 FIRES'}`);
say(`  (reported) median view error A ${fmt(med(rows.map(r => r.A)))}, B ${fmt(med(rows.map(r => r.B)))}, F ${fmt(med(rows.map(r => r.F)))}, C ${fmt(med(rows.map(r => r.C)))}; median C/F ${fmt(med(rows.map(r => r.C / r.F)))}`);
if (!codeOK) say('  (a check of the code failed: these verdicts do not stand)');
await writeFile(new URL('./content-run.txt', import.meta.url), out.join('\n') + '\n');
await browser.close(); server.close();
