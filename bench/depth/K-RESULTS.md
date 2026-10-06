# DEP-K results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/blend.mjs`; output in `blend-run.txt`. Plan: `K-PLAN.md`,
committed before the code; code committed before its run.

The first run crashed after six views (`blend-run-void.txt`): a widened node in an end
octave put sites past 2⁻⁸ or 2⁸, where the blended base had no octave to read. The base
now reads its end octave's widened sweep there (a7f202e). The crashed run had already
printed six views' predicted measures, K2's among them. The predictions were not
changed, and the counted run reproduces those six views exactly.

One check made after the run is in `blend-checks.mjs` / `blend-checks.txt`, labelled as
such.

All checks of the code passed:
1. every scoring point lies in its own octave;
2. the widened node maps held to 1.7 × 10⁻¹², with good weights;
3. the blended base holds a constant to 1.1 × 10⁻¹⁵;
4. A, B and F matched DEP-S.

## Verdicts

| | prediction | result |
|---|---|---|
| **K1** | K continuous at every wall and band edge, by DEP-E's measure | **KK1 fires on the measure**: 10 of 2,062 walls fall outside the 5–20 ratio. After the run, all 10 are continuous (below) |
| **K2** | K at most 2× C′ in at least 14 of 16 views | **KILLED**: above 2× in 8 views, up to 106× |
| **K3** | K below the best of A, B and F in at least 14 views | **holds**: 16 of 16 |

The code applies K1's kill wording (a jump is a ratio outside 5–20 *while* J(10⁻⁷) >
10⁻¹²), which is a little looser than the prediction's wording ("both below 10⁻¹²").
The 10 walls fail either way.

## K1: the seams are gone

| | largest step at a node wall (gap 10⁻⁹) |
|---|---|
| C′ (unblended) | up to **0.16** eye heights; 0.024–0.16 on every flying view |
| K (blended) | at most **1.2 × 10⁻⁶**: the slope times the gap |

**After the run (check, not a verdict):** at each of the 10 flagged walls, the jump as the
gap goes from 10⁻⁵ to 10⁻¹¹:
- At every one, it falls tenfold for each tenfold smaller gap from 10⁻⁸ down: a slope,
  not a step.
- At the larger gaps some fall a hundredfold a decade, which is P curved or nearly flat
  there, so the ratio left the 5–20 window.
- The reading's own step at those walls is 0 to 6 × 10⁻¹⁰.

This is the same family of fault as DEP-J's and DEP-F's jump measures: the test assumes
a sloped line. K is continuous everywhere tested.

## K2: blending as built here costs too much

| views | K against C′ |
|---|---|
| walking, smooth (0°, 45°, 135°, 180°, 225°) | **5–106× worse** (C′ 6 × 10⁻⁸ … 1.2 × 10⁻⁶; K 1.7 × 10⁻⁶ … 1.7 × 10⁻⁵) |
| walking 270° (already smooth, nodes at roundoff) | 1.1× |
| flying, five views | 1.0–2.6× |
| better than C′ | 3 views: walking 315° (0.35×), flying 180° (0.45×), where C′'s seams were the largest |

The median view error was K 1.1 × 10⁻³ against C′ 2.9 × 10⁻⁴.

**Why** (worked out after the run): a node tapers to zero across a band at each wall.
Inside a band it corrects only part of the residual, so there the error falls back
towards what lies beneath: the base's 8 leaves, or a coarser node. On smooth walking
views C′ reached 10⁻⁷ because its nodes corrected their whole regions; K leaves every
band at the coarser level's error. The taper buys continuity by giving up the node's own
accuracy over 2δ at each wall. Neighbouring nodes don't share the band (each tapers to
its parent, not to its sibling), so nothing else covers it.

## The scoring grid fix (reported)

C′ is DEP-C's C with the grid fixed. Its median view error is 2.9 × 10⁻⁴, against
DEP-C's 7.4 × 10⁻⁴, so the fix alone helped 2.5×. The largest single gain was flying 0°,
from 1.9 × 10⁻³ to 3.8 × 10⁻⁴. The wasted node outside the range cost more than it
looked.

## Where it stands

| | median view error | seams |
|---|---|---|
| A, B, F (fixed schemes) | 2.5–3.1 × 10⁻³ | none |
| **C′** (leaves by content) | **2.9 × 10⁻⁴** | up to 0.16 |
| **K** (by content, blended) | **1.1 × 10⁻³** | **none** |

K is the first holder that is both continuous and better than every fixed scheme
everywhere (K3, 16 of 16). C′ is about 4× more accurate but has seams.

## Next, as a new plan

**Siblings share the band.** Blend neighbouring nodes into each other, as the base octaves
do (J2: weights summing to one across a wall), instead of tapering each to its parent.
Where a node has no sibling across a wall, keep the taper. Prediction to set: continuous
as K, and within 2× of C′ in most views.
