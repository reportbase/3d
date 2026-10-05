# DEP-P results: the single run (5 October 2026)

`node bench/depth/p.mjs`, 12 s; output in `p-run.txt`. Plan: `P-PLAN.md` (3976410),
committed before the code; code committed before its run. Nothing below changes a
prediction or a threshold. One check made after the run is in `p-checks.mjs` /
`p-checks.txt`, labelled as such: it is not a verdict.

## Verdicts

| | prediction | result |
|---|---|---|
| **P3** (check of the code) | doubling: 10⁻¹² on one side of the corner | **holds**: 0 (1.9 across the corner, recorded) |
| **P5, run 1** (check of the code) | no octave above 1.01× the 64-leaf sweep's 3.61 | **holds**: 3.17 in every octave |
| **P1** (T-F) | the top below 1% everywhere on the smooth reading; no child entered above 1% | **holds**: the top's worst is 3.5 × 10⁻¹⁴; nothing entered at all. 256 leaves did the work of DEP-B's 1,024. This is near a test by construction, as the plan cautioned |
| **P2** (T-F) | burst octaves entered first; no other octave deeper | **KP2 FIRES** on the second clause. The first held: octave 3 (0.91), then −5 (0.87). But octave −7 went two levels deep |
| **P5, run 2** (T-F) | every path at most 1.02× the sum | **holds**: worst 6.65 against the sum 8.09 |

Known before the plan and rerun: P4, F flat at 0.6–1.5 × 10⁻¹⁴ in all 16 octaves; K3 by
DEP-E's measure, continuous at all 15 walls (ratio 10.000, roundoff at 2^±4).

## What killed P2: the rule, not the depth (after-run check)

Octave −7's three grandchildren entered at "residuals" of 26, 15 and 1.1 times the
reading. They all sit at a ≈ 2⁻⁸ = 0.0039, the very end of the range, where the reading
(a slow sine through zero there) has an RMS of 10⁻⁴. The rule ranks candidates by
*relative* residual, so a small absolute error over a near-zero reading outranks real
detail. DEP-B's rule had the same flaw. It didn't show there because larger errors always
came first; with F holding most of the line to 10⁻¹⁴, the flaw decides the entries.

## A second finding: a top that can't hold a burst spills over the whole range

The T-F top alone, on the burst reading, leaves an absolute error of 0.5–1.7 × 10⁻²
in **every** octave (0.95–0.99 in the two burst octaves themselves). 256 leaves over 16
octaves can't hold 8 cycles an octave. The interpolant through point samples of a burst
it can't resolve rings across the whole sweep. Children then repair only the octaves
they enter, and after the budget most of the line is left at about 1%:

| final relative error, burst reading | mean | octaves left near 1% |
|---|---|---|
| DEP-B (raw-address top, §3's map) | 1.0 × 10⁻² | most |
| T-a + F (raw-address top, flattened children) | 3.9 × 10⁻³ | octaves −4 … 1 |
| T-F + F (flattened top and children) | 6.6 × 10⁻³ | −7, −3 … −1, 5 … 8 |

Every octave a flattened child entered came out at 10⁻¹⁴–10⁻¹⁵. The remaining error
lives only where nothing was entered: the top's spill.

## Rocks (things of one size, reported, not predicted)

| | mean absolute error | where it's worst |
|---|---|---|
| DEP-B | 0.020 | octaves 2–6 (0.03–0.09) |
| T-a + F | **0.011** | octaves 2–3 (0.05–0.09) |
| T-F + F | 0.027 | octaves 0–2, 4 (0.04–0.17) |

The flattened children help: 0.020 → 0.011 with the same top. The exponent top doesn't.
A rock has one size in the address, so reading the top in the exponent spends its leaves
evenly over octaves, and a near octave gets as many leaves as a far one, where the
raw-address top had concentrated them around the corner. This is the caution the plan
wrote down: T-F's P1 says nothing about fixed-size things, and on them it loses.

## What it shows

1. **The flattened map is a clean win wherever it holds a stretch by itself.** Every
   octave entered by a flattened child, on every reading, came out at roundoff. On every
   reading the children's map was the only difference between DEP-B and T-a + F, and it
   cut error 2–3×. That supports adopting it in §3.
2. **The top level is the open problem now, not the joins or the ends.** Neither top is
   right for every content: the exponent top suits content that scales with distance,
   and the raw-address top suits things of one size. More importantly, a top fed point
   samples of detail it can't hold spreads that failure everywhere.
3. **The busiest-stretch rule needs an absolute measure** (or one relative to the
   whole reading's size, not each stretch's), or it chases zeros.

## Next, as new plans

1. **The top holds cell averages, not point samples.** This is the TVF forward map the
   studio's surface detail already uses (`makeDetail`): each leaf takes the reading
   averaged over its own cell, so what the top can't resolve averages away instead of
   ringing, and is left whole for the children. Prediction to test: the spill falls by
   orders of magnitude, and P2 holds with an absolute rule.
2. **Content not chosen by us:** depth read from rendered studio scenes (the harbour
   village from two heights), held by T-a + F and by the forward-map top.
