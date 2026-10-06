# DEP-C: leaves by content, inside the octave scaffold

*Plan written 6 October 2026, after DEP-S's run and before any code for this one, and
committed on its own. One counted run. Kills recorded, not patched.*

## Why

DEP-S found that on a real scene two things decide the error:
- **the edges:** 88–99% of the error sits within two leaves of a jump in the reading;
- **where the content is:** the harbour's content lies in five to nine octaves around
  the corner, while the flattened nesting (F) gives all 16 octaves 64 leaves each.

One sweep (A) concentrates its leaves near the corner by geometry, and that happens to
suit this scene. Neither A nor F looks at the content. This plan keeps the octave
scaffold and lets the content decide where the leaves go.

## The holder C

- **The budget is the leaves kept: 1,024,** as for A, B and F. Reading the scene (casting
  a ray) is not counted. In the studio and in TVF, observation is cheap and storage is
  the budget. This is a choice, and it's stated here so it can be disputed.
- **Base:** every one of the 16 octaves gets a flattened sweep of **8 leaves** (128 in all).
- **Nodes:** the other 896 leaves are 14 **nodes** of 64 flattened leaves. Each holds the
  residual of everything before it, over a region:
  - an **octave** [k]: the whole octave, again;
  - a **ρ-octave** [k, j]: the part of octave k whose place, read as a sweep ρ by the
    flattened map, lies in (2^(j−1), 2^j], for j from −6 to 7 (as DEP-B's grandchildren);
  - a ρ-octave of a ρ-octave [k, j₁, j₂], when [k, j₁] has been entered (three levels at
    most).

  A node presents its sweep inside its region and nothing outside it.
- **The rule:** enter, one at a time, the candidate whose region holds the largest
  **sum of squared residual** over a scoring grid. The grid is 4,096 points, 256 an octave,
  even in log a, offset by half a step from the measurement points
  (2^(k−1+i/256) against 2^(k−1+(i+½)/256)), so the rule never sees the points it is
  judged on. The sum is absolute: no per-stretch normalising (DEP-A).
- **A known risk:** a node is zero outside its region, so the presented reading can step
  at a node's walls by whatever residual is left there. Overlap and blending (DEP-J's
  question) are not used. The run measures C as it falls.

## The run

DEP-S's 16 views of the harbour village, unchanged: the same viewer, heights, directions,
reader and measures. A, B and F are recomputed (they come out as DEP-S's) and C is added.

## Checks of the code (not predictions)

1. **Base alone:** on the self-similar reading (m = 4, φ = 0), 16 octaves of 8 flattened
   leaves give DEP-F's after-run check figure for 8 leaves, 1.212, within 1%.
2. **The node maps:** for nodes [3], [3, 1], [3, 1, −2] and [−4, −2, 2], every leaf site lies
   in its node's region, and maps back to its leaf's angle to 10⁻⁹.
3. **A node holds what it is given:** a reading equal to cos(5u) in node [3, 1]'s own
   angle, held by that node alone, is reproduced inside the region to 10⁻¹⁰.
4. **The holders are DEP-S's:** A, B and F's view errors on the first view (1.7 m, 0°)
   equal DEP-S's (6.8 × 10⁻⁶, 4.0 × 10⁻⁵, 2.0 × 10⁻⁵) as printed.

If a check fails, no verdict stands.

## Predictions (written before the code)

- **C1 (content beats geometry and evenness):** C's view error is below F's in at least
  12 of the 16 views.
- **C2 (C is the best of the four):** C's view error is below the lowest of A, B and F in
  at least 10 of the 16 views.
- **C3 (the leaves go to the edges):** in every view with a jump, at least one entered node
  of depth two or three (a ρ-octave) has a jump inside its region.
- **C4 (the edges improve):** in at least 8 of the 10 views with a jump, C's squared error
  within 8 measurement points of a jump is at most half of F's.

## Kills

- **KC1:** C below F in fewer than 12 views.
- **KC2:** C below the best of A, B, F in fewer than 10 views.
- **KC3:** a view with a jump where no entered ρ-octave node holds one.
- **KC4:** fewer than 8 jump views with C's near-jump squared error at most half of F's.

## Reported, not predicted

- Each view's entered nodes, in order.
- The steps at node walls: the largest |P(w⁻) − P(w⁺)| across each entered node's two
  walls, against the reading's own jump there.
- C with a base of 4 and 16 leaves an octave (instead of 8), the same rule and budget.

## Files

- `bench/depth/content.mjs`, `node bench/depth/content.mjs` (as DEP-S, with `LIBS_DIR`
  when the CDNs are blocked); output `content-run.txt`.
- `bench/depth/C-RESULTS.md`, after the run.
