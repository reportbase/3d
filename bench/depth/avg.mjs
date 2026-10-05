// DEP-A: a top that holds cell averages, and an absolute entry rule. The plan, with its
// predictions and kill conditions, is A-PLAN.md, committed before this file. One run:
// `node bench/depth/avg.mjs`. Definitions are DEP-P's (p.mjs), copied; the top and the rule are new.

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
const S256 = sweep(256);
function childNode(M, k){ return { level: 1, k, S: S64, toU: x => octOf(x) === k ? 2 * Math.atan(M.rho(placeIn(x, k))) : null, sites: leafAddrs(M, k) }; }
function grandNode(M, parent, j){ const k = parent.k;   // ρ-octave j of the child's sweep, nested again
  const toU = x => { if (octOf(x) !== k) return null; const r = M.rho(placeIn(x, k)); if (octOf(r) !== j) return null; return 2 * Math.atan(M.rho(placeIn(r, j))); };
  return { level: 2, k, j, parent, S: S64, toU, sites: S64.t.map(r2 => addrOf(M.f(addrOf(M.f(r2), j)), k)) }; }
const dense = Array.from({ length: 4096 }, (_, i) => (i + 0.5) / 4096 * PI), lamAlone = S => Math.max(...dense.map(u => S.card(u).reduce((s, x) => s + Math.abs(x), 0)));
const L64 = lamAlone(S64), L256 = lamAlone(S256);

/* ── averages: adaptive Gauss–Kronrod 15 ── */
const XK = [0.991455371120812639, 0.949107912342758525, 0.864864423359769073, 0.741531185599394440, 0.586087235467691130, 0.405845151377397167, 0.207784955007898468, 0];
const WK = [0.022935322010529225, 0.063092092629978553, 0.104790010322250184, 0.140653259715525919, 0.169004726639267903, 0.190350578064785410, 0.204432940075298892, 0.209482141084727828];
const WG = [0, 0.129484966168869693, 0, 0.279705391489276668, 0, 0.381830050505118945, 0, 0.417959183673469388];
function gk(g, a, b){ const c = (a + b) / 2, h = (b - a) / 2; let K = 0, G = 0, big = 0;
  for (let i = 0; i < 8; i++){ if (i === 7){ const v = g(c); K += WK[7] * v; G += WG[7] * v; big = Math.max(big, Math.abs(v)); continue; }
    const v1 = g(c - h * XK[i]), v2 = g(c + h * XK[i]), v = v1 + v2; K += WK[i] * v; G += WG[i] * v; big = Math.max(big, Math.abs(v1), Math.abs(v2)); }
  return [K * h, Math.abs(K - G) * h, big]; }
// stops at the tolerance, or once the error estimate is at roundoff: 1e-13 of the piece's width times the reading's
// size over the whole window, from meanOver (G). Roundoff in evaluating cos(255u) is absolute, so near a zero of the
// reading a floor relative to the values seen there can't be met.
function adapt(g, a, b, tol, G, d = 0){ const [K, e] = gk(g, a, b);
  if (e <= tol || e <= 1e-13 * (b - a) * G || d > 40) return K; const c = (a + b) / 2; return adapt(g, a, c, tol / 2, G, d + 1) + adapt(g, c, b, tol / 2, G, d + 1); }
// mean of g over [a, b], from 64 pieces, each to 1e-15 of its share
// (with a weight w of total area `area`, the weighted mean: a triangle of peak 1 two cells wide has area one cell)
// The roundoff floor's size G is the integrand's largest value at 257 points even over the whole window.
function meanOver(g, a, b, w = null, area = b - a){ const P = 64, s = (b - a) / P, f = w ? (u => g(u) * w(u)) : g; let t = 0, G = 0;
  for (let i = 0; i <= 256; i++) G = Math.max(G, Math.abs(f(a + (b - a) * i / 256)));
  for (let i = 0; i < P; i++){ const lo = a + i * s, hi = lo + s; t += adapt(f, lo, hi, 1e-15 * s, G); }
  return t / area; }

/* ── tops: where the sweep's angle u lands on the line, and how a leaf takes its value ── */
const TOPS = {
  'T-a': { toU: x => 2 * Math.atan(x), xOf: u => Math.tan(u / 2) },                                                // DEP-B's: the raw address
  'T-F': { toU: x => 2 * Math.atan(MF.rho((log2(x) + 8) / 16)), xOf: u => 2 ** (16 * Math.sin(u / 2) ** 2 - 8) },   // the exponent's place, flattened
};
const even = u => { u = Math.abs(u); return u > PI ? 2 * PI - u : u; };   // the cosine series reads the even extension
function topNode(T, take, fn){ const S = S256, n = S.n, du = PI / n, g = u => fn(TOPS[T].xOf(even(u)));
  let vals, sig;
  if (take === 'point'){ vals = S.t.map(r => fn(T === 'T-a' ? r : 2 ** (16 * MF.f(r) - 8))); sig = () => 1; }
  else if (take === 'box'){ vals = S.u.map(uj => meanOver(g, uj - du / 2, uj + du / 2)); sig = m => m ? Math.sin(m * du / 2) / (m * du / 2) : 1; }
  else { vals = S.u.map(uj => meanOver(g, uj - du, uj + du, u => 1 - Math.abs(u - uj) / du, du)); sig = m => m ? (Math.sin(m * du / 2) / (m * du / 2)) ** 2 : 1; }
  const co = S.coef(vals).map((a, m) => a / sig(m));
  return { level: 0, S, toU: TOPS[T].toU, co, fixed: true }; }
function build(fn, nodes){   // the top holds fn itself (fixed); each later node holds the residual of those before it
  const present = (x, upto) => { let s = 0; for (let i = 0; i < upto; i++){ const nd = nodes[i], u = nd.toU(x); if (u !== null) s += nd.S.evalU(nd.co, u); } return s; };
  nodes.forEach((nd, i) => { if (!nd.fixed) nd.co = nd.S.coef(nd.sites.map(x => fn(x) - present(x, i))); });
  return x => present(x, nodes.length); }
const ALL = OCTS.flatMap(ptsIn);
const STOP = 1e-9;
function greedy(fn, T, take, rule, budget = 1024){
  const whole = rms(ALL.map(fn)) || 1, M = MF;
  const nodes = [topNode(T, take, fn)]; let used = 256, P = build(fn, nodes); const order = [];
  const meas = xs => rms(xs.map(x => fn(x) - P(x))) / (rule === 'abs' ? whole : (rms(xs.map(fn)) || 1));
  while (used + 64 <= budget){
    const cands = [];
    for (const k of OCTS) if (!nodes.some(n => n.level === 1 && n.k === k)) cands.push({ r: meas(ptsIn(k)), make: () => childNode(M, k), what: `octave ${k}` });
    for (const c of nodes.filter(n => n.level === 1)) for (let j = -6; j <= 7; j++){ if (nodes.some(n => n.level === 2 && n.k === c.k && n.j === j)) continue;
      const xs = ptsIn(j).map(r => addrOf(M.f(r), c.k)).filter(x => octOf(x) === c.k); if (xs.length < 8) continue;
      cands.push({ r: meas(xs), make: () => grandNode(M, c, j), what: `octave ${c.k}, its ρ-octave ${j}` }); }
    cands.sort((a, b) => b.r - a.r); const pick = cands[0]; if (!pick || pick.r < STOP) break;
    nodes.push(pick.make()); used += 64; order.push({ what: pick.what, r: pick.r }); P = build(fn, nodes); }
  return { nodes, P, order, used }; }
const entries = g => g.order.map(o => `${o.what} (${fmt(o.r)})`).join('; ') || 'none';
const depthOf = g => { const d = new Map(OCTS.map(k => [k, 0])); g.nodes.forEach(n => { if (n.level) d.set(n.k, Math.max(d.get(n.k), n.level)); }); return d; };
const finalRel = (fn, P) => OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => fn(x) - P(x))) / (rms(xs.map(fn)) || 1); });
const absPer = (fn, P) => OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => fn(x) - P(x))); });
const median = xs => { const s = [...xs].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
function p2(g){ const d = depthOf(g), first = g.order.slice(0, 2).map(o => o.what).sort().join(',') === 'octave -5,octave 3';
  const dB = Math.min(d.get(3), d.get(-5)), deeper = OCTS.filter(k => k !== 3 && k !== -5 && d.get(k) > dB);
  return { ok: first && deeper.length === 0, first, deeper, d }; }

/* ── checks of the code ── */
let codeOK = true;
say('## Checks of the code');
for (const T of ['T-a', 'T-F']) for (const m of [37, 255]) for (const take of ['point', 'box', 'tri']){
  const fn = x => Math.cos(m * TOPS[T].toU(x)), P = build(fn, [topNode(T, take, fn)]), e = Math.max(...ALL.map(x => Math.abs(P(x) - fn(x)))), ok = e <= 1e-12; codeOK &&= ok;
  say(`  ${T}, cos(${m}u), ${take}: worst ${fmt(e)} ${ok ? 'ok' : '!! FAILS'}`); }
{ const g = x => Math.exp(-(((x - 64) / 0.05) ** 2)), got = meanOver(g, 40, 65), want = 0.05 * Math.sqrt(PI) / 25, e = Math.abs(got - want) / want, ok = e <= 1e-12; codeOK &&= ok;
  say(`  a rock 0.05 wide averaged over a cell 25 wide: relative difference from the closed form ${fmt(e)} ${ok ? 'ok' : '!! FAILS'}`); }
if (!codeOK) say('!! a check of the code failed: numbers follow, no verdict stands');

/* ── the run ── */
const CONFS = [['P·rel', 'point', 'rel'], ['P·abs', 'point', 'abs'], ['A·abs', 'box', 'abs'], ['T·abs', 'tri', 'abs']];
const NB = OCTS.filter(k => k !== 3 && k !== -5);
const res = {};
say('\n## The top alone on the burst reading: absolute error per octave');
const spill = {};
for (const T of ['T-a', 'T-F']) for (const take of ['point', 'box', 'tri']){
  const P = build(C.burst, [topNode(T, take, C.burst)]), a = absPer(C.burst, P), med = median(NB.map(k => a[OCTS.indexOf(k)]));
  spill[T + take] = med; say(`  ${T} ${take}: ${OCTS.map((k, i) => `${k}:${fmt(a[i])}`).join(' ')}; median without the burst ${fmt(med)}`); }

say('\n## The burst reading under the rule (budget 1,024, stop below 1e-9)');
for (const T of ['T-a', 'T-F']) for (const [name, take, rule] of CONFS){
  const g = greedy(C.burst, T, take, rule), q = p2(g), fin = finalRel(C.burst, g.P); res[T + name] = { q, mean: mean(fin) };
  say(`  ${T} ${name}: entries ${entries(g)}; leaves used ${g.used}`);
  say(`    depth ${OCTS.map(k => `${k}:${q.d.get(k)}`).join(' ')}; burst first ${q.first ? 'yes' : 'no'}; non-burst deeper: ${q.deeper.length ? q.deeper.join(', ') : 'none'}`);
  say(`    final relative error ${OCTS.map((k, i) => `${k}:${fmt(fin[i])}`).join(' ')}; mean ${fmt(mean(fin))}`); }

say('\n## The smooth reading, T-F top alone');
const smoothTop = {};
for (const take of ['point', 'box', 'tri']){ const P = build(C.smooth, [topNode('T-F', take, C.smooth)]), r = finalRel(C.smooth, P); smoothTop[take] = Math.max(...r);
  say(`  ${take}: worst relative error ${fmt(Math.max(...r))}`); }

say('\n## Rocks (reported, not predicted)');
for (const T of ['T-a', 'T-F']) for (const [name, take, rule] of CONFS){ const g = greedy(C.rocks, T, take, rule), a = absPer(C.rocks, g.P);
  say(`  ${T} ${name}: ${g.order.length} entries, leaves used ${g.used}; ${OCTS.map((k, i) => `${k}:${fmt(a[i])}`).join(' ')}; mean ${fmt(mean(a))}`); }

say('\n## Verdicts');
const prior = { 'T-a': 3.9e-3, 'T-F': 6.6e-3 };
for (const T of ['T-a', 'T-F']){
  const a1 = res[T + 'P·abs'].q, a3 = res[T + 'A·abs'], ratio = spill[T + 'point'] / spill[T + 'box'], gain = prior[T] / a3.mean;
  say(`  A1 (${T}): ${a1.ok ? 'holds' : 'KA1 FIRES'} (burst first ${a1.first ? 'yes' : 'no'}; deeper ${a1.deeper.join(', ') || 'none'})`);
  say(`  A2 (${T}): spill point ${fmt(spill[T + 'point'])} / box ${fmt(spill[T + 'box'])} = ${fmt(ratio)} (at least 3 predicted): ${ratio >= 3 ? 'holds' : 'KA2 FIRES'}; triangle (reported) ${fmt(spill[T + 'point'] / spill[T + 'tri'])}`);
  say(`  A3 (${T}): P2 ${a3.q.ok ? 'holds' : 'fails'}; mean ${fmt(a3.mean)} against DEP-P's ${fmt(prior[T])}, ${fmt(gain)}× (at least 3 predicted): ${a3.q.ok && gain >= 3 ? 'holds' : 'KA3 FIRES'}`); }
say(`  A4: A·abs's T-F top on the smooth reading, worst ${fmt(smoothTop.box)} (below 1e-12 predicted): ${smoothTop.box < 1e-12 ? 'holds' : 'KA4 FIRES'}`);
if (!codeOK) say('  (a check of the code failed: these verdicts do not stand)');

import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./avg-run.txt', import.meta.url), out.join('\n') + '\n');
