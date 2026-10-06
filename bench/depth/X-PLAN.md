# DEP-X: walls at the scene's edges

*Plan written 6 October 2026, after DEP-R's run and before any code for this one, and
committed on its own. One counted run. Kills recorded, not patched.*

## Why

DEP-R's after-run check found where C′'s seams come from. Each is one sweep's own error
at its end, ringing from a jump in the reading somewhere inside its region. That is
the Gibbs effect, and DEP-E's finding that a sweep's error gathers at its ends.
Blending (K, N, N_ψ), continuing past walls (refuted in R-PLAN), and placing leaves by
seams (C″) all treat the wall. The cause is the jump inside the region: the scaffold's
walls are fixed, and the scene's edges fall anywhere. This plan moves walls to the
edges.

## Edges

- **Candidates:** found on the scoring grid (DEP-K's, 4,096 points a quarter step in).
  Wherever two neighbouring points differ by more than 0.05, the jump between them is
  located by bisection in log a, with the reader, to a bracket 10⁻¹³ wide.
- **An edge:** a candidate whose bracket still differs by more than 0.01 at that width.
  That is a true discontinuity in what the ray meets (an occluding edge), not a steep
  slope. Candidates that close up are reported as steep slopes, and not used.
- **The cost:** as in DEP-C, reading costs nothing here and the budget is the leaves
  kept. Finding an edge takes about 45 reads.

## The holder X

X is C′ (C with the fixed grid: base 8, 14 nodes of 64, exact regions, the rule by
squared residual on the scoring grid) with one change.
- **Splitting:** every sweep, base octave or node, whose region holds one or more edges
  is split at them. Each piece gets its own flattened sweep over the piece, in the
  region's own variable, with the same corner convention as the region (v/h below the
  corner, h/v above).
- **Leaves:** a sweep of n leaves split into p pieces gives each piece n / 2^⌈log₂ p⌉
  leaves. That keeps the generated lattice's power of two; leaves are never added and
  some may go unused.
- **Fitting:** pieces are fit like whole nodes, each on its own piece only.
- **The rule:** C′'s, on X's presentation.

## Measures

- **View error:** as every bench.
- **Seams:** at every base octave wall and every entered node's walls, except within 10⁻⁶
  (relative) of an edge, the presented step minus the reading's step,
  |(P(w⁻) − P(w⁺)) − (f(w⁻) − f(w⁺))| at a gap of 10⁻⁹. The reading is continuous at these
  walls, so this is the seam.
- **Edges kept:** at every edge, the same quantity, against the reading's step there. A
  holder that smears an edge scores the whole step.

## Checks of the code (not predictions)

1. **The edge finder:** on a reading that steps from 0 to 1 at a = 3.7, it finds one edge
   within 10⁻¹² of 3.7, and reports a steep ramp (tanh((a − 5)/10⁻³)) as a steep slope, not
   an edge.
2. **A split sweep holds a step:** that step at 3.7, held by X's base alone, is
   reproduced to 10⁻¹² at all 4,096 measurement points.
3. **No edge, no change:** in the first view (no jump in DEP-S), the edge finder finds
   none, and X's nodes and view error are C′'s.
4. **A, B and F on the first view** are DEP-S's, as printed.

If a check fails, no verdict stands.

## Predictions (written before the code)

On the views where edges are found (DEP-S had 10 views with a jump):
- **X1 (seams gone):** X's largest seam is at most 1/10 of C′'s, in at least 80% of
  those views.
- **X2 (edges kept):** at 90% or more of all edges found, X's presented step is within 1%
  of the reading's.
- **X3 (more accurate):** X's view error is below C′'s in at least 80% of those views.

On all 16:
- **X4 (still the best):** X is below the lowest of A, B and F in every view.

## Kills

- **KX1:** X's largest seam above 1/10 of C′'s in more than 20% of the views with edges.
- **KX2:** fewer than 90% of edges kept within 1%.
- **KX3:** X not below C′ in more than 20% of the views with edges.
- **KX4:** a view where X is not below the best of A, B and F.

## Reported, not predicted

- Edges and steep slopes found per view, with the size of each.
- Each view's errors for A, B, F, C′ and X; the largest seam and the edges-kept measure,
  for C′ and X.
- X's nodes.

## Files

- `bench/depth/edges.mjs`, `node bench/depth/edges.mjs` (as DEP-S, with `LIBS_DIR` when the
  CDNs are blocked); output `edges-run.txt`.
- `bench/depth/X-RESULTS.md`, after the run.
