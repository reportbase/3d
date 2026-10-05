// DEP-B: depth held by nesting, against one sweep. The plan, with its predictions and
// kill conditions, is PLAN.md, committed before this file. One run: `node bench/depth/bench.mjs`.
// Prints every measure and a verdict per prediction; RESULTS.md records the run.

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
function leafAddrsB(k){ return S64.t.map(r => addrOf(fOf(r), k)); }
function holderB(fn){ const co = new Map(OCTS.map(k => [k, S64.coef(leafAddrsB(k).map(fn))]));
  return x => { const k = octOf(x); return S64.evalU(co.get(k), 2 * Math.atan(rhoOf(placeIn(x, k)))); }; }

function perOctave(fn, holder){ const P = holder(fn); return OCTS.map(k => { const xs = ptsIn(k), e = xs.map(x => P(x) - fn(x)), tr = xs.map(fn);
  return { k, rel: rms(e) / (rms(tr) || 1), abs: rms(e), max: Math.max(...e.map(Math.abs)) }; }); }

const out = []; const say = s => { out.push(s); console.log(s); };
const fmt = x => x === 0 ? '0' : Math.abs(x) >= 0.01 && Math.abs(x) < 1000 ? x.toFixed(3) : x.toExponential(1);

/* ── 0. the leaves, against the tangent ── */
{ let worst = 0; for (const n of [64, 256, 1024]){ const t = leaves(n); t.forEach((s, j) => { const ref = Math.tan((2 * j + 1) * PI / (4 * n)); worst = Math.max(worst, Math.abs(s - ref) / ref); }); }
  say(`leaves: generated from the corner, worst relative difference from the tangent ${worst.toExponential(1)} (n = 64, 256, 1024)`);
  if (worst > 1e-12) say('  !! the generated lattice is off; the run stops here'); }

/* ── run 1 ── */
say('\n## Run 1: one sweep of 1,024 against 16 octaves of 64');
const res = {};
for (const name of ['selfSimilar', 'smooth', 'rocks']){
  const A = perOctave(C[name], holderA), B = perOctave(C[name], holderB); res[name] = { A, B };
  say(`\ncontent ${name}: relative RMS error per octave (k: A / B)`);
  say(OCTS.map((k, i) => `${k}: ${fmt(name === 'rocks' ? A[i].abs : A[i].rel)} / ${fmt(name === 'rocks' ? B[i].abs : B[i].rel)}`).join('   ') + (name === 'rocks' ? '   (absolute, no prediction)' : ''));
}

// P3: doubling the scale
{ let same = 0, across = 0; const f = C.selfSimilar, f2 = a => f(a / 2);
  for (const k of OCTS){ if (k + 1 > 8) continue; const v1 = leafAddrsB(k).map(f), v2 = leafAddrsB(k + 1).map(f2);
    const d = Math.max(...v1.map((v, j) => Math.abs(v - v2[j])));
    if (k === 0) across = d; else same = Math.max(same, d); }
  say(`\nP3: doubling the scale. Octave k under f against k+1 under f(a/2): worst on one side of the corner ${same.toExponential(1)}; across the corner (0 to 1) ${across.toExponential(1)} (recorded, not predicted)`);
  res.p3 = { same, across, pass: same <= 1e-12 }; say(`  P3 ${res.p3.pass ? 'holds' : 'KILLED'} (prediction: 1e-12)`); }

// P4 / K1
{ const A = res.selfSimilar.A, B = res.selfSimilar.B, at = k => OCTS.indexOf(k);
  const corner = (B[at(0)].rel + B[at(1)].rel) / 2, outer = [-7, -6, -5, -4, 5, 6, 7, 8].map(k => B[at(k)].rel), worstOuter = Math.max(...outer);
  const ratios = []; for (const [from, step] of [[1, 1], [0, -1]]) for (let k = from; OCTS.includes(k + step); k += step){
    const e0 = A[at(k)].rel, e1 = A[at(k + step)].rel; if (e0 > 0.01 && e0 < 0.5 && e1 > 0.01 && e1 < 0.5) ratios.push(e1 / e0); }
  ratios.sort((x, y) => x - y); const med = ratios.length ? ratios[Math.floor(ratios.length / 2)] : NaN;
  const k1 = worstOuter > 2 * corner, aGrowth = med >= 1.5 && med <= 3;
  say(`\nP4: B's corner error ${fmt(corner)}, worst outer ${fmt(worstOuter)} (K1 if above ${fmt(2 * corner)}): ${k1 ? 'K1 KILLS P4' : 'holds'}`);
  say(`    A's growth per octave out, over octaves with error 1–50%: ratios [${ratios.map(fmt).join(', ')}], median ${fmt(med)} (prediction 1.5–3): ${ratios.length ? (aGrowth ? 'holds' : 'does not hold') : 'no octave in the window'}`);
  res.p4 = { corner, worstOuter, k1, ratios, med, aGrowth }; }

// P5 / K2: amplification
{ const dense = Array.from({ length: 4096 }, (_, i) => (i + 0.5) / 4096 * PI), lam = S => Math.max(...dense.map(u => S.card(u).reduce((s, x) => s + Math.abs(x), 0)));
  const L64 = lam(S64), L1024 = lam(SA);
  const perOct = OCTS.map(k => Math.max(...ptsIn(k).map(x => S64.card(2 * Math.atan(rhoOf(placeIn(x, k)))).reduce((s, v) => s + Math.abs(v), 0))));
  const worst = Math.max(...perOct), least = Math.min(...perOct), k2 = worst > 1.01 * L64;
  say(`\nP5: a single 64-leaf sweep's amplification ${fmt(L64)} (one of 1,024: ${fmt(L1024)}); B's per octave from ${fmt(least)} to ${fmt(worst)}`);
  say(`    K2 (above ${fmt(1.01 * L64)}): ${k2 ? 'K2 KILLS P5' : 'does not fire'}; within 1% in every octave: ${least >= 0.99 * L64 ? 'yes' : 'no, lower in some (the octave\'s 256 points miss the sweep\'s worst point)'}`);
  res.p5 = { L64, L1024, least, worst, k2 }; }

// K3: the walls, on the smooth reading
{ const P = holderB(C.smooth), B = res.smooth.B, at = k => OCTS.indexOf(k); let worst = { r: 0 };
  for (const k of OCTS.slice(0, -1)){ const w = 2 ** k, j = Math.abs(P(w * (1 - 1e-9)) - P(w * (1 + 1e-9))), bound = Math.max(B[at(k)].max, B[at(k + 1)].max);
    if (j / bound > worst.r) worst = { r: j / bound, k, j, bound }; }
  const k3 = worst.r > 1; say(`\nK3, the walls (smooth reading): worst jump ${fmt(worst.j)} at the wall 2^${worst.k}, against the neighbouring octaves' largest error ${fmt(worst.bound)}: ${k3 ? 'K3 FIRES' : 'does not fire'}`);
  res.k3 = { ...worst, k3 }; }

/* ── run 2: the busiest-stretch rule ── */
say('\n## Run 2: the busiest-stretch rule (top 256, children of 64 to a budget of 1,024)');
const S256 = sweep(256);
/* A node holds a residual on its own sweep over a region: the whole range (top), an octave
   of the address (child), or an octave of its parent's ρ (grandchild). It maps an address
   to its sweep angle u, or null outside its region. */
function topNode(){ return { level: 0, S: S256, toU: x => 2 * Math.atan(x), sites: S256.t.slice() }; }
function childNode(k){ const S = S64; return { level: 1, k, S, toU: x => octOf(x) === k ? 2 * Math.atan(rhoOf(placeIn(x, k))) : null, sites: S.t.map(r => addrOf(fOf(r), k)) }; }
function grandNode(parent, j){ const S = S64, k = parent.k; // octave j of the child's ρ, nested again
  const toU = x => { if (octOf(x) !== k) return null; const r = rhoOf(placeIn(x, k)); if (octOf(r) !== j) return null; return 2 * Math.atan(rhoOf(placeIn(r, j))); };
  const sites = S.t.map(r2 => addrOf(fOf(addrOf(fOf(r2), j)), k)); return { level: 2, k, j, parent, S, toU, sites }; }
function build(fn, nodes){ // each node in order holds the residual of those before it
  const present = (x, upto) => { let s = 0; for (let i = 0; i < upto; i++){ const nd = nodes[i], u = nd.toU(x); if (u !== null) s += nd.S.evalU(nd.co, u); } return s; };
  nodes.forEach((nd, i) => { nd.co = nd.S.coef(nd.sites.map(x => fn(x) - present(x, i))); });
  return x => present(x, nodes.length); }
function greedy(fn, budget = 1024){
  const nodes = [topNode()]; let used = 256, P = build(fn, nodes); const order = [];
  while (used + 64 <= budget){
    const cands = [];
    for (const k of OCTS) if (!nodes.some(n => n.level === 1 && n.k === k)){ const xs = ptsIn(k); cands.push({ r: rms(xs.map(x => fn(x) - P(x))) / (rms(xs.map(fn)) || 1), make: () => childNode(k), what: `octave ${k}` }); }
    for (const c of nodes.filter(n => n.level === 1)) for (let j = -6; j <= 7; j++){ if (nodes.some(n => n.level === 2 && n.k === c.k && n.j === j)) continue;
      const xs = ptsIn(j).map(r => addrOf(fOf(r), c.k)).filter(x => octOf(x) === c.k); if (xs.length < 8) continue;
      cands.push({ r: rms(xs.map(x => fn(x) - P(x))) / (rms(xs.map(fn)) || 1), make: () => grandNode(c, j), what: `octave ${c.k}, its ρ-octave ${j}` }); }
    cands.sort((a, b) => b.r - a.r); const pick = cands[0]; nodes.push(pick.make()); used += 64; order.push({ what: pick.what, r: pick.r }); P = build(fn, nodes); }
  return { nodes, P, order }; }

// P1: the smooth reading alone
{ const top = build(C.smooth, [topNode()]), topErr = OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => C.smooth(x) - top(x))) / rms(xs.map(C.smooth)); });
  const g = greedy(C.smooth), entered = g.order.filter(o => o.r > 0.01);
  say(`\nP1 (smooth reading alone): the top sweep's relative error per octave ${OCTS.map((k, i) => `${k}: ${fmt(topErr[i])}`).join('  ')}`);
  say(`    children entered (residual at entry): ${g.order.map(o => `${o.what} (${fmt(o.r)})`).join('; ')}`);
  const p1 = Math.max(...topErr) < 0.01 && entered.length === 0;
  say(`    P1 ${p1 ? 'holds' : 'KILLED'}: top below 1% everywhere ${Math.max(...topErr) < 0.01 ? 'yes' : 'no (worst ' + fmt(Math.max(...topErr)) + ')'}, children entered above 1%: ${entered.length}`);
  res.p1 = { topErr, order: g.order, p1 }; }

// P2 and run 2's P5: the burst
{ const g = greedy(C.burst), depth = new Map(OCTS.map(k => [k, 0])); g.nodes.forEach(n => { if (n.level) depth.set(n.k, Math.max(depth.get(n.k), n.level)); });
  say(`\nP2 (smooth swell plus a burst in octaves 3 and -5): entries in order: ${g.order.map(o => `${o.what} (${fmt(o.r)})`).join('; ')}`);
  say(`    depth reached per octave: ${OCTS.map(k => `${k}:${depth.get(k)}`).join(' ')}`);
  const firstTwo = g.order.slice(0, 2).map(o => o.what).sort().join(','), burstFirst = firstTwo === 'octave -5,octave 3';
  const dBurst = Math.min(depth.get(3), depth.get(-5)), deeper = OCTS.filter(k => k !== 3 && k !== -5 && depth.get(k) > dBurst);
  const p2 = burstFirst && deeper.length === 0;
  say(`    burst octaves entered first: ${burstFirst ? 'yes' : 'no (' + firstTwo + ')'}; octaves without the burst deeper than the burst: ${deeper.length ? deeper.join(', ') : 'none'}. P2 ${p2 ? 'holds' : 'KILLED'}`);
  const fin = OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => C.burst(x) - g.P(x))) / rms(xs.map(C.burst)); });
  say(`    final relative error per octave: ${OCTS.map((k, i) => `${k}: ${fmt(fin[i])}`).join('  ')}`);
  // amplification along each path: the presented value as weights on every sample the path holds
  const lamAlone = S => Math.max(...Array.from({ length: 4096 }, (_, i) => (i + 0.5) / 4096 * PI).map(u => S.card(u).reduce((s, x) => s + Math.abs(x), 0)));
  const L256 = lamAlone(S256), L64 = lamAlone(S64);
  function weights(nodes, x){ // weights over each node's sites, for the presented value at x
    const w = nodes.map(nd => new Float64Array(nd.sites.length));
    const add = (i, scale, xq, out) => { // contribution of node i's presentation at xq, as weights, into out (array of arrays)
      const nd = nodes[i], u = nd.toU(xq); if (u === null) return; const cd = nd.S.card(u);
      for (let j = 0; j < cd.length; j++){ if (!cd[j]) continue; out[i][j] += scale * cd[j];
        for (let q = 0; q < i; q++) add(q, -scale * cd[j], nd.sites[j], out); } };   // its leaf held the residual of the nodes before it
    for (let i = 0; i < nodes.length; i++) add(i, 1, x, w);
    return w; }
  let worstRatio = { r: 0 };
  for (const nd of g.nodes.filter(n => n.level >= 1)){ const path = [g.nodes[0]]; if (nd.level === 2) path.push(nd.parent); path.push(nd);
    const xs = (nd.level === 1 ? ptsIn(nd.k) : ptsIn(nd.j).map(r => addrOf(fOf(r), nd.k))).filter((x, i) => i % 8 === 0 && nd.toU(x) !== null);
    let lam = 0; for (const x of xs){ const w = weights(path, x); let s = 0; for (const arr of w) for (const v of arr) s += Math.abs(v); lam = Math.max(lam, s); }
    const sum = L256 + (nd.level === 2 ? 2 : 1) * L64, prod = L256 * (nd.level === 2 ? L64 * L64 : L64);
    if (lam / sum > worstRatio.r) worstRatio = { r: lam / sum, lam, sum, prod, what: nd.level === 2 ? `octave ${nd.k}, ρ-octave ${nd.j}` : `octave ${nd.k}` }; }
  const p5b = worstRatio.r <= 1.02;
  say(`\nP5 (run 2): amplification alone, top ${fmt(L256)}, a child ${fmt(L64)}. Worst path: ${worstRatio.what}, ${fmt(worstRatio.lam)} against the sum ${fmt(worstRatio.sum)} (product ${fmt(worstRatio.prod)}): ${p5b ? 'holds (additive)' : 'KILLED (above 1.02 × the sum)'}`);
  res.p2 = { order: g.order, depth: Object.fromEntries(depth), p2, fin }; res.p5b = { ...worstRatio, p5b }; }

import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./run.txt', import.meta.url), out.join('\n') + '\n');
