# DEP-E results: the single run (5 October 2026)

`node bench/depth/ends.mjs`; output in `ends-run.txt`. Plan: `ENDS-PLAN.md` (4a23d43),
committed before the code; code committed before its run. Nothing below changes a
prediction or a threshold.

## Verdicts

| | prediction | result |
|---|---|---|
| **E1** | J2 continuous: the jump falls with the gap (ratio 5–20) at every wall | **holds**: exactly 10.000 at all 15 walls on all three readings. DEP-B's control: 1.000 at every wall (a real jump, which does not fall) |
| **E2-a** | the gain is the ends: W (widened, no blend) within 2× of J2, and at most 1/8 of DEP-B, in every octave | **holds**: W 5.5 × 10⁻⁴ against J2's 5–6 × 10⁻⁴ and DEP-B's 1.0 × 10⁻² on the self-similar reading; alike on the smooth |
| **E2-b** | the error lives at the ends of a sweep's turn | **holds**: by eighths of octave 3's turn, home to horizon, 9.3 × 10⁻³, then 7 × 10⁻⁵ … 2.8 × 10⁻⁴ in the middle (median 9 × 10⁻⁵), then 1.9 × 10⁻² at the horizon: the end eighths hold 100–200× the middle's error |
| **E2-c** | the error falls as the widening grows, 1/32 > 1/16 > 1/8 | **KILLED**: 9.6 × 10⁻⁴, 3.0 × 10⁻⁴, then **5.5 × 10⁻⁴** (and 4.9 × 10⁻⁴ at 1/4, not predicted) |
| **E2-d** | the mechanism: the reading still sloped at the sweep's ends | **holds**: slope 4.5 at home and 9.1 at the horizon, per radian of the sweep's angle |

J2's other numbers from DEP-J (J-cost 0.12× DEP-B, J-flat 5.0 against 6.4 × 10⁻⁴) were
known before this plan and are not claimed as predictions confirmed. With E1 holding,
they stand as measured under DEP-J's thresholds.

## What it shows

**Where a nested sweep's error lives.** Not along the sweep, but at its two ends. The
open-axis presentation is a cosine series in the sweep's own angle, so it presents the
reading's even extension past home and horizon. Where the reading is still sloped at an
end (here 4.5 and 9.1 per radian), the extension has a kink, and the error gathers at
the kink. In octave 3 the two end eighths of the turn carry 100–200× the error of the
middle six.

**So the gain in DEP-J was the ends, not the join.** Read each octave only over the
middle of a sweep that reaches past it, and the error falls about 18× (1.0% to 0.055%)
at the same 1,024 leaves, blended or not. The blend then adds continuity at the walls
(E1) at no cost in accuracy.

**But there is a best width, and it is narrow (E2-c).** Widening keeps the octave off
the ends, and also spreads the same 64 leaves over more of the line. The two pull
against each other: the error was least at 1/16 octave (3.0 × 10⁻⁴) and higher at 1/8
and 1/4. The plan's prediction of a steady fall was wrong.

## For the format and the studio (proposals, not results)

- **The ends are the weak point of any open sweep**, not only a nested one. A sweep's
  home and horizon are where its presentation is worst whenever the content is still
  changing there. That is also what killed DEP-B's P1 (the top sweep's edges).
- **Two remedies suggest themselves, as plans for Tom to choose between:**
  1. *Overlap*: each octave's sweep reaches about 1/16 octave past its walls, with
     neighbours blended (J2, at the best width). Keeps the Tangent Bridge's lattice.
  2. *Flatten the ends*: lay the place within the octave so the reading's slope in
     the sweep's angle vanishes at home and horizon (a different map from f to ρ than
     nest.py's), removing the kink instead of avoiding it. This changes the nesting
     construction of *Depth as Recursion* §3, so it is a ruling, not a tuning.
- **The studio's rungs may share the weakness.** Its height kernel is a DCT, the same
  open-axis form, so a part's top and bottom rings are where its cascade would be
  least exact when the surface is still sloped there. Not tested here.

## Next, as new plans

1. **The best width**, finely: W and J2 at δ from 1/64 to 1/4 in eighth-steps of an
   octave's log, the minimum's place predicted near 1/16.
2. **Flattened ends**, if Tom rules for it: a place map with zero slope at the walls,
   against nest.py's, at the same budget, with E2-b's binning to show the end error gone.
