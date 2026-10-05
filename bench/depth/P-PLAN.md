# DEP-P: §6's P1–P5 again, with the flattened map

*Plan written 5 October 2026, after DEP-F's run and before any code for this one, and
committed on its own. One run. Kills recorded, not patched.*

## Why

DEP-F found the flattened place map, f = ρ²/(1 + ρ²), holding every reading tried to
about 10⁻¹⁴ where *Depth as Recursion* §3's map, ρ = 2f / 1/(2(1 − f)), held 1%. Two of
§6's predictions died in DEP-B (P1, P2), both at the ends of a sweep. Adopting the
flattened map in §3 is the owner's ruling; this run is evidence for it. It repeats
DEP-B's P1–P5 with the flattened map, everything else as DEP-B unless said here.

## What was known before this plan

From DEP-B and DEP-F, at the same settings:
- **P4 for F**: on the self-similar reading (m = 4, φ = 0) F's error is 1.1 × 10⁻¹⁴, flat
  across the 16 octaves (DEP-F's table). Rerun and reported; not a new prediction.
- **K3 for F**: DEP-E's measure gave a ratio of 10.000 at 13 walls and roundoff at the
  other two (DEP-F check 2). F is continuous. Rerun with DEP-E's measure (not DEP-B's,
  which no sloped line can pass) and reported; not a new prediction.
- **P3 and run 1's P5 hold by construction** for any map that's the same in every
  octave: the doubling shifts leaf values by one octave whatever the map is, and an
  octave's amplification is a 64-leaf sweep's read at some of its points, which can't
  exceed the sweep's. Rerun as checks of the code.

The new predictions are P1, P2 and run 2's P5.

## The top sweep, two ways

DEP-B's run 2 has a top sweep of 256 leaves over the whole range, read in the raw
address: u = 2 arctan a. P1 died there (33% error in the outermost octaves), and the
flattened map does not touch it. *Depth as Recursion* §3 takes the octave at the top as
the exponent, so the same rule one level up reads the range as one octave of octaves:

- **Top T-F (predicted):** the top's place is the exponent's place in the range,
  f = (log₂ a + 8)/16, read as a sweep by the flattened map, ρ = √(f/(1 − f)). Its 256
  leaves are the Tangent Bridge's, at addresses a = 2^(16 f(ρ) − 8).
- **Top T-a (reported, not predicted):** DEP-B's top unchanged, with F's children. This
  shows what changing the children alone does.

**Children** (an octave of the address) and **grandchildren** (a ρ-octave of a child's
sweep, nested again) use the flattened map wherever DEP-B used §3's.

**A stopping rule, new and stated before the run.** DEP-B's rule spends the whole
budget. With F, residuals may reach roundoff, and entering on roundoff is noise. So the
rule stops when the largest candidate's relative residual is below 10⁻⁹, leaving the
rest of the budget unspent. This applies to both tops.

## A caution, written down before the run

On the smooth reading, sin(2π log₂ a / 16), T-F is close to a test by construction: the
reading is a sine of the very place T-F reads, so it becomes −sin(2πf) with
f = sin²(u/2), analytic and even. A good P1 under T-F says the recursion holds a reading
that is smooth in the exponent. It doesn't say T-F holds things of fixed size. The rocks
reading (bumps 0.05 wide at 2⁻⁶ … 2⁶) is the check that isn't by construction, and it is
reported below without a prediction. A test on content not chosen by us is the next plan.

## Predictions (written before the code)

- **P1 (T-F).** On the smooth reading alone, the top sweep's relative error is below 1%
  in every octave, and the rule enters no child whose residual is above 1%.
- **P2 (T-F).** On the burst reading (smooth swell plus 8 cycles per octave in octaves 3
  and −5 only), the first two entries are octaves 3 and −5, in either order, and no
  octave without the burst reaches a deeper level than either burst octave.
- **P5, run 2 (T-F).** Along every path entered, the worst-case amplification of
  top + child (+ grandchild) is at most 1.02× the sum of the levels' own.
- **P3, P5 run 1:** hold (checks of the code, as above).

## Kills

- **KP1:** T-F's top error at or above 1% in some octave on the smooth reading, or a child
  entered with residual above 1%.
- **KP2:** a first or second entry that isn't a burst octave, or an octave without the
  burst entered deeper than a burst octave.
- **KP5:** a path above 1.02× the sum.
- **KP3 / KP5-run-1:** a doubling difference above 10⁻¹² on one side of the corner, or an
  octave's amplification above 1.01× the 64-leaf sweep's. Either means the code is wrong,
  and nothing else in the run is trusted.

## Reported, not predicted

- T-a with F's children: P1's top error (DEP-B's, unchanged) and its entries; P2's
  entries.
- The rocks reading under run 2's rule, for DEP-B (§3 throughout, DEP-B's top), T-a + F
  and T-F: entries, final absolute error per octave, leaves used.
- Final error per octave on the burst reading, for all three.

## Files

- `bench/depth/p.mjs`, `node bench/depth/p.mjs`; output `p-run.txt`.
- `bench/depth/P-RESULTS.md`, after the run.
