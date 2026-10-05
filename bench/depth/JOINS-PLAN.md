# DEP-J: joins at the octave walls (after DEP-B's K3)

*Plan written 5 October 2026, before any code for it, and committed on its own. One run.
Kills recorded, not patched.*

DEP-B's K3 fired: held by nesting, the presented line jumps at an octave wall by twice
the error inside the octaves, because no leaf sits on a wall and each octave reaches its
walls by extrapolation (*Depth as Recursion* §5, open item 1). This plan tests two joins.
Setting, readings (self-similar, smooth, rocks), budget and measures are DEP-B's, unless
said here.

## The two joins

- **J1, shared walls.** Each octave's sweep is laid with leaves *on* its walls: 65
  leaves at θ = jπ/128, j = 0…64, home to horizon (the Chebyshev–Lobatto nodes in
  u = 2θ), presented by the matching (closed-node) cosine interpolant. A wall's leaf is
  the same address for the octaves either side, so they hold one value there.
  16 octaves of 64 steps share 15 inner walls: 1,025 leaves, one more than DEP-B.
  The leaves are still generated from the corner (halving from slope 1 five times gives
  the step π/128; stepping reaches every node), but this lay puts leaves on the walls and
  on the corner, which the Tangent Bridge's lattice never does: a format question, not
  only a measured one.
- **J2, overlap and blend.** The lattice is DEP-B's (64 leaves, odd places, none on a
  wall), but each octave's sweep spans its octave widened by δ = 1/8 octave at each wall,
  its place read as in DEP-B (proportional in v/h for octaves below the corner, in h/v
  above, kept on the octave's own side past the corner). Within 1/8 octave of a wall the
  two neighbours' presentations are blended with the smooth weight
  s ↦ 3s² − 2s³ across the 1/4-octave band; elsewhere one octave presents alone.
  Budget 1,024.

## Measures added to DEP-B's

- **Near the walls**: the largest absolute error within 1/16 octave of each of the 15
  inner walls (64 points at each), against the largest absolute error at the octaves'
  points farther than 1/16 octave from any wall.

## Predictions (written before the code)

- **J-meet (a check of the construction):** both joins meet at every wall; the jump
  (DEP-B's measure) is below 10⁻¹² on every reading.
- **J-walls:** on the smooth reading, for each join, the largest error near the walls
  is no larger than the largest error away from them: the walls are no longer the worst
  place. (DEP-B's nesting had them worst.)
- **J-cost:** on the self-similar and smooth readings, each join's error per octave
  stays within a factor of DEP-B's nesting: J1 within 1.5×, J2 within 2× (its leaves
  cover 1¼ octaves each).
- **J-flat:** both keep DEP-B's P4 for nesting: on the self-similar reading, the error
  in the outermost four octaves each side within 2× of the two corner octaves'.
- **J-amp:** amplification. J1's in every octave no larger than DEP-B's 64-leaf sweep
  (3.61); J2's no larger than 1.01 × 3.61 (a blend of two presentations whose weights sum
  to one cannot exceed the larger of the two).

## Kill conditions

- **KJ1:** a join whose walls are still the worst place on the smooth reading (kills
  J-walls for that join).
- **KJ2:** a join whose error in some octave exceeds its J-cost factor times DEP-B's
  (kills J-cost for that join).
- **KJ3:** J-meet fails (a jump above 10⁻¹²): the construction is wrong, and the run's
  other measures for that join are void.

## Not predicted, reported

- Which join has the lower error overall, octave by octave.
- The rocks reading, for both.

## Files

- `bench/depth/joins.mjs`, `node bench/depth/joins.mjs`; output `joins-run.txt`.
- `bench/depth/JOINS-RESULTS.md`, after the run.
