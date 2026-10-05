# DEP-W results: the single run (5 October 2026)

`node bench/depth/width.mjs`, 2 s; output in `width-run.txt`. Plan: `WIDTH-PLAN.md`,
committed before the code; code committed before its run. Nothing below changes a
prediction or a threshold.

## Verdicts

| | prediction | result |
|---|---|---|
| **W1** | the best self-similar width within √2 of 1/16, for W and J2 | **holds**: both at 2^−4.125 (about 1/17 octave), 3.0 × 10⁻⁴ |
| **W2** | one valley | **KILLED**, for W and J2: past the first minimum the error rises to 5.7 × 10⁻⁴ at 2^−3.125 and falls again into a second valley at 2^−2.375 (3.6 × 10⁻⁴), steps of 8–14% against the trend |
| **W3** | J2 within 1.5× of W at every width | **holds**: at most 1.10× |
| **W4** | the smooth reading's best width at least as wide as the self-similar's | **holds**: 2^−2.625 against 2^−4.125, on a broad floor (8.6–9.4 × 10⁻⁶ from 2^−3 to 2^−2) |

At its best width J2's error is 3.0 × 10⁻⁴ on the self-similar reading, 34× below DEP-B's
nesting at the same 1,024 leaves, and 9.0 × 10⁻⁶ on the smooth one, 20× below.

## What it shows, and a hypothesis it raises

**The second valley is where the reading is flat at the sweep's ends, again.** The
self-similar reading is sin(8π log₂ a). A sweep widened by δ ends at log₂ a = k − 1 − δ
and k + δ, where the reading's slope goes as cos(8πδ). That is zero at δ = 1/16 and again
at 3/16 (log₂ δ = −4 and −2.415): the two valleys, at −4.125 and −2.375. The best width
is then not a property of the holder at all, but of where this reading happens to have
no slope. That is DEP-E's mechanism (the kink at the sweep's ends) seen a second way.

**This was worked out after seeing the curve**, so it is a hypothesis, not a result.
A plan that could kill it: shift the self-similar reading's phase by 1/32 octave
(sin(8π(log₂ a + 1/32))) and predict that both valleys move to δ = 1/32 and 5/32, and
that a reading with 3 cycles per octave puts them at 1/12 and 1/4.

**What it means for a format.** If the hypothesis holds, no single overlap width is
best: the width that suits one reading is wrong for another, and the gain from
widening is partly luck of phase. The remedy that would not depend on the reading is
the other one DEP-E named: lay the place within each octave so that *any* reading's
slope in the sweep's angle vanishes at home and horizon (flattened ends), which removes
the kink for every reading at once. That changes the nesting construction of *Depth as
Recursion* §3, so it is Tom's ruling to make.

**What holds regardless.** Overlap with blending works at every width tried: continuous
(DEP-E's E1), cheap (W3), and better than DEP-B's nesting by 10–34× across the whole
range from 1/64 to 1/4 octave on the self-similar reading, and 2–20× on the smooth.

**The rocks** (reported, not predicted) jump erratically from width to width
(0.15–1.17), since rocks of fixed size at x = 2^i land at different places in the
sweeps as the width changes. Nothing is read into them.

## Next, as new plans

1. **The phase test** above, to kill or keep the hypothesis.
2. **Flattened ends**, if Tom rules for it, against the best overlap, on readings of
   several phases and frequencies: the prediction would be that it beats overlap at
   every phase, where overlap's best width moves.
