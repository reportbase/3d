# DEP-N results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/siblings.mjs`, 194 s; output in `siblings-run.txt`. Plan:
`N-PLAN.md`, committed before the code; code committed before its run. Nothing below
changes a prediction or a threshold. Checks made after the run are in
`siblings-checks.mjs` / `siblings-checks.txt`, labelled as such.

All checks of the code passed:
1. sibling weights sum to 1 across a band, and lone walls run 1 → 0;
2. a constant is held to 1.1 × 10⁻¹⁵;
3. N's nodes are C′'s, in order;
4. A, B and F matched DEP-S.

## Verdicts

| | prediction | result |
|---|---|---|
| **N1** | continuous everywhere | **KN1 fires**: 9 of 2,509 walls. Eight are a code fault's NaN, and one is continuous (both below) |
| **N2** | N at most 2× C′ in at least 14 views | **KILLED**: above 2× in 8 |
| **N3** | N below K in at least 14 views | **KILLED**: 5 of 16 |
| **N4** | N below the best of A, B and F in all 16 | **KILLED**: 14 of 16. One is the NaN view; the other is real (walking 315°: N 3.9 × 10⁻⁴ against B's 3.7 × 10⁻⁴) |

Medians: C′ 2.9 × 10⁻⁴, K 1.1 × 10⁻³, N 1.3 × 10⁻³. Sharing the band did not bring back
C′'s accuracy. N is about K.

## A code fault: the NaN (after-run check)

In the walking 270° view, C′ entered node [−7], a whole end octave. With no sibling below
it, N let it taper outward 2δ past the range's end, 2⁻⁸. The blended base's end octave
only reaches δ past it. There the base's place went below 0, and √ of a negative gave
NaN in all 64 of the node's coefficients. It is the same class of fault as DEP-K's
crash. It affects that view only. KN2, KN3 and KN4 fire whatever N would have scored
there: one more view can't bring N3 from 5 to 14, nor undo the other N4 failure.

## The one other flagged wall is continuous (after-run check)

At flying 0°, the wall at 7.992: the jump J(ε) is 10⁻⁵, 10⁻⁷, 10⁻⁹, 10⁻¹¹, 10⁻¹³ for
ε = 10⁻⁶ … 10⁻¹⁰, then roundoff. It falls a hundredfold per decade, which is ε². A smooth
function's two-sided difference has only odd powers of ε. An ε² term means the slope is
continuous and zero there, and the *curvature jumps*. That is a smoothstep band's
edge: 3t² − 2t³ has a continuous slope at its ends but not a continuous second
derivative. N is continuous there. But the wall shows exactly where its pieces are less
smooth than the reading.

## What it shows

**1. The cost isn't how the band is shared.** Treating every wall as lone, with an
outward taper everywhere, was reported for comparison and was worse than sharing, by
1.1–8× in 15 views. Sharing helps. But both stay far from C′ on the walking views, where
C′ reached 10⁻⁷:

| views | N / C′ |
|---|---|
| walking, smooth | 10–64× (N 2.4 × 10⁻⁶ … 1.3 × 10⁻⁵) |
| walking, with a jump | 1.8–3.0× |
| flying | 0.46–10.6×, median 1.7× |

Where the seams mattered, on the flying views (C′'s steps 0.024–0.16), N is within 2× of
C′ in six of the eight and seamless. The big ratios are on views where C′ was nearly
exact and its seams small (10⁻⁵ to 10⁻⁴).

**2. A hypothesis for the cost** (worked out after the run): the blends are only C¹. The
smoothstep's second derivative jumps at both ends of every band. Each level's weighted
nodes then hand the next level a residual with curvature jumps in it. The nodes are
cosine series, which hold a smooth residual to roundoff but a curvature jump only
algebraically. C′ has no blends, so its levels never meet that. That fits the walking
views, where the reading is smooth to 10⁻⁷ and C′'s nodes reach it, and N's don't.

## Next, as a new plan

**C∞ blends.** Replace the smoothstep with a weight smooth to every order. One choice is
the standard ψ(t) = e^(−1/t) / (e^(−1/t) + e^(−1/(1−t))); its pair still sums to one. Fix
the end-octave fault with it (the base reaches as far as any node). Prediction to set: N∞
within 2× of C′ in most views, and continuous to every order.
