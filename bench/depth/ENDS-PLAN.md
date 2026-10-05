# DEP-E: J2's continuity, and where a nested sweep's error lives

*Plan written 5 October 2026, after DEP-J's run and before any code for this one, and
committed on its own. One run. Kills recorded, not patched.*

Setting, readings, budget and holders are DEP-B's and DEP-J's unless said here.

## E1: J2's continuity, with a measure a continuous line can pass

DEP-J's J-meet measured the jump across a gap of 2 × 10⁻⁹ of the wall's address against
10⁻¹², which no continuous line with a slope can meet; KJ3 fired and voided J2's other
verdicts. E1 decides continuity only.

- **Measure.** At each of the 15 inner walls w and on each reading, the jump
  J(ε) = |P(w(1 − ε)) − P(w(1 + ε))| at ε = 10⁻⁶ and at ε = 10⁻⁷.
- **E1 (prediction):** J2 is continuous: at every wall, either J(10⁻⁶)/J(10⁻⁷) lies
  between 5 and 20 (the jump falls with the gap, as a slope does), or both are below
  10⁻¹³.
- **Kill KE1:** a wall where J(10⁻⁷) > 10⁻¹² and J(10⁻⁶)/J(10⁻⁷) < 5 (a jump that does not
  fall with the gap).
- **Not a blind test of the rest.** J2's other numbers (J-walls, J-cost, J-flat, J-amp)
  were seen in DEP-J's run before this plan was written; the bench is deterministic, so
  they will come out the same. If E1 holds they are reported under DEP-J's thresholds,
  marked as known before the plan, and are not claimed as predictions confirmed.
- As a control the same measure is taken on DEP-B's nesting, which DEP-B found jumping:
  there the ratio should stay near 1 (no prediction; reported).

## E2: the ends hypothesis

**Hypothesis.** A nested sweep's error is concentrated at its own two ends, home and
horizon, and J2's gain over DEP-B (15–30× in DEP-J) came from keeping each octave away
from them, not from blending. A plausible mechanism, written down before testing: the
open-axis presentation is a cosine series in the sweep's angle u, so it acts on the
reading's even extension past u = 0 and u = π; a reading that is smooth in u but still
sloped at an end has a kink in that extension, and the error of a kink is largest at the
kink and decays away from it.

**Holder W (widened, no blend).** Each octave held by its own 64-leaf sweep over the
octave widened by δ at each wall (J2's per-octave sweep), but every address presented by
its own octave alone: no blending, so W is not continuous at the walls (that is not
measured here). Budget 1,024, as DEP-B.

**Predictions (written before the code):**

- **E2-a (the gain is the ends).** At δ = 1/8, W's relative error per octave (self-similar
  and smooth readings) is within 2× of J2's in every octave, and at most 1/8 of DEP-B's
  in every octave.
- **E2-b (the error lives at the ends).** For DEP-B's octave 3 on the self-similar reading,
  sampled at 2,048 points even in the sweep's angle u and binned into 8 equal bins of u:
  the largest bin-RMS error is in one of the two end bins, and both end bins exceed 5×
  the median of the six middle bins.
- **E2-c (a dose).** W's mean relative error over the 16 octaves on the self-similar
  reading falls as δ grows: δ = 1/32 > 1/16 > 1/8. (δ = 1/4, leaves over 1½ octaves, is
  reported without a prediction.)
- **E2-d (the mechanism).** The reading's slope in u at the two ends of octave 3's
  sweep is not zero (larger than 0.1 in magnitude, per radian of u), on the self-similar
  reading.

**Kills.**
- **KE2a:** W's error above 2× J2's in some octave, or above 1/8 of DEP-B's in some octave
  (the gain is not the ends alone).
- **KE2b:** the largest bin is a middle bin, or an end bin below 5× the middle median
  (the error does not live at the ends).
- **KE2c:** the error does not fall from δ = 1/32 to 1/16 to 1/8.
- **KE2d:** the slope at an end below 0.1 (no kink to explain it).

## Files

- `bench/depth/ends.mjs`, `node bench/depth/ends.mjs`; output `ends-run.txt`.
- `bench/depth/ENDS-RESULTS.md`, after the run.
