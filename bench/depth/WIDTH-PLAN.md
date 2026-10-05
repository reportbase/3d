# DEP-W: the best overlap width

*Plan written 5 October 2026, after DEP-E's run and before any code for this one, and
committed on its own. One run. Kills recorded, not patched.*

DEP-E found a nested sweep's error at its two ends, and that widening each octave's
sweep past its walls (W, and blended, J2) cuts the error about 18×; but its E2-c was
killed: at four widths the error was least at δ = 1/16 octave and rose again at 1/8.
This plan measures the curve finely. Setting, readings, budget (1,024 leaves, 16 octaves
of 64) and holders W and J2 are DEP-E's.

## What was seen before this plan

At δ = 1/32, 1/16, 1/8, 1/4, W's mean relative error on the self-similar reading was
9.6, 3.0, 5.5 and 4.9 × 10⁻⁴. Those four values will come out the same here; they are
not evidence for what follows.

## The run

δ = 2^(e) for e = −6, −5⅞, …, −2 (33 widths, from 1/64 to 1/4 octave, eighth-steps in
log₂ δ), for W and J2, on the self-similar and smooth readings; mean relative error over
the 16 octaves at each. The rocks reading is reported, not predicted.

## Predictions (written before the code)

- **W1 (where the best width is).** On the self-similar reading, the width with the least
  mean error lies within a factor √2 of 1/16 (e between −4.5 and −3.5), for W and for J2.
- **W2 (one valley).** On the self-similar reading the curve has one minimum: the mean
  error falls (or holds within 5%) at every step from 1/64 up to the best width, and rises
  (or holds within 5%) at every step from it to 1/4, for W and for J2.
- **W3 (the blend is cheap).** At every width and on both readings, J2's mean error is
  within 1.5× of W's.
- **W4 (the smooth reading prefers wider).** On the smooth reading, the best width is at
  least as wide as on the self-similar reading, for W. (Slow content loses less by
  spreading its leaves, so the trade should move outward.)

## Kills

- **KW1:** the best self-similar width outside [2^−4.5, 2^−3.5], for W or J2.
- **KW2:** a second valley: a step against the trend by more than 5%, on either side of
  the best width, for W or J2.
- **KW3:** J2 above 1.5× W at some width on either reading.
- **KW4:** W's best smooth width narrower than its best self-similar width.

## Files

- `bench/depth/width.mjs`, `node bench/depth/width.mjs`; output `width-run.txt`.
- `bench/depth/WIDTH-RESULTS.md`, after the run.
