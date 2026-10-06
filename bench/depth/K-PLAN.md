# DEP-K: blended walls for leaves by content

*Plan written 6 October 2026, after DEP-C's run and before any code for this one, and
committed on its own. One counted run. Kills recorded, not patched.*

## Why

DEP-C's holder C put leaves where the content is and beat every fixed scheme in all 16
harbour views. But each node presents nothing outside its region, so the presented
reading steps at node walls where the scene is continuous: by up to 0.16 eye heights on
the flying views. In a picture those are seams. DEP-E found the remedy at octave walls:
widen each sweep past its walls and blend (J2, continuous at every wall). This plan does
the same for C's base and nodes, and fixes DEP-C's scoring grid.

## The holder K

K is C with three changes. Everything else is C's: base 8, 14 nodes of 64, the budget of
1,024 kept leaves, and the rule by squared residual.

- **Base, blended (J2):** each octave's 8-leaf flattened sweep is laid over the octave
  widened by δ = 1/16 octave at each wall. Within δ of an inner wall the two octaves'
  sweeps are blended with a smoothstep s across the band: (1 − s)·below + s·above. That
  is DEP-J's J2, at DEP-W's best width.
- **Nodes, tapered:** a node's last level, the variable it splits, an address or a ρ, is
  widened by δ = 1/16 of an octave of that variable at each of its walls, and its sites
  are laid over the widened span. It presents w · (its sweep), where w is 1 inside its
  region away from the walls. Across a band of 2δ centred on each wall w falls to 0 by
  smoothstep. The levels above the last are not widened: a node stays inside its parent.
- **The scoring grid, fixed:** points at 2^(k−1+(i+¼)/256), a quarter step in, so none
  lies on a wall. The measurement grid stays at a half step in.

**Also run, for comparison: C′,** which is DEP-C's C with the fixed grid and no blending.

## Checks of the code (not predictions)

1. No scoring point lies outside its own octave (`octOf` of each is its k).
2. Widened node maps: for nodes [3], [3, 1] and [3, 1, −2], every site lies in the
   widened region and maps back to its leaf's angle to 10⁻⁹. w is 1 at the region's
   middle, 0 beyond the bands, and between 0 and 1 everywhere.
3. The blended base holds a constant: a reading of 1 everywhere, held by the base alone,
   is presented as 1 to 10⁻¹² at all 4,096 measurement points.
4. A, B and F on the first view are DEP-S's as printed.

If a check fails, no verdict stands.

## Predictions (written before the code)

- **K1 (no seams):** in all 16 views, at every base wall, every band edge and every entered
  node's walls and band edges, K is continuous by DEP-E's measure: either J(10⁻⁶)/J(10⁻⁷)
  is between 5 and 20, or both are below 10⁻¹². K is a sum of continuous pieces, so this
  is close to a check of the code, and it is listed as a prediction only because it's
  the property the plan exists for.
- **K2 (blending is cheap):** K's view error is at most 2× C′'s in at least 14 of the 16
  views.
- **K3 (still the best):** K's view error is below the lowest of A, B and F in at least
  14 of the 16 views.

## Kills

- **KK1:** a wall in some view where K jumps: the ratio is outside 5–20 while J(10⁻⁷) is
  above 10⁻¹².
- **KK2:** K above 2× C′ in three views or more.
- **KK3:** K below the best of A, B and F in fewer than 14 views.

## Reported, not predicted

- C′ against DEP-C's C (the grid fix alone), view by view.
- The largest presented step at node walls for C′ (as DEP-C reported) and for K.
- K's nodes in order.

## Files

- `bench/depth/blend.mjs`, `node bench/depth/blend.mjs` (as DEP-S, with `LIBS_DIR` when the
  CDNs are blocked); output `blend-run.txt`.
- `bench/depth/K-RESULTS.md`, after the run.
