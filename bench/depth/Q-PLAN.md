# DEP-Q: blends smooth to every order

*Plan written 6 October 2026, after DEP-N's run and before any code for this one, and
committed on its own. One counted run. Kills recorded, not patched.*

## Why

DEP-N's N (C′'s nodes, siblings sharing the band, lone walls tapering outward) was
seamless but no more accurate than K: 1.3 × 10⁻³ median against C′'s 2.9 × 10⁻⁴, and
10–64× worse than C′ on the smooth walking views, where C′ reached 10⁻⁷.

A hypothesis came out of DEP-N's after-run check. A wall there showed a jump in
curvature at a band's edge (J(ε) ∝ ε²). The smoothstep 3t² − 2t³ is only C¹: its second
derivative jumps at both ends of every band. Each level's weighted nodes then hand the
next a residual with curvature jumps, and cosine nodes hold those only algebraically.

This plan tests that hypothesis and nothing else.

## The holders

Both are N with **one change from DEP-N**, made to fix its fault:
- **The fault fix:** the base's octaves are laid over spans widened by 2δ, the same reach
  as the nodes. In DEP-N an end-octave node tapered outward past where the base reached,
  and gave NaN.

The two holders then differ only in the blend:
- **N_s:** the smoothstep s(t) = 3t² − 2t³, as DEP-N.
- **N_ψ:** ψ(t) = e^(−1/t) / (e^(−1/t) + e^(−1/(1−t))) on (0, 1), with 0 below and 1 above.
  It is smooth to every order, and ψ(t) + ψ(1 − t) = 1, so sibling pairs still sum to one.

Everything else is N's:
- the base: 8 leaves an octave, blended across a band of 2δ at each octave wall, δ = 1/16;
- C′'s 14 nodes, assembled by level;
- siblings blended across 2δ centred on the shared wall;
- lone walls tapered outward over 2δ.

ψ is used everywhere the smoothstep was: the base's bands, sibling bands and lone tapers.

**A risk, written down before the run:** ψ is steeper in the middle than the smoothstep.
Its derivatives grow quickly with their order. A band of 2δ = 1/8 octave holds only about
six of a node's leaves. A C∞ weight that changes over six leaves may still not be
resolved spectrally, and C∞ (not analytic) only promises faster than any power, not
geometric. So N_ψ may help less than the hypothesis hopes.

## The run

DEP-S's 16 views, unchanged. A, B and F are recomputed (they come out as DEP-S's), and
so are C′ (as DEP-K/N), N_s and N_ψ.

## Checks of the code (not predictions)

1. **The blend:** ψ(t) + ψ(1 − t) = 1 to 10⁻¹⁵ at 1,001 points of [0, 1]. ψ lies in [0, 1].
   ψ(0) = 0 and ψ(1) = 1.
2. **A constant is held:** a reading of 1 is presented as 1 to 10⁻¹² by N_s and by N_ψ,
   with nodes [3], [4], [3, 1], [3, 2] and [3, 1, 0].
3. **The base reaches every node:** the base is finite at every site of nodes [−7] and [8],
   with both walls lone.
4. **N's nodes are C′'s,** in order, on the first view.
5. **A, B and F on the first view** are DEP-S's as printed.

If a check fails, no verdict stands.

## Predictions (written before the code)

- **Q1 (the hypothesis):** on the five smooth walking views (0°, 45°, 135°, 180°, 225°),
  N_ψ's view error is at most a third of N_s's, in every one.
- **Q2 (close to C′):** N_ψ's view error is at most 2× C′'s in at least 12 of the 16 views.
- **Q3 (no seams):** N_ψ is continuous at every base wall, node wall and band edge, in all
  16 views, by DEP-N's measure (J(10⁻⁹)/J(10⁻¹⁰) in 5–20, or J(10⁻¹⁰) ≤ 10⁻¹³).
- **Q4 (still the best):** N_ψ is below the lowest of A, B and F in all 16 views.

## Kills

- **KQ1:** a smooth walking view where N_ψ is above a third of N_s. That kills the
  hypothesis: the blend's smoothness is not what costs.
- **KQ2:** N_ψ above 2× C′ in five views or more.
- **KQ3:** a wall where J(10⁻⁹)/J(10⁻¹⁰) is outside 5–20 while J(10⁻¹⁰) > 10⁻¹³.
- **KQ4:** a view where N_ψ is not below the best of A, B and F.

## Reported, not predicted

- Every view's errors for A, B, F, C′, N_s and N_ψ, and the ratios N_ψ/N_s and N_ψ/C′.
- The largest step at a gap of 10⁻⁹ for C′, N_s and N_ψ.
- The flagged walls' J(ε) from 10⁻⁶ to 10⁻¹², whenever KQ3 fires. A ψ wall should show
  odd powers only.

## Files

- `bench/depth/smooth.mjs`, `node bench/depth/smooth.mjs` (as DEP-S, with `LIBS_DIR` when the
  CDNs are blocked); output `smooth-run.txt`.
- `bench/depth/Q-RESULTS.md`, after the run.
