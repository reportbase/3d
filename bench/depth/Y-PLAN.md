# DEP-Y: pieces as candidates

*Plan written 6 October 2026, after DEP-V's run and before any code for this one, and
committed on its own. One counted run. Kills recorded, not patched.*

## Why

On the valley, X (C′ with walls at the scene's edges) beat C′ ~50× and every fixed scheme
in all 16 views, but missed its edge predictions: V1 (seams) 8 of 15, V2 (edges kept)
41 of 52. DEP-V's after-run check found the cause in every missed edge. When a region
holds several edges, X divides its sweep evenly among the pieces: a 64-leaf node into 4
of 16, a base octave into 4 of 2. The pieces either side of each missed edge were
starved. The split works; the leaves don't follow the content inside a split region.

## The holder Y

Y is X with one change to the rule.
- **Pieces are candidates:** a piece of a split region is a region of its own: the part
  of that region's own variable between two neighbouring cuts (or a cut and a wall).
  The rule may enter a 64-leaf node on any piece, as on any octave or ρ-octave.
- **A piece node:** one flattened sweep over the piece, with the region's corner
  convention, fit like any node to the residual of everything before it. A piece has no
  edges inside it, so its node is never split, and it has no children.
- **Its score:** as any candidate's, the squared residual over the scoring points inside
  the piece.

Everything else is X's:
- the edge finder;
- base 8, then 14 nodes of 64;
- every sweep split at the edges in its region, with leaves divided as X divides them;
- the rule by squared residual on the fixed scoring grid.

## The run

Both scenes, 32 views: the harbour (DEP-S's viewer and views) and the valley (DEP-V's).
A, B, F, C′, X and Y each.

## Checks of the code (not predictions)

1. **DEP-X's checks 1 and 2:** the edge finder, and a split sweep holding a step.
2. **With pieces switched off, Y is X:** on the harbour's flying 0° view (three edges),
   the same nodes in the same order and the same view error.
3. **A piece node holds its piece:** a reading sin(3 log₂ a) plus steps of 0.5, 0.3 and 0.2 at
   a = 3.1, 3.4 and 3.8, held by the base and one piece node on (3.1, 3.4], is reproduced
   inside that piece to 10⁻¹⁰.
4. **A, B and F on the harbour's first view** match DEP-S.

If a check fails, no verdict stands.

## Predictions (written before the code)

- **Y1 (valley seams):** Y's largest seam at most 1/10 of C′'s in at least 80% of the
  valley's views with edges (DEP-V's V1, which X missed at 8 of 15).
- **Y2 (valley edges):** at least 90% of the valley's edges kept within 1% by Y
  (DEP-V's V2, which X missed at 41 of 52).
- **Y3 (no loss):** Y's view error at most X's in at least 80% of the views with edges,
  on the two scenes together.
- **Y4 (the harbour still holds):** on the harbour, Y meets DEP-X's X1 and X2: largest
  seam at most 1/10 of C′'s in at least 80% of the views with edges, and at least 90% of
  edges kept.
- **Y5 (still the best):** Y below the lowest of A, B and F in all 32 views.

## Kills

- **KY1, KY2:** Y1, Y2 missed on the valley.
- **KY3:** Y above X in more than 20% of the views with edges.
- **KY4:** X1 or X2's threshold missed by Y on the harbour.
- **KY5:** a view where Y is not below the best of A, B and F.

## Reported, not predicted

- Each view's errors for A, B, F, C′, X and Y; seams and edges kept for C′, X and Y;
  how many of Y's nodes went to pieces.

## Files

- `bench/depth/pieces.mjs`, `node bench/depth/pieces.mjs` (as DEP-S, with `LIBS_DIR` when the
  CDNs are blocked); output `pieces-run.txt`.
- `bench/depth/Y-RESULTS.md`, after the run.
