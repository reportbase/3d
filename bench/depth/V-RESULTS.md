# DEP-V results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/valley.mjs`; output in `valley-run.txt`. Plan: `V-PLAN.md` and
the scene `valley.json`, committed before the code and before any of the scene's depth
was read; code committed before its run. Nothing below changes a prediction or a
threshold. One check made after the run is in `valley-checks.mjs` / `valley-checks.txt`,
labelled as such.

All checks of the code passed:
1. the edge finder;
2. split sweeps;
3. A, B and F matched DEP-S on the harbour's first view;
4. the viewer stands on the ground in all 16 views.

## Verdicts

| | prediction | result |
|---|---|---|
| **V1** | X's largest seam at most 1/10 of C′'s in at least 80% of the views with edges | **KILLED**: 8 of 15 |
| **V2** | at least 90% of edges kept within 1% | **KILLED**: 41 of 52 (79%). C′: 0 of 52 |
| **V3** | X below C′ in at least 80% of the views with edges | **holds**: 15 of 15 |
| **V4** | X below the best of A, B and F in every view | **holds**: 16 of 16 |
| **V5** | F below A in at least 10 of 16 views | **holds**: 16 of 16 |

## The numbers

| | A | B | F | C′ | **X** |
|---|---|---|---|---|---|
| median view error | 0.034 | 9.5e-3 | 0.011 | 4.2e-3 | **8.1e-5** |
| median largest seam, views with edges | — | — | — | 0.021 | **2.0e-3** |
| edges kept within 1% | — | — | — | 0 of 52 | 41 of 52 |

X is about 50× better than C′ on the median, more than on the harbour (20×), and from
2.6× to 18,000× better view by view. All 52 edge candidates were true discontinuities
(no steep slopes), from 0.048 to 1.03 eye heights. 15 of the 16 views had edges, against
10 on the harbour.

## V5: range matters on this scene

The valley's content spans five to seven octaves per view, from rocks at the viewer's
feet to mountains a kilometre out. Here the flattened nesting beat one sweep in all 16
views; DEP-S had 8 of 16 on the harbour. The median error went A 0.034, F 0.011. It is
the first real-content support for the octave scaffold's range against one sweep, and
the answer to DEP-S's open question.

## Why V1 and V2 failed (after-run check)

The 11 edges X didn't keep within 1%:
- **Size:** they are all small, 0.048–0.22 eye heights.
- **Miss:** each was missed by 1–7% of its size (5 × 10⁻⁴ … 5.9 × 10⁻³ absolute).
- **Leaves:** in every case the pieces either side were starved of leaves. A region
  holding three or four edges was split into four pieces, so a 64-leaf node gave each
  piece 16 leaves. A base octave's 8 gave each piece 2.
- **Spacing:** only one of the 11 had another edge within 1/16 octave. The edges are
  spread out, not crowded.

DEP-X's leaf rule for pieces divides a sweep evenly, n / 2^⌈log₂ p⌉, whatever each
piece holds. The harbour had fewer edges per region, and the valley's trees and cottages
put more into each. The seams that remain on V1's failing views (up to 0.013) come from
the same starved pieces.

So the split itself works: every edge of any size is held as an edge, which C′ never
does. What fails is giving the pieces their leaves.

## What it shows

1. **Walls at edges generalise.** On a second scene, built for this test, X beat C′ in
   every view with edges, by more than on the harbour, and beat every fixed scheme in
   all 16.
2. **The octave scaffold's range is real** (V5, 16 of 16), where content spans many
   octaves.
3. **Pieces need leaves by need:** a piece should be a candidate for the rule as any
   region is, so leaves follow content within a split region too.

## Next, as a new plan

**Pieces as candidates.** After a split, each piece is a region of its own. The rule may
enter a 64-leaf node on any piece, as on any octave or ρ-octave. The predictions to test
are V1 and V2 again, on this scene.
