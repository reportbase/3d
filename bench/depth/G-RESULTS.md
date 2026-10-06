# DEP-G results: the counted run (6 October 2026)

`LIBS_DIR=… node bench/depth/share.mjs`; output `share-run.txt`. Plan: `G-PLAN.md`, committed before
the code; code committed before its run. Nothing below changes a prediction or a threshold.

All checks of the code passed:
1. X at r = 2 is DEP-D's X_2 on all 32 views, as printed;
2. with their base set back to 8, √2, φ, 3 and 4 reproduce DEP-D's view errors on the harbour's
   first view;
3. the table: every ratio has 14 nodes and a base of 128 (√2, 2, 4) or 96 (φ, 3).

## Verdicts

| | prediction | result |
|---|---|---|
| **G1** | X_2 the lowest of the five in fewer than 16 of 32 views | **holds**: 13 of 32 |
| **G2** | on the harbour, √2's median at most half of 2's | **holds**: 0.21 (3.0 × 10⁻⁶ against 1.5 × 10⁻⁵) |

Claude's recorded expectation was right on G1 and wrong on G2: the base was not where √2's lead came
from.

## The numbers

**Best ratio per view** (DEP-G, base held; DEP-D, base 8 in brackets):

| | √2 | φ | 2 | 3 | 4 |
|---|---|---|---|---|---|
| harbour | 7 (6) | 3 (6) | 4 (3) | 1 (0) | 1 (1) |
| valley | 3 (7) | 2 (3) | 9 (4) | 1 (1) | 1 (1) |
| both | 10 (13) | 5 (9) | 13 (7) | 2 (1) | 2 (2) |

**Median view error** (DEP-D's in brackets):

| | √2 | φ | 2 | 3 | 4 |
|---|---|---|---|---|---|
| harbour | **3.0 × 10⁻⁶** (2.6) | 5.6 × 10⁻⁶ (5.5) | 1.5 × 10⁻⁵ (1.5) | 2.2 × 10⁻⁵ (2.2) | 3.5 × 10⁻⁵ (3.4) |
| valley | 1.3 × 10⁻⁴ (1.2) | 1.0 × 10⁻⁴ (0.77) | **8.1 × 10⁻⁵** (8.2) | 2.4 × 10⁻⁴ (2.4) | 4.7 × 10⁻⁴ (4.7) |

## What it shows

- **On the harbour the lead is the ratio's.** Halving √2's base (256 to 128 leaves) and giving it two
  more nodes changed its median by about 15%. It is still 5× below 2.
- **On the valley, 2 is best once the base is held.** It is the best ratio in 9 of the valley's 16
  views, and its median is the lowest; √2 and φ lost most of what they had there. In DEP-D, part of
  their valley showing was the base.
- **So no ratio is singled out across both scenes.** The best ratio depends on the scene: √2 on the
  harbour (a village on a slope, its content in many octaves near the reader), 2 on the valley (a long
  valley floor seen from its middle). 3 and 4 are worst on both.
- **For R183** (as decided in the plan): DEP-D's kill of D1 stands, and is not the base's doing. On
  content not built to fit, holding does not single out 2; it is best on one scene and beaten 5× on
  the other. What decides the best ratio here looks like a property of the scene, which is a question
  for another plan, not a finding of this one.

## After the run (not predictions)

- φ lost most from the held base: 4 base leaves an octave against 8, and 32 leaves unused. On the
  valley its median rose by a third.
