// DEP-F: flattened ends, and the frequency test of DEP-W's hypothesis. The plan is
// FLAT-PLAN.md, committed before this file. One run: `node bench/depth/flat.mjs`.
// Holders B, W and J2 are DEP-W's (width.mjs), copied unchanged; F is new.

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
const WALLS = []; for (let w = -7; w <= 7; w++) WALLS.push(w);
const ptsIn = k => Array.from({ length: 256 }, (_, i) => 2 ** (k - 1 + (i + 0.5) / 256));
const rms = xs => Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / xs.length);
const out = []; const say = s => { out.push(s); console.log(s); };
const fmt = x => x === 0 ? '0' : Math.abs(x) >= 0.01 && Math.abs(x) < 1000 ? x.toFixed(3) : x.toExponential(1);
const sm = s => { s = Math.max(0, Math.min(1, s)); return s * s * (3 - 2 * s); };
const S64 = sweep(64);

/* DEP-B's nesting (as in bench.mjs) */
const leafAddrsB = k => S64.t.map(r => addrOf(fOf(r), k));
function holderB(fn){ const co = new Map(OCTS.map(k => [k, S64.coef(leafAddrsB(k).map(fn))]));
  return x => { const k = octOf(x); return S64.evalU(co.get(k), 2 * Math.atan(rhoOf(placeIn(x, k)))); }; }

/* an octave's sweep widened by d at each wall (DEP-J's J2 sweep, with d free) */
function placeX(a, k, d){ const lo = 2 ** (k - 1 - d), hi = 2 ** (k + d), below = 2 ** k <= 1;
  return below ? (a - lo) / (hi - lo) : (1 / lo - 1 / a) / (1 / lo - 1 / hi); }
function addrX(f, k, d){ const lo = 2 ** (k - 1 - d), hi = 2 ** (k + d), below = 2 ** k <= 1;
  return below ? lo + f * (hi - lo) : 1 / (1 / lo - f * (1 / lo - 1 / hi)); }
const coX = (fn, d) => new Map(OCTS.map(k => [k, S64.coef(S64.t.map(r => addrX(fOf(r), k, d)).map(fn))]));
const atX = (co, x, k, d) => S64.evalU(co.get(k), 2 * Math.atan(rhoOf(placeX(x, k, d))));
// J2, as DEP-J (d = 1/8, blended across a quarter-octave band at each inner wall)
function holderJ2(fn, d = 1 / 8){ const co = coX(fn, d);
  return x => { const L = log2(x), W = Math.round(L);
    if (Math.abs(L - W) < d && W > -8 && W < 8){ const s = sm((L - W + d) / (2 * d)); return (1 - s) * atX(co, x, W, d) + s * atX(co, x, W + 1, d); }
    return atX(co, x, octOf(x), d); }; }
// W: widened, no blend: every address by its own octave alone
function holderW(fn, d){ const co = coX(fn, d); return x => atX(co, x, octOf(x), d); }

const relPer = (fn, P) => OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => P(x) - fn(x))) / (rms(xs.map(fn)) || 1); });



const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;
/* F: nesting with the flattened map, f = ρ²/(1+ρ²), ρ = √(f/(1−f)): walls on home and horizon, corner at the middle */
const rhoF = f => f >= 1 ? Infinity : Math.sqrt(f / (1 - f));
const fF = r => r === Infinity ? 1 : r * r / (1 + r * r);
const leafAddrsF = k => S64.t.map(r => addrOf(fF(r), k));
function holderF(fn){ const co = new Map(OCTS.map(k => [k, S64.coef(leafAddrsF(k).map(fn))]));
  return x => { const k = octOf(x); return S64.evalU(co.get(k), 2 * Math.atan(rhoF(placeIn(x, k)))); }; }
const fam = (m, ph) => a => Math.sin(2 * PI * m * (log2(a) + ph));
const err = (fn, P) => mean(relPer(fn, P));

/* the readings, each by the three holders */
const READ = []; for (const m of [3, 4, 5]) for (const ph of [0, 1 / 32, 1 / 16, 3 / 32]) READ.push({ name: `m=${m} φ=${ph === 0 ? 0 : '1/' + Math.round(1 / ph * 1) + (ph === 3 / 32 ? '·3' : '')}`, m, ph, fn: fam(m, ph) });
READ.forEach(r => { if (r.ph === 3 / 32) r.name = `m=${r.m} φ=3/32`; });
READ.push({ name: 'smooth', fn: C.smooth });
say('Mean relative error over the 16 octaves (B: DEP-B nesting / J: overlap 1/16 + blend / F: flattened ends)');
for (const r of READ){ r.B = err(r.fn, holderB(r.fn)); r.J = err(r.fn, holderJ2(r.fn, 1 / 16)); r.F = err(r.fn, holderF(r.fn));
  say(`${r.name.padEnd(12)} B ${fmt(r.B)}   J ${fmt(r.J)}   F ${fmt(r.F)}   F/B ${fmt(r.F / r.B)}   F/J ${fmt(r.F / r.J)}`); }
{ const rk = [holderB, h => holderJ2(h, 1 / 16), holderF].map(H => err(C.rocks, H(C.rocks))); say(`rocks (reported, not predicted)   B ${fmt(rk[0])}   J ${fmt(rk[1])}   F ${fmt(rk[2])}`); }

say('\n## Verdicts');
// F1: the hypothesis, by frequency
{ const ES = Array.from({ length: 33 }, (_, i) => -6 + i / 8);
  for (const m of [3, 5]){ const fn = fam(m, 0), c = ES.map(e => err(fn, holderW(fn, 2 ** e)));
    let i = 1; while (i < c.length - 1 && !(c[i] <= c[i - 1] && c[i] < c[i + 1])) i++;
    const want = log2(1 / (4 * m)), ok = i < c.length - 1 && Math.abs(ES[i] - want) <= 1 / 8 + 1e-9;
    say(`F1 (m = ${m}): W's error against log2 δ ${ES.map((e, j) => `${e.toFixed(3)}:${fmt(c[j])}`).join(' ')}`);
    say(`   first valley at log2 δ = ${i < c.length - 1 ? ES[i].toFixed(3) : 'none'}, predicted ${want.toFixed(3)} (δ = 1/${4 * m}): ${ok ? 'holds' : 'KF1 KILLS the hypothesis'}`); } }
// F2
{ const bad = READ.filter(r => r.F > r.B / 5); say(`F2: F at most 1/5 of B on every reading: ${bad.length ? 'KF2 FIRES on ' + bad.map(r => `${r.name} (${fmt(r.F / r.B)})`).join(', ') : 'holds (worst F/B ' + fmt(Math.max(...READ.map(r => r.F / r.B))) + ')'}`); }
// F3
for (const m of [3, 4, 5]){ const rs = READ.filter(r => r.m === m), sp = k => Math.max(...rs.map(r => r[k])) / Math.min(...rs.map(r => r[k]));
  const okF = sp('F') < 1.5, okJ = sp('J') > 3; say(`F3 (m = ${m}): spread over the four phases, F ${fmt(sp('F'))}× (below 1.5 predicted), J ${fmt(sp('J'))}× (above 3 predicted): ${okF && okJ ? 'holds' : 'KF3 FIRES' + (!okF ? ' (F spreads)' : '') + (!okJ ? ' (J does not)' : '')}`); }
// F4
{ const k = 3, fn = fam(4, 0), P = holderF(fn), bins = Array.from({ length: 8 }, () => []);
  for (let i = 0; i < 2048; i++){ const u = (i + 0.5) / 2048 * PI, x = addrOf(fF(Math.tan(u / 2)), k); bins[Math.floor(i / 256)].push(P(x) - fn(x)); }
  const br = bins.map(rms), mid = br.slice(1, 7).slice().sort((a, b) => a - b), med = (mid[2] + mid[3]) / 2, ok = br[0] < 3 * med && br[7] < 3 * med;
  say(`F4: F's octave 3 by eighths of its turn: ${br.map(fmt).join(', ')}; middle median ${fmt(med)}: ${ok ? 'holds' : 'KF4 FIRES (ends ' + fmt(br[0] / med) + '× and ' + fmt(br[7] / med) + '×)'}`); }
// F5
{ const P = holderF(C.smooth); let worst = { r: 0 };
  const maxIn = k => Math.max(...ptsIn(k).map(x => Math.abs(P(x) - C.smooth(x))));
  for (const W of WALLS){ const w = 2 ** W, j = Math.abs(P(w * (1 - 1e-9)) - P(w * (1 + 1e-9))), b = Math.max(maxIn(W), maxIn(W + 1)); if (j / b > worst.r) worst = { r: j / b, W, j, b }; }
  say(`F5: F's worst wall jump on the smooth reading ${fmt(worst.j)} at 2^${worst.W}, against the next octaves' largest error ${fmt(worst.b)}: ${worst.r <= 1 ? 'holds' : 'KF5 FIRES'}`); }
// reported: F against J
{ const fBetter = READ.filter(r => r.F < r.J).length; say(`\nNot predicted: F below J on ${fBetter} of ${READ.length} readings.`); }

import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./flat-run.txt', import.meta.url), out.join('\n') + '\n');
