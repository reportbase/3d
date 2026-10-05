# DEP-J results: the single run (5 October 2026)

`node bench/depth/joins.mjs`, under a second; output in `joins-run.txt`. Plan:
`JOINS-PLAN.md` (8623a99), committed before the code; code committed before its run.
Nothing below changes a prediction or a threshold.

## Verdicts

| | J1, shared walls | J2, overlap and blend |
|---|---|---|
| **J-meet** (jump below 10⁻¹²) | holds (0) | **KJ3 FIRES** (7.2 × 10⁻⁸): by the plan, J2's other verdicts are **void** in this run |
| **J-walls** (walls no longer the worst place, smooth) | **holds**: 1.2 × 10⁻³ near the walls, 1.3 × 10⁻³ elsewhere | void (1.5 × 10⁻⁵ near, 2.1 × 10⁻⁵ elsewhere) |
| **J-cost** (J1 within 1.5× of DEP-B's nesting, J2 within 2×) | **KJ2 KILLS**: 1.5× on the self-similar reading, up to **1.76×** on the smooth (octave 4) | void (0.04–0.12×: far below DEP-B's) |
| **J-flat** (outer within 2× of the corner) | **holds**: 1.5% in every octave | void (holds as measured) |
| **J-amp** | **holds**: 3.604 against 3.609 | void (3.17 against 3.65) |

## KJ3 fired on a fault in the plan, not in J2

The jump is measured as |P(w(1 − 10⁻⁹)) − P(w(1 + 10⁻⁹))|: two points 2 × 10⁻⁹ of the
wall's address apart. Any continuous presentation changes across that gap by its slope
times the gap. The self-similar reading turns through 8π per octave, so its slope alone
moves it by about 10⁻⁷ over the gap. J2's 7.2 × 10⁻⁸ is that, and nothing more. No
continuous join could have met 10⁻¹² by this measure. J1 shows exactly 0 only because,
that close to a wall, its place rounds onto the wall's own leaf on both sides.

The threshold was wrong when it was written. The plan also says what follows when KJ3
fires: J2's other verdicts are void for this run, and that stands. A new plan with a
measure of continuity that a continuous line can pass is needed to give J2 a verdict.
(One that can: the jump at gaps ε and ε/10 should fall tenfold, as a slope does, where a
real jump would not.)

## What the run shows, within that

**Shared walls join, and cost accuracy.** J1 meets at every wall, and its walls are no
longer the worst place. But laying leaves on the walls and on the corner (off the Tangent
Bridge's lattice) costs about half as much error again in every octave, more than the
plan allowed.

**J2's numbers (void as verdicts, recorded as observations).** On every reading and in
every octave, J2's error is 15–30× *below* DEP-B's nesting at the same budget: 0.06%
against 1.0% on the self-similar reading, 2 × 10⁻⁵ against 5 × 10⁻⁴ by the corner on the
smooth one. A join alone should not do that. The likely reason, not tested here: a
nested sweep's error is concentrated at its own two ends (its home and its horizon,
where its presentation runs past its last leaf), and widening each octave's sweep by an
eighth of an octave keeps the octave itself away from those ends. That is the same thing
that killed DEP-B's P1, where the top sweep failed at its edges. If it holds, it matters
more than the join: **each sweep should hold less than its full turn, and the octaves
should overlap**.

**Rocks (reported, not predicted).** The rocks sit at x = 2^i, exactly on the walls, so
the near-wall errors on that reading measure the rocks' peaks, not the joins. Shared
walls (J1) did worst on the far rocks (to 10% in octave 6); J2 and DEP-B were alike.

## Next, as new plans

1. **DEP-J2 again, with a continuity measure a continuous line can pass:** jump at
   gaps ε and ε/10, a tenfold fall predicted. Its other predictions as here.
2. **The ends hypothesis:** DEP-B's nesting with each octave read only over the middle of
   its sweep (widened, no blending), against DEP-B, at the same budget. Prediction: the
   error falls by a factor near J2's, so the gain is the ends, not the blend. Also: the
   error of one 64-leaf sweep measured by position along its own turn, rising toward
   home and horizon.
