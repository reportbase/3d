# DEP-C results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/content.mjs`; output in `content-run.txt`. Plan: `C-PLAN.md`,
committed before the code; code committed before its run. Nothing below changes a
prediction or a threshold.

All four checks of the code passed:
1. the base alone gave DEP-F's 8-leaf figure (1.2115 against 1.212);
2. the node maps held to 1.9 × 10⁻¹²;
3. a node reproduced cos(5u) to 2.6 × 10⁻¹⁴;
4. A, B and F on the first view matched DEP-S as printed.

## Verdicts

| | prediction | result |
|---|---|---|
| **C1** | C below F in at least 12 of 16 views | **holds**: 16 of 16 |
| **C2** | C below the best of A, B, F in at least 10 views | **holds**: 16 of 16 |
| **C3** | in every view with a jump, a ρ-octave node holds one | **holds**: all 10 |
| **C4** | in at least 8 of 10 jump views, C's near-jump error at most half F's | **holds**: 9 of 10 (not at 30 m, 180°: 0.62 against 0.88) |

## The numbers

| | A | B | F | **C** |
|---|---|---|---|---|
| median view error, all 16 | 3.1e-3 | 2.9e-3 | 2.5e-3 | **7.4e-4** |
| walking, no jump (6 views) | 4.8e-6 … 2.2e-5 | 3.1e-5 … 1.1e-4 | 8.5e-9 … 7.5e-5 | **7.6e-9 … 8.9e-7** |
| walking, one jump (2) | 5.8e-4, 6.9e-4 | 5.3e-4, 3.7e-4 | 5.9e-4, 4.4e-4 | **4.7e-5, 2.1e-4** |
| flying, all with jumps (8) | 5.6e-3 … 0.034 | 5.2e-3 … 0.014 | 4.5e-3 … 0.016 | **1.3e-3 … 7.3e-3** |

The median C/F is 0.16. Near the jumps, C's squared error is 4–270× below F's (0.71×
in the one exception). The base size barely matters: with 4, 8 or 16 leaves an octave,
C's view errors agree within about 20% in every view.

**Where the leaves went.**
- **Walking:** almost all of them into the one or two octaves where the street and its
  houses are. View 0° spent 12 of its 14 nodes inside octave 2 and its ρ-octaves.
- **Flying:** first the octave holding the village edge (octave 3, 4 or 5), then the
  ρ-octave holding the worst jump, then the next octaves.
- In the view whose reading was already smooth (270°), C spread its nodes over octaves
  at residuals of 10⁻¹³, nothing left to fix.

## The flaw the plan warned of: steps at node walls

A node holds its region and presents nothing outside it, so the presented reading steps
wherever a node's residual hasn't reached zero at its wall.

| views | largest step at a node wall | the reading's own step there |
|---|---|---|
| walking, no jump | 6.7 × 10⁻⁵ to 3.7 × 10⁻⁴ | about 10⁻⁹ (continuous) |
| walking, with a jump | 1.8 to 1.9 × 10⁻³ | about 10⁻⁹ (continuous) |
| flying | 0.035 to 0.16 | about 10⁻⁹ (continuous) |

These steps are counted in C's error, which is still the lowest. But C makes edges where
the scene has none. In a picture they would be seams, and at 0.16 eye heights they
would show. The fix is DEP-J's: let a node's sweep reach a little past its walls and
blend. Neither is here, and the next plan should test that.

## A fault found after the run

The scoring grid's first point in each octave sits exactly on the octave's lower wall,
2^(k−1), and `octOf` counts it in the octave below. For octave −7 that is octave −8,
outside the 16. So in six walking views (0°, 45°, 135°, 180°, 225°, 270°) the rule
entered a node [−8]: 64 leaves holding addresses no measurement reads. This can only have
cost C, and the verdicts stand as measured. A correct grid would start each octave half
a step in (that's the measurement grid's offset, so the scoring grid wants a different
one).

## What it means

1. **Leaves by content beat every fixed scheme on a real scene,** at the same 1,024 kept
   leaves. That's 3–4× on the median, and 10–100× on the walking views without a jump.
   That is the answer to DEP-S: the octave scaffold is right; the even split was wrong.
2. **The scaffold earns its place here:** the rule worked in octaves and ρ-octaves, nested
   two levels deep, which is depth as recursion doing what the theory says. A region is
   always an octave of an octave, so any node's position is the same few small integers.
3. **The budget is storage, not observation.** C read about 9,000 rays per view to keep
   1,024 leaves. For the studio and TVF that's the right trade. A reader that must
   pay per ray would need a different rule.
4. **Seams are the open problem now:** blending at node walls.

## Next, as new plans

1. **Blended node walls:** each node's sweep reaches a fixed fraction past its region,
   blended with its neighbours as in DEP-J/E's J2. Same 16 views. Predictions to set: the
   wall steps fall to the reading's own (continuous), at a cost in view error below 2×.
2. **The fixed scoring grid,** in the same run.
3. **A wider scene** (near detail and far mountains), with C, to see whether the scaffold's
   range matters on real content.
