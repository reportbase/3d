# DEP-H results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/height.mjs`; output in `height-run.txt`. Plan: `H-PLAN.md`,
committed before the code; code committed before its run. Nothing below changes a
prediction or a threshold.

All checks of the code passed: both axes hold their own leaves (1.1 × 10⁻¹⁴), each holds
cos(7u) in its own basis (3.0 × 10⁻¹⁵), and `patternAt` is finite throughout.

## Verdicts (N_h = 48)

| | prediction | result |
|---|---|---|
| **H1** | on every smooth profile, flat's end-band error at most a tenth of dct's | **holds**: 5 of 5, from ~10⁻³ to ~10⁻¹⁵ |
| **H2** | on every smooth profile, flat's whole error below dct's | **holds**: 5 of 5 |
| **H3** | flat worse than dct on at least 5 of the 7 patterns | **KH3 FIRES**: worse on 4 (stones 1.23×, boards 2.36×, bark 1.13×, rough 1.26×), better on 3 (bricks 0.94×, shingles 0.99×, planks 0.87×) |

## The numbers

**Smooth profiles** (whole RMS error, dct → flat):

| N_h | range over the five profiles |
|---|---|
| 24 | 1.2–4.9 × 10⁻³ → 3 × 10⁻¹⁶ … 1.9 × 10⁻⁸ |
| 48 | 4.3 × 10⁻⁴ … 1.7 × 10⁻³ → ~10⁻¹⁵ |
| 96 | 1.5–6.0 × 10⁻⁴ → ~10⁻¹⁵ |

Flat holds every smooth profile to roundoff; dct's error is almost all at the ends,
just as DEP-F found.

**Patterns** (whole RMS error, flat ÷ dct):

| N_h | stones | bricks | shingles | planks | boards | bark | rough | flat worse on |
|---|---|---|---|---|---|---|---|---|
| 24 | 1.29 | 1.35 | 1.33 | 1.44 | 2.50 | 2.50 | 1.34 | 7 of 7 |
| 48 | 1.23 | 0.94 | 0.99 | 0.87 | 2.36 | 1.13 | 1.26 | 4 of 7 |
| 96 | 1.49 | 1.17 | 1.07 | 1.06 | 2.15 | 0.65 | 1.31 | 6 of 7 |

On patterns, flat's end bands are better (0.3–0.7× dct's in most) and its middle is
worse (1.3–2.5×). That is the trade the plan expected: leaves drawn to the ends leave
the middle coarser, and a pattern is uniform up the wall.

## The decision the plan set, and a fault in how it was written

The plan said: *"If H3 is killed (flat at least as good on patterns) and H2 holds, flat
… becomes the default for new parts."* Read by its kill condition (KH3: flat below or
equal to dct on 3 or more patterns), H3 is killed and H2 holds, so the rule as written
says adopt. Read by its own parenthesis (flat at least as good on patterns), it says the
opposite: flat is worse on 4 of 7 at N_h = 48, all 7 at 24, and 6 of 7 at 96. The two
halves of the sentence disagree, and the threshold was set too low for what it was
meant to protect.

This is a fault in the plan, recorded as such. The choice goes to the owner, not to
whichever reading suits. Nothing in the studio has been changed.

## What it means

- **Smooth sculpted content** (a bulge, a slope, a taper sculpted by hand, things with
  slope at the top and bottom) is held exactly by a flattened height axis, and badly at
  the ends by the present one.
- **Pattern detail**, which is most of what a scene's parts carry, is held better by the
  present uniform axis on most patterns, and at every leaf count but one.
- So neither axis is best for everything. A per-part choice would serve both: flat for
  hand-sculpted parts, dct for patterned ones. The studio already stores the kernel per
  part (`eng.hkernel`).
