# DEP-F results: the single run (5 October 2026)

`node bench/depth/flat.mjs`, output in `flat-run.txt`. Plan: `FLAT-PLAN.md` (b0ab173),
committed before the code; code committed before its run. Nothing below changes a
prediction or a threshold. Two checks made after the run are in `flat-checks.mjs` /
`flat-checks.txt` and are labelled as such: they are not verdicts.

## Verdicts

| | prediction | result |
|---|---|---|
| **F1** | W's first valley within an eighth-step of cos(2πmδ) = 0, at φ = 0 | **holds**: m = 3 at log₂ δ = −3.625 (predicted −3.585, δ = 1/12); m = 5 at −4.25 (predicted −4.32, δ = 1/20) |
| **F2** | F at most 1/5 of B on all 13 readings | **holds**: the worst F/B is 4.9 × 10⁻¹¹ |
| **F3** | F's phase spread below 1.5×, J's above 3× | **KILLED**: F's spread is 1.06–1.15× as predicted, but J's is only 1.5–2.3× |
| **F4** | F's end bins below 3× its middle median | **holds**: all eight bins 4.7–9.7 × 10⁻¹⁵, no end effect |
| **F5** | K3 does not fire for F (DEP-B's jump measure) | **KF5 fires**: a jump of 1.1 × 10⁻⁹ at 2⁰ against 7.4 × 10⁻¹⁵ inside. This is DEP-B's measure fault again (below), but the verdict stands as written |

Not predicted: F is below J on 13 of 13 readings, by 10–11 orders of magnitude. Rocks:
B 0.216, J 0.176, F 0.096.

## The numbers

Mean relative error over the 16 octaves, at the same 1,024 leaves:

| reading | B (§3's nesting) | J (overlap 1/16, blended) | F (flattened ends) |
|---|---|---|---|
| m = 3, four phases | 1.5–7.5 × 10⁻³ | 2.4–5.0 × 10⁻⁴ | 8.4–9.6 × 10⁻¹⁵ |
| m = 4, four phases | 2.3 × 10⁻⁴ – 1.0 × 10⁻² | 3.0–7.0 × 10⁻⁴ | 1.1 × 10⁻¹⁴ |
| m = 5, four phases | 4.8 × 10⁻³ – 1.3 × 10⁻² | 5.1–7.8 × 10⁻⁴ | 1.1–1.2 × 10⁻¹⁴ |
| smooth | 1.8 × 10⁻⁴ | 1.3 × 10⁻⁵ | 6.8 × 10⁻¹⁵ |

F's error is the arithmetic's own: double precision, no longer the presentation.

## About F5: the measure, not the line

DEP-B's jump measure takes the difference across a gap of 2 × 10⁻⁹ of the wall's address.
Any continuous line with slope s has a "jump" of s × 2 × 10⁻⁹ there; the smooth reading's
slope at 2⁰ is about 0.57 per unit of address, so 1.1 × 10⁻⁹ is that slope and nothing
more. DEP-J's KJ3 failed the same way, and DEP-E replaced the measure. The plan should
have used DEP-E's measure and did not, so KF5 is recorded as fired, a fault of the plan.

**After the run (check 2, not a verdict):** DEP-E's measure on F, the smooth reading, all
15 walls. At 13 walls J(10⁻⁶)/J(10⁻⁷) = 10.000 exactly (the jump is the slope times the
gap). At 2⁻⁴ and 2⁴ both are about 2 × 10⁻¹⁵, roundoff, because the smooth reading
sin(2π log₂ a / 16) has zero slope at log₂ a = ±4. By DEP-E's rule (ratio 5–20, or both
below 10⁻¹³) F is continuous at every wall, with no blend.

## Is F's precision real? (check 1, not a verdict)

An error of 10⁻¹⁴ could mean the bench was reading its own answer back. On m = 4 at 8,
16, 32 and 64 leaves an octave, F's error is 1.2, 0.035, 5.3 × 10⁻¹⁰, 1.1 × 10⁻¹⁴ and B's
1.1, 0.10, 0.031, 0.010. At 8 leaves F is no better than B, as it should be when the
reading has more cycles than the leaves can hold. Past that F falls geometrically
(spectral convergence) and B only as about 1/n (the kink). That is the expected
behaviour, not a leak.

**Why** (worked out after the run): in the sweep's angle u the flattened place is
f = sin²(u/2), which is even about both u = 0 and u = π. The address is a linear map of
f (below the corner) or of 1/a (above), both analytic, so any analytic reading becomes
an analytic, even function of u at both ends. Its even extension, which the cosine
presentation reads, has no kink anywhere, and a cosine series of a function like that
converges geometrically. §3's map ρ = 2f has a corner in u at both walls, which no
reading can remove.

## What it shows

1. **The flattened map removes the ends' weakness for every reading at once.** F's error
   doesn't depend on phase (F3's first half) or on where in the sweep it is (F4), and it
   is continuous at the walls with no overlap and no blend (check 2).
2. **DEP-W's hypothesis survives its frequency test (F1)**: overlap's best width is where
   the reading is flat at the sweep's ends. But **its strong form is killed (F3)**: phase
   moves J's error by about 2×, not more than 3×, so the claim that overlap's gain is
   "partly luck of phase" is true but smaller than DEP-W suggested.
3. **Overlap is now dominated.** J needs extra leaves past every wall and a blend; F needs
   neither and is 10¹⁰ times more exact at the same budget.

## What it costs, and the ruling

The flattened map keeps every property the rulings name: home and horizon on the walls,
the corner at the middle, the swap fair (ρ ↦ 1/ρ gives f ↦ 1 − f, R162), and the Tangent
Bridge's lattice and leaves unchanged. It is algebraic (ρ = √(f/(1 − f))). What it changes is
§3's construction of the place, ρ = 2f / 1/(2(1 − f)), and `nest.py` with it. Adopting it
is Tom's ruling. This bench says it is the better construction on every reading tried.

## Next, as new plans

1. **The studio's rungs.** The height kernel is a DCT, the same open-axis form, and a
   part's top and bottom rings are its ends. A plan: the same flattening of the height
   axis, h = sin²(u/2), measured on the library's shapes against the present cascade at
   the same leaves.
2. **§6 P1–P5 again**, with F in place of §3's nesting, since P1 and P2 died at the ends
   (DEP-B).
