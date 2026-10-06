# DEP-D: depth as the recursion, and whose 2 it is

*Plan written 6 October 2026, after reading* Serial, Parallel and Nowhere *(SPN) and* v and h
*(wander/papers, as of wander's main on 6 October), and before any code for this one. Committed on
its own. One counted run of each part. Kills recorded, not patched.*

## Why

SPN's central hypothesis (R183) is that h is the reader's own invariant and the reader's octave
is 2h: the front half one h (v as a share of h, home to the corner), the back half one h (h as a
share of v, the corner toward the far wall). Every octave holds the same sweep again, with its own
corner at its middle (R180, item 381 of *v and h*): depth is the count of nested sweeps.

SPN says what is missing (its "Consequence for testing"): every run so far laid its octaves as
doublings from the start, so agreement is not evidence. A test needs content that was not built
to fit. And "nesting itself cannot single out 2: an address scheme built on tripling round-trips
as exactly and nests as well. The 2 comes from the corner sitting at the middle of the octave
under the swap."

This bench already holds depth that way. DEP-C's holder, and X after it (DEP-X, DEP-Y), is an
octave scaffold with nested sweeps entered by content: an octave, a ρ-octave inside it (the
octave's place read as a sweep again, by doublings of ρ), and a ρ-octave inside that. Its octaves
and its ρ-octaves are doublings, chosen in DEP-B and never varied. Its content, the harbour and the
valley, was built by the studio and Claude, not on any ratio.

This plan asks two questions of it:

1. **Whose 2 is it?** Hold the same scenes with the ratio between rungs set to √2, φ, 2, 3 and 4,
   everything else X's, at equal leaves. If 2 holds the scenes best, that supports R183 on content
   not built to fit. If another ratio does, the 2 is not singled out by holding.
2. **Does depth earn its leaves?** X with its nesting against X held to whole octaves (breadth
   only), at equal leaves. *v and h* item 384 (DVZ) found depth 10–13× better than zoom at level 7
   on content built for it. This asks the same on scenes.

And one in the studio's own terms:

3. **A part's height, held as deep as it has detail** (SHP, item 388). DEP-H found one flattened
   sweep (the studio's `'flat'` kernel) holds smooth content to roundoff and loses on patterns.
   SHP says a shape needs depth where it has detail. Part 2 nests sweeps in a part's height axis
   and compares them with the even axis, the one sweep, and plain halving.

## Terms

As SPN and *v and h*: **home**, the **corner** (v = h), the **far wall**, **breadth** (octaves side
by side, adding), **depth** (sweeps nested inside sweeps, R180), the **ratio between rungs** (R176:
"grain" is retired). In this bench, a sweep's **place** f runs from 0 at one wall to 1 at the other,
its corner at f = ½, read as ρ = 2f before the corner and 1/(2(1 − f)) past it (DEP-F's map).

## Part 1: the ratio between rungs, on two scenes

### The holder X_r

X (DEP-X, as run in DEP-Y: C′ with every sweep split at the scene's edges) with the ratio between
rungs r in place of 2, in exactly three places:

- **The octaves:** octave k is r^(k−1) < a ≤ r^k, anchored at the corner a = 1 as now. Every octave
  that meets the range [2⁻⁸, 2⁸] is held whole, including the parts outside it.
- **The place within an octave:** as now, in proportion in v/h below the corner and h/v above,
  between the octave's walls r^(k−1) and r^k.
- **The ρ-octaves:** the place read as ρ (DEP-F's map, unchanged: it depends only on the corner
  being at the middle), and ρ-octave j is r^(j−1) < ρ ≤ r^j, for j from the largest with
  r^(j−1) ≤ 2⁻⁷ to the smallest with r^j ≥ 2⁷ (X's j from −6 to 7 at r = 2). Three levels at
  most, the third only inside an entered second (as X).

Everything else is X's: the edge finder and its edges; splitting at edges and dividing leaves
among pieces; the base of 8 flattened leaves in every octave; nodes of 64; the rule by squared
residual on DEP-K's scoring grid; the generated leaf lattice.

**Equal leaves.** The budget is 1,024. The base is 8 × (the number of octaves), the nodes as many
64s as fit in the rest; leaves left over are unused and reported.

| r | octaves meeting [2⁻⁸, 2⁸] | base | nodes | leaves used |
|---|---|---|---|---|
| √2 | 32 | 256 | 12 | 1,024 |
| φ | 24 | 192 | 13 | 1,024 |
| 2 | 16 | 128 | 14 | 1,024 |
| 3 | 12 | 96 | 14 | 992 |
| 4 | 8 | 64 | 15 | 1,024 |

At r = 3 the octaves reach past the range (3⁻⁶ to 3⁶ covers 0.0014 to 729), and 32 leaves go
unused. That leans against 3; it is stated here so it can't be explained away afterwards.

### The holder X₁ (breadth only)

X_2 with the candidates limited to whole octaves [k], each entered at most once. Its nodes add a
second sweep of 64 over a whole octave: more breadth, no depth. Same base, same budget (128 + 14 ×
64), same rule.

### The run

Both scenes, 32 views, as DEP-Y: the harbour (DEP-S's viewer and 16 views) and the valley (DEP-V's
16). A, B, F and C′ are not rerun; X_2 is DEP-Y's X.

## Part 2: a part's height axis

DEP-H's content and harness: the seven patterns read with `patternAt` (a wall 20 m round and 3 m
tall, feature size 0.3 m, the depth d along h at 32 columns round) and DEP-H's five smooth
profiles. Error: RMS over 1,024 heights even in h. **Leaves: 48**, as DEP-H.

- **even:** DEP-H's dct, 48 leaves.
- **one sweep:** DEP-H's flat, 48 leaves (the studio's `'flat'` kernel).
- **D (depth):** a flattened sweep of 16 over the whole axis, then 4 nodes of 8. Each node is a
  flattened sweep over its region, fit to the residual of everything before it, zero outside its
  region. The candidates are the **children** of the whole axis and of every entered node. The
  children of a region [a, b] (its corner at the middle, half-width L = (b − a)/2) are its
  doublings, crowding toward both walls:

      front: [a + L/2, a + L], [a + L/4, a + L/2], [a + L/8, a + L/4], …
      back:  [b − L, b − L/2], [b − L/2, b − L/4], [b − L/4, b − L/8], …

  down to a width of 1/1024. In the whole axis's terms, [¼, ½] and [½, ¾] have their corners at ⅜
  and ⅝, which is item 381's ¾h and 4⁄3h. The rule: enter the candidate holding the largest sum of
  squared residual on a scoring grid of 1,024 heights at (i + ¼)/1024, which the rule never sees
  measured.
- **Z (halving, the control):** the same base, nodes, fitting and rule. The children of a region are
  its two halves, [a, a + 2L] split at the middle. Z is depth without the sweep's crowding: any gain
  of D over Z belongs to the sweep's structure, not to entering by content.

D at the ratios √2, φ, 3 and 4 (front walls at a + L·r^(−j), back at b − L·r^(−j)) is reported, not
predicted.

## Checks of the code (not predictions)

1. **X_2 is X:** on all 32 views, X_2's view error equals DEP-Y's X as printed (`pieces-run.txt`).
2. **The octave maps at every r:** place and address round-trip to 10⁻¹² in every octave and every
   ρ-octave used; every scoring point lies in exactly one base octave; every node's leaf sites lie in
   its region.
3. **Leaves:** each holder's leaves used are as in the table above, and never above 1,024.
4. **Part 2's holders:** D and Z with no nodes equal one flattened sweep of 16, to 10⁻¹²; a node
   holds a reading equal to cos(5u) in its own variable to 10⁻¹⁰ inside its region.
5. **Part 2's harness is DEP-H's:** even and one sweep at 48 reproduce DEP-H's figures at N_h = 48
   as printed (`height-run.txt`).

If a check fails, no verdict of its part stands.

## Predictions (written before the code)

**Part 1.**
- **D1 (the 2 is the reader's, R183):** X_2 has the lowest view error of the five ratios in at
  least 16 of the 32 views.
- **D2 (the ratio matters here):** in at least 16 of the 32 views, the worst of the five ratios'
  view errors is at least 1.5 × the best.
- **D3 (depth earns its leaves, R180):** X_2 is below X₁ in at least 24 of the 32 views.

**Part 2.**
- **D4 (depth beats one sweep where there is detail, SHP):** D is below one sweep on at least 5 of
  the 7 patterns.
- **D5 (the sweep's nesting beats plain halving):** D is below Z on at least 5 of the 7 patterns.
- **D6 (no cost on smooth content):** on each smooth profile, D's error is at most 10 × one sweep's
  + 10⁻¹².

**Claude's own expectation, recorded so that it can't move afterwards.** D1 killed: the best ratio
varies by view, and if anything a smaller ratio wins where edges are crowded. D2 holds. D3 holds.
D4 holds. D5 killed: the patterns are even up the wall, so leaves crowded toward the walls are no
better spent than leaves halved evenly. D6 holds. These expectations are not the predictions; the
verdicts are on D1–D6 as written.

## Kills

- **KD1:** X_2 lowest in fewer than 16 views.
- **KD2:** fewer than 16 views with a spread of 1.5 or more. *If KD2 fires, D1's verdict is still
  recorded, but it says little: the scenes do not tell the ratios apart.*
- **KD3:** X_2 below X₁ in fewer than 24 views.
- **KD4:** D below one sweep on fewer than 5 patterns.
- **KD5:** D below Z on fewer than 5 patterns.
- **KD6:** a smooth profile where D's error is above 10 × one sweep's + 10⁻¹².

## What happens next, decided now

- **If D1 holds** (and D2 with it), R183's 2 has its first support from content not built to fit.
  This goes back to the papers as a measured item, with its kill condition.
- **If D1 is killed with D2 holding,** the ratio that holds scenes best is not 2. That does not
  touch the geometry (SPN's layers 1 and 2), and is recorded against the consequence "nested
  octaves are doublings" in its layer 3.
- **If D4 and D5 hold,** nested sweeps go to the studio as a fourth height kernel, under its own
  plan. **If D4 holds and D5 is killed,** depth helps a part but the sweep's crowding does not; the
  studio would take plain halving, and that is recorded.
- Nothing in the studio changes on this run alone.

## Reported, not predicted

- Every view's error for X at each ratio and for X₁; the best ratio per view; which nodes each
  entered, and how many were ρ-octaves of the second and third level.
- Part 2: each content's error for every holder, D at the other ratios, and which children D entered.

## Files

- `bench/depth/ratio.mjs`: Part 1, `node bench/depth/ratio.mjs` (as DEP-Y, with `LIBS_DIR` when the
  CDNs are blocked); output `ratio-run.txt`.
- `bench/depth/nest.mjs`: Part 2, `node bench/depth/nest.mjs`; output `nest-run.txt`.
- `bench/depth/D-RESULTS.md`, after the runs.
