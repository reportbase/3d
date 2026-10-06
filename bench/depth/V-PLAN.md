# DEP-V: a second scene, the valley

*Plan written 6 October 2026, after DEP-X's run and before any code for this one or any
look at this scene's readings, and committed on its own. One counted run. Kills
recorded, not patched.*

## Why

Every real-scene result so far (DEP-S, C, K, N, Q, R, X) comes from one village seen
from one spot. DEP-X's X (C′ with walls at the scene's edges) beat every other holder,
but X1 held exactly at its threshold. Before anything is built on X, it should hold on a
scene it wasn't developed on. This scene is also chosen to spread its content over more
octaves than the harbour, which reached about 5–9. That puts DEP-S's open question back
in play: does nesting's range beat one sweep on real content?

## The scene

`bench/depth/valley.json`, written for this plan. It was built once, to check that every
rule places copies (1 rail, 13 posts, 80 rocks, 40 cottages, 900 pines; ground 0.07 m at
the viewer, the main peak 260 m). No depth was read.
- **Near:** a fence (posts and a rail) 4 m south of the viewer, and 80 rocks within 20 m.
- **Middle:** 40 cottages scattered 60–260 m north.
- **Far:** 600 pines 300–700 m north, 300 more 100–450 m south, and three mountains
  1,000–1,200 m away, 200–260 m high, with noise over the ground.

## The run

As DEP-S/X, unchanged: the viewer at (0, 0) on the ground, eye heights 1.7 m and 30 m,
eight directions, so 16 views; the same reader, measures, edge finder and holders:
- A: one sweep;
- B: §3's nesting;
- F: the flattened nesting;
- C′: leaves by content;
- X: C′ with walls at edges.

## Checks of the code (not predictions)

1. **The holders are the bench's:** on the harbour's first view, A, B and F match DEP-S
   (6.8 × 10⁻⁶, 4.0 × 10⁻⁵, 2.0 × 10⁻⁵).
2. **The edge finder and split sweeps:** DEP-X's checks 1 and 2, repeated.
3. **The viewer stands on the ground:** in each view, the reading at the smallest address
   is within 0.01 of 0.

If a check fails, no verdict stands.

## Predictions (written before the code and before any reading of this scene)

As DEP-X, on the views where edges are found:
- **V1 (seams):** X's largest seam at most 1/10 of C′'s in at least 80% of them.
- **V2 (edges kept):** at least 90% of all edges kept within 1% by X.
- **V3 (accuracy):** X below C′ in at least 80% of them.

On all 16:
- **V4 (still the best):** X below the lowest of A, B and F in every view.
- **V5 (range, DEP-S's open question):** with content over more octaves, F is below A in
  at least 10 of the 16 views. DEP-S found 8 on the harbour.

## Kills

- **KV1–KV3:** as KX1–KX3, on this scene.
- **KV4:** a view where X is not below the best of A, B and F.
- **KV5:** F below A in fewer than 10 views.

## Reported, not predicted

- Every view's errors for A, B, F, C′ and X; the octaves with content; edges and steep
  slopes; seams and edges kept, for C′ and X.

## Files

- `bench/depth/valley.mjs`, `node bench/depth/valley.mjs` (as DEP-S, with `LIBS_DIR` when the
  CDNs are blocked); output `valley-run.txt`.
- `bench/depth/V-RESULTS.md`, after the run.
