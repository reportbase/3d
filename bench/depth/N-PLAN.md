# DEP-N: siblings share the band

*Plan written 6 October 2026, after DEP-K's run and before any code for this one, and
committed on its own. One counted run. Kills recorded, not patched.*

## Why

DEP-K's K removed C′'s seams (largest step 0.16 → 1.2 × 10⁻⁶) and still beat every fixed
scheme, but it cost up to 106× against C′. Worked out after that run, there are two
causes:
1. **Neighbouring nodes were fit one after the other.** Across their shared band each is
   presented at a partial weight, and the later one was fit to what the earlier one left
   at that weight. Together they don't add back to the residual.
2. **A node with no neighbour across a wall tapered inside its own region.** Over that
   band it gave up its own accuracy, and the error fell back to the coarser level.

## The holder N

**The node set is C′'s:** DEP-K's C′ (C with the fixed grid), the same 14 nodes of 64,
chosen by the same rule on the same unblended presentation. N differs from C′ only in
how the chosen leaves are put together, so the comparison is leaf for leaf.

- **The base:** blended across octave walls as K's (J2, δ = 1/16).
- **Fitting, by level:** every node of depth 1 is fit to the same residual, reading − base.
  Every node of depth 2 is fit to reading − (base + the depth-1 nodes, weighted), and depth
  3 likewise. Nodes of one level that overlap are siblings (same parent, adjacent last
  index), and they are fit independently to the same residual.
- **The weights:** each node's last level is widened by 2δ at each wall.
  - **A wall it shares with an entered sibling:** the two blend across a band of 2δ centred
    on the wall, with weights 1 − s and s (smoothstep). They add to one.
  - **A wall with no entered sibling:** the node keeps full weight up to the wall, and
    tapers to zero *outward*, across the next 2δ beyond it. Its own region is never
    weakened; the band beyond is where nothing finer was entered anyway.

For a depth-2 or depth-3 node, an outward band stays inside the parent, because its
ρ-octaves run −6 … 7, well inside (0, ∞). For a depth-1 node it reaches into the next
octave, or past the range's end, where the base reads its end octave as in K.

## Continuity, measured better

DEP-E's ratio test misread curved and flat points in DEP-K (an after-run check showed
all 10 flagged walls continuous). This plan measures at smaller gaps, where any smooth
function is linear: continuous if J(10⁻⁹)/J(10⁻¹⁰) lies in 5–20, or J(10⁻¹⁰) ≤ 10⁻¹³.

## Checks of the code (not predictions)

1. **The weights:** for siblings [3, 0] and [3, 1], the two weights sum to 1 across their
   shared band, to 10⁻¹⁵, and each lies in [0, 1]. A lone wall's node has weight 1 at the
   wall and 0 at 2δ beyond it.
2. **A constant is held:** a reading of 1, held by N with nodes [3], [4], [3, 1], [3, 2] and
   [3, 1, 0], is presented as 1 to 10⁻¹² at all 4,096 measurement points.
3. **The node set is C′'s:** on the first view, the chains N assembles are those C′ entered,
   in the same order.
4. **A, B and F on the first view** are DEP-S's, as printed.

If a check fails, no verdict stands.

## Predictions (written before the code)

- **N1 (no seams):** in all 16 views, N is continuous, by the measure above, at every base
  wall, every node wall and every band edge.
- **N2 (cheap now):** N's view error is at most 2× C′'s in at least 14 of the 16 views.
- **N3 (better than K):** N's view error is below K's in at least 14 of the 16 views.
- **N4 (still the best fixed or blended):** N is below the lowest of A, B and F in all 16
  views.

## Kills

- **KN1:** a wall where J(10⁻⁹)/J(10⁻¹⁰) lies outside 5–20 while J(10⁻¹⁰) > 10⁻¹³.
- **KN2:** N above 2× C′ in three views or more.
- **KN3:** N below K in fewer than 14 views.
- **KN4:** a view where N is not below the best of A, B and F.

## Reported, not predicted

- Each view's errors for A, B, F, C′, K and N; N/C′ and N/K.
- The largest step at a gap of 10⁻⁹ for C′, K and N.
- N with every node's walls treated as lone (outward taper everywhere, no sibling
  blending), to separate the two changes.

## Files

- `bench/depth/siblings.mjs`, `node bench/depth/siblings.mjs` (as DEP-S, with `LIBS_DIR` when
  the CDNs are blocked); output `siblings-run.txt`.
- `bench/depth/N-RESULTS.md`, after the run.
