// DEP-J: joins at the octave walls. The plan, with its predictions and kills, is
// JOINS-PLAN.md, committed before this file. One run: `node bench/depth/joins.mjs`.
// The leaves, presentation and nesting below are DEP-B's (bench.mjs), copied unchanged.

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
const out = []; const say = s => { out.push(s); console.log(s); };
const fmt = x => x === 0 ? '0' : Math.abs(x) >= 0.01 && Math.abs(x) < 1000 ? x.toFixed(3) : x.toExponential(1);
const sm = s => { s = Math.max(0, Math.min(1, s)); return s * s * (3 - 2 * s); };

/* ── DEP-B's nesting, again, to compare against ── */
const S64 = sweep(64);
const leafAddrsB = k => S64.t.map(r => addrOf(fOf(r), k));
function holderB(fn){ const co = new Map(OCTS.map(k => [k, S64.coef(leafAddrsB(k).map(fn))]));
  return x => { const k = octOf(x); return S64.evalU(co.get(k), 2 * Math.atan(rhoOf(placeIn(x, k)))); }; }
const ampB = x => { const k = octOf(x); return S64.card(2 * Math.atan(rhoOf(placeIn(x, k)))).reduce((s, v) => s + Math.abs(v), 0); };

/* ── J1: shared walls. 65 leaves at θ = jπ/128, home and horizon included ── */
// slopes generated from the corner: halve slope 1 five times for the step π/128, then step both ways
const N1 = 64; let st = 1; for (let i = 0; i < 5; i++) st = halve(st);
const lob = new Array(N1 + 1); lob[32] = 1;
for (let j = 33; j < N1; j++) lob[j] = (lob[j - 1] + st) / (1 - lob[j - 1] * st);
for (let j = 31; j > 0; j--) lob[j] = (lob[j + 1] - st) / (1 + lob[j + 1] * st);
lob[0] = 0; lob[N1] = Infinity;                                   // home and the mathematical horizon: the octave's walls
const xLob = lob.map((_, j) => Math.cos(j * PI / N1)), wLob = lob.map((_, j) => (j % 2 ? -1 : 1) * (j === 0 || j === N1 ? 0.5 : 1));
function lobCard(uq){ const x = Math.cos(uq), w = xLob.map((xj, j) => Math.abs(x - xj) < 1e-15 ? null : wLob[j] / (x - xj));
  const hit = w.indexOf(null); if (hit >= 0) return w.map((_, j) => j === hit ? 1 : 0);
  const d = w.reduce((s, v) => s + v, 0); return w.map(v => v / d); }
const leafAddrsJ1 = k => lob.map(r => addrOf(fOf(r), k));
function holderJ1(fn){ const vals = new Map(OCTS.map(k => [k, leafAddrsJ1(k).map(fn)]));
  return x => { const k = octOf(x), c = lobCard(2 * Math.atan(rhoOf(placeIn(x, k)))), v = vals.get(k); let s = 0; for (let j = 0; j <= N1; j++) s += c[j] * v[j]; return s; }; }
const ampJ1 = x => { const k = octOf(x); return lobCard(2 * Math.atan(rhoOf(placeIn(x, k)))).reduce((s, v) => s + Math.abs(v), 0); };

/* ── J2: overlap and blend. DEP-B's 64-leaf lattice over each octave widened by 1/8 at each wall ── */
const DL = 1 / 8;
function placeX(a, k){ const lo = 2 ** (k - 1 - DL), hi = 2 ** (k + DL), below = 2 ** k <= 1;   // read on the octave's own side
  return below ? (a - lo) / (hi - lo) : (1 / lo - 1 / a) / (1 / lo - 1 / hi); }
function addrX(f, k){ const lo = 2 ** (k - 1 - DL), hi = 2 ** (k + DL), below = 2 ** k <= 1;
  return below ? lo + f * (hi - lo) : 1 / (1 / lo - f * (1 / lo - 1 / hi)); }
const leafAddrsJ2 = k => S64.t.map(r => addrX(fOf(r), k));
// which octaves present at x, with what weight: one alone, or two across a wall's band
function blendAt(x){ const L = log2(x), W = Math.round(L);
  if (Math.abs(L - W) < DL && W > -8 && W < 8){ const s = sm((L - W + DL) / (2 * DL)); return [[W, 1 - s], [W + 1, s]]; }
  return [[octOf(x), 1]]; }
function holderJ2(fn){ const co = new Map(OCTS.map(k => [k, S64.coef(leafAddrsJ2(k).map(fn))]));
  return x => blendAt(x).reduce((s, [k, w]) => s + w * S64.evalU(co.get(k), 2 * Math.atan(rhoOf(placeX(x, k)))), 0); }
const ampJ2 = x => blendAt(x).reduce((s, [k, w]) => s + w * S64.card(2 * Math.atan(rhoOf(placeX(x, k)))).reduce((q, v) => q + Math.abs(v), 0), 0);

const HOLD = { B: holderB, J1: holderJ1, J2: holderJ2 }, AMP = { B: ampB, J1: ampJ1, J2: ampJ2 };
const WALLS = []; for (let w = -7; w <= 7; w++) WALLS.push(w);
const nearPts = W => Array.from({ length: 64 }, (_, i) => 2 ** (W - 1 / 16 + (i + 0.5) / 64 * (1 / 8)));
const away = k => ptsIn(k).filter(x => WALLS.every(W => Math.abs(log2(x) - W) > 1 / 16));

/* ── 0. the J1 lattice, against the tangent (recorded, not a gate) ── */
{ let worst = 0; for (let j = 1; j < N1; j++){ const ref = Math.tan(j * PI / 128); worst = Math.max(worst, Math.abs(lob[j] - ref) / ref); }
  say(`J1's leaves generated from the corner: worst relative difference from the tangent ${worst.toExponential(1)}; ${16 * 65 - 15} leaves in all (shared walls counted once)`); }

const R = {};
for (const name of ['selfSimilar', 'smooth', 'rocks']){ R[name] = {};
  for (const h of ['B', 'J1', 'J2']){ const P = HOLD[h](C[name]);
    const per = OCTS.map(k => { const xs = ptsIn(k), e = xs.map(x => P(x) - C[name](x)); return { rel: rms(e) / (rms(xs.map(C[name])) || 1), abs: rms(e) }; });
    let jump = 0; for (const W of WALLS){ const w = 2 ** W; jump = Math.max(jump, Math.abs(P(w * (1 - 1e-9)) - P(w * (1 + 1e-9)))); }
    let near = 0; for (const W of WALLS) for (const x of nearPts(W)) near = Math.max(near, Math.abs(P(x) - C[name](x)));
    let far = 0; for (const k of OCTS) for (const x of away(k)) far = Math.max(far, Math.abs(P(x) - C[name](x)));
    R[name][h] = { per, jump, near, far }; }
  say(`\n${name}: per octave (k: B / J1 / J2)${name === 'rocks' ? ', absolute RMS' : ', relative RMS'}`);
  say(OCTS.map((k, i) => { const g = h => name === 'rocks' ? R[name][h].per[i].abs : R[name][h].per[i].rel; return `${k}: ${fmt(g('B'))} / ${fmt(g('J1'))} / ${fmt(g('J2'))}`; }).join('   '));
  say(`  jump at the walls (largest): B ${fmt(R[name].B.jump)}, J1 ${fmt(R[name].J1.jump)}, J2 ${fmt(R[name].J2.jump)}`);
  say(`  largest error within 1/16 octave of a wall / elsewhere: B ${fmt(R[name].B.near)} / ${fmt(R[name].B.far)}, J1 ${fmt(R[name].J1.near)} / ${fmt(R[name].J1.far)}, J2 ${fmt(R[name].J2.near)} / ${fmt(R[name].J2.far)}`); }

say('\n## Verdicts');
const dense = Array.from({ length: 4096 }, (_, i) => (i + 0.5) / 4096 * PI), L64 = Math.max(...dense.map(u => S64.card(u).reduce((s, x) => s + Math.abs(x), 0)));
for (const h of ['J1', 'J2']){
  const meet = Math.max(...['selfSimilar', 'smooth', 'rocks'].map(n => R[n][h].jump)), kj3 = meet > 1e-12;
  say(`\n${h}: J-meet, worst jump ${fmt(meet)} (below 1e-12 predicted): ${kj3 ? 'KJ3 FIRES, the construction is wrong; the rest for this join is void' : 'holds'}`);
  const sw = R.smooth[h], kj1 = sw.near > sw.far;
  say(`  J-walls (smooth): near the walls ${fmt(sw.near)}, elsewhere ${fmt(sw.far)}: ${kj1 ? 'KJ1 KILLS J-walls' : 'holds'}`);
  const factor = h === 'J1' ? 1.5 : 2; let worst = { r: 0 };
  for (const n of ['selfSimilar', 'smooth']) OCTS.forEach((k, i) => { const r = R[n][h].per[i].rel / R[n].B.per[i].rel; if (r > worst.r) worst = { r, n, k }; });
  say(`  J-cost: worst ratio to DEP-B's nesting ${fmt(worst.r)} (${worst.n}, octave ${worst.k}) against ${factor}: ${worst.r > factor ? 'KJ2 KILLS J-cost' : 'holds'}`);
  const at = k => OCTS.indexOf(k), P = R.selfSimilar[h].per, corner = (P[at(0)].rel + P[at(1)].rel) / 2, outer = Math.max(...[-7, -6, -5, -4, 5, 6, 7, 8].map(k => P[at(k)].rel));
  say(`  J-flat: corner ${fmt(corner)}, worst outer ${fmt(outer)}: ${outer <= 2 * corner ? 'holds' : 'KILLED'}`);
  const amp = Math.max(...OCTS.flatMap(k => ptsIn(k).concat(WALLS.flatMap(nearPts)).map(AMP[h]))), lim = h === 'J1' ? L64 : 1.01 * L64;
  say(`  J-amp: largest ${fmt(amp)} against ${fmt(lim)}: ${amp <= lim ? 'holds' : 'KILLED'}`); }
{ let j1 = 0, j2 = 0; for (const n of ['selfSimilar', 'smooth']) OCTS.forEach((k, i) => { if (R[n].J1.per[i].rel < R[n].J2.per[i].rel) j1++; else j2++; });
  say(`\nNot predicted: of the 32 octave-readings (self-similar and smooth), J1 has the lower error in ${j1}, J2 in ${j2}.`); }

import { writeFileSync } from 'node:fs';
writeFileSync(new URL('./joins-run.txt', import.meta.url), out.join('\n') + '\n');
