# DEP-B results: the single run (5 October 2026)

`node bench/depth/bench.mjs`, 8 s; full output in `run.txt`. Plan: `PLAN.md`, committed
before the bench (af839b5); bench committed before its run. Nothing below changes a
prediction or a threshold; kills are kills.

## A deviation from the plan, recorded first

The plan required the generated leaves to agree with the tangent to 10⁻¹². They agree to
**2.5 × 10⁻¹²** (the stepping accumulates near the horizon). The bench printed "the run
stops here" and then did not stop: a bug in the bench, not caught by the machinery check.
The run below is on that lattice. Every error it reports is 10⁻⁵ or larger, so the
difference does not move a verdict, but the gate was missed and is recorded as missed.
TB §11.1 reports 3 × 10⁻¹⁵ for the same construction; the gap is open (the order of the
steps, or where the lattice is checked).

## Verdicts

| | prediction | result |
|---|---|---|
| **P3** | doubling the scale shifts the top octave only; the levels below unchanged, to 10⁻¹², on one side of the corner | **holds**: 0 difference on one side. Across the corner the place is read the other way and the leaf values differ by up to 2.0 (recorded, as planned) |
| **P4, B's part** | B's outer-octave error within 2× of its corner error (K1) | **holds**: 1.0% in every one of the 16 octaves, corner and outermost alike |
| **P4, A's part** | A's error grows 1.5–3× per octave out | **not as predicted**: it grows about **10×** per octave (8 × 10⁻⁵ at the corner, 2.8% five octaves out, 28% six out, then lost) |
| **P5, run 1** | B's amplification that of one 64-leaf sweep, not compounded (K2 above 1.01×) | **K2 does not fire**: 3.46 in every octave against the sweep's 3.61 (the octave's 256 points miss the sweep's worst point, so "within 1%" is not met on the low side; nothing compounds) |
| **K3, the walls** | on the smooth reading, no wall jump larger than the neighbouring octaves' largest error | **K3 FIRES**: a jump of 3.1 × 10⁻³ at the wall ½, against 1.4 × 10⁻³ inside the octaves beside it |
| **P1** (run 2) | smooth content held at the top: top's error below 1% everywhere, no child entered above 1% | **KILLED**: the top sweep's error is 33% in the two outermost octaves; eight children entered above 1% |
| **P2** (run 2) | the burst octaves (3, −5) entered first and deepest | **KILLED** on its first clause: octave −5, then its own grandchild, then octave 4, then octave 3. Its second clause held: no octave without the burst went deeper |
| **P5** (run 2) | amplification along a path additive, within 1.02 × the sum | **holds**: worst path 3.53 against the sum 8.09 (the product would be 16.2); below the sum, not merely at it |

## What it shows

**The main claim holds in this setting.** Held by nesting, the reading's error is flat
across sixteen octaves (1.0% everywhere on the self-similar reading); held by one sweep
of the same 1,024 leaves, it is excellent at the corner and lost six octaves out. This is
SIT's result again, now with the presentation (the Tangent Bridge, open-axis form) rather
than depth addresses, and on the reading a scene's reader takes: things on the ground
near and far.

**One sweep falls off faster than predicted:** about tenfold per octave on oscillating
content, not twofold. The twofold figure is the leaf count halving per octave; the error
of resolving oscillation with too few leaves falls much faster than the leaf count, so
once the grain thins it is lost within an octave or two.

**The trade is real, and runs both ways.** One sweep beats nesting by a factor of 100
or more at the two octaves by the corner (8 × 10⁻⁵ against 1%), and on the smooth
reading over the two or three octaves either side of the corner. On the self-similar
reading nesting wins from the fifth octave out; on the smooth one from the fourth. For a
scene: one sweep spends its leaves on the middle distance, nesting spends them evenly
over every distance.

**The walls are the open problem (K3).** No leaf sits on a wall, so each octave's
presentation reaches its wall by extrapolation, and the two sides do not meet: the jump
is twice the error inside the octaves. As the plan says, this makes the nesting
unusable as it stands for a continuous presentation and sends the question back to
*Depth as Recursion* §5, open item 1 (joins). The studio's octave levels (step 1) do not
meet this: they blend two prefixes of one cascade, and never put two holders side by side.

**Smooth is not smooth on the sweep (P1).** A swell slow in log a (one cycle over sixteen
octaves) is not slow in the sweep's own angle near its two ends, where an octave occupies
an ever thinner sliver of the turn. A 256-leaf top sweep holds it to 10⁻⁵ by the corner
and to 33% at the edges. So the rule entered children for the edges first, before any
real detail.

**The busiest-stretch rule is blind to which busyness is detail (P2).** It found the
burst in octave −5 at once, then went deeper there, then into octave 4 (whose residual
was larger than octave 3's: 0.30 against 0.25; probably the top sweep's attempt at octave
3's burst spilling into its neighbour, which this run did not check), and only then
octave 3. It did not send any other
octave deeper than the bursts, but it did not enter them first.

## Cautions

- One setting: a reader above a line, one presentation (open-axis), one budget. A run
  on the shape library (LIB), or with the closed-turn kernel at the top, may differ.
- The plan's choices (a)–(c) are this bench's, made where §6 left them open; DBR, which
  supersedes §6 in detail, was not available.
- B's flat 1.0% on content 1 is partly by construction: self-similar content maps to the
  same values in every octave on one side (that is P3). Content 3 (rocks of one size) is
  the check that is not: there both holders lose the far rocks together (from octave 3
  out, 3–6% absolute), since a rock of fixed size shrinks against every octave alike.
- The gate on the lattice was missed (above).

## Next, if wanted (each a new plan)

1. **Joins.** Give each octave's sweep an overlap with its neighbours (or a leaf at
   each wall) and blend across the wall; predict the jump falls below the in-octave error.
2. **Two-tier holder.** One sweep for the octaves by the corner, nesting beyond: predict
   it beats both holders everywhere at the same budget.
3. **P1/P2 again** with the top's error measured in the sweep's angle, not in log a, and
   an entry rule that discounts what the top cannot hold at its edges.
