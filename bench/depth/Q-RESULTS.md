# DEP-Q results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/smooth.mjs`; output in `smooth-run.txt`. Plan: `Q-PLAN.md`,
committed before the code; code committed before its run. Nothing below changes a
prediction or a threshold.

All checks of the code passed:
1. ψ(t) + ψ(1 − t) = 1 exactly at 1,001 points;
2. both holders hold a constant to 1.1 × 10⁻¹⁵;
3. the base reaches every site of the end-octave nodes;
4. N's nodes are C′'s;
5. A, B and F matched DEP-S.

## Verdicts

| | prediction | result |
|---|---|---|
| **Q1** | ψ cuts the error at least 3× on each of the five smooth walking views | **KILLED**: 4 of 5 views fail. N_ψ/N_s = 0.64, 0.99, 0.23, 1.04, 0.83 |
| **Q2** | N_ψ within 2× of C′ in at least 12 views | **KILLED**: above 2× in 9 |
| **Q3** | N_ψ continuous at every wall | **holds**: 0 of 2,509 flagged |
| **Q4** | N_ψ below the best of A, B and F in all 16 | **KILLED**: not in 4 |

Medians: C′ 2.9 × 10⁻⁴, N_s 1.3 × 10⁻³, N_ψ 1.3 × 10⁻³. The median N_ψ/N_s is 1.000.

## The hypothesis is dead

DEP-N's hypothesis was that the smoothstep, being only C¹, hands each level curvature
jumps that cosine nodes can't absorb. Replacing it with a blend smooth to every order
changed nothing that matters: N_ψ equals N_s within 1% in 12 of 16 views. Only one
smooth view (135°) improved more than 3×. So the blend's smoothness is not what costs.
The one wall in DEP-N with an ε² jump was real, but it was not the cause of the error.

## What the run showed instead (worked out after it; a hypothesis, not a result)

To fix DEP-N's end-octave fault, the base's octaves were laid over spans widened by 2δ
instead of δ. Nothing else in N_s changed from DEP-N's N, yet N_s came out worse in
several views:

| view | DEP-N's N (base reach δ) | N_s here (base reach 2δ) |
|---|---|---|
| walking 45° | 1.3 × 10⁻⁵ | 1.2 × 10⁻⁴ |
| walking 135° | 1.0 × 10⁻⁵ | 1.4 × 10⁻⁵ |
| flying 0° | 4.0 × 10⁻³ | 7.2 × 10⁻³ |

(The walking 270° view, NaN in DEP-N, is 9.5 × 10⁻⁹ here.)

**What that points to:** widening imports the neighbour's content into each fit. A sweep
laid over a span reaching past its region's walls is fit to the reading there too,
including whatever is just across the wall: a jump, a steeper stretch, or the
coarser level's larger residual. That then rings inside its own region. C′ never
widens: each node is fit on its own region only, which is why it reaches 10⁻⁷ on the
smooth views. Every seamless holder so far (K, N, N_s, N_ψ) widens. Widening further
made it worse, and the blend's shape made no difference. So the cost is the overlap
used for fitting, not the blending.

## Where it stands

| holder | median | seams |
|---|---|---|
| A, B, F | 2.5–3.1 × 10⁻³ | none |
| **C′** | **2.9 × 10⁻⁴** | up to 0.16 |
| K, N, N_s, N_ψ | 1.1–1.3 × 10⁻³ | none |

The seamless holders are 4× behind C′ on the median and far behind on smooth views. They
still beat every fixed scheme on most views, but not all (N_ψ fails Q4 in four).

## Next, as a new plan

**Fit on the exact region, blend only in presenting.** Each node is fit exactly as C′'s:
its sweep over its own region, so no neighbour's content enters the fit. For continuity,
each node is also *presented* a little past its walls, using its own sweep's natural
continuation (the cosine series' even extension past the sweep's end, which the
flattened map makes smooth there). It is blended there with what lies across the wall.
Prediction to set: within 2× of C′ in most views, and continuous.
