// DEP-F, after the run: two checks of its numbers, labelled as such (not verdicts).
// `node bench/depth/flat-checks.mjs`. Definitions copied from flat.mjs.

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


// AFTER THE RUN: two checks of DEP-F's surprising numbers. Not verdicts; the plan's stand.
// 1. Does F converge as a presentation should, or is something reading the answer back?
for (const n of [8, 16, 32, 64]){ const S = sweep(n), fn = fam(4, 0);
  const co = new Map(OCTS.map(k => [k, S.coef(S.t.map(r => addrOf(fF(r), k)).map(fn))]));
  const P = x => { const k = octOf(x); return S.evalU(co.get(k), 2 * Math.atan(rhoF(placeIn(x, k)))); };
  const coB = new Map(OCTS.map(k => [k, S.coef(S.t.map(r => addrOf(fOf(r), k)).map(fn))]));
  const PB = x => { const k = octOf(x); return S.evalU(coB.get(k), 2 * Math.atan(rhoOf(placeIn(x, k)))); };
  say(`check 1, m = 4, ${String(n).padStart(2)} leaves an octave: F ${fmt(mean(relPer(fn, P)))}   B ${fmt(mean(relPer(fn, PB)))}`); }
// 2. F5 again with DEP-E's measure (the jump at gaps 1e-6 and 1e-7, falling tenfold for a slope)
{ const P = holderF(C.smooth); let lo = Infinity, hi = 0, big = 0;
  for (const W of WALLS){ const w = 2 ** W, J = e => Math.abs(P(w * (1 - e)) - P(w * (1 + e))), a = J(1e-6), b = J(1e-7); const r = a / b; lo = Math.min(lo, r); hi = Math.max(hi, r); big = Math.max(big, b);
    say(`check 2, wall 2^${W}: J(1e-6) ${fmt(a)}   J(1e-7) ${fmt(b)}   ratio ${fmt(r)}`); }
  say(`check 2, F on the smooth reading: J(1e-6)/J(1e-7) from ${fmt(lo)} to ${fmt(hi)} over the 15 walls, largest J(1e-7) ${fmt(big)}`); }
import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./flat-checks.txt', import.meta.url), out.join('\n') + '\n');
