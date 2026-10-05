// DEP-W: the best overlap width. The plan is WIDTH-PLAN.md, committed before this file.
// One run: `node bench/depth/width.mjs`. Holders W and J2 are DEP-E's (ends.mjs), copied,
// with J2's width made free.

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
const ES = Array.from({ length: 33 }, (_, i) => -6 + i / 8), DS = ES.map(e => 2 ** e);
const curve = {};
for (const [nm, fn] of [['self-similar', C.selfSimilar], ['smooth', C.smooth], ['rocks', C.rocks]]){
  curve[nm] = { W: DS.map(d => mean(relPer(fn, holderW(fn, d)))), J2: DS.map(d => mean(relPer(fn, holderJ2(fn, d)))) };
  say(`${nm}: mean relative error over the 16 octaves (log2 δ: W / J2)${nm === 'rocks' ? ', reported, not predicted' : ''}`);
  say(ES.map((e, i) => `${e.toFixed(3)}: ${fmt(curve[nm].W[i])} / ${fmt(curve[nm].J2[i])}`).join('   ')); }
const best = arr => arr.indexOf(Math.min(...arr));
say('\n## Verdicts');
const ss = curve['self-similar'], smv = curve.smooth;
for (const h of ['W', 'J2']){ const i = best(ss[h]), e = ES[i], ok = e >= -4.5 && e <= -3.5;
  say(`W1 (${h}): least self-similar error at log2 δ = ${e.toFixed(3)} (δ = 1/${(1 / DS[i]).toFixed(1)}), ${fmt(ss[h][i])}: ${ok ? 'holds' : 'KW1 KILLS W1'}`); }
for (const h of ['W', 'J2']){ const c = ss[h], i = best(c), against = [];
  for (let j = 1; j <= i; j++) if (c[j] > c[j - 1] * 1.05) against.push(`up at ${ES[j].toFixed(3)} (+${fmt(c[j] / c[j - 1] - 1)})`);
  for (let j = i + 1; j < c.length; j++) if (c[j] < c[j - 1] / 1.05) against.push(`down at ${ES[j].toFixed(3)} (−${fmt(1 - c[j] / c[j - 1])})`);
  say(`W2 (${h}): steps against the trend by more than 5%: ${against.length ? against.join(', ') + ' — KW2 KILLS W2' : 'none, one valley: holds'}`); }
{ let worst = { r: 0 }; for (const nm of ['self-similar', 'smooth']) DS.forEach((d, i) => { const r = curve[nm].J2[i] / curve[nm].W[i]; if (r > worst.r) worst = { r, nm, e: ES[i] }; });
  say(`W3: J2 against W, worst ${fmt(worst.r)}× (${worst.nm}, log2 δ = ${worst.e.toFixed(3)}): ${worst.r <= 1.5 ? 'holds' : 'KW3 KILLS W3'}`); }
{ const a = best(ss.W), b = best(smv.W); say(`W4: W's best width, smooth log2 δ = ${ES[b].toFixed(3)}, self-similar ${ES[a].toFixed(3)}: ${ES[b] >= ES[a] ? 'holds' : 'KW4 KILLS W4'}`); }
{ const i = best(ss.J2), j = best(smv.J2);
  say(`\nAt the best widths, against DEP-B's nesting (1.0e-2 self-similar, ${fmt(mean(relPer(C.smooth, holderB(C.smooth))))} smooth): J2 ${fmt(ss.J2[i])} (${fmt(1e-2 / ss.J2[i])}× lower) and ${fmt(smv.J2[j])} at log2 δ ${ES[j].toFixed(3)}.`); }

import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./width-run.txt', import.meta.url), out.join('\n') + '\n');
