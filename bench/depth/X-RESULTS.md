# DEP-X results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/edges.mjs`; output in `edges-run.txt`. Plan: `X-PLAN.md`,
committed before the code; code committed before its run.

The first run crashed in the first view's seam measure: `wallsOfChain`, from DEP-R's
file, was left out of the copy. That was after the checks of the code (all passed) and
before any view's results were printed. It is kept as `edges-run-void.txt`; the fix is
7e96a74. Predictions unchanged. Nothing below changes a prediction or a threshold.

All checks of the code passed:
1. the edge finder found a step at 3.70000000000005, and called a tanh ramp 10⁻³ wide a
   steep slope;
2. a split sweep holds a step to 1.1 × 10⁻¹⁵;
3. with no edge, X is C′ exactly (2.3 × 10⁻⁷ both);
4. A, B and F matched DEP-S.

## Verdicts

| | prediction | result |
|---|---|---|
| **X1** | X's largest seam at most 1/10 of C′'s in at least 80% of the views with edges | **holds, at the threshold**: 8 of 10. The two that missed are walking 90° (0.11×) and flying 225° (0.18×) |
| **X2** | at least 90% of edges kept within 1% | **holds**: 37 of 37 (C′: 0 of 37) |
| **X3** | X below C′ in at least 80% of the views with edges | **holds**: 10 of 10 |
| **X4** | X below the best of A, B and F in every view | **holds**: 16 of 16 |

## The numbers

| | A | F | C′ | **X** |
|---|---|---|---|---|
| median view error, all 16 | 3.1e-3 | 2.5e-3 | 2.9e-4 | **1.5e-5** |
| median, the 10 views with edges | — | — | 1.7e-3 | **6.1e-5** |
| median largest seam, those 10 | — | — | 0.036 | **1.1e-3** |
| edges kept within 1% | — | — | 0 of 37 | **37 of 37** |

**View by view, on the views with edges:**
- **Walking:** 315° fell from 2.1 × 10⁻⁴ to 7.5 × 10⁻⁹, with its seam from 1.9 × 10⁻³ to
  2.5 × 10⁻⁸. 90° fell 8×.
- **Flying:** 16× to 105× better, with largest seams from 0.024–0.160 down to 6.8 × 10⁻⁵ … 6.9
  × 10⁻³.
- The six walking views without an edge are unchanged: X is C′ there, as check 3 requires.

**The edges.** Every candidate found was a true discontinuity: 37 edges, no steep
slopes. They run from 0.048 to 1.85 eye heights: an occluding roof against the field
beyond, the island's edge against open sea. Each was kept as an edge, to within 1%. C′
smeared all 37.

## What it shows

1. **The seams were the edges.** With a wall at each edge, every piece is smooth inside,
   its sweep holds it closely to its ends, and the ringing that made C′'s seams is gone.
   DEP-R's after-run diagnosis was right.
2. **It is also the largest accuracy gain in the series:** 20× on the median over C′,
   which was itself 10× over the fixed schemes. The leaves that used to ring now hold
   detail.
3. **The scaffold is unchanged.** Octaves, ρ-octaves and the rule by content are all as
   before. An edge is one more wall in the recursion, a node's region split where the
   scene splits.

## What is still open

- **Remaining seams of up to 6.9 × 10⁻³** (flying 225°) at walls where the reading is
  continuous. With no edges left inside, they must come from something else: a kink
  (a slope that changes suddenly, as where a roof meets a wall), or detail too fine
  for the leaves. Not checked.
- **X is still not continuous at its walls.** It only has small steps there. A blend
  could now be cheap, because both sides are accurate at the wall, which wasn't true
  for K or N.
- **Kinks.** The same idea one order up, walls at slope discontinuities, would be the
  natural next test.
- **One scene.** A second scene, or the wider one proposed in DEP-S, should be held the
  same way before this is trusted.
