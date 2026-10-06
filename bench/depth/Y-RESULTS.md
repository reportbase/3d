# DEP-Y results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/pieces.mjs`; output in `pieces-run.txt`. Plan: `Y-PLAN.md`,
committed before the code; code committed before its run. Nothing below changes a
prediction or a threshold.

All checks of the code passed:
1. the edge finder and a split sweep;
2. with pieces off, Y is X (harbour flying 0°: 2.4 × 10⁻⁵ both);
3. a piece node holds its piece to 6.1 × 10⁻¹⁶;
4. A, B and F matched DEP-S.

## Verdicts

| | prediction | result |
|---|---|---|
| **Y1** | valley: Y's largest seam at most 1/10 of C′'s in 80% of the views with edges | **KILLED**: 8 of 15 (X had 8) |
| **Y2** | valley: at least 90% of edges kept | **KILLED**: 40 of 52 (X kept 41) |
| **Y3** | Y at most X in 80% of the views with edges | **KILLED**: 11 of 25 |
| **Y4** | harbour: X1 and X2's thresholds still met | **KILLED**: seams 7 of 10 (X had 8), edges 36 of 37 |
| **Y5** | Y below the best of A, B and F in all 32 views | **holds** |

Medians: harbour C′ 2.9 × 10⁻⁴, X 1.5 × 10⁻⁵, Y 1.4 × 10⁻⁵; valley C′ 4.2 × 10⁻³, X 8.1 × 10⁻⁵,
Y 8.1 × 10⁻⁵. Y is X within about 10% in most views. It is better in a few (valley 225°:
0.37–0.41×; harbour 315°: 0.52×) and slightly worse in more.

## What it shows

**The rule did use pieces:** between 1 and 6 of each view's 14 nodes, wherever there were
edges. That changed almost nothing about the edges or seams. DEP-V's diagnosis, that
the pieces either side of a missed edge were starved of leaves, was true but not
sufficient. Given leaves to spend on pieces, the rule spent them elsewhere.

**Why** (worked out after the run): the rule enters whatever holds the most squared
residual. The edges X misses are small (0.05–0.22 eye heights) and missed by 1–7% of
their size, 5 × 10⁻⁴ to 6 × 10⁻³ absolute. That is tiny squared error next to the rest of
a view, so they never win a node. The criterion "kept within 1% of the edge's own size"
measures something the rule doesn't aim at. The view error, which it does aim at, was
already 20–50× better than C′'s, and stays there.

## Where the bench stands

Across the two scenes and 32 views, X (walls at edges, leaves by content inside the
octave scaffold) is the best holder found:
- **Accuracy:** 20× better than C′ on the harbour and 50× on the valley. Below every
  fixed scheme in all 32 views.
- **Edges:** every one is kept as an edge; 78 of 89 within 1% of its size, the rest within
  1–7%.
- **Seams:** where the reading is continuous, the median is 1–2 × 10⁻³ eye heights, against
  C′'s 0.02–0.04.
- **Range:** nesting beat one sweep on all 16 valley views, where content spans many
  octaves.

The remaining shortfall, small edges held to within a few percent, could be targeted by
weighting each edge's value in the score. That would be a choice about what matters
more: the whole view's error or each edge exactly. It is not a defect in the method.

## Recommended next

Stop refining on the bench and take X into the studio, starting with how a part's detail
is held (its cascade is already a sweep by octaves). Bench refinements can follow if the
studio shows a need.
