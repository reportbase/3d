# DEP-G: the ratio between rungs, with the base share held

*Plan written 6 October 2026, after DEP-D's runs and before any code for this one. Committed on its
own. One counted run. Kills recorded, not patched.*

## Why

DEP-D killed D1: on the harbour and the valley, ratio 2 held the scenes best in only 7 of 32 views,
√2 in 13 and φ in 9; on the harbour √2's median view error was about 6× below 2's. Its after-run
note named a confound. In DEP-D every octave had a base of 8 leaves, so a smaller ratio, with more
octaves, put more of the 1,024 leaves in the base (√2: 256 base leaves and 12 nodes; 2: 128 and 14).
Part of √2's lead may be the finer base, not the ratio. This run holds the base share as nearly fixed
as the leaf lattice allows (a sweep's leaves are a power of two) and gives every ratio the same 14
nodes.

## The holders

X_r exactly as DEP-D (`ratio.mjs`), with the base per octave set by the ratio:

| r | octaves | base per octave | base | nodes | leaves allotted |
|---|---|---|---|---|---|
| √2 | 32 | 4 | 128 | 14 | 1,024 |
| φ | 24 | 4 | 96 | 14 | 992 |
| 2 | 16 | 8 | 128 | 14 | 1,024 |
| 3 | 12 | 8 | 96 | 14 | 992 |
| 4 | 8 | 16 | 128 | 14 | 1,024 |

At r = 2 this is DEP-D's X_2 (and DEP-Y's X). φ and 3 run 32 leaves short, as 3 did in DEP-D. As in X,
a sweep split at edges into more pieces than it has leaves for gives each piece 2, so leaves used can
exceed leaves allotted by a few; they are printed.

## The run

DEP-D's 32 views (harbour 16, valley 16), the same reader and measures.

## Checks of the code (not predictions)

1. **X_2 is DEP-D's:** on all 32 views, X at r = 2 equals DEP-D's X_2 as printed (`ratio-run.txt`).
2. **DEP-D's other ratios come back** when their base is set back to 8: on the harbour's first view,
   √2, φ, 3 and 4 at a base of 8 equal DEP-D's printed view errors.
3. **The table:** octaves, base and nodes at each r are as above.

If a check fails, no verdict stands.

## Predictions (written before the code)

- **G1 (the 2 is still not singled out):** X_2 has the lowest view error of the five in fewer than 16
  of the 32 views.
- **G2 (√2's lead on the harbour is the ratio's):** on the harbour, √2's median view error is at most
  half of 2's.

## Kills

- **KG1:** X_2 lowest in 16 views or more. *DEP-D's D1 kill would then be the base's doing.*
- **KG2:** √2's harbour median above half of 2's. *The lead would then be mostly the finer base.*

**Claude's own expectation, recorded so that it can't move afterwards.** G1 holds. G2 is killed:
much of √2's 6× was the extra 128 base leaves.

## What happens next, decided now

- **G1 and G2 hold:** the finding stands as DEP-D read it: smaller ratios hold these scenes better,
  and not because of the base. Reported back to the papers with DEP-D.
- **G1 holds, G2 killed:** 2 is not singled out, but no ratio is clearly better once the base is
  held; DEP-D's √2 lead is recorded as mostly the base's.
- **G1 killed:** DEP-D's D1 kill is recorded as the base's doing, and R183's 2 stands untested by
  holding rather than against it.

## Reported, not predicted

- Every view's error at each ratio, against DEP-D's for the same ratio (the effect of the base alone).
- The best ratio per view; the medians per scene; leaves used.

## Files

- `bench/depth/share.mjs`, `node bench/depth/share.mjs` (as DEP-D, with `LIBS_DIR` when the CDNs are
  blocked); output `share-run.txt`.
- `bench/depth/G-RESULTS.md`, after the run.
