# DEP-D results: the counted runs (6 October 2026)

`LIBS_DIR=… node bench/depth/nest.mjs` (Part 2) then `node bench/depth/ratio.mjs` (Part 1); outputs
`nest-run.txt` and `ratio-run.txt`. Plan: `D-PLAN.md`, committed before the code (with one amendment
before any code, to the statement of DEP-F's map); code committed before its runs. Nothing below
changes a prediction or a threshold.

All checks of the code passed:
1. X at r = 2 is DEP-Y's X on all 32 views, as printed;
2. the octave maps round-trip to 6 × 10⁻¹⁶ at every r, and every node site lies in its region;
3. octaves and nodes at every r are the plan's table (r = 3 allots 992 leaves, the rest 1,024);
4. D and Z with no nodes are one flattened sweep of 16 exactly, and a node holds cos(5u) to 5 × 10⁻¹⁵;
5. even and one sweep at 48 are DEP-H's on all twelve contents.

One more was caught by check 3 before any scene was read (when r^k lands exactly on 2⁻⁸, the code
counted an octave touching the range only at its end); fixed before the code was committed.

## Verdicts

| | prediction | result |
|---|---|---|
| **D1** | X_2 the lowest of the five ratios in at least 16 of 32 views (R183) | **KILLED**: 7 of 32 |
| **D2** | the ratio matters: worst ≥ 1.5 × best in at least 16 views | **holds**: 29 of 32 |
| **D3** | depth earns its leaves: X_2 below X₁ (breadth only) in at least 24 views | **holds**: 32 of 32 |
| **D4** | a part's height: D below one sweep on at least 5 of 7 patterns | **KILLED**: 0 of 7 |
| **D5** | the sweep's nesting beats plain halving: D below Z on at least 5 of 7 | **holds**: 7 of 7 |
| **D6** | no cost on smooth: D at most 10 × one sweep + 10⁻¹² on every profile | **KILLED**: tanh(4(h − 0.3)), 2.2 × 10⁻⁶ against 2.6 × 10⁻¹⁵ |

Claude's recorded expectations were right on D1, D2 and D3 and wrong on D4, D5 and D6.

## Part 1: the ratio between rungs, on the harbour and the valley

**Best ratio per view:** √2 in 13, φ in 9, 2 in 7, 3 in 1, 4 in 2.

| median view error | √2 | φ | 2 | 3 | 4 | X₁ (2, breadth only) |
|---|---|---|---|---|---|---|
| harbour | **2.6 × 10⁻⁶** | 5.5 × 10⁻⁶ | 1.5 × 10⁻⁵ | 2.2 × 10⁻⁵ | 3.4 × 10⁻⁵ | 1.0 × 10⁻⁴ |
| valley | 1.1 × 10⁻⁴ | **7.7 × 10⁻⁵** | 8.1 × 10⁻⁵ | 2.4 × 10⁻⁴ | 4.7 × 10⁻⁴ | 9.2 × 10⁻⁴ |

- **The ratio matters, and 2 is not where holding is best.** The spread across ratios is large (up to
  38× in one view, at least 1.5× in 29 of 32), and the smaller ratios win most views. On the harbour,
  √2 is about 6× better than 2 at the median; on the valley, φ and 2 are close and √2 a little worse.
  3 and 4 are worse on both.
- **Depth earns its leaves, everywhere.** With the same 1,024 leaves, X's nested sweeps beat a second
  sweep over whole octaves in all 32 views: at the median, 7× on the harbour (X_2/X₁ = 0.14) and 10×
  on the valley (0.105). This is the scenes' counterpart of DVZ (*v and h* item 384).

## Part 2: a part's height axis (48 leaves)

| | even | one sweep | D | Z |
|---|---|---|---|---|
| stones | **0.162** | 0.199 | 0.215 | 0.324 |
| bricks | 0.233 | 0.220 | 0.228 | 0.303 |
| shingles | 0.133 | **0.131** | 0.201 | 0.257 |
| planks | 0.225 | 0.196 | 0.225 | 0.274 |
| boards | **6.6 × 10⁻⁶** | 1.5 × 10⁻⁵ | 5.1 × 10⁻⁵ | 1.2 × 10⁻⁴ |
| bark | **2.0 × 10⁻³** | 2.3 × 10⁻³ | 0.013 | 0.020 |
| rough | **0.030** | 0.037 | 0.051 | 0.079 |

(Bricks' best was D at φ, 0.198; planks' D at √2, 0.184. Both reported, not predicted.)

- **Depth does not pay on a part's patterns.** D is worse than one sweep on all seven, by 1.04× to
  5.8×. Patterns are even up a wall: their detail is everywhere, so 48 leaves held as one sweep (or
  evenly) beat 16 held as one sweep plus 32 spent in regions. SHP's "a shape is held as deep as it
  has detail" read the other way: where the detail is everywhere, there is nowhere deeper to go.
- **But the sweep's crowding beats plain halving, on every pattern** (D/Z from 0.44 to 0.82). When
  leaves are spent in regions, regions crowding toward the walls, each a sweep with its corner at its
  middle, do better than halves. D entered the root's first children, (¼, ½] and (½, ¾], in nearly
  every column, then their own children or the next doublings out.
- **D6's kill is the same thing on smooth content.** On tanh(4(h − 0.3)), one sweep of 48 is at
  roundoff; D's base of 16 leaves 10⁻⁶ that its four local nodes don't remove everywhere. On the other
  four profiles D was at roundoff too.

## What it means

- **For R183 (SPN's central hypothesis, layer 3):** on content not built on any ratio, held the way
  this bench holds depth, the 2 is not singled out. Smaller ratios hold the scenes better, √2 best on
  the harbour, φ on the valley. As the plan decided, this does not touch the geometry (layers 1 and 2:
  the corner, the inversion, the octaves as a structure); it is recorded against the consequence
  "nested octaves are doublings". It says nothing about whether a *reader's* h settles at 2 when taken
  from its parent's record (SPN's own proposed run); that is a different test.
- **For R180 (depth is the recursion):** strong support on scenes. Nested sweeps beat breadth alone in
  32 of 32 views at equal leaves.
- **For the studio:** nothing changes. Nested sweeps lose to the existing kernels on a part's height
  at 48 leaves. Where depth pays is where detail is local (a scene's edges and its near ground), which
  is what X already holds.

## After the run (not predictions)

- **The ratio and the base are tied together here.** A smaller ratio means more octaves, so more of
  the budget in the base (√2: 256 base leaves and 12 nodes; 2: 128 and 14). Part of √2's win on the
  harbour may be the finer base rather than the ratio itself. A run holding the base share fixed
  across ratios would separate them; it is not run here.
- **3 was the worst-placed ratio** by its 32 unused leaves, and was also the worst on both scenes
  apart from 4. That cost is about 3%, too small to explain 3's place.
