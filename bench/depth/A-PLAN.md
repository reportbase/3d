# DEP-A: a top that holds cell averages, and an absolute entry rule

*Plan written 5 October 2026, after DEP-P's run and before any code for this one, and
committed on its own. One run. Kills recorded, not patched.*

## Why

DEP-P left two faults, both outside the flattened map:
1. **The top rings.** A 256-leaf top fed point samples of a burst it can't resolve
   (8 cycles an octave) leaves 0.5–1.7 × 10⁻² of absolute error in every octave.
2. **The entry rule chases zeros.** It ranks a stretch by its residual relative to the
   reading *in that stretch*, so where the reading passes near zero (a ≈ 2⁻⁸) a
   10⁻⁴ residual outranks real detail. That's what fired KP2.

## The two changes

**Cell averages (the TVF forward map).** Each of the top's leaves takes the reading
averaged over its own cell, as the studio's `makeDetail` does. The cell is even in the
sweep's angle: leaf j sits at u_j = (2j + 1)π/(2n), its cell is [jπ/n, (j + 1)π/n]. The
top presents the **histopolant**: the cosine series of degree below n whose cell
averages are those values. Averaging scales cos(mu)'s cell averages by
σ_m = sin(mπ/2n)/(mπ/2n), so the histopolant is the ordinary interpolant of the averages
with coefficient m divided by σ_m (σ_m ≥ 2/π below n, so this is stable). It reproduces
any cosine of degree below n exactly, as point interpolation does. What it changes is
what folds back from above n: a mode at c cycles per cell comes in damped by about
sinc(c). Averages are taken in u by adaptive Gauss–Kronrod (15 points, starting from
64 pieces a cell, to 10⁻¹⁴), because a rock 0.05 wide can sit in a cell 25 wide. Only
the top changes. Children and grandchildren stay as DEP-P's (flattened, point leaves),
which held every octave they entered to roundoff.

**The absolute rule.** A candidate's residual is its RMS over the stretch divided by the
reading's RMS over the **whole range** (one number per reading), not over the stretch.
The stopping rule stays 10⁻⁹, on this measure.

## What I expect, worked out before the code

After the run DEP-P I told the owner the averaging should cut the spill "by orders of
magnitude". The arithmetic says less. In the T-F top's middle there are about ten leaves
an octave, so the burst runs about 0.8 cycles a cell, and sinc(0.8) ≈ 0.23: a factor of
about 4. The burst's slope also breaks at its octave walls, and a broken slope folds back
roughly as 1/m² whatever the leaf does. So the prediction below is a factor of 3, not
orders of magnitude.

## Configurations (each on both tops, T-a and T-F)

- **P·rel:** point top, relative rule: DEP-P's run, repeated for comparison.
- **P·abs:** point top, absolute rule: the rule's change alone.
- **A·abs:** averaged top, absolute rule: both changes. **The predictions are about this one.**
- **T·abs** (reported, not predicted): the top averaged by a triangle two cells wide
  (box ∗ box, σ_m²), absolute rule.

## Checks of the code (not predictions)

- The histopolant of a reading equal to cos(37u), on each top, reproduces it to 10⁻¹²;
  the same for cos(255u).
- The adaptive average of one of DEP-B's rocks over a cell 25 wide agrees with the
  Gaussian's closed form to 10⁻¹².

If a check fails, the run's numbers are printed but no verdict stands.

## Predictions (written before the code)

- **A1 (the rule).** With P·abs on the burst reading, the first two entries are octaves 3
  and −5, and no octave without the burst reaches a deeper level than either, on both
  tops (DEP-P's P2, with the absolute rule).
- **A2 (the spill).** The top alone on the burst reading: the median absolute error over
  the 14 octaves without the burst is at least 3× lower for A·abs than for a point top,
  on both tops.
- **A3 (together).** A·abs on the burst reading: P2 holds as in A1, and after the
  budget the mean relative error over the 16 octaves is at least 3× below DEP-P's for the
  same top (T-a + F: 3.9 × 10⁻³; T-F + F: 6.6 × 10⁻³).
- **A4 (nothing lost).** A·abs's T-F top alone holds the smooth reading below 10⁻¹² in
  every octave, as DEP-P's point top did (3.5 × 10⁻¹⁴).

## Kills

- **KA1:** a first or second entry that isn't a burst octave, or an octave without the
  burst entered deeper than a burst octave, under P·abs, on either top.
- **KA2:** a spill ratio below 3 on either top.
- **KA3:** KA1's condition under A·abs, or a final mean error not 3× below DEP-P's, on
  either top.
- **KA4:** A·abs's T-F top at or above 10⁻¹² in some octave on the smooth reading.

## Reported, not predicted

- T·abs: the spill and the final errors, as A2 and A3.
- The rocks reading under every configuration: entries, leaves used, mean absolute error.
- Entries and depths for every configuration.

## Files

- `bench/depth/avg.mjs`, `node bench/depth/avg.mjs`; output `avg-run.txt`.
- `bench/depth/A-RESULTS.md`, after the run.

## Amendments before the counted run (5 October 2026)

Two runs stopped in the checks of the code, before any predicted measure was printed;
their output is kept (`avg-run-void.txt`, `avg-run-void2.txt`). The predictions and
kills above are unchanged. What changed:

1. **Code faults, fixed** (7606bab): the triangle average was halved, and the
   integrator's tolerance could fall below roundoff and recurse without end.
2. **The histopolant check gets cos(mu) directly.** As written, the averaging read
   cos(m · u(x(u))), a round trip through the line and back. On T-F that round trip
   carries about 4 × 10⁻¹² of noise into cos(255u) near u = 0. That tests the round
   trip, not the method, and it stalled the integrator. The readings themselves never
   take that round trip: they're evaluated at x directly.
3. **The check's bar is 10⁻¹¹, not 10⁻¹².** Even given directly, cos(255u) near u = π
   carries about 10⁻¹³ of roundoff, and recovering mode 255 amplifies it by up to
   Λ/σ₂₅₅ ≈ 4.5 × 1.57 ≈ 7. The 10⁻¹² bar was unreachable for that mode (run 2 saw
   1.8 × 10⁻¹²). The rock check keeps 10⁻¹².
4. **The integrator also stops at the integrand's own noise** (an error estimate near
   roundoff that only halves when the piece halves), and at depth 20.
