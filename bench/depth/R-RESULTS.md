# DEP-R results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/seams.mjs`; output in `seams-run.txt`. Plan: `R-PLAN.md`,
committed before the code; code committed before its run. Nothing below changes a
prediction or a threshold. One check made after the run is in `seams-checks.mjs` /
`seams-checks.txt`, labelled as such.

All checks of the code passed:
1. with the seam term at 0, C″'s nodes are C′'s;
2. a step is measured as defined (1.0000000000000517);
3. A, B and F matched DEP-S.

## Verdicts

| | prediction | result |
|---|---|---|
| **R1** | C″'s largest step at most a quarter of C′'s in at least 12 views | **KILLED**: above a quarter in 14. It fell by 2–6× only in three flying views (90°, 135°, 180°), and was unchanged (ratio 1.000) in nine |
| **R2** | C″ within 1.5× of C′ in at least 12 views | **holds**: 15 of 16 (flying 0° at 1.50×) |
| **R3** | C″ below the best of A, B and F in all 16 | **holds** |

Medians: C′ 2.9 × 10⁻⁴, C″ 3.9 × 10⁻⁴; largest step C′ 0.013, C″ 7.6 × 10⁻³. The reading's
own step at every one of those walls is about 10⁻⁹: the reading is continuous there.

## Where the seams are (after-run check)

The largest step in three views, and what holds each side:

| view | step | wall | below | above |
|---|---|---|---|---|
| flying 0° | 0.079 | 8.000 (octave wall) | [3]: presents −0.922 where the reading is −1.000 | [4]: −1.000, exact |
| walking 315° | 1.9 × 10⁻³ | 18.44 | [5, 0, −1] | [5, 0, 0] |
| flying 270° | 0.026 | 10.31 | [4, 0, 1]: exact | [4, 0, 2]: 0.322 where the reading is 0.303 |

**The plan's premise was wrong.** It took seams to be where an entered node meets a region
held only by the base. In fact the worst seams sit between two entered nodes, both
sides held. The step is one node's own error at its own end. In flying 0°, octave 3 has
a jump inside it (the edge of the island), and its sweep rings, worst at its ends:
DEP-E's finding that a sweep's error gathers at its ends. A wall with both sides
entered is no candidate's wall, so the seam term can't reach it. Where it did help (the
three flying views), the largest step had been at a wall with an unentered neighbour.

There is a second gap. A ρ-octave node never reaches its octave's walls: ρ-octaves run
2⁻⁶ … 2⁷, and the last one ends at f = 1 − 1/(1 + 128²), short of the wall. So no child
can sharpen a node right at its octave wall. That is where the flying 0° seam is.

## What it means

Every seam found is a node's error at its end, made by a jump somewhere inside its
region. Three ways of dealing with walls have now been tried:
- blending them (K, N, N_ψ): this costs accuracy, because the fits overlap;
- presenting each node past them (the idea DEP-Q proposed): it can't work, because a
  cosine series continues as cosh;
- spending leaves at them (C″): mostly it can't reach them.

None removes the cause. The cause is that the walls are placed by the scaffold, in fixed
octaves and ρ-octaves, while the reading's jumps fall wherever the scene puts them. A
region with a jump inside it rings out to its ends.

## Next, as a new plan

**Walls at the edges.** Let the reading's jumps decide where some walls go. A region that
holds a jump is split at the jump, and each side is held by its own sweep. Each piece is
then smooth inside, so its sweep holds it closely to its ends. A step at that wall is
the reading's own edge, drawn as an edge, not a seam. The octave scaffold stays: a split
is one more level of the recursion, a node whose wall is the jump. Prediction to set:
seams (steps where the reading is continuous) fall to the level of the smooth walking
views, 10⁻⁵ to 10⁻⁴, and the view error falls too.
