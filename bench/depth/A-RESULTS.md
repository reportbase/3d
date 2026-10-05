# DEP-A results: the counted run (5 October 2026)

`node bench/depth/avg.mjs`, 17 s; output in `avg-run.txt`. Plan: `A-PLAN.md`, committed
before the code, with its amendments (made before any predicted measure was printed)
at the end. Two earlier runs stopped in the checks of the code and are void
(`avg-run-void.txt`, `avg-run-void2.txt`). One check made after the run is in
`avg-checks.mjs` / `avg-checks.txt`, labelled as such: it is not a verdict.

All checks of the code passed (histopolant within 1.8 × 10⁻¹², under the amended bar of
10⁻¹¹; the rock average exact).

## Verdicts

| | prediction | result |
|---|---|---|
| **A1** (the absolute rule, point top) | burst octaves entered first, none deeper | **T-F: holds.** **T-a: KA1 fires**: octave −5 first, then octave 4 (0.385) ahead of octave 3 (0.366). No stray depth on either top |
| **A2** (the spill) | averaging cuts the top's spill at least 3× | **KA2 fires on both tops**: 1.12× (T-a) and 0.96× (T-F). The triangle (reported) did no better: 0.95×, 0.98× |
| **A3** (both changes) | P2 holds and the final error 3× below DEP-P's | **KA3 fires on both**: 1.31× (T-a) and 1.44× (T-F) better, not 3×. P2 held on T-F, not on T-a |
| **A4** (nothing lost) | the averaged T-F top holds the smooth reading below 10⁻¹² | **holds**: 6.5 × 10⁻¹³ |

## What the averaging did: nothing, and why

The spill wasn't aliasing, so averaging couldn't cure it. Averaging damps what folds
back from above the top's last mode. Then the histopolant divides each mode by σ_m to
reproduce the modes below n exactly, and that division undoes the smoothing. What is left
is a truncated series fitted to content the top can't hold, and the error of that is
spread over the whole sweep whether the leaves are points or averages. The plan was
right that point samples were the wrong thing to suspect only in the sense that it chose
the wrong remedy: the band-limiting in TVF's forward map works because the cascade keeps
it (`makeDetail` never divides it out). A top that is both exact below n and quiet above
it is not available from averaging alone.

The T-a top fails A1 for a reason the run shows directly: its own error far out is
large on the smooth swell (0.05–0.29 absolute in octaves 3–8, burst or not), so under
the absolute rule octave 4 outranks octave 3. That is DEP-B's P1 result again (the raw-
address top can't hold slow content at its ends), not the rule.

## What did work: the absolute rule (reported, not predicted for the rocks)

| rocks, mean absolute error | P·rel (DEP-P's rule) | P·abs | A·abs |
|---|---|---|---|
| T-a top | 0.011 | **1.6 × 10⁻³** | 2.8 × 10⁻³ |
| T-F top | 0.027 | 3.1 × 10⁻³ | 2.6 × 10⁻³ |

Ranking by absolute residual cut the rocks' error 7–9×, and on the burst reading it
removed the stray entries at the range's end (DEP-P's KP2).

## After the run: plain flattened nesting beats all of it (check, not a verdict)

The same 1,024 leaves as 16 octaves × 64 flattened leaves, with no top and no rule (DEP-F's
holder), on DEP-A's readings:

| reading | best top + rule here | F alone |
|---|---|---|
| burst (mean relative) | 3.0 × 10⁻³ | **7.8 × 10⁻¹⁵** |
| rocks (mean absolute) | 1.6 × 10⁻³ | **5.4 × 10⁻⁴** |
| smooth (worst relative) | 3.5 × 10⁻¹⁴ (top alone) | **9.0 × 10⁻¹⁵** |

A top of 256 leaves spends a quarter of the budget, holds nothing well that the octaves
can't, and leaves too few children to reach every octave: 12 children for 16 octaves.
Every run-2 configuration was budget-bound. F alone holds the burst everywhere (8
cycles an octave fit in 64 flattened leaves). The rocks' remaining error is in octaves
3–7, where a rock 0.05 wide is narrower than the leaves' spacing: a resolution limit,
not a presentation one.

## What it means

1. **The busiest-stretch rule with a top (§6's run 2) is the wrong shape** for this
   budget. Depth as recursion works best here as plain flattened nesting: every octave
   held, the same leaves in each.
2. **Adaptivity belongs below the octaves, not above them.** Where an octave can't
   resolve its content (the far rocks), the recursion's next level, a ρ-octave of that
   octave's own sweep, is where extra leaves should go, ranked by absolute residual.
3. **Averaging as a forward map helps only if the presentation keeps the smoothing.**
   That's how the studio's cascade uses it; it isn't a fix for a single exact top.

## Next, as new plans

1. **F, then grandchildren by absolute residual:** 16 octaves of 64 flattened leaves,
   plus a budget of extra 64-leaf grandchildren entered where the absolute residual is
   largest. Prediction to test: they go to the far rocks, and the rocks' error falls with
   each one, while the burst and smooth readings take none.
2. **Content not chosen by us** (depth read from studio scenes), held by that.
