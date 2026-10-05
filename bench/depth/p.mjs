// DEP-P: §6's P1–P5 again, with the flattened map. The plan, with its predictions and kill
// conditions, is P-PLAN.md, committed before this file. One run: `node bench/depth/p.mjs`.
// Definitions down to holder A are DEP-B's (bench.mjs), copied unchanged.

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
function holderN(M){ return fn => { const co = new Map(OCTS.map(k => [k, S64.coef(leafAddrs(M, k).map(fn))]));
  return x => { const k = octOf(x); return S64.evalU(co.get(k), 2 * Math.atan(M.rho(placeIn(x, k)))); }; }; }
const holderF = holderN(MF);
function perOctave(fn, holder){ const P = holder(fn); return OCTS.map(k => { const xs = ptsIn(k), e = xs.map(x => P(x) - fn(x)), tr = xs.map(fn);
  return { k, rel: rms(e) / (rms(tr) || 1), abs: rms(e), max: Math.max(...e.map(Math.abs)) }; }); }

/* ── run 1 with F: P3, P4, run 1's P5, K3 by DEP-E's measure ── */
say('## Run 1 with the flattened map (16 octaves of 64)');
let codeOK = true;
{ let same = 0, across = 0; const f = C.selfSimilar, f2 = a => f(a / 2);
  for (const k of OCTS){ if (k + 1 > 8) continue; const v1 = leafAddrs(MF, k).map(f), v2 = leafAddrs(MF, k + 1).map(f2);
    const d = Math.max(...v1.map((v, j) => Math.abs(v - v2[j]))); if (k === 0) across = d; else same = Math.max(same, d); }
  const ok = same <= 1e-12; codeOK &&= ok;
  say(`P3 (check of the code): doubling, worst on one side ${same.toExponential(1)}, across the corner ${across.toExponential(1)} (recorded): ${ok ? 'holds' : 'KP3 FIRES'}`); }
{ const B = perOctave(C.selfSimilar, holderF), at = k => OCTS.indexOf(k);
  const corner = (B[at(0)].rel + B[at(1)].rel) / 2, outer = Math.max(...[-7, -6, -5, -4, 5, 6, 7, 8].map(k => B[at(k)].rel));
  say(`P4 (known from DEP-F): F's corner error ${fmt(corner)}, worst outer ${fmt(outer)}; per octave ${B.map(o => `${o.k}:${fmt(o.rel)}`).join(' ')}`); }
const dense = Array.from({ length: 4096 }, (_, i) => (i + 0.5) / 4096 * PI), lamAlone = S => Math.max(...dense.map(u => S.card(u).reduce((s, x) => s + Math.abs(x), 0)));
const L64 = lamAlone(S64);
{ const perOct = OCTS.map(k => Math.max(...ptsIn(k).map(x => S64.card(2 * Math.atan(MF.rho(placeIn(x, k)))).reduce((s, v) => s + Math.abs(v), 0))));
  const worst = Math.max(...perOct), ok = worst <= 1.01 * L64; codeOK &&= ok;
  say(`P5 run 1 (check of the code): a 64-leaf sweep's amplification ${fmt(L64)}; F's per octave ${fmt(Math.min(...perOct))} to ${fmt(worst)}: ${ok ? 'holds' : 'KP5 FIRES'}`); }
{ const P = holderF(C.smooth), r = []; let big = 0;
  for (let W = -7; W <= 7; W++){ const w = 2 ** W, J = e => Math.abs(P(w * (1 - e)) - P(w * (1 + e))), a = J(1e-6), b = J(1e-7);
    r.push(`2^${W}: ${(a < 1e-13 && b < 1e-13) ? 'roundoff' : fmt(a / b)}`); big = Math.max(big, b); }
  say(`K3 (known from DEP-F; DEP-E's measure, J(1e-6)/J(1e-7)): ${r.join('  ')}; largest J(1e-7) ${fmt(big)}`); }
if (!codeOK) say('!! a check of the code failed: nothing below is trusted');

/* ── run 2: the busiest-stretch rule, with a top and a map as parameters ── */
const S256 = sweep(256);
const TOPS = {
  'T-a': { toU: x => 2 * Math.atan(x), sites: S256.t.slice() },                                     // DEP-B's: the raw address
  'T-F': { toU: x => 2 * Math.atan(MF.rho((log2(x) + 8) / 16)), sites: S256.t.map(r => 2 ** (16 * MF.f(r) - 8)) },   // the exponent's place, flattened
};
function topNode(T){ return { level: 0, S: S256, toU: TOPS[T].toU, sites: TOPS[T].sites }; }
function childNode(M, k){ return { level: 1, k, S: S64, toU: x => octOf(x) === k ? 2 * Math.atan(M.rho(placeIn(x, k))) : null, sites: leafAddrs(M, k) }; }
function grandNode(M, parent, j){ const k = parent.k;   // ρ-octave j of the child's sweep, nested again
  const toU = x => { if (octOf(x) !== k) return null; const r = M.rho(placeIn(x, k)); if (octOf(r) !== j) return null; return 2 * Math.atan(M.rho(placeIn(r, j))); };
  return { level: 2, k, j, parent, S: S64, toU, sites: S64.t.map(r2 => addrOf(M.f(addrOf(M.f(r2), j)), k)) }; }
function build(fn, nodes){
  const present = (x, upto) => { let s = 0; for (let i = 0; i < upto; i++){ const nd = nodes[i], u = nd.toU(x); if (u !== null) s += nd.S.evalU(nd.co, u); } return s; };
  nodes.forEach((nd, i) => { nd.co = nd.S.coef(nd.sites.map(x => fn(x) - present(x, i))); });
  return x => present(x, nodes.length); }
const STOP = 1e-9;   // the plan's stopping rule: no entry on a residual below this
function greedy(fn, T, M, budget = 1024){
  const nodes = [topNode(T)]; let used = 256, P = build(fn, nodes); const order = [];
  while (used + 64 <= budget){
    const cands = [];
    for (const k of OCTS) if (!nodes.some(n => n.level === 1 && n.k === k)){ const xs = ptsIn(k); cands.push({ r: rms(xs.map(x => fn(x) - P(x))) / (rms(xs.map(fn)) || 1), make: () => childNode(M, k), what: `octave ${k}` }); }
    for (const c of nodes.filter(n => n.level === 1)) for (let j = -6; j <= 7; j++){ if (nodes.some(n => n.level === 2 && n.k === c.k && n.j === j)) continue;
      const xs = ptsIn(j).map(r => addrOf(M.f(r), c.k)).filter(x => octOf(x) === c.k); if (xs.length < 8) continue;
      cands.push({ r: rms(xs.map(x => fn(x) - P(x))) / (rms(xs.map(fn)) || 1), make: () => grandNode(M, c, j), what: `octave ${c.k}, its ρ-octave ${j}` }); }
    cands.sort((a, b) => b.r - a.r); const pick = cands[0]; if (!pick || pick.r < STOP) break;
    nodes.push(pick.make()); used += 64; order.push({ what: pick.what, r: pick.r }); P = build(fn, nodes); }
  return { nodes, P, order, used }; }
const CONF = { 'DEP-B (T-a, §3)': ['T-a', M3], 'T-a + F': ['T-a', MF], 'T-F + F': ['T-F', MF] };
const topErr = (fn, T) => { const P = build(fn, [topNode(T)]); return OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => fn(x) - P(x))) / (rms(xs.map(fn)) || 1); }); };
const entries = g => g.order.map(o => `${o.what} (${fmt(o.r)})`).join('; ') || 'none';

say('\n## Run 2: the busiest-stretch rule (top 256, children of 64, budget 1,024, stop below 1e-9)');
// P1
{ say('\nP1, the smooth reading alone');
  for (const T of ['T-a', 'T-F']){ const e = topErr(C.smooth, T); say(`  top ${T}: relative error per octave ${OCTS.map((k, i) => `${k}:${fmt(e[i])}`).join(' ')}`); }
  for (const [name, [T, M]] of Object.entries(CONF).slice(1)){ const g = greedy(C.smooth, T, M); say(`  ${name}: entries ${entries(g)}; leaves used ${g.used}`); }
  const e = topErr(C.smooth, 'T-F'), g = greedy(C.smooth, 'T-F', MF), above = g.order.filter(o => o.r > 0.01).length, ok = Math.max(...e) < 0.01 && above === 0;
  say(`  P1 (T-F): top's worst ${fmt(Math.max(...e))} (below 1% predicted), children entered above 1%: ${above}: ${ok ? 'holds' : 'KP1 FIRES'}`); }
// P2
const depthOf = g => { const d = new Map(OCTS.map(k => [k, 0])); g.nodes.forEach(n => { if (n.level) d.set(n.k, Math.max(d.get(n.k), n.level)); }); return d; };
const finalRel = (fn, g) => OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => fn(x) - g.P(x))) / (rms(xs.map(fn)) || 1); });
let gP2;
{ say('\nP2, the smooth swell plus a burst in octaves 3 and -5');
  for (const [name, [T, M]] of Object.entries(CONF)){ const g = greedy(C.burst, T, M), d = depthOf(g), fin = finalRel(C.burst, g); if (name === 'T-F + F') gP2 = g;
    say(`  ${name}: entries ${entries(g)}; leaves used ${g.used}`);
    say(`    depth per octave ${OCTS.map(k => `${k}:${d.get(k)}`).join(' ')}`);
    say(`    final relative error per octave ${OCTS.map((k, i) => `${k}:${fmt(fin[i])}`).join(' ')}; mean ${fmt(mean(fin))}`); }
  const g = gP2, d = depthOf(g), firstTwo = g.order.slice(0, 2).map(o => o.what).sort().join(','), first = firstTwo === 'octave -5,octave 3';
  const dB = Math.min(d.get(3), d.get(-5)), deeper = OCTS.filter(k => k !== 3 && k !== -5 && d.get(k) > dB), ok = first && deeper.length === 0;
  say(`  P2 (T-F + F): burst octaves first ${first ? 'yes' : 'no (' + firstTwo + ')'}; octaves without the burst deeper: ${deeper.length ? deeper.join(', ') : 'none'}: ${ok ? 'holds' : 'KP2 FIRES'}`); }
// run 2's P5, on P2's entries (as DEP-B)
{ const L256 = lamAlone(S256), g = gP2;
  function weights(nodes, x){ const w = nodes.map(nd => new Float64Array(nd.sites.length));
    const add = (i, scale, xq, o) => { const nd = nodes[i], u = nd.toU(xq); if (u === null) return; const cd = nd.S.card(u);
      for (let j = 0; j < cd.length; j++){ if (!cd[j]) continue; o[i][j] += scale * cd[j]; for (let q = 0; q < i; q++) add(q, -scale * cd[j], nd.sites[j], o); } };
    for (let i = 0; i < nodes.length; i++) add(i, 1, x, w); return w; }
  let worst = { r: 0, what: 'no path entered' };
  for (const nd of g.nodes.filter(n => n.level >= 1)){ const path = [g.nodes[0]]; if (nd.level === 2) path.push(nd.parent); path.push(nd);
    const xs = (nd.level === 1 ? ptsIn(nd.k) : ptsIn(nd.j).map(r => addrOf(MF.f(r), nd.k))).filter((x, i) => i % 8 === 0 && nd.toU(x) !== null);
    let lam = 0; for (const x of xs){ const w = weights(path, x); let s = 0; for (const arr of w) for (const v of arr) s += Math.abs(v); lam = Math.max(lam, s); }
    const sum = L256 + (nd.level === 2 ? 2 : 1) * L64; if (lam / sum > worst.r) worst = { r: lam / sum, lam, sum, what: nd.level === 2 ? `octave ${nd.k}, ρ-octave ${nd.j}` : `octave ${nd.k}` }; }
  say(`\nP5 run 2 (T-F + F): alone, top ${fmt(L256)}, a child ${fmt(L64)}. Worst path ${worst.what}: ${worst.lam ? fmt(worst.lam) + ' against the sum ' + fmt(worst.sum) : ''}: ${worst.r <= 1.02 ? 'holds' : 'KP5 FIRES'}`); }
// rocks, reported
{ say('\nRocks (reported, not predicted): absolute error per octave after run 2\'s rule');
  for (const [name, [T, M]] of Object.entries(CONF)){ const g = greedy(C.rocks, T, M), abs = OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => C.rocks(x) - g.P(x))); });
    say(`  ${name}: ${g.order.length} entries, leaves used ${g.used}; ${OCTS.map((k, i) => `${k}:${fmt(abs[i])}`).join(' ')}; mean ${fmt(mean(abs))}`); } }

import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./p-run.txt', import.meta.url), out.join('\n') + '\n');
