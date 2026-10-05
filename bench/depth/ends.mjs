// DEP-E: J2's continuity (E1) and where a nested sweep's error lives (E2). The plan is
// ENDS-PLAN.md, committed before this file. One run: `node bench/depth/ends.mjs`.
// Leaves, presentation and nesting are DEP-B's (bench.mjs), copied unchanged.

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
function holderJ2(fn){ const d = 1 / 8, co = coX(fn, d);
  return x => { const L = log2(x), W = Math.round(L);
    if (Math.abs(L - W) < d && W > -8 && W < 8){ const s = sm((L - W + d) / (2 * d)); return (1 - s) * atX(co, x, W, d) + s * atX(co, x, W + 1, d); }
    return atX(co, x, octOf(x), d); }; }
// W: widened, no blend: every address by its own octave alone
function holderW(fn, d){ const co = coX(fn, d); return x => atX(co, x, octOf(x), d); }

const relPer = (fn, P) => OCTS.map(k => { const xs = ptsIn(k); return rms(xs.map(x => P(x) - fn(x))) / (rms(xs.map(fn)) || 1); });

/* ── E1: J2's continuity ── */
say('## E1: continuity at the walls, jump at gaps 1e-6 and 1e-7');
let ke1 = [];
for (const name of ['selfSimilar', 'smooth', 'rocks']){
  for (const [h, make] of [['J2', holderJ2], ['B (control)', holderB]]){ const P = make(C[name]); const rows = [];
    for (const W of WALLS){ const w = 2 ** W, J = e => Math.abs(P(w * (1 - e)) - P(w * (1 + e))), a = J(1e-6), b = J(1e-7);
      const ok = (a < 1e-13 && b < 1e-13) || (b > 0 && a / b >= 5 && a / b <= 20); rows.push({ W, a, b, r: b > 0 ? a / b : Infinity, ok });
      if (h === 'J2' && b > 1e-12 && a / b < 5) ke1.push(`${name} wall 2^${W}`); }
    const bad = rows.filter(r => !r.ok);
    say(`${name}, ${h}: ratio J(1e-6)/J(1e-7) from ${fmt(Math.min(...rows.map(r => r.r)))} to ${fmt(Math.max(...rows.map(r => r.r)))}, largest J(1e-7) ${fmt(Math.max(...rows.map(r => r.b)))}; walls outside the predicted band: ${bad.length}`); } }
const e1 = ke1.length === 0;
say(`E1 ${e1 ? 'holds: J2 is continuous at every wall' : 'KE1 FIRES at ' + ke1.join(', ')}`);
if (e1){ // DEP-J's other measures for J2, known before this plan: reported, not claimed
  const B = { s: relPer(C.selfSimilar, holderB(C.selfSimilar)), m: relPer(C.smooth, holderB(C.smooth)) }, J = { s: relPer(C.selfSimilar, holderJ2(C.selfSimilar)), m: relPer(C.smooth, holderJ2(C.smooth)) };
  const worst = Math.max(...J.s.map((v, i) => v / B.s[i]), ...J.m.map((v, i) => v / B.m[i]));
  say(`  known before this plan (DEP-J's thresholds, not claimed as predictions): J-cost worst ratio to DEP-B ${fmt(worst)} (allowed 2), J-flat corner ${fmt((J.s[7] + J.s[8]) / 2)} worst outer ${fmt(Math.max(J.s[0], J.s[1], J.s[2], J.s[3], J.s[12], J.s[13], J.s[14], J.s[15]))}`); }

/* ── E2 ── */
say('\n## E2: the ends hypothesis');
// E2-a
{ const res = {}; let ka = [];
  for (const [nm, fn] of [['self-similar', C.selfSimilar], ['smooth', C.smooth]]){
    const b = relPer(fn, holderB(fn)), j = relPer(fn, holderJ2(fn)), w = relPer(fn, holderW(fn, 1 / 8)); res[nm] = { b, j, w };
    say(`${nm}: per octave (k: DEP-B / J2 / W)  ` + OCTS.map((k, i) => `${k}: ${fmt(b[i])} / ${fmt(j[i])} / ${fmt(w[i])}`).join('  '));
    OCTS.forEach((k, i) => { if (w[i] > 2 * j[i]) ka.push(`${nm} octave ${k}: W ${fmt(w[i] / j[i])}× J2`); if (w[i] > b[i] / 8) ka.push(`${nm} octave ${k}: W ${fmt(w[i] / b[i])} of DEP-B`); }); }
  say(`E2-a ${ka.length ? 'KE2a FIRES: ' + ka.slice(0, 6).join('; ') + (ka.length > 6 ? ` (and ${ka.length - 6} more)` : '') : 'holds: W within 2× of J2 and at most 1/8 of DEP-B in every octave'}`); }
// E2-b: DEP-B's octave 3, error along its own turn
{ const k = 3, fn = C.selfSimilar, P = holderB(fn), bins = Array.from({ length: 8 }, () => []);
  for (let i = 0; i < 2048; i++){ const u = (i + 0.5) / 2048 * PI, x = addrOf(fOf(Math.tan(u / 2)), k); bins[Math.floor(i / 256)].push(P(x) - fn(x)); }
  const br = bins.map(rms), mid = br.slice(1, 7).slice().sort((a, b) => a - b), med = (mid[2] + mid[3]) / 2, top = br.indexOf(Math.max(...br));
  const ok = (top === 0 || top === 7) && br[0] > 5 * med && br[7] > 5 * med;
  say(`E2-b: octave 3's error by eighth of its turn (home to horizon): ${br.map(fmt).join(', ')}; middle median ${fmt(med)}`);
  say(`E2-b ${ok ? 'holds: the error lives at the ends' : 'KE2b FIRES (largest in bin ' + top + '; ends ' + fmt(br[0] / med) + '× and ' + fmt(br[7] / med) + '× the middle)'}`); }
// E2-c: the dose
{ const fn = C.selfSimilar, ds = [1 / 32, 1 / 16, 1 / 8, 1 / 4], m = ds.map(d => { const r = relPer(fn, holderW(fn, d)); return r.reduce((s, v) => s + v, 0) / r.length; });
  const ok = m[0] > m[1] && m[1] > m[2];
  say(`E2-c: W's mean relative error at δ = 1/32, 1/16, 1/8 (and 1/4, not predicted): ${m.map(fmt).join(', ')}: ${ok ? 'holds' : 'KE2c FIRES'}`); }
// E2-d: the slope at the ends
{ const k = 3, g = u => C.selfSimilar(addrOf(fOf(u >= PI ? Infinity : Math.tan(u / 2)), k)), h = 1e-6, s0 = (g(h) - g(0)) / h, s1 = (g(PI) - g(PI - h)) / h;
  const ok = Math.abs(s0) > 0.1 && Math.abs(s1) > 0.1;
  say(`E2-d: the reading's slope in u at octave 3's home ${fmt(s0)} and horizon ${fmt(s1)}: ${ok ? 'holds (not flat: a kink in the even extension)' : 'KE2d FIRES'}`); }

import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./ends-run.txt', import.meta.url), out.join('\n') + '\n');
