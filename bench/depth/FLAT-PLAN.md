# DEP-F: flattened ends, and the phase test of DEP-W's hypothesis

*Plan written 5 October 2026, after DEP-W's run and before any code for this one, and
committed on its own. One run. Kills recorded, not patched.*

## Why

DEP-E found a nested sweep's error at its own two ends, where the reading is still
sloped and the open-axis presentation's even extension has a kink. *Depth as Recursion*
§3 (as `nest.py` runs it) lays each octave's walls on its inner sweep's home and horizon,
so every octave's weakest points sit on the joins. DEP-W's hypothesis (worked out after
its curve): the best overlap width is wherever the reading happens to be flat at the
sweep's ends, cos(2πm(δ + φ)) = 0 for a reading of m cycles per octave at phase φ, so
overlap's gain depends on the reading.

**The flattened map.** §3 reads the place f as a sweep by ρ = 2f (f ≤ ½), 1/(2(1 − f))
beyond. Proposed instead: **f = ρ² / (1 + ρ²)**, that is ρ = √(f / (1 − f)). It keeps what
the rulings name:
- home (ρ = 0) and horizon (ρ = ∞) on the walls;
- the corner (ρ = 1) at the middle (f = ½);
- the swap fair: ρ ↦ 1/ρ gives f ↦ 1 − f (R162);
- the Tangent Bridge's lattice and leaves, unchanged.

It changes only the shape between. In the sweep's angle u = 2 arctan ρ it is
f = sin²(u/2), whose slope sin(u)/2 vanishes at both ends. Then any smooth reading has
zero slope in u at home and horizon, and its even extension no kink. The map is algebraic
(no trigonometry). It is a change to §3's construction, made on the owner's instruction
to test "whatever works best"; adopting it would be his ruling.

## Holders (1,024 leaves each)

- **B**: DEP-B's nesting (§3's map), 16 octaves of 64.
- **J**: DEP-J's overlap and blend at δ = 1/16 (its best width on DEP-W's reading).
- **F**: nesting with the flattened map; walls on home and horizon; no overlap, no blend.

## Readings

The self-similar family sin(2π m (log₂ a + φ)) for m = 3, 4, 5 cycles per octave and
φ = 0, 1/32, 1/16, 3/32 (12 readings), and DEP-B's smooth reading. Error: mean relative
error over the 16 octaves, as DEP-W.

## Predictions (written before the code)

- **F1 (the frequency test of the hypothesis).** For W (widened, no blend), the first
  valley of the error against width (δ from 1/64 to 1/4 in eighth-steps of log₂ δ) lies
  within an eighth-step of the first δ > 0 with cos(2πmδ) = 0, at phase φ = 0: δ = 1/12
  for m = 3 and δ = 1/20 for m = 5. (Corrected before commit from DEP-W's suggestion of a
  phase test: a widened sweep's two ends sit at k − 1 − δ and k + δ, so a phase moves
  their flat points oppositely, and for φ ≠ 0 no width flattens both; at φ = 0 the two ends
  agree and the prediction is clean.)
- **F2 (flattening works).** On every one of the 13 readings, F's error is at most 1/5
  of B's.
- **F3 (flattening does not depend on the reading's phase).** For each m, F's error over
  the four phases varies by less than 1.5× (largest over smallest), while J's varies by
  more than 3×.
- **F4 (the ends are no longer the worst).** On the m = 4, φ = 0 reading, octave 3 binned
  by eighths of its sweep's turn (as DEP-E's E2-b): F's two end bins are each below 3× the
  median of its six middle bins.
- **F5 (the walls).** On the smooth reading, F's largest jump at a wall (DEP-B's measure)
  is no larger than F's largest error inside the octaves next to it (K3 does not fire).

## Not predicted, reported

- F against J on each reading: which is lower. (F has no overlap and no blend; J has
  both.)
- The rocks reading.

## Kills

- **KF1:** a first valley more than an eighth-step from the predicted width, for m = 3 or 5 (kills the hypothesis).
- **KF2:** a reading where F's error is above 1/5 of B's.
- **KF3:** F's phase spread at or above 1.5×, or J's at or below 3×, for some m.
- **KF4:** an end bin of F at or above 3× its middle median.
- **KF5:** K3 fires for F.

## Files

- `bench/depth/flat.mjs`, `node bench/depth/flat.mjs`; output `flat-run.txt`.
- `bench/depth/FLAT-RESULTS.md`, after the run.
